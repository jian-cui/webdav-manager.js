import React, { useState, useRef } from 'react';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { Upload, X, FileUp, CheckCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatBytes } from '../utils/helpers';

// 进度条组件
const ProgressBar = ({ progress, className }) => (
  <div className={cn("w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700", className)}>
    <div
      className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out"
      style={{ width: `${progress}%` }}
    ></div>
  </div>
);

const FileUpload = ({ isOpen, onClose, onUpload }) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    total: 0,
    files: new Map()
  });
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const handleRemoveFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress({ total: 0, files: new Map() });
    setUploadComplete(false);

    // 初始化每个文件的进度
    const initialProgress = new Map();
    files.forEach(file => initialProgress.set(file.name, 0));
    setUploadProgress(prev => ({ ...prev, files: initialProgress }));

    // 添加进度回调
    await onUpload(
      files,
      // 进度回调
      (totalPercent, fileProgressMap) => {
        setUploadProgress({
          total: totalPercent,
          files: new Map(fileProgressMap)
        });
      }
    );

    setUploadComplete(true);

    // 上传完成后延迟关闭，让用户看到完成状态
    setTimeout(() => {
      setUploading(false);
      setFiles([]);
      onClose();
    }, 1500);
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog isOpen={isOpen} onClose={uploading ? undefined : onClose} className="max-w-2xl">
      <Dialog.Header>
        <Dialog.Title>
          {uploading ? (
            uploadComplete ? "上传完成" : "正在上传文件..."
          ) : "上传文件"}
        </Dialog.Title>
        <Dialog.Description>
          {!uploading && "将文件拖放到下面的区域或点击选择文件"}
          {uploading && !uploadComplete && `总进度: ${uploadProgress.total}%`}
          {uploading && uploadComplete && "所有文件已成功上传"}
        </Dialog.Description>
      </Dialog.Header>

      <Dialog.Content>
        {!uploading ? (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20",
              "hover:border-primary hover:bg-primary/5"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFileSelector}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
            <FileUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              拖放文件到此处，或点击选择文件
            </p>
            <p className="text-xs text-muted-foreground">
              支持任何类型的文件
            </p>
          </div>
        ) : (
          uploadComplete && (
            <div className="p-4 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium">上传完成！</h3>
            </div>
          )
        )}

        {files.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium">
                {uploading ? "上传进度" : "已选择的文件"}
              </h4>
              {uploading && !uploadComplete && (
                <div className="flex items-center">
                  <span className="text-sm mr-2">总进度:</span>
                  <div className="w-32">
                    <ProgressBar progress={uploadProgress.total} />
                  </div>
                  <span className="text-sm ml-2">{uploadProgress.total}%</span>
                </div>
              )}
            </div>
            <ul className="space-y-3">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="flex flex-col p-3 border rounded-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatBytes(file.size)}
                      </span>
                    </div>
                    {!uploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(index);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {uploading && (
                    <div className="w-full flex items-center">
                      <ProgressBar
                        progress={uploadProgress.files.get(file.name) || 0}
                        className="h-1.5 flex-grow"
                      />
                      <span className="text-xs ml-2 min-w-[40px] text-right">
                        {uploadProgress.files.get(file.name) || 0}%
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Dialog.Content>

      <Dialog.Footer>
        {!uploading ? (
          <>
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0}
            >
              <span className="flex items-center">
                <Upload className="mr-2 h-4 w-4" />
                上传 {files.length} 个文件
              </span>
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={uploadComplete ? onClose : undefined}
            disabled={!uploadComplete}
          >
            {uploadComplete ? '关闭' : '上传中...'}
          </Button>
        )}
      </Dialog.Footer>
    </Dialog>
  );
};

export default FileUpload;