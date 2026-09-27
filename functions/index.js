const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {initializeApp}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');
initializeApp(); const db=getFirestore();
function adminOnly(request){if(!request.auth||request.auth.token.admin!==true)throw new HttpsError('permission-denied','Admin authorization required.');}
exports.createBudgetUser=onCall(async request=>{adminOnly(request);const {firstName,lastName,email,budgetId,tempPassword}=request.data||{};if(!firstName||!email||!budgetId||!tempPassword)throw new HttpsError('invalid-argument','First name, email, Budget ID and temporary password are required.');const existing=await db.collection('users').where('budgetId','==',budgetId).limit(1).get();if(!existing.empty)throw new HttpsError('already-exists','Budget ID already exists.');const u=await getAuth().createUser({email,password:tempPassword,displayName:`${firstName} ${lastName||''}`.trim()});await db.collection('users').doc(u.uid).set({budgetId,firstName,lastName:lastName||'',email,authEmail:email,status:'active',mustChangePassword:true,createdAt:FieldValue.serverTimestamp(),createdBy:request.auth.uid});return {uid:u.uid,budgetId};});
exports.setUserStatus=onCall(async request=>{adminOnly(request);const {uid,status}=request.data||{};if(!uid||!['active','suspended'].includes(status))throw new HttpsError('invalid-argument','Invalid user status.');await db.collection('users').doc(uid).update({status});return {ok:true};});
// Admin custom claims must be assigned from a trusted Firebase Admin workflow.
// The previous public callable that allowed any signed-in user to self-promote to admin has intentionally been removed.
