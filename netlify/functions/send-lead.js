const nodemailer = require('nodemailer');

const PLAN_LABELS = {
  starter:  'Starter — $97 one-time',
  dfy:      'Done For You — $297 one-time',
  retainer: 'Monthly Retainer — $197/mo'
};

const STRIPE_LINKS = {
  starter:  'https://buy.stripe.com/7sY4gB2YaeUvcYr5LNcEw00',
  dfy:      'https://buy.stripe.com/28E6oJ7eq3bNf6zgqrcEw01',
  retainer: 'https://buy.stripe.com/eVq9AVbuG6nZ0bFb67cEw02'
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  let data;
  try { data = JSON.parse(event.body); } catch { return { statusCode: 400, body: 'Bad JSON' }; }

  const { name, email, plan, business, target, outcome, tool } = data;
  const planLabel = PLAN_LABELS[plan] || plan;
  const stripeLink = STRIPE_LINKS[plan] || '#';
  const firstName = (name || '').split(' ')[0];
  const ts = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' });

  const transporter = nodemailer.createTransport({
    host: 'smtp.improvmx.com',
    port: 587,
    secure: false,
    auth: { user: 'hello@aingelx.com', pass: process.env.SMTP_PASSWORD }
  });

  // ── Email to customer: here's your payment link ──────────────────────────────
  const customerHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f5f5f7;margin:0;padding:40px 20px;}
.wrap{max-width:560px;margin:0 auto;}
.card{background:#fff;border-radius:16px;overflow:hidden;}
.header{background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:36px 40px;}
.header h1{color:#fff;font-size:1.4rem;font-weight:700;margin:0;letter-spacing:-0.02em;}
.body{padding:36px 40px;color:#1a1a2e;}
.body p{font-size:0.95rem;line-height:1.7;color:#444;margin:0 0 16px;}
.btn{display:block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;text-align:center;padding:16px 32px;border-radius:10px;font-weight:600;font-size:1rem;margin:28px 0;}
.details{background:#f8f8fc;border-radius:10px;padding:18px 22px;margin:20px 0;font-size:0.875rem;color:#555;}
.details strong{color:#1a1a2e;}
.footer{padding:20px 40px;border-top:1px solid #f0f0f5;}
.footer p{font-size:0.8rem;color:#999;margin:0;}
.footer a{color:#6366f1;text-decoration:none;}
</style></head>
<body><div class="wrap"><div class="card">
<div class="header"><h1>One step left, ${firstName} — complete your order</h1></div>
<div class="body">
<p>Thanks for sharing your details. We've saved everything and you're ready to complete your purchase.</p>
<div class="details">
  <p><strong>Plan:</strong> ${planLabel}</p>
  <p><strong>Name:</strong> ${name}</p>
</div>
<p>Click the button below to securely pay via Stripe. Your email sequence will be delivered within ${plan === 'dfy' ? '24 hours' : '48 hours'} of payment.</p>
<a href="${stripeLink}" class="btn">Complete Payment →</a>
<p style="font-size:0.85rem;color:#999;">This link is secure and powered by Stripe. If you have any questions, reply to this email.</p>
</div>
<div class="footer"><p>Aingelx · <a href="https://aingelx.com">aingelx.com</a> · <a href="mailto:hello@aingelx.com">hello@aingelx.com</a></p></div>
</div></div></body></html>`;

  // ── Internal notification: new lead ─────────────────────────────────────────
  const internalHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f5f5f7;margin:0;padding:40px 20px;}
.wrap{max-width:560px;margin:0 auto;}
.card{background:#fff;border-radius:16px;overflow:hidden;}
.header{background:#1a1a2e;padding:24px 32px;}
.header h1{color:#a5b4fc;font-size:1rem;font-weight:600;margin:0;}
.header p{color:#666;font-size:0.8rem;margin:4px 0 0;}
.body{padding:28px 32px;}
.row{display:flex;gap:8px;margin-bottom:10px;font-size:0.875rem;}
.label{font-weight:600;color:#1a1a2e;min-width:110px;flex-shrink:0;}
.value{color:#444;line-height:1.5;}
hr{border:none;border-top:1px solid #f0f0f5;margin:16px 0;}
.badge{display:inline-block;background:#fef3c7;color:#92400e;font-size:0.75rem;font-weight:600;padding:3px 10px;border-radius:20px;margin-bottom:16px;}
</style></head>
<body><div class="wrap"><div class="card">
<div class="header">
  <h1>🔔 New lead — awaiting payment</h1>
  <p>${ts} PT</p>
</div>
<div class="body">
<div class="badge">NOT PAID YET</div>
<div class="row"><span class="label">Name</span><span class="value">${name}</span></div>
<div class="row"><span class="label">Email</span><span class="value"><a href="mailto:${email}">${email}</a></span></div>
<div class="row"><span class="label">Plan</span><span class="value">${planLabel}</span></div>
<hr/>
<div class="row"><span class="label">Business</span><span class="value">${business || '—'}</span></div>
<div class="row"><span class="label">Target</span><span class="value">${target || '—'}</span></div>
<div class="row"><span class="label">Outcome</span><span class="value">${outcome || '—'}</span></div>
<div class="row"><span class="label">Email tool</span><span class="value">${tool || '—'}</span></div>
<hr/>
<div class="row"><span class="label">Payment link</span><span class="value"><a href="${stripeLink}">${stripeLink}</a></span></div>
</div></div></div></body></html>`;

  try {
    await Promise.all([
      transporter.sendMail({
        from: '"Aingelx" <hello@aingelx.com>',
        to: email,
        subject: `Complete your Aingelx order — ${planLabel}`,
        html: customerHtml
      }),
      transporter.sendMail({
        from: '"Aingelx Leads" <hello@aingelx.com>',
        to: 'aingelxteam@gmail.com',
        subject: `🔔 New lead: ${name} — ${planLabel}`,
        html: internalHtml
      })
    ]);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
