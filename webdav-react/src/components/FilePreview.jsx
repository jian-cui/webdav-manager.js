import React, { useState, useEffect } from 'react';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

const FilePreview = ({ file, isOpen, onClose, onDownload, webdavAPI }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    if (!file) return;

    setLoading(true);
    setError(null);

    // 清理之前的Blob URL
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }

    // 检查是否为图片类型（通过MIME类型或文件扩展名）
    const isImage = file.mime?.startsWith('image/') ||
      /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file.name || '');

    // 处理不同类型的文件
    if (isImage) {
      // 检查图片大小是否超过2MB
      const fileSizeInMB = (file.size || 0) / (1024 * 1024);
      if (fileSizeInMB > 2) {
        setError(`图片太大（${fileSizeInMB.toFixed(2)}MB），超过2MB限制，无法预览`);
        setLoading(false);
        return;
      }

      // 对于图片，获取Blob并创建URL
      webdavAPI.downloadFile(file.uri)
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
          setLoading(false);
        })
        .catch(err => {
          console.error('加载图片失败:', err);
          setError(`加载图片失败: ${err.message}`);
          setLoading(false);
        });
    } else if (file.mime?.startsWith('text/') || file.mime === 'application/json' || file.mime === 'application/xml' || file.name?.endsWith('.md')) {
      // 对于文本文件，获取文本内容
      webdavAPI.getFileContent(file.uri)
        .then(data => {
          setContent(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('加载文件内容失败:', err);
          setError(`加载文件内容失败: ${err.message}`);
          setLoading(false);
        });
    } else {
      // 其他类型文件不需要预加载
      setLoading(false);
    }

    // 组件卸载时清理Blob URL
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [file, webdavAPI]);

  if (!file) return null;

  const renderPreview = () => {
    const { mime, name } = file;

    // 检查是否为图片类型（通过MIME类型或文件扩展名）
    const isImage = mime?.startsWith('image/') ||
      /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(name || '');

    // 显示加载状态
    if (loading) {
      return <div className="text-center py-10">加载中...</div>;
    }

    // 显示错误信息
    if (error) {
      return <div className="text-center py-10 text-destructive">{error}</div>;
    }

    // 处理图片预览
    if (isImage) {
      return (
        <div className="flex justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="max-w-full max-h-[70vh] object-contain"
            />
          ) : (
            <div className="text-center py-10">图片加载失败</div>
          )}
        </div>
      );
    }

    // 处理视频预览
    if (mime?.startsWith('video/')) {
      return (
        <div className="flex justify-center">
          <video
            src={file.uri}
            controls
            className="max-w-full max-h-[70vh]"
          >
            您的浏览器不支持视频标签
          </video>
        </div>
      );
    }

    // 处理PDF预览
    if (mime === 'application/pdf') {
      return (
        <iframe
          src={file.uri}
          title={name}
          className="w-full h-[70vh] border-0"
        />
      );
    }

    // 处理文本文件和Markdown文件预览
    if (mime?.startsWith('text/') || mime === 'application/json' || mime === 'application/xml' || name?.endsWith('.md')) {
      // 如果是Markdown文件，可以添加简单的Markdown渲染
      if (name?.endsWith('.md')) {
        return (
          <div className="bg-muted p-4 rounded-md overflow-auto max-h-[70vh]">
            <div className="markdown-content">
              {content?.split('\n').map((line, i) => {
                // 简单的Markdown渲染
                if (line.startsWith('# ')) {
                  return <h1 key={i} className="text-2xl font-bold mb-4">{line.substring(2)}</h1>;
                } else if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-xl font-bold mb-3">{line.substring(3)}</h2>;
                } else if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-lg font-bold mb-2">{line.substring(4)}</h3>;
                } else if (line.startsWith('- ')) {
                  return <li key={i} className="ml-4">{line.substring(2)}</li>;
                } else if (line.trim() === '') {
                  return <br key={i} />;
                } else {
                  return <p key={i} className="mb-2">{line}</p>;
                }
              })}
            </div>
          </div>
        );
      }

      return (
        <div className="bg-muted p-4 rounded-md overflow-auto max-h-[70vh]">
          <pre className="text-sm">
            <code>{content}</code>
          </pre>
        </div>
      );
    }

    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">无法预览此类型的文件</p>
        <Button onClick={() => onDownload(file)}>
          <Download className="mr-2 h-4 w-4" />
          下载文件
        </Button>
      </div>
    );
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <Dialog.Header>
        <Dialog.Title>预览: {file.name}</Dialog.Title>
      </Dialog.Header>

      <Dialog.Content>
        {renderPreview()}
      </Dialog.Content>

      <Dialog.Footer>
        <Button variant="outline" onClick={onClose}>
          关闭
        </Button>
        <Button onClick={() => onDownload(file)}>
          <Download className="mr-2 h-4 w-4" />
          下载
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};

export default FilePreview;
