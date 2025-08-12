import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, User, MessageCircle, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.browser';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Review {
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
}

interface ReviewsRatingsProps {
  targetId: string;
  targetType: 'doctor' | 'establishment';
  bookingId?: string;
  canReview?: boolean;
  showModerationControls?: boolean;
}

const ReviewsRatings = ({ 
  targetId, 
  targetType, 
  bookingId, 
  canReview = false,
  showModerationControls = false 
}: ReviewsRatingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('approved');

  useEffect(() => {
    fetchReviews();
  }, [targetId, targetType, statusFilter]);

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
          )
        `);

      if (targetType === 'doctor') {
        query = query.eq('doctor_id', targetId);
      } else {
        query = query.eq('establishment_id', targetId);
      }

      // Apply status filter - only moderators can see non-approved reviews
      if (!showModerationControls) {
        query = query.eq('status', 'approved');
      } else if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      // TODO: Replace with logger.error('Error fetching reviews:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les avis",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!user || !bookingId) return;

    setSubmitting(true);
    try {
      const reviewData = {
        booking_id: bookingId,
        rating: newRating,
        comment: newComment.trim() || null,
        [targetType === 'doctor' ? 'doctor_id' : 'establishment_id']: targetId,
        [targetType === 'doctor' ? 'establishment_id' : 'doctor_id']: user.id,
        status: 'approved' // Auto-approve for now, can be changed to 'pending' for moderation
      };

      const { error } = await supabase
        .from('reviews')
        .insert(reviewData);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Votre avis a été publié avec succès"
      });

      setShowReviewForm(false);
      setNewComment('');
      setNewRating(5);
      fetchReviews();
    } catch (error: any) {
      // TODO: Replace with logger.error('Error submitting review:', error);
      toast({
        title: "Erreur",
        description: "Impossible de publier l'avis",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const moderateReview = async (reviewId: string, newStatus: string, notes?: string) => {
    if (!user || !showModerationControls) return;

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

      fetchReviews();
    } catch (error: any) {
      // TODO: Replace with logger.error('Error moderating review:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modérer l'avis",
        variant: "destructive"
      });
    }
  };

  const getAverageRating = (): string => {
    const approvedReviews = reviews.filter(r => r.status === 'approved');
    if (approvedReviews.length === 0) return "0";
    const sum = approvedReviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / approvedReviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const approvedReviews = reviews.filter(r => r.status === 'approved');
    approvedReviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating as keyof typeof distribution]++;
      }
    });
    return distribution;
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approuvé</Badge>;
      case 'pending':
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des avis...</div>;
  }

  const averageRating = getAverageRating();
  const distribution = getRatingDistribution();
  const approvedReviews = reviews.filter(r => r.status === 'approved');

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span>Avis et évaluations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {averageRating}
              </div>
              <div className="flex justify-center mb-2">
                {renderStars(parseFloat(averageRating))}
              </div>
              <p className="text-gray-600">
                Basé sur {approvedReviews.length} avis
              </p>
            </div>

            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <span className="text-sm w-3">{rating}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${approvedReviews.length > 0 ? (distribution[rating as keyof typeof distribution] / approvedReviews.length) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {distribution[rating as keyof typeof distribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moderation Controls */}
      {showModerationControls && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Contrôles de modération</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium">Filtrer par statut:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les avis</SelectItem>
                  <SelectItem value="approved">Approuvés</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="rejected">Rejetés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Review Form */}
      {canReview && (
        <Card>
          <CardHeader>
            <CardTitle>Laisser un avis</CardTitle>
          </CardHeader>
          <CardContent>
            {!showReviewForm ? (
              <Button onClick={() => setShowReviewForm(true)}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Écrire un avis
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Note</label>
                  {renderStars(newRating, true, setNewRating)}
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Commentaire</label>
                  <Textarea
                    placeholder="Partagez votre expérience..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={submitReview} disabled={submitting}>
                    {submitting ? 'Publication...' : 'Publier l\'avis'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowReviewForm(false)}
                    disabled={submitting}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun avis pour le moment</p>
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
                        {targetType === 'doctor' 
                          ? `${review.establishment_profile?.first_name} ${review.establishment_profile?.last_name}`
                          : `${review.doctor_profile?.first_name} ${review.doctor_profile?.last_name}`
                        }
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(review.created_at), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span>{review.rating}/5</span>
                    </Badge>
                    {showModerationControls && getStatusBadge(review.status)}
                  </div>
                </div>

                {review.comment && (
                  <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>
                )}

                {showModerationControls && review.status === 'pending' && (
                  <div className="flex space-x-2 pt-4 border-t">
                    <Button 
                      size="sm" 
                      onClick={() => moderateReview(review.id, 'approved')}
                      className="bg-medical-green hover:bg-medical-green-dark"
                    >
                      Approuver
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => moderateReview(review.id, 'rejected')}
                    >
                      Rejeter
                    </Button>
                  </div>
                )}

                {showModerationControls && review.moderation_notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Notes de modération:</p>
                    <p className="text-sm text-gray-600">{review.moderation_notes}</p>
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

export default ReviewsRatings;
