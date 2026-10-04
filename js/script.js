document.addEventListener("DOMContentLoaded", function () {
  /* ---------- Header shadow on scroll ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var applyHeaderShadow = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    applyHeaderShadow();
    window.addEventListener("scroll", applyHeaderShadow, { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  /* ---------- Coverage tabs (Uttar Pradesh / Bihar) ---------- */
  var coverageTabs = document.querySelectorAll(".coverage-tab-btn");
  var coveragePanels = document.querySelectorAll(".coverage-panel");
  if (coverageTabs.length && coveragePanels.length) {
    coverageTabs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = btn.getAttribute("data-target");
        var panel = document.querySelector('[data-panel="' + target + '"]');
        if (!panel) return;
        coverageTabs.forEach(function (b) {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        coveragePanels.forEach(function (p) { p.classList.remove("active"); });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        panel.classList.add("active");
      });
    });
  }

  /* ---------- Gallery lightbox ---------- */
  var lightbox = document.querySelector("#lightbox");
  if (lightbox) {
    var lightboxImg = lightbox.querySelector("img");
    var lightboxCaption = lightbox.querySelector(".lightbox-caption");
    var lastFocused = null;

    var openLightbox = function (src, alt, caption) {
      lastFocused = document.activeElement;
      lightboxImg.setAttribute("src", src);
      lightboxImg.setAttribute("alt", alt || "");
      lightboxCaption.textContent = caption || "";
      lightbox.classList.add("open");
      lightbox.querySelector(".lightbox-close").focus();
    };
    var closeLightbox = function () {
      lightbox.classList.remove("open");
      lightboxImg.removeAttribute("src");
      if (lastFocused) lastFocused.focus();
    };

    document.querySelectorAll(".gallery-item button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var img = btn.querySelector("img");
        var cap = btn.parentElement.querySelector("figcaption");
        openLightbox(img.getAttribute("src"), img.getAttribute("alt"), cap ? cap.textContent : "");
      });
    });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox || e.target.classList.contains("lightbox-close")) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lightbox.classList.contains("open")) closeLightbox();
    });
  }

  /* ---------- Forms (submitted through Netlify Forms) ---------- */
  var handleForm = function (formSelector, noteSelector, successText, buttonLabel) {
    var form = document.querySelector(formSelector);
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = document.querySelector(noteSelector);
      var button = form.querySelector("button[type='submit']");
      var show = function (text, color) {
        if (!note) return;
        note.textContent = text;
        note.style.color = color;
        note.style.display = "block";
      };
      if (button) { button.disabled = true; button.textContent = "Sending…"; }
      fetch("/api/form", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (res) {
        if (!res.ok) throw new Error("failed");
        show(successText, "var(--azure)");
        form.reset();
      }).catch(function () {
        show("This could not be submitted right now. Please email info@shikshanovafoundation.org or call +91 95595 43349.", "var(--crimson)");
      }).then(function () {
        if (button) { button.disabled = false; button.textContent = buttonLabel; }
      });
    });
  };

  handleForm("#contact-form", "#form-note",
    "Thank you. Your message has been received — we will get back to you shortly.", "Send message");
  handleForm("#volunteer-form", "#volunteer-note",
    "Thank you for volunteering. Our team will contact you about the next steps.", "Submit application");
  handleForm("#internship-form", "#internship-note",
    "Thank you. Your internship application has been received. Our team will contact you if you are shortlisted.", "Submit application");
  handleForm("#newsletter-form", "#newsletter-note",
    "You are subscribed. Our updates will reach you by email.", "Subscribe");


  /* ---------- Scroll reveal + number count-up ---------- */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealTargets = document.querySelectorAll(
      ".section-head, .card, .focus-card, .stats > div, .photo-strip figure, .timeline-item, .gallery-item, .division-card"
    );
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("in");
        revealObserver.unobserve(el);
        // remove helper classes afterwards so hover effects keep working
        setTimeout(function () { el.classList.remove("reveal", "in"); el.style.transitionDelay = ""; }, 1100);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealTargets.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = ((i % 4) * 70) + "ms";
      revealObserver.observe(el);
    });

    var counters = document.querySelectorAll("[data-count]");
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        counterObserver.unobserve(el);
        var target = parseInt(el.getAttribute("data-count"), 10);
        var start = null, duration = 1300;
        var step = function (ts) {
          if (start === null) start = ts;
          var t = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(target * eased);
          if (t < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { el.textContent = "0"; counterObserver.observe(el); });
  }

  /* ---------- Cookie notice ---------- */
  var banner = document.querySelector("#cookie-banner");
  if (banner) {
    var stored = null;
    try { stored = window.localStorage.getItem("sf-cookie-consent"); } catch (err) { stored = "seen"; }
    if (!stored) banner.classList.add("show");
    var accept = banner.querySelector("#cookie-accept");
    if (accept) {
      accept.addEventListener("click", function () {
        banner.classList.remove("show");
        try { window.localStorage.setItem("sf-cookie-consent", "accepted"); } catch (err) {}
      });
    }
  }
});
