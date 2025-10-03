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
type DealAndActivityFormData = { 
  // Campos del Deal
  title: string; 
  account_id: string; 
  value: number; 
  source: string; 
  expected_close_date: string | null; 
  probability: number;
  
  // Campos de la Actividad (pueden estar vacíos)
  activity_type: 'Llamada' | 'Reunión' | 'Email' | 'Otro';
  activity_date_time: string;
  activity_notes: string;
}

const DealCreateModal: FC<DealCreateModalProps> = ({ isOpen, onClose, stageId, pipelineId, accounts }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DealAndActivityFormData>();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const createDealWithActivity = useMutation({
    mutationFn: async (formData: DealAndActivityFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!stageId || !user) throw new Error("Faltan datos de sesión.");

      // --- PASO 1: Crear la Oportunidad (Deal) ---
      const { data: newDeal, error: dealError } = await supabase
        .from('deals')
        .insert({
          title: formData.title,
          account_id: formData.account_id,
          value: formData.value,
          source: formData.source,
          expected_close_date: formData.expected_close_date || null,
          probability: formData.probability,
          stage_id: stageId,
          pipeline_id: pipelineId,
          owner_id: user.id
        })
        .select() // Importante: .select() devuelve el registro que acabamos de crear
        .single(); // .single() nos asegura que obtenemos un solo objeto

      if (dealError) throw new Error(`Error al crear oportunidad: ${dealError.message}`);
      if (!newDeal) throw new Error("No se pudo obtener el ID de la nueva oportunidad.");

      // --- PASO 2: Crear la Actividad (solo si se proporcionaron datos para ella) ---
      if (formData.activity_type && formData.activity_date_time) {
        const { error: activityError } = await supabase
          .from('activities')
          .insert({
            deal_id: newDeal.id, // Usamos el ID del deal recién creado
            type: formData.activity_type,
            date_time: formData.activity_date_time,
            notes: formData.activity_notes,
          });
        
        if (activityError) {
          // Si la actividad falla, el deal ya fue creado. Informamos al usuario.
          toast.error(`Deal creado, pero falló al añadir la actividad: ${activityError.message}`);
          return; // Salimos de la función
        }
      }
    },
    onSuccess: () => {
      toast.success('Oportunidad creada con éxito.');
      queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  useEffect(() => { if (!isOpen) reset(); }, [isOpen, reset]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} data-state={isOpen ? "open" : "closed"} onClick={onClose}>
      <div className={styles.modalPanel} onClick={(e) => e.stopPropagation()}>
        
        {/* --- ENCABEZADO (FIJO) --- */}
        <div className={styles.header}>
          <h3 className={styles.title}>Crear Nueva Oportunidad</h3>
          <button onClick={onClose} className={styles.closeButton}><X size={20} /></button>
        </div>
        
        {/* --- CONTENIDO (DESPLAZABLE) --- */}
        <div className={styles.modalContent}>
          <form id="create-deal-form" onSubmit={handleSubmit(data => createDealWithActivity.mutate(data))}>
            
            <h4 className={styles.sectionTitle}>Detalles de la Oportunidad</h4>
            <div className={styles.formGrid}>
              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label htmlFor="create-title">Título de la Oportunidad</label>
                <input id="create-title" {...register('title', { required: 'El título es obligatorio' })} />
                {errors.title && <p className={styles.errorMessage}>{errors.title.message}</p>}
              </div>
              <div className={styles.field}>
                <label htmlFor="create-account_id">Cuenta / Empresa</label>
                <select id="create-account_id" {...register('account_id', { required: 'Debes seleccionar una cuenta' })}>
                  <option value="">-- Selecciona una cuenta --</option>
                  {accounts.map(acc => ( <option key={acc.id} value={acc.id}>{acc.name}</option> ))}
                </select>
                {errors.account_id && <p className={styles.errorMessage}>{errors.account_id.message}</p>}
              </div>
              <div className={styles.field}>
                <label htmlFor="create-value">Valor (COP)</label>
                <input id="create-value" type="number" {...register('value', { required: 'El valor es obligatorio', valueAsNumber: true, min: { value: 1, message: 'El valor debe ser positivo' } })} />
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
                <input id="create-expected_close_date" type="date" {...register('expected_close_date', { required: 'La fecha de cierre es obligatoria' })} />
                {errors.expected_close_date && <p className={styles.errorMessage}>{errors.expected_close_date.message}</p>}
              </div>
            </div>

            <hr className={styles.sectionSeparator} />

            <h4 className={styles.sectionTitle}>Añadir Primera Actividad (Opcional)</h4>
            <div className={styles.activityForm}>
              <div className={styles.field}>
                  <label htmlFor="create-act-type">Tipo</label>
                  <select id="create-act-type" {...register('activity_type')}>
                      <option value="Llamada">Llamada</option>
                      <option value="Reunión">Reunión</option>
                      <option value="Email">Email</option>
                      <option value="Otro">Otro</option>
                  </select>
              </div>
              <div className={styles.field}>
                  <label htmlFor="create-act-date">Fecha y Hora</label>
                  <input id="create-act-date" type="datetime-local" {...register('activity_date_time')} />
              </div>
              <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label htmlFor="create-act-notes">Notas</label>
                  <textarea id="create-act-notes" {...register('activity_notes')} rows={2}></textarea>
              </div>
            </div>
          </form>
        </div>

        {/* --- PIE DE PÁGINA (FIJO) --- */}
        <div className={styles.footer}>
          <button 
            type="submit" 
            form="create-deal-form"
            disabled={createDealWithActivity.isPending} 
            className={styles.submitButton}
          >
            {createDealWithActivity.isPending ? 'Creando...' : 'Crear Oportunidad'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DealCreateModal;