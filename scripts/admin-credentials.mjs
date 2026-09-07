import { randomBytes, scryptSync } from 'node:crypto';
// Run locally. Never commit or paste the output into source files or a public issue.
const password = randomBytes(24).toString('base64url');
const salt = randomBytes(16).toString('hex');
console.log('Save this password in your password manager:\n' + password);
console.log('\nAdd these as sensitive Vercel environment variables:');
console.log(
  'ADMIN_PASSWORD_HASH=scrypt$' +
    salt +
    '$' +
    scryptSync(password, salt, 64).toString('hex'),
);
console.log('ADMIN_SESSION_SECRET=' + randomBytes(48).toString('base64url'));
