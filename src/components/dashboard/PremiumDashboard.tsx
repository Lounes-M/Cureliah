import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  FileText,
  Star,
  Activity,
  Crown,
  TrendingUp,
  DollarSign,
  Download,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  MessageCircle,
  Key
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePremiumStatistics } from "@/hooks/usePremiumStatistics";
import { usePremiumInvoices } from "@/hooks/usePremiumInvoices";
import { usePremiumMissions } from "@/hooks/usePremiumMissions";

interface PremiumDashboardProps {
  initialTab?: string | null;
}

const PremiumDashboard = ({ initialTab }: PremiumDashboardProps) => {
  const { user } = useAuth();
  const { statistics, loading: statsLoading } = usePremiumStatistics();
  const { invoices, loading: invoicesLoading } = usePremiumInvoices();
  const { missions, loading: missionsLoading, acceptMission } = usePremiumMissions();

  // Gérer l'onglet actif depuis la prop initialTab
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab && ['statistics', 'invoices', 'missions', 'support', 'api'].includes(initialTab)) {
      return initialTab;
    }
    return 'statistics';
  });

  useEffect(() => {
    if (initialTab && ['statistics', 'invoices', 'missions', 'support', 'api'].includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Fonctions utilitaires
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'paid': 'Payé',
      'pending': 'En attente',
      'overdue': 'En retard'
    };
    return <Badge variant="secondary">{statusMap[status as keyof typeof statusMap] || status}</Badge>;
  };

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header simplifié */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl">
            <Crown className="h-6 w-6 text-yellow-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Premium</h1>
            <p className="text-sm text-gray-600">Accès complet aux fonctionnalités avancées</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-700">Premium Actif</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-12 p-1 bg-gray-100/50">
          <TabsTrigger value="statistics" className="flex items-center gap-2 font-medium">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Statistiques</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2 font-medium">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Factures</span>
            <span className="sm:hidden">Factures</span>
          </TabsTrigger>
          <TabsTrigger value="missions" className="flex items-center gap-2 font-medium">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Missions</span>
            <span className="sm:hidden">Missions</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2 font-medium">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Support</span>
            <span className="sm:hidden">Support</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2 font-medium">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">API</span>
            <span className="sm:hidden">API</span>
          </TabsTrigger>
        </TabsList>

        {/* Onglet Statistiques */}
        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsLoading ? (
              <div className="col-span-full flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatAmount(statistics?.totalRevenue || 0)}</div>
                    <p className="text-xs text-muted-foreground">
                      <TrendingUp className="inline h-4 w-4" />
                      +{statistics?.monthlyTrend || 0}% ce mois
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Missions Complétées</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics?.totalMissions || 0}</div>
                    <p className="text-xs text-muted-foreground">Missions premium</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics?.avgRating || 0}/5</div>
                    <p className="text-xs text-muted-foreground">Évaluation établissements</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Statut Premium</CardTitle>
                    <Crown className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">Actif</div>
                    <p className="text-xs text-muted-foreground">Avantages illimités</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* Onglet Factures */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Factures</CardTitle>
              <CardDescription>Consultez et téléchargez vos factures Premium</CardDescription>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : invoices.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune facture disponible</p>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{invoice.description}</h4>
                        <p className="text-sm text-muted-foreground">
                          Période: {new Date(invoice.period_start).toLocaleDateString()} - {new Date(invoice.period_end).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Échéance: {new Date(invoice.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold">{formatAmount(invoice.amount)}</p>
                          {getStatusBadge(invoice.status)}
                        </div>
                        {invoice.invoice_pdf && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Missions */}
        <TabsContent value="missions" className="space-y-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Missions Premium Exclusives</h2>
              <p className="text-sm text-gray-600">Accès prioritaire aux missions les mieux rémunérées</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-orange-700 font-medium">Exclusivité Premium Active</span>
              </div>
            </div>
          </div>

          {/* Filtres rapides */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              🚨 Urgentes
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              👨‍⚕️ Ma Spécialité
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              📍 Près de moi
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              💰 Mieux payées
            </Button>
          </div>

          {missionsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2 text-sm text-gray-600">Chargement des missions exclusives...</span>
            </div>
          ) : missions.length === 0 ? (
            <Card className="p-8 text-center bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
              <div className="max-w-md mx-auto">
                <Crown className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Aucune mission premium disponible</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Les nouvelles missions exclusives apparaîtront ici en priorité pour vous
                </p>
                <div className="text-xs text-gray-500">
                  💡 Les missions premium offrent jusqu'à 40% de rémunération supplémentaire
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {missions.map((mission) => (
                <Card key={mission.id} className="overflow-hidden border-l-4 border-l-yellow-400 hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        {/* Header de la mission */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-lg text-gray-900">{mission.title}</h4>
                              {mission.urgency === 'critical' && (
                                <Badge className="bg-red-100 text-red-800 animate-pulse">
                                  🚨 CRITIQUE
                                </Badge>
                              )}
                              {mission.mission_type === 'vip' && (
                                <Badge className="bg-purple-100 text-purple-800">
                                  👑 VIP
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{mission.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {mission.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {mission.duration}
                              </div>
                              {mission.specialty && (
                                <div className="flex items-center gap-1">
                                  <Activity className="h-4 w-4" />
                                  {mission.specialty}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {formatAmount((mission.salary_min + mission.salary_max) / 2)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatAmount(mission.salary_min)} - {formatAmount(mission.salary_max)}
                            </div>
                          </div>
                        </div>

                        {/* Informations établissement */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              {mission.establishment_logo_url ? (
                                <img 
                                  src={mission.establishment_logo_url} 
                                  alt={mission.establishment_name} 
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <Activity className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{mission.establishment_name || 'Établissement Premium'}</div>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                <span className="text-xs text-gray-600">{mission.establishment_rating}/5</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              Échéance: {new Date(mission.application_deadline).toLocaleDateString('fr-FR')}
                            </div>
                            <div className="text-xs text-orange-600 font-medium">
                              Exclusivité jusqu'au {new Date(mission.exclusive_until).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>

                        {/* Avantages Premium */}
                        {mission.premium_perks && mission.premium_perks.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-900">🌟 Avantages Premium:</div>
                            <div className="flex flex-wrap gap-1">
                              {mission.premium_perks.map((perk, index) => (
                                <Badge key={index} variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                  {perk}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Exigences */}
                        {mission.requirements && mission.requirements.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-900">📋 Prérequis:</div>
                            <div className="flex flex-wrap gap-1">
                              {mission.requirements.map((req, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {req}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions et disponibilité */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-gray-600">
                                  {mission.spots_available - mission.spots_filled} place(s) disponible(s)
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              Mission créée le {new Date(mission.created_at).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                          
                          {mission.spots_filled < mission.spots_available && (
                            <Button 
                              className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-medium"
                              onClick={() => acceptMission(mission.id)}
                            >
                              <Crown className="h-4 w-4 mr-2" />
                              Postuler en Priorité
                            </Button>
                          )}
                          
                          {mission.spots_filled >= mission.spots_available && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                              Complet
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Onglet Support */}
        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Support Premium</CardTitle>
              <CardDescription>Assistance prioritaire 24/7 pour les membres Premium</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
                  <div>
                    <h3 className="font-semibold text-green-800">Support Prioritaire Actif</h3>
                    <p className="text-sm text-green-600">Temps de réponse garanti sous 2h</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700">En ligne</span>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <MessageCircle className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold">Chat en Direct</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Assistance immédiate par chat</p>
                      <Button className="w-full">Démarrer le Chat</Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Star className="h-5 w-5 text-yellow-600" />
                        <h4 className="font-semibold">Support Téléphonique</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Ligne dédiée Premium</p>
                      <Button variant="outline" className="w-full">Demander un Rappel</Button>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Ressources Premium</h4>
                  <div className="space-y-2">
                    <Button variant="ghost" className="justify-start w-full">
                      📚 Guide d'utilisation avancé
                    </Button>
                    <Button variant="ghost" className="justify-start w-full">
                      🎯 Formation personnalisée
                    </Button>
                    <Button variant="ghost" className="justify-start w-full">
                      📞 Session de consultation
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet API */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API & Intégrations</CardTitle>
              <CardDescription>Connectez vos applications avec notre API Premium</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-blue-800">Accès API Premium</h3>
                    <Badge variant="default" className="bg-blue-600">Actif</Badge>
                  </div>
                  <p className="text-sm text-blue-600">Limite: 10,000 requêtes/mois • Taux: 1000 req/min</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Clés API</h4>
                    <div className="space-y-3">
                      <div className="p-3 border rounded">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-mono">pk_live_***********</span>
                          <Button size="sm" variant="outline">Copier</Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Production • Créée le 15 jan 2025</p>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Key className="h-4 w-4 mr-2" />
                        Générer nouvelle clé
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Intégrations</h4>
                    <div className="space-y-2">
                      <div className="p-3 border rounded flex items-center justify-between">
                        <span className="text-sm">Calendrier Google</span>
                        <Badge variant="secondary">Connecté</Badge>
                      </div>
                      <div className="p-3 border rounded flex items-center justify-between">
                        <span className="text-sm">Système de facturation</span>
                        <Button size="sm" variant="outline">Connecter</Button>
                      </div>
                      <div className="p-3 border rounded flex items-center justify-between">
                        <span className="text-sm">CRM Medical</span>
                        <Button size="sm" variant="outline">Connecter</Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Documentation API</h4>
                  <div className="grid md:grid-cols-3 gap-2">
                    <Button variant="ghost" className="justify-start">
                      📖 Guide de démarrage
                    </Button>
                    <Button variant="ghost" className="justify-start">
                      🔧 Référence API
                    </Button>
                    <Button variant="ghost" className="justify-start">
                      💻 Exemples de code
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PremiumDashboard;
