import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Crown, 
  MapPin, 
  Users, 
  Star, 
  Award, 
  Shield, 
  Zap,
  Phone,
  Mail,
  Globe,
  CheckCircle2
} from 'lucide-react';

export interface PremiumEstablishment {
  id: string;
  name: string;
  description: string;
  location: string;
  specialties: string[];
  rating: number;
  total_reviews: number;
  employees_count: number;
  premium_since: string;
  premium_benefits: string[];
  certifications: string[];
  contact_email: string;
  contact_phone: string;
  website: string;
  logo_url?: string;
  verified: boolean;
  featured: boolean;
  available_positions: number;
  response_time: string; // "< 2h", "< 24h", etc.
}

const mockPremiumEstablishments: PremiumEstablishment[] = [
  {
    id: '1',
    name: 'Clinique Saint-Antoine Premium',
    description: 'Centre médical d\'excellence spécialisé dans la chirurgie cardiaque et les urgences. Équipements de pointe et équipe médicale renommée.',
    location: 'Paris 16ème',
    specialties: ['Cardiologie', 'Chirurgie', 'Urgences', 'Réanimation'],
    rating: 4.9,
    total_reviews: 156,
    employees_count: 280,
    premium_since: '2023-01-15',
    premium_benefits: [
      'Recrutement prioritaire',
      'Formation continue incluse',
      'Prime d\'excellence mensuelle',
      'Matériel premium fourni',
      'Horaires flexibles'
    ],
    certifications: ['ISO 9001', 'JCI Accredited', 'Haute Autorité de Santé'],
    contact_email: 'recrutement@saint-antoine-premium.fr',
    contact_phone: '+33 1 45 67 89 00',
    website: 'https://saint-antoine-premium.fr',
    verified: true,
    featured: true,
    available_positions: 8,
    response_time: '< 2h'
  },
  {
    id: '2',
    name: 'Hôpital Privé du Val-de-Seine',
    description: 'Établissement privé de référence en région parisienne, spécialisé dans les soins de pointe et la médecine personnalisée.',
    location: 'Boulogne-Billancourt',
    specialties: ['Oncologie', 'Neurochirurgie', 'Orthopédie', 'Gynécologie'],
    rating: 4.8,
    total_reviews: 203,
    employees_count: 420,
    premium_since: '2022-08-20',
    premium_benefits: [
      'Rémunération attractive +15%',
      'Mutuelle premium',
      'Restaurant d\'entreprise',
      'Parking gratuit',
      'Télétravail partiel'
    ],
    certifications: ['ISO 14001', 'OHSAS 18001', 'Certification HAS'],
    contact_email: 'rh@hopital-val-seine.fr',
    contact_phone: '+33 1 46 99 88 77',
    website: 'https://hopital-val-seine.fr',
    verified: true,
    featured: false,
    available_positions: 12,
    response_time: '< 4h'
  },
  {
    id: '3',
    name: 'Centre Médical Excellence Lyon',
    description: 'Pôle médical innovant combinant expertise traditionnelle et technologies de pointe pour des soins d\'exception.',
    location: 'Lyon 6ème',
    specialties: ['Médecine esthétique', 'Dermatologie', 'Chirurgie plastique', 'Médecine du sport'],
    rating: 4.7,
    total_reviews: 89,
    employees_count: 65,
    premium_since: '2024-01-10',
    premium_benefits: [
      'Prime de signature 5000€',
      'Formation à l\'étranger',
      'Véhicule de fonction',
      'Bonus performance',
      'Congés supplémentaires'
    ],
    certifications: ['ISO 13485', 'Certification COFRAC'],
    contact_email: 'carriere@excellence-lyon.fr',
    contact_phone: '+33 4 72 33 44 55',
    website: 'https://excellence-lyon.fr',
    verified: true,
    featured: true,
    available_positions: 5,
    response_time: '< 1h'
  }
];

const PremiumEstablishments: React.FC = () => {
  const [establishments, setEstablishments] = useState<PremiumEstablishment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      setEstablishments(mockPremiumEstablishments);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredEstablishments = establishments.filter(est => {
    const matchesSearch = est.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         est.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = !selectedSpecialty || est.specialties.includes(selectedSpecialty);
    return matchesSearch && matchesSpecialty;
  });

  const allSpecialties = Array.from(new Set(establishments.flatMap(est => est.specialties)));

  const handleContact = (establishment: PremiumEstablishment) => {
    // Rediriger vers le formulaire de contact ou ouvrir l'email
    window.location.href = `mailto:${establishment.contact_email}?subject=Candidature spontanée - ${establishment.name}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2 mb-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          Établissements Premium
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Découvrez nos partenaires d'excellence qui offrent les meilleures conditions 
          de travail et opportunités de carrière pour les professionnels de santé.
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Rechercher un établissement ou une ville"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="px-3 py-2 border rounded-md"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              <option value="">Toutes les spécialités</option>
              {allSpecialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-yellow-600">
                <Crown className="h-4 w-4 mr-1" />
                {filteredEstablishments.length} établissements Premium
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Établissements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEstablishments.map((establishment) => (
          <Card 
            key={establishment.id} 
            className={`relative overflow-hidden transition-all hover:shadow-lg ${
              establishment.featured ? 'border-yellow-500 border-2' : ''
            }`}
          >
            {establishment.featured && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-yellow-500 text-white">
                  <Zap className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              </div>
            )}

            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{establishment.name}</CardTitle>
                    {establishment.verified && (
                      <Shield className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {establishment.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {establishment.employees_count}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(establishment.rating)
                              ? 'text-yellow-500 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{establishment.rating}/5</span>
                    <span className="text-sm text-gray-500">({establishment.total_reviews} avis)</span>
                  </div>
                </div>
                <Crown className="h-6 w-6 text-yellow-500 flex-shrink-0" />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-3">
                {establishment.description}
              </p>

              {/* Spécialités */}
              <div>
                <h4 className="text-sm font-medium mb-2">Spécialités :</h4>
                <div className="flex flex-wrap gap-1">
                  {establishment.specialties.slice(0, 3).map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {establishment.specialties.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{establishment.specialties.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Avantages Premium */}
              <div>
                <h4 className="text-sm font-medium mb-2">Avantages Premium :</h4>
                <div className="space-y-1">
                  {establishment.premium_benefits.slice(0, 3).map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      {benefit}
                    </div>
                  ))}
                  {establishment.premium_benefits.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{establishment.premium_benefits.length - 3} autres avantages
                    </p>
                  )}
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h4 className="text-sm font-medium mb-2">Certifications :</h4>
                <div className="flex flex-wrap gap-1">
                  {establishment.certifications.map((cert) => (
                    <Badge key={cert} variant="outline" className="text-xs">
                      <Award className="h-3 w-3 mr-1" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {establishment.available_positions}
                  </div>
                  <div className="text-xs text-gray-500">Postes ouverts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {establishment.response_time}
                  </div>
                  <div className="text-xs text-gray-500">Temps de réponse</div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button 
                  className="w-full"
                  onClick={() => handleContact(establishment)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contacter l'établissement
                </Button>
                
                <div className="flex gap-2">
                  {establishment.contact_phone && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Phone className="h-4 w-4 mr-1" />
                      Appeler
                    </Button>
                  )}
                  {establishment.website && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => window.open(establishment.website, '_blank')}
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      Site web
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEstablishments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Crown className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun établissement trouvé</h3>
            <p className="text-gray-600">
              Modifiez vos critères de recherche pour voir plus d'établissements Premium
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PremiumEstablishments;
