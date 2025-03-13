import axios from 'axios';

// WebDAV XML模板
const propfindTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<D:propfind xmlns:D="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:nc="http://nextcloud.org/ns">
  <D:prop>
    <D:getlastmodified/>
    <D:getcontenttype/>
    <D:getcontentlength/>
    <D:resourcetype/>
    <D:displayname/>
    <D:creationdate/>
    <oc:permissions/>
  </D:prop>
</D:propfind>`;

const wopiPropfindTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<D:propfind xmlns:D="DAV:" xmlns:W="https://interoperability.blob.core.windows.net/files/MS-WOPI/">
  <D:prop>
    <W:wopi-url/><W:token/><W:token-ttl/>
  </D:prop>
</D:propfind>`;

/**
 * 创建WebDAV API实例
 * @param {string} baseURL - WebDAV服务器基础URL
 * @param {Object|null} auth - 身份验证信息
 * @param {string} auth.username - 用户名
 * @param {string} auth.password - 密码
 * @returns {Object} WebDAV API方法集合
 */
const createWebDAVAPI = (baseURL, auth = null) => {
  // 验证认证信息是否有效
  const hasValidAuth = auth && auth.username && auth.password;

  // 创建axios实例，如果提供了有效的auth参数，则添加Basic认证头
  const api = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/xml',
      ...(hasValidAuth ? { Authorization: `Basic ${btoa(auth.username + ':' + auth.password)}` } : {}),
    },
    // 添加请求拦截器，记录请求信息
    timeout: 30000, // 30秒超时
  });

  // 添加请求拦截器
  api.interceptors.request.use(
    config => {
      console.log(`WebDAV 请求: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    error => {
      console.error('WebDAV 请求错误:', error);
      return Promise.reject(error);
    }
  );

  // 添加响应拦截器
  api.interceptors.response.use(
    response => {
      console.log(`WebDAV 响应: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
      return response;
    },
    error => {
      if (error.response) {
        // 服务器返回了错误状态码
        console.error(
          `WebDAV 错误响应: ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`
        );
      } else if (error.request) {
        // 请求已发送但没有收到响应
        console.error('WebDAV 无响应错误:', error.message);
        // 检查是否是 CORS 错误
        if (error.message.includes('Network Error')) {
          console.error('可能是 CORS 跨域问题，请检查服务器配置或代理设置');
        }
      } else {
        // 请求设置时发生错误
        console.error('WebDAV 请求设置错误:', error.message);
      }
      return Promise.reject(error);
    }
  );

  return {
    // 获取目录列表
    async listDirectory(path) {
      try {
        // 确保路径末尾有斜杠
        const normalizedPath = path.endsWith('/') ? path : path + '/';
        console.log(`列出目录内容: ${normalizedPath}, 原始路径: ${path}`);

        // 构建完整的请求URL
        const requestUrl = new URL(normalizedPath, baseURL).href;
        console.log(`完整请求URL: ${requestUrl}`);

        const response = await api.request({
          method: 'PROPFIND',
          url: normalizedPath,
          data: propfindTemplate,
          headers: {
            Depth: 1,
          },
        });

        console.log(`PROPFIND 请求成功，状态码: ${response.status}, URL: ${response.config.url}`);
        const items = parseDirectoryListing(response.data, baseURL);
        console.log(`解析完成，获取到 ${items.length} 个项目`);

        // 打印所有项目的路径，帮助调试
        items.forEach((item, index) => {
          console.log(`项目 ${index}: 名称=${item.name}, URI=${item.uri}, 路径=${item.path}, 是目录=${item.isDir}`);
        });

        return items;
      } catch (error) {
        console.error(`Error listing directory: ${path}`, error);
        if (error.response) {
          console.error(`错误状态码: ${error.response.status}, URL: ${error.config?.url}`);
        }
        throw error;
      }
    },

    // 创建目录
    async createDirectory(path) {
      const createDir = async dirPath => {
        try {
          await api.request({
            method: 'MKCOL',
            url: dirPath + '/',
          });
          return true;
        } catch (error) {
          // 处理409冲突错误
          if (error.response && error.response.status === 409) {
            // 检查目录是否已存在
            try {
              const response = await api.request({
                method: 'PROPFIND',
                url: dirPath,
                headers: {
                  Depth: '0',
                },
                data: propfindTemplate,
              });

              // 如果能成功获取目录信息，说明目录已存在，返回成功
              if (response.status === 207) {
                console.log('目录已存在，无需创建');
                return true;
              }
            } catch (checkError) {
              // 如果检查也失败，可能是父目录不存在
              console.error('检查目录是否存在失败:', checkError);

              // 尝试创建父目录
              const parentPath = dirPath.replace(/\/[^/]+\/?$/, '/');
              if (parentPath !== dirPath && parentPath !== '/') {
                try {
                  // 递归创建父目录
                  await createDir(parentPath);

                  // 再次尝试创建当前目录
                  return await createDir(dirPath);
                } catch (parentError) {
                  console.error('创建父目录失败:', parentError);
                  throw new Error(`创建目录失败: 无法创建父目录 - ${parentError.message}`);
                }
              }
            }

            throw new Error(`创建目录失败: 目录路径冲突 (409) - 可能是目录已存在或父目录不存在`);
          }

          throw error;
        }
      };

      try {
        return await createDir(path);
      } catch (error) {
        console.error('Error creating directory:', error);
        throw error;
      }
    },

    // 上传文件
    async uploadFile(path, file, onProgress) {
      try {
        await api.request({
          method: 'PUT',
          url: path,
          data: file,
          timeout: 3600000, // 1小时
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          onUploadProgress:
            typeof onProgress === 'function'
              ? progressEvent => {
                  const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                  onProgress(percentCompleted, file);
                }
              : undefined,
        });
        return true;
      } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
    },

    // 下载文件
    async downloadFile(path) {
      try {
        const response = await api.request({
          method: 'GET',
          url: path,
          responseType: 'blob',
          timeout: 3600000, // 1小时
        });
        return response.data;
      } catch (error) {
        console.error('Error downloading file:', error);
        throw error;
      }
    },

    // 删除文件或目录
    async delete(path) {
      try {
        // 如果是目录，确保路径末尾有斜杠
        const isDirectory = path.endsWith('/') || (await this.isDirectory(path));
        const urlPath = isDirectory && !path.endsWith('/') ? path + '/' : path;

        await api.request({
          method: 'DELETE',
          url: urlPath,
        });
        return true;
      } catch (error) {
        console.error('Error deleting item:', error);
        throw error;
      }
    },

    // 检查路径是否为目录
    async isDirectory(path) {
      try {
        const response = await api.request({
          method: 'PROPFIND',
          url: path,
          headers: {
            Depth: '0',
          },
          data: propfindTemplate,
        });

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.data, 'text/xml');
        return !!xmlDoc.querySelector('resourcetype collection');
      } catch (error) {
        console.error('Error checking if path is directory:', error);
        return false;
      }
    },

    // 重命名文件或目录
    async rename(oldPath, newPath) {
      try {
        // 检查是否是目录
        const isDirectory = oldPath.endsWith('/') || (await this.isDirectory(oldPath));

        // 确保目录路径末尾有斜杠
        const srcPath = isDirectory && !oldPath.endsWith('/') ? oldPath + '/' : oldPath;
        let destPath = newPath;

        // 如果是目录，确保目标路径末尾也有斜杠
        if (isDirectory && !destPath.endsWith('/')) {
          destPath = destPath + '/';
        }

        console.log(`重命名: ${srcPath} -> ${destPath}`);

        await api.request({
          method: 'MOVE',
          url: srcPath,
          headers: {
            Destination: destPath,
          },
        });
        return true;
      } catch (error) {
        console.error('Error renaming item:', error);
        throw error;
      }
    },

    // 获取文件内容
    async getFileContent(path) {
      try {
        const response = await api.request({
          method: 'GET',
          url: path,
        });
        return response.data;
      } catch (error) {
        console.error('Error getting file content:', error);
        throw error;
      }
    },

    // 保存文件内容
    async saveFileContent(path, content) {
      try {
        await api.request({
          method: 'PUT',
          url: path,
          data: content,
        });
        return true;
      } catch (error) {
        console.error('Error saving file content:', error);
        throw error;
      }
    },

    // 获取WOPI属性
    async getWOPIProperties(path) {
      try {
        const response = await api.request({
          method: 'PROPFIND',
          url: path,
          data: wopiPropfindTemplate,
          headers: {
            Depth: '0',
          },
        });

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.data, 'text/xml');

        return {
          wopiUrl: xmlDoc.querySelector('wopi-url')?.textContent || null,
          token: xmlDoc.querySelector('token')?.textContent || null,
          tokenTtl: xmlDoc.querySelector('token-ttl')?.textContent || null,
        };
      } catch (error) {
        console.error('Error getting WOPI properties:', error);
        throw error;
      }
    },

    // 获取当前认证状态
    getAuthStatus() {
      return {
        isAuthenticated: !!(auth && auth.username && auth.password),
        username: auth?.username || null,
      };
    },

    // 更新认证信息
    updateAuth(newAuth) {
      if (newAuth && newAuth.username && newAuth.password) {
        api.defaults.headers.Authorization = `Basic ${btoa(newAuth.username + ':' + newAuth.password)}`;
        return true;
      }
      return false;
    },
  };
};

