import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const SECRET = process.env.JWT_SECRET

export function hashPassword(pw) {
  return bcrypt.hashSync(pw, 10)
}

export function verifyPassword(pw, hash) {
  return bcrypt.compareSync(pw, hash)
}

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET)
  } catch (e) {
    return null
  }
}

export function getUserFromRequest(request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token) return null
  return verifyToken(token)
}
