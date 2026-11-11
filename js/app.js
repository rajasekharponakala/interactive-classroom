(function () {
  "use strict";
  const SIMS = window.PHET_SIMS, BOARDS = window.BOARDS, SUBJECTS = window.SUBJECTS;
  const TIPS = window.SIM_TIPS, DOMAIN = window.SIM_DOMAIN;
  const PHET = "https://phet.colorado.edu";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const simsOf = (ch) => (ch[1] ? ch[1].split(" ") : []);

  // ---------- state, kept in the URL hash so views can be shared ----------
  const state = { board: "ts", cls: "10", subj: "phy", show: "all", q: "" };
  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    if (BOARDS[p.get("board")]) state.board = p.get("board");
    if (BOARDS[state.board].classes[p.get("class")]) state.cls = p.get("class");
    const subs = BOARDS[state.board].classes[state.cls];
    if (subs[p.get("subject")]) state.subj = p.get("subject");
    if (!subs[state.subj]) state.subj = Object.keys(subs)[0];
  }
  function writeHash() {
    const h = "#board=" + state.board + "&class=" + state.cls + "&subject=" + state.subj;
    history.replaceState(null, "", h);
  }

  // ---------- coverage maths ----------
  function count(chapters) {
    const covered = chapters.filter((c) => c[1]).length;
    return { total: chapters.length, covered };
  }
  function boardChapters(b, filter) {
    const out = [];
    for (const [cls, subs] of Object.entries(BOARDS[b].classes))
      for (const [s, chs] of Object.entries(subs))
        if (!filter || filter(cls, s)) chs.forEach((c, i) => out.push({ cls, s, i, c }));
    return out;
  }
  const bin = (p) => (p === 0 ? 0 : p < 20 ? 1 : p < 40 ? 2 : p < 60 ? 3 : p < 80 ? 4 : 5);

  // ---------- headline stats ----------
  function renderStats() {
    const all = [...boardChapters("ts"), ...boardChapters("ap")];
    const used = new Set();
    all.forEach((x) => simsOf(x.c).forEach((s) => used.add(s)));
    const covered = all.filter((x) => x.c[1]).length;
    const te = [...used].filter((s) => SIMS[s] && SIMS[s].te).length;
    const tiles = [
      [all.length, "textbook chapters mapped across both boards"],
      [pct(covered, all.length) + "%", "of chapters have at least one simulation"],
      [used.size, "different PhET simulations put to use"],
      [te, "of those simulations available in Telugu"],
    ];
    $("stats").innerHTML = tiles.map((t) => '<div class="stat"><b>' + t[0] + "</b><span>" + t[1] + "</span></div>").join("");
  }

  // ---------- heatmaps ----------
  const COLS = [
    { key: "science", label: "Science", subs: ["sci", "phy"] },
    { key: "bio", label: "Biology", subs: ["bio"] },
    { key: "math", label: "Maths", subs: ["math"] },
  ];
  function renderHeat() {
    $("heatGrid").innerHTML = Object.keys(BOARDS).map((b) => {
      const B = BOARDS[b];
      const rows = Object.keys(B.classes).map((cls) => {
        const cells = COLS.map((col) => {
          const s = col.subs.find((k) => B.classes[cls][k]);
          if (!s) return '<td><span class="cell none" data-tip="Biology is taught inside the single Science book in this class">–</span></td>';
          const n = count(B.classes[cls][s]);
          const p = pct(n.covered, n.total);
          const sel = b === state.board && cls === state.cls && s === state.subj && !state.q ? " sel" : "";
          return '<td><button type="button" class="cell b' + bin(p) + sel + '" data-b="' + b + '" data-c="' + cls + '" data-s="' + s +
            '" data-tip="<b>' + esc(B.name) + " · Class " + cls + " · " + esc(SUBJECTS[s].name) + "</b>" + n.covered + " of " + n.total +
            ' chapters have a simulation" aria-label="' + esc(B.name) + " class " + cls + " " + esc(SUBJECTS[s].name) + ": " + p + ' percent of chapters covered">' + p + "%</button></td>";
        }).join("");
        return '<tr><th scope="row">Class ' + cls + "</th>" + cells + "</tr>";
      }).join("");
      const totals = COLS.map((col) => {
        const n = count(boardChapters(b, (c, s) => col.subs.includes(s)).map((x) => x.c));
        const p = pct(n.covered, n.total);
        return '<td><span class="cell none" style="color:var(--ink);font-weight:650" data-tip="<b>' + esc(B.name) + " · all classes · " + col.label + "</b>" +
          n.covered + " of " + n.total + ' chapters have a simulation">' + p + "%</span></td>";
      }).join("");
      const head = COLS.map((c) => '<th scope="col">' + c.label + "</th>").join("");
      return '<div class="heat"><h3>' + esc(B.name) + '</h3><p class="sub">' + esc(B.note) + "</p><table><thead><tr><td></td>" + head +
        "</tr></thead><tbody>" + rows + '<tr class="total"><th scope="row">Overall</th>' + totals + "</tr></tbody></table></div>";
    }).join("");
  }
  $("heatGrid").addEventListener("click", (e) => {
    const c = e.target.closest("button.cell");
    if (!c) return;
    Object.assign(state, { board: c.dataset.b, cls: c.dataset.c, subj: c.dataset.s, show: "all", q: "" });
    $("q").value = "";
    update();
    $("explore").scrollIntoView();
  });

  // ---------- tooltip for heatmap cells ----------
  const tip = $("tip");
  function showTip(el) {
    tip.innerHTML = el.dataset.tip;
    tip.hidden = false;
    const r = el.getBoundingClientRect(), t = tip.getBoundingClientRect();
    let x = r.left + r.width / 2 - t.width / 2, y = r.top - t.height - 8;
    x = Math.max(8, Math.min(x, innerWidth - t.width - 8));
    if (y < 8) y = r.bottom + 8;
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  }
  ["mouseover", "focusin"].forEach((ev) => document.addEventListener(ev, (e) => {
    const el = e.target.closest && e.target.closest("[data-tip]");
    if (el) showTip(el);
  }));
  ["mouseout", "focusout", "scroll"].forEach((ev) => document.addEventListener(ev, () => { tip.hidden = true; }, true));

  // ---------- controls ----------
  function seg(id, items, current, onPick) {
    const el = $(id);
    el.innerHTML = items.map((it) => '<button type="button" data-v="' + it[0] + '" aria-pressed="' + (it[0] === current) + '">' + esc(it[1]) + "</button>").join("");
    el.onclick = (e) => {
      const b = e.target.closest("button");
      if (b) onPick(b.dataset.v);
    };
  }
  function renderControls() {
    const B = BOARDS[state.board];
    seg("boardSeg", Object.keys(BOARDS).map((k) => [k, BOARDS[k].name]), state.board, (v) => {
      state.board = v;
      if (!BOARDS[v].classes[state.cls][state.subj]) state.subj = Object.keys(BOARDS[v].classes[state.cls])[0];
      update();
    });
    seg("classSeg", Object.keys(B.classes).map((k) => [k, k]), state.cls, (v) => {
      state.cls = v;
      const subs = B.classes[v];
      if (!subs[state.subj]) state.subj = state.subj === "math" ? "math" : Object.keys(subs)[0];
      update();
    });
    seg("subjSeg", Object.keys(B.classes[state.cls]).map((k) => [k, SUBJECTS[k].short]), state.subj, (v) => { state.subj = v; update(); });
    seg("showSeg", [["all", "All"], ["covered", "With simulations"], ["gaps", "Gaps"]], state.show, (v) => { state.show = v; update(); });
  }

  // ---------- chapters ----------
  function hl(text, q) {
    const s = esc(text);
    if (!q) return s;
    const i = text.toLowerCase().indexOf(q);
    return i < 0 ? s : esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
  }
  function simTile(slug, ctx, q) {
    const S = SIMS[slug];
    if (!S) return "";
    const dom = DOMAIN[slug] || "Maths";
    return '<button type="button" class="sim" data-sim="' + slug + '" data-ctx="' + esc(ctx) + '">' +
      '<span class="thumb"><span class="ph">' + esc(S.t) + '</span><img loading="lazy" alt="" src="' + PHET + "/sims/html/" + slug + "/latest/" + slug +
      '-600.png" onerror="this.remove()"><span class="play" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span></span>' +
      '<span class="sim-body"><span class="sim-name">' + hl(S.t, q) + '</span><span class="sim-tags"><span class="tag">' + dom + "</span>" +
      (S.te ? '<span class="tag">తెలుగు</span>' : "") + "</span></span></button>";
  }
  function renderChapters() {
    const B = BOARDS[state.board];
    const q = state.q.trim().toLowerCase();
    let items;
    if (q) {
      items = boardChapters(state.board).filter((x) =>
        x.c[0].toLowerCase().includes(q) || simsOf(x.c).some((s) => SIMS[s] && SIMS[s].t.toLowerCase().includes(q)));
    } else {
      items = B.classes[state.cls][state.subj].map((c, i) => ({ cls: state.cls, s: state.subj, i, c }));
    }
    const n = count(items.map((x) => x.c));
    if (state.show === "covered") items = items.filter((x) => x.c[1]);
    if (state.show === "gaps") items = items.filter((x) => !x.c[1]);

    $("exploreSub").textContent = q
      ? "Search results in " + B.name + ", all classes and subjects."
      : B.name + " · Class " + state.cls + " · " + SUBJECTS[state.subj].name + ". Select a simulation to run it here.";
    $("progress").innerHTML = '<span><b>' + n.covered + "</b> of <b>" + n.total + "</b> chapters have a simulation</span>" +
      '<span class="meter" role="img" aria-label="' + pct(n.covered, n.total) + ' percent covered"><i style="width:' + pct(n.covered, n.total) + '%"></i></span>' +
      "<span><b>" + pct(n.covered, n.total) + "%</b></span>";

    if (!items.length) {
      $("chapters").innerHTML = '<li class="empty">' + (q ? "No chapter or simulation matches “" + esc(state.q) + "” in " + esc(B.name) + "." : "Nothing to show with this filter.") + "</li>";
      return;
    }
    $("chapters").innerHTML = items.map((x) => {
      const sims = simsOf(x.c);
      const ctx = "Class " + x.cls + " · " + SUBJECTS[x.s].name + " · " + x.c[0];
      const where = q ? '<p class="where">Class ' + x.cls + " · " + esc(SUBJECTS[x.s].name) + "</p>" : "";
      const head = '<span class="num" aria-hidden="true">' + (x.i + 1) + "</span><div>" + where + "<h3>" + hl(x.c[0], q) + "</h3></div>";
      if (!sims.length)
        return '<li class="chapter gap">' + head + '<p class="gap-note">No matching PhET simulation — plan a hands-on activity, model or video for this chapter.</p></li>';
      return '<li class="chapter">' + head + '<p class="meta">' + sims.length + (sims.length === 1 ? " simulation" : " simulations") + "</p>" +
        '<div class="sims">' + sims.map((s) => simTile(s, ctx, q)).join("") + "</div></li>";
    }).join("");
  }
  $("chapters").addEventListener("click", (e) => {
    const b = e.target.closest(".sim");
    if (b) openSim(b.dataset.sim, b.dataset.ctx);
  });
  let qTimer;
  $("q").addEventListener("input", (e) => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { state.q = e.target.value; renderChapters(); renderHeat(); }, 120);
  });

  // ---------- findings ----------
  function renderFindings() {
    const stat = (b, subs) => count(boardChapters(b, (c, s) => subs.includes(s)).map((x) => x.c));
    const line = (label, subs) => {
      const t = stat("ts", subs), a = stat("ap", subs);
      return "<b>" + pct(t.covered, t.total) + "%</b> in Telangana and <b>" + pct(a.covered, a.total) + "%</b> in Andhra Pradesh";
    };
    const ts = count(boardChapters("ts").map((x) => x.c)), ap = count(boardChapters("ap").map((x) => x.c));
    const hi = (b) => count(boardChapters(b, (c, s) => +c >= 9 && s === "phy").map((x) => x.c));
    const cards = [
      ["Physical science is where simulations fit best",
        "<p>For classes 8–10, " + line("", ["phy"]) + " of physical science chapters have a simulation. In classes 9–10 it is <b>" +
        hi("ts").covered + " of " + hi("ts").total + "</b> chapters in Telangana and <b>" + hi("ap").covered + " of " + hi("ap").total + "</b> in Andhra Pradesh.</p>" +
        "<p>Light, electricity, magnetism, atoms, acids and bases, and motion are all well served. The usual gaps are metallurgy, fuels and materials chapters.</p>"],
      ["Biology is the weak spot",
        "<p>Only " + line("", ["bio"]) + " of biology chapters have a simulation. PhET has few life-science simulations — neuron, natural selection, gene expression and membrane transport.</p>" +
        "<p>Plan specimens, models, field work and videos for life processes, reproduction, tissues and ecosystems.</p>"],
      ["Maths is covered in algebra and number, not geometry",
        "<p>" + line("", ["math"]).replace(/^/, "") + " of maths chapters have a simulation.</p>" +
        "<p>Fractions, integers, ratio, equations, graphs, statistics and trigonometry are covered. Constructions, mensuration, circles, triangles and proofs are not; a geometry tool such as GeoGebra fills that gap better.</p>"],
      ["Both boards get similar value from the same simulations",
        "<p>Overall, <b>" + pct(ts.covered, ts.total) + "%</b> of Telangana chapters (" + ts.covered + " of " + ts.total + ") and <b>" + pct(ap.covered, ap.total) + "%</b> of Andhra Pradesh chapters (" +
        ap.covered + " of " + ap.total + ") have a simulation.</p><p>The same simulations serve both; mostly the chapter order and class placement differ, so one shared lab plan can work across the two states.</p>"],
      ["Telugu-medium classes are well supported",
        "<p>Every simulation used here has a Telugu version, which you can switch to inside the player.</p>" +
        "<p>Translations are volunteer-made, so preview the Telugu wording of a simulation before the lesson.</p>"],
      ["How to use this in class",
        "<p>Each simulation opens with one question for students to investigate. Let them predict first, then test, then explain.</p>" +
        "<p>The simulations run in any browser on a phone, tablet, laptop or smart board, and need an internet connection when opened from this page.</p>"],
    ];
    $("findingCards").innerHTML = cards.map((c) => '<article class="finding"><h3>' + c[0] + "</h3>" + c[1] + "</article>").join("");
  }

  // ---------- simulation player ----------
  const player = $("player"), frame = $("simFrame");
  let cur = null, lang = "en";
  try { lang = localStorage.getItem("ic-lang") || "en"; } catch (e) {}
  function loadSim() {
    const S = SIMS[cur];
    const l = lang === "te" && S.te ? "te" : "en";
    frame.src = PHET + "/sims/html/" + cur + "/latest/" + cur + "_" + l + ".html";
    $("pTitle").textContent = l === "te" ? S.te : S.t;
    $("openBtn").href = PHET + "/" + l + "/simulations/" + cur;
    const items = [["en", "English"]].concat(S.te ? [["te", "తెలుగు"]] : []);
    seg("langSeg", items, l, (v) => {
      lang = v;
      try { localStorage.setItem("ic-lang", v); } catch (e) {}
      loadSim();
    });
  }
  function openSim(slug, ctx) {
    cur = slug;
    $("pSub").textContent = ctx || "";
    $("pTip").innerHTML = TIPS[slug] ? "<b>Try this:</b> " + esc(TIPS[slug]) : "";
    $("pTip").hidden = !TIPS[slug];
    loadSim();
    player.showModal();
  }
  function closeSim() { player.close(); }
  player.addEventListener("close", () => { frame.src = "about:blank"; });
  player.addEventListener("click", (e) => { if (e.target === player) closeSim(); });
  $("closeBtn").onclick = closeSim;
  $("fsBtn").onclick = () => {
    const el = $("stage");
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen();
  };

  // ---------- theme ----------
  $("themeBtn").onclick = () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("ic-theme", root.dataset.theme); } catch (e) {}
  };

  function update() {
    writeHash();
    renderControls();
    renderHeat();
    renderChapters();
  }
  readHash();
  renderStats();
  renderFindings();
  renderControls();
  renderHeat();
  renderChapters();
  addEventListener("hashchange", () => {
    if (/^#board=/.test(location.hash)) { readHash(); renderControls(); renderHeat(); renderChapters(); }
  });
})();
