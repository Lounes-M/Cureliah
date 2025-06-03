import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Bell, Shield, Mail, CreditCard } from 'lucide-react';

export default function SystemSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      vacationAlerts: true,
      paymentAlerts: true
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90
    },
    email: {
      smtpHost: '',
      smtpPort: '',
      smtpUser: '',
      smtpPassword: '',
      fromEmail: ''
    },
    payments: {
      stripeEnabled: true,
      stripePublicKey: '',
      stripeSecretKey: '',
      commissionRate: 10
    }
  });

  const handleSave = async (section: string) => {
    try {
      // Ici, vous pouvez ajouter la logique pour sauvegarder les paramètres dans votre base de données
      toast({
        title: "Succès",
        description: "Les paramètres ont été sauvegardés avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid grid-cols-4 gap-4">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Paiements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Notifications par email</Label>
                <Switch
                  id="email-notifications"
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      emailNotifications: checked
                    }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Notifications push</Label>
                <Switch
                  id="push-notifications"
                  checked={settings.notifications.pushNotifications}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      pushNotifications: checked
                    }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="vacation-alerts">Alertes de vacation</Label>
                <Switch
                  id="vacation-alerts"
                  checked={settings.notifications.vacationAlerts}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      vacationAlerts: checked
                    }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="payment-alerts">Alertes de paiement</Label>
                <Switch
                  id="payment-alerts"
                  checked={settings.notifications.paymentAlerts}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      paymentAlerts: checked
                    }
                  })}
                />
              </div>
              <Button onClick={() => handleSave('notifications')}>
                Sauvegarder les paramètres
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de sécurité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="two-factor">Authentification à deux facteurs</Label>
                <Switch
                  id="two-factor"
                  checked={settings.security.twoFactorAuth}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      twoFactorAuth: checked
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Délai d'expiration de session (minutes)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      sessionTimeout: parseInt(e.target.value)
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-expiry">Expiration du mot de passe (jours)</Label>
                <Input
                  id="password-expiry"
                  type="number"
                  value={settings.security.passwordExpiry}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      passwordExpiry: parseInt(e.target.value)
                    }
                  })}
                />
              </div>
              <Button onClick={() => handleSave('security')}>
                Sauvegarder les paramètres
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Configuration SMTP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">Serveur SMTP</Label>
                <Input
                  id="smtp-host"
                  value={settings.email.smtpHost}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: {
                      ...settings.email,
                      smtpHost: e.target.value
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">Port SMTP</Label>
                <Input
                  id="smtp-port"
                  value={settings.email.smtpPort}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: {
                      ...settings.email,
                      smtpPort: e.target.value
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-user">Utilisateur SMTP</Label>
                <Input
                  id="smtp-user"
                  value={settings.email.smtpUser}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: {
                      ...settings.email,
                      smtpUser: e.target.value
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-password">Mot de passe SMTP</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  value={settings.email.smtpPassword}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: {
                      ...settings.email,
                      smtpPassword: e.target.value
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-email">Email d'expédition</Label>
                <Input
                  id="from-email"
                  type="email"
                  value={settings.email.fromEmail}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: {
                      ...settings.email,
                      fromEmail: e.target.value
                    }
                  })}
                />
              </div>
              <Button onClick={() => handleSave('email')}>
                Sauvegarder les paramètres
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des paiements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="stripe-enabled">Activer Stripe</Label>
                <Switch
                  id="stripe-enabled"
                  checked={settings.payments.stripeEnabled}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    payments: {
                      ...settings.payments,
                      stripeEnabled: checked
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripe-public-key">Clé publique Stripe</Label>
                <Input
                  id="stripe-public-key"
                  value={settings.payments.stripePublicKey}
                  onChange={(e) => setSettings({
                    ...settings,
                    payments: {
                      ...settings.payments,
                      stripePublicKey: e.target.value
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripe-secret-key">Clé secrète Stripe</Label>
                <Input
                  id="stripe-secret-key"
                  type="password"
                  value={settings.payments.stripeSecretKey}
                  onChange={(e) => setSettings({
                    ...settings,
                    payments: {
                      ...settings.payments,
                      stripeSecretKey: e.target.value
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission-rate">Taux de commission (%)</Label>
                <Input
                  id="commission-rate"
                  type="number"
                  value={settings.payments.commissionRate}
                  onChange={(e) => setSettings({
                    ...settings,
                    payments: {
                      ...settings.payments,
                      commissionRate: parseInt(e.target.value)
                    }
                  })}
                />
              </div>
              <Button onClick={() => handleSave('payments')}>
                Sauvegarder les paramètres
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 