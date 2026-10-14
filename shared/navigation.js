(function () {
  "use strict";
  if (window.FreeHubNavigation) return;
  window.FreeHubNavigation = true;
  function close(header) {
    const button = header.querySelector(".site-topbar__menu");
    if (button) button.setAttribute("aria-expanded", "false");
    header.classList.remove("is-menu-open");
  }
  document.addEventListener("click", function (event) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest(".site-topbar__menu");
    if (!button) return;
    const header = button.closest(".site-topbar");
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    header.classList.toggle("is-menu-open", open);
  });
  document.addEventListener("keydown", function (event) {
    if (!(event.target instanceof Element)) return;
    const header = event.target.closest(".site-topbar");
    if (event.key !== "Escape" || !header) return;
    const button = header.querySelector(".site-topbar__menu");
    if (button && button.getAttribute("aria-expanded") === "true") {
      close(header);
      button.focus();
    }
  });
  window.matchMedia("(max-width: 900px)").addEventListener("change", function () {
    document.querySelectorAll(".site-topbar").forEach(close);
  });
  // Set only after handlers exist. No-JavaScript pages retain all navigation links.
  document.documentElement.dataset.navigationReady = "true";
})();
