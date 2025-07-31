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
  MessageSquare,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Send,
  FileText,
  Calendar,
  Users,
  Settings,
  Headphones,
  Video,
  ExternalLink,
  Download,
} from "lucide-react";

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
  responses: TicketResponse[];
}

interface TicketResponse {
  id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
  author_name: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful_count: number;
}

const SupportPremium = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [activeTab, setActiveTab] = useState("tickets");
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  
  // Form state pour nouveau ticket
  const [newTicketForm, setNewTicketForm] = useState({
    subject: "",
    description: "",
    category: "technical",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
  });

  // Form state pour réponse à un ticket
  const [replyForm, setReplyForm] = useState({
    message: "",
  });

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user || profile?.user_type !== "doctor") {
      navigate("/auth");
      return;
    }
    fetchSupportData();
  }, [user, profile, navigate]);

  const fetchSupportData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Simuler des données de support (remplacer par vraies queries Supabase)
      const mockTickets: SupportTicket[] = [
        {
          id: "1",
          subject: "Problème de synchronisation du calendrier",
          description: "Mon calendrier ne se synchronise pas correctement avec les nouvelles réservations.",
          category: "technical",
          priority: "medium",
          status: "in_progress",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          responses: [
            {
              id: "r1",
              message: "Bonjour, nous avons bien reçu votre demande. Notre équipe technique va examiner le problème de synchronisation.",
              is_staff: true,
              created_at: new Date(Date.now() - 3600000).toISOString(),
              author_name: "Support Cureliah",
            },
          ],
        },
        {
          id: "2",
          subject: "Question sur les tarifs premium",
          description: "J'aimerais comprendre les différences entre les plans tarifaires disponibles.",
          category: "billing",
          priority: "low",
          status: "resolved",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          responses: [
            {
              id: "r2",
              message: "Voici le détail des plans premium disponibles...",
              is_staff: true,
              created_at: new Date(Date.now() - 86400000).toISOString(),
              author_name: "Support Cureliah",
            },
          ],
        },
      ];

      const mockFAQs: FAQ[] = [
        {
          id: "faq1",
          question: "Comment modifier mes créneaux de disponibilité ?",
          answer: "Vous pouvez modifier vos créneaux depuis la section 'Gérer mes vacations' de votre dashboard. Cliquez sur 'Modifier' à côté du créneau souhaité.",
          category: "vacations",
          helpful_count: 45,
        },
        {
          id: "faq2",
          question: "Comment fonctionne le système de paiement ?",
          answer: "Les paiements sont traités automatiquement via Stripe. Vous recevez vos revenus directement sur votre compte bancaire sous 2-3 jours ouvrés.",
          category: "billing",
          helpful_count: 38,
        },
        {
          id: "faq3",
          question: "Puis-je annuler une réservation ?",
          answer: "Vous pouvez annuler une réservation jusqu'à 24h avant le début de la vacation. Les annulations tardives peuvent entraîner des pénalités.",
          category: "bookings",
          helpful_count: 52,
        },
        {
          id: "faq4",
          question: "Comment contacter un établissement ?",
          answer: "Utilisez le système de messagerie intégré disponible dans la section 'Mes réservations' pour communiquer directement avec l'établissement.",
          category: "communication",
          helpful_count: 29,
        },
      ];

      setTickets(mockTickets);
      setFaqs(mockFAQs);
    } catch (error) {
      console.error("Error fetching support data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de support",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    if (!user || !newTicketForm.subject || !newTicketForm.description) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      // Simulation de création de ticket (remplacer par vraie query Supabase)
      const newTicket: SupportTicket = {
        id: Date.now().toString(),
        subject: newTicketForm.subject,
        description: newTicketForm.description,
        category: newTicketForm.category,
        priority: newTicketForm.priority,
        status: "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        responses: [],
      };

      setTickets([newTicket, ...tickets]);
      setShowNewTicketModal(false);
      setNewTicketForm({
        subject: "",
        description: "",
        category: "technical",
        priority: "medium",
      });

      toast({
        title: "Succès",
        description: "Votre ticket a été créé avec succès",
      });
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le ticket",
        variant: "destructive",
      });
    }
  };

  const replyToTicket = async (ticketId: string) => {
    if (!replyForm.message.trim()) return;

    try {
      // Simulation de réponse (remplacer par vraie query Supabase)
      const updatedTickets = tickets.map(ticket => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            responses: [
              ...ticket.responses,
              {
                id: Date.now().toString(),
                message: replyForm.message,
                is_staff: false,
                created_at: new Date().toISOString(),
                author_name: profile?.first_name + " " + profile?.last_name || "Vous",
              },
            ],
            updated_at: new Date().toISOString(),
          };
        }
        return ticket;
      });

      setTickets(updatedTickets);
      setReplyForm({ message: "" });

      toast({
        title: "Succès",
        description: "Votre réponse a été envoyée",
      });
    } catch (error) {
      console.error("Error replying to ticket:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la réponse",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: "Ouvert", variant: "default" as const, color: "bg-blue-100 text-blue-800" },
      in_progress: { label: "En cours", variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800" },
      resolved: { label: "Résolu", variant: "outline" as const, color: "bg-green-100 text-green-800" },
      closed: { label: "Fermé", variant: "outline" as const, color: "bg-gray-100 text-gray-800" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: "Faible", color: "bg-gray-100 text-gray-800" },
      medium: { label: "Moyenne", color: "bg-blue-100 text-blue-800" },
      high: { label: "Élevée", color: "bg-orange-100 text-orange-800" },
      urgent: { label: "Urgente", color: "bg-red-100 text-red-800" },
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      technical: "Technique",
      billing: "Facturation",
      account: "Compte",
      vacations: "Vacations",
      bookings: "Réservations",
      communication: "Communication",
      other: "Autre",
    };
    return categoryMap[category] || category;
  };

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                Support Premium
              </h1>
              <p className="text-gray-600">
                Assistance prioritaire et ressources dédiées pour les docteurs premium
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <Video className="w-4 h-4 mr-2" />
                Démander un appel
              </Button>
              <Button 
                onClick={() => setShowNewTicketModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Nouveau ticket
              </Button>
            </div>
          </div>
        </div>

        {/* Informations de contact premium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-amber-100 rounded-full w-fit mx-auto mb-4">
                <Phone className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Support téléphonique</h3>
              <p className="text-sm text-gray-600 mb-4">
                Ligne directe premium disponible 7j/7
              </p>
              <Button variant="outline" className="border-amber-300 hover:bg-amber-50">
                <Phone className="w-4 h-4 mr-2" />
                01 23 45 67 89
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Chat en direct</h3>
              <p className="text-sm text-gray-600 mb-4">
                Réponse immédiate via chat premium
              </p>
              <Button variant="outline" className="border-green-300 hover:bg-green-50">
                <MessageSquare className="w-4 h-4 mr-2" />
                Démarrer le chat
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-4">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Formation personnalisée</h3>
              <p className="text-sm text-gray-600 mb-4">
                Sessions one-to-one avec nos experts
              </p>
              <Button variant="outline" className="border-purple-300 hover:bg-purple-50">
                <Calendar className="w-4 h-4 mr-2" />
                Réserver
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tabs pour les différentes sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tickets">Mes tickets</TabsTrigger>
            <TabsTrigger value="faq">FAQ Premium</TabsTrigger>
            <TabsTrigger value="resources">Ressources</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Mes tickets de support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Chargement...</p>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucun ticket de support</p>
                      <Button 
                        onClick={() => setShowNewTicketModal(true)}
                        className="mt-4"
                      >
                        Créer votre premier ticket
                      </Button>
                    </div>
                  ) : (
                    tickets.map((ticket) => (
                      <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                                {getStatusBadge(ticket.status)}
                                {getPriorityBadge(ticket.priority)}
                              </div>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {ticket.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                                </div>
                                <div className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {getCategoryLabel(ticket.category)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {ticket.responses.length} réponses
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedTicket(ticket)}
                            >
                              Voir détails
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    FAQ Premium
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Rechercher dans la FAQ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredFAQs.map((faq) => (
                    <Card key={faq.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                        <p className="text-gray-600 mb-3">{faq.answer}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{getCategoryLabel(faq.category)}</Badge>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {faq.helpful_count} personnes ont trouvé cela utile
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Guides et tutoriels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      "Guide complet d'utilisation de la plateforme",
                      "Optimiser vos créneaux pour maximiser vos revenus",
                      "Meilleures pratiques de communication patient",
                      "Guide de facturation et déclaration fiscale",
                    ].map((title, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <span className="font-medium">{title}</span>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Formations vidéo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      "Webinaire : Optimisation de profil docteur",
                      "Formation : Utilisation avancée du calendrier",
                      "Tutoriel : Gestion des réservations complexes",
                      "Masterclass : Développer sa patientèle",
                    ].map((title, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <span className="font-medium">{title}</span>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Équipe support dédiée
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-blue-600">MJ</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Marie Dupont</h4>
                        <p className="text-sm text-gray-600">Account Manager Premium</p>
                        <p className="text-xs text-gray-500">marie.dupont@cureliah.com</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-green-600">PL</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Pierre Martin</h4>
                        <p className="text-sm text-gray-600">Support Technique Senior</p>
                        <p className="text-xs text-gray-500">pierre.martin@cureliah.com</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Horaires de support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Support téléphonique</span>
                      <span className="text-green-600 font-medium">7j/7, 8h-20h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Chat en direct</span>
                      <span className="text-green-600 font-medium">24h/24, 7j/7</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Email</span>
                      <span className="text-blue-600 font-medium">Réponse &lt; 2h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Formation personnalisée</span>
                      <span className="text-purple-600 font-medium">Sur RDV</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal nouveau ticket */}
      <Dialog open={showNewTicketModal} onOpenChange={setShowNewTicketModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouveau ticket</DialogTitle>
            <DialogDescription>
              Décrivez votre problème ou votre question. Notre équipe vous répondra rapidement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Sujet *</Label>
              <Input
                id="subject"
                value={newTicketForm.subject}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                placeholder="Résumé de votre demande"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select value={newTicketForm.category} onValueChange={(value) => setNewTicketForm({ ...newTicketForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technique</SelectItem>
                    <SelectItem value="billing">Facturation</SelectItem>
                    <SelectItem value="account">Compte</SelectItem>
                    <SelectItem value="vacations">Vacations</SelectItem>
                    <SelectItem value="bookings">Réservations</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select value={newTicketForm.priority} onValueChange={(value: any) => setNewTicketForm({ ...newTicketForm, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={newTicketForm.description}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                placeholder="Décrivez votre problème en détail..."
                rows={4}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowNewTicketModal(false)}>
                Annuler
              </Button>
              <Button onClick={createTicket}>
                <Send className="w-4 h-4 mr-2" />
                Créer le ticket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal détail ticket */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{selectedTicket.subject}</DialogTitle>
                  <div className="flex gap-2">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                </div>
                <DialogDescription>
                  Ticket #{selectedTicket.id} • Créé le {new Date(selectedTicket.created_at).toLocaleDateString('fr-FR')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Description initiale */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-600">
                          {profile?.first_name?.[0] || "U"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">Vous</span>
                          <span className="text-xs text-gray-500">
                            {new Date(selectedTicket.created_at).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-gray-700">{selectedTicket.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Réponses */}
                {selectedTicket.responses.map((response) => (
                  <Card key={response.id} className={response.is_staff ? "border-l-4 border-l-blue-500" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          response.is_staff ? "bg-blue-100" : "bg-gray-100"
                        }`}>
                          <span className={`text-sm font-semibold ${
                            response.is_staff ? "text-blue-600" : "text-gray-600"
                          }`}>
                            {response.author_name[0]}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{response.author_name}</span>
                            {response.is_staff && (
                              <Badge variant="outline" className="text-xs">Support</Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(response.created_at).toLocaleString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-gray-700">{response.message}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Formulaire de réponse */}
                {selectedTicket.status !== "closed" && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <Label htmlFor="reply">Votre réponse</Label>
                        <Textarea
                          id="reply"
                          value={replyForm.message}
                          onChange={(e) => setReplyForm({ message: e.target.value })}
                          placeholder="Tapez votre réponse..."
                          rows={3}
                        />
                        <div className="flex justify-end">
                          <Button 
                            onClick={() => replyToTicket(selectedTicket.id)}
                            disabled={!replyForm.message.trim()}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Envoyer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportPremium;
