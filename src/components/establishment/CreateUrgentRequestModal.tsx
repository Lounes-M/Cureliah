import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock, MapPin, Euro, Zap, Star, Calendar, Coins, ShoppingCart } from 'lucide-react';
import { UrgentRequestService } from '@/services/urgentRequestService';
import { CreditsService, UserCredits } from '@/services/creditsService';
import { CreditBalance } from '@/components/credits/CreditBalance';
import { useToast } from '@/hooks/use-toast';
import { logger } from "@/services/logger";

interface CreateUrgentRequestModalProps {
  establishmentId: string;
  onRequestCreated?: () => void;
  triggerButton?: React.ReactNode;
}

const SPECIALTIES = [
  'Médecine générale',
  'Cardiologie',
  'Neurologie', 
  'Chirurgie générale',
  'Anesthésie-Réanimation',
  'Médecine d\'urgence',
  'Radiologie',
  'Gynécologie-Obstétrique',
  'Pédiatrie',
  'Psychiatrie',
  'Dermatologie',
  'Ophtalmologie',
  'ORL',
  'Orthopédie',
  'Gastro-entérologie'
];

const URGENCY_LEVELS = [
  { value: 'medium', label: 'Modéré', color: 'bg-yellow-100 text-yellow-800', icon: '⚠️' },
  { value: 'high', label: 'Élevé', color: 'bg-orange-100 text-orange-800', icon: '🔥' },
  { value: 'critical', label: 'Critique', color: 'bg-red-100 text-red-800', icon: '🚨' },
  { value: 'emergency', label: 'Urgence absolue', color: 'bg-red-200 text-red-900', icon: '⚡' }
];

