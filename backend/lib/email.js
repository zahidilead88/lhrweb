const nodemailer = require("nodemailer");

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function send({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP credentials not set — skipping email:", subject);
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"LHRWEB" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

async function sendWelcomeEmail(to, name) {
  await send({
    to,
    subject: `Welcome to LHRWEB, ${name}!`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2>Welcome, ${name}!</h2>
        <p>Your account is ready. Log in to get started.</p>
        <a href="${process.env.APP_URL || "http://localhost:3000"}/login"
           style="display:inline-block;padding:12px 24px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Go to Dashboard
        </a>
      </div>
    `,
  });
}

async function sendPaymentConfirmation(to, plan) {
  await send({
    to,
    subject: "Payment confirmed — your plan is active",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2>You're all set!</h2>
        <p>Your <strong>${plan}</strong> plan is now active. Start building your website.</p>
        <a href="${process.env.APP_URL || "http://localhost:3000"}/dashboard"
           style="display:inline-block;padding:12px 24px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Open Dashboard
        </a>
      </div>
    `,
  });
}

async function sendCancelledEmail(to) {
  await send({
    to,
    subject: "Your subscription has been cancelled",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2>Subscription cancelled</h2>
        <p>Your subscription has been cancelled. You can resubscribe at any time.</p>
        <a href="${process.env.APP_URL || "http://localhost:3000"}/pricing"
           style="display:inline-block;padding:12px 24px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          View Plans
        </a>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(to, resetUrl) {
  await send({
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="color:#6b7280;font-size:13px;margin-top:16px">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

async function sendFormSubmissionEmail(to, { businessName, formId, data }) {
  const rows = Object.entries(data || {})
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px">${k}</td><td style="padding:4px 0;font-size:13px">${String(v ?? "")}</td></tr>`)
    .join("");
  await send({
    to,
    subject: `New form submission — ${businessName}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2>New submission${formId ? ` (${formId})` : ""}</h2>
        <p style="color:#6b7280;font-size:13px">From your site: <strong>${businessName}</strong></p>
        <table style="border-collapse:collapse;margin-top:12px">${rows}</table>
      </div>
    `,
  });
}

module.exports = {
  sendWelcomeEmail,
  sendPaymentConfirmation,
  sendCancelledEmail,
  sendPasswordResetEmail,
  sendFormSubmissionEmail,
};
