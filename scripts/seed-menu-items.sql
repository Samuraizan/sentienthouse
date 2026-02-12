-- Seed menu_items table from Meal Planning Google Sheet
-- Source: 1Sj1dzZjr-B8uAU8EWMAM3S9Od4TqcDSS0GWqj8-AnH4 (tab: "Meal Planning")
-- Generated: 2026-02-12
-- Total: 91 items (71 with prices, 20 lunch/dinner curries without individual prices)

INSERT INTO menu_items (item_name, category, description, price, calories, property_id, active) VALUES

-- === BREAKFAST (GM) ===
('Eggs to Order', 'Breakfast', 'Fresh eggs cooked your way—choose your style and get it served hot and fresh.', 69, 140, 'both', true),
('Scrambled Eggs', 'Breakfast', 'Three fluffy scrambled eggs cooked with light seasoning. Soft, creamy, and perfect for a quick bite.', 109, 180, 'both', true),
('Vegetable Omlette', 'Breakfast', 'A hearty veggie double omelette loaded with onion, tomato, and seasonal veggies. Light, filling, and flavorful.', 89, 220, 'both', true),
('Sunny Side up', 'Breakfast', 'Classic sunny side up made with two eggs, featuring crispy edges and a runny yolk. Simple, clean, and satisfying.', 69, 160, 'both', true),
('Bolied egg', 'Breakfast', 'Perfectly boiled eggs, served hot and lightly seasoned. Simple, protein-packed, and filling.', 69, 150, 'both', true),
('Poha', 'Breakfast', 'Light and delicious poha cooked with onions, spices, and a fresh squeeze of lemon. A perfect comfort breakfast.', 120, 280, 'both', true),
('Veg English Breakfast', 'Breakfast', 'A vegetarian spin with grilled paneer alongside eggs, toast, beans, and mashed potatoes for a hearty start.', 200, 520, 'both', true),
('Non Veg English breakfast', 'Breakfast', 'Sausages, eggs, mashed potatoes, toast, beans, and caramelized onions with mushrooms for a hearty start.', 200, 650, 'both', true),

-- === BURGERS ===
('Veg Burger', 'Burgers', 'Grilled paneer and fresh veggie stack layered with crisp lettuce, tomato, and onions in our signature stamped bun. Served with fries.', 169, 560, 'both', true),
('Chicken Burger', 'Burgers', 'Classic grilled chicken breast with lettuce, tomato, and onions in a toasted stamped bun. Served with fries.', 200, 620, 'both', true),

-- === SANDWICHES ===
('Chicken Sandwich', 'Sandwiches', 'A hearty and flavorful sandwich made with tender chicken, creamy spreads, layered between soft or toasted bread. Perfect filling, juicy, and satisfying for any time of the day.', 169, 420, 'both', true),
('Paneer Sandwich', 'Sandwiches', 'A warm and filling paneer sandwich with spiced paneer, fresh veggies, and creamy sauces. Toasted to perfection for a satisfying bite.', 142, 390, 'both', true),
('Veg Club Sandwich', 'Sandwiches', 'A wholesome and fresh delight made with soft bread layered with crunchy vegetables, flavorful spreads, and seasonings. Light, tasty and perfect for a quick bite any time of the day.', 142, 360, 'both', true),
('PB&J', 'Sandwiches', 'A timeless favorite: creamy peanut butter with fruity jam, served on toasted bread.', 69, 320, 'both', true),
('Grilled Cheese Sandwich', 'Sandwiches', 'Crispy toasted bread loaded with gooey melted cheese. Simple, comforting, and always a hit.', 111, 420, 'both', true),

-- === MUNCHIES ===
('Maggie', 'Munchies', 'Classic Maggi noodles cooked with signature masala. Hot, comforting, and perfect for anytime cravings.', 99, 340, 'both', true),
('Veg Maggie', 'Munchies', 'Classic Maggi noodles cooked with fresh veggies and extra flavor. A quick snack that hits the spot.', 114, 380, 'both', true),
('Cheese Maggie', 'Munchies', 'Creamy cheesy Maggi loaded with melty cheese goodness. Rich, indulgent, and super satisfying.', 111, 460, 'both', true),
('Masala Maggie', 'Munchies', 'Extra spicy Maggi cooked with an added masala punch. Bold flavor with every bite.', 107, 360, 'both', true),
('French Fries', 'Munchies', 'Crispy golden fries served hot and crunchy. Perfect for munching anytime.', 111, 380, 'both', true),
('French Fries salted', 'Munchies', 'Classic salted fries—crispy, golden, and perfectly seasoned. Simple and addictive.', 111, 380, 'both', true),
('French Fries Peri Peri', 'Munchies', 'Crispy fries tossed in peri peri spice for a spicy kick. Crunchy, bold, and flavorful.', 131, 400, 'both', true),
('Popcorn', 'Munchies', 'Freshly popped corn, lightly seasoned for a crunchy, guilt-free snack. Light, airy, and perfect for munching.', 49, 150, 'both', true),
('Peri Peri Popcorn', 'Munchies', 'Freshly popped corn tossed with peri peri seasoning for a spicy kick. Crunchy, bold, and addictive.', 69, 170, 'both', true),
('Butter Popcorn', 'Munchies', 'Freshly popped corn tossed with melted butter and light seasoning. Rich, crunchy, and classic comfort snack.', 69, 220, 'both', true),

