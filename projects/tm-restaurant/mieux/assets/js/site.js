(()=>{
const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
const eur=n=>n.toFixed(2).replace('.',',')+' €';
const ls={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const ss={set(k,v){try{sessionStorage.setItem(k,v)}catch{}},get(k){try{return sessionStorage.getItem(k)}catch{return null}}};
const toast=m=>{const t=$('.toast');t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),2200)};

/* ---- horaires & statut ---- */
const HRS={0:[[12,14.5],[18,22.5]],1:null,2:[[12,14.5],[18,22.5]],3:[[12,14.5],[18,22.5]],4:[[12,14.5],[18,22.5]],5:[[12,14.5],[18,23.5]],6:[[12,15],[18,23.5]]};
const hh=h=>Math.floor(h)+'h'+(h%1?'30':'00'),hc=h=>String(Math.floor(h)).padStart(2,'0')+':'+(h%1?'30':'00');
(()=>{const n=new Date(),d=n.getDay(),t=n.getHours()+n.getMinutes()/60,el=$('#status'),s=HRS[d];let txt='Fermé aujourd’hui',open=0;
if(s){const cur=s.find(r=>t>=r[0]&&t<r[1]);if(cur){open=1;txt='Ouvert jusqu’à '+hh(cur[1])}else{const nx=s.find(r=>t<r[0]);txt=nx?'Fermé, ouvre à '+hh(nx[0]):'Fermé, ouvre demain'}}
if(el){el.textContent=txt;el.classList.toggle('open',!!open)}
$$('.hours li').forEach(li=>li.classList.toggle('today',+li.dataset.d===d||(li.dataset.d==='2-4'&&d>=2&&d<=4)))})();
const page=location.pathname.split('/').pop()||'index.html';
$$('.nav a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')===page));
$('.burger').onclick=()=>document.body.classList.toggle('nav-open');

/* ---- plats ---- */
const LIST=document.body.dataset.menu==='list';
const heat=n=>n?'Piment '+'●'.repeat(n)+'○'.repeat(3-n):'';
const zh=z=>/[\u4e00-\u9fff]/.test(z);
const row=(d,i)=>`<article class="mrow"><span class="no">${i+1}</span><div><h3>${d.n}${zh(d.z)?` <span class="zh">${d.z}</span>`:''}</h3><p>${d.d}${d.s?` · <span class="heat">${heat(d.s)}</span>`:''}${d.v?' · Végé':''}</p></div><span class="price">${eur(d.p)}</span><button class="add" data-add="${d.id}" aria-label="Ajouter ${d.n}">+</button></article>`;
const card=d=>`<article class="card">${d.img?`<img loading="lazy" src="${U(d.img,700)}" alt="${d.n}">`:''}<div class="cb"><h3>${d.n}</h3><p class="sub">${d.z}</p><p>${d.d}</p><div class="foot"><span class="tag">${eur(d.p)}</span><span class="heat">${heat(d.s)}${d.v?' Végé':''}</span><button class="add" data-add="${d.id}">Ajouter</button></div></div></article>`;
const dish=(d,i)=>LIST?row(d,i):card(d);
const sig=$('#sig');if(sig)sig.innerHTML=DISHES.map((d,i)=>d.sig?dish(d,i):'').join('');
const mg=$('#menugrid');if(mg){let cat='all',q='',vg=0;
$('#chips').innerHTML=CATS.map(c=>`<button class="${c[0]==='all'?'on':''}" data-c="${c[0]}">${c[1]}</button>`).join('');
mg.innerHTML=DISHES.map(dish).join('');[...mg.children].forEach((el,i)=>{const d=DISHES[i];el.dataset.c=d.c;el.dataset.v=d.v?1:0;el.dataset.t=(d.n+d.z+d.d).toLowerCase()});
const ap=()=>{let n=0;[...mg.children].forEach(c=>{const ok=(cat==='all'||c.dataset.c===cat)&&(!vg||c.dataset.v==='1')&&c.dataset.t.includes(q);c.hidden=!ok;n+=ok});$('.empty').hidden=!!n};
$('#chips').onclick=e=>{const b=e.target.closest('button');if(!b)return;cat=b.dataset.c;$$('#chips button').forEach(x=>x.classList.toggle('on',x===b));ap()};
$('#q').oninput=e=>{q=e.target.value.toLowerCase();ap()};$('#vg').onchange=e=>{vg=e.target.checked;ap()};ap()}

