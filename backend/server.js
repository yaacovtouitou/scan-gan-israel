const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuration de la base de données avec les noms de variables standards
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: {
        // Solution de dernier recours : Accepte les certificats même s'ils ne sont pas vérifiables.
        // C'est souvent nécessaire pour les connexions depuis Vercel vers des DB externes.
        rejectUnauthorized: false 
    }
};

// Log pour le débogage
console.log("Tentative de connexion avec la configuration suivante :");
console.log({
    host: dbConfig.host ? 'défini' : 'non défini',
    user: dbConfig.user ? 'défini' : 'non défini',
    database: dbConfig.database ? 'défini' : 'non défini',
    port: dbConfig.port,
    ssl_mode: dbConfig.ssl.rejectUnauthorized ? 'Strict' : 'Non-Strict'
});

const db = mysql.createConnection(dbConfig);

db.connect(err => {
    if (err) {
        console.error('ERREUR CRITIQUE DE CONNEXION MYSQL:', err);
        return;
    }
    console.log('✅ Connecté avec succès à la base de données MySQL.');
});

// Middleware pour gérer les reconnexions si nécessaire
app.use((req, res, next) => {
    if (db.state === 'disconnected') {
        console.error("DB déconnectée. Tentative de reconnexion...");
        db.connect(err => {
            if (err) {
                console.error("La reconnexion a échoué.", err);
                return res.status(500).json({ message: "Erreur critique du service de base de données." });
            }
            console.log("Reconnecté à la DB.");
            next();
        });
    } else {
        next();
    }
});

// --- VOS ROUTES CI-DESSOUS ---

// GET enfant by UID
app.get('/api/enfant/:uid', (req, res) => {
    const { uid } = req.params;
    db.query('SELECT * FROM enfants WHERE uid = ?', [uid], (err, results) => {
        if (err) {
            console.error("Erreur SQL [getEnfant]", err);
            return res.status(500).json({ message: "Erreur interne du serveur." });
        }
        if (results.length === 0) return res.status(404).json({ message: 'Enfant non trouvé' });
        
        const enfant = results[0];
        
        db.query('UPDATE enfants SET last_scan = CURRENT_TIMESTAMP WHERE id = ?', [enfant.id], (err) => {
            if (err) console.error('Erreur mise à jour last_scan:', err);
        });

        db.query('SELECT description, points, date_action FROM historique WHERE enfant_id = ? AND type = "ACHAT" ORDER BY date_action DESC LIMIT 3', 
            [enfant.id], (err, purchases) => {
                if (err) {
                    console.error("Erreur SQL [getDerniersAchats]", err);
                    return res.status(500).json({ message: "Erreur interne du serveur." });
                }
                res.json({
                    ...enfant,
                    derniersAchats: purchases
                });
            });
    });
});

// POST login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Veuillez saisir un nom d\'utilisateur et un mot de passe' });
    }
    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) {
            console.error('Erreur SQL lors du login:', err);
            return res.status(500).json({ message: "Erreur interne du serveur." });
        }
        if (results.length === 0) {
            return res.status(401).json({ message: 'Identifiants incorrects' });
        }
        const user = results[0];
        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            club: user.club
        });
    });
});

// GET tous les cadeaux
app.get('/api/boutique/cadeaux', (req, res) => {
    db.query('SELECT * FROM cadeaux', (err, results) => {
        if (err) {
            console.error("Erreur SQL [getCadeaux]", err);
            return res.status(500).json({ message: "Erreur interne du serveur." });
        }
        res.json(results);
    });
});

// GET derniers scans
app.get('/api/classement', (req, res) => {
    db.query('SELECT uid, prenom, nom, solde, last_scan FROM enfants WHERE last_scan IS NOT NULL ORDER BY last_scan DESC LIMIT 3', (err, results) => {
        if (err) {
            console.error("Erreur SQL [getClassement]", err);
            return res.status(500).json({ message: "Erreur interne du serveur." });
        }
        res.json(results);
    });
});

