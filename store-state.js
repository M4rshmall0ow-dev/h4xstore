/
 * ==============================================================================
 * H4X-STORE CLIENT STATE (BACKEND SYNCHRONIZED)
 * ==============================================================================
 */

const API_BASE = window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : window.location.origin;

window.API_BASE = API_BASE;

let CACHED_STORE_ID = null;
async function getKomerzaStoreId() {
    if (CACHED_STORE_ID) return CACHED_STORE_ID;
    try {
        // Ask backend (which proxies Komerza) for the configured store list and use the first store's id when available
        const res = await apiFetch('/api/komerza/stores?PageSize=1');
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
            CACHED_STORE_ID = res.data[0].id || res.data[0].storeId || res.data[0].Id;
            if (CACHED_STORE_ID) return CACHED_STORE_ID;
        }
        // Fallback: check backend-provided simplified endpoint
        const alt = await apiFetch('/api/komerza/store-id');
        if (alt && alt.success && alt.data && alt.data.storeId) {
            CACHED_STORE_ID = alt.data.storeId; return CACHED_STORE_ID;
        }
    } catch (e) {
        console.warn('Failed to fetch Komerza store id from backend', e);
    }
    throw new Error('Unable to determine Komerza store id');
}

const StoreSecurity = {
  // No client-side master keys or secrets. Persist non-sensitive preferences in plain storage (Base64 encoded for compactness).
  hash: function(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  },
  
  encrypt: function(data) {
    // Plain Base64-encoded JSON (no secret key stored in frontend)
    return btoa(JSON.stringify(data));
  },
  
  decrypt: function(b64) {
    try {
      return JSON.parse(atob(b64));
    } catch (e) {
      return null;
    }
  }
};

const DEFAULT_STATE = {
  site: { announcements: [] },
  preferences: { theme: 'dark' }
};

function loadStoreState() {
  const rawData = localStorage.getItem('h4xstore_global_state_secure');
  const checksum = localStorage.getItem('h4xstore_global_state_checksum');

  if (rawData && checksum) {
    if (StoreSecurity.hash(rawData) !== checksum) {
      localStorage.removeItem('h4xstore_global_state_secure');
      localStorage.removeItem('h4xstore_global_state_checksum');
      return saveStoreState(DEFAULT_STATE);
    }

    const decrypted = StoreSecurity.decrypt(rawData);
    if (decrypted) {
      return {
        site: DEFAULT_STATE.site,
        preferences: decrypted.preferences || DEFAULT_STATE.preferences
      };
    }
  }

  return saveStoreState(DEFAULT_STATE);
}

function saveStoreState(state) {
  const safeState = {
    preferences: (state && state.preferences) ? state.preferences : DEFAULT_STATE.preferences
  };

  const encryptedState = StoreSecurity.encrypt(safeState);
  const stateChecksum = StoreSecurity.hash(encryptedState);

  localStorage.setItem('h4xstore_global_state_secure', encryptedState);
  localStorage.setItem('h4xstore_global_state_checksum', stateChecksum);
  window.globalState = {
    site: DEFAULT_STATE.site,
    preferences: safeState.preferences
  };
  return window.globalState;
}

window.getKomerzaStoreId = getKomerzaStoreId;
window.StoreSecurity = StoreSecurity;
window.DEFAULT_STATE = DEFAULT_STATE;
window.loadStoreState = loadStoreState;
window.saveStoreState = saveStoreState;
window.globalState = loadStoreState();

