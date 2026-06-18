const fs = require('fs');
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true // Très important pour exécuter tout le fichier d'un coup
});

db.connect(err => {
    if (err) {
        console.error("Erreur de connexion:", err);
        process.exit(1);
    }
    console.log("Connecté à Clever Cloud.");

    const sql = fs.readFileSync('camp_nfc (2).sql', 'utf8');

    console.log("Importation en cours... (patientez quelques secondes)");
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erreur lors de l'importation:", err);
            process.exit(1);
        }
        console.log('✅ Base de données importée avec succès !');
        process.exit(0);
    });
});
