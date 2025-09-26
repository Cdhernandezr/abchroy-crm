// components/KanbanBoard.tsx
'use client'

import { FC, useEffect, useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import StageColumn from './StageColumn'
import DealCard from './DealCard'
import { Plus } from 'lucide-react'
import DealEditModal from './DealEditModal'
import toast from 'react-hot-toast';
import DealCreateModal from './DealCreateModal';

// Tipos
type UserProfile = { id: string; name: string | null; avatar: string | null }
type Deal = { id: string; title: string; value: number | null; owner_id: string | null; stage_id: string; pain: string | null; }
type Stage = { id: string; name: string; pipeline_id: string; order: number }
type Account = { id: string; name: string; };

interface KanbanBoardProps {
  pipelineId: string;
  allStages: Stage[];
  allDeals: Deal[];
  allUsers: UserProfile[];
  allAccounts: Account[];
}

const KanbanBoard: FC<KanbanBoardProps> = ({ pipelineId, allStages, allDeals, allUsers, allAccounts }) => {
  const [deals, setDeals] = useState(allDeals)
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [stageForNewDeal, setStageForNewDeal] = useState<string | null>(null);

  //Configuración de sensores para DND Kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Le decimos a DND Kit que no inicie un drag hasta que el puntero se mueva 5px.
      // ¡Esto permite que los eventos 'onClick' se disparen si no hay movimiento!
      activationConstraint: {
        distance: 5,
      },
    })
  )
  
  useEffect(() => { setDeals(allDeals) }, [allDeals])
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Mutación para actualizar la etapa de un deal
  const updateDealStage = useMutation({
    mutationFn: async ({ dealId, newStageId }: { dealId: string; newStageId: string }) => {
      const { error } = await supabase.from('deals').update({ stage_id: newStageId }).eq('id', dealId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
    },
    onError: (error) => {
      toast.error(`Error al mover la oportunidad: ${error.message}`);
      console.error("Error al mover el deal:", error);
      setDeals(allDeals); // Revertimos el cambio optimista
    }
  });

/*   const createDeal = useMutation({
    mutationFn: async ({ title, stageId }: { title: string, stageId: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('deals').insert({
        title,
        stage_id: stageId,
        pipeline_id: pipelineId,
        account_id: 'a9e7f7b7-4c5b-4b8c-8c5e-8d8f9a0c1b2d', // ❗ Recordatorio: Esto debe ser dinámico en el futuro
        owner_id: userData.user?.id
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Oportunidad creada con éxito!");
      queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
    }
    ,
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  }); */

  const handleCardClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDeal(null);
  }

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setStageForNewDeal(null);
  }

  const handleCreateDeal = (stageId: string) => {
    setStageForNewDeal(stageId);
    setCreateModalOpen(true);
  }

  const handleDragStart = (event: DragStartEvent) => {
    const draggedId = event.active.id as string;
    const deal = deals.find(d => d.id === draggedId);
    if (deal) setActiveDeal(deal);
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeDealId = active.id as string;
      const newStageId = over.id as string;
      setDeals(prevDeals => prevDeals.map(deal => deal.id === activeDealId ? { ...deal, stage_id: newStageId } : deal));
      updateDealStage.mutate({ dealId: activeDealId, newStageId });
    }
  }

  const stagesForPipeline = allStages
    .filter(stage => stage.pipeline_id === pipelineId)
    .sort((a, b) => a.order - b.order);

  const activeDealOwner = allUsers.find(user => user.id === activeDeal?.owner_id);

  return (
    <>
      {/* 3. PASAMOS LOS SENSORES AL CONTEXTO */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {stagesForPipeline.map(stage => {
            const dealsForStage = deals.filter(deal => deal.stage_id === stage.id);
            return (
              <StageColumn key={stage.id} stage={stage} deals={dealsForStage} users={allUsers}>
                {dealsForStage.map(deal => {
                  const owner = allUsers.find(user => user.id === deal.owner_id);
                  return (
                    // El código de DealCard aquí ya estaba bien, pasaba el onClick correctamente
                    <DealCard
                      key={deal.id}
                      dealId={deal.id}
                      deal={deal}
                      owner={owner}
                      onClick={() => handleCardClick(deal)}
                    />
                  );
                })}
                <button onClick={() => handleCreateDeal(stage.id)} className="w-full text-left text-sm text-gray-400 p-2 rounded-md hover:bg-gray-700 flex items-center mt-2">
                  <Plus size={16} className="mr-2" /> Añadir oportunidad
                </button>
              </StageColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <DealCard
              dealId={activeDeal.id}
              deal={activeDeal}
              owner={activeDealOwner}
              isOverlay={true}
              onClick={() => {}} // El overlay no necesita un onClick
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <DealEditModal isOpen={isModalOpen} onClose={closeModal} deal={selectedDeal} />
      <DealCreateModal 
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        stageId={stageForNewDeal}
        pipelineId={pipelineId}
        accounts={allAccounts}
      />
    </>
  );
}

export default KanbanBoard;