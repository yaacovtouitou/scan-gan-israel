const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuration du pool de connexions
const pool = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test de la connexion
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('ERREUR CRITIQUE DE CONNEXION A POSTGRESQL:', err);
    } else {
        console.log('✅ Connecté avec succès au Pool PostgreSQL (Neon).');
    }
});

// --- VOS ROUTES ---
// Vercel route automatiquement /api/* vers ce fichier.
// On retire donc /api du début de chaque route.

// GET enfant by UID
app.get('/enfant/:uid', async (req, res) => {
    const { uid } = req.params;
    try {
        const enfantRes = await pool.query('SELECT * FROM enfants WHERE uid = $1', [uid]);
        if (enfantRes.rows.length === 0) return res.status(404).json({ message: 'Enfant non trouvé' });

        const enfant = enfantRes.rows[0];
        pool.query('UPDATE enfants SET last_scan = CURRENT_TIMESTAMP WHERE id = $1', [enfant.id]);
        const achatsRes = await pool.query('SELECT description, points, date_action FROM historique WHERE enfant_id = $1 AND type = \'ACHAT\' ORDER BY date_action DESC LIMIT 3', [enfant.id]);
        
        res.json({ ...enfant, derniersAchats: achatsRes.rows });
    } catch (err) {
        console.error("Erreur SQL [getEnfant]", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

// POST login
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Veuillez saisir un nom d\'utilisateur et un mot de passe' });
    }
    try {
        const userRes = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
        if (userRes.rows.length === 0) return res.status(401).json({ message: 'Identifiants incorrects' });
        res.json(userRes.rows[0]);
    } catch (err) {
        console.error('Erreur SQL lors du login:', err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

// GET tous les cadeaux
app.get('/boutique/cadeaux', async (req, res) => {
    try {
        const cadeauxRes = await pool.query('SELECT * FROM cadeaux');
        res.json(cadeauxRes.rows);
    } catch (err) {
        console.error("Erreur SQL [getCadeaux]", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

// GET derniers scans
app.get('/classement', async (req, res) => {
    try {
        const classementRes = await pool.query('SELECT uid, prenom, nom, solde, last_scan FROM enfants WHERE last_scan IS NOT NULL ORDER BY last_scan DESC LIMIT 3');
        res.json(classementRes.rows);
    } catch (err) {
        console.error("Erreur SQL [getClassement]", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

// POST update points
app.post('/points', async (req, res) => {
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
app.post('/boutique/achat', async (req, res) => {
    const { uid, panier } = req.body;
    const totalDollars = panier.reduce((sum, item) => sum + item.prix, 0);
    try {
        const enfantRes = await pool.query('SELECT id, dollars FROM enfants WHERE uid = $1', [uid]);
        if (enfantRes.rows.length === 0) return res.status(404).json({ message: 'Enfant non trouvé' });

        const enfant = enfantRes.rows[0];
        if (enfant.dollars < totalDollars) return res.status(400).json({ message: 'Dollars insuffisants' });

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
app.get('/admin/missions/:camp', async (req, res) => {
    const { camp } = req.params;
    try {
        const resDb = await pool.query('SELECT missions FROM camp_config WHERE camp = $1', [camp]);
        if (resDb.rows.length === 0) return res.json(null);
        res.json(JSON.parse(resDb.rows[0].missions));
    } catch (err) {
        console.error("Erreur SQL [getMissions]", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

// ... (toutes les autres routes admin converties de la même manière)

module.exports = app;
