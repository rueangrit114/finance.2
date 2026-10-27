/* ชั้นข้อมูล: ใช้ Supabase ถ้าใส่ค่าใน config.js แล้ว ไม่งั้นเก็บในเครื่อง (โหมดทดลอง) */
(function () {
  'use strict';
  const cfg = window.APP_CONFIG || {};
  const configured = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !/YOUR_|xxxx/i.test(cfg.SUPABASE_URL + cfg.SUPABASE_ANON_KEY));
  let sb = null;
  if (configured && window.supabase) {
    try { sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY); } catch (e) { console.error(e); }
  }
  const live = !!sb;

  const LS = {
    get(k, d) { try { const v = localStorage.getItem('baan:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('baan:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };
  const uid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9));
  const num = (x) => Number(x) || 0;

  const normTx = (r) => ({ id: r.id, date: String(r.date).slice(0, 10), type: r.type, amount: num(r.amount), category: r.category || '', description: r.description || '', person: r.person || '' });
  const normShop = (r) => ({ id: r.id, date: String(r.date).slice(0, 10), sales: num(r.sales), cost: num(r.cost), profit: num(r.profit), note: r.note || '', alloc: r.alloc && r.alloc.amounts ? r.alloc : null });

  async function fetchAll(table) {
    const out = [];
    const size = 1000;
    for (let from = 0; ; from += size) {
      const { data, error } = await sb.from(table).select('*').order('date', { ascending: true }).order('id', { ascending: true }).range(from, from + size - 1);
      if (error) throw error;
      out.push(...data);
      if (data.length < size) break;
    }
    return out;
  }

  const DB = {
    live,
    async loadAll() {
      if (live) {
        const [tx, shop, st] = await Promise.all([
          fetchAll('transactions'),
          fetchAll('shop_days'),
          sb.from('app_settings').select('*'),
        ]);
        if (st.error) throw st.error;
        const settings = {};
        (st.data || []).forEach((r) => { settings[r.key] = r.value; });
        return { tx: tx.map(normTx), shop: shop.map(normShop), settings };
      }
      return { tx: LS.get('tx', []).map(normTx), shop: LS.get('shop', []).map(normShop), settings: LS.get('settings', {}) };
    },

    async addTx(rows) {
      if (live) {
        const payload = rows.map((r) => ({ date: r.date, type: r.type, amount: r.amount, category: r.category, description: r.description, person: r.person }));
        const { data, error } = await sb.from('transactions').insert(payload).select();
        if (error) throw error;
        return data.map(normTx);
      }
      const made = rows.map((r) => normTx(Object.assign({ id: uid() }, r)));
      LS.set('tx', LS.get('tx', []).concat(made));
      return made;
    },
    async updateTx(id, patch) {
      if (live) {
        const { data, error } = await sb.from('transactions').update(patch).eq('id', id).select();
        if (error) throw error;
        return normTx(data[0]);
      }
      const list = LS.get('tx', []);
      const i = list.findIndex((r) => r.id === id);
      if (i >= 0) list[i] = Object.assign(list[i], patch);
      LS.set('tx', list);
      return normTx(list[i]);
    },
    async deleteTx(id) {
      if (live) {
        const { error } = await sb.from('transactions').delete().eq('id', id);
        if (error) throw error;
        return;
      }
      LS.set('tx', LS.get('tx', []).filter((r) => r.id !== id));
    },

    async saveShop(row) {
      const payload = { date: row.date, sales: row.sales, cost: row.cost, profit: row.profit, note: row.note || '', alloc: row.alloc || {} };
      if (live) {
        payload.updated_at = new Date().toISOString();
        const { data, error } = await sb.from('shop_days').upsert(payload, { onConflict: 'date' }).select();
        if (error) throw error;
        return normShop(data[0]);
      }
      const list = LS.get('shop', []);
      const i = list.findIndex((r) => r.date === row.date);
      if (i >= 0) list[i] = Object.assign(list[i], payload); else list.push(Object.assign({ id: uid() }, payload));
      LS.set('shop', list);
      return normShop(i >= 0 ? list[i] : list[list.length - 1]);
    },
    async deleteShop(id) {
      if (live) {
        const { error } = await sb.from('shop_days').delete().eq('id', id);
        if (error) throw error;
        return;
      }
      LS.set('shop', LS.get('shop', []).filter((r) => r.id !== id));
    },

    async setSetting(key, value) {
      if (live) {
        const { error } = await sb.from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        if (error) throw error;
        return;
      }
      const s = LS.get('settings', {});
      s[key] = value;
      LS.set('settings', s);
    },
  };
  window.DB = DB;
})();
