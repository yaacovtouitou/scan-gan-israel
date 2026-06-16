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
});

// GET enfant by UID
app.get('/api/enfant/:uid', (req, res) => {
    const { uid } = req.params;
    db.query('SELECT * FROM enfants WHERE uid = ?', [uid], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: 'Enfant non trouvé' });
        
        const enfant = results[0];
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

// GET top 3 enfants (classement)
app.get('/api/classement', (req, res) => {
    db.query('SELECT uid, prenom, nom, solde FROM enfants ORDER BY solde DESC LIMIT 3', (err, results) => {
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
    const totalPoints = panier.reduce((sum, item) => sum + item.prix, 0);

    db.query('SELECT id, solde FROM enfants WHERE uid = ?', [uid], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: 'Enfant non trouvé' });
        
        const enfant = results[0];
        if (enfant.solde < totalPoints) {
            return res.status(400).json({ message: 'Solde insuffisant pour cet achat' });
        }

        const nouveauSolde = enfant.solde - totalPoints;

        db.query('UPDATE enfants SET solde = ? WHERE id = ?', [nouveauSolde, enfant.id], (err) => {
            if (err) return res.status(500).json(err);
            
            const description = panier.map(item => item.nom).join(', ');
            db.query('INSERT INTO historique (enfant_id, type, points, description) VALUES (?, "ACHAT", ?, ?)', 
                [enfant.id, totalPoints, description], (err) => {
                if (err) return res.status(500).json(err);
                res.json({ message: 'Achat réussi', nouveauSolde });
            });
        });
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur lancé sur le port ${PORT} (accessible sur le réseau local)`);
});
