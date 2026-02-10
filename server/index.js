import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from './models/User.js'
import Order from './models/Order.js'
import requireAuth from './middleware/requireAuth.js'

dotenv.config()

const app = express()

const PORT = process.env.PORT || 5000
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'
const TOKEN_NAME = 'auth_token'
const TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 8
const RESET_TOKEN_DEV_MODE = (process.env.RESET_TOKEN_DEV_MODE || 'true') === 'true'

app.use(express.json())
app.use(cookieParser())
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }

  const normalizedEmail = String(email).toLowerCase().trim()
  const existingUser = await User.findOne({ email: normalizedEmail })
  if (existingUser) {
    return res.status(409).json({ message: 'Email already registered.' })
  }

  const passwordHash = await bcrypt.hash(String(password), 12)
  const user = await User.create({ email: normalizedEmail, passwordHash })

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '8h' })
  res.cookie(TOKEN_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: TOKEN_MAX_AGE_MS,
  })

  return res.status(201).json({
    message: 'Signup successful.',
    user: { id: user._id, email: user.email },
  })
})

app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }

  const normalizedEmail = String(email).toLowerCase().trim()
  const user = await User.findOne({ email: normalizedEmail })

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' })
  }

  const passwordMatch = await bcrypt.compare(String(password), user.passwordHash)
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Invalid credentials.' })
  }

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '8h' })
  res.cookie(TOKEN_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: TOKEN_MAX_AGE_MS,
  })

  return res.json({ message: 'Signin successful.', user: { id: user._id, email: user.email } })
})

app.post('/api/auth/signout', (_req, res) => {
  res.clearCookie(TOKEN_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return res.json({ message: 'Signed out.' })
})

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select('_id email')
  if (!user) {
    return res.status(404).json({ message: 'User not found.' })
  }
  return res.json({ user: { id: user._id, email: user.email } })
})

app.post('/api/auth/forgot', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' })
  }

  const normalizedEmail = String(email).toLowerCase().trim()
  const user = await User.findOne({ email: normalizedEmail })

  if (!user) {
    return res.json({ message: 'If that account exists, a reset token was created.' })
  }

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  user.resetTokenHash = tokenHash
  user.resetTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 30)
  await user.save()

  if (RESET_TOKEN_DEV_MODE) {
    return res.json({
      message: 'Reset token generated (dev mode).',
      resetToken: rawToken,
    })
  }

  return res.json({ message: 'If that account exists, a reset token was created.' })
})

app.post('/api/auth/reset', async (req, res) => {
  const { token, password } = req.body

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and new password are required.' })
  }

  const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex')

  const user = await User.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpiresAt: { $gt: new Date() },
  })

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset token.' })
  }

  user.passwordHash = await bcrypt.hash(String(password), 12)
  user.resetTokenHash = null
  user.resetTokenExpiresAt = null
  await user.save()

  return res.json({ message: 'Password has been reset.' })
})

app.get('/api/orders', requireAuth, async (req, res) => {
  const orders = await Order.find({})
    .select('_id number customer product')
    .sort({ createdAt: -1 })
  return res.json({ orders })
})

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI in environment')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGODB_URI)
  console.log('MongoDB connected')

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
