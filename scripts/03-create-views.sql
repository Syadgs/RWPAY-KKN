-- Create useful views for reporting

-- View for payment summary by resident
CREATE VIEW resident_payment_summary AS
SELECT 
    r.id,
    r.name,
    r.house_number,
    r.phone,
    r.email,
    r.status,
    COUNT(p.id) as total_payments,
    SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END) as total_paid,
    SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as total_pending,
    SUM(CASE WHEN p.status = 'overdue' THEN p.amount ELSE 0 END) as total_overdue,
    MAX(p.payment_date) as last_payment_date
FROM residents r
LEFT JOIN payments p ON r.id = p.resident_id
GROUP BY r.id, r.name, r.house_number, r.phone, r.email, r.status;

-- View for monthly payment statistics
CREATE VIEW monthly_payment_stats AS
SELECT 
    DATE_TRUNC('month', payment_date) as month,
    COUNT(*) as total_payments,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
    SUM(amount) as total_amount,
    SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
    SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as overdue_amount
FROM payments
GROUP BY DATE_TRUNC('month', payment_date)
ORDER BY month DESC;

-- View for current month dashboard stats
CREATE VIEW current_month_stats AS
SELECT 
    (SELECT COUNT(*) FROM residents WHERE status = 'active') as total_residents,
    (SELECT COUNT(*) FROM payments WHERE DATE_TRUNC('month', payment_date) = DATE_TRUNC('month', CURRENT_DATE) AND status = 'paid') as paid_this_month,
    (SELECT COUNT(*) FROM payments WHERE DATE_TRUNC('month', due_date) = DATE_TRUNC('month', CURRENT_DATE) AND status IN ('pending', 'overdue')) as unpaid_this_month,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE DATE_TRUNC('month', payment_date) = DATE_TRUNC('month', CURRENT_DATE) AND status = 'paid') as total_income_this_month,
    (SELECT COALESCE(value::numeric, 100000) FROM settings WHERE key = 'monthly_dues') * (SELECT COUNT(*) FROM residents WHERE status = 'active') as target_monthly_income;
