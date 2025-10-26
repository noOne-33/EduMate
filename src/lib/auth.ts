import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET!;
if (!secret) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export function signJwt(payload: object) {
    return jwt.sign(payload, secret, { expiresIn: '1h' });
}

export function verifyJwt(token: string) {
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        return null;
    }
}
