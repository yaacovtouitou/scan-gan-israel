const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuration du pool de connexions pour PostgreSQL (Neon)
// On utilise POSTGRES_URL en priorité (standard Vercel) ou DATABASE_URL en fallback.
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test de la connexion
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('ERREUR CRITIQUE DE CONNEXION A POSTGRESQL:', err);
        if (!connectionString) {
            console.error("Aucune chaîne de connexion (POSTGRES_URL ou DATABASE_URL) n'a été trouvée dans les variables d'environnement.");
        }
    } else {
        console.log('✅ Connecté avec succès au Pool PostgreSQL (Neon).');
    }
});


// --- VOS ROUTES ADAPTÉES POUR POSTGRESQL ---
// Note: La syntaxe des requêtes paramétrées change de ? à $1, $2, etc.

// GET enfant by UID
app.get('/api/enfant/:uid', async (req, res) => {
    const { uid } = req.params;
    try {
        const enfantRes = await pool.query('SELECT * FROM enfants WHERE uid = $1', [uid]);
        if (enfantRes.rows.length === 0) return res.status(404).json({ message: 'Enfant non trouvé' });

        const enfant = enfantRes.rows[0];
        
        // Lancement de la mise à jour en arrière-plan (pas besoin d'attendre)
        pool.query('UPDATE enfants SET last_scan = CURRENT_TIMESTAMP WHERE id = $1', [enfant.id]);

        const achatsRes = await pool.query('SELECT description, points, date_action FROM historique WHERE enfant_id = $1 AND type = \'ACHAT\' ORDER BY date_action DESC LIMIT 3', [enfant.id]);
        
        res.json({
            ...enfant,
            derniersAchats: achatsRes.rows
        });
    } catch (err) {
        console.error("Erreur SQL [getEnfant]", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

// POST login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Veuillez saisir un nom d\'utilisateur et un mot de passe' });
    }
    try {
        const userRes = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
        if (userRes.rows.length === 0) {
            return res.status(401).json({ message: 'Identifiants incorrects' });
        }
        res.json(userRes.rows[0]);
    } catch (err) {
        console.error('Erreur SQL lors du login:', err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

// GET tous les cadeaux
app.get('/api/boutique/cadeaux', async (req, res) => {
    try {
        const cadeauxRes = await pool.query('SELECT * FROM cadeaux');
        res.json(cadeauxRes.rows);
    } catch (err) {
        console.error("Erreur SQL [getCadeaux]", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

// GET derniers scans
app.get('/api/classement', async (req, res) => {
    try {
        const classementRes = await pool.query('SELECT uid, prenom, nom, solde, last_scan FROM enfants WHERE last_scan IS NOT NULL ORDER BY last_scan DESC LIMIT 3');
        res.json(classementRes.rows);
    } catch (err) {
        console.error("Erreur SQL [getClassement]", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

// POST update points
app.post('/api/points', async (req, res) => {
    const { uid, points, type, description } = req.body;
    try {
        const enfantRes = await pool.query('SELECT id, solde FROM enfants WHERE uid = $1', [uid]);
        if (enfantRes.rows.length === 0) return res.status(404).json({ message: 'Enfant non trouvé' });

        const enfant = enfantRes.rows[0];
        const nouveauSolde = enfant.solde + points;
        if (nouveauSolde < 0) return res.status(400).json({ message: 'Solde insuffisant' });

        await pool.query('UPDATE enfants SET solde = $1 WHERE id = $2', [nouveauSolde, enfant.id]);
        await pool.query('INSERT INTO historique (enfant_id, type, points, description) VALUES ($1, $2, $3, $4)', [enfant.id, type, Math.abs(points), description]);
        
        res.json({ message: 'Points mis à jour', nouveauSolde });
    } catch (err) {
        console.error("Erreur SQL [updatePoints]", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

// POST achat boutique
app.post('/api/boutique/achat', async (req, res) => {
    const { uid, panier } = req.body;
    const totalDollars = panier.reduce((sum, item) => sum + item.prix, 0);

    try {
        const enfantRes = await pool.query('SELECT id, dollars FROM enfants WHERE uid = $1', [uid]);
        if (enfantRes.rows.length === 0) return res.status(404).json({ message: 'Enfant non trouvé' });

        const enfant = enfantRes.rows[0];
        if (enfant.dollars < totalDollars) {
            return res.status(400).json({ message: 'Dollars insuffisants pour cet achat' });
        }

        const nouveauSoldeDollars = enfant.dollars - totalDollars;
        await pool.query('UPDATE enfants SET dollars = $1 WHERE id = $2', [nouveauSoldeDollars, enfant.id]);
        
        const description = panier.map(item => item.nom).join(', ');
        await pool.query('INSERT INTO historique (enfant_id, type, points, description) VALUES ($1, \'ACHAT\', $2, $3)', [enfant.id, totalDollars, description]);
        
        res.json({ message: 'Achat réussi', nouveauSolde: nouveauSoldeDollars });
    } catch (err) {
        console.error("Erreur SQL [achatBoutique]", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

// --- ADMIN ROUTES ---

app.get('/api/admin/missions/:camp', async (req, res) => {
    const { camp } = req.params;
    try {
        const resDb = await pool.query('SELECT missions FROM camp_config WHERE camp = $1', [camp]);
        if (resDb.rows.length === 0) return res.json(null);
        try {
            res.json(JSON.parse(resDb.rows[0].missions));
        } catch(e) {
            res.json(null);
        }
    } catch (err) {
        console.error("Erreur SQL [getMissions]", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

app.post('/api/admin/missions/:camp', async (req, res) => {
    const { camp } = req.params;
    const { missions } = req.body;
    const missionsStr = JSON.stringify(missions);
    try {
        await pool.query(
            'INSERT INTO camp_config (camp, missions) VALUES ($1, $2) ON CONFLICT (camp) DO UPDATE SET missions = EXCLUDED.missions',
            [camp, missionsStr]
        );
        res.json({ message: 'Configuration des missions sauvegardée avec succès' });
    } catch (err) {
        console.error("Erreur SQL [saveMissions]", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

app.get('/api/admin/enfants', async (req, res) => {
    const { camp } = req.query;
    try {
        const query = camp 
            ? 'SELECT * FROM enfants WHERE camp = $1 ORDER BY nom ASC, prenom ASC'
            : 'SELECT * FROM enfants ORDER BY nom ASC, prenom ASC';
        const params = camp ? [camp] : [];
        const resDb = await pool.query(query, params);
        res.json(resDb.rows);
    } catch (err) {
        console.error("Erreur SQL [getEnfants]", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

app.post('/api/admin/enfant', async (req, res) => {
    const { uid, nom, prenom, solde, dollars, admin_data, camp } = req.body;
    try {
        const resDb = await pool.query(
            'INSERT INTO enfants (uid, nom, prenom, solde, dollars, admin_data, camp) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [uid, nom, prenom, solde || 0, dollars || 0, admin_data || null, camp || null]
        );
        res.json({ message: 'Enfant créé avec succès', id: resDb.rows[0].id });
    } catch (err) {
        console.error("Erreur SQL [createEnfant]", err);
        res.status(500).json({ message: err.code === '23505' ? 'Cet UID de carte NFC existe déjà' : "Erreur interne du serveur." });
    }
});

app.put('/api/admin/enfant/:id', async (req, res) => {
    const { id } = req.params;
    const { uid, nom, prenom, solde, dollars, admin_data, camp } = req.body;
    try {
        await pool.query(
            'UPDATE enfants SET uid = $1, nom = $2, prenom = $3, solde = $4, dollars = $5, admin_data = $6, camp = $7 WHERE id = $8',
            [uid, nom, prenom, solde, dollars, admin_data, camp, id]
        );
        res.json({ message: 'Enfant mis à jour avec succès' });
    } catch (err) {
        console.error("Erreur SQL [updateEnfant]", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

app.delete('/api/admin/enfant/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM historique WHERE enfant_id = $1', [id]);
        await pool.query('DELETE FROM enfants WHERE id = $1', [id]);
        res.json({ message: 'Enfant supprimé avec succès' });
    } catch (err) {
        console.error("Erreur SQL [deleteEnfant]", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

app.get('/api/admin/cadeaux', async (req, res) => {
    try {
        const resDb = await pool.query('SELECT * FROM cadeaux ORDER BY prix ASC');
        res.json(resDb.rows);
    } catch (err) {
        console.error("Erreur SQL [getAdminCadeaux]", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

app.post('/api/admin/cadeaux', async (req, res) => {
    const { nom, prix, stock } = req.body;
    try {
        const resDb = await pool.query(
            'INSERT INTO cadeaux (nom, prix, stock) VALUES ($1, $2, $3) RETURNING id',
            [nom, prix, stock || 0]
        );
        res.json({ message: 'Article créé avec succès', id: resDb.rows[0].id });
    } catch (err) {
        console.error("Erreur SQL [createCadeau]", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

app.put('/api/admin/cadeaux/:id', async (req, res) => {
    const { id } = req.params;
    const { nom, prix, stock } = req.body;
    try {
        await pool.query(
            'UPDATE cadeaux SET nom = $1, prix = $2, stock = $3 WHERE id = $4',
            [nom, prix, stock, id]
        );
        res.json({ message: 'Article mis à jour avec succès' });
    } catch (err) {
        console.error("Erreur SQL [updateCadeau]", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

app.delete('/api/admin/cadeaux/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM cadeaux WHERE id = $1', [id]);
        res.json({ message: 'Article supprimé avec succès' });
    } catch (err) {
        console.error("Erreur SQL [deleteCadeau]", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

module.exports = app;
