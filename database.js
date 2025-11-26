const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '34.42.140.154',
  user: 'Nodeuser',
  password: 'KimJenYan330!',
  database: 'homeapplication'
});

module.exports = pool;

