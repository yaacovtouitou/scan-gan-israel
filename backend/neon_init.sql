-- SCHEMA COMPATIBLE POSTGRESQL (NEON)

CREATE TABLE administrateurs (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  camp VARCHAR(50) NOT NULL
);

INSERT INTO administrateurs (username, mot_de_passe, camp) VALUES
('admin_alpha', 'password123', 'Camp Alpha'),
('admin_beta', 'password123', 'Camp Beta'),
('admin_gamma', 'password123', 'Camp Gamma');

CREATE TABLE cadeaux (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prix INTEGER NOT NULL,
  stock INTEGER DEFAULT 0
);

INSERT INTO cadeaux (nom, prix, stock) VALUES
('Casquette', 50, 20),
('T-shirt', 100, 10),
('Gourde', 30, 40),
('Stylo', 5, 100),
('Carnet', 15, 60),
('Sac à dos', 150, 5),
('Ballon de foot', 40, 25),
('Lunettes de soleil', 60, 15),
('Bracelet souvenir', 10, 80),
('Mug', 35, 30),
('Jeu de cartes', 25, 45),
('Glace', 10, 100),
('Peluche', 70, 12),
('Livre de jeux', 20, 50),
('Playstation5', 160, 4),
('xboc', 250, 2);

CREATE TABLE camp_config (
  camp VARCHAR(100) PRIMARY KEY,
  missions TEXT NOT NULL
);

INSERT INTO camp_config (camp, missions) VALUES
('Camp Alpha', '{"M1":"Alpha Mission 1","M2":"Alpha Mission 2","M3":"Alpha Mission 3"}');

CREATE TABLE enfants (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(20) UNIQUE NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  camp VARCHAR(50) DEFAULT NULL,
  solde INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_scan TIMESTAMP DEFAULT NULL,
  dollars INTEGER DEFAULT 0,
  admin_data TEXT
);

INSERT INTO enfants (uid, nom, prenom, camp, solde, created_at, last_scan, dollars, admin_data) VALUES
('12345678', 'Cohen', 'Levi', 'Camp Alpha', 2500, '2026-06-15 08:59:10', '2026-06-17 12:27:08', 50, NULL),
('87654321', 'Levy', 'Sarah', 'Camp Alpha', 165, '2026-06-15 08:59:10', '2026-06-17 09:41:16', 25, NULL),
('A1B2C3D4', 'Martin', 'Lucas', 'Camp Alpha', 50, '2026-06-15 09:00:00', NULL, 0, NULL),
('E5F6G7H8', 'Bernard', 'Emma', 'Camp Alpha', 150, '2026-06-15 09:05:00', NULL, 0, NULL),
('I9J0K1L2', 'Thomas', 'Hugo', 'Camp Alpha', 300, '2026-06-15 09:10:00', NULL, 0, NULL),
('M3N4O5P6', 'Petit', 'Chloé', 'Camp Alpha', 80, '2026-06-15 09:15:00', NULL, 0, NULL),
('Q7R8S9T0', 'Robert', 'Louis', 'Camp Beta', 20, '2026-06-15 09:20:00', NULL, 0, NULL),
('U1V2W3X4', 'Richard', 'Léa', 'Camp Beta', 250, '2026-06-15 09:25:00', NULL, 0, NULL),
('Y5Z6A7B8', 'Durand', 'Arthur', 'Camp Beta', 110, '2026-06-15 09:30:00', NULL, 0, NULL),
('C9D0E1F2', 'Dubois', 'Manon', 'Camp Beta', 5, '2026-06-15 09:35:00', NULL, 0, NULL),
('G3H4I5J6', 'Moreau', 'Jules', 'Camp Beta', 439, '2026-06-15 09:40:00', NULL, 60, '{"missions":{"M2":true,"M3":true,"M1":true},"bonusHistory":[],"lastActivity":1781721867806}'),
('K7L8M9N0', 'Simon', 'Camille', 'Camp Beta', 75, '2026-06-15 09:45:00', NULL, 0, NULL),
('O1P2Q3R4', 'Laurent', 'Gabriel', 'Camp Gamma', 130, '2026-06-15 09:50:00', NULL, 0, NULL),
('S5T6U7V8', 'Michel', 'Zoé', 'Camp Gamma', 90, '2026-06-15 09:55:00', NULL, 0, NULL),
('W9X0Y1Z2', 'Garcia', 'Raphaël', 'Camp Gamma', 320, '2026-06-15 10:00:00', NULL, 0, NULL),
('XX99YY88', 'Roux', 'Alice', 'Camp Gamma', 0, '2026-06-16 08:00:00', NULL, 0, NULL),
('ZZ77WW66', 'Fournier', 'Léo', 'Camp Gamma', 45, '2026-06-16 08:15:00', NULL, 0, '{"missions":{"M3":false},"bonusHistory":[],"lastActivity":1781695678761}'),
('1322324', 'Rap', 'Lenny', 'Camp Gamma', 78, '2026-06-17 11:10:13', NULL, 120, '{"missions":{"M12":true,"M13":true,"M2":true,"M1":true,"M4":true,"M5":true},"bonusHistory":[],"lastActivity":1781694655183}');

