const mongoose = require('mongoose');
const Schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  text: String,
  label: String,
  score: Number,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Result', Schema);
