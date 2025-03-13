import React from 'react';

const CreateDirectoryDialog = ({ currentPath, onConfirm, onError }) => {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center mb-2">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
            <line x1="12" y1="10" x2="12" y2="16"></line>
            <line x1="9" y1="13" x2="15" y2="13"></line>
          </svg>
        </div>
      </div>

      <div className="grid w-full items-center gap-2">
        <label htmlFor="dirname" className="text-base font-medium leading-none mb-1.5 text-foreground/90">
          目录名称
        </label>
        <div className="relative w-full">
          <input
            type="text"
            id="dirname"
            name="dirname"
            placeholder="输入目录名称"
            autoFocus
            className="dialog-input-focus flex h-12 w-full rounded-md border-2 border-primary/50 bg-background px-4 py-2 text-base shadow-md transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const name = e.target.value.trim();
                if (name) {
                  onConfirm(name);
                }
              }
            }}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-primary/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
            </svg>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
        <div className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 mt-0.5 text-muted-foreground">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div>
            <p className="mb-1">目录名称不能包含斜杠 (/ 或 \)</p>
            <p>当前路径: <span className="font-medium">{decodeURIComponent(currentPath)}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDirectoryDialog;