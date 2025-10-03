'use client'

import { FC, useEffect, useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import StageColumn from './StageColumn'
import DealCard from './DealCard'
import DealEditModal from './DealEditModal'
import DealCreateModal from './DealCreateModal' 
import styles from './KanbanBoard.module.css'
import type { Deal, Stage, UserProfile, Account, Activity} from '@/lib/analyticsHelpers'


interface KanbanBoardProps { pipelineId: string; initialDeals: Deal[]; allStages: Stage[]; allUsers: UserProfile[]; allAccounts: Account[]; allActivities: Activity[]; }

const KanbanBoard: FC<KanbanBoardProps> = ({ pipelineId, initialDeals, allStages, allUsers, allAccounts, allActivities  }) => {
  // --- States (no changes) ---
  const [deals, setDeals] = useState(initialDeals)
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  
  // --- Edit Modal States (no changes) ---
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // --- FIX: Add states for the Create Modal ---
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [stageForNewDealId, setStageForNewDealId] = useState<string | null>(null);

  // --- Hooks and Mutations (no changes) ---
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  useEffect(() => { setDeals(initialDeals) }, [initialDeals]);
  const supabase = createClient();
  const queryClient = useQueryClient();
  const updateDealStage = useMutation({
  mutationFn: async ({ dealId, newStageId }: { dealId: string; newStageId: string }) => {
    const stage = allStages.find(s => s.id === newStageId);
    const isClosingStage = stage?.std_map === 'Ganado' || stage?.std_map === 'Perdido';

    // CORRECCIÓN: Este es el nuevo objeto de actualización. Es mucho más simple.
    const updatePayload: {
      stage_id: string;
      status: string;
      closed_at: string | null;
    } = {
      stage_id: newStageId,
      status: isClosingStage ? 'Cerrada' : 'Abierta',
      closed_at: isClosingStage ? new Date().toISOString() : null,
    };
    
    // NUNCA MÁS MODIFICAMOS EL 'value'
    const { error } = await supabase.from('deals').update(updatePayload).eq('id', dealId);
    if (error) throw new Error(error.message);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
  },
  onError: () => {
    setDeals(initialDeals);
  }
});

  // --- Event Handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find(d => d.id === event.active.id);
    if (deal) setActiveDeal(deal);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeDealId = active.id as string;
      const newStageId = over.id as string;
      
      // La actualización optimista no necesita cambiar.
      // La mutación se encargará de la lógica de negocio.
      setDeals(prev => prev.map(deal => deal.id === activeDealId ? { ...deal, stage_id: newStageId } : deal));
      
      updateDealStage.mutate({ dealId: activeDealId, newStageId });
    }
  };

  const handleOpenEditModal = (deal: Deal) => {
    setSelectedDeal(deal);
    setEditModalOpen(true);
  };
  const handleCloseEditModal = () => setEditModalOpen(false);

  // --- FIX: Add handlers for the Create Modal ---
  const handleOpenCreateModal = (stageId: string) => {
    setStageForNewDealId(stageId);
    setCreateModalOpen(true);
  };
  const handleCloseCreateModal = () => setCreateModalOpen(false);
  
  const stagesForPipeline = allStages.filter(stage => stage.pipeline_id === pipelineId).sort((a, b) => a.order - b.order);
  const activeDealOwner = allUsers.find(user => user.id === activeDeal?.owner_id);

return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className={styles.boardGrid}>
          {stagesForPipeline.map(stage => {
            const dealsForStage = deals.filter(deal => deal.stage_id === stage.id);
            return (
              <StageColumn
                key={stage.id}
                stage={stage}
                deals={dealsForStage}
                users={allUsers}
                onAddDeal={() => handleOpenCreateModal(stage.id)}
              >
                {dealsForStage.map(deal => {
                  const owner = allUsers.find(user => user.id === deal.owner_id);
                  // CORRECCIÓN: Buscamos el nombre del cliente
                  const client = allAccounts.find(acc => acc.id === deal.account_id);
                  
                  return (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      owner={owner}
                      clientName={client?.name || 'N/A'}
                      activities={allActivities}
                      onCardClick={() => handleOpenEditModal(deal)}
                    />
                  );
                })}
              </StageColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <DealCard
              deal={activeDeal}
              owner={activeDealOwner}
              clientName={allAccounts.find(acc => acc.id === activeDeal.account_id)?.name || 'N/A'}
              activities={allActivities}
              onCardClick={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Los modales no cambian */}
      <DealEditModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} deal={selectedDeal} activities={allActivities} />
      <DealCreateModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        stageId={stageForNewDealId}
        pipelineId={pipelineId}
        accounts={allAccounts}
        
      />
    </>
  );
}

export default KanbanBoard;