// Small helpers shared by the labs.
(function () {
  const p = new URLSearchParams(location.search);
  if (p.get("theme")) document.documentElement.dataset.theme = p.get("theme");
  if (p.get("mini")) document.body.classList.add("mini");
  if (p.get("embed")) document.body.classList.add("embed");
  window.Lab = {
    mini: !!p.get("mini"),
    css: (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    // Size a canvas to its box at device resolution; returns {ctx, w, h} in CSS pixels.
    fit(canvas) {
      const r = canvas.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(r.width * d) || canvas.height !== Math.round(r.height * d)) {
        canvas.width = Math.round(r.width * d);
        canvas.height = Math.round(r.height * d);
      }
      const ctx = canvas.getContext("2d");
      ctx.setTransform(d, 0, 0, d, 0, 0);
      return { ctx, w: r.width, h: r.height };
    },
    bind(id, fmt, onChange) {
      const el = document.getElementById(id), out = document.getElementById(id + "Out");
      const run = () => { if (out) out.textContent = fmt(+el.value); onChange(+el.value); };
      el.addEventListener("input", run);
      run();
      return el;
    },
    pills(id, onPick) {
      const g = document.getElementById(id);
      g.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        g.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
        onPick(b.dataset.v);
      });
    },
  };
})();
