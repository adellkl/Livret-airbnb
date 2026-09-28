'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, MessageCircleMore, Send, ShieldCheck, UsersRound } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';

import OwnerPageShell from '@/components/owner/OwnerPageShell';
import { firebaseAuth, firebaseAuthReady, firestore } from '@/lib/firebase/client';
import { containsBlockedMessageTerm } from '@/lib/message-moderation';
import { formatMessageDateTime } from '@/lib/message-presentation';

type OwnerMessage = {
  id: string; propertyId: string; propertyName: string; guestId: string; guestName: string;
  senderRole: 'guest' | 'owner'; senderName: string; content: string; createdAt: Date | null;
};

function getGuestInitials(name: string) {
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part.slice(0, 1).toLocaleUpperCase('fr-FR')).join('');
  return initials || '—';
}

function hasConfirmedGuestName(name: string) {
  return Boolean(name.trim()) && name !== 'Voyageur';
}

export default function TravelersPage() {
  const [messages, setMessages] = useState<OwnerMessage[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [reply, setReply] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const stop = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribe?.();
      if (!user) return;
      setOwnerId(user.uid);
      unsubscribe = onSnapshot(query(collection(firestore, 'guide_messages'), where('ownerId', '==', user.uid)), (snapshot) => {
        setMessages(snapshot.docs.map((message) => ({
          id: message.id,
          propertyId: String(message.data().propertyId ?? ''),
          propertyName: String(message.data().propertyName ?? 'Logement'),
          guestId: String(message.data().guestId ?? ''),
          guestName: String(message.data().guestName ?? 'Voyageur'),
          senderRole: message.data().senderRole === 'owner' ? 'owner' as const : 'guest' as const,
          senderName: String(message.data().senderName ?? (message.data().senderRole === 'owner' ? 'Propriétaire' : message.data().guestName ?? 'Voyageur')),
          content: String(message.data().content ?? ''),
          createdAt: message.data().createdAt?.toDate?.() ?? null,
        })).sort((first, second) => (first.createdAt?.getTime() ?? 0) - (second.createdAt?.getTime() ?? 0)));
      }, (snapshotError) => setError(snapshotError.code === 'permission-denied'
        ? 'Firebase bloque la lecture des messages. Vérifiez les règles Firestore déployées.'
        : 'Impossible de charger les messages.'));
    });
    void firebaseAuthReady.catch(() => setError('Impossible de restaurer votre session propriétaire.'));
    return () => { unsubscribe?.(); stop(); };
  }, []);

  const conversations = useMemo(() => Array.from(messages.reduce((items, message) => {
    const key = message.propertyId + '-' + message.guestId;
    const current = items.get(key);
    const messageHasName = hasConfirmedGuestName(message.guestName);
    const currentHasName = Boolean(current && hasConfirmedGuestName(current.guestName));
    items.set(key, {
      ...message,
      guestName: messageHasName ? message.guestName : currentHasName ? current.guestName : message.guestName,
    });
    return items;
  }, new Map<string, OwnerMessage>()).values()).sort(
    (first, second) => (second.createdAt?.getTime() ?? 0) - (first.createdAt?.getTime() ?? 0),
  ), [messages]);
  const selectedConversation = conversations.find((conversation) => conversation.propertyId + '-' + conversation.guestId === selectedKey) ?? conversations[0];
  const conversationMessages = selectedConversation ? messages.filter((message) => message.propertyId === selectedConversation.propertyId && message.guestId === selectedConversation.guestId) : [];
  const activeConversationKey = selectedConversation ? selectedConversation.propertyId + '-' + selectedConversation.guestId : '';

  const sendReply = async () => {
    if (!selectedConversation || !reply.trim() || !ownerId) return;
    if (containsBlockedMessageTerm(reply)) {
      setError('Ce message contient un terme interdit. Reformulez-le avant de l’envoyer.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await addDoc(collection(firestore, 'guide_messages'), {
        propertyId: selectedConversation.propertyId, propertyName: selectedConversation.propertyName,
        ownerId, guestId: selectedConversation.guestId, guestName: selectedConversation.guestName,
        senderRole: 'owner', senderName: 'Propriétaire', content: reply.trim(),
        moderationStatus: 'approved', createdAt: serverTimestamp(),
      });
      setReply('');
    } catch (sendError) {
      const code = sendError && typeof sendError === 'object' && 'code' in sendError ? String(sendError.code) : '';
      setError(code === 'permission-denied' ? 'Firebase bloque l’envoi. Vérifiez les règles Firestore déployées.' : 'Impossible d’envoyer votre réponse.');
    } finally {
      setSending(false);
    }
  };

  return (
    <OwnerPageShell title="Voyageurs" subtitle="Échangez avec vos voyageurs sans quitter votre espace propriétaire.">
      <section className="grid gap-5 md:grid-cols-3">
        <article className="rounded-[2rem] bg-[#17232c] p-7 text-white"><UsersRound className="text-[#ef8b64]" /><p className="mt-8 text-4xl font-semibold">{conversations.length}</p><p className="mt-1 text-sm text-white/60">Conversation{conversations.length > 1 ? 's' : ''} active{conversations.length > 1 ? 's' : ''}</p></article>
        <article className="rounded-[2rem] border border-[#d2e4dc] bg-[#edf6f2] p-7 md:col-span-2"><ShieldCheck className="text-[#367566]" /><h2 className="mt-5 text-xl font-semibold text-[#244d43]">Messagerie privée en temps réel</h2><p className="mt-2 text-sm leading-6 text-[#54736b]">Les messages arrivent instantanément dans votre boîte de réception. Seuls les propos insultants sont bloqués.</p></article>
      </section>
      {error ? <p role="alert" className="mt-4 rounded-2xl border border-[#efc1bd] bg-[#fdeceb] px-5 py-4 text-sm text-[#b8453c]">{error}</p> : null}
      <section className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#e4ddd6] bg-white shadow-[0_16px_40px_rgba(31,41,37,.06)] md:rounded-[2rem]">
        <div className="grid md:min-h-[520px] md:grid-cols-[300px_1fr]">
          <aside className="border-b border-[#eee8e2] bg-[#fcfaf8] p-3 md:border-b-0 md:border-r md:p-4">
            <div className="flex items-center justify-between px-1.5 md:px-2"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#9a948e]">Boîte de réception</p><span className="rounded-full bg-[#eee8e2] px-2 py-1 text-[10px] font-bold text-[#77736f]">{conversations.length}</span></div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:mt-4 md:block md:space-y-2 md:overflow-visible md:pb-0">
              {conversations.map((conversation) => {
                const key = conversation.propertyId + '-' + conversation.guestId;
                const active = key === activeConversationKey;
                const nameConfirmed = hasConfirmedGuestName(conversation.guestName);
                return <button key={key} type="button" onClick={() => setSelectedKey(key)} className={'group relative min-w-[220px] rounded-xl border px-3.5 py-3.5 text-left transition md:w-full md:min-w-0 md:rounded-2xl md:px-4 md:py-4 ' + (active ? 'border-[#17232c] bg-[#17232c] text-white shadow-[0_12px_26px_rgba(23,35,44,.17)]' : 'border-transparent bg-white/60 hover:border-[#e5ddd5] hover:bg-white hover:shadow-sm')}><span className="flex items-center justify-between gap-3"><span className="min-w-0 truncate text-sm font-semibold">{nameConfirmed ? conversation.guestName : 'Nom à renseigner'}</span><span className={'shrink-0 text-[10px] font-medium md:text-[11px] ' + (active ? 'text-white/60' : 'text-[#78817d]')}>{formatMessageDateTime(conversation.createdAt)}</span><ChevronRight size={15} className={'hidden shrink-0 transition md:block ' + (active ? 'text-white/60' : 'text-[#c0b9b2] group-hover:translate-x-0.5')} /></span></button>;
              })}
              {!conversations.length ? <p className="px-2 py-8 text-sm leading-6 text-[#77736f]">Les nouveaux messages de vos voyageurs apparaîtront ici.</p> : null}
            </div>
          </aside>
          <div className="flex min-h-[470px] flex-col md:min-h-[390px]">
            {selectedConversation ? <><div className="border-b border-[#eee8e2] px-4 py-3.5 md:px-5 md:py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4e7df] font-serif text-sm font-semibold text-[#d85b24] md:h-10 md:w-10 md:text-base">{getGuestInitials(selectedConversation.guestName)}</span><div className="min-w-0"><p className="truncate font-semibold">{hasConfirmedGuestName(selectedConversation.guestName) ? selectedConversation.guestName : 'Nom à renseigner'}</p><p className="mt-0.5 text-xs text-[#77736f]">Conversation privée</p></div></div></div><div className="h-[310px] flex-none space-y-3 overflow-y-auto p-4 md:h-auto md:flex-1 md:p-5">{conversationMessages.map((message) => <div key={message.id} className={'max-w-[88%] rounded-[1.25rem] px-4 py-3 text-sm leading-6 md:max-w-[82%] ' + (message.senderRole === 'owner' ? 'ml-auto bg-[#17232c] text-white' : 'bg-[#f5f1ed] text-[#33444b]')}><p className={'mb-1 text-[10px] font-bold uppercase tracking-[0.12em] ' + (message.senderRole === 'owner' ? 'text-white/60' : 'text-[#718087]')}>{message.senderRole === 'owner' ? 'Vous' : message.senderName} · {formatMessageDateTime(message.createdAt)}</p><p>{message.content}</p></div>)}</div><div className="border-t border-[#eee8e2] bg-white p-3 md:p-4"><div className="flex gap-2 rounded-2xl border border-[#ddd7d0] p-2"><textarea value={reply} onChange={(event) => setReply(event.target.value)} maxLength={1000} rows={2} placeholder="Répondre au voyageur…" className="min-h-11 flex-1 resize-none px-2 py-1 text-sm outline-none" /><button type="button" onClick={sendReply} disabled={sending || !reply.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl bg-[#d9694d] text-white disabled:opacity-40"><Send size={17} /></button></div></div></> : <div className="flex flex-1 flex-col items-center justify-center px-6 text-center"><MessageCircleMore className="text-[#d9694d]" size={32} /><h2 className="mt-4 text-lg font-semibold">Aucun message pour le moment</h2><p className="mt-2 max-w-sm text-sm leading-6 text-[#77736f]">Le bouton « Écrire à l’hôte » du guide ouvre une conversation privée ici.</p></div>}
          </div>
        </div>
      </section>
    </OwnerPageShell>
  );
}
