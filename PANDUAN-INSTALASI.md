# SIMPEL-KOP v1.4.8 — Panduan Instalasi (GAS REST API + GitHub Pages)

Arsitektur baru:

```
GitHub Pages (index.html, css/, js/)  ──fetch() JSON──▶  Google Apps Script /exec (Kode.gs)  ──▶  Google Sheets & Drive
```

Tidak ada lagi `Index.html`, `Stylesheet.html`, `JavaScript.html` di Apps Script, dan tidak perlu iframe Blogger.

## Isi paket

| Berkas | Tempat | Fungsi |
|---|---|---|
| `Kode.gs` | Editor Apps Script | Backend REST API (doGet/doPost JSON), seluruh logika bisnis tetap sama |
| `appsscript.json` | Editor Apps Script | Manifest (Asia/Jakarta, V8, Web App: Me + Anyone) |
| `simpel-kop.zip` | Diekstrak → di-push ke GitHub | Frontend: `index.html`, `css/`, `js/`, `README.md`, panduan ini |

---

## TAHAP A — Backend (Google Apps Script)

Pilih **salah satu** jalur.

### A00. Sudah memasang v1.4.7 (update ke v1.4.8 — input data pinjaman lama mulai 1 Januari 2025)

1. Ganti seluruh isi `Kode.gs` → **Manage deployments → ✏️ Edit → New version → Deploy**.
2. Ganti berkas frontend (kecuali `js/config.js`), lalu `git add .` → `git commit -m "v1.4.8"` → `git push`.
3. Tidak perlu menjalankan setup ulang. Pengaturan baru `TGL_MULAI_PINJAMAN` (bawaan `2025-01-01`) langsung berlaku dan bisa diubah di **Pengaturan → Pembiayaan**.

**Cara memasukkan pinjaman lama (Admin/Bendahara):**
1. **Pinjaman → Pengajuan baru** → isi **Tanggal pengajuan** (mis. 2025-03-10), anggota, jenis, nominal/barang, tenor → Kirim.
   Tanggal lampau dianggap data lama: stok barang & aturan "satu pinjaman sejenis aktif" tidak diperiksa, email tidak dikirim. Nomor pengajuan ikut tahun/bulan tanggal tersebut (mis. `PJ-U/2025/03/001`).
2. Buka detail pinjaman → isi **Tanggal akad / pencairan** (tidak boleh sebelum tanggal pengajuan) → muncul isian **Cicilan yang sudah dibayar** (otomatis = jumlah cicilan yang sudah jatuh tempo; ubah bila ada yang belum dibayar) dan, untuk barang, centang **Kurangi stok** hanya bila barang belum diserahkan.
3. **Setujui & Cairkan** → jadwal angsuran dibuat dari tanggal pencairan; cicilan yang sudah dibayar dicatat lunas dengan kwitansi per tanggal jatuh tempo. Bila semua cicilan sudah dibayar, status langsung **LUNAS**. Cicilan lama yang tidak dicatat dibayar akan tampil sebagai tunggakan.

### A0. Sudah memasang v1.4.0 – v1.4.6 (update ke v1.4.7 — hapus anggota, tenor 3–20 bln, bunga 10%/20%, potong gaji otomatis tgl 25, unggah logo)

1. Ganti seluruh isi `Kode.gs` di editor Apps Script → **Manage deployments → ✏️ Edit → New version → Deploy**.
2. Ganti berkas frontend di folder repo dengan isi ZIP baru (**jangan** timpa `js/config.js` Anda — atau isi ulang `GAS_URL`), lalu:
   `git add .` → `git commit -m "v1.4.7"` → `git push`.
3. Tenor 3–20 bulan, bunga 10% (uang) / 20% (barang), dan potong gaji tanggal 25 **langsung berlaku** setelah backend di-deploy — tidak perlu mengubah apa pun di Pengaturan. Baris lama `TENOR_UANG`, `TENOR_BARANG`, `BUNGA_UANG`, `BUNGA_BARANG`, `TGL_JATUH_TEMPO` di sheet Pengaturan tidak dipakai lagi dan boleh dihapus.

