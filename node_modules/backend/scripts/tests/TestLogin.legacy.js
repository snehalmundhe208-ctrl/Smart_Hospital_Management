const db = require('./src/config/DatabaseConfig');
const AuthController = require('./src/controllers/AuthController');

async function run() {
  const req = { body: { email: 'admin@hospital.com', password: 'Password123!' } };
  const res = {
    status: function(s) {
      console.log('Status:', s);
      return this;
    },
    json: function(j) {
      console.log('JSON:', j);
      return this;
    }
  };
  
  await AuthController.login(req, res);
}

run().catch(console.error).finally(() => process.exit(0));
