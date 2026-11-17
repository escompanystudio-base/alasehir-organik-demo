const escapeAccount=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const accountAside=`<aside class="account-visual" aria-hidden="true"><img src="assets/campaign-vineyard.webp" alt="" width="800" height="900" loading="lazy"><div><span>Alaşehir Organik</span><strong>Yöresinden gelen ürünler.</strong></div></aside>`;
const demoNote=view=>`<p class="account-demo-note">${view==='register'?'Deneme sürümündesiniz. Örnek bilgilerle kayıt oluşturun; gerçek şifrenizi kullanmayın.':view==='reset'?'Demo sürümünde sıfırlama e-postası gönderilmez.':view==='account'?'Demo hesabıyla giriş yapabilir veya örnek bilgilerle kayıt oluşturabilirsiniz.':'Deneme sürümündesiniz. Hazır hesapla giriş yapabilir veya örnek bilgilerle kayıt olabilirsiniz; gerçek şifrenizi kullanmayın.'}</p>`;
const emailField=`<label class="account-field" for="account-email">E-posta adresi<input id="account-email" name="email" type="email" autocomplete="username" inputmode="email" required maxlength="120" placeholder="ornek@eposta.com"></label>`;

function shell(content,view='account'){
  return `<section class="container account-page account-page-${view}"><div class="account-breadcrumb"><a href="#">Ana sayfa</a><span>/</span><span>Hesabım</span></div><div class="account-layout">${accountAside}<div class="account-panel">${content}</div></div></section>`;
}
function passwordField(confirm=false,register=false){
  const id=confirm?'account-password-confirm':'account-password';
  const name=confirm?'passwordConfirm':'password';
  const label=confirm?'Şifreyi tekrar girin':'Şifre';
  const autocomplete=register?'new-password':'current-password';
  const minimum=register?' minlength="12"':'';
  return `<label class="account-field" for="${id}">${label}<span class="account-password-wrap"><input id="${id}" name="${name}" data-password type="password" autocomplete="${autocomplete}" required${minimum} maxlength="128" placeholder="${confirm?'Şifrenizi tekrar yazın':'Şifreniz'}"><button type="button" data-action="auth-visibility" data-target="${id}" aria-label="${label} alanını göster" aria-pressed="false">Göster</button></span></label>`;
}
export function accountMarkup(view,{icon,demo=true,next='hesabim',demoCredentials}={}){
  const destination=next==='odeme'?'odeme':'hesabim';
  const loginHref=destination==='odeme'?'#giris?next=odeme':'#giris';
  if(view==='account'){
    return shell(`<span class="account-kicker">Müşteri hesabı</span><h1>Hesabım</h1><p class="account-intro">Siparişlerinizi ve hesap bilgilerinizi buradan yönetin.</p>${demo?demoNote('account'):''}<div class="account-guest-actions"><a class="button" href="#giris">Giriş yap ${icon('arrow')}</a><a class="account-secondary-link" href="#kayit">Hesap oluştur</a></div><p class="account-small-note">Üye olmadan alışverişe devam edebilirsiniz.</p>`);
  }
  const register=view==='register',reset=view==='reset';
  const title=register?'Hesap oluştur':reset?'Şifrenizi sıfırlayın':'Giriş yap';
  const intro=register?'Bilgilerinizi doldurarak hesap oluşturun.':reset?'E-posta adresinizi girin; hesap varsa sıfırlama bağlantısı gönderilir.':'Hesabınıza giriş yaparak siparişlerinize ulaşın.';
  const tabs=reset?'':`<nav class="account-tabs" aria-label="Hesap işlemleri"><a href="${loginHref}" ${register?'':'aria-current="page"'}>Giriş yap</a><a href="#kayit" ${register?'aria-current="page"':''}>Kayıt ol</a></nav>`;
  const names=register?`<div class="account-name-row"><label class="account-field" for="account-first-name">Ad<input id="account-first-name" name="firstName" autocomplete="given-name" required maxlength="60" placeholder="Adınız"></label><label class="account-field" for="account-last-name">Soyad<input id="account-last-name" name="lastName" autocomplete="family-name" required maxlength="60" placeholder="Soyadınız"></label></div>`:'';
  const actualFields=reset?emailField:register?names+emailField+`<p class="account-password-hint">Şifreniz en az 12 karakter olmalı.</p><div class="account-password-row">${passwordField(false,true)}${passwordField(true,true)}</div>`:emailField+passwordField(false,false)+`<div class="account-help-row"><a href="#sifremi-unuttum">Şifremi unuttum</a></div>`;
  const button=register?'Hesap oluştur':reset?(demo?'Demo işlemini dene':'Bağlantı gönder'):'Giriş yap';
  const demoAccess=demo&&!register&&!reset&&demoCredentials?`<div class="account-demo-access"><div><strong>Hazır demo hesabı</strong><span>${escapeAccount(demoCredentials.email)}</span></div><button type="button" data-action="demo-login">Demo hesapla giriş yap</button></div>`:'';
  const after=reset?`<p class="account-switch">Şifrenizi hatırladınız mı? <a href="${loginHref}">Giriş yapın</a></p>`:register?`<p class="account-switch">Hesabınız var mı? <a href="${loginHref}">Giriş yapın</a></p>`:`<p class="account-switch">Hesabınız yok mu? <a href="#kayit">Kayıt olun</a></p>`;
  return shell(`<span class="account-kicker">Alaşehir Organik</span><h1>${title}</h1><p class="account-intro">${intro}</p>${tabs}${demo?demoNote(view):''}<form id="account-form" data-view="${view}" data-next="${destination}">${actualFields}<p id="account-feedback" class="account-feedback" role="status" aria-live="polite" hidden></p><button class="button account-submit" type="submit">${button} ${icon('arrow')}</button></form>${demoAccess}${after}`,view);
}
export function accountProfileMarkup(user,orders,{icon,money,demo=false}){
  const name=escapeAccount(user?.firstName||'');
  const email=escapeAccount(user?.email||'');
  const list=Array.isArray(orders)?orders:[];
  const orderRows=orders===null?'<p class="account-empty-orders">Siparişler şu an yüklenemedi.</p>':list.length?list.map(order=>{
    const id=escapeAccount(order.id);
    const date=order.createdAt&&!Number.isNaN(Date.parse(order.createdAt))?new Date(order.createdAt).toLocaleDateString('tr-TR'):'';
    const status=escapeAccount(order.status||'');
    const amount=Number.isFinite(Number(order.total))?money(Number(order.total)):'';
    return `<li><span><strong>${id}</strong><small>${escapeAccount(date)}</small></span><span>${status}</span><strong>${amount}</strong></li>`;
  }).join(''):`<p class="account-empty-orders">${demo?'Demo hesapta gerçek sipariş bulunmaz.':'Henüz siparişiniz bulunmuyor.'}</p>`;
  return shell(`<span class="account-kicker">Müşteri hesabı</span><h1>Merhaba${name?', '+name:''}.</h1><p class="account-intro">${email}</p>${demo?'<p class="account-demo-note">Demo hesabındasınız. Bu hesap yalnızca bu tarayıcı sekmesinde çalışır; gerçek sipariş oluşturmaz.</p>':''}<div class="account-profile-actions"><a href="#magaza" class="button">Ürünlere göz at ${icon('arrow')}</a><button type="button" data-action="account-logout">Çıkış yap</button></div><section class="account-orders"><h2>Siparişlerim</h2>${list.length?'<ul>'+orderRows+'</ul>':orderRows}</section>`);
}
