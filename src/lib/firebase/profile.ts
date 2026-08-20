import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';

type OwnerProfileInput = {
  uid: string;
  email: string | null;
  fullName: string;
  organizationName: string;
  activityType: string;
};

export async function createOwnerProfile({
  uid,
  email,
  fullName,
  organizationName,
  activityType,
}: OwnerProfileInput) {
  await setDoc(doc(firestore, 'profiles', uid), {
    email,
    fullName,
    organizationName,
    activityType,
    role: 'owner',
    subscriptionPlan: 'free',
    subscriptionStatus: 'active',
    acceptedTermsAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
