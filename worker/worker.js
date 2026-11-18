// Origins allowed to call this worker. Matched exactly on scheme + host
// (any port for local dev), never by prefix.
const ALLOWED_ORIGINS = new Set([
  'https://jimbo7ron.github.io',
  'http://localhost',
  'http://127.0.0.1',
]);

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/token') {
      return handleTokenExchange(request, env);
    }
    if (request.method === 'GET' && url.pathname === '/api/segment_efforts') {
      return handleSegmentEfforts(request, url);
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

    if (!tokenResponse.ok) {
      return jsonResponse({ error: 'Token exchange failed' }, tokenResponse.status, request);
    }

    // Return only what the page needs. The refresh token and athlete
    // profile never leave the worker.
    const data = await tokenResponse.json();
    return jsonResponse(
      { access_token: data.access_token, expires_at: data.expires_at },
      200,
      request,
    );
  } catch (err) {
    return jsonResponse({ error: 'Token exchange failed' }, 500, request);
  }
}

// Fixed pass-through for the one Strava endpoint the page uses, so the
// user's token goes only to Strava (not a third-party CORS proxy).
// Not a general proxy: the path and query params are fixed here.
async function handleSegmentEfforts(request, url) {
  const auth = request.headers.get('Authorization') || '';
  const segmentId = url.searchParams.get('segment_id') || '';
  const perPage = url.searchParams.get('per_page') || '10';

  if (!auth.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing token' }, 401, request);
  }
  if (!/^\d{1,12}$/.test(segmentId) || !/^\d{1,3}$/.test(perPage)) {
    return jsonResponse({ error: 'Invalid parameters' }, 400, request);
  }

  const stravaUrl = `https://www.strava.com/api/v3/segment_efforts?segment_id=${segmentId}&per_page=${perPage}`;
  const stravaResponse = await fetch(stravaUrl, { headers: { Authorization: auth } });

  return new Response(stravaResponse.body, {
    status: stravaResponse.status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request),
    },
  });
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

function isAllowedOrigin(origin) {
  try {
    const { protocol, hostname } = new URL(origin);
    return ALLOWED_ORIGINS.has(`${protocol}//${hostname}`);
  } catch {
    return false;
  }
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowOrigin = isAllowedOrigin(origin) ? origin : 'https://jimbo7ron.github.io';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}
