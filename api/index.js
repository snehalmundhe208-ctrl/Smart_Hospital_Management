console.log("DATABASE_URL CHECK:", process.env.DATABASE_URL);
console.log("PGHOST CHECK:", process.env.PGHOST);
console.log("PGDATABASE CHECK:", process.env.PGDATABASE);
const app = require('../backend/index.js');

module.exports = app;
