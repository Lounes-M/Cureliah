import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, CheckCircle, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client.browser';

const DemoRequest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
    userType: 'establishment'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Insert demo request into database
      const { error } = await supabase
        .from('demo_requests')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            company: formData.company,
            phone: formData.phone,
            message: formData.message,
            user_type: formData.userType,
            status: 'pending',
            requested_at: new Date().toISOString()
          }
        ]);

      if (error) {
        throw error;
      }

      // Send notification to admin
      const { error: notificationError } = await supabase
        .from('admin_notifications')
        .insert([
          {
            type: 'demo_request',
            title: 'Nouvelle demande de démonstration',
            message: `${formData.name} (${formData.company}) a demandé une démonstration`,
            data: formData,
            is_read: false,
            created_at: new Date().toISOString()
          }
        ]);

      if (notificationError) {
        console.error('Erreur lors de l\'envoi de la notification:', notificationError);
        // Continue anyway, the main request was successful
      }

      setLoading(false);
      setSubmitted(true);
      toast({
        title: "Demande envoyée",
        description: "Nous vous recontacterons dans les 24h pour planifier votre démonstration."
      });

    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande:', error);
      setLoading(false);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre demande. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Demande envoyée !</h2>
            <p className="text-gray-600 mb-6">
              Nous vous recontacterons dans les 24h pour planifier votre démonstration personnalisée.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              Demande de démonstration
            </h1>
            <p className="text-gray-600 mt-1">
              Réservez une démonstration personnalisée de la plateforme Cureliah
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Planifiez votre démonstration</CardTitle>
            <CardDescription>
              Nos experts vous présenteront la plateforme et répondront à toutes vos questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Jean Dupont"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email professionnel *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="jean.dupont@exemple.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                    Établissement / Structure
                  </label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Hôpital Central, Clinique ABC..."
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-1">
                  Vous êtes *
                </label>
                <select
                  id="userType"
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="establishment">Un établissement de santé</option>
                  <option value="doctor">Un médecin</option>
                  <option value="group">Un groupe hospitalier</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message (optionnel)
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Décrivez vos besoins ou questions spécifiques..."
                  rows={4}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Ce que vous découvrirez :</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Interface de gestion des vacations</li>
                  <li>• Système de mise en relation</li>
                  <li>• Fonctionnalités premium</li>
                  <li>• Support et formation</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Envoi en cours...
                  </div>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Demander une démonstration
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemoRequest;
