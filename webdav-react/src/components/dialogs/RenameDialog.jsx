import React from 'react';

const RenameDialog = ({ item, currentPath, onConfirm }) => {
  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <label htmlFor="newname" className="text-base font-medium leading-none mb-1.5 text-foreground/90">
          新名称
        </label>
        <div className="relative w-full">
          <input
            type="text"
            id="newname"
            name="newname"
            defaultValue={item.name}
            autoFocus
            className="dialog-input-focus flex h-12 w-full rounded-md border-2 border-primary/50 bg-background px-4 py-2 text-base shadow-md transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const newName = e.target.value.trim();
                if (newName) {
                  onConfirm(item, newName);
                }
              }
            }}
          />
        </div>
      </div>
      {item.isDir && (
        <div className="text-sm text-muted-foreground">
          <p>注意：重命名目录可能会影响目录内的文件访问</p>
          <p>当前路径: {decodeURIComponent(currentPath)}</p>
        </div>
      )}
    </div>
  );
};

export default RenameDialog;