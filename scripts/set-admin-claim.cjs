/**
 * Grants (or revokes) the `admin: true` custom claim on a Firebase Auth user.
 * Firestore/Storage rules only allow privileged writes for tokens carrying
 * this claim, so it can only be granted from a machine holding the service
 * account key — never from the website.
 *
 * Setup (one time):
 *   1. Firebase Console > Project settings > Service accounts >
 *      "Generate new private key" — save as serviceAccountKey.json in the
 *      project root. NEVER commit or upload this file.
 *   2. npm install
 *
 * Usage:
 *   node scripts/set-admin-claim.cjs admin@kancainsaat.com
 *   node scripts/set-admin-claim.cjs admin@kancainsaat.com --revoke
 */
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

const email = process.argv[2];
const revoke = process.argv.includes('--revoke');

if (!email || !email.includes('@')) {
  console.error('Kullanım: node scripts/set-admin-claim.cjs <admin-eposta> [--revoke]');
  process.exit(1);
}

const keyPath = process.env.SERVICE_ACCOUNT_KEY
  || path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(keyPath)) {
  console.error(`Servis hesabı anahtarı bulunamadı: ${keyPath}`);
  console.error('Firebase Console > Proje ayarları > Servis hesapları > "Yeni özel anahtar oluştur"');
  console.error('İndirilen dosyayı proje kökünde serviceAccountKey.json olarak kaydedin.');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });

(async () => {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, revoke ? null : { admin: true });
    console.log(revoke
      ? `Admin yetkisi kaldırıldı: ${email} (${user.uid})`
      : `Admin yetkisi verildi: ${email} (${user.uid})`);
    console.log('Not: Kullanıcının yeniden giriş yapması gerekir (token yenilenmeli).');
    process.exit(0);
  } catch (err) {
    console.error('Hata:', err.message);
    process.exit(1);
  }
})();
