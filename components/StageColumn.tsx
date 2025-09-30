'use client'

import { FC } from 'react'
import { useDroppable } from '@dnd-kit/core'
import styles from './StageColumn.module.css'
import { Plus } from 'lucide-react'
import type { Deal, Stage, UserProfile } from '@/lib/analyticsHelpers'

interface StageColumnProps {
  stage: Stage;
  deals: Deal[];
  users: UserProfile[]; // Propiedad que ahora usamos
  children: React.ReactNode;
  onAddDeal: () => void;
}

const StageColumn: FC<StageColumnProps> = ({ stage, deals, users, children, onAddDeal }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const columnClasses = `${styles.column} ${isOver ? styles.dragOver : ''}`;

  // Lógica para obtener los propietarios únicos de los negocios en esta etapa
  const uniqueOwnerIds = Array.from(new Set(deals.map(deal => deal.owner_id).filter((id): id is string => !!id)));
  const ownersInColumn = users.filter(user => uniqueOwnerIds.includes(user.id));
  
  // Limitar a 3 avatares visibles y calcular el resto
  const visibleOwners = ownersInColumn.slice(0, 3);
  const moreOwnersCount = ownersInColumn.length - visibleOwners.length;


  return (
    <div ref={setNodeRef} className={columnClasses}>
      <div className={styles.header}>
        {/* Título y Conteo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className={styles.title}>{stage.name}</span>
          <span className={styles.badge}>{deals.length}</span>
        </div>

        {/* Avatares de los Propietarios (Implementación de la prop 'users') */}
        <div className={styles.ownerList}>
          {visibleOwners.map(owner => (
            <div key={owner.id} title={owner.name || 'Propietario'} className={styles.avatar}>
              <img 
                  // Usar 'owner.avatar' si ese es el nombre de la propiedad en UserProfile
                  // Si tu tipo es { avatar: string | null }, esto funcionará.
                  src={owner.avatar || ''} 
                  alt={owner.name || 'Avatar'} 
                  className={styles.avatarImage}
              />
            </div>
          ))}
          {moreOwnersCount > 0 && (
              <div className={styles.moreOwnersBadge} title={`y ${moreOwnersCount} más`}>
                  +{moreOwnersCount}
              </div>
          )}
        </div>

        {/* Valor Total */}
        <p className={styles.value}>
          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalValue)}
        </p>
      </div>

      <div className={styles.content}>
        {children}
        <button onClick={onAddDeal} className={styles.addDealButton}>
          <Plus size={16} />
          Añadir oportunidad
        </button>
      </div>
    </div>
  );
};

export default StageColumn;