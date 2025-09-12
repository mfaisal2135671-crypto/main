/*
  # Create document matches table

  1. New Tables
    - `document_matches`
      - `id` (uuid, primary key) - unique match ID
      - `lost_document_id` (uuid, foreign key) - references lost_documents
      - `found_document_id` (uuid, foreign key) - references found_documents
      - `similarity_score` (integer) - matching score percentage
      - `status` (text) - pending, verified, completed
      - `created_at` (timestamp) - when match was created

  2. Security
    - Enable RLS on `document_matches` table
    - Add policies for involved users to see their matches
*/

CREATE TABLE IF NOT EXISTS document_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_document_id uuid NOT NULL REFERENCES lost_documents(id) ON DELETE CASCADE,
  found_document_id uuid NOT NULL REFERENCES found_documents(id) ON DELETE CASCADE,
  similarity_score integer NOT NULL DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'completed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(lost_document_id, found_document_id)
);

ALTER TABLE document_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see matches for their documents"
  ON document_matches
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lost_documents ld 
      WHERE ld.id = lost_document_id AND ld.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM found_documents fd 
      WHERE fd.id = found_document_id AND fd.finder_id = auth.uid()
    )
  );

CREATE POLICY "Users can update matches for their documents"
  ON document_matches
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lost_documents ld 
      WHERE ld.id = lost_document_id AND ld.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM found_documents fd 
      WHERE fd.id = found_document_id AND fd.finder_id = auth.uid()
    )
  );