const https = require('https');
const fs = require('fs');

// Read token from zo-api
const tokenData = JSON.parse(fs.readFileSync('C:/Users/user/sentienthouse/zo-api/token.json', 'utf8'));
const clientSecret = JSON.parse(fs.readFileSync('C:/Users/user/sentienthouse/zo-api/client_secret_473298819240-kkqgen93r91d28h9u8erlb8r9t9donj8.apps.googleusercontent.com.json', 'utf8'));

function refreshToken() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      client_id: clientSecret.installed.client_id,
      client_secret: clientSecret.installed.client_secret,
      refresh_token: tokenData.refresh_token,
      grant_type: 'refresh_token'
    });
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        const r = JSON.parse(b);
        resolve(r.access_token);
      });
    });
    req.write(data);
    req.end();
  });
}

const ids = ["19c5128af75eb2ad","19c5109407f5fdb9","19c50d66b57fe869","19c503887b1e6b01","19c5037cdaec8015","19c4c73a7076007c","19c4c46906e57009","19c4bf9a4c7219fa","19c4be3329944f42","19c4bcc3ed9f5cb2","19c4b913726a7ffe","19c4b8b1a8c3aed5","19c47b87bd4f3f16","19c47818a3024e04","19c477baf4c14f99","19c4776cf13ddbdf","19c477064ce67423","19c473d8bd13f5da","19c4734d4572359b","19c4712e1e1aa32f","19c470c1eff9f971","19c46f74e2af10e8","19c468a2449ddbec","19c46896937814e7","19c467a5a1e01bad","19c4670cbb100eb9","19c45edbc249df94","19c45e22cd232ad7","19c429b2ed0eb2a9","19c421cee4eec6a1","19c4206c69c31545","19c4201d1dfea25b","19c4201a89de9a67","19c41fed5218a85b","19c41f4f2aab2954","19c41def217733b6","19c41d7ce2a3eade","19c41c6b8ad36dc1","19c41638d3fb9070","19c414418701d458","19c4103183d3cfac","19c40fd3d5ea8858","19c40f57986289ee","19c40c79778ec2a3","19c3d0aa74d83ffa","19c3cfe2ace44777","19c3c7dd3062d8b4","19c37fd4dae40bb8","19c3782eff691671","19c2875ec29a3be2","19c2828c9f48adfa","19c27b88ad07e27f","19c277e9a65687ce","19c27608cb78debd","19c2738dd8307845","19c23a054249cf07","19c23923681d5fca","19c2372f8e76ced4","19c1da2ad11b8082","19c09b1ed86b2309","19c099f2a3ed2a5d","19c0485a8686aa4c","19ba25188bd1bafc"];

function fetchMsg(token, id) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'gmail.googleapis.com',
      path: '/gmail/v1/users/me/messages/' + id + '?format=full',
      headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          const msg = JSON.parse(b);
          const body = msg.payload.body && msg.payload.body.data
            ? Buffer.from(msg.payload.body.data, 'base64').toString()
            : (msg.payload.parts && msg.payload.parts[0] && msg.payload.parts[0].body.data
              ? Buffer.from(msg.payload.parts[0].body.data, 'base64').toString()
              : '');
          resolve(body);
        } catch(e) { resolve(''); }
      });
    });
    req.on('error', () => resolve(''));
    req.end();
  });
}

function parseOrder(body) {
  const orderIdM = body.match(/Order ID\s*:\s*\*?([^\n*]+)/);
  if (!orderIdM) return null;
  const orderId = orderIdM[1].trim();
  // BLRxZo orders start with 3194
  if (!orderId.startsWith('3194')) return null;

  const locM = body.match(/Location:\s*(.+)/);
  const amtM = body.match(/Amount:\s*[₹Rs.]*\s*([\d,]+)/);
  const payM = body.match(/Payment Status:\s*(\w+)/);
  const nameM = body.match(/Guest Name\s*:\s*\*?([^\n*]+)/);
  const phoneM = body.match(/Guest number\s*:\s*\*?([^\n*]+)/);
  const dateM = body.match(/Date & Time\s*:\s*\*?([^\n*]+)/);

  const location = locM ? locM[1].trim() : '';
  const amount = amtM ? amtM[1].replace(/,/g, '') : '0';
  const payment = payM ? payM[1].trim() : '';
  const guest = nameM ? nameM[1].trim() : '';
  const phone = phoneM ? phoneM[1].trim() : '';
  const dtStr = dateM ? dateM[1].trim() : '';

  let orderDate = '', orderTime = '';
  const dp = dtStr.match(/(\w+ \d+, \d+),?\s*(\d+:\d+ [AP]M)/);
  if (dp) {
    const d = new Date(dp[1]);
    if (!isNaN(d.getTime())) {
      orderDate = (d.getMonth()+1).toString().padStart(2,'0') + '/' + d.getDate().toString().padStart(2,'0') + '/' + d.getFullYear();
    }
    orderTime = dp[2];
  }

  // Parse items: " * 01 X Grilled Chicken " or " * 01 X Lemonade  ( Lemonade: Sweet &amp; Salted ) "
  const itemLines = body.match(/\* \d+ X .+/g) || [];
  const items = itemLines.map(line => {
    const m = line.match(/\* (\d+) X ([^(\n]+?)(?:\s*\(\s*(.+?)\s*\))?\s*$/);
    if (!m) return null;
    return { qty: m[1].trim(), name: m[2].trim(), variant: m[3] ? m[3].replace(/&amp;/g, '&').trim() : '' };
  }).filter(Boolean);

  return { orderId, orderDate, orderTime, guest, phone, location, amount, payment, items };
}

async function main() {
  process.stderr.write('Refreshing token...\n');
  const token = await refreshToken();
  process.stderr.write('Token refreshed. Fetching ' + ids.length + ' emails...\n');

  const BATCH = 10;
  const allOrders = [];
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const bodies = await Promise.all(batch.map(id => fetchMsg(token, id)));
    for (const b of bodies) {
      const order = parseOrder(b);
      if (order) allOrders.push(order);
    }
    process.stderr.write('Fetched ' + Math.min(i + BATCH, ids.length) + '/' + ids.length + ' (' + allOrders.length + ' BLRxZo orders)\n');
  }

  // Sort by date then time
  allOrders.sort((a, b) => {
    const da = new Date(a.orderDate.replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2') + ' ' + a.orderTime);
    const db = new Date(b.orderDate.replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2') + ' ' + b.orderTime);
    return da - db;
  });

  console.log(JSON.stringify({ totalBLRxZo: allOrders.length, orders: allOrders }));
}

main();
