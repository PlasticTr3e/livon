import L from "leaflet";

let leafletDefaultIconsConfigured = false;

export function configureLeafletDefaultIcons() {
  if (leafletDefaultIconsConfigured) return;

  delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: string })
    ._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });

  leafletDefaultIconsConfigured = true;
}
