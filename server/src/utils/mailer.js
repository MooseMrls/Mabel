const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function sendUniqueId({ name, email, uniqueId }) {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') throw new Error('BREVO_API_KEY is not configured');
    console.log(`[mail:dev] Unique ID for ${email}: ${uniqueId}`);
    return;
  }
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your MaPSA Access Credentials</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Wrapper -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #eab308 0%, #ca8a04 100%);"></td>
          </tr>

          <!-- Header Area -->
          <tr>
            <td align="center" style="padding: 40px 32px 24px 32px; background: linear-gradient(180deg, #fefce8 0%, #ffffff 100%);">
              <!-- Logo Container -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center" style="background: #ffffff; padding: 12px 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #fef08a;">
                    <img src="https://mbes.vercel.app/mapsa-logo.png" alt="MaPSA Logo" width="130" style="display: block; max-width: 140px; height: auto; border: 0;" />
                  </td>
                </tr>
              </table>
              
              <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                Book Evaluation Portal
              </h1>
              <p style="margin: 0; font-size: 13px; font-weight: 500; color: #64748b; letter-spacing: 0.2px;">
                Manila Ecclesiastical Province School Systems Association
              </p>
            </td>
          </tr>

          <!-- Badge Banner -->
          <tr>
            <td align="center" style="padding: 0 32px;">
              <div style="display: inline-block; background-color: #fef9c3; border: 1px solid #fde047; padding: 6px 16px; border-radius: 9999px; text-align: center;">
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #854d0e;">
                  Evaluator Credentials Issued
                </span>
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 36px 36px 36px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
                Hello ${esc(name)},
              </p>
              
              <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                Welcome to the <strong>MaPSA Book Evaluation System</strong>. Your evaluator account has been registered, and your secure Access ID is ready for login.
              </p>

              <!-- Credentials Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px; background-color: #fafafa; border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; margin-bottom: 12px;">
                      Account Details
                    </div>
                    
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; width: 35%; font-weight: 500;">Full Name</td>
                        <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${esc(name)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Email Address</td>
                        <td style="padding: 6px 0; color: #2563eb; font-weight: 600;">${esc(email)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Big Unique Access ID Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%); border: 2px dashed #fde047; border-radius: 14px; padding: 28px 20px; text-align: center;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 2px; color: #854d0e; margin-bottom: 12px;">
                      Your Access ID
                    </div>
                    <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 34px; font-weight: 900; letter-spacing: 7px; color: #0f172a; margin-bottom: 12px; text-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                      ${esc(uniqueId)}
                    </div>
                    <div style="font-size: 12px; color: #71717a; font-weight: 500;">
                      Use this ID to access the evaluation portal.
                    </div>
                  </td>
                </tr>
              </table>


              <!-- Support & Help -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #f1f5f9; padding-top: 24px;">
                <tr>
                  <td align="center" style="font-size: 12px; color: #64748b; line-height: 1.6;">
                    Need assistance or have questions?<br>
                    Contact the Secretariat at <a href="mailto:support@mapsa.edu.ph" style="color: #2563eb; text-decoration: none; font-weight: 600;">support@mapsa.edu.ph</a> or call <strong>(02) 8564-3712</strong>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #475569;">
                &copy; ${new Date().getFullYear()} MaPSA Book Evaluation System
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Manila Ecclesiastical Province School Systems Association
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: process.env.MAIL_FROM_NAME || 'MaPSA BookCenter', email: process.env.MAIL_FROM_EMAIL || 'mapsaevents@gmail.com' },
      to: [{ email, name }],
      subject: 'Your MaPSA Book Evaluation ID',
      htmlContent,
    }),
  });
  if (!res.ok) throw new Error(`Brevo responded ${res.status}: ${await res.text()}`);
}