-- === PASTA ===
('Veg Pasta', 'Pasta', 'Comforting veg penne pasta cooked in a rich arrabbiata or pink sauce with fresh veggies, basil, and herbs. Creamy, filling, and satisfying.', 189, 520, 'both', true),
('Veg White Sauce Pasta', 'Pasta', 'Creamy white sauce pasta loaded with veggies and seasoning. Smooth, rich, and super comforting.', 189, 560, 'both', true),
('Veg Pink Sause Pasta', 'Pasta', 'A delicious blend of red and white sauce tossed with veggies for a creamy tangy bite. Perfect comfort pasta.', 189, 540, 'both', true),
('Veg Arrabbiata Pasta', 'Pasta', 'Veg penne pasta tossed in bold arrabbiata sauce with fresh veggies and basil. Tangy, mildly spicy, and deeply satisfying.', 189, 480, 'both', true),
('Non Veg Pasta', 'Pasta', 'Hearty non-veg pasta cooked with tender protein and flavorful sauce. Filling, satisfying, and packed with taste.', 200, 590, 'both', true),
('Non - Veg White Sauce Pasta', 'Pasta', 'Creamy white sauce pasta loaded with tender non-veg protein. Rich, smooth, and filling.', 200, 640, 'both', true),
('Non - Veg Pink Sause Pasta', 'Pasta', 'A creamy pink sauce pasta with non-veg protein for the perfect balance of rich and tangy flavors.', 200, 620, 'both', true),
('Non - Veg Arrabbiata Pasta', 'Pasta', 'Penne pasta cooked in bold arrabbiata sauce with tender non-veg protein, veggies, and basil. Spicy, hearty, and filling.', 200, 560, 'both', true),

-- === BEVERAGES ===
('Ginger tea', 'Beverages', 'Hot tea brewed with fresh ginger for a soothing and refreshing sip. Light, warming, and comforting.', 42, 30, 'both', true),
('Ginger Lemon Honey Tea', 'Beverages', 'A calming tea made with ginger, lemon, and honey. Light, refreshing, and perfect for a reset.', 42, 45, 'both', true),
('Cappucino', 'Beverages', 'Classic cappuccino with strong coffee and frothy milk. Smooth, rich, and energizing.', 69, 90, 'both', true),
('Americano', 'Beverages', 'Bold black coffee brewed smooth and strong. Clean, simple, and refreshing.', 69, 10, 'both', true),
('Banana Shake', 'Beverages', 'Thick and creamy banana shake served chilled. Sweet, filling, and super refreshing.', 142, 280, 'both', true),
('Water Melon Juice', 'Beverages', 'Fresh watermelon juice served chilled. Light, hydrating, and perfect for a refreshing break.', 120, 90, 'both', true),
('Orange Juice', 'Beverages', 'Fresh orange juice packed with citrus freshness. Bright, tangy, and refreshing.', 129, 110, 'both', true),
('Mango Lassi', 'Beverages', 'Creamy mango lassi made with yogurt and mango goodness. Sweet, chilled, and refreshing.', 120, 220, 'both', true),
('Butter Milk', 'Beverages', 'Chilled salted buttermilk with spices. Light, cooling, and perfect after a meal.', 79, 60, 'both', true),
('Chocolate Shake', 'Beverages', 'Rich and creamy chocolate shake served chilled. Sweet, thick, and satisfying.', 142, 340, 'both', true),
('Hot Chocolate', 'Beverages', 'Warm hot chocolate—smooth, rich, and comforting. A perfect cozy drink anytime.', 69, 190, 'both', true),
('Iced Tea', 'Beverages', 'Chilled iced tea with a refreshing lemony twist. Light, cooling, and refreshing.', 99, 90, 'both', true),
('Cold Coffee', 'Beverages', 'Chilled coffee blended smooth and creamy. Refreshing, energizing, and sweet.', 142, 240, 'both', true),
('Lemonade', 'Beverages', 'Fresh lemonade served chilled. Simple, refreshing, and hydrating.', 42, 50, 'both', true),
('Lemonade Sweet', 'Beverages', 'Sweet lemonade served chilled for a refreshing sip. Light, tangy, and perfect for summer.', 42, 90, 'both', true),
('Lemonade Salted', 'Beverages', 'Desi salted lemonade served chilled. Tangy, refreshing, and super cooling.', 42, 20, 'both', true),
('Lemonade Sweet & Salt', 'Beverages', 'A balanced sweet and salty lemonade served chilled. Refreshing with the perfect twist.', 42, 70, 'both', true),
('Regular Coke', 'Beverages', 'Classic chilled Coke served cold and fizzy. Perfect with snacks and meals.', 60, 140, 'both', true),
('Diet Coke', 'Beverages', 'Chilled Diet Coke served fizzy and refreshing. Light, crisp, and zero sugar.', 60, 0, 'both', true),

