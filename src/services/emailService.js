import nodemailer from "nodemailer";

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  // Initialize email transporter
  async initialize() {
    if (this.initialized) return;

    try {
      // Check if email credentials are provided
      if (
        !process.env.EMAIL_HOST ||
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_PASS
      ) {
        console.log("⚠️  Email service not configured - missing credentials");
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Verify the connection
      await this.transporter.verify();
      console.log("✅ Email service initialized successfully");
      this.initialized = true;
    } catch (error) {
      console.error("❌ Email service initialization failed:", error.message);
      this.transporter = null;
    }
  }

  // Check if email service is available
  isAvailable() {
    return this.initialized && this.transporter !== null;
  }

  // Generate OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP email for verification
  async sendVerificationOTP(email, otp, name = "User") {
    if (!this.isAvailable()) {
      throw new Error("Email service is not available");
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "LearnCode AI"}" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: email,
      subject: "Verify Your Email - LearnCode AI",
      html: this.getVerificationEmailTemplate(name, otp),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("📧 Verification email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Failed to send verification email:", error);
      throw new Error("Failed to send verification email");
    }
  }

  // Send password reset email
  async sendPasswordResetOTP(email, otp, name = "User") {
    if (!this.isAvailable()) {
      throw new Error("Email service is not available");
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "LearnCode AI"}" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: email,
      subject: "Reset Your Password - LearnCode AI",
      html: this.getPasswordResetEmailTemplate(name, otp),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("📧 Password reset email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Failed to send password reset email:", error);
      throw new Error("Failed to send password reset email");
    }
  }

  // Email verification template
  getVerificationEmailTemplate(name, otp) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background-color: #f9f9f9; padding: 30px; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #456DE6; margin-bottom: 10px; }
        .otp-box { background-color: #456DE6; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 10px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
        .btn { background-color: #456DE6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">LearnCode AI</div>
          <h2>Verify Your Email Address</h2>
        </div>
        
        <p>Hello ${name},</p>
        
        <p>Thank you for signing up for LearnCode AI! To complete your registration, please verify your email address using the OTP code below:</p>
        
        <div class="otp-box">
          <div>Your verification code is:</div>
          <div class="otp-code">${otp}</div>
          <div style="font-size: 14px; margin-top: 10px;">This code will expire in 15 minutes</div>
        </div>
        
        <p>If you didn't create a LearnCode AI account, you can safely ignore this email.</p>
        
        <div class="footer">
          <p><strong>LearnCode AI Team</strong><br>
          Your Online Code Editor & Executor</p>
          <p style="font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Password reset email template
  getPasswordResetEmailTemplate(name, otp) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background-color: #f9f9f9; padding: 30px; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #456DE6; margin-bottom: 10px; }
        .otp-box { background-color: #e74c3c; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 10px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; color: #856404; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">LearnCode AI</div>
          <h2>Reset Your Password</h2>
        </div>
        
        <p>Hello ${name},</p>
        
        <p>We received a request to reset your password for your LearnCode AI account. Use the verification code below to proceed:</p>
        
        <div class="otp-box">
          <div>Your password reset code is:</div>
          <div class="otp-code">${otp}</div>
          <div style="font-size: 14px; margin-top: 10px;">This code will expire in 15 minutes</div>
        </div>
        
        <div class="warning">
          <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email and consider changing your password for security.
        </div>
        
        <div class="footer">
          <p><strong>LearnCode AI Team</strong><br>
          Your Online Code Editor & Executor</p>
          <p style="font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Send contact form confirmation email
  async sendContactConfirmation(email, name, subject) {
    if (!this.isAvailable()) {
      console.log(
        "⚠️  Email service not available - skipping contact confirmation email"
      );
      return;
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "LearnCode AI"}" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: email,
      subject: "We Received Your Message - LearnCode AI",
      html: this.getContactConfirmationTemplate(name, subject),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("📧 Contact confirmation email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Failed to send contact confirmation email:", error);
      throw error;
    }
  }

  // Send contact form notification to admin
  async sendContactNotification({
    fullName,
    email,
    subject,
    message,
    contactId,
  }) {
    if (!this.isAvailable()) {
      console.log(
        "⚠️  Email service not available - skipping admin notification"
      );
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "LearnCode AI"}" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: adminEmail,
      subject: `New Contact Form Submission: ${subject}`,
      html: this.getContactNotificationTemplate(
        fullName,
        email,
        subject,
        message,
        contactId
      ),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(
        "📧 Contact notification email sent to admin:",
        info.messageId
      );
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Failed to send contact notification email:", error);
      throw error;
    }
  }

  // Send contact form response to user
  async sendContactResponse(email, name, subject, response) {
    if (!this.isAvailable()) {
      console.log(
        "⚠️  Email service not available - skipping contact response email"
      );
      return;
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "LearnCode AI"}" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: email,
      subject: `Re: ${subject}`,
      html: this.getContactResponseTemplate(name, subject, response),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("📧 Contact response email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Failed to send contact response email:", error);
      throw error;
    }
  }

  // Send contact form reply from admin to user
  async sendContactReply({
    to,
    recipientName,
    originalSubject,
    subject,
    message,
    adminName,
  }) {
    if (!this.isAvailable()) {
      console.log(
        "⚠️  Email service not available - skipping contact reply email"
      );
      return;
    }

    const mailOptions = {
      from: `"${adminName || process.env.EMAIL_FROM_NAME || "LearnCode AI"}" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: to,
      subject: subject,
      html: this.getContactReplyTemplate(
        recipientName,
        originalSubject,
        subject,
        message,
        adminName
      ),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("📧 Contact reply email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Failed to send contact reply email:", error);
      throw error;
    }
  }

  // Contact confirmation email template
  getContactConfirmationTemplate(name, subject) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Message Received</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background-color: #f9f9f9; padding: 30px; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #456DE6; margin-bottom: 10px; }
        .success-box { background-color: #27ae60; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">LearnCode AI</div>
          <h2>We Received Your Message!</h2>
        </div>
        
        <p>Hello ${name},</p>
        
        <p>Thank you for contacting LearnCode AI! We've successfully received your message regarding:</p>
        
        <div class="success-box">
          <strong>${subject}</strong>
        </div>
        
        <p>Our team will review your message and get back to you as soon as possible, typically within 24-48 hours.</p>
        
        <p>If your matter is urgent, please feel free to reach out to us directly at support@LearnCode AI.io</p>
        
        <div class="footer">
          <p><strong>LearnCode AI Team</strong><br>
          Your Online Code Editor & Executor</p>
          <p style="font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Contact notification email template for admin
  getContactNotificationTemplate(fullName, email, subject, message, contactId) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background-color: #f9f9f9; padding: 30px; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 30px; background-color: #456DE6; color: white; padding: 20px; border-radius: 8px; }
        .info-box { background-color: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #456DE6; }
        .message-box { background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .label { font-weight: bold; color: #456DE6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Contact Form Submission</h2>
        </div>
        
        <div class="info-box">
          <p><span class="label">From:</span> ${fullName}</p>
          <p><span class="label">Email:</span> ${email}</p>
          <p><span class="label">Subject:</span> ${subject}</p>
          <p><span class="label">Contact ID:</span> ${contactId}</p>
        </div>
        
        <div class="message-box">
          <p class="label">Message:</p>
          <p>${message.replace(/\n/g, "<br>")}</p>
        </div>
        
        <p style="text-align: center; margin-top: 30px;">
          <a href="${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/admin/contacts/${contactId}" 
             style="background-color: #456DE6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View in Admin Panel
          </a>
        </p>
      </div>
    </body>
    </html>
    `;
  }

  // Contact response email template
  getContactResponseTemplate(name, subject, response) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Response to Your Inquiry</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background-color: #f9f9f9; padding: 30px; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #456DE6; margin-bottom: 10px; }
        .response-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #456DE6; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">LearnCode AI</div>
          <h2>Response to Your Inquiry</h2>
        </div>
        
        <p>Hello ${name},</p>
        
        <p>Thank you for your patience. We're writing in response to your inquiry regarding: <strong>${subject}</strong></p>
        
        <div class="response-box">
          ${response.replace(/\n/g, "<br>")}
        </div>
        
        <p>If you have any additional questions or need further assistance, please don't hesitate to reach out to us again.</p>
        
        <div class="footer">
          <p><strong>LearnCode AI Team</strong><br>
          Your Online Code Editor & Executor</p>
          <p>Email: support@LearnCode AI.io</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Contact reply email template
  getContactReplyTemplate(
    recipientName,
    originalSubject,
    replySubject,
    replyMessage,
    adminName
  ) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reply from LearnCode AI</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background-color: #f9f9f9; padding: 30px; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #456DE6; margin-bottom: 10px; }
        .reply-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #456DE6; }
        .original-inquiry { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; font-style: italic; color: #666; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">LearnCode AI</div>
          <h2>Personal Reply from Our Team</h2>
        </div>
        
        <p>Hello ${recipientName},</p>
        
        <p>Thank you for contacting LearnCode AI. ${
          adminName || "Our team"
        } has personally reviewed your inquiry and wanted to respond directly:</p>
        
        <div class="original-inquiry">
          <strong>Your original inquiry:</strong> "${originalSubject}"
        </div>
        
        <div class="reply-box">
          ${replyMessage.replace(/\n/g, "<br>")}
        </div>
        
        <p>If you have any follow-up questions or need additional assistance, please don't hesitate to reach out to us again.</p>
        
        <div class="footer">
          <p><strong>${adminName || "LearnCode AI Team"}</strong><br>
          LearnCode AI - Your Online Code Editor & Executor</p>
          <p>Email: support@LearnCode AI.io | Website: LearnCode AI.io</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Send custom email (for admin notifications)
  async sendCustomEmail(email, subject, htmlMessage, name = "User") {
    if (!this.isAvailable()) {
      throw new Error("Email service is not available");
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "LearnCode AI"}" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: email,
      subject: subject,
      html: this.getCustomEmailTemplate(name, htmlMessage),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("📧 Custom email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Failed to send custom email:", error);
      throw new Error("Failed to send custom email");
    }
  }

  // Custom email template
  getCustomEmailTemplate(name, message) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Message from LearnCode AI</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .content {
          padding: 30px;
          color: #333;
          line-height: 1.6;
        }
        .message {
          background-color: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">LearnCode AI</h1>
          <p style="margin: 10px 0 0;">Message from LearnCode AI Team</p>
        </div>
        
        <div class="content">
          <p>Dear ${name},</p>
          <div class="message">
            ${message}
          </div>
        </div>
        
        <div class="footer">
          <p><strong>LearnCode AI Team</strong><br>
          Your Online Code Editor & Executor</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;

