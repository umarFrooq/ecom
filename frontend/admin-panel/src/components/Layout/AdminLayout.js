import React from 'react';
import Sidebar from './Sidebar';
import './AdminLayout.css'; // For AdminLayout specific styles
import { useTranslation } from 'react-i18next';

const AdminLayout = ({ children }) => {
  const { i18n } = useTranslation();
  const isAdminRtl = i18n.language === 'ar';

  return (
    <div className={`admin-layout ${isAdminRtl ? 'rtl' : 'ltr'}`} dir={isAdminRtl ? 'rtl' : 'ltr'}>
      <Sidebar />
      <div className="admin-main-content">
        {/* A simple header area within the main content can be added here if needed */}
        {/* <header className="admin-content-header">
          <h4>Page Title</h4>
        </header> */}
        <div className="admin-page-content p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
