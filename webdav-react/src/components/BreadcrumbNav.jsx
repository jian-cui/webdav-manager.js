import React from 'react';
import { HomeIcon, ChevronRightIcon } from 'lucide-react';

/**
 * 面包屑导航组件
 * @param {Object} props - 组件属性
 * @param {string} props.currentPath - 当前路径
 * @param {Function} props.onNavigate - 导航回调函数
 * @returns {JSX.Element} - 面包屑导航组件
 */
const BreadcrumbNav = ({ currentPath, onNavigate }) => {
  // 如果当前路径为根目录，只显示首页图标
  if (currentPath === '/') {
    return (
      <nav aria-label="面包屑导航" className="breadcrumb-nav py-2 px-3 mb-3 bg-muted/20 rounded-md border border-border/30">
        <ol className="flex items-center">
          <li>
            <span
              onClick={() => onNavigate('/')}
              className="flex items-center font-medium text-foreground hover:text-primary cursor-pointer"
              title="刷新首页"
            >
              <HomeIcon className="h-4 w-4 mr-1" />
              <span>首页</span>
            </span>
          </li>
        </ol>
      </nav>
    );
  }

  // 解析路径，生成面包屑项
  const pathSegments = currentPath.split('/').filter(Boolean);
  const breadcrumbItems = [];

  // 添加首页
  breadcrumbItems.push({
    name: '首页',
    path: '/',
    isHome: true
  });

  // 添加中间路径
  let currentSegmentPath = '';
  for (let i = 0; i < pathSegments.length; i++) {
    currentSegmentPath += '/' + pathSegments[i];
    breadcrumbItems.push({
      name: decodeURIComponent(pathSegments[i]),
      path: currentSegmentPath,
      isLast: i === pathSegments.length - 1
    });
  }

  return (
    <nav aria-label="面包屑导航" className="breadcrumb-nav py-2 px-3 mb-3 bg-muted/20 rounded-md border border-border/30">
      <ol className="flex items-center flex-wrap overflow-x-auto">
        {breadcrumbItems.map((item, index) => (
          <li key={item.path} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="h-4 w-4 mx-1 text-muted-foreground flex-shrink-0" />
            )}
            {item.isLast ? (
              <span
                className="flex items-center font-medium text-foreground"
                title={item.name}
              >
                {item.isHome && <HomeIcon className="h-4 w-4 mr-1 flex-shrink-0" />}
                <span className="truncate max-w-[150px]">{item.name}</span>
              </span>
            ) : (
              <span
                onClick={() => onNavigate(item.path)}
                className="flex items-center text-primary hover:text-primary/80 hover:underline cursor-pointer transition-colors"
                title={item.name}
              >
                {item.isHome && <HomeIcon className="h-4 w-4 mr-1 flex-shrink-0" />}
                <span className="truncate max-w-[150px]">{item.name}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default BreadcrumbNav;