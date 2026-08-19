'use client';

import { useState } from 'react';
import OwnerSidebar from '@/components/layout/OwnerSidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import MobileNavigation from '@/components/layout/MobileNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  GripVertical,
  Plus,
  Eye,
  Save,
  Send,
  MoreVertical,
  Smartphone,
  Monitor,
  Image,
  Type,
  Layout
} from 'lucide-react';

export default function BookletEditorPage() {
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [selectedSection, setSelectedSection] = useState(0);

  const sections = [
    { id: 1, icon: '👋', title: 'Bienvenue', subtitle: 'Message de bienvenue', visible: true },
    { id: 2, icon: '🗝️', title: 'Arrivée et accès', subtitle: 'Instructions pour arriver', visible: true },
    { id: 3, icon: '📶', title: 'Wi-Fi et équipements', subtitle: 'Codes et équipements', visible: true },
    { id: 4, icon: '📋', title: 'Règles de la maison', subtitle: 'Règlement intérieur', visible: true },
    { id: 5, icon: '❓', title: 'FAQ', subtitle: 'Questions fréquentes', visible: true },
    { id: 6, icon: '🍽️', title: 'Restaurants', subtitle: 'Recommandations', visible: true },
    { id: 7, icon: '🎯', title: 'Activités', subtitle: 'À faire aux alentours', visible: true },
    { id: 8, icon: '📞', title: 'Contact', subtitle: 'Informations de contact', visible: true }
  ];

  const currentSection = sections[selectedSection];

  return (
    <div className="min-h-screen bg-background">
      <OwnerSidebar />
      <MobileNavigation type="owner" />
      
      <div className="lg:ml-[250px]">
        <div className="border-b border-border bg-surface px-4 py-3 sm:px-8 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="sm">
                ← Retour
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">Éditeur de livret</h1>
                <p className="hidden truncate text-sm text-muted-foreground min-[420px]:block">L'Atelier des Batignolles</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-3">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Eye size={16} className="mr-2" />
                Aperçu
              </Button>
              <Button variant="outline" size="sm" aria-label="Enregistrer">
                <Save size={16} className="mr-2" />
                <span className="hidden md:inline">Enregistrer</span>
              </Button>
              <Button size="sm" className="bg-primary text-white hover:bg-primary-hover">
                <Send size={16} className="mr-2" />
                <span className="hidden min-[420px]:inline">Publier</span>
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <MoreVertical size={18} />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col pb-24 lg:h-[calc(100vh-73px)] lg:flex-row lg:pb-0">
          <div className="w-full border-b border-border bg-surface p-4 lg:w-80 lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <Button className="w-full mb-6 bg-primary hover:bg-primary-hover text-white">
              <Plus size={18} className="mr-2" />
              Ajouter une section
            </Button>

            <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  onClick={() => setSelectedSection(index)}
                  className={`w-64 shrink-0 cursor-pointer rounded-lg p-3 transition-colors lg:w-auto lg:p-4 ${
                    selectedSection === index
                      ? 'bg-primary-light border-2 border-primary'
                      : 'bg-surface-soft hover:bg-surface-soft/80 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <GripVertical size={18} className="text-muted-foreground mt-1 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{section.icon}</span>
                        <p className="text-sm font-medium text-foreground truncate">{section.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{section.subtitle}</p>
                    </div>
                    <Switch checked={section.visible} className="scale-75" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex min-h-[520px] flex-1 items-center justify-center overflow-auto bg-surface-soft p-4 sm:p-8">
            <div className={`${previewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'} w-full`}>
              <div className="bg-white rounded-2xl shadow-premium-lg overflow-hidden">
                <div className="bg-primary p-4 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="font-bold">L</span>
                    </div>
                    <div>
                      <p className="font-semibold">L'Atelier des Batignolles</p>
                      <p className="text-xs text-white/80">Livret d'accueil</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="text-center">
                    <span className="text-4xl mb-4 block">{currentSection.icon}</span>
                    <h3 className="text-xl font-bold text-foreground mb-2">{currentSection.title}</h3>
                    <p className="text-sm text-muted-foreground">{currentSection.subtitle}</p>
                  </div>
                  <div className="space-y-4">
                    <div className="h-3 bg-surface-soft rounded-full w-3/4"></div>
                    <div className="h-3 bg-surface-soft rounded-full w-1/2"></div>
                    <div className="h-3 bg-surface-soft rounded-full w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full border-t border-border bg-surface p-4 sm:p-6 lg:w-96 lg:overflow-y-auto lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Éditer la section</h3>
              <div className="flex items-center gap-2 bg-surface-soft rounded-lg p-1">
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-2 rounded-lg ${previewMode === 'mobile' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Smartphone size={18} />
                </button>
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-2 rounded-lg ${previewMode === 'desktop' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Monitor size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sectionTitle">Titre</Label>
                <Input
                  id="sectionTitle"
                  defaultValue={currentSection.title}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sectionSubtitle">Sous-titre</Label>
                <Input
                  id="sectionSubtitle"
                  defaultValue={currentSection.subtitle}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sectionDescription">Description</Label>
                <Textarea
                  id="sectionDescription"
                  placeholder="Ajoutez une description pour cette section..."
                  className="min-h-32 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Image de couverture</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Image size={32} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Glissez une image ou cliquez pour sélectionner</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Boutons rapides</Label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    Appeler
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    WhatsApp
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    Maps
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    Copier
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Visibilité</Label>
                <div className="flex items-center justify-between p-4 bg-surface-soft rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-foreground">Visible par les voyageurs</p>
                    <p className="text-xs text-muted-foreground">Cette section apparaîtra dans le livret public</p>
                  </div>
                  <Switch checked={currentSection.visible} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Icône</Label>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {['👋', '🗝️', '📶', '📋', '❓', '🍽️', '🎯', '📞'].map((emoji) => (
                    <button
                      key={emoji}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                        currentSection.icon === emoji ? 'bg-primary-light border-2 border-primary' : 'bg-surface-soft'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Style de section</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button className="p-4 bg-surface-soft rounded-lg border-2 border-primary text-center">
                    <Layout size={20} className="mx-auto mb-2 text-primary" />
                    <p className="text-xs font-medium">Par défaut</p>
                  </button>
                  <button className="p-4 bg-surface-soft rounded-lg border-2 border-transparent hover:border-border text-center">
                    <Type size={20} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs font-medium">Carte</p>
                  </button>
                  <button className="p-4 bg-surface-soft rounded-lg border-2 border-transparent hover:border-border text-center">
                    <Image size={20} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs font-medium">Overlay</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 bg-primary p-3 lg:left-[250px] lg:p-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="hidden sm:block">
              <p className="text-white font-semibold">Prêt à partager votre livret ?</p>
              <p className="text-white/80 text-sm">Toutes les modifications sont sauvegardées automatiquement</p>
            </div>
            <Button className="bg-white text-primary hover:bg-surface">
              <Send size={18} className="mr-2" />
              Publier le livret
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
