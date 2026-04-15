/**
 * hotelService.js — All hotel-related API calls
 * ─────────────────────────────────────────────────────────────────────────────
 * Set USE_MOCK = false and point API_CONFIG.BASE_URL at the real server
 * to switch from mock data to live data.
 *
 * @typedef {Object} Hotel
 * @property {string}   id
 * @property {string}   name
 * @property {string}   type          – "Hotel" | "Villa" | "Resort" | "Penthouse"
 * @property {string|null} badge
 * @property {number}   rating        – 0–5
 * @property {number}   reviewCount
 * @property {number}   pricePerNight – in smallest currency unit (VND)
 * @property {string}   currency
 * @property {string}   address
 * @property {number}   lat
 * @property {number}   lng
 * @property {string[]} amenities     – e.g. ["pool","wifi","spa","fitness_center"]
 * @property {number}   starRating    – 1–5
 * @property {string[]} images        – ordered array of image URLs
 * @property {{ author:string, avatar:string|null, text:string }} latestReview
 * @property {{ name:string, distance:string }[]} nearbyLandmarks
 *
 * @typedef {Object} FilterState
 * @property {number|null} priceMin
 * @property {number|null} priceMax
 * @property {string[]}    types
 * @property {string[]}    amenities
 * @property {number|null} starRating
 * @property {boolean}     availableOnly
 */

import { buildUrl } from "../config/api.js";

const USE_MOCK = true; // ← flip to false when backend is ready

// ─── Mock dataset ─────────────────────────────────────────────────────────────

/** @type {Hotel[]} */
const MOCK_HOTELS = [
  {
    id: "1",
    name: "The Azure Sanctuary",
    type: "Hotel",
    badge: "Premier Boutique",
    rating: 4.9,
    reviewCount: 2400,
    pricePerNight: 7500000,
    currency: "VND",
    address: "District 1, Ho Chi Minh City",
    lat: 10.7769,
    lng: 106.7009,
    amenities: ["pool", "spa", "wifi"],
    starRating: 5,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB8_Up820xTy9L7dCfBvhEMebEI2SbLeOcrnhDT6S65F7l2IeuTzFiU5Ku0P0Gh1ca1yAdXi5lpaT2F3VBFO5EWr8Fx3K1RVCxE5TJx-fwdzd_RAwQ_iT8jymVnuJAfw6Tasm0PdSsaBOKS3m0ilcS218QSbIc4LPN5LhgzsRp_Wgoj-G7SRopesItOitbFDZ1O-48wBZn23-z96FgSmxngMYTL20bIawlXIwsUHtNsDqtBEd4wzQ_BrG2EA9UnP5IN9eBFFqMgkSg",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCW0nryQUYa1dFi-wPdmEBZ-xEFW9BFdP2glZqi_jXvygP4MVTYXQcTQBhVompi_g8BUe7lj7J3JMGLRtvRezVmY_lr-NUwjT17CWFyuOzaaNMQCjqkwTEGnfDJJwQn6ksp4qy2vp9wZBKU5Ru6o8AWE0Km9oclaLlvx1EAwliKBYVOYiprenA_48dCyaTSn1k0UgG3R_Yb4-uXNv42WZ86QwtQcvwEwg8imEBXz6gFJ2ZwlAe3S-FhF238CWv0DOCu5Tqu-pG-z28",
    ],
    latestReview: {
      author: "Elena R.",
      avatar: null,
      text: "An absolute masterpiece of hospitality. The concierge service was impeccable, guiding us to the most authentic spots.",
    },
    nearbyLandmarks: [
      { name: "Ben Thanh Market", distance: "0.4 km" },
      { name: "Reunification Palace", distance: "0.9 km" },
      { name: "Notre-Dame Cathedral", distance: "1.2 km" },
    ],
  },
  {
    id: "2",
    name: "The Gilded Manor",
    type: "Hotel",
    badge: null,
    rating: 4.7,
    reviewCount: 1850,
    pricePerNight: 4200000,
    currency: "VND",
    address: "District 3, Riverside",
    lat: 10.785,
    lng: 106.692,
    amenities: ["wifi", "fitness_center"],
    starRating: 4,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCdT-tkeqqMwu7a090Frmt7FtFibb_hp29IHEEbYoFLaAT-D9fHm_AkQVxOH-cYPMdUPo2FAz0N1ryQlWazhl75Ggcv-Ttw-fr15Po3caDasTcbvXwxj1j3g7-7IFOKRW9WsLk5bNOpCkpPx7X8ryM3zF1XhpQ5sKVIpSikNW6bDZRgnaa1WUsaPHtjB74_-_JM2Ba5tTNnaxfM3AApjqWEaJqx34rWyhnx1y_vdvyJr-NjwaWb8SuLviarCjhmi3rTdLPO0DVDp4A",
    ],
    latestReview: {
      author: "Markus T.",
      avatar: null,
      text: "The spa treatments are world-class. If you're visiting Hanoi, this resort is the only place to truly disconnect.",
    },
    nearbyLandmarks: [
      { name: "War Remnants Museum", distance: "0.6 km" },
      { name: "Tao Dan Park", distance: "1.1 km" },
    ],
  },
  {
    id: "3",
    name: "Saigon Pearl Villa",
    type: "Villa",
    badge: "Exclusive",
    rating: 4.8,
    reviewCount: 980,
    pricePerNight: 12000000,
    currency: "VND",
    address: "Binh Thanh District",
    lat: 10.795,
    lng: 106.715,
    amenities: ["pool", "wifi", "spa"],
    starRating: 5,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCW0nryQUYa1dFi-wPdmEBZ-xEFW9BFdP2glZqi_jXvygP4MVTYXQcTQBhVompi_g8BUe7lj7J3JMGLRtvRezVmY_lr-NUwjT17CWFyuOzaaNMQCjqkwTEGnfDJJwQn6ksp4qy2vp9wZBKU5Ru6o8AWE0Km9oclaLlvx1EAwliKBYVOYiprenA_48dCyaTSn1k0UgG3R_Yb4-uXNv42WZ86QwtQcvwEwg8imEBXz6gFJ2ZwlAe3S-FhF238CWv0DOCu5Tqu-pG-z28",
    ],
    latestReview: {
      author: "Sophie L.",
      avatar: null,
      text: "Private pool, stunning river views. Worth every dong. Will absolutely return.",
    },
    nearbyLandmarks: [
      { name: "Saigon River", distance: "0.2 km" },
      { name: "Landmark 81", distance: "0.5 km" },
    ],
  },
];

