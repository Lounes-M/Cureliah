import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Coins, History, ShoppingCart, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { CreditBalance } from '@/components/credits/CreditBalance';
import { CreditStore } from '@/components/credits/CreditStore';
import { CreditsService, CreditTransaction } from '@/services/creditsService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';

const CreditsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [showStore, setShowStore] = useState(false);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [creditRefresh, setCreditRefresh] = useState(0);

  // Vérifier si c'est un retour de paiement Stripe
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      verifyPurchase(sessionId);
    }
  }, [searchParams]);

  const verifyPurchase = async (sessionId: string) => {
    try {
      const result = await CreditsService.verifyPurchase(sessionId);
      if (result.success) {
        toast({
          title: "Achat réussi !",
          description: "Vos crédits ont été ajoutés à votre compte.",
        });
        setCreditRefresh(prev => prev + 1);
        loadTransactions();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la vérification de l'achat",
        variant: "destructive"
      });
    }
  };

  const loadTransactions = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingTransactions(true);
      const userTransactions = await CreditsService.getCreditTransactions(user.id, 20);
      setTransactions(userTransactions);
    } catch (error) {
      logger.error('Erreur lors du chargement des transactions:', error, {}, 'Auto', 'todo_replaced');
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [user?.id, creditRefresh]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <ArrowUpRight className="w-4 h-4 text-medical-green" />;
      case 'usage': return <ArrowDownRight className="w-4 h-4 text-red-600" />;
      case 'refund': return <ArrowUpRight className="w-4 h-4 text-medical-blue" />;
      case 'bonus': return <ArrowUpRight className="w-4 h-4 text-purple-600" />;
      default: return <Coins className="w-4 h-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'text-medical-green';
      case 'usage': return 'text-red-600';
      case 'refund': return 'text-medical-blue';
      case 'bonus': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'purchase': return 'Achat';
      case 'usage': return 'Utilisation';
      case 'refund': return 'Remboursement';
      case 'bonus': return 'Bonus';
      default: return type;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-600" />
            Mes Crédits
          </h1>
          <p className="text-muted-foreground">
            Gérez vos crédits pour publier des demandes urgentes
          </p>
        </div>
        <Button onClick={() => setShowStore(true)}>
          <ShoppingCart className="w-4 h-4 mr-2" />
          Acheter des crédits
        </Button>
      </div>

      {/* Solde de crédits */}
      <CreditBalance 
        variant="default" 
        showPurchaseButton={true}
        refreshTrigger={creditRefresh}
      />

      {/* Informations sur les coûts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Tarification des demandes urgentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl font-bold text-yellow-600">1</div>
              <div className="text-sm font-medium">Urgence modérée</div>
              <div className="text-xs text-muted-foreground">crédit</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl font-bold text-orange-600">2</div>
              <div className="text-sm font-medium">Urgence élevée</div>
              <div className="text-xs text-muted-foreground">crédits</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl font-bold text-red-600">3</div>
              <div className="text-sm font-medium">Urgence critique</div>
              <div className="text-xs text-muted-foreground">crédits</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl font-bold text-red-800">5</div>
              <div className="text-sm font-medium">Urgence extrême</div>
              <div className="text-xs text-muted-foreground">crédits</div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline">+2 crédits</Badge>
              <span>Boost prioritaire</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">+3 crédits</Badge>
              <span>Mise en avant</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique des transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historique des transactions
            <Button
              variant="ghost"
              size="sm"
              onClick={loadTransactions}
              disabled={loadingTransactions}
            >
              <RefreshCw className={`w-4 h-4 ${loadingTransactions ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Chargement des transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune transaction pour le moment
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'usage' ? '-' : '+'}{Math.abs(transaction.amount)} crédits
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getTransactionLabel(transaction.type)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Boutique de crédits */}
      <CreditStore
        open={showStore}
        onOpenChange={setShowStore}
        onPurchaseComplete={(newBalance) => {
          setCreditRefresh(prev => prev + 1);
          loadTransactions();
        }}
      />
    </div>
  );
};

export default CreditsPage;
