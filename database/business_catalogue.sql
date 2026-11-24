-- =========================================================
-- LAGOS LEGENDS — BUSINESS CATALOGUE
-- =========================================================

-- ---------------------------------------------------------
-- ITEMS
-- ---------------------------------------------------------

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'Jollof Rice', 'food', 'A plate of Nigerian jollof rice.', 2500, 30
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'Jollof Rice'
);

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'Fried Rice', 'food', 'A plate of fried rice.', 3500, 45
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'Fried Rice'
);

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'Burger', 'food', 'A beef burger.', 3000, 35
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'Burger'
);

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'Shawarma', 'food', 'Chicken shawarma.', 2500, 30
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'Shawarma'
);

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'Water', 'food', 'A bottle of water.', 500, 5
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'Water'
);

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'Bread', 'food', 'Fresh Nigerian bread.', 1500, 15
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'Bread'
);

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'Noodles', 'food', 'Instant noodles.', 1200, 15
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'Noodles'
);

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'Milk', 'food', 'A pack of milk.', 1800, 10
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'Milk'
);

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'Shirt', 'clothing', 'A casual shirt.', 8000, 0
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'Shirt'
);

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'Trousers', 'clothing', 'A pair of trousers.', 10000, 0
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'Trousers'
);

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'Sneakers', 'clothing', 'Casual sneakers.', 15000, 0
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'Sneakers'
);

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'Cap', 'clothing', 'A stylish cap.', 5000, 0
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'Cap'
);

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'Painkiller', 'medicine', 'Basic pain relief medicine.', 1000, 0
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'Painkiller'
);

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'First Aid Kit', 'medicine', 'Basic first aid supplies.', 3500, 0
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'First Aid Kit'
);

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'Haircut', 'appearance', 'A fresh haircut.', 3000, 0
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'Haircut'
);

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'Beard Trim', 'appearance', 'A clean beard trim.', 2000, 0
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'Beard Trim'
);

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'Nightclub Entry', 'entertainment', 'Standard nightclub entry.', 3000, 0
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'Nightclub Entry'
);

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'VIP Access', 'entertainment', 'VIP nightclub access.', 15000, 0
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'VIP Access'
);

INSERT INTO items (name, category, description, price, hunger_restore)
SELECT 'Mocktail', 'food', 'A chilled mocktail.', 2500, 0
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE name = 'Mocktail'
);

-- ---------------------------------------------------------
-- BUSINESSES
-- ---------------------------------------------------------

INSERT INTO businesses (name, business_type, description)
SELECT 'Chow House', 'restaurant', 'Restaurant serving meals and drinks.'
WHERE NOT EXISTS (
    SELECT 1 FROM businesses WHERE name = 'Chow House'
);

INSERT INTO businesses (name, business_type, description)
SELECT 'Mart & More', 'supermarket', 'Supermarket for groceries and household items.'
WHERE NOT EXISTS (
    SELECT 1 FROM businesses WHERE name = 'Mart & More'
);

INSERT INTO businesses (name, business_type, description)
SELECT 'Style District', 'clothing', 'Clothing and fashion store.'
WHERE NOT EXISTS (
    SELECT 1 FROM businesses WHERE name = 'Style District'
);

INSERT INTO businesses (name, business_type, description)
SELECT 'Lagos General Hospital', 'hospital', 'General medical services.'
WHERE NOT EXISTS (
    SELECT 1 FROM businesses WHERE name = 'Lagos General Hospital'
);

INSERT INTO businesses (name, business_type, description)
SELECT 'City Pharmacy', 'pharmacy', 'Pharmacy and first aid supplies.'
WHERE NOT EXISTS (
    SELECT 1 FROM businesses WHERE name = 'City Pharmacy'
);

INSERT INTO businesses (name, business_type, description)
SELECT 'Fresh Cuts', 'barber', 'Haircut and grooming services.'
WHERE NOT EXISTS (
    SELECT 1 FROM businesses WHERE name = 'Fresh Cuts'
);

INSERT INTO businesses (name, business_type, description)
SELECT 'The Nightlife', 'nightclub', 'Nightclub and entertainment venue.'
WHERE NOT EXISTS (
    SELECT 1 FROM businesses WHERE name = 'The Nightlife'
);

-- ---------------------------------------------------------
-- BUSINESS INVENTORY
-- ---------------------------------------------------------

-- Restaurant
INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 2500, -1
FROM businesses b
JOIN items i ON i.name = 'Jollof Rice'
WHERE b.name = 'Chow House'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 3500, -1
FROM businesses b
JOIN items i ON i.name = 'Fried Rice'
WHERE b.name = 'Chow House'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 3000, -1
FROM businesses b
JOIN items i ON i.name = 'Burger'
WHERE b.name = 'Chow House'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 2500, -1
FROM businesses b
JOIN items i ON i.name = 'Shawarma'
WHERE b.name = 'Chow House'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 500, -1
FROM businesses b
JOIN items i ON i.name = 'Water'
WHERE b.name = 'Chow House'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

-- Supermarket
INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 1500, -1
FROM businesses b
JOIN items i ON i.name = 'Bread'
WHERE b.name = 'Mart & More'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 1200, -1
FROM businesses b
JOIN items i ON i.name = 'Noodles'
WHERE b.name = 'Mart & More'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 1800, -1
FROM businesses b
JOIN items i ON i.name = 'Milk'
WHERE b.name = 'Mart & More'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 500, -1
FROM businesses b
JOIN items i ON i.name = 'Water'
WHERE b.name = 'Mart & More'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

-- Clothing
INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 8000, -1
FROM businesses b
JOIN items i ON i.name = 'Shirt'
WHERE b.name = 'Style District'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 10000, -1
FROM businesses b
JOIN items i ON i.name = 'Trousers'
WHERE b.name = 'Style District'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 15000, -1
FROM businesses b
JOIN items i ON i.name = 'Sneakers'
WHERE b.name = 'Style District'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 5000, -1
FROM businesses b
JOIN items i ON i.name = 'Cap'
WHERE b.name = 'Style District'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

-- Pharmacy
INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 1000, -1
FROM businesses b
JOIN items i ON i.name = 'Painkiller'
WHERE b.name = 'City Pharmacy'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 3500, -1
FROM businesses b
JOIN items i ON i.name = 'First Aid Kit'
WHERE b.name = 'City Pharmacy'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

-- Barber
INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 3000, -1
FROM businesses b
JOIN items i ON i.name = 'Haircut'
WHERE b.name = 'Fresh Cuts'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 2000, -1
FROM businesses b
JOIN items i ON i.name = 'Beard Trim'
WHERE b.name = 'Fresh Cuts'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

-- Nightclub
INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 3000, -1
FROM businesses b
JOIN items i ON i.name = 'Nightclub Entry'
WHERE b.name = 'The Nightlife'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 15000, -1
FROM businesses b
JOIN items i ON i.name = 'VIP Access'
WHERE b.name = 'The Nightlife'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);

INSERT INTO business_inventory (business_id, item_id, price, stock)
SELECT b.id, i.id, 2500, -1
FROM businesses b
JOIN items i ON i.name = 'Mocktail'
WHERE b.name = 'The Nightlife'
AND NOT EXISTS (
    SELECT 1 FROM business_inventory bi
    WHERE bi.business_id = b.id AND bi.item_id = i.id
);