### A1. Sudah memakai SIMPEL-KOP v1.3.0 (data lama tetap dipakai)

1. Buka proyek Apps Script SIMPEL-KOP yang sudah ada.
2. Ganti **seluruh** isi `Kode.gs` dengan `Kode.gs` versi baru.
3. Hapus berkas `Index`, `Stylesheet`, dan `JavaScript` (klik ⋮ di samping nama berkas → **Delete**). Ketiganya tidak dipakai lagi.
4. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.**
   URL `/exec` tetap sama. Spreadsheet, folder Drive, akun, dan semua transaksi **tidak berubah** (ID-nya tersimpan di Script Properties).
5. **Tidak perlu** menjalankan `setupAppEnvironment` lagi.

### A2. Instalasi baru

1. Buka https://script.google.com → **Proyek baru** → beri nama `SIMPEL-KOP`.
2. **Project Settings** (⚙️) → centang *Show "appsscript.json" manifest file in editor* → buka `appsscript.json`, ganti isinya dengan berkas dari paket ini.
3. Ganti isi `Code.gs` dengan `Kode.gs`, lalu rename menjadi **Kode**.
4. Pilih fungsi **`setupAppEnvironment`** → **▶ Run** → izinkan akses (Authorization). Lihat *Execution log* untuk tautan Spreadsheet & Folder Drive.
5. Pilih fungsi **`setupTriggers`** → **▶ Run** (pengingat harian 06.00 WIB & cadangan mingguan).
6. **Deploy → New deployment** → ⚙️ tipe **Web app**:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone** ← wajib persis ini. *"Anyone with Google account"* akan membuat frontend gagal terhubung.
7. **Deploy** → salin **Web app URL** (berakhiran `/exec`).

### Cek backend

Buka URL `/exec` di browser. Harus tampil JSON seperti:

```json
{"success":true,"data":{"app":"SIMPEL-KOP","version":"1.4.7","ready":true,...},"message":"pong"}
```

Jika `"version"` bukan `1.4.7` atau yang tampil halaman aplikasi lama, berarti versi baru belum di-deploy (ulangi langkah Deploy → New version).

> **Setiap kali `Kode.gs` diubah:** Manage deployments → ✏️ Edit → **New version** → Deploy. Jangan membuat *New deployment* — itu menghasilkan URL baru dan `js/config.js` harus diubah lagi.

---

## TAHAP B — Isi `js/config.js` (WAJIB sebelum push)

1. Ekstrak `simpel-kop.zip`. Hasilnya folder **`simpel-kop`** yang langsung berisi `index.html`, `css/`, `js/`.
2. Buka `simpel-kop/js/config.js` dengan editor teks (Kate / gedit / Notepad).
3. Ganti baris:

   ```js
   const GAS_URL = 'https://script.google.com/macros/s/PASTE_ID_DEPLOYMENT_DI_SINI/exec';
   ```

   dengan URL `/exec` Anda dari Tahap A. Simpan.

`APP_URL` biarkan kosong — tautan QR otomatis memakai alamat GitHub Pages Anda.

---

## TAHAP C — Upload ke GitHub Pages (lewat terminal)

> Jangan memakai tombol "Upload files" di web GitHub — struktur folder `css/` dan `js/` akan rusak.

### C1. Persiapan (sekali saja)

```bash
git --version
```

Bila belum ada: Bazzite → `brew install git` · Ubuntu/Debian → `sudo apt install git` · Windows → https://git-scm.com/download/win · Mac → ikuti tawaran instalasi otomatis.

```bash
git config --global user.name "Nama Anda"
git config --global user.email "email-akun-github@contoh.com"
```

### C2. Buat repository di GitHub

github.com → **+** → **New repository** → nama: `simpel-kop` → **Public** → **jangan** centang README/.gitignore/license → **Create repository**.

### C3. Masuk ke folder yang BENAR