-- === SOUL BOWLS ===
('Veg Burrito Bowl', 'Soul Bowls', 'A loaded veg burrito bowl with rice, beans, veggies, and bold Mexican-style flavors. Healthy, filling, and tasty.', 200, 520, 'both', true),
('Non- Veg Burrito Bowl', 'Soul Bowls', 'A protein-packed burrito bowl with non-veg toppings, rice, beans, and bold seasonings. Filling and satisfying.', 200, 590, 'both', true),
('Chicken Curry Bowl', 'Soul Bowls', 'Tender chicken curry served with steamed rice, a protein-packed comfort meal.', 200, 560, 'both', true),
('Paneer Curry Bowl', 'Soul Bowls', 'Rich paneer curry served in a bowl with a satisfying base. Creamy, comforting, and delicious.', 200, 610, 'both', true),
('Egg Curry Bowl', 'Soul Bowls', 'Comfort egg curry cooked in rich masala and served bowl-style for a filling, homestyle meal.', 200, 520, 'both', true),
('Dal Rice Bowl', 'Soul Bowls', 'Simple dal and rice bowl, light, comforting, and perfect for a wholesome meal anytime.', 119, 420, 'both', true),
('Paneer Rice Bowl', 'Soul Bowls', 'Fluffy rice topped with spiced paneer curry — wholesome and hearty.', 200, 560, 'both', true),

-- === NOODLES ===
('Garlic Noodles - Veg', 'Noodles', 'Veg noodles stir-fried in garlic, soy, and sauces with a bold street-style taste. Light, tasty, and satisfying.', 180, 480, 'both', true),
('Chicken Noodles', 'Noodles', 'Tender chicken and noodles stir-fried in garlic, soy, and sesame oil', 190, 520, 'both', true),

-- === SALADS ===
('Veg Cesars salad', 'Salads', 'Crisp Caesar salad with fresh greens, crunchy toppings, and creamy dressing. Light, refreshing, and wholesome.', 142, 260, 'both', true),
('Chicken Cesars salad', 'Salads', 'Caesar salad topped with juicy chicken, crunchy greens, and creamy dressing. High-protein and refreshing.', 169, 340, 'both', true),

