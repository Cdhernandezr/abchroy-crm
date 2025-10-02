// components/DealEditModal.tsx
'use client'

import { FC, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import styles from './Modal.module.css'
import type { Deal } from '@/lib/analyticsHelpers'

// Tipos
//type Deal = { id: string; title: string; value: number | null; pain: string | null; }
interface DealEditModalProps { isOpen: boolean; onClose: () => void; deal: Deal | null; }
type DealFormData = { title: string; value: number; pain: string; source: string; expected_close_date: string; probability: number; next_steps: string; }

const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}


const DealEditModal: FC<DealEditModalProps> = ({ isOpen, onClose, deal }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DealFormData>();
  const supabase = createClient();
  const queryClient = useQueryClient();

useEffect(() => {
    // 2. Sincronizamos el formulario con TODOS los datos del 'deal'
    if (deal) {
      reset({
        title: deal.title || '',
        value: deal.value || 0,
        pain: deal.pain || '',
        source: deal.source || '',
        expected_close_date: formatDateForInput(deal.expected_close_date),
        probability: deal.probability || 0,
        next_steps: deal.next_steps || '',
      });
    }
  }, [deal, reset]);

  // Mutación para actualizar
  const updateDeal = useMutation({
    mutationFn: async (updatedData: DealFormData) => {
      if (!deal) throw new Error("No hay oportunidad para actualizar");
      const dataToUpdate = {
        ...updatedData,
        expected_close_date: updatedData.expected_close_date || null,
      };

      const { error } = await supabase.from('deals').update(dataToUpdate).eq('id', deal.id);
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
          <div className={styles.formGrid}>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="edit-title">Título</label>
              <input id="edit-title" {...register('title', { required: true })} />
            </div>

            <div className={styles.field}>
              <label htmlFor="edit-value">Valor (COP)</label>
              <input id="edit-value" type="number" {...register('value', { 
                  required: 'El valor es obligatorio',
                  valueAsNumber: true,
                  min: { value: 1, message: 'El valor debe ser positivo' }
              })} />
              {errors.value && <p className={styles.errorMessage}>{errors.value.message}</p>}
            </div>

            <div className={styles.field}>
                <label htmlFor="edit-probability">Probabilidad (%)</label>
                <input id="edit-probability" type="number" min="0" max="100" {...register('probability', { valueAsNumber: true })} />
            </div>

            <div className={styles.field}>
              <label htmlFor="edit-source">Fuente / Origen</label>
              <select id="edit-source" {...register('source')}>
                <option value="">-- Selecciona una fuente --</option>
                <option value="Referido">Referido</option>
                <option value="Página Web">Página Web</option>
                <option value="Llamada en frío">Llamada en frío</option>
                <option value="Feria comercial">Feria comercial</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="edit-expected_close_date">Fecha de Cierre Estimada</label>
              {/* 3. AÑADIMOS REGLA DE VALIDACIÓN */}
              <input id="edit-expected_close_date" type="date" {...register('expected_close_date', {
                  required: 'La fecha de cierre es obligatoria'
              })} />
              {errors.expected_close_date && <p className={styles.errorMessage}>{errors.expected_close_date.message}</p>}
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="edit-pain">Dolor del Cliente</label>
              <textarea id="edit-pain" {...register('pain')} />
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="edit-next_steps">Próximos Pasos</label>
              <textarea id="edit-next_steps" {...register('next_steps')} />
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