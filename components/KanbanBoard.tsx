'use client'

import { FC, useEffect, useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import StageColumn from './StageColumn'
import DealCard from './DealCard'
import DealEditModal from './DealEditModal'
import DealCreateModal from './DealCreateModal' // Make sure this is imported

// --- Type definitions (no changes) ---
type UserProfile = { id: string; name: string | null; avatar: string | null; };
type Deal = { id: string; title: string; value: number | null; owner_id: string | null; stage_id: string; pain: string | null; };
type Stage = { id: string; name: string; pipeline_id: string; order: number; };
type Account = { id: string; name: string; };
interface KanbanBoardProps { pipelineId: string; allStages: Stage[]; allDeals: Deal[]; allUsers: UserProfile[]; allAccounts: Account[]; }

const KanbanBoard: FC<KanbanBoardProps> = ({ pipelineId, allStages, allDeals, allUsers, allAccounts }) => {
  // --- States (no changes) ---
  const [deals, setDeals] = useState(allDeals)
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  
  // --- Edit Modal States (no changes) ---
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // --- FIX: Add states for the Create Modal ---
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [stageForNewDealId, setStageForNewDealId] = useState<string | null>(null);

  // --- Hooks and Mutations (no changes) ---
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  useEffect(() => { setDeals(allDeals) }, [allDeals]);
  const supabase = createClient();
  const queryClient = useQueryClient();
  const updateDealStage = useMutation({
    mutationFn: async ({ dealId, newStageId }: { dealId: string; newStageId: string }) => {
      const { error } = await supabase.from('deals').update({ stage_id: newStageId }).eq('id', dealId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kanban-data'] }),
    onError: () => setDeals(allDeals)
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
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
          {stagesForPipeline.map(stage => {
            const dealsForStage = deals.filter(deal => deal.stage_id === stage.id);
            return (
              <StageColumn
                key={stage.id}
                stage={stage}
                deals={dealsForStage}
                users={allUsers}
                // FIX: Pass the function to open the modal
                onAddDeal={() => handleOpenCreateModal(stage.id)}
              >
                {dealsForStage.map(deal => {
                  const owner = allUsers.find(user => user.id === deal.owner_id);
                  return (
                    <DealCard
                      key={deal.id}
                      dealId={deal.id}
                      deal={deal}
                      owner={owner}
                      onClick={() => handleOpenEditModal(deal)}
                    />
                  );
                })}
              </StageColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <DealCard dealId={activeDeal.id} deal={activeDeal} owner={activeDealOwner} isOverlay onClick={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <DealEditModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} deal={selectedDeal} />
      {/* FIX: Render the Create Modal and pass its state and handlers */}
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