import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Languages, Award, Mail, Phone, Calendar, Clock } from 'lucide-react';
import { VacationWithDoctor } from '@/hooks/useEstablishmentSearch';

interface DoctorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: VacationWithDoctor['doctor'];
}

export const DoctorProfileModal = ({ isOpen, onClose, doctor }: DoctorProfileModalProps) => {
  if (!doctor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profil du Docteur</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-24 w-24 border-2 border-medical-blue">
              <AvatarImage src={doctor.avatar_url} />
              <AvatarFallback className="text-lg">
                {doctor.first_name[0]}{doctor.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-2xl font-semibold">
                {doctor.first_name} {doctor.last_name}
              </h3>
              {doctor.experience_years && (
                <p className="text-sm text-gray-600 mt-1">
                  {doctor.experience_years} années d'expérience
                </p>
              )}
            </div>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {doctor.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{doctor.email}</span>
                  </div>
                )}
                {doctor.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{doctor.phone}</span>
                  </div>
                )}
              </div>

              {doctor.bio && (
                <div>
                  <h4 className="font-medium mb-2">Biographie</h4>
                  <p className="text-sm text-gray-600">{doctor.bio}</p>
                </div>
              )}

              {doctor.education && doctor.education.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Formation
                  </h4>
                  <div className="space-y-3">
                    {doctor.education.map((edu, index) => (
                      <div key={index} className="text-sm text-gray-600 pl-6 border-l-2 border-gray-200">
                        <div className="font-medium">{edu.degree}</div>
                        <div>{edu.institution}</div>
                        <div className="text-gray-500">{edu.year}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {doctor.languages && doctor.languages.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <Languages className="w-4 h-4 mr-2" />
                    Langues
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {doctor.languages.map((lang, index) => (
                      <Badge key={index} variant="secondary">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {doctor.license_number && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    Numéro de licence
                  </h4>
                  <p className="text-sm text-gray-600">{doctor.license_number}</p>
                </div>
              )}

              <div className="text-xs text-gray-500 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3 h-3" />
                  <span>Membre depuis {new Date(doctor.created_at || '').toLocaleDateString('fr-FR')}</span>
                </div>
                {doctor.updated_at && (
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>Dernière mise à jour le {new Date(doctor.updated_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 