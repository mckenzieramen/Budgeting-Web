// Run this trusted setup script locally with a Firebase service-account key.
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json node set-admin.js admin@example.com
// Then deploy/revoke the service-account key according to your security policy.
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

initializeApp({ credential: applicationDefault() });

(async()=>{
  const email=process.argv[2];
  if(!email) throw new Error('Usage: node set-admin.js admin@example.com');
  const user=await getAuth().getUserByEmail(email);
  const existing=user.customClaims||{};
  await getAuth().setCustomUserClaims(user.uid,{...existing,admin:true});
  console.log(`Admin claim assigned to ${email}. Sign out and sign in again to refresh the ID token.`);
})().catch(err=>{console.error(err);process.exit(1);});
