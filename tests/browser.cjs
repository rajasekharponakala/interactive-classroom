// Run with Playwright installed (npm install --no-save playwright; npx playwright install chromium).
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

const root = path.resolve(__dirname, '..');
const data = { window: {} };
for (const file of ['sims', 'syllabus', 'classroom-activities']) vm.runInNewContext(fs.readFileSync(path.join(root, 'js', file + '.js'), 'utf8'), data);
const { LABS, BOARDS, PHET_SIMS, CLASSROOM_ACTIVITIES } = data.window;
const spatial = ['solids', 'pyramid', 'solar-system', 'cell'];
let chapters = 0, gaps = 0;
const mapped = new Set();
for (const board of Object.values(BOARDS)) for (const subjects of Object.values(board.classes)) for (const list of Object.values(subjects)) {
  for (const [title, ids] of list) {
    chapters++;
    if (!ids) gaps++;
    for (const id of ids.split(/\s+/).filter(Boolean)) {
      assert.ok(id.startsWith('@') ? LABS[id.slice(1)] : PHET_SIMS[id], `${title}: unknown ${id}`);
      mapped.add(id);
    }
  }
}
for (const lab of Object.values(LABS)) assert.ok(fs.existsSync(path.join(root, lab.file)), lab.file);
for (const id of spatial) assert.ok(mapped.has('@' + id), `${id} must appear in the syllabus`);
console.log(`Catalog: ${chapters} chapters, ${gaps} without a mapped simulation, ${Object.keys(LABS).length} local lab files`);
const scienceGaps = Object.values(BOARDS).flatMap(b => [6,7].flatMap(c => b.classes[c].sci.filter(([,ids]) => !ids)));
for (const [title] of scienceGaps) assert.ok(CLASSROOM_ACTIVITIES[title]?.length, title);
const supplemented = Object.values(BOARDS).flatMap(b => [6,7].flatMap(c => b.classes[c].sci)).filter(([title]) => CLASSROOM_ACTIVITIES[title]).length;
console.log(`Activities: ${supplemented} Class 6–7 science chapter entries, including all ${scienceGaps.length} without simulations`);

vm.runInNewContext(fs.readFileSync(path.join(root, 'labs/3d.js'), 'utf8'), data);
const { cubeNet } = data.window.G3;
const key = p => p.map(v => Math.round(v * 1e6)).join(',');
for (const position of [0, .25, .5, .75, 1]) {
  const faces = cubeNet(position);
  assert.equal(faces.length, 6);
  for (const face of faces) for (const [i, p] of face.entries()) {
    const q = face[(i+1)%4];
    assert.ok(Math.abs(Math.hypot(...p.map((v,j) => v-q[j]))-2) < 1e-9);
  }
  assert.equal(key(faces[1][2]), key(faces[5][1]), 'the lid must stay hinged to the north wall');
}
assert.equal(new Set(cubeNet(1).flat().map(key)).size, 8, 'closed net must have eight distinct corners');
console.log('Cube net: rigid faces and a connected lid throughout folding; eight closed corners');

