const { httpServerHandler } = require('cloudflare:node');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { parsePDF } = require('./lib/parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.send('PDF Parsing Service is running');
});

// Parse PDF from URL endpoint
app.post('/parse', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`[INFO] Received request to parse: ${url}`);

    // Stream download the PDF
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      maxContentLength: 300 * 1024 * 1024, // 300MB limit check (axios)
      timeout: 60000 // 60s timeout for download
    });

    const pdfBuffer = response.data;
    console.log(`[INFO] Downloaded ${pdfBuffer.length} bytes. Parsing...`);

    // Parse the PDF
    const text = await parsePDF(pdfBuffer);

    console.log(`[INFO] Parsing complete. Length: ${text.length} chars.`);

    res.json({ text });
  } catch (error) {
    console.error('[ERROR] Parsing failed:', error.message);
    if (error.response) {
      console.error('[ERROR] Upstream status:', error.response.status);
    }
    res.status(500).json({ error: 'Failed to process PDF', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = {
  fetch: httpServerHandler(app)
};
