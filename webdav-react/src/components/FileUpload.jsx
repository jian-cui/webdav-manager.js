import React, { useState, useRef } from 'react';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { Upload, X, FileUp } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatBytes } from '../utils/helpers';

const FileUpload = ({ isOpen, onClose, onUpload, currentPath }) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    await onUpload(files, currentPath);
    setUploading(false);
    setFiles([]);
    onClose();
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <Dialog.Header>
        <Dialog.Title>上传文件</Dialog.Title>
        <Dialog.Description>
          将文件拖放到下面的区域或点击选择文件
        </Dialog.Description>
      </Dialog.Header>

      <Dialog.Content>
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

        {files.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">已选择的文件</h4>
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <div className="flex items-center">
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatBytes(file.size)}
                    </span>
                  </div>
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
                </li>
              ))}
            </ul>
          </div>
        )}
      </Dialog.Content>

      <Dialog.Footer>
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
        >
          {uploading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              上传中...
            </span>
          ) : (
            <span className="flex items-center">
              <Upload className="mr-2 h-4 w-4" />
              上传 {files.length} 个文件
            </span>
          )}
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};

export default FileUpload;