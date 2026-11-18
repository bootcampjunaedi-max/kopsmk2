/**
 * ============================================================
 * SIMPEL-KOP — Frontend inti (js/core.js) • v1.4.8 GitHub Pages + GAS REST API
 * SPA murni + Instant UX:
 *  1. Semua halaman ada di DOM; navigasi = tampil/sembunyi section (0 ms, tanpa panggilan server)
 *  2. Optimistic UI: state lokal berubah seketika, sinkron ke server di latar (antrean + rollback)
 *  3. Data dicache di perangkat (stale-while-revalidate) → buka ulang aplikasi instan
 *  4. Satu panggilan bootstrap untuk seluruh data; pencarian/filter/laporan dihitung lokal
 *  Server dipanggil lewat fetch() (lihat js/api.js). Token sesi tidak pernah ditaruh di URL.
 *  Urutan muat: config.js → api.js → core.js → pages.js
 * ============================================================
 */
'use strict';

// ════════════════════════════════════════════════════════
// BAGIAN 1: STATE GLOBAL
// ════════════════════════════════════════════════════════
/** Versi frontend — harus sama dengan APP.VERSION di Kode.gs (dicek otomatis, Admin diberi peringatan bila berbeda). */
const FE_VERSION = '1.4.8';
const BOOT = {};   // data publik dari GET ?action=boot (diisi oleh Boot.load, dicache di perangkat)
const TABLES = ['anggota', 'simpanan', 'pinjaman', 'angsuran', 'pembayaran', 'barang', 'mutasi', 'biaya', 'pengguna', 'arsip', 'log'];
const KEYS = { anggota: 'ID_Anggota', simpanan: 'ID_Transaksi', pinjaman: 'ID_Pinjaman', angsuran: 'ID_Angsuran', pembayaran: 'No_Bukti',
  barang: 'ID_Barang', mutasi: 'ID', biaya: 'ID', pengguna: 'Username', arsip: 'ID' };
const S = {
  token: null, user: null, role: null, remember: false, settings: {}, version: '0', serverToday: null,
  db: emptyDb(), loaded: false, page: null, params: {}, history: [], hideAmounts: false
};
function emptyDb() { const d = {}; TABLES.forEach(t => { d[t] = []; }); return d; }
const ROLE_LABEL = { admin: 'Administrator', bendahara: 'Bendahara', pengawas: 'Pengawas', anggota: 'Anggota' };
const isStaff = () => ['admin', 'bendahara', 'pengawas'].includes(S.role);
const canWrite = () => ['admin', 'bendahara'].includes(S.role);
const isAdmin = () => S.role === 'admin';

// ════════════════════════════════════════════════════════
// BAGIAN 2: UTILITAS (format, tanggal, escape)
// ════════════════════════════════════════════════════════
const esc = s => String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/** Bangun atribut onclick aman: on('Nav.go', 'x', {id:1}) → onclick="Nav.go(&quot;x&quot;,{...})" */
const call = (fn, ...args) => esc(fn + '(' + args.map(a => JSON.stringify(a === undefined ? null : a)).join(',') + ')');
const on = (fn, ...args) => 'onclick="' + call(fn, ...args) + '"';
const num = v => { const n = Number(v); return isFinite(n) ? n : 0; };
const fmtNum = n => Math.round(num(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const fmtRp = n => (num(n) < 0 ? '-Rp ' : 'Rp ') + fmtNum(Math.abs(num(n)));
/** Rupiah dengan "Rp" berbobot lebih ringan (DESIGN.md) */
const rp = (n, hideable) => (hideable && S.hideAmounts) ? '<span class="rp">Rp</span>•••••••' : (num(n) < 0 ? '-' : '') + '<span class="rp">Rp</span>' + fmtNum(Math.abs(num(n)));
const fmtJt = n => { const v = num(n); if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(2).replace('.', ',') + ' M'; if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',').replace(',0', '') + ' Jt'; if (Math.abs(v) >= 1e3) return Math.round(v / 1e3) + ' rb'; return String(v); };
const parseRp = s => num(String(s || '').replace(/[^\d-]/g, ''));
const pct = (a, b) => (b ? Math.round(a / b * 1000) / 10 : 0);
const sum = (arr, f) => arr.reduce((s, x) => s + num(typeof f === 'function' ? f(x) : x[f]), 0);
const uid = () => 'tmp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const initials = n => String(n || '?').replace(/^(Dra?s?\.|Hj?\.|H\.|Ir\.)\s*/gi, '').split(/[\s,]+/).filter(w => w && !/\./.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
const avatarCls = n => 'c' + (1 + (String(n).split('').reduce((s, c) => s + c.charCodeAt(0), 0) % 5));
const avatar = (n, extra) => `<span class="avatar ${avatarCls(n)} ${extra || ''}" aria-hidden="true">${esc(initials(n))}</span>`;
const debounce = (fn, ms) => { let t; return function () { clearTimeout(t); const a = arguments; t = setTimeout(() => fn.apply(this, a), ms || 250); }; };
const cap = s => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
const pad2 = n => (n < 10 ? '0' : '') + n;

const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const todayIso = () => { const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
const isoToUtc = iso => { const p = String(iso).slice(0, 10).split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); };
const utcToIso = ms => new Date(ms).toISOString().slice(0, 10);
const addDays = (iso, n) => utcToIso(isoToUtc(iso) + n * 864e5);
const daysBetween = (a, b) => Math.round((isoToUtc(b) - isoToUtc(a)) / 864e5);
const addMonths = (iso, n, day) => {
  const p = iso.split('-').map(Number); let y = p[0], m = p[1] - 1 + n;
  y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return utcToIso(Date.UTC(y, m, Math.min(day || p[2], last)));
};
const monthKey = iso => String(iso || '').slice(0, 7);
const fmtDate = iso => { if (!iso) return '—'; const s = String(iso); const p = s.slice(0, 10).split('-'); if (p.length < 3) return esc(s); return +p[2] + ' ' + BLN[+p[1] - 1] + ' ' + p[0]; };
const fmtDateTime = s => { if (!s) return '—'; const t = String(s).slice(11, 16); return fmtDate(s) + (t ? ', ' + t : ''); };
const fmtMonth = k => { const p = String(k).split('-'); return BLN[+p[1] - 1] + ' ' + p[0].slice(2); };
const fmtMonthLong = k => { const p = String(k).split('-'); return BULAN[+p[1] - 1] + ' ' + p[0]; };
const longDate = iso => { const d = new Date(isoToUtc(iso)); return HARI[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ' + BULAN[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
const T = () => todayIso();

// ════════════════════════════════════════════════════════
// BAGIAN 3: PENYIMPANAN LOKAL (cache data per pengguna)
// ════════════════════════════════════════════════════════
const Store = {
  area() { return S.remember ? window.localStorage : window.sessionStorage; },
  get(k, def, area) { try { const v = (area || Store.area()).getItem(k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } },
  set(k, v, area) { try { (area || Store.area()).setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) { /* abaikan */ } },
  lget(k, def) { return Store.get(k, def, window.localStorage); },
  lset(k, v) { return Store.set(k, v, window.localStorage); },
  cacheKey() { return 'sk_data_' + (S.user ? S.user.username : 'x'); },
  saveData: debounce(() => {
    if (!S.user) return;
    Store.set(Store.cacheKey(), { db: S.db, settings: S.settings, version: S.version, at: Date.now() });
  }, 400),
  loadData() { return Store.get(Store.cacheKey(), null); }
};

// ════════════════════════════════════════════════════════
// BAGIAN 4: PEMANGGILAN SERVER
// ════════════════════════════════════════════════════════
/** Panggil API ber-RBAC lewat fetch (js/api.js). Sesi kedaluwarsa → kembali ke halaman masuk. */
function callApi(action, payload) {
  return Api.call(S.token, action, payload || {}).then(res => {
    if (!res) throw new Error('Server tidak memberi respons.');
    if (res.code === 'AUTH') { Auth.expired(res.message); const e = new Error(res.message); e.auth = true; throw e; }
    return res;
  });
}
const XLSX_URL = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
const loadedScripts = {};
function loadScript(src) {
  if (loadedScripts[src]) return loadedScripts[src];
  loadedScripts[src] = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => { delete loadedScripts[src]; rej(new Error('Gagal memuat pustaka: ' + src)); };
    document.head.appendChild(s);
  });
  return loadedScripts[src];
}

// ════════════════════════════════════════════════════════
// BAGIAN 5: SINKRONISASI OPTIMISTIS (antrean tulis + rollback)
// ════════════════════════════════════════════════════════
const Sync = {
  queue: [], busy: false, failed: 0, timer: null, lastPull: 0,
  persist() { if (S.user) Store.set('sk_outbox_' + S.user.username, Sync.queue.map(q => ({ action: q.action, payload: q.payload, reqId: q.reqId, label: q.label }))); },
  restore() { if (!S.user) return; Sync.queue = Store.get('sk_outbox_' + S.user.username, []) || []; },
  /** Tambah operasi ke antrean; dikirim berurutan dengan reqId (idempoten di server). */
  push(item) { item.reqId = item.reqId || uid().replace('tmp_', 'r'); Sync.queue.push(item); Sync.persist(); Sync.chip(); Sync.run(); },
  run() {
    if (Sync.busy || !Sync.queue.length || !S.token) { Sync.chip(); return; }
    Sync.busy = true; Sync.chip();
    const it = Sync.queue[0];
    const payload = Sync.remap(Object.assign({}, it.payload, { reqId: it.reqId }));
    callApi(it.action, payload).then(res => {
      Sync.queue.shift(); Sync.persist(); Sync.failed = 0;
      if (res.success) {
        if (res.version) S.version = res.version;
        applyPatch(res.data || {});
        if (it.ok) { try { it.ok(res); } catch (e) { console.error(e); } }
      } else {
        if (it.fail) it.fail(res.message || 'Gagal menyimpan.'); else toast(res.message || 'Gagal menyimpan.', 'danger', 'Tidak tersimpan');
        Sync.needPull = true;
      }
      Sync.busy = false; Sync.next();
    }).catch(err => {
      Sync.busy = false;
      if (err && err.auth) return;
      it.tries = (it.tries || 0) + 1; Sync.failed++;
      if (it.tries >= 4) {
        Sync.queue.shift(); Sync.persist();
        const m = 'Koneksi ke server gagal: ' + (err && err.message ? err.message : err);
        if (it.fail) it.fail(m); else toast(m, 'danger');
        Sync.needPull = true; Sync.next();
      } else { Sync.chip(); setTimeout(Sync.run, 1200 * it.tries); }
    });
  },
  next() { if (Sync.queue.length) Sync.run(); else { Sync.chip(); if (Sync.needPull) { Sync.needPull = false; Sync.pull(true); } } },
  /** Ganti ID sementara (tmp_) dengan ID asli dari server di payload yang masih antre. */
  remap(obj) {
    const m = Sync.idMap; if (!Object.keys(m).length) return obj;
    let s = JSON.stringify(obj);
    Object.keys(m).forEach(k => { s = s.split('"' + k + '"').join(JSON.stringify(m[k])); });
    return JSON.parse(s);
  },
  idMap: {},
  chip() {
    const el = document.getElementById('syncChip'); if (!el) return;
    const n = Sync.queue.length;
    el.className = 'sync-chip ' + (Sync.failed ? 'err' : n ? 'busy' : 'ok');
    el.innerHTML = Sync.failed ? '<i class="bi bi-wifi-off"></i><span>Offline · ' + n + ' antre</span>'
      : n ? '<i class="bi bi-arrow-repeat"></i><span>Menyimpan ' + n + '…</span>'
        : '<i class="bi bi-cloud-check"></i><span>Tersinkron</span>';
  },
  chipClick() { if (Sync.failed) { Sync.failed = 0; Sync.run(); } else Sync.pull(true); },
  /** Tarik data terbaru bila versi server berubah (polling ringan). */
  pull(force) {
    if (!S.token || Sync.queue.length || Sync.pulling) return Promise.resolve();
    if (!force && Date.now() - Sync.lastPull < 20000) return Promise.resolve();
    Sync.pulling = true; Sync.lastPull = Date.now();
    return callApi('sync', { version: S.version }).then(res => {
      Sync.pulling = false;
      if (res.success && res.data.changed && !Sync.queue.length) { loadPayload(res.data); Router.refresh(); }
      else if (res.success) S.version = res.data.version || S.version;
    }).catch(() => { Sync.pulling = false; });
  },
  start() {
    clearInterval(Sync.timer);
    Sync.timer = setInterval(() => { if (document.visibilityState === 'visible') Sync.pull(false); }, 60000);
  }
};
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.token) Sync.pull(false); });

