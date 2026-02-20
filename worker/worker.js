export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/token') {
      return handleTokenExchange(request, env);
    }

    return new Response('Not found', { status: 404 });
  },
};

async function handleTokenExchange(request, env) {
  try {
    const { code } = await request.json();

    if (!code) {
      return jsonResponse({ error: 'Missing authorization code' }, 400, request);
    }

    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.CLIENT_ID,
        client_secret: env.CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const data = await tokenResponse.json();
    return jsonResponse(data, tokenResponse.status, request);
  } catch (err) {
    return jsonResponse({ error: 'Token exchange failed' }, 500, request);
  }
}

function jsonResponse(body, status, request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request),
    },
  });
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = [
    'https://jimbo7ron.github.io',
    'http://localhost',
    'http://127.0.0.1',
  ];
  const allowOrigin = allowed.some((o) => origin.startsWith(o))
    ? origin
    : allowed[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