/* ---- panier ---- */
const KEY2=(document.querySelector('.brand')?.textContent||'x').trim().replace(/\W/g,'');
let cart=ls.get('cart-'+KEY2,[]);const sub=()=>cart.reduce((s,i)=>s+i.p*i.q,0);
const save=()=>{ls.set('cart-'+KEY2,cart);render()};
function add(it){const f=cart.find(c=>c.id===it.id);f?f.q++:cart.push({...it,q:1});save();toast(it.n+' ajouté au panier')}
function render(){$('#cartcount').textContent=cart.reduce((s,i)=>s+i.q,0);const s=sub(),liv=$('#mode').value==='livraison',fee=liv&&s<40&&s>0?3.5:0;
$('#lines').innerHTML=cart.length?cart.map(i=>`<div class="line"><div><b>${i.n}</b><div class="qty"><button data-m="${i.id}">−</button><span>${i.q}</span><button data-p="${i.id}">+</button></div></div><span>${eur(i.p*i.q)}</span></div>`).join(''):'<p class="muted">Votre panier est vide.</p>';
$('#fsub').textContent=eur(s);$('#ffee').textContent=liv?(fee?eur(fee):'Offerte'):'—';$('#ftot').textContent=eur(s+fee);$('#fmsg').textContent=liv?(s>=40?'Livraison offerte.':`Encore ${eur(Math.max(0,40-s))} pour la livraison offerte.`):''}
document.addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(!b)return;const d=DISHES.find(x=>x.id===b.dataset.add);add({id:d.id,n:d.n,p:d.p})});
$('#lines').addEventListener('click',e=>{const m=e.target.dataset.m,p=e.target.dataset.p;if(p)cart.find(c=>c.id===p).q++;if(m){const c=cart.find(c=>c.id===m);if(--c.q<=0)cart=cart.filter(x=>x!==c)}if(m||p)save()});
$('#cartbtn').onclick=()=>document.body.classList.add('cart-open');$('.ov').onclick=$('#cclose').onclick=()=>document.body.classList.remove('cart-open');$('#mode').onchange=render;
$('#order').onsubmit=e=>{e.preventDefault();if(!cart.length)return toast('Votre panier est vide');const f=new FormData(e.target),s=sub(),fee=f.get('mode')==='livraison'&&s<40?3.5:0;
ss.set('last',JSON.stringify({t:'order',name:f.get('name'),mode:f.get('mode'),when:f.get('when'),items:cart,total:s+fee}));cart=[];ls.set('cart-'+KEY2,cart);location.href='merci.html'};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('cart-open');$('.lb')?.classList.remove('on')}});

/* ---- composeur ---- */
const cp=$('#composer');if(cp){const S={base:0,prot:0,sauce:0,veg:[0,1,2],extra:[],heat:2},H=['doux','léger','relevé','fort','très fort'];
const opt=(arr,k,pr)=>arr.map((o,i)=>`<button type="button" class="opt" data-k="${k}" data-i="${i}">${o[0]}${pr&&o[1]!=null?` <small>${k==='base'?'':'+'}${eur(o[1])}</small>`:''}</button>`).join('');
$('#o-base').innerHTML=opt(WOK.base,'base',1);$('#o-prot').innerHTML=opt(WOK.prot,'prot',1);$('#o-sauce').innerHTML=opt(WOK.sauce,'sauce');$('#o-veg').innerHTML=opt(WOK.veg,'veg');$('#o-extra').innerHTML=opt(WOK.extra,'extra',1);
const sel=(k,i)=>Array.isArray(S[k])?S[k].includes(i):S[k]===i;
function draw(){$$('.opt').forEach(b=>b.classList.toggle('on',sel(b.dataset.k,+b.dataset.i)));
const b=WOK.base[S.base],p=WOK.prot[S.prot],sa=WOK.sauce[S.sauce],vs=S.veg.map(i=>WOK.veg[i][0]),ex=S.extra.map(i=>WOK.extra[i]);
const price=b[1]+p[1]+Math.max(0,vs.length-3)*.7+ex.reduce((s,e)=>s+e[1],0);
$('#sl').innerHTML=[['Base',b[0],eur(b[1])],['Protéine',p[0],p[1]?'+'+eur(p[1]):'—'],['Sauce',sa[0]+' ('+H[S.heat]+')','—'],[WOK.vl,vs.join(', ')||'aucun',vs.length>3?'+'+eur((vs.length-3)*.7):'inclus'],['Extras',ex.map(e=>e[0]).join(', ')||'aucun',ex.length?'+'+eur(ex.reduce((s,e)=>s+e[1],0)):'—']].map(r=>`<li><span><b>${r[0]}</b> ${r[1]}</span><span>${r[2]}</span></li>`).join('');
$('#tp').textContent=eur(price);$('#heatl').textContent=H[S.heat];cp._price=price;cp._name=`${WOK.nm} : ${b[0]} ${p[0].toLowerCase()}, sauce ${sa[0]}`}
cp.addEventListener('click',e=>{const o=e.target.closest('.opt');if(!o)return;const k=o.dataset.k,i=+o.dataset.i;if(Array.isArray(S[k])){const x=S[k].indexOf(i);x>-1?S[k].splice(x,1):S[k].push(i)}else S[k]=i;draw()});
$('#heat').oninput=e=>{S.heat=+e.target.value;draw()};$('#addwok').onclick=()=>add({id:'w'+Date.now(),n:cp._name,p:cp._price});draw()}

