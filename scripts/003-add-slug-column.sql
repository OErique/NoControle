-- Migration: Add slug column to plans table
-- Run this if you already have the database created

ALTER TABLE plans ADD COLUMN IF NOT EXISTS slug VARCHAR(50);

-- Update existing plans with slugs
UPDATE plans SET slug = 'essencial' WHERE name = 'Essencial';
UPDATE plans SET slug = 'completo' WHERE name = 'Completo';
UPDATE plans SET slug = 'total' WHERE name = 'Total';

-- Add unique constraint
ALTER TABLE plans ADD CONSTRAINT plans_slug_unique UNIQUE (slug);
