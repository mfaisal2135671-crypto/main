/*
  # Create lost documents table

  1. New Tables
    - `lost_documents`
      - `id` (uuid, primary key) - unique document ID
      - `user_id` (uuid, foreign key) - references users table
      - `document_type` (text) - type of document (Aadhaar, PAN, etc.)
      - `document_number` (text) - document number/ID
      - `holder_name` (text) - name on the document
      - `issue_date` (date, nullable) - document issue date
      - `lost_location` (text, nullable) - where it was lost
      - `description` (text, nullable) - additional description
      - `status` (text) - active, found, resolved
      - `created_at` (timestamp) - when reported

  2. Security
    - Enable RLS on `lost_documents` table
    - Add policies for users to manage their own lost documents
    - Add policy for others to read active lost documents for matching
*/

CREATE TABLE IF NOT EXISTS lost_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_number text NOT NULL,
  holder_name text NOT NULL,
  issue_date date,
  lost_location text,
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'found', 'resolved')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lost_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own lost documents"
  ON lost_documents
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read active lost documents for matching"
  ON lost_documents
  FOR SELECT
  TO authenticated
  USING (status = 'active');