# SIMPEL-KOP — Frontend (GitHub Pages)

Sistem Informasi Simpan Pinjam & Barang — Koperasi Konsumen Syariah SMK Islam PB. Soedirman 2.
Versi 1.4.1: frontend statis di GitHub Pages, backend Google Apps Script sebagai REST API (JSON).

## Struktur

```
index.html          ← kerangka SPA (semua halaman)
css/style.css       ← desain (emerald/gold/mint, mode gelap, responsif)
js/config.js        ← ⚠️ ISI GAS_URL di sini (URL Web App /exec)
js/api.js           ← lapisan fetch() ke backend (pengganti google.script.run)
js/core.js          ← state, sinkronisasi optimistis, navigasi, login, verifikasi QR
js/pages.js         ← halaman aplikasi, dokumen PDF, impor Excel
PANDUAN-INSTALASI.md
```

Backend (`Kode.gs`, `appsscript.json`) **tidak** disimpan di repository ini — kodenya ditempel di editor Apps Script.

## Kontrak API

| Metode | Body / Query | Keterangan |
|---|---|---|
| GET | `?action=ping` | Cek backend aktif |
| GET | `?action=boot` | Identitas koperasi & akun uji coba (halaman masuk) |
| GET | `?action=verify&code=NOMOR~KODE` | Verifikasi keaslian dokumen (publik) |
| POST | `{"action":"login","username","password","remember"}` | Masuk → token sesi |
| POST | `{"action":"logout","token"}` | Keluar |
| POST | `{"action":"<aksi>","token","payload"}` | Aksi ber-RBAC: `bootstrap`, `sync`, `anggota.simpan`, `anggota.hapus` (admin), `simpanan.simpan`, `pinjaman.ajukan`, `angsuran.bayar`, `dokumen.pdf`, dll. |

POST selalu dikirim dengan `Content-Type: text/plain;charset=utf-8` agar browser tidak mengirim CORS preflight. Token sesi hanya ada di body, tidak pernah di URL.

## Update situs

```bash
git add .
git commit -m "Deskripsi perubahan"
git push
```

Lihat `PANDUAN-INSTALASI.md` untuk langkah lengkap.