CREATE TABLE historique (
  id SERIAL PRIMARY KEY,
  enfant_id INTEGER NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
  type VARCHAR(10) CHECK (type IN ('ACHAT','AJOUT','RETRAIT')) NOT NULL,
  points INTEGER NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO historique (enfant_id, type, points, description, date_action) VALUES
(2, 'ACHAT', 50, 'Casquette', '2026-06-15 11:46:32'),
(1, 'ACHAT', 70, 'Casquette, Porte-clÃ©', '2026-06-15 11:46:56'),
(1, 'ACHAT', 20, 'Porte-clÃ©', '2026-06-15 11:53:47'),
(3, 'AJOUT', 100, 'Victoire tournoi de foot', '2026-06-16 10:00:00'),
(4, 'ACHAT', 30, 'Gourde', '2026-06-16 10:15:00'),
(5, 'AJOUT', 50, 'Bon comportement', '2026-06-16 10:30:00'),
(6, 'ACHAT', 10, 'Bracelet souvenir', '2026-06-16 10:45:00'),
(7, 'RETRAIT', 20, 'Pénalité retard rassemblement', '2026-06-16 11:00:00'),
(8, 'ACHAT', 150, 'Sac à dos', '2026-06-16 11:15:00'),
(9, 'AJOUT', 30, 'Aide rangement réfectoire', '2026-06-16 11:30:00'),
(10, 'ACHAT', 5, 'Stylo', '2026-06-16 11:45:00'),
(11, 'AJOUT', 200, 'Gagnant grand jeu de piste', '2026-06-16 12:00:00'),
(12, 'ACHAT', 60, 'Lunettes de soleil', '2026-06-16 14:00:00'),
(13, 'ACHAT', 40, 'Ballon de foot', '2026-06-16 14:15:00'),
(14, 'AJOUT', 100, 'Participation exceptionnelle atelier', '2026-06-16 14:30:00'),
(15, 'ACHAT', 25, 'Jeu de cartes', '2026-06-16 14:45:00'),
(3, 'ACHAT', 15, 'Carnet', '2026-06-16 15:00:00'),
(4, 'AJOUT', 20, 'Gagnant quiz du soir', '2026-06-16 15:15:00'),
(5, 'ACHAT', 35, 'Mug', '2026-06-16 15:30:00'),
(2, 'AJOUT', 50, 'Inspection des chambres parfaite', '2026-06-16 15:45:00'),
(1, 'ACHAT', 10, 'Glace', '2026-06-16 16:00:00'),
(16, 'AJOUT', 10, 'Cadeau de bienvenue', '2026-06-16 16:15:00'),
(17, 'AJOUT', 50, 'Aide animateur', '2026-06-16 16:30:00'),
(11, 'ACHAT', 70, 'Peluche', '2026-06-16 16:45:00'),
(6, 'RETRAIT', 10, 'Oubli de matériel', '2026-06-16 17:00:00'),
(2, 'ACHAT', 35, 'Stylo, Bracelet souvenir, Livre de jeux', '2026-06-16 18:01:33'),
(1, 'ACHAT', 25, 'Glace, Bracelet souvenir, Stylo', '2026-06-16 18:25:52');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'animateur',
  club VARCHAR(100) DEFAULT 'sarcelles',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, password, role, club) VALUES
('admin', 'admin', 'admin', 'sarcelles'),
('alpha', 'alpha', 'animateur', 'Camp Alpha'),
('beta', 'beta', 'animateur', 'Camp Beta'),
('gamma', 'gamma', 'animateur', 'Camp Gamma');
