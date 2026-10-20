import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function calendarProxyPlugin(): Plugin {
  return {
    name: 'calendar-proxy',
    configureServer(server) {
      server.middlewares.use('/api/calendar', async (req, res) => {
        const urlObj = new URL(req.url || '', 'http://localhost');
        const targetUrl = urlObj.searchParams.get('url');
        if (!targetUrl) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Paramètre url manquant' }));
          return;
        }

        try {
          const fetchUrl = targetUrl.replace(/^webcal:\/\//i, 'https://');
          const resp = await fetch(fetchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/calendar, text/plain, */*'
            }
          });
          const text = await resp.text();
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
          res.statusCode = 200;
          res.end(text);
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), calendarProxyPlugin()],
  server: {
    port: 3000,
    host: true
  }
});
