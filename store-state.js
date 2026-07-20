/**
 * ==============================================================================
 * H4X-STORE ENTERPRISE STORE STATE (KOMERZA SYNCED)
 * ==============================================================================
 */

// --- KOMERZA LIVE API CONFIGURATION ---
const KOMERZA_API_KEY = "eyJhbGciOiJFUzI1NiIsImtpZCI6Ijc3ZDFiNDBkLWE2NzYtNGI1MS1hNTg3LWZiZDE4OGI5YmZkZiIsInR5cCI6IkpXVCJ9.eyJuYmYiOiIxNzg0MTIzOTE3IiwiaXNzIjoiS29tZXJ6YSIsImlhdCI6IjE3ODQxMjM5MTciLCJhdWQiOiJtZXJjaGFudCIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJjYTZlNjgwMS1mNTYyLTRjZjItYjYwZi1iOGM2NjMzODcwMmMiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjNjNGM0MDlhLTZmNGQtNDNjZC05MmEwLTE0NGRjZmViNTUwNSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6Im00c2hhbGxtYWxsMHdAZ21haWwuY29tIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiZnJlZSIsImFwaV9rZXlfaWQiOiI2YmNjYjk4MC1jNWJmLTRmNDUtYTAxZi01ZWM1MTY4ZGM3OGUiLCJleHAiOiIyNTM0MDIzMDA3OTkiLCJrZXlfZmxhZ3MiOiJhcGkiLCJzY29wZSI6WyJzdG9yZXMudXBkYXRlIiwic3RvcmVzLmFmZmlsaWF0ZXMudXBkYXRlIiwic3RvcmVzLnByb2R1Y3RzLnVwZGF0ZSIsInN0b3Jlcy50aWNrZXRzLnVwZGF0ZSIsInN0b3Jlcy5jb3Vwb25zLnVwZGF0ZSIsInN0b3Jlcy5jdXN0b21lcnMudXBkYXRlIiwic3RvcmVzLmNhdGVnb3JpZXMudXBkYXRlIiwic3RvcmVzLmNyZWF0ZSIsInN0b3Jlcy5wcm9kdWN0cy5jcmVhdGUiLCJzdG9yZXMuY291cG9ucy5jcmVhdGUiLCJzdG9yZXMuY3VzdG9tZXJzLmNyZWF0ZSIsInN0b3Jlcy5jYXRlZ29yaWVzLmNyZWF0ZSIsInN0b3Jlcy52aWV3Iiwic3RvcmVzLmFuYWx5dGljcy52aWV3Iiwic3RvcmVzLmFmZmlsaWF0ZXMudmlldyIsInN0b3Jlcy5wcm9kdWN0cy52aWV3IiwidXNlci52aWV3IiwidXNlci5jcnlwdG8udmlld0VuYWJsZWQiLCJzdG9yZXMub3JkZXJzLnZpZXciLCJzdG9yZXMudGlja2V0cy52aWV3Iiwic3RvcmVzLmNvdXBvbnMudmlldyIsInN0b3Jlcy5jdXN0b21lcnMudmlldyIsInN0b3Jlcy5jYXRlZ29yaWVzLnZpZXciLCJzdG9yZXMuY291cG9ucy5kZWxldGUiLCJzdG9yZXMucHJvZHVjdHMuZGVsZXRlIiwic3RvcmVzLnRpY2tldHMuZGVsZXRlIiwic3RvcmVzLmNhdGVnb3JpZXMuZGVsZXRlIiwic3RvcmVzLm9yZGVycy5kZWxpdmVyIiwidXNlci53ZWJob29rcy5jcmVhdGUiLCJ1c2VyLndlYmhvb2tzLnVwZGF0ZSIsInVzZXIud2ViaG9va3MuZGVsZXRlIiwidXNlci53ZWJob29rcy52aWV3Iiwic3RvcmVzLm9yZGVycy5jcmVhdGUiLCJzdG9yZXMub3JkZXJzLnJlZnVuZCIsInN0b3Jlcy5kaXNjb3VudGRpYWxvZ3MudmlldyIsInN0b3Jlcy5kaXNjb3VudGRpYWxvZ3MuY3JlYXRlIiwic3RvcmVzLmRpc2NvdW50ZGlhbG9ncy51cGRhdGUiLCJzdG9yZXMuZGlzY291bnRkaWFsb2dzLmRlbGV0ZSIsInN0b3Jlcy5ibGFja2xpc3QudmlldyIsInN0b3Jlcy5ibGFja2xpc3QuY3JlYXRlIiwic3RvcmVzLmJsYWNrbGlzdC51cGRhdGUiLCJzdG9yZXMuYmxhY2tsaXN0LmRlbGV0ZSIsInN0b3Jlcy5lbWFpbG1hcmtldGluZy52aWV3Iiwic3RvcmVzLmVtYWlsbWFya2V0aW5nLnVwZGF0ZSIsInN0b3Jlcy5ibG9nLnZpZXciLCJzdG9yZXMuYmxvZy5jcmVhdGUiLCJzdG9yZXMuYmxvZy51cGRhdGUiLCJzdG9yZXMuYmxvZy5kZWxldGUiXX0.4NKgSrd8ItNVSlfu85U4C9ZNoH8s2G2CRzznU17ylJvJb8oVDRA8T0o_4P9sM42RyNY-vFJqGxaCdc1VLsir9w";

