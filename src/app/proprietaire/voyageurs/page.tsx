'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCheck, MessageCircleMore, Send, ShieldCheck, UsersRound } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import OwnerPageShell from '@/components/owner/OwnerPageShell';
import { firebaseAuth, firestore } from '@/lib/firebase/client';

type OwnerMessage = { id: string; propertyId: string; propertyName: string; guestId: string; guestName: string; senderRole: 'guest' | 'owner'; content: string; createdAt: Date | null };

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
          id: message.id, propertyId: String(message.data().propertyId ?? ''), propertyName: String(message.data().propertyName ?? 'Logement'), guestId: String(message.data().guestId ?? ''), guestName: String(message.data().guestName ?? 'Voyageur'), senderRole: message.data().senderRole === 'owner' ? 'owner' as const : 'guest' as const, content: String(message.data().content ?? ''), createdAt: message.data().createdAt?.toDate?.() ?? null,
        })).sort((first, second) => (first.createdAt?.getTime() ?? 0) - (second.createdAt?.getTime() ?? 0)));
      }, () => setError('Impossible de charger les messages.'));
    });
    return () => { unsubscribe?.(); stop(); };
  }, []);

  const conversations = useMemo(() => Array.from(new Map(messages.map((message) => [`${message.propertyId}-${message.guestId}`, message])).values()), [messages]);
  const selectedConversation = conversations.find((conversation) => `${conversation.propertyId}-${conversation.guestId}` === selectedKey) ?? conversations[0];
  const conversationMessages = selectedConversation ? messages.filter((message) => message.propertyId === selectedConversation.propertyId && message.guestId === selectedConversation.guestId) : [];

  const sendReply = async () => {
    if (!selectedConversation || !reply.trim() || !ownerId) return;
    setSending(true); setError('');
    try {
      await addDoc(collection(firestore, 'guide_messages'), { propertyId: selectedConversation.propertyId, propertyName: selectedConversation.propertyName, ownerId, guestId: selectedConversation.guestId, guestName: selectedConversation.guestName, senderRole: 'owner', content: reply.trim(), moderationStatus: 'approved', createdAt: serverTimestamp() });
      setReply('');
    } catch { setError('Impossible d’envoyer votre réponse.'); } finally { setSending(false); }
  };

  return <OwnerPageShell title="Voyageurs" subtitle="Échangez avec vos voyageurs sans quitter votre espace propriétaire.">
    <section className="grid gap-5 md:grid-cols-3"><article className="rounded-[2rem] bg-[#17232c] p-7 text-white"><UsersRound className="text-[#ef8b64]" /><p className="mt-8 text-4xl font-semibold">{conversations.length}</p><p className="mt-1 text-sm text-white/60">Conversation{conversations.length > 1 ? 's' : ''} active{conversations.length > 1 ? 's' : ''}</p></article><article className="rounded-[2rem] border border-[#d2e4dc] bg-[#edf6f2] p-7 md:col-span-2"><ShieldCheck className="text-[#367566]" /><h2 className="mt-5 text-xl font-semibold text-[#244d43]">Messagerie privée en temps réel</h2><p className="mt-2 text-sm leading-6 text-[#54736b]">Les messages arrivent instantanément dans votre boîte de réception. Seuls les propos insultants sont bloqués.</p></article></section>
    <section className="mt-6 overflow-hidden rounded-[2rem] border border-[#e4ddd6] bg-white shadow-[0_16px_40px_rgba(31,41,37,.06)]"><div className="grid min-h-[520px] md:grid-cols-[260px_1fr]"><aside className="border-b border-[#eee8e2] bg-[#fcfaf8] p-4 md:border-b-0 md:border-r"><p className="px-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#9a948e]">Boîte de réception</p><div className="mt-3 space-y-2">{conversations.map((conversation) => { const key = `${conversation.propertyId}-${conversation.guestId}`; return <button key={key} type="button" onClick={() => setSelectedKey(key)} className={`w-full rounded-2xl p-3 text-left transition ${key === (selectedKey || `${selectedConversation?.propertyId}-${selectedConversation?.guestId}`) ? 'bg-[#17232c] text-white' : 'hover:bg-white'}`}><p className="text-sm font-semibold">{conversation.guestName}</p><p className="mt-1 truncate text-xs opacity-65">{conversation.propertyName}</p></button>; })}{!conversations.length && <p className="px-2 py-8 text-sm leading-6 text-[#77736f]">Les nouveaux messages de vos voyageurs apparaîtront ici.</p>}</div></aside><div className="flex min-h-[390px] flex-col">{selectedConversation ? <><div className="flex items-center justify-between border-b border-[#eee8e2] px-5 py-4"><div><p className="font-semibold">{selectedConversation.guestName}</p><p className="mt-0.5 text-xs text-[#77736f]">{selectedConversation.propertyName}</p></div><span className="flex items-center gap-1 rounded-full bg-[#eaf5f1] px-2.5 py-1 text-[10px] font-bold text-[#286454]"><CheckCheck size={13} />Temps réel</span></div><div className="flex-1 space-y-3 overflow-y-auto p-5">{conversationMessages.map((message) => <div key={message.id} className={`max-w-[82%] rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${message.senderRole === 'owner' ? 'ml-auto bg-[#17232c] text-white' : 'bg-[#f5f1ed] text-[#33444b]'}`}><p>{message.content}</p></div>)}</div><div className="border-t border-[#eee8e2] p-4"><div className="flex gap-2 rounded-2xl border border-[#ddd7d0] p-2"><textarea value={reply} onChange={(event) => setReply(event.target.value)} maxLength={1000} rows={2} placeholder="Répondre au voyageur…" className="min-h-11 flex-1 resize-none px-2 py-1 text-sm outline-none" /><button type="button" onClick={sendReply} disabled={sending || !reply.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl bg-[#d9694d] text-white disabled:opacity-40"><Send size={17} /></button></div>{error && <p role="alert" className="mt-2 text-xs text-[#b8453c]">{error}</p>}</div></> : <div className="flex flex-1 flex-col items-center justify-center px-6 text-center"><MessageCircleMore className="text-[#d9694d]" size={32} /><h2 className="mt-4 text-lg font-semibold">Aucun message pour le moment</h2><p className="mt-2 max-w-sm text-sm leading-6 text-[#77736f]">Le bouton « Écrire à l’hôte » du guide ouvre une conversation privée ici.</p></div>}</div></div></section>
  </OwnerPageShell>;
}
