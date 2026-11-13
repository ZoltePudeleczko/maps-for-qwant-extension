// Shared between the content script and the options page.
// %s is replaced with the URL-encoded search query.
const QM_PROVIDERS = {
  google: { name: "Google Maps",     url: "https://www.google.com/maps/search/?api=1&query=%s" },
  osm:    { name: "OpenStreetMap",   url: "https://www.openstreetmap.org/search?query=%s" },
  bing:   { name: "Bing Maps",       url: "https://www.bing.com/maps?q=%s" },
  apple:  { name: "Apple Maps",      url: "https://maps.apple.com/?q=%s" },
  mapy:   { name: "Mapy.com",        url: "https://mapy.com/en/?q=%s" },
  ddg:    { name: "DuckDuckGo Maps", url: "https://duckduckgo.com/?q=%s&iaxm=maps" }
};

const QM_DEFAULTS = {
  provider: "google",
  newTab: false,
  label: "Maps"
};

function qmBuildUrl(settings, query) {
  const p = QM_PROVIDERS[settings.provider] || QM_PROVIDERS.google;
  return p.url.split("%s").join(encodeURIComponent(query || ""));
}
