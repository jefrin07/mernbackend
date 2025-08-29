import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendmail = async ({ to, subject, body }) => {
  const response = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: body,
  });
  return response;
};
export default sendmail;
