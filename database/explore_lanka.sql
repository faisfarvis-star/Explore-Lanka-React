-- ============================================================
-- EXPLORE LANKA - DATABASE SCHEMA
-- Smart Tourism Guide for Sri Lanka
-- HDIT 21193 - UI/UX Design
-- ============================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS explore_lanka_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE explore_lanka_db;

-- ============================================================
-- TABLE 1: users
-- Stores registered users and administrators
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL COMMENT 'password_hash() value',
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    phone VARCHAR(20) DEFAULT NULL,
    profile_image VARCHAR(255) DEFAULT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert 10+ sample user records
-- Password for all sample users: password123 (hashed)
INSERT INTO users (fullname, email, password, role, phone, status) VALUES
('Admin User', 'admin@explorelanka.lk', '$2a$10$b/.H/C9DIy/3jM2oY7M3sey6EZuopQQ.01yvUxYxU67yMY7xn9kQO', 'admin', '+94711234560', 'active'),
('Kamal Perera', 'kamal@email.com', '$2a$10$b/.H/C9DIy/3jM2oY7M3sey6EZuopQQ.01yvUxYxU67yMY7xn9kQO', 'user', '+94771234561', 'active'),
('Nimal Fernando', 'nimal@email.com', '$2a$10$b/.H/C9DIy/3jM2oY7M3sey6EZuopQQ.01yvUxYxU67yMY7xn9kQO', 'user', '+94771234562', 'active'),
('Samantha Silva', 'samantha@email.com', '$2a$10$b/.H/C9DIy/3jM2oY7M3sey6EZuopQQ.01yvUxYxU67yMY7xn9kQO', 'user', '+94771234563', 'active'),
('Ruwan Jayawardena', 'ruwan@email.com', '$2a$10$b/.H/C9DIy/3jM2oY7M3sey6EZuopQQ.01yvUxYxU67yMY7xn9kQO', 'user', '+94771234564', 'active'),
('Dilani Rathnayake', 'dilani@email.com', '$2a$10$b/.H/C9DIy/3jM2oY7M3sey6EZuopQQ.01yvUxYxU67yMY7xn9kQO', 'user', '+94771234565', 'active'),
('Priya Kumar', 'priya@email.com', '$2a$10$b/.H/C9DIy/3jM2oY7M3sey6EZuopQQ.01yvUxYxU67yMY7xn9kQO', 'user', '+94771234566', 'active'),
('Lahiru Wickramasinghe', 'lahiru@email.com', '$2a$10$b/.H/C9DIy/3jM2oY7M3sey6EZuopQQ.01yvUxYxU67yMY7xn9kQO', 'user', '+94771234567', 'active'),
('Anusha Mendis', 'anusha@email.com', '$2a$10$b/.H/C9DIy/3jM2oY7M3sey6EZuopQQ.01yvUxYxU67yMY7xn9kQO', 'user', '+94771234568', 'active'),
('Chaminda Bandara', 'chaminda@email.com', '$2a$10$b/.H/C9DIy/3jM2oY7M3sey6EZuopQQ.01yvUxYxU67yMY7xn9kQO', 'user', '+94771234569', 'active'),
('Kavindi Jayasinghe', 'kavindi@email.com', '$2a$10$b/.H/C9DIy/3jM2oY7M3sey6EZuopQQ.01yvUxYxU67yMY7xn9kQO', 'user', '+94771234570', 'active');

