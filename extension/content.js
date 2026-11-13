(() => {
  const MARK = "data-qwant-maps-tab";
  // Qwant's search-type tabs are links like "/?q=foo&t=images"
  const TAB_RE = /[?&]t=([a-z]+)\b/;

  const PIN_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>';

  let settings = { ...QM_DEFAULTS };

  const label = () => settings.label || "Maps";

  function currentQuery() {
    const fromUrl = new URLSearchParams(location.search).get("q");
    if (fromUrl) return fromUrl;
    const input = document.querySelector('input[name="q"], input[type="search"]');
    return input ? input.value : "";
  }

  // Qwant marks its tabs with data-testid="webNavItem", "imagesNavItem"…
  // and data-click-label="tab_bar_item_web", "tab_bar_item_images"…
  const TAB_SEL = '[data-click-label^="tab_bar_item_"], [data-testid$="NavItem"]';

  function looksLikeTab(el) {
    return !el.querySelector("input, form, img") && el.textContent.trim().length <= 40;
  }

  function findTabBar() {
    const tabs = [...document.querySelectorAll(TAB_SEL)].filter((t) => !t.closest(`[${MARK}]`));
    if (tabs.length < 2) return null;
    // The bar is the closest element that contains all the tabs;
    // each of its children that holds a tab is one tab item.
    let bar = tabs[0].parentElement;
    while (bar && !tabs.every((t) => bar.contains(t))) bar = bar.parentElement;
    if (!bar) return null;
    const items = [...bar.children].filter(
      (c) => !c.hasAttribute(MARK) && (c.matches(TAB_SEL) || c.querySelector(TAB_SEL))
    );
    if (items.length < 2 || !items.every(looksLikeTab)) return null;
    return { bar, items };
  }

  function isActive(item) {
    const a = item.matches("a[href]") ? item : item.querySelector("a[href]") || item;
    if (a.getAttribute("aria-current") || a.getAttribute("aria-selected") === "true") return true;
    const m = (a.getAttribute("href") || "").match(TAB_RE);
    const t = new URLSearchParams(location.search).get("t") || "web";
    return !!m && m[1] === t;
  }

  function buildTab(templateItem) {
    const item = templateItem.cloneNode(true);
    item.setAttribute(MARK, "");
    const link = item.matches("a[href]") ? item : item.querySelector("a[href]") || item;

    // Strip state/ids that belong to the original tab
    [item, ...item.querySelectorAll("*")].forEach((n) => {
      ["id", "aria-current", "aria-selected", "data-testid", "data-click-label"].forEach((attr) => n.removeAttribute(attr));
    });

    // Replace the label text
    const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
    let node, replaced = false;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue.trim()) continue;
      if (!replaced) {
        node.nodeValue = label();
        node.parentElement.setAttribute("data-qm-label", "");
        replaced = true;
      } else {
        node.nodeValue = "";
      }
    }
    if (!replaced) {
      const span = document.createElement("span");
      span.setAttribute("data-qm-label", "");
      span.textContent = label();
      link.appendChild(span);
    }

    // Swap any icon for a map pin
    const svg = link.querySelector("svg");
    if (svg) svg.outerHTML = PIN_SVG;

    link.setAttribute("href", "#");
    link.removeAttribute("target");

    const open = (forceNewTab) => {
      const url = qmBuildUrl(settings, currentQuery());
      if (forceNewTab || settings.newTab) window.open(url, "_blank", "noopener");
      else location.href = url;
    };
    // Capture phase so Qwant's own handlers never see the click
    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      open(e.ctrlKey || e.metaKey || e.shiftKey);
    }, true);
    link.addEventListener("auxclick", (e) => {
      if (e.button !== 1) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      open(true);
    }, true);

    return item;
  }

  // Insert the Maps tab, and keep it as the last tab
  function update() {
    const tabs = findTabBar();
    if (!tabs) return;
    const last = tabs.items[tabs.items.length - 1];
    let mine = document.querySelector(`[${MARK}]`);

    if (mine && mine.parentElement !== tabs.bar) { mine.remove(); mine = null; }
    if (!mine) {
      const template = tabs.items.find((i) => !isActive(i)) || last;
      mine = buildTab(template);
    }
    if (last.nextElementSibling !== mine) last.insertAdjacentElement("afterend", mine);
  }

  function refreshLabel() {
    document.querySelectorAll(`[${MARK}] [data-qm-label]`).forEach((n) => {
      n.textContent = label();
    });
  }

  // Qwant is a single-page app: re-check whenever the DOM changes.
  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; update(); });
  }).observe(document.documentElement, { childList: true, subtree: true });

  // Load settings last, so everything above is defined.
  chrome.storage.sync.get(QM_DEFAULTS, (s) => {
    settings = s;
    refreshLabel();
    update();
  });
  chrome.storage.onChanged.addListener((changes) => {
    for (const [k, { newValue }] of Object.entries(changes)) settings[k] = newValue;
    refreshLabel();
  });
})();
