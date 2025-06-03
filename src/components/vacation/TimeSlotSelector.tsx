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
    const newSlot: TimeSlot = {
      id: crypto.randomUUID(),
      vacation_id: '', // Will be set when saving the vacation
      type: newSlotType,
      start_time: newSlotType === 'custom' ? newStartTime : undefined,
      end_time: newSlotType === 'custom' ? newEndTime : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onChange([...timeSlots, newSlot]);
    setNewStartTime('');
    setNewEndTime('');
  };

  const removeTimeSlot = (id: string) => {
    onChange(timeSlots.filter(slot => slot.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {timeSlots.map((slot) => (
          <Card key={slot.id} className="p-3 flex items-center gap-2">
            <span className="font-medium">
              {slot.type === 'morning' && 'Matin'}
              {slot.type === 'afternoon' && 'Après-midi'}
              {slot.type === 'custom' && `${slot.start_time} - ${slot.end_time}`}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeTimeSlot(slot.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-4 p-4 border rounded-lg">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label>Type de créneau</Label>
            <Select
              value={newSlotType}
              onValueChange={(value: TimeSlotType) => setNewSlotType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Matin</SelectItem>
                <SelectItem value="afternoon">Après-midi</SelectItem>
                <SelectItem value="custom">Créneau personnalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newSlotType === 'custom' && (
            <>
              <div className="flex-1">
                <Label>Heure de début</Label>
                <Input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label>Heure de fin</Label>
                <Input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <Button
          onClick={addTimeSlot}
          disabled={newSlotType === 'custom' && (!newStartTime || !newEndTime)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un créneau
        </Button>
      </div>
    </div>
  );
};

export default TimeSlotSelector; 