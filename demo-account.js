// Local, single-tab preview only. This is not a production authentication system.
export const demoCredentials=Object.freeze({email:'demo@alasehirorganik.test',password:'DemoHesap2026!'});

const ACCOUNT_KEY='ao-demo-account-v1';
const SESSION_KEY='ao-demo-session-v1';
const PROFILE_KEY='ao-demo-profile-v1';
const ADDRESS_KEY='ao-demo-addresses-v1';
const ORDER_KEY='ao-demo-orders-v1';
const presetUser=Object.freeze({id:'demo-preset',firstName:'Demo',lastName:'Müşteri',email:demoCredentials.email});
const hex=bytes=>Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
const bytes=value=>Uint8Array.from(value.match(/../g).map(part=>parseInt(part,16)));

function sessionStore(provided){
  const fallback=new Map();
  let storage=provided;
  if(storage===undefined){try{storage=globalThis.sessionStorage;}catch{storage=null;}}
  return {
    get(key){try{return storage?.getItem(key)??fallback.get(key)??null;}catch{return fallback.get(key)??null;}},
    set(key,value){fallback.set(key,value);try{storage?.setItem(key,value);}catch{}},
    remove(key){fallback.delete(key);try{storage?.removeItem(key);}catch{}}
  };
}

export function createDemoAccount({storage,cryptoImpl=globalThis.crypto}={}){
  const store=sessionStore(storage);
  function readAccount(){
    try{
      const account=JSON.parse(store.get(ACCOUNT_KEY));
      if(account&&typeof account.firstName==='string'&&typeof account.lastName==='string'&&typeof account.email==='string'&&/^[a-f0-9]{32}$/.test(account.salt)&&/^[a-f0-9]{64}$/.test(account.verifier))return account;
    }catch{}
    return null;
  }
  function demoUser(account){return {id:account.id||'demo-registered',firstName:account.firstName,lastName:account.lastName,email:account.email};}
  function ownerKey(user){return user.id==='demo-preset'||user.id==='demo-registered'?user.email:user.id;}
  function readList(key){try{const value=JSON.parse(store.get(key));return Array.isArray(value)?value:[];}catch{return [];}}
  function currentUser(){
    const kind=store.get(SESSION_KEY),account=readAccount();
    if(kind==='registered'&&account)return demoUser(account);
    if(kind==='preset'){
      try{const profile=JSON.parse(store.get(PROFILE_KEY));if(profile&&typeof profile.firstName==='string'&&typeof profile.lastName==='string')return {...presetUser,firstName:profile.firstName,lastName:profile.lastName};}catch{}
      return presetUser;
    }
    return null;
  }
  async function verifier(password,salt){
    if(!cryptoImpl?.subtle)throw new Error('Demo hesabı bu tarayıcıda kullanılamıyor.');
    const key=await cryptoImpl.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
    const result=await cryptoImpl.subtle.deriveBits({name:'PBKDF2',salt,iterations:120000,hash:'SHA-256'},key,256);
    return hex(new Uint8Array(result));
  }
  return {
    async login({email,password}={}){
      const normalized=String(email??'').trim().toLowerCase();
      if(normalized===demoCredentials.email&&password===demoCredentials.password){store.set(SESSION_KEY,'preset');return {demo:true,user:presetUser};}
      const account=readAccount();
      if(account&&normalized===account.email&&typeof password==='string'){
        const actual=await verifier(password,bytes(account.salt));
        let difference=0;for(let i=0;i<actual.length;i++)difference|=actual.charCodeAt(i)^account.verifier.charCodeAt(i);
        if(difference===0){store.set(SESSION_KEY,'registered');return {demo:true,user:demoUser(account)};}
      }
      throw new Error('Demo e-posta veya şifre hatalı.');
    },
    async register({firstName,lastName,email,password}={}){
      const first=String(firstName??'').trim(),last=String(lastName??'').trim(),normalized=String(email??'').trim().toLowerCase();
      if(!first||!last||first.length>60||last.length>60||!normalized.includes('@')||normalized.length>120||normalized===demoCredentials.email||typeof password!=='string'||password.length<12||password.length>128)throw new Error('Geçerli örnek bilgiler girin.');
      if(!cryptoImpl?.getRandomValues)throw new Error('Demo hesabı bu tarayıcıda kullanılamıyor.');
      const salt=cryptoImpl.getRandomValues(new Uint8Array(16));
      const account={id:'demo-'+hex(cryptoImpl.getRandomValues(new Uint8Array(12))),firstName:first,lastName:last,email:normalized,salt:hex(salt),verifier:await verifier(password,salt)};
      store.set(ACCOUNT_KEY,JSON.stringify(account));store.set(SESSION_KEY,'registered');
      return {demo:true,user:demoUser(account)};
    },
    async reset(){return {demo:true,delivered:false};},
    async logout(){store.remove(SESSION_KEY);return {demo:true};},
    async me(){return {user:currentUser()};},
    async orders(){const user=currentUser();return {orders:user?readList(ORDER_KEY).filter(row=>row.owner===ownerKey(user)).map(({owner,...row})=>row):[]};},
    async recordOrder({items,total}={}){
      const user=currentUser(),rows=Array.isArray(items)?items.filter(row=>typeof row.id==='string'&&Number.isInteger(row.qty)&&row.qty>0&&Number.isFinite(row.price)&&row.price>=0).map(row=>({id:row.id,qty:row.qty,price:row.price})):[];
      if(!user||!rows.length||!Number.isFinite(total)||total<0)return null;
      const orders=readList(ORDER_KEY),order={id:'DEMO-'+String(Date.now()).slice(-7)+'-'+hex(cryptoImpl.getRandomValues(new Uint8Array(2))).toUpperCase(),owner:ownerKey(user),createdAt:new Date().toISOString(),status:'Demo sipariş',total,items:rows,demo:true};
      orders.unshift(order);store.set(ORDER_KEY,JSON.stringify(orders.slice(0,10)));
      const {owner,...visible}=order;return visible;
    },
    async addresses(){const user=currentUser();return {addresses:user?readList(ADDRESS_KEY).filter(row=>row.owner===ownerKey(user)).map(({owner,...row})=>row):[]};},
    async saveAddress(payload={}){
      const user=currentUser();if(!user)throw new Error('Önce giriş yapın.');
      const fields=['label','recipient','phone','city','district','line'],address={};
      for(const field of fields){address[field]=String(payload[field]??'').trim();if(!address[field]||address[field].length>300)throw new Error('Adres bilgilerini tamamlayın.');}
      const owner=ownerKey(user),all=readList(ADDRESS_KEY),mine=all.filter(row=>row.owner===owner);
      const existing=mine.find(row=>row.id===payload.id),id=existing?.id||('demo-adres-'+hex(cryptoImpl.getRandomValues(new Uint8Array(8))));
      if(!existing&&mine.length>=5)throw new Error('En fazla 5 örnek adres ekleyebilirsiniz.');
      const saved={id,owner,...address},next=existing?all.map(row=>row.owner===owner&&row.id===id?saved:row):[saved,...all];
      store.set(ADDRESS_KEY,JSON.stringify(next));const {owner:storedOwner,...visible}=saved;return {address:visible};
    },
    async deleteAddress(id){const user=currentUser();if(!user)throw new Error('Önce giriş yapın.');store.set(ADDRESS_KEY,JSON.stringify(readList(ADDRESS_KEY).filter(row=>row.owner!==ownerKey(user)||row.id!==id)));return {};},
    async updateProfile({firstName,lastName}={}){
      const first=String(firstName??'').trim(),last=String(lastName??'').trim(),user=currentUser();
      if(!user||!first||!last||first.length>60||last.length>60)throw new Error('Ad ve soyadı kontrol edin.');
      if(store.get(SESSION_KEY)==='preset')store.set(PROFILE_KEY,JSON.stringify({firstName:first,lastName:last}));
      else{const account=readAccount();store.set(ACCOUNT_KEY,JSON.stringify({...account,firstName:first,lastName:last}));}
      return {user:currentUser()};
    }
  };
}
