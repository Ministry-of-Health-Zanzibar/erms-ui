export interface ConversationMessage {
  conversation_id: number;
  user_id?: number | string | null;
  sender_id?: number | string | null;
  sender_full_name?: string | null;
  receiver_id?: number | string | null;
  receiver_full_name?: string | null;
  message: string;
  date?: string | null;
  parent_id?: number | null;
  delivered?: boolean;
  read_by_recipient?: boolean;
}

export interface ConversationRecord extends ConversationMessage {
  patient_name?: string | null;
  file_number?: string | null;
  diagnosis?: string | null;
  replies?: ConversationMessage[];
}

export interface ConversationTab {
  key: string;
  recipientId: number | string | null;
  recipientName: string;
  messages: ConversationMessage[];
}
