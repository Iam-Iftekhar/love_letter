/* ============================================================
   Home page: drag the arrow down, aim, release -> hit the letter
   Everything scales with the stage height (k), so it plays
   the same on a phone, a tablet or a desktop.
   ============================================================ */
(() => {
  const stage  = document.getElementById("stage");
  const svg    = document.getElementById("scene");
  const letter = document.getElementById("letter");
  const hint   = document.getElementById("hint");
  const bowEl    = document.getElementById("bow");
  const stringEl = document.getElementById("string");
  const guideEl  = document.getElementById("guide");
  const arrowEl  = document.getElementById("arrow");

  const NS = "http://www.w3.org/2000/svg";
  const START_HINT = "Pull the arrow down, aim at the letter, then let go 💘";

  // base values (designed for a ~600px tall stage; scaled by k)
  const TIP = 108;        // nock (tail) -> arrow tip
  const MAX_PULL = 120;   // max pull distance
  const MIN_PULL = 25;    // pulling less than this cancels the shot
  const SPEED = 9;        // launch speed = pull * SPEED
  const GRAVITY = 650;    // px/s^2
  const HALF_BOW = 62;
  const ARC = 80;         // bow arc height

  let W = 0, H = 0, k = 1, hb = HALF_BOW;
  let B = { x: 0, y: 0 };                  // bow centre = nock rest point
  let state = "idle";                      // idle | drag | flying | hit | resetting
  let pull = { x: 0, y: 0 };
  let pos = { x: 0, y: 0 }, vel = { x: 0, y: 0 };
  let last = 0;

  /* ---------- layout ---------- */
  function layout() {
    if (!stage.clientHeight) return;      // home view is hidden (card page is showing)
    W = stage.clientWidth;
    H = stage.clientHeight;
    k = Math.min(Math.max(H / 600, 0.55), 1.15);
    hb = HALF_BOW * k;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    // leave room under the bow so the arrow can be pulled down on screen
    B = { x: W / 2, y: H - MAX_PULL * k - 20 };
    bowEl.setAttribute(
      "d",
      `M ${B.x - hb} ${B.y} Q ${B.x} ${B.y - ARC * k} ${B.x + hb} ${B.y}`
    );
    if (state === "idle") {          // never reset in the middle of a drag/flight
      pull = { x: 0, y: 0 };
      draw(B, 0);
    }
  }

  const setArrow = (p, deg) =>
    arrowEl.setAttribute("transform", `translate(${p.x} ${p.y}) rotate(${deg}) scale(${k})`);

  function draw(tail, deg) {
    setArrow(tail, deg);
    stringEl.setAttribute("points", `${B.x - hb},${B.y} ${tail.x},${tail.y} ${B.x + hb},${B.y}`);
  }

  const restString = () =>
    stringEl.setAttribute("points", `${B.x - hb},${B.y} ${B.x},${B.y} ${B.x + hb},${B.y}`);

  const toStage = (e) => {
    const r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const letterRect = () => {
    const lr = letter.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    return {
      l: lr.left - sr.left, r: lr.right - sr.left,
      t: lr.top - sr.top,   b: lr.bottom - sr.top,
    };
  };

  const headingDeg = (dx, dy) => (Math.atan2(dx, -dy) * 180) / Math.PI;

  /* ---------- dragging ---------- */
  svg.addEventListener("pointerdown", (e) => {
    if (state !== "idle") return;
    const p = toStage(e);
    const grab = Math.max(90, 110 * k);                  // finger-friendly grab area
    if (Math.hypot(p.x - B.x, p.y - B.y) > grab) return;
    e.preventDefault();
    state = "drag";
    svg.setPointerCapture(e.pointerId);
    updateDrag(p);
  });
  svg.addEventListener("pointermove", (e) => {
    if (state === "drag") updateDrag(toStage(e));
  });
  svg.addEventListener("pointerup", release);
  svg.addEventListener("pointercancel", release);
  svg.addEventListener("contextmenu", (e) => e.preventDefault());   // no long-press menu

  function updateDrag(p) {
    const maxP = MAX_PULL * k, minP = MIN_PULL * k;
    let vx = p.x - B.x;
    let vy = Math.max(p.y - B.y, 0);          // the arrow only slides down
    let len = Math.hypot(vx, vy);
    if (len > maxP) { vx *= maxP / len; vy *= maxP / len; len = maxP; }
    pull = { x: vx, y: vy };

    const tail = { x: B.x + vx, y: B.y + vy };
    const dir = len > 1 ? { x: -vx / len, y: -vy / len } : { x: 0, y: -1 };
    draw(tail, headingDeg(dir.x, dir.y));
    drawGuide(tail, dir, len, minP);
    hint.textContent = len < minP ? "Pull a little further…" : "Aim, then let go! 🎯";
  }

  // dotted preview of the flight path
  function drawGuide(tail, dir, len, minP) {
    guideEl.innerHTML = "";
    if (len < minP) return;
    const v = { x: dir.x * len * SPEED, y: dir.y * len * SPEED };
    const g = GRAVITY * k;
    for (let i = 1; i <= 7; i++) {
      const t = i * 0.06;
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", tail.x + v.x * t);
      c.setAttribute("cy", tail.y + v.y * t + 0.5 * g * t * t);
      c.setAttribute("r", 4 - i * 0.35);
      c.setAttribute("class", "dot");
      c.setAttribute("opacity", 1 - i * 0.11);
      guideEl.appendChild(c);
    }
  }

  /* ---------- release & flight ---------- */
  function release() {
    if (state !== "drag") return;
    guideEl.innerHTML = "";
    const len = Math.hypot(pull.x, pull.y);
    if (len < MIN_PULL * k) {                   // too weak: snap back
      state = "idle";
      pull = { x: 0, y: 0 };
      draw(B, 0);
      hint.textContent = START_HINT;
      return;
    }
    state = "flying";
    pos = { x: B.x + pull.x, y: B.y + pull.y };
    vel = { x: -pull.x * SPEED, y: -pull.y * SPEED };
    restString();
    last = performance.now();
    requestAnimationFrame(step);
  }

  function step(now) {
    if (state !== "flying") return;
    const dt = Math.min((now - last) / 1000, 0.033);
    last = now;
    const sub = 4, h = dt / sub, g = GRAVITY * k;
    const rect = letterRect();

    for (let i = 0; i < sub; i++) {
      pos.x += vel.x * h;
      pos.y += vel.y * h;
      vel.y += g * h;

      const sp = Math.hypot(vel.x, vel.y) || 1;
      const tip = { x: pos.x + (vel.x / sp) * TIP * k, y: pos.y + (vel.y / sp) * TIP * k };
      const pad = 8;
      if (tip.x > rect.l - pad && tip.x < rect.r + pad && tip.y > rect.t - pad && tip.y < rect.b + pad) {
        return onHit(tip);
      }
    }

    const sp = Math.hypot(vel.x, vel.y) || 1;
    setArrow(pos, headingDeg(vel.x / sp, vel.y / sp));

    if (pos.x < -250 || pos.x > W + 250 || pos.y < -300 || pos.y > H + 250) return onMiss();
    requestAnimationFrame(step);
  }

  function onMiss() {
    state = "resetting";
    hint.textContent = "So close! Try again 💘";
    setTimeout(() => {
      state = "idle";
      layout();                                  // also picks up any size change
      draw(B, 0);
    }, 600);
  }

  function onHit(tip) {
    state = "hit";
    hint.textContent = "Right in the heart! 💘";
    letter.classList.add("hit");

    // wobble the stuck arrow
    const sp = Math.hypot(vel.x, vel.y) || 1;
    const base = headingDeg(vel.x / sp, vel.y / sp);
    const t0 = performance.now();
    (function wobble(now) {
      const t = now - t0;
      if (t < 500) {
        setArrow(pos, base + Math.sin(t * 0.06) * (1 - t / 500) * 5);
        requestAnimationFrame(wobble);
      }
    })(t0);

    const sr = stage.getBoundingClientRect();
    burstHearts(sr.left + tip.x, sr.top + tip.y, 28);

    // fade out, then switch to the card page
    setTimeout(() => document.body.classList.add("fade-out"), 900);
    setTimeout(showCard, 1500);
  }

  /* ---------- page switch: game -> card page ----------
     Both "pages" live inside index.html, so no second file is needed. */
  function showCard(push = true) {
    const homeView = document.getElementById("homeView");
    const cardView = document.getElementById("cardView");
    if (!homeView || !cardView) {            // old index.html without the card view
      window.location.href = CONFIG.cardPage;
      return;
    }
    homeView.classList.add("hidden");
    cardView.classList.remove("hidden");
    document.body.className = "cardpage";    // also drops the fade-out, so the card fades in
    window.scrollTo(0, 0);
    if (push) {
      try { history.pushState({ view: "card" }, "", "#card"); } catch (e) {}
    }
  }
  window.showCardPage = showCard;

  if (location.hash === "#card") showCard(false);        // refresh / direct link
  window.addEventListener("popstate", () => {            // browser Back -> game again
    if (location.hash !== "#card") location.reload();
  });

  window.addEventListener("resize", layout);
  window.addEventListener("orientationchange", () => setTimeout(layout, 250));
  layout();
})();