/** Gabungkan patch respons server ke state lokal. */
function applyPatch(p) {
  const tm = p.tempMap || {};
  Object.keys(tm).forEach(tmp => {
    Sync.idMap[tmp] = tm[tmp];
    TABLES.forEach(t => { const k = KEYS[t]; if (k) S.db[t] = S.db[t].filter(r => r[k] !== tmp); });
  });
  Object.keys(p.upsert || {}).forEach(t => {
    if (!S.db[t]) S.db[t] = [];
    const k = KEYS[t];
    (p.upsert[t] || []).forEach(rec => {
      const i = S.db[t].findIndex(r => r[k] === rec[k]);
      if (i >= 0) S.db[t][i] = rec; else S.db[t].push(rec);
    });
  });
  Object.keys(p.remove || {}).forEach(t => { const k = KEYS[t]; const rm = new Set(p.remove[t]); S.db[t] = S.db[t].filter(r => !rm.has(r[k])); });
  if (p.extra && p.extra.settings) S.settings = p.extra.settings;
  derive(); Store.saveData(); Router.refresh(); Notif.badge();
}

/** Muat payload bootstrap/sync ke state. */
function loadPayload(d) {
  S.db = emptyDb();
  TABLES.forEach(t => { S.db[t] = (d.db && d.db[t]) || []; });
  S.settings = d.settings || S.settings; S.version = d.version || S.version; S.serverToday = d.today || null;
  if (d.me) { S.user = Object.assign({}, S.user, d.me); }
  S.loaded = true;
  derive(); Store.saveData(); Notif.badge(); Nav.renderBadges();
  try { Boot.cekLogo(); Boot.cekVersi(); } catch (e) { /* abaikan */ }
}

/** Simpan salinan tabel untuk rollback bila server menolak. */
const snapshot = tables => { const o = {}; tables.forEach(t => { o[t] = JSON.parse(JSON.stringify(S.db[t])); }); return o; };
const restore = snap => { Object.keys(snap).forEach(t => { S.db[t] = snap[t]; }); };

/**
 * OPTIMISTIC COMMIT — ubah state lokal seketika, tampilkan, lalu sinkron di latar.
 * @param {object} o {action, payload, tables, apply(), ok(res), fail(msg), quiet}
 */
function commit(o) {
  const snap = snapshot(o.tables || []);
  try { if (o.apply) o.apply(); } catch (e) { restore(snap); toast(e.message, 'danger', 'Periksa kembali'); return false; }
  derive(); Store.saveData(); Router.refresh(); Notif.badge();
  Sync.push({
    action: o.action, payload: o.payload, label: o.label,
    ok: res => { if (!o.quiet && res.message) toast(res.message, 'success'); if (o.ok) o.ok(res); },
    fail: msg => { restore(snap); derive(); Store.saveData(); Router.refresh(); toast(msg, 'danger', 'Dibatalkan — tidak tersimpan'); if (o.fail) o.fail(msg); }
  });
  return true;
}

