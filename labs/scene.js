(() => {
  const root = document.querySelector('#sceneLab');
  const mode = document.body.dataset.lab;
  const solar = mode === 'solar-system', pyramid = mode === 'pyramid';
  const planets = [
    ['Mercury', 88, 1.2, 7, '#d2c1ae'], ['Venus', 225, 2, 3.4, '#ffd48b'],
    ['Earth', 365.25, 2.9, 0, '#6acbff'], ['Mars', 687, 3.9, 1.85, '#ff9274'],
  ];
  const title = solar ? '3D Inner Solar System' : pyramid ? '3D Pyramid Lab' : '3D Solids Lab';
  const options = (list) => list.map(v => `<option>${v}</option>`).join('');
  const prompt = solar ? 'Which planet completes an orbit in the fewest days?' : pyramid ? 'If the height doubles and the base stays fixed, what happens to volume?' : 'How many edges does an octahedron have?';
  const choices = solar ? planets.map(p => p[0]) : pyramid ? ['Halves', 'Stays the same', 'Doubles'] : ['8', '12', '16'];
  const answer = solar ? 0 : pyramid ? 2 : 1;
  root.innerHTML = `<h1 class="scene-title">${title}</h1><div class="scene-grid">
    <section class="scene-view${solar ? ' space' : ''}" aria-label="Model and camera">
      <svg viewBox="0 0 480 340" tabindex="0" role="img" aria-label="${title}. Drag or use arrow keys to rotate."></svg>
      <div class="scene-buttons"><button class="btn" data-view="left" aria-label="Rotate left">←</button><button class="btn" data-view="right" aria-label="Rotate right">→</button>
      <button class="btn" data-view="front">Front</button><button class="btn" data-view="top">Top</button><button class="btn" data-view="reset">Reset view</button></div>
    </section><section class="scene-panel" aria-label="Investigation">
      <h2>Explore</h2>
      ${solar ? `<label for="planet">Focus planet</label><select id="planet">${options(planets.map(p => p[0]))}</select>
        <div class="scene-buttons"><button class="btn primary" id="play">Play</button><button class="btn" id="step">+30 days</button><button class="btn" id="rewind">Day 0</button></div>
        <p id="day">Day 0</p><p>Sizes and distances are not to scale. Circular paths and starting positions are simplified; inclinations are relative to Earth’s orbital plane. One playback second represents 60 days.</p>` : pyramid ?
        '<label for="height">Perpendicular height <output id="heightValue" for="height">2.0</output> units</label><input id="height" type="range" min="1" max="3" step="0.1" value="2">' :
        `<label for="shape">Solid</label><select id="shape">${options(Object.keys(G3.solids))}</select><label><input id="wire" type="checkbox"> Show hidden edges</label>
        <fieldset id="dimensions"><legend>Measure the box</legend><label for="length">Length <output id="lengthValue" for="length">2.0</output> units</label><input id="length" type="range" min="1" max="3" step="0.1" value="2"><p>For a cuboid, the width and height are fixed at 2 units. For a cube, all sides change together.</p>
        <label><input id="slice" type="checkbox"> Show a horizontal cross-section</label><div id="sliceControls" hidden><label for="sliceHeight">Slice height <output id="sliceValue" for="sliceHeight"></output> from base</label><input id="sliceHeight" type="range" min="0" max="100" value="50"><p>Move the slice. Does its area change when it moves up?</p></div></fieldset>
        <label><input id="net" type="checkbox"> Explore a cube net</label><div id="foldControls" hidden><label for="fold">Fold the net <output id="foldValue" for="fold">0%</output></label><input id="fold" type="range" min="0" max="100" value="0"><p>Start flat, then fold. Which square becomes the lid? Use Top to see the flat net clearly.</p></div>`}
      <p id="modelData"></p>
      <fieldset id="challenge"><legend>Quick challenge</legend><label for="choice">${prompt}</label><select id="choice"><option value="">Pick an answer</option>${choices.map((v,i) => `<option value="${i}">${v}</option>`).join('')}</select>
      <button class="btn primary" id="check">Check</button><p id="feedback" role="status"></p></fieldset>
      ${pyramid ? '<fieldset><legend>Build to target</legend><p id="targetVolume"></p><div class="scene-buttons"><button class="btn primary" id="checkBuild" type="button">Check build</button><button class="btn" id="nextBuild" type="button" hidden>Next round</button></div><p id="buildFeedback" role="status"></p></fieldset>' : ''}
    </section></div>`;
  const $ = id => document.getElementById(id), svg = root.querySelector('svg');
  let yaw = .65, pitch = .48, orthographic = false, day = 0, animation = null, last = null, drag;
  const lengths = { Cube: 2, Cuboid: 2.8 };
  const point = p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  const fills = ['#a9d7fd','#a5e4d5','#ffcb8f','#fcb8d2','#c2afff','#ffe2a7','#8ed9f4','#b6e998'];
  const paint = (faces) => faces.map((points,i) => ({points,i,z:points.reduce((z,p) => z+p[2],0)/points.length}))
    .sort((a,b) => b.z-a.z).map(({points,i}) => `<polygon points="${points.map(point).join(' ')}" fill="${fills[i]}" stroke="#29254a" stroke-width="2" stroke-linejoin="round"/>`).join('');
  const line = (p,q,color,dash='') => `<polyline points="${point(p)} ${point(q)}" fill="none" stroke="${color}" stroke-width="2" ${dash}/>`;
  const orbit = (p, angle) => {
    const i = p[3] * Math.PI/180, y = p[2]*Math.sin(angle);
    return [p[2]*Math.cos(angle), y*Math.sin(i), y*Math.cos(i)];
  };
  function draw() {
    if ($('net')?.checked) {
      const fold = +$('fold').value;
      const view = G3.camera(yaw,pitch,16,520,orthographic);
      svg.innerHTML = paint(G3.cubeNet(fold/100).map(face => face.map(([x,y,z]) => view([x,y,z+1]))));
      $('foldValue').textContent = `${fold}%`;
      $('modelData').textContent = fold === 0 ? 'Flat net: six connected squares.' : fold === 100 ? 'Closed cube: six square faces.' : 'The four walls and lid rotate around their shared edges.';
      return;
    }
    const project = G3.camera(yaw, pitch, solar ? 14 : 7, solar ? 430 : 490, orthographic);
    if (solar) {
      const selected = $('planet').selectedIndex;
      svg.innerHTML = planets.map((p,i) => {
        const points = Array.from({length: 73}, (_,j) => point(project(orbit(p,j*Math.PI/36))));
        return `<polyline fill="none" stroke="${i === selected ? '#fff1ac' : '#63769d'}" points="${points.join(' ')}"/>`;
      }).join('') + [[project([0,0,0]), '#ffd25a', 17, 'Sun'], ...planets.map((p,i) =>
        [project(orbit(p, i*1.75 + day/p[1]*2*Math.PI)), p[4], i === selected ? 8 : 5, p[0]])]
        .sort((a,b) => b[0][2]-a[0][2]).map(([p,color,r,name]) => `<circle cx="${p[0]}" cy="${p[1]}" r="${r*p[3]/30}" fill="${color}"/><text x="${p[0]+10}" y="${p[1]-9}" fill="#fff" font-size="13">${name}</text>`).join('');
      $('day').textContent = `Day ${Math.floor(day)}`;
      $('modelData').textContent = `${planets[selected][0]} · ${planets[selected][1]} Earth days per orbit · ${planets[selected][3]}° inclination`;
      return;
    }
    const h = pyramid ? +$('height').value : 0;
    const shape = $('shape')?.value, isBox = shape === 'Cube' || shape === 'Cuboid';
    const length = isBox ? +$('length').value : 0, side = shape === 'Cube' ? length : 2;
    const model = pyramid ? G3.pyramid(h) : isBox ? G3.box(length/2, side/2, side/2) : G3.solids[shape];
    const points = model.vertices.map(project), edges = G3.edges(model);
    const showSlice = isBox && $('slice').checked;
    const outline = () => edges.map(([a,b]) => line(points[a],points[b],'var(--ink)')).join('');
    svg.innerHTML = showSlice || $('wire')?.checked ? outline() : paint(model.faces.map(f => f.map(i => points[i])));
    $('modelData').textContent = `${points.length} vertices · ${edges.length} edges · ${model.faces.length} faces`;
    if (!pyramid) $('dimensions').hidden = !isBox;
    if (isBox) {
      $('lengthValue').textContent = length.toFixed(1);
      $('modelData').textContent += ` · Surface area ${(2*(2*length*side+side*side)).toFixed(2)} square units · Volume ${(length*side*side).toFixed(2)} cubic units.`;
      $('sliceControls').hidden = !showSlice;
      $('wire').disabled = showSlice;
      if (showSlice) {
        const height = side * +$('sliceHeight').value / 100;
        const y = height-side/2, x = length/2, z = side/2;
        const section = [[-x,y,-z],[x,y,-z],[x,y,z],[-x,y,z]].map(project);
        svg.innerHTML += `<polygon id="sectionPlane" points="${section.map(point).join(' ')}" fill="#ffca50" fill-opacity=".78" stroke="#78361a" stroke-width="3"/>`;
        $('sliceValue').textContent = `${height.toFixed(2)} units`;
        $('modelData').textContent += ` Horizontal cross-section: ${length === side ? 'square' : 'rectangle'}, ${(length*side).toFixed(2)} square units.`;
      }
    }
    if (!pyramid && !isBox) $('wire').disabled = false;
    if (pyramid) {
      svg.innerHTML += line(points[4],project([0,-h/2,0]),'#4c2187','stroke-dasharray="5 4"');
      $('heightValue').textContent = h.toFixed(1);
      $('modelData').textContent += ` · Base area 4 square units · Volume ${(4*h/3).toFixed(2)} cubic units. The dashed line shows perpendicular height.`;
    }
  }
  function rotate(dx,dy) { orthographic = false; yaw += dx; pitch = Math.max(-Math.PI/2,Math.min(Math.PI/2,pitch+dy)); draw(); }
  root.querySelectorAll('[data-view]').forEach(b => b.onclick = () => {
    const v = b.dataset.view;
    if (v === 'left' || v === 'right') return rotate(v === 'left' ? -.2 : .2,0);
    orthographic = v !== 'reset';
    yaw = v === 'reset' ? .65 : 0; pitch = v === 'reset' ? .48 : v === 'top' ? Math.PI/2 : 0; draw();
  });
  svg.addEventListener('keydown', e => {
    const step = {ArrowLeft:[-.15,0],ArrowRight:[.15,0],ArrowUp:[0,.15],ArrowDown:[0,-.15]}[e.key];
    if (step) { e.preventDefault(); rotate(...step); }
  });
  svg.onpointerdown = e => { if (drag || e.button !== 0) return; drag = e; svg.setPointerCapture(e.pointerId); };
  svg.onpointermove = e => { if (drag?.pointerId !== e.pointerId) return; rotate((e.clientX-drag.clientX)*.012,(e.clientY-drag.clientY)*.012); drag = e; };
  svg.onlostpointercapture = () => { drag = null; };
  root.querySelectorAll('#wire,#planet,#height,#fold,#slice,#sliceHeight').forEach(el => el.addEventListener('input',draw));
  if ($('shape')) {
    $('shape').addEventListener('input', () => { $('length').value = lengths[$('shape').value] ?? 2; draw(); });
    $('length').addEventListener('input', () => { lengths[$('shape').value] = +$('length').value; draw(); });
    $('net').addEventListener('input', () => {
      const on = $('net').checked;
      $('shape').disabled = $('wire').disabled = on;
      $('dimensions').hidden = on;
      $('foldControls').hidden = !on;
      $('challenge').hidden = on;
      if (on) { yaw = 0; pitch = Math.PI/2; orthographic = true; }
      else { yaw = .65; pitch = .48; orthographic = false; }
      draw();
    });
  }
  $('check').onclick = () => {
    const value = $('choice').value;
    $('feedback').textContent = value === '' ? 'Choose an answer first.' : +value === answer ? 'Correct! Now explain how the model supports your answer.' : 'Not yet. Explore the model and try again.';
  };
  if (pyramid) {
    const targets = [20,32,40]; // volume in tenths of a cubic unit
    let round = 0, solved = false;
    function startRound() {
      $('targetVolume').textContent = `Round ${round+1} of ${targets.length}: adjust the pyramid to ${(targets[round]/10).toFixed(1)} cubic units.`;
      $('buildFeedback').textContent = '';
      $('nextBuild').hidden = true;
      solved = false;
    }
    $('checkBuild').onclick = () => {
      const error = 4 * +$('height').value / 3 - targets[round]/10;
      if (solved) return;
      if (Math.abs(error) > .001) {
        $('buildFeedback').textContent = error < 0 ? 'Too small. Try raising the apex.' : 'Too large. Try lowering the apex.';
        return;
      }
      solved = true;
      $('buildFeedback').textContent = round === targets.length-1 ? 'All three targets reached!' : 'Target reached!';
      $('nextBuild').textContent = round === targets.length-1 ? 'Play again' : 'Next round';
      $('nextBuild').hidden = false;
    };
    $('nextBuild').onclick = () => { round = (round+1)%targets.length; startRound(); $('height').focus(); };
    startRound();
  }
  if (solar) {
    function tick(now) {
      if (last !== null) day += Math.min(100,now-last)*.06;
      last = now; draw(); animation = requestAnimationFrame(tick);
    }
    $('play').onclick = () => {
      if (animation === null) { animation = requestAnimationFrame(tick); $('play').textContent = 'Pause'; }
      else { cancelAnimationFrame(animation); animation = last = null; $('play').textContent = 'Play'; }
    };
    $('step').onclick = () => { day += 30; draw(); };
    $('rewind').onclick = () => { day = 0; draw(); };
  }
  draw();
})();
