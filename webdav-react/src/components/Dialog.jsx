import React from 'react';
import { Dialog as UIDialog } from './ui/dialog';
import { Button } from './ui/button';

const Dialog = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  showCancel = true,
  confirmText = '确定',
  cancelText = '取消',
  className = ''
}) => {
  if (!isOpen) return null;

  return (
    <UIDialog isOpen={isOpen} onClose={onClose} className={className}>
      <UIDialog.Header>
        <UIDialog.Title>{title}</UIDialog.Title>
      </UIDialog.Header>

      <UIDialog.Content>
        {children}
      </UIDialog.Content>

      <UIDialog.Footer>
        {showCancel && (
          <Button
            variant="outline"
            onClick={onClose}
            className="min-w-[80px]"
          >
            {cancelText}
          </Button>
        )}
        {onConfirm && (
          <Button
            onClick={onConfirm}
            className="min-w-[80px]"
          >
            {confirmText}
          </Button>
        )}
      </UIDialog.Footer>
    </UIDialog>
  );
};

export default Dialog;