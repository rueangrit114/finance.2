/* ธีม 150 ชุด (10 หมวด × 15 ชุด) — สร้างจากสูตรสี จึงสีเข้ากันและตัวอักษรอ่านง่ายทุกธีม */
(function () {
  'use strict';

  function hsl2rgb(h, s, l) {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
  }
  const hex = (h, s, l) => '#' + hsl2rgb(h, s, l).map((x) => x.toString(16).padStart(2, '0')).join('');
  function lum(rgb) {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
  }
  const inkFor = (h, s, l) => (lum(hsl2rgb(h, s, l)) > 0.2 ? '#17171c' : '#ffffff');

  // p = พารามิเตอร์หมวด: s=ความสด aL=ความสว่างของสีหลัก bgS=ความอมสีของพื้นหลัง mode=light|dark
  // item = [ชื่อ, hue, (mode), (s), (aL)]
  const GROUPS = [
    { id: 'pastel', name: 'พาสเทล', p: { s: 58, aL: 72, bgS: 70, mode: 'light' }, items: [
      ['ซากุระ', 345], ['พีชครีม', 20], ['เลมอนนม', 48], ['มินต์ครีม', 152], ['ฟ้าน้ำนม', 200],
      ['ลาเวนเดอร์', 262], ['ลิลลี่', 300], ['แคนตาลูป', 30], ['มัทฉะอ่อน', 95], ['บลูเบอร์รี่นม', 226],
      ['มาร์ชเมลโล่', 330], ['ทอฟฟี่', 38], ['ไอริส', 250], ['แอปริคอต', 25], ['ฟ้าใส', 188]] },
    { id: 'minimal', name: 'มินิมอลสว่าง', p: { s: 26, aL: 40, bgS: 14, mode: 'light' }, items: [
      ['ขาวนวล', 40], ['ครีมเรียบ', 45], ['ปูนเปลือย', 30], ['เมฆหมอก', 210], ['กระดาษคราฟต์', 35],
      ['น้ำนมข้าว', 55], ['ไข่มุก', 280], ['หินอ่อน', 200], ['ผ้าลินิน', 38], ['เส้นขอบฟ้า', 205],
      ['ควันเทียน', 20], ['ทรายขาว', 48], ['หมอกเช้า', 170], ['น้ำค้าง', 182], ['เงาจันทร์', 235]] },
    { id: 'dark', name: 'มืดหรู', p: { s: 55, aL: 62, bgS: 28, mode: 'dark' }, items: [
      ['ราตรีน้ำเงิน', 225], ['ถ่านหินม่วง', 260], ['มรกตลึก', 160], ['ไวน์แดง', 345], ['ทองคำดำ', 45],
      ['ทะเลลึก', 200], ['ป่ากลางคืน', 140], ['ทับทิมมืด', 355], ['อเมทิสต์', 275], ['กาแฟดำ', 25],
      ['หมึกจีน', 215], ['ออโรร่า', 172], ['ซินเดอร์', 15], ['ไพลินเข้ม', 236], ['เมฆพายุ', 210]] },
    { id: 'nature', name: 'ธรรมชาติ', p: { s: 38, aL: 42, bgS: 32, mode: 'light' }, items: [
      ['ใบตอง', 120], ['มอสเขียว', 100], ['ป่าสน', 150], ['ทุ่งนา', 75], ['ไม้ไผ่', 90],
      ['ดินเหนียว', 22], ['เปลือกไม้', 30], ['สวนสมุนไพร', 135], ['ใบชา', 105], ['ยูคาลิปตัส', 160],
      ['หญ้าฝรั่น', 46], ['ดอกบัว', 320], ['กล้วยไม้', 295], ['ภูเขาหมอก', 165], ['ผืนทราย', 40]] },
    { id: 'sea', name: 'ทะเลและท้องฟ้า', p: { s: 62, aL: 46, bgS: 48, mode: 'light' }, items: [
      ['ฟ้าคราม', 215], ['อันดามัน', 185], ['น้ำแข็ง', 195], ['ปะการัง', 10], ['ท้องฟ้าเช้า', 205],
      ['ลากูน', 175], ['เทอร์ควอยซ์', 180], ['น้ำตก', 190], ['เกาะสวรรค์', 168], ['พายุฝน', 222],
      ['เกลือทะเล', 198], ['เรือใบ', 226], ['หาดขาว', 44], ['สายหมอก', 210], ['ทะเลสาบ', 196]] },
    { id: 'sweet', name: 'หวานละมุน', p: { s: 70, aL: 62, bgS: 82, mode: 'light' }, items: [
      ['สตรอว์เบอร์รี่', 350], ['กุหลาบหวาน', 340], ['ลูกพีช', 15], ['ราสป์เบอร์รี่', 330], ['โรสควอตซ์', 352],
      ['คัพเค้ก', 320], ['ไอศกรีมสตรอ', 356], ['เชอร์รี่บลอสซัม', 346], ['กลีบบัวชมพู', 336], ['บับเบิ้ลกัม', 326],
      ['ลิปสติก', 348], ['ซากุระหวาน', 342], ['มาการอง', 310], ['แยมกุหลาบ', 344], ['โยเกิร์ตเบอร์รี่', 334]] },
    { id: 'warm', name: 'อบอุ่น', p: { s: 62, aL: 48, bgS: 55, mode: 'light' }, items: [
      ['ส้มพระอาทิตย์', 25], ['ดินเผา', 15], ['น้ำผึ้ง', 40], ['ช็อกโกแลต', 20], ['คาราเมล', 32],
      ['ขิงอบ', 28], ['อบเชย', 18], ['พริกหยวก', 8], ['ส้มโอ', 36], ['ทองแดง', 22],
      ['โกโก้นม', 24], ['ส้มจี๊ด', 30], ['มะขามหวาน', 14], ['ถั่วคั่ว', 34], ['อิฐเก่า', 12]] },
    { id: 'mystic', name: 'ม่วงมนตรา', p: { s: 50, aL: 52, bgS: 55, mode: 'light' }, items: [
      ['องุ่น', 280], ['ลาเวนเดอร์ฝัน', 260], ['ม่วงมังคุด', 300], ['ไวโอเล็ต', 270], ['ดอกอัญชัน', 245],
      ['ม่วงกลีบเมฆ', 255], ['ลิลลี่ม่วง', 290], ['ไอริสสวย', 265], ['ราตรีสีม่วง', 275], ['ควอตซ์ม่วง', 285],
      ['บลูเบลล์', 240], ['ม่วงทะเลทราย', 310], ['ลาเวนเดอร์ฝรั่งเศส', 258], ['ม่วงคราม', 250], ['แอเมทิสต์', 292]] },
    { id: 'vivid', name: 'สดใส', p: { s: 85, aL: 50, bgS: 72, mode: 'light' }, items: [
      ['เลมอนเนด', 52], ['มะนาวโซดา', 80], ['แตงโมปั่น', 355], ['มะม่วงสุก', 38], ['เสาวรส', 46],
      ['ส้มสด', 25], ['เบอร์รี่สด', 330], ['มินต์สดชื่น', 160], ['ฟ้าสดใส', 200], ['ผลไม้รวม', 100],
      ['แอปเปิ้ลเขียว', 90], ['ลูกพลับ', 28], ['กีวี', 75], ['ทับทิมสด', 350], ['คอตตอนแคนดี้', 190]] },
    { id: 'mono', name: 'โมโนและลักชัวรี', p: { s: 10, aL: 40, bgS: 8, mode: 'light' }, items: [
      ['ขาวดำคลาสสิก', 0, 'light', 0, 14], ['หมึกดำ', 0, 'dark', 0, 88], ['เงินเงา', 215, 'light', 10, 40],
      ['ถ่านหินเงา', 220, 'dark', 8, 80], ['ทองสง่า', 45, 'dark', 62, 58], ['แชมเปญ', 42, 'light', 50, 50],
      ['ทองแดงหรู', 22, 'dark', 55, 58], ['โรสโกลด์', 10, 'light', 45, 62], ['แพลตตินัม', 225, 'light', 14, 42],
      ['ออบซิเดียน', 260, 'dark', 14, 78], ['หยกดำ', 160, 'dark', 40, 56], ['ไข่มุกดำ', 285, 'dark', 28, 70],
      ['ทองขาว', 52, 'light', 30, 46], ['ไททาเนียม', 205, 'dark', 18, 72], ['นิกเกิล', 200, 'light', 12, 38]] },
  ];

  function build(p, item) {
    const h = item[1];
    const mode = item[2] || p.mode;
    const s = item[3] != null ? item[3] : p.s;
    const aL = item[4] != null ? item[4] : p.aL;
    const bS = p.bgS;
    const v = {};
    if (mode === 'dark') {
      const q = Math.min(bS, 30);
      v.bg = hex(h, q, 8); v.surface = hex(h, q, 12); v.surface2 = hex(h, q, 16);
      v.border = hex(h, Math.min(q, 24), 22);
      v.text = hex(h, 16, 94); v.muted = hex(h, 10, 66);
      v.accent = hex(h, s, aL);
      v.accentText = hex(h, Math.min(s + 5, 100), Math.max(aL, 72));
      v.accentSoft = hex(h, Math.min(s, 60) * 0.7, 20);
      v.income = '#5ed1b3'; v.expense = '#ff7ea5';
    } else {
      v.bg = hex(h, bS, 96.5); v.surface = hex(h, Math.min(bS, 60), 99.2); v.surface2 = hex(h, bS, 93.5);
      v.border = hex(h, Math.min(bS, 70) * 0.9, 88.5);
      v.text = hex(h, 28, 13); v.muted = hex(h, 10, 42);
      v.accent = hex(h, s, aL);
      v.accentText = hex(h, s, Math.min(aL, 38));
      v.accentSoft = hex(h, Math.min(s, 90), 92.5);
      v.income = '#2a9d86'; v.expense = '#d6457f';
    }
    v.accentInk = inkFor(h, s, aL);
    return { mode, vars: v };
  }

  const ALL = [];
  GROUPS.forEach((g) => {
    g.items.forEach((it, i) => {
      const b = build(g.p, it);
      ALL.push({ id: g.id + '-' + i, group: g.id, name: it[0], mode: b.mode, vars: b.vars });
    });
  });

  const CSS_NAMES = { bg: '--bg', surface: '--surface', surface2: '--surface2', border: '--border', text: '--text', muted: '--muted',
    accent: '--accent', accentInk: '--accent-ink', accentText: '--accent-text', accentSoft: '--accent-soft', income: '--income', expense: '--expense' };

  const DEFAULT_ID = 'sea-0';

  const Themes = {
    all: ALL,
    groups: GROUPS.map((g) => ({ id: g.id, name: g.name, count: g.items.length })),
    defaultId: DEFAULT_ID,
    byGroup: (gid) => ALL.filter((t) => t.group === gid),
    get: (id) => ALL.find((t) => t.id === id) || ALL.find((t) => t.id === DEFAULT_ID),
    apply(id) {
      const t = Themes.get(id);
      const root = document.documentElement;
      Object.keys(CSS_NAMES).forEach((k) => root.style.setProperty(CSS_NAMES[k], t.vars[k]));
      root.setAttribute('data-mode', t.mode);
      root.style.colorScheme = t.mode;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', t.vars.bg);
      try { localStorage.setItem('baan:theme', t.id); } catch (e) { /* ignore */ }
      return t;
    },
  };
  window.Themes = Themes;

  let saved = null;
  try { saved = localStorage.getItem('baan:theme'); } catch (e) { /* ignore */ }
  Themes.apply(saved || DEFAULT_ID);
})();
