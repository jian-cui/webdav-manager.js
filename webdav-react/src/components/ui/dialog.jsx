import * as React from "react";
import { X } from "lucide-react";

import { cn } from "../../utils/cn";
import { Button } from "./button";

const Dialog = ({ isOpen, onClose, children, className }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={cn(
          "relative max-h-[90vh] w-full max-w-xl rounded-lg bg-background p-6 shadow-lg border border-border animate-in fade-in-50 duration-200",
          className
        )}
      >
        {children}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 h-8 w-8 rounded-full opacity-70 hover:opacity-100 transition-opacity"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">关闭</span>
        </Button>
      </div>
    </div>
  );
};

const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn("mb-5 flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  />
);

const DialogTitle = ({ className, ...props }) => (
  <h3
    className={cn("text-xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
);

const DialogDescription = ({ className, ...props }) => (
  <p
    className={cn("text-sm text-muted-foreground mt-1", className)}
    {...props}
  />
);

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
);

const DialogContent = ({ className, ...props }) => (
  <div
    className={cn("flex-1 overflow-auto py-2 px-1 w-full", className)}
    {...props}
  />
);

Dialog.Header = DialogHeader;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
Dialog.Footer = DialogFooter;
Dialog.Content = DialogContent;

export { Dialog };