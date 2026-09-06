const mongoose = require('mongoose');
const { mongodbUri } = require('./env');

async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongodbUri);
  console.log(`[mongo] connected -> ${mongoose.connection.name}`);

  mongoose.connection.on('error', (err) => {
    console.error('[mongo] connection error:', err.message);
  });
}

module.exports = connectDB;
