// ============== GLOOPR — main app logic ==============
// Pure vanilla JS. No build step. Just open index.html.

(() => {
  "use strict";

  // ============== NAVBAR ==============
  const navbar = document.getElementById("navbar");
  const onScroll = () => {
    if (!navbar) return;
    if (window.scrollY > 20) navbar.classList.add("scrolled");
    else navbar.classList.remove("scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ============== CITY LABEL (single-city, no toggle needed) ==============
  // Operating only in Jaipur for now. City label is a static badge in the navbar.
  // We still honor any pre-existing localStorage entry by displaying it (one-time migration).
  const cityLabel = document.getElementById("city-label");
  const cityLabelMobile = document.getElementById("city-label-mobile");
  const storedCity = (() => {
    try {
      return localStorage.getItem("gloopr-city") || localStorage.getItem("swassh-city");
    } catch (e) { return null; }
  })();
  // If a user had stored Kota/Indore, do nothing — UI is now fixed to Jaipur.
  // If we ever add cities back, restore the setCity/toggle logic here.

  // ============== MOBILE MENU ==============
  const mobileToggle = document.getElementById("mobile-toggle");
  mobileToggle?.addEventListener("click", () => {
    document.body.classList.toggle("mobile-open");
  });
  document.querySelectorAll(".mobile-link").forEach((a) => {
    a.addEventListener("click", () => document.body.classList.remove("mobile-open"));
  });

  // ============== SCROLL REVEAL ==============
  const revealEls = document.querySelectorAll(".reveal");
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          revealObs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
  );
  revealEls.forEach((el) => revealObs.observe(el));

  // Safety: force all above-the-fold reveals visible after a short delay
  // (in case the observer doesn't fire before the snapshot/scroll)
  setTimeout(() => {
    document.querySelectorAll(".reveal").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) el.classList.add("visible");
    });
  }, 200);

  // ============== WHATSAPP FLOAT ==============
  const waFloat = document.getElementById("wa-float");
  const updateWaFloat = () => {
    if (!waFloat) return;
    if (window.scrollY > 400) {
      waFloat.classList.remove("opacity-0", "pointer-events-none");
      waFloat.classList.add("opacity-100");
    } else {
      waFloat.classList.add("opacity-0", "pointer-events-none");
      waFloat.classList.remove("opacity-100");
    }
  };
  window.addEventListener("scroll", updateWaFloat, { passive: true });
  updateWaFloat();

  // ============== PACKAGE SELECTOR (booking form) ==============
  const pkgBtns = document.querySelectorAll(".pkg-btn");
  const pkgInput = document.querySelector('input[name="pkgId"]') || document.createElement("input");
  let selectedPkg = "deep";
  pkgBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      pkgBtns.forEach((b) => {
        b.classList.remove("bg-neon-green", "text-black", "border-neon-green");
        b.classList.add("bg-dark-card", "border-dark-border", "text-white/70");
      });
      btn.classList.add("bg-neon-green", "text-black", "border-neon-green");
      btn.classList.remove("bg-dark-card", "border-dark-border", "text-white/70");
      selectedPkg = btn.dataset.pkg;
    });
  });

  // ============== BOOKING FORM ==============
  const bookingForm = document.getElementById("booking-form");
  const bookingSuccess = document.getElementById("booking-success");
  const continueWa = document.getElementById("continue-wa");
  const bookingIdEl = document.getElementById("booking-id");
  const bookAnother = document.getElementById("book-another");

  // min date = today
  const dateInput = bookingForm?.querySelector('input[name="date"]');
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.min = today;
  }

  // phone digit-only filter
  const phoneInput = bookingForm?.querySelector('input[name="phone"]');
  phoneInput?.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
  });

  bookingForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (!validateForm()) return;

    const data = {
      city: bookingForm.city.value,
      carType: bookingForm.carType.value,
      pkg: PACKAGES[selectedPkg]?.name || selectedPkg,
      price: PACKAGES[selectedPkg]?.pricing?.[bookingForm.carType.value] || PACKAGES[selectedPkg]?.price || 0,
      date: bookingForm.date.value,
      time: bookingForm.time.value,
      name: bookingForm.name.value.trim(),
      phone: bookingForm.phone.value.trim(),
      address: bookingForm.address.value.trim(),
    };

    const id = "SW-" + Date.now().toString().slice(-6);
    bookingIdEl.textContent = id;

    const message = [
      `Hi GLOOPR! I'd like to book a car wash 🚗`,
      ``,
      `• City: ${data.city}`,
      `• Car: ${data.carType}`,
      `• Package: ${data.pkg}`,
      `• Price: ₹${data.price.toLocaleString("en-IN")}/-`,
      `• Date: ${data.date}`,
      `• Time: ${data.time}`,
      ``,
      `My details:`,
      `• Name: ${data.name}`,
      `• Phone: ${data.phone}`,
      `• Address: ${data.address}`,
    ].join("\n");

    continueWa.href = `https://wa.me/917976487789?text=${encodeURIComponent(message)}`;

    bookingForm.classList.add("hidden");
    bookingSuccess.classList.remove("hidden");
    bookingSuccess.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  bookAnother?.addEventListener("click", () => {
    bookingForm.reset();
    bookingForm.classList.remove("hidden");
    bookingSuccess.classList.add("hidden");
    // Reset package selector
    pkgBtns.forEach((b) => {
      b.classList.remove("bg-neon-green", "text-black", "border-neon-green");
      b.classList.add("bg-dark-card", "border-dark-border", "text-white/70");
    });
    const deepBtn = document.querySelector('[data-pkg="deep"]');
    if (deepBtn) deepBtn.classList.add("bg-neon-green", "text-black", "border-neon-green");
    selectedPkg = "deep";
    // Clear errors
    document.querySelectorAll('[data-error]').forEach((p) => {
      p.classList.add("hidden");
      p.textContent = "";
    });
  });

  function validateForm() {
    let ok = true;
    const setErr = (name, msg) => {
      const el = document.querySelector(`[data-error="${name}"]`);
      if (el) {
        el.textContent = msg;
        el.classList.remove("hidden");
      }
    };
    const clearErr = (name) => {
      const el = document.querySelector(`[data-error="${name}"]`);
      if (el) {
        el.textContent = "";
        el.classList.add("hidden");
      }
    };

    if (!bookingForm.date.value) { setErr("date", "Please pick a date"); ok = false; } else clearErr("date");
    if (!bookingForm.name.value.trim()) { setErr("name", "Name is required"); ok = false; } else clearErr("name");
    if (!/^[6-9]\d{9}$/.test(bookingForm.phone.value)) {
      setErr("phone", "Enter a valid 10-digit phone"); ok = false;
    } else clearErr("phone");
    if (bookingForm.address.value.trim().length < 5) {
      setErr("address", "Address looks too short"); ok = false;
    } else clearErr("address");

    return ok;
  }

  // ============== BEFORE / AFTER ==============
  const baContainer = document.getElementById("before-after");
  const baBefore = document.getElementById("ba-before");
  const baHandle = document.getElementById("ba-handle");
  let baDragging = false;
  const setBaPos = (clientX) => {
    if (!baContainer) return;
    const rect = baContainer.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(0, Math.min(100, x));
    baBefore.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
    baHandle.style.left = clamped + "%";
  };
  baContainer?.addEventListener("mousedown", (e) => { baDragging = true; setBaPos(e.clientX); });
  baContainer?.addEventListener("touchstart", (e) => { baDragging = true; setBaPos(e.touches[0].clientX); }, { passive: true });
  window.addEventListener("mousemove", (e) => { if (baDragging) setBaPos(e.clientX); });
  window.addEventListener("touchmove", (e) => { if (baDragging) setBaPos(e.touches[0].clientX); }, { passive: true });
  window.addEventListener("mouseup", () => { baDragging = false; });
  window.addEventListener("touchend", () => { baDragging = false; });

  // ============== PRICING CALCULATOR ==============
  const calcTotal = document.getElementById("calc-total");
  const calcBreakdown = document.getElementById("calc-breakdown");
  let calcPkg = "deep";
  let calcCar = "Hatchback";
  let calcAddons = new Set();
  const carBtns = document.querySelectorAll(".car-btn");
  const pkgCalcBtns = document.querySelectorAll(".pkg-calc-btn");
  const addonBtns = document.querySelectorAll(".addon-btn");
  let displayedTotal = PACKAGES[calcPkg].pricing?.Hatchback || 799;

  function updateCalc() {
    const pkgData = PACKAGES[calcPkg];
    const adjustedBase = pkgData.pricing?.[calcCar] || pkgData.price || 0;
    const addonsTotal = [...calcAddons].reduce((sum, id) => sum + (ADD_ONS[id] || 0), 0);
    const total = adjustedBase + addonsTotal;

    let breakdown = `Base ₹${adjustedBase.toLocaleString("en-IN")} (${calcCar})`;
    if (addonsTotal > 0) breakdown += ` + Add-ons ₹${addonsTotal.toLocaleString("en-IN")}`;
    calcBreakdown.textContent = breakdown;

    // animate
    const start = displayedTotal;
    const diff = total - start;
    const duration = 350;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      displayedTotal = current;
      calcTotal.textContent = "₹" + current.toLocaleString("en-IN");
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  carBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      carBtns.forEach((b) => {
        b.classList.remove("bg-neon-green", "text-black", "border-neon-green");
        b.classList.add("bg-dark-card", "border-dark-border", "text-white/70");
      });
      btn.classList.add("bg-neon-green", "text-black", "border-neon-green");
      btn.classList.remove("bg-dark-card", "border-dark-border", "text-white/70");
      calcCar = btn.dataset.car;
      updateCalc();
    });
  });

  pkgCalcBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      pkgCalcBtns.forEach((b) => {
        b.classList.remove("bg-neon-green", "text-black", "border-neon-green");
        b.classList.add("bg-dark-card", "border-dark-border", "text-white/70");
      });
      btn.classList.add("bg-neon-green", "text-black", "border-neon-green");
      btn.classList.remove("bg-dark-card", "border-dark-border", "text-white/70");
      calcPkg = btn.dataset.pkgCalc;
      updateCalc();
    });
  });

  addonBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.addon;
      const check = btn.querySelector("span span");
      if (calcAddons.has(id)) {
        calcAddons.delete(id);
        btn.classList.remove("bg-neon-cyan/10", "border-neon-cyan/40", "text-white");
        btn.classList.add("bg-dark-card", "border-dark-border", "text-white/70");
        if (check) check.textContent = "";
        check?.parentElement?.classList.remove("bg-neon-cyan", "border-neon-cyan");
        check?.parentElement?.classList.add("border-white/30");
      } else {
        calcAddons.add(id);
        btn.classList.add("bg-neon-cyan/10", "border-neon-cyan/40", "text-white");
        btn.classList.remove("bg-dark-card", "border-dark-border", "text-white/70");
        if (check) {
          check.textContent = "✓";
          check.classList.add("text-black", "text-xs");
          check.parentElement.classList.add("bg-neon-cyan", "border-neon-cyan");
          check.parentElement.classList.remove("border-white/30");
        }
      }
      updateCalc();
    });
  });

  // ============== STATS COUNTER ==============
  const counterEls = document.querySelectorAll("[data-counter]");
  const counterObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseFloat(el.dataset.counter);
        const suffix = el.dataset.suffix || "";
        const decimals = parseInt(el.dataset.decimals || "0", 10);
        const duration = 1500;
        const startTime = Date.now();
        const tick = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = target * eased;
          el.textContent = current.toFixed(decimals) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        };
        tick();
        counterObs.unobserve(el);
      });
    },
    { threshold: 0.3 }
  );
  counterEls.forEach((el) => counterObs.observe(el));

  // ============== RATING BARS ==============
  const ratingSection = document.getElementById("rating-bars");
  const ratingObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        ratingSection.querySelectorAll(".bar").forEach((bar, i) => {
          setTimeout(() => {
            bar.style.width = bar.dataset.pct + "%";
            bar.style.transition = "width 1s cubic-bezier(0.16, 1, 0.3, 1)";
          }, i * 100);
        });
        ratingObs.unobserve(e.target);
      });
    },
    { threshold: 0.3 }
  );
  if (ratingSection) ratingObs.observe(ratingSection);

  // ============== REVIEWS ==============
  function initials(name) {
    return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  }

  // Featured review carousel
  let reviewIdx = 0;
  const featuredInitials = document.getElementById("featured-initials");
  const featuredName = document.getElementById("featured-name");
  const featuredMeta = document.getElementById("featured-meta");
  const featuredStars = document.getElementById("featured-stars");
  const featuredText = document.getElementById("featured-text");
  const featuredWrapper = document.getElementById("featured-review");
  const reviewDots = document.getElementById("review-dots");

  function renderFeatured(idx) {
    const r = REVIEWS[idx];
    if (!r) return;
    featuredInitials.textContent = initials(r.name);
    featuredName.textContent = r.name;
    featuredMeta.textContent = `${r.car} · ${r.city} · ${r.date}`;
    featuredStars.innerHTML = Array.from({ length: 5 })
      .map((_, i) => `<span class="${i < r.rating ? "text-yellow-400" : "text-white/20"}">★</span>`)
      .join("");
    featuredText.textContent = `"${r.text}"`;
    // Update dots
    reviewDots.querySelectorAll("button").forEach((b, i) => {
      if (i === idx) {
        b.classList.add("w-8", "bg-neon-green");
        b.classList.remove("w-1.5", "bg-white/20");
      } else {
        b.classList.remove("w-8", "bg-neon-green");
        b.classList.add("w-1.5", "bg-white/20");
      }
    });
  }
  renderFeatured(0);
  reviewDots?.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      reviewIdx = parseInt(b.dataset.idx, 10);
      renderFeatured(reviewIdx);
    });
  });
  document.getElementById("review-prev")?.addEventListener("click", () => {
    reviewIdx = (reviewIdx - 1 + REVIEWS.length) % REVIEWS.length;
    renderFeatured(reviewIdx);
  });
  document.getElementById("review-next")?.addEventListener("click", () => {
    reviewIdx = (reviewIdx + 1) % REVIEWS.length;
    renderFeatured(reviewIdx);
  });

  // Auto-advance every 6s
  setInterval(() => {
    reviewIdx = (reviewIdx + 1) % REVIEWS.length;
    renderFeatured(reviewIdx);
  }, 6000);

  // Smaller review grid
  const reviewGrid = document.getElementById("review-grid");
  if (reviewGrid) {
    reviewGrid.innerHTML = REVIEWS.slice(0, 3).map((r) => `
      <div class="review-card glass-card rounded-2xl p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center text-black font-bold text-sm">${initials(r.name)}</div>
          <div>
            <div class="text-sm font-semibold">${r.name}</div>
            <div class="text-xs text-white/50">${r.car} · ${r.city}</div>
          </div>
        </div>
        <div class="flex gap-0.5 text-yellow-400 text-sm">${Array.from({length:5}).map((_,i)=>`<span class="${i<r.rating?"text-yellow-400":"text-white/20"}">★</span>`).join("")}</div>
        <p class="text-white/70 text-sm mt-3 line-clamp-3">"${r.text}"</p>
      </div>
    `).join("");
  }

  // ============== FAQ ==============
  const faqList = document.getElementById("faq-list");
  if (faqList) {
    faqList.innerHTML = FAQS.map((f, i) => `
      <div class="faq-item glass-card rounded-2xl overflow-hidden ${i === 0 ? "open" : ""}">
        <button class="faq-toggle w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] transition-colors" data-idx="${i}">
          <span class="font-medium">${f.q}</span>
          <span class="faq-icon">+</span>
        </button>
        <div class="faq-content">
          <div class="px-5 pb-5 text-white/70 text-sm leading-relaxed">${f.a}</div>
        </div>
      </div>
    `).join("");

    faqList.querySelectorAll(".faq-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = btn.closest(".faq-item");
        const isOpen = item.classList.contains("open");
        // Close all
        faqList.querySelectorAll(".faq-item").forEach((i) => i.classList.remove("open"));
        // Open clicked if it was closed
        if (!isOpen) item.classList.add("open");
      });
    });
  }

  // ============== NEWSLETTER ==============
  document.getElementById("newsletter-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input[type="email"]');
    const btn = e.target.querySelector("button");
    const originalText = btn.textContent;
    btn.textContent = "✓ Subscribed";
    btn.classList.add("bg-neon-cyan");
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove("bg-neon-cyan");
      input.value = "";
    }, 2200);
  });
})();
