import parsePDF from './lib/parser.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(JSON.stringify({ 
        status: 'ok',
        message: 'PDF Parsing Service is running' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse PDF
    if (url.pathname === '/parse' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { url: pdfUrl } = body;

        if (!pdfUrl) {
          return new Response(JSON.stringify({ error: 'URL is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log(`[INFO] Parsing: ${pdfUrl}`);

        const response = await fetch(pdfUrl, {
          signal: AbortSignal.timeout(60000)
        });

        if (!response.ok) {
          throw new Error(`Download failed: ${response.status}`);
        }

        const pdfBuffer = await response.arrayBuffer();
        const text = await parsePDF(Buffer.from(pdfBuffer));

        return new Response(JSON.stringify({ text }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('[ERROR]', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to process PDF',
          details: error.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};