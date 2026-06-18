const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
neonConfig.webSocketConstructor = ws;

module.exports = async (req, res) => {
  const report = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED ? '✅ définie (' + process.env.DATABASE_URL_UNPOOLED.substring(0, 40) + '...)' : '❌ ABSENTE',
      DATABASE_URL: process.env.DATABASE_URL ? '✅ définie (' + process.env.DATABASE_URL.substring(0, 40) + '...)' : '❌ ABSENTE',
      NODE_ENV: process.env.NODE_ENV || 'non défini',
    },
    db: null
  };

  const connStr = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  
  if (!connStr) {
    report.db = '❌ Aucune variable de connexion trouvée';
    return res.status(500).json(report);
  }

  try {
    const pool = new Pool({ connectionString: connStr });
    const result = await pool.query('SELECT NOW() as time');
    await pool.end();
    report.db = '✅ Connexion OK — ' + result.rows[0].time;
    res.status(200).json(report);
  } catch (e) {
    report.db = '❌ Erreur: ' + e.message + ' | code: ' + e.code;
    res.status(500).json(report);
  }
};
