/* ============================================================
   EDIT THIS FILE to personalise the gift.
   Put your photos in an "images" folder next to the html files.
   ============================================================ */
const CONFIG = {
  // Photo inside card 1 and card 2 (change these any time)
  image1: "images/Belugay.webp",
  image2: "images/photo2.jpg",

  // Page opened when the arrow hits the letter
  cardPage: "card.html",

  // Message shown after she presses YES
  winTitle: "I KNEW IT! Happy 4 Month Anniversary, my love 💖",
  winText:
    "One year down, forever to go. Thank you for being my favourite person, " +
    "my best bug-free feature, and the reason my life compiles without errors. " +
    "I love you.  — Your CSE boy",
};

/* ---------- shared helpers ---------- */

// Burst of little hearts at viewport position (x, y)
function burstHearts(x, y, n = 22) {
  const icons = ["💖", "💘", "💗", "❤️", "💕", "✨"];
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    s.className = "burst-heart";
    s.textContent = icons[Math.floor(Math.random() * icons.length)];
    const ang = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 160;
    s.style.left = x + "px";
    s.style.top = y + "px";
    s.style.setProperty("--dx", Math.cos(ang) * dist + "px");
    s.style.setProperty("--dy", Math.sin(ang) * dist - 40 + "px");
    s.style.fontSize = 14 + Math.random() * 18 + "px";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1100);
  }
}

// Soft floating hearts in the background
function floatingHearts(count = 18) {
  const layer = document.createElement("div");
  layer.className = "bg-hearts";
  for (let i = 0; i < count; i++) {
    const s = document.createElement("span");
    s.textContent = "❤";
    s.style.left = Math.random() * 100 + "%";
    s.style.fontSize = 12 + Math.random() * 26 + "px";
    s.style.animationDuration = 9 + Math.random() * 10 + "s";
    s.style.animationDelay = -Math.random() * 15 + "s";
    layer.appendChild(s);
  }
  document.body.prepend(layer);
}
floatingHearts();