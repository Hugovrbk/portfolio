/* static-patch.js — remplace ce que faisaient PHP/MySQL côté serveur :
   statut « ouvert maintenant », jour courant, formulaires (démo), images de secours. */
(function(){
  var HOURS=window.RESTO_HOURS||{}, LANG=window.RESTO_LANG||'fr';
  var T={fr:{open:'Ouvert maintenant',closed:'Fermé',opens:'Ouvre à'},en:{open:'Open now',closed:'Closed',opens:'Opens at'}}[LANG]||{};
  function nowBrussels(){
    var p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Brussels',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date()),o={};
    p.forEach(function(x){o[x.type]=x.value;});
    var dow={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[o.weekday];
    return {dow:dow,t:(o.hour==='24'?'00':o.hour)+':'+o.minute};
  }
  var n=nowBrussels(), slots=HOURS[n.dow]||[], st={open:false,label:T.closed}, next=null;
  slots.forEach(function(s){
    if(n.t>=s[0]&&n.t<=s[1]) st={open:true,label:T.open};
    else if(n.t<s[0]&&(next===null||s[0]<next)) next=s[0];
  });
  if(!st.open&&next) st.label=T.opens+' '+next;
  document.querySelectorAll('.brand-status').forEach(function(el){
    el.textContent=st.label; el.classList.toggle('open',st.open); el.classList.toggle('closed',!st.open);
  });
  document.querySelectorAll('[data-dow]').forEach(function(li){ if(+li.getAttribute('data-dow')===n.dow) li.classList.add('today'); });
  document.querySelectorAll('[data-fdow]').forEach(function(sp){ if(+sp.getAttribute('data-fdow')===n.dow) sp.style.cssText='color:#fff;font-weight:700'; });

  /* hero vidéo : lecture muette ; à l'arrêt si le visiteur a demandé moins d'animations */
  var hv=document.querySelector('.hero-video');
  if(hv){
    hv.muted=true;
    if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){hv.pause();}
    else{var pr=hv.play();if(pr&&pr.catch)pr.catch(function(){});}
  }

  /* date minimale = aujourd'hui */
  var d=new Date(), iso=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  document.querySelectorAll('input[data-min-today]').forEach(function(i){i.min=iso;});

  /* formulaires : validation puis page « merci » (aucune donnée envoyée) */
  document.querySelectorAll('form[data-static-form]').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      if(!f.checkValidity()){f.reportValidity();return;}
      var hp=f.querySelector('input[name=website]'); if(hp&&hp.value) return;
      location.href='merci-'+f.getAttribute('data-static-form')+'.html';
    });
  });

  /* images distantes (Unsplash) : image de secours locale si indisponible */
  var fb=(LANG==='en'?'../':'')+'uploads/showcase/deluxe/fallback.svg';
  document.addEventListener('error',function(e){
    var t=e.target; if(t&&t.tagName==='IMG'&&!t.dataset.fb&&/^https?:/.test(t.src)){t.dataset.fb='1';t.src=fb;}
  },true);
})();
