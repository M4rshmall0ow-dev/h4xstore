let prisma;

if (process.env.NODE_ENV === 'test') {
  // lightweight stub for tests that do not need DB access
  const _productStore = [];
  const _variantStore = [];

  function now() { return new Date().toISOString(); }
  function genId() { return Math.random().toString(36).slice(2); }

  const product = {
    _store: _productStore,
    create: async function ({ data }) {
      const rec = {
        id: genId(),
        sku: data.sku || null,
        name: data.name,
        description: data.description || null,
        price: data.price || null,
        currency: data.currency || 'USD',
        featured: !!data.featured,
        visible: typeof data.visible === 'undefined' ? true : !!data.visible,
        categories: data.categories || [],
        images: data.images || [],
        createdAt: now(),
        updatedAt: now(),
        variants: []
      };
      this._store.push(rec);
      return rec;
    },
    findMany: async function ({ where, skip, take } = {}) {
      let res = this._store.slice();
      if (where) {
        if (typeof where.visible !== 'undefined') res = res.filter(r => r.visible === where.visible);
        if (where.q) res = res.filter(r => r.name && r.name.toLowerCase().includes(String(where.q).toLowerCase()));
        if (where.categories) res = res.filter(r => (r.categories || []).some(c => where.categories.includes(c)));
      }
      if (typeof skip === 'number') res = res.slice(skip);
      if (typeof take === 'number') res = res.slice(0, take);
      return res;
    },
    findUnique: async function ({ where, include } = {}) {
      const id = where && where.id;
      const rec = this._store.find(r => r.id === id) || null;
      if (!rec) return null;
      if (include && include.variants) {
        const vs = _variantStore.filter(v => v.productId === rec.id);
        return { ...rec, variants: vs };
      }
      return rec;
    },
    update: async function ({ where, data }) {
      const id = where.id;
      const idx = this._store.findIndex(r => r.id === id);
      if (idx === -1) throw new Error('NotFound');
      const target = this._store[idx];
      const updated = { ...target, ...data, updatedAt: now() };
      this._store[idx] = updated;
      return updated;
    },
    count: async function ({ where } = {}) {
      const all = await this.findMany({ where });
      return all.length;
    }
  };

  const productVariant = {
    _store: _variantStore,
    create: async function ({ data }) {
      const rec = {
        id: genId(),
        productId: data.productId,
        sku: data.sku || null,
        name: data.name || null,
        price: data.price || null,
        stock: typeof data.stock === 'number' ? data.stock : 0,
        meta: data.meta || {},
        createdAt: now(),
        updatedAt: now()
      };
      this._store.push(rec);
      return rec;
    },
    findMany: async function ({ where } = {}) {
      let res = this._store.slice();
      if (where && where.productId) res = res.filter(v => v.productId === where.productId);
      return res;
    },
    findUnique: async function ({ where } = {}) {
      return this._store.find(v => v.id === where.id) || null;
    },
    update: async function ({ where, data }) {
      const id = where.id;
      const idx = this._store.findIndex(v => v.id === id);
      if (idx === -1) throw new Error('NotFound');
      const target = this._store[idx];
      const updated = { ...target, ...data, updatedAt: now() };
      this._store[idx] = updated;
      return updated;
    },
    delete: async function ({ where }) {
      const id = where.id;
      const idx = this._store.findIndex(v => v.id === id);
      if (idx === -1) throw new Error('NotFound');
      const rec = this._store.splice(idx, 1)[0];
      return rec;
    }
  };

  prisma = {
    $on: () => {},
    $queryRaw: async () => 1,
    product,
    productVariant,
    $transaction: async (fn) => {
      if (typeof fn === 'function') return await fn({ product, productVariant });
      return fn;
    },

    // keep some other stubs used elsewhere
    user: { findUnique: async () => null },
    session: { updateMany: async () => ({}), create: async () => ({}) },
    auditLog: { create: async () => ({}) },
    passwordReset: { create: async () => ({}) },
    licenseKey: {
      _store: [],
      createMany: async function ({ data, skipDuplicates }) {
        let count = 0;
        for (const d of data) {
          const exists = this._store.find(x => x.key === d.key);
          if (exists && skipDuplicates) continue;
          const rec = { id: d.id || genId(), key: d.key, productId: d.productId, used: false, reserved: false };
          this._store.push(rec);
          count++;
        }
        return { count };
      },
      create: async function ({ data }) {
        const rec = { id: genId(), key: data.key, productId: data.productId, used: false, reserved: false };
        this._store.push(rec);
        return rec;
      },
      findMany: async function ({ where }) {
        if (!where) return this._store;
        return this._store.filter(k => {
          if (where.productId && k.productId !== where.productId) return false;
          return true;
        });
      }
    }
  };
} else {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'info', emit: 'event' },
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' }
    ]
  });

  prisma.$on('query', (e) => {
    // For production, route to logger instead
    // console.log('Prisma query: ' + e.query);
  });
}

module.exports = prisma;
