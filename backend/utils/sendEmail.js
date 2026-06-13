import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOtpEmail = async (email, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  const mailOptions = {
    from: `"TaskConnect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your TaskConnect account",
    html: `
      <div style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:28px 32px 12px;">
                    <h1 style="margin:0;font-size:24px;line-height:32px;color:#111827;">Verify your email</h1>
                    <p style="margin:12px 0 0;font-size:15px;line-height:24px;color:#4b5563;">
                      Welcome to TaskConnect. Use the code below to finish creating your account.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:20px 32px;">
                    <div style="display:inline-block;letter-spacing:8px;font-size:32px;line-height:40px;font-weight:700;color:#2563eb;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 22px;">
                      ${otp}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 32px 28px;">
                    <p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">
                      This code expires in 10 minutes. If you did not request this email, you can safely ignore it.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export default sendOtpEmail;
