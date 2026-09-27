const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {initializeApp}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');
initializeApp();
const db=getFirestore();
function adminOnly(request){if(!request.auth||request.auth.token.admin!==true)throw new HttpsError('permission-denied','Admin authorization required.');}
function cleanBudgetId(v){return String(v||'').trim().toUpperCase();}
exports.createBudgetUser=onCall(async request=>{
  adminOnly(request);
  const {firstName,lastName,email,budgetId,tempPassword}=request.data||{};
  const bid=cleanBudgetId(budgetId);
  if(!firstName||!email||!bid||!tempPassword)throw new HttpsError('invalid-argument','First name, email, Budget ID and temporary password are required.');
  if(!/^BID[0-9A-Z_-]+$/.test(bid))throw new HttpsError('invalid-argument','Budget ID must start with BID and contain only letters, numbers, hyphens or underscores.');
  if(String(tempPassword).length<6)throw new HttpsError('invalid-argument','Temporary password must be at least 6 characters.');
  const existing=await db.collection('users').where('budgetId','==',bid).limit(1).get();
  if(!existing.empty)throw new HttpsError('already-exists','Budget ID already exists.');
  const authEmail=`${bid.toLowerCase()}@budgeting.local`;
  try{
    const u=await getAuth().createUser({email:authEmail,password:tempPassword,displayName:`${firstName} ${lastName||''}`.trim()});
    await db.collection('users').doc(u.uid).set({budgetId:bid,firstName,lastName:lastName||'',email,authEmail,status:'active',mustChangePassword:true,createdAt:FieldValue.serverTimestamp(),createdBy:request.auth.uid});
    return {uid:u.uid,budgetId:bid};
  }catch(e){throw new HttpsError('internal',e.message||'Unable to create client account.');}
});
exports.setUserStatus=onCall(async request=>{adminOnly(request);const {uid,status}=request.data||{};if(!uid||!['active','suspended'].includes(status))throw new HttpsError('invalid-argument','Invalid user status.');await db.collection('users').doc(uid).update({status});if(status==='suspended')await getAuth().updateUser(uid,{disabled:true});else await getAuth().updateUser(uid,{disabled:false});return {ok:true};});
