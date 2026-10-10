-- ============================================================
-- EXPLORE LANKA — HOTEL SYSTEM DATABASE SCHEMA
-- Extends explore_lanka_db with hotel management & booking
-- Run AFTER explore_lanka.sql
-- ============================================================

USE explore_lanka_db;

-- ============================================================
-- TABLE: hotels
-- Main hotel records
-- ============================================================
CREATE TABLE IF NOT EXISTS hotels (
    hotel_id       INT AUTO_INCREMENT PRIMARY KEY,
    hotel_name     VARCHAR(200) NOT NULL,
    slug           VARCHAR(220) DEFAULT NULL,
    description    TEXT NOT NULL,
    short_desc     VARCHAR(400) DEFAULT NULL,
    address        VARCHAR(300) NOT NULL,
    city           VARCHAR(100) NOT NULL,
    district       VARCHAR(100) NOT NULL,
    latitude       DECIMAL(10,7) DEFAULT NULL,
    longitude      DECIMAL(10,7) DEFAULT NULL,
    phone          VARCHAR(30) DEFAULT NULL,
    email          VARCHAR(100) DEFAULT NULL,
    website        VARCHAR(255) DEFAULT NULL,
    star_category  TINYINT UNSIGNED NOT NULL DEFAULT 3 COMMENT '1-5 stars',
    checkin_time   TIME DEFAULT '14:00:00',
    checkout_time  TIME DEFAULT '11:00:00',
    main_image     VARCHAR(255) DEFAULT NULL,
    facilities     TEXT DEFAULT NULL COMMENT 'Comma-separated facility list',
    status         ENUM('active','inactive','pending') NOT NULL DEFAULT 'active',
    created_by     INT DEFAULT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_district   (district),
    INDEX idx_city       (city),
    INDEX idx_status     (status),
    INDEX idx_stars      (star_category),
    INDEX idx_slug       (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: hotel_images
-- Gallery images for each hotel
-- ============================================================
CREATE TABLE IF NOT EXISTS hotel_images (
    image_id    INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id    INT NOT NULL,
    image_path  VARCHAR(255) NOT NULL,
    caption     VARCHAR(200) DEFAULT NULL,
    sort_order  TINYINT UNSIGNED DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_hotel (hotel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: hotel_rooms
-- Room types within each hotel
-- ============================================================
CREATE TABLE IF NOT EXISTS hotel_rooms (
    room_id         INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id        INT NOT NULL,
    room_name       VARCHAR(150) NOT NULL,
    description     TEXT DEFAULT NULL,
    capacity        TINYINT UNSIGNED NOT NULL DEFAULT 2 COMMENT 'Max guests',
    beds            TINYINT UNSIGNED NOT NULL DEFAULT 1,
    bed_type        VARCHAR(60) DEFAULT NULL COMMENT 'e.g. King, Twin, Double',
    facilities      TEXT DEFAULT NULL COMMENT 'Comma-separated',
    price_per_night DECIMAL(10,2) NOT NULL,
    available_count TINYINT UNSIGNED NOT NULL DEFAULT 1,
    main_image      VARCHAR(255) DEFAULT NULL,
    status          ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_hotel  (hotel_id),
    INDEX idx_status (status),
    CONSTRAINT chk_price_positive CHECK (price_per_night > 0),
    CONSTRAINT chk_capacity_positive CHECK (capacity > 0),
    CONSTRAINT chk_available_nonneg CHECK (available_count >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: room_images
-- Gallery images for individual room types
-- ============================================================
CREATE TABLE IF NOT EXISTS room_images (
    image_id    INT AUTO_INCREMENT PRIMARY KEY,
    room_id     INT NOT NULL,
    image_path  VARCHAR(255) NOT NULL,
    sort_order  TINYINT UNSIGNED DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES hotel_rooms(room_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_room (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: bookings
-- Hotel room bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
    booking_id        INT AUTO_INCREMENT PRIMARY KEY,
    booking_ref       VARCHAR(20) NOT NULL UNIQUE COMMENT 'Human-readable reference e.g. EL-20260001',
    user_id           INT NOT NULL,
    hotel_id          INT NOT NULL,
    room_id           INT NOT NULL,
    checkin_date      DATE NOT NULL,
    checkout_date     DATE NOT NULL,
    nights            TINYINT UNSIGNED NOT NULL,
    guests            TINYINT UNSIGNED NOT NULL DEFAULT 1,
    rooms_booked      TINYINT UNSIGNED NOT NULL DEFAULT 1,
    price_per_night   DECIMAL(10,2) NOT NULL COMMENT 'Snapshot at booking time',
    total_amount      DECIMAL(10,2) NOT NULL COMMENT 'Server-calculated: nights * price * rooms',
    special_requests  TEXT DEFAULT NULL,
    status            ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
    cancelled_by      ENUM('user','admin') DEFAULT NULL,
    cancel_reason     TEXT DEFAULT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)  REFERENCES users(user_id)        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id)      ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (room_id)  REFERENCES hotel_rooms(room_id)  ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_user     (user_id),
    INDEX idx_hotel    (hotel_id),
    INDEX idx_room     (room_id),
    INDEX idx_status   (status),
    INDEX idx_dates    (checkin_date, checkout_date),
    CONSTRAINT chk_dates     CHECK (checkout_date > checkin_date),
    CONSTRAINT chk_guests    CHECK (guests > 0),
    CONSTRAINT chk_rooms_bkd CHECK (rooms_booked > 0),
    CONSTRAINT chk_nights    CHECK (nights > 0),
    CONSTRAINT chk_total     CHECK (total_amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: hotel_reviews
-- Hotel reviews — one per booking (enforced by unique constraint)
-- ============================================================
CREATE TABLE IF NOT EXISTS hotel_reviews (
    review_id        INT AUTO_INCREMENT PRIMARY KEY,
    booking_id       INT NOT NULL UNIQUE COMMENT 'One review per booking',
    hotel_id         INT NOT NULL,
    user_id          INT NOT NULL,
    overall_rating   TINYINT UNSIGNED NOT NULL COMMENT '1-5',
    cleanliness      TINYINT UNSIGNED DEFAULT NULL,
    service          TINYINT UNSIGNED DEFAULT NULL,
    location         TINYINT UNSIGNED DEFAULT NULL,
    facilities       TINYINT UNSIGNED DEFAULT NULL,
    value_for_money  TINYINT UNSIGNED DEFAULT NULL,
    title            VARCHAR(200) DEFAULT NULL,
    comment          TEXT DEFAULT NULL,
    status           ENUM('approved','hidden') NOT NULL DEFAULT 'approved',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)     ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (hotel_id)   REFERENCES hotels(hotel_id)         ON DELETE CASCADE  ON UPDATE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES users(user_id)           ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_hotel  (hotel_id),
    INDEX idx_user   (user_id),
    INDEX idx_status (status),
    CONSTRAINT chk_overall_rating    CHECK (overall_rating    BETWEEN 1 AND 5),
    CONSTRAINT chk_cleanliness       CHECK (cleanliness       IS NULL OR cleanliness      BETWEEN 1 AND 5),
    CONSTRAINT chk_service           CHECK (service           IS NULL OR service          BETWEEN 1 AND 5),
    CONSTRAINT chk_location_r        CHECK (location          IS NULL OR location         BETWEEN 1 AND 5),
    CONSTRAINT chk_facilities_r      CHECK (facilities        IS NULL OR facilities       BETWEEN 1 AND 5),
    CONSTRAINT chk_value_for_money   CHECK (value_for_money   IS NULL OR value_for_money  BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SAMPLE DATA — Hotels (10 Sri Lankan hotels)
-- ============================================================
INSERT INTO hotels (hotel_name, slug, description, short_desc, address, city, district, latitude, longitude, phone, email, star_category, checkin_time, checkout_time, facilities, status, created_by) VALUES

('Heritance Kandalama', 'heritance-kandalama',
 'Designed by the legendary Geoffrey Bawa, Heritance Kandalama is an architectural masterpiece that blends seamlessly into the cliff face overlooking Kandalama Lake. Surrounded by dense jungle and ancient rock, it offers a rare fusion of luxury hospitality and raw Sri Lankan wilderness. The hotel is an ideal base for visiting Sigiriya, Dambulla Cave Temple, and Minneriya National Park. Guests experience world-class dining, a spectacular infinity pool, and uninterrupted natural views.',
 'Geoffrey Bawa masterpiece nestled in jungle cliffs above Kandalama Lake.',
 'Dambulla Road, Kandalama', 'Dambulla', 'Matale',
 7.9231847, 80.7393682,
 '+94662284100', 'kandalama@heritancehotels.com', 5,
 '14:00:00', '12:00:00',
 'Swimming Pool,Wi-Fi,Restaurant,Bar,Spa,Gym,Room Service,Airport Transfer,Parking,24/7 Reception,Breakfast,Air Conditioning',
 'active', 1),

('The Fortress Resort & Spa', 'the-fortress-resort-spa',
 'Standing on the golden sands of Koggala Beach near Galle, The Fortress Resort & Spa evokes the iconic Dutch fortifications of the south coast. With just 53 suites set around a lagoon-style pool, this boutique luxury resort offers impeccable personalised service, world-class Ayurveda spa treatments, and direct beach access. Fine dining showcases the best of Sri Lankan and international cuisine using fresh local ingredients.',
 'Boutique luxury resort on Koggala Beach with a fortress-inspired design.',
 'Koggala Beach, Habaraduwa', 'Galle', 'Galle',
 5.9812374, 80.2437892,
 '+94912264950', 'reservations@thefortress.lk', 5,
 '15:00:00', '12:00:00',
 'Swimming Pool,Beach Access,Spa,Wi-Fi,Restaurant,Bar,Room Service,Airport Transfer,Parking,Gym,Breakfast,Air Conditioning,Water Sports',
 'active', 1),

('Jetwing Lighthouse', 'jetwing-lighthouse',
 'Perched dramatically on a headland between Galle and Unawatuna, Jetwing Lighthouse is a bold architectural statement by Geoffrey Bawa. The 64-room hotel commands sweeping views of the Indian Ocean and the historic Galle Fort. Interiors blend colonial grandeur with tropical elegance, featuring soaring ceilings, mosaic floors, and curated Sri Lankan art. The Cinnamon Room restaurant is widely regarded as one of the finest dining experiences on the south coast.',
 'Bold Bawa architecture commanding ocean views near historic Galle Fort.',
 'Dadella, Galle', 'Galle', 'Galle',
 6.0482341, 80.2123145,
 '+94912224021', 'lighthouse@jetwinghotels.com', 5,
 '14:00:00', '11:00:00',
 'Swimming Pool,Wi-Fi,Restaurant,Bar,Spa,Room Service,Parking,Airport Transfer,Breakfast,Air Conditioning,24/7 Reception,Gym',
 'active', 1),

('98 Acres Resort & Spa', '98-acres-resort-spa',
 '98 Acres Resort & Spa occupies a stunning hilltop estate in Ella surrounded by rolling tea plantations. Each villa and suite frames panoramic views of the Ella Gap, Little Adams Peak, and endless green hills. The resort blends rustic charm with contemporary luxury, featuring infinity pools that seem to merge with the mountain skyline, an Ayurveda spa, and an on-site tea factory experience. Hiking trails begin right at the property.',
 'Hilltop tea estate resort in Ella with breathtaking panoramic views.',
 'Upper Demodara Road, Ella', 'Ella', 'Badulla',
 6.8729834, 81.0463721,
 '+94572222797', 'reservations@98acresresort.com', 4,
 '14:00:00', '11:00:00',
 'Swimming Pool,Wi-Fi,Restaurant,Spa,Room Service,Parking,Breakfast,Air Conditioning,Hiking Trails,Tea Tours,24/7 Reception',
 'active', 1),

('Cinnamon Wild Yala', 'cinnamon-wild-yala',
 'Cinnamon Wild Yala places you at the doorstep of Yala National Park, Sri Lanka\'s most famous wildlife sanctuary. Luxurious chalets are designed to minimise environmental impact while maximising immersion in nature. Wake to the sounds of the jungle, embark on twice-daily game drives, and return to gourmet meals under the stars. Elephants, leopards, and peacocks are regular visitors to the property grounds.',
 'Eco-luxury chalets at the edge of Yala National Park.',
 'Palatupana, Yala', 'Tissamaharama', 'Hambantota',
 6.3782941, 81.5129834,
 '+94472239449', 'yala@cinnamonhotels.com', 4,
 '14:00:00', '11:00:00',
 'Swimming Pool,Wi-Fi,Restaurant,Bar,Room Service,Safari Jeep,Naturalist Guide,Parking,Breakfast,Air Conditioning,24/7 Reception',
 'active', 1),

('Amangalla', 'amangalla',
 'Amangalla occupies the former New Oriental Hotel within Galle Fort, a beautifully restored colonial mansion dating to 1684. With just 30 rooms and suites, the service is deeply personal and the atmosphere gloriously unhurried. Wooden floorboards, four-poster beds, plantation shutters, and a courtyard garden transport guests to another era. The Aman Spa offers signature treatments rooted in Sri Lanka\'s Ayurvedic healing traditions.',
 'Colonial masterpiece inside UNESCO-listed Galle Fort with Aman grace.',
 'Church Street, Galle Fort', 'Galle', 'Galle',
 6.0284731, 80.2167382,
 '+94912223388', 'amangalla@aman.com', 5,
 '15:00:00', '12:00:00',
 'Swimming Pool,Wi-Fi,Restaurant,Spa,Room Service,Airport Transfer,Breakfast,Air Conditioning,24/7 Reception,Yoga,Historical Tours',
 'active', 1),

('Amanwella', 'amanwella',
 'Amanwella graces a dramatic crescent beach at Tangalle, one of Sri Lanka\'s most beautiful and secluded stretches of coastline. Forty suites cascade down a forested hillside to a private golden beach, each featuring a private plunge pool and unobstructed Indian Ocean views. The architecture harmonises with the natural landscape, creating a seamless flow between indoor luxury and tropical outdoors.',
 'Secluded Aman resort on a private crescent beach at Tangalle.',
 'Bodhi Mawatha, Tangalle', 'Tangalle', 'Hambantota',
 6.0243891, 80.7392847,
 '+94472241333', 'amanwella@aman.com', 5,
 '15:00:00', '12:00:00',
 'Private Plunge Pool,Beach Access,Wi-Fi,Restaurant,Bar,Spa,Room Service,Airport Transfer,Breakfast,Air Conditioning,24/7 Reception,Water Sports',
 'active', 1),

('Shangri-La Colombo', 'shangri-la-colombo',
 'Shangri-La Colombo rises above the Indian Ocean in the heart of Sri Lanka\'s capital, offering a rare combination of city connectivity and resort-style luxury. The 500-room tower features multiple award-winning restaurants, a rooftop infinity pool overlooking the ocean, a world-class CHI Spa, and direct access to One Galle Face Mall. It is the preferred choice for business travellers and leisure guests alike seeking the pinnacle of Colombo hospitality.',
 'Iconic 5-star tower hotel in central Colombo with ocean views.',
 'One Galle Face, Colombo 02', 'Colombo', 'Colombo',
 6.9177482, 79.8473891,
 '+94112494494', 'slcol@shangri-la.com', 5,
 '15:00:00', '12:00:00',
 'Swimming Pool,Rooftop Pool,Wi-Fi,Restaurant,Bar,Spa,Gym,Room Service,Airport Transfer,Parking,Breakfast,Air Conditioning,24/7 Reception,Business Centre,Conference Rooms',
 'active', 1),

('Kelum''s Place Guest House', 'kelums-place-guesthouse',
 'A warm, family-run boutique guesthouse in the heart of Kandy, Kelum\'s Place offers comfortable, clean accommodation at excellent value. Surrounded by lush tropical gardens, it provides a peaceful sanctuary close to the Temple of the Sacred Tooth Relic, Kandy Lake, and the Royal Botanical Gardens. The owners offer personalised tour assistance, home-cooked Sri Lankan breakfasts, and insider tips on discovering authentic Kandy.',
 'Family-run boutique guesthouse in Kandy with home-cooked breakfasts.',
 '32 Rajapihilla Mawatha, Kandy', 'Kandy', 'Kandy',
 7.2961823, 80.6362478,
 '+94812234567', 'kelumsplace@gmail.com', 3,
 '13:00:00', '11:00:00',
 'Wi-Fi,Breakfast,Parking,Airport Transfer,Tour Assistance,Air Conditioning,24/7 Reception,Garden',
 'active', 1),

('Secret Ella Boutique Hotel', 'secret-ella-boutique-hotel',
 'Tucked into a misty hillside above Ella town, Secret Ella is a charming boutique hotel with just 12 rooms and a big personality. Every room has a balcony facing the Ella Gap and the surrounding tea country, offering some of the most spectacular sunrise views in Sri Lanka. The rooftop restaurant serves creative Sri Lankan fusion cuisine and is the perfect spot for sunset cocktails.',
 'Intimate 12-room hillside boutique with spectacular Ella Gap sunrise views.',
 'Passara Road, Ella', 'Ella', 'Badulla',
 6.8689234, 81.0471823,
 '+94772345678', 'hello@secretella.lk', 3,
 '13:00:00', '10:30:00',
 'Wi-Fi,Restaurant,Bar,Breakfast,Air Conditioning,Rooftop Terrace,Hiking Trails,Tour Assistance,24/7 Reception',
 'active', 1);

-- ============================================================
-- SAMPLE DATA — Rooms (3+ rooms per hotel)
-- ============================================================

-- Heritance Kandalama (hotel_id = 1)
INSERT INTO hotel_rooms (hotel_id, room_name, description, capacity, beds, bed_type, facilities, price_per_night, available_count, status) VALUES
(1, 'Jungle View Room', 'Wake up to misty jungle views from your private balcony. Warm teak interiors and curated Sri Lankan artefacts create a refined sense of place.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Balcony,Flat-screen TV,Room Service,En-suite Bathroom', 28500.00, 8, 'active'),
(1, 'Lake View Suite', 'Expansive suite with panoramic views of Kandalama Lake and surrounding forest canopy. Features a generous lounge area and outdoor bathtub.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Balcony,Lounge Area,Outdoor Bathtub,Flat-screen TV,Room Service', 55000.00, 4, 'active'),
(1, 'Family Room', 'Spacious family room with interconnecting option, featuring bunk beds for children and a king bed for parents. Jungle-facing balcony.', 4, 3, 'King + Bunk', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Balcony,Flat-screen TV,Room Service,En-suite Bathroom,Children Amenities', 38000.00, 3, 'active'),
(1, 'Presidential Suite', 'The pinnacle of jungle luxury — a two-bedroom suite with a private plunge pool, butler service, and 270-degree views of the surrounding wilderness.', 4, 2, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Private Plunge Pool,Butler Service,Lounge Area,Dining Area,Flat-screen TV,Premium Toiletries', 145000.00, 1, 'active');

-- The Fortress Resort & Spa (hotel_id = 2)
INSERT INTO hotel_rooms (hotel_id, room_name, description, capacity, beds, bed_type, facilities, price_per_night, available_count, status) VALUES
(2, 'Fortress Suite', 'Elegant suite with hand-crafted timber doors and private garden terrace. Overlooks the sculpted courtyard gardens.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Garden Terrace,Flat-screen TV,Room Service,En-suite Bathroom,Rainfall Shower', 32000.00, 6, 'active'),
(2, 'Ocean Suite', 'Beachfront suite with direct sand access and panoramic Indian Ocean views. Features an outdoor day bed and private deck.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Ocean View,Private Deck,Outdoor Day Bed,Flat-screen TV,Room Service,Beach Access', 58000.00, 4, 'active'),
(2, 'Premium Ocean Suite', 'The most coveted room in the resort — a sprawling corner suite with a private plunge pool and 180-degree ocean views.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Private Plunge Pool,Ocean View,Butler Service,Flat-screen TV,Premium Toiletries,Room Service', 110000.00, 2, 'active');

-- Jetwing Lighthouse (hotel_id = 3)
INSERT INTO hotel_rooms (hotel_id, room_name, description, capacity, beds, bed_type, facilities, price_per_night, available_count, status) VALUES
(3, 'Superior Room', 'Thoughtfully designed rooms with Bawa-inspired tropical interiors and views of the hotel gardens and coastal landscape.', 2, 1, 'Queen', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Flat-screen TV,Room Service,En-suite Bathroom', 18500.00, 10, 'active'),
(3, 'Deluxe Ocean Room', 'Elevated rooms commanding sweeping ocean views. Watch the sun dip into the Indian Ocean from your own private balcony.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Ocean View Balcony,Flat-screen TV,Room Service,En-suite Bathroom', 28000.00, 8, 'active'),
(3, 'Bawa Suite', 'Named in honour of the architect himself, this grand suite captures the essence of tropical modernism with signature Bawa furniture and ocean panoramas.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Ocean View Balcony,Lounge Area,Flat-screen TV,Butler Service,Premium Toiletries,Room Service', 72000.00, 2, 'active');

-- 98 Acres Resort & Spa (hotel_id = 4)
INSERT INTO hotel_rooms (hotel_id, room_name, description, capacity, beds, bed_type, facilities, price_per_night, available_count, status) VALUES
(4, 'Tea Garden Room', 'Cosy rooms nestled among the tea bushes with valley views and a private terrace perfect for morning tea tastings.', 2, 1, 'Double', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Terrace,Flat-screen TV,Room Service,En-suite Bathroom', 14500.00, 6, 'active'),
(4, 'Ella Gap Suite', 'Premium hillside suite with floor-to-ceiling windows framing the spectacular Ella Gap. Separate living area with fireplace.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Panoramic View,Fireplace,Living Area,Flat-screen TV,Room Service,En-suite Bathroom', 29000.00, 4, 'active'),
(4, 'Infinity Pool Suite', 'Exclusive suite with private access to an infinity pool seemingly floating above the valley, delivering the ultimate Ella sunrise experience.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Private Infinity Pool,Panoramic View,Flat-screen TV,Butler Service,Premium Toiletries,Room Service', 68000.00, 2, 'active');

-- Cinnamon Wild Yala (hotel_id = 5)
INSERT INTO hotel_rooms (hotel_id, room_name, description, capacity, beds, bed_type, facilities, price_per_night, available_count, status) VALUES
(5, 'Jungle Chalet', 'Elevated timber chalet with screened deck overlooking the scrub jungle. Naturalist-designed interiors connect you to the wilderness.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Jungle View Deck,Flat-screen TV,Room Service,En-suite Bathroom', 22000.00, 8, 'active'),
(5, 'Family Chalet', 'Spacious chalet accommodating families of four with two bedrooms, a shared veranda, and premium wildlife-watching positioning.', 4, 2, 'King + Twin', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Family Veranda,Flat-screen TV,Room Service,En-suite Bathroom,Children Amenities', 38000.00, 3, 'active'),
(5, 'Wild Suite', 'The signature suite — a sprawling private villa with an outdoor bathtub under the stars and a wraparound deck where wildlife roams freely.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Outdoor Bathtub,Private Deck,Flat-screen TV,Butler Service,Premium Toiletries,Room Service', 85000.00, 2, 'active');

-- Amangalla (hotel_id = 6)
INSERT INTO hotel_rooms (hotel_id, room_name, description, capacity, beds, bed_type, facilities, price_per_night, available_count, status) VALUES
(6, 'Garden Room', 'Serene colonial-era rooms with plantation shutters, four-poster beds, and views of the courtyard garden. Original timber floors.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Garden View,Four-Poster Bed,Flat-screen TV,Room Service,En-suite Bathroom,Premium Toiletries', 65000.00, 6, 'active'),
(6, 'Fort Suite', 'Grand suite in the historic wing with original colonial architecture, a private sitting room, and privileged access to Galle Fort\'s quietest lanes.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Fort View,Private Sitting Room,Four-Poster Bed,Flat-screen TV,Butler Service,Premium Toiletries,Room Service', 130000.00, 3, 'active');

-- Amanwella (hotel_id = 7)
INSERT INTO hotel_rooms (hotel_id, room_name, description, capacity, beds, bed_type, facilities, price_per_night, available_count, status) VALUES
(7, 'Suite with Pool', 'Freestanding suites cascading down the hillside to the beach, each with a private 10-metre plunge pool and unobstructed ocean horizon.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Private Plunge Pool,Ocean View,Flat-screen TV,Butler Service,Premium Toiletries,Room Service,Beach Access', 180000.00, 8, 'active'),
(7, 'Beach Suite', 'Ground-floor suites with the most direct beach access in the resort. Step from your bedroom straight onto powdery white sand.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Direct Beach Access,Private Terrace,Flat-screen TV,Butler Service,Premium Toiletries,Room Service', 210000.00, 3, 'active');

-- Shangri-La Colombo (hotel_id = 8)
INSERT INTO hotel_rooms (hotel_id, room_name, description, capacity, beds, bed_type, facilities, price_per_night, available_count, status) VALUES
(8, 'Deluxe Room', 'Contemporary rooms with floor-to-ceiling windows offering city or ocean views. Shangri-La signature bed and premium amenities.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,City/Ocean View,Flat-screen TV,Room Service,En-suite Bathroom,Premium Toiletries', 32000.00, 20, 'active'),
(8, 'Ocean View Room', 'Premium rooms positioned for direct Indian Ocean views across the Colombo harbour. Ideal for sunset watching from your room.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Ocean View,Flat-screen TV,Room Service,En-suite Bathroom,Premium Toiletries,Turndown Service', 48000.00, 12, 'active'),
(8, 'Horizon Club Suite', 'Exclusive suites with access to the Horizon Club lounge for daily breakfast, cocktail hour, and personalised concierge service.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,Ocean View,Club Lounge Access,Butler Service,Flat-screen TV,Premium Toiletries,Room Service,Turndown Service', 85000.00, 5, 'active'),
(8, 'Family Deluxe Room', 'Generous interconnecting rooms designed for families with extra beds, safety features, and children\'s amenity packs.', 4, 2, 'King + Twin', 'Air Conditioning,Wi-Fi,Mini Bar,Safe,City View,Flat-screen TV,Room Service,En-suite Bathroom,Children Amenities', 58000.00, 6, 'active');

-- Kelum's Place (hotel_id = 9)
INSERT INTO hotel_rooms (hotel_id, room_name, description, capacity, beds, bed_type, facilities, price_per_night, available_count, status) VALUES
(9, 'Standard Room', 'Clean, comfortable rooms with garden views and private en-suite. Exactly what the independent traveller needs in Kandy.', 2, 1, 'Double', 'Air Conditioning,Wi-Fi,En-suite Bathroom,Flat-screen TV', 6500.00, 4, 'active'),
(9, 'Deluxe Double', 'Larger rooms with a small sitting area, balcony overlooking the garden, and upgraded bedding and bathroom amenities.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Balcony,En-suite Bathroom,Flat-screen TV,Tea/Coffee Maker', 9500.00, 3, 'active'),
(9, 'Family Room', 'Family-sized room accommodating two adults and two children with twin beds added. Garden-facing balcony with Kandy hills view.', 4, 2, 'Double + Twin', 'Air Conditioning,Wi-Fi,Balcony,En-suite Bathroom,Flat-screen TV,Children Amenities', 14000.00, 2, 'active');

-- Secret Ella (hotel_id = 10)
INSERT INTO hotel_rooms (hotel_id, room_name, description, capacity, beds, bed_type, facilities, price_per_night, available_count, status) VALUES
(10, 'Valley View Room', 'Cosy hillside rooms with a private balcony perfectly positioned for sunrise views across the Ella Gap and Uva tea country.', 2, 1, 'Double', 'Wi-Fi,Balcony,En-suite Bathroom,Flat-screen TV,Tea/Coffee Maker', 8500.00, 5, 'active'),
(10, 'Panorama Suite', 'The top-floor suite with a wrap-around balcony offering 270-degree views — Ella Rock, Little Adams Peak, and the tea-carpeted valley.', 2, 1, 'King', 'Air Conditioning,Wi-Fi,Wrap-around Balcony,En-suite Bathroom,Flat-screen TV,Mini Bar,Lounge Area', 16500.00, 2, 'active');

-- ============================================================
-- SAMPLE DATA — Bookings (demo records)
-- ============================================================
INSERT INTO bookings (booking_ref, user_id, hotel_id, room_id, checkin_date, checkout_date, nights, guests, rooms_booked, price_per_night, total_amount, status) VALUES
('EL-20260001', 2, 1, 1, '2026-08-10', '2026-08-13', 3, 2, 1, 28500.00, 85500.00, 'completed'),
('EL-20260002', 3, 4, 7, '2026-08-15', '2026-08-18', 3, 2, 1, 14500.00, 43500.00, 'completed'),
('EL-20260003', 4, 8, 16, '2026-09-01', '2026-09-03', 2, 2, 1, 32000.00, 64000.00, 'completed'),
('EL-20260004', 5, 2, 5, '2026-09-20', '2026-09-24', 4, 2, 1, 32000.00, 128000.00, 'confirmed'),
('EL-20260005', 6, 10, 23, '2026-09-25', '2026-09-28', 3, 2, 1, 8500.00, 25500.00, 'pending'),
('EL-20260006', 7, 9, 20, '2026-10-05', '2026-10-08', 3, 2, 1, 6500.00, 19500.00, 'confirmed'),
('EL-20260007', 2, 3, 8, '2026-10-15', '2026-10-17', 2, 2, 1, 18500.00, 37000.00, 'pending');

-- ============================================================
-- SAMPLE DATA — Reviews (from completed bookings)
-- ============================================================
INSERT INTO hotel_reviews (booking_id, hotel_id, user_id, overall_rating, cleanliness, service, location, facilities, value_for_money, title, comment, status) VALUES
(1, 1, 2, 5, 5, 5, 5, 5, 4, 'An unforgettable jungle escape',
 'Heritance Kandalama exceeded every expectation. Waking up to the jungle mist rolling across the lake was absolutely magical. Geoffrey Bawa''s genius is evident in every corner. The infinity pool overlooking the valley is the best in Sri Lanka. Staff were incredibly attentive without being intrusive. Highly recommend the full-board option — the restaurant is outstanding.',
 'approved'),
(2, 4, 3, 5, 5, 5, 5, 4, 5, 'Best sunrise in Sri Lanka',
 'The Ella Gap suite at 98 Acres gave us the most spectacular sunrise we have ever seen. Tea estate views from every window, a private terrace perfect for morning tea, and an Ayurveda massage that left us completely rejuvenated. The staff remembered our names from day one. Worth every rupee.',
 'approved'),
(3, 8, 4, 4, 4, 5, 5, 4, 3, 'Colombo luxury done right',
 'Shangri-La Colombo is the premier business hotel in the city by a significant margin. The room views are stunning and the breakfast spread is extraordinary. Service is professional and genuinely warm. The CHI Spa needs a visit if you have time. My only minor note is that the city-side rooms are a touch expensive for what you get — request an ocean-facing room.',
 'approved');
