import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function DashboardLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className={`dashboard-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
}
