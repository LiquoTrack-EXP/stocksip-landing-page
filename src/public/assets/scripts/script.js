"use strict";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* ======================== SCROLL PROGRESS BAR ======================== */

function initProgressBar() {
  if (prefersReducedMotion) return;

  const bar = document.createElement("div");
  bar.className = "progress-bar";
  document.body.appendChild(bar);

  let ticking = false;

  window.addEventListener("scroll", () => {
    if (ticking) return;
    window.requestAnimationFrame(() => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      bar.style.transform = `scaleX(${progress})`;
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
}

/* ======================== CURSOR GLOW ======================== */

function initCursorGlow() {
  if (prefersReducedMotion) return;

  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  document.body.appendChild(glow);

  let mouseX = 0;
  let mouseY = 0;
  let glowX = 0;
  let glowY = 0;
  let raf;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    const el = document.elementFromPoint(mouseX, mouseY);
    const inDark = el?.closest(".bg-top") !== null;
    glow.style.opacity = inDark ? "1" : "0";
  }, { passive: true });

  function animateGlow() {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    glow.style.left = `${glowX}px`;
    glow.style.top = `${glowY}px`;
    raf = requestAnimationFrame(animateGlow);
  }

  animateGlow();
}

/* ======================== HEADER SCROLL ======================== */

function initHeaderScroll() {
  const header = document.querySelector("header");
  if (!header) return;

  let lastY = 0;
  let ticking = false;

  function update() {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 60);
    lastY = y;
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
}

/* ======================== INTERSECTION ANIMATIONS ======================== */

function initIntersectionAnimations() {
  const animClasses = [
    ".animate-fade-up",
    ".animate-fade-down",
    ".animate-scale",
    ".animate-slide-left",
    ".animate-slide-right",
  ];

  const targets = document.querySelectorAll(animClasses.join(", "));
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        const cleanup = () => {
          entry.target.style.willChange = "auto";
          entry.target.removeEventListener("transitionend", cleanup);
        };
        entry.target.addEventListener("transitionend", cleanup, { once: true });

        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ======================== COUNTER ANIMATION ======================== */

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateCounter(el, target, duration = 1600, prefix = "", suffix = "") {
  if (prefersReducedMotion) {
    el.textContent = `${prefix}${target}${suffix}`;
    return;
  }

  const start = performance.now();

  const update = (currentTime) => {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    const value = Math.floor(eased * target);
    el.textContent = `${prefix}${value}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = `${prefix}${target}${suffix}`;
    }
  };

  requestAnimationFrame(update);
}

function initCounters() {
  if (prefersReducedMotion) {
    document.querySelectorAll("[data-counter]").forEach((el) => {
      const target = Number(el.dataset.target || "0");
      const prefix = el.dataset.prefix || "";
      const suffix = el.dataset.suffix || "";
      el.textContent = `${prefix}${target}${suffix}`;
    });
    return;
  }

  const countersObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.querySelectorAll("[data-counter]").forEach((el) => {
          const target = Number(el.dataset.target || "0");
          const prefix = el.dataset.prefix || "";
          const suffix = el.dataset.suffix || "";
          const delay = Number(el.dataset.delay || "0");

          setTimeout(() => {
            animateCounter(el, target, 1600, prefix, suffix);
          }, delay);
        });

        countersObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.25 }
  );

  document
    .querySelectorAll("[data-counters], [data-plan-counters]")
    .forEach((el) => countersObserver.observe(el));
}

/* ======================== DRAWER ======================== */

function initDrawer() {
  const hamburger = document.querySelector(".hamburger");
  const overlay   = document.querySelector("[data-drawer-overlay]");
  const drawer    = document.getElementById("drawer");
  const closeBtn  = document.querySelector("[data-drawer-close]");

  if (!hamburger || !overlay || !drawer || !closeBtn) return;

  function openDrawer() {
    overlay.classList.add("open");
    drawer.classList.add("open");
    hamburger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    setTimeout(() => closeBtn.focus(), 50);
  }

  function closeDrawer() {
    overlay.classList.remove("open");
    drawer.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  hamburger.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);

  document.querySelectorAll("[data-drawer-link]").forEach((a) => {
    a.addEventListener("click", closeDrawer);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) {
      closeDrawer();
      hamburger.focus();
    }
  });
}

/* ======================== FAQ ======================== */

function initFaq() {
  const faq = document.querySelector("[data-faq]");
  if (!faq) return;

  faq.querySelectorAll(".faq-item").forEach((item, index) => {
    const q = item.querySelector(".faq-q");
    const a = item.querySelector(".faq-a");
    if (!q || !a) return;

    // Set up ARIA
    const answerId = `faq-answer-${index}`;
    a.id = answerId;
    q.setAttribute("aria-expanded", "false");
    q.setAttribute("aria-controls", answerId);
    a.setAttribute("aria-hidden", "true");

    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      faq.querySelectorAll(".faq-item.open").forEach((openItem) => {
        const openA = openItem.querySelector(".faq-a");
        const openQ = openItem.querySelector(".faq-q");
        openItem.classList.remove("open");
        if (openA) { openA.style.maxHeight = "0px"; openA.setAttribute("aria-hidden", "true"); }
        if (openQ) openQ.setAttribute("aria-expanded", "false");
      });

      if (!isOpen) {
        item.classList.add("open");
        a.style.maxHeight = `${a.scrollHeight}px`;
        a.setAttribute("aria-hidden", "false");
        q.setAttribute("aria-expanded", "true");
      }
    });
  });
}

/* ======================== CAROUSEL ======================== */

function initCarousel() {
  const carousel = document.querySelector("[data-carousel]");
  if (!carousel) return;

  const track  = carousel.querySelector("[data-carousel-track]");
  const slides = Array.from(carousel.querySelectorAll("[data-slide]"));
  const dotsWrap = carousel.querySelector("[data-dots]");
  const prev   = carousel.querySelector("[data-prev]");
  const next   = carousel.querySelector("[data-next]");

  if (!track || slides.length === 0) return;

  let index  = 0;
  let timer  = null;
  let startX = 0;
  let dragging = false;

  function setActive(i) {
    index = ((i % slides.length) + slides.length) % slides.length;
    track.style.transform = `translateX(${-100 * index}%)`;

    slides.forEach((s, si) => {
      s.classList.toggle("is-active", si === index);
    });

    if (dotsWrap) {
      dotsWrap.querySelectorAll(".dot").forEach((d, di) => {
        d.classList.toggle("active", di === index);
        d.setAttribute("aria-selected", String(di === index));
      });
    }
  }

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `dot${i === 0 ? " active" : ""}`;
      b.setAttribute("aria-label", `Ir a slide ${i + 1}`);
      b.setAttribute("aria-selected", String(i === 0));
      b.addEventListener("click", () => {
        setActive(i);
        stopAutoplay();
        if (!prefersReducedMotion) startAutoplay();
      });
      dotsWrap.appendChild(b);
    });
  }

  function startAutoplay() {
    stopAutoplay();
    timer = window.setInterval(() => setActive(index + 1), 5000);
  }

  function stopAutoplay() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function onPointerDown(e) {
    startX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    dragging = true;
    stopAutoplay();
  }

  function onPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    const endX = e.type === "touchend" ? e.changedTouches[0].clientX : e.clientX;
    const diff = startX - endX;

    if (Math.abs(diff) > 40) {
      setActive(diff > 0 ? index + 1 : index - 1);
    }

    if (!prefersReducedMotion) startAutoplay();
  }

  carousel.addEventListener("touchstart", onPointerDown, { passive: true });
  carousel.addEventListener("touchend", onPointerUp, { passive: true });
  carousel.addEventListener("mousedown", onPointerDown);
  window.addEventListener("mouseup", onPointerUp);

  buildDots();
  setActive(0);

  if (!prefersReducedMotion) startAutoplay();

  prev?.addEventListener("click", () => {
    setActive(index - 1);
    stopAutoplay();
    if (!prefersReducedMotion) startAutoplay();
  });

  next?.addEventListener("click", () => {
    setActive(index + 1);
    stopAutoplay();
    if (!prefersReducedMotion) startAutoplay();
  });

  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", () => {
    if (!prefersReducedMotion) startAutoplay();
  });

  carousel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { setActive(index - 1); stopAutoplay(); }
    if (e.key === "ArrowRight") { setActive(index + 1); stopAutoplay(); }
  });
}

/* ======================== PARALLAX ======================== */

function initParallax() {
  if (prefersReducedMotion) return;

  const hero = document.querySelector(".hero");
  if (!hero) return;

  let ticking = false;

  window.addEventListener("scroll", () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      hero.style.setProperty("--parallax-y", `${y * 0.15}px`);
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
}

/* ======================== YEAR ======================== */

function initYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
}

/* ======================== HERO WORD CLEANUP ======================== */

function initHeroWordCleanup() {
  document.querySelectorAll(".hero-headline .word").forEach((w) => {
    w.addEventListener(
      "animationend",
      () => { w.style.willChange = "auto"; },
      { once: true }
    );
  });
}

/* ======================== SMOOTH ANCHOR LINKS ======================== */

function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const targetId = anchor.getAttribute("href");
      if (targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  });
}

/* ======================== MAGNETIC BUTTONS ======================== */

function initMagneticButtons() {
  if (prefersReducedMotion) return;

  document.querySelectorAll(".btn-primary, .btn-dark").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const strength = 0.22;
      btn.style.transform = `translate(${x * strength}px, ${y * strength}px) translateY(-2px) scale(1.01)`;
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
}

/* ======================== STAT CARD HOVER RIPPLE ======================== */

function initStatRipple() {
  if (prefersReducedMotion) return;

  document.querySelectorAll(".stat").forEach((stat) => {
    stat.addEventListener("click", (e) => {
      const ripple = document.createElement("span");
      const rect   = stat.getBoundingClientRect();

      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        width: 10px;
        height: 10px;
        background: rgba(229, 62, 62, 0.25);
        transform: scale(0);
        animation: ripple-expand 0.55s ease-out forwards;
        left: ${e.clientX - rect.left - 5}px;
        top: ${e.clientY - rect.top - 5}px;
        pointer-events: none;
      `;

      stat.style.position = "relative";
      stat.style.overflow = "hidden";
      stat.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });

  if (!document.getElementById("ripple-style")) {
    const s = document.createElement("style");
    s.id = "ripple-style";
    s.textContent = `@keyframes ripple-expand {
      to { transform: scale(20); opacity: 0; }
    }`;
    document.head.appendChild(s);
  }
}

/* ======================== CARD TILT ======================== */

function initCardTilt() {
  if (prefersReducedMotion) return;

  document.querySelectorAll(".card, .quote").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      const tiltX = y * -4;
      const tiltY = x *  4;
      card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.style.transition = "transform 0.4s ease";
      setTimeout(() => { card.style.transition = ""; }, 400);
    });
  });
}

/* ======================== ACTIVE NAV LINK ======================== */

function initActiveNav() {
  const sections = Array.from(document.querySelectorAll("section[id]"));
  const navLinks = Array.from(document.querySelectorAll(".nav a, .drawer nav a"));
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((link) => {
          const href = link.getAttribute("href");
          link.style.color = href === `#${id}`
            ? "rgba(255,255,255,0.95)"
            : "";
        });
      });
    },
    { rootMargin: "-30% 0px -60% 0px" }
  );

  sections.forEach((s) => observer.observe(s));
}

/* ======================== INIT ======================== */

function initApp() {
  initProgressBar();
  initCursorGlow();
  initHeaderScroll();
  initDrawer();
  initIntersectionAnimations();
  initCounters();
  initFaq();
  initCarousel();
  initParallax();
  initYear();
  initHeroWordCleanup();
  initSmoothAnchors();
  initMagneticButtons();
  initStatRipple();
  initCardTilt();
  initActiveNav();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}