
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { EventForm, CalendarEvent } from '@/types/calendar';
import { eventTypes } from '@/utils/calendarUtils';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventForm: EventForm;
  setEventForm: (form: EventForm) => void;
  editingEvent: CalendarEvent | null;
  onSave: () => void;
  onReset: () => void;
  readonly?: boolean;
}

const EventDialog = ({
  open,
  onOpenChange,
  eventForm,
  setEventForm,
  editingEvent,
  onSave,
  onReset,
  readonly = false
}: EventDialogProps) => {
  if (readonly) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" onClick={onReset}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvel événement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingEvent ? 'Modifier l\'événement' : 'Créer un événement'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Titre de l'événement"
            value={eventForm.title}
            onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
          />
          
          <Textarea
            placeholder="Description (optionnel)"
            value={eventForm.description}
            onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
            rows={3}
          />

          <Select
            value={eventForm.event_type}
            onValueChange={(value) => setEventForm({ ...eventForm, event_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type d'événement" />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${type.color}`} />
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">Début</label>
              <Input
                type="datetime-local"
                value={eventForm.start_time}
                onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fin</label>
              <Input
                type="datetime-local"
                value={eventForm.end_time}
                onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={onSave} className="flex-1">
              {editingEvent ? 'Modifier' : 'Créer'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDialog;
