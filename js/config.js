/**
 * ============================================================
 * SIMPEL-KOP — Konfigurasi Frontend
 * ------------------------------------------------------------
 * SATU-SATUNYA file yang WAJIB Anda ubah sebelum upload ke GitHub.
 *
 * GAS_URL : URL Web App dari Google Apps Script (berakhiran /exec).
 *           Didapat dari: Apps Script → Deploy → New deployment → Web app
 *           (Execute as: Me • Who has access: Anyone) → salin "Web app URL".
 *
 * APP_URL : (opsional) alamat publik frontend ini, dipakai sebagai tautan QR
 *           verifikasi di dokumen PDF. Kosongkan → otomatis memakai alamat
 *           halaman saat ini (mis. https://username.github.io/simpel-kop/).
 *           Isi hanya jika memakai domain sendiri.
 * ============================================================
 */
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzukl7fMkopTxnryqgYuGU44_JKgzmZDdm5nZlA1WIrykX_gYcSZv-qwK4KTA-Kt2EY/exec';

const APP_URL = '';

/** Batas waktu satu permintaan ke server (milidetik). PDF & impor bisa butuh waktu lama. */
const API_TIMEOUT_MS = 120000;
