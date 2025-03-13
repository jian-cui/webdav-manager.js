import { useState, useCallback } from 'react';

/**
 * 自定义Hook，用于管理对话框
 * @returns {Object} - 对话框状态和管理函数
 */
const useDialogManager = () => {
  // 对话框状态
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: null,
    title: '',
    content: null,
    onConfirm: null,
    showCancel: true,
    item: null,
  });

  // 关闭对话框
  const closeDialog = useCallback(() => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  // 打开对话框
  const openDialog = useCallback(options => {
    setDialog({
      isOpen: true,
      type: options.type || null,
      title: options.title || '',
      content: options.content || null,
      onConfirm: options.onConfirm || null,
      showCancel: options.showCancel !== undefined ? options.showCancel : true,
      item: options.item || null,
    });
  }, []);

  return {
    dialog,
    setDialog,
    closeDialog,
    openDialog,
  };
};

export default useDialogManager;
