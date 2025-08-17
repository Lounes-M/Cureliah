import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, Zap, Bell, Database, Users, FileText } from 'lucide-react';
import { useUrgentNotifications } from '@/hooks/useUrgentNotifications';
import { UrgentNotificationService } from '@/services/urgentNotificationService';
import { UrgentRequestService } from '@/services/urgentRequestService';
import { useAuth } from '@/hooks/useAuth';

const SystemTest: React.FC = () => {
  const { user, profile } = useAuth();
  const [testResults, setTestResults] = useState<{ [key: string]: 'pending' | 'success' | 'error' | 'running' }>({});
  const [testLogs, setTestLogs] = useState<string[]>([]);
  
  // Hook de notifications pour les médecins Premium
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError,
    markAsRead,
    refresh: refreshNotifications
  } = useUrgentNotifications({
    userId: user?.id || '',
    userType: profile?.user_type === 'doctor' ? 'doctor' : 'establishment',
    enableRealtime: true,
    enableToasts: true
  });

  const addLog = (message: string) => {
    setTestLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const updateTestResult = (testName: string, result: 'pending' | 'success' | 'error' | 'running') => {
    setTestResults(prev => ({ ...prev, [testName]: result }));
  };

  const runTest = async (testName: string, testFunction: () => Promise<void>) => {
    updateTestResult(testName, 'running');
    addLog(`Démarrage du test: ${testName}`);
    
    try {
      await testFunction();
      updateTestResult(testName, 'success');
      addLog(`✅ Test réussi: ${testName}`);
    } catch (error) {
      updateTestResult(testName, 'error');
      addLog(`❌ Test échoué: ${testName} - ${error.message}`);
      logger.error(`Test failed: ${testName}`, error, {}, 'Auto', 'todo_replaced');
    }
  };

  // Test 1: Connexion à la base de données
  const testDatabaseConnection = async () => {
    const service = new UrgentRequestService();
    await service.getUrgentRequests({ specialty: 'test' }, { limit: 1, offset: 0 });
    addLog('Connexion à la base de données confirmée');
  };

  // Test 2: Création d'une demande urgente
  const testCreateUrgentRequest = async () => {
    if (profile?.user_type !== 'establishment') {
      throw new Error('Ce test nécessite un compte établissement');
    }

    const service = new UrgentRequestService();
    const request = await service.createUrgentRequest({
      title: 'Test - Demande urgente système',
      description: 'Ceci est un test automatisé du système de demandes urgentes.',
      specialtyRequired: 'Médecine générale',
      urgencyLevel: 'medium',
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      startTime: '09:00',
      endTime: '17:00',
      location: 'Test Location',
      hourlyRate: 100,
      totalBudget: 800,
      minExperienceYears: 0,
      requiredCertifications: [],
      equipmentProvided: false,
      transportProvided: false,
      accommodationProvided: false,
      priorityBoost: false,
      featured: false,
      autoAcceptQualified: false,
      maxResponses: 5,
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
    });
    
    addLog(`Demande urgente créée avec ID: ${request.id}`);
  };

  // Test 3: Service de notifications
  const testNotificationService = async () => {
    const service = new UrgentNotificationService();
    const testNotifications = await service.getNotifications(user?.id || '', 'doctor', { limit: 5, offset: 0 });
    addLog(`${testNotifications.notifications.length} notifications récupérées`);
  };

  // Test 4: Notifications temps réel
  const testRealtimeNotifications = async () => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    await refreshNotifications();
    addLog(`Notifications en temps réel: ${unreadCount} non lues sur ${notifications.length} total`);
    
    if (notificationsError) {
      throw new Error(notificationsError);
    }
  };

  // Test 5: Marquer une notification comme lue
  const testMarkAsRead = async () => {
    if (notifications.length === 0) {
      throw new Error('Aucune notification disponible pour le test');
    }

    const firstNotification = notifications[0];
    if (!firstNotification.read) {
      await markAsRead(firstNotification.id);
      addLog(`Notification ${firstNotification.id} marquée comme lue`);
    } else {
      addLog('Toutes les notifications sont déjà lues');
    }
  };

  // Exécuter tous les tests
  const runAllTests = async () => {
    const tests = [
      { name: 'Database Connection', fn: testDatabaseConnection },
      { name: 'Notification Service', fn: testNotificationService },
      { name: 'Realtime Notifications', fn: testRealtimeNotifications },
    ];

    // Ajouter des tests spécifiques selon le type d'utilisateur
    if (profile?.user_type === 'establishment') {
      tests.push({ name: 'Create Urgent Request', fn: testCreateUrgentRequest });
    }

    if (notifications.length > 0) {
      tests.push({ name: 'Mark as Read', fn: testMarkAsRead });
    }

    for (const test of tests) {
      await runTest(test.name, test.fn);
      // Pause entre les tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'success': return <CheckCircle className="w-4 h-4 text-medical-green-light" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <Clock className="w-4 h-4 text-medical-blue-light animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Zap className="w-6 h-6 text-orange-500" />
        <h1 className="text-2xl font-bold">Test du Système de Notifications Urgentes</h1>
      </div>

      {/* Informations utilisateur */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Informations Utilisateur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Type d'utilisateur</p>
              <Badge variant={profile?.user_type === 'doctor' ? 'default' : 'secondary'}>
                {profile?.user_type === 'doctor' ? 'Médecin' : 'Établissement'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plan d'abonnement</p>
              <Badge variant={profile?.subscription_plan === 'premium' ? 'default' : 'outline'}>
                {profile?.subscription_plan || 'Non défini'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID Utilisateur</p>
              <code className="text-xs bg-gray-100 p-1 rounded">{user?.id?.slice(0, 8)}...</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statut des notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            État des Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-medical-blue">{notifications.length}</div>
              <p className="text-sm text-muted-foreground">Total notifications</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
              <p className="text-sm text-muted-foreground">Non lues</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-medical-green">
                {notificationsLoading ? '⏳' : '✅'}
              </div>
              <p className="text-sm text-muted-foreground">Statut temps réel</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tests système */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Tests Système
          </CardTitle>
          <CardDescription>
            Validez le bon fonctionnement du système de notifications urgentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runAllTests} className="w-full">
            Lancer tous les tests
          </Button>

          <div className="space-y-2">
            {Object.entries(testResults).map(([testName, result]) => (
              <div key={testName} className="flex items-center gap-3 p-2 border rounded">
                {getResultIcon(result)}
                <span className="flex-1">{testName}</span>
                <Badge variant={result === 'success' ? 'default' : result === 'error' ? 'destructive' : 'secondary'}>
                  {result === 'pending' ? 'En attente' : result === 'running' ? 'En cours' : result === 'success' ? 'Réussi' : 'Échec'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Logs de Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {testLogs.length === 0 ? (
              <p className="text-gray-500">Aucun log disponible</p>
            ) : (
              testLogs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alertes */}
      {notificationsError && (
        <Alert variant="destructive">
          <XCircle className="w-4 h-4" />
          <AlertDescription>
            Erreur de notifications: {notificationsError}
          </AlertDescription>
        </Alert>
      )}

      {profile?.user_type !== 'doctor' && profile?.user_type !== 'establishment' && (
        <Alert>
          <AlertDescription>
            Certains tests nécessitent un compte médecin ou établissement Premium.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SystemTest;
