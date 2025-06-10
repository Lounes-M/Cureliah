import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ConversationParticipant {
  id: string;
  name: string;
}

export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  participants: ConversationParticipant[];
  bookingId: string;
  bookingStatus: string; // Nouveau: statut de la réservation
  isActive: boolean; // Nouveau: indique si la conversation est active
}

export function useConversations() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 [useConversations] Fetching conversations for user:', {
        userId: user.id,
        userType: profile?.user_type,
        email: user.email
      });

      setLoading(true);

      // UTILISER LA MÊME LOGIQUE QUE L'ESTABLISHMENT DASHBOARD QUI FONCTIONNE
      let bookingsQuery;
      
      if (profile?.user_type === 'doctor') {
        // Si l'utilisateur est médecin, chercher les bookings où il est le doctor
        console.log('👨‍⚕️ [useConversations] User is doctor, looking for bookings with doctor_id');
        bookingsQuery = supabase
          .from('bookings')
          .select(`
            id,
            doctor_id,
            establishment_id,
            created_at,
            status,
            vacation_posts!inner(
              title,
              location
            )
          `)
          .eq('doctor_id', user.id);
      } else if (profile?.user_type === 'establishment') {
        // Si l'utilisateur est établissement, chercher les bookings où il est l'establishment
        console.log('🏢 [useConversations] User is establishment, looking for bookings with establishment_id');
        bookingsQuery = supabase
          .from('bookings')
          .select(`
            id,
            doctor_id,
            establishment_id,
            created_at,
            status,
            vacation_posts!inner(
              title,
              location
            )
          `)
          .eq('establishment_id', user.id);
      } else {
        // Type d'utilisateur non reconnu
        console.warn('⚠️ [useConversations] Unknown user type:', profile?.user_type);
        setConversations([]);
        return;
      }

      // Récupérer TOUTES les conversations, peu importe le statut
      bookingsQuery = bookingsQuery.order('created_at', { ascending: false });

      const { data: bookings, error: bookingsError } = await bookingsQuery;

      if (bookingsError) {
        console.error('❌ [useConversations] Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      console.log('📋 [useConversations] Bookings found:', bookings?.length || 0);

      if (!bookings || bookings.length === 0) {
        console.log('ℹ️ [useConversations] No bookings found - user has no conversations');
        setConversations([]);
        return;
      }

      // ÉTAPE 2: Traiter chaque réservation pour créer les conversations
      const conversationsData = await Promise.all(
        bookings.map(async (booking: any) => {
          try {
            console.log(`🔍 [useConversations] Processing booking: ${booking.id} (status: ${booking.status})`);
            
            const isDoctor = profile?.user_type === 'doctor';
            const otherUserId = isDoctor ? booking.establishment_id : booking.doctor_id;

            // Déterminer si la conversation est active basé sur le statut de la réservation
            const activeStatuses = ['pending', 'confirmed', 'active'];
            const isActive = activeStatuses.includes(booking.status);

            console.log(`👤 [useConversations] User is ${isDoctor ? 'doctor' : 'establishment'}, other user: ${otherUserId}, active: ${isActive}`);

            // ÉTAPE 2.1: Récupérer les informations de la vacation
            let vacationInfo = { title: 'Vacation', location: null };
            
            if (booking.vacation_posts) {
              vacationInfo = {
                title: booking.vacation_posts.title || 'Vacation',
                location: booking.vacation_posts.location
              };
              console.log(`✅ [useConversations] Vacation found: ${booking.vacation_posts.title}`);
            } else {
              console.warn(`⚠️ [useConversations] No vacation info found for booking: ${booking.id}`);
            }

            // ÉTAPE 2.2: Récupérer le profil de l'autre utilisateur
            let otherUserName = 'Utilisateur';
            
            try {
              if (isDoctor) {
                // L'utilisateur actuel est médecin, récupérer le profil de l'établissement
                console.log(`🏢 [useConversations] Fetching establishment profile for: ${otherUserId}`);
                
                const { data: establishmentProfile, error: estError } = await supabase
                  .from('establishment_profiles')
                  .select('name, contact_person')
                  .eq('id', otherUserId)
                  .single();

                if (establishmentProfile?.name) {
                  otherUserName = establishmentProfile.name;
                  console.log(`✅ [useConversations] Establishment name: ${otherUserName}`);
                } else {
                  console.warn(`⚠️ [useConversations] No establishment profile found`, estError);
                }
              } else {
                // L'utilisateur actuel est établissement, récupérer le profil du médecin
                console.log(`👨‍⚕️ [useConversations] Fetching doctor profile for: ${otherUserId}`);
                
                const { data: doctorProfile, error: docError } = await supabase
                  .from('doctor_profiles')
                  .select('first_name, last_name, speciality')
                  .eq('id', otherUserId)
                  .single();

                if (doctorProfile) {
                  const firstName = doctorProfile.first_name || '';
                  const lastName = doctorProfile.last_name || '';
                  otherUserName = `Dr ${firstName} ${lastName}`.trim();
                  if (otherUserName === 'Dr') {
                    otherUserName = `Dr ${doctorProfile.speciality || 'Médecin'}`;
                  }
                  console.log(`✅ [useConversations] Doctor name: ${otherUserName}`);
                } else {
                  console.warn(`⚠️ [useConversations] No doctor profile found`, docError);
                }
              }

              // Fallback: essayer la table profiles générale
              if (otherUserName === 'Utilisateur') {
                console.log(`🔄 [useConversations] Trying general profiles table for: ${otherUserId}`);
                
                const { data: generalProfile, error: genError } = await supabase
                  .from('profiles')
                  .select('first_name, last_name, email')
                  .eq('id', otherUserId)
                  .single();

                if (generalProfile) {
                  const firstName = generalProfile.first_name || '';
                  const lastName = generalProfile.last_name || '';
                  otherUserName = `${firstName} ${lastName}`.trim() || 
                                generalProfile.email?.split('@')[0] || 
                                'Utilisateur';
                  console.log(`✅ [useConversations] General profile name: ${otherUserName}`);
                } else {
                  console.warn(`⚠️ [useConversations] No general profile found`, genError);
                }
              }
            } catch (profileError) {
              console.error(`❌ [useConversations] Error fetching profile for ${otherUserId}:`, profileError);
            }

            // ÉTAPE 2.3: Récupérer le dernier message de cette conversation
            console.log(`💬 [useConversations] Fetching last message for booking: ${booking.id}`);
            
            const { data: lastMessage, error: messageError } = await supabase
              .from('messages')
              .select('content, created_at, sender_id')
              .eq('booking_id', booking.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            let lastMessageText = 'Aucun message';
            let lastMessageTime = booking.created_at;

            if (lastMessage) {
              const isFromCurrentUser = lastMessage.sender_id === user.id;
              lastMessageText = isFromCurrentUser 
                ? `Vous: ${lastMessage.content}`
                : lastMessage.content;
              lastMessageTime = lastMessage.created_at;
              console.log(`💬 [useConversations] Last message found: "${lastMessageText.substring(0, 30)}..."`);
            } else if (messageError) {
              console.warn(`⚠️ [useConversations] Error fetching last message:`, messageError);
            } else {
              console.log(`ℹ️ [useConversations] No messages found for booking: ${booking.id}`);
            }

            // ÉTAPE 2.4: Compter les messages non lus (seulement pour les conversations actives)
            let unreadCount = 0;
            if (isActive) {
              const { count, error: countError } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('booking_id', booking.id)
                .eq('receiver_id', user.id)
                .is('read_at', null);

              if (countError) {
                console.warn(`⚠️ [useConversations] Error counting unread messages:`, countError);
              } else {
                unreadCount = count || 0;
              }
            }

            // ÉTAPE 2.5: Créer l'objet conversation avec le statut
            const conversationName = `${vacationInfo.title} - ${otherUserName}`;
            
            const conversation: Conversation = {
              id: booking.id,
              name: conversationName,
              lastMessage: lastMessageText,
              lastMessageTime: lastMessageTime,
              unreadCount: unreadCount,
              participants: [{
                id: otherUserId,
                name: otherUserName
              }],
              bookingId: booking.id,
              bookingStatus: booking.status, // Nouveau: stocker le statut
              isActive: isActive // Nouveau: indiquer si actif
            };

            console.log(`✅ [useConversations] Created conversation: "${conversationName}" (status: ${booking.status}, active: ${isActive}, ${conversation.unreadCount} unread)`);
            
            return conversation;
          } catch (error) {
            console.error(`❌ [useConversations] Error processing booking ${booking.id}:`, error);
            // Retourner une conversation de fallback plutôt que null
            return {
              id: booking.id,
              name: `Conversation ${booking.id.substring(0, 8)}`,
              lastMessage: 'Erreur lors du chargement',
              lastMessageTime: booking.created_at,
              unreadCount: 0,
              participants: [{
                id: booking.doctor_id === user.id ? booking.establishment_id : booking.doctor_id,
                name: 'Utilisateur'
              }],
              bookingId: booking.id,
              bookingStatus: 'unknown',
              isActive: false
            };
          }
        })
      );

      // Filtrer les conversations valides et les trier: actives d'abord, puis par dernière activité
      const validConversations = conversationsData
        .filter(conv => conv !== null)
        .sort((a, b) => {
          // D'abord trier par statut (actives en premier)
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          
          // Ensuite par dernière activité
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });

      console.log(`✅ [useConversations] Successfully loaded ${validConversations.length} conversations (${validConversations.filter(c => c.isActive).length} active, ${validConversations.filter(c => !c.isActive).length} archived)`);
      setConversations(validConversations);

    } catch (error: any) {
      console.error('💥 [useConversations] Fatal error loading conversations:', error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les conversations: ${error.message || 'Erreur inconnue'}`,
        variant: "destructive"
      });
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    console.log('🔄 [useConversations] Manual refetch requested');
    fetchConversations();
  };

  // Nouveau: fonction utilitaire pour obtenir le label du statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'active': return 'En cours';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  // Nouveau: fonction utilitaire pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'confirmed': return 'text-green-600 bg-green-50';
      case 'active': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-gray-600 bg-gray-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return {
    conversations,
    loading,
    refetch,
    // Nouveau: fonctions utilitaires exportées
    getStatusLabel,
    getStatusColor
  };
}