/**
 * ============================================================
 * SIMPEL-KOP — Lapisan komunikasi ke backend (GAS REST API)
 * ------------------------------------------------------------
 * Menggantikan google.script.run. Semua panggilan memakai fetch():
 *  • GET  ?action=boot | verify        → data publik (tanpa token)
 *  • POST {action, token, payload}      → aksi ber-sesi (token di BODY, bukan di URL)
 * POST WAJIB memakai Content-Type text/plain;charset=utf-8 → "simple request",
 * sehingga browser tidak mengirim CORS preflight (OPTIONS) yang tidak didukung GAS.
 *
 * Kontrak hasil:
 *  • resolve(objek JSON server)  → server menjawab (success true/false)
 *  • reject(Error)               → jaringan putus / timeout / respons bukan JSON
 *    (antrean Sync akan mencoba ulang; aksi tulis aman karena memakai reqId idempoten)
 * ============================================================
 */
'use strict';

const Api = {
  /** GAS_URL sudah diisi dengan alamat yang tampak valid? */
  configured() {
    return typeof GAS_URL === 'string' && /^https?:\/\/\S+$/.test(GAS_URL.trim()) && !/PASTE_|XXXX/i.test(GAS_URL);
  },

  /** Alamat publik frontend (untuk tautan QR verifikasi pada dokumen). */
  appUrl() {
    const fixed = typeof APP_URL === 'string' ? APP_URL.trim() : '';
    const u = fixed || location.href.split('#')[0].split('?')[0];
    return u.replace(/index\.html$/i, '');
  },

  err(message, code) { const e = new Error(message); e.code = code; return e; },

  /** Permintaan dasar ke /exec. */
  async request(method, query, body) {
    if (!Api.configured()) throw Api.err('Alamat server (GAS_URL) belum diisi di js/config.js.', 'CONFIG');
    let url = GAS_URL.trim();
    if (query) url += (url.indexOf('?') >= 0 ? '&' : '?') + new URLSearchParams(query).toString();
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), (typeof API_TIMEOUT_MS === 'number' && API_TIMEOUT_MS) || 120000) : null;
    let res, text;
    try {
      const opt = { method: method, redirect: 'follow', cache: 'no-store', signal: ctrl ? ctrl.signal : undefined };
      if (body !== undefined) {
        opt.headers = { 'Content-Type': 'text/plain;charset=utf-8' };   // ⚠️ jangan diganti application/json
        opt.body = JSON.stringify(body);
      }
      res = await fetch(url, opt);
      text = await res.text();
    } catch (e) {
      if (e && e.name === 'AbortError') throw Api.err('Server terlalu lama merespons (batas waktu habis). Silakan coba lagi.', 'TIMEOUT');
      if (typeof navigator !== 'undefined' && navigator.onLine === false) throw Api.err('Perangkat sedang offline. Periksa koneksi internet.', 'OFFLINE');
      throw Api.err('Tidak dapat terhubung ke server. Periksa GAS_URL di js/config.js dan pastikan Web App di-deploy dengan akses "Anyone".', 'NETWORK');
    } finally {
      if (timer) clearTimeout(timer);
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      throw Api.err('Respons server bukan JSON (HTTP ' + res.status + '). Pastikan Kode.gs versi REST API sudah di-deploy ulang (Manage deployments → Edit → New version).', 'BAD_RESPONSE');
    }
  },

  get(action, params) { return Api.request('GET', Object.assign({ action: action }, params || {})); },
  post(action, fields) { return Api.request('POST', null, Object.assign({ action: action }, fields || {})); },

  // ── Endpoint publik ──
  /** Identitas koperasi + akun uji coba untuk halaman masuk. */
  boot() {
    return Api.get('boot').then(r => {
      if (!r || !r.success) throw Api.err((r && r.message) || 'Gagal memuat data awal dari server.', 'SERVER');
      return r.data || {};
    });
  },
  verify(code) { return Api.get('verify', { code: String(code || '').trim() }); },

  // ── Sesi ──
  login(username, password, remember) { return Api.post('login', { username: username, password: password, remember: !!remember }); },
  logout(token) { return Api.post('logout', { token: token }); },

  /** Aksi ber-RBAC: 'bootstrap', 'sync', 'anggota.simpan', 'dokumen.pdf', dst. */
  call(token, action, payload) { return Api.post(action, { token: token, payload: payload || {} }); }
};
