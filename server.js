// server.js
const express = require('express');
const Unblocker = require('unblocker');
const app = express();

const allowedIPs = [
];

app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const normalizedIP = ip.replace('::ffff:', ''); // Normalize IPv4-mapped IPv6 addresses

  const isAllowed = allowedIPs.some(allowed => normalizedIP.startsWith(allowed));

  if (isAllowed) {
    return next();
  }

  // Block response
  res.status(403).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Access Denied</title>
      <style>
        body { background: #121212; color: #ff6b6b; font-family: sans-serif;
               display: flex; align-items: center; justify-content: center;
               height: 100vh; margin: 0; text-align: center; }
        h1 { font-size: 2rem; }
      </style>
    </head>
    <body>
      <h1>🚫 Access Denied</h1>
      <p>Your IP (${normalizedIP}) is not allowed to access this web proxy. If you have any problems contact me on </p>
    </body>
    </html>
  `);
});

// list of banned keywords
const bannedTerms = [
  'porn','xxx','sex','nude','erotic','adult','hardcore',
  'fuck','fucking','fucker','fuckers','fuckin’','motherfucker','motherfucking',
  'shit','shitty','shits','shittier','shitting',
  'bitch','bitches','biatch',
  'bastard','bastards',
  'asshole','assholes',
  'dick','dicks','dickhead','dickheads',
  'piss','pissing','pissed',
  'crap','crapping','crapped',
  'damn','damnit',
  'hell','cock','cocks','cock-sucker',
  'pussy','tit','tits','titties',
  'boob','boobs',
  'penis','penises',
  'cum','cumming','cummed',
  'anal','blowjob','handjob','rimjob',
  'orgasm','orgasms',
  'f*g','faggot','faggots',
  'c*nt','r*tard','r*tarded','sp*c','ch*nky','ch*nk','kra*tch','g**k','d*g',
  'weed','marijuana','pot','meth','cocaine','coke','heroin','smack','LSD','acid',
  '420','blunts','bong','pipe','dope','molly','MDMA','ecstasy'
];

// 1) Serve dark-themed Bing search UI at exactly "/proxy"
app.get('/proxy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Dark Bing Proxy</title>
      <style>
        body { margin:0; height:100vh; display:flex;
               align-items:center; justify-content:center;
               background:#121212; color:#e0e0e0;
               font-family:sans-serif; }
        .box { display:flex; width:90%; max-width:500px; }
        input {
          flex:1; padding:0.6em; border:none;
          border-radius:4px 0 0 4px;
          background:#1e1e1e; color:#fff;
          font-size:1rem;
        }
        button {
          padding:0.6em 1em; border:none;
          border-radius:0 4px 4px 0;
          background:#3c3c3c; color:#fff;
          font-size:1rem; cursor:pointer;
        }
        button:hover { background:#555; }
        .error { position:absolute; top:20px; color:#ff6b6b; }
      </style>
    </head>
    <body>
      <form class="box" onsubmit="doSearch(event)">
        <input id="searchInput" type="text"
               placeholder="Type your search…"
               autocomplete="off" autofocus />
        <button type="submit">🔍</button>
      </form>
      <div class="error" id="errorMsg"></div>
      <script>
        function containsBanned(q) {
          return ${JSON.stringify(bannedTerms)}.some(t =>
            q.toLowerCase().includes(t)
          );
        }
        function doSearch(e) {
          e.preventDefault();
          const raw = document.getElementById('searchInput').value.trim();
          document.getElementById('errorMsg').textContent = '';
          if (!raw) return;
          if (containsBanned(raw)) {
            document.getElementById('errorMsg').textContent =
              '🚫 Your search contains disallowed terms.';
            return;
          }
          const q = encodeURIComponent(raw.replace(/\s+/g,'+'));
          window.location.href =
            '/proxy/https://www.bing.com/search?q=' + q;
        }
      </script>
    </body>
    </html>
  `);
});

// 2) Serve dark-themed "blocked" page at "/blocked"
app.get('/blocked', (req, res) => {
  res.status(403).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>🚫 Blocked</title>
      <style>
        body { margin:0; height:100vh; background:#121212;
               color:#e0e0e0; font-family:sans-serif;
               display:flex; flex-direction:column;
               align-items:center; justify-content:center;
               text-align:center; }
        h1 { font-size:2rem; margin-bottom:0.5em; }
        p  { margin-bottom:1.5em; }
        button {
          padding:0.6em 1.2em; border:none;
          border-radius:4px; background:#3c3c3c;
          color:#fff; font-size:1rem; cursor:pointer;
        }
        button:hover { background:#555; }
      </style>
    </head>
    <body>
      <h1>🚫 Website Blocked</h1>
      <p>This site has been blocked due to disallowed content.</p>
      <button onclick="location.href='/proxy'">Go Back</button>
    </body>
    </html>
  `);
});

// 3) Intercept all proxied requests under "/proxy/" and block if contains banned terms
app.use('/proxy/', (req, res, next) => {
  let target = req.originalUrl.replace(/^\/proxy\//, '');
  try { target = decodeURIComponent(target); } catch {}
  if (bannedTerms.some(t => target.toLowerCase().includes(t))) {
    return res.redirect('/blocked');
  }
  next();
});

// 4) Mount Unblocker for everything under "/proxy/"
app.use(Unblocker({ prefix: '/proxy/', block: ['scripts', 'styles'] }));

// 5) Start server on port 1111 (or override with PORT)
const PORT = process.env.PORT || 1111;
app.listen(PORT, () => {
  console.log('Bing proxy + dark UI listening on port ' + PORT);
});
