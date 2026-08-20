'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';

import { firestore } from '@/lib/firebase/client';

export type AdminProfile = {
  id: string;
  fullName?: string;
  email?: string;
  role?: string;
  organizationName?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
};

export type AdminProperty = {
  id: string;
  ownerId?: string;
  name?: string;
  city?: string;
  status?: string;
};

export type AdminGuideEvent = {
  id: string;
  ownerId?: string;
  eventType?: string;
  occurredAt?: { toDate?: () => Date };
};

type AdminData = {
  profiles: AdminProfile[];
  properties: AdminProperty[];
  events: AdminGuideEvent[];
  isLoading: boolean;
  error: string | null;
};

const initialData: AdminData = { profiles: [], properties: [], events: [], isLoading: true, error: null };

export function useAdminData() {
  const [data, setData] = useState<AdminData>(initialData);

  useEffect(() => {
    const loaded = { profiles: false, properties: false, events: false };
    let profiles: AdminProfile[] = [];
    let properties: AdminProperty[] = [];
    let events: AdminGuideEvent[] = [];
    let failed = false;

    const publish = () => {
      if (failed) return;
      const isLoading = !loaded.profiles || !loaded.properties || !loaded.events;
      setData({ profiles, properties, events, isLoading, error: null });
    };
    const fail = () => {
      failed = true;
      setData((current) => ({
        ...current,
        isLoading: false,
        error: 'Les données administrateur ne peuvent pas être lues. Vérifiez que ce compte possède bien le rôle admin et que les règles Firestore sont publiées.',
      }));
    };

    const stopProfiles = onSnapshot(collection(firestore, 'profiles'), (snapshot) => {
      profiles = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() } as AdminProfile))
        .filter((profile) => Boolean(profile.email || profile.fullName || profile.role));
      loaded.profiles = true;
      publish();
    }, fail);
    const stopProperties = onSnapshot(collection(firestore, 'properties'), (snapshot) => {
      properties = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as AdminProperty));
      loaded.properties = true;
      publish();
    }, fail);
    const stopEvents = onSnapshot(collection(firestore, 'guide_events'), (snapshot) => {
      events = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as AdminGuideEvent));
      loaded.events = true;
      publish();
    }, fail);

    return () => { stopProfiles(); stopProperties(); stopEvents(); };
  }, []);

  return data;
}
