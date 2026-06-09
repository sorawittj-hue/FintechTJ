export default async function handler(req, res) {
  // enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    let targetUrl;
    try {
      targetUrl = new URL(decodeURIComponent(url));
    } catch {
      try {
        targetUrl = new URL(url);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid url parameter' });
      }
    }

    // Reconstruct query parameters that might have been split if unencoded
    Object.keys(req.query).forEach((key) => {
      if (key !== 'url') {
        targetUrl.searchParams.set(key, req.query[key]);
      }
    });

    const fetchResponse = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const data = await fetchResponse.text();
    const status = fetchResponse.status;

    res.status(status).send(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: error.message });
  }
}
