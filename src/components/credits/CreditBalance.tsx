import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Plus, History, RefreshCw } from 'lucide-react';
import { CreditsService, UserCredits } from '@/services/creditsService';
import { CreditStore } from './CreditStore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CreditBalanceProps {
  variant?: 'default' | 'compact' | 'inline';
  showPurchaseButton?: boolean;
  onBalanceUpdate?: (balance: number) => void;
  refreshTrigger?: number; // Pour forcer le refresh
}

export const CreditBalance: React.FC<CreditBalanceProps> = ({
  variant = 'default',
  showPurchaseButton = true,
  onBalanceUpdate,
  refreshTrigger = 0
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStore, setShowStore] = useState(false);

  const fetchCredits = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const userCredits = await CreditsService.getUserCredits(user.id);
      setCredits(userCredits);
      onBalanceUpdate?.(userCredits.balance);
    } catch (error) {
      console.error('Erreur lors du chargement des crédits:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger votre solde de crédits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [user?.id, refreshTrigger]);

  const handlePurchaseComplete = (newBalance: number) => {
    setCredits(prev => prev ? { ...prev, balance: newBalance } : null);
    onBalanceUpdate?.(newBalance);
    setShowStore(false);
    toast({
      title: "Achat réussi !",
      description: `Votre solde a été mis à jour. Nouveau solde: ${newBalance} crédits`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  if (!credits) return null;

  // Version compacte pour le header/modal
  if (variant === 'compact' || variant === 'inline') {
    return (
      <>
        <div className={`flex flex-col sm:flex-row sm:items-center gap-2 ${variant === 'inline' ? 'sm:justify-between' : ''}`}>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-600" />
            <span className="font-medium">{credits.balance}</span>
            <span className="text-sm text-muted-foreground">crédits</span>
          </div>
          {showPurchaseButton && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowStore(true)}
              className="h-8 whitespace-nowrap"
            >
              <Plus className="w-3 h-3 mr-1" />
              Acheter
            </Button>
          )}
        </div>
        <CreditStore 
          open={showStore}
          onOpenChange={setShowStore}
          onPurchaseComplete={handlePurchaseComplete}
        />
      </>
    );
  }

  // Version par défaut (card complète)
  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold">Mes Crédits</h3>
              </div>
              
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {credits.balance}
                </span>
                <span className="text-muted-foreground">crédits disponibles</span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                <div>Total acheté: {credits.total_purchased}</div>
                <div>Total utilisé: {credits.total_spent}</div>
              </div>
              
              {credits.balance < 5 && (
                <Badge variant="destructive" className="w-fit">
                  Solde faible
                </Badge>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:gap-2 min-w-0">
              {showPurchaseButton && (
                <Button 
                  onClick={() => setShowStore(true)}
                  className="whitespace-nowrap"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Acheter des crédits
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchCredits}
                className="whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <CreditStore 
        open={showStore}
        onOpenChange={setShowStore}
        onPurchaseComplete={handlePurchaseComplete}
      />
    </>
  );
};
