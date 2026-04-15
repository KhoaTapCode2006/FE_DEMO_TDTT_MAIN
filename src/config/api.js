/**
 * api.js — Central API configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * Replace BASE_URL and GOOGLE_MAPS_API_KEY with real values before deploying.
 * All service files import from here so there is a single source of truth.
 */

export const API_CONFIG = {
  /** REST API base URL */
  BASE_URL: "https://api.booking4lu.com/v1",

  /** Google Maps JavaScript API key */
  GOOGLE_MAPS_API_KEY: "AIzaSyDk23WJBkLXBVeDmUSXrfbzhNcNjmP-_t0",

  /** Default search radius in metres */
  DEFAULT_RADIUS_M: 3000,

  ENDPOINTS: {
    HOTELS_SEARCH:  "/hotels/search",       // GET  ?lat&lng&radius&filters…
    HOTEL_DETAIL:   "/hotels/:id",          // GET
    HOTEL_REVIEWS:  "/hotels/:id/reviews",  // GET
    FILTER_OPTIONS: "/hotels/filters",      // GET  – available amenities / types
  },
};

/**
 * Build a full URL, substituting :param placeholders.
 * @param {keyof typeof API_CONFIG.ENDPOINTS} key
 * @param {Record<string,string>} [params]
 * @returns {string}
 */
export function buildUrl(key, params = {}) {
  let path = API_CONFIG.ENDPOINTS[key];
  Object.entries(params).forEach(([k, v]) => {
    path = path.replace(`:${k}`, encodeURIComponent(v));
  });
  return `${API_CONFIG.BASE_URL}${path}`;
}
