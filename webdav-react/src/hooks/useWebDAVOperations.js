import { useCallback } from 'react';

/**
 * 自定义Hook，用于处理WebDAV操作
 * @param {Object} webdavAPI - WebDAV API实例
 * @param {Function} refreshDirectory - 刷新目录的函数
 * @param {Object} currentPathRef - 当前路径的 ref 对象
 * @returns {Object} - WebDAV操作函数和状态
 */
const useWebDAVOperations = (webdavAPI, refreshDirectory, currentPathRef) => {
  // 移除内部状态管理，避免循环依赖
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState(null);

  // 创建新目录
  const createDirectory = useCallback(
    async (name, onStart, onError) => {
      if (!name) return false;

      // 检查目录名称是否有效
      if (name.includes('/') || name.includes('\\')) {
        onError && onError('目录名称不能包含斜杠');
        return false;
      }

      try {
        onStart && onStart();

        // 创建完整路径
        const currentPath = currentPathRef.current;
        const fullPath = `${currentPath}${encodeURIComponent(name)}`;
        console.log(`尝试创建目录: ${fullPath}`);

        await webdavAPI.createDirectory(fullPath);

        // 刷新目录
        refreshDirectory();
        return true;
      } catch (err) {
        console.error('创建目录失败:', err);

        // 提供更友好的错误信息
        let errorMessage = `创建目录失败: ${err.message}`;

        if (err.response) {
          if (err.response.status === 409) {
            errorMessage = `创建目录失败: 目录"${name}"已存在或路径无效`;
          } else if (err.response.status === 403) {
            errorMessage = `创建目录失败: 权限不足，无法在当前位置创建目录`;
          } else if (err.response.status === 405) {
            errorMessage = `创建目录失败: 服务器不支持在此位置创建目录`;
          }
        }

        onError && onError(errorMessage);
        return false;
      }
    },
    [webdavAPI, currentPathRef, refreshDirectory]
  );

  // 创建新文件
  const createFile = useCallback(
    async (name, content = '', onStart, onError) => {
      if (!name) return false;

      try {
        onStart && onStart();
        const currentPath = currentPathRef.current;
        await webdavAPI.saveFileContent(`${currentPath}${encodeURIComponent(name)}`, content);

        // 刷新目录
        refreshDirectory();
        return true;
      } catch (err) {
        onError && onError(`创建文件失败: ${err.message}`);
        return false;
      }
    },
    [webdavAPI, currentPathRef, refreshDirectory]
  );

  // 删除文件或目录
  const deleteItem = useCallback(
    async (item, onStart, onError) => {
      try {
        onStart && onStart();
        await webdavAPI.delete(item.uri);

        // 刷新目录
        refreshDirectory();
        return true;
      } catch (err) {
        console.error('删除失败:', err);
        onError && onError(`删除失败: ${err.message}`);
        return false;
      }
    },
    [webdavAPI, refreshDirectory]
  );

  // 重命名文件或目录
  const renameItem = useCallback(
    async (item, newName, onStart, onError) => {
      if (!newName) return false;

      try {
        onStart && onStart();
        console.log(`重命名项目: ${item.name} -> ${newName}, 是目录: ${item.isDir}`);

        // 构建新路径
        const currentPath = currentPathRef.current;
        const newPath = `${currentPath}${encodeURIComponent(newName)}`;
        console.log(`原路径: ${item.uri}, 新路径: ${newPath}`);

        await webdavAPI.rename(item.uri, newPath);

        // 刷新目录
        refreshDirectory();
        return true;
      } catch (err) {
        console.error('重命名失败:', err);
        onError && onError(`重命名失败: ${err.message}`);
        return false;
      }
    },
    [webdavAPI, currentPathRef, refreshDirectory]
  );

  // 上传文件
  const uploadFiles = useCallback(
    async (files, onStart, onError, onProgress) => {
      if (!files || files.length === 0) return false;

      try {
        // 只有当onStart是函数时才调用
        if (typeof onStart === 'function') {
          onStart();
        }

        const currentPath = currentPathRef.current;

        // 创建一个进度跟踪对象
        const progressMap = new Map();
        files.forEach(file => {
          progressMap.set(file.name, 0);
        });

        // 定义进度回调函数
        const handleProgress = (percent, file) => {
          console.log('handleProgress', percent, file);
          progressMap.set(file.name, percent);
          console.log(22222, typeof onProgress);

          // 计算总体进度
          if (typeof onProgress === 'function') {
            const totalProgress =
              Array.from(progressMap.values()).reduce((sum, value) => sum + value, 0) / files.length;
            console.log('totalProgress', totalProgress);
            onProgress(Math.round(totalProgress), progressMap);
          }
        };

        // 顺序上传文件，以便更准确地跟踪进度
        for (const file of files) {
          await webdavAPI.uploadFile(`${currentPath}${encodeURIComponent(file.name)}`, file, handleProgress);
        }

        // 刷新目录
        refreshDirectory();
        return true;
      } catch (err) {
        console.error('上传失败:', err);
        if (typeof onError === 'function') {
          onError(`上传失败: ${err.message}`);
        }
        return false;
      }
    },
    [webdavAPI, currentPathRef, refreshDirectory]
  );

  // 下载文件
  const downloadFile = useCallback(
    async (item, onStart, onError) => {
      try {
        onStart && onStart();
        const blob = await webdavAPI.downloadFile(item.uri);

        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();

        // 清理
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return true;
      } catch (err) {
        onError && onError(`下载失败: ${err.message}`);
        return false;
      }
    },
    [webdavAPI]
  );

  // 获取文件内容
  const getFileContent = useCallback(
    async (item, onStart, onError) => {
      try {
        onStart && onStart();
        const content = await webdavAPI.getFileContent(item.uri);
        return content;
      } catch (err) {
        onError && onError(`获取文件内容失败: ${err.message}`);
        return null;
      }
    },
    [webdavAPI]
  );

  // 保存文件内容
  const saveFileContent = useCallback(
    async (item, content, onStart, onError) => {
      try {
        onStart && onStart();
        await webdavAPI.saveFileContent(item.uri, content);

        // 刷新目录
        refreshDirectory();
        return true;
      } catch (err) {
        onError && onError(`保存文件失败: ${err.message}`);
        return false;
      }
    },
    [webdavAPI, refreshDirectory]
  );

  return {
    createDirectory,
    createFile,
    deleteItem,
    renameItem,
    uploadFiles,
    downloadFile,
    getFileContent,
    saveFileContent,
  };
};

export default useWebDAVOperations;
