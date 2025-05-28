
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { categories } from '@/constants/documentConstants';

interface DocumentUploadAreaProps {
  bookingId?: string;
  onUploadSuccess: () => void;
}

const DocumentUploadArea = ({ bookingId, onUploadSuccess }: DocumentUploadAreaProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const documentData = {
        user_id: user.id,
        booking_id: bookingId || null,
        name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        category: selectedCategory,
        status: 'pending'
      };

      const { error: dbError } = await supabase
        .from('documents')
        .insert(documentData);

      if (dbError) throw dbError;

      toast({
        title: "Document téléchargé",
        description: "Le document a été téléchargé avec succès et est en attente de validation",
      });

      onUploadSuccess();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      
      // Clean up file if database insert failed
      if (error.message?.includes('insert')) {
        const fileName = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
        const filePath = `documents/${fileName}`;
        await supabase.storage.from('documents').remove([filePath]);
      }

      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <div className="space-y-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex items-center justify-center">
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-600">
                {uploading ? 'Téléchargement en cours...' : 'Cliquer pour ajouter un document'}
              </span>
            </div>
            <Input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadArea;
