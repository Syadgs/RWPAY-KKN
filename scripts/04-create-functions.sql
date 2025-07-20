-- Create stored procedures for common operations

-- Function to create monthly payments for all active residents
CREATE OR REPLACE FUNCTION create_monthly_payments(target_month DATE)
RETURNS INTEGER AS $$
DECLARE
    resident_record RECORD;
    monthly_dues DECIMAL(15,2);
    due_day INTEGER;
    payment_due_date DATE;
    inserted_count INTEGER := 0;
BEGIN
    -- Get monthly dues and due date from settings
    SELECT value::numeric INTO monthly_dues FROM settings WHERE key = 'monthly_dues';
    SELECT value::integer INTO due_day FROM settings WHERE key = 'due_date';
    
    -- Calculate due date for the target month
    payment_due_date := DATE_TRUNC('month', target_month) + INTERVAL '1 month' - INTERVAL '1 day';
    payment_due_date := DATE_TRUNC('month', payment_due_date) + (due_day - 1) * INTERVAL '1 day';
    
    -- Create payments for all active residents
    FOR resident_record IN 
        SELECT id FROM residents WHERE status = 'active'
    LOOP
        -- Check if payment already exists for this month
        IF NOT EXISTS (
            SELECT 1 FROM payments 
            WHERE resident_id = resident_record.id 
            AND DATE_TRUNC('month', due_date) = DATE_TRUNC('month', target_month)
        ) THEN
            INSERT INTO payments (resident_id, amount, payment_date, due_date, status)
            VALUES (resident_record.id, monthly_dues, target_month, payment_due_date, 'pending');
            inserted_count := inserted_count + 1;
        END IF;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update overdue payments
CREATE OR REPLACE FUNCTION update_overdue_payments()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE payments 
    SET status = 'overdue' 
    WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get payment statistics
CREATE OR REPLACE FUNCTION get_payment_statistics(start_date DATE, end_date DATE)
RETURNS TABLE(
    total_payments BIGINT,
    paid_payments BIGINT,
    pending_payments BIGINT,
    overdue_payments BIGINT,
    total_amount DECIMAL(15,2),
    paid_amount DECIMAL(15,2),
    pending_amount DECIMAL(15,2),
    overdue_amount DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN p.status = 'paid' THEN 1 END) as paid_payments,
        COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN p.status = 'overdue' THEN 1 END) as overdue_payments,
        COALESCE(SUM(p.amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN p.status = 'overdue' THEN p.amount ELSE 0 END), 0) as overdue_amount
    FROM payments p
    WHERE p.due_date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;
