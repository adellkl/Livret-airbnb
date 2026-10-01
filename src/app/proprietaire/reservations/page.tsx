'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  CalendarDays,
  Check,
  Copy,
  Download,
  ExternalLink,
  LockKeyhole,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import OwnerPageShell from '@/components/owner/OwnerPageShell';
import { Button } from '@/components/ui/button';
import { firebaseAuth, firestore } from '@/lib/firebase/client';

type PropertyAccess = {
  id: string;
  name: string;
  status: string;
  guideExists: boolean;
  guestAccessRequired: boolean;
  checkInDate: string;
  checkOutDate: string;
  checkOutTime: string;
  accessStartsAt: Date | null;
  accessExpiresAt: Date | null;
};

type AccessStatus = 'active' | 'scheduled' | 'expired' | 'incomplete' | 'not-configured';

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const parseDateInput = (value: string) => new Date(`${value}T00:00:00`);

function dateFromFirestore(value: unknown) {
  return value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function'
    ? value.toDate()
    : null;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(value);
}

function getAccessStatus(property: PropertyAccess, now: Date): AccessStatus {
  if (!property.guestAccessRequired) return 'not-configured';
  if (!property.accessStartsAt || !property.accessExpiresAt) return 'incomplete';
  if (property.accessExpiresAt <= now) return 'expired';
  if (property.accessStartsAt > now) return 'scheduled';
  return 'active';
}

function PermanentPropertyQr({ propertyId, propertyName }: { propertyId: string; propertyName: string }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const accessUrl = typeof window === 'undefined'
    ? `/guide/${propertyId}?source=qr`
    : `${window.location.origin}/guide/${propertyId}?source=qr`;

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
    <div className="flex flex-col items-center rounded-2xl border border-[#e7dfd8] bg-[#fcfaf8] p-4 sm:flex-row sm:gap-4">
      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-sm">
        {qrCodeUrl ? <Image src={qrCodeUrl} alt={`QR code permanent du logement ${propertyName}`} width={96} height={96} unoptimized className="h-24 w-24" /> : <QrCode className="text-[#8e9792]" />}
      </div>
      <div className="mt-4 min-w-0 flex-1 text-center sm:mt-0 sm:text-left">
        <p className="text-sm font-semibold text-[#26322d]">QR code à imprimer</p>
        <p className="mt-1 text-xs leading-5 text-[#77736f]">Ce même QR reste affiché dans le logement. Vous n’avez pas à le recréer pour chaque séjour.</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => void copy()}>
            <Copy size={14} className="mr-1.5" />{copied ? 'Copié !' : 'Copier le lien'}
          </Button>
          <a href={qrCodeUrl || undefined} download={`qr-code-${propertyName || 'logement'}.png`}>
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

