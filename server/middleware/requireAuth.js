import jwt from 'jsonwebtoken'

const TOKEN_NAME = 'auth_token'

export default function requireAuth(req, res, next) {
  const token = req.cookies?.[TOKEN_NAME]
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated.' })
  }

  try {
    const secret = process.env.JWT_SECRET
    const payload = jwt.verify(token, secret)
    req.userId = payload.userId
    return next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session.' })
  }
}
