'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Users, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import styles from './Sidebar.module.css'

// CORRECCIÓN: Eliminamos el objeto de 'Analíticas' de la lista de navegación
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/contacts', label: 'Contactos', icon: Users },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        {!isCollapsed && <div className={styles.logo}></div>}
        <button onClick={toggleSidebar} className={styles.toggleButton}>
          {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>
      
      <ul className={styles.navList}>
        {navItems.map(item => {
          // La lógica para determinar la ruta activa no cambia
          const isActive = pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link href={item.href} className={`${styles.navLink} ${isActive ? styles.active : ''}`}>
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}