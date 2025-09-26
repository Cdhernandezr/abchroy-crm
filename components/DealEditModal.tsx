'use client'

import { FC, Fragment, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, Transition } from '@headlessui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import toast from 'react-hot-toast';

type Deal = { id: string; title: string; value: number | null; pain: string | null; }

interface DealEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
}

// Definimos el tipo para los datos del formulario
type DealFormData = {
  title: string;
  value: number;
  pain: string;
}

const DealEditModal: FC<DealEditModalProps> = ({ isOpen, onClose, deal }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DealFormData>({
    // Usamos los valores del deal para pre-llenar el formulario
    defaultValues: {
      title: deal?.title || '',
      value: deal?.value || 0,
      pain: deal?.pain || ''
    }
  });
  // Sincronizamos el formulario si el deal cambia
  useEffect(() => {
    reset({
      title: deal?.title || '',
      value: deal?.value || 0,
      pain: deal?.pain || ''
    })
  }, [deal, reset])

  const supabase = createClient()
  const queryClient = useQueryClient()

  // 1. MUTACIÓN PARA ACTUALIZAR UN DEAL
  const updateDeal = useMutation({
    mutationFn: async (updatedData: DealFormData) => {
      if (!deal) throw new Error("No hay un deal para actualizar");
      const { error } = await supabase
        .from('deals')
        .update({ ...updatedData })
        .eq('id', deal.id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast.success("Oportunidad actualizada con éxito!");
      queryClient.invalidateQueries({ queryKey: ['kanban-data'] })
      onClose() // Cierra el modal al tener éxito
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      console.error("Error al actualizar:", error)
      // Aquí mostrarías una notificación de error
    }
  })

  // 2. MUTACIÓN PARA ELIMINAR UN DEAL
  const deleteDeal = useMutation({
    mutationFn: async () => {
        if (!deal) throw new Error("No hay un deal para eliminar");
        if (window.confirm(`¿Estás seguro de que quieres eliminar "${deal.title}"? Esta acción no se puede deshacer.`)) {
            const { error } = await supabase
                .from('deals')
                .delete()
                .eq('id', deal.id);
            if (error) throw new Error(error.message);
        }
    },
    onSuccess: () => {
        toast.success("Oportunidad eliminada con éxito!");
        queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
        onClose();
    },
    onError: (error) => {
        toast.error(`Error: ${error.message}`);
        console.error("Error al eliminar:", error);
    }
  });

  const onSubmit = (data: DealFormData) => {
    updateDeal.mutate(data)
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        {/* ... (código del fondo y posicionamiento del modal de Headless UI) ... */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-gray-800 p-6 text-white">
            <Dialog.Title as="h3" className="text-lg font-medium leading-6">
              Editar Oportunidad
              <button onClick={onClose} className="float-right"><X size={20} /></button>
            </Dialog.Title>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div>
                <label htmlFor="title" className="text-sm">Título</label>
                <input id="title" {...register('title', { required: 'El título es obligatorio' })} className="w-full bg-gray-700 rounded p-2 mt-1" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label htmlFor="value" className="text-sm">Valor</label>
                <input id="value" type="number" {...register('value', { valueAsNumber: true })} className="w-full bg-gray-700 rounded p-2 mt-1" />
              </div>
              <div>
                <label htmlFor="pain" className="text-sm">Dolor del Cliente</label>
                <textarea id="pain" {...register('pain')} className="w-full bg-gray-700 rounded p-2 mt-1" />
              </div>
              <div>
              <label htmlFor="due" className="text-sm">Fecha de Cierre Estimada</label>
              <input 
                id="due" 
                type="date" 
                {...register('due')} // Asumimos que 'due' está en DealFormData
                className="w-full bg-gray-700 rounded p-2 mt-1 text-white" 
              />
            </div>
              <div className="flex justify-between items-center mt-6">
                <button type="button" onClick={() => deleteDeal.mutate()} className="px-4 py-2 text-sm font-medium text-red-500 rounded-md hover:bg-red-500/10">
                  Eliminar
                </button>
                <button type="submit" disabled={updateDeal.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {updateDeal.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  )
}

export default DealEditModal;