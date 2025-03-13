import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WebDAVNavigator from './components/WebDAVNavigator';
import './App.css';

function App() {
  // 从环境变量中获取WebDAV URL和WOPI URL
  const webdavUrl = import.meta.env.VITE_WEBDAV_URL || '/remote.php/dav/files/bohwaz/';
  const wopiDiscoveryUrl = import.meta.env.VITE_WOPI_DISCOVERY_URL || '';

  // 将webdavUrl和wopiDiscoveryUrl传递给WebDAVNavigator组件
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/browse" replace />} />
          <Route
            path="/browse/*"
            element={<WebDAVNavigator webdavUrl={webdavUrl} wopiDiscoveryUrl={wopiDiscoveryUrl} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