// ════════════════════════════════════════════════════════
// BAGIAN 6: TOAST, MODAL, KONFIRMASI
// ════════════════════════════════════════════════════════
function toast(msg, type, title) {
  type = type || 'info';
  const icons = { success: 'bi-check-circle-fill', danger: 'bi-exclamation-octagon-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
  const el = document.createElement('div');
  el.className = 'toast-k ' + type; el.setAttribute('role', type === 'danger' ? 'alert' : 'status');
  el.innerHTML = `<i class="bi ${icons[type] || icons.info}"></i><div class="t-body">${title ? '<b>' + esc(title) + '</b>' : ''}${esc(msg)}</div><button class="t-x" aria-label="Tutup">✕</button>`;
  const stack = document.getElementById('toastStack');
  stack.appendChild(el);
  const kill = () => { el.classList.add('out'); setTimeout(() => el.remove(), 200); };
  el.querySelector('.t-x').onclick = kill;
  setTimeout(kill, type === 'danger' ? 7000 : 4200);
  while (stack.children.length > 4) stack.firstChild.remove();
}

const Modal = {
  inst: null,
  open(o) {
    const dlg = document.getElementById('appModalDialog');
    dlg.className = 'modal-dialog modal-dialog-centered modal-dialog-scrollable' + (o.size ? ' modal-' + o.size : '');
    document.getElementById('appModalContent').innerHTML = `
      <div class="modal-header"><div><h5 class="modal-title">${o.icon ? '<i class="bi ' + o.icon + ' text-primary me-2"></i>' : ''}${esc(o.title)}</h5>${o.sub ? '<div class="m-sub">' + esc(o.sub) + '</div>' : ''}</div>
        <button type="button" class="btn-close-k" data-bs-dismiss="modal" aria-label="Tutup"><i class="bi bi-x-lg"></i></button></div>
      <div class="modal-body">${o.body || ''}</div>${o.foot ? '<div class="modal-footer">' + o.foot + '</div>' : ''}`;
    const el = document.getElementById('appModal');
    Modal.inst = bootstrap.Modal.getOrCreateInstance(el);
    if (o.onShow) el.addEventListener('shown.bs.modal', function h() { el.removeEventListener('shown.bs.modal', h); o.onShow(el); });
    Modal.inst.show();
    if (o.afterRender) o.afterRender(el);
    return el;
  },
  close() { if (Modal.inst) Modal.inst.hide(); }
};

/** Dialog konfirmasi berbasis Promise. opsi: {title, text, ok, danger, input:{label, placeholder, min}} */
function confirmDialog(o) {
  return new Promise(resolve => {
    const el = document.getElementById('confirmModal');
    document.getElementById('confirmContent').innerHTML = `
      <div class="modal-body text-center pt-4">
        <div class="kpi-icon ${o.danger ? 'red' : ''}" style="width:56px;height:56px;border-radius:50%;margin:0 auto 12px;font-size:24px"><i class="bi ${o.icon || (o.danger ? 'bi-exclamation-triangle' : 'bi-question-circle')}"></i></div>
        <h5 class="font-head mb-2">${esc(o.title)}</h5>
        <p class="text-muted mb-0" style="font-size:13.5px">${o.html || esc(o.text || '')}</p>
        ${o.input ? `<div class="fg mt-3 text-start"><label for="cfInput">${esc(o.input.label)}</label><textarea id="cfInput" class="inp" rows="2" placeholder="${esc(o.input.placeholder || '')}"></textarea><span class="err-msg">Wajib diisi minimal ${o.input.min || 5} karakter.</span></div>` : ''}
      </div>
      <div class="modal-footer justify-content-center border-0 pb-4">
        <button class="btn btn-outline" data-bs-dismiss="modal">Batal</button>
        <button class="btn ${o.danger ? 'btn-danger' : 'btn-primary'}" id="cfOk">${esc(o.ok || 'Ya, lanjutkan')}</button>
      </div>`;
    const m = bootstrap.Modal.getOrCreateInstance(el);
    let done = false;
    el.querySelector('#cfOk').onclick = () => {
      let val = true;
      if (o.input) {
        const inp = el.querySelector('#cfInput'); val = inp.value.trim();
        if (val.length < (o.input.min || 5)) { inp.closest('.fg').classList.add('has-error'); inp.focus(); return; }
      }
      done = true; m.hide(); resolve(val);
    };
    el.addEventListener('hidden.bs.modal', function h() { el.removeEventListener('hidden.bs.modal', h); if (!done) resolve(false); });
    m.show();
  });
}

/** Tampilkan kredensial baru sekali saja (akun anggota / reset sandi). */
function showCredential(akun, title) {
  Modal.open({
    title: title || 'Kredensial Akun', icon: 'bi-key',
    body: `<div class="info-box warn mb-3"><i class="bi bi-shield-lock"></i><div>Catat dan serahkan kepada pemilik akun. Sandi ini <b>hanya ditampilkan sekali</b> dan wajib diganti saat masuk pertama.</div></div>
      <dl class="kv"><dt>Username</dt><dd class="mono">${esc(akun.username)}</dd><dt>Sandi sementara</dt><dd class="mono" style="font-size:16px">${esc(akun.password)}</dd></dl>`,
    foot: `<button class="btn btn-outline" ${on('UI.copy', akun.username + ' / ' + akun.password)}><i class="bi bi-clipboard"></i> Salin</button><button class="btn btn-primary" data-bs-dismiss="modal">Selesai</button>`
  });
}

// ════════════════════════════════════════════════════════
// BAGIAN 7: VALIDASI FORMULIR
// ════════════════════════════════════════════════════════
const Form = {
  /** Ambil nilai form → objek. */
  data(form) { const o = {}; new FormData(form).forEach((v, k) => { o[k] = typeof v === 'string' ? v.trim() : v; }); return o; },
  /** Validasi HTML5 + aturan kustom; tampilkan pesan di dekat field. rules: {name: fn(value, data) → pesan|''} */
  check(form, rules) {
    let ok = true, first = null;
    const data = Form.data(form);
    form.querySelectorAll('.fg').forEach(g => g.classList.remove('has-error'));
    form.querySelectorAll('input, select, textarea').forEach(inp => {
      if (!inp.name) return;
      let msg = '';
      if (!inp.checkValidity()) msg = inp.dataset.msg || inp.validationMessage;
      if (!msg && rules && rules[inp.name]) msg = rules[inp.name](data[inp.name], data) || '';
      if (msg) {
        ok = false; first = first || inp;
        const g = inp.closest('.fg');
        if (g) { g.classList.add('has-error'); let e = g.querySelector('.err-msg'); if (!e) { e = document.createElement('span'); e.className = 'err-msg'; g.appendChild(e); } e.textContent = msg; }
      }
    });
    if (first) { first.focus(); }
    return ok ? data : null;
  },
  /** Format input rupiah saat diketik (1.000.000). */
  money(inp) { const v = parseRp(inp.value); inp.value = v ? fmtNum(v) : ''; },
  busy(btn, on) {
    if (!btn) return;
    if (on) { btn.dataset.html = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Memproses…'; }
    else { btn.disabled = false; if (btn.dataset.html) btn.innerHTML = btn.dataset.html; }
  }
};
document.addEventListener('input', e => { if (e.target.matches && e.target.matches('[data-money]')) Form.money(e.target); });
document.addEventListener('input', e => { const g = e.target.closest && e.target.closest('.fg.has-error'); if (g) g.classList.remove('has-error'); });


// ════════════════════════════════════════════════════════
// BAGIAN 8: KALKULASI BISNIS (identik dengan server → Optimistic UI akurat)
// ════════════════════════════════════════════════════════
const Calc = {
  /**
   * Bunga/margin = persen × pokok, SEKALI untuk seluruh akad (tidak dikali tenor) — identik dengan server.
   * Tenor panjang atau pendek → total bunga sama; angsuran = (pokok + bunga) ÷ tenor, flat tiap bulan.
   */
  pinjaman(pokok, persen, tenor) {
    pokok = num(pokok); tenor = num(tenor) || 1;
    const totalBunga = Math.round(pokok * num(persen) / 100);
    const total = pokok + totalBunga;
    return { pokok, totalBunga, total, angsuran: Math.round(total / tenor), bungaBulan: Math.round(totalBunga / tenor), pokokBulan: Math.round(pokok / tenor) };
  },
  jadwal(loan, tglCair) {
    const Tn = num(loan.Tenor), P = num(loan.Pokok), B = num(loan.Total_Bunga);
    const pp = Math.round(P / Tn), bb = Math.round(B / Tn), rows = [];
    for (let k = 1; k <= Tn; k++) {
      const pk = k === Tn ? P - pp * (Tn - 1) : pp, bg = k === Tn ? B - bb * (Tn - 1) : bb;
      rows.push({ ID_Angsuran: loan.ID_Pinjaman + '#' + pad2(k), ID_Pinjaman: loan.ID_Pinjaman, Jenis: loan.Jenis, Cicilan_Ke: k,
        Jatuh_Tempo: addMonths(tglCair, k, tglPotong()), Tgl_Bayar: '', Pokok: pk, Bunga: bg, Denda: 0, Total: pk + bg,
        Bayar_Pokok: 0, Bayar_Bunga: 0, Bayar_Denda: 0, Dibayar: 0, Status: 'belum', Dicatat_Oleh: '', No_Bukti: '' });
    }
    return rows;
  },
  sisaRow: r => Math.max(0, num(r.Pokok) - num(r.Bayar_Pokok)) + Math.max(0, num(r.Bunga) - num(r.Bayar_Bunga)) + Math.max(0, num(r.Denda) - num(r.Bayar_Denda)),
  denda(r, tanggal) {
    const st = S.settings;
    if (String(st.DENDA_AKTIF) !== 'ya') return num(r.Denda);
    const late = daysBetween(r.Jatuh_Tempo, tanggal) - num(st.DENDA_TENGGANG);
    if (late <= 0) return num(r.Denda);
    return Math.max(num(r.Denda), Math.ceil(late / 7) * num(st.DENDA_NOMINAL));
  },
  /** Alokasi pembayaran: denda → bunga → pokok per cicilan (sama persis dengan server). */
  alokasi(openRows, mode, opt) {
    const tanggal = opt.tanggal, st = S.settings;
    const work = openRows.map(r => { const o = Object.assign({}, r); ['Pokok', 'Bunga', 'Denda', 'Bayar_Pokok', 'Bayar_Bunga', 'Bayar_Denda', 'Cicilan_Ke'].forEach(k => { o[k] = num(o[k]); }); return o; })
      .sort((a, b) => a.Cicilan_Ke - b.Cicilan_Ke);
    work.forEach(r => { r.Denda = Calc.denda(r, tanggal); r.Total = r.Pokok + r.Bunga + r.Denda; });
    let targets = [], budget = Infinity, diskon = 0;
    if (mode === 'tagihan') targets = work.slice(0, 1);
    else if (mode === 'multi') targets = work.slice(0, Math.max(1, Math.min(work.length, parseInt(opt.n, 10) || 1)));
    else if (mode === 'lunas') {
      targets = work;
      if (String(st.DISKON_PELUNASAN) === 'ya') targets.forEach(r => { if (r.Jatuh_Tempo > tanggal) { const w = r.Bunga - r.Bayar_Bunga; if (w > 0) { diskon += w; r.Bunga = r.Bayar_Bunga; r.Total = r.Pokok + r.Bunga + r.Denda; } } });
    } else if (mode === 'sebagian') {
      targets = work; budget = Math.floor(num(opt.nominal));
      if (!(budget > 0)) throw new Error('Nominal pembayaran harus lebih dari 0.');
      const tot = work.reduce((s, r) => s + Calc.sisaRow(r), 0);
      if (budget > tot) throw new Error('Nominal melebihi sisa tagihan (maks. ' + fmtRp(tot) + ').');
    }
    const led = { Jumlah: 0, Pokok: 0, Bunga: 0, Denda: 0, Diskon: diskon, cicilan: [] }, changed = [];
    targets.forEach(r => {
      if (budget <= 0) return;
      let paid = 0;
      [['Denda', 'Bayar_Denda'], ['Bunga', 'Bayar_Bunga'], ['Pokok', 'Bayar_Pokok']].forEach(p => {
        const need = Math.max(0, r[p[0]] - r[p[1]]); const pay = Math.min(need, budget);
        if (pay > 0) { r[p[1]] += pay; budget -= pay; led[p[0]] += pay; paid += pay; }
      });
      if (paid > 0) {
        r.Dibayar = r.Bayar_Pokok + r.Bayar_Bunga + r.Bayar_Denda; r.Total = r.Pokok + r.Bunga + r.Denda;
        r.Status = Calc.sisaRow(r) === 0 ? 'lunas' : 'sebagian'; r.Tgl_Bayar = tanggal; changed.push(r); led.cicilan.push(r.Cicilan_Ke);
      }
    });
    led.Jumlah = led.Pokok + led.Bunga + led.Denda;
    return { rows: changed, ledger: led };
  },
  saldo(id, jenis) {
    return S.db.simpanan.reduce((s, x) => (x.ID_Anggota === id && x.Jenis === jenis && x.Status !== 'batal') ? s + (x.Tipe === 'tarik' ? -1 : 1) * num(x.Jumlah) : s, 0);
  },
  /** Persen bunga/margin total yang berlaku (Pengaturan BUNGA_TOTAL_*), bawaan uang 10% & barang 20%. */
  rate(jenis, src) {
    const s = src || S.settings || {}, k = jenis === 'barang' ? 'BUNGA_TOTAL_BARANG' : 'BUNGA_TOTAL_UANG';
    return s[k] === undefined || s[k] === '' ? (jenis === 'barang' ? 20 : 10) : num(s[k]);
  },
  /** Persen bunga total sebuah akad, dihitung dari Total_Bunga ÷ Pokok (benar untuk akad lama & baru). */
  loanPct(l) {
    const p = num(l.Pokok), b = num(l.Total_Bunga);
    if (!p) return num(l.Bunga_Persen);
    return Math.round(b / p * 10000) / 100;
  },
  /** Rentang tenor yang diizinkan (Pengaturan → TENOR_MIN_/TENOR_MAX_), bawaan 3–20 bulan. */
  tenorRange(jenis, src) {
    const s = src || S.settings || {}, j = jenis === 'barang' ? 'BARANG' : 'UANG';
    let min = parseInt(s['TENOR_MIN_' + j], 10), max = parseInt(s['TENOR_MAX_' + j], 10);
    if (!(min >= 1)) min = 3;
    if (!(max >= 1)) max = 20;
    if (min > max) { const x = min; min = max; max = x; }
    return { min: Math.min(min, 60), max: Math.min(max, 60) };
  },
  /** Semua pilihan tenor: setiap bulan dari minimal s.d. maksimal. */
  tenors(jenis, src) { const r = Calc.tenorRange(jenis, src), out = []; for (let t = r.min; t <= r.max; t++) out.push(t); return out; },
  kolek(days) {
    if (days <= 0) return { label: 'Lancar', kol: 'Kol-1', cls: 'b-success' };
    if (days <= 7) return { label: 'H+' + days + ' (Dalam Perhatian)', kol: 'Kol-2', cls: 'b-amber' };
    if (days <= 14) return { label: 'H+' + days + ' (Kurang Lancar)', kol: 'Kol-3', cls: 'b-amber' };
    if (days <= 30) return { label: 'H+' + days + ' (Diragukan)', kol: 'Kol-4', cls: 'b-red' };
    return { label: 'H+' + days + ' (Macet)', kol: 'Kol-5', cls: 'b-red' };
  }
};

// ════════════════════════════════════════════════════════
// BAGIAN 9: INDEKS TURUNAN (dihitung ulang setiap data berubah — milidetik)
// ════════════════════════════════════════════════════════
let D = {};
function derive() {
  const db = S.db, today = T();
  const d = { anggota: {}, saldo: {}, loans: {}, loansByAng: {}, rows: {}, barang: {}, pays: {}, today };
  D = d;
  db.anggota.forEach(a => { d.anggota[a.ID_Anggota] = a; d.saldo[a.ID_Anggota] = { pokok: 0, wajib: 0, sukarela: 0, total: 0, n: 0 }; d.loansByAng[a.ID_Anggota] = []; });
  db.simpanan.forEach(x => {
    if (x.Status === 'batal') return;
    const s = d.saldo[x.ID_Anggota] || (d.saldo[x.ID_Anggota] = { pokok: 0, wajib: 0, sukarela: 0, total: 0, n: 0 });
    const v = (x.Tipe === 'tarik' ? -1 : 1) * num(x.Jumlah);
    s[x.Jenis] = (s[x.Jenis] || 0) + v; s.total += v; s.n++;
  });
  db.barang.forEach(b => { d.barang[b.ID_Barang] = b; });
  db.angsuran.forEach(r => { (d.rows[r.ID_Pinjaman] || (d.rows[r.ID_Pinjaman] = [])).push(r); });
  Object.keys(d.rows).forEach(k => d.rows[k].sort((a, b) => num(a.Cicilan_Ke) - num(b.Cicilan_Ke)));
  db.pembayaran.forEach(p => { (d.pays[p.ID_Pinjaman] || (d.pays[p.ID_Pinjaman] = [])).push(p); });
  const overdue = [], dueMonth = [], tunggakan = {};
  const mk = monthKey(today);
  db.pinjaman.forEach(l => {
    d.loans[l.ID_Pinjaman] = l;
    (d.loansByAng[l.ID_Anggota] || (d.loansByAng[l.ID_Anggota] = [])).push(l);
    if (l.Status !== 'berjalan') return;
    (d.rows[l.ID_Pinjaman] || []).forEach(r => {
      const sisa = Calc.sisaRow(r);
      if (sisa <= 0) return;
      if (monthKey(r.Jatuh_Tempo) === mk) dueMonth.push({ loan: l, row: r, sisa });
      if (r.Jatuh_Tempo < today) {
        const days = daysBetween(r.Jatuh_Tempo, today);
        overdue.push({ loan: l, row: r, sisa, days });
        const t = tunggakan[l.ID_Pinjaman] || (tunggakan[l.ID_Pinjaman] = { loan: l, rows: [], total: 0, days: 0 });
        t.rows.push(r); t.total += sisa; t.days = Math.max(t.days, days);
      }
    });
  });
  d.overdue = overdue; d.dueMonth = dueMonth;
  d.tunggakan = Object.values(tunggakan).sort((a, b) => b.days - a.days);
  d.pending = db.pinjaman.filter(l => l.Status === 'diajukan').sort((a, b) => String(a.Tgl_Pengajuan).localeCompare(String(b.Tgl_Pengajuan)));
  d.approved = db.pinjaman.filter(l => l.Status === 'disetujui');
  d.lowStock = db.barang.filter(b => b.Status !== 'nonaktif' && num(b.Stok) <= num(b.Stok_Min));
  d.berjalan = db.pinjaman.filter(l => l.Status === 'berjalan');
  const sp = { pokok: 0, wajib: 0, sukarela: 0, total: 0 };
  Object.values(d.saldo).forEach(s => { sp.pokok += s.pokok; sp.wajib += s.wajib; sp.sukarela += s.sukarela; sp.total += s.total; });
  d.simpananTotal = sp;
  d.sisaPokok = { uang: 0, barang: 0 };
  d.berjalan.forEach(l => { d.sisaPokok[l.Jenis] += Calc.sisaPokok(l); });
  d.upcoming = [];
  d.berjalan.forEach(l => { const r = nextRow(l); if (r) d.upcoming.push({ loan: l, row: r, sisa: Calc.sisaRow(r), days: daysBetween(today, r.Jatuh_Tempo) }); });
  d.upcoming.sort((a, b) => a.row.Jatuh_Tempo.localeCompare(b.row.Jatuh_Tempo));
  D = d;
  return d;
}
Calc.sisaPokok = l => (D.rows[l.ID_Pinjaman] || []).reduce((s, r) => s + Math.max(0, num(r.Pokok) - num(r.Bayar_Pokok)), 0);
const nextRow = l => (D.rows[l.ID_Pinjaman] || []).find(r => Calc.sisaRow(r) > 0);
const angName = id => (D.anggota[id] ? D.anggota[id].Nama : (id === (S.user && S.user.idAnggota) ? S.user.nama : id));
const loanLabel = l => l.Jenis === 'barang' ? ((D.barang[l.ID_Barang] || {}).Nama || l.ID_Barang) + (num(l.Qty) > 1 ? ' ×' + l.Qty : '') : (l.Keperluan || 'Pinjaman uang');
const paidCount = l => (D.rows[l.ID_Pinjaman] || []).filter(r => Calc.sisaRow(r) === 0).length;

// ════════════════════════════════════════════════════════
// BAGIAN 10: LAPORAN KEUANGAN (dihitung lokal → instan)
// ════════════════════════════════════════════════════════
const Rep = {
  inRange: (d, a, b) => d && d.slice(0, 10) >= a && d.slice(0, 10) <= b,
  /** Laba Rugi periode [a,b] */
  labaRugi(a, b) {
    const db = S.db, r = { bungaUang: 0, bungaBarang: 0, labaKredit: 0, labaTunai: 0, denda: 0, biaya: 0, rusak: 0, biayaKat: {} };
    db.pembayaran.forEach(p => { if (!Rep.inRange(p.Tanggal, a, b)) return; if (p.Jenis === 'barang') r.bungaBarang += num(p.Bunga); else r.bungaUang += num(p.Bunga); r.denda += num(p.Denda); });
    db.pinjaman.forEach(l => { if (l.Jenis === 'barang' && l.Tgl_Cair && Rep.inRange(l.Tgl_Cair, a, b) && ['berjalan', 'lunas'].includes(l.Status)) r.labaKredit += num(l.Pokok) - num(l.HPP); });
    db.mutasi.forEach(m => {
      if (!Rep.inRange(m.Tanggal, a, b) || m.Jenis !== 'keluar') return;
      if (m.Sumber === 'tunai') r.labaTunai += num(m.Qty) * (num(m.Harga_Jual_Satuan) - num(m.Harga_Satuan));
      if (m.Sumber === 'rusak') r.rusak += num(m.Qty) * num(m.Harga_Satuan);
    });
    db.biaya.forEach(x => { if (!Rep.inRange(x.Tanggal, a, b)) return; r.biaya += num(x.Jumlah); r.biayaKat[x.Kategori] = (r.biayaKat[x.Kategori] || 0) + num(x.Jumlah); });
    r.pendapatan = r.bungaUang + r.bungaBarang + r.labaKredit + r.labaTunai + r.denda;
    r.beban = r.biaya + r.rusak;
    r.laba = r.pendapatan - r.beban;
    return r;
  },
  /** Neraca per tanggal (seimbang secara konstruksi: Aset = Simpanan + Modal + Laba berjalan). */
  neraca(tgl) {
    const db = S.db, st = S.settings, n = {};
    const upto = d => d && d.slice(0, 10) <= tgl;
    const simp = { pokok: 0, wajib: 0, sukarela: 0 };
    db.simpanan.forEach(x => { if (x.Status === 'batal' || !upto(x.Tanggal)) return; simp[x.Jenis] += (x.Tipe === 'tarik' ? -1 : 1) * num(x.Jumlah); });
    let pokokCairU = 0, pokokCairB = 0, bayarPokokU = 0, bayarPokokB = 0, bayarTotal = 0;
    db.pinjaman.forEach(l => { if (!l.Tgl_Cair || !upto(l.Tgl_Cair)) return; if (l.Jenis === 'barang') pokokCairB += num(l.Pokok); else pokokCairU += num(l.Pokok); });
    db.pembayaran.forEach(p => { if (!upto(p.Tanggal)) return; bayarTotal += num(p.Jumlah); if (p.Jenis === 'barang') bayarPokokB += num(p.Pokok); else bayarPokokU += num(p.Pokok); });
    let beli = 0, tunai = 0, persediaan = 0;
    db.mutasi.forEach(m => {
      if (!upto(m.Tanggal)) return;
      const v = num(m.Qty) * num(m.Harga_Satuan);
      if (m.Jenis === 'masuk') { beli += v; persediaan += v; } else { persediaan -= v; if (m.Sumber === 'tunai') tunai += num(m.Qty) * num(m.Harga_Jual_Satuan); }
    });
    const biaya = sum(db.biaya.filter(x => upto(x.Tanggal)), 'Jumlah');
    const modal = num(st.MODAL_AWAL);
    const simpTotal = simp.pokok + simp.wajib + simp.sukarela;
    n.kas = modal + simpTotal - pokokCairU + bayarTotal - biaya - beli + tunai;
    n.piutangUang = pokokCairU - bayarPokokU;
    n.piutangBarang = pokokCairB - bayarPokokB;
    n.persediaan = persediaan;
    n.aset = n.kas + n.piutangUang + n.piutangBarang + n.persediaan;
    n.simp = simp; n.simpTotal = simpTotal; n.modal = modal;
    n.laba = Rep.labaRugi('0000-01-01', tgl).laba;
    n.pasiva = simpTotal + modal + n.laba;
    n.selisih = Math.round(n.aset - n.pasiva);
    return n;
  },
  /** Arus kas metode langsung periode [a,b] */
  arusKas(a, b) {
    const db = S.db, r = { angsPokok: 0, bungaMargin: 0, denda: 0, jualTunai: 0, beliBarang: 0, biaya: 0, setor: { pokok: 0, wajib: 0, sukarela: 0 }, tarik: 0, cairUang: 0 };
    db.pembayaran.forEach(p => { if (!Rep.inRange(p.Tanggal, a, b)) return; r.angsPokok += num(p.Pokok); r.bungaMargin += num(p.Bunga); r.denda += num(p.Denda); });
    db.mutasi.forEach(m => { if (!Rep.inRange(m.Tanggal, a, b)) return; if (m.Jenis === 'masuk') r.beliBarang += num(m.Qty) * num(m.Harga_Satuan); else if (m.Sumber === 'tunai') r.jualTunai += num(m.Qty) * num(m.Harga_Jual_Satuan); });
    db.biaya.forEach(x => { if (Rep.inRange(x.Tanggal, a, b)) r.biaya += num(x.Jumlah); });
    db.simpanan.forEach(x => { if (x.Status === 'batal' || !Rep.inRange(x.Tanggal, a, b)) return; if (x.Tipe === 'tarik') r.tarik += num(x.Jumlah); else r.setor[x.Jenis] += num(x.Jumlah); });
    db.pinjaman.forEach(l => { if (l.Jenis === 'uang' && l.Tgl_Cair && Rep.inRange(l.Tgl_Cair, a, b)) r.cairUang += num(l.Pokok); });
    r.operasi = r.angsPokok + r.bungaMargin + r.denda + r.jualTunai - r.beliBarang - r.biaya;
    r.pendanaan = r.setor.pokok + r.setor.wajib + r.setor.sukarela - r.tarik - r.cairUang;
    r.naik = r.operasi + r.pendanaan;
    r.awal = Rep.neraca(addDays(a, -1)).kas;
    r.akhir = r.awal + r.naik;
    return r;
  },
  /** Deret bulanan n bulan terakhir untuk grafik. */
  monthly(n) {
    const out = [], today = T();
    for (let i = n - 1; i >= 0; i--) {
      const first = addMonths(today.slice(0, 8) + '01', -i, 1), mk = monthKey(first);
      const last = addDays(addMonths(first, 1, 1), -1);
      out.push({ mk, first, last: last > today ? today : last });
    }
    out.forEach(m => {
      m.saldo = 0; m.cairU = 0; m.cairB = 0; m.angsuran = 0; m.setor = 0;
      S.db.simpanan.forEach(x => { if (x.Status === 'batal') return; if (x.Tanggal <= m.last) m.saldo += (x.Tipe === 'tarik' ? -1 : 1) * num(x.Jumlah); if (monthKey(x.Tanggal) === m.mk && x.Tipe === 'setor') m.setor += num(x.Jumlah); });
      S.db.pinjaman.forEach(l => { if (l.Tgl_Cair && monthKey(l.Tgl_Cair) === m.mk) { if (l.Jenis === 'barang') m.cairB += num(l.Pokok); else m.cairU += num(l.Pokok); } });
      S.db.pembayaran.forEach(p => { if (monthKey(p.Tanggal) === m.mk) m.angsuran += num(p.Jumlah); });
    });
    return out;
  },
  /** Kolektibilitas: % sisa tagihan berjalan yang TIDAK tertunggak (rasio kelancaran); NPL = rasio tunggakan. */
  kolektibilitas() {
    const total = sum(D.berjalan, 'Sisa_Tagihan');
    const tunggak = sum(D.tunggakan, 'total');
    return { total, npl: total ? tunggak / total * 100 : 0, lancar: total ? 100 - tunggak / total * 100 : 100, debitur: D.tunggakan.length };
  },
  periode(preset) {
    const t = T(), y = t.slice(0, 4), m1 = t.slice(0, 8) + '01';
    switch (preset) {
      case 'bulan-ini': return [m1, t];
      case 'bulan-lalu': { const a = addMonths(m1, -1, 1); return [a, addDays(m1, -1)]; }
      case 'triwulan': return [addMonths(m1, -2, 1), t];
      case 'tahun-ini': return [y + '-01-01', t];
      case 'tahun-lalu': return [(+y - 1) + '-01-01', (+y - 1) + '-12-31'];
      default: return ['2000-01-01', t];
    }
  }
};


// ════════════════════════════════════════════════════════
// BAGIAN 11: LOGO & KOMPONEN UI BERSAMA
// ════════════════════════════════════════════════════════
const Logo = {
  svg(size) {
    size = size || 34;
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="Logo koperasi"><g fill="none" stroke="#0F7B5F" stroke-width="3.2" stroke-linejoin="round"><rect x="15" y="15" width="34" height="34" rx="2"/><rect x="15" y="15" width="34" height="34" rx="2" transform="rotate(45 32 32)"/></g><circle cx="32" cy="32" r="10" fill="#E8F5F0" stroke="#0F7B5F" stroke-width="2"/><path d="M32 24.5c3.6 4.2 3.6 10.8 0 15-3.6-4.2-3.6-10.8 0-15z" fill="#0F7B5F"/><circle cx="32" cy="32" r="2.3" fill="#D4A63A"/></svg>`;
  },
  /** Logo aktif: unggahan Admin (data URL dari server) → URL lama → '' (= logo khatam bawaan). */
  url() { return ((BOOT.koperasi || {}).logo) || (S.settings && S.settings.LOGO_URL) || ''; },
  /** Ganti logo di seluruh tampilan (setelah unggah/hapus) dan simpan ke cache data awal perangkat. */
  set(u, id) {
    const k = Object.assign({}, BOOT.koperasi || {}, { logo: u || '' });
    if (id !== undefined) k.logoId = id || '';
    BOOT.koperasi = k;
    try { Store.lset('sk_boot', JSON.parse(JSON.stringify(BOOT))); } catch (e) { /* penyimpanan penuh: tetap dipakai di memori */ }
    Logo.refresh();
  },
  _fav: null,
  /** Ikon tab browser ikut memakai logo koperasi. */
  favicon() {
    const l = document.querySelector('link[rel="icon"]'); if (!l) return;
    if (Logo._fav === null) Logo._fav = l.getAttribute('href');
    const u = Logo.url();
    l.setAttribute('type', u ? (u.match(/^data:([^;,]+)/) || [])[1] || 'image/png' : 'image/svg+xml');
    l.setAttribute('href', u || Logo._fav);
  },
  /** Logo aktif sebagai elemen bertanda data-logo, agar bisa diperbarui di tempat oleh Logo.refresh(). */
  html(size) { const u = Logo.url(); return u ? `<img data-logo="${size}" src="${esc(u)}" alt="Logo koperasi" style="width:${size}px;height:${size}px;object-fit:contain">` : Logo.svg(size).replace('<svg ', `<svg data-logo="${size}" `); },
  /** Ganti SEMUA logo yang sedang tampil (menu, bilah atas, halaman masuk, pratinjau) + ikon tab. */
  refresh() {
    Logo.favicon();
    document.querySelectorAll('[data-logo]').forEach(el => { const n = parseInt(el.getAttribute('data-logo'), 10) || 34; el.outerHTML = Logo.html(n); });
  },
  _png: null,
  /** Logo bawaan sebagai PNG data URL (untuk dokumen PDF). */
  png() {
    if (Logo._png) return Promise.resolve(Logo._png);
    return new Promise(res => {
      try {
        const img = new Image();
        img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 192; c.getContext('2d').drawImage(img, 0, 0, 192, 192); try { Logo._png = c.toDataURL('image/png'); } catch (e) { Logo._png = ''; } res(Logo._png); };
        img.onerror = () => res('');
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(Logo.svg(192).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
      } catch (e) { res(''); }
    });
  }
};

const badge = (text, cls, icon) => `<span class="badge-k ${cls || 'b-gray'}">${icon ? '<i class="bi ' + icon + '"></i>' : ''}${esc(text)}</span>`;
const LOAN_STATUS = {
  diajukan: ['Menunggu Persetujuan', 'b-amber', 'bi-hourglass-split'], disetujui: ['Disetujui · Siap Cair', 'b-blue', 'bi-patch-check'],
  berjalan: ['Berjalan', 'b-blue', 'bi-arrow-repeat'], lunas: ['Lunas', 'b-success', 'bi-check2-circle'],
  ditolak: ['Ditolak', 'b-red', 'bi-x-circle'], dibatalkan: ['Dibatalkan', 'b-gray', 'bi-slash-circle']
};
function loanBadge(l) {
  if (l.Status === 'berjalan' && D.tunggakan && D.tunggakan.find(t => t.loan.ID_Pinjaman === l.ID_Pinjaman)) return badge('Menunggak', 'b-red', 'bi-exclamation-triangle');
  const s = LOAN_STATUS[l.Status] || [cap(l.Status), 'b-gray']; return badge(s[0], s[1], s[2]);
}
const jenisBadge = l => l.Jenis === 'barang' ? badge('Barang ' + fmtPct(Calc.loanPct(l)) + '%', 'b-gold', 'bi-box-seam') : badge('Uang ' + fmtPct(Calc.loanPct(l)) + '% Flat', 'b-green', 'bi-cash-coin');
/** Tanggal potong gaji untuk angsuran pinjaman uang & barang (Pengaturan TGL_POTONG_GAJI), bawaan 25. */
const tglPotong = () => num((S.settings || {}).TGL_POTONG_GAJI) || 25;
/** Tanggal paling awal untuk data pinjaman (pengajuan/akad/pencairan) — bawaan 1 Januari 2025. */
const tglMulaiPinjaman = () => { const v = String((S.settings || {}).TGL_MULAI_PINJAMAN || ''); return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '2025-01-01'; };
/** Angka persen ringkas: 10 → "10", 12.5 → "12,5". */
const fmtPct = x => String(Math.round(num(x) * 100) / 100).replace('.', ',');
function rowBadge(r) {
  const sisa = Calc.sisaRow(r), t = T();
  if (sisa === 0) return badge('Lunas', 'b-success', 'bi-check-lg');
  if (r.Jatuh_Tempo < t) return badge('Lewat H+' + daysBetween(r.Jatuh_Tempo, t), 'b-red');
  if (num(r.Dibayar) > 0) return badge('Sebagian', 'b-amber');
  const dd = daysBetween(t, r.Jatuh_Tempo);
  if (dd <= 3) return badge(dd === 0 ? 'Hari Ini' : 'H-' + dd, 'b-amber');
  return badge('Belum Bayar', 'b-gray');
}
const JENIS_SIMP = { pokok: ['Pokok', 'b-blue'], wajib: ['Wajib', 'b-green'], sukarela: ['Sukarela', 'b-gold'] };
const simpBadge = x => x.Status === 'batal' ? badge('Batal', 'b-gray', 'bi-slash-circle') : x.Tipe === 'tarik' ? badge('Tarik ' + cap(x.Jenis), 'b-red') : badge((JENIS_SIMP[x.Jenis] || [x.Jenis])[0], (JENIS_SIMP[x.Jenis] || [0, 'b-gray'])[1]);

function pageHead(o) {
  const crumbs = o.crumbs ? `<div class="crumbs">${o.crumbs.map((c, i) => (i ? '<span class="sep">›</span>' : '') + (c[1] ? `<a ${on('Nav.go', c[1])}>${esc(c[0])}</a>` : `<span>${esc(c[0])}</span>`)).join('')}</div>` : '';
  return `<div class="page-head"><div style="min-width:0">${o.back ? `<button class="back-link" ${on('Nav.back', o.back)}><i class="bi bi-arrow-left"></i> ${esc(o.backLabel || 'Kembali')}</button>` : ''}${crumbs}
    ${o.eyebrow ? `<div class="eyebrow mb-1">${o.eyebrow}</div>` : ''}<h1>${o.title}</h1>${o.desc ? `<p>${o.desc}</p>` : ''}</div>
    ${o.actions ? `<div class="actions">${o.actions}</div>` : ''}</div>`;
}
function kpi(o) {
  return `<div class="card-k ${o.cls || ''}" ${o.onclick ? 'role="button" tabindex="0" onclick="' + esc(o.onclick) + '"' : ''}><div class="kpi">
    <div class="kpi-top"><span class="kpi-label">${esc(o.label)}</span>${o.icon ? `<span class="kpi-icon ${o.tone || ''}"><i class="bi ${o.icon}"></i></span>` : ''}${o.tag || ''}</div>
    <div class="kpi-value">${o.value}</div>${o.sub ? `<div class="kpi-sub">${o.sub}</div>` : ''}${o.extra || ''}</div></div>`;
}
const empty = (icon, title, text) => `<div class="empty"><i class="bi ${icon}"></i><b>${esc(title)}</b>${text ? esc(text) : ''}</div>`;
const progress = (p, cls) => `<div class="progress-k ${cls || ''}"><span style="width:${Math.max(0, Math.min(100, p))}%"></span></div>`;
const skeleton = () => `<div class="grid g-kpi mb-3">${'<div class="skeleton sk-card"></div>'.repeat(4)}</div><div class="card-k"><div class="skeleton sk-line" style="width:40%"></div>${'<div class="skeleton sk-line"></div>'.repeat(6)}</div>`;
const tabs = (items, active, fn) => `<div class="tabs-k" role="tablist">${items.map(t => `<button class="tab-k ${t[0] === active ? 'on' : ''}" role="tab" aria-selected="${t[0] === active}" ${on(fn, t[0])}>${t[2] ? '<i class="bi ' + t[2] + '"></i>' : ''}${esc(t[1])}${t[3] !== undefined ? `<span class="cnt">${t[3]}</span>` : ''}</button>`).join('')}</div>`;
const optList = (arr, val) => arr.map(o => { const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`; }).join('');

/** Status halaman per id (filter, tab, pencarian) */
const UIS = {};
const st = (id, def) => (UIS[id] = UIS[id] || Object.assign({}, def || {}));

// ── Tabel data dengan paginasi lokal (berubah menjadi kartu di ponsel) ──
const Tbl = {
  opts: {}, state: {},
  html(o) {
    Tbl.opts[o.id] = o;
    const s = Tbl.state[o.id] = Tbl.state[o.id] || { page: 1, per: o.per || 10 };
    const rows = o.rows || [], total = rows.length, pages = Math.max(1, Math.ceil(total / s.per));
    if (s.page > pages) s.page = pages;
    const slice = o.noPage ? rows : rows.slice((s.page - 1) * s.per, s.page * s.per);
    const head = o.cols.map(c => `<th class="${c.cls || ''}" scope="col">${c.hHtml || esc(c.h)}</th>`).join('');
    const body = slice.length ? slice.map(r => `<tr class="${o.rowCls ? o.rowCls(r) : ''} ${o.rowAttr ? 'clickable' : ''} ${r._pending ? 'pending' : ''}" ${o.rowAttr ? o.rowAttr(r) : ''}>${o.cols.map(c =>
      `<td class="${c.cls || ''} ${c.main ? 'td-main' : ''} ${c.hideSm ? 'td-hide-sm' : ''}" data-label="${esc(c.label || c.h)}"><div class="td-v">${c.v(r)}</div></td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${o.cols.length}" class="td-main">${o.emptyHtml || empty(o.emptyIcon || 'bi-inbox', o.emptyTitle || 'Belum ada data', o.emptyText || '')}</td></tr>`;
    let pager = '';
    if (!o.noPage && total > 0) {
      const nums = [];
      for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - s.page) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
      pager = `<div class="pager"><span>Menampilkan ${(s.page - 1) * s.per + 1}–${Math.min(total, s.page * s.per)} dari ${total} ${esc(o.unit || 'data')}</span>
        <div class="pg"><select class="inp" aria-label="Baris per halaman" onchange="Tbl.per(${esc(JSON.stringify(o.id))}, +this.value)">${optList([10, 25, 50, 100], s.per)}</select>
        <button ${s.page <= 1 ? 'disabled' : ''} ${on('Tbl.go', o.id, s.page - 1)} aria-label="Sebelumnya"><i class="bi bi-chevron-left"></i></button>
        ${nums.map(n => n === '…' ? '<span>…</span>' : `<button class="${n === s.page ? 'on' : ''}" ${on('Tbl.go', o.id, n)}>${n}</button>`).join('')}
        <button ${s.page >= pages ? 'disabled' : ''} ${on('Tbl.go', o.id, s.page + 1)} aria-label="Berikutnya"><i class="bi bi-chevron-right"></i></button></div></div>`;
    }
    return `<div id="tbl-${esc(o.id)}"><div class="table-wrap"><table class="tbl ${o.cards === false ? '' : 'to-cards'}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${o.foot ? '<tfoot>' + o.foot + '</tfoot>' : ''}</table></div>${pager}</div>`;
  },
  redraw(id) { const el = document.getElementById('tbl-' + id); if (el && Tbl.opts[id]) { el.outerHTML = Tbl.html(Tbl.opts[id]); if (Tbl.opts[id].after) Tbl.opts[id].after(); } },
  go(id, p) { Tbl.state[id].page = p; Tbl.redraw(id); const el = document.getElementById('tbl-' + id); if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); },
  per(id, n) { Tbl.state[id].per = n; Tbl.state[id].page = 1; Tbl.redraw(id); },
  reset(id) { if (Tbl.state[id]) Tbl.state[id].page = 1; }
};

// ── Pemilih anggota (datalist: cepat & aksesibel) ──
function anggotaPicker(name, value, opts) {
  opts = opts || {};
  const list = S.db.anggota.filter(a => opts.all || a.Status === 'aktif').sort((a, b) => a.Nama.localeCompare(b.Nama));
  const cur = value && D.anggota[value] ? value + ' — ' + D.anggota[value].Nama : '';
  return `<div class="inp-group"><span class="addon"><i class="bi bi-person-badge"></i></span>
    <input class="inp" name="${name}" list="dl-${name}" value="${esc(cur)}" placeholder="Ketik nama / ID / NIK anggota" autocomplete="off" required data-msg="Pilih anggota dari daftar" ${opts.onchange ? 'onchange="' + esc(opts.onchange) + '" oninput="' + esc(opts.onchange) + '"' : ''}></div>
    <datalist id="dl-${name}">${list.map(a => `<option value="${esc(a.ID_Anggota + ' — ' + a.Nama)}">${esc(a.NIK_NIP)} · ${esc(a.Jabatan || '')}</option>`).join('')}</datalist>`;
}
const pickId = v => { const m = String(v || '').match(/^(\S+)\s+—/); const id = m ? m[1] : String(v || '').trim(); if (D.anggota[id]) return id; const byNik = S.db.anggota.find(a => a.NIK_NIP === id); return byNik ? byNik.ID_Anggota : ''; };

// ── Grafik (Chart.js) mengikuti tema ──
const Charts = {
  inst: {},
  colors() {
    const cs = getComputedStyle(document.documentElement), g = n => cs.getPropertyValue(n).trim();
    return { primary: g('--primary'), deep: g('--primary-deep'), gold: g('--gold'), text: g('--muted'), grid: g('--border'), soft: g('--primary-soft'), danger: g('--danger'), info: g('--info'), surface: g('--surface') };
  },
  make(id, cfg) {
    if (Charts.inst[id]) { Charts.inst[id].destroy(); delete Charts.inst[id]; }
    const el = document.getElementById(id);
    if (!el || !window.Chart) return null;
    const c = Charts.colors();
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif"; Chart.defaults.font.size = 11; Chart.defaults.color = c.text;
    cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false, animation: { duration: 350 },
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0A5C47', padding: 10, cornerRadius: 10, titleFont: { weight: '600' },
        callbacks: { label: ctx => ' ' + (ctx.dataset.label ? ctx.dataset.label + ': ' : '') + fmtRp(ctx.parsed.y !== undefined ? ctx.parsed.y : ctx.parsed) } } } }, cfg.options || {});
    if (cfg.type !== 'doughnut') {
      cfg.options.scales = Object.assign({ x: { grid: { display: false }, border: { display: false } },
        y: { grid: { color: c.grid }, border: { display: false }, ticks: { callback: v => fmtJt(v) } } }, cfg.options.scales || {});
    }
    Charts.inst[id] = new Chart(el, cfg);
    return Charts.inst[id];
  }
};

