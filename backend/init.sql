CREATE DATABASE IF NOT EXISTS camp_nfc;
USE camp_nfc;

CREATE TABLE IF NOT EXISTS enfants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(20) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    solde INT DEFAULT 0,
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
INSERT INTO enfants (uid, nom, prenom, solde) VALUES 
('12345678', 'Cohen', 'Levi', 100),
('87654321', 'Levy', 'Sarah', 50);

INSERT INTO cadeaux (nom, prix, stock) VALUES 
('Porte-clé', 20, 50),
('Casquette', 50, 20),
('T-shirt', 100, 10);
