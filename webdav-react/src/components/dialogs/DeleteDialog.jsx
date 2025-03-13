import React from 'react';

const DeleteDialog = ({ item, onConfirm }) => {
  return (
    <div className="text-center py-4">
      <p className="mb-2">确定要删除以下{item.isDir ? '目录' : '文件'}吗？</p>
      <p className="font-medium text-destructive">"{item.name}"</p>
    </div>
  );
};

export default DeleteDialog;