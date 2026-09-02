/**
 * Kanca Admin desktop shell.
 *
 * Serves the pre-built admin bundle (dist-admin/) from an in-process HTTP
 * server on 127.0.0.1 and opens it in a window. A real origin (not file://)
 * is required for Firebase Auth and for BrowserRouter's /admin/* routes.
 */
const { app, BrowserWindow, shell } = require('electron');
const http = require('http');
const path = require('path');
const fs = require('fs');

const DIST = path.join(__dirname, '..', 'dist-admin');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let pathname;
      try {
        pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      } catch {
        pathname = '/';
      }
      let file = path.normalize(path.join(DIST, pathname));
      if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        file = path.join(DIST, 'index.html'); // SPA fallback
      }
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(500); res.end('Server error'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.on('error', reject);
    // Port 0 = any free port; binding to 127.0.0.1 keeps the panel
    // unreachable from other machines on the network.
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

// The live panel deployed with `npm run deploy-admin`. Loading it remotely
// means every installed app gets panel updates instantly — the exe itself
// only needs redistribution when this shell changes.
//
// The URL lives in the gitignored electron/admin-target.json (see
// admin-target.example.json) so the deployment target is not published with
// the source. Without that file the shell just serves the bundled copy.
function remoteUrl() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'admin-target.json'), 'utf8')).remoteUrl || null;
  } catch {
    return null;
  }
}

async function loadBundled(win) {
  try {
    const port = await startServer();
    win.loadURL(`http://127.0.0.1:${port}/admin`);
  } catch { /* nothing left to try */ }
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    autoHideMenuBar: true,
    title: 'Kanca İnşaat — Yönetim Paneli',
  });
  // External links (product images, etc.) go to the system browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  // If the hosted panel is unreachable, fall back to the copy
  // bundled inside the app.
  win.webContents.once('did-fail-load', () => loadBundled(win));

  const remote = remoteUrl();
  if (remote) win.loadURL(remote);
  else await loadBundled(win);
});

app.on('window-all-closed', () => app.quit());
