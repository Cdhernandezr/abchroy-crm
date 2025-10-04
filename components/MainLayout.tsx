// components/MainLayout.tsx
'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  // 1. Estado para controlar si la barra lateral está colapsada
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      {/* 2. El margen del contenido principal ahora se ajusta dinámicamente */}
      <main 
        style={{
          width: `calc(100% - ${isCollapsed ? '88px' : '240px'})`,
          marginLeft: isCollapsed ? '88px' : '240px',
          transition: 'all 0.3s ease-in-out',
        }}
      >
        {children}
      </main>
    </div>
  );
}