import { useCallback } from 'react';

/**
 * 自定义Hook，用于处理目录导航
 * @param {String} webdavUrl - WebDAV服务器URL
 * @param {Function} navigate - React Router的navigate函数
 * @param {String} currentPath - 当前路径
 * @returns {Object} - 导航相关函数
 */
const useDirectoryNavigation = (webdavUrl, navigate, currentPath) => {
  // 导航到目录
  const navigateToDirectory = useCallback(
    path => {
      console.log(111, path, currentPath);
      // 确保路径末尾有斜杠
      const normalizedPath = path.endsWith('/') ? path : path + '/';
      console.log(`导航到目录: ${normalizedPath}, 当前路径: ${currentPath}`);

      // 移除baseURL前缀，只保留相对路径部分
      let relativePath = normalizedPath;
      if (webdavUrl && relativePath.startsWith(webdavUrl)) {
        relativePath = relativePath.substring(webdavUrl.length);
      }

      // 确保路径以/开头
      relativePath = relativePath.startsWith('/') ? relativePath : '/' + relativePath;

      // 从相对路径中提取目录名称部分（移除开头的/和结尾的/）
      let routePath = relativePath;
      if (routePath.startsWith('/')) {
        routePath = routePath.substring(1);
      }
      if (routePath.endsWith('/')) {
        routePath = routePath.slice(0, -1);
      }

      // 检查是否是当前路径
      const isSamePath = normalizedPath === currentPath;

      if (isSamePath) {
        // 通过修改路由参数触发刷新
        navigate(`/browse/${routePath || ''}?refresh=${Date.now()}`);
      } else {
        // 导航到新路径
        const navigatePath = routePath ? `/browse/${routePath}` : '/browse';
        navigate(navigatePath);
      }
    },
    [webdavUrl, currentPath, navigate]
  );

  // 获取父目录路径
  const getParentDirectory = useCallback(path => {
    console.log(`计算父目录，当前路径: ${path}`);

    // 确保路径以/结尾
    const normalizedPath = path.endsWith('/') ? path : path + '/';

    // 移除末尾的/
    const pathWithoutTrailingSlash = normalizedPath.slice(0, -1);

    // 找到最后一个/的位置
    const lastSlashIndex = pathWithoutTrailingSlash.lastIndexOf('/');

    // 如果找不到/或者是根目录，返回根目录
    if (lastSlashIndex <= 0) {
      console.log(`父目录是根目录: /`);
      return '/';
    }

    // 提取父目录路径
    const parentPath = normalizedPath.slice(0, lastSlashIndex + 1);
    console.log(`计算得到父目录: ${parentPath}`);

    return parentPath;
  }, []);

  return {
    navigateToDirectory,
    getParentDirectory,
  };
};

export default useDirectoryNavigation;
