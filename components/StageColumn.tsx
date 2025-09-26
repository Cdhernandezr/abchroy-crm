'use client'

import { FC } from 'react'
import { useDroppable } from '@dnd-kit/core'
import styles from './StageColumn.module.css'
import { Plus } from 'lucide-react'

// --- Type Definitions ---
type UserProfile = { id: string; name: string | null; avatar: string | null; };
type Deal = { id: string; title: string; value: number | null; owner_id: string | null; };
type Stage = { id: string; name: string; };

interface StageColumnProps {
  stage: Stage;
  deals: Deal[];
  users: UserProfile[];
  children: React.ReactNode;
  // FIX: Add the onAddDeal prop type
  onAddDeal: () => void;
}

const StageColumn: FC<StageColumnProps> = ({ stage, deals, users, children, onAddDeal }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const columnClasses = `${styles.column} ${isOver ? styles.dragOver : ''}`;

  return (
    <div ref={setNodeRef} className={columnClasses}>
      <div className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className={styles.title}>{stage.name}</span>
          <span className={styles.badge}>{deals.length}</span>
        </div>
        <p className={styles.value}>
          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalValue)}
        </p>
      </div>
      <div className={styles.content}>
        {children}
        {/* FIX: Connect the onClick event to the onAddDeal prop */}
        <button onClick={onAddDeal} className={styles.addDealButton}>
          <Plus size={16} />
          Añadir oportunidad
        </button>
      </div>
    </div>
  );
};

export default StageColumn;