// POST update points
app.post('/api/points', (req, res) => {
    const { uid, points, type, description } = req.body;
    
    db.query('SELECT id, solde FROM enfants WHERE uid = ?', [uid], (err, results) => {
        if (err) {
            console.error("Erreur SQL [findEnfantForPoints]", err);
            return res.status(500).json({ message: "Erreur interne du serveur." });
        }
        if (results.length === 0) return res.status(404).json({ message: 'Enfant non trouvé' });
        
        const enfant = results[0];
        const nouveauSolde = enfant.solde + points;
        
        if (nouveauSolde < 0) return res.status(400).json({ message: 'Solde insuffisant' });

        db.query('UPDATE enfants SET solde = ? WHERE id = ?', [nouveauSolde, enfant.id], (err) => {
            if (err) {
                console.error("Erreur SQL [updateSolde]", err);
                return res.status(500).json({ message: "Erreur interne du serveur." });
            }
            
            db.query('INSERT INTO historique (enfant_id, type, points, description) VALUES (?, ?, ?, ?)', 
                [enfant.id, type, Math.abs(points), description], (err) => {
                if (err) {
                    console.error("Erreur SQL [createHistorique]", err);
                    return res.status(500).json({ message: "Erreur interne du serveur." });
                }
                res.json({ message: 'Points mis à jour', nouveauSolde });
            });
        });
    });
});

// POST achat boutique
app.post('/api/boutique/achat', (req, res) => {
    const { uid, panier } = req.body;
    const totalDollars = panier.reduce((sum, item) => sum + item.prix, 0);

    db.query('SELECT id, dollars FROM enfants WHERE uid = ?', [uid], (err, results) => {
        if (err) {
            console.error("Erreur SQL [findEnfantForAchat]", err);
            return res.status(500).json({ message: "Erreur interne du serveur." });
        }
        if (results.length === 0) return res.status(404).json({ message: 'Enfant non trouvé' });
        
        const enfant = results[0];
        if (enfant.dollars < totalDollars) {
            return res.status(400).json({ message: 'Dollars insuffisants pour cet achat' });
        }

        const nouveauSoldeDollars = enfant.dollars - totalDollars;

        db.query('UPDATE enfants SET dollars = ? WHERE id = ?', [nouveauSoldeDollars, enfant.id], (err) => {
            if (err) {
                console.error("Erreur SQL [updateDollars]", err);
                return res.status(500).json({ message: "Erreur interne du serveur." });
            }
            
            const description = panier.map(item => item.nom).join(', ');
            db.query('INSERT INTO historique (enfant_id, type, points, description) VALUES (?, "ACHAT", ?, ?)', 
                [enfant.id, totalDollars, description], (err) => {
                if (err) {
                    console.error("Erreur SQL [createHistoriqueAchat]", err);
                    return res.status(500).json({ message: "Erreur interne du serveur." });
                }
                res.json({ message: 'Achat réussi', nouveauSolde: nouveauSoldeDollars });
            });
        });
    });
});

// --- ADMIN ROUTES ---
app.get('/api/admin/missions/:camp', (req, res) => {
    const { camp } = req.params;
    db.query('SELECT missions FROM camp_config WHERE camp = ?', [camp], (err, results) => {
        if (err) {
            console.error("Erreur SQL [getMissions]", err);
            return res.status(500).json({ message: "Erreur interne du serveur." });
        }
        if (results.length === 0) return res.json(null);
        try {
            res.json(JSON.parse(results[0].missions));
        } catch(e) {
            res.json(null);
        }
    });
});

app.post('/api/admin/missions/:camp', (req, res) => {
    const { camp } = req.params;
    const { missions } = req.body;
    const missionsStr = JSON.stringify(missions);
    db.query(
        'INSERT INTO camp_config (camp, missions) VALUES (?, ?) ON DUPLICATE KEY UPDATE missions = VALUES(missions)',
        [camp, missionsStr],
        (err) => {
            if (err) {
                console.error("Erreur SQL [saveMissions]", err);
                return res.status(500).json({ message: "Erreur interne du serveur." });
            }
            res.json({ message: 'Configuration des missions sauvegardée avec succès' });
        }
    );
});

