'use client'

import { FC } from 'react'
import { useDraggable } from '@dnd-kit/core'
import styles from './DealCard.module.css'
import { AlertTriangle, ListTodo } from 'lucide-react'
import type { Deal, UserProfile } from '@/lib/analyticsHelpers'

// Función auxiliar para calcular la edad en días
const daysSince = (dateString: string) => {
    const d1 = new Date(dateString).getTime();
    const d2 = new Date().getTime();
    return Math.round((d2 - d1) / (1000 * 3600 * 24));
}

// Función auxiliar para verificar si una fecha está vencida
const isOverdue = (dateString: string | null) => {
    if (!dateString) return false;
    const dueDate = new Date(dateString).getTime();
    const today = new Date().setHours(0,0,0,0); // Medianoche de hoy
    return dueDate < today;
}

interface DealCardProps {
  deal: Deal;
  owner: UserProfile | undefined;
  clientName: string;
  onCardClick: () => void;
}

const DealCard: FC<DealCardProps> = ({ deal, owner, clientName, onCardClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const cardClasses = `${styles.card} ${isDragging ? styles.dragging : ''}`;
  
  const dueDateClass = `${styles.tag} ${styles.dueDate} ${isOverdue(deal.expected_close_date) ? styles.overdue : ''}`;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes} 
      className={cardClasses}
      onClick={onCardClick}
    >
      <h4 className={styles.title}>{deal.title}</h4>
      
      {/* Mostramos los nuevos tags de información */}
      <div className={styles.meta}>
        <span className={styles.tag}>{clientName}</span>
        
        <span className={`${styles.tag} ${styles.value}`}>
          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(deal.value || 0)}
        </span>

        <span className={styles.tag}>{daysSince(deal.created_at)}d</span>
        
        {deal.probability && (
          <span className={styles.tag}>{deal.probability}%</span>
        )}
        
        {deal.expected_close_date && (
          <span className={dueDateClass}>
            Vence: {new Date(deal.expected_close_date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

            <div className={`${styles.nextStepSection} ${!deal.next_steps ? styles.warning : ''}`}>
        {deal.next_steps ? (
          <>
            <ListTodo size={16} />
            <span className={styles.nextStepText}>
              {deal.next_steps}
            </span>
          </>
        ) : (
          <>
            <AlertTriangle size={16} />
            <span>Sin próximos pasos</span>
          </>
        )}
      </div>

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