Folder kerja = folder **`simpel-kop`** hasil ekstraksi (yang langsung berisi `index.html`). Jangan naik satu level, jangan masuk ke `css/` atau `js/`.

```bash
cd ~/Downloads/simpel-kop
ls -la
```

Windows (PowerShell): `cd "$HOME\Downloads\simpel-kop"` lalu `dir`.

**Gerbang wajib:** baris yang muncul harus memuat `index.html`, `css`, `js`. Kalau yang terlihat justru folder `simpel-kop` lagi, jalankan `cd simpel-kop` dulu. Tidak boleh ada `Kode.gs` di folder ini.

### C4. Push pertama — satu per satu

```bash
git init
git add .
git commit -m "SIMPEL-KOP v1.4.7 frontend"
git branch -M main
git remote add origin https://github.com/USERNAME/simpel-kop.git
git push -u origin main
```

Saat `git push` diminta:
- **Username:** username GitHub
- **Password:** **Personal Access Token**, bukan sandi akun. Buat di https://github.com/settings/tokens → *Generate new token (classic)* → centang **repo** → salin token `ghp_...` (hanya tampil sekali).
- Saat menempel token, layar **tidak menampilkan apa pun** — itu normal. Tempel lalu Enter. (Konsole: Ctrl+Shift+V.)

Berhasil bila muncul `Writing objects: 100%` dan `* [new branch] main -> main`.

### C5. Aktifkan Pages

Repo → **Settings** → **Pages** → Source: **Deploy from a branch** → Branch: **main** · **/ (root)** → **Save**. Centang **Enforce HTTPS**.
Tunggu 1–2 menit → muncul *"Your site is live at https://USERNAME.github.io/simpel-kop/"*.

### C6. Update berikutnya

```bash
git add .
git commit -m "Deskripsi perubahan"
git push
```

Jika tampilan masih lama: **Ctrl+Shift+R** atau buka jendela Incognito.

---

## TAHAP D — Uji

1. Buka `https://USERNAME.github.io/simpel-kop/` → halaman masuk tampil dengan nama koperasi.
2. Masuk (akun uji: `bendahara` / `bendahara123`) → dashboard & data tampil, chip kanan atas **Tersinkron**.
3. Catat satu biaya operasional → buka Spreadsheet → baris baru ada di sheet `Biaya_Operasional`.
4. Buat dokumen (mis. bukti simpanan) → **Unduh PDF** → pindai QR-nya dengan HP → terbuka halaman verifikasi GitHub Pages: **Dokumen Asli & Terverifikasi**.
5. F12 → tab Console: tidak ada error merah tentang CORS.

## Sebelum dipakai resmi (WAJIB — situs kini publik)

Halaman masuk di GitHub Pages bisa dibuka siapa saja, jadi akun uji coba harus dimatikan:

1. Masuk sebagai **admin** → **Pengaturan → Identitas & KOP** → **unggah logo koperasi**, isi penandatangan & email bendahara → **matikan "Tampilkan akun uji coba"**.
2. Jalankan fungsi **`kosongkanDataDemo`** dari editor Apps Script (hapus seluruh data demo termasuk stok & biaya; akun `admin` tetap). Bila hanya ingin mengosongkan anggota, cukup pakai tombol **Hapus Semua** di menu Data Anggota.
3. **Ganti sandi `admin`** (menu akun → Ganti Kata Sandi), lalu buat akun Bendahara/Pengawas di **Pengaturan → Pengguna & Peran**.
4. Isi **Pengaturan → Simpanan & Modal → Saldo kas awal** sesuai kas riil.

Alamat `GAS_URL` di repository publik tidak berbahaya: setiap aksi data membutuhkan token sesi, login dibatasi 5 kali gagal per 10 menit, dan hak akses dicek di server.

## Bunga & margin pinjaman (total, flat tiap bulan)

| Jenis | Bunga/margin | Contoh |
|---|---|---|
| Pinjaman uang | **10% dari besar pinjaman** | Rp 5.000.000 → bunga Rp 500.000, total Rp 5.500.000 |
| Pinjaman barang | **20% dari harga pembelian barang** | Barang Rp 8.000.000 → margin Rp 1.600.000, total Rp 9.600.000 |

