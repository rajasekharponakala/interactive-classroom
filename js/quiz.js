// Multiple-choice quiz panel for our own labs. Questions live in js/quiz-defs.js (window.LAB_QUIZZIES, keyed by lab id).
// Visual feedback: choice animation, correctness message, explanation, and localStorage history ("ic-quiz-<id>").
(function () {
  "use strict";
  const KEY = (id) => "ic-quiz-" + id;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const read = (id) => {
    try {
      return Object.assign({ attempts: 0, correct: 0, passed: false, history: [] }, JSON.parse(localStorage.getItem(KEY(id)) || "{}"));
    } catch (e) {
      return { attempts: 0, correct: 0, passed: false, history: [] };
    }
  };
  const write = (id, d) => { try { localStorage.setItem(KEY(id), JSON.stringify(d)); } catch (e) {} };
  const $e = (t, props, kids) => {
    const el = document.createElement(t);
    Object.assign(el, props);
    if (kids !== undefined) el.innerHTML = kids;
    return el;
  };

  function mount(root) {
    const id = root.getAttribute("data-quiz-id");
    const def = (window.LAB_QUIZZIES || {})[id];
    if (!id || !def || !def.length) return;
    const st = read(id), qs = def;
    let qi = 0, runRight = 0, answered = false;

    root.className = "box quiz";
    root.innerHTML =
      '<h2 class="quiz-title">📝 Check your understanding</h2>' +
      '<p class="quiz-bar"></p>' +
      '<p class="quiz-question" id="quizQuestion" tabindex="-1"></p>' +
      '<div class="quiz-opts" role="group" aria-labelledby="quizQuestion"></div>' +
      '<div role="status"><p class="quiz-feedback"></p><p class="quiz-why"></p></div>' +
      '<div class="quiz-summary"></div>';
    const bar = root.querySelector(".quiz-bar"), opts = root.querySelector(".quiz-opts");
    const feedback = root.querySelector(".quiz-feedback"), whyEl = root.querySelector(".quiz-why");
    const summary = root.querySelector(".quiz-summary");
    const question = root.querySelector(".quiz-question");

    const scoreText = () => "All attempts: " + st.correct + " of " + (st.attempts * qs.length) + " answers correct";

    function render(moveFocus = false) {
      const q = qs[qi];
      bar.textContent = "Q " + (qi + 1) + " of " + qs.length;
      question.textContent = q.q;
      opts.textContent = "";
      q.choices.forEach((c, i) => {
        const b = $e("button", { type: "button", className: "quiz-opt" }, esc(c));
        b.addEventListener("click", () => answer(i, b));
        opts.appendChild(b);
      });
      feedback.textContent = ""; whyEl.textContent = ""; summary.textContent = "";
      if (moveFocus) question.focus();
    }

    function answer(idx, btn) {
      if (answered) return;
      const q = qs[qi], right = idx === q.answer;
      q.choices.forEach((c, i) => {
        opts.children[i].classList.toggle("ok", i === q.answer);
        opts.children[i].setAttribute("aria-disabled", "true");
        opts.children[i].tabIndex = -1;
      });
      btn.classList.add("hit");
      const why = q.why || "";
      feedback.textContent = right ? "✅ That's right!" : "❌ Not quite. Correct answer: " + q.choices[q.answer] + ".";
      whyEl.textContent = why; whyEl.hidden = !why;
      answered = true;
      if (right) runRight++;
      const next = $e("button", { type: "button", className: "btn primary" }, qi + 1 === qs.length ? "See results" : "Next question");
      next.addEventListener("click", () => {
        answered = false;
        if (qi + 1 >= qs.length) finish();
        else { qi++; render(true); }
      });
      summary.append(next);
    }

    function finish() {
      st.attempts++;
      st.correct += runRight;
      if (runRight === qs.length) st.passed = true;
      st.history = st.history.concat(Date.now()).slice(-9);
      write(id, st);
      renderSummary();
    }

    function renderSummary() {
      const allRight = runRight === qs.length;
      opts.textContent = ""; feedback.textContent = ""; whyEl.textContent = "";
      bar.textContent = "Quiz over";
      question.textContent = "";
      summary.textContent = "";
      const again = $e("button", { type: "button", className: "quiz-again btn primary" }, "Play again");
      again.addEventListener("click", restart);
      summary.append($e("h3", { className: "quiz-wins" }, allRight ? "🎉 You passed the quiz!" : "You got " + runRight + " of " + qs.length + " right."),
        $e("p", { className: "quiz-note" }, scoreText() + (allRight ? " — great job!" : " — try again to improve!")), again);
      again.focus();
    }

    function restart() {
      qi = 0; runRight = 0; answered = false;
      render(true);
    }

    render();
    if (window.location.hash === "#quiz") root.scrollIntoView({ block: "start" });
  }

  window.Quiz = { mount };
})();
