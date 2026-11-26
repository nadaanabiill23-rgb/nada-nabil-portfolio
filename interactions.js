/* interactions.js: all site interactivity, plain JavaScript, no libraries.
   1. Case filter (home)        2. How-I-work explorer (home)
   3. Collapsible case sections (case pages)   4. Scroll reveals
   The experience timeline uses <details> in the HTML, so it needs no script. */
(function () {
  var doc = document;
  doc.documentElement.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1. Case filter ------------------------------------------------ */
  var filterBar = doc.querySelector(".filter-bar");
  if (filterBar) {
    var buttons = [].slice.call(filterBar.querySelectorAll("[data-filter]"));
    var cards = [].slice.call(doc.querySelectorAll(".case-card[data-company]"));
    var count = filterBar.querySelector(".filter-count");
    var apply = function (key) {
      var shown = 0;
      cards.forEach(function (card) {
        var on = key === "all" || card.getAttribute("data-company") === key;
        card.hidden = !on;
        if (on) shown += 1;
      });
      buttons.forEach(function (b) {
        var active = b.getAttribute("data-filter") === key;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
      });
      if (count) count.textContent = shown + (shown === 1 ? " case study" : " case studies");
    };
    buttons.forEach(function (b) {
      b.addEventListener("click", function () { apply(b.getAttribute("data-filter")); });
    });
    apply("all");
  }

  /* 2. How-I-work explorer (tabs) -------------------------------- */
  doc.querySelectorAll("[data-explorer]").forEach(function (box) {
    var tabs = [].slice.call(box.querySelectorAll('[role="tab"]'));
    var panels = [].slice.call(box.querySelectorAll('[role="tabpanel"]'));
    var select = function (i, focus) {
      tabs.forEach(function (t, n) {
        var on = n === i;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        panels[n].hidden = !on;
      });
      if (focus) tabs[i].focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i, false); });
      t.addEventListener("keydown", function (e) {
        var k = e.key, n = tabs.length;
        if (k === "ArrowRight") { e.preventDefault(); select((i + 1) % n, true); }
        else if (k === "ArrowLeft") { e.preventDefault(); select((i - 1 + n) % n, true); }
        else if (k === "Home") { e.preventDefault(); select(0, true); }
        else if (k === "End") { e.preventDefault(); select(n - 1, true); }
      });
    });
    select(0, false);
  });

  /* 3. Collapsible sections on case pages ------------------------ */
  var content = doc.querySelector(".detail-content");
  if (content) {
    var sections = [].slice.call(content.children).filter(function (el) {
      return el.tagName === "SECTION" && el.id && el.querySelector(":scope > h2");
    });
    var open = function (sec, state) {
      var btn = sec.querySelector(".sec-toggle");
      var body = sec.querySelector(".sec-body");
      btn.setAttribute("aria-expanded", state ? "true" : "false");
      body.hidden = !state;
      sec.classList.toggle("is-collapsed", !state);
    };
    sections.forEach(function (sec, i) {
      var h = sec.querySelector(":scope > h2");
      var body = doc.createElement("div");
      body.className = "sec-body";
      body.id = sec.id + "-body";
      while (h.nextSibling) body.appendChild(h.nextSibling);
      sec.appendChild(body);
      var btn = doc.createElement("button");
      btn.type = "button";
      btn.className = "sec-toggle";
      btn.setAttribute("aria-controls", body.id);
      btn.innerHTML = h.innerHTML + '<span class="sec-chev" aria-hidden="true"></span>';
      h.innerHTML = "";
      h.appendChild(btn);
      btn.addEventListener("click", function () {
        open(sec, btn.getAttribute("aria-expanded") !== "true");
      });
      open(sec, i < 2 || sec.id === "outcome");
    });
    var bar = doc.createElement("div");
    bar.className = "sec-tools";
    bar.innerHTML = '<button type="button" data-all="open">Expand all</button><button type="button" data-all="close">Collapse all</button>';
    content.insertBefore(bar, content.firstChild);
    bar.addEventListener("click", function (e) {
      var t = e.target.closest("button[data-all]");
      if (!t) return;
      sections.forEach(function (s) { open(s, t.getAttribute("data-all") === "open"); });
    });
    var reveal = function () {
      var id = decodeURIComponent(location.hash.slice(1));
      var sec = sections.filter(function (s) { return s.id === id; })[0];
      if (sec) { open(sec, true); sec.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
    };
    window.addEventListener("hashchange", reveal);
    doc.querySelectorAll(".detail-toc a").forEach(function (a) {
      a.addEventListener("click", function () { setTimeout(reveal, 0); });
    });
    if (location.hash) reveal();
    window.addEventListener("beforeprint", function () { sections.forEach(function (s) { open(s, true); }); });
  }
  window.addEventListener("beforeprint", function () {
    doc.querySelectorAll("details").forEach(function (d) { d.open = true; });
    doc.querySelectorAll("[data-explorer] [role=tabpanel]").forEach(function (p) { p.hidden = false; });
  });

  /* 4. Scroll reveals -------------------------------------------- */
  var targets = [].slice.call(doc.querySelectorAll(".fade-up, .stagger-child, .case-strip, .figure-slot"));
  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    targets.forEach(function (el) {
      /* Already on screen: show it at once. Below the fold: fade it in when reached. */
      if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add("in"); return; }
      el.classList.add("reveal");
      io.observe(el);
    });
  }
})();
