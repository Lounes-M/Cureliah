import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  getPendingValidations,
  updateValidationRequest,
  ValidationRequest
} from '@/services/validationService';
import { Loader2, Check, X } from 'lucide-react';
import { format } from 'date-fns';

export const ValidationDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [validations, setValidations] = useState<ValidationRequest[]>([]);
  const [selectedValidation, setSelectedValidation] = useState<ValidationRequest | null>(null);
  const [comments, setComments] = useState('');

  useEffect(() => {
    fetchValidations();
  }, []);

  const fetchValidations = async () => {
    try {
      setLoading(true);
      const data = await getPendingValidations();
      setValidations(data);
    } catch (error) {
      console.error('Error fetching validations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load validation requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (status: 'approved' | 'rejected') => {
    if (!selectedValidation || !user) return;

    try {
      await updateValidationRequest(selectedValidation.id, {
        status,
        reviewer_id: user.id,
        comments
      });

      toast({
        title: 'Success',
        description: `Document ${status} successfully`,
      });

      setSelectedValidation(null);
      setComments('');
      fetchValidations();
    } catch (error) {
      console.error('Error updating validation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update validation',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Document Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Validation Requests List */}
            <div className="space-y-4">
              <h3 className="font-medium">Pending Validations</h3>
              {validations.map((validation) => (
                <Card
                  key={validation.id}
                  className={`cursor-pointer transition-colors ${
                    selectedValidation?.id === validation.id
                      ? 'border-primary'
                      : 'hover:border-muted-foreground'
                  }`}
                  onClick={() => setSelectedValidation(validation)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {validation.user.first_name} {validation.user.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {validation.user.email}
                          </p>
                        </div>
                        <Badge variant="outline">{validation.type}</Badge>
                      </div>
                      <p className="text-sm">
                        Submitted on {format(new Date(validation.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Validation Details */}
            {selectedValidation ? (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Document Details</h3>
                      <div className="space-y-2">
                        <p>
                          <span className="font-medium">Type:</span>{' '}
                          {selectedValidation.document?.type}
                        </p>
                        <p>
                          <span className="font-medium">Name:</span>{' '}
                          {selectedValidation.document?.name}
                        </p>
                        <p>
                          <span className="font-medium">Uploaded:</span>{' '}
                          {format(
                            new Date(selectedValidation.document?.created_at || ''),
                            'MMM d, yyyy'
                          )}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Comments</h3>
                      <Textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Add your comments here..."
                        className="h-32"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleValidation('approved')}
                        className="flex-1"
                        variant="default"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleValidation('rejected')}
                        className="flex-1"
                        variant="destructive"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a validation request to review
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 