(async () => {
  const server = spawn('python3', ['-u','-m','http.server','0','--bind','127.0.0.1'], {cwd:root});
  let browser;
  try {
    const [message] = await once(server.stdout, 'data');
    const base = 'http://127.0.0.1:' + message.toString().match(/port (\d+)/)[1];
    browser = await chromium.launch();
    for (const width of [320, 1200]) {
      const page = await browser.newPage({viewport:{width,height:800}, reducedMotion:'reduce', hasTouch:width === 320});
      page.setDefaultTimeout(5000);
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.route('**/*', r => r.request().url().startsWith(base + '/') ? r.continue() : r.abort());
      for (const [id, lab] of Object.entries(LABS)) {
        if (spatial.includes(id)) continue;
        const response = await page.goto(`${base}/${lab.file}`);
        assert.ok(response.ok(), lab.file);
        await page.locator('.quiz-question').waitFor({state:'visible'});
        assert.deepEqual(errors, [], lab.file);
      }
      const pick = async (index, label) => {
        const input = page.locator('#choices select').nth(index);
        if (width === 320) { await input.selectOption({label}); return; }
        const labels = await input.locator('option').allTextContents();
        const offset = labels.indexOf(label);
        assert.ok(offset > 0, label);
        await input.press('Home');
        for (let i=0; i<offset; i++) await input.press('ArrowDown');
        assert.equal(await input.locator('option:checked').innerText(), label);
      };
      const action = async text => {
        const b = page.locator('#choices').getByRole('button',{name:text,exact:true});
        if (width === 320) await b.tap(); else await b.press('Enter');
      };
      const match = async (source,target) => { await pick(0,source); await pick(1,target); await action('Place'); };
      const status = page.locator('#choices [role=status]');
      for (const [id, pairs, wrong, result] of [
        ['habitat',[['Sambar deer','Forest'],['Desert fox','Desert'],['Pond snail','Pond'],['Blue whale','Ocean']],'Ocean', /All four/],
        ['animal-food',[['Grass','Cow'],['Mouse','Barn owl'],['Seeds','Sparrow'],['Insects','Garden spider']],'Barn owl',/All four/],
        ['life-cycles',[['Egg','Slot 1'],['Caterpillar','Slot 2'],['Chrysalis','Slot 3'],['Adult','Slot 4']],'Slot 2',/right order/],
      ]) {
        await page.goto(`${base}/${LABS[id].file}`);
        if (id === 'life-cycles') await page.getByRole('button',{name:'Butterfly',exact:true}).press('Enter');
        await match(pairs[0][0],wrong);
        assert.match(await status.innerText(), /Not quite/);
        for (const pair of pairs) await match(...pair);
        assert.match(await status.innerText(), result);
        await action('Undo last'); assert.match(await status.innerText(), /Removed/);
        await match(...pairs.at(-1)); assert.match(await status.innerText(), result);
        await action('Start over'); assert.equal(await page.locator('#choices select').first().inputValue(),'');
      }
      await page.goto(`${base}/${LABS.fractions.file}`);
      await pick(0,'½ (8)'); await action('Add piece'); assert.match(await status.innerText(), /exactly/);
      await pick(0,'¼ (4)'); await action('Add piece'); assert.match(await status.innerText(), /beyond the target/);
      await action('Undo last'); assert.match(await status.innerText(), /exactly/);
      await action('Start over'); assert.equal(await page.locator('#fillShow').innerText(),'0 of 16');
      await pick(0,'¼ (4)'); await action('Add piece'); await action('Add piece');
      assert.match(await status.innerText(), /exactly/);
      await page.goto(`${base}/#board=ts&class=10&subject=math`);
      await page.locator('#chapters [data-sim="@circles"]').click();
      const circle = page.frameLocator('#simFrame');
      await circle.locator('#arc').press('End');
      assert.match(await circle.locator('#measurements').innerText(), /180°.*90°/);
      const diagramBefore = await circle.locator('#marks').innerHTML();
      await circle.locator('#position').press('Home');
      assert.notEqual(await circle.locator('#marks').innerHTML(), diagramBefore);
      assert.match(await circle.locator('#measurements').innerText(), /180°.*90°/);
      await circle.locator('#mode').selectOption('tangent');
      await circle.locator('#distance').press('End');
      assert.match(await circle.locator('#measurements').innerText(), /PA = 4\.58 units; PB = 4\.58 units.*90°/);
      assert.match(await circle.locator('#measurements').innerText(), /PN × PF = 3\.0 × 7\.0 = 21\.00 square units; PA² = 21\.00/);
      await circle.locator('#resetCircle').click();
      assert.match(await circle.locator('#measurements').innerText(), /PA = 2\.87 units; PB = 2\.87 units/);
      assert.match(await circle.locator('#measurements').innerText(), /PN × PF = 1\.5 × 5\.5 = 8\.25 square units; PA² = 8\.25/);
      await page.locator('#closeBtn').click();
      await page.goto(`${base}/#board=ts&class=7&subject=math`);
      await page.locator('#chapters [data-sim="@constructions"]').click();
      const construction = page.frameLocator('#simFrame');
      for (let i=0; i<3; i++) await construction.locator('#next').press('Enter');
      assert.match(await construction.locator('#result').innerText(), /AM = MB = 3 cm.*90°/);
      await construction.locator('#radiusA').fill('3');
      assert.match(await construction.locator('#result').innerText(), /touch at one point/);
      await construction.locator('#radiusA').press('Home');
      assert.match(await construction.locator('#result').innerText(), /do not meet/);
      await construction.locator('#reset').click();
      assert.match(await construction.locator('#instructions').innerText(), /Step 1 of 4/);
      await construction.locator('#construction').selectOption('triangle');
      for (let i=0; i<3; i++) await construction.locator('#next').press('Enter');
      assert.match(await construction.locator('#result').innerText(), /AB = 6 cm, AC = 4 cm, BC = 5 cm/);
      await construction.locator('#radiusA').fill('2');
      await construction.locator('#radiusB').fill('4');
      assert.match(await construction.locator('#result').innerText(), /touch at one point/);
      await construction.locator('#radiusB').fill('3');
      assert.match(await construction.locator('#result').innerText(), /do not meet/);
      await construction.locator('#back').press('Enter');
      assert.match(await construction.locator('#instructions').innerText(), /Step 3 of 4/);
      await page.locator('#closeBtn').click();
      await page.goto(base + '/#board=ts&class=6&subject=sci');
      assert.match(await page.locator('#gaps').innerText(), /Trace the ingredients/);
      assert.doesNotMatch(await page.locator('#gaps').innerText(), /Sorting by color/);
      const habitat = page.locator('#chapters .chapter').filter({has: page.getByRole('heading',{name:'Habitat',exact:true})});
      assert.equal(await habitat.locator('[data-sim="@habitat"]').count(),1);
      await habitat.locator('summary').press('Enter');
      assert.match(await habitat.innerText(),/Compare two places/);
      await page.goto(base + '/#board=ts&class=10&subject=bio');
      assert.match(await page.locator('#gaps').innerText(), /No vetted activity yet/);
      await page.goto(base + '/#board=ts&class=6&subject=math');
      assert.ok(await page.locator('#timelineList li').count());
      assert.ok(await page.locator('#progStats .stat').count());
      for (const id of spatial) assert.equal(await page.locator(`#labGrid [data-sim="@${id}"]`).count(), 1);
      await page.getByRole('button', {name:'3D challenges',exact:true}).press('Enter');
      assert.equal(await page.locator('#labGrid [data-sim]').count(), spatial.length);
      assert.equal(await page.evaluate(() => document.activeElement.textContent), '3D challenges');
      await page.getByRole('button', {name:'All labs',exact:true}).click();
      assert.equal(await page.locator('#labGrid [data-sim]').count(), Object.keys(LABS).length);
      await page.locator('#chapters [data-sim="@solids"]').first().click();
      const lab = page.frameLocator('#simFrame');
      await lab.locator('#shape').selectOption('Cuboid');
      await lab.locator('#length').press('End');
      assert.match(await lab.locator('#modelData').innerText(), /Surface area 32.00 square units · Volume 12.00/);
      await lab.locator('#slice').check();
      const section = lab.locator('#sectionPlane');
      const middle = await section.getAttribute('points');
      await lab.locator('#sliceHeight').press('End');
      assert.notEqual(await section.getAttribute('points'), middle);
      assert.match(await lab.locator('#modelData').innerText(), /rectangle, 6.00 square units/);
      await lab.locator('#slice').uncheck();
      await lab.locator('#shape').selectOption('Octahedron');
      assert.match(await lab.locator('#modelData').innerText(), /6 vertices · 12 edges · 8 faces/);
      const svg = lab.locator('svg');
      const initial = await svg.innerHTML();
      await svg.press('ArrowLeft');
      assert.notEqual(await svg.innerHTML(), initial);
      await lab.getByRole('button', {name:'Top',exact:true}).click();
      await lab.locator('#wire').check();
      assert.equal(await svg.locator('polyline').count(), 12);
      await lab.locator('#choice').selectOption({label:'8'});
      await lab.getByRole('button', {name:'Check',exact:true}).click();
      assert.match(await lab.locator('#feedback').innerText(), /Not yet/);
      await lab.locator('#choice').selectOption({label:'12'});
      await lab.getByRole('button', {name:'Check',exact:true}).click();
      assert.match(await lab.locator('#feedback').innerText(), /Correct/);
      await lab.locator('#net').check();
      assert.match(await lab.locator('#modelData').innerText(), /Flat net/);
      const flat = await svg.innerHTML();
      await lab.locator('#fold').press('End');
      assert.match(await lab.locator('#modelData').innerText(), /Closed cube/);
      assert.notEqual(await svg.innerHTML(), flat);
      await lab.locator('#net').uncheck();
      assert.match(await lab.locator('#modelData').innerText(), /12 edges/);
      await page.locator('#closeBtn').click();
      for (const [id, dataPattern] of [['pyramid',/Volume 2.67/], ['solar-system',/88 Earth days/]]) {
        await page.goto(`${base}/${LABS[id].file}`);
        assert.match(await page.locator('#modelData').innerText(), dataPattern);
        if (id === 'pyramid') {
          await page.locator('#height').press('End');
          assert.match(await page.locator('#modelData').innerText(), /Volume 4.00/);
          await page.locator('#checkBuild').click();
          assert.match(await page.locator('#buildFeedback').innerText(), /Too large/);
          for (const [height, feedback] of [['1.5', /Target reached/], ['2.4', /Target reached/], ['3', /All three targets reached/]]) {
            await page.locator('#height').fill(height);
            await page.locator('#checkBuild').click();
            assert.match(await page.locator('#buildFeedback').innerText(), feedback);
            await page.locator('#nextBuild').click();
          }
          assert.match(await page.locator('#targetVolume').innerText(), /Round 1 of 3/);
        } else {
          await page.getByRole('button', {name:'+30 days',exact:true}).click();
          assert.equal(await page.locator('#day').innerText(), 'Day 30');
          await page.locator('#planet').selectOption('Mars');
          assert.match(await page.locator('#modelData').innerText(), /687 Earth days/);
          await page.locator('#play').click();
          await page.waitForFunction(() => document.querySelector('#day').textContent !== 'Day 30');
          await page.locator('#play').click();
          await page.locator('#rewind').click();
          assert.equal(await page.locator('#day').innerText(), 'Day 0');
        }
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
      await page.goto(`${base}/#board=ts&class=8&subject=bio`);
      await page.locator('#chapters [data-sim="@cell"]').click();
      await lab.locator('#part').selectOption('chloroplast');
      assert.match(await lab.locator('#cellFact').innerText(), /photosynthesis/);
      const cellSvg = lab.locator('svg'), plantView = await cellSvg.innerHTML();
      await cellSvg.press('ArrowUp');
      assert.notEqual(await cellSvg.innerHTML(), plantView);
      await lab.locator('#cellType').selectOption('animal');
      assert.equal(await lab.locator('#part option[value="chloroplast"]').count(), 0);
      assert.equal(await lab.locator('#part option[value="wall"]').count(), 0);
      await lab.locator('#cellAnswer').selectOption('Chloroplast');
      await lab.locator('#checkCell').click();
      assert.match(await lab.locator('#cellFeedback').innerText(), /Correct/);
      assert.ok(await lab.locator('body').evaluate(el => el.ownerDocument.documentElement.scrollWidth <= el.ownerDocument.defaultView.innerWidth));
      assert.deepEqual(errors, []);
      console.log(`Chromium ${width}px: all ${Object.keys(LABS).length} labs load; ${width === 320 ? 'touch controls' : 'keyboard controls'}, retries, undo/reset, curriculum display, geometry and 3D challenges pass`);
      await page.close();
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
