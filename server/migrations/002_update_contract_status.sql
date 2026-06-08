-- Expand contract status values to include worker_signed and finalized
ALTER TABLE contract DROP CONSTRAINT IF EXISTS contract_status_check;
ALTER TABLE contract
  ADD CONSTRAINT contract_status_check
  CHECK (status IN ('draft', 'sent', 'worker_signed', 'accepted', 'rejected', 'finalized'));

