/* กราฟ SVG เล็กๆ เขียนเอง (ไม่ต้องพึ่งไลบรารี) — สีอ้างอิงตัวแปร CSS ของธีม */
(function () {
  'use strict';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function compact(n) {
    const a = Math.abs(n);
    if (a >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (a >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(Math.round(n));
  }
  function niceMax(v) {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const m = v / p;
    const n = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
    return n * p;
  }

  // กราฟแท่งแบบกลุ่ม series: [{name,color,values}]
  function bars(o) {
    const labels = o.labels, series = o.series;
    const H = o.height || 220, padL = 40, padR = 8, padT = 10, padB = 28;
    const n = Math.max(1, labels.length);
    const gw = Math.max(o.minGroupW || 30, ((o.width || 320) - padL - padR) / n);
    const W = padL + padR + gw * n;
    const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
    const ih = H - padT - padB;
    const y = (v) => padT + ih - (v / max) * ih;
    let g = '';
    for (let i = 0; i <= 4; i++) {
      const v = (max / 4) * i, yy = y(v);
      g += `<line x1="${padL}" x2="${W - padR}" y1="${yy}" y2="${yy}" class="c-grid"/>` +
        `<text x="${padL - 6}" y="${yy + 3.5}" text-anchor="end" class="c-ax">${compact(v)}</text>`;
    }
    const k = series.length;
    const bw = Math.min(18, (gw * 0.72) / k);
    const bundle = bw * k + (k - 1) * 2;
    let body = '';
    labels.forEach((lb, i) => {
      const x0 = padL + gw * i;
      if (i === o.sel) body += `<rect x="${x0 + 1}" y="${padT}" width="${gw - 2}" height="${ih}" rx="8" class="c-sel"/>`;
      let bx = x0 + (gw - bundle) / 2;
      series.forEach((s) => {
        const v = s.values[i] || 0;
        const h = Math.max(v > 0 ? 2 : 0, (v / max) * ih);
        if (h > 0) body += `<rect x="${bx.toFixed(1)}" y="${(padT + ih - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(5, bw / 2).toFixed(1)}" style="fill:${s.color}"/>`;
        bx += bw + 2;
      });
      body += `<text x="${x0 + gw / 2}" y="${H - 9}" text-anchor="middle" class="c-ax">${esc(lb)}</text>`;
      body += `<rect x="${x0}" y="0" width="${gw}" height="${H}" fill="transparent" data-idx="${i}" class="c-hit"/>`;
    });
    return `<svg class="chart" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">${g}${body}</svg>`;
  }

  // กราฟเส้น (มีพื้นที่ใต้เส้น)
  function line(o) {
    const labels = o.labels, series = o.series;
    const H = o.height || 200, padL = 44, padR = 12, padT = 12, padB = 28;
    const n = Math.max(1, labels.length);
    const gw = Math.max(o.minGroupW || 30, ((o.width || 320) - padL - padR) / n);
    const W = padL + padR + gw * n;
    const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
    const ih = H - padT - padB;
    const y = (v) => padT + ih - (v / max) * ih;
    const x = (i) => padL + gw * i + gw / 2;
    let g = '';
    for (let i = 0; i <= 4; i++) {
      const v = (max / 4) * i, yy = y(v);
      g += `<line x1="${padL}" x2="${W - padR}" y1="${yy}" y2="${yy}" class="c-grid"/>` +
        `<text x="${padL - 6}" y="${yy + 3.5}" text-anchor="end" class="c-ax">${compact(v)}</text>`;
    }
    let body = '';
    labels.forEach((lb, i) => {
      if (i === o.sel) body += `<rect x="${padL + gw * i + 1}" y="${padT}" width="${gw - 2}" height="${ih}" rx="8" class="c-sel"/>`;
      body += `<text x="${x(i)}" y="${H - 9}" text-anchor="middle" class="c-ax">${esc(lb)}</text>`;
    });
    series.forEach((s, si) => {
      const pts = s.values.map((v, i) => [x(i), y(v || 0)]);
      if (!pts.length) return;
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      if (si === 0 && o.area !== false) {
        body += `<path d="${d} L${pts[pts.length - 1][0].toFixed(1)} ${padT + ih} L${pts[0][0].toFixed(1)} ${padT + ih} Z" style="fill:${s.color};opacity:.12"/>`;
      }
      body += `<path d="${d}" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="stroke:${s.color}"/>`;
      pts.forEach((p, i) => {
        if (labels.length <= 14 || i === o.sel || i === pts.length - 1) body += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i === o.sel ? 4.5 : 3}" style="fill:${s.color}" class="c-dot"/>`;
      });
    });
    labels.forEach((lb, i) => { body += `<rect x="${padL + gw * i}" y="0" width="${gw}" height="${H}" fill="transparent" data-idx="${i}" class="c-hit"/>`; });
    return `<svg class="chart" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">${g}${body}</svg>`;
  }

  // โดนัท data: [{label,value,color}]
  function donut(o) {
    const size = o.size || 176, th = o.thickness || 26;
    const r = (size - th) / 2, cx = size / 2, C = 2 * Math.PI * r;
    const total = o.data.reduce((a, d) => a + d.value, 0);
    let seg = '';
    if (total > 0) {
      let cum = 0;
      o.data.forEach((d) => {
        const len = (d.value / total) * C;
        const gap = o.data.length > 1 ? Math.min(3, len * 0.3) : 0;
        seg += `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke-width="${th}" stroke-dasharray="${Math.max(0, len - gap).toFixed(2)} ${(C - Math.max(0, len - gap)).toFixed(2)}" stroke-dashoffset="${(-cum).toFixed(2)}" transform="rotate(-90 ${cx} ${cx})" style="stroke:${d.color}"/>`;
        cum += len;
      });
    } else {
      seg = `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke-width="${th}" class="c-empty"/>`;
    }
    const mid = `<text x="${cx}" y="${cx - 3}" text-anchor="middle" class="c-ctop">${esc(o.top || '')}</text>` +
      `<text x="${cx}" y="${cx + 17}" text-anchor="middle" class="c-cbot">${esc(o.bottom || '')}</text>`;
    return `<svg class="donut" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img">${seg}${mid}</svg>`;
  }

  window.Charts = { bars, line, donut, compact };
})();
