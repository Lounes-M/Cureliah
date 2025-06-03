import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BookingManagement from '@/components/BookingManagement';
import EstablishmentBookingManagement from '@/components/EstablishmentBookingManagement';
import Header from '@/components/Header';

const MyBookings = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Mes Réservations</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="active">Actives</TabsTrigger>
                <TabsTrigger value="pending">En attente</TabsTrigger>
                <TabsTrigger value="completed">Terminées</TabsTrigger>
                <TabsTrigger value="cancelled">Annulées</TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="mt-6">
                {profile.user_type === 'doctor' ? (
                  <BookingManagement status="booked" />
                ) : (
                  <EstablishmentBookingManagement status="booked" />
                )}
              </TabsContent>
              <TabsContent value="pending" className="mt-6">
                {profile.user_type === 'doctor' ? (
                  <BookingManagement status="pending" />
                ) : (
                  <EstablishmentBookingManagement status="pending" />
                )}
              </TabsContent>
              <TabsContent value="completed" className="mt-6">
                {profile.user_type === 'doctor' ? (
                  <BookingManagement status="completed" />
                ) : (
                  <EstablishmentBookingManagement status="completed" />
                )}
              </TabsContent>
              <TabsContent value="cancelled" className="mt-6">
                {profile.user_type === 'doctor' ? (
                  <BookingManagement status="cancelled" />
                ) : (
                  <EstablishmentBookingManagement status="cancelled" />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyBookings;
