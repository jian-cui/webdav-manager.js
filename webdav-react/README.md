# WebDAV 文件管理器

这是一个基于 React 的 WebDAV 文件管理器，允许你浏览、上传、下载、编辑和管理 WebDAV 服务器上的文件。

## TODO

1. 端点续传

```javascript
async function uploadChunks(file, webdavUrl, username, password) {
  // 设置验证信息
  const auth = btoa(`${username}:${password}`);
  // 分块大小（例如 5MB）
  const chunkSize = 5 * 1024 * 1024;
  // 总分块数
  const totalChunks = Math.ceil(file.size / chunkSize);

  // 创建文件（0字节）- 某些WebDAV服务器需要这一步
  try {
    await axios.put(
      `${webdavUrl}/${file.name}`,
      new Blob([]), // 空内容
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/octet-stream',
          'Content-Length': '0',
        },
      }
    );
  } catch (error) {
    // 如果文件已存在，某些服务器会返回错误，这里可以忽略
    console.log('初始化文件可能已存在:', error.message);
  }

  // 上传每个分块
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(file.size, start + chunkSize) - 1;
    const chunk = file.slice(start, end + 1);

    try {
      await axios.put(`${webdavUrl}/${file.name}`, chunk, {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/octet-stream',
          'Content-Range': `bytes ${start}-${end}/${file.size}`,
        },
        onUploadProgress: progressEvent => {
          // 计算当前块的上传进度
          const percentComplete = Math.round(((i * chunkSize + progressEvent.loaded) / file.size) * 100);
          console.log(`上传进度: ${percentComplete}%`);
          // 更新进度条
          updateProgressBar(percentComplete);
        },
      });
      console.log(`块 ${i + 1}/${totalChunks} 上传成功`);
    } catch (error) {
      console.error(`块 ${i + 1}/${totalChunks} 上传失败:`, error);
      // 这里可以实现重试逻辑
      i--; // 重试当前块
    }
  }

  console.log('文件上传完成');
}
```

2. 上传、删除文件、新建目录后自动刷新目录列表
3. 登录及权限管理

## 功能特性

- 浏览 WebDAV 目录结构
- 上传和下载文件
- 创建、编辑、重命名和删除文件/目录
- 文件预览
- 支持按名称、日期或大小排序
- 通过环境变量配置 WebDAV 服务器和认证信息
- 内置代理解决 CORS 跨域问题

## 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/webdav-react.git
cd webdav-react

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件，设置你的 WebDAV 服务器信息
```

## 配置

在 `.env.local` 文件中配置以下环境变量：

```
# WebDAV 服务器完整 URL（用于代理配置）
VITE_WEBDAV_SERVER=https://your-webdav-server.com

# WebDAV 路径 URL（相对路径，用于客户端请求）
VITE_WEBDAV_URL=/webdav-proxy/remote.php/dav/files/username/

# WebDAV 认证信息
VITE_WEBDAV_USERNAME=your_username
VITE_WEBDAV_PASSWORD=your_password
```

## 开发

```bash
# 启动开发服务器
npm run dev
```

## 构建

```bash
# 构建生产版本
npm run build
```

## 部署

构建完成后，你可以将 `dist` 目录中的文件部署到任何静态文件服务器上。

**注意**：在生产环境中，你需要配置服务器的代理规则，将 `/webdav-proxy` 路径转发到实际的 WebDAV 服务器。

### Nginx 代理配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 静态文件
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }

    # WebDAV 代理
    location /webdav-proxy/ {
        proxy_pass https://your-webdav-server.com/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebDAV 特殊头部
        proxy_set_header Depth $http_depth;
        proxy_set_header Destination $http_destination;

        # 支持大文件上传
        client_max_body_size 100M;
    }
}
```

## 解决 CORS 问题

本应用使用代理服务器解决 CORS 跨域问题。如果你遇到 CORS 错误，请检查：

1. 开发环境：

   - 确保 `.env.local` 中的 `VITE_WEBDAV_SERVER` 设置正确
   - 确保 WebDAV URL 使用 `/webdav-proxy` 前缀
   - 检查控制台日志，查看代理请求是否正确转发

2. 生产环境：

   - 确保服务器配置了正确的代理规则
   - 检查服务器日志，确认代理请求正确转发

3. 其他解决方案：
   - 如果你控制 WebDAV 服务器，可以在服务器端添加 CORS 头部
   - 使用浏览器扩展临时禁用 CORS（仅用于测试）

## 安全注意事项

- 认证信息存储在环境变量中，不会暴露在前端代码中
- 在生产环境中，建议使用 HTTPS 连接以保护数据传输安全
- 如果你需要在公共环境中部署，请考虑使用代理服务器来处理认证

## 技术栈

- React
- React Router
- Axios
- Vite

## 许可证

MIT

## 致谢

本项目是对原始 WebDAV Manager.js 项目的 React 重构版本。
