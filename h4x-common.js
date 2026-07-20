const H4X = {
  STORAGE_KEYS: {
    cart: 'h4xstore_cart',
    wishlist: 'h4xstore_wishlist',
    recentSearches: 'h4xstore_recent_searches',
    recentViews: 'h4xstore_recent_views',
    account: 'h4xstore_account'
  },

  formatPrice(value) {
    return `$${value.toFixed(2)}`;
  },

  copyToClipboard(text, message = 'Copied!') {
    if (!navigator.clipboard) return this.addToast('Copy not supported.');
    navigator.clipboard.writeText(text).then(() => this.addToast(message)).catch(() => this.addToast('Copy failed.'));
  },

  addToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 px-5 py-4 rounded-2xl border transition-transform duration-300 shadow-xl max-w-md text-sm font-semibold ${type === 'success' ? 'bg-[#081009] border-[#00ff88]/30 text-white' : type === 'error' ? 'bg-[#220202] border-[#ff4d4d]/30 text-white' : type === 'warning' ? 'bg-[#241c03] border-[#fbbf24]/30 text-white' : 'bg-[#08101d] border-white/10 text-white'}`;
    toast.innerHTML = `
      <span class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xl">${type === 'success' ? '✓' : type === 'error' ? '!' : type === 'warning' ? '!' : '•'}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('translate-x-0'));
    setTimeout(() => {
      toast.classList.add('opacity-0');
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  },

  loadCart() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.cart) || '[]');
    } catch (err) {
      return [];
    }
  },

  saveCart(cart) {
    localStorage.setItem(this.STORAGE_KEYS.cart, JSON.stringify(cart));
  },

  loadWishlist() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.wishlist) || '[]');
    } catch (err) {
      return [];
    }
  },

  saveWishlist(wishlist) {
    localStorage.setItem(this.STORAGE_KEYS.wishlist, JSON.stringify(wishlist));
  },

  toggleWishlist(id) {
    const list = this.loadWishlist();
    const index = list.indexOf(id);
    if (index === -1) {
      list.push(id);
      this.addToast('Added to wishlist');
    } else {
      list.splice(index, 1);
      this.addToast('Removed from wishlist', 'warning');
    }
    this.saveWishlist(list);
    this.updateWishlistCounter();
    return list;
  },

  isWishlisted(id) {
    return this.loadWishlist().includes(id);
  },

  updateWishlistCounter() {
    const count = this.loadWishlist().length;
    document.querySelectorAll('.wishlist-count').forEach(el => {
      if (count > 0) {
        el.textContent = count;
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });
  },

  loadRecentSearches() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.recentSearches) || '[]');
    } catch (err) {
      return [];
    }
  },

  saveRecentSearch(query) {
    if (!query) return;
    const searches = this.loadRecentSearches();
    const normalized = query.trim();
    if (!normalized) return;
    const unique = searches.filter(item => item.toLowerCase() !== normalized.toLowerCase());
    unique.unshift(normalized);
    localStorage.setItem(this.STORAGE_KEYS.recentSearches, JSON.stringify(unique.slice(0, 8)));
  },

  loadRecentViews() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.recentViews) || '[]');
    } catch (err) {
      return [];
    }
  },

  saveRecentView(id) {
    if (!id) return;
    const views = this.loadRecentViews();
    const unique = views.filter(item => item !== id);
    unique.unshift(id);
    localStorage.setItem(this.STORAGE_KEYS.recentViews, JSON.stringify(unique.slice(0, 8)));
  },

  getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  },

  bindShellInteractions() {
    document.querySelectorAll('[data-shell-toggle]').forEach(btn => {
      const target = btn.dataset.shellToggle;
      const panel = document.getElementById(target);
      if (!panel) return;
      btn.addEventListener('click', () => {
        panel.classList.toggle('hidden');
        panel.classList.toggle('opacity-0');
      });
    });

    document.querySelectorAll('[data-shell-close]').forEach(btn => {
      const target = btn.dataset.shellClose;
      const panel = document.getElementById(target);
      if (!panel) return;
      btn.addEventListener('click', () => {
        panel.classList.add('hidden');
        panel.classList.add('opacity-0');
      });
    });
  },

  createStarElements(rating) {
    return Array.from({ length: 5 }, (_, index) => {
      const star = document.createElement('i');
      star.className = 'w-4 h-4 text-yellow-400';
      star.innerHTML = index < rating ? '★' : '☆';
      return star;
    });
  },

  createRatingHtml(rating) {
    return Array.from({ length: 5 }, (_, index) => `<span class="inline-block w-3 h-3 leading-3 text-yellow-400">${index < rating ? '★' : '☆'}</span>`).join('');
  },

  interpolatePercentage(from, to, duration = 600) {
    const start = performance.now();
    return new Promise(resolve => {
      const step = now => {
        const elapsed = Math.min(now - start, duration);
        const value = from + ((to - from) * (elapsed / duration));
        if (elapsed < duration) {
          window.requestAnimationFrame(step);
        } else {
          resolve(to);
        }
        return value;
      };
      window.requestAnimationFrame(step);
    });
  },

  setUpSearchPanel() {
    const searchInput = document.getElementById('site-search-input');
    const searchResults = document.getElementById('site-search-results');
    if (!searchInput || !searchResults) return;
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      const products = window.H4X_PRODUCTS || [];
      if (!query) {
        searchResults.innerHTML = '<div class="px-5 py-4 text-sm text-zinc-400">Type to search products, categories, or features.</div>';
        return;
      }
      const matches = products.filter(p => p.name.toLowerCase().includes(query) || p.features.some(f => f.toLowerCase().includes(query)) || p.category.toLowerCase().includes(query));
      if (matches.length === 0) {
        searchResults.innerHTML = `
          <div class="px-5 py-4 text-sm text-zinc-400">No results found for <strong>${query}</strong>.</div>
        `;
      } else {
        searchResults.innerHTML = matches.slice(0, 6).map(p => `
          <button class="w-full text-left px-5 py-3 hover:bg-white/5 transition-colors rounded-2xl flex items-center gap-3" onclick="window.location.href='product.html?id=${p.id}'">
            <span class="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white text-base font-bold">${p.name.charAt(0)}</span>
            <div>
              <div class="font-semibold text-white">${p.name}</div>
              <div class="text-xs text-zinc-400">${p.category} · ${this.formatPrice(p.price)}</div>
            </div>
          </button>
        `).join('');
      }
    });
  }
};

window.H4X = H4X;

window.addEventListener('DOMContentLoaded', () => {
  if (document.querySelectorAll('.wishlist-count').length > 0) {
    H4X.updateWishlistCounter();
  }
  H4X.bindShellInteractions();
});