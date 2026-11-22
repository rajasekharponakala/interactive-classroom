(() => {
  const $ = id => document.getElementById(id), svg = document.querySelector('svg');
  const parts = {
    membrane: ['Cell membrane','Controls what enters and leaves the cell.','#395b97'],
    wall: ['Cell wall','A rigid layer outside the plant cell membrane that supports the cell.','#218950'],
    nucleus: ['Nucleus','Contains most of the cell’s genetic information.','#8261d5'],
    mito: ['Mitochondrion','Helps the cell release usable energy from food.','#d65249'],
    vacuole: ['Central vacuole','Stores water and other substances and helps support the plant cell.','#3c8ec7'],
    chloroplast: ['Chloroplast','Uses light energy to help make sugars during photosynthesis.','#2da86b'],
  };
  // The silhouettes are projected from three-dimensional ellipsoids.
  const bodies = {
    plant: [['vacuole',[.12,-.05,0],[.83,.65,.60]],['nucleus',[-1,.38,.38],[.31,.30,.29]],
      ['chloroplast',[.9,.67,.45],[.35,.15,.23]],['chloroplast',[-.7,-.63,-.53],[.36,.15,.21]],['mito',[.94,-.55,.50],[.26,.13,.13]]],
    animal: [['nucleus',[-.25,0,0],[.48,.44,.38]],['mito',[.67,.36,.37],[.31,.15,.15]],['mito',[-.66,-.49,-.42],[.29,.14,.13]]],
  };
  let yaw = .65, pitch = .36, drag;
  const loop = (fn) => Array.from({length:48},(_,i) => fn(i*Math.PI/24));
  function hull(points) {
    const sorted = points.slice().sort((a,b) => a[0]-b[0] || a[1]-b[1]);
    const half = (list) => list.reduce((out,p) => {
      const cross = (a,b) => (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
      while (out.length > 1 && cross(out.at(-2),out.at(-1)) <= 0) out.pop();
      out.push(p); return out;
    }, []).slice(0,-1);
    return half(sorted).concat(half(sorted.reverse()));
  }
  const points = (p) => p.map(([x,y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  function draw() {
    const plant = $('cellType').value === 'plant', selected = $('part').value;
    const project = G3.camera(yaw,pitch,7,610);
    const outline = (key, runs) => runs.map(run => `<polygon fill="none" stroke="${parts[key][2]}" stroke-width="${key === selected ? 3 : 1.5}" opacity="${key === selected ? .94 : .45}" points="${points(run.map(project))}"/>`).join('');
    function box(key, x,y,z) {
      const b = G3.box(x,y,z);
      return outline(key, [b.faces[0],b.faces[1],b.faces[2],b.faces[4]].map(f => f.map(i => b.vertices[i])));
    }
    const shell = plant ? box('wall',1.55,1.15,.87) + box('membrane',1.44,1.04,.77) : outline('membrane', [
      loop(a => [1.52*Math.cos(a),1.16*Math.sin(a),0]), loop(a => [1.52*Math.cos(a),0,1.02*Math.sin(a)]), loop(a => [0,1.16*Math.cos(a),1.02*Math.sin(a)]),
    ]);
    const organelles = bodies[$('cellType').value].map(([id,c,r]) => {
      const outline = hull(Array.from({length:13},(_,j) => {
        const t = j*Math.PI/12;
        return loop(a => project([c[0]+r[0]*Math.sin(t)*Math.cos(a), c[1]+r[1]*Math.cos(t), c[2]+r[2]*Math.sin(t)*Math.sin(a)]));
      }).flat());
      return {id, outline, depth:project(c)[2]};
    }).sort((a,b) => b.depth-a.depth);
    svg.innerHTML = shell + organelles.map(({id,outline}) => `<polygon data-part="${id}" points="${points(outline)}" fill="${parts[id][2]}" fill-opacity="${id === selected ? .98 : .7}" stroke="#25203e" stroke-width="${id === selected ? 3 : 1}"/>`).join('');
    $('cellFact').textContent = `${parts[selected][0]} — ${parts[selected][1]}`;
  }
  function typeChanged() {
    const cell = $('cellType').value;
    $('part').innerHTML = [...new Set(['membrane',...(cell === 'plant' ? ['wall'] : []),...bodies[cell].map(p => p[0])])].map(id => `<option value="${id}">${parts[id][0]}</option>`).join('');
    $('part').value = 'nucleus'; draw();
  }
  function rotate(x,y) { yaw += x; pitch = Math.max(-1.56,Math.min(1.56,pitch+y)); draw(); }
  $('cellType').onchange = typeChanged;
  $('part').onchange = draw;
  $('left').onclick = () => rotate(-.2,0);
  $('right').onclick = () => rotate(.2,0);
  $('resetView').onclick = () => { yaw = .65; pitch = .36; draw(); };
  svg.onkeydown = e => {
    const step = {ArrowLeft:[-.15,0],ArrowRight:[.15,0],ArrowUp:[0,.15],ArrowDown:[0,-.15]}[e.key];
    if (step) { e.preventDefault(); rotate(...step); }
  };
  svg.onpointerdown = e => { if (drag || e.button !== 0) return; drag = e; svg.setPointerCapture(e.pointerId); };
  svg.onpointermove = e => { if (drag?.pointerId !== e.pointerId) return; rotate((e.clientX-drag.clientX)*.012,(e.clientY-drag.clientY)*.012); drag = e; };
  svg.onlostpointercapture = () => { drag = null; };
  $('checkCell').onclick = () => {
    const guess = $('cellAnswer').value;
    $('cellFeedback').textContent = guess === 'Chloroplast' ? 'Correct! Compare the plant and animal structures to see where chloroplasts appear.' : guess ? 'Not yet. Try highlighting the structures in the leaf cell.' : 'Choose an answer first.';
  };
  typeChanged();
})();
