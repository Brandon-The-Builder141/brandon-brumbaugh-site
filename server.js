const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Counter data lives on a Railway persistent volume (mounted at /data in
// production) so it survives redeploys; falls back to a local file when
// developing without a volume mounted.
const DATA_DIR = fs.existsSync('/data') ? '/data' : __dirname;
const COUNTS_FILE = path.join(DATA_DIR, 'counters.json');

function readCounts() {
  try {
    return JSON.parse(fs.readFileSync(COUNTS_FILE, 'utf8'));
  } catch {
    return { visits: 0, contacts: 0 };
  }
}

function writeCounts(counts) {
  fs.writeFileSync(COUNTS_FILE, JSON.stringify(counts));
}

let counts = readCounts();

app.get('/api/stats', (req, res) => {
  res.json(counts);
});

app.post('/api/track/visit', (req, res) => {
  counts.visits += 1;
  writeCounts(counts);
  res.json(counts);
});

app.post('/api/track/contact', (req, res) => {
  counts.contacts += 1;
  writeCounts(counts);
  res.json(counts);
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT + ', data dir: ' + DATA_DIR);
});
