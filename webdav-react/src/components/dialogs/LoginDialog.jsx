import React from 'react';

const LoginDialog = () => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">认证信息必须通过环境变量设置，请联系管理员配置以下环境变量：</p>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li><span className="font-mono bg-muted px-1 rounded">VITE_WEBDAV_URL</span> - WebDAV服务器URL</li>
        <li><span className="font-mono bg-muted px-1 rounded">VITE_WEBDAV_USERNAME</span> - WebDAV用户名</li>
        <li><span className="font-mono bg-muted px-1 rounded">VITE_WEBDAV_PASSWORD</span> - WebDAV密码</li>
      </ul>
    </div>
  );
};

export default LoginDialog;