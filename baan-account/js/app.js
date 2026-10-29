/* บัญชีบ้านเรา — ตัวแอพหลัก (ไม่ต้อง build เปิดไฟล์ได้เลย) */
(function () {
  'use strict';
  const P = window.Parser, T = window.Themes, DB = window.DB, C = window.Charts;

  /* ---------- ค่าคงที่ / ตัวช่วย ---------- */
  const STOCK = 'ซื้อของเข้าร้าน';
  const SALARY = 'เงินเดือน';
  const MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const MONTHS_S = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const WD = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const WD_S = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const MODE_TH = { day: 'วัน', week: 'สัปดาห์', month: 'เดือน', year: 'ปี' };
  const DEF_ALLOC = { names: ['เงินเก็บครอบครัว', 'ทุนสำรองธุรกิจ', 'เกด'], pcts: [50, 15] };
  const TABS = [
    ['dash', 'สรุป', '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'],
    ['add', 'จดรายการ', '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'],
    ['list', 'รายการ', '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'],
    ['shop', 'ร้านข้าว', '<path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6"/>'],
    ['ana', 'วิเคราะห์', '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>'],
    ['settings', 'ตั้งค่า', '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>'],
  ];
  const ICON = {
    edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
    del: '<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  };

  const $ = (s, el) => (el || document).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const fromISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const today = () => iso(new Date());
  const addDays = (s, n) => { const d = fromISO(s); d.setDate(d.getDate() + n); return iso(d); };
  const addMonths = (s, n) => { const d = fromISO(s); d.setDate(1); d.setMonth(d.getMonth() + n); return iso(d); };
  const diffDays = (a, b) => Math.round((fromISO(b) - fromISO(a)) / 864e5);
  const weekStart = (s) => { const d = fromISO(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
  const be = (y) => y + 543;
  const fmtD = (s) => { const d = fromISO(s); return `${d.getDate()} ${MONTHS_S[d.getMonth()]} ${be(d.getFullYear())}`; };
  const fmtLong = (s) => { const d = fromISO(s); return `วัน${WD[d.getDay()]}ที่ ${d.getDate()} ${MONTHS_S[d.getMonth()]} ${be(d.getFullYear())}`; };
  const fmtShort = (s) => { const d = fromISO(s); return `${d.getDate()} ${MONTHS_S[d.getMonth()]}`; };
  const fmtRow = (s) => { const d = fromISO(s); return `${WD_S[d.getDay()]} ${d.getDate()} ${MONTHS_S[d.getMonth()]}`; };
  const num = (v) => { const n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; };
  const round2 = (n) => Math.round(n * 100) / 100;
  const money = (n) => { n = Number(n) || 0; return (n < 0 ? '-' : '') + '฿' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);
  const sumBy = (list, f) => list.reduce((a, x) => a + f(x), 0);
  const opt = (v, l, sel) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(l)}</option>`;
  const showNum = (x) => (x ? String(round2(x)) : '');
  const fmtField = (s) => { const d = fromISO(s); return `${WD_S[d.getDay()]} ${d.getDate()} ${MONTHS_S[d.getMonth()]} ${be(d.getFullYear())}`; };

  function range(mode, a) {
    if (mode === 'day') return { from: a, to: a, label: fmtLong(a) };
    if (mode === 'week') {
      const f = weekStart(a), t = addDays(f, 6), dt = fromISO(t);
      return { from: f, to: t, label: `${fmtShort(f)} – ${fmtShort(t)} ${be(dt.getFullYear())}` };
    }
    const d = fromISO(a);
    if (mode === 'month') {
      return { from: iso(new Date(d.getFullYear(), d.getMonth(), 1, 12)), to: iso(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12)), label: `${MONTHS[d.getMonth()]} ${be(d.getFullYear())}` };
    }
    return { from: `${d.getFullYear()}-01-01`, to: `${d.getFullYear()}-12-31`, label: `ปี ${be(d.getFullYear())}` };
  }
  function step(mode, a, dir) {
    return mode === 'day' ? addDays(a, dir) : mode === 'week' ? addDays(a, 7 * dir) : mode === 'month' ? addMonths(a, dir) : addMonths(a, 12 * dir);
  }
  function buckets(mode, a) {
    const r = range(mode, a), out = [];
    if (mode === 'year') {
      const y = fromISO(a).getFullYear();
      for (let m = 0; m < 12; m++) {
        out.push({ key: `${y}-${pad(m + 1)}`, from: `${y}-${pad(m + 1)}-01`, to: iso(new Date(y, m + 1, 0, 12)), label: MONTHS_S[m], full: `${MONTHS[m]} ${be(y)}` });
      }
      return out;
    }
    const from = mode === 'day' ? addDays(a, -6) : r.from, to = mode === 'day' ? a : r.to;
    for (let d = from; d <= to; d = addDays(d, 1)) {
      const dt = fromISO(d);
      out.push({ key: d, from: d, to: d, label: mode === 'month' ? String(dt.getDate()) : WD_S[dt.getDay()], full: fmtLong(d) });
    }
    return out;
  }
  const keyOf = (mode, date) => (mode === 'year' ? date.slice(0, 7) : date);

  /* ---------- สถานะ ---------- */
  const state = {
    tab: 'dash', tx: [], shopDays: [], moves: [],
    settings: { theme: T.defaultId, categories: null, people: ['เกด'], alloc: null, capital: 0, capDays: 7, cashAdj: 0, cards: [] },
    dash: { mode: 'month', anchor: today(), person: '', catType: 'expense' },
    list: { mode: 'month', anchor: today(), person: '', cat: '', q: '', open: new Set() },
    add: { date: today(), person: '', text: '', rows: [], help: false, potMode: 'auto' },
    ana: { mode: 'month', anchor: today() },
    shopUI: { mode: 'month', anchor: today(), form: null, series: { sales: true, cost: true, profit: true } },
    themeGroup: 'pastel', sel: {}, open: {}, personOpen: new Set(), catOpen: null, potOpen: -1, anaOpen: new Set(), lastLoad: Date.now(),
  };
  const cache = {};

  function cats() {
    let l = state.settings.categories || P.DEFAULT_CATEGORIES;
    if (!l.some((c) => c.name === STOCK)) {
      l = l.slice();
      const def = P.DEFAULT_CATEGORIES.find((c) => c.name === STOCK);
      const fi = l.findIndex((c) => c.name === P.FALLBACK.expense);
      if (def) l.splice(fi >= 0 ? fi : l.length, 0, def);
    }
    return l;
  }
  const catsOf = (type) => cats().filter((c) => c.type === type);
  function catInfo(name, type) {
    return cats().find((c) => c.name === name && (!type || c.type === type)) || cats().find((c) => c.name === name) ||
      { name, emoji: type === 'income' ? '💰' : '📦', color: '#a7a9ad', type: type || 'expense' };
  }
  function knownPeople() {
    const s = new Set(state.settings.people || []);
    state.tx.forEach((t) => { if (t.person) s.add(t.person); });
    return [...s];
  }
  function personFilter(list, p) {
    if (!p) return list;
    if (p === '__none') return list.filter((t) => !t.person);
    return list.filter((t) => t.person === p);
  }
  const total = (list, type) => sumBy(list.filter((t) => t.type === type), (t) => t.amount);
  const inRange = (list, from, to) => list.filter((t) => t.date >= from && t.date <= to);

  async function saveSetting(key) {
    try { await DB.setSetting(key, state.settings[key]); } catch (e) { toast('บันทึกการตั้งค่าไม่สำเร็จ: ' + (e.message || e), true); }
  }
  function toast(msg, err) {
    const el = document.createElement('div');
    el.className = 'toast' + (err ? ' err' : '');
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), err ? 4200 : 2400);
  }
  const chartW = () => Math.max(280, ($('.app') ? $('.app').clientWidth : 360) - 64);

  /* ---------- กราฟ (แตะแล้วมีป้ายลอย + แผงรายละเอียด) ---------- */
  function drawChart(name) {
    const c = cache[name];
    return C[c.type](Object.assign({}, c.opts, { width: c.width ? c.width() : chartW(), sel: state.sel[name] == null ? -1 : state.sel[name] }));
  }
  function readText(name) {
    const i = state.sel[name];
    return i == null || i < 0 ? 'เอานิ้วจิ้มบนกราฟเพื่อดูค่าได้เลย' : cache[name].read(i);
  }
  function chartBlock(name, type, opts, read, extra) {
    cache[name] = Object.assign({ type, opts, read }, extra || {});
    return `<div class="chart-scroll" data-chart="${name}">${drawChart(name)}</div>${cache[name].noRead ? '' : `<div class="readout" id="read-${name}">${readText(name)}</div>`}`;
  }
  function defaultSel(bks, vals) {
    const now = today();
    const ti = bks.findIndex((b) => now >= b.from && now <= b.to);
    if (ti >= 0) return ti;
    for (let i = bks.length - 1; i >= 0; i--) if (vals[i] > 0) return i;
    return -1;
  }

  /* ---------- แถบเลือกช่วงเวลา ---------- */
  function periodBar(k, st, o) {
    o = o || {};
    const modes = o.modes || ['day', 'week', 'month', 'year'];
    const r = range(st.mode, st.anchor);
    return `<div class="pbar">
      <div class="seg">${modes.map((m) => `<button class="${st.mode === m ? 'on' : ''}" data-act="p-mode" data-k="${k}" data-v="${m}">${MODE_TH[m]}</button>`).join('')}</div>
      <div class="nav"><button class="icon" data-act="p-prev" data-k="${k}" aria-label="ก่อนหน้า">${ICON.prev}</button><button class="plabel" data-act="p-pick" data-k="${k}" aria-label="เลือกวันที่">${r.label} <span class="caret">▾</span></button><button class="icon" data-act="p-next" data-k="${k}" aria-label="ถัดไป">${ICON.next}</button>${o.noToday ? '' : `<button class="btn sm ghost" data-act="p-today" data-k="${k}">วันนี้</button>`}</div>
    </div>`;
  }
  const stOf = (k) => (k === 'shop' ? state.shopUI : state[k]);

  /* ---------- ช่องวันที่: แตะแล้วเปิดปฏิทินเลย + ปุ่ม ‹ › + ปัดซ้ายขวา ---------- */
  function dateField(id, val, attrs) {
    return `<div class="datef"><button type="button" class="dnav" data-act="d-step" data-t="${id}" data-d="-1" aria-label="วันก่อนหน้า">${ICON.prev}</button><button type="button" class="dshow" data-act="d-open" data-t="${id}"><span class="dtxt">${fmtField(val)}</span></button><button type="button" class="dnav" data-act="d-step" data-t="${id}" data-d="1" aria-label="วันถัดไป">${ICON.next}</button><input type="date" id="${id}" class="dhid" value="${val}" tabindex="-1" ${attrs || ''}></div>`;
  }
  function syncDateLabel(inp) {
    const t = inp.parentElement && inp.parentElement.querySelector('.dtxt');
    if (t && inp.value) t.textContent = fmtField(inp.value);
  }
  function setDate(inp, val) {
    inp.value = val; syncDateLabel(inp);
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  }
  const parsePot = (v) => (v === '' || v == null ? null : /^\d+$/.test(String(v)) ? Number(v) : String(v));
  const walletCards = () => (state.settings.cards || []).filter((c) => c.wallet && String(c.src).startsWith('inc|'));
  const potOpts = (sel) => opt('', 'เงินในมือ', sel == null) + allocCfg().names.map((n, i) => opt(i, n, sel === i)).join('') + walletCards().map((c) => opt('c:' + c.id, c.emoji + ' ' + c.name, sel === 'c:' + c.id)).join('');

  /* ---------- แถวรายการ ---------- */
  function txRow(t, compact) {
    const c = catInfo(t.category, t.type);
    return `<div class="trow${compact ? ' compact' : ''}">
      <div class="ico" style="background:${c.color}26">${esc(c.emoji)}</div>
      <div class="tmain"><div class="tdesc">${esc(t.description || c.name)}</div><div class="tsub">${esc(c.name)}${t.person ? ' · ' + esc(t.person) : ''}</div></div>
      <div class="tamt ${t.type === 'income' ? 'inc' : 'exp'}">${t.type === 'income' ? '+' : '-'}${money(t.amount)}</div>
      ${compact ? '' : `<div class="tbtns"><button class="icon" data-act="tx-edit" data-id="${t.id}" aria-label="แก้ไข">${ICON.edit}</button><button class="icon del" data-act="tx-del" data-id="${t.id}" aria-label="ลบ">${ICON.del}</button></div>`}
    </div>`;
  }
  function personSelect(id, val, extra) {
    const ps = knownPeople();
    return `<select id="${id}" ${extra || ''}>${opt('', 'ทุกคน', !val)}${ps.map((p) => opt(p, p, val === p)).join('')}${opt('__none', 'ไม่ระบุชื่อ', val === '__none')}</select>`;
  }

  /* ---------- เงิน 3 กอง (จากหน้าร้านข้าว) ---------- */
  function allocCfg() {
    const a = state.settings.alloc || {};
    return { names: a.names && a.names.length === 3 ? a.names : DEF_ALLOC.names, pcts: a.pcts && a.pcts.length === 2 ? a.pcts : DEF_ALLOC.pcts };
  }
  function defaultAmounts(profit, cfg) {
    const p = Math.max(0, Number(profit) || 0);
    const a = round2((p * cfg.pcts[0]) / 100), b = round2((p * cfg.pcts[1]) / 100);
    return [a, b, round2(p - a - b)];
  }
  const entryAmounts = (e) => (e.alloc && e.alloc.amounts ? e.alloc.amounts : defaultAmounts(e.profit, allocCfg()));
  function potStats() {
    const s = [0, 1, 2].map(() => ({ auto: 0, manIn: 0, out: 0, spend: 0 }));
    state.shopDays.forEach((e) => { const a = entryAmounts(e); [0, 1, 2].forEach((i) => { s[i].auto += a[i] || 0; }); });
    state.moves.forEach((m) => { const x = s[m.pot]; if (!x) return; if (m.dir === 'in') x.manIn += m.amount; else x.out += m.amount; });
    state.tx.forEach((t) => { if (t.type === 'expense' && t.pot != null && s[t.pot]) s[t.pot].spend += t.amount; }); // จ่ายจากกองตอนจดรายการ
    return s.map((x) => ({ auto: round2(x.auto), manIn: round2(x.manIn), out: round2(x.out + x.spend), in: round2(x.auto + x.manIn), bal: round2(x.auto + x.manIn - x.out - x.spend) }));
  }
  // การ์ดกระเป๋าเงิน (เช่น เงินเดือนบอล) แยกจากทุนร้าน: รายรับที่การ์ดนับ และรายจ่ายที่เลือก “จ่ายจากการ์ด”
  const matchSrc = (c, t) => { const [k, a, b] = String(c.src).split('|'); if (k !== 'inc' || t.type !== 'income') return false; return a === 'cat' ? t.category === b : a === 'person' ? t.person === b : true; };
  const isFam = (t) => (t.type === 'income' ? walletCards().some((c) => matchSrc(c, t)) : typeof t.pot === 'string' && t.pot.startsWith('c:'));
  function walletCalc(c) {
    const inn = sumBy(state.tx.filter((t) => matchSrc(c, t)), (t) => t.amount);
    const out = sumBy(state.tx.filter((t) => t.type === 'expense' && t.pot === 'c:' + c.id), (t) => t.amount);
    return { inn: round2(inn), out: round2(out), bal: round2(inn - out) };
  }
  function capCalc(from, to) {
    const l = inRange(state.tx, from, to).filter((t) => !isFam(t));
    const hand = round2(total(l, 'income') - total(l, 'expense'));
    const psx = [0, 1, 2].map(() => ({ inn: 0, out: 0 }));
    state.shopDays.filter((e) => e.date >= from && e.date <= to).forEach((e) => { const a = entryAmounts(e); [0, 1, 2].forEach((i) => { psx[i].inn += a[i] || 0; }); });
    state.moves.filter((m) => m.date >= from && m.date <= to).forEach((m) => { if (psx[m.pot]) { if (m.dir === 'in') psx[m.pot].inn += m.amount; else psx[m.pot].out += m.amount; } });
    inRange(state.tx, from, to).forEach((t) => { if (t.type === 'expense' && t.pot != null && psx[t.pot]) psx[t.pot].out += t.amount; });
    const bal = psx.map((x) => round2(x.inn - x.out));
    const potSum = round2(sumBy(bal, (x) => x));
    const adj = from <= '0000-01-01' ? (Number(state.settings.cashAdj) || 0) : 0;
    return { hand, adj, psx, bal, potSum, free: round2(hand + adj - potSum) };
  }
  const ALL_FROM = '0000-01-01', ALL_TO = '9999-12-31';

  /* การ์ดของฉัน (กำหนดเองในหน้าสรุป) */
  function cardSrcOptions(sel) {
    const g = (label, items) => `<optgroup label="${label}">${items.map(([v, l]) => opt(v, l, v === sel)).join('')}</optgroup>`;
    const ppl = knownPeople(), nm = allocCfg().names;
    return g('รายรับ', [['inc|all', 'รายรับทั้งหมด'], ...catsOf('income').map((c) => ['inc|cat|' + c.name, 'หมวด ' + c.name]), ...ppl.map((p) => ['inc|person|' + p, 'ของ ' + p])]) +
      g('รายจ่าย', [['exp|all', 'รายจ่ายทั้งหมด'], ...catsOf('expense').map((c) => ['exp|cat|' + c.name, 'หมวด ' + c.name]), ...ppl.map((p) => ['exp|person|' + p, 'ของ ' + p])]) +
      g('ยอดคงเหลือ', [['free', 'ทุนที่เหลือรวม'], ...nm.map((n, i) => ['pot|' + i, 'กอง ' + n])]);
  }
  function cardValue(c) {
    const r = range(state.dash.mode, state.dash.anchor);
    const list = c.scope === 'all' ? state.tx : inRange(state.tx, r.from, r.to);
    const [kind, a, b] = String(c.src).split('|');
    if (c.wallet && kind === 'inc') { const w = walletCalc(c); return { v: w.bal, bal: true, sub: `คงเหลือ · รับ ${money(w.inn)} จ่าย ${money(w.out)}` }; }
    if (kind === 'free') return { v: capCalc(ALL_FROM, ALL_TO).free, bal: true, sub: 'ทุนที่เหลือรวม' };
    if (kind === 'pot') return { v: potStats()[Number(a)].bal, bal: true, sub: 'คงเหลือในกอง' };
    const type = kind === 'inc' ? 'income' : 'expense';
    let l = list.filter((t) => t.type === type);
    if (a === 'cat') l = l.filter((t) => t.category === b); else if (a === 'person') l = l.filter((t) => t.person === b);
    return { v: round2(sumBy(l, (t) => t.amount)), type, sub: (c.scope === 'all' ? 'ทั้งหมด' : r.label) + ` · ${l.length} รายการ` };
  }
  function openCard(id, quick) {
    const old = id ? (state.settings.cards || []).find((c) => c.id === id) : null;
    const c = old || Object.assign({ name: '', emoji: '⭐', color: '#4f8cff', src: 'inc|all', scope: 'period' }, quick || {});
    state.cardEdit = old ? old.id : null;
    openModal(`<h3>${old ? 'แก้ไขการ์ด' : 'เพิ่มการ์ด'}</h3>
      <div class="fields">
        <label class="f">ชื่อการ์ด<input id="cdName" value="${esc(c.name)}" placeholder="เช่น เงินเดือนพี่"></label>
        <label class="f">ไอคอน<input id="cdEmoji" value="${esc(c.emoji)}" maxlength="4"></label>
      </div>
      <div class="fields one"><label class="f">ให้นับอะไร<select id="cdSrc">${cardSrcOptions(c.src)}</select></label></div>
      <div class="fields"><label class="f">ช่วงเวลา<select id="cdScope">${opt('period', 'ตามช่วงที่เลือกด้านบน', c.scope !== 'all')}${opt('all', 'ทั้งหมด', c.scope === 'all')}</select></label>
        <label class="f">สี<input type="color" id="cdColor" value="${esc(c.color)}"></label></div>
      <label class="chk" id="cdWalletWrap" ${String(c.src).startsWith('inc|') ? '' : 'hidden'}><input type="checkbox" id="cdWallet" ${c.wallet ? 'checked' : ''}><span>ใช้จ่ายจากการ์ดนี้ได้ (เป็นกระเป๋าเงิน) — จะขึ้นในช่อง “จ่ายจาก” ตอนจดรายการ ยอดคงเหลือ = รายรับที่นับ − รายจ่ายที่จ่ายจากการ์ดนี้ ไม่ปนกับทุนร้าน</span></label>
      <p class="hint">ถ้าเลือก “ยอดคงเหลือ” หรือเป็นกระเป๋าเงิน ระบบแสดงยอดสะสมเสมอ ไม่ขึ้นกับช่วงเวลา</p>
      <div class="actions">${old ? '<button class="btn danger" data-act="card-del">ลบการ์ด</button>' : '<button class="btn" data-act="modal-close">ยกเลิก</button>'}<button class="btn primary" data-act="card-save">บันทึก</button></div>`);
    $('#cdSrc').addEventListener('change', () => { $('#cdWalletWrap').hidden = !$('#cdSrc').value.startsWith('inc|'); });
  }
  function saveCard() {
    const name = $('#cdName').value.trim();
    if (!name) return toast('ตั้งชื่อการ์ดก่อน', true);
    const c = { id: state.cardEdit || 'c' + Date.now().toString(36), name, emoji: $('#cdEmoji').value.trim() || '⭐', color: $('#cdColor').value, src: $('#cdSrc').value, scope: $('#cdScope').value, wallet: $('#cdSrc').value.startsWith('inc|') && $('#cdWallet').checked };
    const list = (state.settings.cards || []).slice(), i = list.findIndex((x) => x.id === c.id);
    if (i >= 0) list[i] = c; else list.push(c);
    state.settings.cards = list; saveSetting('cards'); closeModal(); toast('บันทึกการ์ดแล้ว ✓'); render(true);
  }
  function openAdjust() {
    const all = capCalc(ALL_FROM, ALL_TO);
    openModal(`<h3>ปรับให้ตรงเงินจริง</h3>
      <p class="lead">นับเงินทุนที่อยู่ในมือตอนนี้ <b>ไม่รวม</b>เงินที่แยกเก็บไว้ในกอง แล้วพิมพ์ตัวเลขที่นับได้ ระบบจะปรับยอดให้ตรง (ตอนนี้แอพคำนวณได้ ${money(all.free)}${all.adj ? ` · ปรับไว้แล้ว ${money(all.adj)}` : ''})</p>
      <label class="f">เงินทุนในมือจริง (บาท)<input id="adjAmt" class="money-in" inputmode="decimal" placeholder="${all.free}"></label>
      <div class="actions">${all.adj ? '<button class="btn danger" data-act="adj-clear">ล้างการปรับ</button>' : '<button class="btn" data-act="modal-close">ยกเลิก</button>'}<button class="btn primary" data-act="adj-save">ปรับยอด</button></div>`);
  }
  function saveAdjust(clear) {
    const all = capCalc(ALL_FROM, ALL_TO);
    let adj = 0;
    if (!clear) {
      const raw = $('#adjAmt').value.trim();
      if (raw === '') return toast('พิมพ์เงินที่นับได้ก่อน', true);
      adj = round2(num(raw) - (all.hand - all.potSum));
    }
    state.settings.cashAdj = adj; saveSetting('cashAdj'); closeModal(); toast(clear ? 'ล้างการปรับแล้ว' : 'ปรับยอดแล้ว ✓'); render(true);
  }

  /* ================= หน้าสรุป ================= */
  function dashPanel(i) {
    if (i == null || i < 0) return '<div class="sidehint">แตะแท่งกราฟเพื่อดูรายละเอียด</div>';
    const d = state.dash, b = cache.dash.bks[i];
    const list = personFilter(inRange(state.tx, b.from, b.to), d.person);
    const inc = total(list, 'income'), exp = total(list, 'expense');
    const sorted = list.slice().sort((a, z) => (a.date === z.date ? 0 : a.date < z.date ? 1 : -1));
    return `<div class="sidehead">${b.full}</div>
      <div class="sidekpi"><div><small>รายรับ</small><b class="inc">${money(inc)}</b></div><div><small>รายจ่าย</small><b class="exp">${money(exp)}</b></div><div><small>คงเหลือ</small><b>${money(inc - exp)}</b></div></div>
      ${sorted.length ? sorted.slice(0, 12).map((t) => txRow(t, true)).join('') + (sorted.length > 12 ? `<div class="sidehint">และอีก ${sorted.length - 12} รายการ</div>` : '') : '<div class="sidehint">ไม่มีรายการ</div>'}`;
  }

  function localBanner() {
    if (!DB.live) return '';
    const c = DB.localCounts(), n = c.tx + c.shop + c.moves;
    return n > 0 ? `<div class="demopill" style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap"><span>พบข้อมูลที่จดไว้ในเครื่องนี้ ${n} รายการ ที่ยังไม่ได้ขึ้น Supabase</span><span style="display:flex;gap:8px"><button class="btn sm primary" data-act="import-local">ย้ายขึ้น Supabase</button><button class="btn sm" data-act="discard-local">ไม่ย้าย</button></span></div>` : '';
  }
  async function importLocal(btn) {
    btn.disabled = true;
    try {
      const r = await DB.importLocal();
      const d = await DB.loadAll();
      state.tx = d.tx; state.shopDays = d.shop; state.moves = d.moves || [];
      toast(`ย้ายขึ้น Supabase แล้ว ${r.tx + r.shop + r.moves} รายการ ✓`); render(true);
    } catch (e) { toast('ย้ายไม่สำเร็จ: ' + (e.message || e), true); btn.disabled = false; }
  }

  /* การ์ดทุนหมุนเวียน (ใช้ในหน้าร้านข้าว) */
  function capCardHtml(st) {
    // ทุนหมุนเวียน = เงินในมือ (ไม่รวมเงินเดือน) − เงินที่แยกไว้ใน 3 กอง
    const r = range(st.mode, st.anchor), cfg = allocCfg();
    const view = state.potView === 'period' ? 'period' : 'all';
    const allc = capCalc(ALL_FROM, ALL_TO), cv = view === 'period' ? capCalc(r.from, r.to) : allc;
    const barBase = Math.max(1, cv.hand, sumBy(cv.bal.filter((x) => x > 0), (x) => x));
    const shopR = state.shopDays.filter((e) => e.date >= r.from && e.date <= r.to);
    const sSales = sumBy(shopR, (e) => e.sales), sProfit = sumBy(shopR, (e) => e.profit), gotCap = round2(sSales - sProfit);
    const isToday = st.mode === 'day' && st.anchor === today();
    const capOpen = !!state.open.capdet;
    return state.tx.length || state.shopDays.length || state.moves.length ? `<div class="card c-cap"><div class="pbar" style="margin-bottom:10px"><h2>ทุนหมุนเวียน</h2></div>
      <div class="kpis mini">
        <div class="kpi"><span>${isToday ? 'ทุนที่ได้วันนี้' : 'ทุนที่ได้ช่วงนี้'}</span><b>${money(gotCap)}</b><small>${shopR.length ? 'ยอดขาย − กำไร' : 'ยังไม่จดยอดร้านข้าว'}</small></div>
        <div class="kpi accent"><span>ทุนที่เหลือรวม</span><b>${money(allc.free)}</b><small>ในมือ ไม่รวมกอง</small></div>
        <div class="kpi"><span>เงิน 3 กอง</span><b>${money(allc.potSum)}</b><small>เก็บแยกไว้</small></div>
      </div>
      ${shopR.length ? `<div class="saleline">🍚 ขายร้านข้าว ${money(sSales)} = ทุน ${money(gotCap)} + กำไร ${money(sProfit)}</div>` : ''}
      <button class="linkbtn" data-act="acc" data-v="capdet">${capOpen ? 'ซ่อนวิธีคิด ▴' : 'ดูวิธีคิด / ปรับให้ตรงเงินจริง ▾'}</button>
      ${capOpen ? `<div class="capdet">
        <div class="seg" style="margin-bottom:10px"><button class="${view === 'all' ? 'on' : ''}" data-act="pot-view" data-v="all">สะสมทั้งหมด</button><button class="${view === 'period' ? 'on' : ''}" data-act="pot-view" data-v="period">${esc(r.label)}</button></div>
        <div class="potbig"><small>เงินในมือ (รายรับ − รายจ่าย ไม่รวมเงินเดือน)${cv.adj ? ' + ปรับยอด ' + money(cv.adj) : ''}</small><b class="${cv.hand + cv.adj < 0 ? 'exp' : ''}">${money(cv.hand + cv.adj)}</b></div>
        <div class="minus">หัก ที่เก็บแยกไว้ในแต่ละกอง</div>
        ${[0, 1, 2].map((i) => `<div class="lrow"><div class="nm"><i class="sw" style="background:var(--pot${i})"></i><span>${esc(cfg.names[i])}</span></div><div class="num ${cv.bal[i] < 0 ? 'exp' : ''}">${money(cv.bal[i])}</div><div class="bar"><i style="width:${Math.min(100, Math.max(0, cv.bal[i]) / barBase * 100)}%;background:var(--pot${i})"></i></div></div>`).join('')}
        <div class="freebox ${cv.free < 0 ? 'neg' : ''}"><div><b>ทุนที่เหลือ</b><small>${cv.free < 0 ? 'ติดลบ = เงินในมือน้อยกว่ายอดที่ตั้งไว้ในกอง' : 'เงินที่ใช้หมุนร้านได้'}</small></div><b class="num">${money(cv.free)}</b></div>
        <p class="hint">ยอดกอง = แบ่งจากกำไรร้านข้าว + โอนเข้า − โอนออก − รายจ่ายที่เลือก “จ่ายจากกอง”</p>
        <button class="btn sm" data-act="adj-open">นับเงินจริง / ปรับยอด</button>
      </div>` : ''}</div>` : '';
  }

  function viewDash(v) {
    const d = state.dash, r = range(d.mode, d.anchor);
    const base = personFilter(state.tx, d.person);
    const cur = inRange(base, r.from, r.to);
    const inc = total(cur, 'income'), exp = total(cur, 'expense');
    const bks = buckets(d.mode, d.anchor);
    const inc0 = bks.map(() => 0), exp0 = bks.map(() => 0);
    const idx = new Map(bks.map((b, i) => [b.key, i]));
    base.forEach((t) => { const i = idx.get(keyOf(d.mode, t.date)); if (i != null) (t.type === 'income' ? inc0 : exp0)[i] += t.amount; });

    let avgLabel = '', n = 0;
    const now = today();
    if (d.mode === 'year') {
      const y = fromISO(d.anchor).getFullYear(), cy = fromISO(now).getFullYear();
      n = y < cy ? 12 : y === cy ? fromISO(now).getMonth() + 1 : 0; avgLabel = 'ต่อเดือน';
    } else if (d.mode !== 'day') {
      n = r.from > now ? 0 : diffDays(r.from, r.to < now ? r.to : now) + 1; avgLabel = 'ต่อวัน';
    }

    const cl = (() => {
      const m = new Map();
      cur.filter((t) => t.type === d.catType).forEach((t) => m.set(t.category, (m.get(t.category) || 0) + t.amount));
      return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ label: name, value, color: catInfo(name, d.catType).color, emoji: catInfo(name, d.catType).emoji }));
    })();
    const ctotal = sumBy(cl, (x) => x.value);

    // ใครใช้เท่าไหร่ + ใช้อะไรบ้าง
    const pm = new Map();
    cur.forEach((t) => {
      const k = t.person || '(ไม่ระบุชื่อ)';
      let o = pm.get(k);
      if (!o) { o = { exp: 0, inc: 0, cats: new Map(), items: new Map() }; pm.set(k, o); }
      if (t.type === 'income') { o.inc += t.amount; return; }
      o.exp += t.amount;
      o.cats.set(t.category, (o.cats.get(t.category) || 0) + t.amount);
      const key = t.description || t.category;
      const it = o.items.get(key) || { amt: 0, n: 0, cat: t.category };
      it.amt += t.amount; it.n += 1; o.items.set(key, it);
    });
    const prs = [...pm.entries()].sort((a, b) => b[1].exp - a[1].exp);
    const pmax = Math.max(1, ...prs.map((x) => x[1].exp));
    const personHtml = prs.map(([name, o]) => {
      const open = state.personOpen.has(name);
      const topCats = [...o.cats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, a]) => `${esc(catInfo(c, 'expense').emoji)} ${esc(c)} ${money(a)}`).join(' · ');
      const items = [...o.items.entries()].sort((a, b) => b[1].amt - a[1].amt).slice(0, 20);
      return `<div class="prs ${open ? 'open' : ''}"><div class="prs-h" data-act="person-toggle" data-v="${esc(name)}">
          <div class="prs-top"><span class="prs-n">👤 ${esc(name)}</span><span class="num"><span class="exp">${money(o.exp)}</span>${o.inc ? `<span class="pc inc"> +${money(o.inc)}</span>` : ''}</span>${ICON.chev}</div>
          <div class="bar"><i style="width:${(o.exp / pmax) * 100}%;background:var(--expense)"></i></div>
          ${topCats ? `<div class="prs-sub">${topCats}</div>` : ''}</div>
        ${open ? `<div class="prs-b">${items.length ? items.map(([k, it]) => `<div class="irow"><span>${esc(catInfo(it.cat, 'expense').emoji)} ${esc(k)}${it.n > 1 ? ` <small class="muted">×${it.n}</small>` : ''}</span><b class="num">${money(it.amt)}</b></div>`).join('') : '<div class="sidehint">ไม่มีรายจ่าย</div>'}</div>` : ''}</div>`;
    }).join('');

    const chart = chartBlock('dash', 'bars', {
      labels: bks.map((b) => b.label), minGroupW: d.mode === 'month' ? 28 : 38,
      series: [{ name: 'รายจ่าย', color: 'var(--expense)', values: exp0 }, { name: 'รายรับ', color: 'var(--income)', values: inc0 }],
      tip: (i) => [bks[i].full, 'จ่าย ' + money(exp0[i]), 'รับ ' + money(inc0[i])],
    }, null, { bks, panel: dashPanel, noRead: true });

    let daily;
    if (d.mode === 'day') {
      const list = cur.slice();
      daily = list.length ? list.map((t) => txRow(t)).join('') : '<div class="empty"><div class="big">🌿</div>วันนี้ยังไม่มีรายการ</div>';
    } else {
      const mx = Math.max(1, ...exp0);
      daily = bks.map((b, i) => {
        const e = exp0[i], c = inc0[i], isT = now >= b.from && now <= b.to;
        return `<div class="drow ${isT ? 'today' : ''}" data-act="drill" data-date="${b.from}" data-m="${d.mode === 'year' ? 'month' : 'day'}">
          <div class="dl">${d.mode === 'year' ? b.full.split(' ')[0] : fmtRow(b.from)}</div>
          <div class="bar" style="grid-column:auto"><i style="width:${Math.min(100, (e / mx) * 100)}%;background:var(--expense)"></i></div>
          <div class="dv"><span class="exp">${e ? '-' + money(e) : '–'}</span>${c ? `<br><span class="inc">+${money(c)}</span>` : ''}</div></div>`;
      }).join('');
    }

    // เงินเดือน (ครอบครัว) + การ์ดของฉัน
    const cards = state.settings.cards || [];
    const quick = [['ซื้อของเข้าร้าน', '🌾', 'exp|cat|' + STOCK], ['รายจ่ายทั้งหมด', '💸', 'exp|all'], ...(knownPeople()[0] ? [['รายจ่าย ' + knownPeople()[0], '👤', 'exp|person|' + knownPeople()[0]]] : [])];
    const mine = `<div class="card c-mine"><div class="pbar" style="margin-bottom:10px"><h2>การ์ดของฉัน</h2><button class="btn sm" data-act="card-add">+ เพิ่มการ์ด</button></div>
      <div class="mycards">
        ${cards.map((c) => { const x = cardValue(c); return `<button class="mycard" style="--ca:${esc(c.color)}" data-act="card-edit" data-id="${c.id}"><span>${esc(c.emoji)} ${esc(c.name)}</span><b class="${x.bal ? (x.v < 0 ? 'exp' : '') : x.type === 'income' ? 'inc' : 'exp'}">${money(x.v)}</b><small>${esc(x.sub)}</small></button>`; }).join('')}
      </div>
      ${!cards.length ? `<p class="hint" style="margin:10px 0 8px">เพิ่มการ์ดที่อยากเห็นเอง เช่น</p><div class="chips tight">${quick.map(([n, em, src]) => `<button class="chip" data-act="card-quick" data-n="${esc(n)}" data-e="${em}" data-src="${esc(src)}">+ ${esc(n)}</button>`).join('')}</div>` : ''}
    </div>`;

    const personCard = `<div class="card c-person"><h2>ใครใช้เท่าไหร่</h2><p class="lead">แตะชื่อเพื่อดูว่าใช้อะไรไปบ้าง</p>
          ${personHtml || '<div class="empty"><div class="big">👤</div>ยังไม่มีข้อมูล</div>'}
        </div>`;

    v.innerHTML = `
      ${localBanner()}
      ${periodBar('dash', d)}
      <div class="filters">${personSelect('dashPerson', d.person, 'data-change="dash-person"')}</div>
      <div class="kpis">
        <div class="kpi k-inc"><span>รายรับ</span><b class="inc">${money(inc)}</b></div>
        <div class="kpi k-exp"><span>รายจ่าย</span><b class="exp">${money(exp)}</b></div>
        <div class="kpi accent"><span>ทุนที่เหลือรวม</span><b>${money(capCalc(ALL_FROM, ALL_TO).free)}</b><small>ในมือ ไม่รวมกอง</small></div>
      </div>
      ${mine}
      ${personCard}
      <div class="card c-chart"><h2>ประวัติรายรับรายจ่าย</h2><p class="lead">${d.mode === 'day' ? '7 วันล่าสุด' : d.mode === 'year' ? 'รายเดือน' : 'รายวัน'} · แตะแท่งกราฟเพื่อดูรายละเอียด</p>
        <div class="chartgrid"><div class="cg-chart">${chart}
          <div class="legend"><span><i style="background:var(--expense)"></i>รายจ่าย</span><span><i style="background:var(--income)"></i>รายรับ</span></div></div>
          <aside class="cg-side ${state.sel.dash >= 0 ? '' : 'idle'}" id="side-dash">${dashPanel(state.sel.dash)}</aside></div>
        ${n > 0 ? `<div class="avgs"><div><small>รายจ่ายเฉลี่ย${avgLabel}</small><b class="exp">${money(exp / n)}</b></div><div><small>รายรับเฉลี่ย${avgLabel}</small><b class="inc">${money(inc / n)}</b></div></div>` : ''}
      </div>
      <div class="card c-cat"><div class="pbar" style="margin-bottom:10px"><h2>แยกตามหมวด</h2>
          <div class="seg"><button class="${d.catType === 'expense' ? 'on' : ''}" data-act="dash-cattype" data-v="expense">รายจ่าย</button><button class="${d.catType === 'income' ? 'on' : ''}" data-act="dash-cattype" data-v="income">รายรับ</button></div></div>
          ${cl.length ? `<div class="donut-wrap">${C.donut({ data: cl, top: d.catType === 'expense' ? 'รายจ่าย' : 'รายรับ', bottom: money(ctotal) })}
            <div class="leg-list">${cl.map((x) => `<div class="lrow"><div class="nm"><i class="sw" style="background:${x.color}"></i><span>${esc(x.emoji)} ${esc(x.label)}</span></div><div class="num">${money(x.value)}<span class="pc">${pct(x.value, ctotal)}%</span></div><div class="bar"><i style="width:${pct(x.value, ctotal)}%;background:${x.color}"></i></div></div>`).join('')}</div></div>`
            : '<div class="empty"><div class="big">🍃</div>ยังไม่มีข้อมูลในช่วงนี้</div>'}
      </div>
      <div class="sp"></div>
      <div class="card c-list"><h2>${d.mode === 'day' ? 'รายการของวันนี้' : d.mode === 'year' ? 'สรุปรายเดือน' : 'สรุปวันต่อวัน'}</h2>${d.mode === 'day' ? '' : '<p class="lead">แตะที่แถวเพื่อดูรายละเอียด</p>'}${daily}</div>`;
  }

  /* ================= หน้าจดรายการ ================= */
  function reparse() {
    const a = state.add;
    a.rows = P.parse(a.text, { date: a.date, today: today(), person: (a.person || '').trim(), people: knownPeople(), categories: cats() });
    a.rows.forEach((r) => { r.pot = resolvePot(r); });
  }
  function resolvePot(r) {
    if (r.type !== 'expense' || !DB.hasPot) return null;
    const m = state.add.potMode;
    if (m === 'hand') return null;
    if (m === 'auto') { const p = (r.person || '').trim(), i = p ? allocCfg().names.indexOf(p) : -1; return i >= 0 ? i : null; }
    return parsePot(m);
  }
  function viewAdd(v) {
    const a = state.add;
    v.innerHTML = `
      <div class="card addcard c-add">
        <div class="addrow">
          <div class="f"><span class="fl">วันที่</span>${dateField('addDate', a.date, 'data-input="add-date"')}</div>
          <label class="f">ชื่อผู้ใช้<input id="addPerson" list="peopleDL" placeholder="เช่น เกด" value="${esc(a.person)}" data-input="add-person"></label>
        </div>
        <datalist id="peopleDL">${knownPeople().map((p) => `<option value="${esc(p)}">`).join('')}</datalist>
        ${knownPeople().length ? `<div class="chips tight">${knownPeople().map((p) => `<button class="chip ${a.person === p ? 'on' : ''}" data-act="add-chip" data-v="${esc(p)}">${esc(p)}</button>`).join('')}</div>` : ''}
        ${DB.hasPot ? `<div class="paysrc"><div class="qline"><span class="fl">จ่ายจาก</span><button class="qbtn ${a.payHelp ? 'on' : ''}" data-act="pay-help" aria-label="อธิบาย">?</button></div>
          ${a.payHelp ? '<div class="helpbox">• ใช้กับรายจ่ายทั้งชุดที่พิมพ์ (เปลี่ยนรายบรรทัดได้ที่แต่ละรายการ)<br>• <b>หักอัตโนมัติ</b>: ถ้าชื่อคนตรงกับชื่อกอง เช่น เกด จะหักจากกองนั้น ถ้าไม่ตรงจะหักจากเงินในมือ<br>• หรือเลือกกอง / กระเป๋าเดียวให้ทั้งชุดเลย</div>' : ''}
          <select data-change="add-potmode">${opt('auto', 'หักอัตโนมัติ', a.potMode === 'auto')}${opt('hand', 'เงินในมือ', a.potMode === 'hand')}${allocCfg().names.map((n, i) => opt(i, n, String(a.potMode) === String(i))).join('')}${walletCards().map((c) => opt('c:' + c.id, c.emoji + ' ' + c.name, a.potMode === 'c:' + c.id)).join('')}</select></div>` : (DB.live ? '<p class="hint">ยังเลือก “จ่ายจากกอง” ไม่ได้ ให้รันไฟล์ update-pot.sql ใน Supabase หนึ่งครั้ง</p>' : '')}
        <textarea id="addText" data-input="add-text" placeholder="พิมพ์หรือวางรายการที่นี่">${esc(a.text)}</textarea>
        <div class="qline"><button class="qbtn ${a.help ? 'on' : ''}" data-act="add-help" aria-label="วิธีพิมพ์">?</button>${a.help ? '' : '<span class="muted">วิธีพิมพ์</span>'}</div>
        ${a.help ? `<div class="helpbox">• พิมพ์หลายรายการได้ ขึ้นบรรทัดใหม่หรือเขียนต่อกันก็ได้<br>• ใส่ชื่อ: <code>เกด: ข้าว 50</code> หรือ <code>@เกด ข้าว 50</code><br>• รายรับ ใส่ <code>+</code> นำหน้า เช่น <code>+ ขายของ 300</code><br>• ระบุวัน: <code>เมื่อวาน</code> หรือ <code>27/10</code><br>• ตัวอย่าง: <code>ซื้อถ่านปิ้งย่าง 40 บาท ซื้อขนม 15 บาท</code></div>` : ''}
      </div>
      <div id="preview"></div>`;
    renderPreview();
  }
  function rowHtml(r, i) {
    const opts = catsOf(r.type).map((c) => opt(c.name, c.emoji + ' ' + c.name, c.name === r.category)).join('');
    const col = catInfo(r.category, r.type).color;
    return `<div class="prow" data-i="${i}" style="--rc:${col}">
      <div class="top2"><div class="seg"><button class="${r.type === 'expense' ? 'on' : ''}" data-act="row-type" data-i="${i}" data-v="expense">รายจ่าย</button><button class="${r.type === 'income' ? 'on' : ''}" data-act="row-type" data-i="${i}" data-v="income">รายรับ</button></div>
        ${r.date !== state.add.date ? `<span class="tagdate">📅 ${fmtD(r.date)}</span>` : '<span></span>'}
        <button class="icon del" data-act="row-del" data-i="${i}" aria-label="เอาออก">${ICON.del}</button></div>
      <input value="${esc(r.desc)}" placeholder="รายการ" data-input="row" data-i="${i}" data-f="desc">
      <input class="money-in" inputmode="decimal" value="${r.amount}" data-input="row" data-i="${i}" data-f="amount">
      <div class="two"><select data-change="row" data-i="${i}" data-f="category">${opts}</select>
        <input list="peopleDL" placeholder="ชื่อ" value="${esc(r.person)}" data-input="row" data-i="${i}" data-f="person"></div>
      ${r.type === 'expense' && DB.hasPot ? `<label class="paywrap"><span>จ่ายจาก</span><select data-change="row" data-i="${i}" data-f="pot">${potOpts(r.pot)}</select></label>` : ''}
    </div>`;
  }
  function sumLine() {
    const rows = state.add.rows;
    const inc = sumBy(rows.filter((r) => r.type === 'income'), (r) => r.amount), exp = sumBy(rows.filter((r) => r.type === 'expense'), (r) => r.amount);
    return `<span>${rows.length} รายการ</span><span><span class="exp">จ่าย ${money(exp)}</span> · <span class="inc">รับ ${money(inc)}</span></span>`;
  }
  function renderPreview() {
    const box = $('#preview');
    if (!box) return;
    const rows = state.add.rows;
    if (!rows.length) { box.innerHTML = '<div class="empty slim">รายการที่แยกได้จะขึ้นตรงนี้</div>'; return; }
    box.innerHTML = `<div class="sumline" id="sumline">${sumLine()}</div>${rows.map(rowHtml).join('')}<div class="savepad"></div>
      <div class="savebar"><button class="btn primary block" data-act="add-save">บันทึกทั้งหมด (${rows.length})</button></div>`;
  }
  async function saveAdd(btn) {
    const rows = state.add.rows.filter((r) => r.amount > 0);
    if (!rows.length) return toast('ยังไม่มีรายการที่บันทึกได้', true);
    btn.disabled = true;
    try {
      const made = await DB.addTx(rows.map((r) => ({ date: r.date, type: r.type, amount: r.amount, category: r.category, description: r.desc, person: (r.person || '').trim(), pot: r.type === 'expense' ? r.pot : null })));
      state.tx.push(...made);
      const ps = new Set(state.settings.people || []);
      made.forEach((t) => { if (t.person) ps.add(t.person); });
      if (ps.size !== (state.settings.people || []).length) { state.settings.people = [...ps]; saveSetting('people'); }
      state.add.text = ''; state.add.rows = [];
      toast(`บันทึกแล้ว ${made.length} รายการ ✓`);
      render();
    } catch (e) { toast('บันทึกไม่สำเร็จ: ' + (e.message || e), true); btn.disabled = false; }
  }

  /* ================= หน้ารายการ ================= */
  function listBodyHtml() {
    const l = state.list, r = range(l.mode, l.anchor);
    let cur = personFilter(inRange(state.tx, r.from, r.to), l.person);
    if (l.cat) cur = cur.filter((t) => t.category === l.cat);
    const q = l.q.trim().toLowerCase();
    if (q) cur = cur.filter((t) => (t.description + ' ' + t.category + ' ' + t.person).toLowerCase().includes(q));
    if (!cur.length) return '<div class="card c-list"><div class="empty"><div class="big">🌿</div>ไม่พบรายการในช่วงนี้</div></div>';
    const inc = total(cur, 'income'), exp = total(cur, 'expense');
    const head = `<div class="sumline"><span>${cur.length} รายการ</span><span><span class="exp">จ่าย ${money(exp)}</span> · <span class="inc">รับ ${money(inc)}</span></span></div>`;

    if (l.mode === 'day') return head + `<div class="card c-list">${cur.map((t) => txRow(t)).join('')}</div>`;

    if (l.mode === 'year') {
      const m = new Map();
      cur.forEach((t) => { const k = t.date.slice(0, 7); const o = m.get(k) || { n: 0, inc: 0, exp: 0 }; o.n++; if (t.type === 'income') o.inc += t.amount; else o.exp += t.amount; m.set(k, o); });
      return head + `<div class="card c-list">${[...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([k, o]) => {
        const mi = Number(k.slice(5)) - 1;
        return `<div class="mrow" data-act="list-month" data-date="${k}-01"><div class="mn"><b>${MONTHS[mi]}</b><small class="muted">${o.n} รายการ</small></div><div class="mv"><span class="exp">${o.exp ? '-' + money(o.exp) : '–'}</span><span class="inc">${o.inc ? '+' + money(o.inc) : ''}</span></div>${ICON.next}</div>`;
      }).join('')}</div>`;
    }

    const auto = !!(q || l.cat);
    const groups = new Map();
    cur.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).forEach((t) => { if (!groups.has(t.date)) groups.set(t.date, []); groups.get(t.date).push(t); });
    return head + `<div class="card c-list">${[...groups.entries()].map(([date, list]) => {
      const di = total(list, 'income'), de = total(list, 'expense'), open = auto || l.open.has(date);
      return `<div class="dgrp ${open ? 'open' : ''}"><div class="dhead" data-act="list-toggle" data-date="${date}"><div class="dn"><b>${fmtRow(date)}</b><small class="muted">${list.length} รายการ</small></div>
        <div class="mv"><span class="exp">${de ? '-' + money(de) : '–'}</span><span class="inc">${di ? '+' + money(di) : ''}</span></div>${ICON.chev}</div>
        ${open ? `<div class="dbody">${list.map((t) => txRow(t)).join('')}</div>` : ''}</div>`;
    }).join('')}</div>`;
  }
  function viewList(v) {
    const l = state.list;
    const allCats = [...new Set(cats().map((c) => c.name))];
    v.innerHTML = `${periodBar('list', l, { noToday: true })}
      <div class="filters">${personSelect('listPerson', l.person, 'data-change="list-person"')}
        <select id="listCat" data-change="list-cat">${opt('', 'ทุกหมวด', !l.cat)}${allCats.map((c) => opt(c, c, l.cat === c)).join('')}</select>
        <input id="listQ" type="search" placeholder="ค้นหา…" value="${esc(l.q)}" data-input="list-q"></div>
      <div id="listBody">${listBodyHtml()}</div>`;
  }

  /* ---------- หน้าต่าง (modal) ---------- */
  function openModal(html) {
    closeModal();
    const m = document.createElement('div');
    m.className = 'modal-back'; m.id = 'modal';
    m.innerHTML = `<div class="modal">${html}</div>`;
    m.addEventListener('mousedown', (e) => { if (e.target === m) closeModal(); });
    document.body.appendChild(m);
  }
  function closeModal() { const m = $('#modal'); if (m) m.remove(); }

  function openPicker(k) {
    const st = stOf(k), d = fromISO(st.anchor), y = d.getFullYear(), m = d.getMonth();
    const cy = new Date().getFullYear(), ys = [];
    for (let i = Math.min(cy - 8, y); i <= Math.max(cy + 1, y); i++) ys.push(i);
    const yearSel = (id) => `<select id="${id}">${ys.map((yy) => opt(yy, 'พ.ศ. ' + be(yy), yy === y)).join('')}</select>`;
    let body, hint = '';
    if (st.mode === 'day' || st.mode === 'week') {
      body = `<div class="f"><span class="fl">วันที่</span>${dateField('pkDate', st.anchor)}</div>`;
      if (st.mode === 'week') hint = '<p class="hint">เลือกวันไหนก็ได้ ระบบจะแสดงทั้งสัปดาห์ที่มีวันนั้น</p>';
    } else if (st.mode === 'month') {
      body = `<div class="fields"><label class="f">เดือน<select id="pkMonth">${MONTHS.map((n, i) => opt(i, n, i === m)).join('')}</select></label><label class="f">ปี${yearSel('pkYear')}</label></div>`;
    } else body = `<label class="f">ปี${yearSel('pkYear')}</label>`;
    openModal(`<h3>เลือก${MODE_TH[st.mode]}</h3>${body}${hint}
      <div class="actions"><button class="btn" data-act="pk-today" data-k="${k}">วันนี้</button><button class="btn primary" data-act="pk-save" data-k="${k}">ตกลง</button></div>`);
  }
  function applyPicker(k) {
    const st = stOf(k);
    let a;
    if (st.mode === 'day' || st.mode === 'week') a = ($('#pkDate') || {}).value;
    else if (st.mode === 'month') a = `${$('#pkYear').value}-${pad(Number($('#pkMonth').value) + 1)}-01`;
    else a = `${$('#pkYear').value}-01-01`;
    if (!a) return toast('เลือกวันที่ก่อน', true);
    st.anchor = a; state.sel = {}; if (k === 'list') state.list.open = new Set();
    closeModal(); render(true);
  }

  function editTx(id) {
    const t = state.tx.find((x) => x.id === id);
    if (!t) return;
    const opts = (type, sel) => catsOf(type).map((c) => opt(c.name, c.emoji + ' ' + c.name, c.name === sel)).join('');
    openModal(`<h3>แก้ไขรายการ</h3>
      <div class="fields">
        <div class="f"><span class="fl">วันที่</span>${dateField('mDate', t.date)}</div>
        <label class="f">ประเภท<select id="mType">${opt('expense', 'รายจ่าย', t.type === 'expense')}${opt('income', 'รายรับ', t.type === 'income')}</select></label>
        <label class="f">จำนวนเงิน<input id="mAmt" class="money-in" inputmode="decimal" value="${t.amount}"></label>
        <label class="f">หมวด<select id="mCat">${opts(t.type, t.category)}</select></label>
        ${DB.hasPot ? `<label class="f" id="mPotWrap" ${t.type === 'expense' ? '' : 'hidden'}>จ่ายจาก<select id="mPot">${potOpts(t.pot)}</select></label>` : ''}
      </div>
      <div class="fields one"><label class="f">รายการ<input id="mDesc" value="${esc(t.description)}"></label>
        <label class="f">ชื่อ<input id="mPerson" list="peopleDL2" value="${esc(t.person)}"><datalist id="peopleDL2">${knownPeople().map((p) => `<option value="${esc(p)}">`).join('')}</datalist></label></div>
      <div class="actions"><button class="btn" data-act="modal-close">ยกเลิก</button><button class="btn primary" data-act="tx-save" data-id="${id}">บันทึก</button></div>`);
    $('#mType').addEventListener('change', () => { const ty = $('#mType').value; $('#mCat').innerHTML = opts(ty, P.FALLBACK[ty]); const w = $('#mPotWrap'); if (w) w.hidden = ty !== 'expense'; });
  }
  async function saveTxEdit(id) {
    const patch = { date: $('#mDate').value, type: $('#mType').value, amount: num($('#mAmt').value), category: $('#mCat').value, description: $('#mDesc').value.trim(), person: $('#mPerson').value.trim() };
    if (DB.hasPot) { const pv = $('#mPot') ? $('#mPot').value : ''; patch.pot = patch.type === 'expense' ? parsePot(pv) : null; if (patch.pot != null) patch.pot = String(patch.pot); }
    if (!patch.date || !(patch.amount >= 0)) return toast('กรอกวันที่และจำนวนเงินให้ถูกต้อง', true);
    try {
      const updated = await DB.updateTx(id, patch);
      const i = state.tx.findIndex((x) => x.id === id);
      if (i >= 0) state.tx[i] = updated;
      closeModal(); toast('แก้ไขแล้ว ✓'); render(true);
    } catch (e) { toast('แก้ไขไม่สำเร็จ: ' + (e.message || e), true); }
  }
  async function delTx(id) {
    const t = state.tx.find((x) => x.id === id);
    if (!t || !confirm(`ลบ "${t.description || t.category}" ${money(t.amount)} ?`)) return;
    try { await DB.deleteTx(id); state.tx = state.tx.filter((x) => x.id !== id); toast('ลบแล้ว'); render(true); }
    catch (e) { toast('ลบไม่สำเร็จ: ' + (e.message || e), true); }
  }

  function openMove(pot, mv) {
    const cfg = allocCfg();
    state.moveEditId = mv ? mv.id : null;
    openModal(`<h3>${mv ? 'แก้ไขรายการเงินเข้า / ออก' : 'บันทึกเงินเข้า / ออก'}</h3>
      <div class="fields">
        <label class="f">กอง<select id="mvPot">${cfg.names.map((n, i) => opt(i, n, i === pot)).join('')}</select></label>
        <label class="f">ประเภท<select id="mvDir">${opt('out', 'โอนออก (เอาไปใช้)', !mv || mv.dir === 'out')}${opt('in', 'โอนเข้า (ใส่เพิ่ม)', mv && mv.dir === 'in')}</select></label>
        <label class="f">จำนวนเงิน<input id="mvAmt" class="money-in" inputmode="decimal" placeholder="0" value="${mv ? mv.amount : ''}"></label>
        <div class="f"><span class="fl">วันที่</span>${dateField('mvDate', mv ? mv.date : today())}</div>
      </div>
      <div class="fields one"><label class="f">หมายเหตุ<input id="mvNote" placeholder="เช่น เอาไปซื้อของเข้าร้าน" value="${mv ? esc(mv.note) : ''}"></label></div>
      <div class="actions"><button class="btn" data-act="modal-close">ยกเลิก</button><button class="btn primary" data-act="move-save">บันทึก</button></div>`);
  }
  async function saveMove() {
    const row = { pot: Number($('#mvPot').value), dir: $('#mvDir').value, amount: num($('#mvAmt').value), date: $('#mvDate').value, note: $('#mvNote').value.trim() };
    if (!(row.amount > 0) || !row.date) return toast('กรอกจำนวนเงินและวันที่', true);
    try {
      if (state.moveEditId) {
        const u = await DB.updateMove(state.moveEditId, row);
        const i = state.moves.findIndex((m) => m.id === state.moveEditId);
        if (i >= 0) state.moves[i] = u;
      } else state.moves.push(await DB.addMove(row));
      closeModal(); state.potOpen = row.pot; toast('บันทึกแล้ว ✓'); render(true);
    } catch (e) { toast('บันทึกไม่สำเร็จ: ' + (e.message || e) + (DB.live ? ' (ลองรัน schema.sql ใหม่ใน Supabase)' : ''), true); }
  }

  function openAutoEdit(date, i) {
    const e = existingShop(date);
    if (!e) return;
    const cfg = allocCfg(), cur = entryAmounts(e)[i] || 0;
    state.autoEdit = { date, i };
    openModal(`<h3>แก้ยอดที่แบ่งเข้า “${esc(cfg.names[i])}”</h3>
      <p class="lead">วันที่ ${fmtD(date)} · กำไรของวัน ${money(e.profit)} · ยอดขาย/กำไรของวันไม่เปลี่ยน แก้เฉพาะส่วนที่แบ่งเข้ากองนี้</p>
      <label class="f">จำนวนเงิน (บาท)<input id="aeAmt" class="money-in" inputmode="decimal" value="${cur}"></label>
      <div class="actions"><button class="btn" data-act="modal-close">ยกเลิก</button><button class="btn primary" data-act="auto-save">บันทึก</button></div>`);
  }
  async function saveAutoAmount(date, i, val) {
    const e = existingShop(date);
    if (!e) return;
    const am = entryAmounts(e).slice();
    am[i] = round2(Math.max(0, val));
    const p = Math.max(0, e.profit);
    const alloc = { pcts: am.map((x) => (p > 0 ? round2((x / p) * 100) : 0)), amounts: am };
    try {
      const saved = await DB.saveShop({ date: e.date, sales: e.sales, cost: e.cost, profit: e.profit, note: e.note, alloc });
      const k = state.shopDays.findIndex((x) => x.date === date);
      if (k >= 0) state.shopDays[k] = saved;
      closeModal(); toast('แก้ไขแล้ว ✓'); render(true);
    } catch (er) { toast('แก้ไขไม่สำเร็จ: ' + (er.message || er), true); }
  }

  /* ================= หน้าร้านข้าว ================= */
  // % ตั้งต้นของวันใหม่ = % ของวันล่าสุดที่บันทึก (ถ้ายังไม่มี ใช้ค่าเดิม 50/15)
  function formPcts() {
    const last = state.shopDays.filter((e) => e.alloc && e.alloc.pcts && e.alloc.pcts.length >= 2).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    return last ? [last.alloc.pcts[0], last.alloc.pcts[1]] : allocCfg().pcts;
  }
  function openNames() {
    const cfg = allocCfg();
    openModal(`<h3>แก้ชื่อกอง</h3>
      <div class="fields one">${[0, 1, 2].map((i) => `<label class="f">กองที่ ${i + 1}<input id="nmI${i}" value="${esc(cfg.names[i])}"></label>`).join('')}</div>
      <p class="hint">ชื่อใหม่ใช้กับทุกหน้า ส่วน % ตั้งต้นของวันใหม่ คือ % ของวันล่าสุดที่บันทึกไว้</p>
      <div class="actions"><button class="btn" data-act="modal-close">ยกเลิก</button><button class="btn primary" data-act="names-save">บันทึก</button></div>`);
  }
  function blankForm(date) {
    const cfg = Object.assign({}, allocCfg(), { pcts: formPcts() });
    return { date, sales: '', cost: '', profit: '', note: '', rows: [{ mode: 'pct', pct: String(cfg.pcts[0]), amt: '' }, { mode: 'pct', pct: String(cfg.pcts[1]), amt: '' }, { mode: 'rest', pct: '', amt: '' }] };
  }
  function calcSplit(f) {
    const p = Math.max(0, num(f.profit)), out = [];
    f.rows.forEach((r, i) => {
      let a, pc;
      if (r.mode === 'amt') { a = round2(num(r.amt)); pc = p > 0 ? round2((a / p) * 100) : 0; }
      else if (r.mode === 'pct') { pc = num(r.pct); a = round2((p * pc) / 100); }
      else { a = round2(Math.max(0, p - sumBy(out, (x) => x.a))); pc = p > 0 ? round2((a / p) * 100) : 0; }
      out.push({ a, pc });
    });
    return { rows: out, left: round2(p - sumBy(out, (x) => x.a)), p };
  }
  const existingShop = (date) => state.shopDays.find((e) => e.date === date);
  function loadShopDate(date) {
    const e = existingShop(date), f = blankForm(date);
    if (e) {
      f.sales = String(e.sales); f.cost = String(e.cost); f.profit = String(e.profit); f.note = e.note || '';
      const am = entryAmounts(e);
      f.rows = [{ mode: 'amt', pct: '', amt: String(am[0] || 0) }, { mode: 'amt', pct: '', amt: String(am[1] || 0) }, { mode: 'rest', pct: '', amt: '' }]; // ช่องที่ 3 = ส่วนที่เหลือเสมอ
    }
    state.shopUI.form = f;
  }
  function shopPreviewHtml() {
    const f = state.shopUI.form, sp = calcSplit(f);
    const real = num(f.sales) - num(f.profit);
    let left = '';
    if (Math.abs(sp.left) > 0.005) left = sp.left > 0 ? `<div class="warn amber">ยังไม่ได้แบ่ง ${money(sp.left)}</div>` : `<div class="warn red">แบ่งเกินกำไร ${money(-sp.left)}</div>`;
    const stockToday = sumBy(state.tx.filter((t) => t.type === 'expense' && t.category === STOCK && t.date === f.date), (t) => t.amount);
    return `${left}<div class="hint" style="margin:8px 0 12px">ต้นทุนที่แท้จริง (ยอดขาย − กำไร) = <b>${money(real)}</b>${f.profit !== '' && num(f.profit) < 0 ? ' · กำไรติดลบ จะไม่แบ่งเงิน' : ''}</div>
      ${stockToday > 0 && num(f.cost) !== stockToday ? `<button class="chip" data-act="use-stock" data-v="${stockToday}">ใช้ยอด “ซื้อของเข้าร้าน” ของวันนี้เป็นต้นทุน ${money(stockToday)}</button><div class="sp8"></div>` : ''}`;
  }
  function syncSplit() {
    const f = state.shopUI.form, sp = calcSplit(f), act = document.activeElement;
    sp.rows.forEach((x, i) => {
      const p = $('#spP' + i), a = $('#spA' + i);
      if (p && p !== act) p.value = showNum(x.pc);
      if (a && a !== act) a.value = showNum(x.a);
    });
  }
  function updateShopForm() {
    const el = $('#shopPrev');
    if (el) el.innerHTML = shopPreviewHtml();
    syncSplit();
    const b = $('#shopSaveBtn');
    if (b) b.textContent = `${existingShop(state.shopUI.form.date) ? 'อัปเดต' : 'บันทึก'}ยอดวันที่ ${fmtD(state.shopUI.form.date)}`;
  }
  function fillShopForm() {
    const f = state.shopUI.form;
    [['sDate', 'date'], ['sSales', 'sales'], ['sCost', 'cost'], ['sProfit', 'profit'], ['sNote', 'note']].forEach(([id, k]) => { const el = $('#' + id); if (el) el.value = f[k]; });
    const sdi = $('#sDate'); if (sdi) syncDateLabel(sdi);
    updateShopForm();
  }

  function potLedger(i) {
    const rows = [];
    state.shopDays.forEach((e) => { const a = entryAmounts(e)[i] || 0; if (a > 0) rows.push({ date: e.date, label: 'แบ่งจากกำไรร้านข้าว', amt: a, auto: true, pot: i }); });
    state.moves.filter((m) => m.pot === i).forEach((m) => rows.push({ date: m.date, label: m.note || (m.dir === 'in' ? 'โอนเข้า' : 'โอนออก'), amt: m.dir === 'in' ? m.amount : -m.amount, id: m.id }));
    state.tx.filter((t) => t.type === 'expense' && t.pot === i).forEach((t) => rows.push({ date: t.date, label: 'จ่าย: ' + (t.description || t.category), amt: -t.amount, txid: t.id }));
    return rows.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 30);
  }

  function viewShop(v) {
    const u = state.shopUI, cfg = allocCfg();
    if (!u.form) u.form = blankForm(today());
    const f = u.form, r = range(u.mode, u.anchor), sp = calcSplit(f);
    const cur = state.shopDays.filter((e) => e.date >= r.from && e.date <= r.to).sort((a, b) => (a.date < b.date ? 1 : -1));
    const sales = sumBy(cur, (e) => e.sales), cost = sumBy(cur, (e) => e.cost), profit = sumBy(cur, (e) => e.profit);
    const parts = [0, 1, 2].map((i) => sumBy(cur, (e) => entryAmounts(e)[i] || 0));
    const bks = buckets(u.mode, u.anchor);
    const idx = new Map(bks.map((b, i) => [b.key, i]));
    const S = bks.map(() => 0), Co = bks.map(() => 0), Pr = bks.map(() => 0);
    state.shopDays.forEach((e) => { const i = idx.get(keyOf(u.mode, e.date)); if (i != null) { S[i] += e.sales; Co[i] += e.cost; Pr[i] += e.profit; } });
    const ps = potStats();
    const gw = u.mode === 'month' ? 34 : 44;

    const active = [
      { key: 'sales', name: 'ยอดขาย', color: 'var(--accent)', values: S },
      { key: 'cost', name: 'ต้นทุน', color: 'var(--expense)', values: Co },
      { key: 'profit', name: 'กำไร', color: 'var(--income)', values: Pr },
    ];
    const act = active.filter((s) => u.series[s.key]);
    const chart1 = chartBlock('shop1', 'bars', { labels: bks.map((b) => b.label), minGroupW: gw, series: act.length ? act : active,
      tip: (i) => [bks[i].full, 'ขาย ' + money(S[i]), 'ต้นทุน ' + money(Co[i]), 'กำไร ' + money(Pr[i])] },
    (i) => `<b>${bks[i].full}</b><br>ขาย ${money(S[i])} · ต้นทุน ${money(Co[i])} · <span class="inc">กำไร ${money(Pr[i])}</span>`);

    const rows = cur.map((e) => `<tr><td>${fmtShort(e.date)}</td><td>${money(e.sales)}</td><td>${money(e.cost)}</td><td class="${e.profit >= 0 ? 'inc' : 'exp'}">${money(e.profit)}</td>
      <td class="act"><button class="icon" data-act="shop-edit" data-date="${e.date}" aria-label="แก้ไข">${ICON.edit}</button> <button class="icon del" data-act="shop-del" data-id="${e.id}" aria-label="ลบ">${ICON.del}</button></td></tr>`).join('');

    const ledger = state.potOpen >= 0 ? potLedger(state.potOpen) : [];

    v.innerHTML = `
      ${!u.formOpen ? `<div class="card c-shop" id="shopForm"><div class="pbar" style="margin:0"><h2>🍚 จดยอดร้านข้าว</h2><button class="btn sm primary" data-act="shop-form-toggle">+ จดยอด</button></div></div>` : `<div class="card c-shop" id="shopForm"><div class="pbar" style="margin-bottom:10px"><h2>🍚 จดยอดร้านข้าว</h2><button class="btn sm" data-act="shop-form-toggle">ปิด</button></div>
        <div class="fields">
          <div class="f"><span class="fl">วันที่</span>${dateField('sDate', f.date, 'data-input="shop-form" data-f="date"')}</div>
          <label class="f">ยอดขาย (บาท)<input id="sSales" class="money-in" inputmode="decimal" value="${esc(f.sales)}" data-input="shop-form" data-f="sales" placeholder="0"></label>
          <label class="f">ต้นทุน (บาท)<input id="sCost" class="money-in" inputmode="decimal" value="${esc(f.cost)}" data-input="shop-form" data-f="cost" placeholder="0"></label>
          <label class="f">กำไร (บาท)<input id="sProfit" class="money-in" inputmode="decimal" value="${esc(f.profit)}" data-input="shop-form" data-f="profit" placeholder="0"></label>
        </div>
        <div class="splitlbl"><b>แบ่งกำไร</b><button type="button" class="linkbtn" data-act="names-open">แก้ชื่อกอง</button></div><p class="hint" style="margin:0 0 8px">แก้ช่อง 1–2 ได้ทั้ง % และจำนวนเงิน ช่อง 3 คิดส่วนที่เหลือให้เอง</p>
        <div class="split2">${[0, 1, 2].map((i) => `<div class="srow2"><div class="sn">${esc(cfg.names[i])}</div>
          <label class="inpp"><input id="spP${i}" inputmode="decimal" value="${showNum(sp.rows[i].pc)}" data-input="split" data-i="${i}" data-f="pct" ${i === 2 ? 'readonly tabindex="-1"' : ''}><span>%</span></label>
          <label class="inpa"><input id="spA${i}" inputmode="decimal" value="${showNum(sp.rows[i].a)}" data-input="split" data-i="${i}" data-f="amt" ${i === 2 ? 'readonly tabindex="-1"' : ''}><span>฿</span></label></div>`).join('')}</div>
        <div id="shopPrev">${shopPreviewHtml()}</div>
        <div class="fields one"><label class="f">หมายเหตุ (ไม่บังคับ)<input id="sNote" value="${esc(f.note)}" data-input="shop-form" data-f="note"></label></div>
        <button class="btn primary block" id="shopSaveBtn" data-act="shop-save">${existingShop(f.date) ? 'อัปเดต' : 'บันทึก'}ยอดวันที่ ${fmtD(f.date)}</button>
      </div>`}

      <div class="card c-pot"><div class="pbar" style="margin-bottom:10px"><h2>เงินแต่ละกอง</h2><button class="btn sm primary" data-act="move-open" data-i="-1">+ เงินเข้า / ออก</button></div>
        <div class="pots">${[0, 1, 2].map((i) => `<button class="pot ${state.potOpen === i ? 'on' : ''}" data-act="pot-open" data-i="${i}" style="--pc:var(--pot${i})"><span class="pn">${esc(cfg.names[i])}</span><b class="${ps[i].bal < 0 ? 'exp' : ''}">${money(ps[i].bal)}</b><small>เข้า ${money(ps[i].in)}<br>ออก ${money(ps[i].out)}</small></button>`).join('')}</div>
        <div class="potsum"><div><small>เงินเข้าทั้งหมด</small><b class="inc">${money(sumBy(ps, (x) => x.in))}</b></div><div><small>เงินออกทั้งหมด</small><b class="exp">${money(sumBy(ps, (x) => x.out))}</b></div><div><small>คงเหลือจริง</small><b>${money(sumBy(ps, (x) => x.bal))}</b></div></div>
        ${state.potOpen >= 0 ? `<div class="ledger"><div class="ledhead"><b>ประวัติ: ${esc(cfg.names[state.potOpen])}</b><button class="btn sm" data-act="move-open" data-i="${state.potOpen}">+ เข้า/ออก</button></div>
          ${ledger.length ? ledger.map((x) => `<div class="irow lrw"><span>${fmtShort(x.date)} · ${esc(x.label)}</span><span class="num ${x.amt >= 0 ? 'inc' : 'exp'}">${x.amt >= 0 ? '+' : ''}${money(x.amt)}</span><span class="lbt">${x.txid ? `<button class="icon tiny" data-act="tx-edit" data-id="${x.txid}" aria-label="แก้ไข">${ICON.edit}</button><button class="icon del tiny" data-act="tx-del" data-id="${x.txid}" aria-label="ลบ">${ICON.del}</button>` : x.id ? `<button class="icon tiny" data-act="move-edit" data-id="${x.id}" aria-label="แก้ไข">${ICON.edit}</button><button class="icon del tiny" data-act="move-del" data-id="${x.id}" aria-label="ลบ">${ICON.del}</button>` : `<button class="icon tiny" data-act="auto-edit" data-date="${x.date}" data-i="${x.pot}" aria-label="แก้ไข">${ICON.edit}</button><button class="icon del tiny" data-act="auto-del" data-date="${x.date}" data-i="${x.pot}" aria-label="ลบ">${ICON.del}</button>`}</span></div>`).join('')
          : '<div class="sidehint">ยังไม่มีรายการ</div>'}</div>` : ''}
      </div>

      ${capCardHtml(u)}

      ${periodBar('shop', u)}
      <div class="card c-pot"><h2>การแบ่งกำไรช่วงนี้</h2>
        <div class="split">${[0, 1, 2].map((i) => `<div class="srow"><div>${esc(cfg.names[i])}</div><b>${money(parts[i])}</b></div>`).join('')}</div></div>
      <div class="card c-shop"><h2>ยอดขาย ต้นทุน กำไร</h2><p class="lead">${u.mode === 'day' ? '7 วันล่าสุด' : u.mode === 'year' ? 'รายเดือน' : 'รายวัน'}</p>
        <div class="chips" style="margin-bottom:10px">${active.map((s) => `<button class="chip ${u.series[s.key] ? 'on' : ''}" data-act="shop-ser" data-v="${s.key}">${s.name}</button>`).join('')}</div>
        ${chart1}</div>
      <div class="card c-shop"><h2>รายวัน</h2>${cur.length ? `<div class="tblwrap"><table class="shoptbl"><thead><tr><th>วันที่</th><th>ยอดขาย</th><th>ต้นทุน</th><th>กำไร</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty"><div class="big">🍚</div>ยังไม่มียอดในช่วงนี้</div>'}</div>`;
  }
  async function saveShop(btn) {
    const f = state.shopUI.form;
    if (!f.date) return toast('เลือกวันที่ก่อน', true);
    const sp = calcSplit(f);
    const row = { date: f.date, sales: num(f.sales), cost: num(f.cost), profit: num(f.profit), note: (f.note || '').trim() };
    if (row.sales === 0 && row.profit === 0 && row.cost === 0) return toast('กรอกยอดขายหรือกำไรก่อน', true);
    if (sp.left < -0.005 && !confirm(`แบ่งเกินกำไร ${money(-sp.left)} บันทึกต่อไหม?`)) return;
    row.alloc = { pcts: sp.rows.map((x) => x.pc), amounts: sp.rows.map((x) => x.a) };
    btn.disabled = true;
    try {
      const saved = await DB.saveShop(row);
      const i = state.shopDays.findIndex((e) => e.date === saved.date);
      if (i >= 0) state.shopDays[i] = saved; else state.shopDays.push(saved);
      toast('บันทึกยอดร้านข้าวแล้ว ✓');
      state.shopUI.anchor = f.date; state.shopUI.formOpen = false; state.sel.shop1 = undefined; state.sel.shop3 = undefined;
      loadShopDate(addDays(f.date, 1) > today() ? today() : addDays(f.date, 1));
      render(true);
    } catch (e) { toast('บันทึกไม่สำเร็จ: ' + (e.message || e), true); }
    btn.disabled = false;
  }

  /* ================= หน้าวิเคราะห์ ================= */
  function viewAna(v) {
    const a = state.ana, r = range(a.mode, a.anchor);
    const pa = step(a.mode, a.anchor, -1), pr = range(a.mode, pa);
    const cur = inRange(state.tx, r.from, r.to), prev = inRange(state.tx, pr.from, pr.to);
    const inc = total(cur, 'income'), exp = total(cur, 'expense'), pinc = total(prev, 'income'), pexp = total(prev, 'expense');
    const delta = (c, p) => (p > 0 ? Math.round(((c - p) / p) * 100) : null);
    const dTxt = (d, goodDown) => (d === null ? '<small class="muted">ไม่มีข้อมูลช่วงก่อน</small>' : `<small class="${(d > 0) === !goodDown ? 'inc' : 'exp'}">${d > 0 ? '▲' : d < 0 ? '▼' : '='} ${Math.abs(d)}% จากช่วงก่อน</small>`);
    const now = today(), endEff = r.to < now ? r.to : now;
    const nDays = r.from > now ? 0 : diffDays(r.from, endEff) + 1;

    // หมวดรายจ่าย เทียบช่วงก่อน
    const cm = new Map(), pm = new Map();
    cur.filter((t) => t.type === 'expense').forEach((t) => cm.set(t.category, (cm.get(t.category) || 0) + t.amount));
    prev.filter((t) => t.type === 'expense').forEach((t) => pm.set(t.category, (pm.get(t.category) || 0) + t.amount));
    const cl = [...cm.entries()].sort((x, y) => y[1] - x[1]).slice(0, 7);
    const cmax = Math.max(1, ...cl.map((x) => x[1]));

    // ใช้จ่ายตามวันในสัปดาห์
    const wdSum = [0, 0, 0, 0, 0, 0, 0], wdCnt = [0, 0, 0, 0, 0, 0, 0];
    for (let d = r.from; d <= endEff; d = addDays(d, 1)) wdCnt[fromISO(d).getDay()]++;
    cur.filter((t) => t.type === 'expense').forEach((t) => { wdSum[fromISO(t.date).getDay()] += t.amount; });
    const order = [1, 2, 3, 4, 5, 6, 0];
    const wdAvg = order.map((w) => (wdCnt[w] ? wdSum[w] / wdCnt[w] : 0));
    const wdTop = wdAvg.indexOf(Math.max(...wdAvg));
    const wChart = chartBlock('ana', 'bars', { labels: order.map((w) => WD_S[w]), minGroupW: 38, height: 180, series: [{ name: 'เฉลี่ย', color: 'var(--accent)', values: wdAvg }],
      tip: (i) => ['วัน' + WD[order[i]], 'เฉลี่ย ' + money(wdAvg[i])] }, (i) => `<b>วัน${WD[order[i]]}</b> ใช้เฉลี่ย ${money(wdAvg[i])} (รวม ${money(wdSum[order[i]])})`);

    const top5 = cur.filter((t) => t.type === 'expense').sort((x, y) => y.amount - x.amount).slice(0, 5);

    // คน
    const pe = new Map();
    cur.filter((t) => t.type === 'expense').forEach((t) => { const k = t.person || '(ไม่ระบุชื่อ)'; pe.set(k, (pe.get(k) || 0) + t.amount); });
    const pl = [...pe.entries()].sort((x, y) => y[1] - x[1]);

    // ร้านข้าว
    const sh = state.shopDays.filter((e) => e.date >= r.from && e.date <= r.to), psh = state.shopDays.filter((e) => e.date >= pr.from && e.date <= pr.to);
    const sProfit = sumBy(sh, (e) => e.profit), sSales = sumBy(sh, (e) => e.sales), pProfit = sumBy(psh, (e) => e.profit);
    const best = sh.slice().sort((x, y) => y.profit - x.profit)[0];

    // ข้อสังเกตอัตโนมัติ
    const tips = [];
    const dExp = delta(exp, pexp);
    if (dExp !== null && Math.abs(dExp) >= 5) tips.push(`${a.mode === 'year' ? 'ปี' : 'เดือน'}นี้รายจ่าย${dExp > 0 ? 'เพิ่มขึ้น' : 'ลดลง'} ${Math.abs(dExp)}% เมื่อเทียบกับช่วงก่อน`);
    if (cl[0] && exp > 0) tips.push(`หมวดที่ใช้มากที่สุดคือ ${cl[0][0]} (${pct(cl[0][1], exp)}% ของรายจ่าย)`);
    cl.forEach(([name, val]) => { const p = pm.get(name) || 0; if (p > 0 && val > p * 1.3 && val - p >= 100) tips.push(`${name} เพิ่มขึ้น ${Math.round(((val - p) / p) * 100)}% (${money(p)} → ${money(val)})`); });
    if (Math.max(...wdAvg) > 0) tips.push(`ใช้จ่ายสูงสุดวัน${WD[order[wdTop]]} (เฉลี่ย ${money(wdAvg[wdTop])})`);
    if (inc > 0 && exp > inc) tips.push(`รายจ่ายมากกว่ารายรับ ${money(exp - inc)}`);
    if (sh.length) tips.push(`ร้านข้าวมีกำไรเฉลี่ย ${money(sProfit / sh.length)} ต่อวันที่จด${sSales > 0 ? ` (${pct(sProfit, sSales)}% ของยอดขาย)` : ''}`);
    if (!tips.length) tips.push('ข้อมูลยังน้อย จดรายการต่อไปเรื่อยๆ แล้วระบบจะช่วยวิเคราะห์ให้');

    v.innerHTML = `
      ${periodBar('ana', a, { modes: ['month', 'year'], noToday: false })}
      <div class="kpis">
        <div class="kpi k-inc"><span>รายรับ</span><b class="inc">${money(inc)}</b>${dTxt(delta(inc, pinc), false)}</div>
        <div class="kpi k-exp"><span>รายจ่าย</span><b class="exp">${money(exp)}</b>${dTxt(dExp, true)}</div>
        <div class="kpi accent"><span>คงเหลือในมือ</span><b>${money(inc - exp)}</b><small>${nDays > 0 ? 'จ่ายเฉลี่ย ' + money(exp / nDays) + '/วัน' : ''}</small></div>
      </div>
      <div class="card c-ana"><h2>ข้อสังเกต</h2><div class="tips">${tips.map((t) => `<div class="tip">💡 ${esc(t)}</div>`).join('')}</div></div>
      <div class="card c-exp"><h2>หมวดรายจ่าย เทียบช่วงก่อน</h2>
        ${cl.length ? cl.map(([name, val]) => {
          const p = pm.get(name) || 0, dd = delta(val, p), open = state.anaOpen.has(name);
          const items = open ? cur.filter((t) => t.type === 'expense' && t.category === name).sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : y.amount - x.amount)) : [];
          return `<div class="anacat ${open ? 'open' : ''}"><div class="lrow tap" data-act="ana-cat" data-v="${esc(name)}"><div class="nm"><i class="sw" style="background:${catInfo(name, 'expense').color}"></i><span>${esc(catInfo(name, 'expense').emoji)} ${esc(name)}</span></div><div class="num">${money(val)} ${dd === null ? '' : `<span class="pc ${dd > 0 ? 'exp' : 'inc'}">${dd > 0 ? '▲' : '▼'}${Math.abs(dd)}%</span>`}${ICON.chev}</div><div class="bar"><i style="width:${(val / cmax) * 100}%;background:${catInfo(name, 'expense').color}"></i></div></div>
          ${open ? `<div class="anaitems">${items.slice(0, 40).map((t) => `<div class="irow"><span>${fmtShort(t.date)} · ${esc(t.description || name)}${t.person ? ` <small class="muted">${esc(t.person)}</small>` : ''}</span><b class="num">${money(t.amount)}</b></div>`).join('')}${items.length > 40 ? `<div class="sidehint">และอีก ${items.length - 40} รายการ</div>` : ''}<div class="irow tot"><span>รวม ${items.length} รายการ</span><b class="num">${money(val)}</b></div></div>` : ''}</div>`;
        }).join('') : '<div class="empty slim">ยังไม่มีรายจ่ายในช่วงนี้</div>'}
      </div>
      <div class="card c-chart"><h2>ใช้จ่ายแต่ละวันในสัปดาห์</h2><p class="lead">ค่าเฉลี่ยต่อวัน · แตะแท่งเพื่อดูค่า</p>${wChart}</div>
      <div class="grid2">
        <div class="card c-exp"><h2>รายจ่ายก้อนใหญ่ 5 อันดับ</h2>${top5.length ? top5.map((t) => txRow(t, true)).join('') : '<div class="empty slim">ยังไม่มีข้อมูล</div>'}</div>
        <div class="card c-person"><h2>สัดส่วนตามคน</h2>${pl.length ? pl.map(([k, val]) => `<div class="lrow"><div class="nm"><span>👤 ${esc(k)}</span></div><div class="num">${money(val)}<span class="pc">${pct(val, exp)}%</span></div><div class="bar"><i style="width:${pct(val, exp)}%;background:var(--accent)"></i></div></div>`).join('') : '<div class="empty slim">ยังไม่มีข้อมูล</div>'}</div>
      </div>
      <div class="sp"></div>
      <div class="card c-shop"><h2>ร้านข้าว</h2>${sh.length ? `<div class="kpis four" style="margin-bottom:0">
        <div class="kpi"><span>กำไรรวม</span><b>${money(sProfit)}</b>${dTxt(delta(sProfit, pProfit), false)}</div>
        <div class="kpi"><span>กำไรเฉลี่ย/วัน</span><b>${money(sProfit / sh.length)}</b><small>${sh.length} วันที่จด</small></div>
        <div class="kpi"><span>กำไรต่อยอดขาย</span><b>${sSales > 0 ? pct(sProfit, sSales) + '%' : '–'}</b></div>
        <div class="kpi"><span>วันที่กำไรดีที่สุด</span><b>${best ? money(best.profit) : '–'}</b><small>${best ? fmtShort(best.date) : ''}</small></div></div>` : '<div class="empty slim">ยังไม่มียอดร้านข้าวในช่วงนี้</div>'}</div>`;
  }

  /* ================= หน้าตั้งค่า ================= */
  function acc(id, icon, title, sum, body, cls) {
    const open = !!state.open[id];
    return `<div class="acc ${cls || ''} ${open ? 'open' : ''}"><button class="acc-h" data-act="acc" data-v="${id}"><span class="acc-t">${icon} ${title}</span><span class="acc-s">${sum}</span>${ICON.chev}</button>${open ? `<div class="acc-b">${body}</div>` : ''}</div>`;
  }
  function catBlock(type) {
    const list = cats().map((c, i) => ({ c, i })).filter((x) => x.c.type === type);
    return list.map(({ c, i }) => {
      const open = state.catOpen === c.name, fb = c.name === P.FALLBACK[c.type];
      return `<div class="crow ${open ? 'open' : ''}"><div class="crow-h" data-act="cat-open" data-v="${esc(c.name)}"><span class="ico sm" style="background:${c.color}26">${esc(c.emoji)}</span><span class="cn">${esc(c.name)}</span><small class="muted">${(c.keywords || []).length} คำ</small>${ICON.chev}</div>
        ${open ? `<div class="crow-b"><label class="f">คำสำคัญ (คั่นด้วย ,)<input value="${esc((c.keywords || []).join(', '))}" data-change="cat-kw" data-i="${i}"></label>${fb ? '' : `<button class="btn sm danger" data-act="cat-del" data-i="${i}">ลบหมวดนี้</button>`}</div>` : ''}</div>`;
    }).join('') + `<details class="addcat"><summary class="btn sm">+ เพิ่มหมวด${type === 'income' ? 'รายรับ' : 'รายจ่าย'}</summary>
      <div class="fields three" style="margin-top:12px"><label class="f">ชื่อหมวด<input id="ncName-${type}"></label><label class="f">ไอคอน<input id="ncEmoji-${type}" value="📌"></label><label class="f">สี<input type="color" id="ncColor-${type}" value="${type === 'income' ? '#3fae8a' : '#e0708a'}"></label></div>
      <div class="fields one"><label class="f">คำสำคัญ (คั่นด้วย ,)<input id="ncKw-${type}" placeholder="เช่น ค่าน้ำมัน, เติมน้ำมัน"></label></div>
      <button class="btn primary" data-act="cat-add" data-v="${type}">เพิ่มหมวด</button></details>`;
  }
  function viewSettings(v) {
    const cur = T.get(state.settings.theme);
    const grp = state.themeGroup;
    const themeBody = `<div class="chips">${T.groups.map((g) => `<button class="chip ${g.id === grp ? 'on' : ''}" data-act="theme-group" data-v="${g.id}">${esc(g.name)}</button>`).join('')}</div>
      <div class="theme-grid">${T.byGroup(grp).map((t) => `<button class="tbtn ${t.id === cur.id ? 'on' : ''}" data-act="theme-pick" data-v="${t.id}">
        <div class="tprev" style="background:${t.vars.bg}"><i style="height:60%;background:${t.vars.accent}"></i><i style="height:38%;background:${t.vars.surface};border:1px solid ${t.vars.border}"></i><b style="background:${t.vars.income}"></b></div><span>${esc(t.name)}</span></button>`).join('')}</div>`;
    const peopleBody = `<div class="chips" style="margin-bottom:12px">${(state.settings.people || []).map((p, i) => `<span class="chip">${esc(p)} <span class="x" data-act="person-del" data-i="${i}" role="button" aria-label="ลบ">✕</span></span>`).join('') || '<span class="muted">ยังไม่มีชื่อ</span>'}</div>
      <div class="filters"><input id="newPerson" placeholder="เพิ่มชื่อ เช่น เกด"><button class="btn primary" style="flex:0 0 auto" data-act="person-add">เพิ่ม</button></div>`;
    const dataBody = `<p class="lead">${DB.live ? 'ข้อมูลเก็บที่ Supabase ทุกเครื่องในบ้านเห็นชุดเดียวกัน' : 'ตอนนี้เป็น <b>โหมดทดลอง</b> ข้อมูลอยู่ในเบราว์เซอร์เครื่องนี้เท่านั้น ใส่ค่า Supabase ใน <code>js/config.js</code> เพื่อใช้ร่วมกันทั้งบ้าน'}</p>
      <div class="chips"><button class="btn sm" data-act="export" data-v="tx">รายรับรายจ่าย (CSV)</button><button class="btn sm" data-act="export" data-v="shop">ยอดร้านข้าว (CSV)</button></div>
      <p class="hint">รายการ ${state.tx.length} · ยอดร้านข้าว ${state.shopDays.length} วัน · เงินเข้า/ออก ${state.moves.length} รายการ</p>`;
    const ec = catsOf('expense').length, ic = catsOf('income').length;
    v.innerHTML = `<div class="accs">
      ${acc('greet', '👋', 'ข้อความต้อนรับ', 'แสดงใต้ชื่อแอพ', `<label class="f">ข้อความ (เว้นว่างได้ ถ้าไม่ต้องการ)<input id="greetIn" maxlength="60" value="${esc(state.settings.greeting == null ? 'ขอให้เป็นวันที่ดีนะ' : state.settings.greeting)}" data-change="greeting" placeholder="เช่น ขอให้เป็นวันที่ดี"></label><p class="hint">ตัวอย่างที่จะแสดง: ${greeting()}</p>`)}
      ${acc('theme', '🎨', 'ธีม', esc(cur.name), themeBody, 'ca-0')}
      ${acc('people', '👨‍👩‍👧', 'คนในครอบครัว', `${(state.settings.people || []).length} คน`, peopleBody, 'ca-2')}
      ${acc('catExp', '🔻', 'หมวดรายจ่าย', `${ec} หมวด`, `<p class="lead">แตะหมวดเพื่อแก้คำสำคัญ ระบบใช้คำเหล่านี้แยกหมวดตอนพิมพ์หลายรายการ</p>` + catBlock('expense'), 'exp-acc')}
      ${acc('catInc', '🔺', 'หมวดรายรับ', `${ic} หมวด`, `<p class="lead">แตะหมวดเพื่อแก้คำสำคัญ</p>` + catBlock('income'), 'inc-acc')}
      ${acc('data', '💾', 'ข้อมูล', DB.live ? 'Supabase' : 'โหมดทดลอง', dataBody, 'ca-3')}
      <div class="foot"><button class="btn sm danger ghost" data-act="cat-reset">คืนค่าหมวดหมู่เริ่มต้น</button></div></div>`;
  }
  function exportCsv(kind) {
    const q = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    let head, rows;
    if (kind === 'tx') {
      head = ['วันที่', 'ประเภท', 'จำนวนเงิน', 'หมวด', 'รายการ', 'ชื่อ'];
      rows = state.tx.slice().sort((a, b) => (a.date < b.date ? -1 : 1)).map((t) => [t.date, t.type === 'income' ? 'รายรับ' : 'รายจ่าย', t.amount, t.category, t.description, t.person]);
    } else {
      const cfg = allocCfg();
      head = ['วันที่', 'ยอดขาย', 'ต้นทุน', 'กำไร', ...cfg.names, 'หมายเหตุ'];
      rows = state.shopDays.slice().sort((a, b) => (a.date < b.date ? -1 : 1)).map((e) => [e.date, e.sales, e.cost, e.profit, ...entryAmounts(e), e.note]);
    }
    const csv = '﻿' + [head, ...rows].map((r) => r.map(q).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = (kind === 'tx' ? 'รายรับรายจ่าย-' : 'ร้านข้าว-') + today() + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------- วาดหน้า ---------- */
  function greeting() {
    const g = state.settings.greeting;
    const msg = g == null ? 'ขอให้เป็นวันที่ดีนะ' : g;
    return `สวัสดีวัน${WD[new Date().getDay()]}${msg ? ' · ' + esc(msg) : ''}`;
  }
  function renderTabs() {
    $('#tabs').innerHTML = TABS.map(([id, label, svg]) => `<button class="${state.tab === id ? 'on' : ''}" data-act="tab" data-v="${id}"><svg viewBox="0 0 24 24">${svg}</svg><span>${label}</span></button>`).join('');
    $('#status').innerHTML = greeting();
    $('#demo').innerHTML = DB.live ? '' : '<div class="demopill">⚠️ ยังไม่ได้เชื่อมต่อ Supabase · ข้อมูลอยู่ในเครื่องนี้เท่านั้น ไม่ขึ้นเครื่องอื่น</div>';
  }
  function render(keepScroll) {
    const y = window.scrollY;
    renderTabs();
    const v = $('#view');
    ({ dash: viewDash, add: viewAdd, list: viewList, shop: viewShop, ana: viewAna, settings: viewSettings }[state.tab] || viewDash)(v);
    document.querySelectorAll('[data-chart]').forEach((box) => { box.scrollLeft = box.scrollWidth; });
    if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
  }
  function route() {
    const t = (location.hash || '').replace('#/', '');
    state.tab = TABS.some((x) => x[0] === t) ? t : 'dash';
    render();
  }
  function go(tab) {
    if (!TABS.some((x) => x[0] === tab)) tab = 'dash';
    if (location.hash === '#/' + tab) { state.tab = tab; render(); } else location.hash = '#/' + tab;
  }

  /* ---------- เหตุการณ์ ---------- */
  document.addEventListener('click', (e) => {
    const hit = e.target.closest('.c-hit');
    if (hit) {
      const box = hit.closest('[data-chart]'), name = box.dataset.chart, i = Number(hit.dataset.idx);
      state.sel[name] = state.sel[name] === i ? -1 : i;
      const sc = box.scrollLeft;
      box.innerHTML = drawChart(name); box.scrollLeft = sc;
      const rd = $('#read-' + name); if (rd) rd.innerHTML = readText(name);
      if (cache[name].panel) { const sd = $('#side-' + name); if (sd) { sd.innerHTML = cache[name].panel(state.sel[name]); sd.classList.toggle('idle', !(state.sel[name] >= 0)); } }
      return;
    }
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act, v = el.dataset.v, k = el.dataset.k, i = el.dataset.i != null ? Number(el.dataset.i) : null;
    switch (act) {
      case 'tab': go(v); break;
      case 'p-mode': { const st = stOf(k); st.mode = v; state.sel = {}; state.anaOpen = new Set(); render(true); break; }
      case 'p-prev': case 'p-next': { const st = stOf(k); st.anchor = step(st.mode, st.anchor, act === 'p-next' ? 1 : -1); state.sel = {}; if (k === 'list') state.list.open = new Set(); render(true); break; }
      case 'p-pick': openPicker(k); break;
      case 'pk-save': applyPicker(k); break;
      case 'pk-today': stOf(k).anchor = today(); state.sel = {}; closeModal(); render(true); break;
      case 'p-today': { stOf(k).anchor = today(); state.sel = {}; render(true); break; }
      case 'drill': state.dash.mode = el.dataset.m; state.dash.anchor = el.dataset.date; state.sel = {}; render(); break;
      case 'dash-cattype': state.dash.catType = v; render(true); break;
      case 'person-toggle': if (state.personOpen.has(v)) state.personOpen.delete(v); else state.personOpen.add(v); render(true); break;
      case 'add-chip': state.add.person = state.add.person === v ? '' : v; reparse(); render(true); break;
      case 'add-help': state.add.help = !state.add.help; render(true); break;
      case 'pay-help': state.add.payHelp = !state.add.payHelp; render(true); break;
      case 'row-type': { const r = state.add.rows[i]; if (r.type !== v) { r.type = v; const c = P.classify(r.desc, cats(), v); r.category = c ? c.name : P.FALLBACK[v]; } r.pot = resolvePot(r); renderPreview(); break; }
      case 'row-del': state.add.rows.splice(i, 1); renderPreview(); break;
      case 'add-save': saveAdd(el); break;
      case 'list-toggle': { const d = el.dataset.date; if (state.list.open.has(d)) state.list.open.delete(d); else state.list.open.add(d); $('#listBody').innerHTML = listBodyHtml(); break; }
      case 'list-month': state.list.mode = 'month'; state.list.anchor = el.dataset.date; state.list.open = new Set(); render(); break;
      case 'tx-edit': editTx(el.dataset.id); break;
      case 'tx-del': delTx(el.dataset.id); break;
      case 'tx-save': saveTxEdit(el.dataset.id); break;
      case 'modal-close': closeModal(); break;
      case 'use-stock': state.shopUI.form.cost = String(num(v)); fillShopForm(); break;
      case 'shop-save': saveShop(el); break;
      case 'shop-ser': state.shopUI.series[v] = !state.shopUI.series[v]; if (!Object.values(state.shopUI.series).some(Boolean)) state.shopUI.series[v] = true; render(true); break;
      case 'shop-edit': state.shopUI.formOpen = true; loadShopDate(el.dataset.date); render(true); { const sf = $('#shopForm'); if (sf) sf.scrollIntoView({ behavior: 'smooth', block: 'start' }); } break;
      case 'shop-del': {
        const en = state.shopDays.find((x) => x.id === el.dataset.id);
        if (en && confirm(`ลบยอดวันที่ ${fmtD(en.date)} ?`)) DB.deleteShop(en.id).then(() => { state.shopDays = state.shopDays.filter((x) => x.id !== en.id); toast('ลบแล้ว'); render(true); }).catch((er) => toast('ลบไม่สำเร็จ: ' + (er.message || er), true));
        break;
      }
      case 'pot-open': state.potOpen = state.potOpen === i ? -1 : i; render(true); break;
      case 'move-open': openMove(i >= 0 ? i : 0); break;
      case 'move-save': saveMove(); break;
      case 'move-edit': { const m = state.moves.find((x) => x.id === el.dataset.id); if (m) openMove(m.pot, m); break; }
      case 'auto-edit': openAutoEdit(el.dataset.date, i); break;
      case 'auto-save': saveAutoAmount(state.autoEdit.date, state.autoEdit.i, num($('#aeAmt').value)); break;
      case 'auto-del': if (confirm(`ตั้งยอดที่แบ่งเข้ากองนี้ของวันที่ ${fmtD(el.dataset.date)} เป็น ฿0 ?\n(ยอดขายและกำไรของวันยังอยู่ แก้กลับได้ภายหลัง)`)) saveAutoAmount(el.dataset.date, i, 0); break;
      case 'move-del': if (confirm('ลบรายการเงินเข้า/ออกนี้?')) DB.deleteMove(el.dataset.id).then(() => { state.moves = state.moves.filter((m) => m.id !== el.dataset.id); render(true); }).catch((er) => toast('ลบไม่สำเร็จ: ' + (er.message || er), true)); break;
      case 'names-open': openNames(); break;
      case 'names-save': {
        const names = [0, 1, 2].map((n) => $('#nmI' + n).value.trim() || DEF_ALLOC.names[n]);
        state.settings.alloc = { names, pcts: allocCfg().pcts };
        saveSetting('alloc'); closeModal(); toast('บันทึกชื่อกองแล้ว ✓'); render(true);
        break;
      }
      case 'shop-form-toggle': state.shopUI.formOpen = !state.shopUI.formOpen; render(true); if (state.shopUI.formOpen) { const sf = $('#shopForm'); if (sf) sf.scrollIntoView({ behavior: 'smooth', block: 'start' }); } break;
      case 'acc': state.open[v] = !state.open[v]; render(true); break;
      case 'cat-open': state.catOpen = state.catOpen === v ? null : v; render(true); break;
      case 'theme-group': state.themeGroup = v; render(true); break;
      case 'theme-pick': state.settings.theme = v; T.apply(v); saveSetting('theme'); render(true); break;
      case 'person-add': {
        const n = $('#newPerson').value.trim();
        if (!n) return;
        if (!(state.settings.people || []).includes(n)) { state.settings.people = (state.settings.people || []).concat(n); saveSetting('people'); }
        render(true); break;
      }
      case 'person-del': state.settings.people.splice(i, 1); saveSetting('people'); render(true); break;
      case 'cat-add': {
        const name = $('#ncName-' + v).value.trim();
        if (!name) return toast('ใส่ชื่อหมวดก่อน', true);
        if (cats().some((c) => c.name === name)) return toast('มีหมวดชื่อนี้แล้ว', true);
        const nc = { name, emoji: $('#ncEmoji-' + v).value.trim() || '📌', color: $('#ncColor-' + v).value, type: v, keywords: $('#ncKw-' + v).value.split(/[,\n]/).map((s) => s.trim()).filter(Boolean) };
        const list = cats().map((c) => Object.assign({}, c));
        const fi = list.findIndex((c) => c.name === P.FALLBACK[v]);
        list.splice(fi >= 0 ? fi : list.length, 0, nc);
        state.settings.categories = list; saveSetting('categories'); toast('เพิ่มหมวดแล้ว ✓'); render(true);
        break;
      }
      case 'cat-del': {
        const c = cats()[i];
        if (c && confirm(`ลบหมวด "${c.name}" ? (รายการเดิมที่อยู่ในหมวดนี้จะยังอยู่)`)) {
          state.settings.categories = cats().filter((_, n) => n !== i).map((x) => Object.assign({}, x)); state.catOpen = null; saveSetting('categories'); render(true);
        }
        break;
      }
      case 'cat-reset':
        if (confirm('คืนหมวดหมู่และคำสำคัญเป็นค่าเริ่มต้น ?')) { state.settings.categories = JSON.parse(JSON.stringify(P.DEFAULT_CATEGORIES)); saveSetting('categories'); render(true); }
        break;
      case 'export': exportCsv(v); break;
      case 'import-local': importLocal(el); break;
      case 'discard-local': {
        const c = DB.localCounts(), n = c.tx + c.shop + c.moves;
        if (confirm(`ลบข้อมูล ${n} รายการที่จดไว้ในเครื่องนี้ทิ้ง โดยไม่ย้ายขึ้น Supabase ?\n(ลบแล้วเอากลับคืนไม่ได้)`)) { DB.clearLocal(); toast('ลบข้อมูลในเครื่องนี้แล้ว'); render(true); }
        break;
      }
      case 'ana-cat': if (state.anaOpen.has(v)) state.anaOpen.delete(v); else state.anaOpen.add(v); render(true); break;
      case 'pot-view': state.potView = v; render(true); break;
      case 'd-open': {
        if (Date.now() - (state.swipedAt || 0) < 500) break;
        const inp = $('#' + el.dataset.t);
        if (!inp) break;
        try { inp.showPicker(); } catch (er) { inp.style.pointerEvents = 'auto'; inp.focus(); inp.click(); }
        break;
      }
      case 'd-step': { const inp = $('#' + el.dataset.t); if (inp) setDate(inp, addDays(inp.value || today(), Number(el.dataset.d))); break; }
      case 'card-add': openCard(null); break;
      case 'card-quick': openCard(null, { name: el.dataset.n, emoji: el.dataset.e, src: el.dataset.src }); break;
      case 'card-edit': openCard(el.dataset.id); break;
      case 'card-save': saveCard(); break;
      case 'card-del': if (confirm('ลบการ์ดนี้?')) { state.settings.cards = (state.settings.cards || []).filter((c) => c.id !== state.cardEdit); saveSetting('cards'); closeModal(); render(true); } break;
      case 'adj-open': openAdjust(); break;
      case 'adj-save': saveAdjust(false); break;
      case 'adj-clear': saveAdjust(true); break;
      default: break;
    }
  });

  document.addEventListener('input', (e) => {
    const el = e.target, kind = el.dataset.input;
    if (el.classList && el.classList.contains('dhid')) syncDateLabel(el);
    if (!kind) return;
    if (kind === 'add-text') { state.add.text = el.value; reparse(); renderPreview(); }
    else if (kind === 'add-date') { state.add.date = el.value || today(); reparse(); renderPreview(); }
    else if (kind === 'add-person') { state.add.person = el.value; document.querySelectorAll('[data-act="add-chip"]').forEach((c) => c.classList.toggle('on', c.dataset.v === el.value.trim())); reparse(); renderPreview(); }
    else if (kind === 'row') {
      const r = state.add.rows[Number(el.dataset.i)], f = el.dataset.f;
      if (!r) return;
      if (f === 'amount') { r.amount = num(el.value); const s = $('#sumline'); if (s) s.innerHTML = sumLine(); }
      else {
        r[f] = el.value;
        if (f === 'person' && state.add.potMode === 'auto') {
          r.pot = resolvePot(r);
          const ps = el.closest('.prow') && el.closest('.prow').querySelector('[data-f="pot"]');
          if (ps) ps.value = r.pot == null ? '' : String(r.pot);
        }
      }
    } else if (kind === 'list-q') { state.list.q = el.value; $('#listBody').innerHTML = listBodyHtml(); }
    else if (kind === 'shop-form') {
      const f = el.dataset.f;
      if (f === 'date') { if (!el.value) return; loadShopDate(el.value); fillShopForm(); }
      else { state.shopUI.form[f] = el.value; updateShopForm(); }
    } else if (kind === 'split') {
      const row = state.shopUI.form.rows[Number(el.dataset.i)];
      const idx = Number(el.dataset.i);
      if (idx === 2 && el.value.trim() === '') row.mode = 'rest'; // ล้างช่องส่วนที่ 3 = กลับไปคิดส่วนที่เหลือให้เอง
      else if (el.dataset.f === 'pct') { row.mode = 'pct'; row.pct = el.value; } else { row.mode = 'amt'; row.amt = el.value; }
      updateShopForm();
    }
  });

  document.addEventListener('change', (e) => {
    const el = e.target, kind = el.dataset.change;
    if (!kind) return;
    if (kind === 'dash-person') { state.dash.person = el.value; state.sel = {}; render(true); }
    else if (kind === 'list-person') { state.list.person = el.value; render(true); }
    else if (kind === 'list-cat') { state.list.cat = el.value; render(true); }
    else if (kind === 'add-potmode') { state.add.potMode = el.value; reparse(); renderPreview(); }
    else if (kind === 'row') { const r = state.add.rows[Number(el.dataset.i)]; if (r) { if (el.dataset.f === 'pot') r.pot = parsePot(el.value); else r[el.dataset.f] = el.value; if (el.dataset.f === 'category') { const pr = el.closest('.prow'); if (pr) pr.style.setProperty('--rc', catInfo(el.value, r.type).color); } } }
    else if (kind === 'greeting') { state.settings.greeting = el.value.trim(); saveSetting('greeting'); renderTabs(); toast('บันทึกข้อความแล้ว ✓'); }
    else if (kind === 'cat-kw') {
      const list = cats().map((c) => Object.assign({}, c)), c = list[Number(el.dataset.i)];
      if (c) { c.keywords = el.value.split(/[,\n،]/).map((s) => s.trim()).filter(Boolean); state.settings.categories = list; saveSetting('categories'); toast('บันทึกคำสำคัญแล้ว ✓'); }
    }
  });

  // ปัดซ้าย/ขวาที่ช่องวันที่ = เลื่อนวัน
  let swp = null;
  document.addEventListener('touchstart', (e) => { const b = e.target.closest && e.target.closest('.dshow'); swp = b ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: b.dataset.t } : null; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (!swp) return;
    const t = e.changedTouches[0], dx = t.clientX - swp.x, dy = t.clientY - swp.y, id = swp.t;
    swp = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) { const inp = $('#' + id); if (inp) { state.swipedAt = Date.now(); setDate(inp, addDays(inp.value || today(), dx < 0 ? 1 : -1)); } }
  }, { passive: true });

  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible' || !DB.live || Date.now() - state.lastLoad < 30000 || state.tab === 'add' || $('#modal')) return;
    try { const d = await DB.loadAll(); state.tx = d.tx; state.shopDays = d.shop; state.moves = d.moves || []; state.lastLoad = Date.now(); if (state.tab !== 'settings') render(true); } catch (e) { /* ignore */ }
  });

  /* ---------- เริ่มต้น ---------- */
  function applySettings(s) {
    const st = state.settings;
    if (s.theme) st.theme = s.theme;
    if (Array.isArray(s.categories) && s.categories.length) st.categories = s.categories;
    if (Array.isArray(s.people)) st.people = s.people;
    if (s.alloc) st.alloc = s.alloc;
    if (s.capital != null) st.capital = Number(s.capital) || 0;
    if (s.capDays != null) st.capDays = Number(s.capDays) || 7;
    if (s.cashAdj != null) st.cashAdj = Number(s.cashAdj) || 0;
    if (Array.isArray(s.cards)) st.cards = s.cards;
    if (typeof s.greeting === 'string') st.greeting = s.greeting;
    state.shopUI.form = null;
    T.apply(st.theme);
    state.themeGroup = T.get(st.theme).group;
  }
  async function boot() {
    try {
      const d = await DB.loadAll();
      state.tx = d.tx; state.shopDays = d.shop; state.moves = d.moves || []; applySettings(d.settings || {});
      if (d.potMissing) setTimeout(() => toast('ยังไม่ได้เพิ่มคอลัมน์ “จ่ายจากกอง” — รันไฟล์ supabase/update-pot.sql หนึ่งครั้ง', true), 1600);
      if (d.movesMissing) setTimeout(() => toast('ยังไม่มีตาราง pot_moves — รัน supabase/schema.sql ใหม่เพื่อใช้ระบบเงินเข้า/ออก', true), 800);
    } catch (e) {
      console.error(e);
      $('#view').innerHTML = `<div class="card"><h2>เชื่อมต่อฐานข้อมูลไม่สำเร็จ</h2><p class="lead">${esc(e.message || e)}</p><p class="hint">ตรวจสอบว่ารันไฟล์ <code>supabase/schema.sql</code> แล้ว และใส่ URL / anon key ใน <code>js/config.js</code> ถูกต้อง</p></div>`;
      renderTabs();
      return;
    }
    route();
  }
  window.__app = { state, render, boot };
  boot();
})();
