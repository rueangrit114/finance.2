/* บัญชีบ้านเรา — ตัวแอพหลัก (ไม่ต้อง build เปิดไฟล์ได้เลย) */
(function () {
  'use strict';
  const P = window.Parser, T = window.Themes, DB = window.DB, C = window.Charts;

  /* ---------- ค่าคงที่ / ตัวช่วย ---------- */
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
    ['settings', 'ตั้งค่า', '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>'],
  ];
  const ICON = {
    edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
    del: '<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>',
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
  const num = (v) => { const n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; };
  const round2 = (n) => Math.round(n * 100) / 100;
  const money = (n) => { n = Number(n) || 0; return (n < 0 ? '-' : '') + '฿' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);
  const sumBy = (list, f) => list.reduce((a, x) => a + f(x), 0);
  const opt = (v, l, sel) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(l)}</option>`;

  function range(mode, a) {
    if (mode === 'day') return { from: a, to: a, label: fmtLong(a) };
    if (mode === 'week') {
      const f = weekStart(a), t = addDays(f, 6), df = fromISO(f), dt = fromISO(t);
      return { from: f, to: t, label: `${fmtShort(f)} – ${fmtShort(t)} ${be(dt.getFullYear())}`, _y: df };
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
        const f = `${y}-${pad(m + 1)}-01`;
        out.push({ key: `${y}-${pad(m + 1)}`, from: f, to: iso(new Date(y, m + 1, 0, 12)), label: MONTHS_S[m], full: `${MONTHS[m]} ${be(y)}` });
      }
      return out;
    }
    let from = r.from;
    if (mode === 'day') from = addDays(a, -6);
    const to = mode === 'day' ? a : r.to;
    for (let d = from; d <= to; d = addDays(d, 1)) {
      const dt = fromISO(d);
      out.push({ key: d, from: d, to: d, label: mode === 'month' ? String(dt.getDate()) : WD_S[dt.getDay()], full: fmtLong(d) });
    }
    return out;
  }
  const keyOf = (mode, date) => (mode === 'year' ? date.slice(0, 7) : date);

  /* ---------- สถานะ ---------- */
  const state = {
    tab: 'dash', tx: [], shopDays: [],
    settings: { theme: T.defaultId, categories: null, people: ['เกด'], alloc: null, capital: 0 },
    dash: { mode: 'month', anchor: today(), person: '', catType: 'expense' },
    list: { mode: 'month', anchor: today(), person: '', cat: '', q: '' },
    add: { date: today(), person: '', text: '', rows: [] },
    shopUI: { mode: 'month', anchor: today(), form: { date: today(), sales: '', cost: '', profit: '', note: '' }, series: { sales: true, cost: true, profit: true } },
    themeGroup: 'pastel', sel: {}, lastLoad: Date.now(),
  };
  const cache = {};

  const cats = () => state.settings.categories || P.DEFAULT_CATEGORIES;
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

  /* ---------- กราฟพร้อมแตะดูค่า ---------- */
  function drawChart(name) {
    const c = cache[name];
    return C[c.type](Object.assign({}, c.opts, { width: chartW(), sel: state.sel[name] == null ? -1 : state.sel[name] }));
  }
  function readText(name) {
    const i = state.sel[name];
    return i == null || i < 0 ? 'เอานิ้วจิ้มบนกราฟเพื่อดูค่าได้เลย' : cache[name].read(i);
  }
  function chartBlock(name, type, opts, read) {
    cache[name] = { type, opts, read };
    return `<div class="chart-scroll" data-chart="${name}">${drawChart(name)}</div><div class="readout" id="read-${name}">${readText(name)}</div>`;
  }

  /* ---------- แถบเลือกช่วงเวลา ---------- */
  function periodBar(k, st) {
    const r = range(st.mode, st.anchor);
    return `<div class="pbar">
      <div class="seg">${['day', 'week', 'month', 'year'].map((m) => `<button class="${st.mode === m ? 'on' : ''}" data-act="p-mode" data-k="${k}" data-v="${m}">${MODE_TH[m]}</button>`).join('')}</div>
      <div class="nav"><button class="icon" data-act="p-prev" data-k="${k}" aria-label="ก่อนหน้า">${ICON.prev}</button><div class="plabel">${r.label}</div><button class="icon" data-act="p-next" data-k="${k}" aria-label="ถัดไป">${ICON.next}</button><button class="btn sm ghost" data-act="p-today" data-k="${k}">วันนี้</button></div>
    </div>`;
  }
  const stOf = (k) => (k === 'shop' ? state.shopUI : state[k]);

  /* ---------- แถวรายการ ---------- */
  function txRow(t) {
    const c = catInfo(t.category, t.type);
    return `<div class="trow">
      <div class="ico" style="background:${c.color}26">${esc(c.emoji)}</div>
      <div class="tmain"><div class="tdesc">${esc(t.description || c.name)}</div><div class="tsub">${esc(c.name)}${t.person ? ' · ' + esc(t.person) : ''}</div></div>
      <div class="tamt ${t.type === 'income' ? 'inc' : 'exp'}">${t.type === 'income' ? '+' : '-'}${money(t.amount)}</div>
      <div class="tbtns"><button class="icon" data-act="tx-edit" data-id="${t.id}" aria-label="แก้ไข">${ICON.edit}</button><button class="icon del" data-act="tx-del" data-id="${t.id}" aria-label="ลบ">${ICON.del}</button></div>
    </div>`;
  }
  function personSelect(id, val, extra) {
    const ps = knownPeople();
    return `<select id="${id}" ${extra || ''}>${opt('', 'ทุกคน', !val)}${ps.map((p) => opt(p, p, val === p)).join('')}${opt('__none', '(ไม่ระบุชื่อ)', val === '__none')}</select>`;
  }

  /* ================= หน้าสรุป ================= */
  function viewDash(v) {
    const d = state.dash, r = range(d.mode, d.anchor);
    const base = personFilter(state.tx, d.person);
    const cur = base.filter((t) => t.date >= r.from && t.date <= r.to);
    const inc = total(cur, 'income'), exp = total(cur, 'expense');
    const bks = buckets(d.mode, d.anchor);
    const inc0 = bks.map(() => 0), exp0 = bks.map(() => 0);
    const idx = new Map(bks.map((b, i) => [b.key, i]));
    base.forEach((t) => { const i = idx.get(keyOf(d.mode, t.date)); if (i != null) (t.type === 'income' ? inc0 : exp0)[i] += t.amount; });

    // ค่าเฉลี่ย
    let avgLabel = '', n = 0;
    const now = today();
    if (d.mode === 'year') {
      const y = fromISO(d.anchor).getFullYear(), cy = fromISO(now).getFullYear();
      n = y < cy ? 12 : y === cy ? fromISO(now).getMonth() + 1 : 0; avgLabel = 'ต่อเดือน';
    } else if (d.mode !== 'day') {
      n = r.from > now ? 0 : diffDays(r.from, r.to < now ? r.to : now) + 1; avgLabel = 'ต่อวัน';
    }

    const catList = (type) => {
      const m = new Map();
      cur.filter((t) => t.type === type).forEach((t) => m.set(t.category, (m.get(t.category) || 0) + t.amount));
      return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ label: name, value, color: catInfo(name, type).color, emoji: catInfo(name, type).emoji }));
    };
    const cl = catList(d.catType), ctotal = sumBy(cl, (x) => x.value);

    const pm = new Map();
    cur.forEach((t) => { const k = t.person || '(ไม่ระบุชื่อ)'; const o = pm.get(k) || { exp: 0, inc: 0 }; if (t.type === 'income') o.inc += t.amount; else o.exp += t.amount; pm.set(k, o); });
    const prs = [...pm.entries()].sort((a, b) => b[1].exp - a[1].exp);
    const pmax = Math.max(1, ...prs.map((x) => x[1].exp));

    const colors = { inc: 'var(--income)', exp: 'var(--expense)' };
    const chart = chartBlock('dash', 'bars', { labels: bks.map((b) => b.label), minGroupW: d.mode === 'month' ? 28 : 38, series: [{ name: 'รายจ่าย', color: colors.exp, values: exp0 }, { name: 'รายรับ', color: colors.inc, values: inc0 }] },
      (i) => `<b>${bks[i].full}</b><br><span class="exp">รายจ่าย ${money(exp0[i])}</span> · <span class="inc">รายรับ ${money(inc0[i])}</span>`);

    let daily = '';
    if (d.mode === 'day') {
      const list = cur.slice().sort((a, b) => 0);
      daily = list.length ? list.map(txRow).join('') : '<div class="empty"><div class="big">🌿</div>วันนี้ยังไม่มีรายการ</div>';
    } else {
      daily = bks.map((b, i) => {
        const e = exp0[i], c = inc0[i], isT = now >= b.from && now <= b.to;
        return `<div class="drow ${isT ? 'today' : ''}" data-act="drill" data-date="${b.from}" data-m="${d.mode === 'year' ? 'month' : 'day'}">
          <div class="dl">${d.mode === 'year' ? b.full.split(' ')[0] : WD_S[fromISO(b.from).getDay()] + ' ' + fromISO(b.from).getDate()}</div>
          <div class="bar" style="grid-column:auto"><i style="width:${Math.min(100, (e / Math.max(1, Math.max(...exp0))) * 100)}%;background:var(--expense)"></i></div>
          <div class="dv"><span class="exp">${e ? '-' + money(e) : '–'}</span>${c ? `<br><span class="inc">+${money(c)}</span>` : ''}</div></div>`;
      }).join('');
    }

    v.innerHTML = `
      ${periodBar('dash', d)}
      <div class="filters">${personSelect('dashPerson', d.person, 'data-change="dash-person"')}</div>
      <div class="kpis">
        <div class="kpi"><span>รายรับ</span><b class="inc">${money(inc)}</b></div>
        <div class="kpi"><span>รายจ่าย</span><b class="exp">${money(exp)}</b></div>
        <div class="kpi accent"><span>คงเหลือ</span><b>${money(inc - exp)}</b></div>
      </div>
      <div class="card"><h2>ประวัติรายรับรายจ่าย</h2><p class="lead">${d.mode === 'day' ? '7 วันล่าสุด' : d.mode === 'year' ? 'รายเดือน' : 'รายวัน'}</p>
        ${chart}
        <div class="legend"><span><i style="background:var(--expense)"></i>รายจ่าย</span><span><i style="background:var(--income)"></i>รายรับ</span></div>
        ${n > 0 ? `<div class="avgs"><div><small>รายจ่ายเฉลี่ย${avgLabel}</small><b class="exp">${money(exp / n)}</b></div><div><small>รายรับเฉลี่ย${avgLabel}</small><b class="inc">${money(inc / n)}</b></div></div>` : ''}
      </div>
      <div class="grid2">
        <div class="card"><div class="pbar" style="margin-bottom:10px"><h2>แยกตามหมวด</h2>
          <div class="seg"><button class="${d.catType === 'expense' ? 'on' : ''}" data-act="dash-cattype" data-v="expense">รายจ่าย</button><button class="${d.catType === 'income' ? 'on' : ''}" data-act="dash-cattype" data-v="income">รายรับ</button></div></div>
          ${cl.length ? `<div class="donut-wrap">${C.donut({ data: cl, top: d.catType === 'expense' ? 'รายจ่าย' : 'รายรับ', bottom: money(ctotal) })}
            <div class="leg-list">${cl.map((x) => `<div class="lrow"><div class="nm"><i class="sw" style="background:${x.color}"></i><span>${esc(x.emoji)} ${esc(x.label)}</span></div><div class="num">${money(x.value)}<span class="pc">${pct(x.value, ctotal)}%</span></div><div class="bar"><i style="width:${pct(x.value, ctotal)}%;background:${x.color}"></i></div></div>`).join('')}</div></div>`
            : '<div class="empty"><div class="big">🍃</div>ยังไม่มีข้อมูลในช่วงนี้</div>'}
        </div>
        <div class="card"><h2>ใครใช้เท่าไหร่</h2><p class="lead">แยกตามชื่อคนจด</p>
          ${prs.length ? prs.map(([name, o]) => `<div class="lrow"><div class="nm"><span>👤 ${esc(name)}</span></div><div class="num"><span class="exp">${money(o.exp)}</span>${o.inc ? `<span class="pc inc">+${money(o.inc)}</span>` : ''}</div><div class="bar"><i style="width:${(o.exp / pmax) * 100}%;background:var(--expense)"></i></div></div>`).join('') : '<div class="empty"><div class="big">👤</div>ยังไม่มีข้อมูล</div>'}
        </div>
      </div>
      <div class="sp"></div>
      <div class="card"><h2>${d.mode === 'day' ? 'รายการของวันนี้' : d.mode === 'year' ? 'สรุปรายเดือน' : 'สรุปวันต่อวัน'}</h2>${d.mode === 'day' ? '' : '<p class="lead">แตะที่แถวเพื่อดูรายละเอียด</p>'}${daily}</div>`;
  }

  /* ================= หน้าจดรายการ ================= */
  function reparse() {
    const a = state.add;
    a.rows = P.parse(a.text, { date: a.date, today: today(), person: (a.person || '').trim(), people: knownPeople(), categories: cats() });
  }
  function viewAdd(v) {
    const a = state.add;
    v.innerHTML = `
      <div class="card"><h2>✍️ จดรายการ</h2><p class="lead">พิมพ์ได้หลายรายการในครั้งเดียว หรือคัดลอกข้อความมาวางได้เลย</p>
        <div class="fields">
          <label class="f">วันที่<input type="date" id="addDate" value="${a.date}" data-input="add-date"></label>
          <label class="f">ชื่อผู้ใช้จ่าย (ถ้าไม่ได้พิมพ์ชื่อในข้อความ)<input id="addPerson" list="peopleDL" placeholder="เช่น เกด" value="${esc(a.person)}" data-input="add-person"></label>
        </div>
        <datalist id="peopleDL">${knownPeople().map((p) => `<option value="${esc(p)}">`).join('')}</datalist>
        <div class="chips" style="margin-bottom:12px">${knownPeople().map((p) => `<button class="chip ${a.person === p ? 'on' : ''}" data-act="add-chip" data-v="${esc(p)}">👤 ${esc(p)}</button>`).join('')}</div>
        <textarea id="addText" data-input="add-text" placeholder="เกดใช้เงินวันนี้ไป 50 บาท&#10;ซื้อถ่านปิ้งย่าง 40 บาท ซื้อขนม 15 บาท&#10;ขายของ 1135&#10;เมื่อวาน ค่าน้ำมัน 500">${esc(a.text)}</textarea>
        <div class="hint">เคล็ดลับ: ขึ้นบรรทัดใหม่หรือเขียนต่อกันก็ได้ · ระบุชื่อด้วย <code>เกด: ข้าว 50</code> หรือ <code>@เกด ข้าว 50</code> · ใส่ <code>+</code> นำหน้าถ้าเป็นรายรับ · ระบุวันที่ได้ เช่น <code>เมื่อวาน</code> หรือ <code>27/10</code></div>
      </div>
      <div class="card"><h2>ตรวจสอบก่อนบันทึก</h2><p class="lead">แก้ชื่อรายการ จำนวนเงิน หมวด และชื่อคนได้ก่อนกดบันทึก</p><div id="preview"></div></div>`;
    renderPreview();
  }
  function rowHtml(r, i) {
    const opts = catsOf(r.type).map((c) => opt(c.name, c.emoji + ' ' + c.name, c.name === r.category)).join('');
    return `<div class="prow" data-i="${i}">
      <div class="top2"><div class="seg"><button class="${r.type === 'expense' ? 'on' : ''}" data-act="row-type" data-i="${i}" data-v="expense">รายจ่าย</button><button class="${r.type === 'income' ? 'on' : ''}" data-act="row-type" data-i="${i}" data-v="income">รายรับ</button></div>
        ${r.date !== state.add.date ? `<span class="tagdate">📅 ${fmtD(r.date)}</span>` : '<span></span>'}
        <button class="icon del" data-act="row-del" data-i="${i}" aria-label="เอาออก">${ICON.del}</button></div>
      <input value="${esc(r.desc)}" placeholder="รายการ" data-input="row" data-i="${i}" data-f="desc">
      <input class="money-in" inputmode="decimal" value="${r.amount}" data-input="row" data-i="${i}" data-f="amount">
      <div class="two"><select data-change="row" data-i="${i}" data-f="category">${opts}</select>
        <input list="peopleDL" placeholder="ชื่อคน" value="${esc(r.person)}" data-input="row" data-i="${i}" data-f="person"></div>
    </div>`;
  }
  function sumLine() {
    const rows = state.add.rows;
    const inc = sumBy(rows.filter((r) => r.type === 'income'), (r) => r.amount), exp = sumBy(rows.filter((r) => r.type === 'expense'), (r) => r.amount);
    return `<span>แยกได้ <b>${rows.length}</b> รายการ</span><span><span class="exp">รายจ่าย ${money(exp)}</span> · <span class="inc">รายรับ ${money(inc)}</span></span>`;
  }
  function renderPreview() {
    const box = $('#preview');
    if (!box) return;
    const rows = state.add.rows;
    if (!rows.length) {
      box.innerHTML = '<div class="empty"><div class="big">📝</div>พิมพ์หรือวางรายการด้านบน ระบบจะแยกให้ทันที</div>';
      return;
    }
    box.innerHTML = `<div class="sumline" id="sumline">${sumLine()}</div>${rows.map(rowHtml).join('')}<button class="btn primary block" data-act="add-save">บันทึกทั้งหมด (${rows.length} รายการ)</button>`;
  }
  async function saveAdd(btn) {
    const rows = state.add.rows.filter((r) => r.amount > 0);
    if (!rows.length) return toast('ยังไม่มีรายการที่บันทึกได้', true);
    btn.disabled = true;
    try {
      const made = await DB.addTx(rows.map((r) => ({ date: r.date, type: r.type, amount: r.amount, category: r.category, description: r.desc, person: (r.person || '').trim() })));
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
    let cur = personFilter(state.tx, l.person).filter((t) => t.date >= r.from && t.date <= r.to);
    if (l.cat) cur = cur.filter((t) => t.category === l.cat);
    const q = l.q.trim().toLowerCase();
    if (q) cur = cur.filter((t) => (t.description + ' ' + t.category + ' ' + t.person).toLowerCase().includes(q));
    if (!cur.length) return '<div class="card"><div class="empty"><div class="big">🌿</div>ไม่พบรายการในช่วงนี้</div></div>';
    const groups = new Map();
    cur.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).forEach((t) => { if (!groups.has(t.date)) groups.set(t.date, []); groups.get(t.date).push(t); });
    const inc = total(cur, 'income'), exp = total(cur, 'expense');
    return `<div class="sumline"><span>${cur.length} รายการ</span><span><span class="exp">จ่าย ${money(exp)}</span> · <span class="inc">รับ ${money(inc)}</span></span></div>` +
      [...groups.entries()].map(([date, list]) => {
        const di = total(list, 'income'), de = total(list, 'expense');
        return `<div class="card" style="padding-top:4px;padding-bottom:6px"><div class="dayhead"><span>${fmtLong(date)}</span><small>${de ? '<span class="exp">-' + money(de) + '</span> ' : ''}${di ? '<span class="inc">+' + money(di) + '</span>' : ''}</small></div>${list.map(txRow).join('')}</div>`;
      }).join('');
  }
  function viewList(v) {
    const l = state.list;
    const allCats = [...new Set(cats().map((c) => c.name))];
    v.innerHTML = `${periodBar('list', l)}
      <div class="filters">${personSelect('listPerson', l.person, 'data-change="list-person"')}
        <select id="listCat" data-change="list-cat">${opt('', 'ทุกหมวด', !l.cat)}${allCats.map((c) => opt(c, c, l.cat === c)).join('')}</select>
        <input id="listQ" type="search" placeholder="ค้นหา…" value="${esc(l.q)}" data-input="list-q"></div>
      <div id="listBody">${listBodyHtml()}</div>`;
  }

  /* ---------- หน้าต่างแก้ไขรายการ ---------- */
  function openModal(html) {
    closeModal();
    const m = document.createElement('div');
    m.className = 'modal-back'; m.id = 'modal';
    m.innerHTML = `<div class="modal">${html}</div>`;
    m.addEventListener('mousedown', (e) => { if (e.target === m) closeModal(); });
    document.body.appendChild(m);
  }
  function closeModal() { const m = $('#modal'); if (m) m.remove(); }
  function editTx(id) {
    const t = state.tx.find((x) => x.id === id);
    if (!t) return;
    const opts = (type, sel) => catsOf(type).map((c) => opt(c.name, c.emoji + ' ' + c.name, c.name === sel)).join('');
    openModal(`<h3>แก้ไขรายการ</h3>
      <div class="fields">
        <label class="f">วันที่<input type="date" id="mDate" value="${t.date}"></label>
        <label class="f">ประเภท<select id="mType">${opt('expense', 'รายจ่าย', t.type === 'expense')}${opt('income', 'รายรับ', t.type === 'income')}</select></label>
        <label class="f">จำนวนเงิน<input id="mAmt" class="money-in" inputmode="decimal" value="${t.amount}"></label>
        <label class="f">หมวด<select id="mCat">${opts(t.type, t.category)}</select></label>
      </div>
      <div class="fields one"><label class="f">รายการ<input id="mDesc" value="${esc(t.description)}"></label>
        <label class="f">ชื่อคน<input id="mPerson" list="peopleDL2" value="${esc(t.person)}"><datalist id="peopleDL2">${knownPeople().map((p) => `<option value="${esc(p)}">`).join('')}</datalist></label></div>
      <div class="actions"><button class="btn" data-act="modal-close">ยกเลิก</button><button class="btn primary" data-act="tx-save" data-id="${id}">บันทึก</button></div>`);
    $('#mType').addEventListener('change', () => { const ty = $('#mType').value; $('#mCat').innerHTML = opts(ty, P.FALLBACK[ty]); });
  }
  async function saveTxEdit(id) {
    const patch = { date: $('#mDate').value, type: $('#mType').value, amount: num($('#mAmt').value), category: $('#mCat').value, description: $('#mDesc').value.trim(), person: $('#mPerson').value.trim() };
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

  /* ================= หน้าร้านข้าว ================= */
  function allocCfg() {
    const a = state.settings.alloc || {};
    return { names: a.names && a.names.length === 3 ? a.names : DEF_ALLOC.names, pcts: a.pcts && a.pcts.length === 2 ? a.pcts : DEF_ALLOC.pcts };
  }
  function splitProfit(profit, cfg) {
    const p = Math.max(0, Number(profit) || 0);
    const a = round2((p * cfg.pcts[0]) / 100), b = round2((p * cfg.pcts[1]) / 100), c = round2(p - a - b);
    return { pcts: [cfg.pcts[0], cfg.pcts[1], round2(100 - cfg.pcts[0] - cfg.pcts[1])], amounts: [a, b, c] };
  }
  const entryAmounts = (e) => (e.alloc && e.alloc.amounts ? e.alloc.amounts : splitProfit(e.profit, allocCfg()).amounts);
  const trueCost = (e) => e.sales - e.profit;

  function shopPreviewHtml() {
    const f = state.shopUI.form, cfg = allocCfg();
    const sales = num(f.sales), cost = num(f.cost), profit = num(f.profit);
    const sp = splitProfit(profit, cfg);
    const real = sales - profit, other = real - cost;
    return `<div class="split">${[0, 1, 2].map((i) => `<div class="srow"><div>${esc(cfg.names[i])} <small>${sp.pcts[i]}%</small></div><b>${money(sp.amounts[i])}</b></div>`).join('')}</div>
      <div class="hint" style="margin:8px 0 14px">ต้นทุนที่แท้จริง (ยอดขาย − กำไร) = <b>${money(real)}</b>${f.cost !== '' && other > 0.005 ? ` · ค่าใช้จ่ายอื่นนอกเหนือต้นทุนที่กรอก ${money(other)}` : ''}${profit < 0 ? ' · กำไรติดลบ จะไม่แบ่งเงิน' : ''}</div>`;
  }
  function existingShop(date) { return state.shopDays.find((e) => e.date === date); }
  function updateShopForm() {
    const el = $('#shopPrev');
    if (el) el.innerHTML = shopPreviewHtml();
    const b = $('#shopSaveBtn');
    if (b) b.textContent = existingShop(state.shopUI.form.date) ? `อัปเดตยอดวันที่ ${fmtD(state.shopUI.form.date)}` : `บันทึกยอดวันที่ ${fmtD(state.shopUI.form.date)}`;
  }
  function fillShopForm() {
    const f = state.shopUI.form;
    [['sDate', 'date'], ['sSales', 'sales'], ['sCost', 'cost'], ['sProfit', 'profit'], ['sNote', 'note']].forEach(([id, k]) => { const el = $('#' + id); if (el) el.value = f[k]; });
    updateShopForm();
  }
  function loadShopDate(date) {
    const e = existingShop(date), f = state.shopUI.form;
    f.date = date;
    if (e) { f.sales = String(e.sales); f.cost = String(e.cost); f.profit = String(e.profit); f.note = e.note || ''; }
    else { f.sales = ''; f.cost = ''; f.profit = ''; f.note = ''; }
  }

  function viewShop(v) {
    const u = state.shopUI, cfg = allocCfg(), f = u.form, r = range(u.mode, u.anchor);
    const cap = Number(state.settings.capital) || 0;
    const cur = state.shopDays.filter((e) => e.date >= r.from && e.date <= r.to).sort((a, b) => (a.date < b.date ? 1 : -1));
    const sales = sumBy(cur, (e) => e.sales), cost = sumBy(cur, (e) => e.cost), profit = sumBy(cur, (e) => e.profit);
    const parts = [0, 1, 2].map((i) => sumBy(cur, (e) => entryAmounts(e)[i] || 0));
    const bks = buckets(u.mode, u.anchor);
    const idx = new Map(bks.map((b, i) => [b.key, i]));
    const S = bks.map(() => 0), Co = bks.map(() => 0), Pr = bks.map(() => 0);
    state.shopDays.forEach((e) => { const i = idx.get(keyOf(u.mode, e.date)); if (i != null) { S[i] += e.sales; Co[i] += e.cost; Pr[i] += e.profit; } });
    const sorted = state.shopDays.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    const reserveTo = (to) => sumBy(sorted.filter((e) => e.date <= to), (e) => entryAmounts(e)[1] || 0);
    const R = bks.map((b) => reserveTo(b.to)), W = R.map((x) => x + cap);
    const allParts = [0, 1, 2].map((i) => sumBy(state.shopDays, (e) => entryAmounts(e)[i] || 0));

    const seriesAll = [
      { key: 'sales', name: 'ยอดขาย', color: 'var(--accent)', values: S },
      { key: 'cost', name: 'ต้นทุน', color: 'var(--expense)', values: Co },
      { key: 'profit', name: 'กำไร', color: 'var(--income)', values: Pr },
    ];
    const active = seriesAll.filter((s) => u.series[s.key]);
    const chart1 = chartBlock('shop1', 'bars', { labels: bks.map((b) => b.label), minGroupW: u.mode === 'month' ? 34 : 44, series: active.length ? active : seriesAll },
      (i) => `<b>${bks[i].full}</b><br>ขาย ${money(S[i])} · ต้นทุน ${money(Co[i])} · <span class="inc">กำไร ${money(Pr[i])}</span>`);
    const lineSeries = [{ name: 'ทุนสำรองสะสม', color: 'var(--accent)', values: R }];
    if (cap > 0) lineSeries.push({ name: 'ทุนหมุนเวียน', color: 'var(--income)', values: W });
    const chart2 = chartBlock('shop2', 'line', { labels: bks.map((b) => b.label), minGroupW: u.mode === 'month' ? 34 : 44, series: lineSeries },
      (i) => `<b>${bks[i].full}</b><br>ทุนสำรองสะสม ${money(R[i])}${cap > 0 ? ` · ทุนหมุนเวียน ${money(W[i])}` : ''}`);

    const rows = cur.map((e) => `<tr><td>${fmtShort(e.date)}</td><td>${money(e.sales)}</td><td>${money(e.cost)}</td><td class="${e.profit >= 0 ? 'inc' : 'exp'}">${money(e.profit)}</td>
      <td class="act"><button class="icon" data-act="shop-edit" data-date="${e.date}" aria-label="แก้ไข">${ICON.edit}</button> <button class="icon del" data-act="shop-del" data-id="${e.id}" aria-label="ลบ">${ICON.del}</button></td></tr>`).join('');

    v.innerHTML = `
      <div class="card" id="shopForm"><h2>🍚 จดยอดร้านข้าว</h2><p class="lead">กรอกยอดแต่ละวัน ระบบแบ่งกำไรให้ตามเปอร์เซ็นต์ที่ตั้งไว้ด้านล่าง</p>
        <div class="fields">
          <label class="f">วันที่<input type="date" id="sDate" value="${f.date}" data-input="shop-form" data-f="date"></label>
          <label class="f">ยอดขาย (บาท)<input id="sSales" class="money-in" inputmode="decimal" value="${esc(f.sales)}" data-input="shop-form" data-f="sales" placeholder="0"></label>
          <label class="f">ต้นทุน (บาท)<input id="sCost" class="money-in" inputmode="decimal" value="${esc(f.cost)}" data-input="shop-form" data-f="cost" placeholder="0"></label>
          <label class="f">กำไร (บาท) — กรอกเอง<input id="sProfit" class="money-in" inputmode="decimal" value="${esc(f.profit)}" data-input="shop-form" data-f="profit" placeholder="0"></label>
        </div>
        <div class="fields one"><label class="f">หมายเหตุ (ไม่บังคับ)<input id="sNote" value="${esc(f.note)}" data-input="shop-form" data-f="note"></label></div>
        <div id="shopPrev">${shopPreviewHtml()}</div>
        <button class="btn primary block" id="shopSaveBtn" data-act="shop-save">${existingShop(f.date) ? 'อัปเดต' : 'บันทึก'}ยอดวันที่ ${fmtD(f.date)}</button>
      </div>

      ${periodBar('shop', u)}
      <div class="kpis four">
        <div class="kpi"><span>ยอดขาย</span><b>${money(sales)}</b><small>${cur.length} วันที่จด</small></div>
        <div class="kpi"><span>ต้นทุน</span><b class="exp">${money(cost)}</b></div>
        <div class="kpi accent"><span>กำไร</span><b>${money(profit)}</b><small>${sales > 0 ? pct(profit, sales) + '% ของยอดขาย' : ''}</small></div>
        <div class="kpi"><span>ต้นทุนที่แท้จริง</span><b>${money(sales - profit)}</b><small>ยอดขาย − กำไร</small></div>
      </div>
      <div class="card"><h2>การแบ่งกำไรช่วงนี้</h2><p class="lead">รวมจากกำไรที่จดไว้ในช่วงที่เลือก</p>
        <div class="split">${[0, 1, 2].map((i) => `<div class="srow"><div>${esc(cfg.names[i])} <small>${i < 2 ? cfg.pcts[i] : round2(100 - cfg.pcts[0] - cfg.pcts[1])}%</small></div><b>${money(parts[i])}</b></div>`).join('')}</div></div>
      <div class="card"><h2>สะสมทั้งหมด</h2><p class="lead">นับตั้งแต่เริ่มจดจนถึงตอนนี้</p>
        <div class="kpis four" style="margin-bottom:0">
          <div class="kpi"><span>ทุนสำรองสะสม</span><b>${money(allParts[1])}</b><small>${esc(cfg.names[1])}</small></div>
          <div class="kpi"><span>ทุนหมุนเวียน</span><b>${money(cap + allParts[1])}</b><small>ทุนตั้งต้น + ทุนสำรองสะสม</small></div>
          <div class="kpi"><span>${esc(cfg.names[0])}</span><b>${money(allParts[0])}</b><small>สะสม</small></div>
          <div class="kpi"><span>${esc(cfg.names[2])}</span><b>${money(allParts[2])}</b><small>สะสม</small></div>
        </div></div>
      <div class="card"><h2>ยอดขาย ต้นทุน กำไร</h2><p class="lead">${u.mode === 'day' ? '7 วันล่าสุด' : u.mode === 'year' ? 'รายเดือน' : 'รายวัน'}</p>
        <div class="chips" style="margin-bottom:10px">${seriesAll.map((s) => `<button class="chip ${u.series[s.key] ? 'on' : ''}" data-act="shop-ser" data-v="${s.key}">${s.name}</button>`).join('')}</div>
        ${chart1}</div>
      <div class="card"><h2>ทุนสำรองสะสม</h2><p class="lead">เติบโตขึ้นเท่าไรในแต่ละช่วง</p>${chart2}
        <div class="legend"><span><i style="background:var(--accent)"></i>ทุนสำรองสะสม</span>${cap > 0 ? '<span><i style="background:var(--income)"></i>ทุนหมุนเวียน</span>' : ''}</div></div>
      <div class="card"><h2>รายวัน</h2>${cur.length ? `<div class="tblwrap"><table class="shoptbl"><thead><tr><th>วันที่</th><th>ยอดขาย</th><th>ต้นทุน</th><th>กำไร</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty"><div class="big">🍚</div>ยังไม่มียอดในช่วงนี้</div>'}</div>

      <details class="card"><summary>⚙️ ตั้งค่าการแบ่งกำไรและทุน</summary>
        <p class="lead">เปลี่ยนชื่อหัวข้อและเปอร์เซ็นต์ได้ ส่วนที่ 3 คือส่วนที่เหลือทั้งหมด (คำนวณให้อัตโนมัติ) — มีผลกับยอดที่จดต่อจากนี้ ยอดที่จดไปแล้วยังคงเดิม</p>
        ${[0, 1, 2].map((i) => `<div class="fields" style="grid-template-columns:1fr 110px">
          <label class="f">ชื่อส่วนที่ ${i + 1}<input id="aName${i}" value="${esc(cfg.names[i])}"></label>
          <label class="f">เปอร์เซ็นต์<input id="aPct${i}" inputmode="decimal" value="${i < 2 ? cfg.pcts[i] : round2(100 - cfg.pcts[0] - cfg.pcts[1])}" ${i === 2 ? 'readonly' : 'data-input="alloc-form"'}></label></div>`).join('')}
        <div class="fields one"><label class="f">ทุนหมุนเวียนตั้งต้น (บาท)<input id="aCap" class="money-in" inputmode="decimal" value="${cap || ''}" placeholder="0"></label></div>
        <button class="btn primary block" data-act="alloc-save">บันทึกการตั้งค่า</button>
      </details>`;
  }
  async function saveShop(btn) {
    const f = state.shopUI.form;
    if (!f.date) return toast('เลือกวันที่ก่อน', true);
    const row = { date: f.date, sales: num(f.sales), cost: num(f.cost), profit: num(f.profit), note: (f.note || '').trim() };
    if (row.sales === 0 && row.profit === 0 && row.cost === 0) return toast('กรอกยอดขายหรือกำไรก่อน', true);
    row.alloc = splitProfit(row.profit, allocCfg());
    btn.disabled = true;
    try {
      const saved = await DB.saveShop(row);
      const i = state.shopDays.findIndex((e) => e.date === saved.date);
      if (i >= 0) state.shopDays[i] = saved; else state.shopDays.push(saved);
      toast('บันทึกยอดร้านข้าวแล้ว ✓');
      state.shopUI.anchor = f.date;
      loadShopDate(addDays(f.date, 1) > today() ? today() : addDays(f.date, 1));
      render(true);
    } catch (e) { toast('บันทึกไม่สำเร็จ: ' + (e.message || e), true); }
    btn.disabled = false;
  }

  /* ================= หน้าตั้งค่า ================= */
  function viewSettings(v) {
    const cur = T.get(state.settings.theme);
    const grp = state.themeGroup;
    const list = T.byGroup(grp);
    v.innerHTML = `
      <div class="card"><h2>🎨 ธีม ${T.all.length} ชุด</h2><p class="lead">กำลังใช้: <b>${esc(cur.name)}</b></p>
        <div class="chips">${T.groups.map((g) => `<button class="chip ${g.id === grp ? 'on' : ''}" data-act="theme-group" data-v="${g.id}">${esc(g.name)} · ${g.count}</button>`).join('')}</div>
        <div class="theme-grid">${list.map((t) => `<button class="tbtn ${t.id === cur.id ? 'on' : ''}" data-act="theme-pick" data-v="${t.id}">
          <div class="tprev" style="background:${t.vars.bg}"><i style="height:60%;background:${t.vars.accent}"></i><i style="height:38%;background:${t.vars.surface};border:1px solid ${t.vars.border}"></i><b style="background:${t.vars.income}"></b></div><span>${esc(t.name)}</span></button>`).join('')}</div>
      </div>
      <div class="card"><h2>👨‍👩‍👧 คนในครอบครัว</h2><p class="lead">ชื่อเหล่านี้จะขึ้นให้เลือกตอนจดรายการ (พิมพ์ชื่อใหม่ตอนจดได้เสมอ)</p>
        <div class="chips" style="margin-bottom:12px">${(state.settings.people || []).map((p, i) => `<span class="chip">👤 ${esc(p)} <span class="x" data-act="person-del" data-i="${i}" role="button" aria-label="ลบ">✕</span></span>`).join('') || '<span class="muted">ยังไม่มีชื่อ</span>'}</div>
        <div class="filters"><input id="newPerson" placeholder="เพิ่มชื่อ เช่น เกด"><button class="btn primary" style="flex:0 0 auto" data-act="person-add">เพิ่ม</button></div>
      </div>
      <div class="card"><h2>🏷️ หมวดหมู่และคำสำคัญ</h2><p class="lead">ตอนพิมพ์หลายรายการ ระบบจะดูว่ามีคำเหล่านี้ในรายการไหม แล้วจัดเข้าหมวดให้ (คั่นคำด้วยเครื่องหมายจุลภาค ,)</p>
        ${cats().map((c, i) => `<div class="catrow"><div class="nm"><span class="ico" style="background:${c.color}26;width:34px;height:34px;font-size:16px">${esc(c.emoji)}</span>${esc(c.name)} <span class="badge ${c.type}">${c.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</span></div>
          <span></span>${c.name === P.FALLBACK[c.type] ? '<span></span>' : `<button class="icon del" data-act="cat-del" data-i="${i}" aria-label="ลบหมวด">${ICON.del}</button>`}
          <input class="kw" value="${esc((c.keywords || []).join(', '))}" data-change="cat-kw" data-i="${i}" placeholder="คำสำคัญ คั่นด้วย ,"></div>`).join('')}
        <details style="margin-top:14px"><summary class="btn sm" style="display:inline-block;list-style:none">+ เพิ่มหมวดใหม่</summary>
          <div class="fields three" style="margin-top:12px"><label class="f">ชื่อหมวด<input id="ncName"></label><label class="f">ไอคอน (อีโมจิ)<input id="ncEmoji" value="📌"></label>
            <label class="f">ประเภท<select id="ncType">${opt('expense', 'รายจ่าย', true)}${opt('income', 'รายรับ')}</select></label></div>
          <div class="fields"><label class="f">สี<input type="color" id="ncColor" value="#7a8cf0"></label><label class="f">คำสำคัญ<input id="ncKw" placeholder="เช่น ค่าน้ำมัน, เติมน้ำมัน"></label></div>
          <button class="btn primary" data-act="cat-add">เพิ่มหมวด</button></details>
        <div style="margin-top:14px"><button class="btn sm danger" data-act="cat-reset">คืนค่าหมวดหมู่เริ่มต้น</button></div>
      </div>
      <div class="card"><h2>💾 ข้อมูล</h2>
        <p class="lead">${DB.live ? 'เชื่อมต่อ Supabase แล้ว — ทุกเครื่องในบ้านเห็นข้อมูลชุดเดียวกัน' : 'ตอนนี้เป็น <b>โหมดทดลอง</b> ข้อมูลอยู่ในเบราว์เซอร์เครื่องนี้เท่านั้น ใส่ค่า Supabase ใน <code>js/config.js</code> เพื่อใช้ร่วมกันทั้งบ้าน'}</p>
        <div class="chips"><button class="btn sm" data-act="export" data-v="tx">ดาวน์โหลดรายรับรายจ่าย (CSV)</button><button class="btn sm" data-act="export" data-v="shop">ดาวน์โหลดยอดร้านข้าว (CSV)</button></div>
        <p class="hint">รายการทั้งหมด ${state.tx.length} รายการ · ยอดร้านข้าว ${state.shopDays.length} วัน</p>
      </div>`;
  }
  function exportCsv(kind) {
    const q = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    let head, rows;
    if (kind === 'tx') {
      head = ['วันที่', 'ประเภท', 'จำนวนเงิน', 'หมวด', 'รายการ', 'ชื่อคน'];
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
  function renderTabs() {
    $('#tabs').innerHTML = TABS.map(([id, label, svg]) => `<button class="${state.tab === id ? 'on' : ''}" data-act="tab" data-v="${id}"><svg viewBox="0 0 24 24">${svg}</svg><span>${label}</span></button>`).join('');
    $('#status').innerHTML = DB.live ? '<span class="dot"></span>เชื่อมต่อ Supabase แล้ว' : '<span class="dot warn"></span>โหมดทดลอง · เก็บในเครื่องนี้เท่านั้น';
  }
  function render(keepScroll) {
    const y = window.scrollY;
    renderTabs();
    const v = $('#view');
    ({ dash: viewDash, add: viewAdd, list: viewList, shop: viewShop, settings: viewSettings }[state.tab] || viewDash)(v);
    document.querySelectorAll('[data-chart]').forEach((box) => { box.scrollLeft = box.scrollWidth; });
    if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
  }
  function route() {
    const t = (location.hash || '').replace('#/', '');
    state.tab = TABS.some((x) => x[0] === t) ? t : 'dash';
    render();
  }

  /* ---------- เหตุการณ์ ---------- */
  document.addEventListener('click', (e) => {
    const hit = e.target.closest('.c-hit');
    if (hit) {
      const box = hit.closest('[data-chart]'), name = box.dataset.chart, i = Number(hit.dataset.idx);
      state.sel[name] = state.sel[name] === i ? -1 : i;
      const sc = box.scrollLeft;
      box.innerHTML = drawChart(name); box.scrollLeft = sc;
      $('#read-' + name).innerHTML = readText(name);
      return;
    }
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act, v = el.dataset.v, k = el.dataset.k, i = el.dataset.i != null ? Number(el.dataset.i) : null;
    switch (act) {
      case 'tab': location.hash = '#/' + v; break;
      case 'p-mode': { const st = stOf(k); st.mode = v; state.sel = {}; render(true); break; }
      case 'p-prev': case 'p-next': { const st = stOf(k); st.anchor = step(st.mode, st.anchor, act === 'p-next' ? 1 : -1); state.sel = {}; render(true); break; }
      case 'p-today': { stOf(k).anchor = today(); state.sel = {}; render(true); break; }
      case 'drill': state.dash.mode = el.dataset.m; state.dash.anchor = el.dataset.date; state.sel = {}; render(); break;
      case 'dash-cattype': state.dash.catType = v; render(true); break;
      case 'add-chip': state.add.person = state.add.person === v ? '' : v; reparse(); render(true); break;
      case 'row-type': { const r = state.add.rows[i]; if (r.type !== v) { r.type = v; const c = P.classify(r.desc, cats(), v); r.category = c ? c.name : P.FALLBACK[v]; } renderPreview(); break; }
      case 'row-del': state.add.rows.splice(i, 1); renderPreview(); break;
      case 'add-save': saveAdd(el); break;
      case 'tx-edit': editTx(el.dataset.id); break;
      case 'tx-del': delTx(el.dataset.id); break;
      case 'tx-save': saveTxEdit(el.dataset.id); break;
      case 'modal-close': closeModal(); break;
      case 'shop-save': saveShop(el); break;
      case 'shop-ser': state.shopUI.series[v] = !state.shopUI.series[v]; if (!Object.values(state.shopUI.series).some(Boolean)) state.shopUI.series[v] = true; render(true); break;
      case 'shop-edit': loadShopDate(el.dataset.date); fillShopForm(); $('#shopForm').scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
      case 'shop-del': {
        const en = state.shopDays.find((x) => x.id === el.dataset.id);
        if (en && confirm(`ลบยอดวันที่ ${fmtD(en.date)} ?`)) DB.deleteShop(en.id).then(() => { state.shopDays = state.shopDays.filter((x) => x.id !== en.id); toast('ลบแล้ว'); render(true); }).catch((er) => toast('ลบไม่สำเร็จ: ' + (er.message || er), true));
        break;
      }
      case 'alloc-save': {
        const names = [0, 1, 2].map((n) => $('#aName' + n).value.trim() || DEF_ALLOC.names[n]);
        const p0 = num($('#aPct0').value), p1 = num($('#aPct1').value);
        if (p0 < 0 || p1 < 0 || p0 + p1 > 100) return toast('เปอร์เซ็นต์ส่วนที่ 1 + 2 ต้องไม่เกิน 100', true);
        state.settings.alloc = { names, pcts: [p0, p1] };
        state.settings.capital = Math.max(0, num($('#aCap').value));
        saveSetting('alloc'); saveSetting('capital'); toast('บันทึกการตั้งค่าแล้ว ✓'); render(true);
        break;
      }
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
        const name = $('#ncName').value.trim();
        if (!name) return toast('ใส่ชื่อหมวดก่อน', true);
        if (cats().some((c) => c.name === name)) return toast('มีหมวดชื่อนี้แล้ว', true);
        const type = $('#ncType').value;
        const nc = { name, emoji: $('#ncEmoji').value.trim() || '📌', color: $('#ncColor').value, type, keywords: $('#ncKw').value.split(/[,\n]/).map((s) => s.trim()).filter(Boolean) };
        const list = cats().map((c) => Object.assign({}, c));
        const fi = list.findIndex((c) => c.name === P.FALLBACK[type]);
        list.splice(fi >= 0 ? fi : list.length, 0, nc);
        state.settings.categories = list; saveSetting('categories'); toast('เพิ่มหมวดแล้ว ✓'); render(true);
        break;
      }
      case 'cat-del': {
        const c = cats()[i];
        if (c && confirm(`ลบหมวด "${c.name}" ? (รายการเดิมที่อยู่ในหมวดนี้จะยังอยู่)`)) {
          state.settings.categories = cats().filter((_, n) => n !== i).map((x) => Object.assign({}, x)); saveSetting('categories'); render(true);
        }
        break;
      }
      case 'cat-reset':
        if (confirm('คืนหมวดหมู่และคำสำคัญเป็นค่าเริ่มต้น ?')) { state.settings.categories = JSON.parse(JSON.stringify(P.DEFAULT_CATEGORIES)); saveSetting('categories'); render(true); }
        break;
      case 'export': exportCsv(v); break;
      default: break;
    }
  });

  document.addEventListener('input', (e) => {
    const el = e.target, kind = el.dataset.input;
    if (!kind) return;
    if (kind === 'add-text') { state.add.text = el.value; reparse(); renderPreview(); }
    else if (kind === 'add-date') { state.add.date = el.value || today(); reparse(); renderPreview(); }
    else if (kind === 'add-person') { state.add.person = el.value; document.querySelectorAll('[data-act="add-chip"]').forEach((c) => c.classList.toggle('on', c.dataset.v === el.value.trim())); reparse(); renderPreview(); }
    else if (kind === 'row') {
      const r = state.add.rows[Number(el.dataset.i)], f = el.dataset.f;
      if (!r) return;
      if (f === 'amount') { r.amount = num(el.value); const s = $('#sumline'); if (s) s.innerHTML = sumLine(); }
      else r[f] = el.value;
    } else if (kind === 'list-q') { state.list.q = el.value; $('#listBody').innerHTML = listBodyHtml(); }
    else if (kind === 'shop-form') {
      const f = el.dataset.f;
      if (f === 'date') { if (!el.value) return; loadShopDate(el.value); fillShopForm(); }
      else { state.shopUI.form[f] = el.value; updateShopForm(); }
    } else if (kind === 'alloc-form') {
      const rest = round2(100 - num($('#aPct0').value) - num($('#aPct1').value));
      $('#aPct2').value = rest;
    }
  });

  document.addEventListener('change', (e) => {
    const el = e.target, kind = el.dataset.change;
    if (!kind) return;
    if (kind === 'dash-person') { state.dash.person = el.value; render(true); }
    else if (kind === 'list-person') { state.list.person = el.value; render(true); }
    else if (kind === 'list-cat') { state.list.cat = el.value; render(true); }
    else if (kind === 'row') { const r = state.add.rows[Number(el.dataset.i)]; if (r) r[el.dataset.f] = el.value; }
    else if (kind === 'cat-kw') {
      const list = cats().map((c) => Object.assign({}, c)), c = list[Number(el.dataset.i)];
      if (c) { c.keywords = el.value.split(/[,\n،]/).map((s) => s.trim()).filter(Boolean); state.settings.categories = list; saveSetting('categories'); toast('บันทึกคำสำคัญแล้ว ✓'); }
    }
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  window.addEventListener('hashchange', route);
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible' || !DB.live || Date.now() - state.lastLoad < 30000 || state.tab === 'add') return;
    try { const d = await DB.loadAll(); state.tx = d.tx; state.shopDays = d.shop; state.lastLoad = Date.now(); if (!$('#modal') && state.tab !== 'settings') render(true); } catch (e) { /* ignore */ }
  });

  /* ---------- เริ่มต้น ---------- */
  function applySettings(s) {
    const st = state.settings;
    if (s.theme) st.theme = s.theme;
    if (Array.isArray(s.categories) && s.categories.length) st.categories = s.categories;
    if (Array.isArray(s.people)) st.people = s.people;
    if (s.alloc) st.alloc = s.alloc;
    if (s.capital != null) st.capital = Number(s.capital) || 0;
    T.apply(st.theme);
    state.themeGroup = T.get(st.theme).group;
  }
  async function boot() {
    try {
      const d = await DB.loadAll();
      state.tx = d.tx; state.shopDays = d.shop; applySettings(d.settings || {});
    } catch (e) {
      console.error(e);
      $('#view').innerHTML = `<div class="card"><h2>เชื่อมต่อฐานข้อมูลไม่สำเร็จ</h2><p class="lead">${esc(e.message || e)}</p><p class="hint">ตรวจสอบว่ารันไฟล์ <code>supabase/schema.sql</code> แล้ว และใส่ URL / anon key ใน <code>js/config.js</code> ถูกต้อง</p></div>`;
      renderTabs();
      return;
    }
    route();
  }
  window.__app = { state, render, boot, parse: reparse };
  boot();
})();