function PropertyAccessCard({ property, now }: { property: PropertyAccess; now: Date }) {
  const [checkInDate, setCheckInDate] = useState(property.checkInDate);
  const [checkOutDate, setCheckOutDate] = useState(property.checkOutDate);
  const [checkOutTime, setCheckOutTime] = useState(property.checkOutTime || '11:00');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const accessStatus = getAccessStatus(property, now);
  const published = property.status === 'published';
  const hasSchedule = property.guestAccessRequired && Boolean(property.accessStartsAt && property.accessExpiresAt);

  const saveDates = async () => {
    setError('');
    if (!checkInDate || !checkOutDate || checkOutDate < checkInDate || !/^([01]\d|2[0-3]):[0-5]\d$/.test(checkOutTime)) {
      setError('Indiquez une date de départ valide et l’heure de départ du logement.');
      return;
    }
    setIsSaving(true);
    try {
      const guideRef = doc(firestore, 'public_guides', property.id);
      const guide = await getDoc(guideRef);
      if (!guide.exists()) throw new Error('missing-guide');
      await updateDoc(guideRef, {
        guestAccessRequired: true,
        guestAccessCheckInDate: checkInDate,
        guestAccessCheckOutDate: checkOutDate,
        guestAccessCheckOutTime: checkOutTime,
        accessStartsAt: Timestamp.fromDate(parseDateInput(checkInDate)),
        accessExpiresAt: Timestamp.fromDate(new Date(`${checkOutDate}T${checkOutTime}:00`)),
        updatedAt: serverTimestamp(),
      });
    } catch {
      setError('Impossible d’enregistrer ces dates. Vérifiez que le livret est publié puis réessayez.');
    } finally {
      setIsSaving(false);
    }
  };

  const closeAccessNow = async () => {
    setError('');
    setIsSaving(true);
    try {
      await updateDoc(doc(firestore, 'public_guides', property.id), {
        accessExpiresAt: Timestamp.fromDate(new Date()),
        updatedAt: serverTimestamp(),
      });
    } catch {
      setError('Impossible de fermer l’accès. Réessayez dans un instant.');
    } finally {
      setIsSaving(false);
    }
  };

  const badge = {
    active: { label: 'Accès actif', style: 'bg-[#e9f4ef] text-[#2f755f]' },
    scheduled: { label: 'Accès programmé', style: 'bg-[#fff2dd] text-[#94621f]' },
    expired: { label: 'Accès fermé', style: 'bg-[#f2eeea] text-[#77736f]' },
    incomplete: { label: 'Dates à compléter', style: 'bg-[#fff2dd] text-[#94621f]' },
    'not-configured': { label: 'À programmer', style: 'bg-[#f2eeea] text-[#77736f]' },
  }[accessStatus];

  return (
    <article className="rounded-[1.7rem] border border-[#e4ddd6] bg-white p-5 shadow-[0_15px_36px_rgba(31,41,37,.05)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#26322d]">{property.name}</h2>
          <p className="mt-1 text-xs text-[#77736f]">{published ? 'Livret publié' : 'Livret à publier'}</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${badge.style}`}>{badge.label}</span>
      </div>

      <div className="mt-5 rounded-2xl border border-[#d7e9e0] bg-[#f5faf7] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#367566]"><CalendarDays size={19} /></span>
          <div>
            <h3 className="font-semibold text-[#244b40]">Période du séjour</h3>
            <p className="mt-1 text-xs leading-5 text-[#4c7066]">L’accès s’ouvre le jour de l’arrivée et se ferme automatiquement à l’heure de départ du logement.</p>
          </div>
        </div>

        {!property.guestAccessRequired && <p className="mt-4 rounded-xl bg-white px-3 py-2.5 text-xs leading-5 text-[#76684f]">Aucune période n’est programmée : le lien actuel reste ouvert. Programmez les dates du prochain séjour pour activer sa fermeture automatique.</p>}
        {hasSchedule && <p className="mt-4 rounded-xl bg-white px-3 py-2.5 text-xs leading-5 text-[#4c7066]">{accessStatus === 'expired' ? 'Le séjour est terminé. Le livret est fermé aux voyageurs.' : `Séjour : du ${property.checkInDate ? formatDate(parseDateInput(property.checkInDate)) : '—'} au ${property.checkOutDate ? formatDate(parseDateInput(property.checkOutDate)) : '—'} à ${property.checkOutTime || '11:00'}.`}</p>}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-[#303634]">Arrivée<input type="date" min={today()} value={checkInDate} onChange={(event) => setCheckInDate(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#ded8d1] bg-white px-3 text-sm outline-none focus:border-[#367566]" disabled={!published || isSaving} required /></label>
          <label className="block text-sm font-medium text-[#303634]">Départ<input type="date" min={checkInDate || today()} value={checkOutDate} onChange={(event) => setCheckOutDate(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#ded8d1] bg-white px-3 text-sm outline-none focus:border-[#367566]" disabled={!published || isSaving} required /></label>
          <label className="block text-sm font-medium text-[#303634] sm:col-span-2">Heure de départ<input type="time" value={checkOutTime} onChange={(event) => setCheckOutTime(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#ded8d1] bg-white px-3 text-sm outline-none focus:border-[#367566]" disabled={!published || isSaving} required /><span className="mt-1 block text-xs font-normal text-[#77736f]">Par défaut : 11:00. Ajustez-la à l’heure de départ indiquée dans le livret.</span></label>
        </div>
        {error && <p role="alert" className="mt-3 rounded-xl bg-[#fdeceb] px-3 py-2 text-sm text-[#b8453c]">{error}</p>}
        {!published && <p className="mt-3 text-xs text-[#8c7770]">Publiez le livret pour pouvoir programmer l’accès voyageur.</p>}
        {published && !property.guideExists && <p className="mt-3 text-xs text-[#8c7770]">Chargement du livret…</p>}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={() => void saveDates()} disabled={!published || !property.guideExists || isSaving} className="h-11 flex-1 rounded-xl bg-[#17232c] hover:bg-[#263944]">
            <Check size={16} className="mr-2" />{isSaving ? 'Enregistrement…' : hasSchedule ? 'Mettre à jour les dates' : 'Programmer le séjour'}
          </Button>
          {hasSchedule && accessStatus !== 'expired' && <Button type="button" variant="outline" onClick={() => void closeAccessNow()} disabled={isSaving} className="h-11 rounded-xl border-[#ded8d1] text-[#55524e]">
            <LockKeyhole size={15} className="mr-2" />Fermer maintenant
          </Button>}
        </div>
      </div>
    </article>
  );
}

export default function ReservationsPage() {
  const [properties, setProperties] = useState<PropertyAccess[]>([]);
  const [selectedQrPropertyId, setSelectedQrPropertyId] = useState('');
  const [now, setNow] = useState(() => new Date());
  const publishedProperties = properties.filter((property) => property.status === 'published');
  const selectedQrProperty = publishedProperties.find((property) => property.id === selectedQrPropertyId) ?? publishedProperties[0];

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let stopProperties: (() => void) | undefined;
    const guideStops = new Map<string, () => void>();
    const stopAuth = onAuthStateChanged(firebaseAuth, (user) => {
      stopProperties?.();
      guideStops.forEach((stop) => stop());
      guideStops.clear();
      setProperties([]);
      if (!user) return;
      stopProperties = onSnapshot(query(collection(firestore, 'properties'), where('ownerId', '==', user.uid)), (snapshot) => {
        guideStops.forEach((stop) => stop());
        guideStops.clear();
        const next = snapshot.docs.map((item) => ({
          id: item.id,
          name: String(item.data().name ?? 'Logement sans nom'),
          status: String(item.data().status ?? 'draft'),
          guideExists: false,
          guestAccessRequired: false,
          checkInDate: '',
          checkOutDate: '',
          checkOutTime: '11:00',
          accessStartsAt: null,
          accessExpiresAt: null,
        } satisfies PropertyAccess));
        setProperties(next);
        next.forEach((property) => {
          guideStops.set(property.id, onSnapshot(doc(firestore, 'public_guides', property.id), (guide) => {
            if (!guide.exists()) return;
            const data = guide.data();
            setProperties((current) => current.map((item) => item.id === property.id ? {
              ...item,
              guideExists: true,
              guestAccessRequired: data.guestAccessRequired === true,
              checkInDate: String(data.guestAccessCheckInDate ?? ''),
              checkOutDate: String(data.guestAccessCheckOutDate ?? ''),
              checkOutTime: String(data.guestAccessCheckOutTime ?? data.checkOut ?? '11:00') || '11:00',
              accessStartsAt: dateFromFirestore(data.accessStartsAt),
              accessExpiresAt: dateFromFirestore(data.accessExpiresAt),
            } : item));
          }));
        });
      });
    });
    return () => {
      stopProperties?.();
      guideStops.forEach((stop) => stop());
      stopAuth();
    };
  }, []);

  return (
    <OwnerPageShell title="Accès voyageurs" subtitle="Un QR code permanent dans le logement, avec un accès qui s’arrête à la fin de chaque séjour.">
      <section className="mb-6 rounded-[1.7rem] border border-[#d7e9e0] bg-[#edf7f2] p-5 sm:p-6">
        <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#367566] shadow-sm"><ShieldCheck size={20} /></span><div><h2 className="text-lg font-semibold text-[#244b40]">Le même QR pour tous les séjours</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-[#4c7066]">Imprimez le QR code une fois et affichez-le dans le logement. Le voyageur saisit son prénom et son nom après le scan. Programmez ici les dates du séjour : le livret s’ouvre pendant cette période puis sa lecture est bloquée à l’heure de départ. Une seule période est gérée à la fois pour chaque logement; programmez le séjour suivant après la fermeture du précédent.</p></div></div>
      </section>

      <section className="mb-6 rounded-[1.7rem] border border-[#e4ddd6] bg-white p-5 shadow-[0_15px_36px_rgba(31,41,37,.05)] sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(240px,.7fr)_minmax(0,1.3fr)] lg:items-center">
          <div>
            <label htmlFor="qr-property" className="block text-sm font-semibold text-[#303634]">Logement à imprimer</label>
            <select id="qr-property" value={selectedQrProperty?.id ?? ''} onChange={(event) => setSelectedQrPropertyId(event.target.value)} disabled={!publishedProperties.length} className="mt-2 h-11 w-full rounded-xl border border-[#ded8d1] bg-white px-3 text-sm outline-none transition focus:border-[#d85b24] disabled:bg-[#f5f2ee]">
              {!publishedProperties.length && <option value="">Aucun livret publié</option>}
              {publishedProperties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
            </select>
            <p className="mt-2 text-xs leading-5 text-[#77736f]">Choisissez un logement pour afficher, télécharger ou imprimer son QR code permanent.</p>
          </div>
          {selectedQrProperty
            ? <PermanentPropertyQr propertyId={selectedQrProperty.id} propertyName={selectedQrProperty.name} />
            : <p className="rounded-2xl bg-[#faf8f5] px-4 py-5 text-sm leading-6 text-[#77736f]">Publiez un livret pour générer un QR code à afficher dans le logement.</p>}
        </div>
      </section>

      {properties.length ? <div className="grid gap-5 xl:grid-cols-2">{properties.map((property) => <PropertyAccessCard key={property.id} property={property} now={now} />)}</div> : <section className="rounded-[2rem] border border-[#e4ddd6] bg-white px-5 py-12 text-center"><CalendarDays className="mx-auto text-[#d85b24]" size={26} /><h2 className="mt-3 font-semibold text-[#303634]">Aucun logement</h2><p className="mt-1 text-sm text-[#77736f]">Créez un logement pour préparer son QR code permanent.</p></section>}
    </OwnerPageShell>
  );
}
