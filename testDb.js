const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: '34.42.140.154',     
    user: 'Nodeuser',           
    password: 'KimJenYan330!',
    database: 'homeapplication'
  });

  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('Database connection works! Result:', rows[0].result);

    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tables in homeapplication:');
    console.log(tables);
  } catch (err) {
    console.error('Database error:', err);
  } finally {
    await pool.end();
  }
}

main();