// ════════════════════════════════════════════════════════
// BAGIAN 12: NAVIGASI SPA (0 ms — tanpa panggilan server)
// ════════════════════════════════════════════════════════
const Pages = {};
const MENU = {
  staff: [
    ['Utama'], ['dashboard', 'Dashboard', 'bi-grid-1x2'], ['anggota', 'Data Anggota', 'bi-people'], ['simpanan', 'Simpanan & Mutasi Kas', 'bi-cash-stack'],
    ['Pembiayaan'], ['pinjaman', 'Pinjaman', 'bi-credit-card-2-front', 'pending'], ['angsuran', 'Angsuran & Loket', 'bi-bank', 'tunggak'], ['stok', 'Stok Barang Koperasi', 'bi-box-seam', 'stok'],
    ['Laporan & Administrasi'], ['laporan', 'Pusat Laporan', 'bi-bar-chart-line'], ['biaya', 'Biaya Operasional', 'bi-receipt-cutoff'], ['dokumen', 'Dokumen & Template PDF', 'bi-file-earmark-text'],
    ['pengaturan', 'Pengaturan Sistem', 'bi-gear', 'admin', ['admin']], ['log', 'Log Aktivitas', 'bi-clock-history', null, ['admin', 'pengawas']]
  ],
  bottomStaff: [['dashboard', 'Beranda', 'bi-house-door'], ['simpanan', 'Transaksi', 'bi-arrow-left-right'], ['pinjaman', 'Pinjaman', 'bi-credit-card-2-front'], ['laporan', 'Laporan', 'bi-bar-chart-line'], ['__menu', 'Menu', 'bi-grid']],
  bottomMember: [['m-beranda', 'Beranda', 'bi-house-door'], ['m-transaksi', 'Transaksi', 'bi-receipt'], ['m-pinjaman', 'Pinjaman', 'bi-wallet2'], ['profil', 'Profil', 'bi-person']]
};
const Router = {
  render() {
    const pg = Pages[S.page], el = document.getElementById('page-' + S.page);
    if (!pg || !el) return;
    if (!S.loaded) { el.innerHTML = skeleton(); return; }
    try { pg.render(el, S.params || {}); }
    catch (e) { console.error(e); el.innerHTML = `<div class="card-k">${empty('bi-bug', 'Terjadi kesalahan saat menampilkan halaman', e.message)}</div>`; }
  },
  /** Muat ulang tampilan setelah data berubah — tidak mengganggu input yang sedang diketik. */
  refresh() {
    if (!S.page) return;
    const pg = Pages[S.page], el = document.getElementById('page-' + S.page);
    if (!pg || !el) return;
    if (pg.refresh) { try { pg.refresh(el, S.params || {}); } catch (e) { console.error(e); } return; }
    const ae = document.activeElement;
    if (ae && el.contains(ae) && /INPUT|TEXTAREA|SELECT/.test(ae.tagName)) { S.dirty = true; return; }
    Router.render();
  }
};
const Nav = {
  home() { return S.role === 'anggota' ? 'm-beranda' : 'dashboard'; },
  profilePage() { return 'profil'; },
  go(id, params, opts) {
    opts = opts || {};
    if (id === '__menu') { UI.toggleSidebar(); return; }
    const pg = Pages[id];
    if (!pg) return;
    if (pg.roles && !pg.roles.includes(S.role)) { toast('Halaman ini tidak tersedia untuk peran Anda.', 'warning'); return; }
    if (!opts.back && S.page && (S.page !== id || JSON.stringify(params || {}) !== JSON.stringify(S.params))) S.history.push({ id: S.page, params: S.params });
    if (S.history.length > 40) S.history.shift();
    S.page = id; S.params = params || {}; S.dirty = false;
    document.querySelectorAll('.page.active').forEach(p => p.classList.remove('active'));
    const el = document.getElementById('page-' + id);
    el.classList.add('active');
    Router.render();
    Nav.setActive();
    document.body.classList.toggle('hide-fab', id === 'm-ajukan' || id === 'pinjaman-form');
    document.title = (pg.title || 'SIMPEL-KOP') + ' · SIMPEL-KOP';
    if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: 'auto' });
    UI.closeSidebar(); UI.closeSheet();
    if (S.user) Store.set('sk_page_' + S.user.username, { id, params: S.params });
  },
  back(fallback) {
    const h = S.history.pop();
    if (h) Nav.go(h.id, h.params, { back: true }); else Nav.go(typeof fallback === 'string' ? fallback : Nav.home(), {}, { back: true });
  },
  setActive() {
    const group = (Pages[S.page] || {}).nav || S.page;
    document.querySelectorAll('[data-nav]').forEach(a => { const on = a.dataset.nav === group; a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  },
  build() {
    const staff = isStaff();
    const app = document.getElementById('app');
    app.classList.toggle('staff', staff); app.classList.toggle('member', !staff);
    app.classList.toggle('collapsed', staff && Store.lget('sk_sb_collapsed', false));
    document.body.classList.add('has-bottomnav');
    if (staff) {
      document.getElementById('sbNav').innerHTML = MENU.staff.map(m => {
        if (m.length === 1) return `<li class="sb-section">${esc(m[0])}</li>`;
        if (m[4] && !m[4].includes(S.role)) return '';
        return `<li><button class="sb-link" data-nav="${m[0]}" ${on('Nav.go', m[0])} title="${esc(m[1])}"><i class="bi ${m[2]}"></i><span>${esc(m[1])}</span>${m[3] ? `<span class="sb-badge" data-badge="${m[3]}"></span><span class="sb-dot" data-dot="${m[3]}" hidden></span>` : ''}</button></li>`;
      }).join('');
      document.getElementById('sbFoot').innerHTML = `<button class="sb-link sb-collapse" onclick="UI.collapse()" title="Lipat menu"><i class="bi bi-layout-sidebar-inset"></i><span>Lipat menu</span></button>SIMPEL-KOP v${esc(BOOT.version || '1.4.8')} • ${esc(S.settings.SEKOLAH || 'SMK Islam PB. Soedirman 2')}`;
    }
    const bottom = staff ? MENU.bottomStaff : MENU.bottomMember;
    document.getElementById('bottomNav').innerHTML = bottom.map(b => `<button class="bn-item" data-nav="${b[0]}" ${on('Nav.go', b[0])}><i class="bi ${b[2]}"></i><span>${esc(b[1])}</span>${b[0] === 'pinjaman' || b[0] === 'm-pinjaman' ? '<span class="bn-dot" data-dot="bn" hidden></span>' : ''}</button>`).join('');
    const fab = document.getElementById('fab');
    fab.hidden = S.role === 'pengawas';
    document.getElementById('fabLabel').textContent = staff ? 'Transaksi' : 'Ajukan';
    document.getElementById('sbLogo').innerHTML = Logo.html(34);
    document.getElementById('sbAppName').textContent = S.settings.NAMA_APLIKASI || 'SIMPEL-KOP';
    document.getElementById('sbSchool').textContent = S.settings.SEKOLAH || 'SMK Islam PB. Soedirman 2';
    document.getElementById('tbBrand').innerHTML = `<span class="logo-box">${Logo.html(28)}</span><div style="min-width:0"><b>${esc(S.settings.NAMA_APLIKASI || 'SIMPEL-KOP')}</b><span>${esc(S.settings.SEKOLAH || 'SMK Islam PB. Soedirman 2')}</span></div>`;
    const pill = document.getElementById('rolePill');
    pill.textContent = S.role === 'pengawas' ? 'Pengawas (Hanya Lihat)' : S.role === 'anggota' ? 'Anggota' : ROLE_LABEL[S.role] + ' (Akses Penuh)';
    pill.classList.toggle('ro', S.role === 'pengawas');
    pill.hidden = !staff;
    document.getElementById('userName').textContent = S.user.nama || S.user.username;
    document.getElementById('userRole').textContent = ROLE_LABEL[S.role] || S.role;
    const av = document.getElementById('userAvatar'); av.textContent = initials(S.user.nama); av.className = 'avatar ' + (staff ? 'c5' : avatarCls(S.user.nama));
    Nav.renderBadges();
  },
  renderBadges() {
    if (!S.user || !D.pending) return;
    const set = (k, n, cls) => { document.querySelectorAll(`[data-badge="${k}"]`).forEach(b => { b.textContent = n || ''; b.className = 'sb-badge ' + cls; b.hidden = !n; }); document.querySelectorAll(`[data-dot="${k}"]`).forEach(d => { d.hidden = !n; }); };
    set('pending', D.pending.length, 'gold');
    set('tunggak', D.tunggakan.length, 'red');
    set('stok', D.lowStock.length, 'gold');
    set('admin', 'ADMIN', 'tag');
    const bn = S.role === 'anggota' ? D.overdue.length + D.upcoming.filter(u => u.days <= 3).length : D.pending.length;
    document.querySelectorAll('[data-dot="bn"]').forEach(d => { d.hidden = !bn; });
  }
};

const UI = {
  toggleSidebar() { const s = document.getElementById('sidebar'); const show = !s.classList.contains('show'); s.classList.toggle('show', show); document.getElementById('sbBackdrop').classList.toggle('show', show); },
  closeSidebar() { document.getElementById('sidebar').classList.remove('show'); document.getElementById('sbBackdrop').classList.remove('show'); },
  collapse() { const a = document.getElementById('app'); a.classList.toggle('collapsed'); Store.lset('sk_sb_collapsed', a.classList.contains('collapsed')); },
  theme() { return document.documentElement.getAttribute('data-theme') || 'light'; },
  toggleTheme() {
    const next = UI.theme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    Store.lset('sk_theme', next); try { localStorage.setItem('sk_theme', next); } catch (e) { /* abaikan */ }
    UI.themeIcon();
    if (S.page && document.getElementById('app').hidden === false) Router.render();
  },
  themeIcon() { const i = document.getElementById('themeIcon'); if (i) i.className = 'bi ' + (UI.theme() === 'dark' ? 'bi-sun' : 'bi-moon-stars'); },
  fab() {
    if (S.role === 'anggota') { Nav.go('m-ajukan'); return; }
    UI.sheet('Aksi Cepat Transaksi', [
      ['bi-piggy-bank', 'Setor / Tarik Simpanan', "Pages.simpanan.kasir()"], ['bi-cash-coin', 'Bayar Angsuran', "Nav.go('angsuran')"],
      ['bi-file-earmark-plus', 'Pinjaman Baru', "Nav.go('pinjaman-form')"], ['bi-person-plus', 'Anggota Baru', "Pages.anggota.form()"],
      ['bi-box-arrow-in-down', 'Barang Masuk', "Pages.stok.mutasi()"], ['bi-receipt', 'Catat Biaya', "Pages.biaya.form()"]
    ]);
  },
  sheet(title, items) {
    document.getElementById('sheetTitle').textContent = title;
    document.getElementById('sheetGrid').innerHTML = items.map(i => `<button class="quick" onclick="UI.closeSheet();${esc(i[2])}"><span class="q-ic"><i class="bi ${i[0]}"></i></span>${esc(i[1])}</button>`).join('');
    document.getElementById('sheet').classList.add('show');
  },
  closeSheet() { const s = document.getElementById('sheet'); if (s) s.classList.remove('show'); },
  copy(text) { try { navigator.clipboard.writeText(text).then(() => toast('Disalin ke papan klip.', 'success')); } catch (e) { toast(text, 'info', 'Salin manual'); } },
  toggleAmounts() { S.hideAmounts = !S.hideAmounts; Store.lset('sk_hide_amt', S.hideAmounts); Router.render(); },
  wa(hp, text) { const n = String(hp || '').replace(/\D/g, '').replace(/^0/, '62'); return n ? 'https://wa.me/' + n + (text ? '?text=' + encodeURIComponent(text) : '') : ''; },
  salam() { const h = new Date().getHours(); return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'; }
};

// ════════════════════════════════════════════════════════
// BAGIAN 13: NOTIFIKASI & PENCARIAN GLOBAL
// ════════════════════════════════════════════════════════
const Notif = {
  items() {
    if (!S.loaded || !D.pending) return [];
    const out = [];
    if (isStaff()) {
      D.pending.slice(0, 5).forEach(l => out.push(['bi-hourglass-split', 'gold', 'Pengajuan menunggu: ' + angName(l.ID_Anggota), l.ID_Pinjaman + ' · ' + fmtRp(l.Pokok), "Nav.go('pinjaman-detail',{id:" + JSON.stringify(l.ID_Pinjaman) + "})"]));
      D.tunggakan.slice(0, 5).forEach(t => out.push(['bi-exclamation-triangle', 'out', 'Tunggakan H+' + t.days + ': ' + angName(t.loan.ID_Anggota), t.rows.length + ' cicilan · ' + fmtRp(t.total), "Pages.angsuran.tab('tunggakan')"]));
      D.lowStock.slice(0, 4).forEach(b => out.push(['bi-box-seam', 'blue', 'Stok menipis: ' + b.Nama, 'Sisa ' + b.Stok + ' ' + b.Satuan + ' (min. ' + b.Stok_Min + ')', "Nav.go('stok')"]));
    } else {
      D.upcoming.filter(u => u.days <= 7).forEach(u => out.push(['bi-calendar-event', 'gold', 'Angsuran ke-' + u.row.Cicilan_Ke + (u.days < 0 ? ' terlambat ' + (-u.days) + ' hari' : u.days === 0 ? ' jatuh tempo hari ini' : ' jatuh tempo ' + u.days + ' hari lagi'), fmtRp(u.sisa) + ' · ' + fmtDate(u.row.Jatuh_Tempo), "Nav.go('pinjaman-detail',{id:" + JSON.stringify(u.loan.ID_Pinjaman) + "})"]));
      S.db.pinjaman.filter(l => l.Status === 'disetujui').forEach(l => out.push(['bi-patch-check', '', 'Pengajuan ' + l.ID_Pinjaman + ' disetujui', 'Menunggu pencairan oleh bendahara', "Nav.go('pinjaman-detail',{id:" + JSON.stringify(l.ID_Pinjaman) + "})"]));
    }
    return out;
  },
  badge() { const n = Notif.items().length; const d = document.getElementById('notifDot'); if (d) d.hidden = !n; Nav.renderBadges(); },
  render() {
    const it = Notif.items();
    document.getElementById('notifMenu').innerHTML = `<div class="row-between px-2 pt-1 pb-2"><b class="font-head">Notifikasi</b><span class="xs muted">${it.length} perlu perhatian</span></div>` +
      (it.length ? it.map(i => `<div class="notif-item" onclick="${esc(i[4])};bootstrap.Dropdown.getOrCreateInstance(document.querySelector('[aria-label=Notifikasi]')).hide()"><span class="li-icon ${i[1]}"><i class="bi ${i[0]}"></i></span><div style="min-width:0"><b>${esc(i[2])}</b><span>${esc(i[3])}</span></div></div>`).join('')
        : empty('bi-bell-slash', 'Semua beres', 'Tidak ada notifikasi baru.'));
  }
};

const Search = {
  sel: 0, res: [],
  open() { const c = document.getElementById('cmdk'); c.classList.add('show'); const i = document.getElementById('cmdkInput'); i.value = ''; Search.query(''); setTimeout(() => i.focus(), 30); },
  close() { document.getElementById('cmdk').classList.remove('show'); },
  query(q) {
    q = String(q || '').toLowerCase().trim();
    const res = [], m = s => String(s || '').toLowerCase().includes(q);
    const pages = isStaff() ? MENU.staff.filter(x => x.length > 1 && (!x[4] || x[4].includes(S.role))).map(x => ['Menu', x[2], x[1], 'Buka halaman', "Nav.go('" + x[0] + "')"])
      : MENU.bottomMember.map(x => ['Menu', x[2], x[1], 'Buka halaman', "Nav.go('" + x[0] + "')"]);
    if (!q) { Search.res = pages.slice(0, 8); return Search.draw(); }
    pages.filter(p => m(p[2])).slice(0, 3).forEach(p => res.push(p));
    if (isAdmin() && q.length >= 3 && ['impor', 'import', 'excel', 'unggah'].some(k => k.includes(q) || q.includes(k))) res.push(['Aksi', 'bi-file-earmark-arrow-up', 'Impor Data Anggota dari Excel', 'Unggah .xlsx / .csv', "Nav.go('anggota');Importer.open()"]);
    S.db.anggota.filter(a => m(a.Nama) || m(a.ID_Anggota) || m(a.NIK_NIP)).slice(0, 6).forEach(a => res.push(['Anggota', 'bi-person', a.Nama, a.ID_Anggota + ' · ' + a.NIK_NIP, isStaff() ? "Nav.go('anggota-detail',{id:" + JSON.stringify(a.ID_Anggota) + "})" : "Nav.go('profil')"]));
    S.db.pinjaman.filter(l => m(l.ID_Pinjaman) || m(l.No_Perjanjian) || m(angName(l.ID_Anggota))).slice(0, 6).forEach(l => res.push(['Pinjaman', 'bi-credit-card-2-front', l.ID_Pinjaman + (l.No_Perjanjian ? ' · ' + l.No_Perjanjian : ''), angName(l.ID_Anggota) + ' · ' + fmtRp(l.Pokok) + ' · ' + l.Status, "Nav.go('pinjaman-detail',{id:" + JSON.stringify(l.ID_Pinjaman) + "})"]));
    S.db.simpanan.filter(x => m(x.No_Bukti)).slice(0, 4).forEach(x => res.push(['Bukti Simpanan', 'bi-receipt', x.No_Bukti, angName(x.ID_Anggota) + ' · ' + fmtRp(x.Jumlah), "Docs.bukti(" + JSON.stringify(x.ID_Transaksi) + ")"]));
    S.db.pembayaran.filter(x => m(x.No_Bukti)).slice(0, 4).forEach(x => res.push(['Kwitansi Angsuran', 'bi-receipt-cutoff', x.No_Bukti, angName(x.ID_Anggota) + ' · ' + fmtRp(x.Jumlah), "Docs.kwitansi(" + JSON.stringify(x.No_Bukti) + ")"]));
    if (isStaff()) S.db.barang.filter(b => m(b.Nama) || m(b.ID_Barang) || m(b.Kategori)).slice(0, 4).forEach(b => res.push(['Barang', 'bi-box-seam', b.Nama, b.ID_Barang + ' · stok ' + b.Stok + ' ' + b.Satuan, "Nav.go('stok')"]));
    Search.res = res; Search.sel = 0; Search.draw();
  },
  draw() {
    let g = '';
    document.getElementById('cmdkRes').innerHTML = Search.res.length ? Search.res.map((r, i) => (r[0] !== g ? `<div class="cmdk-group">${esc(g = r[0])}</div>` : '') +
      `<div class="cmdk-item ${i === Search.sel ? 'sel' : ''}" onclick="Search.pick(${i})"><span class="li-icon"><i class="bi ${r[1]}"></i></span><div style="min-width:0"><b>${esc(r[2])}</b><span>${esc(r[3])}</span></div></div>`).join('')
      : empty('bi-search', 'Tidak ditemukan', 'Coba kata kunci lain.');
  },
  pick(i) { const r = Search.res[i]; if (!r) return; Search.close(); new Function(r[4])(); },
  key(e) {
    if (e.key === 'Escape') Search.close();
    else if (e.key === 'ArrowDown') { e.preventDefault(); Search.sel = Math.min(Search.res.length - 1, Search.sel + 1); Search.draw(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); Search.sel = Math.max(0, Search.sel - 1); Search.draw(); }
    else if (e.key === 'Enter') { e.preventDefault(); Search.pick(Search.sel); }
  }
};
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && S.token) { e.preventDefault(); Search.open(); }
  if (e.key === 'Escape') { Search.close(); UI.closeSheet(); }
});

