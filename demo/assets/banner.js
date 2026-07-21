(() => {
  "use strict";

  const BANNER_TEXT = "Recorded demo data — fixture mode, no live engine";
  const NAV_LINKS = [
    { label: "Board", href: "board.html" },
    { label: "Evidence", href: "evidence.html" },
    { label: "Who decided", href: "debate.html" },
    { label: "Council sandbox", href: "council.html" },
    { label: "Self-test", href: "selftest.html" },
    { label: "Engine snapshot", href: "runtime.html" },
  ];

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const body = document.body;
  if (body.dataset.demoChromeReady === "true") return;

  // These screens do not have a continuously available primary sidebar. Their
  // source files are owned by other streams, so apply the same explicit opt-in
  // at runtime when an owning page has not declared it yet.
  const alwaysTopnavPages = new Set(["council.html", "selftest.html", "runtime.html"]);
  if (alwaysTopnavPages.has(currentPage) && !body.hasAttribute("data-topnav")) {
    body.dataset.topnav = "always";
  }

  const isLiveRead = body.dataset.bannerMode === "live";
  let banner = null;
  if (!isLiveRead) {
    banner = document.createElement("div");
    banner.className = "demo-banner";
    banner.setAttribute("role", "note");
    const copy = document.createElement("span");
    copy.textContent = BANNER_TEXT;
    banner.append(copy);
    if (body.dataset.snapshot) {
      const snapshot = document.createElement("span");
      snapshot.className = "demo-banner__snapshot";
      snapshot.textContent = body.dataset.snapshot;
      banner.append(snapshot);
    }
  }

  const header = document.createElement("header");
  header.className = "demo-nav";

  const nav = document.createElement("nav");
  nav.className = "demo-nav__links";
  nav.setAttribute("aria-label", "Demo screens");

  for (const item of NAV_LINKS) {
    const link = document.createElement("a");
    link.className = "demo-nav__link";
    link.href = item.href;
    link.textContent = item.label;

    if (currentPage === item.href) {
      link.setAttribute("aria-current", "page");
    }

    nav.append(link);
  }

  header.append(nav);
  if (isLiveRead) {
    const liveBanner = body.querySelector(":scope > .livebar");
    if (liveBanner) liveBanner.after(header);
    else body.prepend(header);
  } else {
    body.prepend(banner, header);
  }

  const desktop = window.matchMedia("(min-width: 780px)");
  const syncTopnavVisibility = () => {
    header.hidden = desktop.matches && body.dataset.topnav !== "always";
  };
  syncTopnavVisibility();
  if (typeof desktop.addEventListener === "function") {
    desktop.addEventListener("change", syncTopnavVisibility);
  } else {
    desktop.addListener(syncTopnavVisibility);
  }

  body.dataset.demoChromeReady = "true";
})();
