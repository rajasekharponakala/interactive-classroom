(() => {
  const $ = id => document.getElementById(id);
  const rad = Math.PI/180, ink = 'var(--ink)', purple = '#8b51dd', green = '#297b65', orange = '#be5e21';
  const point = ([x,y], r, angle) => [x+r*Math.cos(angle*rad), y+r*Math.sin(angle*rad)];
  const xy = ([x,y]) => `${x.toFixed(2)} ${y.toFixed(2)}`;
  const line = (a,b,color,dash='') => `<path d="M ${xy(a)} L ${xy(b)}" fill="none" stroke="${color}" stroke-width="3" ${dash}/>`;
  const dot = (p, label, dx, dy, color=ink) => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${color}"/><text x="${p[0]+dx}" y="${p[1]+dy}">${label}</text>`;
  const ring = ([x,y],r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${ink}" stroke-width="2"/>`;
  const arc = (o,r,start,end,color) => `<path d="M ${xy(point(o,r,start))} A ${r} ${r} 0 ${end-start > 180 ? 1 : 0} 1 ${xy(point(o,r,end))}" fill="none" stroke="${color}" stroke-width="4"/>`;
  const angleOf = (a,o,b) => {
    const u = [a[0]-o[0],a[1]-o[1]], v = [b[0]-o[0],b[1]-o[1]];
    const cos = (u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v));
    return Math.acos(Math.max(-1,Math.min(1,cos)))/rad;
  };
  function angles() {
    const width = +$('arc').value, o = [220,170], r = 128;
    const start = -90-width/2, end = -90+width/2;
    // Leave a gap at each endpoint to keep the angle defined.
    const cAngle = end+20+(360-width-40)*$('position').value/100;
    const a = point(o,r,start), b = point(o,r,end), c = point(o,r,cAngle);
    const rim = Math.round(angleOf(a,c,b)), center = Math.round(angleOf(a,o,b));
    $('arcValue').textContent = `${width}°`;
    $('marks').innerHTML = ring(o,r) + arc(o,r,start,end,orange) + line(a,o,orange) + line(b,o,orange) + line(a,c,purple) + line(b,c,purple)
      + arc(o,28,start,end,orange) + dot(a,'A',-21,-8) + dot(b,'B',8,-8) + dot(c,'C',9,17,purple) + dot(o,'O',8,19);
    $('measurements').textContent = `At the centre, ∠AOB = ${center}°. At C, ∠ACB = ${rim}°. Both angles subtend the highlighted arc AB.`;
  }
  function tangents() {
    const d = +$('distance').value, radius = 2, scale = 47, o = [140,170], p = [o[0]+d*scale,o[1]];
    const adjacent = radius*radius/d, perpendicular = Math.sqrt(radius*radius-adjacent*adjacent);
    const a = [o[0]+adjacent*scale,o[1]-perpendicular*scale], b = [a[0],o[1]+perpendicular*scale];
    const len = q => Math.hypot(p[0]-q[0],p[1]-q[1])/scale;
    const square = q => {
      const toward = v => [(v[0]-q[0])/Math.hypot(v[0]-q[0],v[1]-q[1])*11,(v[1]-q[1])/Math.hypot(v[0]-q[0],v[1]-q[1])*11];
      const u = toward(o), v = toward(p);
      return line([q[0]+u[0],q[1]+u[1]],[q[0]+u[0]+v[0],q[1]+u[1]+v[1]],green) + line([q[0]+v[0],q[1]+v[1]],[q[0]+u[0]+v[0],q[1]+u[1]+v[1]],green);
    };
    $('distanceValue').textContent = `${d.toFixed(1)} units`;
    const near = [o[0]+radius*scale,o[1]], far = [o[0]-radius*scale,o[1]];
    const pn = (p[0]-near[0])/scale, pf = (p[0]-far[0])/scale;
    $('marks').innerHTML = ring(o,radius*scale) + line([30,170],p,ink,'stroke-dasharray="6 6"')
      + line(o,a,green) + line(o,b,green) + line(a,p,purple) + line(b,p,purple) + square(a) + square(b)
      + dot(o,'O',-20,-9) + dot(a,'A',-4,-13) + dot(b,'B',-4,22) + dot(p,'P',10,6) + dot(near,'N',-7,23) + dot(far,'F',-15,23);
    $('measurements').textContent = `PA = ${len(a).toFixed(2)} units; PB = ${len(b).toFixed(2)} units. The tangent lengths are equal. ∠OAP = ∠OBP = ${Math.round(angleOf(o,a,p))}°. PN × PF = ${pn.toFixed(1)} × ${pf.toFixed(1)} = ${(pn*pf).toFixed(2)} square units; PA² = ${(len(a)**2).toFixed(2)} square units (before rounding PA).`;
  }
  function draw() {
    const arcMode = $('mode').value === 'arc';
    $('arcControls').hidden = !arcMode; $('tangentControls').hidden = arcMode;
    $('diagramTitle').textContent = arcMode ? 'Two angles subtending the same arc AB' : 'Two tangents from P and a secant through the centre O';
    if (arcMode) angles(); else tangents();
  }
  for (const id of ['mode','arc','position','distance']) $(id).addEventListener('input',draw);
  $('resetCircle').onclick = () => { $('arc').value=90; $('position').value=50; $('distance').value=3.5; draw(); };
  draw();
})();