-- ============================================================
-- TABLE 6: remember_tokens
-- Stores "Remember Me" authentication tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS remember_tokens (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 2: features
-- Tourism features/categories (Cultural Heritage, Wildlife, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS features (
    features_id INT AUTO_INCREMENT PRIMARY KEY,
    features_name VARCHAR(100) NOT NULL,
    slug VARCHAR(150) DEFAULT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT NULL,
    facilities TEXT DEFAULT NULL COMMENT 'JSON array or comma-separated list',
    user INT DEFAULT NULL COMMENT 'Admin user ID who created this feature',
    image VARCHAR(255) DEFAULT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (features_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert 10+ sample feature records
INSERT INTO features (features_name, description, facilities, user, image) VALUES
('Cultural Heritage', 'Explore Sri Lankas rich cultural heritage spanning over 2500 years. Visit ancient kingdoms, temples, and UNESCO World Heritage sites that tell the story of this magnificent island.', 'Guided Tours,Audio Guides,Transport,Refreshments', 1, 'cultural-heritage.jpg'),
('Wildlife Safaris', 'Discover Sri Lankas incredible wildlife in its natural habitat. From elephants to leopards, the island offers some of the best wildlife experiences in Asia.', 'Safari Vehicle,Naturalist Guide,Binoculars,Lunch', 1, 'wildlife.jpg'),
('Beach Escapes', 'Relax on pristine tropical beaches with golden sand and crystal-clear waters. Sri Lankas coastline offers everything from bustling beach towns to secluded coves.', 'Sun Loungers,Water Sports,Beach Dining,Umbrellas', 1, 'beaches.jpg'),
('Mountain Adventures', 'Trek through lush tea plantations and misty mountains in Sri Lankas central highlands. Experience breathtaking views and cool mountain air.', 'Hiking Gear,Guide Service,Camping Equipment,Meals', 1, 'mountains.jpg'),
('Historical Sites', 'Step back in time at Sri Lankas ancient cities and archaeological wonders. Marvel at advanced engineering and artistry from centuries past.', 'Museum Entry,Audio Guide,Transportation,Guide', 1, 'historical.jpg'),
('Local Food Experience', 'Savour the vibrant flavours of Sri Lankan cuisine. From spicy curries to sweet treats, the island offers a culinary journey like no other.', 'Cooking Class,Food Tasting,Recipe Book,Restaurant Tour', 1, 'local-food.jpg'),
('Eco Tourism', 'Experience sustainable travel that supports conservation and local communities. Sri Lanka leads the way in eco-friendly tourism initiatives.', 'Eco Lodge,Nature Trails,Bird Watching,Organic Meals', 1, 'eco-tourism.jpg'),
('Waterfall Wonders', 'Discover stunning waterfalls hidden in Sri Lankas lush hill country. Each waterfall offers a unique and refreshing experience.', 'Swimming Areas,Viewing Platforms,Photography Points,Picnic Areas', 1, 'waterfalls.jpg'),
('Religious Sites', 'Visit sacred temples, churches, mosques, and kovils that reflect Sri Lankas diverse religious heritage and architectural brilliance.', 'Temple Entry,Dress Code Info,Guide Service,Meditation Space', 1, 'religious.jpg'),
('City Experiences', 'Explore vibrant Sri Lankan cities where modern life meets tradition. From Colombo to Kandy, each city has its own unique character.', 'Shopping,Museums,Nightlife,Local Transport', 1, 'city-life.jpg'),
('Ayurveda & Wellness', 'Rejuvenate your body and mind with traditional Ayurvedic treatments and wellness retreats that have been practised in Sri Lanka for thousands of years.', 'Ayurveda Treatments,Yoga Classes,Meditation,Herbal Cuisine', 1, 'wellness.jpg'),
('Scenic Train Journeys', 'Experience some of the most beautiful train journeys in the world through Sri Lankas breathtaking landscapes, from coastal lines to mountain railways.', 'Train Tickets,Scenic Views,Photography,Refreshments Onboard', 1, 'train-journeys.jpg');

-- ============================================================
-- TABLE 3: adds
-- Stores destinations/features added or saved by users
-- ============================================================
CREATE TABLE IF NOT EXISTS adds (
    add_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    features_name VARCHAR(100) NOT NULL COMMENT 'Name of the saved feature or place',
    status ENUM('active', 'pending', 'removed') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert 10+ sample add records
INSERT INTO adds (user_id, features_name, status) VALUES
(2, 'Sigiriya Rock Fortress', 'active'),
(2, 'Cultural Heritage', 'active'),
(3, 'Mirissa Beach', 'active'),
(3, 'Wildlife Safaris', 'pending'),
(4, 'Ella', 'active'),
(4, 'Nine Arch Bridge', 'active'),
(5, 'Galle Fort', 'active'),
(5, 'Local Food Experience', 'pending'),
(6, 'Yala National Park', 'active'),
(6, 'Waterfall Wonders', 'removed'),
(7, 'Nuwara Eliya', 'active'),
(7, 'Scenic Train Journeys', 'active'),
(8, 'Kandy', 'active'),
(8, 'Cultural Heritage', 'pending'),
(9, 'Arugam Bay', 'active');

-- ============================================================
-- TABLE 4: products
-- Tourist destinations/places available for browsing
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    district VARCHAR(100) NOT NULL,
    category VARCHAR(100) DEFAULT NULL,
    short_description VARCHAR(300) DEFAULT NULL,
    description TEXT NOT NULL,
    facilities TEXT DEFAULT NULL COMMENT 'JSON array or comma-separated list',
    image VARCHAR(255) DEFAULT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_district (district),
    INDEX idx_category (category),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert 10+ sample tourist destination records
INSERT INTO products (product_name, district, category, short_description, description, facilities, image, created_by) VALUES
('Sigiriya Rock Fortress', 'Matale', 'Historical Sites', 'Ancient rock fortress and UNESCO World Heritage site with stunning frescoes and lion gate.', 'Sigiriya, also known as Lions Rock, is an ancient rock fortress built by King Kashyapa in the 5th century. This UNESCO World Heritage site features remarkable frescoes, mirror wall, and the famous lion-shaped entrance. The summit offers panoramic views of the surrounding jungle and countryside. The site includes sophisticated water gardens, fountains, and defensive structures that showcase advanced ancient engineering.', 'Guided Tours,Parking,Refreshments,Restrooms,Museum,Viewing Platforms', 'sigiriya-rock.jpg', 1),
('Ella', 'Badulla', 'Mountain Adventures', 'Scenic hill town surrounded by tea plantations and stunning mountain views.', 'Ella is a charming hill town nestled in the Badulla District, renowned for its breathtaking landscapes, tea estates, and cool climate. Visitors can hike to Ella Rock, visit the Nine Arch Bridge, explore Demodara Railway Station, and enjoy panoramic views from Little Adams Peak. The town offers a perfect blend of nature walks, tea plantation tours, and relaxation.', 'Accommodation,Restaurants,Hiking Trails,Tea Tours,Transport,Viewpoints', 'ella-nine-arch.jpg', 1),
('Galle Fort', 'Galle', 'Cultural Heritage', 'Historic Dutch fort with colonial architecture and ocean views.', 'Galle Fort is a UNESCO World Heritage site built by the Portuguese in the 16th century and later fortified by the Dutch. This historic fortification showcases colonial architecture, narrow streets, museums, galleries, cafes, and boutiques. The fort walls offer stunning views of the Indian Ocean and are perfect for sunset walks.', 'Guided Tours,Museums,Cafes,Restaurants,Parking,Viewpoints', 'galle-fort.jpg', 1),
('Nuwara Eliya', 'Nuwara Eliya', 'Mountain Adventures', 'Little England - a picturesque hill station with tea plantations and colonial charm.', 'Nuwara Eliya, often called Little England, is a beautiful hill station in the central highlands of Sri Lanka. Known for its cool climate, rolling tea plantations, colonial-era buildings, and Gregory Lake, it offers a refreshing escape from tropical heat. Visitors can tour tea factories, play golf at one of Asias finest courses, and enjoy stunning mountain scenery.', 'Accommodation,Tea Tours,Golf Course,Boating,Restaurants,Park', 'nuwara-eliya.jpg', 1),
('Mirissa Beach', 'Matara', 'Beach Escapes', 'Tropical paradise with golden sand, surfing, and whale watching.', 'Mirissa is a stunning coastal town famous for its crescent-shaped beach, palm-fringed shores, and crystal-clear waters. It is one of the best spots in Sri Lanka for surfing, snorkeling, and dolphin watching. Mirissa is also the prime location for whale watching, offering chances to see blue whales and sperm whales in their natural habitat.', 'Water Sports,Surfing,Whale Watching,Beach Dining,Sun Loungers,Restrooms', 'mirissa-beach.jpg', 1),
('Yala National Park', 'Hambantota', 'Wildlife Safaris', 'Sri Lankas most famous national park with the highest leopard density in the world.', 'Yala National Park is the most visited national park in Sri Lanka, renowned for having the highest density of leopards in the world. The park encompasses a variety of ecosystems including jungles, grasslands, lagoons, and beaches. Wildlife includes elephants, sloth bears, crocodiles, water buffalo, and over 200 bird species. Safari jeep tours provide unforgettable wildlife encounters.', 'Safari Vehicles,Naturalist Guide,Binoculars,Accommodation,Camping,Restrooms', 'yala-national-park.jpg', 1),
('Kandy', 'Kandy', 'Cultural Heritage', 'Sacred city with the Temple of the Tooth Relic and lush mountain scenery.', 'Kandy is a major city in the central hills of Sri Lanka and a UNESCO World Heritage site. It is home to the Temple of the Sacred Tooth Relic (Sri Dalada Maligawa), one of the most sacred Buddhist sites in the world. The city is surrounded by mountains, tea plantations, and features the beautiful Kandy Lake. The annual Esala Perahera festival is a spectacular cultural event.', 'Temple Entry,Museums,Botanical Gardens,Cultural Shows,Accommodation,Transport', 'kandy.jpg', 1),
('Arugam Bay', 'Ampara', 'Beach Escapes', 'World-class surfing destination with laid-back beach vibes.', 'Arugam Bay is a premier surfing destination on Sri Lankas east coast, known for its consistent waves and relaxed atmosphere. The main surf point offers a long right-hand break that attracts surfers from around the world. Beyond surfing, the area features beautiful beaches, lagoons, wildlife sanctuaries, and a chilled-out beach town vibe with cafes and guesthouses.', 'Surfing,Accommodation,Cafes,Transport,Boat Tours,Fishing', 'arugam-bay.jpg', 1),
('Nine Arch Bridge', 'Badulla', 'Historical Sites', 'Iconic colonial-era railway bridge surrounded by lush tea plantations.', 'The Nine Arch Bridge, also known as the Bridge in the Sky, is a remarkable feat of colonial-era railway engineering located near Ella. Built entirely from solid rock, bricks, and cement without steel, this 100-foot-high bridge spans 300 feet across a deep valley. Surrounded by dense jungle and tea plantations, it is one of the most photographed locations in Sri Lanka, especially when a train passes over.', 'Photography Points,Hiking Trail,Tea Stalls,Viewpoints,Parking', 'nine-arch-bridge.jpg', 1),
('Horton Plains National Park', 'Nuwara Eliya', 'Eco Tourism', 'Unique montane grassland ecosystem with Worlds End cliff and Baker Falls.', 'Horton Plains National Park is a protected area in the central highlands of Sri Lanka, known for its unique montane grassland and cloud forest ecosystem. The park features Worlds End, a dramatic cliff with a 1200-meter drop, and Baker Falls, a beautiful waterfall. It is home to endemic flora and fauna including the Sri Lankan sambar deer and numerous bird species. The circular walking trail offers an unforgettable nature experience.', 'Walking Trails,Picnic Areas,Viewpoints,Parking,Restrooms,Guide Service', 'horton-plains.jpg', 1),
('Polonnaruwa Ancient City', 'Polonnaruwa', 'Historical Sites', 'Medieval kingdom ruins showcasing ancient Sri Lankan architecture and engineering.', 'Polonnaruwa is the second ancient kingdom of Sri Lanka and a UNESCO World Heritage site. The well-preserved ruins include royal palaces, temples, stupas, and intricate stone carvings dating back to the 11th and 12th centuries. Key attractions include the Gal Vihara rock temple with magnificent Buddha statues, the Royal Palace complex, and the Lotus Pond.', 'Museum Entry,Guided Tours,Parking,Refreshments,Restrooms,Transport', 'polonnaruwa.jpg', 1),
('Unawatuna Beach', 'Galle', 'Beach Escapes', 'Beautiful crescent-shaped beach with coral reef and vibrant marine life.', 'Unawatuna is a picturesque beach town located just south of Galle, famous for its beautiful crescent-shaped bay and golden sand. The beach is protected by a coral reef, creating calm swimming conditions perfect for families. The area offers excellent snorkeling, diving, and glass-bottom boat rides to see marine life. A lively strip of restaurants and bars lines the beach.', 'Water Sports,Snorkeling,Diving,Beach Dining,Sun Beds,Restrooms', 'unawatuna-beach.jpg', 1);

-- ============================================================
-- TABLE 5: contacts
-- Stores visitor contact messages
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
    contact_id INT AUTO_INCREMENT PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('unread', 'read', 'replied') NOT NULL DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample contact records
INSERT INTO contacts (fullname, email, subject, message, status) VALUES
('John Smith', 'john@example.com', 'Tour Package Inquiry', 'I am interested in your 7-day cultural tour package. Could you please send me more details about the itinerary and pricing?', 'unread'),
('Sarah Johnson', 'sarah@example.com', 'Accommodation Question', 'We are planning a family trip in August. Do you recommend any family-friendly hotels near the beach?', 'read'),
('Mike Wilson', 'mike@example.com', 'Group Booking', 'Our office is planning a team outing for 20 people. Can you arrange a customized tour for us?', 'unread'),
('Emily Davis', 'emily@example.com', 'Wildlife Safari', 'I would like to book a 3-day wildlife safari covering Yala and Udawalawe national parks. Please share available dates.', 'replied'),
('David Brown', 'david@example.com', 'Website Feedback', 'Great website! I found all the information I needed to plan my Sri Lanka trip. The destination cards are very helpful.', 'read');

-- ============================================================
-- TABLE 6: product_feedback
-- Stores ratings and reviews for tourist destinations
-- ============================================================
CREATE TABLE IF NOT EXISTS product_feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT DEFAULT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
