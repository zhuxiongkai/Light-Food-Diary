import nodemailer from 'nodemailer'
import { config } from '../config.js'

function hasSmtpConfig() {
  return !!(config.smtp.host && config.smtp.user && config.smtp.pass && config.smtp.from)
}

export async function sendVerificationCodeEmail(email: string, code: string) {
  if (!hasSmtpConfig()) {
    if (config.nodeEnv !== 'production') {
      console.info(`[EmailVerification] ${email} 注册验证码：${code}`)
      return
    }
    throw new Error('SMTP未配置')
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  })

  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: '轻卡记注册验证码',
    text: `你的轻卡记注册验证码是：${code}。验证码10分钟内有效，请勿转发给他人。`,
  })
}
