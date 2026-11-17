import {createDemoAccount} from './demo-account.js';

// Account requests are intentionally disabled in the standalone demo.
// A production backend must provide the same-origin endpoints in LIVE_SATIS_HAZIRLIK.md.
export function createAccountClient({mode='demo',apiBase='/api/v1',fetchImpl=globalThis.fetch,demoStorage,demoCrypto}={}){
  if(!['demo','live'].includes(mode))throw new Error('Invalid account mode');
  if(!apiBase.startsWith('/')||apiBase.startsWith('//'))throw new Error('Account API must be same-origin');
  const base=apiBase.replace(/\/$/,'');
  const demo=mode==='demo'?createDemoAccount({storage:demoStorage,cryptoImpl:demoCrypto??globalThis.crypto}):null;
  async function request(path,method='GET',payload){
    if(typeof location!=='undefined'&&location.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(location.hostname))throw new Error('Secure origin required');
    const headers={Accept:'application/json'};
    if(method!=='GET'){
      const csrf=await fetchImpl(base+'/csrf',{method:'GET',credentials:'same-origin',headers:{Accept:'application/json'}});
      if(!csrf.ok)throw new Error('Account request failed');
      const token=await csrf.json();
      if(typeof token.csrfToken!=='string'||!token.csrfToken)throw new Error('Account request failed');
      headers['X-CSRF-Token']=token.csrfToken;
      headers['Content-Type']='application/json';
    }
    const response=await fetchImpl(base+path,{method,credentials:'same-origin',headers,...(payload?{body:JSON.stringify(payload)}:{})});
    if(path==='/auth/me'&&response.status===401)return {user:null};
    if(!response.ok)throw new Error('Account request failed');
    return response.status===204?{}:response.json();
  }
  return {
    mode,
    login:payload=>demo?demo.login(payload):request('/auth/login','POST',payload),
    register:payload=>demo?demo.register(payload):request('/auth/register','POST',payload),
    reset:payload=>demo?demo.reset(payload):request('/auth/password-reset','POST',payload),
    logout:()=>demo?demo.logout():request('/auth/logout','POST',{}),
    me:()=>demo?demo.me():request('/auth/me'),
    orders:()=>demo?demo.orders():request('/me/orders'),
    addresses:()=>demo?demo.addresses():request('/me/addresses'),
    saveAddress:payload=>demo?demo.saveAddress(payload):request(payload.id?'/me/addresses/'+encodeURIComponent(payload.id):'/me/addresses',payload.id?'PATCH':'POST',payload),
    deleteAddress:id=>demo?demo.deleteAddress(id):request('/me/addresses/'+encodeURIComponent(id),'DELETE',{}),
    updateProfile:payload=>demo?demo.updateProfile(payload):request('/me/profile','PATCH',payload),
    recordDemoOrder:payload=>demo?demo.recordOrder(payload):Promise.resolve(null)
  };
}

// Change to live only after the API, secure session, email and order gates pass.
export const accountClient=createAccountClient({mode:'demo'});