Bunga dihitung **sekali untuk seluruh akad** — tenor panjang atau pendek, total bunganya sama. Angsuran = (pokok + bunga) ÷ tenor, **sama besar setiap bulan**:

| Pinjaman uang Rp 5.000.000 | 3 bln | 5 bln | 10 bln | 20 bln |
|---|---|---|---|---|
| Total bunga | Rp 500.000 | Rp 500.000 | Rp 500.000 | Rp 500.000 |
| Angsuran / bulan | Rp 1.833.333* | Rp 1.100.000 | Rp 550.000 | Rp 275.000 |

\*Selisih pembulatan masuk ke cicilan terakhir, sehingga jumlah seluruh cicilan tepat Rp 5.500.000.

- Ubah persentasenya di **Pengaturan → Margin & Pembiayaan** (*Bunga koperasi (total)* dan *Margin toko (total)*, 0–100%).
- Hanya berlaku untuk **pengajuan baru**. Akad lama tetap dengan angka yang sudah disepakati; tampilannya otomatis disesuaikan (mis. akad lama 1%/bln × 10 bln tampil sebagai "10% total").
- Kolom `Bunga_Persen` di sheet pinjaman: untuk akad baru berarti **persen total**. Angka rupiah yang mengikat tetap `Total_Bunga`.
- **Pelunasan dipercepat:** bila *Diskon margin pada pelunasan dipercepat* aktif (bawaan), bunga cicilan yang belum jatuh tempo dibebaskan. Matikan sakelar itu bila anggota yang melunasi lebih cepat tetap harus membayar bunga penuh 10%/20%.

## Logo koperasi (unggah di menu Identitas)

**Pengaturan → Identitas & KOP → kartu Logo Koperasi** (khusus Admin):

- **Unggah Logo** → pilih gambar PNG, JPG, WebP, atau SVG (maks. 5 MB). Gambar otomatis diperkecil di browser menjadi maks. 256 piksel (rasio tetap) sebelum dikirim, jadi hemat kuota dan cepat tampil.
- Logo langsung berganti di halaman masuk, menu samping, bilah atas, **ikon tab browser**, dan **KOP semua dokumen PDF** (bukti setoran, kwitansi, surat perjanjian, kartu anggota).
- File disimpan di folder aplikasi di Google Drive (`Logo Koperasi YYYY-MM-DD.png`); logo lama otomatis dipindah ke Sampah Drive. Logo dikirim ke aplikasi sebagai data gambar, jadi **tidak perlu mengatur izin berbagi Drive**.
- **Gunakan logo bawaan** → kembali ke logo khatam bawaan aplikasi.
- Tips: pakai PNG berlatar transparan agar rapi di mode terang maupun gelap.
- Kolom lama *URL logo* sudah diganti fitur unggah ini.
- Perangkat lain yang sedang membuka aplikasi ikut berganti logo pada sinkronisasi berikutnya, atau saat aplikasi dibuka ulang.
- **Logo tidak berganti / muncul "Logo tidak tersimpan"?** Hampir selalu karena `Kode.gs` di server belum versi terbaru. Admin akan melihat peringatan **"Backend perlu diperbarui"** bila versi server dan aplikasi berbeda — ganti isi `Kode.gs` lalu **Manage deployments → ✏️ Edit → New version → Deploy**, kemudian tekan **Ctrl+Shift+R** di browser.

## Pembayaran angsuran: dipotong gaji setiap tanggal 25

Angsuran pinjaman uang maupun pembelian barang **dipotong dari gaji setiap tanggal 25**. Tanggal ini sekaligus menjadi tanggal jatuh tempo di jadwal angsuran: cicilan pertama jatuh pada tanggal 25 bulan berikutnya setelah pencairan/serah terima, lalu setiap tanggal 25 sesudahnya.

