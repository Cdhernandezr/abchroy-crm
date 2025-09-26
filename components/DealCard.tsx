// components/DealCard.tsx
import { FC } from 'react'
import { useDraggable } from '@dnd-kit/core'

// Tipos (sin cambios)
type UserProfile = { id: string; name: string | null; avatar: string | null }
type Deal = { id: string; title: string; value: number | null; owner_id: string | null }

interface DealCardProps {
  dealId: string;
  deal: Deal;
  owner: UserProfile | undefined;
  isOverlay?: boolean; // Prop para saber si es el clon del overlay
  onClick: () => void;
}

const DealCard: FC<DealCardProps> = ({ dealId, deal, owner, isOverlay = false , onClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dealId,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  // 1. DEFINIMOS LAS CLASES DE ESTILO
  // Usamos 'clsx' o una lógica similar para unir clases condicionalmente.
  // Si no tienes clsx, puedes instalarlo con 'npm install clsx' o usar template strings.
  const cardClasses = [
    "bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-sm",
    isOverlay 
      ? "cursor-grabbing ring-2 ring-blue-500" // Estilo para el clon en el overlay
      : "hover:border-blue-500 cursor-grab active:cursor-grabbing",
    isDragging && !isOverlay 
      ? "opacity-30" // Estilo para la tarjeta original mientras se arrastra
      : "opacity-100",
  ].join(' ')

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={cardClasses}
      onClick={onClick} 
    >
      <h3 className="font-semibold text-sm text-white">{deal.title}</h3>
      <p className="text-xs text-gray-400 mt-1">
        Valor: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(deal.value || 0)}
      </p>
      {owner && (
        <div className="flex items-center mt-3">
          <img src={owner.avatar || ''} alt={owner.name || 'Avatar'} className="w-6 h-6 rounded-full" />
          <span className="text-xs text-gray-300 ml-2">{owner.name}</span>
        </div>
      )}
    </div>
  )
}

export default DealCard