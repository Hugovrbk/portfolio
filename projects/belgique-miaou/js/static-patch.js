/* static-patch.js — remplace le traitement serveur des formulaires (PHP/MySQL) par une démo côté navigateur. */
document.querySelectorAll('form[data-static-form]').forEach(function(f){
  f.addEventListener('submit',function(e){
    e.preventDefault();
    if(!f.checkValidity()){f.reportValidity();return;}
    var m=document.createElement('div');
    m.setAttribute('role','status');
    m.style.cssText='padding:18px 22px;border-radius:10px;background:#e9f8ef;border:1px solid #1aaf5d;color:#0b5d31;font-weight:600;line-height:1.5';
    m.textContent='Merci ! Votre demande a bien été prise en compte. (Version démonstration : ce site est statique, aucune donnée n\u2019est envoyée ni enregistrée.)';
    f.replaceWith(m);
  });
});
