const mysql = require('/Users/lennyrap/Projet/scan-gan-israel/backend/node_modules/mysql2');
const dotenv = require('/Users/lennyrap/Projet/scan-gan-israel/backend/node_modules/dotenv');
dotenv.config({ path: '/Users/lennyrap/Projet/scan-gan-israel/backend/.env' });

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('MySQL Connection Error:', err);
        process.exit(1);
    }
    
    console.log('Connected to MySQL database.');
    
    const query = 'ALTER TABLE enfants ADD COLUMN admin_data TEXT DEFAULT NULL';
    db.query(query, (err, result) => {
        if (err) {
            console.error('Error altering table (it might already have the column):', err.message);
        } else {
            console.log('Successfully added admin_data column to enfants table.');
        }
        db.end();
    });
});
