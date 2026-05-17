import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        <Outlet />
      </main>
    </div>
  );
}