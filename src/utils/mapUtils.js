/**
 * mapUtils.js — Google Maps helpers
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: API loading, map init, radius circle, hotel markers, clustering.
 * When migrating to React wrap these in a useGoogleMap() custom hook.
 */

import { API_CONFIG } from "../config/api.js";

// ─── Script loader (singleton) ────────────────────────────────────────────────

let _loadPromise = null;

/**
 * Dynamically inject the Google Maps JS API script once.
 * @returns {Promise<void>}
 */
export function loadGoogleMapsAPI() {
  if (_loadPromise) return _loadPromise;
  _loadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${API_CONFIG.GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    s.async = true;
    s.defer = true;
    s.onload  = resolve;
    s.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(s);
  });
  return _loadPromise;
}

// ─── Map init ─────────────────────────────────────────────────────────────────

/**
 * Create and return a styled Google Map.
 * @param {HTMLElement} el
 * @param {{ lat:number, lng:number }} center
 * @returns {google.maps.Map}
 */
export function initMap(el, center) {
  return new google.maps.Map(el, {
    center,
    zoom: 14,
    disableDefaultUI: true,
    gestureHandling: "greedy",
    styles: MAP_STYLE,
  });
}

// ─── Radius circle ────────────────────────────────────────────────────────────

/**
 * Draw or update the search-radius circle.
 * @param {google.maps.Map} map
 * @param {{ lat:number, lng:number }} center
 * @param {number} radiusM
 * @param {google.maps.Circle|null} existing
 * @returns {google.maps.Circle}
 */
export function drawRadiusCircle(map, center, radiusM, existing = null) {
  if (existing) {
    existing.setCenter(center);
    existing.setRadius(radiusM);
    return existing;
  }
  return new google.maps.Circle({
    map, center, radius: radiusM,
    strokeColor: "#00346f", strokeOpacity: 0.5, strokeWeight: 2,
    fillColor: "#00346f",   fillOpacity: 0.07,
    clickable: false,
  });
}

// ─── Markers ──────────────────────────────────────────────────────────────────

/**
 * Create a price-tag marker for a single hotel.
 * @param {google.maps.Map} map
 * @param {import('../services/hotelService').Hotel} hotel
 * @param {(h: import('../services/hotelService').Hotel) => void} onClick
 * @returns {google.maps.Marker}
 */
export function createHotelMarker(map, hotel, onClick) {
  const marker = new google.maps.Marker({
    map,
    position: { lat: hotel.lat, lng: hotel.lng },
    title: hotel.name,
    icon: _priceIcon(_fmtPrice(hotel.pricePerNight, hotel.currency)),
    zIndex: 10,
  });
  marker.addListener("click", () => onClick(hotel));
  return marker;
}

/**
 * Create a cluster bubble marker.
 * @param {google.maps.Map} map
 * @param {{ lat:number, lng:number }} pos
 * @param {import('../services/hotelService').Hotel[]} hotels
 * @param {(hotels: import('../services/hotelService').Hotel[]) => void} onClick
 * @returns {google.maps.Marker}
 */
export function createClusterMarker(map, pos, hotels, onClick) {
  const marker = new google.maps.Marker({
    map,
    position: pos,
    icon: _clusterIcon(hotels.length),
    zIndex: 20,
  });
  marker.addListener("click", () => onClick(hotels));
  return marker;
}

/** Remove all markers from the map. @param {google.maps.Marker[]} markers */
export function clearMarkers(markers) {
  markers.forEach((m) => m.setMap(null));
  markers.length = 0;
}

// ─── Clustering (grid-based) ──────────────────────────────────────────────────

/**
 * Group hotels into spatial clusters.
 * For production swap with @googlemaps/markerclusterer.
 * @param {import('../services/hotelService').Hotel[]} hotels
 * @param {number} [cellDeg=0.005]  ~500 m per cell
 * @returns {{ pos:{lat:number,lng:number}, hotels:Hotel[] }[]}
 */
export function clusterHotels(hotels, cellDeg = 0.005) {
  const cells = {};
  hotels.forEach((h) => {
    const key = `${Math.floor(h.lat / cellDeg)}_${Math.floor(h.lng / cellDeg)}`;
    (cells[key] = cells[key] || []).push(h);
  });
  return Object.values(cells).map((group) => ({
    pos: {
      lat: group.reduce((s, h) => s + h.lat, 0) / group.length,
      lng: group.reduce((s, h) => s + h.lng, 0) / group.length,
    },
    hotels: group,
  }));
}

// ─── Icon builders ────────────────────────────────────────────────────────────

function _priceIcon(label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="36">
    <rect rx="8" width="80" height="28" fill="#00346f"/>
    <text x="40" y="19" font-family="Inter,sans-serif" font-size="11"
          font-weight="700" fill="white" text-anchor="middle">${label}</text>
    <polygon points="35,28 45,28 40,36" fill="#00346f"/>
  </svg>`;
  return {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(80, 36),
    anchor: new google.maps.Point(40, 36),
  };
}

function _clusterIcon(count) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
    <circle cx="24" cy="24" r="22" fill="#00346f" stroke="white" stroke-width="3"/>
    <text x="24" y="29" font-family="Inter,sans-serif" font-size="14"
          font-weight="800" fill="white" text-anchor="middle">${count}</text>
  </svg>`;
  return {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(48, 48),
    anchor: new google.maps.Point(24, 24),
  };
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/** Compact price label for map markers. */
export function _fmtPrice(price, currency = "VND") {
  if (currency === "VND") {
    return price >= 1_000_000
      ? `${(price / 1_000_000).toFixed(1)}M`
      : `${(price / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, maximumFractionDigits: 0,
  }).format(price);
}

// ─── Editorial map style ──────────────────────────────────────────────────────

const MAP_STYLE = [
  { elementType: "geometry",            stylers: [{ color: "#f2f4f7" }] },
  { elementType: "labels.text.fill",    stylers: [{ color: "#424751" }] },
  { elementType: "labels.text.stroke",  stylers: [{ color: "#ffffff" }] },
  { featureType: "road",                elementType: "geometry",  stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial",       elementType: "geometry",  stylers: [{ color: "#e6e8eb" }] },
  { featureType: "water",               elementType: "geometry",  stylers: [{ color: "#bee9ff" }] },
  { featureType: "poi.park",            elementType: "geometry",  stylers: [{ color: "#d8f0e0" }] },
  { featureType: "poi",                 elementType: "labels",    stylers: [{ visibility: "off" }] },
  { featureType: "transit",             stylers: [{ visibility: "off" }] },
];
