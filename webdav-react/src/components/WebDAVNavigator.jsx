import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FileList from './FileList';
import Dialog from './Dialog';
import FileUpload from './FileUpload';
import FilePreview from './FilePreview';
import createWebDAVAPI from '../utils/webdavAPI';
import { Button } from './ui/button';
import BreadcrumbNav from './BreadcrumbNav';

// 导入新创建的组件
import CreateDirectoryDialog from './dialogs/CreateDirectoryDialog';
import CreateFileDialog from './dialogs/CreateFileDialog';
import RenameDialog from './dialogs/RenameDialog';
import DeleteDialog from './dialogs/DeleteDialog';
import LoginDialog from './dialogs/LoginDialog';

// 导入自定义Hook
import useWebDAVOperations from '../hooks/useWebDAVOperations';
import useDirectoryNavigation from '../hooks/useDirectoryNavigation';
import useDialogManager from '../hooks/useDialogManager';

// 注意：wopiDiscoveryUrl 暂时未使用，但保留以便将来扩展
const WebDAVNavigator = ({ webdavUrl }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 从location.pathname中提取实际路径
  const pathFromUrl = location.pathname.replace(/^\/browse\/?/, '');

  // 调试日志
  console.log(`WebDAVNavigator 初始化: location.pathname = ${location.pathname}, pathFromUrl = ${pathFromUrl}`);

  // 认证状态 - 从环境变量获取
  const [auth] = useState(() => {
    return {
      username: import.meta.env.VITE_WEBDAV_USERNAME || '',
      password: import.meta.env.VITE_WEBDAV_PASSWORD || ''
    };
  });

  // WebDAV API实例
  const [webdavAPI, setWebdavAPI] = useState(null);

  const [currentPath, setCurrentPath] = useState('');
  // 使用 useRef 存储 currentPath，避免循环依赖
  const currentPathRef = useRef(currentPath);
  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem('sort_order') || 'name');
  // 使用 useRef 存储 sortOrder，避免循环依赖
  const sortOrderRef = useRef(sortOrder);
  useEffect(() => {
    sortOrderRef.current = sortOrder;
  }, [sortOrder]);

  const [selectedItems, setSelectedItems] = useState([]);

  // 使用对话框管理Hook
  const { dialog, closeDialog, openDialog } = useDialogManager();

  // 排序文件列表
  const sortItems = useCallback((items, order) => {
    // 分离目录和文件
    const dirs = items.filter(item => item.isDir);
    const files = items.filter(item => !item.isDir);

    // 根据排序方式排序
    if (order === 'name') {
      dirs.sort((a, b) => a.name.localeCompare(b.name));
      files.sort((a, b) => a.name.localeCompare(b.name));
      return [...dirs, ...files];
    } else if (order === 'date') {
      return [...dirs, ...files].sort((a, b) => {
        if (!a.modified || !b.modified) return 0;
        // 确保正确比较Date对象
        return new Date(b.modified).getTime() - new Date(a.modified).getTime();
      });
    } else if (order === 'size') {
      dirs.sort((a, b) => a.name.localeCompare(b.name));
      files.sort((a, b) => (b.size || 0) - (a.size || 0));
      return [...dirs, ...files];
    }

    return items;
  }, []);

  // 加载目录内容
  useEffect(() => {
    if (!webdavAPI) return;

    // 正确处理路径参数
    // 注意：path可能是"test2"这样的格式，需要正确处理
    const decodedPath = decodeURIComponent(pathFromUrl);

    // 确保路径以/开头并以/结尾
    let fullPath;
    if (!decodedPath) {
      fullPath = '/';
    } else {
      // 确保路径以/开头
      fullPath = decodedPath.startsWith('/') ? decodedPath : '/' + decodedPath;
      // 确保路径以/结尾
      fullPath = fullPath.endsWith('/') ? fullPath : fullPath + '/';
    }

    console.log(`路由变化，解析路径参数: "${pathFromUrl}" -> 完整路径: "${fullPath}", 当前路径: "${currentPath}"`);

    // 定义一个内部函数来加载目录内容，避免依赖于 loadDirectoryContent
    const loadContent = async () => {
      if (!webdavAPI) return;

      try {
        setLoading(true);
        setError(null);

        console.log(`开始加载目录内容: ${fullPath}`);

        // 确保路径末尾有斜杠
        const normalizedPath = fullPath.endsWith('/') ? fullPath : fullPath + '/';
        console.log(`规范化路径: ${normalizedPath}`);

        // 清空当前项目列表，避免显示旧数据
        setItems([]);

        const items = await webdavAPI.listDirectory(normalizedPath);
        console.log("目录内容详情:", items.map(item => ({
          name: item.name,
          uri: item.uri,
          isDir: item.isDir,
          path: item.path
        })));
        // 使用 ref 获取最新的 sortOrder 值
        const currentSortOrder = sortOrderRef.current;
        console.log(`获取到 ${items.length} 个项目，应用排序: ${currentSortOrder}`);

        if (items.length === 0) {
          console.log(`目录 ${normalizedPath} 为空`);
        }

        // 确保每个项目的modified属性是Date对象
        const processedItems = items.map(item => ({
          ...item,
          modified: item.modified ? new Date(item.modified) : null
        }));

        // 直接应用排序，不触发额外的状态更新
        const sortedItems = sortItems(processedItems, currentSortOrder);

        // 一次性设置所有状态，避免多次渲染
        setItems(sortedItems);
        setCurrentPath(normalizedPath);
        setLoading(false);

        console.log(`目录内容加载完成: ${normalizedPath}, 设置了 ${sortedItems.length} 个项目`);
      } catch (err) {
        console.error(`加载目录失败: ${fullPath}`, err);

        // 检查是否是认证错误
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setError('认证失败，请检查用户名和密码');
        }
        // 检查是否是 CORS 错误
        else if (err.message && (
          err.message.includes('Network Error') ||
          err.message.includes('CORS') ||
          err.message.includes('Cross-Origin')
        )) {
          setError(`跨域请求错误 (CORS)：无法连接到 WebDAV 服务器。请检查：
          1. 服务器是否允许跨域请求
          2. 是否正确配置了代理服务器
          3. WebDAV URL 是否正确（当前使用：${webdavUrl}）`);
        }
        // 检查是否是404错误
        else if (err.response && err.response.status === 404) {
          setError(`目录不存在: ${fullPath}`);
        }
        else {
          setError(`加载目录失败: ${err.message}`);
        }

        setLoading(false);
      }
    };

    loadContent();

    // 只依赖于webdavAPI和path
  }, [webdavAPI, pathFromUrl, sortItems, webdavUrl]);

  // 使用导航Hook
  const { navigateToDirectory, getParentDirectory } = useDirectoryNavigation(
    webdavUrl,
    navigate,
    currentPath
  );

  // 定义一个函数来加载当前目录内容
  const refreshCurrentDirectory = useCallback(() => {
    // 触发 useEffect 重新运行，通过修改 path 参数
    const currentPathWithoutSlash = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;
    const pathSegment = currentPathWithoutSlash.startsWith('/') ? currentPathWithoutSlash.substring(1) : currentPathWithoutSlash;
    navigate(`/browse/${pathSegment || ''}`);
  }, [currentPath, navigate]);

  // 使用WebDAV操作Hook
  const {
    createDirectory,
    createFile,
    deleteItem,
    renameItem,
    uploadFiles,
    downloadFile,
    getFileContent,
    saveFileContent
  } = useWebDAVOperations(webdavAPI, refreshCurrentDirectory, currentPathRef);

  // 初始化WebDAV API
  useEffect(() => {
    if (!webdavUrl) {
      setError('未设置WebDAV URL，请在环境变量中设置 VITE_WEBDAV_URL');
      setLoading(false);
      return;
    }

    // 检查是否有认证信息
    const hasAuth = auth.username && auth.password;
    if (!hasAuth) {
      setError('未设置WebDAV认证信息，请在环境变量中设置 VITE_WEBDAV_USERNAME 和 VITE_WEBDAV_PASSWORD');
      setLoading(false);
      return;
    }

    const api = createWebDAVAPI(webdavUrl, auth);
    setWebdavAPI(api);
  }, [webdavUrl, auth]);

  // 监听排序方式变化
  useEffect(() => {
    // 保存排序设置到localStorage
    localStorage.setItem('sort_order', sortOrder);

    // 只有当有项目时才进行排序，避免无限循环
    if (items.length > 0) {
      console.log(`排序方式变化: ${sortOrder}`);
      // 使用函数式更新，避免依赖 items
      setItems(prevItems => sortItems(prevItems, sortOrder));
    }
    // 移除 items 依赖，避免无限循环
  }, [sortOrder, sortItems]);

  // 处理排序变更
  const handleSortChange = (order) => {
    console.log(`切换排序方式: ${order}`);
    setSortOrder(order);
    // localStorage保存已经移到useEffect中处理
  };

  // 处理创建目录
  const handleCreateDirectory = async (name) => {
    setLoading(true);
    setError(null);
    const success = await createDirectory(name,
      () => setLoading(true),
      (err) => setError(err)
    );
    setLoading(false);
    if (success) {
      closeDialog();
    }
  };

  // 处理创建文件
  const handleCreateFile = async (name, content = '') => {
    setLoading(true);
    setError(null);
    const success = await createFile(name, content,
      () => setLoading(true),
      (err) => setError(err)
    );
    setLoading(false);
    if (success) {
      closeDialog();
    }
  };

  // 处理删除
  const handleDelete = async (item) => {
    setLoading(true);
    setError(null);
    const success = await deleteItem(item,
      () => setLoading(true),
      (err) => setError(err)
    );
    setLoading(false);
    if (success) {
      closeDialog();
    }
  };

  // 处理重命名
  const handleRename = async (item, newName) => {
    setLoading(true);
    setError(null);
    const success = await renameItem(item, newName,
      () => setLoading(true),
      (err) => setError(err)
    );
    setLoading(false);
    if (success) {
      closeDialog();
    }
  };

  // 处理上传
  const handleUpload = async (files) => {
    setLoading(true);
    setError(null);
    const success = await uploadFiles(files,
      () => setLoading(true),
      (err) => setError(err)
    );
    setLoading(false);
    if (success) {
      closeDialog();
    }
  };

  // 处理预览
  const handlePreview = async (item) => {
    openDialog({
      type: 'preview',
      title: item.name,
      content: <FilePreview
        file={item}
        isOpen={true}
        onClose={closeDialog}
        onDownload={(file) => {
          setLoading(true);
          setError(null);
          downloadFile(file,
            () => setLoading(true),
            (err) => setError(err)
          ).finally(() => setLoading(false));
        }}
        webdavAPI={webdavAPI}
      />,
      showCancel: false,
      item,
    });
  };

  // 处理编辑
  const handleEdit = async (item) => {
    setLoading(true);
    setError(null);
    const content = await getFileContent(item,
      () => setLoading(true),
      (err) => setError(err)
    );
    setLoading(false);

    if (content !== null) {
      openDialog({
        type: 'edit',
        title: `编辑 ${item.name}`,
        content: (
          <textarea
            defaultValue={content}
            style={{ width: '100%', height: '400px' }}
            id="file-editor"
          />
        ),
        onConfirm: async () => {
          setLoading(true);
          setError(null);
          const newContent = document.getElementById('file-editor').value;
          const success = await saveFileContent(item, newContent,
            () => setLoading(true),
            (err) => setError(err)
          );
          setLoading(false);
          return success;
        },
        showCancel: true,
        item,
      });
    }
  };

  // 打开登录对话框 - 显示环境变量配置信息
  const openLoginDialog = () => {
    openDialog({
      type: 'login',
      title: '认证信息配置',
      content: <LoginDialog />,
      onConfirm: () => {
        return true; // 关闭对话框
      },
      showCancel: false,
    });
  };

  // 打开创建目录对话框
  const openCreateDirectoryDialog = () => {
    openDialog({
      type: 'mkdir',
      title: '创建新目录',
      content: <CreateDirectoryDialog
        currentPath={currentPath}
        onConfirm={handleCreateDirectory}
        onError={setError}
      />,
      onConfirm: () => {
        const name = document.getElementById('dirname').value.trim();
        if (!name) {
          setError('请输入目录名称');
          return false;
        }
        handleCreateDirectory(name);
        return false; // 不自动关闭对话框，由handleCreateDirectory处理
      },
      showCancel: true,
    });
  };

  // 打开创建文件对话框
  const openCreateFileDialog = () => {
    openDialog({
      type: 'mkfile',
      title: '创建新文件',
      content: <CreateFileDialog
        currentPath={currentPath}
        onConfirm={handleCreateFile}
      />,
      onConfirm: () => {
        const name = document.getElementById('filename').value.trim();
        if (!name) {
          setError('请输入文件名称');
          return false;
        }
        handleCreateFile(name, '');
        return false; // 不自动关闭对话框，由handleCreateFile处理
      },
      showCancel: true,
    });
  };

  // 打开删除确认对话框
  const openDeleteDialog = (item) => {
    openDialog({
      type: 'delete',
      title: '确认删除',
      content: <DeleteDialog item={item} />,
      onConfirm: () => {
        handleDelete(item);
        return false; // 不自动关闭对话框，由handleDelete处理
      },
      showCancel: true,
      item,
    });
  };

  // 打开重命名对话框
  const openRenameDialog = (item) => {
    openDialog({
      type: 'rename',
      title: '重命名' + (item.isDir ? '目录' : '文件'),
      content: <RenameDialog
        item={item}
        currentPath={currentPath}
        onConfirm={handleRename}
      />,
      onConfirm: () => {
        const newName = document.getElementById('newname').value.trim();
        if (!newName) {
          setError('请输入新名称');
          return false;
        }
        handleRename(item, newName);
        return false; // 不自动关闭对话框，由handleRename处理
      },
      showCancel: true,
      item,
    });
  };

  // 打开上传对话框
  const openUploadDialog = () => {
    openDialog({
      type: 'upload',
      title: '上传文件',
      content: <FileUpload
        isOpen={true}
        onClose={closeDialog}
        onUpload={handleUpload}
        currentPath={currentPath}
      />,
      onConfirm: null, // 上传组件自己处理上传逻辑
      showCancel: true,
    });
  };

  // 渲染加载状态
  if (loading) {
    return (
      <div className="webdav-navigator">
        <div className="loading">
          <span>加载中</span>
        </div>
      </div>
    );
  }

  // 渲染错误状态（如果认证信息未设置或无效）
  if ((!auth.username || !auth.password || error) && !dialog.isOpen) {
    return (
      <div className="webdav-navigator">
        <div className="error-container">
          <h2>配置错误</h2>
          <p>{error || '未设置WebDAV认证信息，请在环境变量中设置'}</p>
          <Button onClick={() => setError(null)} className="mr-2">重试</Button>
          <Button variant="outline" onClick={openLoginDialog}>查看配置说明</Button>
        </div>
        {dialog.isOpen && (
          <Dialog
            isOpen={dialog.isOpen}
            title={dialog.title}
            onClose={closeDialog}
            onConfirm={dialog.onConfirm}
            showCancel={dialog.showCancel}
          >
            {dialog.content}
          </Dialog>
        )}
      </div>
    );
  }

  return (
    <div className="webdav-navigator">
      {/* 顶部工具栏 */}
      <div className="toolbar">
        <div className="auth-status">
          {auth && auth.username && (
            <span>已登录为: {auth.username}</span>
          )}
        </div>

        {/* <div className="path-navigation flex items-center">
          <Button
            onClick={refreshCurrentDirectory}
            title="刷新当前目录"
            variant="outline"
            size="default"
            className="h-10"
          >
            🔄 刷新
          </Button>
        </div> */}

        <div className="actions">
          <select
            value={sortOrder}
            onChange={(e) => handleSortChange(e.target.value)}
            className="sort-select mr-3 h-10 min-w-[140px]"
          >
            <option value="name">按名称排序</option>
            <option value="date">按日期排序</option>
            <option value="size">按大小排序</option>
          </select>

          <Button onClick={openCreateDirectoryDialog} variant="outline" size="default" className="mr-3 h-10 min-w-[100px]">新建目录</Button>
          <Button onClick={openCreateFileDialog} variant="outline" size="default" className="mr-3 h-10 min-w-[100px]">新建文件</Button>
          <Button onClick={openUploadDialog} size="default" className="h-10 min-w-[100px]">上传文件</Button>
        </div>
      </div>

      {/* 面包屑导航 */}
      <BreadcrumbNav
        currentPath={currentPath}
        onNavigate={(path) => {
          // 使用navigateToDirectory函数导航到指定路径
          navigateToDirectory(path);
        }}
      />

      {/* 文件列表 */}
      <FileList
        items={items}
        parentDirectory={currentPath !== '/' ? getParentDirectory(currentPath) : null}
        onDirectoryOpen={navigateToDirectory}
        onFilePreview={handlePreview}
        onFileDownload={(item) => {
          setLoading(true);
          setError(null);
          downloadFile(item,
            () => setLoading(true),
            (err) => setError(err)
          ).finally(() => setLoading(false));
        }}
        onItemEdit={handleEdit}
        onItemDelete={openDeleteDialog}
        onItemRename={openRenameDialog}
        selectedItems={selectedItems}
        onItemSelect={(item, isSelected) => {
          if (isSelected) {
            setSelectedItems(prev => [...prev, item]);
          } else {
            setSelectedItems(prev => prev.filter(i => i.uri !== item.uri));
          }
        }}
        baseUrl={webdavUrl}
        currentPath={currentPath}
      />

      {/* 对话框 */}
      {dialog.isOpen && dialog.type === 'upload' ? (
        <FileUpload
          isOpen={dialog.isOpen}
          onClose={closeDialog}
          onUpload={handleUpload}
          currentPath={currentPath}
        />
      ) : dialog.isOpen && (
        <Dialog
          isOpen={dialog.isOpen}
          title={dialog.title}
          onClose={closeDialog}
          onConfirm={dialog.onConfirm}
          showCancel={dialog.showCancel}
        >
          {dialog.content}
        </Dialog>
      )}
    </div>
  );
};

export default WebDAVNavigator;