- Tampil di formulir pengajuan, persetujuan akad, Surat Perjanjian Pasal 3 (uang & barang), detail pinjaman, halaman anggota, dashboard, dan email pengingat.
- Ubah di **Pengaturan → Margin & Pembiayaan → Tanggal potong gaji (angsuran)** (1–28).
- Berlaku untuk **pinjaman yang dicairkan setelah update**. Jadwal pinjaman yang sudah berjalan tetap memakai tanggal lamanya.

### Angsuran terpotong otomatis setiap tanggal 25

Setiap tanggal 25 pukul 06.00, sistem otomatis mencatat **cicilan bulan itu** dari semua pinjaman uang dan pembelian barang yang sedang berjalan sebagai **terbayar lewat potong gaji**:

- kwitansi resmi terbit (metode: *Potong gaji*, dicatat oleh "Potong gaji otomatis"), **sisa tagihan berkurang**, dan pinjaman otomatis **LUNAS** bila itu cicilan terakhir;
- anggota menerima email rincian potongan & sisa tagihan; Bendahara menerima ringkasan (isi *Email bendahara* di Pengaturan → Identitas & KOP) untuk dicocokkan dengan potongan gaji dari bagian keuangan sekolah;
- **tunggakan bulan-bulan sebelumnya tidak ikut dipotong** — tetap muncul di *Monitoring Tunggakan* dan ditagih lewat Loket;
- hanya sekali per bulan; bila trigger sempat terlewat (mis. server Google gangguan), dikejar keesokan harinya dengan tanggal bayar tetap tanggal 25;
- **berlaku mulai tanggal 25 berikutnya** setelah fitur aktif. Jika update dipasang sesudah tanggal 25, bulan itu tidak dipotong otomatis (bisa diproses manual).

**Syarat:** trigger harian harus terpasang (jalur A2 langkah 5: jalankan `setupTriggers` sekali; instalasi lama yang sudah punya trigger tidak perlu apa-apa).

**Proses manual** (mis. gaji cair lebih awal): Admin/Bendahara → **Angsuran & Loket → tombol "Potong Gaji Tgl 25"** → lihat daftar cicilan bulan ini → **Proses Sekarang**. Setelah diproses (manual atau otomatis), bulan itu tidak akan dipotong dua kali.

**Mematikan:** Pengaturan → Margin & Pembiayaan → sakelar *Potong gaji otomatis setiap tanggal 25*.

## Tenor pinjaman (3–20 bulan)

Tenor kini berupa **rentang**, bukan daftar pilihan tetap. Bawaan untuk pinjaman uang dan barang: **minimal 3, maksimal 20 bulan** — pemohon bisa memilih setiap bulan di antaranya (3, 4, 5 … 20; total 18 pilihan, bawaan terpilih 10 bulan).

- Ubah di **Pengaturan → Margin & Pembiayaan → Tenor yang diizinkan** (kolom *Tenor minimal* dan *Tenor maksimal*, terpisah untuk uang dan barang), lalu **Simpan Semua Perubahan**.
- Server menolak tenor di luar rentang, pecahan bulan, atau minimal yang lebih besar dari maksimal — aturan ini tidak bisa dilewati dari browser.
- Perubahan hanya berlaku untuk **pengajuan baru**; akad yang sudah berjalan tidak berubah.

## Menghapus data anggota (khusus Admin)

Menu **Data Anggota** (hanya terlihat oleh peran Admin; Bendahara & Pengawas tidak bisa, server juga menolaknya):

| Cara | Langkah |
|---|---|
| Satu anggota | Ikon 🗑 di baris tabel, atau tombol **Hapus** di halaman detail anggota |
| Beberapa sekaligus | Centang kotak di kiri baris (atau kotak di judul kolom untuk satu halaman tabel) → bilah merah muncul → **Pilih semua hasil filter** bila perlu → **Hapus terpilih** |
| Semua anggota | Tombol **Hapus Semua** di kanan atas → ketik `HAPUS SEMUA` |

Aturan pengamanan:

