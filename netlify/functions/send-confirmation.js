const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { name, email, plan, business, target, outcome, tool } = data;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'aingelxteam@gmail.com',
      pass: process.env.SMTP_PASSWORD
    }
  });

  // ── Email to customer ────────────────────────────────────────────────────────
  const customerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f7; margin: 0; padding: 40px 20px; }
    .wrap { max-width: 560px; margin: 0 auto; }
    .card { background: #fff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 36px 40px; }
    .header h1 { color: #fff; font-size: 1.5rem; font-weight: 700; margin: 0; letter-spacing: -0.02em; }
    .body { padding: 36px 40px; color: #1a1a2e; }
    .body p { font-size: 0.95rem; line-height: 1.7; color: #444; margin: 0 0 16px; }
    .details { background: #f8f8fc; border-radius: 10px; padding: 20px 24px; margin: 24px 0; }
    .details p { margin: 6px 0; font-size: 0.875rem; color: #555; }
    .details strong { color: #1a1a2e; }
    .timeline { margin: 24px 0; }
    .step { display: flex; gap: 14px; margin-bottom: 16px; }
    .dot { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff; font-size: 0.75rem; font-weight: 700; }
    .step-text { padding-top: 4px; font-size: 0.875rem; color: #555; line-height: 1.5; }
    .step-text strong { display: block; color: #1a1a2e; font-size: 0.9rem; margin-bottom: 2px; }
    .footer { padding: 24px 40px; border-top: 1px solid #f0f0f5; }
    .footer p { font-size: 0.8rem; color: #999; margin: 0; }
    .footer a { color: #6366f1; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="header">
        <h1>We've got your details, ${name.split(' ')[0]}.</h1>
      </div>
      <div class="body">
        <p>Thank you for choosing Aingelx. Your payment is confirmed and we've received your business information. Our team is already on it.</p>

        <div class="details">
          <p><strong>Plan:</strong> ${plan}</p>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
        </div>

        <p style="font-weight:600; color:#1a1a2e; margin-bottom:12px;">What happens next:</p>
        <div class="timeline">
          <div class="step">
            <div class="dot">1</div>
            <div class="step-text">
              <strong>Research & drafting</strong>
              Our team reviews your business details and begins crafting your personalized sequence.
            </div>
          </div>
          <div class="step">
            <div class="dot">2</div>
            <div class="step-text">
              <strong>Quality review</strong>
              Every email is reviewed for tone, clarity, and conversion potential before delivery.
            </div>
          </div>
          <div class="step">
            <div class="dot">3</div>
            <div class="step-text">
              <strong>Delivery to your inbox</strong>
              You'll receive your completed sequence at this email address within ${plan.includes('Done For You') ? '24 hours' : '48 hours'}.
            </div>
          </div>
        </div>

        <p>If you have any questions in the meantime, simply reply to this email or reach us at <a href="mailto:hello@aingelx.com">hello@aingelx.com</a>.</p>
        <p>We're looking forward to delivering something you'll love.</p>
        <p style="margin-top:24px;">— The Aingelx Team</p>
      </div>
      <div class="footer">
        <p>Aingelx · <a href="https://aingelx.com">aingelx.com</a> · <a href="mailto:hello@aingelx.com">hello@aingelx.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

  // ── Email to Parsa (internal notification) ───────────────────────────────────
  const internalHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f7; margin: 0; padding: 40px 20px; }
    .wrap { max-width: 560px; margin: 0 auto; }
    .card { background: #fff; border-radius: 16px; overflow: hidden; }
    .header { background: #1a1a2e; padding: 28px 36px; }
    .header h1 { color: #a5b4fc; font-size: 1.1rem; font-weight: 600; margin: 0; }
    .header p { color: #888; font-size: 0.85rem; margin: 4px 0 0; }
    .body { padding: 32px 36px; }
    .row { display: flex; gap: 8px; margin-bottom: 12px; font-size: 0.9rem; }
    .label { font-weight: 600; color: #1a1a2e; min-width: 110px; flex-shrink: 0; }
    .value { color: #444; line-height: 1.5; }
    .divider { border: none; border-top: 1px solid #f0f0f5; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="header">
        <h1>🎉 New order received</h1>
        <p>Aingelx · ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' })} PT</p>
      </div>
      <div class="body">
        <div class="row"><span class="label">Name</span><span class="value">${name}</span></div>
        <div class="row"><span class="label">Email</span><span class="value"><a href="mailto:${email}">${email}</a></span></div>
        <div class="row"><span class="label">Plan</span><span class="value">${plan}</span></div>
        <hr class="divider"/>
        <div class="row"><span class="label">Business</span><span class="value">${business}</span></div>
        <div class="row"><span class="label">Target customer</span><span class="value">${target || '—'}</span></div>
        <div class="row"><span class="label">Outcome</span><span class="value">${outcome || '—'}</span></div>
        <div class="row"><span class="label">Email tool</span><span class="value">${tool || '—'}</span></div>
      </div>
    </div>
  </div>
</body>
</html>`;

  try {
    await Promise.all([
      transporter.sendMail({
        from: '"Aingelx" <hello@aingelx.com>',
        to: email,
        subject: `We've received your order — here's what's next`,
        html: customerHtml
      }),
      transporter.sendMail({
        from: '"Aingelx Orders" <hello@aingelx.com>',
        to: 'aingelxteam@gmail.com',
        subject: `New order: ${plan} — ${name}`,
        html: internalHtml
      })
    ]);

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
