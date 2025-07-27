// utils/mail.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

function sendVerificationEmail(to, token) {
  const verifyLink = `http://localhost:3000/verify?token=${token}`;
  return transporter.sendMail({
    from: '"Budget App" <noreply@budget.com>',
    to,
    subject: 'Verify your email',
    html: `<p>Please verify your email by clicking the link below:</p>
           <a href="${verifyLink}">${verifyLink}</a>`
  });
}

module.exports = sendVerificationEmail;
