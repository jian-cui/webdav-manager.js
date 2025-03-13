import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

// 获取当前文件的目录
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, __dirname, '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        // 将所有以 /webdav-proxy 开头的请求代理到实际的 WebDAV 服务器
        '/webdav-proxy': {
          target: env.VITE_WEBDAV_SERVER || 'https://your-webdav-server.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/webdav-proxy/, ''),
          configure: proxy => {
            proxy.on('error', err => {
              console.log('代理错误', err);
            });
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('代理请求', req.method, req.url);
            });
          },
        },
      },
    },
  };
});
