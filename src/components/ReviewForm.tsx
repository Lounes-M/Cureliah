
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ReviewFormProps {
  bookingId: string;
  targetId: string;
  targetName: string;
  targetType: 'doctor' | 'establishment';
  onReviewSubmitted: () => void;
}

const ReviewForm = ({ 
  bookingId, 
  targetId, 
  targetName, 
  targetType, 
  onReviewSubmitted 
}: ReviewFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;

    setLoading(true);
    try {
      const reviewData = {
        booking_id: bookingId,
        rating,
        comment: comment.trim() || null,
        doctor_id: targetType === 'doctor' ? targetId : user.id,
        establishment_id: targetType === 'establishment' ? targetId : user.id,
        status: 'approved' // Auto-approve for now, can be changed to 'pending' for moderation
      };

      const { error } = await supabase
        .from('reviews')
        .insert(reviewData);

      if (error) throw error;

      toast({
        title: "Évaluation envoyée",
        description: "Merci pour votre retour !",
      });

      onReviewSubmitted();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'évaluation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Évaluer la collaboration</CardTitle>
        <CardDescription>
          Donnez votre avis sur votre expérience avec {targetName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Note</label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Commentaire (optionnel)
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partagez votre expérience..."
            className="min-h-[100px]"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || loading}
          className="w-full"
        >
          {loading ? 'Envoi...' : 'Envoyer l\'évaluation'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;
