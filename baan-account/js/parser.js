/* ตัวแยกรายการจากข้อความ (ภาษาไทย) — ใช้คำสำคัญ ไม่ต้องใช้ AI/API
   ใช้ได้ทั้งในเบราว์เซอร์ (window.Parser) และ Node (สำหรับทดสอบ) */
(function (root) {
  'use strict';

  const FALLBACK = { expense: 'อื่นๆ', income: 'รายรับอื่นๆ' };

  const DEFAULT_CATEGORIES = [
    { name: 'อาหาร', emoji: '🍚', color: '#e9795e', type: 'expense', keywords: ['ข้าว', 'อาหาร', 'กับข้าว', 'ก๋วยเตี๋ยว', 'บะหมี่', 'ส้มตำ', 'หมู', 'ไก่', 'เนื้อ', 'ปลา', 'กุ้ง', 'ไข่', 'ผัก', 'ผลไม้', 'ขนม', 'ของหวาน', 'ไอศกรีม', 'ซุป', 'แกง', 'ผัดกะเพรา', 'ตลาด', 'มื้อเช้า', 'มื้อเที่ยง', 'มื้อเย็น', 'หมูปิ้ง', 'หมูย่าง', 'ไก่ย่าง', 'ข้าวมันไก่', 'ข้าวผัด', 'พิซซ่า', 'เบอร์เกอร์', 'ขนมปัง', 'เค้ก'] },
    { name: 'เครื่องดื่ม', emoji: '☕', color: '#c58b4e', type: 'expense', keywords: ['น้ำ', 'กาแฟ', 'ชา','ชานม', 'น้ำอัดลม', 'โค้ก', 'เป๊ปซี่', 'นม', 'น้ำผลไม้', 'สมูทตี้', 'เบียร์', 'เหล้า', 'ไวน์', 'คาเฟ่', 'เครื่องดื่ม', 'โอเลี้ยง', 'ชาไข่มุก', 'น้ำหวาน', 'น้ำเปล่า', 'น้ำดื่ม', 'โซดา'] },
    { name: 'เดินทาง', emoji: '🚗', color: '#4c8fd6', type: 'expense', keywords: ['น้ำมัน', 'ค่าน้ำมัน', 'เติมน้ำมัน','แท็กซี่', 'รถเมล์', 'bts', 'mrt', 'วิน', 'มอเตอร์ไซค์', 'ค่ารถ', 'ค่าเดินทาง', 'ทางด่วน', 'จอดรถ', 'grab', 'bolt', 'รถไฟ', 'เครื่องบิน', 'ซ่อมรถ', 'ล้างรถ', 'ประกันรถ', 'ค่าโดยสาร', 'รถตู้', 'ตั๋วรถ'] },
    { name: 'ของใช้', emoji: '🧺', color: '#8a7bd8', type: 'expense', keywords: ['ของใช้', 'สบู่', 'แชมพู', 'ยาสีฟัน', 'ผงซักฟอก', 'น้ำยา', 'ทิชชู่', 'กระดาษ', 'ถุง', 'แก๊ส', 'ถ่าน', 'หลอดไฟ', 'อุปกรณ์', 'เครื่องใช้', 'ซื้อของ', 'ของกินของใช้', 'ผ้า'] },
    { name: 'บิลและสาธารณูปโภค', emoji: '💡', color: '#e0b13e', type: 'expense', keywords: ['ค่าไฟ', 'ค่าน้ำ', 'ค่าเน็ต', 'อินเทอร์เน็ต', 'ค่าโทรศัพท์', 'เติมเงิน', 'ค่าแก๊ส', 'ไฟฟ้า', 'ประปา', 'wifi', 'ไวไฟ', 'ค่าบริการ', 'ค่าทีวี', 'ค่าเคเบิล', 'ค่าขยะ'] },
    { name: 'ที่อยู่อาศัย', emoji: '🏠', color: '#4aa58f', type: 'expense', keywords: ['ค่าเช่า', 'ค่าห้อง', 'ผ่อนบ้าน', 'ค่างวดบ้าน', 'ซ่อมบ้าน', 'เฟอร์นิเจอร์', 'ค่าส่วนกลาง', 'ต่อเติม', 'ค่าหอ'] },
    { name: 'สุขภาพ', emoji: '💊', color: '#d95a7b', type: 'expense', keywords: ['ยา', 'หมอ', 'โรงพยาบาล', 'รพ.', 'คลินิก', 'ฟัน', 'วิตามิน', 'ตรวจ', 'ค่ารักษา', 'ประกันสุขภาพ', 'หน้ากาก', 'ทำฟัน'] },
    { name: 'การศึกษา', emoji: '📚', color: '#5f6fd3', type: 'expense', keywords: ['ค่าเทอม', 'ค่าเรียน', 'หนังสือ', 'เรียนพิเศษ', 'อุปกรณ์การเรียน', 'ค่าเล่าเรียน', 'คอร์ส', 'สมุด', 'ปากกา', 'ชุดนักเรียน', 'กวดวิชา'] },
    { name: 'ช้อปปิ้ง', emoji: '🛍️', color: '#d46ab3', type: 'expense', keywords: ['เสื้อ', 'กางเกง', 'รองเท้า', 'กระเป๋า', 'เครื่องสำอาง', 'shopee', 'ช้อปปี้', 'lazada', 'ลาซาด้า', 'ช้อป', 'เครื่องประดับ', 'ตัดผม', 'เสริมสวย', 'สกินแคร์', 'ทำผม', 'ทำเล็บ'] },
    { name: 'บันเทิง', emoji: '🎬', color: '#3fb0c8', type: 'expense', keywords: ['หนัง', 'เกม', 'netflix', 'youtube', 'spotify', 'เที่ยว', 'ท่องเที่ยว', 'โรงแรม', 'ที่พัก', 'ปาร์ตี้', 'คอนเสิร์ต', 'สังสรรค์', 'ดูหนัง', 'คาราโอเกะ'] },
    { name: 'ครอบครัว', emoji: '👨‍👩‍👧', color: '#8bb04a', type: 'expense', keywords: ['ให้เงิน', 'ส่งเงิน', 'เงินให้', 'ค่าขนม', 'ทำบุญ', 'บริจาค', 'ของขวัญ', 'งานบุญ', 'งานแต่ง', 'ใส่ซอง', 'เลี้ยงลูก', 'ผ้าอ้อม', 'นมผง', 'งานศพ', 'ให้พ่อ', 'ให้แม่'] },
    { name: 'หนี้และผ่อนชำระ', emoji: '💳', color: '#8b8f9c', type: 'expense', keywords: ['ผ่อน', 'ค่างวด', 'บัตรเครดิต', 'ชำระหนี้', 'คืนเงินกู้', 'ค่าปรับ', 'ภาษี', 'ประกัน', 'ผ่อนรถ', 'ผ่อนมือถือ', 'ใช้หนี้', 'จ่ายหนี้'] },
    { name: FALLBACK.expense, emoji: '📦', color: '#a7a9ad', type: 'expense', keywords: [] },

    { name: 'ขายของ', emoji: '🛒', color: '#2fa58b', type: 'income', keywords: ['ขายของ', 'ขายได้', 'ยอดขาย', 'ค่าขาย', 'ขายสินค้า', 'ขายข้าว', 'ลูกค้าจ่าย'] },
    { name: 'เงินเดือน', emoji: '💼', color: '#3c8fd0', type: 'income', keywords: ['เงินเดือน', 'ค่าจ้าง', 'ค่าแรง', 'โอที', 'ค่าล่วงเวลา'] },
    { name: 'โบนัสและพิเศษ', emoji: '🎁', color: '#e3a63a', type: 'income', keywords: ['โบนัส', 'ทิป', 'ค่าคอม', 'คอมมิชชั่น', 'รางวัล', 'ถูกหวย', 'ถูกรางวัล'] },
    { name: 'รับจากคนอื่น', emoji: '🤝', color: '#6ab36b', type: 'income', keywords: ['ได้รับ', 'เงินโอนเข้า', 'โอนเข้า', 'คืนเงิน', 'ขอคืน', 'เงินช่วยเหลือ', 'ปันผล', 'ดอกเบี้ยรับ', 'พ่อให้', 'แม่ให้', 'รับเงิน'] },
    { name: FALLBACK.income, emoji: '💰', color: '#9aa7a0', type: 'income', keywords: ['รายรับ', 'รายได้', 'เงินเข้า', 'ได้เงิน'] },
  ];

  const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';
  const UNITS = 'ฟอง|ชิ้น|ถุง|กก|กิโล|กรัม|ลิตร|ขวด|แก้ว|อัน|ตัว|กล่อง|แพ็ค|แพ็ก|ลูก|จาน|ห่อ|ชุด|คน|ครั้ง|เม็ด|ใบ|เส้น|แผ่น|ซอง|กระป๋อง|ก้อน|มล|ml|kg|pcs|เดือน|คืน|นาที';
  const NUM_SRC = '(?<![\\d\\-./])(\\d{1,3}(?:,\\d{3})+|\\d+)(\\.\\d{1,2})?(?![\\d\\-/]|\\.\\d)';
  const UNIT_RE = new RegExp('^\\s*(?:' + UNITS + ')(?![ก-๛a-zA-Z])', 'i');
  const CUR_RE = /^\s*(?:บาท|baht|thb|฿|บ\.|บ(?![ก-๛a-zA-Z]))/i;
  const SEP = '[\\s,;，、/|+\\-–·•:.()]';
  const LEAD_RE = new RegExp('^' + SEP + '+');
  const TRAIL_RE = new RegExp(SEP + '+$');
  const VERB_RE = /^(?:และ|แล้วก็|แล้ว(?=\s|$)|ก็(?=\s)|ใช้เงิน|ใช้ไป|ใช้จ่าย|จ่ายเงิน|จ่ายไป|ใช้|จ่าย|ซื้อ|ได้รับเงิน|ได้รับ|ได้เงิน|รับเงิน|ไป(?=\s|$)|ไว้(?=\s|$))\s*/;
  const PARTICLE_RE = /\s*(?:ครับ|ค่ะ|คะ|นะคะ|นะครับ|นะ|จ้า|จ้ะ)$/;
  const PERSON_NEXT_RE = /^(?:\s|[:：,]|ใช้|จ่าย|ซื้อ|ได้|รับ|ขาย|โอน|เติม|ให้|ค่า|กิน|ไป)/;
  const BAD_NAME_RE = /^(?:ซื้อ|จ่าย|ค่า|ใช้|ขาย|ได้|รับ|เติม|โอน|ให้|ของ|เงิน)/;

  function norm(s) {
    return String(s == null ? '' : s)
      .replace(/[๐-๙]/g, (d) => THAI_DIGITS.indexOf(d))
      .replace(/[​﻿\r]/g, '')
      .replace(/，/g, ',')
      .replace(/฿/g, ' ')
      .replace(/\b\d{1,2}:\d{2}(?:\s*น\.?)?/g, ' ');
  }

  function iso(d) {
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function shiftDay(s, n) {
    const [y, m, d] = s.split('-').map(Number);
    const dt = new Date(y, m - 1, d + n, 12);
    return iso(dt);
  }

  // หาหมวดที่คำสำคัญยาวที่สุดที่เจอในข้อความ
  function classify(text, cats, onlyType) {
    const t = String(text || '').toLowerCase();
    let best = null, bestLen = 0;
    for (const c of cats) {
      if (onlyType && c.type !== onlyType) continue;
      for (const k of c.keywords || []) {
        const kk = String(k).trim().toLowerCase();
        if (kk && kk.length > bestLen && t.includes(kk)) { best = c; bestLen = kk.length; }
      }
    }
    return best;
  }

  function cleanDesc(s) {
    s = String(s || '').replace(/บาท|baht|฿/gi, ' ');
    let prev;
    do {
      prev = s;
      s = s.trim().replace(LEAD_RE, '').replace(TRAIL_RE, '').replace(VERB_RE, '').replace(PARTICLE_RE, '');
    } while (s !== prev);
    return s.replace(/\s+/g, ' ').trim();
  }

  function parseLine(rawLine, ctx) {
    let line = norm(rawLine).trim();
    if (!line) return [];
    line = line.replace(/^\s*(?:[•*·●▪]|\d{1,2}[.)])\s+/, '');

    let force = null;
    const sg = line.match(/^([+\-–])\s*/);
    if (sg) { force = sg[1] === '+' ? 'income' : 'expense'; line = line.slice(sg[0].length); }

    // วันที่
    let date = ctx.date || ctx.today;
    const dm = line.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+/);
    if (dm) {
      const base = ctx.today.split('-').map(Number);
      let y = dm[3] ? Number(dm[3]) : base[0];
      if (y >= 2400) y -= 543; else if (y < 100) y = y >= 50 ? 2500 + y - 543 : 2000 + y;
      date = y + '-' + String(dm[2]).padStart(2, '0') + '-' + String(dm[1]).padStart(2, '0');
      line = line.slice(dm[0].length);
    }
    const dw = line.match(/เมื่อวานซืน|เมื่อวานนี้|เมื่อวาน|วันนี้/);
    if (dw) {
      date = dw[0] === 'วันนี้' ? ctx.today : shiftDay(ctx.today, dw[0] === 'เมื่อวานซืน' ? -2 : -1);
      line = line.replace(dw[0], ' ');
    }
    line = line.replace(/\s+/g, ' ').trim();

    // ชื่อคน
    let person = ctx.person || '';
    const people = (ctx.people || []).filter(Boolean).slice().sort((a, b) => b.length - a.length);
    const cats = ctx.categories || DEFAULT_CATEGORIES;
    let m;
    let done = false;
    if ((m = line.match(/^@?([^\s:：@\d]{1,20})\s*[:：]\s*(.*)$/)) && /\d/.test(m[2]) &&
        (people.some((p) => p.toLowerCase() === m[1].toLowerCase()) || !classify(m[1], cats))) {
      person = m[1]; line = m[2]; done = true;
    }
    if (!done && (m = line.match(/(?:^|\s)@([^\s@\d:：]{1,20})/))) {
      person = m[1]; line = line.replace(m[0], ' ').trim(); done = true;
    }
    if (!done) {
      const low = line.toLowerCase();
      for (const p of people) {
        if (low.startsWith(p.toLowerCase())) {
          const rest = line.slice(p.length);
          if (!rest || PERSON_NEXT_RE.test(rest)) { person = p; line = rest.replace(/^[\s:：,]+/, ''); done = true; break; }
        }
      }
    }
    if (!done && (m = line.match(/^([^\s\d]{1,10}?)(?=ใช้เงิน|ใช้ไป|จ่ายเงิน|จ่ายไป)/)) &&
        !BAD_NAME_RE.test(m[1]) && !classify(m[1], cats)) {
      person = m[1]; line = line.slice(m[1].length);
    }

    // แยกรายการด้วยตัวเลข
    const re = new RegExp(NUM_SRC, 'g');
    const found = [];
    let segStart = 0, mm;
    while ((mm = re.exec(line))) {
      const numEnd = mm.index + mm[0].length;
      const after = line.slice(numEnd);
      if (UNIT_RE.test(after)) continue; // เป็นจำนวนชิ้น เช่น ไข่ 2 ฟอง
      const cm = after.match(CUR_RE);
      const end = numEnd + (cm ? cm[0].length : 0);
      found.push({ before: line.slice(segStart, mm.index), amount: parseFloat(mm[0].replace(/,/g, '')), end });
      segStart = end;
      re.lastIndex = end;
    }
    if (!found.length) return [];
    const tail = line.slice(segStart);

    const amountFirst = cleanDesc(found[0].before) === '';
    const out = [];
    found.forEach((f, i) => {
      let raw;
      if (amountFirst) raw = i + 1 < found.length ? found[i + 1].before : tail;
      else raw = f.before + (i === found.length - 1 ? ' ' + (cleanDesc(tail) ? tail : '') : '');
      const lead = i === 0 ? found[0].before : '';
      const text = raw + ' ' + lead;
      let cat = classify(text, cats, force || undefined);
      const type = force || (cat ? cat.type : 'expense');
      if (!cat) cat = classify('', cats) || null;
      let category = cat ? cat.name : FALLBACK[type];
      let desc = cleanDesc(raw);
      if (!desc) desc = type === 'income' ? (cat && cat.name !== FALLBACK.income ? cat.name : 'รายรับ') : 'ใช้จ่าย';
      out.push({ desc, amount: f.amount, type, category, person, date });
    });
    return out;
  }

  function parse(text, ctx) {
    ctx = Object.assign({ today: iso(new Date()), people: [], categories: DEFAULT_CATEGORIES }, ctx || {});
    if (!ctx.date) ctx.date = ctx.today;
    const items = [];
    String(text || '').split(/\n+/).forEach((line) => {
      parseLine(line, ctx).forEach((it) => items.push(it));
    });
    return items;
  }

  const api = { parse, classify, DEFAULT_CATEGORIES, FALLBACK };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Parser = api;
})(typeof window !== 'undefined' ? window : globalThis);
