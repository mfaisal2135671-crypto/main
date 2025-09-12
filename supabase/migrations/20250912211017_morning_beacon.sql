/*
  # Create communications table

  1. New Tables
    - `communications`
      - `id` (uuid, primary key) - unique message ID
      - `match_id` (uuid, foreign key) - references document_matches
      - `sender_id` (uuid, foreign key) - references users (message sender)
      - `receiver_id` (uuid, foreign key) - references users (message receiver)
      - `message` (text) - message content
      - `created_at` (timestamp) - when message was sent

  2. Security
    - Enable RLS on `communications` table
    - Add policies for users to see and send messages in their matches
*/

CREATE TABLE IF NOT EXISTS communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES document_matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages in their matches"
  ON communications
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages in their matches"
  ON communications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM document_matches dm
      WHERE dm.id = match_id AND dm.status = 'verified' AND
      (
        EXISTS (
          SELECT 1 FROM lost_documents ld 
          WHERE ld.id = dm.lost_document_id AND ld.user_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM found_documents fd 
          WHERE fd.id = dm.found_document_id AND fd.finder_id = auth.uid()
        )
      )
    )
  );