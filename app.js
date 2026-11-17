import {cleanCart,planCartAddition} from './cart-state.js';
import {productDetail} from './product-detail.js';
import {productCard} from './product-card.js';
import {homeMarkup} from './home-v3.js';
import {mountCampaignSlider,stopCampaignSlider} from './campaign-slider.js';
import {products,categories} from './catalog.js';
import {accountClient} from './account-client.js';
import {accountMarkup} from './account-pages.js';
import {accountDashboardMarkup} from './account-dashboard.js';
import {demoCredentials} from './demo-account.js';

const $=s=>document.querySelector(s);
const main=$('#main');
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2}).format(n);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>String(s).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');
const product=id=>products.find(p=>p.id===id);
const categoryName=id=>categories.find(c=>c.id===id)?.name||'Kuru meyve & ceviz';
const iconPaths={user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',bag:'<path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',heart:'<path d="M20.7 4.8a5.3 5.3 0 0 0-7.5 0L12 6l-1.2-1.2a5.3 5.3 0 0 0-7.5 7.5L12 21l8.7-8.7a5.3 5.3 0 0 0 0-7.5Z"/>',arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',plus:'<path d="M12 5v14M5 12h14"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',tag:'<path d="M3 3h8l10 10-8 8L3 11V3Z"/><circle cx="7.5" cy="7.5" r="1"/>',truck:'<path d="M2 5h12v12H2zM14 10h4l4 4v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',leaf:'<path d="M20 3c1 12-4 18-11 16C1 17 4 5 20 3Z"/><path d="M4 22 16 9"/>',box:'<path d="m12 2 9 5v10l-9 5-9-5V7l9-5ZM3 7l9 5 9-5M12 12v10M7.5 4.5l9 5"/>',shield:'<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z"/><path d="m8 12 3 3 5-6"/>',pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',home:'<path d="m3 10 9-8 9 8v12H3V10Z"/><path d="M9 22v-9h6v9"/>',check:'<path d="m5 12 5 5L20 7"/>',phone:'<path d="m7 2 3 5-3 3c2 4 4 6 8 7l3-3 4 3c0 4-3 6-7 4C7 18 3 12 2 6 1 3 4 1 7 2Z"/>',mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/>',filter:'<path d="M4 7h16M7 12h10M10 17h4"/>'};
const icon=name=>`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]||iconPaths.leaf}</svg>`;
function icons(root=document){root.querySelectorAll('[data-icon]').forEach(e=>{if(!e.querySelector('svg'))e.insertAdjacentHTML('afterbegin',icon(e.dataset.icon));});}
function load(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
let cart=cleanCart(load('ao-cart-v1',[]),products);
let favorites=load('ao-favorites-v1',[]);if(!Array.isArray(favorites))favorites=[];favorites=[...new Set(favorites.filter(id=>product(id)))];
let homeCategory='all',sort='recommended',detailQuantity=1,lastFocus,toastTimer;
let cardQuantities={};
let priceRange={min:null,max:null},searchMatches=[],searchIndex=-1,removedCartItem=null,activeProductId=null;
function setCardQuantity(id,delta){if(!product(id))return;const qty=Math.max(1,Math.min(99,(cardQuantities[id]||1)+delta));cardQuantities[id]=qty;document.querySelectorAll('[data-card-qty="'+id+'"]').forEach(e=>e.textContent=qty);document.querySelectorAll('[data-card-minus="'+id+'"]').forEach(e=>e.disabled=qty===1);document.querySelectorAll('[data-card-plus="'+id+'"]').forEach(e=>e.disabled=qty===99);}
const count=()=>cart.reduce((n,x)=>n+x.qty,0);
const total=()=>cart.reduce((n,x)=>n+product(x.id).price*x.qty,0);
const savings=()=>cart.reduce((n,x)=>n+(product(x.id).old-product(x.id).price)*x.qty,0);
function save(){try{localStorage.setItem('ao-cart-v1',JSON.stringify(cart));localStorage.setItem('ao-favorites-v1',JSON.stringify(favorites));}catch{}updateHeader();}
function toggleFavorite(id){favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];save();if(location.hash.startsWith('#favoriler'))renderFavorites();else if(currentRoute()==='hesabim/favoriler')void renderAccountPage('favoriler');else toast(favorites.includes(id)?'Favorilerinize eklendi.':'Favorilerinizden çıkarıldı.');}
const favorite=p=>`<button class="favorite-button ${favorites.includes(p.id)?'active':''}" data-action="favorite" data-id="${p.id}" aria-label="${p.name}: Favorilere ekle" aria-pressed="${favorites.includes(p.id)}">${icon('heart')}</button>`;
const price=p=>`<span class="price">${money(p.price)} <del>${money(p.old)}</del></span>`;
function card(p,options={}){return productCard(p,{icon,favorite,price,money,categoryName,quantity:cardQuantities[p.id]||1,...options});}
const arrowLink=(href,label)=>`<a href="${href}" class="underlink">${label} ${icon('arrow')}</a>`;
function trust(){return `<div class="service-strip"><div class="container service-inner"><div class="service">${icon('pin')}<div><strong>Alaşehir’den sofranıza</strong><span>Yöresinden seçilen lezzetler</span></div></div><div class="service">${icon('leaf')}<div><strong>Özenle seçilen ürünler</strong><span>Az malzeme, gerçek lezzet</span></div></div><div class="service">${icon('box')}<div><strong>Özenli paketleme</strong><span>Her siparişe aynı özen</span></div></div><div class="service">${icon('phone')}<div><strong>Doğrudan iletişim</strong><span>Bir sorunuz varsa yanınızdayız</span></div></div></div></div>`;}
const chips=()=>`<div class="chips">${[{id:'all',name:'Tüm seçki'},...categories.slice(0,4)].map(c=>`<button class="chip ${homeCategory===c.id?'active':''}" data-action="home-filter" data-category="${c.id}" aria-pressed="${homeCategory===c.id}">${c.name}</button>`).join('')}</div>`;
const notes=[{id:'zeytinyagi',tag:'KULLANIM ÖNERİLERİ',time:'3 dakikalık okuma',title:'Zeytinyağını mutfakta kullanma önerileri',image:products[2].image},{id:'yaprak',tag:'KULLANIM ÖNERİLERİ',time:'2 dakikalık okuma',title:'Asma yaprağıyla sarma hazırlığı',image:products[1].image},{id:'uzum',tag:'KULLANIM ÖNERİLERİ',time:'2 dakikalık okuma',title:'Kuru üzümle pratik tarifler',image:products[0].image}];
function notesGrid(){return `<div class="notes-grid">${notes.map(n=>`<article class="note-card"><a class="note-img" href="#not/${n.id}"><img src="assets/${n.image}" alt="${n.title}" loading="lazy" width="350" height="280" style="width:100%;height:100%;object-fit:cover"></a><div class="note-meta"><span>${n.tag}</span><span>${n.time}</span></div><h3><a href="#not/${n.id}">${n.title}</a></h3>${arrowLink('#not/'+n.id,'Okumaya devam et')}</article>`).join('')}</div>`;}
function pageHead(title,subtitle=''){return `<div class="container breadcrumbs"><a href="#">Ana sayfa</a><span>/</span><span>${esc(title)}</span></div><section class="page-head"><div class="container"><h1>${esc(title)}</h1>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div></section>`;}
function matchesCategory(p,id){return id==='all'||p.category===id||(id==='kuru-meyve'&&['incir','ceviz','cennet-hurmasi'].includes(p.category));}
function sortProducts(list){return [...list].sort((a,b)=>sort==='price-up'?a.price-b.price:sort==='price-down'?b.price-a.price:sort==='name'?a.name.localeCompare(b.name,'tr'):sort==='discount'?(1-b.price/b.old)-(1-a.price/a.old):0);}
function currentRoute(){return location.hash.slice(1)||'home';}
function empty(ic,title,text){return `<div class="no-results">${icon(ic)}<h2>${title}</h2><p>${text}</p><a href="#magaza" class="button" style="background:var(--green);color:white">Tüm ürünler ${icon('arrow')}</a></div>`;}
function renderFavorites(){main.innerHTML=`${pageHead('Favorilerim','Kaydettiğiniz ürünler bu tarayıcıda saklanır.')}<div class="container favorites-grid"><div class="product-grid">${favorites.length?favorites.map(id=>card(product(id))).join(''):empty('heart','Henüz favori ürününüz yok.','Ürünleri favorilerinize ekleyebilirsiniz.')}</div></div>`;icons();}
function cartItem(x){const p=product(x.id);return `<div class="cart-item"><img src="assets/${p.image}" alt="${p.name}" width="76" height="96"><div class="cart-item-content"><h3><a href="#urun/${p.id}">${p.name}</a></h3><span class="product-weight">${p.weight}</span><div class="quantity"><button data-action="cart-minus" data-id="${p.id}" aria-label="${p.name} adedini azalt">−</button><span aria-label="Adet">${x.qty}</span><button data-action="cart-plus" data-id="${p.id}" aria-label="${p.name} adedini artır">+</button></div></div><div class="cart-item-end"><strong>${money(p.price*x.qty)}</strong><button class="remove-item" data-action="remove" data-id="${p.id}">Kaldır</button></div></div>`;}
function renderCheckout(){if(!cart.length){main.innerHTML=pageHead('Sipariş özeti')+`<div class="container">${empty('bag','Sepetiniz henüz boş.','Önce sepete ürün ekleyin.')}</div>`;return;}main.innerHTML=`${pageHead('Sipariş özeti','Bu sayfa önizleme amaçlıdır. Gerçek sipariş ve ödeme alınmaz.')}<div class="container checkout-layout"><form class="checkout-form" id="checkout-form"><div class="checkout-account-note">Hesabınız var mı? <a href="#giris?next=odeme">Giriş yapın</a>. Üye olmadan da devam edebilirsiniz.</div><div class="modal-notice"><strong>Deneme alışverişi</strong><br>Bilgiler gönderilmez veya saklanmaz. Denemek için örnek bilgiler kullanabilirsiniz.</div><h2>Teslimat bilgileri</h2><div class="form-grid"><label class="form-field">Ad<input name="firstName" required autocomplete="given-name" maxlength="60" placeholder="Adınız"></label><label class="form-field">Soyad<input name="lastName" required autocomplete="family-name" maxlength="60" placeholder="Soyadınız"></label><label class="form-field full">E-posta adresi<input type="email" name="email" required autocomplete="email" placeholder="ornek@eposta.com" maxlength="120"></label><label class="form-field full">Telefon<input name="phone" type="tel" required autocomplete="tel" pattern="[+0-9 ]{10,20}" title="10–20 karakter uzunluğunda bir telefon numarası girin." maxlength="20" placeholder="05__ ___ __ __"></label><label class="form-field">İl<input name="city" required autocomplete="address-level1" placeholder="İl" maxlength="60"></label><label class="form-field">İlçe<input name="district" required autocomplete="address-level2" placeholder="İlçe" maxlength="60"></label><label class="form-field full">Adres<textarea name="address" required autocomplete="street-address" rows="3" placeholder="Mahalle, sokak, bina ve daire numarası" minlength="10" maxlength="500"></textarea></label><label class="form-field full">Sipariş notu (isteğe bağlı)<textarea name="note" rows="2" maxlength="500" placeholder="Eklemek istediğiniz bir not var mı?"></textarea></label></div><label class="checkbox-row"><input type="checkbox" required><span>Bunun bir tasarım sunumu olduğunu, gerçek sipariş ve ödeme oluşmayacağını anladım.</span></label><button type="submit" class="button" style="background:var(--green);color:white">Deneme siparişini tamamla ${icon('arrow')}</button></form><aside class="checkout-summary"><h2>Sepet özeti</h2>${cart.map(x=>{const p=product(x.id);return `<div class="cart-item"><img src="assets/${p.image}" alt=""><div class="cart-item-content"><h3>${p.name}</h3><span class="product-weight">${p.weight} · ${x.qty} adet</span></div><div class="cart-item-end"><strong>${money(p.price*x.qty)}</strong></div></div>`;}).join('')}<div class="summary-row"><span>Katalog indirimleri</span><strong style="color:var(--rust)">−${money(savings())}</strong></div><div class="summary-row"><span>Kargo bedeli</span><span>Canlı satışta hesaplanır</span></div><div class="summary-row total"><span>Ara toplam</span><strong>${money(total())}</strong></div><p style="font-size:9px;margin:15px 0 0">Fiyatlar mevcut katalogdan alınmıştır. Bu sunumda kart bilgisi istenmez.</p><button class="underlink" data-action="cart" style="margin-top:20px;background:none;border-width:0 0 1px;cursor:pointer;padding-inline:0">Sepeti düzenle ${icon('arrow')}</button></aside></div>`;icons();}
function renderStory(){main.innerHTML=`${pageHead('Hakkımızda','Alaşehir Organik hakkında bilgiler.')}<section class="container story-layout"><div><h2>Yöresel ürünler, açık bilgiler</h2><p>Alaşehir Organik kataloğunda kuru üzüm, asma yaprağı, zeytin, zeytinyağı, tahin ve pekmez gibi ürünler yer alıyor. Bu mağaza taslağında ürünleri kategori, paket miktarı ve fiyatlarıyla birlikte inceleyebilirsiniz.</p><p>Ürünlerin güncel stok, içerik ve teslimat koşulları için satıcıyla iletişime geçin.</p><a href="#magaza" class="button">Ürünleri gör ${icon('arrow')}</a></div></section>`;icons();}
const faq=[['Bu siteden gerçek sipariş verebilir miyim?','Bu sürüm, Alaşehir Organik için hazırlanmış bağımsız bir tasarım ve alışveriş deneyimi sunumudur. Sepet ve sipariş adımları deneme amaçlıdır; ödeme alınmaz, gerçek sipariş oluşturulmaz.'],['Ürünler ve fiyatlar nereden alındı?','Ürün adları, paket miktarları, görseller ve indirimli fiyatlar 16 Kasım 2026 tarihinde mevcut Alaşehir Organik kataloğundan incelenmiştir. Satın almadan önce güncel stok ve fiyat satıcıdan doğrulanmalıdır.'],['Kargo ücretini ve teslimat süresini nasıl öğrenebilirim?','Kargo ücreti, ücretsiz kargo sınırı, hazırlık süresi ve teslimat kapsamı canlı satış kurulumu sırasında satıcının koşullarına göre tanımlanacaktır. Bu sunumda doğrulanmamış bir teslimat sözü verilmez.'],['Favorilerim ve sepetim kaybolur mu?','Favorileriniz ve sepetiniz aynı cihaz ve tarayıcıda saklanır. Tarayıcı verilerini temizlemek veya gizli pencereyi kapatmak bu verileri silebilir. Hesaplar arası senkronizasyon bu sürümde bulunmaz.'],['İçerik ve alerjen bilgisini nereden kontrol edebilirim?','Ürün detaylarındaki bilgiler tanıtım amaçlıdır. Kesin içerik, alerjen, menşei, son tüketim ve saklama bilgileri için ürün ambalajını ve satıcının güncel açıklamasını kontrol edin.'],['Alaşehir Organik’e nasıl ulaşabilirim?','Mevcut sitede listelenen iletişim bilgileri: 0552 252 18 02 ve info@alasehirorganik.com. Adres: Soğuksu Mahallesi, İstiklal Caddesi, 45600 Alaşehir / Manisa.']];
function renderFaq(){main.innerHTML=pageHead('Sık sorulan sorular','Ürünler ve bu önizleme hakkında bilgiler.')+`<div class="container"><div class="faq-layout">${faq.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></div>`;}
function renderContact(){main.innerHTML=`${pageHead('İletişim','Ürünlerle ilgili sorularınız için bize ulaşın.')}<div class="container contact-grid"><div><h2>İletişim bilgileri</h2><div class="contact-method">${icon('phone')}<div><strong>Telefon</strong><a href="tel:+905522521802">0552 252 18 02</a></div></div><div class="contact-method">${icon('mail')}<div><strong>E-posta</strong><a href="mailto:info@alasehirorganik.com">info@alasehirorganik.com</a></div></div><div class="contact-method">${icon('pin')}<div><strong>Alaşehir, Manisa</strong><p>Soğuksu Mah. İstiklal Cad.<br>45600 Alaşehir / Manisa</p></div></div></div><aside class="contact-aside"><h2>Bilgi</h2><p>Bu sayfa bir tasarım önizlemesidir. Güncel ürün, stok ve sipariş koşulları için satıcıyla görüşün.</p></aside></div>`;icons();}
function renderNotes(){main.innerHTML=pageHead('Kullanım önerileri','Ürünleri mutfakta nasıl kullanabileceğinize dair kısa öneriler.')+`<section class="container notes-section">${notesGrid()}</section>`;icons();}
const articleCopy={zeytinyagi:[['Salatalarda kullanım','Bir salatayı sofraya koymadan hemen önce üzerine zeytinyağı gezdirin. Basit bir domates, biraz ekmek ve dilediğiniz baharatlarla sade bir tabak hazırlayın.'],['Kahvaltıda kullanım','Küçük bir kâseye koyduğunuz zeytinyağını kekik ve pul biberle tamamlayabilirsiniz. Yanına ekmeğinizi ve sevdiğiniz zeytinleri ekleyin.'],['Saklama','Zeytinyağını doğrudan güneşten ve ısı kaynaklarından uzakta, kapağı kapalı şekilde muhafaza edin. Ürünün ambalajındaki saklama koşullarına uyun.']],yaprak:[['Hazırlık','Salamura yaprağın tuzunu kontrol edin. Gerekirse temiz suda bekletip durulayın. Yaprağın dokusuna ve tarifinize göre kısa bir ön hazırlık yapın.'],['İç harç miktarı','Pirincin pişerken genişleyeceğini unutmayın. Harcı ölçülü koyup sarmayı çok sıkmadan kapatmak, pişirme sırasında işinizi kolaylaştırır.'],['Pişirme','Sarmaları tencereye düzenli yerleştirin. Sıvı miktarını tarifinize göre ayarlayıp kısık ateşte pişirin. Servisten önce dinlendirin.']],uzum:[['Yoğurt ve yulafla','Yoğurt, yulaf ve bir avuç kuru üzümle sade bir kâse hazırlayın. Üzerine ceviz ve tarçın ekleyerek damak tadınıza göre tamamlayın.'],['Hamur işlerinde','Kek veya kurabiye hamuruna kuru üzüm ekleyebilirsiniz. Hamura katmadan önce yıkayıp iyice kurulayın; tarifteki diğer malzemelerle dengeli kullanın.'],['Ara öğün olarak','Kuru üzümü cevizle küçük bir kapta bir araya getirin. İşte, okulda veya yolda, porsiyonlayarak yanınızda taşıyabileceğiniz bir ara öğün olur.']]};
function renderArticle(id){const n=notes.find(n=>n.id===id);if(!n){renderNotFound();return;}main.innerHTML=pageHead(n.title,n.tag+' · '+n.time)+`<div class="container"><article class="article"><img src="assets/${n.image}" alt="${n.title}">${articleCopy[id].map(([t,p])=>`<h2>${t}</h2><p>${p}</p>`).join('')}<div style="margin-top:30px"><a href="#magaza/${id==='yaprak'?'asma-yapragi':id==='uzum'?'kuru-uzum':'zeytin-zeytinyagi'}" class="button" style="background:var(--green);color:white">İlgili ürünler ${icon('arrow')}</a></div></article></div>`;icons();}
function renderNotFound(){main.innerHTML=`<div class="container">${empty('search','Sayfa bulunamadı.','Aradığınız sayfa bulunamadı. Ürünlere dönebilirsiniz.')}</div>`;icons();}
function renderAuthView(view,next){
  document.title=(view==='register'?'Kayıt ol':view==='reset'?'Şifremi unuttum':'Giriş yap')+' — Alaşehir Organik';
  main.innerHTML=accountMarkup(view,{icon,demo:accountClient.mode==='demo',next,demoCredentials});icons();
}
let accountAddresses=[];
async function renderAccountPage(section='genel'){
  document.title='Hesabım — Alaşehir Organik';
  const requested=currentRoute();
  main.innerHTML='<div class="container account-dash-loading" role="status">Hesabınız yükleniyor…</div>';
  try{
    const session=await accountClient.me();
    if(currentRoute()!==requested)return;
    if(!session.user){main.innerHTML=accountMarkup('account',{icon,demo:accountClient.mode==='demo'});icons();return;}
    const [ordersResponse,addressesResponse]=await Promise.all([accountClient.orders().catch(()=>({orders:null})),accountClient.addresses().catch(()=>({addresses:null}))]);
    if(currentRoute()!==requested)return;
    accountAddresses=addressesResponse.addresses||[];
    main.innerHTML=accountDashboardMarkup(session.user,{orders:ordersResponse.orders,addresses:addressesResponse.addresses,favorites,products,card,icon,money,demo:accountClient.mode==='demo'},section);icons();
  }catch{
    if(currentRoute()===requested){
      main.innerHTML=accountMarkup('account',{icon,demo:accountClient.mode==='demo'});icons();
      const panel=main.querySelector('.account-panel');
      if(panel)panel.insertAdjacentHTML('beforeend','<p class="account-feedback is-error">Hesap durumuna ulaşılamadı. Lütfen tekrar deneyin.</p>');
    }
  }
}
function toggleAccountPassword(button){
  const input=document.getElementById(button.dataset.target);
  if(!input)return;
  const visible=input.type==='password';
  input.type=visible?'text':'password';
  button.textContent=visible?'Gizle':'Göster';
  button.setAttribute('aria-pressed',String(visible));
  button.setAttribute('aria-label',input.closest('label').firstChild.textContent.trim()+' alanını '+(visible?'gizle':'göster'));
  input.focus();
}
function accountFeedback(form,message,error=false){
  const note=form.querySelector('#account-feedback');
  if(!note)return;
  note.textContent=message;note.hidden=false;note.classList.toggle('is-error',error);
}
function signInDemoAccount(){
  const form=$('#account-form');
  if(accountClient.mode!=='demo'||form?.dataset.view!=='login')return;
  form.elements.namedItem('email').value=demoCredentials.email;
  form.elements.namedItem('password').value=demoCredentials.password;
  form.querySelector('#account-feedback').hidden=true;
  form.requestSubmit();
}
async function submitAccountForm(form){
  const view=form.dataset.view,fields=form.elements,confirm=fields.namedItem('passwordConfirm');
  if(view==='register'&&confirm&&fields.namedItem('password').value!==confirm.value){
    confirm.setCustomValidity('Şifreler eşleşmiyor.');confirm.reportValidity();return;
  }
  const button=form.querySelector('[type="submit"]'),original=button.innerHTML;
  button.disabled=true;button.textContent='İşleniyor…';
  const email=fields.namedItem('email').value.trim();
  try{
    if(view==='login'){
      await accountClient.login({email,password:fields.namedItem('password').value});
      const destination=form.dataset.next==='odeme'?'odeme':'hesabim';
      if(currentRoute()===destination)renderAccountPage();else location.hash=destination;
    }else if(view==='register'){
      await accountClient.register({firstName:fields.namedItem('firstName').value.trim(),lastName:fields.namedItem('lastName').value.trim(),email,password:fields.namedItem('password').value});
      if(accountClient.mode==='demo'){location.hash='hesabim';toast('Demo hesabınız oluşturuldu.');}
      else{accountFeedback(form,'Kaydınız alındı. E-posta doğrulama bağlantısını kontrol edin.');form.reset();}
    }else{
      await accountClient.reset({email});
      accountFeedback(form,accountClient.mode==='demo'?'Demo sürümünde e-posta gönderilmez. Yeni örnek hesap oluşturabilir veya hazır demo hesabıyla giriş yapabilirsiniz.':'Bu adres kayıtlıysa şifre sıfırlama bağlantısı gönderilecektir.');
    }
  }catch{
    accountFeedback(form,accountClient.mode==='demo'?(view==='login'?'Demo e-posta veya şifre hatalı. Hazır demo hesabını deneyin.':'Demo kaydı oluşturulamadı. Başka bir örnek e-posta deneyin.'):(view==='login'?'Giriş tamamlanamadı. E-posta ve şifrenizi kontrol edip tekrar deneyin.':'İşlem tamamlanamadı. Lütfen daha sonra tekrar deneyin.'),true);
  }finally{if(accountClient.mode==='demo')form.querySelectorAll('input[data-password]').forEach(input=>input.value='');button.disabled=false;button.innerHTML=original;}
}
async function logoutAccount(){
  try{await accountClient.logout();accountAddresses=[];if(currentRoute().startsWith('hesabim'))location.hash='hesabim';else location.hash='giris';if(currentRoute()==='hesabim')renderAccountPage();}
  catch{toast('Çıkış yapılamadı. Lütfen tekrar deneyin.');}
}
function route(keepScroll=false){stopCampaignSlider();activeProductId=null;closeCart();if($('#modal').open)$('#modal').close();closeSearch();$('#mobile-navigation').hidden=true;$('.mobile-menu').setAttribute('aria-expanded','false');document.title='Alaşehir Organik — Yöresel ürünler';const hash=currentRoute(),[path,query]=hash.split('?');const [page,id]=path.split('/');switch(page){case'home':renderHome();break;case'magaza':renderCatalog(id||'all');break;case'firsatlar':renderCatalog('all','',true);break;case'arama':renderCatalog('all',new URLSearchParams(query).get('q')||'');break;case'hesabim':renderAccountPage(id||'genel');break;case'giris':renderAuthView('login',new URLSearchParams(query).get('next'));break;case'kayit':renderAuthView('register');break;case'sifremi-unuttum':renderAuthView('reset');break;case'favoriler':renderFavorites();break;case'urun':renderDetail(id);break;case'odeme':renderCheckout();break;case'hikayemiz':renderStory();break;case'iletisim':renderContact();break;case'sss':renderFaq();break;case'rehber':renderNotes();break;case'not':renderArticle(id);break;default:renderNotFound();}updateHeader();if(!keepScroll){window.scrollTo({top:0,behavior:'instant'});main.classList.remove('page-enter');void main.offsetWidth;main.classList.add('page-enter');}}
document.addEventListener('click',e=>{const button=e.target.closest('[data-action]');if(button){const {action,id,category}=button.dataset;switch(action){case'add':feedbackAdd(button,add(id));break;case'card-add':feedbackAdd(button,add(id,cardQuantities[id]||1));break;case'card-minus':setCardQuantity(id,-1);break;case'card-plus':setCardQuantity(id,1);break;case'favorite':toggleFavorite(id);break;case'cart':openCart();break;case'close-cart':closeCart();break;case'quick':quick(id);break;case'zoom':zoomProduct(id);break;case'undo-remove':undoRemoval();break;case'cart-recommend':add(id);break;case'clear-filters':clearFilters();break;case'close-modal':$('#modal').close();break;case'quick-add':$('#modal').close();add(id);break;case'cart-minus':changeQty(id,-1);break;case'cart-plus':changeQty(id,1);break;case'remove':removeFromCart(id);$('#cart-drawer [data-action="close-cart"]')?.focus();break;case'detail-minus':setDetailQuantity(-1);break;case'detail-plus':setDetailQuantity(1);break;case'detail-add':feedbackAdd(button,add(id,detailQuantity));break;case'home-filter':homeCategory=category;$('#home-controls').innerHTML=chips();$('#home-products').innerHTML=products.filter(p=>matchesCategory(p,category)).slice(0,8).map(card).join('');break;case'category':sort='recommended';if(location.hash===`#magaza${category==='all'?'':'/'+category}`)route();else location.hash=`magaza${category==='all'?'':'/'+category}`;break;case'filters':toggleFilters();break;case'breakfast':feedbackAdd(button,addMany([{id:'zeytinyagi',qty:1},{id:'koy-zeytini',qty:1}]));break;case'menu':$('#mobile-navigation').hidden=!$('#mobile-navigation').hidden;button.setAttribute('aria-expanded',!$('#mobile-navigation').hidden);break;case'auth-visibility':toggleAccountPassword(button);break;case'account-logout':void logoutAccount();break;case'about-demo':modal('<h2 class="modal-heading" id="modal-title">Demo mağaza</h2><p class="modal-text">Bu site, Alaşehir Organik için hazırlanmış bağımsız bir tasarım önerisidir. Markanın resmî satış sitesi değildir.</p><p class="modal-text">Ürünler, paket miktarları ve fiyatlar 16 Kasım 2026 tarihinde mevcut katalogdan alınmıştır. Sepet ve favoriler tarayıcınızda saklanır. Deneme siparişinde bilgiler herhangi bir yere gönderilmez; ödeme alınmaz.</p><div class="modal-notice">Canlı satış için stok, kargo, ödeme ve sipariş yönetimi bağlantıları ayrıca kurulacaktır.</div>');break;case'policy':modal(`<h2 class="modal-heading" id="modal-title">${esc(button.dataset.policy)}</h2><p class="modal-text">Bu sunum mağazasında gerçek satış veya ödeme gerçekleşmez. Deneme siparişindeki bilgiler iletilmez veya saklanmaz. Sepet ve favoriler bu tarayıcıda; örnek demo hesap bilgileri yalnızca bu sekmede tutulur.</p><p class="modal-text">Canlı mağazaya geçişte satıcının güncel mesafeli satış, teslimat, iade ve kişisel veri metinleri eklenecektir.</p><a href="#sss" class="underlink">Sık sorulan sorular ${icon('arrow')}</a>`);break;}icons();updateHeader();}
if(e.target.closest('a[href^="#"]')){closeCart();closeSearch();}
if(!e.target.closest('.search-form'))closeSearch();});
$('#overlay').addEventListener('click',closeCart);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCart();closeSearch();$('#mobile-navigation').hidden=true;$('.mobile-menu').setAttribute('aria-expanded','false');}if(e.key==='Tab'&&!$('#cart-drawer').hidden){const els=[...$('#cart-drawer').querySelectorAll('a,button,input,select,textarea,[tabindex="0"]')].filter(e=>!e.disabled),first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
document.addEventListener('change',e=>{if(e.target.id==='sort'){sort=e.target.value;const y=window.scrollY;route(true);window.scrollTo(0,y);$('#sort')?.focus({preventScroll:true});}});
$('.search-form').addEventListener('submit',e=>{e.preventDefault();const search=$('#search'),q=search.value.trim();if(!q){search.focus();return;}const next='arama?q='+encodeURIComponent(q);if(currentRoute()===next)route();else location.hash=next;closeSearch();search.blur();});
$('.search-form').addEventListener('focusout',e=>{if(!e.currentTarget.contains(e.relatedTarget))closeSearch();});
window.addEventListener('scroll',()=>{if(!$('#search-suggestions').hidden)closeSearch();},{passive:true});
document.addEventListener('submit',e=>{if(e.target.id==='account-form'){e.preventDefault();void submitAccountForm(e.target);}});
document.addEventListener('click',e=>{if(e.target.closest('[data-action="demo-login"]'))signInDemoAccount();});
document.addEventListener('input',e=>{if(['account-password','account-password-confirm'].includes(e.target.id))$('#account-password-confirm')?.setCustomValidity('');});
function dashboardFeedback(form,message,error=false){const note=form.querySelector('[role="status"]');if(!note)return;note.textContent=message;note.hidden=false;note.classList.toggle('is-error',error);}
document.addEventListener('submit',e=>{
  const form=e.target;
  if(form.matches?.('#account-address-form')){
    e.preventDefault();const button=form.querySelector('[type="submit"]');button.disabled=true;
    const fields=form.elements,payload=Object.fromEntries(['id','label','recipient','phone','city','district','line'].map(name=>[name,fields.namedItem(name).value.trim()]));
    accountClient.saveAddress(payload).then(()=>{toast(payload.id?'Adres güncellendi.':'Adres eklendi.');if(currentRoute()==='hesabim/adresler')renderAccountPage('adresler');}).catch(error=>dashboardFeedback(form,error.message||'Adres kaydedilemedi.',true)).finally(()=>{button.disabled=false;});
  }
  if(form.matches?.('#account-profile-form')){
    e.preventDefault();const button=form.querySelector('[type="submit"]');button.disabled=true;
    accountClient.updateProfile({firstName:form.elements.namedItem('firstName').value.trim(),lastName:form.elements.namedItem('lastName').value.trim()}).then(()=>dashboardFeedback(form,'Bilgileriniz güncellendi.')).catch(error=>dashboardFeedback(form,error.message||'Bilgiler güncellenemedi.',true)).finally(()=>{button.disabled=false;});
  }
});
document.addEventListener('click',e=>{
  const button=e.target.closest('[data-action="address-edit"],[data-action="address-delete"]');if(!button)return;
  const address=accountAddresses.find(row=>row.id===button.dataset.id);if(!address)return;
  if(button.dataset.action==='address-delete'){
    if(!window.confirm('Bu adresi silmek istiyor musunuz?'))return;
    button.disabled=true;accountClient.deleteAddress(address.id).then(()=>{toast('Adres silindi.');if(currentRoute()==='hesabim/adresler')renderAccountPage('adresler');}).catch(()=>{button.disabled=false;toast('Adres silinemedi.');});
  }else{
    const form=$('#account-address-form');if(!form)return;
    for(const field of ['id','label','recipient','phone','city','district','line'])form.elements.namedItem(field).value=address[field]||'';
    $('#account-address-form-title').textContent='Adresi düzenle';form.querySelector('[data-action="address-cancel"]').hidden=false;
    form.scrollIntoView({behavior:'smooth',block:'center'});form.elements.namedItem('label').focus({preventScroll:true});
  }
});
document.addEventListener('reset',e=>{if(!e.target.matches?.('#account-address-form'))return;requestAnimationFrame(()=>{const form=e.target;form.querySelector('#account-address-form-title').textContent='Yeni adres ekle';form.querySelector('[data-action="address-cancel"]').hidden=true;form.querySelector('[role="status"]').hidden=true;});});
document.addEventListener('submit',e=>{
  if(e.target.id!=='checkout-form')return;
  e.preventDefault();
  if(!cart.length){renderCheckout();return;}
  const subtotal=total(),qty=count();
  const items=cart.map(row=>({id:row.id,qty:row.qty,price:product(row.id).price}));
  main.innerHTML=`<div class="container checkout-success"><div style="text-align:center;padding:40px 0 65px">${icon('check')}<h1>Deneme siparişi tamamlandı</h1><p>Bu bir önizlemedir. Gerçek sipariş oluşturulmadı ve ödeme alınmadı.</p><div class="success-items" style="max-width:400px;margin:25px auto;padding:22px;background:var(--cream);text-align:left"><div class="summary-row"><span>Ürün adedi</span><strong>${qty}</strong></div><div class="summary-row total"><span>Ara toplam</span><strong>${money(subtotal)}</strong></div></div><p>Sepetiniz bu tarayıcıda saklanır.</p><a href="#magaza" class="button" data-checkout-next>Ürünlere dön ${icon('arrow')}</a></div></div>`;
  window.scrollTo({top:0,behavior:'instant'});
  if(accountClient.mode!=='demo')return;
  void accountClient.recordDemoOrder({items,total:subtotal}).then(order=>{
    if(!order||currentRoute()!=='odeme')return;
    const next=main.querySelector('.checkout-success [data-checkout-next]');
    if(!next)return;
    next.href='#hesabim/siparisler';
    next.innerHTML=`Siparişlerime bak ${icon('arrow')}`;
    next.insertAdjacentHTML('afterend','<a href="#magaza" class="underlink">Ürünlere dön</a>');
  }).catch(()=>{});
});
function syncAuthRouteClass(){document.body.classList.toggle('is-auth-route',['giris','kayit','sifremi-unuttum'].includes(currentRoute().split('?')[0]));}
window.addEventListener('hashchange',()=>{syncAuthRouteClass();route();});
window.addEventListener('storage',e=>{if(['ao-cart-v1','ao-favorites-v1'].includes(e.key)){const storedCart=load('ao-cart-v1',[]),storedFav=load('ao-favorites-v1',[]);cart=cleanCart(storedCart,products);favorites=Array.isArray(storedFav)?storedFav.filter(id=>product(id)):[];updateHeader();if(!$('#cart-drawer').hidden)renderCart();if(currentRoute()==='favoriler')renderFavorites();if(currentRoute().startsWith('hesabim'))void renderAccountPage(currentRoute().split('/')[1]||'genel');}});
// QUALITY FEATURES BEGIN
function updateHeader(){
  document.querySelectorAll('.cart-count').forEach(e=>e.textContent=count());$('#header-total').textContent=money(total());$('.favorite-count').hidden=!favorites.length;
  document.querySelectorAll('.favorite-button').forEach(e=>{const active=favorites.includes(e.dataset.id);e.classList.toggle('active',active);e.setAttribute('aria-pressed',String(active));e.setAttribute('aria-label',`${product(e.dataset.id)?.name}: ${active?'Favorilerden çıkar':'Favorilere ekle'}`);});
  document.querySelectorAll('[data-cart-status]').forEach(e=>{const amount=cart.find(x=>x.id===e.dataset.cartStatus)?.qty||0;e.hidden=!amount;e.textContent=amount?`Sepetinizde ${amount} adet`:'';});updateMobileCart();if(currentRoute()==='odeme')updateCheckoutSummary();
}
function updateMobileCart(){
  const bar=$('#mobile-cart-summary'),isDetail=currentRoute().startsWith('urun/')&&!!activeProductId,show=count()>0&&!isDetail&&currentRoute()!=='odeme';
  if(bar){bar.hidden=!show;const amount=$('#mobile-cart-total'),items=$('#mobile-cart-items');if(amount)amount.textContent=money(total());if(items)items.textContent=`${count()} ürün · Sepetinizi görüntüleyin`;}
  const desktop=$('#desktop-cart-summary'),showDesktop=count()>0&&currentRoute()!=='odeme';
  if(desktop){desktop.hidden=!showDesktop;$('#desktop-cart-total').textContent=money(total());$('#desktop-cart-items').textContent=`${count()} ürün · Sepeti görüntüle`;}
  document.body.classList.toggle('has-desktop-cart',showDesktop);
  document.body.classList.toggle('has-mobile-purchase',show||isDetail);
}
function toast(message,showCart=false,undo=false){
  clearTimeout(toastTimer);$('#toast').innerHTML=`${icon('check')}<span>${esc(message)}</span>${showCart&&$('#cart-drawer').hidden?'<button data-action="cart">Sepete git</button>':''}${undo&&$('#cart-drawer').hidden?'<button data-action="undo-remove">Geri al</button>':''}`;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),undo?6500:4200);
}
function add(id,qty=1){
  const p=product(id);if(!p)return false;const amount=Number(qty),plan=planCartAddition(cart,[{id,qty:amount}],products);
  if(!plan.ok){toast(plan.reason==='limit'?'Bir üründen en fazla 99 adet ekleyebilirsiniz.':'Geçerli bir adet seçin.');return false;}
  cart=plan.cart;save();toast(`${amount>1?amount+' adet ':''}${p.name} sepetinize eklendi.`,true);if(!$('#cart-drawer').hidden)renderCart();return true;
}
function addMany(items){
  const plan=planCartAddition(cart,items,products);if(!plan.ok){toast(plan.reason==='limit'?'Seçkideki bir ürünün adet sınırına ulaştınız. Sepetinizi düzenleyebilirsiniz.':'Ürünler eklenemedi. Adetleri kontrol edin.');return false;}
  cart=plan.cart;save();toast('İki ürün sepetinize eklendi.',true);if(!$('#cart-drawer').hidden)renderCart();return true;
}
function feedbackAdd(button,success){
  if(!success||!button?.classList)return;const original=button.innerHTML;button.innerHTML=`Eklendi ${icon('check')}`;button.classList.add('is-added');button.disabled=true;setTimeout(()=>{if(button.isConnected){button.innerHTML=original;button.classList.remove('is-added');button.disabled=false;}},1200);
}
function removeFromCart(id){
  const index=cart.findIndex(x=>x.id===id);if(index<0)return;removedCartItem={row:{...cart[index]},index};cart=cart.filter(x=>x.id!==id);save();if(!$('#cart-drawer').hidden)renderCart();toast(`${product(id).name} sepetten çıkarıldı.`,false,true);
}
function undoRemoval(){
  if(!removedCartItem)return;const {row,index}=removedCartItem,existed=cart.some(x=>x.id===row.id),plan=planCartAddition(cart,[row],products);if(!plan.ok){toast('Adet sınırı nedeniyle geri alınamadı. Sepetinizi düzenleyin.');return;}
  cart=plan.cart;if(!existed){const position=cart.findIndex(x=>x.id===row.id),[restored]=cart.splice(position,1);cart.splice(Math.min(index,cart.length),0,restored);}removedCartItem=null;save();if(!$('#cart-drawer').hidden)renderCart();toast('Ürün sepetinize geri eklendi.',true);
}
function setBackgroundInert(value){document.querySelectorAll('.site-header,#main,.site-footer,.mobile-bottom,#mobile-cart-summary,#desktop-cart-summary').forEach(e=>e.inert=value);}
function openCart(){if($('#modal').open)$('#modal').close();lastFocus=document.activeElement;closeSearch();$('#toast').classList.remove('show');$('#overlay').hidden=false;$('#cart-drawer').hidden=false;document.body.style.overflow='hidden';setBackgroundInert(true);renderCart();$('#cart-drawer').querySelector('button')?.focus();}
function closeCart(){if($('#cart-drawer').hidden)return;$('#overlay').hidden=true;$('#cart-drawer').hidden=true;document.body.style.overflow='';setBackgroundInert(false);if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});}
function cartRecommendation(){
  const options=cart.some(x=>x.id==='zeytinyagi')?['koy-zeytini','dag-inciri','cekirdeksiz-uzum']:['zeytinyagi','koy-zeytini','dag-inciri','cekirdeksiz-uzum'];const p=options.map(product).find(p=>p&&!cart.some(x=>x.id===p.id));if(!p)return '';
  return `<div class="cart-recommendation"><img src="assets/${p.image}" alt="${p.name}" loading="lazy" width="44" height="55"><div><small>Sepetinizi tamamlamak ister misiniz?</small><strong><a href="#urun/${p.id}">${p.name}</a></strong><b>${money(p.price)}</b></div><button data-action="cart-recommend" data-id="${p.id}" aria-label="${p.name} sepete ekle">${icon('plus')}</button></div>`;
}
function renderCart(){
  const undo=removedCartItem?`<div class="cart-undo"><span>${esc(product(removedCartItem.row.id).name)} çıkarıldı.</span><button data-action="undo-remove">Geri al</button></div>`:'';
  $('#cart-drawer').innerHTML=`<div class="drawer-head"><h2 id="cart-heading">Sepetiniz <small>${count()} ürün</small></h2><button class="icon-button" data-action="close-cart" aria-label="Sepeti kapat">${icon('close')}</button></div>${undo}${cart.length?`<div class="cart-items">${cart.map(cartItem).join('')}${cartRecommendation()}</div><div class="cart-summary"><div class="summary-row"><span>Ürün toplamı</span><strong>${money(total()+savings())}</strong></div><div class="summary-row" style="color:var(--rust)"><span>Katalog indirimleri</span><strong>−${money(savings())}</strong></div><div class="summary-row"><span>Kargo</span><span>Canlı satışta hesaplanır</span></div><div class="summary-row total"><span>Ara toplam</span><strong>${money(total())}</strong></div><a href="#odeme" class="button">Siparişe devam et ${icon('arrow')}</a><button class="cart-continue" data-action="close-cart">Alışverişe devam et</button><p>Tasarım sunumu · Gerçek sipariş veya ödeme alınmaz.</p></div>`:`<div class="empty-cart">${icon('bag')}<h3>Sepetiniz boş.</h3><p>Ürünleri inceleyip sepete ekleyebilirsiniz.</p><a href="#magaza" class="button">Tüm ürünler ${icon('arrow')}</a></div>`}`;
}
function changeQty(id,delta){const row=cart.find(x=>x.id===id);if(!row)return;if(row.qty+delta<=0){removeFromCart(id);$('#cart-drawer [data-action="close-cart"]')?.focus();return;}row.qty=Math.max(1,Math.min(99,row.qty+delta));save();renderCart();$(`#cart-drawer [data-action="${delta>0?'cart-plus':'cart-minus'}"][data-id="${id}"]`)?.focus();}
function updateCheckoutSummary(){
  const summary=$('.checkout-summary');if(!summary)return;summary.innerHTML=`<h2>Sepet özeti</h2>${cart.length?cart.map(x=>{const p=product(x.id);return `<div class="cart-item"><img src="assets/${p.image}" alt="${p.name}" width="53" height="69"><div class="cart-item-content"><h3>${p.name}</h3><span class="product-weight">${p.weight} · ${x.qty} adet</span></div><div class="cart-item-end"><strong>${money(p.price*x.qty)}</strong></div></div>`;}).join(''):'<p style="font-size:12px">Sepetinizde ürün kalmadı. Denemeyi tamamlamadan önce ürün ekleyin.</p>'}<div class="summary-row"><span>Katalog indirimleri</span><strong style="color:var(--rust)">−${money(savings())}</strong></div><div class="summary-row"><span>Kargo bedeli</span><span>Canlı satışta hesaplanır</span></div><div class="summary-row total"><span>Ara toplam</span><strong>${money(total())}</strong></div><p style="font-size:10px;margin:15px 0 0">Bu sunumda kart bilgisi istenmez, ödeme alınmaz.</p><button class="underlink" data-action="cart" style="margin-top:20px;padding-inline:0">Sepeti düzenle ${icon('arrow')}</button>`;const submit=$('#checkout-form button[type="submit"]');if(submit)submit.disabled=!cart.length;
}
function renderDetail(id){const p=product(id);if(!p){renderNotFound();return;}activeProductId=id;detailQuantity=1;document.title=`${p.name} — Alaşehir Organik`;main.innerHTML=productDetail(p,{products,icon,favorite,price,money,categoryName,arrowLink,card});icons();updateHeader();}
function setDetailQuantity(delta){detailQuantity=Math.max(1,Math.min(99,detailQuantity+delta));const amount=$('#detail-quantity');if(amount)amount.textContent=detailQuantity;document.querySelectorAll('[data-detail-amount]').forEach(e=>e.textContent=`${detailQuantity} adet`);document.querySelectorAll('[data-detail-total]').forEach(e=>e.textContent=money((product(activeProductId)?.price||0)*detailQuantity));document.querySelectorAll('[data-detail-minus]').forEach(e=>e.disabled=detailQuantity===1);document.querySelectorAll('[data-detail-plus]').forEach(e=>e.disabled=detailQuantity===99);}
function modal(content){$('#modal').classList.remove('image-lightbox');$('#modal').innerHTML=`<button class="icon-button modal-close" data-action="close-modal" aria-label="Pencereyi kapat">${icon('close')}</button>${content}`;if(!$('#modal').open)$('#modal').showModal();}
function zoomProduct(id){const p=product(id);if(!p)return;modal(`<h2 id="modal-title">${p.name}</h2><figure><img src="assets/${p.image}" alt="${p.name} orijinal ürün fotoğrafı" width="616" height="790"><figcaption>${p.name}<span>${p.weight}</span></figcaption></figure>`);$('#modal').classList.add('image-lightbox');}
function quick(id){const p=product(id);if(!p)return;modal(`<div class="modal-product"><img src="assets/${p.image}" alt="${p.name}" width="350" height="450"><div><div class="section-kicker">${categoryName(p.category)}</div><h2 id="modal-title">${p.name}</h2><p>${p.description}</p><span class="product-weight">${p.weight}</span><p style="margin-top:12px">${price(p)}</p><button class="button" data-action="quick-add" data-id="${p.id}">Sepetime ekle ${icon('plus')}</button>${arrowLink('#urun/'+p.id,'Ürün detayını gör')}</div></div>`);}
function renderHome(){main.innerHTML=homeMarkup({products,categories,icon,card,money,sortProducts,sort,normalize,matchesCategory,priceRange,homepage:true});icons();mountCampaignSlider(main);}
function renderCatalog(category='all',query='',deals=false){main.innerHTML=homeMarkup({products,categories,icon,card,money,sortProducts,sort,normalize,matchesCategory,priceRange,category,query,deals});icons();}
function toggleFilters(){const sidebar=$('#catalog-sidebar');if(!sidebar)return;const open=sidebar.classList.toggle('open');document.querySelectorAll('[data-action="filters"]').forEach(e=>e.setAttribute('aria-expanded',String(open)));}
function clearFilters(){priceRange={min:null,max:null};sort='recommended';$('#search').value='';if(currentRoute()==='magaza'||currentRoute()==='home')route();else location.hash='magaza';}
function applyPriceFilter(form){
  const minimum=form.elements.namedItem('min').value.trim(),maximum=form.elements.namedItem('max').value.trim(),min=minimum===''?null:Number(minimum),max=maximum===''?null:Number(maximum),invalid=[min,max].some(n=>n!==null&&(!Number.isFinite(n)||n<0))||(min!==null&&max!==null&&min>max),error=$('#price-range-error');
  if(invalid){if(error){error.hidden=false;error.textContent='Geçerli bir fiyat aralığı girin. En düşük fiyat en yüksekten büyük olamaz.';}return false;}
  priceRange={min,max};const open=$('#catalog-sidebar')?.classList.contains('open'),y=window.scrollY;route(true);if(open){$('#catalog-sidebar')?.classList.add('open');document.querySelectorAll('[data-action="filters"]').forEach(e=>e.setAttribute('aria-expanded','true'));}window.scrollTo(0,y);return true;
}
function closeSearch(){$('#search-suggestions').hidden=true;$('#search').setAttribute('aria-expanded','false');$('#search').removeAttribute('aria-activedescendant');searchIndex=-1;}
function renderSearch(query){
  const q=query.trim();if(q.length<2){closeSearch();return;}$('#search').removeAttribute('aria-activedescendant');searchMatches=products.filter(p=>normalize(p.name+' '+categoryName(p.category)).includes(normalize(q))).slice(0,5);searchIndex=-1;
  $('#search-suggestions').innerHTML=searchMatches.length?searchMatches.map(p=>`<a id="search-option-${p.id}" class="suggestion" role="option" aria-selected="false" tabindex="-1" href="#urun/${p.id}"><img src="assets/${p.image}" alt="" width="40" height="48"><span>${p.name}</span><strong>${money(p.price)}</strong></a>`).join('')+'<div class="search-footer" aria-hidden="true">↑ ↓ ile seçin, Enter ile inceleyin</div>':'<p style="font-size:11px;margin:10px">Bu arama için ürün bulunamadı.</p>';$('#search-suggestions').hidden=false;$('#search').setAttribute('aria-expanded','true');
}
function installQualityEvents(){
  const search=$('#search');search.setAttribute('role','combobox');search.setAttribute('aria-autocomplete','list');search.setAttribute('aria-controls','search-suggestions');search.setAttribute('aria-expanded','false');$('#search-suggestions').setAttribute('role','listbox');$('#search-suggestions').setAttribute('aria-label','Ürün arama önerileri');
  search.addEventListener('input',e=>renderSearch(e.target.value));
  search.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSearch();return;}if(!['ArrowDown','ArrowUp','Enter'].includes(e.key)||$('#search-suggestions').hidden||!searchMatches.length)return;if(e.key==='Enter'){if(searchIndex>=0){e.preventDefault();location.hash='urun/'+searchMatches[searchIndex].id;closeSearch();search.blur();}return;}e.preventDefault();searchIndex=searchIndex<0?(e.key==='ArrowDown'?0:searchMatches.length-1):(searchIndex+(e.key==='ArrowDown'?1:-1)+searchMatches.length)%searchMatches.length;document.querySelectorAll('#search-suggestions .suggestion').forEach((row,index)=>{row.classList.toggle('is-active',index===searchIndex);row.setAttribute('aria-selected',String(index===searchIndex));});search.setAttribute('aria-activedescendant','search-option-'+searchMatches[searchIndex].id);});
  document.addEventListener('submit',e=>{if(e.target.id==='price-filter'){e.preventDefault();applyPriceFilter(e.target);}});
  document.addEventListener('error',e=>{const img=e.target;if(img.tagName!=='IMG')return;const parent=img.closest('.product-image,.detail-image');if(parent){img.hidden=true;parent.classList.add('image-unavailable');}},true);
}

// QUALITY FEATURES END
installQualityEvents();icons();syncAuthRouteClass();route();

