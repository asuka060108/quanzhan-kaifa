const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');
const CLIENT_KEY = 'hengyang-api-client-id';

function getClientId() {
  try {
    const existing = window.localStorage.getItem(CLIENT_KEY);
    if (existing) return existing;
    const id = window.crypto?.randomUUID?.() || `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(CLIENT_KEY, id);
    return id;
  } catch {
    return 'demo-client-0001';
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Id': getClientId(),
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Keep the HTTP status as the primary error.
  }

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || `请求失败：HTTP ${response.status}`);
  }
  return payload?.data;
}

export const api = {
  health: () => request('/health'),
  home: () => request('/home'),
  attractions: (params = {}) => request(`/attractions${query(params)}`),
  attraction: (id) => request(`/attractions/${encodeURIComponent(id)}`),
  foods: (params = {}) => request(`/foods${query(params)}`),
  food: (id) => request(`/foods/${encodeURIComponent(id)}`),
  itinerary: () => request('/itinerary'),
  config: () => request('/config'),
  favorites: () => request('/favorites'),
  addFavorite: (id) => request(`/favorites/${encodeURIComponent(id)}`, { method: 'POST' }),
  removeFavorite: (id) => request(`/favorites/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  clearFavorites: () => request('/favorites', { method: 'DELETE' }),
};

function query(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      search.set(key, value);
    }
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}
