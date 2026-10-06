// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
  "use strict";

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll(".needs-validation");

  // Loop over them and prevent submission
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false,
    );
  });

  // Auto-dismiss flash toasts after a few seconds
  document.querySelectorAll(".flash-stack .alert").forEach((alertEl) => {
    setTimeout(() => {
      const alert = bootstrap.Alert.getOrCreateInstance(alertEl);
      alert.close();
    }, 4500);
  });

  // Draggable dual-handle price range sliders
  document.querySelectorAll(".price-slider").forEach((slider) => {
    const track = slider.querySelector(".price-slider-track");
    const range = slider.querySelector(".price-slider-range");
    const minHandle = slider.querySelector('[data-handle="min"]');
    const maxHandle = slider.querySelector('[data-handle="max"]');
    const minInput = slider.querySelector(".price-slider-min-input");
    const maxInput = slider.querySelector(".price-slider-max-input");
    const minLabel = slider.querySelector(".price-slider-min-label");
    const maxLabel = slider.querySelector(".price-slider-max-label");
    if (!track || !minHandle || !maxHandle) return;

    const sliderMax = Number(slider.dataset.max) || 20000;
    const step = 50;
    const minGap = Math.max(step, Math.round(sliderMax * 0.03));

    let minVal = Number(slider.dataset.initMin) || 0;
    let maxVal = Number(slider.dataset.initMax) || sliderMax;

    const fmt = (n) => "रू " + Number(n).toLocaleString("en-NP");
    const clamp = (v) => Math.min(sliderMax, Math.max(0, v));

    function render() {
      const minPct = (minVal / sliderMax) * 100;
      const maxPct = (maxVal / sliderMax) * 100;
      minHandle.style.left = minPct + "%";
      maxHandle.style.left = maxPct + "%";
      range.style.left = minPct + "%";
      range.style.width = Math.max(0, maxPct - minPct) + "%";
      if (minInput) minInput.value = minVal;
      if (maxInput) maxInput.value = maxVal;
      if (minLabel) minLabel.textContent = fmt(minVal);
      if (maxLabel) maxLabel.textContent = maxVal >= sliderMax ? fmt(maxVal) + "+" : fmt(maxVal);
    }

    function valueFromEvent(e) {
      const rect = track.getBoundingClientRect();
      const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      return clamp(Math.round((pct * sliderMax) / step) * step);
    }

    function startDrag(which) {
      function onMove(e) {
        const val = valueFromEvent(e);
        if (which === "min") {
          minVal = Math.max(0, Math.min(val, maxVal - minGap));
        } else {
          maxVal = Math.min(sliderMax, Math.max(val, minVal + minGap));
        }
        render();
      }
      function onUp() {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      }
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    }

    minHandle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      startDrag("min");
    });
    maxHandle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      startDrag("max");
    });

    // Clicking the track jumps the nearest handle to that point
    track.addEventListener("pointerdown", (e) => {
      if (e.target === minHandle || e.target === maxHandle) return;
      const val = valueFromEvent(e);
      if (Math.abs(val - minVal) <= Math.abs(val - maxVal)) {
        minVal = Math.max(0, Math.min(val, maxVal - minGap));
      } else {
        maxVal = Math.min(sliderMax, Math.max(val, minVal + minGap));
      }
      render();
    });

    slider.addEventListener("reset-slider", () => {
      minVal = 0;
      maxVal = sliderMax;
      render();
    });

    render();
  });

  // Search + filter popover: open/close
  document.querySelectorAll(".search-filter").forEach((form) => {
    const toggle = form.querySelector(".search-filter-toggle");
    const popover = form.querySelector(".filter-popover");
    const clearBtn = form.querySelector(".filter-clear");
    if (!toggle || !popover) return;

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = popover.hidden;
      document.querySelectorAll(".filter-popover").forEach((p) => {
        p.hidden = true;
      });
      document.querySelectorAll(".search-filter-toggle").forEach((t) => {
        t.setAttribute("aria-expanded", "false");
      });
      popover.hidden = !willOpen;
      toggle.setAttribute("aria-expanded", String(willOpen));
    });

    popover.addEventListener("click", (e) => e.stopPropagation());
    popover.addEventListener("pointerdown", (e) => e.stopPropagation());

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        const searchInput = form.querySelector('input[name="search"]');
        if (searchInput) searchInput.value = "";
        const slider = form.querySelector(".price-slider");
        if (slider) slider.dispatchEvent(new CustomEvent("reset-slider"));
        const status = form.querySelector(".location-status");
        if (status) status.textContent = "";
      });
    }
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".filter-popover").forEach((p) => {
      p.hidden = true;
    });
    document.querySelectorAll(".search-filter-toggle").forEach((t) => {
      t.setAttribute("aria-expanded", "false");
    });
  });

  // "Use my current location" — geolocation + free reverse geocoding
  document.querySelectorAll(".location-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const form = btn.closest("form");
      const status = form.querySelector(".location-status");
      const searchInput = form.querySelector('input[name="search"]');
      if (!navigator.geolocation) {
        if (status) status.textContent = "Location isn't supported on this browser.";
        return;
      }
      if (status) status.textContent = "Locating...";
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          )
            .then((res) => res.json())
            .then((data) => {
              const place = data.city || data.locality || data.principalSubdivision || data.countryName;
              if (place && searchInput) {
                searchInput.value = place;
                if (status) status.textContent = "Showing stays near " + place;
              } else if (status) {
                status.textContent = "Couldn't determine your location name.";
              }
            })
            .catch(() => {
              if (status) status.textContent = "Couldn't look up your location.";
            });
        },
        () => {
          if (status) status.textContent = "Location access was denied.";
        },
        { timeout: 8000 },
      );
    });
  });
})();
