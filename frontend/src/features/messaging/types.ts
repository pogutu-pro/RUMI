/** Mirrors Backend/messaging/views.py responses. */
export interface ChatPerson {
  id: number;
  name: string;
  role: 'tenant' | 'caretaker' | 'landlord' | 'super_admin' | string;
  role_label: string;
  profile_picture: string | null;
}

export interface Conversation {
  id: string;
  other: ChatPerson;
  last_message_at: string | null;
  last_message_preview: string;
  unread_count: number;
}

export interface ChatMessage {
  id: string;
  sender: number;
  body: string;
  created_at: string;
}

export interface Thread {
  other: ChatPerson;
  results: ChatMessage[];
}
