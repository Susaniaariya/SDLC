// Live price total + sensible date limits for the reserve form on a listing page.
(function () {
  const form = document.querySelector(".booking-form");
  if (!form) return;

  const price = Number(form.dataset.price) || 0;
  const checkIn = form.querySelector("#checkIn");
  const checkOut = form.querySelector("#checkOut");
  const total = form.querySelector(".booking-total");
  const DAY = 24 * 60 * 60 * 1000;

  const iso = (d) => d.toISOString().slice(0, 10);
  const today = new Date();
  const todayIso = iso(new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())));
  checkIn.min = todayIso;
  checkOut.min = todayIso;

  function update() {
    if (checkIn.value) {
      // Check-out must be at least the day after check-in
      const next = new Date(checkIn.value);
      next.setUTCDate(next.getUTCDate() + 1);
      checkOut.min = iso(next);
      if (checkOut.value && checkOut.value < checkOut.min) checkOut.value = "";
    }
    if (!checkIn.value || !checkOut.value) {
      total.textContent = "Pick your dates to see the total.";
      return;
    }
    const nights = Math.round((new Date(checkOut.value) - new Date(checkIn.value)) / DAY);
    if (nights < 1) {
      total.textContent = "Check-out must be after check-in.";
      return;
    }
    const fmt = (n) => "रु " + n.toLocaleString("en-NP");
    total.innerHTML =
      `${fmt(price)} × ${nights} night${nights > 1 ? "s" : ""} = <strong>${fmt(price * nights)}</strong>`;
  }

  checkIn.addEventListener("change", update);
  checkOut.addEventListener("change", update);
})();
