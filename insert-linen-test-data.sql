-- Insert test linen items data
INSERT INTO linen_items (org_id, linen_type, size, color, item_name_en, item_name_ar, total_stock, clean_stock, soiled_stock, in_laundry, damaged_stock, par_level, unit_cost, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Bedding', 'King', 'White', 'Bed Sheet - King', 'ملاءة سرير - كينج', 75, 50, 15, 10, 0, 60, 25.00, true),
  ('00000000-0000-0000-0000-000000000001', 'Bedding', 'Queen', 'White', 'Bed Sheet - Queen', 'ملاءة سرير - كوين', 73, 45, 20, 8, 0, 55, 22.00, true),
  ('00000000-0000-0000-0000-000000000001', 'Bedding', 'Standard', 'White', 'Pillow Case', 'كيس وسادة', 175, 120, 30, 25, 0, 150, 5.00, true),
  ('00000000-0000-0000-0000-000000000001', 'Towels', 'Large', 'White', 'Bath Towel', 'منشفة حمام', 135, 80, 40, 15, 0, 100, 12.00, true),
  ('00000000-0000-0000-0000-000000000001', 'Towels', 'Medium', 'White', 'Hand Towel', 'منشفة يد', 155, 100, 35, 20, 0, 120, 8.00, true),
  ('00000000-0000-0000-0000-000000000001', 'Towels', 'Small', 'White', 'Face Towel', 'منشفة وجه', 225, 150, 45, 30, 0, 180, 5.00, true),
  ('00000000-0000-0000-0000-000000000001', 'Towels', 'Standard', 'White', 'Bath Mat', 'سجادة حمام', 90, 60, 20, 10, 0, 70, 15.00, true),
  ('00000000-0000-0000-0000-000000000001', 'Bedding', 'King', 'White', 'Duvet Cover - King', 'غطاء لحاف - كينج', 45, 30, 10, 5, 0, 35, 35.00, true),
  ('00000000-0000-0000-0000-000000000001', 'Bedding', 'Queen', 'White', 'Duvet Cover - Queen', 'غطاء لحاف - كوين', 53, 35, 12, 6, 0, 40, 32.00, true),
  ('00000000-0000-0000-0000-000000000001', 'Bedding', 'Standard', 'Beige', 'Blanket', 'بطانية', 52, 40, 8, 4, 0, 45, 28.00, true),
  ('00000000-0000-0000-0000-000000000001', 'Dining', 'Large', 'White', 'Table Cloth', 'مفرش طاولة', 40, 25, 10, 5, 0, 30, 18.00, true),
  ('00000000-0000-0000-0000-000000000001', 'Dining', 'Small', 'White', 'Napkin', 'منديل', 320, 200, 80, 40, 0, 250, 2.00, true),
  ('00000000-0000-0000-0000-000000000001', 'Bedding', 'Standard', 'White', 'Mattress Protector', 'غطاء المرتبة', 65, 45, 12, 8, 0, 50, 20.00, true),
  ('00000000-0000-0000-0000-000000000001', 'Towels', 'Large', 'White', 'Pool Towel', 'منشفة المسبح', 95, 60, 25, 10, 0, 80, 14.00, true),
  ('00000000-0000-0000-0000-000000000001', 'Dining', 'Medium', 'White', 'Tea Towel', 'منشفة المطبخ', 85, 50, 20, 15, 0, 65, 6.00, true)
ON CONFLICT (id) DO NOTHING;
