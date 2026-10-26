(function(global){
  function lighten(hex, amt){
    const c = hex.replace('#','');
    const n = parseInt(c,16);
    let r=(n>>16)+amt, g=((n>>8)&0xff)+amt, b=(n&0xff)+amt;
    r=Math.max(0,Math.min(255,r)); g=Math.max(0,Math.min(255,g)); b=Math.max(0,Math.min(255,b));
    return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
  }
  function shade(hex, f){
    const c = hex.replace('#','');
    const n = parseInt(c,16);
    const r=Math.round(((n>>16)&0xff)*f), g=Math.round(((n>>8)&0xff)*f), b=Math.round((n&0xff)*f);
    return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
  }
  function poly(ctx, cx, cy, r, sides, rot){
    ctx.beginPath();
    for (let i=0;i<sides;i++){
      const a = rot + i*(Math.PI*2/sides);
      const x = cx + r*Math.cos(a), y = cy + r*Math.sin(a);
      i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
    }
    ctx.closePath();
  }
  function drawEmblem(ctx, cx, cy, size, tier, colors){
    const c1 = colors[0]||'#888', c2 = colors[1]||'#444', c3 = colors[2]||'#222';
    const t = Math.max(1, Math.min(12, tier|0));
    ctx.save(); ctx.translate(cx, cy);

    const glow = ctx.createRadialGradient(0,0,size*0.1, 0,0,size*1.1);
    glow.addColorStop(0, c1+'cc');
    glow.addColorStop(0.5, c2+'44');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0,0,size*1.1,0,Math.PI*2); ctx.fill();

    const grad = ctx.createLinearGradient(-size, -size, size, size);
    grad.addColorStop(0, lighten(c1, 30));
    grad.addColorStop(0.5, c1);
    grad.addColorStop(1, shade(c2, 0.7));
    ctx.fillStyle = grad;
    ctx.strokeStyle = c3;
    ctx.lineWidth = Math.max(1.2, size*0.035);

    if (t <= 2){
      ctx.beginPath();
      ctx.moveTo(-size*0.7, -size*0.75);
      ctx.lineTo(size*0.7, -size*0.75);
      ctx.lineTo(size*0.7, size*0.1);
      ctx.quadraticCurveTo(size*0.7, size*0.85, 0, size*1.0);
      ctx.quadraticCurveTo(-size*0.7, size*0.85, -size*0.7, size*0.1);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (t <= 4){
      poly(ctx, 0, 0, size*0.92, 6, -Math.PI/2); ctx.fill(); ctx.stroke();
      poly(ctx, 0, 0, size*0.6, 6, -Math.PI/2);
      ctx.fillStyle = shade(c2,0.55); ctx.fill();
    } else if (t <= 6){
      poly(ctx, 0, 0, size*1.0, 4, -Math.PI/2); ctx.fill(); ctx.stroke();
      poly(ctx, 0, 0, size*0.55, 4, -Math.PI/2);
      ctx.fillStyle = lighten(c1,40); ctx.fill();
    } else if (t <= 8){
      const pts = []; const R = size*1.05, r = size*0.45;
      for (let i=0;i<12;i++){
        const ang = -Math.PI/2 + i*Math.PI/6;
        const rad = (i%2===0) ? R : r;
        pts.push([Math.cos(ang)*rad, Math.sin(ang)*rad]);
      }
      ctx.beginPath();
      pts.forEach((p,i)=> i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0,0,size*0.28,0,Math.PI*2);
      ctx.fillStyle = c3; ctx.fill();
    } else {
      const rays = 10;
      ctx.beginPath();
      for (let i=0;i<rays;i++){
        const a = -Math.PI/2 + i*(Math.PI*2/rays);
        const rOut = size*1.1, rIn = size*0.55;
        ctx.lineTo(Math.cos(a)*rOut, Math.sin(a)*rOut);
        const a2 = a + Math.PI/rays;
        ctx.lineTo(Math.cos(a2)*rIn, Math.sin(a2)*rIn);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0,0,size*0.42,0,Math.PI*2);
      const g2 = ctx.createRadialGradient(0,-size*0.1,2,0,0,size*0.42);
      g2.addColorStop(0,'#fff'); g2.addColorStop(1, c1);
      ctx.fillStyle = g2; ctx.fill();
      ctx.strokeStyle = c3; ctx.stroke();
    }
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.beginPath();
    ctx.ellipse(-size*0.3, -size*0.55, size*0.45, size*0.18, -0.3, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  global.RFRanks = { drawEmblem, lighten, shade };
})(window);