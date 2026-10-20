export default async function handler(req, res) {
  const targetUrl = req.query?.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Paramètre url manquant' });
  }

  try {
    const fetchUrl = targetUrl.replace(/^webcal:\/\//i, 'https://');
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/calendar, text/plain, */*'
      }
    });

    if (!response.ok) {
      return res.status(response.status).send('Erreur récupération calendrier distant');
    }

    const text = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    return res.status(200).send(text);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erreur proxy' });
  }
}
