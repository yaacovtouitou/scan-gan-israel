-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : db
-- Généré le : mer. 17 juin 2026 à 19:12
-- Version du serveur : 8.0.43
-- Version de PHP : 8.3.31

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `camp_nfc`
--

-- --------------------------------------------------------

--
-- Structure de la table `administrateurs`
--

CREATE TABLE `administrateurs` (
  `id` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `camp` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `administrateurs`
--

INSERT INTO `administrateurs` (`id`, `username`, `mot_de_passe`, `camp`) VALUES
(1, 'admin_alpha', 'password123', 'Camp Alpha'),
(2, 'admin_beta', 'password123', 'Camp Beta'),
(3, 'admin_gamma', 'password123', 'Camp Gamma');

-- --------------------------------------------------------

--
-- Structure de la table `cadeaux`
--

CREATE TABLE `cadeaux` (
  `id` int NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prix` int NOT NULL,
  `stock` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `cadeaux`
--

INSERT INTO `cadeaux` (`id`, `nom`, `prix`, `stock`) VALUES
(2, 'Casquette', 50, 20),
(3, 'T-shirt', 100, 10),
(4, 'Gourde', 30, 40),
(5, 'Stylo', 5, 100),
(6, 'Carnet', 15, 60),
(7, 'Sac à dos', 150, 5),
(8, 'Ballon de foot', 40, 25),
(9, 'Lunettes de soleil', 60, 15),
(10, 'Bracelet souvenir', 10, 80),
(11, 'Mug', 35, 30),
(12, 'Jeu de cartes', 25, 45),
(13, 'Glace', 10, 100),
(14, 'Peluche', 70, 12),
(15, 'Livre de jeux', 20, 50),
(16, 'Playstation5', 160, 4),
(17, 'xboc', 250, 2);

-- --------------------------------------------------------

--
-- Structure de la table `camp_config`
--

CREATE TABLE `camp_config` (
  `camp` varchar(100) NOT NULL,
  `missions` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `camp_config`
--

INSERT INTO `camp_config` (`camp`, `missions`) VALUES
('Camp Alpha', '{\"M1\":\"Alpha Mission 1\",\"M2\":\"Alpha Mission 2\",\"M3\":\"Alpha Mission 3\"}');

-- --------------------------------------------------------

--
-- Structure de la table `enfants`
--

CREATE TABLE `enfants` (
  `id` int NOT NULL,
  `uid` varchar(20) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `camp` varchar(50) DEFAULT NULL,
  `solde` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_scan` timestamp NULL DEFAULT NULL,
  `dollars` int DEFAULT '0',
  `admin_data` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `enfants`
--

INSERT INTO `enfants` (`id`, `uid`, `nom`, `prenom`, `camp`, `solde`, `created_at`, `last_scan`, `dollars`, `admin_data`) VALUES
(1, '12345678', 'Cohen', 'Levi', 'Camp Alpha', 2500, '2026-06-15 08:59:10', '2026-06-17 12:27:08', 50, NULL),
(2, '87654321', 'Levy', 'Sarah', 'Camp Alpha', 165, '2026-06-15 08:59:10', '2026-06-17 09:41:16', 25, NULL),
(3, 'A1B2C3D4', 'Martin', 'Lucas', 'Camp Alpha', 50, '2026-06-15 09:00:00', NULL, 0, NULL),
(4, 'E5F6G7H8', 'Bernard', 'Emma', 'Camp Alpha', 150, '2026-06-15 09:05:00', NULL, 0, NULL),
(5, 'I9J0K1L2', 'Thomas', 'Hugo', 'Camp Alpha', 300, '2026-06-15 09:10:00', NULL, 0, NULL),
(6, 'M3N4O5P6', 'Petit', 'Chloé', 'Camp Alpha', 80, '2026-06-15 09:15:00', NULL, 0, NULL),
(7, 'Q7R8S9T0', 'Robert', 'Louis', 'Camp Beta', 20, '2026-06-15 09:20:00', NULL, 0, NULL),
(8, 'U1V2W3X4', 'Richard', 'Léa', 'Camp Beta', 250, '2026-06-15 09:25:00', NULL, 0, NULL),
(9, 'Y5Z6A7B8', 'Durand', 'Arthur', 'Camp Beta', 110, '2026-06-15 09:30:00', NULL, 0, NULL),
(10, 'C9D0E1F2', 'Dubois', 'Manon', 'Camp Beta', 5, '2026-06-15 09:35:00', NULL, 0, NULL),
(11, 'G3H4I5J6', 'Moreau', 'Jules', 'Camp Beta', 439, '2026-06-15 09:40:00', NULL, 60, '{\"missions\":{\"M2\":true,\"M3\":true,\"M1\":true},\"bonusHistory\":[],\"lastActivity\":1781721867806}'),
(12, 'K7L8M9N0', 'Simon', 'Camille', 'Camp Beta', 75, '2026-06-15 09:45:00', NULL, 0, NULL),
(13, 'O1P2Q3R4', 'Laurent', 'Gabriel', 'Camp Gamma', 130, '2026-06-15 09:50:00', NULL, 0, NULL),
(14, 'S5T6U7V8', 'Michel', 'Zoé', 'Camp Gamma', 90, '2026-06-15 09:55:00', NULL, 0, NULL),
(15, 'W9X0Y1Z2', 'Garcia', 'Raphaël', 'Camp Gamma', 320, '2026-06-15 10:00:00', NULL, 0, NULL),
(16, 'XX99YY88', 'Roux', 'Alice', 'Camp Gamma', 0, '2026-06-16 08:00:00', NULL, 0, NULL),
(17, 'ZZ77WW66', 'Fournier', 'Léo', 'Camp Gamma', 45, '2026-06-16 08:15:00', NULL, 0, '{\"missions\":{\"M3\":false},\"bonusHistory\":[],\"lastActivity\":1781695678761}'),
(18, '1322324', 'Rap', 'Lenny', 'Camp Gamma', 78, '2026-06-17 11:10:13', NULL, 120, '{\"missions\":{\"M12\":true,\"M13\":true,\"M2\":true,\"M1\":true,\"M4\":true,\"M5\":true},\"bonusHistory\":[],\"lastActivity\":1781694655183}');

-- --------------------------------------------------------

--
-- Structure de la table `historique`
--

CREATE TABLE `historique` (
  `id` int NOT NULL,
  `enfant_id` int NOT NULL,
  `type` enum('ACHAT','AJOUT','RETRAIT') NOT NULL,
  `points` int NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `date_action` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `historique`
--

INSERT INTO `historique` (`id`, `enfant_id`, `type`, `points`, `description`, `date_action`) VALUES
(1, 2, 'ACHAT', 50, 'Casquette', '2026-06-15 11:46:32'),
(2, 1, 'ACHAT', 70, 'Casquette, Porte-clÃ©', '2026-06-15 11:46:56'),
(3, 1, 'ACHAT', 20, 'Porte-clÃ©', '2026-06-15 11:53:47'),
(4, 3, 'AJOUT', 100, 'Victoire tournoi de foot', '2026-06-16 10:00:00'),
(5, 4, 'ACHAT', 30, 'Gourde', '2026-06-16 10:15:00'),
(6, 5, 'AJOUT', 50, 'Bon comportement', '2026-06-16 10:30:00'),
(7, 6, 'ACHAT', 10, 'Bracelet souvenir', '2026-06-16 10:45:00'),
(8, 7, 'RETRAIT', 20, 'Pénalité retard rassemblement', '2026-06-16 11:00:00'),
(9, 8, 'ACHAT', 150, 'Sac à dos', '2026-06-16 11:15:00'),
(10, 9, 'AJOUT', 30, 'Aide rangement réfectoire', '2026-06-16 11:30:00'),
(11, 10, 'ACHAT', 5, 'Stylo', '2026-06-16 11:45:00'),
(12, 11, 'AJOUT', 200, 'Gagnant grand jeu de piste', '2026-06-16 12:00:00'),
(13, 12, 'ACHAT', 60, 'Lunettes de soleil', '2026-06-16 14:00:00'),
(14, 13, 'ACHAT', 40, 'Ballon de foot', '2026-06-16 14:15:00'),
(15, 14, 'AJOUT', 100, 'Participation exceptionnelle atelier', '2026-06-16 14:30:00'),
(16, 15, 'ACHAT', 25, 'Jeu de cartes', '2026-06-16 14:45:00'),
(17, 3, 'ACHAT', 15, 'Carnet', '2026-06-16 15:00:00'),
(18, 4, 'AJOUT', 20, 'Gagnant quiz du soir', '2026-06-16 15:15:00'),
(19, 5, 'ACHAT', 35, 'Mug', '2026-06-16 15:30:00'),
(20, 2, 'AJOUT', 50, 'Inspection des chambres parfaite', '2026-06-16 15:45:00'),
(21, 1, 'ACHAT', 10, 'Glace', '2026-06-16 16:00:00'),
(22, 16, 'AJOUT', 10, 'Cadeau de bienvenue', '2026-06-16 16:15:00'),
(23, 17, 'AJOUT', 50, 'Aide animateur', '2026-06-16 16:30:00'),
(24, 11, 'ACHAT', 70, 'Peluche', '2026-06-16 16:45:00'),
(25, 6, 'RETRAIT', 10, 'Oubli de matériel', '2026-06-16 17:00:00'),
(26, 2, 'ACHAT', 35, 'Stylo, Bracelet souvenir, Livre de jeux', '2026-06-16 18:01:33'),
(27, 1, 'ACHAT', 25, 'Glace, Bracelet souvenir, Stylo', '2026-06-16 18:25:52');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'animateur',
  `club` varchar(100) DEFAULT 'sarcelles',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`, `club`, `created_at`) VALUES
(1, 'admin', 'admin', 'admin', 'sarcelles', '2026-06-17 16:06:31'),
(2, 'alpha', 'alpha', 'animateur', 'Camp Alpha', '2026-06-17 16:06:31'),
(3, 'beta', 'beta', 'animateur', 'Camp Beta', '2026-06-17 16:06:31'),
(4, 'gamma', 'gamma', 'animateur', 'Camp Gamma', '2026-06-17 16:06:31');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `administrateurs`
--
ALTER TABLE `administrateurs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Index pour la table `cadeaux`
--
ALTER TABLE `cadeaux`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `camp_config`
--
ALTER TABLE `camp_config`
  ADD PRIMARY KEY (`camp`);

--
-- Index pour la table `enfants`
--
ALTER TABLE `enfants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uid` (`uid`);

--
-- Index pour la table `historique`
--
ALTER TABLE `historique`
  ADD PRIMARY KEY (`id`),
  ADD KEY `enfant_id` (`enfant_id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `administrateurs`
--
ALTER TABLE `administrateurs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `cadeaux`
--
ALTER TABLE `cadeaux`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT pour la table `enfants`
--
ALTER TABLE `enfants`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT pour la table `historique`
--
ALTER TABLE `historique`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `historique`
--
ALTER TABLE `historique`
  ADD CONSTRAINT `historique_ibfk_1` FOREIGN KEY (`enfant_id`) REFERENCES `enfants` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
