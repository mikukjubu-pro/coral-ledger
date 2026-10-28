const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

// menu
const menu = $(".menu-btn"), nav = $("#nav");
menu?.addEventListener("click", () => menu.setAttribute("aria-expanded", nav.classList.toggle("open")));
$$("#nav a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));

// header + progress bar
const header = $(".header"), bar = $(".progress");
const onScroll = () => {
  header.classList.toggle("scrolled", scrollY > 10);
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
};
addEventListener("scroll", onScroll, {passive: true}); onScroll();

// headline: one span per word, revealed one after another
$$("[data-split]").forEach((h) => {
  let i = 0;
  const wrap = (node) => [...node.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((t) => {
        if (!t) return;
        if (/^\s+$/.test(t)) return frag.append(" ");
        const s = document.createElement("span"); s.className = "w"; s.style.setProperty("--i", i++); s.textContent = t; frag.append(s);
      });
      n.replaceWith(frag);
    } else wrap(n);
  });
  wrap(h);
});

// bill calendar dots
$$("[data-cal]").forEach((c) => {
  const dots = {3: 0, 8: .6, 12: 1.2, 17: 1.8, 23: 2.4, 26: 3};
  for (let d = 0; d < 28; d++) {
    const i = document.createElement("i");
    if (d in dots) { i.className = "dot"; i.style.setProperty("--dd", dots[d] + "s"); }
    c.append(i);
  }
});

// light ribbons behind the lower sections too
const rib = $(".hero .ribbons");
if (rib) ["#how", "#faq"].forEach((id) => { const c = rib.cloneNode(true); c.classList.add("alt"); c.querySelectorAll("defs").forEach((d) => d.remove()); $(id)?.prepend(c); });

// marquee: copy the row once so it loops without a gap
$$("[data-dup]").forEach((t) => t.innerHTML += t.innerHTML);

// numbers that count up
const countUp = (el) => {
  const end = +el.dataset.count, pre = el.dataset.prefix || "", suf = el.dataset.suffix || "", t0 = performance.now();
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / 1800), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
    el.textContent = pre + v.toLocaleString("en-US") + suf;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
setTimeout(() => {
  $$("[data-count]").forEach(countUp);
  $$(".donut .val").forEach((c) => { const len = 2 * Math.PI * 32; c.style.strokeDasharray = `${len * c.dataset.pct / 100} ${len}`; });
}, 1200);

// reveal on scroll
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), {threshold: .15});
$$(".reveal").forEach((el) => io.observe(el));

// hero: cards follow the mouse, and drift on their own when the mouse is still
const stage = $("#stage");
if (stage && !calm) {
  const layers = $$("[data-depth]", stage);
  let tx = 0, ty = 0, x = 0, y = 0, last = 0;
  addEventListener("pointermove", (e) => { tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1; last = performance.now(); });
  const loop = (t) => {
    if (t - last > 2500) { tx = Math.sin(t / 2200) * .8; ty = Math.cos(t / 3100) * .6; }
    x += (tx - x) * .06; y += (ty - y) * .06;
    layers.forEach((l) => {
      const d = +l.dataset.depth;
      l.style.transform = l.classList.contains("laptop")
        ? `rotateY(${x * 7}deg) rotateX(${-y * 5}deg) translate3d(${x * d}px, ${y * d}px, 0)`
        : `translate3d(${x * d}px, ${y * d}px, 0)`;
    });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// glow that follows the cursor
const glow = $(".glow-cursor");
addEventListener("pointermove", (e) => { glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; });
glow.style.transform = `translate(${innerWidth * .7}px, ${innerHeight * .3}px)`;

// 3D tilt + light on cards
$$(".card, .tilt").forEach((c) => {
  c.addEventListener("pointerenter", () => { c.style.transition = "transform .2s ease-out, opacity 1s"; });
  c.addEventListener("pointermove", (e) => {
    const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    c.style.transform = `perspective(900px) rotateY(${(px - .5) * 14}deg) rotateX(${(.5 - py) * 12}deg) translateY(-6px)`;
    c.style.setProperty("--gx", px * 100 + "%"); c.style.setProperty("--gy", py * 100 + "%");
  });
  c.addEventListener("pointerleave", () => { c.style.transition = "transform .7s cubic-bezier(.2,.8,.2,1), opacity 1s"; c.style.transform = ""; });
});

// FAQ: smooth open/close
$$(".faq details").forEach((d) => {
  const ans = $(".ans", d);
  $("summary", d).addEventListener("click", (e) => {
    e.preventDefault();
    if (d.open) {
      ans.style.height = ans.scrollHeight + "px";
      requestAnimationFrame(() => { ans.style.height = "0px"; });
      ans.addEventListener("transitionend", () => { d.open = false; }, {once: true});
    } else {
      d.open = true; ans.style.height = "0px";
      requestAnimationFrame(() => { ans.style.height = ans.scrollHeight + "px"; });
    }
  });
});
$(".js-allfaq")?.addEventListener("click", (e) => {
  const all = $(".faq").classList.toggle("all");
  e.currentTarget.firstChild.textContent = all ? "Show Fewer " : "View All FAQs ";
});

// forms (example site: nothing is sent)
$$(".js-free").forEach((f) => f.addEventListener("submit", (e) => { e.preventDefault(); $(".thanks", f).classList.add("show"); }));

// contact modal
const modal = $("#contact");
$$(".js-contact").forEach((b) => b.addEventListener("click", () => modal.classList.add("open")));
$$(".js-close").forEach((b) => b.addEventListener("click", () => modal.classList.remove("open")));
modal?.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("open"); });
addEventListener("keydown", (e) => { if (e.key === "Escape") modal?.classList.remove("open"); });
