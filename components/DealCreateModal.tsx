// components/DealEditModal.tsx
'use client'

import { FC, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import styles from './Modal.module.css'

// Tipos
type Account = { id: string; name: string; }
interface DealCreateModalProps { isOpen: boolean; onClose: () => void; stageId: string | null; pipelineId: string; accounts: Account[]; }
type DealFormData = { title: string; account_id: string; value: number; source: string; expected_close_date: string; probability: number; }

const DealCreateModal: FC<DealCreateModalProps> = ({ isOpen, onClose, stageId, pipelineId, accounts }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DealFormData>();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const createDeal = useMutation({
    // 2. La mutación ahora recibe todos los nuevos datos
    mutationFn: async (formData: DealFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!stageId || !user) throw new Error("Faltan datos para crear la oportunidad.");
      const dataToInsert = {
        ...formData,
        expected_close_date: formData.expected_close_date || null,
        stage_id: stageId,
        pipeline_id: pipelineId,
        owner_id: user.id
      };

      const { error } = await supabase.from('deals').insert(dataToInsert);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Nueva oportunidad creada!');
      queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
      onClose();
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`)
  });

  useEffect(() => { if (!isOpen) reset(); }, [isOpen, reset]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} data-state={isOpen ? "open" : "closed"} onClick={onClose}>
      <div className={styles.modalPanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Crear Nueva Oportunidad</h3>
          <button onClick={onClose} className={styles.closeButton}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit(data => createDeal.mutate(data))}>
          <div className={styles.formGrid}>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="create-title">Título de la Oportunidad</label>
                <input 
                  id="create-title" 
                  {...register('title', { required: 'El título es obligatorio' })} 
                />
                {errors.title && <p className={styles.errorMessage}>{errors.title.message}</p>}
            </div>

            <div className={styles.field}>
              <label htmlFor="create-account_id">Cuenta / Empresa</label>
              <select id="create-account_id" {...register('account_id', { required: true })}>
                <option value="">-- Selecciona una cuenta --</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.field}>
              <label htmlFor="create-value">Valor (COP)</label>
              <input id="create-value" type="number" {...register('value', { 
                  required: 'El valor es obligatorio',
                  valueAsNumber: true,
                  min: { value: 1, message: 'El valor debe ser positivo' }
              })} />
              {errors.value && <p className={styles.errorMessage}>{errors.value.message}</p>}
            </div>

            <div className={styles.field}>
              <label htmlFor="create-source">Fuente / Origen</label>
              <select id="create-source" {...register('source')}>
                <option value="">-- Selecciona una fuente --</option>
                <option value="Referido">Referido</option>
                <option value="Página Web">Página Web</option>
                <option value="Llamada en frío">Llamada en frío</option>
                <option value="Feria comercial">Feria comercial</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="create-probability">Probabilidad (%)</label>
              <input id="create-probability" type="number" min="0" max="100" {...register('probability', { valueAsNumber: true })} />
            </div>
            
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="create-expected_close_date">Fecha de Cierre Estimada</label>
              {/* 3. AÑADIMOS REGLA DE VALIDACIÓN */}
              <input id="create-expected_close_date" type="date" {...register('expected_close_date', {
                  required: 'La fecha de cierre es obligatoria'
              })} />
              {errors.expected_close_date && <p className={styles.errorMessage}>{errors.expected_close_date.message}</p>}
            </div>
          </div>

          <div className={styles.footer}>
            <button type="submit" disabled={createDeal.isPending} className={styles.submitButton}>
              {createDeal.isPending ? 'Creando...' : 'Crear Oportunidad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DealCreateModal;