// ════════════════════════════════════════════════════════
// BAGIAN 14: AUTENTIKASI (token di memori + penyimpanan perangkat, BUKAN di URL)
// ════════════════════════════════════════════════════════
const Auth = {
  dirty: false,   // true bila pengguna sudah mengetik di formulir masuk (jangan dirender ulang)
  /** Tampilkan kartu status di area masuk (dipakai renderSetup & renderOffline). */
  card(html) {
    const v = document.getElementById('viewAuth');
    document.getElementById('app').hidden = true; document.getElementById('viewVerify').hidden = true;
    v.hidden = false; v.innerHTML = html; UI.splash(false);
  },
  /** GAS_URL di js/config.js belum diisi. */
  renderSetup() {
    Auth.card(`<div class="auth-card"><div class="auth-logo">${Logo.svg(70)}</div><h1>Alamat Server Belum Diatur</h1>
      <p class="sub">Frontend sudah online, tetapi belum tersambung ke backend Google Apps Script.</p>
      <div class="info-box"><i class="bi bi-gear"></i><div>Buka berkas <b class="mono">js/config.js</b>, isi <b class="mono">GAS_URL</b> dengan URL Web App (berakhiran <span class="mono">/exec</span>), lalu unggah ulang:<br><span class="mono">git add .</span> → <span class="mono">git commit -m "isi GAS_URL"</span> → <span class="mono">git push</span></div></div></div>`);
  },
  /** Data awal gagal dimuat dan belum ada salinan di perangkat. */
  renderOffline(msg) {
    Auth.card(`<div class="auth-card"><div class="auth-logo">${Logo.svg(70)}</div><h1>Server Tidak Terjangkau</h1>
      <p class="sub">${esc(msg || 'Tidak dapat terhubung ke server koperasi.')}</p>
      <button class="btn btn-primary btn-lg btn-block" type="button" onclick="Auth.renderLogin()"><i class="bi bi-arrow-clockwise"></i> Coba Lagi</button>
      <div class="auth-foot">Bila terus gagal, minta Admin memeriksa <b class="mono">GAS_URL</b> di <span class="mono">js/config.js</span> dan deployment Web App (akses: <b>Anyone</b>).</div></div>`);
  },
  renderLogin(err) {
    if (!Api.configured()) return Auth.renderSetup();
    if (!Boot.loaded) {
      UI.splash(true);
      Boot.ensure().then(() => Auth.renderLogin(err), e => Auth.renderOffline(e.message));
      return;
    }
    Verify.clearUrl();
    Auth.dirty = false;
    const k = BOOT.koperasi || {};
    const v = document.getElementById('viewAuth');
    document.getElementById('app').hidden = true; document.getElementById('viewVerify').hidden = true;
    v.hidden = false;
    if (!BOOT.ready) {
      v.innerHTML = `<div class="auth-card"><div class="auth-logo">${Logo.svg(70)}</div><h1>Aplikasi Belum Disiapkan</h1>
        <p class="sub">Admin perlu menjalankan fungsi <b class="mono">setupAppEnvironment()</b> sekali di editor Google Apps Script, lalu membuat <i>New deployment</i>.</p>
        <div class="info-box"><i class="bi bi-info-circle"></i><div>Fungsi tersebut membuat database Google Sheets, folder Google Drive, pengaturan bawaan, dan akun awal secara otomatis.</div></div></div>`;
      return;
    }
    const demo = (BOOT.demo || []).map(d => `<button type="button" class="demo-acc" ${on('Auth.fill', d.username, d.password)}><b>${esc(d.role)}${d.label ? ' · ' + esc(d.label) : ''}</b><span>${esc(d.username)} / ${esc(d.password)}</span></button>`).join('');
    v.innerHTML = `<div class="auth-card">
      <div class="auth-logo">${Logo.html(70)}<span class="verified"><i class="bi bi-patch-check-fill"></i></span></div>
      <div class="salam"><i class="bi bi-moon-stars"></i> Assalamu'alaikum Warahmatullahi Wabarakatuh</div>
      <h1>Masuk ke ${esc(k.aplikasi || 'SIMPEL-KOP')}</h1>
      <p class="sub">Sistem Informasi Simpan Pinjam & Barang —<br>${esc(k.nama || 'Koperasi SMK Islam PB. Soedirman 2')}</p>
      ${err ? `<div class="alert-k err" role="alert"><i class="bi bi-exclamation-circle"></i><div><b>Autentikasi Gagal</b>${esc(err)}</div><button class="x" aria-label="Tutup" onclick="this.parentNode.remove()"><i class="bi bi-x-lg"></i></button></div>` : ''}
      <form id="loginForm" class="form-grid" novalidate onsubmit="Auth.submit(event)" oninput="Auth.dirty=true">
        <div class="fg"><label for="lgUser">Username / NIK <span class="req">*</span></label>
          <div class="inp-group"><span class="addon"><i class="bi bi-person-vcard"></i></span><input id="lgUser" class="inp" name="username" autocomplete="username" required placeholder="mis. AGT-089 atau NIK" data-msg="Username wajib diisi" value="${esc(Store.lget('sk_last_user', ''))}"></div><span class="err-msg"></span></div>
        <div class="fg"><label for="lgPass"><span>Kata Sandi <span class="req">*</span></span><a href="javascript:void(0)" class="xs fw-600" onclick="toast('Silakan hubungi Admin/Bendahara koperasi untuk mengatur ulang sandi Anda.','info','Lupa sandi?')">Lupa sandi? Hubungi Admin</a></label>
          <div class="inp-group"><span class="addon"><i class="bi bi-lock"></i></span><input id="lgPass" class="inp" type="password" name="password" autocomplete="current-password" required placeholder="••••••••" data-msg="Kata sandi wajib diisi">
          <button type="button" class="addon-btn" aria-label="Tampilkan sandi" onclick="const i=document.getElementById('lgPass');i.type=i.type==='password'?'text':'password';this.innerHTML=i.type==='password'?'<i class=&quot;bi bi-eye-slash&quot;></i>':'<i class=&quot;bi bi-eye&quot;></i>'"><i class="bi bi-eye-slash"></i></button></div><span class="err-msg"></span></div>
        <div class="row-between"><label class="check"><input type="checkbox" name="remember" ${Store.lget('sk_remember', true) ? 'checked' : ''}> Ingat sesi perangkat ini</label><span class="xs fw-600 text-primary"><i class="bi bi-shield-check"></i> Sesi Aman</span></div>
        <button class="btn btn-primary btn-lg btn-block" type="submit" id="btnLogin">Masuk Sekarang <i class="bi bi-arrow-right"></i></button>
      </form>
      ${demo ? `<div class="demo-box"><div class="d-head"><i class="bi bi-key"></i><div><b>AKSES UJI COBA</b><div class="xs muted">Ketuk untuk mengisi otomatis</div></div></div><div class="demo-list">${demo}</div></div>` : ''}
      <div class="auth-feats"><div><i class="bi bi-piggy-bank"></i>Simpanan</div><div><i class="bi bi-wallet2"></i>Pembiayaan</div><div><i class="bi bi-shop"></i>Toko Sekolah</div></div>
      <div class="auth-foot"><i class="bi bi-shield-check text-primary"></i> <b>Akad Syariah</b> • Murabahah & Qardh<br>© ${new Date().getFullYear()} ${esc(k.nama || 'Koperasi Konsumen Syariah SMK Islam PB. Soedirman 2')}<br>
      <a href="javascript:void(0)" onclick="Verify.ask()" class="fw-600"><i class="bi bi-qr-code-scan"></i> Verifikasi keaslian dokumen</a></div></div>`;
    UI.splash(false);
    setTimeout(() => { const u = document.getElementById(document.getElementById('lgUser').value ? 'lgPass' : 'lgUser'); if (u && window.innerWidth > 768) u.focus(); }, 50);
  },
  fill(u, p) { document.getElementById('lgUser').value = u; document.getElementById('lgPass').value = p; document.getElementById('btnLogin').focus(); },
  submit(e) {
    e.preventDefault();
    const f = e.target, data = Form.check(f);
    if (!data) return;
    const btn = document.getElementById('btnLogin'); Form.busy(btn, true);
    const remember = !!f.remember.checked;
    Api.login(data.username, data.password, remember).then(res => {
      Form.busy(btn, false);
      if (!res || !res.success) { Auth.renderLogin(res ? res.message : 'Server tidak merespons.'); return; }
      Store.lset('sk_remember', remember); Store.lset('sk_last_user', data.username);
      S.remember = remember; S.token = res.data.token; S.user = res.data.user; S.role = S.user.role;
      Store.set('sk_session', { token: S.token, user: S.user, remember });
      Auth.enter();
      toast('Ahlan wa sahlan, ' + (S.user.nama || S.user.username) + '!', 'success', "Assalamu'alaikum");
    }).catch(err => { Form.busy(btn, false); Auth.renderLogin('Tidak dapat terhubung ke server: ' + (err.message || err)); });
  },
  /** Masuk ke aplikasi: tampilkan dari cache seketika, lalu segarkan dari server di latar. */
  enter() {
    document.getElementById('viewAuth').hidden = true; document.getElementById('viewVerify').hidden = true;
    document.getElementById('app').hidden = false;
    S.hideAmounts = !!Store.lget('sk_hide_amt', false);
    const cached = Store.loadData();
    if (cached && cached.db) {
      S.db = emptyDb(); TABLES.forEach(t => { S.db[t] = cached.db[t] || []; });
      S.settings = cached.settings || {}; S.version = cached.version || '0'; S.loaded = true; derive();
    } else { S.loaded = false; S.settings = Object.assign({}, S.settings); }
    Sync.restore();
    Nav.build();
    const last = Store.get('sk_page_' + S.user.username, null);
    const startPage = last && Pages[last.id] && (!Pages[last.id].roles || Pages[last.id].roles.includes(S.role)) ? last : { id: Nav.home(), params: {} };
    S.history = [];
    Nav.go(startPage.id, startPage.params, { back: true });
    UI.splash(false);
    Sync.chip(); Sync.start();
    Logo.png();
    if (Sync.queue.length) Sync.run();
    callApi('bootstrap').then(res => {
      if (!res.success) { toast(res.message, 'danger', 'Gagal memuat data'); return; }
      if (!Sync.queue.length) loadPayload(res.data);
      Nav.build(); Router.render(); Notif.badge();
      if (S.user.wajibGanti) setTimeout(() => Pages.profil.gantiSandi(true), 400);
    }).catch(err => { if (!err.auth) toast('Mode offline — menampilkan data tersimpan. ' + (err.message || ''), 'warning', 'Koneksi bermasalah'); if (!S.loaded) { S.loaded = true; derive(); Router.render(); } });
  },
  logout() {
    const tok = S.token;
    const finish = () => {
      if (S.user) { Store.del(Store.cacheKey()); Store.del('sk_outbox_' + S.user.username); }
      Store.del('sk_session'); S.token = null; S.user = null; S.role = null; S.loaded = false; S.db = emptyDb(); S.page = null; Sync.queue = [];
      Object.keys(Charts.inst).forEach(k => { Charts.inst[k].destroy(); delete Charts.inst[k]; });
      document.querySelectorAll('.page').forEach(p => { p.innerHTML = ''; p.classList.remove('active'); });
      Auth.renderLogin();
    };
    if (Sync.queue.length) {
      confirmDialog({ title: 'Masih ada data yang belum tersimpan', text: Sync.queue.length + ' transaksi masih dalam antrean sinkronisasi. Keluar sekarang akan membatalkannya.', ok: 'Tetap keluar', danger: true })
        .then(ok => { if (ok) { Api.logout(tok).catch(() => {}); finish(); } });
      return;
    }
    Api.logout(tok).catch(() => {});
    finish();
  },
  expired(msg) {
    if (!S.token) return;
    S.token = null; Store.del('sk_session'); Sync.queue = [];
    Auth.renderLogin(msg || 'Sesi berakhir. Silakan masuk kembali.');
  }
};
UI.splash = show => { const s = document.getElementById('bootSplash'); if (s) s.classList.toggle('hide', !show); };

