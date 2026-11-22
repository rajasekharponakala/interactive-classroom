(() => {
  const $ = id => document.getElementById(id);
  const base = 6, scale = 21, a = [157,170], b = [283,170];
  const ink = 'var(--ink)', violet = '#9154d8', green = '#248264';
  let step = 0;
  const line = (p,q,color=ink) => `<path d="M${p.join(' ')}L${q.join(' ')}" stroke="${color}" stroke-width="3" fill="none"/>`;
  const dot = ([x,y], name, dx=6, dy=-9) => `<circle cx="${x}" cy="${y}" r="4" fill="${ink}"/><text x="${x+dx}" y="${y+dy}">${name}</text>`;
  const arcGuide = ([x,y],radius,color) => `<circle cx="${x}" cy="${y}" r="${radius*scale}" fill="none" stroke="${color}" stroke-width="2.5" stroke-dasharray="7 5"/>`;
  const number = n => Number(n.toFixed(2));
  function draw() {
    const triangle = $('construction').value === 'triangle';
    const rA = +$('radiusA').value, rB = triangle ? +$('radiusB').value : rA;
    const x = (base**2 + rA**2 - rB**2)/(2*base);
    const h2 = rA**2-x**2;
    const crosses = h2 > 1e-9, touches = Math.abs(h2) <= 1e-9;
    const h = crosses ? Math.sqrt(h2)*scale : 0;
    const up = [a[0]+x*scale,a[1]-h], down = [up[0],a[1]+h];
    $('labelA').textContent = triangle ? 'Compass opening at A (AC)' : 'Equal compass opening at A and B';
    $('radiusBGroup').hidden = !triangle;
    $('valueA').textContent = `${rA} cm`;
    $('valueB').textContent = `${rB} cm`;
    $('diagramTitle').textContent = triangle ? 'Triangle from three side lengths using two compass circles' : 'Perpendicular bisector from two equal compass circles';
    const stages = ['Start with the straight segment AB.', `Draw a compass circle centred at A with a radius of ${rA} cm.`,
      `Draw another compass circle centred at B with a radius of ${rB} cm. Look for intersections.`,
      triangle ? 'Join the upper intersection C to A and B to form triangle ABC.' : 'Join the two intersections with a straightedge. The line bisects AB at right angles.'];
    $('instructions').textContent = `Step ${step+1} of 4: ${step === 3 && !crosses ? 'Change the compass opening so that the circles cross twice.' : stages[step]}`;
    $('back').disabled = step === 0;
    // Keep focus on the forward button when invoking the final step.
    $('next').setAttribute('aria-disabled', String(step === 3));
    let svg = line(a,b);
    if (step >= 1) svg += arcGuide(a,rA,violet);
    if (step >= 2) svg += arcGuide(b,rB,green);
    let result = 'Predict where the two compass circles will meet.';
    if (step >= 2) {
      if (crosses) svg += dot(up,triangle?'C':'U') + dot(down,triangle?'C′':'V',6,20);
      if (touches) svg += dot(up,'T',6,22);
      if (!crosses) result = touches ? 'The circles touch at one point. There are not two crossings.' : 'The circles do not meet. Change the compass opening.';
      else if (step === 2) result = 'Two intersections found. Continue to construct the result.';
    }
    if (step === 3 && crosses) {
      if (triangle) {
        svg += line(a,up,violet) + line(b,up,green);
        result = `AB = ${base} cm, AC = ${rA} cm, BC = ${rB} cm. C′ would produce a mirror-image triangle with the same side lengths.`;
      } else {
        const mid = [(a[0]+b[0])/2,a[1]];
        svg += line([mid[0],16],[mid[0],324],violet) + line([mid[0]+12,mid[1]],[mid[0]+12,mid[1]-12]) + line([mid[0]+12,mid[1]-12],[mid[0],mid[1]-12]) + dot(mid,'M',8,23);
        result = `AM = MB = ${number(x)} cm. The bisector meets AB at 90°.`;
      }
    }
    $('drawing').innerHTML = svg + dot(a,'A',-22,23) + dot(b,'B',10,23);
    $('result').textContent = result;
  }
  $('construction').oninput = () => { step = 0; draw(); };
  $('radiusA').oninput = $('radiusB').oninput = draw;
  $('back').onclick = () => { if (step > 0) step--; draw(); };
  $('next').onclick = () => { if (step < 3) step++; draw(); };
  $('reset').onclick = () => { step=0; $('radiusA').value=4; $('radiusB').value=5; draw(); };
  draw();
})();
