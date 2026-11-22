// Attempt timer: per-lab stopwatch with saved attempt history.
// Storage: localStorage key "ic-attempts-<id>" — an array of millisecond durations (last 10 kept).
(function () {
  "use strict";
  const KEY = (id) => "ic-attempts-" + id;
  const read = (id) => {
    try { const h = JSON.parse(localStorage.getItem(KEY(id)) || "[]"); return Array.isArray(h) ? h.filter((ms) => Number.isFinite(ms) && ms > 0) : []; }
    catch (e) { return []; }
  };
  const write = (id, h) => { try { localStorage.setItem(KEY(id), JSON.stringify(h.slice(-10))); } catch (e) {} };
  const fmt = (ms) => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

  const Attempts = {
    history: (id) => read(id),
    best: (id) => { const h = read(id); return h.length ? Math.min(...h) : null; },
    // Renders the timer panel into root (a .box element). id is the lab id ("pendulum").
    mount(root, id) {
      root.className = "box";
      root.innerHTML =
        '<h2>Time &amp; history</h2>' +
        '<div class="reads">' +
        '<div class="read"><span>Elapsed</span><b id="tElapsed">0:00</b></div>' +
        '<div class="read"><span>Best of your tries</span><b id="tBest">–</b></div>' +
        "</div>" +
        '<div class="row" style="margin-top:10px">' +
        '<button class="btn" id="tStart" type="button">Start attempt</button>' +
        '<button class="btn" id="tStop" type="button" hidden>Stop &amp; save</button>' +
        '<button class="btn" id="tClear" type="button" hidden>Clear history</button>' +
        "</div>" +
        '<p class="note" id="tHist" style="margin-top:8px"></p>';
      const tElapsed = root.querySelector("#tElapsed"), tBest = root.querySelector("#tBest");
      const tHist = root.querySelector("#tHist");
      const tStart = root.querySelector("#tStart"), tStop = root.querySelector("#tStop"), tClear = root.querySelector("#tClear");
      let running = false, start = 0, timer = null;

      const showHist = () => {
        const history = read(id);
        tHist.textContent = history.slice(-6).map(fmt).join(", ") || "No saved attempts yet.";
        tClear.hidden = running || !history.length;
      };
      const tick = () => { if (running) tElapsed.textContent = fmt(performance.now() - start); };
      const updateBest = () => { const b = Attempts.best(id); tBest.textContent = b === null ? "–" : fmt(b); };

      tStart.onclick = () => {
        if (running) return;
        running = true; start = performance.now();
        tStart.hidden = true; tStop.hidden = false; tClear.hidden = true;
        tStop.focus();
        timer = setInterval(tick, 200); tick();
      };
      tStop.onclick = () => {
        if (!running) return;
        running = false; clearInterval(timer); timer = null;
        const ms = performance.now() - start;
        if (ms > 0) write(id, read(id).concat([ms]));
        tElapsed.textContent = fmt(ms);
        tStart.hidden = false; tStop.hidden = true;
        showHist(); updateBest();
        tStart.focus();
      };
      tClear.onclick = () => { write(id, []); showHist(); updateBest(); tElapsed.textContent = "0:00"; tStart.focus(); };

      tick(); updateBest(); showHist();
    },
  };

  window.Attempts = Attempts;
})();
