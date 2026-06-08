-- Create contract table
CREATE TABLE IF NOT EXISTS contract (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  salary NUMERIC(15, 2),
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  employer_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  employee_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  employer_contract_url TEXT,
  employee_contract_url TEXT,
  sent_at TIMESTAMP,
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_contract_employer_user_id ON contract(employer_user_id);
CREATE INDEX IF NOT EXISTS idx_contract_employee_user_id ON contract(employee_user_id);
CREATE INDEX IF NOT EXISTS idx_contract_status ON contract(status);
CREATE INDEX IF NOT EXISTS idx_contract_created_at ON contract(created_at DESC);


