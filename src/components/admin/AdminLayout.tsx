import { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

type AdminLayoutProps = {
  children: ReactNode;
  title: string;
};

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="lg:pl-64">
        <Header title={title} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
