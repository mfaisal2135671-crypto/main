export interface User {
  id: string;
  mobile_number: string;
  email?: string;
  full_name: string;
  created_at: string;
  is_verified: boolean;
}

export interface LostDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_number: string;
  holder_name: string;
  issue_date?: string;
  lost_location?: string;
  description?: string;
  created_at: string;
  status: 'active' | 'found' | 'resolved';
}

export interface FoundDocument {
  id: string;
  finder_id: string;
  document_type: string;
  document_number: string;
  holder_name: string;
  issue_date?: string;
  found_location?: string;
  description?: string;
  created_at: string;
  status: 'active' | 'matched' | 'returned';
}

export interface DocumentMatch {
  id: string;
  lost_document_id: string;
  found_document_id: string;
  similarity_score: number;
  status: 'pending' | 'verified' | 'completed';
  created_at: string;
}

export interface Communication {
  id: string;
  match_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
}