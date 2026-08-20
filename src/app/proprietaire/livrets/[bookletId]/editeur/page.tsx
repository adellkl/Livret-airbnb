'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { ArrowLeft, Check, ChevronDown, ImageIcon, Plus, Save, Trash2 } from 'lucide-react';
import OwnerPageShell from '@/components/owner/OwnerPageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/config/routes';
import { firebaseAuth, firestore } from '@/lib/firebase/client';

type FormValues = Record<string, string>;
type NearbyPlace = { name: string; category: string; address: string; note: string };
type GalleryImage = { url: string; caption: string };

function asText(value: unknown) { return typeof value === 'string' ? value : ''; }

export default function SimpleBookletEditorPage() {
  const params = useParams<{ bookletId: string }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [values, setValues] = useState<FormValues>({});
  const [houseRules, setHouseRules] = useState<string[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const stopAuth = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) { router.replace(ROUTES.LOGIN); return; }
      const snapshot = await getDoc(doc(firestore, 'properties', params.bookletId));
      if (!active) return;
      if (!snapshot.exists() || snapshot.data().ownerId !== user.uid) { router.replace(ROUTES.OWNER_PROPERTIES); return; }
      const data = snapshot.data();
      setName(asText(data.name) || 'Votre livret');
      setValues({
        welcomeTitle: asText(data.welcomeTitle) || 'Bienvenue chez vous',
        welcomeSubtitle: asText(data.welcomeSubtitle) || 'Votre guide privé pour un séjour serein',
        hostMessage: asText(data.hostMessage),
        checkIn: asText(data.checkIn),
        checkOut: asText(data.checkOut),
        arrivalInstructions: asText(data.arrivalInstructions),
        accessCode: asText(data.accessCode),
        parkingInstructions: asText(data.parkingInstructions),
        wifiName: asText(data.wifiName),
        wifiPassword: asText(data.wifiPassword),
        hostName: asText(data.hostName),
        hostPhone: asText(data.hostPhone),
        hostEmail: asText(data.hostEmail),
        emergencyContact: asText(data.emergencyContact),
      });
      setHouseRules(Array.isArray(data.houseRules) ? data.houseRules.map(String) : []);
      setNearbyPlaces(Array.isArray(data.nearbyPlaces) ? data.nearbyPlaces.map((place) => {
        const item = place && typeof place === 'object' ? place as Record<string, unknown> : {};
        return { name: asText(item.name), category: asText(item.category), address: asText(item.address), note: asText(item.note) };
      }) : []);
      setGallery(Array.isArray(data.gallery) ? data.gallery.map((image) => {
        const item = image && typeof image === 'object' ? image as Record<string, unknown> : {};
        return { url: asText(item.url), caption: asText(item.caption) };
      }) : []);
      setLoading(false);
    });
    return () => { active = false; stopAuth(); };
  }, [params.bookletId, router]);

  const save = async () => {
    setSaving(true); setMessage('');
    try {
      const changes = {
        ...values,
        houseRules: houseRules.map((rule) => rule.trim()).filter(Boolean),
        nearbyPlaces: nearbyPlaces.filter((place) => place.name.trim()).map((place) => ({ name: place.name.trim(), category: place.category.trim(), address: place.address.trim(), note: place.note.trim() })),
        gallery: gallery.filter((image) => image.url.trim()).map((image) => ({ url: image.url.trim(), caption: image.caption.trim() })),
        updatedAt: serverTimestamp(),
      };
      const batch = writeBatch(firestore);
      batch.update(doc(firestore, 'properties', params.bookletId), changes);
      batch.set(doc(firestore, 'public_guides', params.bookletId), { ...changes, propertyId: params.bookletId }, { merge: true });
      await batch.commit();
      setMessage('Les informations du livret sont sauvegardées.');
    } catch { setMessage('Impossible de sauvegarder les informations.'); } finally { setSaving(false); }
  };
  const update = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  if (loading) return <div className="min-h-screen bg-[#f6f3ef]" />;

  return <OwnerPageShell title={'Modifier le livret · ' + name} subtitle="Retrouvez et modifiez les informations déjà présentes dans votre logement.">
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4"><Button variant="ghost" onClick={() => router.push(ROUTES.OWNER_BOOKLETS)}><ArrowLeft className="mr-2 h-4 w-4" />Retour aux livrets</Button><Button onClick={() => void save()} disabled={saving} className="bg-[#d85b24] text-white hover:bg-[#c84e1b]"><Save className="mr-2 h-4 w-4" />{saving ? 'Sauvegarde…' : 'Sauvegarder'}</Button></div>
      <div className="space-y-4">
        <EditorPanel title="Bienvenue" description="Les premiers mots que découvrent vos voyageurs." defaultOpen><FormField label="Titre d’accueil"><Input value={values.welcomeTitle ?? ''} onChange={(event) => update('welcomeTitle', event.target.value)} /></FormField><FormField label="Sous-titre"><Input value={values.welcomeSubtitle ?? ''} onChange={(event) => update('welcomeSubtitle', event.target.value)} /></FormField><FormField label="Message personnel"><Textarea value={values.hostMessage ?? ''} onChange={(event) => update('hostMessage', event.target.value)} /></FormField></EditorPanel>
        <EditorPanel title="Arrivée et accès" description="Horaires, arrivée, accès et stationnement."><div className="grid gap-4 sm:grid-cols-2"><FormField label="Heure d’arrivée"><Input type="time" value={values.checkIn ?? ''} onChange={(event) => update('checkIn', event.target.value)} /></FormField><FormField label="Heure de départ"><Input type="time" value={values.checkOut ?? ''} onChange={(event) => update('checkOut', event.target.value)} /></FormField></div><FormField label="Instructions d’arrivée"><Textarea value={values.arrivalInstructions ?? ''} onChange={(event) => update('arrivalInstructions', event.target.value)} /></FormField><FormField label="Code d’accès / boîte à clés"><Input value={values.accessCode ?? ''} onChange={(event) => update('accessCode', event.target.value)} /></FormField><FormField label="Stationnement"><Textarea value={values.parkingInstructions ?? ''} onChange={(event) => update('parkingInstructions', event.target.value)} /></FormField></EditorPanel>
        <EditorPanel title="Wi-Fi et équipements" description="Les identifiants pratiques du logement."><div className="grid gap-4 sm:grid-cols-2"><FormField label="Nom du réseau Wi-Fi"><Input value={values.wifiName ?? ''} onChange={(event) => update('wifiName', event.target.value)} /></FormField><FormField label="Mot de passe Wi-Fi"><Input value={values.wifiPassword ?? ''} onChange={(event) => update('wifiPassword', event.target.value)} /></FormField></div></EditorPanel>
        <EditorPanel title="Règles de la maison" description="Une règle par champ, visible dans le guide."><div className="space-y-3">{houseRules.map((rule, index) => <div key={index} className="flex gap-2"><Input value={rule} onChange={(event) => setHouseRules((items) => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder="Ex. Logement non-fumeur" /><Button type="button" variant="outline" size="icon" onClick={() => setHouseRules((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label="Supprimer cette règle"><Trash2 size={16} /></Button></div>)}<Button type="button" variant="outline" onClick={() => setHouseRules((items) => [...items, ''])}><Plus size={16} className="mr-2" />Ajouter une règle</Button></div></EditorPanel>
        <EditorPanel title="Bonnes adresses" description="Ajoutez vos recommandations avec tous les détails utiles."><div className="space-y-4">{nearbyPlaces.map((place, index) => <div key={index} className="rounded-2xl border border-[#e8e0d8] bg-[#fcfbf9] p-4"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Adresse {index + 1}</p><Button type="button" variant="ghost" size="icon" onClick={() => setNearbyPlaces((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label="Supprimer cette adresse"><Trash2 size={16} className="text-[#b8453c]" /></Button></div><div className="grid gap-3 sm:grid-cols-2"><FormField label="Nom"><Input value={place.name} onChange={(event) => setNearbyPlaces((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} /></FormField><FormField label="Catégorie"><Input value={place.category} onChange={(event) => setNearbyPlaces((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, category: event.target.value } : item))} placeholder="Restaurant, café…" /></FormField><FormField label="Adresse"><Input value={place.address} onChange={(event) => setNearbyPlaces((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, address: event.target.value } : item))} /></FormField><FormField label="Votre note"><Input value={place.note} onChange={(event) => setNearbyPlaces((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, note: event.target.value } : item))} placeholder="Pourquoi la recommander ?" /></FormField></div></div>)}<Button type="button" variant="outline" onClick={() => setNearbyPlaces((items) => [...items, { name: '', category: '', address: '', note: '' }])}><Plus size={16} className="mr-2" />Ajouter une adresse</Button></div></EditorPanel>
        <EditorPanel title="Galerie photos" description="Ajoutez ou modifiez les images du guide."><div className="space-y-3">{gallery.map((image, index) => <div key={index} className="grid gap-3 rounded-2xl border border-[#e8e0d8] bg-[#fcfbf9] p-4 sm:grid-cols-[1fr_1fr_auto]"><FormField label="URL de l’image"><Input value={image.url} onChange={(event) => setGallery((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} placeholder="https://…" /></FormField><FormField label="Légende"><Input value={image.caption} onChange={(event) => setGallery((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, caption: event.target.value } : item))} /></FormField><Button type="button" variant="outline" size="icon" className="self-end" onClick={() => setGallery((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label="Supprimer cette image"><Trash2 size={16} /></Button></div>)}<Button type="button" variant="outline" onClick={() => setGallery((items) => [...items, { url: '', caption: '' }])}><ImageIcon size={16} className="mr-2" />Ajouter une image</Button></div></EditorPanel>
        <EditorPanel title="Contact" description="Les coordonnées à utiliser pendant le séjour."><div className="grid gap-4 sm:grid-cols-2"><FormField label="Nom de l’hôte"><Input value={values.hostName ?? ''} onChange={(event) => update('hostName', event.target.value)} /></FormField><FormField label="Téléphone"><Input value={values.hostPhone ?? ''} onChange={(event) => update('hostPhone', event.target.value)} /></FormField><FormField label="E-mail"><Input value={values.hostEmail ?? ''} onChange={(event) => update('hostEmail', event.target.value)} /></FormField><FormField label="Contact d’urgence"><Input value={values.emergencyContact ?? ''} onChange={(event) => update('emergencyContact', event.target.value)} /></FormField></div></EditorPanel>
      </div>
      {message && <div role="status" className={'fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(31,41,37,.18)] ' + (message.startsWith('Les') ? 'bg-[#286454]' : 'bg-[#b8453c]')}>{message.startsWith('Les') && <Check className="h-4 w-4" />}{message}</div>}
    </div>
  </OwnerPageShell>;
}

function EditorPanel({ title, description, defaultOpen = false, children }: { title: string; description: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return <section className="overflow-hidden rounded-[1.6rem] border border-[#e4ddd6] bg-white"><button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"><div><h2 className="text-lg font-semibold text-[#24292c]">{title}</h2><p className="mt-1 text-sm text-[#77736f]">{description}</p></div><ChevronDown className={`h-5 w-5 shrink-0 text-[#77736f] transition-transform duration-300 ${open ? 'rotate-180' : ''}`} /></button><div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}><div className="overflow-hidden"><div className={`border-t border-[#eee8e2] p-6 space-y-5 transition-opacity duration-200 ${open ? 'opacity-100 delay-100' : 'opacity-0'}`}>{children}</div></div></div></section>;
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
