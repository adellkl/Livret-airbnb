import { collection, doc, getDoc, getDocs, query, runTransaction, updateDoc, where, writeBatch } from 'firebase/firestore';
import { firebaseAuth, firestore } from '@/lib/firebase/client';

const relatedCollections = [
  'public_guides', 'reservations', 'guide_sections', 'property_amenities',
  'equipment_guides', 'property_house_rules', 'property_faqs', 'nearby_places',
  'guide_events', 'guide_reviews', 'guide_messages',
];

export async function deleteOwnerProperty(propertyId: string) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error('Votre session a expiré. Reconnectez-vous avant de supprimer ce logement.');

  const propertyRef = doc(firestore, 'properties', propertyId);
  const property = await getDoc(propertyRef);
  if (!property.exists() || property.data().ownerId !== user.uid) {
    throw new Error('Ce logement est introuvable ou ne vous appartient pas.');
  }

  // Freeze new writes before taking the cleanup snapshot. A failed deletion
  // remains retryable while the ownership document is retained.
  if (property.data().isDeleting !== true) await updateDoc(propertyRef, { isDeleting: true });

  // Read everything before deleting anything.
  const snapshots = await Promise.all(relatedCollections.map((name) =>
    getDocs(query(collection(firestore, name), where('propertyId', '==', propertyId),
      ...(name === 'guide_messages' ? [where('ownerId', '==', user.uid)] : []))),
  ));
  const guideRef = doc(firestore, 'public_guides', propertyId);
  const references = snapshots.flatMap((snapshot) => snapshot.docs.map((item) => item.ref))
    .filter((reference) => reference.path !== guideRef.path);

  // Keep the property until the end: its ownership authorizes each child deletion.
  // A failed batch can be retried without losing the ownership document.
  for (let start = 0; start < references.length; start += 450) {
    const batch = writeBatch(firestore);
    references.slice(start, start + 450).forEach((reference) => batch.delete(reference));
    await batch.commit();
  }

  await runTransaction(firestore, async (transaction) => {
    const currentProperty = await transaction.get(propertyRef);
    const guide = await transaction.get(guideRef);
    if (!currentProperty.exists() || currentProperty.data().ownerId !== user.uid) {
      throw new Error('Ce logement est introuvable ou ne vous appartient pas.');
    }
    if (guide.exists()) transaction.delete(guideRef);
    transaction.delete(propertyRef);
  });
}
