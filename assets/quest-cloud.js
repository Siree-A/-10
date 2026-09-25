import {cloudConfig as config} from './quest-cloud-config.js?v=community-1';
export const configured=!!config.url&&!!config.publishableKey;
let session=null,authPromise=null;
async function request(path,body,token){
  if(!configured)throw new Error('ยังไม่เชื่อมฐานข้อมูลกลาง');
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url))throw new Error('ตรวจ URL ของ Supabase');
  const response=await fetch(config.url+path,{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่');
  return response.json();
}
async function token(){
  if(session?.expires_at>Date.now()/1000+60)return session.access_token;
  if(authPromise)return authPromise;
  authPromise=(async()=>{
    try{session||=JSON.parse(localStorage.getItem('research10.quest.cloud-session')||'null');}catch{}
    if(session?.expires_at>Date.now()/1000+60)return session.access_token;
    session=await request(session?.refresh_token?'/auth/v1/token?grant_type=refresh_token':'/auth/v1/signup',session?.refresh_token?{refresh_token:session.refresh_token}:{data:{}});
    session.expires_at||=Date.now()/1000+session.expires_in;
    try{localStorage.setItem('research10.quest.cloud-session',JSON.stringify(session));}catch{}
    return session.access_token;
  })();
  try{return await authPromise;}finally{authPromise=null;}
}
export async function rpc(name,args={}){return request('/rest/v1/rpc/'+name,args,await token());}
export async function readRpc(name,args={}){return request('/rest/v1/rpc/'+name,args);}
