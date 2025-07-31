import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client.browser";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Key,
  Code,
  Shield,
  Activity,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Download,
  FileText,
  Zap,
  BarChart3,
  Globe,
  Database,
  Settings,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  created_at: string;
  last_used: string | null;
  requests_count: number;
  is_active: boolean;
}

interface APIUsage {
  endpoint: string;
  method: string;
  requests_count: number;
  success_rate: number;
  avg_response_time: number;
  last_24h: number;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  created_at: string;
  last_delivery: string | null;
  success_rate: number;
}

const APIPremiumDoctor = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [apiUsage, setApiUsage] = useState<APIUsage[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  
  // Form state pour nouvelle clé API
  const [newKeyForm, setNewKeyForm] = useState({
    name: "",
    permissions: [] as string[],
  });

  // Form state pour nouveau webhook
  const [newWebhookForm, setNewWebhookForm] = useState({
    url: "",
    events: [] as string[],
  });

  const [activeTab, setActiveTab] = useState("keys");

  const availablePermissions = [
    { id: "read:vacations", label: "Lire les vacations", description: "Accès en lecture aux vacations" },
    { id: "write:vacations", label: "Écrire les vacations", description: "Créer/modifier des vacations" },
    { id: "read:bookings", label: "Lire les réservations", description: "Accès aux données de réservation" },
    { id: "read:profile", label: "Lire le profil", description: "Accès aux informations de profil" },
    { id: "write:profile", label: "Modifier le profil", description: "Modifier les informations de profil" },
    { id: "read:analytics", label: "Analytics", description: "Accès aux données d'analyse" },
  ];

  const availableEvents = [
    { id: "vacation.created", label: "Vacation créée", description: "Notifié lors de la création d'une vacation" },
    { id: "vacation.updated", label: "Vacation modifiée", description: "Notifié lors de la modification d'une vacation" },
    { id: "booking.created", label: "Réservation créée", description: "Notifié lors d'une nouvelle réservation" },
    { id: "booking.cancelled", label: "Réservation annulée", description: "Notifié lors d'une annulation" },
    { id: "profile.updated", label: "Profil modifié", description: "Notifié lors de la modification du profil" },
  ];

  useEffect(() => {
    if (!user || profile?.user_type !== "doctor") {
      navigate("/auth");
      return;
    }
    fetchAPIData();
  }, [user, profile, navigate]);

  const fetchAPIData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Simulation des données API (remplacer par vraies queries Supabase)
      const mockApiKeys: APIKey[] = [
        {
          id: "1",
          name: "Application mobile principale",
          key: "ck_live_51234567890abcdef",
          permissions: ["read:vacations", "write:vacations", "read:bookings"],
          created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
          last_used: new Date(Date.now() - 3600000).toISOString(),
          requests_count: 1247,
          is_active: true,
        },
        {
          id: "2",
          name: "Intégration calendrier",
          key: "ck_test_98765432109876543",
          permissions: ["read:vacations", "read:profile"],
          created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
          last_used: new Date(Date.now() - 86400000).toISOString(),
          requests_count: 523,
          is_active: true,
        },
      ];

      const mockApiUsage: APIUsage[] = [
        {
          endpoint: "/api/v1/vacations",
          method: "GET",
          requests_count: 234,
          success_rate: 99.1,
          avg_response_time: 145,
          last_24h: 42,
        },
        {
          endpoint: "/api/v1/vacations",
          method: "POST",
          requests_count: 89,
          success_rate: 98.8,
          avg_response_time: 267,
          last_24h: 12,
        },
        {
          endpoint: "/api/v1/bookings",
          method: "GET",
          requests_count: 156,
          success_rate: 99.3,
          avg_response_time: 123,
          last_24h: 28,
        },
        {
          endpoint: "/api/v1/profile",
          method: "GET",
          requests_count: 67,
          success_rate: 100,
          avg_response_time: 98,
          last_24h: 8,
        },
      ];

      const mockWebhooks: WebhookEndpoint[] = [
        {
          id: "1",
          url: "https://mon-app.exemple.com/webhooks/cureliah",
          events: ["vacation.created", "booking.created"],
          secret: "whsec_1234567890abcdef",
          is_active: true,
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          last_delivery: new Date(Date.now() - 1800000).toISOString(),
          success_rate: 98.5,
        },
      ];

      setApiKeys(mockApiKeys);
      setApiUsage(mockApiUsage);
      setWebhooks(mockWebhooks);
    } catch (error) {
      console.error("Error fetching API data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données API",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    if (!newKeyForm.name || newKeyForm.permissions.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      // Simulation de génération de clé (remplacer par vraie logique)
      const newKey: APIKey = {
        id: Date.now().toString(),
        name: newKeyForm.name,
        key: `ck_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        permissions: newKeyForm.permissions,
        created_at: new Date().toISOString(),
        last_used: null,
        requests_count: 0,
        is_active: true,
      };

      setApiKeys([...apiKeys, newKey]);
      setShowKeyModal(false);
      setNewKeyForm({ name: "", permissions: [] });

      toast({
        title: "Succès",
        description: "Nouvelle clé API générée avec succès",
      });
    } catch (error) {
      console.error("Error generating API key:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer la clé API",
        variant: "destructive",
      });
    }
  };

  const createWebhook = async () => {
    if (!newWebhookForm.url || newWebhookForm.events.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      // Simulation de création de webhook (remplacer par vraie logique)
      const newWebhook: WebhookEndpoint = {
        id: Date.now().toString(),
        url: newWebhookForm.url,
        events: newWebhookForm.events,
        secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
        is_active: true,
        created_at: new Date().toISOString(),
        last_delivery: null,
        success_rate: 100,
      };

      setWebhooks([...webhooks, newWebhook]);
      setShowWebhookModal(false);
      setNewWebhookForm({ url: "", events: [] });

      toast({
        title: "Succès",
        description: "Webhook créé avec succès",
      });
    } catch (error) {
      console.error("Error creating webhook:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le webhook",
        variant: "destructive",
      });
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "Le texte a été copié dans le presse-papiers",
    });
  };

  const revokeApiKey = async (keyId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir révoquer cette clé API ?")) {
      return;
    }

    try {
      setApiKeys(apiKeys.filter(key => key.id !== keyId));
      toast({
        title: "Succès",
        description: "Clé API révoquée avec succès",
      });
    } catch (error) {
      console.error("Error revoking API key:", error);
      toast({
        title: "Erreur",
        description: "Impossible de révoquer la clé API",
        variant: "destructive",
      });
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce webhook ?")) {
      return;
    }

    try {
      setWebhooks(webhooks.filter(webhook => webhook.id !== webhookId));
      toast({
        title: "Succès",
        description: "Webhook supprimé avec succès",
      });
    } catch (error) {
      console.error("Error deleting webhook:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le webhook",
        variant: "destructive",
      });
    }
  };

  const formatKey = (key: string, isVisible: boolean) => {
    if (isVisible) {
      return key;
    }
    return key.substring(0, 12) + "..." + key.substring(key.length - 4);
  };

  if (!user || profile?.user_type !== "doctor") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/doctor/dashboard")}
            className="mb-4 hover:bg-white/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au dashboard
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                API Premium
              </h1>
              <p className="text-gray-600">
                Intégrez Cureliah dans vos applications avec notre API complète
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <FileText className="w-4 h-4 mr-2" />
                Documentation
              </Button>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                SDK
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clés API actives</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {apiKeys.filter(key => key.is_active).length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Key className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Requêtes (24h)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {apiUsage.reduce((sum, usage) => sum + usage.last_24h, 0)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taux de succès</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(apiUsage.reduce((sum, usage) => sum + usage.success_rate, 0) / apiUsage.length)}%
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Webhooks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {webhooks.filter(w => w.is_active).length}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principales */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="keys">Clés API</TabsTrigger>
            <TabsTrigger value="usage">Utilisation</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Mes clés API
                </CardTitle>
                <Button onClick={() => setShowKeyModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle clé
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Chargement...</p>
                    </div>
                  ) : apiKeys.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Key className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucune clé API créée</p>
                      <Button 
                        onClick={() => setShowKeyModal(true)}
                        className="mt-4"
                      >
                        Créer votre première clé
                      </Button>
                    </div>
                  ) : (
                    apiKeys.map((apiKey) => (
                      <Card key={apiKey.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{apiKey.name}</h3>
                                <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                                  {apiKey.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-3">
                                <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                                  {formatKey(apiKey.key, showSecrets[apiKey.id])}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleKeyVisibility(apiKey.id)}
                                >
                                  {showSecrets[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(apiKey.key)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="flex flex-wrap gap-1 mb-3">
                                {apiKey.permissions.map((permission) => (
                                  <Badge key={permission} variant="outline" className="text-xs">
                                    {availablePermissions.find(p => p.id === permission)?.label || permission}
                                  </Badge>
                                ))}
                              </div>

                              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Créée:</span><br />
                                  {new Date(apiKey.created_at).toLocaleDateString('fr-FR')}
                                </div>
                                <div>
                                  <span className="font-medium">Dernière utilisation:</span><br />
                                  {apiKey.last_used ? new Date(apiKey.last_used).toLocaleDateString('fr-FR') : "Jamais"}
                                </div>
                                <div>
                                  <span className="font-medium">Requêtes:</span><br />
                                  {apiKey.requests_count.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => revokeApiKey(apiKey.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Statistiques d'utilisation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiUsage.map((usage, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{usage.method}</Badge>
                          <code className="text-sm font-mono">{usage.endpoint}</code>
                        </div>
                        <Badge variant={usage.success_rate > 95 ? "default" : "destructive"}>
                          {usage.success_rate}% succès
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total requêtes</span>
                          <p className="font-semibold">{usage.requests_count.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Dernières 24h</span>
                          <p className="font-semibold">{usage.last_24h}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Temps de réponse moyen</span>
                          <p className="font-semibold">{usage.avg_response_time}ms</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Taux de succès</span>
                          <p className="font-semibold">{usage.success_rate}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Webhooks
                </CardTitle>
                <Button onClick={() => setShowWebhookModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau webhook
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {webhooks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucun webhook configuré</p>
                      <Button 
                        onClick={() => setShowWebhookModal(true)}
                        className="mt-4"
                      >
                        Créer votre premier webhook
                      </Button>
                    </div>
                  ) : (
                    webhooks.map((webhook) => (
                      <Card key={webhook.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                                  {webhook.url}
                                </code>
                                <Badge variant={webhook.is_active ? "default" : "secondary"}>
                                  {webhook.is_active ? "Actif" : "Inactif"}
                                </Badge>
                              </div>
                              
                              <div className="flex flex-wrap gap-1 mb-3">
                                {webhook.events.map((event) => (
                                  <Badge key={event} variant="outline" className="text-xs">
                                    {availableEvents.find(e => e.id === event)?.label || event}
                                  </Badge>
                                ))}
                              </div>

                              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Créé:</span><br />
                                  {new Date(webhook.created_at).toLocaleDateString('fr-FR')}
                                </div>
                                <div>
                                  <span className="font-medium">Dernière livraison:</span><br />
                                  {webhook.last_delivery ? new Date(webhook.last_delivery).toLocaleDateString('fr-FR') : "Aucune"}
                                </div>
                                <div>
                                  <span className="font-medium">Taux de succès:</span><br />
                                  {webhook.success_rate}%
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteWebhook(webhook.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Documentation API
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Guide de démarrage rapide</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Apprenez les bases de l'API Cureliah en quelques minutes.
                      </p>
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Lire le guide
                      </Button>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Référence API complète</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Documentation détaillée de tous les endpoints disponibles.
                      </p>
                      <Button variant="outline" size="sm">
                        <Code className="w-4 h-4 mr-2" />
                        Explorer l'API
                      </Button>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Exemples de code</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Snippets de code prêts à utiliser dans différents langages.
                      </p>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger exemples
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    SDK et outils
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">SDK JavaScript/TypeScript</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Bibliothèque officielle pour les applications web et Node.js.
                      </p>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        npm install cureliah-sdk
                      </Button>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">SDK Python</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Bibliothèque pour intégrations Python et Django.
                      </p>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        pip install cureliah
                      </Button>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Collection Postman</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Testez l'API directement avec notre collection Postman.
                      </p>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Importer collection
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Exemple de code */}
            <Card>
              <CardHeader>
                <CardTitle>Exemple d'utilisation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm">
{`// Exemple avec le SDK JavaScript
import { CureliahAPI } from 'cureliah-sdk';

const api = new CureliahAPI({
  apiKey: 'your_api_key_here'
});

// Récupérer ses vacations
const vacations = await api.vacations.list();

// Créer une nouvelle vacation
const newVacation = await api.vacations.create({
  title: 'Vacation urgences',
  startDate: '2024-01-15',
  endDate: '2024-01-15',
  startTime: '08:00',
  endTime: '18:00',
  speciality: 'general',
  hourlyRate: 45
});

console.log('Vacation créée:', newVacation);`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal nouvelle clé API */}
      <Dialog open={showKeyModal} onOpenChange={setShowKeyModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle clé API</DialogTitle>
            <DialogDescription>
              Générez une nouvelle clé API pour intégrer Cureliah dans vos applications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="keyName">Nom de la clé *</Label>
              <Input
                id="keyName"
                value={newKeyForm.name}
                onChange={(e) => setNewKeyForm({ ...newKeyForm, name: e.target.value })}
                placeholder="Ex: Mon application mobile"
              />
            </div>

            <div>
              <Label>Permissions *</Label>
              <div className="grid grid-cols-1 gap-3 mt-2">
                {availablePermissions.map((permission) => (
                  <div key={permission.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      id={permission.id}
                      checked={newKeyForm.permissions.includes(permission.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewKeyForm({
                            ...newKeyForm,
                            permissions: [...newKeyForm.permissions, permission.id]
                          });
                        } else {
                          setNewKeyForm({
                            ...newKeyForm,
                            permissions: newKeyForm.permissions.filter(p => p !== permission.id)
                          });
                        }
                      }}
                      className="mt-1"
                    />
                    <div>
                      <Label htmlFor={permission.id} className="font-medium cursor-pointer">
                        {permission.label}
                      </Label>
                      <p className="text-sm text-gray-600">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Important</h4>
                  <p className="text-sm text-yellow-700">
                    Votre clé API sera affichée une seule fois après création. 
                    Assurez-vous de la copier et de la stocker en sécurité.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowKeyModal(false)}>
                Annuler
              </Button>
              <Button onClick={generateApiKey}>
                <Key className="w-4 h-4 mr-2" />
                Générer la clé
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal nouveau webhook */}
      <Dialog open={showWebhookModal} onOpenChange={setShowWebhookModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouveau webhook</DialogTitle>
            <DialogDescription>
              Configurez un webhook pour recevoir des notifications en temps réel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="webhookUrl">URL du webhook *</Label>
              <Input
                id="webhookUrl"
                value={newWebhookForm.url}
                onChange={(e) => setNewWebhookForm({ ...newWebhookForm, url: e.target.value })}
                placeholder="https://votre-app.com/webhooks/cureliah"
              />
            </div>

            <div>
              <Label>Événements à écouter *</Label>
              <div className="grid grid-cols-1 gap-3 mt-2">
                {availableEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      id={event.id}
                      checked={newWebhookForm.events.includes(event.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewWebhookForm({
                            ...newWebhookForm,
                            events: [...newWebhookForm.events, event.id]
                          });
                        } else {
                          setNewWebhookForm({
                            ...newWebhookForm,
                            events: newWebhookForm.events.filter(ev => ev !== event.id)
                          });
                        }
                      }}
                      className="mt-1"
                    />
                    <div>
                      <Label htmlFor={event.id} className="font-medium cursor-pointer">
                        {event.label}
                      </Label>
                      <p className="text-sm text-gray-600">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowWebhookModal(false)}>
                Annuler
              </Button>
              <Button onClick={createWebhook}>
                <Globe className="w-4 h-4 mr-2" />
                Créer le webhook
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default APIPremiumDoctor;
