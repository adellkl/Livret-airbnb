'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import OwnerSidebar from '@/components/layout/OwnerSidebar';
import DeletePropertyButton from '@/components/owner/DeletePropertyButton';
import DashboardHeader from '@/components/layout/DashboardHeader';
import MobileNavigation from '@/components/layout/MobileNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type OwnerProperty,
} from '@/lib/owner-properties';
import { firebaseAuth, firestore } from '@/lib/firebase/client';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { toOwnerProperty } from '@/lib/property-mappers';
import { ROUTES } from '@/config/routes';
import { 
  Copy,
  Download,
  ExternalLink,
  Share2,
  Mail,
  QrCode,
  Eye,
  Smartphone,
  Lock,
  Calendar,
  ArrowRight,
  Globe2,
} from 'lucide-react';

export default function PropertyDetailPage() {
  const params = useParams<{ propertyId: string }>();
  const router = useRouter();
  const [ownerProperty, setOwnerProperty] = useState<OwnerProperty>(
    {
      id: '', name: '', type: '', address: '', city: '', postalCode: '', capacity: 0,
      bedrooms: 0, checkIn: '', checkOut: '', wifiName: '', wifiPassword: '', description: '',
      hostName: '', hostPhone: '', hostEmail: '', coverImage: '', status: 'draft', views: 0,
      completion: 0, updatedAt: '',
    }
  );
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isUpdatingPublication, setIsUpdatingPublication] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        router.replace('/connexion');
        return;
      }
      try {
        const snapshot = await getDoc(doc(firestore, 'properties', params.propertyId));
        if (!active) return;
        if (!snapshot.exists()) {
          setLoadError('Ce logement est introuvable ou ne vous appartient pas.');
          return;
        }
        setOwnerProperty(toOwnerProperty({ id: snapshot.id, ...snapshot.data() }));
      } catch {
        if (active) setLoadError('Impossible de charger ce logement. Vérifiez votre connexion puis réessayez.');
      }
    });
    return () => { active = false; unsubscribe(); };
  }, [params.propertyId, router]);

  const publicUrl = typeof window === 'undefined'
    ? `/guide/${ownerProperty.id}`
    : `${window.location.origin}/guide/${ownerProperty.id}`;
  const previewUrl = ownerProperty.status === 'published' ? publicUrl : `${publicUrl}?preview=1`;
  const qrUrl = `${publicUrl}?source=qr`;

  useEffect(() => {
    if (!ownerProperty.id) return;
    let active = true;
    QRCode.toDataURL(qrUrl, {
      width: 900,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#17232c', light: '#ffffff' },
    }).then((value) => { if (active) setQrCodeUrl(value); });
    return () => { active = false; };
  }, [ownerProperty.id, qrUrl]);

  const copyPublicLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const togglePublicationStatus = async () => {
    const user = firebaseAuth.currentUser;
    if (!user || !ownerProperty.id || isUpdatingPublication) return;
    const nextStatus = ownerProperty.status === 'published' ? 'draft' : 'published';
    setIsUpdatingPublication(true);
    setLoadError('');
    try {
      const batch = writeBatch(firestore);
      const changes = {
        status: nextStatus,
        updatedAt: serverTimestamp(),
        publishedAt: nextStatus === 'published' ? serverTimestamp() : null,
      };
      batch.set(doc(firestore, 'properties', ownerProperty.id), changes, { merge: true });
      batch.set(doc(firestore, 'public_guides', ownerProperty.id), {
        ...changes,
        propertyId: ownerProperty.id,
        ownerId: user.uid,
      }, { merge: true });
      await batch.commit();
      setOwnerProperty((current) => ({ ...current, status: nextStatus }));
    } catch {
      setLoadError('Impossible de modifier la publication du livret. Réessayez dans un instant.');
    } finally {
      setIsUpdatingPublication(false);
    }
  };

  const property = {
    ...ownerProperty,
    address: `${ownerProperty.address}, ${ownerProperty.postalCode} ${ownerProperty.city}`,
    image: ownerProperty.coverImage,
    linkStatus: ownerProperty.id ? 'active' : 'inactive',
    createdAt: ownerProperty.createdAt || '—',
    lastModified: ownerProperty.updatedAt,
    secureLink: publicUrl,
  };

  return (
    <div className="min-h-screen bg-background">
      <OwnerSidebar />
      <MobileNavigation type="owner" />
      
      <div className="lg:ml-[250px]">
        <DashboardHeader title={property.name} />

        <main className="mx-auto max-w-[1440px] px-4 py-5 pb-24 sm:px-8 sm:py-8">
          {loadError && <div className="mb-6 rounded-2xl border border-[#efc1bd] bg-[#fdeceb] px-5 py-4 text-sm text-[#b8453c]">{loadError}</div>}
          <div className="mb-6 grid gap-5 lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2">
              <div className="relative mb-5 h-52 overflow-hidden rounded-2xl bg-surface-soft sm:h-64">
                {property.image ? (
                  <Image src={property.image} alt={property.name} fill unoptimized sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Aucune photo de couverture</div>
                )}
              </div>
              
              <div className="mb-5 rounded-2xl bg-surface p-4 shadow-premium sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Informations</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={property.status === 'published' ? 'default' : 'secondary'} className={
                      property.status === 'published' 
                        ? 'bg-success-light text-success' 
                        : 'bg-surface-soft text-muted-foreground'
                    }>
                      {property.status === 'published' ? 'Publié' : 'Brouillon'}
                    </Badge>
                    <Badge variant={property.linkStatus === 'active' ? 'default' : 'secondary'} className={
                      property.linkStatus === 'active' 
                        ? 'bg-success-light text-success' 
                        : 'bg-surface-soft text-muted-foreground'
                    }>
                      {property.linkStatus === 'active' ? 'Lien actif' : 'Lien inactif'}
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!ownerProperty.id || isUpdatingPublication}
                      onClick={() => void togglePublicationStatus()}
                      className={property.status === 'published'
                        ? 'h-9 rounded-xl border border-[#d8d1ca] bg-white px-3 text-xs font-semibold text-[#3f514d] hover:bg-[#f8f5f1]'
                        : 'h-9 rounded-xl bg-[#17232c] px-3 text-xs font-semibold text-white hover:bg-[#263944]'}
                    >
                      <Globe2 size={15} className="mr-1.5" />
                      {isUpdatingPublication
                        ? 'Mise à jour…'
                        : property.status === 'published'
                          ? 'Passer en brouillon'
                          : 'Publier le livret'}
                    </Button>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:justify-between">
                    <span className="text-muted-foreground">Adresse</span>
                    <span className="text-foreground">{property.address}</span>
                  </div>
                  <div className="flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:justify-between">
                    <span className="text-muted-foreground">Date de création</span>
                    <span className="text-foreground">{property.createdAt}</span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <span className="text-muted-foreground">Dernière modification</span>
                    <span className="text-foreground">{property.lastModified}</span>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="link" className="overflow-hidden rounded-2xl bg-surface shadow-premium">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-none border-b border-border bg-[#faf8f5] p-3 sm:p-4">
                  <TabsTrigger value="link" className="h-11 min-w-0 rounded-xl border border-[#e3ddd6] bg-white px-3 text-xs font-semibold text-[#5d625f] shadow-sm transition-all hover:border-[#d85b24]/40 hover:text-[#17232c] data-active:border-[#17232c] data-active:bg-[#17232c] data-active:text-white data-active:shadow-[0_8px_18px_rgba(23,35,44,.18)] after:hidden sm:text-sm">
                    <Copy size={15} />
                    <span className="truncate">Lien d&apos;accès</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="h-11 min-w-0 rounded-xl border border-[#e3ddd6] bg-white px-3 text-xs font-semibold text-[#5d625f] shadow-sm transition-all hover:border-[#d85b24]/40 hover:text-[#17232c] data-active:border-[#d85b24] data-active:bg-[#d85b24] data-active:text-white data-active:shadow-[0_8px_18px_rgba(216,91,36,.2)] after:hidden sm:text-sm">
                    <Share2 size={15} />
                    <span className="truncate">Partager</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="link" className="p-4 sm:p-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">Lien sécurisé unique</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={property.secureLink}
                          readOnly
                          className="flex-1 px-4 py-3 bg-surface-soft border border-border rounded-lg text-sm text-foreground"
                        />
                        <Button variant="outline" size="sm" className="h-12" onClick={() => void copyPublicLink()} disabled={!ownerProperty.id}>
                          <Copy size={16} className="mr-2" />
                          {copied ? 'Copié !' : 'Copier'}
                        </Button>
                        <Button variant="outline" size="sm" className="h-12" onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')} disabled={!ownerProperty.id}>
                          <ExternalLink size={16} className="mr-2" />
                          Ouvrir
                        </Button>
                      </div>
                    </div>

                    <div id="qr-code-section">
                      <h4 className="text-sm font-medium text-foreground mb-3">QR Code</h4>
                      <div className="bg-surface-soft rounded-lg p-6 flex min-h-48 items-center justify-center mb-4">
                        {qrCodeUrl ? <Image src={qrCodeUrl} alt={`QR code du livret ${property.name}`} width={176} height={176} unoptimized className="h-44 w-44 rounded-xl bg-white p-2" /> : <div className="text-center text-sm text-muted-foreground"><QrCode size={40} className="mx-auto mb-3" />Génération du QR code…</div>}
                      </div>
                      <a href={qrCodeUrl || undefined} download={`qr-code-${ownerProperty.name || 'livret'}.png`} className="block">
                      <Button variant="outline" className="w-full" disabled={!qrCodeUrl}>
                        <Download size={16} className="mr-2" />
                        Télécharger le QR code
                      </Button>
                      </a>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">Modes d&apos;accès</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-surface-soft rounded-lg">
                          <div className="flex items-center gap-3">
                            <Lock size={18} className="text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-foreground">Public</p>
                              <p className="text-xs text-muted-foreground">Accès sans restriction</p>
                            </div>
                          </div>
                          <Badge className="bg-success-light text-success">Actif</Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-surface-soft rounded-lg opacity-60">
                          <div className="flex items-center gap-3">
                            <Smartphone size={18} className="text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-foreground">Protégé par code</p>
                              <p className="text-xs text-muted-foreground">Code à 4 chiffres</p>
                            </div>
                          </div>
                          <Badge variant="secondary">Inactif</Badge>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#cfe7dc] bg-[#edf7f2] p-4">
                          <div className="flex items-center gap-3">
                            <Calendar size={18} className="text-[#367566]" />
                            <div>
                              <p className="text-sm font-medium text-foreground">Accès par réservation</p>
                              <p className="text-xs text-muted-foreground">Un QR code unique, automatiquement expiré après le départ</p>
                            </div>
                          </div>
                          <Link href="/proprietaire/reservations" className="inline-flex items-center gap-2 rounded-lg bg-[#367566] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2f6558]">
                            Gérer les séjours <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-[#17232c] p-5 text-white">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#ef8b64]"><Eye size={19} /></span>
                        <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Voyez le livret comme un voyageur</p><p className="mt-1 text-xs leading-5 text-white/65">Vérifiez le contenu, le lien et l’affichage sur mobile avant de le partager.</p></div>
                      </div>
                      <Button className="mt-4 h-11 w-full rounded-xl bg-[#e7754d] text-white hover:bg-[#f1855e]" onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')} disabled={!ownerProperty.id}>
                        <ExternalLink size={16} className="mr-2" /> Ouvrir l’aperçu public
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button type="button" onClick={() => window.location.assign(`mailto:?subject=${encodeURIComponent(`Livret d’accueil — ${ownerProperty.name}`)}&body=${encodeURIComponent(publicUrl)}`)} disabled={!ownerProperty.id} className="group rounded-2xl border border-[#e7dfd8] bg-[#fcfaf8] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#e7754d]/45 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4e5df] text-[#d85b24]"><Mail size={18} /></span>
                        <p className="mt-4 text-sm font-semibold text-[#26322d]">Envoyer par e-mail</p>
                        <p className="mt-1 text-xs leading-5 text-[#77736f]">Prépare un e-mail avec le lien du livret.</p>
                      </button>
                      <button type="button" onClick={() => void copyPublicLink()} disabled={!ownerProperty.id} className="group rounded-2xl border border-[#e7dfd8] bg-[#fcfaf8] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#e7754d]/45 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4e5df] text-[#d85b24]"><Copy size={18} /></span>
                        <p className="mt-4 text-sm font-semibold text-[#26322d]">{copied ? 'Lien copié !' : 'Copier le lien'}</p>
                        <p className="mt-1 text-xs leading-5 text-[#77736f]">Collez-le dans votre message de réservation.</p>
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 rounded-2xl border border-[#e7dfd8] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf5f1] text-[#367566]"><Share2 size={18} /></span><div><p className="text-sm font-semibold text-[#26322d]">Inviter vos voyageurs</p><p className="mt-1 text-xs leading-5 text-[#77736f]">Le lien est prêt à être transmis à chaque réservation.</p></div></div>
                      <Button variant="outline" className="h-10 shrink-0 rounded-xl border-[#ded8d1]" onClick={() => void copyPublicLink()} disabled={!ownerProperty.id}>{copied ? 'Copié' : 'Copier le lien'}</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-6">
              <div className="bg-surface rounded-xl p-6 shadow-premium">
                <h3 className="text-lg font-semibold text-foreground mb-4">Actions rapides</h3>
                <div className="space-y-2">
                  <DeletePropertyButton propertyId={ownerProperty.id} propertyName={ownerProperty.name} disabled={isUpdatingPublication} onDeleted={() => {
                    window.sessionStorage.setItem('livret-property-deleted', ownerProperty.name);
                    router.replace('/proprietaire/logements');
                  }} />
                  <Button variant="ghost" className="w-full justify-start" onClick={() => window.location.assign(`mailto:?subject=${encodeURIComponent(`Livret d’accueil — ${ownerProperty.name}`)}&body=${encodeURIComponent(publicUrl)}`)} disabled={!ownerProperty.id}>
                    <Mail size={18} className="mr-3 text-muted-foreground" />
                    Envoyer par e-mail
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push(ROUTES.OWNER_PROPERTY_SHARE(ownerProperty.id))} disabled={!ownerProperty.id}>
                    <QrCode size={18} className="mr-3 text-muted-foreground" />
                    Générer QR code
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => void copyPublicLink()} disabled={!ownerProperty.id}>
                    <Copy size={18} className="mr-3 text-muted-foreground" />
                    Copier le lien
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
