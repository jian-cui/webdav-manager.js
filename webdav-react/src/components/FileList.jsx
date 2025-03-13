import React from 'react';
import { formatBytes, formatDate } from '../utils/helpers';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from './ui/table';
import { Button } from './ui/button';
import { cn } from '../utils/cn';
import {
  FileIcon,
  FolderIcon,
  ArrowUpIcon,
  Pencil,
  Download,
  Trash2,
  Eye,
  FileText,
  FileImage,
  FileAudio,
  FileVideo,
  File,
  FileCode,
  FileType,
  FileSpreadsheet,
  Presentation
} from 'lucide-react';

const FileList = ({
  items,
  parentDirectory,
  onDirectoryOpen,
  onFilePreview,
  onFileDownload,
  onItemDelete,
  onItemRename,
  onItemEdit,
  onItemSelect = () => { },
  selectedItems = [],
  ncThumbnails,
  baseUrl,
  currentPath
}) => {
  // 检查项目是否被选中
  const isSelected = (item) => {
    return selectedItems && selectedItems.some(i => i.uri === item.uri);
  };

  // 处理复选框变化
  const handleCheckboxChange = (e, item) => {
    onItemSelect(item, e.target.checked);
  };

  // 过滤掉与当前目录路径一致的子目录
  const filteredItems = items.filter(item => {
    // 如果不是目录，直接保留
    if (!item.isDir) return true;

    // 规范化URI和当前路径，确保它们的格式一致
    const normalizedItemUri = item.uri.endsWith('/') ? item.uri : item.uri + '/';
    const normalizedCurrentPath = currentPath.endsWith('/') ? currentPath : currentPath + '/';

    // 对URI进行解码，处理URL编码的中文字符
    let decodedItemUri;
    try {
      decodedItemUri = decodeURIComponent(normalizedItemUri);
    } catch (e) {
      // 如果解码失败，使用原始值
      decodedItemUri = normalizedItemUri;
    }

    // 如果URI与当前路径相同，则过滤掉
    // 检查多种可能的匹配情况
    console.log('比较路径:', {
      decodedItemUri,
      normalizedCurrentPath,
      originalItemUri: normalizedItemUri
    });

    const isSamePath =
      decodedItemUri === normalizedCurrentPath || // 完全匹配（解码后）
      normalizedItemUri === normalizedCurrentPath || // 完全匹配（原始）
      (baseUrl && (
        decodedItemUri === baseUrl + normalizedCurrentPath.replace(/^\//, '') || // 基础URL + 相对路径匹配（解码后）
        normalizedItemUri === baseUrl + normalizedCurrentPath.replace(/^\//, '') // 基础URL + 相对路径匹配（原始）
      ));

    return !isSamePath;
  });


  // 获取缩略图URL
  const getThumbnailUrl = (item) => {
    // 检查是否有MIME类型，如果没有，则通过文件扩展名判断
    if (!ncThumbnails) return null;

    if (item.mime && item.mime.match(/^image\//)) {
      const rootUrl = baseUrl.replace(/(?<!\/)\/.*$/, '/');
      return `${rootUrl}index.php/apps/files/api/v1/thumbnail/150/150/${encodeURIComponent(item.path)}`;
    }

    // 如果没有MIME类型，但文件扩展名是图片格式，也返回缩略图
    if (!item.mime && item.name) {
      const ext = item.name.split('.').pop()?.toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
        const rootUrl = baseUrl.replace(/(?<!\/)\/.*$/, '/');
        return `${rootUrl}index.php/apps/files/api/v1/thumbnail/150/150/${encodeURIComponent(item.path)}`;
      }
    }

    return null;
  };

  // 根据文件类型获取图标
  const getFileTypeIcon = (item) => {
    if (item.isDir) {
      return <FolderIcon className="h-6 w-6 text-primary" />;
    }

    if (!item.mime) {
      // 检查文件扩展名，即使没有MIME类型也能识别常见图片格式
      const ext = item.name?.split('.').pop()?.toLowerCase();
      if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp' || ext === 'svg') {
        return (
          // <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-blue-500">
          //   <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          //   <circle cx="8.5" cy="8.5" r="1.5"></circle>
          //   <polyline points="21 15 16 10 5 21"></polyline>
          // </svg>
          <FileImage className="h-6 w-6 text-blue-500" />
        );
      }
      return <FileIcon className="h-6 w-6 text-muted-foreground" />;
    }

    // 根据MIME类型返回不同的图标
    if (item.mime.startsWith('image/')) {
      return (
        // <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-blue-500">
        //   <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        //   <circle cx="8.5" cy="8.5" r="1.5"></circle>
        //   <polyline points="21 15 16 10 5 21"></polyline>
        // </svg>
        <FileImage className="h-6 w-6 text-blue-500" />
      );
    } else if (item.mime.startsWith('audio/')) {
      return <FileAudio className="h-6 w-6 text-purple-500" />;
    } else if (item.mime.startsWith('video/')) {
      return <FileVideo className="h-6 w-6 text-red-500" />;
    } else if (item.mime === 'application/pdf') {
      return <FileText className="h-6 w-6 text-red-600" />;
    } else if (item.mime.includes('spreadsheet') || item.mime.includes('excel') || item.name?.endsWith('.xlsx') || item.name?.endsWith('.xls')) {
      return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
    } else if (item.mime.includes('presentation') || item.mime.includes('powerpoint') || item.name?.endsWith('.pptx') || item.name?.endsWith('.ppt')) {
      return <Presentation className="h-6 w-6 text-orange-500" />;
    } else if (item.mime.includes('compressed') || item.mime.includes('zip') || item.mime.includes('tar') || item.name?.endsWith('.zip') || item.name?.endsWith('.rar')) {
      return <FileType className="h-6 w-6 text-yellow-600" />;
    } else if (item.mime.startsWith('text/') || item.mime === 'application/json' || item.mime === 'application/xml') {
      return <FileText className="h-6 w-6 text-gray-600" />;
    } else if (item.mime.includes('javascript') || item.mime.includes('css') || item.mime.includes('html')) {
      return <FileCode className="h-6 w-6 text-indigo-500" />;
    }

    return <File className="h-6 w-6 text-muted-foreground" />;
  };

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>名称</TableHead>
            <TableHead className="w-[100px]">大小</TableHead>
            <TableHead className="w-[150px]">创建日期</TableHead>
            <TableHead className="w-[150px]">修改日期</TableHead>
            <TableHead className="text-right w-[200px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parentDirectory && (
            <TableRow>
              <TableCell>
                <div className="flex items-center justify-center">
                  <ArrowUpIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              </TableCell>
              <TableCell>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); onDirectoryOpen(parentDirectory); }}
                  className="text-primary hover:underline"
                >
                  ..
                </a>
              </TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
            </TableRow>
          )}

          {filteredItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                此文件夹为空
              </TableCell>
            </TableRow>
          ) : (
            filteredItems.map((item) => (
              <TableRow
                key={item.uri}
                className={cn(isSelected(item) && "bg-muted")}
                data-state={isSelected(item) ? "selected" : undefined}
              >
                <TableCell>
                  <div className="flex items-center justify-center">
                    {getThumbnailUrl(item) ? (
                      <img
                        src={getThumbnailUrl(item)}
                        alt={item.name}
                        className="h-8 w-8 object-contain"
                      />
                    ) : (
                      getFileTypeIcon(item)
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {item.isDir ? (
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); onDirectoryOpen(item.uri); }}
                        className="text-primary hover:underline"
                      >
                        {item.name}
                      </a>
                    ) : (
                      <span>{item.name}</span>
                    )}
                    <label className="ml-2">
                      <input
                        type="checkbox"
                        checked={isSelected(item)}
                        onChange={(e) => handleCheckboxChange(e, item)}
                        className="sr-only peer"
                      />
                      {/* <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-primary peer-checked:bg-primary peer-checked:text-white">
                        {isSelected(item) && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3 w-3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span> */}
                    </label>
                  </div>
                </TableCell>
                <TableCell>{item.size ? formatBytes(item.size) : '-'}</TableCell>
                <TableCell>{item.created ? formatDate(item.created) : <span className="text-muted-foreground text-xs">不可用</span>}</TableCell>
                <TableCell>{item.modified ? formatDate(item.modified) : '-'}</TableCell>
                <TableCell className="text-right space-x-1">
                  {!item.isDir && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFilePreview(item)}
                        title="预览"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFileDownload(item)}
                        title="下载"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {item.mime && item.mime.match(/^text\/|application\/(json|xml)/) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onItemEdit(item)}
                          title="编辑"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onItemRename(item)}
                    title="重命名"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onItemDelete(item)}
                    title="删除"
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default FileList;