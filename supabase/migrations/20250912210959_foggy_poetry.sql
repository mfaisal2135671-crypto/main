/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - linked to auth.users
      - `mobile_number` (text, unique) - user's mobile number for login
      - `full_name` (text) - user's full name
      - `email` (text, nullable) - user's email for communication
      - `is_verified` (boolean) - email verification status
      - `verification_code` (text, nullable) - temporary verification code
      - `verification_expires` (timestamp, nullable) - verification code expiry
      - `created_at` (timestamp) - account creation time

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read/update their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mobile_number text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text,
  is_verified boolean DEFAULT false,
  verification_code text,
  verification_expires timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);