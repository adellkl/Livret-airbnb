'use client';

import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { ArrowLeft, Check, ChevronDown, ImageIcon, Plus, Save, Trash2, Upload } from 'lucide-react';
import OwnerPageShell from '@/components/owner/OwnerPageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/config/routes';
import { firebaseAuth, firestore } from '@/lib/firebase/client';
import { compressImageToDataUrl } from '@/lib/image-data-url';

type FormValues = Record<string, string>;
type NearbyPlace = { name: string; category: string; address: string; postalCode: string; city: string; note: string; imageUrl: string };
type GalleryImage = { url: string; caption: string };
type EquipmentGuide = { name: string; instructions: string; imageUrl: string };

function asText(value: unknown) { return typeof value === 'string' ? value : ''; }

export default function SimpleBookletEditorPage() {
  const params = useParams<{ bookletId: string }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [values, setValues] = useState<FormValues>({});
  const [houseRules, setHouseRules] = useState<string[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [equipmentGuides, setEquipmentGuides] = useState<EquipmentGuide[]>([]);
  const [equipmentPhotoIndex, setEquipmentPhotoIndex] = useState<number | null>(null);
  const [nearbyPhotoIndex, setNearbyPhotoIndex] = useState<number | null>(null);
  const equipmentPhotoInputRef = useRef<HTMLInputElement>(null);
  const nearbyPhotoInputRef = useRef<HTMLInputElement>(null);
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
        return { name: asText(item.name), category: asText(item.category), address: asText(item.address), postalCode: asText(item.postalCode), city: asText(item.city), note: asText(item.note), imageUrl: asText(item.imageUrl) };
      }) : []);
      setGallery(Array.isArray(data.gallery) ? data.gallery.map((image) => {
        const item = image && typeof image === 'object' ? image as Record<string, unknown> : {};
        return { url: asText(item.url), caption: asText(item.caption) };
      }) : []);
      setEquipmentGuides(Array.isArray(data.equipmentGuides) ? data.equipmentGuides.map((equipment) => {
        const item = equipment && typeof equipment === 'object' ? equipment as Record<string, unknown> : {};
        return { name: asText(item.name), instructions: asText(item.instructions), imageUrl: asText(item.imageUrl) };
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
        nearbyPlaces: nearbyPlaces.filter((place) => place.name.trim()).map((place) => ({ name: place.name.trim(), category: place.category.trim(), address: place.address.trim(), postalCode: place.postalCode.trim(), city: place.city.trim(), note: place.note.trim(), imageUrl: place.imageUrl })),
        gallery: gallery.filter((image) => image.url.trim()).map((image) => ({ url: image.url.trim(), caption: image.caption.trim() })),
        equipmentGuides: equipmentGuides.filter((equipment) => equipment.name.trim()).map((equipment) => ({ name: equipment.name.trim(), instructions: equipment.instructions.trim(), imageUrl: equipment.imageUrl })),
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
  const importImage = async (event: ChangeEvent<HTMLInputElement>, onImported: (url: string) => void) => {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!file) return;
    setMessage('');
    if (!file.type.startsWith('image/')) { setMessage('Choisissez un fichier image (JPG, PNG, WebP ou AVIF).'); return; }
    if (file.size > 25 * 1024 * 1024) { setMessage('L’image est trop volumineuse. La taille maximale est de 25 Mo.'); return; }
    try {
      onImported(await compressImageToDataUrl(file));
    } catch {
      setMessage('Impossible de préparer cette image. Choisissez une photo plus légère.');
    }
  };

  if (loading) return <div className="min-h-screen bg-[#f6f3ef]" />;

  return <OwnerPageShell title={'Modifier le livret · ' + name} subtitle="Retrouvez et modifiez les informations déjà présentes dans votre logement.">
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4"><Button variant="ghost" onClick={() => router.push(ROUTES.OWNER_BOOKLETS)}><ArrowLeft className="mr-2 h-4 w-4" />Retour aux livrets</Button><Button onClick={() => void save()} disabled={saving} className="bg-[#d85b24] text-white hover:bg-[#c84e1b]"><Save className="mr-2 h-4 w-4" />{saving ? 'Sauvegarde…' : 'Sauvegarder'}</Button></div>
      <div className="space-y-4">
        <EditorPanel title="Bienvenue" description="Les premiers mots que découvrent vos voyageurs." defaultOpen><FormField label="Titre d’accueil"><Input value={values.welcomeTitle ?? ''} onChange={(event) => update('welcomeTitle', event.target.value)} /></FormField><FormField label="Sous-titre"><Input value={values.welcomeSubtitle ?? ''} onChange={(event) => update('welcomeSubtitle', event.target.value)} /></FormField><FormField label="Message personnel"><Textarea value={values.hostMessage ?? ''} onChange={(event) => update('hostMessage', event.target.value)} /></FormField></EditorPanel>
        <EditorPanel title="Arrivée et accès" description="Horaires, arrivée, accès et stationnement."><div className="grid gap-4 sm:grid-cols-2"><FormField label="Heure d’arrivée"><Input type="time" value={values.checkIn ?? ''} onChange={(event) => update('checkIn', event.target.value)} /></FormField><FormField label="Heure de départ"><Input type="time" value={values.checkOut ?? ''} onChange={(event) => update('checkOut', event.target.value)} /></FormField></div><FormField label="Instructions d’arrivée"><Textarea value={values.arrivalInstructions ?? ''} onChange={(event) => update('arrivalInstructions', event.target.value)} /></FormField><FormField label="Code d’accès / boîte à clés"><Input value={values.accessCode ?? ''} onChange={(event) => update('accessCode', event.target.value)} /></FormField><FormField label="Stationnement"><Textarea value={values.parkingInstructions ?? ''} onChange={(event) => update('parkingInstructions', event.target.value)} /></FormField></EditorPanel>
        <EditorPanel title="Wi-Fi" description="Les identifiants pratiques de votre logement."><div className="grid gap-4 sm:grid-cols-2"><FormField label="Nom du réseau Wi-Fi"><Input value={values.wifiName ?? ''} onChange={(event) => update('wifiName', event.target.value)} /></FormField><FormField label="Mot de passe Wi-Fi"><Input value={values.wifiPassword ?? ''} onChange={(event) => update('wifiPassword', event.target.value)} /></FormField></div></EditorPanel>
        <EditorPanel title="Équipements du logement" description="Ajoutez chaque équipement avec sa photo et ses consignes d’utilisation."><div className="space-y-4">{equipmentGuides.map((equipment, index) => <div key={index} className="grid gap-4 rounded-2xl border border-[#e8e0d8] bg-[#fcfbf9] p-4 sm:grid-cols-[112px_1fr_auto]"><div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f0ebe5]">{equipment.imageUrl ? <Image src={equipment.imageUrl} alt={equipment.name || 'Équipement'} fill unoptimized sizes="112px" className="object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-2 px-2 text-center text-[#8c928c]"><ImageIcon size={20} /><span className="text-[10px] font-medium">Photo à ajouter</span></div>}</div><div className="space-y-3"><Input value={equipment.name} onChange={(event) => setEquipmentGuides((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} placeholder="Ex. Machine à café" /><Textarea value={equipment.instructions} onChange={(event) => setEquipmentGuides((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, instructions: event.target.value } : item))} placeholder="Consignes d’utilisation pour vos voyageurs" className="min-h-20" /><Button type="button" variant="outline" onClick={() => { setEquipmentPhotoIndex(index); equipmentPhotoInputRef.current?.click(); }} className="w-full sm:w-auto"><Upload className="mr-2 h-4 w-4" />{equipment.imageUrl ? 'Modifier la photo' : 'Importer une photo'}</Button></div><Button type="button" variant="ghost" size="icon" onClick={() => setEquipmentGuides((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label="Supprimer cet équipement"><Trash2 size={16} className="text-[#b8453c]" /></Button></div>)}<Input ref={equipmentPhotoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(event) => { const index = equipmentPhotoIndex; setEquipmentPhotoIndex(null); if (index !== null) void importImage(event, (imageUrl) => setEquipmentGuides((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, imageUrl } : item))); }} /><Button type="button" variant="outline" onClick={() => setEquipmentGuides((items) => [...items, { name: '', instructions: '', imageUrl: '' }])}><Plus size={16} className="mr-2" />Ajouter un équipement</Button><p className="text-xs text-[#77736f]">JPG, PNG, WebP ou AVIF · 25 Mo maximum. Les images sont optimisées automatiquement.</p></div></EditorPanel>
        <EditorPanel title="Règles de la maison" description="Une règle par champ, visible dans le guide."><div className="space-y-3">{houseRules.map((rule, index) => <div key={index} className="flex gap-2"><Input value={rule} onChange={(event) => setHouseRules((items) => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder="Ex. Logement non-fumeur" /><Button type="button" variant="outline" size="icon" onClick={() => setHouseRules((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label="Supprimer cette règle"><Trash2 size={16} /></Button></div>)}<Button type="button" variant="outline" onClick={() => setHouseRules((items) => [...items, ''])}><Plus size={16} className="mr-2" />Ajouter une règle</Button></div></EditorPanel>
        <EditorPanel title="Bonnes adresses" description="Ajoutez vos recommandations avec tous les détails utiles et leur photo."><div className="space-y-4">{nearbyPlaces.map((place, index) => <div key={index} className="grid gap-4 rounded-2xl border border-[#e8e0d8] bg-[#fcfbf9] p-4 sm:grid-cols-[112px_1fr]"><div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f0ebe5]">{place.imageUrl ? <Image src={place.imageUrl} alt={place.name || 'Établissement'} fill unoptimized sizes="112px" className="object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-2 px-2 text-center text-[#8c928c]"><ImageIcon size={20} /><span className="text-[10px] font-medium">Photo de l’adresse</span></div>}</div><div><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Adresse {index + 1}</p><Button type="button" variant="ghost" size="icon" onClick={() => setNearbyPlaces((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label="Supprimer cette adresse"><Trash2 size={16} className="text-[#b8453c]" /></Button></div><div className="grid gap-3 sm:grid-cols-2"><FormField label="Nom"><Input value={place.name} onChange={(event) => setNearbyPlaces((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} /></FormField><FormField label="Catégorie"><Input value={place.category} onChange={(event) => setNearbyPlaces((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, category: event.target.value } : item))} placeholder="Restaurant, café…" /></FormField><AddressAutocomplete value={place.address} onChange={(address) => setNearbyPlaces((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, address } : item))} onSelect={({ address, postalCode, city }) => setNearbyPlaces((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, address, postalCode, city } : item))} /><FormField label="Code postal"><Input value={place.postalCode} onChange={(event) => setNearbyPlaces((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, postalCode: event.target.value } : item))} /></FormField><FormField label="Ville"><Input value={place.city} onChange={(event) => setNearbyPlaces((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, city: event.target.value } : item))} /></FormField><FormField label="Votre note"><Input value={place.note} onChange={(event) => setNearbyPlaces((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, note: event.target.value } : item))} placeholder="Pourquoi la recommander ?" /></FormField></div><Button type="button" variant="outline" onClick={() => { setNearbyPhotoIndex(index); nearbyPhotoInputRef.current?.click(); }} className="mt-3"><Upload className="mr-2 h-4 w-4" />{place.imageUrl ? 'Modifier la photo' : 'Importer une photo'}</Button></div></div>)}<Input ref={nearbyPhotoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(event) => { const index = nearbyPhotoIndex; setNearbyPhotoIndex(null); if (index !== null) void importImage(event, (imageUrl) => setNearbyPlaces((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, imageUrl } : item))); }} /><Button type="button" variant="outline" onClick={() => setNearbyPlaces((items) => [...items, { name: '', category: '', address: '', postalCode: '', city: '', note: '', imageUrl: '' }])}><Plus size={16} className="mr-2" />Ajouter une adresse</Button><p className="text-xs text-[#77736f]">Saisissez une adresse pour obtenir des suggestions, puis importez directement la photo de l’établissement.</p></div></EditorPanel>
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

type AddressSuggestion = { label: string; address: string; postalCode: string; city: string };

function AddressAutocomplete({ value, onChange, onSelect }: { value: string; onChange: (value: string) => void; onSelect: (suggestion: AddressSuggestion) => void }) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 3) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(query)}&limit=5&index=address`, { signal: controller.signal });
        if (!response.ok) throw new Error('address-search-failed');
        const data = await response.json() as { features?: Array<{ properties?: { label?: string; name?: string; postcode?: string; city?: string } }> };
        setSuggestions((data.features ?? []).map((feature) => ({
          label: String(feature.properties?.label ?? ''),
          address: String(feature.properties?.name ?? feature.properties?.label ?? ''),
          postalCode: String(feature.properties?.postcode ?? ''),
          city: String(feature.properties?.city ?? ''),
        })).filter((suggestion) => suggestion.label));
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [value]);

  return <div className="relative space-y-2"><Label>Adresse</Label><div className="relative"><Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Commencez à saisir une adresse" autoComplete="street-address" />{isLoading ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-[#888f89]">Recherche…</span> : null}</div>{value.trim().length >= 3 && suggestions.length ? <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-[#ded8d1] bg-white shadow-[0_14px_30px_rgba(31,41,37,.14)]">{suggestions.map((suggestion) => <button key={suggestion.label} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { onSelect(suggestion); setSuggestions([]); }} className="block w-full border-b border-[#f0ece8] px-3 py-2.5 text-left last:border-b-0 hover:bg-[#fcf4ef]"><span className="block text-xs font-semibold text-[#29342f]">{suggestion.address}</span><span className="mt-0.5 block text-[11px] text-[#747d77]">{suggestion.postalCode} {suggestion.city}</span></button>)}</div> : null}</div>;
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
