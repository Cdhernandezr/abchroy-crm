'use client'

import { FC, useMemo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import styles from './DealCard.module.css'
import { AlertTriangle, Phone, Users, Mail, CheckCircle } from 'lucide-react' 
import type { Deal, UserProfile, Activity } from '@/lib/analyticsHelpers'

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

 // Objeto para mapear el tipo de actividad a su ícono correspondiente
const activityIcons = {
  'Llamada': <Phone size={16} />,
  'Reunión': <Users size={16} />,
  'Email': <Mail size={16} />,
  'Mensaje': <Mail size={16} />,
  'Otro': <CheckCircle size={16} />,
};

interface DealCardProps {
  deal: Deal;
  owner: UserProfile | undefined;
  clientName: string;
  activities: Activity[];
  onCardClick: () => void;
}

const DealCard: FC<DealCardProps> = ({ deal, owner, clientName, activities, onCardClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const cardClasses = `${styles.card} ${isDragging ? styles.dragging : ''}`;
  const dueDateClass = `${styles.tag} ${styles.dueDate} ${isOverdue(deal.expected_close_date) ? styles.overdue : ''}`;
  const nextActivity = useMemo(() => {
    // Filtra las actividades solo para este deal y que no estén completadas
    const pendingActivities = activities
      .filter(act => act.deal_id === deal.id && !act.done);
    
    // Si no hay actividades pendientes, devuelve null
    if (pendingActivities.length === 0) return null;

    // Ordena las actividades por fecha para encontrar la más próxima en el futuro
    pendingActivities.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
    
    // Devuelve la primera de la lista ordenada
    return pendingActivities[0];
  }, [deal.id, activities]);

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

      <div className={`${styles.nextStepSection} ${!nextActivity ? styles.warning : ''}`}>
        {nextActivity ? (
          <>
            {activityIcons[nextActivity.type] || <CheckCircle size={16} />}
            <span className={styles.nextStepText}>
              {nextActivity.type}
            </span>
            <span className={styles.nextStepDate}>
              {new Date(nextActivity.date_time).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
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