// components/DealEditModal.tsx
'use client'

import { FC, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
// Importamos los estilos del modal unificado
import styles from './Modal.module.css'

// Tipos
type Deal = { id: string; title: string; value: number | null; pain: string | null; }
interface DealEditModalProps { isOpen: boolean; onClose: () => void; deal: Deal | null; }
type DealFormData = { title: string; value: number; pain: string; }

const DealEditModal: FC<DealEditModalProps> = ({ isOpen, onClose, deal }) => {
  const { register, handleSubmit, reset } = useForm<DealFormData>();
  const supabase = createClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Sincroniza el formulario con los datos del 'deal' seleccionado
    if (deal) {
      reset({ title: deal.title || '', value: deal.value || 0, pain: deal.pain || '' });
    }
  }, [deal, reset]);

  // Mutación para actualizar
  const updateDeal = useMutation({
    mutationFn: async (updatedData: DealFormData) => {
      if (!deal) throw new Error("No hay oportunidad para actualizar");
      const { error } = await supabase.from('deals').update(updatedData).eq('id', deal.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Oportunidad actualizada');
      queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
      onClose();
    },
    onError: (error) => toast.error(`Error: ${error.message}`)
  });

  // Mutación para eliminar
  const deleteDeal = useMutation({
    mutationFn: async () => {
      if (!deal) throw new Error("No hay oportunidad para eliminar");
      const { error } = await supabase.from('deals').delete().eq('id', deal.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Oportunidad eliminada');
      queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
      onClose();
    },
    onError: (error) => toast.error(`Error: ${error.message}`)
  });

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${deal?.title}"?`)) {
      deleteDeal.mutate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} data-state={isOpen ? "open" : "closed"} onClick={onClose}>
      <div className={styles.modalPanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Editar Oportunidad</h3>
          <button onClick={onClose} className={styles.closeButton}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit(data => updateDeal.mutate(data))}>
          <div className={`${styles.field} ${styles.fullWidth}`}>
            <label htmlFor="edit-title">Título</label>
            <input id="edit-title" {...register('title', { required: true })} />
          </div>

          <div className={styles.formGrid} style={{marginTop: '16px'}}>
            <div className={styles.field}>
              <label htmlFor="edit-value">Valor</label>
              <input id="edit-value" type="number" {...register('value', { valueAsNumber: true })} />
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="edit-pain">Dolor del Cliente</label>
              <textarea id="edit-pain" {...register('pain')} />
            </div>
          </div>
          
          <div className={styles.footer}>
            <button type="button" onClick={handleDelete} disabled={deleteDeal.isPending} className={styles.deleteButton}>
              {deleteDeal.isPending ? 'Eliminando...' : 'Eliminar'}
            </button>
            <button type="submit" disabled={updateDeal.isPending} className={styles.submitButton}>
              {updateDeal.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DealEditModal;