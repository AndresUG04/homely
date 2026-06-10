-- Add 'finalized' to contract_status enum if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status') THEN
    ALTER TYPE contract_status ADD VALUE IF NOT EXISTS 'finalized';
  END IF;
END
$$;
