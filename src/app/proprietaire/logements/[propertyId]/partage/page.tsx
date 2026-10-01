'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, CalendarDays, Check, Copy, Download, ExternalLink, MapPin, QrCode, Share2 } from 'lucide-react';

import OwnerPageShell from '@/components/owner/OwnerPageShell';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';
import { firebaseAuth, firestore } from '@/lib/firebase/client';

type ShareProperty = {
  id: string;
  name: string;
  city: string;
  address: string;
  publicToken: string;
  status: 'draft' | 'published';
  updatedAt: string;
};

type GeneratedQrCode = { publicUrl: string; dataUrl: string };

function formatDate(value: unknown) {
  const date = value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function'
    ? value.toDate()
    : value instanceof Date ? value : null;
  return date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(date)
    : 'Non renseignée';
}

export default function PropertySharePage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [property, setProperty] = useState<ShareProperty | null>(null);
  const [origin, setOrigin] = useState('');
  const [generatedQrCode, setGeneratedQrCode] = useState<GeneratedQrCode | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let stopProperty: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(firebaseAuth, (user) => {
      stopProperty?.();
      if (!user) {
        setProperty(null);
        setError('Reconnectez-vous pour accéder au partage de ce logement.');
        setIsLoading(false);
        return;
      }

      setOrigin(window.location.origin);
      setIsLoading(true);
      setError('');
      stopProperty = onSnapshot(doc(firestore, 'properties', propertyId), (snapshot) => {
        if (!active) return;
        if (!snapshot.exists() || snapshot.data().ownerId !== user.uid) {
          setProperty(null);
          setError('Ce logement est introuvable ou ne vous appartient pas.');
          setIsLoading(false);
          return;
        }

        const data = snapshot.data();
        setProperty({
          id: snapshot.id,
          name: String(data.name ?? 'Mon logement'),
          city: String(data.city ?? ''),
          address: String(data.address ?? ''),
          publicToken: String(data.publicToken ?? snapshot.id),
          status: data.status === 'published' ? 'published' : 'draft',
          updatedAt: formatDate(data.updatedAt),
        });
        setIsLoading(false);
      }, () => {
        if (!active) return;
        setProperty(null);
        setError('Impossible de charger les informations de partage. Vérifiez votre connexion puis réessayez.');
        setIsLoading(false);
      });
    });

    return () => {
      active = false;
      stopProperty?.();
      stopAuth();
    };
  }, [propertyId]);

  const publicUrl = origin && property?.publicToken
    ? new URL(`/guide/${encodeURIComponent(property.publicToken)}`, origin).toString()
    : '';
  const qrCodeUrl = property?.status === 'published' && generatedQrCode?.publicUrl === publicUrl
    ? generatedQrCode.dataUrl
    : '';

  useEffect(() => {
    let active = true;
    if (!publicUrl || property?.status !== 'published') return () => { active = false; };

    void QRCode.toDataURL(`${publicUrl}?source=qr`, {
      width: 900,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#17232c', light: '#ffffff' },
    }).then((dataUrl) => {
      if (active) setGeneratedQrCode({ publicUrl, dataUrl });
    }).catch(() => {
      if (active) setError('Impossible de générer le QR code. Réessayez dans un instant.');
    });

    return () => { active = false; };
  }, [publicUrl, property?.status]);

  const copyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('La copie automatique est indisponible. Sélectionnez puis copiez le lien affiché.');
    }
  };

  const shareLink = async () => {
    if (!publicUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Livret d’accueil — ${property?.name ?? 'Mon logement'}`, url: publicUrl });
        return;
      } catch (shareError) {
        if (shareError instanceof Error && shareError.name === 'AbortError') return;
      }
    }
    await copyLink();
  };

  return (
    <OwnerPageShell title={property?.name ? `Partager · ${property.name}` : 'Partager mon livret'} subtitle="Copiez le lien ou téléchargez un QR code prêt à transmettre aux voyageurs.">
      <Link href={property ? ROUTES.OWNER_PROPERTY_DETAIL(property.id) : ROUTES.OWNER_PROPERTIES} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#65706b] transition hover:text-[#1f2925]">
        <ArrowLeft size={16} /> Retour au logement
      </Link>

      {error && <p role="alert" className="mb-5 rounded-2xl border border-[#efc1bd] bg-[#fdeceb] px-5 py-4 text-sm text-[#b8453c]">{error}</p>}

      {isLoading ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]" aria-label="Chargement du partage">
          <div className="h-72 animate-pulse rounded-[2rem] bg-white" />
          <div className="h-72 animate-pulse rounded-[2rem] bg-white" />
        </div>
      ) : property ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-[2rem] border border-[#e4ddd6] bg-white p-6 shadow-[0_16px_38px_rgba(31,41,37,.05)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f5f2ec] px-3 py-1.5 text-xs font-semibold text-[#59635e]"><MapPin size={14} />{property.city || 'Ville à renseigner'}</span>
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${property.status === 'published' ? 'bg-[#eaf5f1] text-[#286454]' : 'bg-[#f5f2ec] text-[#77736f]'}`}>
                {property.status === 'published' ? 'Livret publié' : 'Brouillon'}
              </span>
            </div>

            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[#24292c] sm:text-3xl">{property.name}</h1>
            <p className="mt-2 text-sm leading-6 text-[#77736f]">{property.address || 'Ajoutez une adresse depuis la fiche du logement.'}</p>

            {property.status === 'published' ? (
              <>
                <label htmlFor="guest-booklet-link" className="mt-8 block text-xs font-bold uppercase tracking-[.12em] text-[#79827d]">Lien voyageur</label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input id="guest-booklet-link" readOnly value={publicUrl} className="h-12 min-w-0 flex-1 rounded-xl border border-[#e3ddd6] bg-[#faf8f5] px-4 text-sm text-[#39443f] outline-none" />
                  <Button type="button" onClick={() => void copyLink()} className="h-12 rounded-xl bg-[#17232c] px-5 text-white hover:bg-[#293d46]">
                    {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}{copied ? 'Lien copié' : 'Copier le lien'}
                  </Button>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={() => void shareLink()} className="h-11 rounded-xl border-[#ded8d1]">
                    <Share2 size={16} className="mr-2" />Partager…
                  </Button>
                  <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-xl border border-[#ded8d1] px-4 text-sm font-semibold text-[#33413b] transition hover:bg-[#faf8f5]">
                    <ExternalLink size={15} className="mr-2" />Voir le livret public
                  </a>
                </div>
              </>
            ) : (
              <div className="mt-8 rounded-2xl border border-[#f0d0c3] bg-[#fff5f0] p-5">
                <p className="font-semibold text-[#613d30]">Publiez le livret pour activer son lien et son QR code.</p>
                <p className="mt-1 text-sm leading-6 text-[#85675b]">Vos voyageurs ne pourront pas encore l’ouvrir. Vous pourrez revenir ici dès que le livret sera publié.</p>
                <Link href={ROUTES.OWNER_PROPERTY_DETAIL(property.id)} className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#17232c] px-4 text-sm font-semibold text-white transition hover:bg-[#293d46]">
                  <CalendarDays size={15} />Compléter ou publier<ExternalLink size={14} />
                </Link>
              </div>
            )}

            <p className="mt-8 border-t border-[#eee8e2] pt-4 text-xs text-[#8a918e]">Dernière mise à jour : {property.updatedAt}</p>
          </section>

          <section className="rounded-[2rem] border border-[#e4ddd6] bg-white p-6 shadow-[0_16px_38px_rgba(31,41,37,.05)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#d85b24]">QR code du logement</p><h2 className="mt-2 text-xl font-semibold text-[#24292c]">À imprimer ou à envoyer</h2></div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5e9e2] text-[#d85b24]"><QrCode size={19} /></span>
            </div>

            <div className="mt-6 flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-[#ded8d1] bg-[#faf8f5] p-5">
              {qrCodeUrl ? (
                <Image src={qrCodeUrl} alt={`QR code du livret ${property.name}`} width={240} height={240} unoptimized className="h-56 w-56 rounded-2xl bg-white p-3 shadow-sm" />
              ) : (
                <div className="max-w-xs text-center">
                  <QrCode className="mx-auto text-[#a49a91]" size={38} />
                  <p className="mt-3 text-sm font-semibold text-[#58625d]">{property.status === 'published' ? 'Génération du QR code…' : 'QR code disponible après publication'}</p>
                  {property.status === 'published' && <p className="mt-1 text-xs text-[#8a918e]">Le code sera prêt dans quelques secondes.</p>}
                </div>
              )}
            </div>

            {qrCodeUrl ? (
              <a href={qrCodeUrl} download={`qr-code-${property.name || 'mon-livret'}.png`} className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#ded8d1] text-sm font-medium text-[#17232c] transition hover:bg-[#faf8f5]">
                <Download size={16} className="mr-2" />Télécharger le QR code (PNG)
              </a>
            ) : (
              <Button type="button" variant="outline" disabled className="mt-4 h-11 w-full rounded-xl border-[#ded8d1] disabled:cursor-not-allowed">
                <Download size={16} className="mr-2" />Télécharger le QR code (PNG)
              </Button>
            )}
            <p className="mt-4 text-center text-xs leading-5 text-[#8a918e]">Le QR code ouvre le même lien sécurisé que le bouton de copie.</p>
          </section>
        </div>
      ) : (
        <section className="rounded-[2rem] border border-dashed border-[#d7d0c9] bg-white px-6 py-14 text-center">
          <QrCode className="mx-auto text-[#d85b24]" size={30} />
          <h1 className="mt-4 text-xl font-semibold text-[#24292c]">Partage indisponible</h1>
          <p className="mt-2 text-sm text-[#77736f]">Choisissez un logement qui vous appartient pour préparer son lien voyageur et son QR code.</p>
          <Link href={ROUTES.OWNER_PROPERTIES} className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#17232c] px-5 text-sm font-semibold text-white">Voir mes logements</Link>
        </section>
      )}
    </OwnerPageShell>
  );
}
