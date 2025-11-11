// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const apiRouter = require('./routes/api');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', apiRouter);

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> app.listen(PORT, ()=> console.log(`Node API listening ${PORT}`)))
  .catch(err => console.error('Mongo connection error', err));
