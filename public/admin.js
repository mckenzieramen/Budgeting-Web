import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, getIdTokenResult } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getFirestore, collection, getDocs, orderBy, query } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js';
import { firebaseConfig } from './firebase-config.js';

const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app), functions=getFunctions(app);
const $=id=>document.getElementById(id);
let users=[];

function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function showDashboard(){ $('adminLogin').classList.add('hidden'); $('adminDashboard').classList.remove('hidden'); }
function showLogin(msg=''){ $('adminDashboard').classList.add('hidden'); $('adminLogin').classList.remove('hidden'); $('adminLoginError').textContent=msg; }

async function isAdmin(user){
  const token=await getIdTokenResult(user,true);
  return token.claims.admin===true;
}

async function loadUsers(){
  $('listMessage').textContent='Loading accounts…';
  try{
    const snap=await getDocs(query(collection(db,'users'),orderBy('createdAt','desc')));
    users=snap.docs.map(d=>({uid:d.id,...d.data()}));
    const active=users.filter(u=>u.status==='active').length;
    $('statTotal').textContent=users.length; $('statActive').textContent=active; $('statSuspended').textContent=users.length-active;
    $('userRows').innerHTML=users.map(u=>`<tr><td><strong>${esc(u.budgetId)}</strong></td><td>${esc(`${u.firstName||''} ${u.lastName||''}`.trim())}</td><td>${esc(u.email||'')}</td><td><span class="pill ${u.status==='active'?'':'suspended'}">${esc(u.status||'unknown')}</span></td><td>${u.status==='active'?`<button class="danger-btn" data-suspend="${esc(u.uid)}">Suspend</button>`:`<button class="ghost" data-activate="${esc(u.uid)}">Activate</button>`}</td></tr>`).join('') || '<tr><td colspan="5">No accounts yet.</td></tr>';
    $('listMessage').textContent=`${users.length} account${users.length===1?'':'s'} found.`;
  }catch(e){ $('listMessage').textContent=e.message||'Unable to load accounts.'; }
}

$('adminLoginForm').addEventListener('submit',async e=>{
  e.preventDefault(); $('adminLoginError').textContent='';
  try{
    const cred=await signInWithEmailAndPassword(auth,$('adminEmail').value.trim(),$('adminPassword').value);
    if(!await isAdmin(cred.user)){ await signOut(auth); throw new Error('This Firebase account is not an administrator.'); }
    $('adminUserLabel').textContent=cred.user.email||'Administrator'; showDashboard(); await loadUsers();
  }catch(err){ $('adminLoginError').textContent=err.message.includes('auth/')?'Invalid email or password.':err.message; }
});

$('adminLogout').onclick=()=>signOut(auth);
$('adminRefresh').onclick=()=>loadUsers();

$('createUserForm').addEventListener('submit',async e=>{
  e.preventDefault(); $('createMessage').textContent='Creating account…'; $('createMessage').className='hint';
  try{
    const createBudgetUser=httpsCallable(functions,'createBudgetUser');
    const result=await createBudgetUser({firstName:$('newFirstName').value.trim(),lastName:$('newLastName').value.trim(),email:$('newEmail').value.trim(),budgetId:$('newBudgetId').value.trim().toUpperCase(),tempPassword:$('newTempPassword').value});
    $('createMessage').textContent=`Account ${result.data.budgetId} created successfully.`; $('createMessage').className='success';
    e.target.reset(); await loadUsers();
  }catch(err){ $('createMessage').textContent=err.message||'Unable to create account.'; $('createMessage').className='error'; }
});

document.addEventListener('click',async e=>{
  const suspend=e.target.closest('[data-suspend]'); const activate=e.target.closest('[data-activate]');
  if(!suspend&&!activate)return;
  const uid=(suspend||activate).dataset.suspend|| (suspend||activate).dataset.activate;
  const status=suspend?'suspended':'active';
  if(!confirm(`${status==='suspended'?'Suspend':'Activate'} this account?`))return;
  try{await httpsCallable(functions,'setUserStatus')({uid,status});await loadUsers();}
  catch(err){alert(err.message||'Unable to update account.');}
});

onAuthStateChanged(auth,async user=>{
  if(!user){showLogin('');return;}
  try{if(await isAdmin(user)){showDashboard();await loadUsers();}else{await signOut(auth);showLogin('This Firebase account is not an administrator.');}}
  catch(e){await signOut(auth);showLogin('Unable to verify administrator access.');}
});
