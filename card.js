/* ============================================================
   Card page: the NO button runs away, shrinks, then vanishes
   ============================================================ */
(() => {
  const card1 = document.getElementById("card1");
  const card2 = document.getElementById("card2");
  const yes   = document.getElementById("yes");
  const no    = document.getElementById("no");
  const win   = document.getElementById("win");

  const MAX_ATTEMPTS = 8;      // the 8th attempt makes NO vanish
  let attempts = 0;
  let locked = false;          // stops one gesture counting twice
  let celebrating = null;

  /* (switching from the game to this card page is done in home.js) */

  /* ---------- load images from config.js ---------- */
  document.querySelectorAll(".photo").forEach((box) => {
    const img = box.querySelector("img");
    const src = CONFIG[box.dataset.img];
    if (!src) return;
    img.onload = () => box.classList.add("loaded");
    img.onerror = () => box.classList.remove("loaded");   // keep the placeholder
    img.src = src;
  });

  /* ---------- the runaway NO button ---------- */
  function attemptNo(e) {
    if (e) e.preventDefault();
    if (locked || attempts >= MAX_ATTEMPTS) return;
    locked = true;
    setTimeout(() => (locked = false), 400);

    attempts++;
    if (attempts >= MAX_ATTEMPTS) return vanishNo();

    // 1) shrink a bit more each time, and let YES grow
    no.style.setProperty("--s", (1 - attempts * 0.1).toFixed(2));
    yes.style.transform = `scale(${1 + attempts * 0.05})`;

    // 2) jump to a random spot inside the card
    moveNoRandomly();
  }

  function moveNoRandomly() {
    // first time: take it out of the flow, but keep it exactly where it is
    if (!no.classList.contains("floating")) {
      no.style.left = no.offsetLeft + "px";
      no.style.top = no.offsetTop + "px";
      no.classList.add("floating");
      void no.offsetWidth;                         // force reflow so the move animates
    }

    const cw = card1.clientWidth, ch = card1.clientHeight;
    const bw = no.offsetWidth,   bh = no.offsetHeight;
    const cr = card1.getBoundingClientRect();
    const yr = yes.getBoundingClientRect();
    const yesBox = { l: yr.left - cr.left, t: yr.top - cr.top, r: yr.right - cr.left, b: yr.bottom - cr.top };

    const margin = 12;
    let x = margin, y = margin;
    for (let i = 0; i < 30; i++) {                 // try not to land on top of YES
      x = margin + Math.random() * Math.max(cw - bw - margin * 2, 0);
      y = margin + Math.random() * Math.max(ch - bh - margin * 2, 0);
      const overlap = x < yesBox.r + 10 && x + bw > yesBox.l - 10 && y < yesBox.b + 10 && y + bh > yesBox.t - 10;
      if (!overlap) break;
    }
    no.style.left = x + "px";
    no.style.top = y + "px";
  }

  function vanishNo() {
    no.classList.add("vanish");
    setTimeout(() => (no.style.display = "none"), 450);
    yes.style.transform = "scale(1.35)";
    setTimeout(revealCard2, 500);
  }

  // slide the second card in next to (or, on phones, below) the first
  function revealCard2() {
    const first = card1.getBoundingClientRect();
    card2.classList.remove("hidden");
    const lastPos = card1.getBoundingClientRect();
    card1.animate(
      [{ transform: `translate(${first.left - lastPos.left}px, ${first.top - lastPos.top}px)` }, { transform: "none" }],
      { duration: 700, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
    card2.animate(
      [{ opacity: 0, transform: "translateX(70px) scale(.9)" }, { opacity: 1, transform: "none" }],
      { duration: 800, delay: 150, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" }
    );

    // on a narrow screen card 2 lands below card 1 -> scroll it into view
    setTimeout(() => {
      const a = card1.getBoundingClientRect();
      const b = card2.getBoundingClientRect();
      if (b.top >= a.bottom - 4) card2.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 900);
  }

  // mouse hover, touch, and keyboard all count as an "attempt"
  no.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") attemptNo(e); });
  no.addEventListener("pointerdown", attemptNo);               // touch / pen / mouse press
  no.addEventListener("click", (e) => {
    e.preventDefault();
    if (e.detail === 0) attemptNo(e);                          // keyboard activation only
  });

  /* ---------- YES ---------- */
  yes.addEventListener("click", () => {
    document.getElementById("winTitle").textContent = CONFIG.winTitle;
    document.getElementById("winText").textContent = CONFIG.winText;
    win.classList.remove("hidden");

    const burst = () =>
      burstHearts(Math.random() * innerWidth, innerHeight * (0.2 + Math.random() * 0.6), 14);
    burst();
    celebrating = setInterval(burst, 450);
  });

  document.getElementById("again").addEventListener("click", () => {
    clearInterval(celebrating);
    try { location.hash = ""; } catch (e) {}
    setTimeout(() => location.reload(), 50);
  });
})();