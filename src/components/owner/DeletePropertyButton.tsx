'use client';

import { useRef, useState } from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Trash2 } from 'lucide-react';
import { deleteOwnerProperty } from '@/lib/delete-owner-property';

export default function DeletePropertyButton({ propertyId, propertyName, onDeleted, disabled = false }: {
  propertyId: string;
  propertyName: string;
  onDeleted: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  async function handleDelete() {
    if (pending.current) return;
    pending.current = true;
    setDeleting(true);
    setError('');
    try {
      await deleteOwnerProperty(propertyId);
    } catch {
      setError('La suppression n’a pas pu être terminée. Certaines données associées peuvent déjà avoir été supprimées. Vérifiez votre connexion et réessayez.');
      pending.current = false;
      setDeleting(false);
      return;
    }
    pending.current = false;
    setDeleting(false);
    setOpen(false);
    onDeleted();
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={(nextOpen) => {
      if (pending.current) return;
      setOpen(nextOpen);
      setError('');
    }}>
      <AlertDialog.Trigger disabled={disabled || !propertyId} aria-label={`Supprimer le logement ${propertyName}`} className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#b8453c] transition hover:bg-[#fdeceb] disabled:opacity-50">
        <Trash2 size={16} /> Supprimer le logement
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-[90] bg-[#142c3f]/45 backdrop-blur-sm" />
        <AlertDialog.Popup initialFocus={cancelRef} className="fixed left-1/2 top-1/2 z-[91] max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[2rem] bg-white p-6 shadow-xl">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff0eb] text-[#b8453c]"><Trash2 size={20} /></span>
          <AlertDialog.Title className="mt-5 text-xl font-semibold text-[#1f2925]">Supprimer ce logement ?</AlertDialog.Title>
          <AlertDialog.Description className="mt-3 text-sm leading-6 text-[#68716c]">
            Le logement « {propertyName} », son livret, ses réservations, ses messages et ses statistiques seront définitivement supprimés. Les liens et QR codes associés ne fonctionneront plus. Cette action est irréversible.
          </AlertDialog.Description>
          {error && <p role="alert" className="mt-4 rounded-xl bg-[#fdeceb] p-3 text-sm text-[#b8453c]">{error}</p>}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <AlertDialog.Close ref={cancelRef} disabled={deleting} className="flex-1 rounded-xl border border-[#ddd7d0] px-4 py-3 text-sm font-semibold text-[#43514b] disabled:opacity-50">Annuler</AlertDialog.Close>
            <button type="button" onClick={() => void handleDelete()} disabled={deleting} className="flex-1 rounded-xl bg-[#b8453c] px-4 py-3 text-sm font-semibold text-white hover:bg-[#a13b33] disabled:cursor-wait disabled:opacity-50">
              {deleting ? 'Suppression…' : 'Supprimer définitivement'}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
