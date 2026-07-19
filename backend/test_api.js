const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });
const { getDashboardStats } = require('./src/controllers/DashboardController');

const req = {
  user: {
    role: 'ADMIN'
  }
};

const res = {
  json: function(data) {
    console.log("SUCCESS! Result:", JSON.stringify(data, null, 2));
    process.exit(0);
  },
  status: function(code) {
    this.statusCode = code;
    return this;
  }
};

async function testAPI() {
  await getDashboardStats(req, res);
}

testAPI();
