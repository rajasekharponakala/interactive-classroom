(function () {
  "use strict";
  const SIMS = window.PHET_SIMS, BOARDS = window.BOARDS, SUBJECTS = window.SUBJECTS, LABS = window.LABS;
  const TIPS = window.SIM_TIPS, DOMAIN = window.SIM_DOMAIN;
  const PHET = "https://phet.colorado.edu";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const simsOf = (ch) => (ch[1] ? ch[1].split(" ") : []);
  const isOwn = (id) => id[0] === "@";
  const title = (id) => (isOwn(id) ? LABS[id.slice(1)].t : SIMS[id] ? SIMS[id].t : "");
  const theme = () => document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const swap = (fn) => (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches ? document.startViewTransition(fn) : fn());

  // Small drawings for our own labs.
  const ART = {
    "ohms-law": '<svg viewBox="0 0 120 72" aria-hidden="true"><rect x="14" y="14" width="92" height="44" rx="10" fill="none" stroke="var(--ink)" stroke-width="4"/><rect x="42" y="5" width="36" height="18" rx="6" fill="var(--sun)" stroke="var(--ink)" stroke-width="3"/><path d="M48 14l4-5 5 10 5-10 5 10 5-10" fill="none" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/><circle cx="106" cy="36" r="11" fill="var(--sun)" stroke="var(--ink)" stroke-width="3"/><rect x="5" y="24" width="18" height="24" rx="5" fill="var(--teal)" stroke="var(--ink)" stroke-width="3"/><circle cx="60" cy="58" r="4" fill="var(--sky)"/><circle cx="36" cy="58" r="4" fill="var(--sky)"/><circle cx="84" cy="58" r="4" fill="var(--sky)"/></svg>',
    "lens-mirror": '<svg viewBox="0 0 120 72" aria-hidden="true"><path d="M4 40h112" stroke="var(--ink-3)" stroke-width="2"/><path d="M60 8q14 32 0 60q-14-28 0-60z" fill="var(--teal-soft)" stroke="var(--ink)" stroke-width="3.5" stroke-linejoin="round"/><path d="M20 20H60L104 58M20 20L104 58" fill="none" stroke="var(--coral)" stroke-width="3" stroke-linecap="round"/><path d="M20 40V20m-6 7 6-8 6 8" fill="none" stroke="var(--ink)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M104 40v18m-5-6 5 7 5-7" fill="none" stroke="var(--leaf)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "pendulum": '<svg viewBox="0 0 120 72" aria-hidden="true"><rect x="36" y="4" width="48" height="7" rx="3.5" fill="var(--ink)"/><path d="M60 10 34 52" stroke="var(--ink)" stroke-width="3"/><path d="M60 10v46M60 10l26 42" stroke="var(--ink-3)" stroke-width="2" stroke-dasharray="4 5"/><circle cx="32" cy="55" r="12" fill="var(--coral)" stroke="var(--ink)" stroke-width="3.5"/></svg>',
    "triangle": '<svg viewBox="0 0 120 72" aria-hidden="true"><path d="M60 8 14 64h92z" fill="var(--violet-soft)" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round"/><path d="M60 8l-9 11a14 14 0 0 0 18 0z" fill="var(--coral)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 64h16a16 16 0 0 0-6-12z" fill="var(--sky)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/><path d="M106 64H90a16 16 0 0 1 6-12z" fill="var(--leaf)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/></svg>',
  };

  // ---------- state, kept in the URL hash so a view can be shared ----------
  const state = { board: "ts", cls: "10", subj: "phy", q: "" };
  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    if (BOARDS[p.get("board")]) state.board = p.get("board");
    if (BOARDS[state.board].classes[p.get("class")]) state.cls = p.get("class");
    const subs = BOARDS[state.board].classes[state.cls];
    if (subs[p.get("subject")]) state.subj = p.get("subject");
    if (!subs[state.subj]) state.subj = Object.keys(subs)[0];
  }
  const writeHash = () => history.replaceState(null, "", "#board=" + state.board + "&class=" + state.cls + "&subject=" + state.subj);

  // ---------- coverage ----------
  const count = (chapters) => ({ total: chapters.length, covered: chapters.filter((c) => c[1]).length });
  function boardChapters(b, filter) {
    const out = [];
    for (const [cls, subs] of Object.entries(BOARDS[b].classes))
      for (const [s, chs] of Object.entries(subs))
        if (!filter || filter(cls, s)) chs.forEach((c, i) => out.push({ cls, s, i, c }));
    return out;
  }
  const bin = (p) => (p === 0 ? 0 : p < 20 ? 1 : p < 40 ? 2 : p < 60 ? 3 : p < 80 ? 4 : 5);

  function pills(id, items, current, onPick, attr) {
    const el = $(id);
    el.innerHTML = items.map((it) => '<button type="button" class="pill" data-v="' + it[0] + '"' + (attr ? " " + attr + '="' + it[0] + '"' : "") + ' aria-pressed="' + (it[0] === current) + '">' + esc(it[1]) + "</button>").join("");
    el.onclick = (e) => { const b = e.target.closest("button"); if (b) onPick(b.dataset.v); };
  }

  // ---------- hero ----------
  function renderHero() {
    const B = BOARDS[state.board], all = boardChapters(state.board), used = new Set();
    all.forEach((x) => simsOf(x.c).forEach((s) => used.add(s)));
    $("heroBoard").textContent = B.name;
    const n = count(all.map((x) => x.c));
    $("stats").innerHTML = [[n.total, "chapters"], [n.covered, "with a simulation"], [used.size, "simulations"]]
      .map((t) => '<div class="stat"><b>' + t[0] + "</b><span>" + t[1] + "</span></div>").join("");
  }
  function heroLab() { $("heroLab").src = "labs/pendulum.html?mini=1&theme=" + theme(); }

  // ---------- own labs ----------
  function renderLabs() {
    $("labGrid").innerHTML = Object.entries(LABS).map(([id, L]) =>
      '<button type="button" class="lab-card" data-color="' + L.color + '" data-sim="@' + id + '"><span class="lab-art"><span class="made">Made here</span>' + ART[id] +
      '</span><span class="lab-body"><h3>' + esc(L.t) + "</h3><p>" + esc(L.blurb) + '</p><span class="lab-go">Play →</span></span></button>').join("");
  }

  // ---------- class + subject pickers ----------
  function renderPickers() {
    const B = BOARDS[state.board];
    pills("boardSeg", Object.keys(BOARDS).map((k) => [k, BOARDS[k].name]), state.board, (v) => {
      state.board = v;
      if (!BOARDS[v].classes[state.cls][state.subj]) state.subj = Object.keys(BOARDS[v].classes[state.cls])[0];
      swap(update);
    });
    $("classRow").innerHTML = Object.keys(B.classes).map((c) => {
      const n = Object.values(B.classes[c]).reduce((a, chs) => a + new Set(chs.flatMap(simsOf)).size, 0);
      return '<button type="button" class="class-tile" data-v="' + c + '" aria-pressed="' + (c === state.cls) + '"><small>Class</small><b>' + c + "</b><span>" + n + " simulations</span></button>";
    }).join("");
    $("classRow").onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      state.cls = b.dataset.v; state.q = ""; $("q").value = "";
      const subs = B.classes[state.cls];
      if (!subs[state.subj]) state.subj = Object.keys(subs)[0];
      swap(update);
    };
    pills("subjSeg", Object.keys(B.classes[state.cls]).map((k) => [k, SUBJECTS[k].name]), state.subj, (v) => { state.subj = v; state.q = ""; $("q").value = ""; swap(update); }, "data-subj");
  }

  // ---------- chapters ----------
  function hl(text, q) {
    if (!q) return esc(text);
    const i = text.toLowerCase().indexOf(q);
    return i < 0 ? esc(text) : esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
  }
  function simTile(id, ctx, q) {
    if (isOwn(id)) {
      const k = id.slice(1), L = LABS[k];
      return '<button type="button" class="sim own" data-color="' + L.color + '" data-sim="' + id + '" data-ctx="' + esc(ctx) + '"><span class="thumb"><span class="made">Made here</span>' + ART[k] +
        '</span><span class="sim-body"><span class="sim-name">' + hl(L.t, q) + '</span><span class="sim-tags"><span class="tagc">' + L.domain + "</span></span></span></button>";
    }
    const S = SIMS[id];
    if (!S) return "";
    return '<button type="button" class="sim" data-sim="' + id + '" data-ctx="' + esc(ctx) + '"><span class="thumb"><span class="ph">' + esc(S.t) + '</span><img loading="lazy" alt="" src="' +
      PHET + "/sims/html/" + id + "/latest/" + id + '-600.png" onerror="this.remove()"></span><span class="sim-body"><span class="sim-name">' + hl(S.t, q) +
      '</span><span class="sim-tags"><span class="tagc">' + (DOMAIN[id] || "Maths") + '</span><span class="tagc">PhET</span>' + (S.te ? '<span class="tagc">తెలుగు</span>' : "") + "</span></span></button>";
  }
  function renderChapters() {
    const B = BOARDS[state.board], q = state.q.trim().toLowerCase();
    let items = q
      ? boardChapters(state.board).filter((x) => x.c[0].toLowerCase().includes(q) || simsOf(x.c).some((s) => title(s).toLowerCase().includes(q)))
      : B.classes[state.cls][state.subj].map((c, i) => ({ cls: state.cls, s: state.subj, i, c }));
    const n = count(items.map((x) => x.c)), p = pct(n.covered, n.total);
    $("explore").dataset.subj = q ? "" : state.subj;
    $("exploreSub").textContent = B.name + " · " + B.note + ".";
    $("progress").innerHTML = q
      ? "<span><b>" + items.length + "</b> " + (items.length === 1 ? "chapter matches" : "chapters match") + " “" + esc(state.q.trim()) + "” in " + esc(B.name) + "</span>"
      : "<span><b>" + n.covered + "</b> of <b>" + n.total + '</b> chapters have a simulation</span><span class="meter" role="img" aria-label="' + p + ' percent"><i style="width:' + p + '%"></i></span><b>' + p + "%</b>";
    const withSims = items.filter((x) => x.c[1]), gaps = items.filter((x) => !x.c[1]);
    $("chapters").innerHTML = withSims.length ? withSims.map((x, k) => {
      const ctx = "Class " + x.cls + " · " + SUBJECTS[x.s].name + " · " + x.c[0];
      return '<li class="chapter" data-subj="' + x.s + '" style="--i:' + Math.min(k, 10) + '"><div class="ch-head"><span class="num" aria-hidden="true">' + (x.i + 1) + "</span><div>" +
        (q ? '<p class="where">Class ' + x.cls + " · " + esc(SUBJECTS[x.s].name) + "</p>" : "") + "<h3>" + hl(x.c[0], q) + '</h3></div></div><div class="sims">' +
        simsOf(x.c).map((s) => simTile(s, ctx, q)).join("") + "</div></li>";
    }).join("") : '<li class="empty">' + (q ? "Nothing matches that search. Try a shorter word." : "No simulations for these chapters yet.") + "</li>";
    $("gaps").innerHTML = gaps.length ? "<h3>No simulation yet (" + gaps.length + ")</h3><p>Plan a hands-on activity, model or video for these chapters.</p><ul class=\"gap-list\">" +
      gaps.map((x) => "<li><i>" + (q ? x.cls + "·" : "") + (x.i + 1) + "</i>" + hl(x.c[0], q) + "</li>").join("") + "</ul>" : "";
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-sim]");
    if (b) openSim(b.dataset.sim, b.dataset.ctx);
  });
  let qTimer;
  $("q").addEventListener("input", (e) => { clearTimeout(qTimer); qTimer = setTimeout(() => { state.q = e.target.value; renderChapters(); renderHeat(); }, 120); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && !$("player").open) { e.preventDefault(); $("q").focus(); }
  });

  // ---------- heatmaps ----------
  const COLS = [{ label: "Science", subs: ["sci", "phy"] }, { label: "Biology", subs: ["bio"] }, { label: "Maths", subs: ["math"] }];
  function renderHeat() {
    $("heatGrid").innerHTML = Object.keys(BOARDS).map((b) => {
      const B = BOARDS[b];
      const rows = Object.keys(B.classes).map((cls) => '<tr><th scope="row">Class ' + cls + "</th>" + COLS.map((col) => {
        const s = col.subs.find((k) => B.classes[cls][k]);
        if (!s) return '<td><span class="cell none" data-tip="Biology is part of the single Science book in this class">–</span></td>';
        const n = count(B.classes[cls][s]), p = pct(n.covered, n.total);
        const sel = b === state.board && cls === state.cls && s === state.subj && !state.q ? " sel" : "";
        return '<td><button type="button" class="cell b' + bin(p) + sel + '" data-b="' + b + '" data-c="' + cls + '" data-s="' + s + '" data-tip="<b>' + esc(B.name) + " · Class " + cls + " · " +
          esc(SUBJECTS[s].name) + "</b>" + n.covered + " of " + n.total + ' chapters have a simulation" aria-label="' + esc(B.name) + " class " + cls + " " + esc(SUBJECTS[s].name) + ": " + p + ' percent">' + p + "%</button></td>";
      }).join("") + "</tr>").join("");
      const totals = COLS.map((col) => {
        const n = count(boardChapters(b, (c, s) => col.subs.includes(s)).map((x) => x.c));
        return '<td><span class="cell tot" data-tip="<b>' + esc(B.name) + " · all classes · " + col.label + "</b>" + n.covered + " of " + n.total + ' chapters have a simulation">' + pct(n.covered, n.total) + "%</span></td>";
      }).join("");
      return '<div class="heat"><h3>' + esc(B.name) + '</h3><p class="sub">' + esc(B.note) + "</p><table><thead><tr><td></td>" + COLS.map((c) => '<th scope="col">' + c.label + "</th>").join("") +
        "</tr></thead><tbody>" + rows + '<tr><th scope="row">Overall</th>' + totals + "</tr></tbody></table></div>";
    }).join("");
  }
  $("heatGrid").addEventListener("click", (e) => {
    const c = e.target.closest("button.cell");
    if (!c) return;
    Object.assign(state, { board: c.dataset.b, cls: c.dataset.c, subj: c.dataset.s, q: "" });
    $("q").value = "";
    update();
    $("explore").scrollIntoView();
  });
  const tip = $("tip");
  ["mouseover", "focusin"].forEach((ev) => document.addEventListener(ev, (e) => {
    const el = e.target.closest && e.target.closest("[data-tip]");
    if (!el) return;
    tip.innerHTML = el.dataset.tip; tip.hidden = false;
    const r = el.getBoundingClientRect(), t = tip.getBoundingClientRect();
    tip.style.left = Math.max(8, Math.min(r.left + r.width / 2 - t.width / 2, innerWidth - t.width - 8)) + "px";
    tip.style.top = (r.top - t.height - 8 < 8 ? r.bottom + 8 : r.top - t.height - 8) + "px";
  }));
  ["mouseout", "focusout", "scroll"].forEach((ev) => document.addEventListener(ev, () => { tip.hidden = true; }, true));

  // ---------- findings ----------
  function renderFindings() {
    const stat = (b, subs) => count(boardChapters(b, (c, s) => subs.includes(s)).map((x) => x.c));
    const both = (subs) => { const t = stat("ts", subs), a = stat("ap", subs); return "<b>" + pct(t.covered, t.total) + "%</b> in Telangana and <b>" + pct(a.covered, a.total) + "%</b> in Andhra Pradesh"; };
    const ts = count(boardChapters("ts").map((x) => x.c)), ap = count(boardChapters("ap").map((x) => x.c));
    const cards = [
      ["sky", "Physical science fits best", "<p>For classes 8–10, " + both(["phy"]) + " of physical science chapters have a simulation.</p><p>Light, electricity, magnetism, atoms, acids and bases, and motion are well served. Metallurgy, fuels and materials are the usual gaps.</p>"],
      ["leaf", "Biology is the weak spot", "<p>Only " + both(["bio"]) + " of biology chapters have a simulation, because few life-science simulations exist.</p><p>Plan specimens, models, field work and videos for life processes, reproduction, tissues and ecosystems.</p>"],
      ["violet", "Maths: strong on number, thin on geometry", "<p>" + both(["math"]) + " of maths chapters have a simulation.</p><p>Fractions, integers, ratio, equations, graphs, statistics and trigonometry are covered. Constructions, mensuration and circles are not yet — our Triangle Angles Lab is a first step.</p>"],
      ["coral", "Both boards get similar value", "<p>Overall, <b>" + pct(ts.covered, ts.total) + "%</b> of Telangana chapters (" + ts.covered + " of " + ts.total + ") and <b>" + pct(ap.covered, ap.total) + "%</b> of Andhra Pradesh chapters (" + ap.covered + " of " + ap.total + ") have a simulation.</p><p>The same simulations serve both; mostly the chapter order and class differ.</p>"],
      ["teal", "Telugu-medium classes", "<p>Every PhET simulation used here has a Telugu version you can switch to in the player. Translations are volunteer-made, so preview the wording first.</p><p>Our own labs are in English for now.</p>"],
      ["sun", "In the classroom", "<p>Each simulation opens with one question to investigate. Let students predict, then test, then explain.</p><p>Everything runs in a browser on a phone, tablet, laptop or smart board, and needs an internet connection.</p>"],
    ];
    $("findingCards").innerHTML = cards.map((c) => '<article class="finding" style="--c:var(--' + c[0] + ')"><h3>' + c[1] + "</h3>" + c[2] + "</article>").join("");
  }

  // ---------- player ----------
  const player = $("player"), frame = $("simFrame");
  let cur = null, lang = "en";
  try { lang = localStorage.getItem("ic-lang") || "en"; } catch (e) {}
  function loadSim() {
    if (isOwn(cur)) {
      const L = LABS[cur.slice(1)];
      frame.src = L.file + "?embed=1&theme=" + theme();
      $("pTitle").textContent = L.t;
      $("openBtn").href = L.file; $("openBtn").textContent = "Open in new tab";
      $("langSeg").innerHTML = ""; $("stage").classList.add("own");
      return;
    }
    const S = SIMS[cur], l = lang === "te" && S.te ? "te" : "en";
    frame.src = PHET + "/sims/html/" + cur + "/latest/" + cur + "_" + l + ".html";
    $("pTitle").textContent = l === "te" ? S.te : S.t;
    $("openBtn").href = PHET + "/" + l + "/simulations/" + cur; $("openBtn").textContent = "Open on PhET";
    $("stage").classList.remove("own");
    pills("langSeg", [["en", "English"]].concat(S.te ? [["te", "తెలుగు"]] : []), l, (v) => { lang = v; try { localStorage.setItem("ic-lang", v); } catch (e) {} loadSim(); });
  }
  function openSim(id, ctx) {
    cur = id;
    const tipText = isOwn(id) ? LABS[id.slice(1)].tip : TIPS[id];
    $("pSub").textContent = ctx || (isOwn(id) ? "Made here · Interactive Classroom" : "");
    $("pTip").textContent = tipText ? "Try this: " + tipText : ""; $("pTip").hidden = !tipText;
    loadSim();
    player.showModal();
  }
  player.addEventListener("close", () => { frame.src = "about:blank"; });
  player.addEventListener("click", (e) => { if (e.target === player) player.close(); });
  $("closeBtn").onclick = () => player.close();
  $("fsBtn").onclick = () => { document.fullscreenElement ? document.exitFullscreen() : $("stage").requestFullscreen && $("stage").requestFullscreen(); };

  $("themeBtn").onclick = () => {
    document.documentElement.dataset.theme = theme() === "dark" ? "light" : "dark";
    try { localStorage.setItem("ic-theme", document.documentElement.dataset.theme); } catch (e) {}
    heroLab();
  };

  function update() { writeHash(); renderHero(); renderPickers(); renderChapters(); renderHeat(); }
  readHash(); renderLabs(); renderFindings(); heroLab();
  renderHero(); renderPickers(); renderChapters(); renderHeat();
  addEventListener("hashchange", () => { if (/^#board=/.test(location.hash)) { readHash(); renderHero(); renderPickers(); renderChapters(); renderHeat(); } });
})();
