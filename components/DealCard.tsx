'use client'

import { FC } from 'react'
import { useDraggable } from '@dnd-kit/core'
// 1. Importamos nuestros nuevos estilos
import styles from './DealCard.module.css' 
import type { Deal, UserProfile } from '@/lib/analyticsHelpers'


interface DealCardProps { dealId: string; deal: Deal; owner: UserProfile | undefined; isOverlay?: boolean; onClick: () => void; }

const DealCard: FC<DealCardProps> = ({ dealId, deal, owner, isOverlay = false, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: dealId });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.5 : 1 } : { opacity: isDragging ? 0.5 : 1 };

  return (
    // 2. Usamos el objeto 'styles' para aplicar nuestras clases de CSS
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={styles.card} // <-- Aquí aplicamos la clase 'card'
      onClick={onClick} 
    >
      <h4 className={styles.title}>{deal.title}</h4>
      <p className={styles.value}>
        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(deal.value || 0)}
      </p>
      {owner && (
        <div className={styles.owner}>
          <img src={owner.avatar || ''} alt={owner.name || 'Avatar'} />
          <span>{owner.name}</span>
        </div>
      )}
    </div>
  );
};

export default DealCard;