-- Insert default settings
INSERT INTO settings (
  id,
  monthly_dues,
  pab_rate,
  late_fee_days,
  late_fee_amount,
  admin_email,
  organization_name,
  organization_address,
  bank_account,
  bank_name,
  account_holder,
  created_at,
  updated_at
) VALUES (
  1,
  50000,
  5000,
  7,
  10000,
  'admin@rwpay.com',
  'RW 08 Sambiroto',
  'Jl. Sambiroto No. 123, Jakarta Timur',
  '1234567890',
  'Bank Mandiri',
  'RW 08 Sambiroto',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  monthly_dues = EXCLUDED.monthly_dues,
  pab_rate = EXCLUDED.pab_rate,
  updated_at = NOW();

-- Insert default admin user
INSERT INTO users (
  id,
  email,
  password_hash,
  full_name,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@rwpay.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
  'Administrator',
  'admin',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert sample residents with RT data
INSERT INTO residents (
  id,
  name,
  rt,
  house_number,
  address,
  phone,
  email,
  status,
  created_at,
  updated_at
) VALUES 
  (gen_random_uuid(), 'Budi Santoso', '01', '001', 'Jl. Sambiroto No. 1', '081234567890', 'budi@email.com', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Siti Rahayu', '01', '002', 'Jl. Sambiroto No. 2', '081234567891', 'siti@email.com', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Ahmad Wijaya', '01', '003', 'Jl. Sambiroto No. 3', '081234567892', 'ahmad@email.com', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Dewi Lestari', '02', '004', 'Jl. Sambiroto No. 4', '081234567893', 'dewi@email.com', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Eko Prasetyo', '02', '005', 'Jl. Sambiroto No. 5', '081234567894', 'eko@email.com', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Fitri Handayani', '02', '006', 'Jl. Sambiroto No. 6', '081234567895', 'fitri@email.com', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Gunawan Setiawan', '03', '007', 'Jl. Sambiroto No. 7', '081234567896', 'gunawan@email.com', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Hesti Purwanti', '03', '008', 'Jl. Sambiroto No. 8', '081234567897', 'hesti@email.com', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Indra Kusuma', '03', '009', 'Jl. Sambiroto No. 9', '081234567898', 'indra@email.com', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Joko Widodo', '04', '010', 'Jl. Sambiroto No. 10', '081234567899', 'joko@email.com', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Kartini Sari', '04', '011', 'Jl. Sambiroto No. 11', '081234567800', 'kartini@email.com', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Lukman Hakim', '04', '012', 'Jl. Sambiroto No. 12', '081234567801', 'lukman@email.com', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Maya Sari', '05', '013', 'Jl. Sambiroto No. 13', '081234567802', 'maya@email.com', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Nugroho Adi', '05', '014', 'Jl. Sambiroto No. 14', '081234567803', 'nugroho@email.com', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Olivia Tan', '05', '015', 'Jl. Sambiroto No. 15', '081234567804', 'olivia@email.com', 'active', NOW(), NOW())
ON CONFLICT (house_number) DO NOTHING;

-- Insert sample payments for current month
DO $$
DECLARE
  resident_record RECORD;
  current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
  -- Insert LPS payments for some residents
  FOR resident_record IN 
    SELECT id, name FROM residents WHERE rt IN ('01', '02', '03') LIMIT 8
  LOOP
    INSERT INTO payments (
      id,
      resident_id,
      payment_type,
      amount,
      payment_date,
      due_date,
      status,
      payment_method,
      notes,
      invoice_number,
      invoice_date,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      resident_record.id,
      'LPS',
      50000,
      current_month || '-' || LPAD((RANDOM() * 28 + 1)::INT::TEXT, 2, '0'),
      current_month || '-10',
      'paid',
      'cash',
      'Pembayaran LPS bulan ' || TO_CHAR(NOW(), 'Month YYYY'),
      'INV-LPS-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || resident_record.id::TEXT,
      current_month || '-' || LPAD((RANDOM() * 28 + 1)::INT::TEXT, 2, '0'),
      NOW(),
      NOW()
    );
  END LOOP;

  -- Insert PAB payments for some residents
  FOR resident_record IN 
    SELECT id, name FROM residents WHERE rt IN ('02', '03', '04') LIMIT 6
  LOOP
    DECLARE
      cubic_usage DECIMAL := (RANDOM() * 20 + 5)::DECIMAL(10,2);
    BEGIN
      INSERT INTO payments (
        id,
        resident_id,
        payment_type,
        amount,
        payment_date,
        due_date,
        status,
        payment_method,
        notes,
        cubic_meters,
        rate_per_cubic,
        invoice_number,
        invoice_date,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        resident_record.id,
        'PAB',
        cubic_usage * 5000,
        current_month || '-' || LPAD((RANDOM() * 28 + 1)::INT::TEXT, 2, '0'),
        current_month || '-15',
        'paid',
        'cash',
        'Pembayaran PAB bulan ' || TO_CHAR(NOW(), 'Month YYYY') || ' - ' || cubic_usage || ' m³',
        cubic_usage,
        5000,
        'INV-PAB-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || resident_record.id::TEXT,
        current_month || '-' || LPAD((RANDOM() * 28 + 1)::INT::TEXT, 2, '0'),
        NOW(),
        NOW()
      );
    END;
  END LOOP;
END $$;

-- Insert some pending payments for demonstration
DO $$
DECLARE
  resident_record RECORD;
  current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
  FOR resident_record IN 
    SELECT id, name FROM residents WHERE rt = '05' LIMIT 3
  LOOP
    INSERT INTO payments (
      id,
      resident_id,
      payment_type,
      amount,
      payment_date,
      due_date,
      status,
      payment_method,
      notes,
      invoice_number,
      invoice_date,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      resident_record.id,
      'LPS',
      50000,
      current_month || '-' || LPAD((RANDOM() * 28 + 1)::INT::TEXT, 2, '0'),
      current_month || '-10',
      'pending',
      'cash',
      'Pembayaran LPS bulan ' || TO_CHAR(NOW(), 'Month YYYY') || ' - Menunggu konfirmasi',
      'INV-PENDING-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || resident_record.id::TEXT,
      current_month || '-' || LPAD((RANDOM() * 28 + 1)::INT::TEXT, 2, '0'),
      NOW(),
      NOW()
    );
  END LOOP;
END $$;