-- === LUNCH & DINNER CURRIES (served with Rice + Dal + Salad + 2 Rotis — no individual price) ===
('Rajma Rice', 'Lunch & Dinner Curries', 'Slow-cooked kidney beans in rich onion-tomato masala, served with steamed rice. Classic North Indian comfort meal.', 0, 560, 'both', true),
('Paneer Burji Roti', 'Lunch & Dinner Curries', 'Spiced scrambled paneer cooked with onions, tomatoes & masalas, served with soft rotis. High-protein and super filling.', 0, 520, 'both', true),
('Mix Veg Dry', 'Lunch & Dinner Curries', 'Seasonal vegetables stir-fried with mild spices for a light, homestyle dry sabzi. Perfect with dal and rotis.', 0, 170, 'both', true),
('Soya Bean Dry', 'Lunch & Dinner Curries', 'Protein-packed soya chunks sautéed dry with onions and bold masalas. Spicy, filling, and meal-prep friendly.', 0, 240, 'both', true),
('Potato Cauliflower', 'Lunch & Dinner Curries', 'Classic aloo gobhi cooked with turmeric, cumin, and desi spices. Simple, comforting and full of flavor.', 0, 160, 'both', true),
('Chana Masala', 'Lunch & Dinner Curries', 'Chickpeas simmered in tangy Punjabi masala with onions, tomatoes & spices. Fibre-rich and satisfying.', 0, 240, 'both', true),
('Paneer Mix Veg Dry', 'Lunch & Dinner Curries', 'Paneer cubes stir-fried with mixed veggies and spices for a wholesome dry-style sabzi. Rich, filling, and flavorful.', 0, 260, 'both', true),
('Cabbage Potato Dry', 'Lunch & Dinner Curries', 'Homestyle cabbage and potato dry sabzi tossed with simple Indian spices. Light, comforting and tasty.', 0, 150, 'both', true),
('Potato ladiesfinger Dry', 'Lunch & Dinner Curries', 'Okra and potato stir-fry cooked with masala for a crispy, spicy dry sabzi. Best enjoyed with rotis.', 0, 190, 'both', true),
('Paneer Bhurji', 'Lunch & Dinner Curries', 'Crumbled paneer cooked with onions, tomatoes, and spices for a hearty, protein-rich dish. Best served hot.', 0, 320, 'both', true),
('Potato Peas Dry', 'Lunch & Dinner Curries', 'Aloo matar cooked dry with mild spices. Simple, comforting and perfect for a light meal.', 0, 180, 'both', true),
('Rajma Dry', 'Lunch & Dinner Curries', 'Dry-style rajma cooked thick with spices and minimal gravy. Packed with protein and perfect with rotis.', 0, 280, 'both', true),
('Palak Paneer', 'Lunch & Dinner Curries', 'Soft paneer cubes in creamy spinach gravy with mild spices. Healthy, comforting and rich in protein.', 0, 280, 'both', true),
('Potato Bitter Gourd Dry', 'Lunch & Dinner Curries', 'A traditional dry sabzi of potato and karela cooked with balanced spices. Bold, earthy and homestyle.', 0, 170, 'both', true),
('Pointed Gourd Potato Dry', 'Lunch & Dinner Curries', 'Parwal and potato cooked dry with mild spices for a light and comforting sabzi. Great with dal-chawal.', 0, 150, 'both', true),
('Ivy Gourd Potato Dry', 'Lunch & Dinner Curries', 'Tindora and potato stir-fried with classic Indian spices. Light, crunchy, and perfect with rotis.', 0, 155, 'both', true),
('Fried Rice', 'Lunch & Dinner Curries', 'Classic stir-fried rice tossed with veggies, sauces and light seasoning. Simple, filling and full of flavor.', 0, 520, 'both', true),
('dal makhni', 'Lunch & Dinner Curries', 'Creamy slow-cooked black lentils simmered with butter-style masala. Rich, comforting and best with rice or roti.', 0, 360, 'both', true),
('tomato rice', 'Lunch & Dinner Curries', 'Spiced tomato rice cooked with fragrant masalas and herbs. Tangy, comforting and perfect as a light meal.', 0, 420, 'both', true),
('ridge gourd dry', 'Lunch & Dinner Curries', 'Light ridge gourd (turai) dry sabzi cooked with simple spices. Healthy, light and easy to digest.', 0, 120, 'both', true),

-- === SIDES / ADD-ONS ===
('Roti', 'Sides', 'Classic whole-wheat flatbread cooked fresh. Soft inside, lightly crisp outside, and perfect with curries or sabzi.', 10, 120, 'both', true),
('Ghee Roti', 'Sides', 'Whole-wheat roti brushed with pure ghee for extra richness and flavor. Soft, aromatic, and satisfying.', 14, 160, 'both', true),
('Rice', 'Sides', 'Steamed white rice served warm. Light, fluffy, and a staple comfort base for curries and dal.', 19, 240, 'both', true),
('Curd', 'Sides', 'Fresh plain curd served chilled. Cooling, light, and perfect as a side with Indian meals.', 12, 90, 'both', true),
('Grilled Chicken', 'Sides', 'Juicy grilled chicken seasoned with herbs and spices, cooked fresh and served hot. Simple, high-protein, and satisfying.', 149, 260, 'both', true),
('Grilled Paneer', 'Sides', 'Thick paneer slices marinated in spices and herbs, then grilled till golden. Smoky, high-protein, and served hot as a wholesome main or side.', 111, 360, 'both', true),
('Plain paratha', 'Parathas', 'Classic whole-wheat paratha—soft inside and crisp outside. Perfect with curries, yogurt, or pickle.', 100, 320, 'both', true),
('Paneer paratha', 'Parathas', 'Classic whole-wheat paratha stuffed with spiced paneer filling. Soft inside, crisp outside, and best served hot.', 140, 420, 'both', true),
('Aloo paratha', 'Parathas', 'Classic whole-wheat paratha stuffed with spiced potato filling. Crisp, comforting, and perfect with yogurt or pickle.', 120, 380, 'both', true);
