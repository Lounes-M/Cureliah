
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Star, User, Calendar, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReviewWithDetails {
  id: string;
  establishment_id: string;
  doctor_id: string;
  booking_id: string;
  rating: number;
  comment: string;
  status: string;
  moderated_at?: string;
  moderator_id?: string;
  moderation_notes?: string;
  created_at: string;
  establishment_profile?: {
    first_name?: string;
    last_name?: string;
  };
  doctor_profile?: {
    first_name?: string;
    last_name?: string;
  };
  moderator_profile?: {
    first_name?: string;
    last_name?: string;
  };
}

const ReviewModerationPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [moderationNotes, setModerationNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchReviews();
  }, [selectedStatus]);

  const fetchReviews = async () => {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          establishment_profile:profiles!reviews_establishment_id_fkey(
            first_name,
            last_name
          ),
          doctor_profile:profiles!reviews_doctor_id_fkey(
            first_name,
            last_name
          ),
          moderator_profile:profiles!reviews_moderator_id_fkey(
            first_name,
            last_name
          )
        `);

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les avis",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const moderateReview = async (reviewId: string, newStatus: string, notes?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          status: newStatus,
          moderated_at: new Date().toISOString(),
          moderator_id: user.id,
          moderation_notes: notes || null
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Avis ${newStatus === 'approved' ? 'approuvé' : 'rejeté'} avec succès`
      });

      // Clear the notes for this review
      setModerationNotes(prev => {
        const updated = { ...prev };
        delete updated[reviewId];
        return updated;
      });

      fetchReviews();
    } catch (error: any) {
      console.error('Error moderating review:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modérer l'avis",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approuvé
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeté
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getReviewStats = () => {
    const total = reviews.length;
    const pending = reviews.filter(r => r.status === 'pending').length;
    const approved = reviews.filter(r => r.status === 'approved').length;
    const rejected = reviews.filter(r => r.status === 'rejected').length;

    return { total, pending, approved, rejected };
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des avis...</div>;
  }

  const stats = getReviewStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Modération des avis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
              <div className="text-sm text-yellow-600">En attente</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
              <div className="text-sm text-green-600">Approuvés</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
              <div className="text-sm text-red-600">Rejetés</div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Filtrer par statut:</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les avis</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvés</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun avis trouvé pour ce filtre</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Avis de {review.establishment_profile?.first_name} {review.establishment_profile?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Pour {review.doctor_profile?.first_name} {review.doctor_profile?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDistanceToNow(new Date(review.created_at), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {renderStars(review.rating)}
                    {getStatusBadge(review.status)}
                  </div>
                </div>

                {review.comment && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                )}

                {review.status === 'pending' && (
                  <div className="space-y-3 pt-4 border-t">
                    <Textarea
                      placeholder="Notes de modération (optionnel)..."
                      value={moderationNotes[review.id] || ''}
                      onChange={(e) => setModerationNotes(prev => ({
                        ...prev,
                        [review.id]: e.target.value
                      }))}
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => moderateReview(review.id, 'approved', moderationNotes[review.id])}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approuver
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => moderateReview(review.id, 'rejected', moderationNotes[review.id])}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejeter
                      </Button>
                    </div>
                  </div>
                )}

                {review.moderated_at && review.moderator_profile && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-700">
                      Modéré par {review.moderator_profile.first_name} {review.moderator_profile.last_name}
                    </p>
                    <p className="text-xs text-blue-600">
                      {formatDistanceToNow(new Date(review.moderated_at), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </p>
                    {review.moderation_notes && (
                      <p className="text-sm text-blue-600 mt-1">{review.moderation_notes}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewModerationPanel;
