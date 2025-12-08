-- Fix the notify_low_stock function FOREACH loop error
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  admin_users UUID[];
  admin_user UUID;
BEGIN
  IF NEW.current_stock <= NEW.reorder_level THEN
    SELECT ARRAY_AGG(id) INTO admin_users 
    FROM users 
    WHERE org_id = NEW.org_id AND role IN ('admin', 'supervisor');
    
    FOREACH admin_user IN ARRAY admin_users
    LOOP
      PERFORM create_notification(
        admin_user,
        'Low Stock Alert',
        'تنبيه مخزون منخفض',
        NEW.item_name_en || ' is running low. Current stock: ' || NEW.current_stock || ' ' || NEW.unit,
        NEW.item_name_ar || ' مخزون منخفض. المخزون الحالي: ' || NEW.current_stock || ' ' || NEW.unit,
        'warning',
        'low_stock',
        NEW.id,
        'inventory_item'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
