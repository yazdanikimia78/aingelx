const nodemailer = require('nodemailer');

const PLAN_MAP = {
  'price_1TD8uFRYwmUT8GCOYrxfQzRX': { label: 'Starter — $97',          delivery: '48 hours' },
  'price_1TD8uNRYwmUT8GCOXSJ6IRBh': { label: 'Done For You — $297',    delivery: '24 hours' },
  'price_1TD8uNRYwmUT8GCOBtcOpdJ2': { label: 'Monthly Retainer — $197/mo', delivery: '48 hours' }
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  let stripeEvent;
  try {
    stripeEvent = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Only handle checkout session completed
  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'Ignored' };
  }

  const session = stripeEvent.data.object;
  const customerEmail = session.customer_details?.email || session.customer_email;
  const customerName  = session.customer_details?.name || 'Customer';
  const firstName     = customerName.split(' ')[0];
  const amountPaid    = session.amount_total ? `$${(session.amount_total / 100).toFixed(0)}` : '';

  // Determine plan from line items (stored in metadata or price id)
  const priceId = session.metadata?.price_id || '';
  const plan    = PLAN_MAP[priceId] || { label: `Order — ${amountPaid}`, delivery: '48 hours' };

  if (!customerEmail) return { statusCode: 200, body: 'No email found' };

  const transporter = nodemailer.createTransport({
    host: 'smtp.improvmx.com',
    port: 587,
    secure: false,
    auth: { user: 'hello@aingelx.com', pass: process.env.SMTP_PASSWORD }
  });

  // ── Confirmation to customer ─────────────────────────────────────────────────
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
  .timeline{margin:24px 0;}
  .step{display:flex;gap:14px;margin-bottom:16px;}
  .dot{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:0.75rem;font-weight:700;}
  .step-text{padding-top:4px;font-size:0.875rem;color:#555;line-height:1.5;}
  .step-text strong{display:block;color:#1a1a2e;font-size:0.9rem;margin-bottom:2px;}
  .footer{padding:20px 40px;border-top:1px solid #f0f0f5;}
  .footer p{font-size:0.8rem;color:#999;margin:0;}
  .footer a{color:#6366f1;text-decoration:none;}
</style></head><body>
<div class="wrap"><div class="card">
  <div class="header"><h1>Payment confirmed. We're on it, ${firstName}.</h1></div>
  <div class="body">
    <p>Your payment was successful and our team has been notified. We're starting on your sequence right now.</p>
    <div class="details">
      <p><strong>Plan:</strong> ${plan.label}</p>
      <p><strong>Amount paid:</strong> ${amountPaid}</p>
      <p><strong>Delivery:</strong> Within ${plan.delivery}</p>
    </div>
    <p style="font-weight:600;color:#1a1a2e;margin-bottom:12px;">What happens next:</p>
    <div class="timeline">
      <div class="step"><div class="dot">1</div><div class="step-text"><strong>We start writing</strong>Your business details are with our team. Research and drafting begins immediately.</div></div>
      <div class="step"><div class="dot">2</div><div class="step-text"><strong>Quality review</strong>Every email reviewed for tone, clarity, and conversion before delivery.</div></div>
      <div class="step"><div class="dot">3</div><div class="step-text"><strong>Delivered to this inbox</strong>Your completed sequence arrives within ${plan.delivery}. We'll follow up if we need anything.</div></div>
    </div>
    <p>Questions? Just reply to this email — we're here.</p>
    <p>— The Aingelx Team</p>
  </div>
  <div class="footer"><p>Aingelx · <a href="https://aingelx.com">aingelx.com</a> · <a href="mailto:hello@aingelx.com">hello@aingelx.com</a></p></div>
</div></div></body></html>`;

  // ── Internal paid notification ────────────────────────────────────────────────
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
  .status{display:inline-block;background:#d1fae5;color:#065f46;font-size:0.75rem;font-weight:600;padding:3px 10px;border-radius:20px;}
</style></head><body>
<div class="wrap"><div class="card">
  <div class="header">
    <h1>💰 Payment received!</h1>
    <p>${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' })} PT</p>
  </div>
  <div class="body">
    <div class="row"><span class="label">Status</span><span class="value"><span class="status">PAID ✓</span></span></div>
    <div class="row"><span class="label">Name</span><span class="value">${customerName}</span></div>
    <div class="row"><span class="label">Email</span><span class="value"><a href="mailto:${customerEmail}">${customerEmail}</a></span></div>
    <div class="row"><span class="label">Plan</span><span class="value">${plan.label}</span></div>
    <div class="row"><span class="label">Amount</span><span class="value">${amountPaid}</span></div>
    <div class="row"><span class="label">Deliver by</span><span class="value">Within ${plan.delivery}</span></div>
  </div>
</div></div></body></html>`;

  try {
    await Promise.all([
      transporter.sendMail({ from: '"Aingelx" <hello@aingelx.com>', to: customerEmail, subject: 'Payment confirmed — your sequence is in progress', html: customerHtml }),
      transporter.sendMail({ from: '"Aingelx Orders" <hello@aingelx.com>', to: 'aingelxteam@gmail.com', subject: `💰 Paid: ${customerName} — ${plan.label}`, html: internalHtml })
    ]);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