// 解析目录列表XML
const parseDirectoryListing = (xmlString, baseURL) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  const responses = xmlDoc.querySelectorAll('response');

  console.log(`解析目录列表: 找到 ${responses.length} 个响应项`);
  console.log(`当前baseURL: ${baseURL}`);

  // 尝试获取当前路径
  let currentPath;
  try {
    currentPath = new URL(baseURL).pathname;
    console.log(`从baseURL解析的当前路径: ${currentPath}`);
  } catch (error) {
    console.error(`解析baseURL失败: ${baseURL}`, error);
    currentPath = '/';
  }

  const items = [];

  responses.forEach((response, index) => {
    try {
      const href = response.querySelector('href')?.textContent;
      if (!href) {
        console.log(`项目 ${index} 没有href属性`);
        return;
      }

      // 尝试解析完整路径
      let path;
      try {
        const fullUrl = new URL(href, baseURL);
        path = fullUrl.pathname;
        console.log(`项目 ${index} 解析URL: ${href} -> ${fullUrl.href} -> 路径: ${path}`);
      } catch (error) {
        console.error(`解析URL失败: ${href}`, error);
        path = href;
      }

      // 跳过当前目录
      if (path === currentPath) {
        console.log(`跳过当前目录: ${path}`);
        return;
      }

      const props = response.querySelector('propstat status')?.textContent.includes('200')
        ? response.querySelector('propstat')
        : null;

      if (!props) {
        console.log(`项目 ${index} 没有有效的属性`);
        return;
      }

      const isDir = !!props.querySelector('resourcetype collection');

      // 处理名称，移除路径末尾的斜杠再获取最后一部分
      let name;
      try {
        name = decodeURIComponent(path.replace(/\/$/, '').split('/').pop());
      } catch (error) {
        console.error(`解析名称失败: ${path}`, error);
        name = path.replace(/\/$/, '').split('/').pop();
      }

      console.log(`项目 ${index}: 名称=${name}, 路径=${path}, 是目录=${isDir}`);

      items.push({
        uri: href,
        path: path,
        name: name,
        size:
          !isDir && props.querySelector('getcontentlength')
            ? parseInt(props.querySelector('getcontentlength').textContent, 10)
            : null,
        mime:
          !isDir && props.querySelector('getcontenttype') ? props.querySelector('getcontenttype').textContent : null,
        modified: props.querySelector('getlastmodified')
          ? new Date(props.querySelector('getlastmodified').textContent)
          : null,
        created: props.querySelector('creationdate') ? new Date(props.querySelector('creationdate').textContent) : null,
        isDir: isDir,
        permissions: props.querySelector('permissions') ? props.querySelector('permissions').textContent : null,
      });
    } catch (error) {
      console.error(`处理项目 ${index} 时出错`, error);
    }
  });

  return items;
};

export default createWebDAVAPI;
