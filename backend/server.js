const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('Erreur de connexion MySQL:', err);
        return;
    }
    console.log('Connecté à la base de données MySQL.');

    // S'assurer que les tables users et camp_config existent
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'animateur',
            club VARCHAR(100) DEFAULT NULL
        );
    `;
    db.query(createUsersTable, (err) => {
        if (err) console.error('Erreur création table users:', err);
        else {
            // Insertion des utilisateurs de test (INSERT IGNORE pour s'assurer que tous les comptes par défaut sont présents)
            db.query(`
                INSERT IGNORE INTO users (username, password, role, club) VALUES 
                ('admin', 'admin', 'admin', 'sarcelles'),
                ('alpha', 'alpha', 'animateur', 'Camp Alpha'),
                ('beta', 'beta', 'animateur', 'Camp Beta'),
                ('gamma', 'gamma', 'animateur', 'Camp Gamma'),
                ('admin_alpha', 'password123', 'animateur', 'Camp Alpha'),
                ('admin_beta', 'password123', 'animateur', 'Camp Beta'),
                ('admin_gamma', 'password123', 'animateur', 'Camp Gamma')
            `, (err) => {
                if (err) console.error('Erreur insertion utilisateurs de test:', err);
                else console.log('Utilisateurs de test insérés ou déjà existants.');
            });
        }
    });

    const createConfigTable = `
        CREATE TABLE IF NOT EXISTS camp_config (
            camp VARCHAR(100) PRIMARY KEY,
            missions TEXT NOT NULL
        );
    `;
    db.query(createConfigTable, (err) => {
        if (err) console.error('Erreur création table camp_config:', err);
    });
});

// GET enfant by UID
app.get('/api/enfant/:uid', (req, res) => {
    const { uid } = req.params;
    db.query('SELECT * FROM enfants WHERE uid = ?', [uid], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: 'Enfant non trouvé' });
        
        const enfant = results[0];
        
        // Mettre à jour la date du dernier scan
        db.query('UPDATE enfants SET last_scan = CURRENT_TIMESTAMP WHERE id = ?', [enfant.id], (err) => {
            if (err) console.error('Erreur mise à jour last_scan:', err);
        });

        db.query('SELECT description, points, date_action FROM historique WHERE enfant_id = ? AND type = "ACHAT" ORDER BY date_action DESC LIMIT 3', 
            [enfant.id], (err, purchases) => {
                if (err) return res.status(500).json(err);
                res.json({
                    ...enfant,
                    derniersAchats: purchases
                });
            });
    });
});

// GET tous les cadeaux
app.get('/api/boutique/cadeaux', (req, res) => {
    db.query('SELECT * FROM cadeaux', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// GET derniers scans (au lieu du classement)
app.get('/api/classement', (req, res) => {
    db.query('SELECT uid, prenom, nom, solde, last_scan FROM enfants WHERE last_scan IS NOT NULL ORDER BY last_scan DESC LIMIT 3', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// POST update points (AJOUT ou RETRAIT)
app.post('/api/points', (req, res) => {
    const { uid, points, type, description } = req.body; // points peut être positif ou négatif
    
    db.query('SELECT id, solde FROM enfants WHERE uid = ?', [uid], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: 'Enfant non trouvé' });
        
        const enfant = results[0];
        const nouveauSolde = enfant.solde + points;
        
        if (nouveauSolde < 0) return res.status(400).json({ message: 'Solde insuffisant' });

        db.query('UPDATE enfants SET solde = ? WHERE id = ?', [nouveauSolde, enfant.id], (err) => {
            if (err) return res.status(500).json(err);
            
            db.query('INSERT INTO historique (enfant_id, type, points, description) VALUES (?, ?, ?, ?)', 
                [enfant.id, type, Math.abs(points), description], (err) => {
                if (err) return res.status(500).json(err);
                res.json({ message: 'Points mis à jour', nouveauSolde });
            });
        });
    });
});

// POST achat boutique
app.post('/api/boutique/achat', (req, res) => {
    const { uid, panier } = req.body; // panier = [{id, prix, nom}, ...]
    const totalDollars = panier.reduce((sum, item) => sum + item.prix, 0);

    db.query('SELECT id, dollars FROM enfants WHERE uid = ?', [uid], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: 'Enfant non trouvé' });
        
        const enfant = results[0];
        if (enfant.dollars < totalDollars) {
            return res.status(400).json({ message: 'Dollars insuffisants pour cet achat' });
        }

        const nouveauSoldeDollars = enfant.dollars - totalDollars;

        db.query('UPDATE enfants SET dollars = ? WHERE id = ?', [nouveauSoldeDollars, enfant.id], (err) => {
            if (err) return res.status(500).json(err);
            
            const description = panier.map(item => item.nom).join(', ');
            db.query('INSERT INTO historique (enfant_id, type, points, description) VALUES (?, "ACHAT", ?, ?)', 
                [enfant.id, totalDollars, description], (err) => {
                if (err) return res.status(500).json(err);
                res.json({ message: 'Achat réussi', nouveauSolde: nouveauSoldeDollars });
            });
        });
    });
});

// --- AUTH & CONFIG ENDPOINTS ---

// POST login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`Tentative de connexion : username="${username}", password="${password}"`);
    if (!username || !password) {
        return res.status(400).json({ message: 'Veuillez saisir un nom d\'utilisateur et un mot de passe' });
    }
    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) {
            console.error('Erreur SQL lors du login:', err);
            return res.status(500).json(err);
        }
        if (results.length === 0) {
            console.log(`Échec de connexion pour "${username}" (identifiants incorrects)`);
            return res.status(401).json({ message: 'Identifiants incorrects' });
        }
        const user = results[0];
        console.log(`Connexion réussie pour "${username}" (role: ${user.role}, camp: ${user.club})`);
        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            club: user.club
        });
    });
});

// GET config missions for a camp
app.get('/api/admin/missions/:camp', (req, res) => {
    const { camp } = req.params;
    db.query('SELECT missions FROM camp_config WHERE camp = ?', [camp], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) {
            return res.json(null);
        }
        try {
            const missions = JSON.parse(results[0].missions);
            res.json(missions);
        } catch(e) {
            res.json(null);
        }
    });
});

// POST config missions for a camp
app.post('/api/admin/missions/:camp', (req, res) => {
    const { camp } = req.params;
    const { missions } = req.body;
    const missionsStr = JSON.stringify(missions);
    db.query(
        'INSERT INTO camp_config (camp, missions) VALUES (?, ?) ON DUPLICATE KEY UPDATE missions = VALUES(missions)',
        [camp, missionsStr],
        (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: 'Configuration des missions sauvegardée avec succès' });
        }
    );
});

// --- ADMIN ENDPOINTS (MySQL local children CRUD) ---

// GET all enfants
app.get('/api/admin/enfants', (req, res) => {
    const { camp } = req.query;
    if (camp) {
        db.query('SELECT * FROM enfants WHERE camp = ? ORDER BY nom ASC, prenom ASC', [camp], (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        });
    } else {
        db.query('SELECT * FROM enfants ORDER BY nom ASC, prenom ASC', (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        });
    }
});

// POST new enfant
app.post('/api/admin/enfant', (req, res) => {
    const { uid, nom, prenom, solde, dollars, admin_data, camp } = req.body;
    db.query(
        'INSERT INTO enfants (uid, nom, prenom, solde, dollars, admin_data, camp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uid, nom, prenom, solde || 0, dollars || 0, admin_data || null, camp || null],
        (err, result) => {
            if (err) {
                console.error("Error creating child:", err);
                return res.status(500).json({ message: err.code === 'ER_DUP_ENTRY' ? 'Cet UID de carte NFC existe déjà' : err.message });
            }
            res.json({ message: 'Enfant créé avec succès', id: result.insertId });
        }
    );
});

// PUT update enfant
app.put('/api/admin/enfant/:id', (req, res) => {
    const { id } = req.params;
    const { uid, nom, prenom, solde, dollars, admin_data, camp } = req.body;
    db.query(
        'UPDATE enfants SET uid = ?, nom = ?, prenom = ?, solde = ?, dollars = ?, admin_data = ?, camp = ? WHERE id = ?',
        [uid, nom, prenom, solde, dollars, admin_data, camp, id],
        (err) => {
            if (err) {
                console.error("Error updating child:", err);
                return res.status(500).json({ message: err.message });
            }
            res.json({ message: 'Enfant mis à jour avec succès' });
        }
    );
});

// DELETE enfant
app.delete('/api/admin/enfant/:id', (req, res) => {
    const { id } = req.params;
    // Supprimer l'historique d'abord pour éviter l'erreur de contrainte d'intégrité référentielle
    db.query('DELETE FROM historique WHERE enfant_id = ?', [id], (err) => {
        if (err) return res.status(500).json(err);
        db.query('DELETE FROM enfants WHERE id = ?', [id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: 'Enfant supprimé avec succès' });
        });
    });
});

// GET all cadeaux
app.get('/api/admin/cadeaux', (req, res) => {
    db.query('SELECT * FROM cadeaux ORDER BY prix ASC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// POST new cadeau
app.post('/api/admin/cadeaux', (req, res) => {
    const { nom, prix, stock } = req.body;
    db.query(
        'INSERT INTO cadeaux (nom, prix, stock) VALUES (?, ?, ?)',
        [nom, prix, stock || 0],
        (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: 'Article créé avec succès', id: result.insertId });
        }
    );
});

// PUT update cadeau
app.put('/api/admin/cadeaux/:id', (req, res) => {
    const { id } = req.params;
    const { nom, prix, stock } = req.body;
    db.query(
        'UPDATE cadeaux SET nom = ?, prix = ?, stock = ? WHERE id = ?',
        [nom, prix, stock, id],
        (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: 'Article mis à jour avec succès' });
        }
    );
});

// DELETE cadeau
app.delete('/api/admin/cadeaux/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM cadeaux WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: 'Article supprimé avec succès' });
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur lancé sur le port ${PORT} (accessible sur le réseau local)`);
});
