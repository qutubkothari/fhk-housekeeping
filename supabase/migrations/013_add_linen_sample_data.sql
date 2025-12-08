-- Add sample linen items
INSERT INTO linen_items (
  org_id, linen_type, size, color, item_name_en, item_name_ar,
  total_stock, clean_stock, soiled_stock, in_laundry, damaged_stock, par_level, unit_cost
) VALUES
-- Bed Sheets
('00000000-0000-0000-0000-000000000001', 'bed_sheet', 'single', 'white', 'Single Bed Sheet - White', 'ملاءة سرير فردية - أبيض', 50, 25, 10, 12, 3, 40, 15.00),
('00000000-0000-0000-0000-000000000001', 'bed_sheet', 'double', 'white', 'Double Bed Sheet - White', 'ملاءة سرير مزدوجة - أبيض', 80, 40, 18, 20, 2, 70, 18.00),
('00000000-0000-0000-0000-000000000001', 'bed_sheet', 'queen', 'white', 'Queen Bed Sheet - White', 'ملاءة سرير كوين - أبيض', 45, 20, 12, 10, 3, 40, 20.00),
('00000000-0000-0000-0000-000000000001', 'bed_sheet', 'king', 'white', 'King Bed Sheet - White', 'ملاءة سرير كينج - أبيض', 35, 15, 8, 10, 2, 30, 22.00),

-- Pillow Cases
('00000000-0000-0000-0000-000000000001', 'pillow_case', 'single', 'white', 'Pillow Case - White', 'غطاء وسادة - أبيض', 120, 60, 25, 30, 5, 100, 5.00),
('00000000-0000-0000-0000-000000000001', 'pillow_case', 'king', 'white', 'King Pillow Case - White', 'غطاء وسادة كينج - أبيض', 60, 28, 15, 14, 3, 50, 6.50),

-- Towels
('00000000-0000-0000-0000-000000000001', 'towel', 'single', 'white', 'Bath Towel - White', 'منشفة استحمام - أبيض', 150, 75, 35, 35, 5, 120, 8.00),
('00000000-0000-0000-0000-000000000001', 'towel', 'single', 'beige', 'Bath Towel - Beige', 'منشفة استحمام - بيج', 100, 50, 22, 25, 3, 80, 8.00),
('00000000-0000-0000-0000-000000000001', 'towel', 'single', 'white', 'Hand Towel - White', 'منشفة يد - أبيض', 180, 90, 40, 45, 5, 150, 4.50),
('00000000-0000-0000-0000-000000000001', 'towel', 'single', 'white', 'Face Towel - White', 'منشفة وجه - أبيض', 200, 100, 45, 50, 5, 170, 3.00),

-- Bathrobes
('00000000-0000-0000-0000-000000000001', 'bathrobe', 'single', 'white', 'Bathrobe - White', 'روب استحمام - أبيض', 40, 20, 8, 10, 2, 35, 25.00),
('00000000-0000-0000-0000-000000000001', 'bathrobe', 'single', 'navy', 'Bathrobe - Navy', 'روب استحمام - كحلي', 30, 15, 6, 8, 1, 25, 25.00),

-- Blankets
('00000000-0000-0000-0000-000000000001', 'blanket', 'double', 'beige', 'Blanket - Double Beige', 'بطانية - مزدوجة بيج', 35, 18, 7, 8, 2, 30, 30.00),
('00000000-0000-0000-0000-000000000001', 'blanket', 'king', 'beige', 'Blanket - King Beige', 'بطانية - كينج بيج', 25, 12, 5, 6, 2, 20, 35.00),

-- Duvets
('00000000-0000-0000-0000-000000000001', 'duvet', 'double', 'white', 'Duvet Cover - Double White', 'غطاء لحاف - مزدوج أبيض', 40, 20, 8, 10, 2, 35, 28.00),
('00000000-0000-0000-0000-000000000001', 'duvet', 'king', 'white', 'Duvet Cover - King White', 'غطاء لحاف - كينج أبيض', 30, 15, 6, 8, 1, 25, 32.00),

-- Mattress Protectors
('00000000-0000-0000-0000-000000000001', 'mattress_protector', 'double', 'white', 'Mattress Protector - Double', 'واقي مرتبة - مزدوج', 45, 25, 8, 10, 2, 40, 20.00),
('00000000-0000-0000-0000-000000000001', 'mattress_protector', 'king', 'white', 'Mattress Protector - King', 'واقي مرتبة - كينج', 35, 18, 7, 8, 2, 30, 25.00)
ON CONFLICT DO NOTHING;