// ─── Public functions ─────────────────────────────────────────────────────────

/**
 * Search hotels near a location with optional filters.
 * @param {{ lat:number, lng:number, radius:number, filters:FilterState }} opts
 * @returns {Promise<Hotel[]>}
 */
export async function searchHotels({ lat, lng, radius, filters = {} }) {
  if (USE_MOCK) {
    await _delay(500);
    return _applyFilters(MOCK_HOTELS, filters);
  }

  const url = new URL(buildUrl("HOTELS_SEARCH"));
  url.searchParams.set("lat", lat);
  url.searchParams.set("lng", lng);
  url.searchParams.set("radius", radius);
  if (filters.priceMin != null)    url.searchParams.set("priceMin", filters.priceMin);
  if (filters.priceMax != null)    url.searchParams.set("priceMax", filters.priceMax);
  if (filters.types?.length)       url.searchParams.set("types", filters.types.join(","));
  if (filters.amenities?.length)   url.searchParams.set("amenities", filters.amenities.join(","));
  if (filters.starRating != null)  url.searchParams.set("starRating", filters.starRating);
  if (filters.availableOnly)       url.searchParams.set("availableOnly", "true");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Hotel search failed: ${res.status}`);
  return res.json();
}

/**
 * Fetch full details for a single hotel.
 * @param {string} hotelId
 * @returns {Promise<Hotel>}
 */
export async function getHotelDetail(hotelId) {
  if (USE_MOCK) {
    await _delay(200);
    const hotel = MOCK_HOTELS.find((h) => h.id === String(hotelId));
    if (!hotel) throw new Error(`Hotel ${hotelId} not found`);
    return hotel;
  }

  const res = await fetch(buildUrl("HOTEL_DETAIL", { id: hotelId }));
  if (!res.ok) throw new Error(`Hotel detail failed: ${res.status}`);
  return res.json();
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

/** @param {Hotel[]} hotels @param {FilterState} f */
function _applyFilters(hotels, f) {
  return hotels.filter((h) => {
    if (f.priceMin != null && h.pricePerNight < f.priceMin) return false;
    if (f.priceMax != null && h.pricePerNight > f.priceMax) return false;
    if (f.types?.length && !f.types.includes(h.type))       return false;
    if (f.starRating != null && h.starRating < f.starRating) return false;
    if (f.amenities?.length) {
      if (!f.amenities.every((a) => h.amenities.includes(a))) return false;
    }
    return true;
  });
}
