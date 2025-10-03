'use client'

import { FC, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { X, Phone, Users, Mail, CheckCircle } from 'lucide-react'
import styles from './Modal.module.css'
import type { Deal, Activity } from '@/lib/analyticsHelpers'

const activityIcons = {
  'Llamada': <Phone size={18} className={styles.activityIcon} />,
  'Reunión': <Users size={18} className={styles.activityIcon} />,
  'Email': <Mail size={18} className={styles.activityIcon} />,
  'Mensaje': <Mail size={18} className={styles.activityIcon} />,
  'Otro': <CheckCircle size={18} className={styles.activityIcon} />,
};

interface DealEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  activities: Activity[];
}

// Tipos para los dos formularios que manejaremos
type DealFormData = { title: string; value: number; pain: string; source: string; expected_close_date: string | null; probability: number; };
type ActivityFormData = { type: 'Llamada' | 'Reunión' | 'Email' | 'Otro' | 'Mensaje'; date_time: string; notes: string; };

const formatDateForInput = (dateString: string | null, type: 'date' | 'datetime-local') => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    if (type === 'date') {
        return date.toISOString().split('T')[0];
    }
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const DealEditModal: FC<DealEditModalProps> = ({ isOpen, onClose, deal, activities }) => {
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

  const { register: registerDeal, handleSubmit: handleDealSubmit, reset: resetDealForm, formState: { errors: dealErrors } } = useForm<DealFormData>();
  const { register: registerActivity, handleSubmit: handleActivitySubmit, reset: resetActivityForm, setValue: setActivityValue } = useForm<ActivityFormData>();

  const supabase = createClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (deal) {
      resetDealForm({
        title: deal.title || '', value: deal.value || 0, pain: deal.pain || '',
        source: deal.source || '', expected_close_date: formatDateForInput(deal.expected_close_date, 'date'),
        probability: deal.probability || 0,
      });
    }
  }, [deal, resetDealForm]);

  const { pendingActivities, completedActivities } = useMemo(() => {
    if (!deal) return { pendingActivities: [], completedActivities: [] };
    const dealActivities = activities.filter(act => act.deal_id === deal.id)
      .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());
    return {
      pendingActivities: dealActivities.filter(act => !act.done),
      completedActivities: dealActivities.filter(act => act.done),
    };
  }, [deal, activities]);

  const updateDeal = useMutation({
    mutationFn: async (updatedData: DealFormData) => {
      if (!deal) throw new Error("No hay oportunidad para actualizar");
      const dataToUpdate = { ...updatedData, expected_close_date: updatedData.expected_close_date || null };
      const { error } = await supabase.from('deals').update(dataToUpdate).eq('id', deal.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Oportunidad actualizada');
      queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
      onClose(); // Cerramos el modal después de guardar con éxito.
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`)
  });

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
    onError: (error: Error) => toast.error(`Error: ${error.message}`)
  });

  const createActivity = useMutation({
    mutationFn: async (newActivity: ActivityFormData) => {
      if (!deal) throw new Error("No hay oportunidad seleccionada.");
      const { error } = await supabase.from('activities').insert({ ...newActivity, deal_id: deal.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
      toast.success('Actividad añadida.');
      resetActivityForm();
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const updateActivity = useMutation({
    mutationFn: async (payload: { activityId: string } & Partial<Activity>) => {
      const { activityId, ...updateData } = payload;
      const { error } = await supabase.from('activities').update(updateData).eq('id', activityId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
      toast.success('Actividad actualizada.');
      setEditingActivityId(null);
      resetActivityForm();
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${deal?.title}"?`)) {
      deleteDeal.mutate();
    }
  };

  const handleStartEditActivity = (activity: Activity) => {
    setEditingActivityId(activity.id);
    setActivityValue('type', activity.type);
    setActivityValue('date_time', formatDateForInput(activity.date_time, 'datetime-local'));
    setActivityValue('notes', activity.notes || '');
  };

  const handleCancelEdit = () => {
    setEditingActivityId(null);
    resetActivityForm();
  };

  const onSaveActivityEdit = (data: ActivityFormData) => {
    if (!editingActivityId) return;
    updateActivity.mutate({ activityId: editingActivityId, ...data });
  };

  if (!isOpen || !deal) return null;

  return (
    <div className={styles.modalOverlay} data-state={isOpen ? "open" : "closed"} onClick={onClose}>
      <div className={styles.modalPanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{deal.title}</h3>
          <button onClick={onClose} className={styles.closeButton}><X size={20} /></button>
        </div>
        
        <div className={styles.modalContent}>
          <form id="edit-deal-form" onSubmit={handleDealSubmit(data => updateDeal.mutate(data))}>
            <h4 className={styles.sectionTitle}>Detalles de la Oportunidad</h4>
            <div className={styles.formGrid}>
              <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label htmlFor="edit-title">Título</label>
                  <input id="edit-title" {...registerDeal('title', { required: 'El título es obligatorio' })} />
                  {dealErrors.title && <p className={styles.errorMessage}>{dealErrors.title.message}</p>}
              </div>
              <div className={styles.field}>
                  <label htmlFor="edit-value">Valor (COP)</label>
                  <input id="edit-value" type="number" {...registerDeal('value', { valueAsNumber: true, required: 'El valor es obligatorio', min: { value: 1, message: 'El valor debe ser positivo' } })} />
                  {dealErrors.value && <p className={styles.errorMessage}>{dealErrors.value.message}</p>}
              </div>
              <div className={styles.field}>
                  <label htmlFor="edit-probability">Probabilidad (%)</label>
                  <input id="edit-probability" type="number" min="0" max="100" {...registerDeal('probability', { valueAsNumber: true })} />
              </div>
              <div className={styles.field}>
                  <label htmlFor="edit-source">Fuente / Origen</label>
                  <select id="edit-source" {...registerDeal('source')}>
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
                  <input id="edit-expected_close_date" type="date" {...registerDeal('expected_close_date', { required: 'La fecha es obligatoria' })} />
                  {dealErrors.expected_close_date && <p className={styles.errorMessage}>{dealErrors.expected_close_date.message}</p>}
              </div>
              <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label htmlFor="edit-pain">Dolor del Cliente</label>
                  <textarea id="edit-pain" {...registerDeal('pain')} />
              </div>
            </div>
          </form>

          <hr className={styles.sectionSeparator} />

          <div className={styles.activitySection}>
            <h4 className={styles.sectionTitle}>Actividades</h4>
            <div className={styles.activityList}>
              {pendingActivities.map(act => (
                <div key={act.id} className={`${styles.activityItem} ${editingActivityId !== act.id ? styles.editable : ''}`}>
                  {editingActivityId === act.id ? (
                    <form onSubmit={handleActivitySubmit(onSaveActivityEdit)} className={styles.activityEditForm}>
                      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                        <div className={styles.field}>
                          <label htmlFor={`edit-act-type-${act.id}`}>Tipo</label>
                          <select id={`edit-act-type-${act.id}`} {...registerActivity('type', { required: true })}>
                            <option>Llamada</option><option>Reunión</option><option>Email</option><option>Mensaje</option><option>Otro</option>
                          </select>
                        </div>
                        <div className={styles.field}>
                          <label htmlFor={`edit-act-date-${act.id}`}>Fecha y Hora</label>
                          <input id={`edit-act-date-${act.id}`} type="datetime-local" {...registerActivity('date_time', { required: true })} />
                        </div>
                      </div>
                      <div className={styles.field}>
                        <label htmlFor={`edit-act-notes-${act.id}`}>Notas</label>
                        <textarea id={`edit-act-notes-${act.id}`} {...registerActivity('notes')} rows={2}></textarea>
                      </div>
                      <div className={styles.editActions}>
                        <button type="button" onClick={handleCancelEdit} className={`${styles.smallButton} ${styles.cancelButton}`}>Cancelar</button>
                        <button type="submit" className={`${styles.smallButton} ${styles.saveButton}`}>Guardar</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {activityIcons[act.type]}
                      <div className={styles.activityDetails} onClick={() => handleStartEditActivity(act)}>
                        <div className={styles.activityHeader}>
                          <span>{act.type}</span>
                          <span>{new Date(act.date_time).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric' })}</span>
                        </div>
                        <p className={styles.activityNotes}>{act.notes}</p>
                      </div>
                      <input type="checkbox" className={styles.doneCheckbox} checked={act.done}
                        onChange={() => updateActivity.mutate({ activityId: act.id, done: true })}
                      />
                    </>
                  )}
                </div>
              ))}
              {pendingActivities.length === 0 && <p style={{color: 'var(--brand-muted)', fontSize: '13px'}}>No hay actividades pendientes.</p>}
            </div>

            {!editingActivityId && (
              <form onSubmit={handleActivitySubmit(data => createActivity.mutate(data))} className={styles.activityForm}>
                <h4 className={styles.sectionTitle} style={{marginTop: '24px', gridColumn: '1 / -1'}}>Añadir Nueva Actividad</h4>
                <div className={styles.field}>
                    <label htmlFor="act-type">Tipo</label>
                    <select id="act-type" {...registerActivity('type', { required: true })}>
                        <option>Llamada</option><option>Reunión</option><option>Email</option><option>Mensaje</option><option>Otro</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label htmlFor="act-date">Fecha y Hora</label>
                    <input id="act-date" type="datetime-local" {...registerActivity('date_time', { required: true })} />
                </div>
                <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label htmlFor="act-notes">Notas</label>
                    <textarea id="act-notes" {...registerActivity('notes')} rows={2}></textarea>
                </div>
                <div className={`${styles.field} ${styles.fullWidth}`}>
                    <button type="submit" className={styles.addActivityButton} disabled={createActivity.isPending}>
                      {createActivity.isPending ? 'Añadiendo...' : 'Añadir Actividad'}
                    </button>
                </div>
              </form>
            )}
            
            {completedActivities.length > 0 && (
              <>
                <h4 className={styles.sectionTitle} style={{marginTop: '24px'}}>Actividades Completadas</h4>
                <div className={styles.activityList}>
                  {completedActivities.map(act => (
                    <div key={act.id} className={`${styles.activityItem} ${styles.activityItemDone}`}>
                      {activityIcons[act.type]}
                      <div className={styles.activityDetails}>
                        <div className={styles.activityHeader}>
                          <span>{act.type}</span>
                          <span>{new Date(act.date_time).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <p className={styles.activityNotes}>{act.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" onClick={handleDelete} className={styles.deleteButton} disabled={deleteDeal.isPending}>
            {deleteDeal.isPending ? 'Eliminando...' : 'Eliminar'}
          </button>
          <button type="submit" form="edit-deal-form" className={styles.submitButton} disabled={updateDeal.isPending}>
            {updateDeal.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DealEditModal;