- Anggota **tanpa transaksi** langsung bisa dihapus.
- Anggota **yang punya riwayat transaksi** (simpanan, pinjaman, pembayaran) **dilewati**, kecuali Admin mencentang *"Hapus juga seluruh riwayat transaksinya"* dan mengetik `HAPUS`. Dialog menampilkan jumlah simpanan, pinjaman yang masih aktif, dan sisa tagihannya sebelum dikonfirmasi.
- Sebelum riwayat transaksi dihapus (dan selalu untuk *Hapus Semua*), spreadsheet **dicadangkan otomatis** ke folder Cadangan di Drive. Untuk memulihkan: buka salinan cadangan terbaru → salin sheet yang dibutuhkan.
- Ikut terhapus: akun login peran *anggota*, arsip dokumennya, folder berkas Drive & PDF arsip (dipindah ke **Sampah Drive**, bisa dipulihkan ±30 hari).
- Tidak terpengaruh: stok & mutasi barang, biaya operasional, pengaturan, akun staf, log aktivitas. Penomoran dokumen **tidak diulang dari awal**, supaya QR dokumen lama tidak pernah cocok dengan data baru.
- Setiap penghapusan tercatat di **Log Aktivitas** (`ANGGOTA_HAPUS` / `ANGGOTA_HAPUS_SEMUA`) lengkap dengan ID dan nama.

> Untuk anggota yang keluar/purnabakti, praktik koperasi yang lazim adalah **Edit → Status: Nonaktif**, bukan hapus — riwayat simpanan & laporan tetap utuh.

## Yang berubah dari v1.3.0

| Hal | v1.3.0 | v1.4.x |
|---|---|---|
| Tampilan | Disajikan HtmlService (iframe Google) | GitHub Pages, tanpa iframe |
| Komunikasi | `google.script.run` | `fetch()` ke `/exec`, JSON |
| Data halaman masuk | Disisipkan ke HTML | `GET ?action=boot`, dicache di perangkat |
| Tautan QR dokumen baru | `…/exec?v=KODE` | `https://USERNAME.github.io/simpel-kop/?v=KODE` |
| QR dokumen lama | — | Tetap bisa dicek: `/exec?v=…` membalas teks hasil verifikasi |
| Logika bisnis, RBAC, sesi, cache, Sheets | — | **Tidak berubah** |

Catatan: sesi & data tersimpan di perangkat terikat ke alamat situs, jadi semua pengguna perlu **masuk ulang sekali** di alamat GitHub Pages. Embed Blogger tidak diperlukan lagi — cukup bagikan tautan GitHub Pages.

## Troubleshooting

| Yang terlihat | Penyebab | Solusi |
|---|---|---|
| "Alamat Server Belum Diatur" | `GAS_URL` di `js/config.js` belum diisi | Isi, lalu `git add .` → `git commit -m "isi GAS_URL"` → `git push` |
| "Server Tidak Terjangkau" / "Tidak dapat terhubung ke server" | URL salah, atau akses deployment bukan **Anyone** | Cek URL berakhiran `/exec`; Manage deployments → Edit → Who has access: **Anyone** |
| "Respons server bukan JSON" | Kode.gs lama masih ter-deploy | Manage deployments → Edit → **New version** → Deploy |
| "Aplikasi Belum Disiapkan" | `setupAppEnvironment` belum dijalankan | Jalankan sekali dari editor (jalur A2) |
| Situs 404 | `git init` dijalankan di folder yang salah | Pastikan `index.html` terlihat di halaman repo GitHub; ulangi dari folder `simpel-kop` dengan `git push -u origin main --force` |
| Tampil tanpa warna/ikon (CSS 404) | File diunggah lewat web, folder `css/` `js/` hilang | Push ulang dari terminal |
| `Password authentication is not supported` | Memakai sandi akun GitHub | Pakai Personal Access Token |
| Tampilan lama setelah push | Cache browser | Ctrl+Shift+R / Incognito |

Berkas `SIMPEL-KOP-Demo.html` dari paket lama tetap bisa dibuka langsung di browser sebagai demo luring; tidak perlu diunggah.
