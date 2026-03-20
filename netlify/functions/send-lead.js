const nodemailer = require('nodemailer');

const PLAN_LABELS = {
  starter:  'Starter — $97 (one-time)',
  dfy:      'Done For You — $297 (one-time)',
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
  try { data = JSON.parse(event.body); } catch { return { statusCode: 400, body: 'Invalid JSON' }; }

  const { name, email, plan, business, target, outcome, tool } = data;
  const planLabel = PLAN_LABELS[plan] || plan;
  const stripeLink = STRIPE_LINKS[plan] || STRIPE_LINKS.starter;
  const firstName = name ? name.split(' ')[0] : 'there';

  const transporter = nodemailer.createTransport({
    host: 'smtp.improvmx.com',
    port: 587,
    secure: false,
    auth: { user: 'hello@aingelx.com', pass: process.env.SMTP_PASSWORD }
  });

  // ── Email to customer: here's your payment link ──────────────────────────────
  const customerHtml = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f5f5f7;margin:0;padding:40px 20px;}
  .wrap{max-width:560px;margin:0 auto;}
  .card{background:#fff;border-radius:16px;overflow:hidden;}
  .header{background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:36px 40px;}
  .header h1{color:#fff;font-size:1.4rem;font-weight:700;margin:0;letter-spacing:-0.02em;}
  .body{padding:36px 40px;color:#1a1a2e;}
  p{font-size:0.95rem;line-height:1.7;color:#444;margin:0 0 16px;}
  .details{background:#f8f8fc;border-radius:10px;padding:20px 24px;margin:24px 0;}
  .details p{margin:6px 0;font-size:0.875rem;color:#555;}
  .details strong{color:#1a1a2e;}
  .pay-btn{display:block;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;color:#fff;font-size:1rem;font-weight:600;padding:16px 24px;text-align:center;text-decoration:none;margin:24px 0;}
  .footer{padding:20px 40px;border-top:1px solid #f0f0f5;}
  .footer p{font-size:0.8rem;color:#999;margin:0;}
  .footer a{color:#6366f1;text-decoration:none;}
</style></head><body>
<div class="wrap"><div class="card">
  <div class="header"><h1>Got it, ${firstName}. Here's your payment link.</h1></div>
  <div class="body">
    <p>We've received your details and we're ready to start. One last step — complete your payment to lock in your spot and we'll get to work immediately.</p>
    <div class="details">
      <p><strong>Plan:</strong> ${planLabel}</p>
      <p><strong>Delivery:</strong> ${plan === 'dfy' ? '24 hours' : '48 hours'}</p>
    </div>
    <a href="${stripeLink}" class="pay-btn">Complete Payment →</a>
    <p>This link is secure and powered by Stripe. If you have any questions before paying, just reply to this email.</p>
    <p>— The Aingelx Team</p>
  </div>
  <div class="footer"><p>Aingelx · <a href="https://aingelx.com">aingelx.com</a> · <a href="mailto:hello@aingelx.com">hello@aingelx.com</a></p></div>
</div></div></body></html>`;

  // ── Internal lead notification ────────────────────────────────────────────────
  const internalHtml = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f5f5f7;margin:0;padding:40px 20px;}
  .wrap{max-width:560px;margin:0 auto;}
  .card{background:#fff;border-radius:16px;overflow:hidden;}
  .header{background:#1a1a2e;padding:28px 36px;}
  .header h1{color:#a5b4fc;font-size:1.1rem;font-weight:600;margin:0;}
  .header p{color:#888;font-size:0.85rem;margin:4px 0 0;}
  .body{padding:32px 36px;}
  .row{display:flex;gap:8px;margin-bottom:12px;font-size:0.9rem;}
  .label{font-weight:600;color:#1a1a2e;min-width:110px;flex-shrink:0;}
  .value{color:#444;line-height:1.5;}
  hr{border:none;border-top:1px solid #f0f0f5;margin:20px 0;}
  .status{display:inline-block;background:#fef3c7;color:#92400e;font-size:0.75rem;font-weight:600;padding:3px 10px;border-radius:20px;}
</style></head><body>
<div class="wrap"><div class="card">
  <div class="header">
    <h1>🆕 New lead — hasn't paid yet</h1>
    <p>${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' })} PT</p>
  </div>
  <div class="body">
    <div class="row"><span class="label">Status</span><span class="value"><span class="status">FORM SUBMITTED — AWAITING PAYMENT</span></span></div>
    <div class="row"><span class="label">Name</span><span class="value">${name}</span></div>
    <div class="row"><span class="label">Email</span><span class="value"><a href="mailto:${email}">${email}</a></span></div>
    <div class="row"><span class="label">Plan</span><span class="value">${planLabel}</span></div>
    <hr/>
    <div class="row"><span class="label">Business</span><span class="value">${business}</span></div>
    <div class="row"><span class="label">Target customer</span><span class="value">${target || '—'}</span></div>
    <div class="row"><span class="label">Outcome</span><span class="value">${outcome || '—'}</span></div>
    <div class="row"><span class="label">Email tool</span><span class="value">${tool || '—'}</span></div>
    <hr/>
    <div class="row"><span class="label">Payment link</span><span class="value"><a href="${stripeLink}">${stripeLink}</a></span></div>
  </div>
</div></div></body></html>`;

  try {
    await Promise.all([
      transporter.sendMail({ from: '"Aingelx" <hello@aingelx.com>', to: email, subject: `Your payment link — ${planLabel}`, html: customerHtml }),
      transporter.sendMail({ from: '"Aingelx Leads" <hello@aingelx.com>', to: 'aingelxteam@gmail.com', subject: `New lead (unpaid): ${name} — ${planLabel}`, html: internalHtml })
    ]);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