// ════════════════════════════════════════════════════════
// BAGIAN 15: VERIFIKASI QR DOKUMEN (publik — halaman dibuka dengan ?v=NOMOR~KODE)
// ════════════════════════════════════════════════════════
const Verify = {
  ask() {
    const v = document.getElementById('viewVerify');
    document.getElementById('viewAuth').hidden = true; document.getElementById('app').hidden = true; v.hidden = false;
    v.innerHTML = `<div class="auth-card verify-card"><div class="auth-logo">${Logo.html(70)}</div><h1>Verifikasi Dokumen</h1><p class="sub">Masukkan kode yang tercetak di bawah QR dokumen koperasi (format <span class="mono">NOMOR~KODE</span>).</p>
      <form class="form-grid" onsubmit="event.preventDefault();Verify.run(this.kode.value)"><div class="fg"><label for="vKode">Kode verifikasi</label><input id="vKode" class="inp mono" name="kode" required placeholder="BS/2026/11/0001~A1B2C3D4E5"></div>
      <button class="btn btn-primary btn-lg btn-block">Periksa Keaslian</button></form><div id="vOut" class="mt-3"></div>
      <div class="auth-foot"><a href="javascript:void(0)" onclick="Auth.renderLogin()"><i class="bi bi-arrow-left"></i> Kembali ke halaman masuk</a></div></div>`;
    UI.splash(false);
  },
  run(code) {
    if (document.getElementById('viewVerify').hidden) Verify.ask();
    const out = document.getElementById('vOut');
    out.innerHTML = '<div class="text-center p-3"><span class="spinner"></span> Memeriksa arsip koperasi…</div>';
    Api.verify(code).then(r => {
      const d = r.data || {};
      out.innerHTML = `<div class="verify-status ${r.success ? 'ok' : 'bad'}"><i class="bi ${r.success ? 'bi-patch-check-fill' : 'bi-x-octagon-fill'}"></i><div><b class="font-head" style="font-size:16px">${r.success ? 'Dokumen Asli & Terverifikasi' : 'Tidak Terverifikasi'}</b><div class="small">${esc(r.message)}</div></div></div>
        ${r.success ? `<div class="card-k mt-3"><dl class="kv"><dt>Jenis</dt><dd>${esc(d.jenis)}</dd><dt>Nomor</dt><dd class="mono">${esc(d.no)}</dd><dt>Atas nama</dt><dd>${esc(d.nama)}</dd><dt>Tanggal</dt><dd>${fmtDate(d.tanggal)}</dd>${d.jumlah !== null && d.jumlah !== undefined ? `<dt>Nominal</dt><dd>${fmtRp(d.jumlah)}</dd>` : ''}<dt>Status</dt><dd>${esc(d.status)}</dd></dl><div class="xs muted mt-2">${esc(d.koperasi || '')}</div></div>` : ''}`;
    }).catch(e => { out.innerHTML = `<div class="alert-k err"><i class="bi bi-wifi-off"></i><div>Gagal menghubungi server: ${esc(e.message || e)}</div></div>`; });
  },
  /** Hapus ?v=... dari address bar (agar muat ulang setelah masuk tidak kembali ke verifikasi). */
  clearUrl() {
    try { if (/[?&]v=/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* abaikan */ }
  }
};

// ════════════════════════════════════════════════════════
// BAGIAN 16: DATA AWAL PUBLIK (BOOT) — cache perangkat + segarkan dari server
// Dulu disisipkan server ke HTML; kini diambil lewat GET ?action=boot.
// ════════════════════════════════════════════════════════
const Boot = {
  loaded: false, promise: null, error: null,
  apply(d) { Object.keys(BOOT).forEach(k => { delete BOOT[k]; }); Object.assign(BOOT, d || {}); Boot.loaded = true; try { Logo.favicon(); } catch (e) { /* abaikan */ } },
  /** Tampilkan salinan di perangkat seketika (bila ada), lalu ambil versi terbaru di latar. */
  start() {
    const cached = Store.lget('sk_boot', null);
    if (!Boot.loaded && cached && typeof cached === 'object') Boot.apply(cached);
    Boot.error = null;
    Boot.promise = Api.boot().then(d => {
      const changed = JSON.stringify(d) !== JSON.stringify(cached);
      Boot.apply(d); Store.lset('sk_boot', d);
      if (changed) Boot.changed();
      return BOOT;
    }, e => {
      Boot.error = e;
      if (!Boot.loaded) throw e;   // tanpa cache → tampilkan layar "Server Tidak Terjangkau"
      return BOOT;                 // ada cache → tetap jalan (mode offline)
    });
    return Boot.promise;
  },
  ensure() {
    if (Boot.loaded) return Promise.resolve(BOOT);
    if (!Boot.promise || Boot.error) Boot.start();
    return Boot.promise;
  },
  /** Data publik berubah (mis. Admin mematikan akun uji coba) → perbarui halaman masuk bila belum diisi. */
  changed() {
    try { Logo.refresh(); } catch (e) { /* abaikan */ }
    Boot.cekVersi();
    const v = document.getElementById('viewAuth');
    if (!v || v.hidden || S.token || Auth.dirty) return;
    Auth.renderLogin();
  },
  /** Peringatan bila Kode.gs di server lebih lama dari frontend (penyebab umum fitur baru "tidak tersimpan"). */
  cekVersi() {
    const sv = String(BOOT.version || ''), fe = typeof FE_VERSION === 'string' ? FE_VERSION : '';
    if (!sv || !fe || sv === fe || !S.token || !canWrite() || Boot._warned === sv) return;
    Boot._warned = sv;
    toast('Server masih Kode.gs versi ' + sv + ', aplikasi versi ' + fe + '. Fitur baru bisa gagal tersimpan. Admin: ganti isi Kode.gs lalu Deploy → Manage deployments → Edit → New version.', 'warning', 'Backend perlu diperbarui');
  },
  /** Logo di server berbeda dari yang tampil (diganti di perangkat lain) → ambil data awal terbaru. */
  cekLogo() {
    const id = String((S.settings || {}).LOGO_FILE_ID || ''), now = String((BOOT.koperasi || {}).logoId || '');
    if (!Boot.loaded || id === now || Boot._logoFetch === id) return;
    Boot._logoFetch = id;
    Boot.start().catch(() => { Boot._logoFetch = null; });
  }
};

// ════════════════════════════════════════════════════════
// BAGIAN 17: START-UP
// ════════════════════════════════════════════════════════
function startApp() {
  UI.themeIcon();
  if (!Api.configured()) { Auth.renderSetup(); return; }
  Boot.start().catch(() => { /* ditangani oleh Boot.ensure() di bawah */ });
  const v = new URLSearchParams(location.search).get('v');
  if (v) { Verify.ask(); document.getElementById('vKode').value = v; Verify.run(v); return; }
  const sess = Store.get('sk_session', null, window.localStorage) || Store.get('sk_session', null, window.sessionStorage);
  if (sess && sess.token && sess.user) {
    const go = () => {
      if (!BOOT.ready) return Auth.renderLogin();
      S.token = sess.token; S.user = sess.user; S.role = sess.user.role; S.remember = !!sess.remember;
      Auth.enter();
    };
    if (Boot.loaded) go(); else Boot.ensure().then(go, e => Auth.renderOffline(e.message));
  } else Auth.renderLogin();
}
document.addEventListener('DOMContentLoaded', startApp);

