const nodemailer = require('nodemailer');

const PLAN_NAMES = {
  'price_1TD8uFRYwmUT8GCOYrxfQzRX': 'Starter — $97',
  'price_1TD8uNRYwmUT8GCOXSJ6IRBh': 'Done For You — $297',
  'price_1TD8uNRYwmUT8GCOBtcOpdJ2': 'Monthly Retainer — $197/mo'
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  let stripeEvent;
  try {
    stripeEvent = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Bad JSON' };
  }

  // Only handle completed checkouts
  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'Ignored' };
  }

  const session = stripeEvent.data.object;
  const customerEmail = session.customer_details?.email || '';
  const customerName  = session.customer_details?.name  || 'Customer';
  const firstName     = customerName.split(' ')[0];
  const amountPaid    = session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : '';
  const ts = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' });

  // Try to determine plan from line items (best effort)
  const planName = amountPaid;

  const transporter = nodemailer.createTransport({
    host: 'smtp.improvmx.com',
    port: 587,
    secure: false,
    auth: { user: 'hello@aingelx.com', pass: process.env.SMTP_PASSWORD }
  });

  // ── Confirmation email to customer ───────────────────────────────────────────
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
.details{background:#f8f8fc;border-radius:10px;padding:18px 22px;margin:20px 0;font-size:0.875rem;color:#555;}
.details p{margin:6px 0;}
.details strong{color:#1a1a2e;}
.timeline{margin:20px 0;}
.step{display:flex;gap:14px;margin-bottom:16px;}
.dot{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:0.75rem;font-weight:700;}
.step-text{padding-top:4px;font-size:0.875rem;color:#555;line-height:1.5;}
.step-text strong{display:block;color:#1a1a2e;font-size:0.9rem;margin-bottom:2px;}
.footer{padding:20px 40px;border-top:1px solid #f0f0f5;}
.footer p{font-size:0.8rem;color:#999;margin:0;}
.footer a{color:#6366f1;text-decoration:none;}
</style></head>
<body><div class="wrap"><div class="card">
<div class="header"><h1>Payment confirmed — we're on it, ${firstName}.</h1></div>
<div class="body">
<p>Your payment of <strong>${amountPaid}</strong> was received. Your personalized email sequence is now being crafted.</p>
<div class="details">
  <p><strong>Customer:</strong> ${customerName}</p>
  <p><strong>Email:</strong> ${customerEmail}</p>
  <p><strong>Amount paid:</strong> ${amountPaid}</p>
</div>
<p><strong>What happens next:</strong></p>
<div class="timeline">
  <div class="step"><div class="dot">1</div><div class="step-text"><strong>Research & drafting</strong>Our team reviews your business details and crafts your personalized sequence from scratch.</div></div>
  <div class="step"><div class="dot">2</div><div class="step-text"><strong>Quality review</strong>Every email is reviewed for tone, clarity, and conversion potential.</div></div>
  <div class="step"><div class="dot">3</div><div class="step-text"><strong>Delivery to your inbox</strong>You'll receive your completed sequence within 24–48 hours at this email address.</div></div>
</div>
<p>Questions? Simply reply to this email — we're here.</p>
<p style="margin-top:24px;">— The Aingelx Team</p>
</div>
<div class="footer"><p>Aingelx · <a href="https://aingelx.com">aingelx.com</a> · <a href="mailto:hello@aingelx.com">hello@aingelx.com</a></p></div>
</div></div></body></html>`;

  // ── Internal paid notification ───────────────────────────────────────────────
  const internalHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f5f5f7;margin:0;padding:40px 20px;}
.wrap{max-width:560px;margin:0 auto;}
.card{background:#fff;border-radius:16px;overflow:hidden;}
.header{background:#064e3b;padding:24px 32px;}
.header h1{color:#6ee7b7;font-size:1rem;font-weight:600;margin:0;}
.header p{color:#aaa;font-size:0.8rem;margin:4px 0 0;}
.body{padding:28px 32px;}
.row{display:flex;gap:8px;margin-bottom:10px;font-size:0.875rem;}
.label{font-weight:600;color:#1a1a2e;min-width:110px;flex-shrink:0;}
.value{color:#444;}
.badge{display:inline-block;background:#d1fae5;color:#065f46;font-size:0.75rem;font-weight:600;padding:3px 10px;border-radius:20px;margin-bottom:16px;}
</style></head>
<body><div class="wrap"><div class="card">
<div class="header">
  <h1>💰 Payment received!</h1>
  <p>${ts} PT</p>
</div>
<div class="body">
<div class="badge">PAID ✓</div>
<div class="row"><span class="label">Name</span><span class="value">${customerName}</span></div>
<div class="row"><span class="label">Email</span><span class="value"><a href="mailto:${customerEmail}">${customerEmail}</a></span></div>
<div class="row"><span class="label">Amount</span><span class="value">${amountPaid}</span></div>
<div class="row"><span class="label">Session ID</span><span class="value" style="font-size:0.75rem;color:#999;">${session.id}</span></div>
</div></div></div></body></html>`;

  try {
    const emails = [
      transporter.sendMail({
        from: '"Aingelx" <hello@aingelx.com>',
        to: customerEmail,
        subject: `Payment confirmed — your sequence is being crafted`,
        html: customerHtml
      }),
      transporter.sendMail({
        from: '"Aingelx Orders" <hello@aingelx.com>',
        to: 'aingelxteam@gmail.com',
        subject: `💰 Payment received: ${customerName} — ${amountPaid}`,
        html: internalHtml
      })
    ];
    await Promise.all(emails);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
