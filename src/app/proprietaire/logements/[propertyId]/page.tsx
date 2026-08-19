'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import OwnerSidebar from '@/components/layout/OwnerSidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import MobileNavigation from '@/components/layout/MobileNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type OwnerProperty,
} from '@/lib/owner-properties';
import { createClient } from '@/lib/supabase/client';
import { toOwnerProperty } from '@/lib/property-mappers';
import { 
  Copy,
  RefreshCw,
  Download,
  Share2,
  Mail,
  QrCode,
  Eye,
  Archive,
  History,
  Smartphone,
  Lock,
  Calendar,
  TrendingUp,
  Users
} from 'lucide-react';

export default function PropertyDetailPage() {
  const params = useParams<{ propertyId: string }>();
  const [ownerProperty, setOwnerProperty] = useState<OwnerProperty>(
    {
      id: '', name: '', type: '', address: '', city: '', postalCode: '', capacity: 0,
      bedrooms: 0, checkIn: '', checkOut: '', wifiName: '', wifiPassword: '', description: '',
      hostName: '', hostPhone: '', hostEmail: '', coverImage: '', status: 'draft', views: 0,
      completion: 0, updatedAt: '',
    }
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await createClient()
        .from('properties')
        .select('*')
        .eq('id', params.propertyId)
        .maybeSingle();
      if (active && data) setOwnerProperty(toOwnerProperty(data as Record<string, unknown>));
    };
    void load();
    return () => { active = false; };
  }, [params.propertyId]);

  const property = {
    ...ownerProperty,
    address: `${ownerProperty.address}, ${ownerProperty.postalCode} ${ownerProperty.city}`,
    image: ownerProperty.coverImage,
    linkStatus: ownerProperty.status === 'published' ? 'active' : 'inactive',
    createdAt: '29 juillet 2026',
    lastModified: ownerProperty.updatedAt,
    secureLink: `https://livret-accueil.fr/guide/${ownerProperty.id}`,
  };

  const stats = [
    { label: 'Consultations', value: '423', icon: Eye },
    { label: 'Visiteurs uniques', value: '287', icon: Users },
    { label: 'Taux de consultation', value: '92%', icon: TrendingUp }
  ];

  const recentDevices = [
    { device: 'iPhone 15', location: 'Paris', time: 'Il y a 2h' },
    { device: 'Samsung Galaxy', location: 'Lyon', time: 'Il y a 5h' },
    { device: 'iPad Pro', location: 'Marseille', time: 'Il y a 1j' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <OwnerSidebar />
      <MobileNavigation type="owner" />
      
      <div className="lg:ml-[250px]">
        <DashboardHeader title={property.name} />

        <main className="mx-auto max-w-[1440px] px-4 py-5 pb-24 sm:px-8 sm:py-8">
          <div className="mb-6 grid gap-5 lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2">
              <img
                src={property.image}
                alt={property.name}
                className="mb-5 h-52 w-full rounded-2xl object-cover sm:h-64"
              />
              
              <div className="mb-5 rounded-2xl bg-surface p-4 shadow-premium sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Informations</h3>
                  <div className="flex gap-2">
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
                <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border p-0">
                  <TabsTrigger value="link" className="shrink-0 rounded-none px-4 py-4 text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary sm:px-6 sm:text-sm">
                    Lien d'accès
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="shrink-0 rounded-none px-4 py-4 text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary sm:px-6 sm:text-sm">
                    Statistiques
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="shrink-0 rounded-none px-4 py-4 text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary sm:px-6 sm:text-sm">
                    Paramètres
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
                        <Button variant="outline" size="sm" className="h-12">
                          <Copy size={16} className="mr-2" />
                          Copier
                        </Button>
                        <Button variant="outline" size="sm" className="h-12">
                          <RefreshCw size={16} className="mr-2" />
                          Régénérer
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">QR Code</h4>
                      <div className="bg-surface-soft rounded-lg p-6 flex items-center justify-center mb-4">
                        <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
                          <QrCode size={64} className="text-foreground" />
                        </div>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Download size={16} className="mr-2" />
                        Télécharger le QR code
                      </Button>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">Modes d'accès</h4>
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
                        <div className="flex items-center justify-between p-4 bg-surface-soft rounded-lg opacity-60">
                          <div className="flex items-center gap-3">
                            <Calendar size={18} className="text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-foreground">Date d'expiration</p>
                              <p className="text-xs text-muted-foreground">Accès limité dans le temps</p>
                            </div>
                          </div>
                          <Badge variant="secondary">Inactif</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="stats" className="p-6">
                  <div className="mb-6 grid grid-cols-1 gap-3 min-[400px]:grid-cols-3 sm:gap-4">
                    {stats.map((stat, index) => (
                      <div key={index} className="bg-surface-soft rounded-lg p-4 text-center">
                    <stat.icon size={24} className="text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="h-48 bg-surface-soft rounded-lg flex items-center justify-center mb-6">
                    <div className="text-center">
                      <TrendingUp size={32} className="text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Graphique des consultations sur 30 jours</p>
                    </div>
                  </div>

                  <h4 className="text-sm font-medium text-foreground mb-3">Appareils récents</h4>
                  <div className="space-y-2">
                    {recentDevices.map((device, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-surface-soft rounded-lg">
                        <div className="flex items-center gap-3">
                          <Smartphone size={16} className="text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{device.device}</p>
                            <p className="text-xs text-muted-foreground">{device.location}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{device.time}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="p-6">
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <Eye size={18} className="mr-3" />
                      Aperçu public
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Mail size={18} className="mr-3" />
                      Partager par e-mail
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Share2 size={18} className="mr-3" />
                      Inviter des voyageurs
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Copy size={18} className="mr-3" />
                      Dupliquer le livret
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Archive size={18} className="mr-3" />
                      Archiver
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <History size={18} className="mr-3" />
                      Historique des liens
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-6">
              <div className="bg-surface rounded-xl p-6 shadow-premium">
                <h3 className="text-lg font-semibold text-foreground mb-4">Actions rapides</h3>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    <Mail size={18} className="mr-3 text-muted-foreground" />
                    Envoyer par e-mail
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <QrCode size={18} className="mr-3 text-muted-foreground" />
                    Générer QR code
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
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
