/* static-patch.js — remplace les parties PHP/MySQL/Mollie par du JS côté navigateur */
(function(){
  var TARIFS={mp3:20,cd:30}, SUPP={1:0,2:5,3:10};
  function esc(s){var d=document.createElement('div');d.textContent=s==null?'':s;return d.innerHTML;}
  function eur(n){return n.toFixed(2).replace('.',',')+' €';}

  /* 1. Commande : validation + confirmation fictive */
  var form=document.getElementById('orderForm');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var fd=new FormData(form), v=function(k){return (fd.get(k)||'').toString().trim();};
      var produit=v('produit'), n=parseInt(v('nombre_chansons'),10)||1;
      var err=[];
      if(!produit) err.push('Choisissez un format (MP3 ou CD).');
      if(!v('prenom')) err.push('Le prénom de la personne célébrée est requis.');
      if(!v('occasion')) err.push("L'occasion est requise.");
      if(!v('style_musical')) err.push('Choisissez un style musical.');
      if(!fd.getAll('souvenir[]').some(function(s){return s.trim();})) err.push('Au moins un souvenir est requis.');
      if(!v('nom_client')) err.push('Votre nom est requis.');
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('email_client'))) err.push('Adresse email invalide.');
      if(produit==='cd' && !v('adresse')) err.push("L'adresse de livraison est requise pour le CD.");
      if(!fd.get('cgv')) err.push('Vous devez accepter les CGV.');
      if(err.length){
        var box=document.getElementById('staticErr');
        if(!box){box=document.createElement('div');box.id='staticErr';box.className='alert';
          box.style.cssText='background:rgba(200,60,60,.12);border:1px solid rgba(200,60,60,.4);color:#f0a0a0;margin-bottom:1.5rem';
          form.insertBefore(box,form.firstChild);}
        box.innerHTML=err.map(esc).join('<br>');
        box.scrollIntoView({behavior:'smooth',block:'center'});
        return;
      }
      var order={prenom:v('prenom'),email:v('email_client'),occasion:v('occasion'),style:v('style_musical'),
        produit:produit,montant:(TARIFS[produit]||0)+(SUPP[n]||0),id:Math.floor(Math.random()*90000)+10000};
      try{sessionStorage.setItem('cdtv_order',JSON.stringify(order));}catch(x){}
      location.href='confirmation.html';
    });
  }

  /* 2. Page de confirmation */
  var root=document.getElementById('confirmRoot');
  if(root){
    var o=null; try{o=JSON.parse(sessionStorage.getItem('cdtv_order')||'null');}catch(x){}
    if(o){
      root.innerHTML='<div class="confirm-box"><span class="confirm-icon">🎵</span><h1>Commande confirmée !</h1>'+
      '<p>Merci <strong>'+esc(o.prenom)+'</strong> — votre commande a bien été reçue. Nous créerons votre chanson sous <strong>48 heures</strong> et vous l\'enverrons à <strong>'+esc(o.email)+'</strong> pour validation.</p>'+
      '<div class="confirm-id">Commande #'+String(o.id).padStart(5,'0')+'</div>'+
      '<p style="font-size:.88rem;color:var(--gris)">Version démonstration : cette commande est fictive, aucune donnée n\'a été envoyée.</p>'+
      '<div class="groove-divider" style="margin:2rem 0"><div class="groove-divider-dot"></div></div>'+
      '<div style="background:var(--noir-3);border:1px solid rgba(201,168,76,.12);border-radius:var(--radius);padding:1.5rem;text-align:left;margin-bottom:2rem"><p style="font-size:.82rem;color:var(--gris-clair);margin:0;line-height:1.9"><strong style="color:var(--or)">Récapitulatif :</strong><br>'+
      '🎁 Format : '+esc(o.produit.toUpperCase())+'<br>🎵 Style : '+esc(o.style)+'<br>📅 Occasion : '+esc(o.occasion)+'<br>💶 Montant : '+eur(o.montant)+'</p></div>'+
      '<a href="index.html" class="btn btn--outline-or">← Retour à l\'accueil</a></div>';
    } else {
      root.innerHTML='<div class="confirm-box"><span class="confirm-icon">🎵</span><h1>Aucune commande en cours</h1><p>Cette page affiche le récapitulatif d\'une commande de démonstration. Passez une commande fictive pour la voir.</p><a href="commander.html" class="btn btn--or" style="margin-top:1.5rem">Commander ma chanson</a></div>';
    }
  }

  /* 3. Démos audio : fichiers .mp3 non fournis dans cette version */
  document.querySelectorAll('.demo-card').forEach(function(card){
    var btn=card.querySelector('.audio-player__btn'); if(!btn) return;
    var t=card.querySelector('.audio-player__time');
    if(t) t.textContent='Extrait audio non inclus (démo)';
    card.addEventListener('click',function(e){
      if(e.target.closest('.audio-player__btn')||e.target.closest('.audio-player__progress')){
        e.stopImmediatePropagation(); e.preventDefault();
      }
    },true);
  });
})();
