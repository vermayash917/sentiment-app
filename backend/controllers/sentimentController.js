// backend/controllers/sentimentController.js
const csv = require('csv-parse');
const axios = require('axios');
const Result = require('../models/Result');

function parseCSVBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const records = [];
    const parser = csv.parse({ columns: true, trim: true });
    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        const val = record.text ?? Object.values(record)[0];
        if (val) records.push(val);
      }
    });
    parser.on('error', reject);
    parser.on('end', () => resolve(records));
    parser.write(buffer);
    parser.end();
  });
}

// helper: send batch to inference service and normalize results
async function callInferenceBatch(batch) {
  const url = `${process.env.INFERENCE_URL.replace(/\/$/, '')}/predict`;
  const resp = await axios.post(url, { texts: batch }, { timeout: 60000 });
  if (!resp?.data?.results) throw new Error('Invalid response from inference service');
  return resp.data.results; // each item: { text, pred_id, label, probs, logits }
}

async function uploadCsv(req, res){
  try {
    if(!req?.file?.buffer) return res.status(400).json({ error: 'file required' });
    const texts = await parseCSVBuffer(req.file.buffer);
    if(!texts.length) return res.status(400).json({ error: 'no texts found' });

    const CHUNK = 32;
    const predictions = [];
    for(let i=0;i<texts.length;i+=CHUNK){
      const batch = texts.slice(i,i+CHUNK);
      const results = await callInferenceBatch(batch);
      results.forEach(r => {
        const topScore = Array.isArray(r.probs) ? Math.max(...r.probs) : null;
        predictions.push({ text: r.text, label: r.label, pred_id: r.pred_id, score: topScore, probs: r.probs });
      });
    }

    // save to DB (attach user if available)
    const docs = predictions.map(p => ({ userId: req.user?._id, text: p.text, label: p.label, score: p.score }));
    await Result.insertMany(docs);

    return res.json({ count: predictions.length, results: predictions });
  } catch(err){
    console.error('uploadCsv error:', err.message || err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}

async function analyzeText(req, res){
  try {
    const { text } = req.body;
    if(!text) return res.status(400).json({ error: 'text required' });
    const results = await callInferenceBatch([text]);
    const r = results[0];
    const topScore = Array.isArray(r.probs) ? Math.max(...r.probs) : null;
    const doc = await Result.create({ userId: req.user?._id, text: r.text, label: r.label, score: topScore });
    return res.json({ text: r.text, label: r.label, pred_id: r.pred_id, score: topScore, probs: r.probs, id: doc._id });
  } catch(err){
    console.error('analyzeText error:', err.message || err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}

async function getHistory(req, res){
  try {
    const list = await Result.find({ userId: req.user?._id }).sort({ createdAt: -1 }).limit(200);
    res.json({ results: list });
  } catch(err){
    console.error('getHistory error:', err.message || err);
    res.status(500).json({ error: err.message || 'server error' });
  }
}

module.exports = { uploadCsv, analyzeText, getHistory };
