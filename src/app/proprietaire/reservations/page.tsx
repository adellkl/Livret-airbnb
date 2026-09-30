'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { CalendarDays, Copy, Download, ExternalLink, KeyRound, QrCode, Sparkles } from 'lucide-react';
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, Timestamp, where, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import OwnerPageShell from '@/components/owner/OwnerPageShell';
import { Button } from '@/components/ui/button';
import { firebaseAuth, firestore } from '@/lib/firebase/client';

type PropertyOption = { id: string; name: string; status: string };
type Reservation = {
  id: string;
  propertyId: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  accessToken: string;
  accessExpiresAt: Date | null;
};

const today = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const parseDateInput = (value: string) => new Date(`${value}T00:00:00`);
const formatDate = (value: Date) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(value);

function dayAfter(value: string) {
  const date = parseDateInput(value);
  date.setDate(date.getDate() + 1);
  return date;
}

function dateFromFirestore(value: unknown) {
  return value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function'
    ? value.toDate()
    : null;
}

function ReservationQr({ accessToken, guestName }: { accessToken: string; guestName: string }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const accessUrl = typeof window === 'undefined' ? `/guide/${accessToken}` : `${window.location.origin}/guide/${accessToken}`;

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(accessUrl, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#17232c', light: '#ffffff' },
    }).then((url) => { if (active) setQrCodeUrl(url); });
    return () => { active = false; };
  }, [accessUrl]);

  const copy = async () => {
    await navigator.clipboard.writeText(accessUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex flex-col items-center rounded-2xl border border-[#e7dfd8] bg-[#fcfaf8] p-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-sm">
        {qrCodeUrl ? <Image src={qrCodeUrl} alt={`QR code d’accès pour ${guestName}`} width={96} height={96} unoptimized className="h-24 w-24" /> : <QrCode className="text-[#8e9792]" />}
      </div>
      <div className="mt-4 min-w-0 flex-1 text-center sm:mt-0 sm:text-left">
        <p className="text-sm font-semibold text-[#26322d]">QR code personnel</p>
        <p className="mt-1 text-xs leading-5 text-[#77736f]">Ce QR code est propre à ce séjour. L’ancien accès sera refusé après la date d’expiration.</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => void copy()}>
            <Copy size={14} className="mr-1.5" />{copied ? 'Copié !' : 'Copier le lien'}
          </Button>
          <a href={qrCodeUrl || undefined} download={`qr-code-${guestName || 'voyageur'}.png`}>
            <Button type="button" variant="outline" size="sm" className="rounded-xl" disabled={!qrCodeUrl}><Download size={14} className="mr-1.5" />Télécharger</Button>
          </a>
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => window.open(accessUrl, '_blank', 'noopener,noreferrer')}>
            <ExternalLink size={14} className="mr-1.5" />Ouvrir
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ReservationsPage() {
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [checkInDate, setCheckInDate] = useState(today());
  const [checkOutDate, setCheckOutDate] = useState(today());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let stopProperties: (() => void) | undefined;
    let stopReservations: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(firebaseAuth, (user) => {
      stopProperties?.();
      stopReservations?.();
      if (!user) return;
      stopProperties = onSnapshot(query(collection(firestore, 'properties'), where('ownerId', '==', user.uid)), (snapshot) => {
        const next = snapshot.docs.map((item) => ({ id: item.id, name: String(item.data().name ?? 'Logement sans nom'), status: String(item.data().status ?? 'draft') }));
        setProperties(next);
        setPropertyId((current) => current || next.find((item) => item.status === 'published')?.id || next[0]?.id || '');
      });
      stopReservations = onSnapshot(query(collection(firestore, 'reservations'), where('ownerId', '==', user.uid)), (snapshot) => {
        const next = snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            propertyId: String(data.propertyId ?? ''),
            guestName: String(data.guestName ?? 'Voyageur'),
            checkInDate: String(data.checkInDate ?? ''),
            checkOutDate: String(data.checkOutDate ?? ''),
            accessToken: String(data.accessToken ?? ''),
            accessExpiresAt: dateFromFirestore(data.accessExpiresAt),
          };
        }).sort((first, second) => second.checkInDate.localeCompare(first.checkInDate));
        setReservations(next);
      });
    });
    return () => { stopProperties?.(); stopReservations?.(); stopAuth(); };
  }, []);

  const propertyNames = useMemo(() => new Map(properties.map((property) => [property.id, property.name])), [properties]);

  const createReservation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const user = firebaseAuth.currentUser;
    const selectedProperty = properties.find((property) => property.id === propertyId);
    if (!user || !selectedProperty) return;
    if (selectedProperty.status !== 'published') {
      setError('Publiez le livret avant de créer un accès de réservation.');
      return;
    }
    if (!guestName.trim() || !checkInDate || !checkOutDate || checkOutDate < checkInDate) {
      setError('Indiquez le voyageur et des dates de séjour valides.');
      return;
    }

    setIsSubmitting(true);
    try {
      const [propertySnapshot, guideSnapshot] = await Promise.all([
        getDoc(doc(firestore, 'properties', propertyId)),
        getDoc(doc(firestore, 'public_guides', propertyId)),
      ]);
      if (!propertySnapshot.exists() || !guideSnapshot.exists()) throw new Error('missing-guide');

      const reservationRef = doc(collection(firestore, 'reservations'));
      const accessToken = reservationRef.id;
      const accessExpiresAt = Timestamp.fromDate(dayAfter(checkOutDate));
      const sourceGuide = guideSnapshot.data();
      const batch = writeBatch(firestore);
      batch.set(reservationRef, {
        ownerId: user.uid,
        propertyId,
        guestName: guestName.trim(),
        checkInDate,
        checkOutDate,
        accessToken,
        accessExpiresAt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(firestore, 'public_guides', accessToken), {
        ...sourceGuide,
        ownerId: user.uid,
        propertyId,
        reservationId: reservationRef.id,
        reservationGuestName: guestName.trim(),
        stayStart: checkInDate,
        stayEnd: checkOutDate,
        accessExpiresAt,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      setGuestName('');
      setCheckInDate(today());
      setCheckOutDate(today());
    } catch {
      setError('Impossible de créer cet accès. Vérifiez que le livret est publié puis réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OwnerPageShell title="Réservations" subtitle="Chaque séjour crée automatiquement son lien et son QR code temporaires.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.75fr)]">
        <section className="rounded-[2rem] border border-[#e4ddd6] bg-white p-5 shadow-[0_15px_36px_rgba(31,41,37,.06)] sm:p-7">
          <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#17232c] text-[#f4a184]"><Sparkles size={20} /></span><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#d85b24]">Accès automatique</p><h2 className="mt-1 text-xl font-semibold text-[#24292c]">Créer un séjour</h2><p className="mt-1 text-sm leading-6 text-[#77736f]">Un lien unique est créé pour le voyageur et expire automatiquement le lendemain de son départ.</p></div></div>
          <form className="mt-6 space-y-4" onSubmit={createReservation}>
            <label className="block text-sm font-medium text-[#303634]">Logement<select value={propertyId} onChange={(event) => setPropertyId(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#ded8d1] bg-white px-3 text-sm outline-none transition focus:border-[#d85b24]" required><option value="">Choisir un logement</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.name}{property.status !== 'published' ? ' — brouillon' : ''}</option>)}</select></label>
            <label className="block text-sm font-medium text-[#303634]">Nom du voyageur<input value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="Ex. Camille Martin" className="mt-1.5 h-11 w-full rounded-xl border border-[#ded8d1] px-3 text-sm outline-none transition placeholder:text-[#a39d96] focus:border-[#d85b24]" required /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-[#303634]">Arrivée<input type="date" min={today()} value={checkInDate} onChange={(event) => setCheckInDate(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#ded8d1] px-3 text-sm outline-none focus:border-[#d85b24]" required /></label><label className="block text-sm font-medium text-[#303634]">Départ<input type="date" min={checkInDate || today()} value={checkOutDate} onChange={(event) => setCheckOutDate(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#ded8d1] px-3 text-sm outline-none focus:border-[#d85b24]" required /></label></div>
            {error && <p className="rounded-xl bg-[#fdeceb] px-3 py-2 text-sm text-[#b8453c]">{error}</p>}
            <Button type="submit" disabled={isSubmitting || !properties.length} className="h-11 w-full rounded-xl bg-[#17232c] hover:bg-[#263944]"><KeyRound size={16} className="mr-2" />{isSubmitting ? 'Création de l’accès…' : 'Créer le QR code du séjour'}</Button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-[#d7e9e0] bg-[#edf7f2] p-5 sm:p-7"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#367566] shadow-sm"><CalendarDays size={20} /></span><h2 className="mt-5 text-xl font-semibold text-[#244b40]">Comment cela fonctionne</h2><ol className="mt-4 space-y-4 text-sm leading-6 text-[#4c7066]"><li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#367566] text-xs font-bold text-white">1</span>Créez une réservation avec ses dates.</li><li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#367566] text-xs font-bold text-white">2</span>Partagez le lien ou le QR code généré pour ce séjour.</li><li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#367566] text-xs font-bold text-white">3</span>À minuit après le départ, le QR code est automatiquement refusé.</li></ol></section>
      </div>

      <section className="mt-6 rounded-[2rem] border border-[#e4ddd6] bg-white p-5 shadow-[0_15px_36px_rgba(31,41,37,.06)] sm:p-7"><div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold text-[#24292c]">Séjours et accès</h2><p className="mt-1 text-sm text-[#77736f]">Chaque QR code reste isolé d’une réservation à l’autre.</p></div><span className="rounded-full bg-[#f4e9e3] px-3 py-1.5 text-xs font-bold text-[#bb522e]">{reservations.length} séjour{reservations.length > 1 ? 's' : ''}</span></div>
        {reservations.length ? <div className="mt-6 grid gap-4 lg:grid-cols-2">{reservations.map((reservation) => { const expired = reservation.accessExpiresAt ? reservation.accessExpiresAt <= new Date() : false; return <article key={reservation.id} className="rounded-2xl border border-[#e7dfd8] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-base font-semibold text-[#26322d]">{reservation.guestName}</p><p className="mt-1 text-xs text-[#77736f]">{propertyNames.get(reservation.propertyId) || 'Logement'}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${expired ? 'bg-[#f2eeea] text-[#77736f]' : 'bg-[#e9f4ef] text-[#2f755f]'}`}>{expired ? 'Expiré' : 'Accès actif'}</span></div><div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#faf8f5] p-3 text-xs"><div><p className="text-[#8c8883]">Arrivée</p><p className="mt-1 font-semibold text-[#414745]">{reservation.checkInDate ? formatDate(parseDateInput(reservation.checkInDate)) : '—'}</p></div><div><p className="text-[#8c8883]">Expire le</p><p className="mt-1 font-semibold text-[#414745]">{reservation.accessExpiresAt ? formatDate(reservation.accessExpiresAt) : '—'}</p></div></div>{!expired && reservation.accessToken ? <div className="mt-4"><ReservationQr accessToken={reservation.accessToken} guestName={reservation.guestName} /></div> : <p className="mt-4 rounded-xl bg-[#f2eeea] px-3 py-3 text-xs leading-5 text-[#77736f]">Ce QR code a expiré. Il ne permet plus d’accéder au livret.</p>}</article>; })}</div> : <div className="mt-6 rounded-2xl bg-[#faf8f5] px-5 py-10 text-center"><CalendarDays className="mx-auto text-[#d85b24]" size={24} /><p className="mt-3 font-semibold text-[#303634]">Aucun séjour créé</p><p className="mt-1 text-sm text-[#77736f]">Créez votre première réservation pour obtenir un QR code à durée limitée.</p></div>}</section>
    </OwnerPageShell>
  );
}
