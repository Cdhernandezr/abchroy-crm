// components/StageColumn.tsx
import { FC } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { User } from '@supabase/supabase-js';

// No necesitamos importar DealCard aquí porque se renderiza desde el componente padre.

// Tipos de datos que necesita la columna para su cabecera
type UserProfile = { id: string; name: string | null; avatar: string | null };
type Deal = { id: string; value: number | null; }
type Stage = { id: string; name: string }

interface StageColumnProps {
  stage: Stage;
  deals: Deal[]; // Aún recibimos deals para calcular el total
  users: UserProfile[]; // Recibimos los usuarios para pasarlos a DealCard
  children: React.ReactNode; // Recibimos los componentes a renderizar
}

const StageColumn: FC<StageColumnProps> = ({ stage, deals, children }) => {
  const { setNodeRef } = useDroppable({
    id: stage.id,
  })

  // Calculamos el valor total de la columna
  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0)

  return (
    <div ref={setNodeRef} className="bg-gray-900/50 w-72 flex-shrink-0 rounded-xl flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Cabecera de la Columna */}
      <div className="p-3 border-b border-gray-700 flex-shrink-0">
        <h2 className="font-bold text-md">{stage.name} ({deals.length})</h2>
        <p className="text-xs text-gray-400">
          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(totalValue)}
        </p>
      </div>

      {/* Contenido de la Columna (Tarjetas y Botón) */}
      <div className="p-2 space-y-2 overflow-y-auto">
        {/* Aquí renderizamos lo que nos pasa el componente padre */}
        {children}
      </div>
    </div>
  )
}

export default StageColumn