/* ===================================
   Some behaviour (plain JS, no dependencies) for landing page
   Colour theme is picked w a tiny script in <head> (index.html), 
   so the page never flashes the wrong colours.
   ================================ */

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

/* -----------------------------------
   Wordmark: one line per word, letters natural spacing.
   Line width / overlap are set in styles.css (.wordmark).
   ----------------------------------------------- */
const wordmark = document.getElementById("wordmark");
const label = wordmark.textContent.trim();
wordmark.setAttribute("aria-label", label);
wordmark.textContent = "";

const lines = label.split(/\s+/).map((word) => {
  const line = document.createElement("span");
  line.className = "wordmark__line";
  line.setAttribute("aria-hidden", "true");
  [...word].forEach((ch) => {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = ch;
    line.appendChild(span);
  });
  wordmark.appendChild(line);
  return line;
});
const letters = [...wordmark.querySelectorAll(".char")];

function fitWordmark() {
  const ref = 100;
  wordmark.style.fontSize = ref + "px";
  // Natural width of the widest word at the reference size
  const natural = Math.max(
    ...lines.map((line) => line.getBoundingClientRect().width),
  );
  // The widest word fills --line-width (or the full width for a single word)
  const fraction =
    lines.length > 1
      ? parseFloat(
          getComputedStyle(wordmark).getPropertyValue("--line-width"),
        ) / 100
      : 1;
  wordmark.style.fontSize =
    ref * ((wordmark.clientWidth * fraction) / natural) * 0.98 + "px";
}

fitWordmark();
window.addEventListener("resize", fitWordmark);
if (document.fonts) document.fonts.ready.then(fitWordmark);

/* --------------------------
   Click a letter to change the colour theme
   THEME_LETTER: 'all' so that every letter is clickable, or specify a letter's index (start at 0, counting across the whole name) to make only a single letter clickable.
   ------------------------------------- */
const THEME_LETTER = "all";
const THEMES = window.SITE_THEMES || [];

function nextTheme() {
  const root = document.documentElement;
  const i = THEMES.indexOf(root.dataset.theme);
  root.dataset.theme = THEMES[(i + 1) % THEMES.length];
}

const themeLetters =
  THEME_LETTER === "all" ? letters : [letters[THEME_LETTER]].filter(Boolean);

themeLetters.forEach((el) => {
  el.classList.add("is-clickable");
  el.addEventListener("click", () => {
    resetWiggle();
    if (reduceMotion) {
      nextTheme();
      return;
    }
    el.animate([{ opacity: 1 }, { opacity: 0.25 }, { opacity: 1 }], {
      duration: 250,
      iterations: 2,
      easing: "ease-in-out",
    }).finished.then(nextTheme);
  });
});

/* --------------------------------------------------------------------------
   Wiggle: every few seconds a random letter wiggles (a hint it's alive). Set WIGGLE_EVERY to 0 to turn it off.
   -------------------------------------------------------------------------- */
const WIGGLE_EVERY = 7000; // milliseconds
let wiggleTimer, wiggleRestart;

function wiggle() {
  if (document.hidden || reduceMotion) return;
  const el = pool[Math.floor(Math.random() * pool.length)];
  const frames = [];
  for (let k = 0; k <= 10; k++) {
    const amt = k === 0 || k === 10 ? 0 : (k % 2 ? 1 : -1) * (1 - k / 10);
    frames.push({
      transform: `rotate(${7.5 * amt}deg) skewX(${3.75 * amt}deg)`,
    });
  }
  el.animate(frames, { duration: 1000, easing: "linear" });
}

function startWiggle() {
  if (WIGGLE_EVERY > 0) wiggleTimer = setInterval(wiggle, WIGGLE_EVERY);
}
function resetWiggle() {
  // pause a little after a click
  clearInterval(wiggleTimer);
  clearTimeout(wiggleRestart);
  wiggleRestart = setTimeout(startWiggle, WIGGLE_EVERY * 1.5);
}
startWiggle();

/* ---------------------------
   Nav pills: sliding bead follows hover, rests on the active item
   --------------------------------- */
const pills = document.getElementById("nav-pills");
const items = [...pills.querySelectorAll(".pills__item")];
const bead = document.createElement("li");
bead.className = "pills__bead";
bead.setAttribute("aria-hidden", "true");
pills.appendChild(bead);

const activeItem = () =>
  items.find((li) => li.classList.contains("is-active")) || items[0];

function moveBead(target, animate = true) {
  if (!animate) bead.style.transition = "none";
  bead.style.width = target.offsetWidth + "px";
  bead.style.transform = `translateX(${target.offsetLeft}px)`;
  items.forEach((li) => li.classList.toggle("is-current", li === target));
  if (!animate) {
    bead.offsetWidth;
    bead.style.transition = "";
  }
}

items.forEach((li) => {
  li.addEventListener("mouseenter", () => moveBead(li));
  li.querySelector("a").addEventListener("focus", () => moveBead(li));
});
pills.addEventListener("mouseleave", () => moveBead(activeItem()));
pills.addEventListener("focusout", (e) => {
  if (!pills.contains(e.relatedTarget)) moveBead(activeItem());
});
window.addEventListener("resize", () => moveBead(activeItem(), false));
moveBead(activeItem(), false);
if (document.fonts)
  document.fonts.ready.then(() => moveBead(activeItem(), false));

/* ------------------------
   Header: hide on scroll down, show on scroll up / near top / at bottom
   -------------------------------- */
const header = document.getElementById("site-header");
const toTop = document.getElementById("to-top");
let lastY = scrollY;

function updateToTop() {
  if (!toTop) return;
  const show = scrollY > 50;
  toTop.classList.toggle("is-visible", show);
  toTop.tabIndex = show ? 0 : -1;
}

addEventListener(
  "scroll",
  () => {
    const y = scrollY;
    const nearTop = y < 50;
    const nearBottom = innerHeight + y + 25 >= document.body.scrollHeight;
    if (y - lastY > 50) {
      header.classList.add("is-hidden");
      lastY = y;
    } else if (lastY - y > 50) {
      header.classList.remove("is-hidden");
      lastY = y;
    }
    if (nearTop || nearBottom) header.classList.remove("is-hidden");
    updateToTop();
  },
  { passive: true },
);

if (toTop) {
  toTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
}
updateToTop();

/* ---------------
   Footer year
   ----------------------- */
document.getElementById("year").textContent = new Date().getFullYear();
