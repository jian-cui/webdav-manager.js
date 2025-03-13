// 格式化文件大小
export const formatBytes = bytes => {
  const unit = 'B';

  if (bytes >= 1024 * 1024 * 1024) {
    return Math.round(bytes / (1024 * 1024 * 1024)) + ' G' + unit;
  } else if (bytes >= 1024 * 1024) {
    return Math.round(bytes / (1024 * 1024)) + ' M' + unit;
  } else if (bytes >= 1024) {
    return Math.round(bytes / 1024) + ' K' + unit;
  } else {
    return bytes + ' ' + unit;
  }
};

// 格式化日期
export const formatDate = date => {
  if (isNaN(date)) {
    return '';
  }

  const now = new Date();
  const nbHours = (+now - +date) / 3600 / 1000;

  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  ) {
    if (nbHours <= 1) {
      return `${Math.round(nbHours * 60)} 分钟前`;
    } else {
      return `${Math.round(nbHours)} 小时前`;
    }
  } else if (nbHours <= 24) {
    return `昨天 ${date.toLocaleTimeString()}`;
  }

  return date.toLocaleString();
};

// 获取文件图标
export const getFileIcon = (filename, isDir) => {
  if (isDir) {
    return '📁';
  }

  // 根据文件扩展名返回图标
  const ext = filename.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'xls':
    case 'xlsx':
      return '📊';
    case 'ppt':
    case 'pptx':
      return '📽️';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'webp':
      return '🖼️';
    case 'mp3':
    case 'wav':
    case 'ogg':
      return '🎵';
    case 'mp4':
    case 'webm':
    case 'avi':
      return '🎬';
    case 'zip':
    case 'rar':
    case 'tar':
    case 'gz':
      return '🗜️';
    case 'txt':
    case 'md':
      return '📄';
    case 'html':
    case 'css':
    case 'js':
      return '💻';
    default:
      return '📄';
  }
};

// 检查文件是否可预览
export const isPreviewable = mime => {
  if (!mime) return false;

  return /^image\/(png|webp|svg|jpeg|jpg|gif|png)|^application\/pdf|^text\/|^audio\/|^video\/|application\/x-empty/.test(
    mime
  );
};

// 安全的HTML转义
export const escapeHtml = unsafe => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// 规范化URL
export const normalizeURL = (url, baseUrl) => {
  if (!url.match(/^https?:\/\//)) {
    url = baseUrl.replace(/^(https?:\/\/[^\/]+\/).*$/, '$1') + url.replace(/^\/+/, '');
  }
  return url;
};

// 获取父目录路径
export const getParentPath = path => {
  return path.replace(/\/+$/, '').split('/').slice(0, -1).join('/') + '/';
};
