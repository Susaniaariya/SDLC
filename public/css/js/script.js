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

  // Property type cards: visual selection state
  document.querySelectorAll(".property-type-card").forEach((card) => {
    const input = card.querySelector("input[type=radio]");
    if (!input) return;
    const syncSelected = () => {
      const name = input.name;
      document.querySelectorAll(`input[name="${CSS.escape(name)}"]`).forEach((other) => {
        other.closest(".property-type-card")?.classList.toggle("is-selected", other.checked);
      });
    };
    input.addEventListener("change", syncSelected);
    syncSelected();
  });

  // Host onboarding wizard: step navigation
  document.querySelectorAll(".host-wizard").forEach((wizard) => {
    const steps = Array.from(wizard.querySelectorAll(".host-step"));
    const dots = Array.from(wizard.querySelectorAll(".host-step-dot"));
    const backBtn = wizard.querySelector(".host-back");
    const nextBtn = wizard.querySelector(".host-next");
    const submitBtn = wizard.querySelector(".host-submit");
    if (!steps.length || !nextBtn) return;

    let current = 0;

    function show(index) {
      steps.forEach((s, i) => {
        s.hidden = i !== index;
      });
      dots.forEach((d, i) => d.classList.toggle("is-active", i <= index));
      if (backBtn) backBtn.hidden = index === 0;
      nextBtn.hidden = index === steps.length - 1;
      if (submitBtn) submitBtn.hidden = index !== steps.length - 1;
      current = index;
    }

    function validateStep(index) {
      const fields = steps[index].querySelectorAll("input[required], textarea[required], select[required]");
      let valid = true;
      fields.forEach((f) => {
        if (!f.checkValidity()) {
          valid = false;
          f.reportValidity();
        }
      });
      return valid;
    }

    nextBtn.addEventListener("click", () => {
      if (!validateStep(current)) return;
      if (current < steps.length - 1) show(current + 1);
    });

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        if (current > 0) show(current - 1);
      });
    }

    show(0);
  });

  // Host onboarding: Leaflet map for pinning the property's address
  document.querySelectorAll(".host-map").forEach((mapEl) => {
    if (typeof L === "undefined") return;
    const form = mapEl.closest("form");
    if (!form) return;

    const latInput = form.querySelector(".map-lat-input");
    const lngInput = form.querySelector(".map-lng-input");
    const locationInput = form.querySelector(".map-location-input");
    const countryInput = form.querySelector(".map-country-input");
    const searchInput = form.querySelector(".map-search-input");
    const searchBtn = form.querySelector(".map-search-btn");
    const locateBtn = form.querySelector(".map-locate-btn");
    const statusEl = form.querySelector(".map-status");

    const startLat = Number(mapEl.dataset.lat) || 27.7172;
    const startLng = Number(mapEl.dataset.lng) || 85.324;

    const map = L.map(mapEl).setView([startLat, startLng], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([startLat, startLng], { draggable: true }).addTo(map);

    function setCoords(lat, lng) {
      if (latInput) latInput.value = lat.toFixed(6);
      if (lngInput) lngInput.value = lng.toFixed(6);
    }

    function reverseGeocode(lat, lng) {
      if (statusEl) statusEl.textContent = "Looking up address...";
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`)
        .then((r) => r.json())
        .then((data) => {
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || "";
          const country = addr.country || "";
          if (city && locationInput) locationInput.value = city;
          if (country && countryInput) countryInput.value = country;
          if (statusEl) statusEl.textContent = data.display_name ? "Pinned: " + data.display_name : "Pin set.";
        })
        .catch(() => {
          if (statusEl) statusEl.textContent = "Pin set. Couldn't look up the address name.";
        });
    }

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setCoords(pos.lat, pos.lng);
      reverseGeocode(pos.lat, pos.lng);
    });

    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      setCoords(e.latlng.lat, e.latlng.lng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    setCoords(startLat, startLng);

    function doSearch() {
      const q = searchInput.value.trim();
      if (!q) return;
      if (statusEl) statusEl.textContent = "Searching...";
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=1`)
        .then((r) => r.json())
        .then((results) => {
          if (!results.length) {
            if (statusEl) statusEl.textContent = "No results found for that search.";
            return;
          }
          const place = results[0];
          const lat = Number(place.lat);
          const lng = Number(place.lon);
          map.setView([lat, lng], 14);
          marker.setLatLng([lat, lng]);
          setCoords(lat, lng);
          const addr = place.address || {};
          const city = addr.city || addr.town || addr.village || addr.county || "";
          const country = addr.country || "";
          if (city && locationInput) locationInput.value = city;
          if (country && countryInput) countryInput.value = country;
          if (statusEl) statusEl.textContent = "Pinned: " + place.display_name;
        })
        .catch(() => {
          if (statusEl) statusEl.textContent = "Couldn't search right now.";
        });
    }

    if (searchBtn && searchInput) {
      searchBtn.addEventListener("click", doSearch);
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          doSearch();
        }
      });
    }

    if (locateBtn) {
      locateBtn.addEventListener("click", () => {
        if (!navigator.geolocation) {
          if (statusEl) statusEl.textContent = "Location isn't supported on this browser.";
          return;
        }
        if (statusEl) statusEl.textContent = "Locating...";
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            map.setView([latitude, longitude], 15);
            marker.setLatLng([latitude, longitude]);
            setCoords(latitude, longitude);
            reverseGeocode(latitude, longitude);
          },
          () => {
            if (statusEl) statusEl.textContent = "Location access was denied.";
          },
          { timeout: 8000 },
        );
      });
    }

    // The map starts inside a hidden wizard step, so Leaflet measures a
    // zero-size box at init. Recalculate once the step becomes visible.
    document.querySelectorAll(".host-next, .host-back").forEach((btn) => {
      btn.addEventListener("click", () => setTimeout(() => map.invalidateSize(), 50));
    });
  });
})();
