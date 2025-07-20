-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('rw_name', 'RW 08 Sambiroto', 'Nama RW'),
('rw_address', 'Kelurahan Sambiroto, Kecamatan Tembalang, Semarang', 'Alamat RW'),
('rw_phone', '024-7460123', 'Nomor telepon RW'),
('rw_email', 'rw08sambiroto@gmail.com', 'Email RW'),
('monthly_dues', '100000', 'Iuran bulanan dalam rupiah'),
('due_date', '10', 'Tanggal jatuh tempo setiap bulan'),
('late_fee', '5000', 'Denda keterlambatan dalam rupiah'),
('currency', 'IDR', 'Mata uang'),
('email_reminders', 'true', 'Aktifkan pengingat email'),
('sms_reminders', 'false', 'Aktifkan pengingat SMS'),
('reminder_days', '3', 'Hari sebelum jatuh tempo untuk pengingat'),
('overdue_reminders', 'true', 'Aktifkan pengingat tunggakan');

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (email, password_hash, name, role) VALUES
('admin@rw08.com', '$2b$10$rQZ9QmZ9QmZ9QmZ9QmZ9Qu', 'Administrator RW 08', 'super_admin');

-- Insert sample residents
INSERT INTO residents (name, house_number, address, phone, email) VALUES
('Budi Santoso', 'A-12', 'Jl. Sambiroto No. 12', '081234567890', 'budi@email.com'),
('Siti Aminah', 'B-08', 'Jl. Sambiroto No. 08', '081234567891', 'siti@email.com'),
('Ahmad Wijaya', 'C-15', 'Jl. Sambiroto No. 15', '081234567892', 'ahmad@email.com'),
('Dewi Sartika', 'A-05', 'Jl. Sambiroto No. 05', '081234567893', 'dewi@email.com'),
('Joko Susilo', 'B-12', 'Jl. Sambiroto No. 12', '081234567894', 'joko@email.com'),
('Maria Gonzales', 'C-08', 'Jl. Sambiroto No. 08', '081234567895', 'maria@email.com'),
('Rudi Hartono', 'A-18', 'Jl. Sambiroto No. 18', '081234567896', 'rudi@email.com');
