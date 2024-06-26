import { HMAC_SIGNATURE_KEY } from './globals'
import crypto from 'node:crypto'

export default function signRequestBody (body: Uint8Array): string {
  return crypto.createHmac('sha256', HMAC_SIGNATURE_KEY).update(body).digest('hex')
}