let CACHED_STORE_ID = localStorage.getItem('h4x_komerza_store_id');

// Securely fetches the actual Store ID from Komerza's API
async function getKomerzaStoreId() {
    if (CACHED_STORE_ID) return CACHED_STORE_ID;
    try {
        const response = await fetch('https://api.komerza.com/user', {
            headers: { 'Authorization': `Bearer ${KOMERZA_API_KEY}`, 'User-Agent': 'H4xStore/1.0' }
        });
        const data = await response.json();
        if (data.success && data.data && data.data.stores && data.data.stores.length > 0) {
            CACHED_STORE_ID = data.data.stores[0].id;
            localStorage.setItem('h4x_komerza_store_id', CACHED_STORE_ID);
            return CACHED_STORE_ID;
        }
    } catch(e) {
        console.warn("Failed to fetch user stores", e);
    }
    return null;
}

const StoreSecurity = {
  MASTER_KEY: "H4X_STOREFRONT_SECURE_V8", // Cache invalidated
  
  hash: function(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  },
  
  encrypt: function(data) {
    const jsonStr = JSON.stringify(data);
    let encrypted = '';
    for (let i = 0; i < jsonStr.length; i++) {
      encrypted += String.fromCharCode(jsonStr.charCodeAt(i) ^ this.MASTER_KEY.charCodeAt(i % this.MASTER_KEY.length));
    }
    return btoa(encrypted);
  },
  
  decrypt: function(b64) {
    try {
      const encrypted = atob(b64);
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ this.MASTER_KEY.charCodeAt(i % this.MASTER_KEY.length));
      }
      return JSON.parse(decrypted);
    } catch (e) {
      return null;
    }
  }
};

const DEFAULT_STATE = {
  site: { announcements: [] },
  videos: [],
  discountCodes: [], // Unused on frontend now. Handled by Komerza securely.
  withdrawals: [], // NEW: Securely tracks pending crypto payouts before Admin approval
  
  products: [
    {
      id: '1',
      name: 'Lifetime Access',
      price: 15.00,
      komerzaProductId: "7e42da01-fca5-452d-a8c5-f1219848d263",
      komerzaVariantId: "27bc2f01-7182-4795-9b52-31ba2c8f53c8",
      category: 'lifetime',
      bestSeller: true,
      hidden: false,
      sale: false,
      stock: 50,
      maxStock: 100,
      features: [
        'Lifetime Access',
        'Unlimited Updates',
        'Works on All Supported Scripts',
        'Premium Discord Role',
        'One-Time Purchase',
        'Priority Support'
      ]
    },
    {
      id: '2',
      name: '1 Month Access',
      price: 4.50,
      komerzaProductId: "b7fc1576-e839-4a2b-ac15-6d8f0fcd371b",
      komerzaVariantId: "00f38464-5e96-4ea4-bf98-7d45bed41499",
      category: 'popular',
      bestSeller: false,
      hidden: false,
      sale: false,
      stock: 85,
      maxStock: 200,
      features: [
        '30 Days Access',
        'Unlimited Updates',
        'Works on All Supported Scripts',
        'Buyer Discord Role',
        'Renew Anytime'
      ]
    },
    {
      id: '3',
      name: '1 Week Access',
      price: 2.99,
      komerzaProductId: "d2a31058-8aa0-4c53-968f-15132be5483e",
      komerzaVariantId: "cacbc2d2-0700-4059-8732-5ddce3d182e7",
      category: 'all',
      bestSeller: false,
      hidden: false,
      sale: false,
      stock: 120,
      maxStock: 200,
      features: [
        '7 Days Access',
        'Unlimited Updates',
        'Works on All Supported Scripts',
        'Buyer Discord Role',
        'Renew Anytime'
      ]
    }
  ]
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
      if (!decrypted.site) decrypted.site = { announcements: [] };
      if (!decrypted.videos) decrypted.videos = [];
      if (!decrypted.withdrawals) decrypted.withdrawals = []; // Safeguard for existing databases
      return decrypted;
    }
  }

  return saveStoreState(DEFAULT_STATE);
}

function saveStoreState(state) {
  const encryptedState = StoreSecurity.encrypt(state);
  const stateChecksum = StoreSecurity.hash(encryptedState);
  
  localStorage.setItem('h4xstore_global_state_secure', encryptedState);
  localStorage.setItem('h4xstore_global_state_checksum', stateChecksum);
  
  window.globalState = state;
  return state;
}

// Global Exports
window.KOMERZA_API_KEY = KOMERZA_API_KEY;
window.getKomerzaStoreId = getKomerzaStoreId;
window.StoreSecurity = StoreSecurity;
window.DEFAULT_STATE = DEFAULT_STATE;
window.loadStoreState = loadStoreState;
window.saveStoreState = saveStoreState;
window.globalState = loadStoreState();