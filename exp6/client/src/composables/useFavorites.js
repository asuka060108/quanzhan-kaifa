import { computed, ref } from 'vue';
import { api } from '@/api';

const favoriteIds = ref([]);
const loading = ref(false);
const error = ref('');
let loadPromise = null;

function isFavorite(id) {
  return favoriteIds.value.includes(id);
}

async function loadFavorites(force = false) {
  if (loadPromise && !force) return loadPromise;
  loading.value = true;
  error.value = '';
  loadPromise = api
    .favorites()
    .then((data) => {
      favoriteIds.value = data.ids || [];
    })
    .catch((reason) => {
      error.value = reason.message;
    })
    .finally(() => {
      loading.value = false;
      loadPromise = null;
    });
  return loadPromise;
}

async function toggleFavorite(id) {
  error.value = '';
  const previous = [...favoriteIds.value];
  if (isFavorite(id)) {
    favoriteIds.value = previous.filter((item) => item !== id);
    try {
      const data = await api.removeFavorite(id);
      favoriteIds.value = data.ids;
    } catch (reason) {
      favoriteIds.value = previous;
      error.value = reason.message;
    }
  } else {
    favoriteIds.value = [...previous, id];
    try {
      const data = await api.addFavorite(id);
      favoriteIds.value = data.ids;
    } catch (reason) {
      favoriteIds.value = previous;
      error.value = reason.message;
    }
  }
}

async function clearFavorites() {
  const previous = [...favoriteIds.value];
  favoriteIds.value = [];
  try {
    const data = await api.clearFavorites();
    favoriteIds.value = data.ids;
  } catch (reason) {
    favoriteIds.value = previous;
    error.value = reason.message;
  }
}

export function useFavorites() {
  return {
    favoriteIds,
    count: computed(() => favoriteIds.value.length),
    loading,
    error,
    isFavorite,
    loadFavorites,
    toggleFavorite,
    clearFavorites,
  };
}
