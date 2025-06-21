export type Conversation = {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  participants: { id: string; name: string }[];
  bookingId: string;
  bookingStatus?: string;
  isActive?: boolean;
  [key: string]: any;
};

declare global {
  type Conversation = {
    id: string;
    name: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    participants: { id: string; name: string }[];
    bookingId: string;
    bookingStatus?: string;
    isActive?: boolean;
    [key: string]: any;
  };
}
