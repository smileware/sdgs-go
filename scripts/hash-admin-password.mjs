import { randomBytes, scryptSync } from 'node:crypto'

const password = process.argv[2]
if (!password || password.length < 12) {
  process.stderr.write('Usage: npm run admin:hash -- "<password-of-at-least-12-characters>"\n')
  process.exitCode = 1
} else {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  process.stdout.write(`scrypt$${salt}$${hash}\n`)
}
