// components/DealCreateModal.tsx
'use client'

import { FC, Fragment, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, Transition } from '@headlessui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

// Tipos para las props y el formulario
type Account = { id: string; name: string; }
interface DealCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageId: string | null;
  pipelineId: string;
  accounts: Account[];
}
type DealFormData = { title: string; account_id: string; }

const DealCreateModal: FC<DealCreateModalProps> = ({ isOpen, onClose, stageId, pipelineId, accounts }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DealFormData>();
  const supabase = createClient();
  const queryClient = useQueryClient();

  // MUTACIÓN PARA CREAR EL DEAL (movida desde KanbanBoard)
  const createDeal = useMutation({
    mutationFn: async ({ title, account_id }: DealFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!stageId || !user) throw new Error("Faltan datos para crear la oportunidad.");

      const { error } = await supabase
        .from('deals')
        .insert({ title, account_id, stage_id: stageId, pipeline_id: pipelineId, owner_id: user.id });
      
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Nueva oportunidad creada!');
      queryClient.invalidateQueries({ queryKey: ['kanban-data'] });
      onClose();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const onSubmit = (data: DealFormData) => {
    createDeal.mutate(data);
  };

  useEffect(() => {
    // Resetea el formulario cuando se cierra el modal
    if (!isOpen) {
      reset({ title: '', account_id: '' });
    }
  }, [isOpen, reset]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        {/* Fondo oscuro */}
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-gray-800 p-6 text-white">
            <Dialog.Title as="h3" className="text-lg font-medium leading-6">
              Crear Nueva Oportunidad
              <button onClick={onClose} className="float-right"><X size={20} /></button>
            </Dialog.Title>
            
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div>
                <label htmlFor="title" className="text-sm">Título de la Oportunidad</label>
                <input id="title" {...register('title', { required: 'El título es obligatorio' })} className="w-full bg-gray-700 rounded p-2 mt-1" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label htmlFor="account_id" className="text-sm">Cuenta / Empresa</label>
                <select id="account_id" {...register('account_id', { required: 'Debes seleccionar una cuenta' })} className="w-full bg-gray-700 rounded p-2 mt-1 appearance-none">
                  <option value="">-- Selecciona una cuenta --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
                {errors.account_id && <p className="text-red-500 text-xs mt-1">{errors.account_id.message}</p>}
              </div>

              <div className="flex justify-end mt-6">
                <button type="submit" disabled={createDeal.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {createDeal.isPending ? 'Creando...' : 'Crear Oportunidad'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  )
}

export default DealCreateModal;