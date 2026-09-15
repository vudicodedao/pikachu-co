import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

function syncPhotosPlugin(): Plugin {
  return {
    name: 'sync-photos-plugin',
    configureServer(server) {
      server.middlewares.use('/api/sync-photos', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const photos = JSON.parse(body);
              const photosDir = path.resolve(process.cwd(), 'public/photos');
              if (!fs.existsSync(photosDir)) {
                fs.mkdirSync(photosDir, { recursive: true });
              }
              let count = 0;
              for (const [id, dataUrl] of Object.entries(photos)) {
                if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
                  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
                  const filePath = path.join(photosDir, `${id}.jpg`);
                  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
                  count++;
                }
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), syncPhotosPlugin()],
  base: './', // Đường dẫn tương đối để tương thích mọi subpath GitHub Pages
  server: {
    port: 3000,
    open: false,
  },
});
