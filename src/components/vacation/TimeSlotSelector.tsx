
import { useState } from 'react';
import { TimeSlot, TimeSlotType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface TimeSlotSelectorProps {
  timeSlots: TimeSlot[];
  onChange: (timeSlots: TimeSlot[]) => void;
}

const TimeSlotSelector = ({ timeSlots, onChange }: TimeSlotSelectorProps) => {
  const [newSlotType, setNewSlotType] = useState<TimeSlotType>('morning');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  const addTimeSlot = () => {
    // Validate custom time slots
    if (newSlotType === 'custom') {
      if (!newStartTime || !newEndTime) {
        alert('Veuillez remplir les heures de début et de fin');
        return;
      }
      if (newStartTime >= newEndTime) {
        alert('L\'heure de fin doit être postérieure à l\'heure de début');
        return;
      }
    }

    // Check for duplicates
    const isDuplicate = timeSlots.some(slot => {
      if (slot.type !== newSlotType) return false;
      if (newSlotType === 'custom') {
        return slot.start_time === newStartTime && slot.end_time === newEndTime;
      }
      return true; // Same type for morning/afternoon
    });

    if (isDuplicate) {
      alert('Ce créneau existe déjà');
      return;
    }

    const newSlot: TimeSlot = {
      id: crypto.randomUUID(),
      vacation_id: '', // Will be set when saving the vacation
      type: newSlotType,
      start_time: newSlotType === 'custom' ? newStartTime : null,
      end_time: newSlotType === 'custom' ? newEndTime : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Adding time slot:', newSlot);
    const updatedSlots = [...timeSlots, newSlot];
    onChange(updatedSlots);
    
    // Reset form
    setNewStartTime('');
    setNewEndTime('');
    setNewSlotType('morning');
  };

  const removeTimeSlot = (id: string) => {
    const updatedSlots = timeSlots.filter(slot => slot.id !== id);
    onChange(updatedSlots);
  };

  const getSlotDisplayText = (slot: TimeSlot): string => {
    switch (slot.type) {
      case 'morning':
        return 'Matin (8h-12h)';
      case 'afternoon':
        return 'Après-midi (14h-18h)';
      case 'custom':
        return `${slot.start_time} - ${slot.end_time}`;
      default:
        return 'Créneau inconnu';
    }
  };

  const getSlotHours = (slot: TimeSlot): number => {
    if (slot.type === 'morning' || slot.type === 'afternoon') {
      return 4;
    }
    if (slot.type === 'custom' && slot.start_time && slot.end_time) {
      const start = new Date(`2000-01-01T${slot.start_time}`);
      const end = new Date(`2000-01-01T${slot.end_time}`);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }
    return 0;
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Créneaux horaires disponibles</Label>
        <p className="text-xs text-gray-500 mb-3">
          Définissez les créneaux pendant lesquels vous serez disponible pour cette vacation
        </p>
      </div>

      {/* Affichage des créneaux existants */}
      <div className="space-y-2">
        {timeSlots.length === 0 ? (
          <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <p>Aucun créneau défini</p>
            <p className="text-xs">Ajoutez au moins un créneau pour que les établissements puissent vous réserver</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {timeSlots.map((slot) => (
              <Card key={slot.id} className="p-3 flex items-center justify-between bg-blue-50 border-blue-200">
                <div>
                  <span className="font-medium text-blue-900">
                    {getSlotDisplayText(slot)}
                  </span>
                  <p className="text-xs text-blue-600">
                    {getSlotHours(slot)}h
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTimeSlot(slot.id)}
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Formulaire d'ajout de créneau */}
      <Card className="p-4 bg-gray-50">
        <h4 className="font-medium mb-3">Ajouter un créneau</h4>
        
        <div className="space-y-4">
          <div>
            <Label>Type de créneau</Label>
            <Select
              value={newSlotType}
              onValueChange={(value: TimeSlotType) => setNewSlotType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Matin (8h-12h) - 4h</SelectItem>
                <SelectItem value="afternoon">Après-midi (14h-18h) - 4h</SelectItem>
                <SelectItem value="custom">Créneau personnalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newSlotType === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Heure de début</Label>
                <Input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  min="06:00"
                  max="22:00"
                />
              </div>
              <div>
                <Label>Heure de fin</Label>
                <Input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  min="06:00"
                  max="23:00"
                />
              </div>
            </div>
          )}

          <Button
            onClick={addTimeSlot}
            disabled={newSlotType === 'custom' && (!newStartTime || !newEndTime)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter ce créneau
          </Button>
        </div>
      </Card>

      {timeSlots.length > 0 && (
        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>{timeSlots.length}</strong> créneau{timeSlots.length > 1 ? 'x' : ''} défini{timeSlots.length > 1 ? 's' : ''} 
            ({timeSlots.reduce((total, slot) => total + getSlotHours(slot), 0)}h au total)
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeSlotSelector;
