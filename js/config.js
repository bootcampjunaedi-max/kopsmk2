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
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwZe8oERqTpRx8EReMNdWYCt1bHd6_JHy1fFjRftUSbian5shPcEF0zII49yh46PM7c/exec';

const APP_URL = '';

/** Batas waktu satu permintaan ke server (milidetik). PDF & impor bisa butuh waktu lama. */
const API_TIMEOUT_MS = 120000;