/* ---- réservation ---- */
const rf=$('#resa');if(rf){const d=$('#date');d.min=new Date().toISOString().slice(0,10);let g=2,slot='';
const slots=()=>{const day=new Date(d.value).getDay(),box=$('#slots');if(!d.value){box.innerHTML='<small class="muted">Choisissez d’abord une date.</small>';return}
if(day===1){box.innerHTML='<small class="err">Fermé le lundi, choisissez un autre jour.</small>';return}
const out=[];HRS[day].forEach(r=>{for(let t=r[0];t<=r[1]-1;t+=.5)out.push(hc(t))});box.innerHTML=out.map(t=>`<button type="button" class="slot">${t}</button>`).join('')};
d.onchange=()=>{slot='';slots()};slots();
$('#slots').onclick=e=>{const b=e.target.closest('.slot');if(!b)return;slot=b.textContent;$$('.slot').forEach(x=>x.classList.toggle('on',x===b))};
$('#minus').onclick=()=>$('#gv').value=g=Math.max(1,g-1);$('#plus').onclick=()=>$('#gv').value=g=Math.min(14,g+1);
const bad=(n,c)=>{n.closest('.fld').classList.toggle('bad',c);return c};
rf.onsubmit=e=>{e.preventDefault();const v=n=>rf.elements[n];let ko=0;
ko|=bad(v('name'),v('name').value.trim().length<2);ko|=bad(v('phone'),!/^[+\d][\d\s().-]{7,}$/.test(v('phone').value.trim()));ko|=bad(d,!d.value||new Date(d.value).getDay()===1);
if(!slot){toast('Choisissez un horaire');ko=1}if(ko)return;
ss.set('last',JSON.stringify({t:'resa',name:v('name').value,date:d.value,slot,g,occ:v('occ').value}));location.href='merci.html'}}

/* ---- confirmation & contact ---- */
const th=$('#thanks');if(th){const l=JSON.parse(ss.get('last')||'null');
if(l?.t==='resa')th.innerHTML=`<h1>Table réservée</h1><p class="lead">${l.name}, nous vous attendons ${new Date(l.date).toLocaleDateString('fr-BE',{weekday:'long',day:'numeric',month:'long'})} à ${l.slot} pour ${l.g} personne${l.g>1?'s':''}${l.occ?' ('+l.occ+')':''}. Nous confirmons par téléphone.</p>`;
else if(l?.t==='order')th.innerHTML=`<h1>Commande reçue</h1><p class="lead">Merci ${l.name}. ${l.mode==='livraison'?'Livraison':'À emporter'}, ${l.when==='asap'?'prête dans environ 20 minutes':l.when.toLowerCase()}.</p><ul class="recap">${l.items.map(i=>`<li><span>${i.q} × ${i.n}</span><span>${eur(i.p*i.q)}</span></li>`).join('')}<li class="tot"><span>Total</span><span>${eur(l.total)}</span></li></ul>`;
else th.innerHTML='<h1>Message envoyé</h1><p class="lead">Merci, nous répondons sous 24 heures.</p>'}
const cf=$('#contact');if(cf)cf.onsubmit=e=>{e.preventDefault();ss.set('last','{"t":"msg"}');location.href='merci.html'};

/* ---- galerie ---- */
const gl=$('#gal');if(gl){gl.innerHTML=GALLERY.map((g,i)=>`<figure class="tile" data-i="${i}"><img loading="lazy" src="${U(g[0],800)}" alt="${g[1]}"><figcaption>${g[1]}</figcaption></figure>`).join('');let cur=0;const lb=$('.lb'),show=i=>{cur=(i+GALLERY.length)%GALLERY.length;$('.big',lb).innerHTML=`<img src="${U(GALLERY[cur][0],1400)}" alt=""><p>${GALLERY[cur][1]}</p>`};
gl.onclick=e=>{const t=e.target.closest('.tile');if(!t)return;show(+t.dataset.i);lb.classList.add('on')};$('.pv',lb).onclick=()=>show(cur-1);$('.nx',lb).onclick=()=>show(cur+1);$('.x',lb).onclick=()=>lb.classList.remove('on');
addEventListener('keydown',e=>{if(!lb.classList.contains('on'))return;if(e.key==='ArrowLeft')show(cur-1);if(e.key==='ArrowRight')show(cur+1)})}

/* ---- images absentes ---- */
const miss=i=>{const t=i.closest('.tile,figure.ph');t?t.remove():i.remove()};
document.addEventListener('error',e=>{if(e.target.tagName==='IMG')miss(e.target)},true);$$('img').forEach(i=>{if(i.complete&&!i.naturalWidth)miss(i)});
render();
})();