app.get('/api/admin/enfants', (req, res) => {
    const { camp } = req.query;
    const query = camp 
        ? 'SELECT * FROM enfants WHERE camp = ? ORDER BY nom ASC, prenom ASC'
        : 'SELECT * FROM enfants ORDER BY nom ASC, prenom ASC';
    db.query(query, camp ? [camp] : [], (err, results) => {
        if (err) {
            console.error("Erreur SQL [getEnfants]", err);
            return res.status(500).json({ message: "Erreur interne du serveur." });
        }
        res.json(results);
    });
});

app.post('/api/admin/enfant', (req, res) => {
    const { uid, nom, prenom, solde, dollars, admin_data, camp } = req.body;
    db.query(
        'INSERT INTO enfants (uid, nom, prenom, solde, dollars, admin_data, camp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uid, nom, prenom, solde || 0, dollars || 0, admin_data || null, camp || null],
        (err, result) => {
            if (err) {
                console.error("Erreur SQL [createEnfant]", err);
                return res.status(500).json({ message: err.code === 'ER_DUP_ENTRY' ? 'Cet UID de carte NFC existe déjà' : "Erreur interne du serveur." });
            }
            res.json({ message: 'Enfant créé avec succès', id: result.insertId });
        }
    );
});

app.put('/api/admin/enfant/:id', (req, res) => {
    const { id } = req.params;
    const { uid, nom, prenom, solde, dollars, admin_data, camp } = req.body;
    db.query(
        'UPDATE enfants SET uid = ?, nom = ?, prenom = ?, solde = ?, dollars = ?, admin_data = ?, camp = ? WHERE id = ?',
        [uid, nom, prenom, solde, dollars, admin_data, camp, id],
        (err) => {
            if (err) {
                console.error("Erreur SQL [updateEnfant]", err);
                return res.status(500).json({ message: "Erreur interne du serveur." });
            }
            res.json({ message: 'Enfant mis à jour avec succès' });
        }
    );
});

app.delete('/api/admin/enfant/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM historique WHERE enfant_id = ?', [id], (err) => {
        if (err) {
            console.error("Erreur SQL [deleteHistoriqueForEnfant]", err);
            return res.status(500).json({ message: "Erreur interne du serveur." });
        }
        db.query('DELETE FROM enfants WHERE id = ?', [id], (err) => {
            if (err) {
                console.error("Erreur SQL [deleteEnfant]", err);
                return res.status(500).json({ message: "Erreur interne du serveur." });
            }
            res.json({ message: 'Enfant supprimé avec succès' });
        });
    });
});

app.get('/api/admin/cadeaux', (req, res) => {
    db.query('SELECT * FROM cadeaux ORDER BY prix ASC', (err, results) => {
        if (err) {
            console.error("Erreur SQL [getAdminCadeaux]", err);
            return res.status(500).json({ message: "Erreur interne du serveur." });
        }
        res.json(results);
    });
});

app.post('/api/admin/cadeaux', (req, res) => {
    const { nom, prix, stock } = req.body;
    db.query(
        'INSERT INTO cadeaux (nom, prix, stock) VALUES (?, ?, ?)',
        [nom, prix, stock || 0],
        (err, result) => {
            if (err) {
                console.error("Erreur SQL [createCadeau]", err);
                return res.status(500).json({ message: "Erreur interne du serveur." });
            }
            res.json({ message: 'Article créé avec succès', id: result.insertId });
        }
    );
});

app.put('/api/admin/cadeaux/:id', (req, res) => {
    const { id } = req.params;
    const { nom, prix, stock } = req.body;
    db.query(
        'UPDATE cadeaux SET nom = ?, prix = ?, stock = ? WHERE id = ?',
        [nom, prix, stock, id],
        (err) => {
            if (err) {
                console.error("Erreur SQL [updateCadeau]", err);
                return res.status(500).json({ message: "Erreur interne du serveur." });
            }
            res.json({ message: 'Article mis à jour avec succès' });
        }
    );
});

app.delete('/api/admin/cadeaux/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM cadeaux WHERE id = ?', [id], (err) => {
        if (err) {
            console.error("Erreur SQL [deleteCadeau]", err);
            return res.status(500).json({ message: "Erreur interne du serveur." });
        }
        res.json({ message: 'Article supprimé avec succès' });
    });
});

module.exports = app;
