CREATE DATABASE IF NOT EXISTS camp_nfc;
USE camp_nfc;

CREATE TABLE IF NOT EXISTS enfants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(20) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    solde INT DEFAULT 0,
    dollars INT DEFAULT 0,
    admin_data TEXT DEFAULT NULL,
    last_scan TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cadeaux (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prix INT NOT NULL,
    stock INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS historique (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enfant_id INT NOT NULL,
    type ENUM('ACHAT', 'AJOUT', 'RETRAIT') NOT NULL,
    points INT NOT NULL,
    description VARCHAR(255),
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enfant_id) REFERENCES enfants(id)
);

-- Insertion de données de test
INSERT INTO enfants (uid, nom, prenom, solde, dollars) VALUES 
('12345678', 'Cohen', 'Levi', 100, 50),
('87654321', 'Levy', 'Sarah', 50, 25);

INSERT INTO cadeaux (nom, prix, stock) VALUES 
('Porte-clé', 20, 50),
('Casquette', 50, 20),
('T-shirt', 100, 10);

-- Table des administrateurs / animateurs
CREATE TABLE IF NOT EXISTS administrateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    camp VARCHAR(100) DEFAULT NULL
);

-- Table de configuration des missions par camp
CREATE TABLE IF NOT EXISTS camp_config (
    camp VARCHAR(100) PRIMARY KEY,
    missions TEXT NOT NULL
);

-- Insertion des administrateurs par défaut
INSERT IGNORE INTO administrateurs (username, mot_de_passe, camp) VALUES 
('admin', 'admin', 'all'),
('admin_alpha', 'password123', 'Camp Alpha'),
('admin_beta', 'password123', 'Camp Beta'),
('admin_gamma', 'password123', 'Camp Gamma');

