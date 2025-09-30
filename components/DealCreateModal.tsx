// components/DealEditModal.tsx
'use client'

import { FC, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
// Importamos los nuevos estilos del modal
import styles from './Modal.module.css'

// Tipos
type Account = { id: string; name: string; }
interface DealCreateModalProps { isOpen: boolean; onClose: () => void; stageId: string | null; pipelineId: string; accounts: Account[]; }
type DealFormData = { title: string; account_id: string; }

const DealCreateModal: FC<DealCreateModalProps> = ({ isOpen, onClose, stageId, pipelineId, accounts }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DealFormData>();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const createDeal = useMutation({
    mutationFn: async ({ title, account_id }: DealFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!stageId || !user) throw new Error("Faltan datos para crear la oportunidad.");
      const { error } = await supabase.from('deals').insert({ title, account_id, stage_id: stageId, pipeline_id: pipelineId, owner_id: user.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Nueva oportunidad creada!');
      queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
      onClose();
    },
    onError: (error) => toast.error(`Error: ${error.message}`)
  });

  useEffect(() => { if (!isOpen) reset({ title: '', account_id: '' }); }, [isOpen, reset]);

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
            <div className={styles.field}>
              <label htmlFor="title">Título de la Oportunidad</label>
              <input id="title" {...register('title', { required: 'El título es obligatorio' })} />
              {/* Aquí podrías añadir un mensaje de error si lo deseas */}
            </div>

            <div className={styles.field}>
              <label htmlFor="account_id">Cuenta / Empresa</label>
              <select id="account_id" {...register('account_id', { required: 'Debes seleccionar una cuenta' })}>
                <option value="">-- Selecciona una cuenta --</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
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