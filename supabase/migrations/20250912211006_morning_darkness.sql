/*
  # Create found documents table

  1. New Tables
    - `found_documents`
      - `id` (uuid, primary key) - unique document ID
      - `finder_id` (uuid, foreign key) - references users table (person who found)
      - `document_type` (text) - type of document (Aadhaar, PAN, etc.)
      - `document_number` (text) - document number/ID
      - `holder_name` (text) - name on the document
      - `issue_date` (date, nullable) - document issue date
      - `found_location` (text, nullable) - where it was found
      - `description` (text, nullable) - additional description
      - `status` (text) - active, matched, returned
      - `created_at` (timestamp) - when uploaded

  2. Security
    - Enable RLS on `found_documents` table
    - Add policies for users to manage documents they found
    - Add policy for others to read active found documents for matching
*/

CREATE TABLE IF NOT EXISTS found_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finder_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_number text NOT NULL,
  holder_name text NOT NULL,
  issue_date date,
  found_location text,
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'matched', 'returned')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE found_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage documents they found"
  ON found_documents
  FOR ALL
  TO authenticated
  USING (auth.uid() = finder_id);

CREATE POLICY "Anyone can read active found documents for matching"
  ON found_documents
  FOR SELECT
  TO authenticated
  USING (status = 'active');