export const CreateUrgentRequestModal: React.FC<CreateUrgentRequestModalProps> = ({ 
  establishmentId, 
  onRequestCreated,
  triggerButton 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [creditRefresh, setCreditRefresh] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    specialty_required: '',
    urgency_level: 'medium',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    hourly_rate: '',
    total_budget: '',
    min_experience_years: 0,
    required_certifications: [] as string[],
    equipment_provided: true,
    transport_provided: false,
    accommodation_provided: false,
    priority_boost: false,
    featured: false,
    auto_accept_qualified: false,
    max_responses: 10,
    expires_at: ''
  });

  const [estimatedCost, setEstimatedCost] = useState(1);
  const { toast } = useToast();

  // Calculer le coût en crédits
  useEffect(() => {
    const cost = CreditsService.calculateUrgentRequestCost(
      formData.urgency_level,
      formData.priority_boost,
      formData.featured
    );
    setEstimatedCost(cost);
  }, [formData.urgency_level, formData.priority_boost, formData.featured]);

  // Charger les crédits de l'utilisateur
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const credits = await CreditsService.getUserCredits(establishmentId);
        setUserCredits(credits);
      } catch (error) {
        logger.error('Erreur lors du chargement des crédits:', error);
      }
    };

    if (isOpen && establishmentId) {
      fetchCredits();
    }
  }, [isOpen, establishmentId, creditRefresh]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation des crédits
      if (!userCredits || userCredits.balance < estimatedCost) {
        throw new Error(`Crédits insuffisants. Vous avez ${userCredits?.balance || 0} crédits, mais il en faut ${estimatedCost} pour cette demande.`);
      }

      // Validation des champs requis
      if (!formData.title.trim() || !formData.description.trim() || !formData.specialty_required) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      if (!formData.start_date || !formData.end_date || !formData.start_time || !formData.end_time) {
        throw new Error('Veuillez spécifier les dates et heures');
      }

      if (!formData.hourly_rate || parseFloat(formData.hourly_rate) <= 0) {
        throw new Error('Veuillez spécifier un tarif horaire valide');
      }

      // Calculer expires_at si non défini (2 heures par défaut pour les urgences)
      let expiresAt = formData.expires_at;
      if (!expiresAt) {
        const hours = formData.urgency_level === 'emergency' ? 1 : 
                     formData.urgency_level === 'critical' ? 2 : 
                     formData.urgency_level === 'high' ? 4 : 8;
        expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      }

      // Préparer les données
      const requestData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        specialty_required: formData.specialty_required,
        urgency_level: formData.urgency_level as 'medium' | 'high' | 'critical' | 'emergency',
        start_date: formData.start_date,
        end_date: formData.end_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        hourly_rate: parseFloat(formData.hourly_rate),
        total_budget: formData.total_budget ? parseFloat(formData.total_budget) : null,
        min_experience_years: formData.min_experience_years,
        required_certifications: formData.required_certifications,
        equipment_provided: formData.equipment_provided,
        transport_provided: formData.transport_provided,
        accommodation_provided: formData.accommodation_provided,
        priority_boost: formData.priority_boost,
        featured: formData.featured,
        auto_accept_qualified: formData.auto_accept_qualified,
        max_responses: formData.max_responses,
        expires_at: expiresAt
      };

      await UrgentRequestService.createUrgentRequest(establishmentId, requestData);

      // Consommer les crédits
      const updatedCredits = await CreditsService.consumeCredits(
        establishmentId, 
        estimatedCost, 
        `Création demande urgente: ${requestData.title}`
      );
      
      setUserCredits(updatedCredits);
      setCreditRefresh(prev => prev + 1);

      toast({
        title: "Demande urgente créée !",
        description: `Votre demande a été publiée. Coût: ${estimatedCost} crédits. Solde restant: ${updatedCredits.balance} crédits. Les médecins qualifiés ont été notifiés.`,
        variant: "default",
      });

      // Réinitialiser le formulaire
      setFormData({
        title: '',
        description: '',
        specialty_required: '',
        urgency_level: 'medium',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        location: '',
        latitude: null,
        longitude: null,
        hourly_rate: '',
        total_budget: '',
        min_experience_years: 0,
        required_certifications: [],
        equipment_provided: true,
        transport_provided: false,
        accommodation_provided: false,
        priority_boost: false,
        featured: false,
        auto_accept_qualified: false,
        max_responses: 10,
        expires_at: ''
      });

      setIsOpen(false);
      onRequestCreated?.();

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la demande urgente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button className="bg-red-600 hover:bg-red-700 text-white whitespace-nowrap">
      <AlertCircle className="w-4 h-4 mr-2" />
      <span className="hidden sm:inline">Demande</span>
      <span className="sm:hidden">+</span>
      <span className="hidden sm:inline ml-1">Urgente</span>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="w-6 h-6 text-red-600" />
            Créer une Demande Urgente
          </DialogTitle>
        </DialogHeader>

        {/* Solde de crédits et coût estimé */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CreditBalance 
                variant="compact" 
                showPurchaseButton={true}
                refreshTrigger={creditRefresh}
                onBalanceUpdate={(balance) => setUserCredits(prev => prev ? { ...prev, balance } : null)}
              />
              
              <div className="text-left lg:text-right">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <ShoppingCart className="w-5 h-5 text-medical-green" />
                  <span>Coût: {estimatedCost} crédit{estimatedCost > 1 ? 's' : ''}</span>
                </div>
                {userCredits && (
                  <div className="text-sm text-muted-foreground">
                    Solde après création: {userCredits.balance - estimatedCost} crédits
                  </div>
                )}
              </div>
            </div>
            
            {userCredits && userCredits.balance < estimatedCost && (
              <Alert className="mt-3" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Crédits insuffisants ! Vous avez {userCredits.balance} crédits mais il en faut {estimatedCost}.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Titre de la demande *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Médecin urgentiste requis ce soir"
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Spécialité requise *
              </label>
              <Select 
                value={formData.specialty_required} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, specialty_required: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une spécialité" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map(specialty => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Niveau d'urgence *
              </label>
              <Select 
                value={formData.urgency_level} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, urgency_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <span>{level.icon}</span>
                        <span>{level.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description détaillée *
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez en détail la situation, les besoins spécifiques, le contexte médical..."
              className="w-full h-24"
              required
            />
          </div>

          {/* Planning */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date de début *
              </label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Heure de début *
              </label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Date de fin *
              </label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                min={formData.start_date || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Heure de fin *
              </label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Localisation et rémunération */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Lieu d'intervention
              </label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Adresse complète"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                <Euro className="w-4 h-4 inline mr-1" />
                Tarif horaire (€) *
              </label>
              <Input
                type="number"
                min="50"
                step="5"
                value={formData.hourly_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                placeholder="Ex: 80"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Budget total (€)
              </label>
              <Input
                type="number"
                min="0"
                step="10"
                value={formData.total_budget}
                onChange={(e) => setFormData(prev => ({ ...prev, total_budget: e.target.value }))}
                placeholder="Optionnel"
              />
            </div>
          </div>

          {/* Exigences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Expérience minimale (années)
              </label>
              <Select 
                value={formData.min_experience_years.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, min_experience_years: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 5, 10, 15].map(years => (
                    <SelectItem key={years} value={years.toString()}>
                      {years === 0 ? 'Aucune exigence' : `${years} an${years > 1 ? 's' : ''} minimum`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Nombre maximum de réponses
              </label>
              <Input
                type="number"
                min="1"
                max="50"
                value={formData.max_responses}
                onChange={(e) => setFormData(prev => ({ ...prev, max_responses: parseInt(e.target.value) || 10 }))}
              />
            </div>
          </div>

          {/* Services fournis */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Services fournis</h4>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.equipment_provided}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, equipment_provided: !!checked }))}
                />
                <span className="text-sm">Équipement médical fourni</span>
              </label>
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.transport_provided}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, transport_provided: !!checked }))}
                />
                <span className="text-sm">Transport fourni</span>
              </label>
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.accommodation_provided}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, accommodation_provided: !!checked }))}
                />
                <span className="text-sm">Hébergement fourni</span>
              </label>
            </div>
          </div>

          {/* Options premium */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Options Premium
            </h4>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.priority_boost}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, priority_boost: !!checked }))}
                  />
                  <div>
                    <div className="text-sm font-medium">Boost priorité (+15 crédits)</div>
                    <div className="text-xs text-gray-500">Apparaît en haut de liste</div>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Zap className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              </label>
              
              <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: !!checked }))}
                  />
                  <div>
                    <div className="text-sm font-medium">Mise en vedette (+25 crédits)</div>
                    <div className="text-xs text-gray-500">Badge spécial et visibilité maximale</div>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  <Star className="w-3 h-3 mr-1" />
                  Vedette
                </Badge>
              </label>
            </div>
          </div>

          {/* Coût estimé */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">Coût estimé de publication</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Les crédits seront débités de votre compte à la publication
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-medical-blue">{estimatedCost}</div>
                <div className="text-xs text-gray-600">crédits</div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Publication...
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Publier la demande urgente
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
