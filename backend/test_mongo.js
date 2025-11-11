// backend/test_mongo.js
const mongoose = require('mongoose');
require('dotenv').config();
(async () => {
  try {
    console.log('Trying to connect to', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected ok');
    await mongoose.disconnect();
  } catch (err) {
    console.error('connect failed:', err.message);
    process.exit(1);
  }
})();
