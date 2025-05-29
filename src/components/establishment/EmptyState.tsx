
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';

export const EmptyState = () => {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucune vacation trouvée
        </h3>
        <p className="text-gray-600">
          Essayez de modifier vos critères de recherche
        </p>
      </CardContent>
    </Card>
  );
};
