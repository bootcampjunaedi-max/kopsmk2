/**
 * ============================================================
 * SIMPEL-KOP — Halaman aplikasi, dokumen PDF & impor Excel (js/pages.js)
 * Bergantung pada js/core.js (state S, Api, Sync, UI, Pages, dll.) — muat SETELAH core.js.
 * ============================================================
 */
'use strict';
// ════════════════════════════════════════════════════════
// HALAMAN: DASHBOARD OPERASIONAL (staf)
// ════════════════════════════════════════════════════════
Pages.dashboard = {
  title: 'Dashboard', roles: ['admin', 'bendahara', 'pengawas'],
  render(el) {
    const t = T(), mk = monthKey(t), sp = D.simpananTotal;
    const aktif = S.db.anggota.filter(a => a.Status === 'aktif');
    const baru = aktif.filter(a => monthKey(a.Tgl_Bergabung) === mk).length;
    const nU = D.berjalan.filter(l => l.Jenis === 'uang').length, nB = D.berjalan.length - nU;
    const sisa = D.sisaPokok.uang + D.sisaPokok.barang;
    const dueAmt = sum(D.dueMonth, 'sisa');
    const dueTotal = sum(D.dueMonth, r => r.row.Total) + sum(S.db.angsuran.filter(r => monthKey(r.Jatuh_Tempo) === mk && Calc.sisaRow(r) === 0), 'Total');
    const tungAmt = sum(D.tunggakan, 'total');
    const kol = Rep.kolektibilitas();
    const M = Rep.monthly(6);
    const growth = M[4].saldo ? (M[5].saldo - M[4].saldo) / M[4].saldo * 100 : 0;
    const lr = Rep.labaRugi(addDays(t, -30), t);
    const q = Math.floor((+t.slice(5, 7) - 1) / 3) + 1;
    const nama = (S.user.nama || '').split(',')[0];
    const lunasTh = S.db.pinjaman.filter(l => l.Status === 'lunas').length;
    const pipe = [['01. Pengajuan', D.pending.length, 'Formulir masuk', "Pages.pinjaman.tab('menunggu')"], ['02. Persetujuan', D.approved.length, 'Siap akad & cair', "Pages.pinjaman.tab('disetujui')"],
      ['03. Akad Berjalan', D.berjalan.length, 'Potong gaji tgl ' + tglPotong(), "Pages.pinjaman.tab('berjalan')"], ['04. Menunggak', D.tunggakan.length, 'Perlu tindak lanjut', "Pages.angsuran.tab('tunggakan')"], ['05. Lunas', lunasTh, 'Sertifikat bebas', "Pages.pinjaman.tab('lunas')"]];
    const maxPipe = Math.max(1, ...pipe.map(p => p[1]));
    const ins = [];
    ins.push(`Simpanan anggota ${growth >= 0 ? 'tumbuh' : 'turun'} <b>${Math.abs(growth).toFixed(1).replace('.', ',')}%</b> dibanding bulan lalu menjadi <b>${fmtRp(sp.total)}</b>.`);
    ins.push(kol.debitur ? `Rasio kelancaran <b>${kol.lancar.toFixed(1).replace('.', ',')}%</b> (NPL ${kol.npl.toFixed(1).replace('.', ',')}%); ${kol.debitur} debitur menunggak senilai <b>${fmtRp(tungAmt)}</b> — prioritaskan musyawarah & pengingat.` : 'Seluruh pembiayaan berjalan <b>lancar</b> — tidak ada tunggakan. Alhamdulillah.');
    if (D.dueMonth.length) ins.push(`<b>${D.dueMonth.length} tagihan</b> jatuh tempo bulan ini senilai ${fmtRp(dueAmt)} belum terbayar (realisasi ${pct(dueTotal - dueAmt, dueTotal)}% dari target).`);
    if (D.pending.length) { const oldest = daysBetween(D.pending[0].Tgl_Pengajuan, t); ins.push(`${D.pending.length} pengajuan menunggu sidang komite (${fmtRp(sum(D.pending, 'Pokok'))}); terlama sudah <b>${oldest} hari</b>.`); }
    if (D.lowStock.length) ins.push(`Stok menipis: ${D.lowStock.slice(0, 3).map(b => esc(b.Nama.split(' ').slice(0, 3).join(' '))).join(', ')}${D.lowStock.length > 3 ? ' dan lainnya' : ''} — siapkan PO restock.`);
    ins.push(`Laba bersih 30 hari terakhir <b>${fmtRp(lr.laba)}</b> (pendapatan ${fmtRp(lr.pendapatan)}, beban ${fmtRp(lr.beban)}).`);
    const actions = canWrite() ? `<button class="btn btn-primary" onclick="Pages.simpanan.kasir()"><i class="bi bi-plus-circle"></i> Setoran Kas</button>
      <button class="btn btn-outline" ${on('Nav.go', 'pinjaman-form')}><i class="bi bi-file-earmark-plus"></i> Pinjaman Baru</button>
      <button class="btn btn-outline" ${on('Nav.go', 'angsuran')}><i class="bi bi-bank"></i> Angsuran Masuk</button>
      <button class="btn btn-gold" onclick="Pages.anggota.form()"><i class="bi bi-person-plus"></i> Anggota Baru</button>` : '';
    el.innerHTML = pageHead({ eyebrow: `<i class="bi bi-circle-fill" style="font-size:7px;vertical-align:2px"></i> Konsolidasi Operasional • Q${q} ${t.slice(0, 4)}`, title: 'Dashboard Operasional',
      desc: `Assalamu'alaikum, ${esc(nama)}. ${UI.salam()} — pantauan perputaran kas, portofolio pembiayaan syariah, dan antrean verifikasi harian koperasi.`, actions }) + `
      <div class="card-k mb-3"><div class="card-head"><div><h3><i class="bi bi-diagram-3"></i> Alur Siklus Pembiayaan Syariah</h3><p>Standar prosedur transparan & berbasis musyawarah — ketuk tahap untuk membuka daftar</p></div>${badge(pipe.reduce((s, p) => s + p[1], 0) + ' berkas', 'b-blue')}</div>
        <div class="pipeline">${pipe.map((p, i) => `<div class="pipe ${i === 0 && p[1] ? 'cur' : ''}" role="button" tabindex="0" onclick="${esc(p[3])}"><small>${p[0]}</small><b>${p[1]}</b><span>${p[2]}</span>${progress(p[1] / maxPipe * 100, i === 0 ? '' : '')}</div>`).join('')}</div></div>
      <div class="grid g-kpi five mb-3">
        ${kpi({ label: 'Anggota Aktif', value: aktif.length + ' <small>orang</small>', icon: 'bi-people', sub: badge('+' + baru + ' bulan ini', 'b-green') + ` <span>${S.db.anggota.length - aktif.length} nonaktif</span>`, onclick: "Nav.go('anggota')" })}
        <div class="hero khatam-bg" role="button" tabindex="0" onclick="Nav.go('simpanan')"><span class="khatam-star"></span><div class="row-between"><span class="eyebrow">Total Simpanan Terhimpun</span>${badge(fmtMonthLong(mk), 'b-solid')}</div>
          <div class="hero-amount">${rp(sp.total)}</div><div class="small muted">${growth >= 0 ? '▲' : '▼'} ${Math.abs(growth).toFixed(1).replace('.', ',')}% MoM</div>
          <div class="hero-split"><div><span>Pokok</span><b>${fmtJt(sp.pokok)}</b></div><div><span>Wajib</span><b>${fmtJt(sp.wajib)}</b></div><div><span>Sukarela</span><b>${fmtJt(sp.sukarela)}</b></div></div></div>
        ${kpi({ label: 'Pembiayaan Berjalan', value: rp(sisa), icon: 'bi-wallet2', sub: `<span>${nU} uang 1%</span> • <span>${nB} barang 2%</span>`, onclick: "Pages.pinjaman.tab('berjalan')" })}
        ${kpi({ label: 'Jatuh Tempo Bulan Ini', value: D.dueMonth.length + ' <small>tagihan</small>', icon: 'bi-calendar-event', tone: 'blue', sub: `Est. ${fmtRp(dueAmt)}`, onclick: "Nav.go('angsuran')" })}
        ${kpi({ label: 'Tunggakan & Restock', value: D.tunggakan.length + ' <small>debitur</small>', icon: 'bi-exclamation-triangle', tone: 'red', sub: badge(fmtRp(tungAmt), 'b-red') + ' ' + badge(D.lowStock.length + ' SKU menipis', 'b-amber'), onclick: "Pages.angsuran.tab('tunggakan')" })}
      </div>
      <div class="grid g-2-lg mb-3">
        <div class="card-k"><div class="card-head"><div><h3><i class="bi bi-bar-chart"></i> Pertumbuhan Simpanan per Bulan</h3><p>Saldo akumulasi pokok, wajib & sukarela</p></div><div class="text-end"><b class="font-head text-primary">${fmtJt(sp.total)}</b><div class="xs ${growth >= 0 ? 'text-success' : 'text-danger'}">${growth >= 0 ? '+' : ''}${growth.toFixed(1).replace('.', ',')}% MoM</div></div></div><div class="chart-box"><canvas id="chSimp" aria-label="Grafik pertumbuhan simpanan" role="img"></canvas></div></div>
        <div class="card-k"><div class="card-head"><div><h3><i class="bi bi-bar-chart-steps"></i> Realisasi Pencairan Pembiayaan</h3><p>Uang (1%) vs pengadaan barang (2%)</p></div><div class="row-gap xs"><span><i class="bi bi-square-fill text-primary"></i> Uang</span><span><i class="bi bi-square-fill text-gold"></i> Barang</span></div></div><div class="chart-box"><canvas id="chCair" role="img" aria-label="Grafik pencairan"></canvas></div></div>
      </div>
      <div class="grid g-3-lg mb-3">
        <div class="card-k"><div class="card-head"><div><h3><i class="bi bi-graph-up-arrow"></i> Tren Penerimaan Angsuran</h3><p>Rasio kelancaran potong gaji bulanan</p></div>${badge(kol.lancar.toFixed(1).replace('.', ',') + '% ' + (kol.lancar >= 95 ? 'Sangat Sehat' : kol.lancar >= 90 ? 'Sehat' : 'Perlu Perhatian'), kol.lancar >= 90 ? 'b-blue' : 'b-amber')}</div><div class="chart-box sm"><canvas id="chAngs" role="img" aria-label="Grafik angsuran"></canvas></div></div>
        <div class="card-k"><div class="card-head"><div><h3><i class="bi bi-pie-chart"></i> Komposisi Portofolio</h3><p>Sisa pokok uang vs barang</p></div>${badge('Aktif', 'b-gray')}</div>
          <div class="row-gap" style="flex-wrap:nowrap"><div class="chart-box sm" style="width:150px;flex:none"><canvas id="chKomp" role="img" aria-label="Komposisi portofolio"></canvas></div>
          <div class="stack" style="gap:8px;flex:1;min-width:0"><div class="stat-mini"><span><i class="bi bi-circle-fill text-primary"></i> Pinjaman Uang</span><b>${pct(D.sisaPokok.uang, sisa)}% · ${fmtJt(D.sisaPokok.uang)}</b></div><div class="stat-mini"><span><i class="bi bi-circle-fill text-gold"></i> Pinjaman Barang</span><b>${pct(D.sisaPokok.barang, sisa)}% · ${fmtJt(D.sisaPokok.barang)}</b></div></div></div></div>
        <div class="insight khatam-bg"><span class="khatam-star"></span><h3><i class="bi bi-stars"></i> Analisis Cerdas Otomatis</h3><ul>${ins.map(i => `<li><i class="bi bi-lightbulb"></i><span>${i}</span></li>`).join('')}</ul></div>
      </div>
      <div class="grid g-12-lg">
        <div class="card-k flush"><div class="card-head card-pad-x pt-3 mb-2"><div><h3><i class="bi bi-hourglass-split"></i> Pengajuan Menunggu Persetujuan</h3><p>${D.pending.length} berkas siap verifikasi bendahara</p></div>${D.pending.length ? badge('Perlu Tindakan', 'b-amber') : ''}</div>
          ${Tbl.html({ id: 'dash-pending', rows: D.pending, noPage: true, emptyIcon: 'bi-check2-all', emptyTitle: 'Tidak ada antrean', emptyText: 'Semua pengajuan sudah diproses.',
            rowAttr: l => on('Nav.go', 'pinjaman-detail', { id: l.ID_Pinjaman }),
            cols: [{ h: 'No. Berkas', v: l => `<span class="mono">${esc(l.ID_Pinjaman)}</span><div class="cell-sub">${fmtDate(l.Tgl_Pengajuan)}</div>`, main: true },
              { h: 'Anggota', v: l => `<div class="person">${avatar(angName(l.ID_Anggota))}<div><div class="cell-main">${esc(angName(l.ID_Anggota))}</div><div class="cell-sub">${esc((D.anggota[l.ID_Anggota] || {}).Jabatan || '')}</div></div></div>` },
              { h: 'Fasilitas', v: l => jenisBadge(l) + `<div class="cell-sub">${esc(loanLabel(l))}</div>` },
              { h: 'Pengajuan', cls: 'num', v: l => `<b>${fmtRp(l.Pokok)}</b><div class="cell-sub">${l.Tenor} bulan</div>` },
              { h: '', cls: 'num', label: 'Aksi', v: l => `<button class="btn btn-sm btn-soft" ${on('Nav.go', 'pinjaman-detail', { id: l.ID_Pinjaman })}>Tinjau</button>` }] })}</div>
        <div class="card-k flush"><div class="card-head card-pad-x pt-3 mb-2"><div><h3><i class="bi bi-calendar2-week"></i> Jatuh Tempo Terdekat</h3><p>Dipotong gaji setiap tanggal ${tglPotong()}</p></div><button class="btn btn-sm btn-ghost" ${on('Nav.go', 'angsuran')}>Loket <i class="bi bi-arrow-right"></i></button></div>
          ${Tbl.html({ id: 'dash-due', rows: D.upcoming.slice(0, 6), noPage: true, emptyIcon: 'bi-calendar-check', emptyTitle: 'Tidak ada tagihan berjalan',
            rowAttr: u => on('Pages.angsuran.open', u.loan.ID_Pinjaman),
            cols: [{ h: 'Anggota', main: true, v: u => `<div class="cell-main">${esc(angName(u.loan.ID_Anggota))}</div><div class="cell-sub">Ke-${u.row.Cicilan_Ke} / ${u.loan.Tenor} · ${fmtDate(u.row.Jatuh_Tempo)}</div>` },
              { h: 'Tagihan', cls: 'num', v: u => fmtRp(u.sisa) }, { h: 'Status', cls: 'num', v: u => rowBadge(u.row) }] })}</div>
      </div>`;
    const c = Charts.colors();
    Charts.make('chSimp', { type: 'bar', data: { labels: M.map(m => fmtMonth(m.mk)), datasets: [{ label: 'Saldo simpanan', data: M.map(m => m.saldo), backgroundColor: M.map((m, i) => i === M.length - 1 ? c.primary : c.soft), borderRadius: 8, maxBarThickness: 38 }] } });
    Charts.make('chCair', { type: 'bar', data: { labels: M.map(m => fmtMonth(m.mk)), datasets: [{ label: 'Uang', data: M.map(m => m.cairU), backgroundColor: c.primary, borderRadius: 6, maxBarThickness: 22 }, { label: 'Barang', data: M.map(m => m.cairB), backgroundColor: c.gold, borderRadius: 6, maxBarThickness: 22 }] } });
    Charts.make('chAngs', { type: 'line', data: { labels: M.map(m => fmtMonth(m.mk)), datasets: [{ label: 'Angsuran masuk', data: M.map(m => m.angsuran), borderColor: c.primary, backgroundColor: 'rgba(15,123,95,.12)', fill: true, tension: .4, pointBackgroundColor: M.map((m, i) => i === M.length - 1 ? c.gold : c.primary), pointRadius: 4 }] } });
    Charts.make('chKomp', { type: 'doughnut', data: { labels: ['Uang', 'Barang'], datasets: [{ data: [D.sisaPokok.uang, D.sisaPokok.barang], backgroundColor: [c.deep, c.gold], borderWidth: 0 }] }, options: { cutout: '70%' } });
  }
};

// ════════════════════════════════════════════════════════
// HALAMAN: DATA ANGGOTA
// ════════════════════════════════════════════════════════
const masaGabung = iso => { if (!iso) return '—'; const m = Math.max(0, Math.floor(daysBetween(iso, T()) / 30.44)); return m >= 12 ? Math.floor(m / 12) + ' thn' : m + ' bln'; };
Pages.anggota = {
  title: 'Data Anggota', roles: ['admin', 'bendahara', 'pengawas'],
  render(el) {
    const s = st('anggota', { tab: 'semua', q: '', fas: 'semua', sort: 'nama' });
    const A = S.db.anggota, aktif = A.filter(a => a.Status === 'aktif').length;
    const peminjam = new Set(D.berjalan.map(l => l.ID_Anggota)).size;
    const cnt = k => A.filter(a => k === 'semua' || a.Status === k || a.Status_Pegawai === k).length;
    el.innerHTML = pageHead({ crumbs: [['Dashboard', 'dashboard'], ['Keanggotaan']], title: 'Manajemen Data Anggota', desc: 'Buku induk sivitas akademika: identitas, status simpanan pokok/wajib, plafon pembiayaan qardh/murabahah, dan folder arsip Google Drive tiap anggota.',
      actions: `${isAdmin() ? '<button class="btn btn-danger-soft" id="btnHapusSemuaAng" onclick="Pages.anggota.hapusSemua()"><i class="bi bi-trash3"></i> Hapus Semua</button><button class="btn btn-outline" id="btnImporAnggota" onclick="Importer.open()"><i class="bi bi-file-earmark-arrow-up"></i> Impor Excel</button>' : ''}<button class="btn btn-outline" onclick="Pages.anggota.excel()"><i class="bi bi-download"></i> Ekspor Buku Induk</button>${canWrite() ? '<button class="btn btn-primary" onclick="Pages.anggota.form()"><i class="bi bi-person-plus"></i> Tambah Anggota</button>' : ''}` }) + `
      <div class="grid g-kpi mb-3">
        ${kpi({ label: 'Total Terdaftar', value: A.length + ' <small>orang</small>', icon: 'bi-people', sub: `${aktif} aktif • ${A.length - aktif} nonaktif` })}
        ${kpi({ label: 'Simpanan Pokok + Wajib', value: rp(D.simpananTotal.pokok + D.simpananTotal.wajib), icon: 'bi-safe2', sub: 'Sukarela ' + fmtRp(D.simpananTotal.sukarela) })}
        ${kpi({ label: 'Pemegang Pembiayaan', value: peminjam + ' <small>anggota</small>', icon: 'bi-shield-check', tone: 'gold', sub: badge('Qardh & Murabahah', 'b-gold') })}
        <div class="hero khatam-bg"><span class="khatam-star"></span><span class="eyebrow">Arsip Digital Terpusat</span><div class="hero-amount">${A.filter(a => a.Link_Folder_Drive).length} <span style="font-size:15px;font-weight:500">folder Drive</span></div><div class="small muted">Google Workspace • otomatis per anggota</div></div>
      </div>
      <div class="card-k flush">
        <div class="p-3 stack" style="gap:12px">
          ${tabs([['semua', 'Semua', '', cnt('semua')], ['aktif', 'Aktif', '', cnt('aktif')], ['nonaktif', 'Nonaktif', '', cnt('nonaktif')], ['GTY', 'Guru Tetap (GTY)', '', cnt('GTY')], ['GTT', 'Guru Tidak Tetap', '', cnt('GTT')], ['TU', 'Tendik / TU', '', cnt('TU')]], s.tab, 'Pages.anggota.setTab')}
          <div class="toolbar"><div class="inp-group grow"><span class="addon"><i class="bi bi-search"></i></span><input class="inp" type="search" placeholder="Cari nama, ID, NIK/NIP, jabatan…" value="${esc(s.q)}" oninput="Pages.anggota.q(this.value)" aria-label="Cari anggota"></div>
            <select class="inp" style="width:auto" onchange="Pages.anggota.set('fas',this.value)" aria-label="Filter fasilitas">${optList([['semua', 'Fasilitas: Semua'], ['aktif', 'Punya pembiayaan aktif'], ['tunggak', 'Menunggak'], ['tanpa', 'Tanpa pembiayaan']], s.fas)}</select>
            <select class="inp" style="width:auto" onchange="Pages.anggota.set('sort',this.value)" aria-label="Urutkan">${optList([['nama', 'Urut: Nama'], ['id', 'Urut: ID'], ['saldo', 'Saldo terbesar'], ['baru', 'Terbaru bergabung']], s.sort)}</select></div>
          <div id="anggotaBulk" class="bulk-bar" hidden></div>
        </div>
        <div id="anggotaList"></div>
      </div>`;
    Pages.anggota.list();
  },
  setTab(t) { st('anggota').tab = t; Tbl.reset('anggota'); Router.render(); },
  set(k, v) { st('anggota')[k] = v; Tbl.reset('anggota'); Pages.anggota.list(); },
  q: debounce(v => { st('anggota').q = v; Tbl.reset('anggota'); Pages.anggota.list(); }, 200),
  rows() {
    const s = st('anggota'), q = s.q.toLowerCase();
    const tung = new Set(D.tunggakan.map(t => t.loan.ID_Anggota)), act = new Set(D.berjalan.map(l => l.ID_Anggota));
    let rows = S.db.anggota.filter(a => (s.tab === 'semua' || a.Status === s.tab || a.Status_Pegawai === s.tab) &&
      (!q || [a.Nama, a.ID_Anggota, a.NIK_NIP, a.Jabatan, a.Email].some(x => String(x || '').toLowerCase().includes(q))) &&
      (s.fas === 'semua' || (s.fas === 'aktif' && act.has(a.ID_Anggota)) || (s.fas === 'tunggak' && tung.has(a.ID_Anggota)) || (s.fas === 'tanpa' && !act.has(a.ID_Anggota))));
    const sorters = { nama: (a, b) => a.Nama.localeCompare(b.Nama), id: (a, b) => a.ID_Anggota.localeCompare(b.ID_Anggota), saldo: (a, b) => (D.saldo[b.ID_Anggota] || {}).total - (D.saldo[a.ID_Anggota] || {}).total, baru: (a, b) => String(b.Tgl_Bergabung).localeCompare(String(a.Tgl_Bergabung)) };
    return rows.sort(sorters[s.sort] || sorters.nama);
  },
  list() {
    const box = document.getElementById('anggotaList'); if (!box) return;
    const adm = isAdmin(), sel = Pages.anggota.sel;
    if (adm) { const ada = new Set(S.db.anggota.map(a => a.ID_Anggota)); Array.from(sel).forEach(id => { if (!ada.has(id)) sel.delete(id); }); } else sel.clear();
    const colSel = { h: 'Pilih', label: 'Pilih', cls: 'td-sel',
      hHtml: '<input type="checkbox" class="sel-cb" id="selAllAng" aria-label="Pilih semua anggota di halaman ini" onclick="event.stopPropagation()" onchange="Pages.anggota.selPage(this.checked)">',
      v: a => `<input type="checkbox" class="sel-cb" data-id="${esc(a.ID_Anggota)}" ${sel.has(a.ID_Anggota) ? 'checked' : ''} ${a._pending ? 'disabled' : ''} aria-label="Pilih ${esc(a.Nama)}" onclick="event.stopPropagation()" onchange="Pages.anggota.toggle(this.dataset.id, this.checked)">` };
    box.innerHTML = Tbl.html({ id: 'anggota', rows: Pages.anggota.rows(), unit: 'anggota', emptyIcon: 'bi-people', emptyTitle: 'Tidak ada anggota yang cocok',
      rowAttr: a => on('Nav.go', 'anggota-detail', { id: a.ID_Anggota }),
      rowCls: a => sel.has(a.ID_Anggota) ? 'row-selected' : '',
      after: () => Pages.anggota.bulk(),
      cols: (adm ? [colSel] : []).concat([
        { h: 'ID & Anggota', main: true, v: a => `<div class="person">${avatar(a.Nama)}<div><div class="cell-main">${esc(a.Nama)} ${a._pending ? '<span class="spinner" style="width:12px;height:12px"></span>' : badge(a.ID_Anggota, 'b-green')}</div><div class="cell-sub">${esc(a.NIK_NIP)} • ${esc(a.Jabatan || '-')}</div></div></div>` },
        { h: 'Unit & Masa Gabung', v: a => `${badge(a.Status_Pegawai || '-', 'b-gray')}<div class="cell-sub">Sejak ${fmtDate(a.Tgl_Bergabung)} (${masaGabung(a.Tgl_Bergabung)})</div>` },
        { h: 'Saldo Simpanan', cls: 'num', v: a => { const s = D.saldo[a.ID_Anggota] || {}; return `<b>${fmtRp(s.total || 0)}</b><div class="cell-sub">P ${fmtJt(s.pokok || 0)} · W ${fmtJt(s.wajib || 0)} · S ${fmtJt(s.sukarela || 0)}</div>`; } },
        { h: 'Pembiayaan', v: a => { const ls = (D.loansByAng[a.ID_Anggota] || []).filter(l => ['diajukan', 'disetujui', 'berjalan'].includes(l.Status)); return ls.length ? ls.map(l => loanBadge(l) + `<div class="cell-sub">${esc(l.ID_Pinjaman)}${l.Status === 'berjalan' ? ' · ' + paidCount(l) + '/' + l.Tenor : ''}</div>`).join('') : '<span class="muted">—</span>'; } },
        { h: 'Status', v: a => badge(a.Status === 'aktif' ? 'Aktif' : 'Nonaktif', a.Status === 'aktif' ? 'b-green' : 'b-gray') },
        { h: '', label: 'Aksi', cls: 'num', v: a => `${adm && !a._pending ? `<button class="btn btn-sm btn-ghost text-danger" title="Hapus anggota" aria-label="Hapus ${esc(a.Nama)}" onclick="event.stopPropagation();${call('Pages.anggota.hapus', [a.ID_Anggota])}"><i class="bi bi-trash3"></i></button>` : ''}<button class="btn btn-sm btn-ghost" aria-label="Detail ${esc(a.Nama)}" ${on('Nav.go', 'anggota-detail', { id: a.ID_Anggota })}><i class="bi bi-chevron-right"></i></button>` }]) });
    Pages.anggota.bulk();
  },

  // ── PILIH & HAPUS ANGGOTA (khusus Admin) ──
  sel: new Set(),
  toggle(id, on) {
    if (on) Pages.anggota.sel.add(id); else Pages.anggota.sel.delete(id);
    const cb = document.querySelector('#tbl-anggota .sel-cb[data-id="' + CSS.escape(id) + '"]');
    if (cb) cb.closest('tr').classList.toggle('row-selected', on);
    Pages.anggota.bulk();
  },
  /** Centang/lepas semua baris di halaman tabel yang sedang tampil. */
  selPage(on) {
    document.querySelectorAll('#tbl-anggota tbody .sel-cb[data-id]:not(:disabled)').forEach(cb => {
      cb.checked = on; cb.closest('tr').classList.toggle('row-selected', on);
      if (on) Pages.anggota.sel.add(cb.dataset.id); else Pages.anggota.sel.delete(cb.dataset.id);
    });
    Pages.anggota.bulk();
  },
  /** Pilih seluruh anggota hasil tab/filter/pencarian saat ini (semua halaman tabel). */
  selFiltered() { Pages.anggota.rows().forEach(a => { if (!a._pending) Pages.anggota.sel.add(a.ID_Anggota); }); Pages.anggota.list(); },
  selClear() { Pages.anggota.sel.clear(); Pages.anggota.list(); },
  /** Perbarui bilah aksi massal & status centang di header tabel. */
  bulk() {
    const bar = document.getElementById('anggotaBulk'); if (!bar) return;
    const sel = Pages.anggota.sel, n = sel.size;
    const boxes = Array.from(document.querySelectorAll('#tbl-anggota tbody .sel-cb[data-id]:not(:disabled)'));
    const all = document.getElementById('selAllAng');
    if (all) { const k = boxes.filter(b => b.checked).length; all.checked = boxes.length > 0 && k === boxes.length; all.indeterminate = k > 0 && k < boxes.length; }
    if (!isAdmin() || !n) { bar.hidden = true; bar.innerHTML = ''; return; }
    const hasil = Pages.anggota.rows().filter(a => !a._pending).length;
    bar.hidden = false;
    bar.innerHTML = `<span class="bulk-count"><i class="bi bi-check2-square"></i> <b>${n}</b> anggota dipilih</span>
      ${hasil > n ? `<button class="btn btn-sm btn-ghost" type="button" onclick="Pages.anggota.selFiltered()">Pilih semua hasil filter (${hasil})</button>` : ''}
      <button class="btn btn-sm btn-ghost" type="button" onclick="Pages.anggota.selClear()">Batal pilih</button>
      <button class="btn btn-sm btn-danger" type="button" id="btnHapusTerpilih" onclick="Pages.anggota.hapus(Array.from(Pages.anggota.sel))"><i class="bi bi-trash3"></i> Hapus terpilih</button>`;
  },

  /** Hitung dampak penghapusan dari data lokal (untuk ditampilkan sebelum konfirmasi). */
  dampak(list) {
    const ids = new Set(list.map(a => a.ID_Anggota));
    const loans = S.db.pinjaman.filter(l => ids.has(l.ID_Anggota)), loanSet = new Set(loans.map(l => l.ID_Pinjaman));
    const simp = S.db.simpanan.filter(x => ids.has(x.ID_Anggota));
    const bayarAng = S.db.pembayaran.filter(b => ids.has(b.ID_Anggota));
    const txIds = new Set(simp.concat(loans, bayarAng).map(x => x.ID_Anggota));
    const aktif = loans.filter(l => ['diajukan', 'disetujui', 'berjalan'].includes(l.Status));
    return {
      txIds, loans, aktif, simp,
      sisa: aktif.reduce((t, l) => t + num(l.Sisa_Tagihan), 0),
      saldo: list.reduce((t, a) => t + ((D.saldo[a.ID_Anggota] || {}).total || 0), 0),
      bayar: S.db.pembayaran.filter(b => ids.has(b.ID_Anggota) || loanSet.has(b.ID_Pinjaman)).length,
      angsuran: S.db.angsuran.filter(x => loanSet.has(x.ID_Pinjaman)).length,
      arsip: S.db.arsip.filter(d => ids.has(d.ID_Anggota)).length,
      akun: S.db.pengguna.filter(u => ids.has(u.ID_Anggota) && u.Peran === 'anggota').length,
      folder: list.filter(a => a.Link_Folder_Drive).length
    };
  },
  hapusSemua() {
    if (!S.db.anggota.length) { toast('Belum ada data anggota.', 'info'); return; }
    Pages.anggota.hapus(S.db.anggota.map(a => a.ID_Anggota), true);
  },
  /** Dialog hapus: satu anggota, beberapa terpilih, atau semua (semua = true). */
  hapus(ids, semua) {
    if (!isAdmin()) return;
    const list = (ids || []).map(id => D.anggota[id]).filter(Boolean);
    if (!list.length) { toast('Pilih minimal satu anggota.', 'warning'); return; }
    if (list.some(a => a._pending)) { toast('Tunggu sampai data anggota baru selesai tersimpan, lalu coba lagi.', 'warning'); return; }
    const d = Pages.anggota.dampak(list), n = list.length, nTx = list.filter(a => d.txIds.has(a.ID_Anggota)).length;
    Pages.anggota._hps = { list, d, semua: !!semua, nTx };
    const names = list.slice(0, 8).map(a => badge(a.ID_Anggota + ' · ' + a.Nama, 'b-gray')).join(' ') + (n > 8 ? ` <span class="small muted">dan ${n - 8} lainnya</span>` : '');
    const txBox = nTx ? `<div class="info-box danger"><i class="bi bi-exclamation-octagon"></i><div><b>${semua || n === nTx ? (n === 1 ? 'Anggota ini' : 'Semua anggota ini') : nTx + ' dari ' + n + ' anggota'} memiliki riwayat transaksi:</b>
        <ul class="hps-list"><li>${d.simp.length} transaksi simpanan (saldo ${fmtRp(d.saldo)})</li><li>${d.loans.length} pinjaman${d.aktif.length ? ` — <b>${d.aktif.length} masih aktif, sisa tagihan ${fmtRp(d.sisa)}</b>` : ''}</li><li>${d.angsuran} jadwal angsuran & ${d.bayar} pembayaran</li></ul>
        Menghapusnya akan mengubah saldo kas, laporan, dan piutang koperasi.</div></div>` : '';
    const opsi = nTx && !semua ? `<label class="check hps-cascade"><input type="checkbox" id="hpsCascade" onchange="Pages.anggota.hpsCek()"> <span><b>Hapus juga seluruh riwayat transaksinya</b><br><span class="small muted" id="hpsSkipNote">Tanpa centang: ${nTx} anggota yang memiliki transaksi akan <b>dilewati</b>.</span></span></label>` : '';
    Modal.open({ title: semua ? 'Hapus Semua Anggota' : n === 1 ? 'Hapus Anggota' : 'Hapus ' + n + ' Anggota', icon: 'bi-trash3',
      sub: semua ? 'Seluruh ' + n + ' anggota beserta riwayat transaksinya' : 'Tindakan ini tidak dapat dibatalkan dari aplikasi', size: semua || n > 1 ? 'lg' : '',
      body: `<div class="stack" id="hpsBody">
        <div><div class="eyebrow mb-2">Anggota yang akan dihapus</div><div class="row-gap">${names}</div></div>
        ${txBox}${opsi}
        <div class="small"><b>Ikut dihapus:</b> <span id="hpsIkut">${d.akun} akun login anggota, ${d.arsip} arsip dokumen, ${d.folder} folder berkas Drive</span> (file Drive dipindah ke Sampah — masih bisa dipulihkan ±30 hari).<br>
          <b>Tidak terpengaruh:</b> stok & mutasi barang, biaya operasional, pengaturan, log aktivitas, nomor dokumen.</div>
        <div class="info-box ok" id="hpsBackup" ${semua ? '' : 'hidden'}><i class="bi bi-cloud-arrow-up"></i><div>Spreadsheet <b>dicadangkan otomatis</b> sebelum riwayat transaksi dihapus (Google Drive → folder Cadangan).</div></div>
        <div class="fg" id="hpsKetikBox" ${semua ? '' : 'hidden'}><label for="hpsKetik"><span>Ketik <b class="mono" id="hpsKata">${semua ? 'HAPUS SEMUA' : 'HAPUS'}</b> untuk mengonfirmasi</span></label><input id="hpsKetik" class="inp mono" autocomplete="off" oninput="Pages.anggota.hpsCek()"></div>
      </div>`,
      foot: `<button class="btn btn-outline" data-bs-dismiss="modal">Batal</button><button class="btn btn-danger" id="btnHapusAng" onclick="Pages.anggota.hapusGo()"><i class="bi bi-trash3"></i> <span>Hapus</span></button>` });
    Pages.anggota.hpsCek();
  },
  /** Validasi dialog hapus secara langsung: jumlah yang akan dihapus, kata konfirmasi, catatan cadangan. */
  hpsCek() {
    const c = Pages.anggota._hps; if (!c) return;
    const cb = document.getElementById('hpsCascade'), cascade = c.semua || !c.nTx || !!(cb && cb.checked);
    const jumlah = cascade ? c.list.length : c.list.length - c.nTx;
    const butuhKetik = c.semua || (cascade && c.nTx > 0), kata = c.semua ? 'HAPUS SEMUA' : 'HAPUS';
    const kb = document.getElementById('hpsKetikBox'), ki = document.getElementById('hpsKetik');
    if (kb) kb.hidden = !butuhKetik;
    const bk = document.getElementById('hpsBackup'); if (bk) bk.hidden = !(c.semua || (cascade && c.nTx > 0));
    const sk = document.getElementById('hpsSkipNote'); if (sk) sk.style.opacity = cascade ? .45 : 1;
    const btn = document.getElementById('btnHapusAng'); if (!btn) return;
    btn.disabled = jumlah < 1 || (butuhKetik && (!ki || ki.value.trim().toUpperCase() !== kata));
    btn.querySelector('span').textContent = jumlah < 1 ? 'Tidak ada yang dapat dihapus' : c.semua ? 'Hapus semua (' + jumlah + ')' : 'Hapus ' + jumlah + ' anggota';
  },
  hapusGo() {
    const c = Pages.anggota._hps; if (!c) return;
    const btn = document.getElementById('btnHapusAng'); if (btn && btn.disabled) return;
    const cb = document.getElementById('hpsCascade'), cascade = c.semua || !!(cb && cb.checked);
    const del = new Set(c.list.filter(a => cascade || !c.d.txIds.has(a.ID_Anggota)).map(a => a.ID_Anggota));
    Pages.anggota._hps = null;
    commit({ action: 'anggota.hapus', payload: { ids: c.semua ? [] : c.list.map(a => a.ID_Anggota), semua: c.semua, cascade },
      tables: ['anggota', 'simpanan', 'pinjaman', 'angsuran', 'pembayaran', 'arsip', 'pengguna'], label: 'Hapus anggota', quiet: true,
      apply: () => {
        const loanSet = new Set(S.db.pinjaman.filter(l => del.has(l.ID_Anggota)).map(l => l.ID_Pinjaman));
        S.db.anggota = S.db.anggota.filter(a => !del.has(a.ID_Anggota));
        S.db.simpanan = S.db.simpanan.filter(x => !del.has(x.ID_Anggota));
        S.db.pinjaman = S.db.pinjaman.filter(l => !del.has(l.ID_Anggota));
        S.db.angsuran = S.db.angsuran.filter(x => !loanSet.has(x.ID_Pinjaman));
        S.db.pembayaran = S.db.pembayaran.filter(b => !del.has(b.ID_Anggota) && !loanSet.has(b.ID_Pinjaman));
        S.db.arsip = S.db.arsip.filter(x => !del.has(x.ID_Anggota));
        S.db.pengguna = S.db.pengguna.filter(u => !(del.has(u.ID_Anggota) && u.Peran === 'anggota')).map(u => del.has(u.ID_Anggota) ? Object.assign({}, u, { ID_Anggota: '' }) : u);
        del.forEach(id => Pages.anggota.sel.delete(id));
      },
      ok: res => {
        const ex = (res.data && res.data.extra) || {}, srv = new Set(ex.dihapus || []);
        // Server adalah acuan: bila hasilnya berbeda dari perkiraan lokal (mis. ada transaksi baru), tarik ulang data.
        if (srv.size !== del.size || Array.from(del).some(id => !srv.has(id))) Sync.pull(true);
        toast(res.message, 'success', 'Penghapusan selesai');
      } });
    Modal.close();
    if (S.page === 'anggota-detail' && del.has(S.params.id)) Nav.go('anggota', {}, { back: true });
    toast('Menghapus ' + del.size + ' anggota…', 'info');
  },
  excel() {
    Docs.excel('Buku_Induk_Anggota_' + T(), [{ name: 'Anggota', rows: Pages.anggota.rows().map(a => {
      const s = D.saldo[a.ID_Anggota] || {};
      return { 'ID Anggota': a.ID_Anggota, Nama: a.Nama, 'NIK/NIP': a.NIK_NIP, Jabatan: a.Jabatan, 'Status Pegawai': a.Status_Pegawai, 'No HP': a.No_HP, Email: a.Email, Alamat: a.Alamat,
        Status: a.Status, 'Tgl Bergabung': a.Tgl_Bergabung, 'Simpanan Pokok': s.pokok || 0, 'Simpanan Wajib': s.wajib || 0, 'Simpanan Sukarela': s.sukarela || 0, 'Total Simpanan': s.total || 0 };
    }) }]);
  },

  /** Formulir tambah / ubah anggota (modal) — disimpan optimistis. */
  form(id) {
    if (!canWrite()) return;
    const a = id ? D.anggota[id] : null, stg = S.settings;
    Modal.open({ title: a ? 'Ubah Data Anggota' : 'Registrasi Anggota Baru', sub: a ? a.ID_Anggota + ' · ' + a.Nama : 'ID anggota dibuat otomatis • folder Google Drive pribadi disiapkan', icon: a ? 'bi-pencil-square' : 'bi-person-plus', size: 'lg',
      body: `<form id="fAnggota" class="stack" novalidate>
        <div><div class="eyebrow mb-2">Bagian A · Identitas Sivitas & Kepegawaian</div><div class="form-grid cols-2">
          <div class="fg full"><label>Nama lengkap beserta gelar <span class="req">*</span></label><input class="inp" name="Nama" required minlength="3" value="${esc(a ? a.Nama : '')}" placeholder="mis. Muhammad Rizki Fauzan, S.Pd., M.Kom." data-msg="Nama lengkap wajib diisi"><span class="hint">Tercetak otomatis pada Kartu Tanda Anggota & dokumen akad.</span></div>
          <div class="fg"><label>NIK / NIP Yayasan <span class="req">*</span></label><input class="inp mono" name="NIK_NIP" required inputmode="numeric" pattern="\\d{8,20}" value="${esc(a ? a.NIK_NIP : '')}" placeholder="18 digit NIP / 16 digit NIK" data-msg="NIK/NIP harus 8–20 digit angka"></div>
          <div class="fg"><label>Jabatan / Mata pelajaran</label><input class="inp" name="Jabatan" value="${esc(a ? a.Jabatan : '')}" placeholder="mis. Guru Produktif TKJ"></div>
          <div class="fg full"><label>Status kepegawaian</label><div class="choice-grid">${[['GTY', 'GTY', 'Guru Tetap Yayasan'], ['GTT', 'GTT', 'Guru Tidak Tetap'], ['TU', 'Tendik / TU', 'Tata usaha sekolah'], ['Operasional', 'Operasional', 'Sarpras & teknis']].map(o => `<label class="choice"><input type="radio" name="Status_Pegawai" value="${o[0]}" ${(a ? a.Status_Pegawai : 'GTY') === o[0] ? 'checked' : ''}><span class="c-body" style="padding:10px 12px"><span><b style="font-size:13px">${o[1]}</b><small>${o[2]}</small></span><span class="c-check"><i class="bi bi-check"></i></span></span></label>`).join('')}</div></div>
          <div class="fg"><label>Nomor WhatsApp aktif</label><input class="inp" name="No_HP" type="tel" value="${esc(a ? a.No_HP : '')}" placeholder="0812-xxxx-xxxx" pattern="[0-9+\\-\\s]{8,20}" data-msg="Nomor HP tidak valid"></div>
          <div class="fg"><label>Email (Google Workspace)</label><input class="inp" name="Email" type="email" value="${esc(a ? a.Email : '')}" placeholder="nama@pbsoedirman2.sch.id" data-msg="Format email tidak valid"><span class="hint">Untuk notifikasi jatuh tempo & persetujuan.</span></div>
          <div class="fg full"><label>Alamat domisili</label><textarea class="inp" name="Alamat" rows="2" placeholder="Sesuai KTP">${esc(a ? a.Alamat : '')}</textarea></div>
          <div class="fg"><label>Tanggal resmi masuk koperasi</label><input class="inp" type="date" name="Tgl_Bergabung" value="${esc(a ? a.Tgl_Bergabung : T())}" max="${T()}"></div>
          ${a ? `<div class="fg"><label>Status keanggotaan</label><select class="inp" name="Status">${optList([['aktif', 'Aktif'], ['nonaktif', 'Nonaktif (keluar / purnabakti)']], a.Status)}</select></div>` : ''}
        </div></div>
        ${a ? '' : `<div><div class="eyebrow mb-2">Bagian B · Komitmen Simpanan Perdana (AD/ART)</div><div class="form-grid cols-3">
          <div class="fg"><label>Simpanan pokok <span class="xs muted">1× seumur hidup</span></label><div class="inp-group"><span class="addon rp">Rp</span><input class="inp money-inp" name="pokok" value="${fmtNum(stg.SIMPANAN_POKOK)}" readonly></div></div>
          <div class="fg"><label>Simpanan wajib <span class="xs muted">bulan ini</span></label><div class="inp-group"><span class="addon rp">Rp</span><input class="inp money-inp" name="wajib" data-money value="${fmtNum(stg.SIMPANAN_WAJIB)}" oninput="Pages.anggota.tot()"></div></div>
          <div class="fg"><label>Sukarela awal <span class="xs text-gold">opsional</span></label><div class="inp-group"><span class="addon rp">Rp</span><input class="inp money-inp" name="sukarela" data-money value="" placeholder="0" oninput="Pages.anggota.tot()"></div></div>
          <div class="fg"><label>Metode setoran perdana</label><select class="inp" name="metode">${optList([['tunai', 'Tunai di kasir loket'], ['payroll', 'Potong gaji berjalan'], ['transfer', 'Transfer bank']], 'tunai')}</select></div>
          <div class="fg span-2" style="grid-column:span 2"><div class="stat-mini" style="background:var(--primary-soft)"><span>Total setoran awal</span><b id="totAwal" class="text-primary">${fmtRp(num(stg.SIMPANAN_POKOK) + num(stg.SIMPANAN_WAJIB))}</b></div></div>
          <label class="check full" style="grid-column:1/-1"><input type="checkbox" name="setor" checked> Catat setoran perdana sekarang (bukti setoran bernomor otomatis)</label>
          <label class="check full" style="grid-column:1/-1"><input type="checkbox" name="akun" checked> Buatkan akun login anggota (username = ID anggota, sandi sementara ditampilkan sekali)</label>
        </div></div>
        <div class="info-box ok"><i class="bi bi-shield-check"></i><div><b>Akad Ta'awun & Iltizam.</b> Dengan mendaftar, calon anggota menyatakan bersedia tolong-menolong dalam kebaikan, mematuhi AD/ART koperasi syariah, serta menyetujui pemotongan simpanan wajib sesuai ketetapan rapat anggota.</div></div>`}
      </form>`,
      foot: `<button class="btn btn-outline" data-bs-dismiss="modal">Batal</button><button class="btn btn-primary" id="btnSaveAng" onclick="Pages.anggota.save(${esc(JSON.stringify(id || ''))})"><i class="bi bi-check2-circle"></i> ${a ? 'Simpan Perubahan' : 'Daftarkan Anggota'}</button>` });
  },
  tot() { const f = document.getElementById('fAnggota'); if (!f) return; document.getElementById('totAwal').textContent = fmtRp(parseRp(f.pokok.value) + parseRp(f.wajib.value) + parseRp(f.sukarela.value)); },
  save(id) {
    const f = document.getElementById('fAnggota');
    const nikDup = v => { const d = S.db.anggota.find(a => a.NIK_NIP === v && a.ID_Anggota !== id); return d ? 'NIK/NIP sudah terdaftar atas nama ' + d.Nama : ''; };
    const data = Form.check(f, { NIK_NIP: nikDup });
    if (!data) return;
    const rec = { Nama: data.Nama, NIK_NIP: data.NIK_NIP, Jabatan: data.Jabatan, Status_Pegawai: data.Status_Pegawai || 'GTY', No_HP: data.No_HP, Email: data.Email, Alamat: data.Alamat, Tgl_Bergabung: data.Tgl_Bergabung };
    if (id) {
      rec.ID_Anggota = id; rec.Status = data.Status;
      commit({ action: 'anggota.simpan', payload: { record: rec }, tables: ['anggota'], label: 'Ubah anggota',
        apply: () => { const i = S.db.anggota.findIndex(a => a.ID_Anggota === id); S.db.anggota[i] = Object.assign({}, S.db.anggota[i], rec); } });
      Modal.close(); return;
    }
    const tmp = uid(), setoran = [];
    if (f.setor.checked) [['pokok', parseRp(data.pokok)], ['wajib', parseRp(data.wajib)], ['sukarela', parseRp(data.sukarela)]].forEach(x => { if (x[1] > 0) setoran.push({ Jenis: x[0], Jumlah: x[1], Metode: data.metode, tmpId: uid() }); });
    commit({ action: 'anggota.simpan', payload: { record: Object.assign({ ID_Anggota: tmp }, rec), setoranAwal: setoran, buatAkun: f.akun.checked }, tables: ['anggota', 'simpanan'], label: 'Anggota baru',
      apply: () => {
        S.db.anggota.push(Object.assign({}, rec, { ID_Anggota: tmp, Status: 'aktif', Link_Folder_Drive: '', _pending: true }));
        setoran.forEach(s => S.db.simpanan.push({ ID_Transaksi: s.tmpId, ID_Anggota: tmp, Jenis: s.Jenis, Tipe: 'setor', Tanggal: T(), Jumlah: s.Jumlah, Metode: s.Metode, Keterangan: 'Setoran perdana ' + s.Jenis, Dicatat_Oleh: S.user.nama, No_Bukti: '', Status: 'sah', _pending: true }));
      },
      ok: res => { const ex = res.data.extra || {}; if (ex.akun) showCredential(ex.akun, 'Akun Login Anggota Baru'); } });
    Modal.close();
    toast('Anggota ' + rec.Nama + ' sedang didaftarkan…', 'info');
  }
};

// ════════════════════════════════════════════════════════
// HALAMAN: DETAIL PROFIL & BUKU SIMPANAN ANGGOTA
// ════════════════════════════════════════════════════════
Pages['anggota-detail'] = {
  title: 'Detail Anggota', nav: 'anggota', roles: ['admin', 'bendahara', 'pengawas'],
  render(el, p) {
    const realId = Sync.idMap[p.id] || p.id;
    const a = D.anggota[realId];
    if (!a) { el.innerHTML = pageHead({ title: 'Anggota tidak ditemukan', back: 'anggota' }) + `<div class="card-k">${empty('bi-person-x', 'Data tidak tersedia', 'Mungkin masih disinkronkan atau sudah dihapus.')}</div>`; return; }
    if (realId !== p.id) S.params.id = realId;
    const s = D.saldo[a.ID_Anggota] || { pokok: 0, wajib: 0, sukarela: 0, total: 0 };
    const ui = st('ad-' + a.ID_Anggota, { tab: 'mutasi', jenis: 'semua' });
    const loans = D.loansByAng[a.ID_Anggota] || [];
    const wa = UI.wa(a.No_HP, "Assalamu'alaikum " + a.Nama + ', ');
    el.innerHTML = pageHead({ back: 'anggota', backLabel: 'Kembali ke Data Anggota', crumbs: [['Dashboard', 'dashboard'], ['Keanggotaan', 'anggota'], ['Profil ' + a.ID_Anggota]], title: '' }).replace('<h1></h1>', '') + `
      <div class="card-k mb-3"><div class="row-between" style="align-items:flex-start">
        <div class="person" style="gap:16px;align-items:flex-start">${avatar(a.Nama, 'lg')}<div><h2 class="font-head" style="font-size:22px">${esc(a.Nama)} ${badge('ID: ' + a.ID_Anggota, 'b-blue')}</h2>
          <div class="row-gap mt-1">${badge(a.Status === 'aktif' ? 'Anggota Aktif & Terverifikasi' : 'Nonaktif', a.Status === 'aktif' ? 'b-green' : 'b-gray', 'bi-patch-check')} ${badge('Auto-debet payroll', 'b-gold', 'bi-arrow-left-right')}</div>
          <div class="small muted mt-2"><i class="bi bi-mortarboard"></i> ${esc(a.Jabatan || '-')} (${esc(a.Status_Pegawai || '-')}) &nbsp;•&nbsp; <i class="bi bi-person-vcard"></i> ${esc(a.NIK_NIP)}<br><i class="bi bi-calendar-check"></i> Gabung ${fmtDate(a.Tgl_Bergabung)} (masa keanggotaan ${masaGabung(a.Tgl_Bergabung)})</div></div></div>
        <div class="btn-group-k"><button class="btn btn-outline btn-sm" ${on('Docs.kartuSimpanan', a.ID_Anggota)}><i class="bi bi-printer"></i> Kartu Simpanan</button>
          ${wa ? `<a class="btn btn-outline btn-sm" href="${esc(wa)}" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> WhatsApp</a>` : ''}
          ${canWrite() ? `<button class="btn btn-outline btn-sm" ${on('Pages.anggota.form', a.ID_Anggota)}><i class="bi bi-pencil"></i> Edit</button><button class="btn btn-gold btn-sm" ${on('Pages.simpanan.kasir', { id: a.ID_Anggota, jenis: 'sukarela', tipe: 'tarik' })}><i class="bi bi-cash"></i> Tarik Sukarela</button><button class="btn btn-primary btn-sm" ${on('Pages.simpanan.kasir', { id: a.ID_Anggota })}><i class="bi bi-plus-circle"></i> Setor Simpanan</button>` : ''}
          ${isAdmin() ? `<button class="btn btn-danger-soft btn-sm" id="btnHapusDetail" ${on('Pages.anggota.hapus', [a.ID_Anggota])}><i class="bi bi-trash3"></i> Hapus</button>` : ''}</div>
      </div></div>
      <div class="grid g-kpi mb-3">
        <div class="hero khatam-bg"><span class="khatam-star"></span><span class="eyebrow">Total Saldo Akumulasi</span><div class="hero-amount">${rp(s.total)}</div><div class="small muted"><i class="bi bi-shield-check"></i> Akad Wadiah & Mudharabah</div></div>
        ${kpi({ label: 'Simpanan Pokok', value: rp(s.pokok), icon: 'bi-lock', tone: 'blue', sub: s.pokok >= num(S.settings.SIMPANAN_POKOK) ? '<i class="bi bi-check-circle text-success"></i> Lunas (1× seumur hidup)' : 'Belum lunas' })}
        ${kpi({ label: 'Simpanan Wajib', value: rp(s.wajib), icon: 'bi-calendar2-check', sub: 'Rutin via payroll • ' + fmtRp(S.settings.SIMPANAN_WAJIB) + '/bln' })}
        ${kpi({ label: 'Sukarela / Wadiah', value: rp(s.sukarela), icon: 'bi-piggy-bank', tone: 'gold', sub: 'Dapat ditarik sewaktu-waktu' })}
      </div>
      <div class="grid g-main-side">
        <div class="stack">
          ${tabs([['mutasi', 'Buku Mutasi Simpanan', 'bi-journal-text'], ['pembiayaan', 'Riwayat Pembiayaan & Akad', 'bi-credit-card-2-front', loans.length], ['dokumen', 'Dokumen & Arsip Drive', 'bi-folder2-open'], ['data', 'Data Pribadi', 'bi-person-lines-fill']], ui.tab, 'Pages.anggotaDetail.tab')}
          <div class="card-k ${ui.tab === 'mutasi' ? 'flush' : ''}" id="adTab"></div>
        </div>
        <div class="stack">
          <div class="kta khatam-bg"><span class="khatam-star"></span><div class="kta-top"><div><span>KTA DIGITAL KOPERASI</span><b>${esc(S.settings.SEKOLAH || '')}</b></div><span class="kta-tag">${a.Status === 'aktif' ? 'AKTIF' : 'NONAKTIF'}</span></div>
            <div class="kta-mid"><div style="min-width:0"><div class="kta-name">${esc(a.Nama)}</div><div class="small" style="opacity:.85">ID: ${esc(a.ID_Anggota)} • ${esc(a.Status_Pegawai || '')}</div><div class="xs" style="opacity:.75;margin-top:6px">Berlaku: seumur keanggotaan</div></div><div class="kta-qr">${a._v ? `<img alt="QR verifikasi KTA" src="${Docs.qr(Docs.verifyUrl(a.ID_Anggota, a._v), 3)}">` : ''}</div></div>
            <div class="kta-foot">QR berisi tautan verifikasi resmi • ${esc(a._v ? a.ID_Anggota + '~' + a._v : 'menunggu sinkron')}</div></div>
          <button class="btn btn-outline btn-block" ${on('Docs.kta', a.ID_Anggota)}><i class="bi bi-download"></i> Unduh KTA Elektronik (PDF)</button>
          ${canWrite() && a.Status === 'aktif' ? `<div class="card-k flush"><div class="panel-deep khatam-bg"><span class="khatam-star"></span><h3><i class="bi bi-lightning-charge"></i> Quick Action Kasir</h3><p>Input setoran tunai instan</p></div>
            <form class="p-3 form-grid" onsubmit="event.preventDefault();Pages.simpanan.quick(this,'${esc(a.ID_Anggota)}')" novalidate>
              <div class="fg"><label>Jenis setoran</label><select class="inp" name="Jenis">${optList([['sukarela', 'Simpanan Sukarela / Wadiah'], ['wajib', 'Simpanan Wajib'], ['pokok', 'Simpanan Pokok']], 'sukarela')}</select></div>
              <div class="fg"><label>Nominal setoran</label><div class="inp-group"><span class="addon rp">Rp</span><input class="inp money-inp" name="Jumlah" data-money required placeholder="0" inputmode="numeric" data-msg="Nominal wajib diisi"></div>
                <div class="chips mt-1">${[50000, 100000, 250000, 500000].map(v => `<button type="button" class="chip-btn" onclick="this.form.Jumlah.value='${fmtNum(v)}'">${fmtNum(v)}</button>`).join('')}</div></div>
              <button class="btn btn-primary btn-block"><i class="bi bi-arrow-down-circle"></i> Proses Setoran Tunai</button></form></div>` : ''}
        </div>
      </div>`;
    Pages.anggotaDetail.drawTab(a);
  },
  refresh() { Router.render(); }
};
Pages.anggotaDetail = {
  tab(t) { const id = S.params.id; st('ad-' + id).tab = t; Router.render(); },
  drawTab(a) {
    const ui = st('ad-' + a.ID_Anggota), box = document.getElementById('adTab'); if (!box) return;
    if (ui.tab === 'mutasi') {
      const rows = S.db.simpanan.filter(x => x.ID_Anggota === a.ID_Anggota && (ui.jenis === 'semua' || x.Jenis === ui.jenis)).sort((x, y) => String(y.Tanggal).localeCompare(String(x.Tanggal)) || String(y.No_Bukti).localeCompare(String(x.No_Bukti)));
      box.innerHTML = `<div class="p-3 row-between"><div class="seg">${['semua', 'pokok', 'wajib', 'sukarela'].map(j => `<button class="${ui.jenis === j ? 'on' : ''}" ${on('Pages.anggotaDetail.jenis', j)}>${cap(j)}</button>`).join('')}</div>
        <div class="btn-group-k"><button class="btn btn-sm btn-outline" ${on('Pages.anggotaDetail.excel', a.ID_Anggota)}><i class="bi bi-file-earmark-excel"></i> Unduh XLS</button><button class="btn btn-sm btn-outline" ${on('Docs.kartuSimpanan', a.ID_Anggota)}><i class="bi bi-printer"></i> Cetak Koran</button></div></div>` +
        Tbl.html({ id: 'ad-mutasi', rows, unit: 'catatan mutasi', emptyIcon: 'bi-journal', emptyTitle: 'Belum ada mutasi simpanan',
          cols: [{ h: 'No. Transaksi', main: true, v: x => `<span class="mono">${esc(x.No_Bukti || 'menunggu…')}</span><div class="cell-sub">${fmtDate(x.Tanggal)}</div>` },
            { h: 'Jenis', v: simpBadge }, { h: 'Keterangan', v: x => `<div class="ellipsis" style="max-width:240px">${esc(x.Keterangan || '-')}</div><div class="cell-sub">${esc(x.Dicatat_Oleh || '')} · ${esc(x.Metode || '')}</div>` },
            { h: 'Masuk (Cr)', cls: 'num', v: x => x.Tipe === 'setor' ? `<span class="amt-in fw-600">+${fmtNum(x.Jumlah)}</span>` : '—' },
            { h: 'Keluar (Db)', cls: 'num', v: x => x.Tipe === 'tarik' ? `<span class="amt-out fw-600">-${fmtNum(x.Jumlah)}</span>` : '—' },
            { h: '', label: 'Bukti', cls: 'num', v: x => x.No_Bukti ? `<button class="btn btn-sm btn-ghost" aria-label="Cetak bukti" ${on('Docs.bukti', x.ID_Transaksi)}><i class="bi bi-printer"></i></button>` : '' }] });
    } else if (ui.tab === 'pembiayaan') {
      const loans = (D.loansByAng[a.ID_Anggota] || []).slice().sort((x, y) => String(y.Tgl_Pengajuan).localeCompare(String(x.Tgl_Pengajuan)));
      box.innerHTML = `<div class="row-between mb-3"><h3 class="font-head" style="font-size:16px">Riwayat Pembiayaan & Akad</h3>${canWrite() && a.Status === 'aktif' ? `<button class="btn btn-sm btn-primary" ${on('Nav.go', 'pinjaman-form', { id: a.ID_Anggota })}><i class="bi bi-plus-lg"></i> Ajukan Pembiayaan</button>` : ''}</div>` +
        (loans.length ? `<div class="grid g-2-lg">${loans.map(l => { const pc = paidCount(l); return `<div class="card-k hoverable" ${on('Nav.go', 'pinjaman-detail', { id: l.ID_Pinjaman })}><div class="row-between">${jenisBadge(l)}${loanBadge(l)}</div>
          <h4 class="font-head mt-2" style="font-size:15px">${esc(loanLabel(l))}</h4><div class="xs muted">${esc(l.No_Perjanjian || l.ID_Pinjaman)} • ${fmtDate(l.Tgl_Cair || l.Tgl_Pengajuan)}</div>
          <div class="row-between mt-2 small"><span>Plafon <b>${fmtRp(l.Pokok)}</b></span><span>Sisa <b>${fmtRp(l.Sisa_Tagihan)}</b></span></div>
          ${l.Status === 'berjalan' || l.Status === 'lunas' ? `<div class="mt-2">${progress(pc / l.Tenor * 100)}</div><div class="xs muted mt-1">${pc} dari ${l.Tenor} angsuran lunas</div>` : ''}</div>`; }).join('')}</div>` : empty('bi-wallet2', 'Belum pernah mengajukan pembiayaan'));
    } else if (ui.tab === 'dokumen') {
      const arsip = S.db.arsip.filter(d => d.ID_Anggota === a.ID_Anggota).sort((x, y) => String(y.Waktu).localeCompare(String(x.Waktu)));
      box.innerHTML = `<div class="row-between mb-2"><h3 class="font-head" style="font-size:16px"><i class="bi bi-google text-primary"></i> Arsip Google Drive</h3>${a.Link_Folder_Drive ? `<a class="btn btn-sm btn-outline" href="${esc(a.Link_Folder_Drive)}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i> Buka Folder</a>` : ''}</div>
        <div id="adFiles"><div class="text-center p-3 muted"><span class="spinner"></span> Memuat berkas dari Drive…</div></div>
        ${canWrite() ? `<form class="form-grid cols-2 mt-3" onsubmit="event.preventDefault();Pages.anggotaDetail.upload(this,'${esc(a.ID_Anggota)}')"><div class="fg"><label>Kategori berkas</label><select class="inp" name="kategori">${optList(['KTP', 'Pas Foto', 'SK Pengangkatan', 'Formulir Akad', 'Slip Gaji', 'Bukti Transfer', 'Lainnya'])}</select></div>
          <div class="fg"><label>Pilih berkas (PDF/JPG/PNG, maks. 5 MB)</label><input class="inp" type="file" name="file" accept=".pdf,.jpg,.jpeg,.png,.webp" required data-msg="Pilih berkas terlebih dahulu"></div>
          <button class="btn btn-soft full" style="grid-column:1/-1"><i class="bi bi-cloud-upload"></i> Unggah Dokumen ke Drive</button></form>` : ''}
        <h4 class="font-head mt-4 mb-2" style="font-size:14px">Arsip PDF dokumen cetak</h4>
        ${arsip.length ? `<div class="list">${arsip.map(d => `<div class="list-item"><span class="li-icon blue"><i class="bi bi-file-earmark-pdf"></i></span><div class="li-body"><b>${esc(d.Jenis)} ${esc(d.No_Dokumen)}</b><span>${fmtDateTime(d.Waktu)} · ${esc(d.Dibuat_Oleh)}</span></div><a class="btn btn-sm btn-ghost" href="${esc(d.URL)}" target="_blank" rel="noopener">Buka <i class="bi bi-box-arrow-up-right"></i></a></div>`).join('')}</div>` : '<p class="small muted">Belum ada PDF yang diarsipkan.</p>'}`;
      Pages.anggotaDetail.files(a.ID_Anggota);
    } else {
      const acc = S.db.pengguna.find(u => u.ID_Anggota === a.ID_Anggota);
      box.innerHTML = `<h3 class="font-head mb-3" style="font-size:16px">Data Pokok Keanggotaan</h3><dl class="kv">
        <dt>ID Anggota</dt><dd class="mono">${esc(a.ID_Anggota)}</dd><dt>NIK / NIP</dt><dd class="mono">${esc(a.NIK_NIP)}</dd><dt>Jabatan</dt><dd>${esc(a.Jabatan || '-')}</dd>
        <dt>Status kepegawaian</dt><dd>${esc(a.Status_Pegawai || '-')}</dd><dt>WhatsApp</dt><dd>${esc(a.No_HP || '-')}</dd><dt>Email</dt><dd>${esc(a.Email || '-')}</dd>
        <dt>Alamat</dt><dd>${esc(a.Alamat || '-')}</dd><dt>Bergabung</dt><dd>${fmtDate(a.Tgl_Bergabung)}</dd><dt>Status</dt><dd>${esc(cap(a.Status))}</dd>
        ${isAdmin() ? `<dt>Akun login</dt><dd>${acc ? esc(acc.Username) + ' · ' + esc(acc.Status) : '<span class="muted">belum ada</span>'}</dd>` : ''}
        <dt>Diperbarui</dt><dd>${fmtDateTime(a.Diperbarui)}</dd></dl>${a.Catatan ? `<div class="info-box mt-3"><i class="bi bi-sticky"></i><div>${esc(a.Catatan)}</div></div>` : ''}`;
    }
  },
  jenis(j) { st('ad-' + S.params.id).jenis = j; Tbl.reset('ad-mutasi'); Pages.anggotaDetail.drawTab(D.anggota[S.params.id]); },
  excel(id) {
    Docs.excel('Mutasi_Simpanan_' + id, [{ name: 'Mutasi', rows: S.db.simpanan.filter(x => x.ID_Anggota === id).sort((a, b) => String(a.Tanggal).localeCompare(String(b.Tanggal))).map(x => ({ 'No Bukti': x.No_Bukti, Tanggal: x.Tanggal, Jenis: x.Jenis, Tipe: x.Tipe, Masuk: x.Tipe === 'setor' ? num(x.Jumlah) : 0, Keluar: x.Tipe === 'tarik' ? num(x.Jumlah) : 0, Keterangan: x.Keterangan, Status: x.Status })) }]);
  },
  files(id) {
    if (String(id).startsWith('tmp_')) return;
    callApi('anggota.berkas', { ID_Anggota: id }).then(res => {
      const box = document.getElementById('adFiles'); if (!box) return;
      const files = (res.data && res.data.files) || [];
      box.innerHTML = files.length ? `<div class="list">${files.map(f => `<div class="list-item"><span class="li-icon ${/pdf/.test(f.mime) ? 'out' : 'gold'}"><i class="bi ${/pdf/.test(f.mime) ? 'bi-file-earmark-pdf' : 'bi-file-earmark-image'}"></i></span><div class="li-body"><b>${esc(f.name)}</b><span>${(f.size / 1024).toFixed(0)} KB · ${esc(f.updated)}</span></div><a class="btn btn-sm btn-ghost" href="${esc(f.url)}" target="_blank" rel="noopener">Buka <i class="bi bi-box-arrow-up-right"></i></a></div>`).join('')}</div>`
        : `<p class="small muted mb-0">Belum ada berkas di folder Drive anggota ini.</p>`;
    }).catch(e => { const box = document.getElementById('adFiles'); if (box) box.innerHTML = `<p class="small text-danger">Gagal memuat berkas: ${esc(e.message || e)}</p>`; });
  },
  upload(form, id) {
    const data = Form.check(form); if (!data) return;
    const file = form.file.files[0];
    if (file.size > 5 * 1024 * 1024) { toast('Ukuran berkas maksimal 5 MB.', 'warning'); return; }
    const btn = form.querySelector('button'); Form.busy(btn, true);
    const r = new FileReader();
    r.onload = () => {
      callApi('anggota.unggah', { ID_Anggota: id, kategori: data.kategori, fileName: file.name, mimeType: file.type, base64: String(r.result).split(',')[1], reqId: uid() })
        .then(res => { Form.busy(btn, false); if (res.success) { applyPatch(res.data); toast(res.message, 'success'); form.reset(); Pages.anggotaDetail.files(id); } else toast(res.message, 'danger'); })
        .catch(e => { Form.busy(btn, false); toast(e.message || String(e), 'danger'); });
    };
    r.readAsDataURL(file);
  }
};


// ════════════════════════════════════════════════════════
// HALAMAN: SIMPANAN & MUTASI KAS
// ════════════════════════════════════════════════════════
Pages.simpanan = {
  title: 'Simpanan & Mutasi Kas', roles: ['admin', 'bendahara', 'pengawas'],
  /** Pratinjau & proses simpanan wajib otomatis (tiap tanggal potong gaji, mulai bulan bergabung). */
  wajib() {
    Modal.open({ title: 'Simpanan Wajib Otomatis', icon: 'bi-calendar2-check', size: 'lg', sub: 'Dicatat setiap tanggal ' + tglPotong() + ' (potong gaji), dihitung mulai bulan bergabung',
      body: '<div id="swBody" class="text-center p-4"><span class="spinner"></span> Memeriksa simpanan wajib…</div>',
      foot: '<button class="btn btn-outline" data-bs-dismiss="modal">Tutup</button><button class="btn btn-primary" id="btnSwProses" disabled><i class="bi bi-check2-circle"></i> <span>Proses Sekarang</span></button>' });
    callApi('simpanan.wajib.cek').then(r => {
      const box = document.getElementById('swBody'); if (!box) return;
      if (!r.success) { box.innerHTML = `<div class="alert-k err"><i class="bi bi-x-octagon"></i><div>${esc(r.message)}</div></div>`; return; }
      const d = r.data, btn = document.getElementById('btnSwProses');
      const status = d.otomatis ? `<div class="info-box ok"><i class="bi bi-robot"></i><div><b>Otomatis AKTIF</b> — setiap tanggal ${d.tanggal} pukul 06.00 sistem mencatat simpanan wajib ${fmtRp(d.nominal)} untuk setiap anggota aktif (metode potong gaji). Bulan yang tertinggal sejak bergabung ikut dicatat, tidak sebelum ${fmtDate(d.mulai)}.</div></div>`
        : `<div class="info-box"><i class="bi bi-pause-circle"></i><div><b>Otomatis NONAKTIF.</b> Aktifkan di Pengaturan → Simpanan, atau proses manual dengan tombol di bawah.</div></div>`;
      const rows = d.items.length ? `<div class="table-wrap mt-3"><table class="tbl"><thead><tr><th>Anggota</th><th>Bulan</th><th class="num">Jumlah bulan</th><th class="num">Total</th></tr></thead><tbody>${d.items.map(x => `<tr><td><b>${esc(x.Nama)}</b><div class="cell-sub">${esc(x.ID_Anggota)}</div></td><td>${esc(x.dari === x.sampai ? x.dari : x.dari + ' s.d. ' + x.sampai)}</td><td class="num">${x.n}</td><td class="num fw-600">${fmtRp(x.total)}</td></tr>`).join('')}</tbody></table></div>`
        : `<div class="mt-3">${empty('bi-check2-all', 'Semua simpanan wajib sudah tercatat', 'Tidak ada bulan yang tertinggal s.d. hari ini.')}</div>`;
      box.className = '';
      box.innerHTML = status + rows + `<div class="xs muted mt-2">Bulan yang sudah punya setoran wajib (manual/payroll) dan bulan sebelum tanggal saldo awal (impor/migrasi) dilewati, sehingga tidak dobel.</div>`;
      if (d.n) { btn.disabled = false; btn.querySelector('span').textContent = 'Proses Sekarang (' + d.n + ' setoran, ' + fmtRp(d.total) + ')'; btn.onclick = () => { Modal.close(); commit({ action: 'simpanan.wajib', payload: {}, tables: ['simpanan'], label: 'Simpanan wajib otomatis', quiet: true, ok: res => toast(res.message, 'success', 'Simpanan wajib') }); toast('Mencatat ' + d.n + ' setoran simpanan wajib…', 'info'); }; }
    }).catch(e => { const box = document.getElementById('swBody'); if (box) box.innerHTML = `<div class="alert-k err"><i class="bi bi-wifi-off"></i><div>${esc(e.message || e)}</div></div>`; });
  },
  render(el) {
    const s = st('simpanan', { tab: 'mutasi', jenis: 'semua', tipe: 'semua', bulan: '', q: '' });
    el.innerHTML = pageHead({ crumbs: [['Dashboard', 'dashboard'], ['Simpanan & Mutasi Kas']], title: 'Simpanan & Mutasi Kas', desc: 'Setoran dan penarikan simpanan pokok, wajib, dan sukarela dengan bukti bernomor otomatis ber-QR.',
      actions: `<button class="btn btn-outline" onclick="Pages.simpanan.excel()"><i class="bi bi-file-earmark-excel"></i> Ekspor Excel</button>${canWrite() ? '<button class="btn btn-outline" onclick="Pages.simpanan.wajib()"><i class="bi bi-calendar2-check"></i> Wajib Otomatis</button>' : ''}${canWrite() ? '<button class="btn btn-primary" onclick="Pages.simpanan.kasir()"><i class="bi bi-plus-circle"></i> Transaksi Simpanan</button>' : ''}` }) + `
      <div class="grid g-kpi mb-3" id="simpKpi"></div>
      <div class="grid g-main-side">
        <div class="card-k flush"><div class="p-3 stack" style="gap:12px">
          ${tabs([['mutasi', 'Buku Mutasi', 'bi-journal-text'], ['saldo', 'Saldo per Anggota', 'bi-people']], s.tab, 'Pages.simpanan.setTab')}
          <div class="toolbar"><div class="inp-group grow"><span class="addon"><i class="bi bi-search"></i></span><input class="inp" type="search" value="${esc(s.q)}" placeholder="${s.tab === 'mutasi' ? 'Cari no. bukti, nama, keterangan…' : 'Cari nama / ID anggota…'}" oninput="Pages.simpanan.q(this.value)" aria-label="Cari"></div>
            ${s.tab === 'mutasi' ? `<select class="inp" style="width:auto" onchange="Pages.simpanan.set('jenis',this.value)" aria-label="Jenis">${optList([['semua', 'Semua jenis'], ['pokok', 'Pokok'], ['wajib', 'Wajib'], ['sukarela', 'Sukarela']], s.jenis)}</select>
            <select class="inp" style="width:auto" onchange="Pages.simpanan.set('tipe',this.value)" aria-label="Tipe">${optList([['semua', 'Setor & tarik'], ['setor', 'Setoran'], ['tarik', 'Penarikan'], ['batal', 'Dibatalkan']], s.tipe)}</select>
            <input class="inp" type="month" style="width:auto" value="${esc(s.bulan)}" onchange="Pages.simpanan.set('bulan',this.value)" aria-label="Bulan">` : ''}</div></div>
          <div id="simpList"></div></div>
        ${canWrite() ? `<div class="card-k flush detail-panel"><div class="panel-deep khatam-bg"><span class="khatam-star"></span><h3><i class="bi bi-cash-coin"></i> Kasir Simpanan</h3><p>Setoran & penarikan instan — tersimpan di latar</p></div><div class="p-3">${Pages.simpanan.formHtml('kz', {})}</div></div>`
        : `<div class="card-k soft">${empty('bi-eye', 'Mode hanya lihat', 'Peran Pengawas dapat memeriksa seluruh mutasi tanpa mengubah data.')}</div>`}
      </div>`;
    Pages.simpanan.refresh();
  },
  refresh() {
    const kp = document.getElementById('simpKpi'); if (!kp) return Router.render();
    const mk = monthKey(T()), sx = S.db.simpanan.filter(x => x.Status !== 'batal');
    const setorM = sum(sx.filter(x => x.Tipe === 'setor' && monthKey(x.Tanggal) === mk), 'Jumlah'), tarikM = sum(sx.filter(x => x.Tipe === 'tarik' && monthKey(x.Tanggal) === mk), 'Jumlah');
    const hari = sx.filter(x => x.Tanggal === T());
    kp.innerHTML = `<div class="hero khatam-bg"><span class="khatam-star"></span><span class="eyebrow">Total Simpanan Anggota</span><div class="hero-amount">${rp(D.simpananTotal.total)}</div><div class="hero-split"><div><span>Pokok</span><b>${fmtJt(D.simpananTotal.pokok)}</b></div><div><span>Wajib</span><b>${fmtJt(D.simpananTotal.wajib)}</b></div><div><span>Sukarela</span><b>${fmtJt(D.simpananTotal.sukarela)}</b></div></div></div>
      ${kpi({ label: 'Setoran Bulan Ini', value: rp(setorM), icon: 'bi-arrow-down-circle', sub: fmtMonthLong(mk) })}
      ${kpi({ label: 'Penarikan Bulan Ini', value: rp(tarikM), icon: 'bi-arrow-up-circle', tone: 'red', sub: 'Net ' + fmtRp(setorM - tarikM) })}
      ${kpi({ label: 'Transaksi Hari Ini', value: hari.length + ' <small>transaksi</small>', icon: 'bi-receipt', tone: 'gold', sub: fmtRp(sum(hari, x => (x.Tipe === 'tarik' ? -1 : 1) * num(x.Jumlah))) + ' bersih' })}`;
    Pages.simpanan.list();
    Pages.simpanan.info('kz');
  },
  setTab(t) { st('simpanan').tab = t; Router.render(); },
  set(k, v) { st('simpanan')[k] = v; Tbl.reset('simp'); Pages.simpanan.list(); },
  q: debounce(v => { st('simpanan').q = v; Tbl.reset('simp'); Pages.simpanan.list(); }, 200),
  rows() {
    const s = st('simpanan'), q = s.q.toLowerCase();
    return S.db.simpanan.filter(x => (s.jenis === 'semua' || x.Jenis === s.jenis) && (s.tipe === 'semua' || (s.tipe === 'batal' ? x.Status === 'batal' : x.Tipe === s.tipe && x.Status !== 'batal')) &&
      (!s.bulan || monthKey(x.Tanggal) === s.bulan) && (!q || [x.No_Bukti, angName(x.ID_Anggota), x.ID_Anggota, x.Keterangan].some(v => String(v || '').toLowerCase().includes(q))))
      .sort((a, b) => String(b.Tanggal).localeCompare(String(a.Tanggal)) || String(b.No_Bukti).localeCompare(String(a.No_Bukti)));
  },
  list() {
    const box = document.getElementById('simpList'); if (!box) return;
    const s = st('simpanan');
    if (s.tab === 'saldo') {
      const q = s.q.toLowerCase();
      const rows = S.db.anggota.filter(a => !q || a.Nama.toLowerCase().includes(q) || a.ID_Anggota.toLowerCase().includes(q)).map(a => Object.assign({ a }, D.saldo[a.ID_Anggota] || { pokok: 0, wajib: 0, sukarela: 0, total: 0 })).sort((x, y) => y.total - x.total);
      box.innerHTML = Tbl.html({ id: 'simp-saldo', rows, unit: 'anggota', rowAttr: r => on('Nav.go', 'anggota-detail', { id: r.a.ID_Anggota }),
        cols: [{ h: 'Anggota', main: true, v: r => `<div class="person">${avatar(r.a.Nama)}<div><div class="cell-main">${esc(r.a.Nama)}</div><div class="cell-sub">${esc(r.a.ID_Anggota)} · ${esc(r.a.Status)}</div></div></div>` },
          { h: 'Pokok', cls: 'num', v: r => fmtNum(r.pokok) }, { h: 'Wajib', cls: 'num', v: r => fmtNum(r.wajib) }, { h: 'Sukarela', cls: 'num', v: r => fmtNum(r.sukarela) }, { h: 'Total', cls: 'num', v: r => `<b>${fmtRp(r.total)}</b>` }],
        foot: `<tr><td class="td-main">Total ${rows.length} anggota</td><td class="num">${fmtNum(sum(rows, 'pokok'))}</td><td class="num">${fmtNum(sum(rows, 'wajib'))}</td><td class="num">${fmtNum(sum(rows, 'sukarela'))}</td><td class="num">${fmtRp(sum(rows, 'total'))}</td></tr>` });
      return;
    }
    const rows = Pages.simpanan.rows();
    box.innerHTML = Tbl.html({ id: 'simp', rows, unit: 'mutasi', emptyIcon: 'bi-journal', emptyTitle: 'Tidak ada mutasi', rowCls: x => x.Status === 'batal' ? 'pending' : '',
      cols: [{ h: 'No. Bukti & Tanggal', main: true, v: x => `<span class="mono fw-600">${x.No_Bukti ? esc(x.No_Bukti) : '<span class="spinner" style="width:12px;height:12px"></span> menunggu nomor'}</span><div class="cell-sub">${fmtDate(x.Tanggal)} · ${esc(cap(x.Metode || ''))}</div>` },
        { h: 'Anggota', v: x => `<div class="cell-main">${esc(angName(x.ID_Anggota))}</div><div class="cell-sub">${esc(x.ID_Anggota)}</div>` },
        { h: 'Jenis', v: simpBadge }, { h: 'Keterangan', hideSm: true, v: x => `<div class="ellipsis" style="max-width:220px" title="${esc(x.Keterangan)}">${esc(x.Keterangan || '-')}</div><div class="cell-sub">${esc(x.Dicatat_Oleh || '')}</div>` },
        { h: 'Masuk', cls: 'num', v: x => x.Tipe === 'setor' ? `<span class="amt-in fw-600">+${fmtNum(x.Jumlah)}</span>` : '—' },
        { h: 'Keluar', cls: 'num', v: x => x.Tipe === 'tarik' ? `<span class="amt-out fw-600">-${fmtNum(x.Jumlah)}</span>` : '—' },
        { h: '', label: 'Aksi', cls: 'num nowrap', v: x => x.No_Bukti ? `<button class="btn btn-sm btn-ghost" aria-label="Cetak bukti" ${on('Docs.bukti', x.ID_Transaksi)}><i class="bi bi-printer"></i></button>${isAdmin() && x.Status !== 'batal' ? `<button class="btn btn-sm btn-ghost text-danger" aria-label="Batalkan" ${on('Pages.simpanan.batal', x.ID_Transaksi)}><i class="bi bi-x-circle"></i></button>` : ''}` : '' }],
      foot: `<tr><td class="td-main" colspan="4">Total ${rows.length} mutasi tersaring</td><td class="num amt-in">+${fmtNum(sum(rows.filter(x => x.Tipe === 'setor' && x.Status !== 'batal'), 'Jumlah'))}</td><td class="num amt-out">-${fmtNum(sum(rows.filter(x => x.Tipe === 'tarik' && x.Status !== 'batal'), 'Jumlah'))}</td><td></td></tr>` });
  },
  /** Formulir kasir (dipakai di panel samping & modal). */
  formHtml(px, d) {
    return `<form id="${px}Form" class="form-grid" novalidate onsubmit="event.preventDefault();Pages.simpanan.submit('${px}')">
      <div class="fg"><label>Anggota <span class="req">*</span></label>${anggotaPicker(px + 'Ang', d.id, { all: true, onchange: "Pages.simpanan.info('" + px + "')" })}<div id="${px}Info" class="hint"></div></div>
      <div class="fg"><label>Jenis transaksi</label><div class="seg" role="radiogroup">${[['setor', 'Setoran'], ['tarik', 'Penarikan']].map(t => `<button type="button" class="${(d.tipe || 'setor') === t[0] ? 'on' : ''}" data-tipe="${t[0]}" onclick="Pages.simpanan.tipe('${px}','${t[0]}')">${t[1]}</button>`).join('')}</div><input type="hidden" name="Tipe" value="${esc(d.tipe || 'setor')}"></div>
      <div class="fg"><label>Jenis simpanan</label><select class="inp" name="Jenis" onchange="Pages.simpanan.info('${px}')">${optList([['wajib', 'Simpanan Wajib'], ['sukarela', 'Simpanan Sukarela / Wadiah'], ['pokok', 'Simpanan Pokok']], d.jenis || 'wajib')}</select></div>
      <div class="fg"><label>Nominal <span class="req">*</span></label><div class="inp-group"><span class="addon rp">Rp</span><input class="inp money-inp" name="Jumlah" data-money required inputmode="numeric" placeholder="0" value="${d.jumlah ? fmtNum(d.jumlah) : ''}" data-msg="Nominal wajib diisi"></div>
        <div class="chips mt-1">${[50000, 100000, 250000, 500000].map(v => `<button type="button" class="chip-btn" onclick="this.form.Jumlah.value='${fmtNum(v)}'">${fmtJt(v)}</button>`).join('')}</div><span class="err-msg"></span></div>
      <div class="form-grid cols-2"><div class="fg"><label>Metode</label><select class="inp" name="Metode">${optList([['tunai', 'Tunai di loket'], ['payroll', 'Potong gaji'], ['transfer', 'Transfer bank']], 'tunai')}</select></div>
        <div class="fg"><label>Tanggal</label><input class="inp" type="date" name="Tanggal" value="${T()}" max="${T()}" required></div></div>
      <div class="fg"><label>Keterangan</label><input class="inp" name="Keterangan" placeholder="opsional" maxlength="200"></div>
      <label class="check"><input type="checkbox" name="cetak" checked> Cetak bukti setelah tersimpan</label>
      <button class="btn btn-primary btn-lg btn-block" type="submit"><i class="bi bi-check2-circle"></i> Proses Transaksi</button></form>`;
  },
  tipe(px, t) { const f = document.getElementById(px + 'Form'); f.Tipe.value = t; f.querySelectorAll('[data-tipe]').forEach(b => b.classList.toggle('on', b.dataset.tipe === t)); Pages.simpanan.info(px); },
  info(px) {
    const f = document.getElementById(px + 'Form'), box = document.getElementById(px + 'Info'); if (!f || !box) return;
    const id = pickId(f[px + 'Ang'].value);
    if (!id) { box.innerHTML = ''; return; }
    const a = D.anggota[id], s = D.saldo[id] || {};
    box.innerHTML = `<span class="${a.Status === 'aktif' ? 'text-success' : 'text-danger'}"><i class="bi bi-circle-fill" style="font-size:7px"></i> ${esc(cap(a.Status))}</span> · Saldo ${esc(f.Jenis.value)}: <b>${fmtRp(s[f.Jenis.value] || 0)}</b> · Total ${fmtRp(s.total || 0)}`;
  },
  kasir(d) {
    if (!canWrite()) return;
    d = d || {};
    Modal.open({ title: d.tipe === 'tarik' ? 'Penarikan Simpanan' : 'Transaksi Simpanan', sub: 'Bukti bernomor & ber-QR dibuat otomatis', icon: 'bi-cash-coin', body: Pages.simpanan.formHtml('km', d) });
    setTimeout(() => Pages.simpanan.info('km'), 0);
  },
  quick(form, id) {
    const data = Form.check(form); if (!data) return;
    Pages.simpanan.doSave({ ID_Anggota: id, Jenis: data.Jenis, Tipe: 'setor', Jumlah: parseRp(data.Jumlah), Metode: 'tunai', Tanggal: T(), Keterangan: 'Setoran tunai kasir loket' }, true, () => form.reset());
  },
  submit(px) {
    const f = document.getElementById(px + 'Form');
    const data = Form.check(f, { [px + 'Ang']: v => pickId(v) ? '' : 'Pilih anggota dari daftar', Jumlah: v => parseRp(v) > 0 ? '' : 'Nominal harus lebih dari 0' });
    if (!data) return;
    const rec = { ID_Anggota: pickId(data[px + 'Ang']), Jenis: data.Jenis, Tipe: data.Tipe, Jumlah: parseRp(data.Jumlah), Metode: data.Metode, Tanggal: data.Tanggal, Keterangan: data.Keterangan };
    const ok = Pages.simpanan.doSave(rec, !!f.cetak.checked, () => { f.Jumlah.value = ''; f.Keterangan.value = ''; if (px === 'km') Modal.close(); });
    if (!ok) return;
  },
  /** Validasi lokal (sama dengan server) lalu commit optimistis. */
  doSave(rec, cetak, done) {
    const a = D.anggota[rec.ID_Anggota], st0 = S.settings, saldo = Calc.saldo(rec.ID_Anggota, rec.Jenis);
    let err = '';
    if (!a) err = 'Anggota tidak ditemukan.';
    else if (rec.Tipe === 'setor' && a.Status !== 'aktif') err = 'Setoran hanya untuk anggota berstatus aktif.';
    else if (rec.Tipe === 'setor' && rec.Jenis === 'pokok' && saldo + rec.Jumlah > num(st0.SIMPANAN_POKOK)) err = 'Simpanan pokok maksimal ' + fmtRp(st0.SIMPANAN_POKOK) + ' (saldo saat ini ' + fmtRp(saldo) + ').';
    else if (rec.Tipe === 'tarik' && rec.Jumlah > saldo) err = 'Penarikan melebihi saldo ' + rec.Jenis + ' (' + fmtRp(saldo) + ').';
    else if (rec.Tipe === 'tarik' && rec.Jenis !== 'sukarela' && a.Status === 'aktif') err = 'Simpanan pokok & wajib hanya dapat ditarik saat anggota keluar (nonaktif).';
    if (err) { toast(err, 'warning', 'Tidak dapat diproses'); return false; }
    const tmp = uid();
    commit({ action: 'simpanan.simpan', quiet: true, payload: Object.assign({ tmpId: tmp }, rec), tables: ['simpanan'], label: 'Simpanan',
      apply: () => S.db.simpanan.push(Object.assign({ ID_Transaksi: tmp, No_Bukti: '', Dicatat_Oleh: S.user.nama, Status: 'sah', _pending: true }, rec)),
      ok: res => { if (cetak) { const real = (res.data.tempMap || {})[tmp]; if (real) Docs.bukti(real); } } });
    toast((rec.Tipe === 'setor' ? 'Setoran ' : 'Penarikan ') + fmtRp(rec.Jumlah) + ' — ' + a.Nama, 'success', 'Tercatat');
    if (done) done();
    return true;
  },
  batal(id) {
    const x = S.db.simpanan.find(t => t.ID_Transaksi === id); if (!x) return;
    confirmDialog({ title: 'Batalkan transaksi ' + x.No_Bukti + '?', text: 'Transaksi tidak dihapus, tetapi ditandai BATAL dan tidak dihitung dalam saldo. Jejak audit tetap tersimpan.', ok: 'Batalkan transaksi', danger: true, input: { label: 'Alasan pembatalan', placeholder: 'mis. salah input nominal' } })
      .then(alasan => { if (!alasan) return; commit({ action: 'simpanan.batal', payload: { ID_Transaksi: id, alasan }, tables: ['simpanan'], apply: () => { const r = S.db.simpanan.find(t => t.ID_Transaksi === id); r.Status = 'batal'; } }); });
  },
  excel() {
    Docs.excel('Mutasi_Simpanan_' + T(), [{ name: 'Mutasi', rows: Pages.simpanan.rows().map(x => ({ 'No Bukti': x.No_Bukti, Tanggal: x.Tanggal, 'ID Anggota': x.ID_Anggota, Nama: angName(x.ID_Anggota), Jenis: x.Jenis, Tipe: x.Tipe, Jumlah: num(x.Jumlah), Metode: x.Metode, Keterangan: x.Keterangan, Petugas: x.Dicatat_Oleh, Status: x.Status })) }]);
  }
};

// ════════════════════════════════════════════════════════
// HALAMAN: DAFTAR PINJAMAN & PEMBIAYAAN
// ════════════════════════════════════════════════════════
Pages.pinjaman = {
  title: 'Pinjaman & Pembiayaan', roles: ['admin', 'bendahara', 'pengawas'],
  tab(t) { st('pinjaman', { tab: 'semua', q: '', sort: 'terbaru' }).tab = t; Tbl.reset('pinj'); if (S.page === 'pinjaman') Router.render(); else Nav.go('pinjaman'); },
  render(el) {
    const s = st('pinjaman', { tab: 'semua', q: '', sort: 'terbaru' });
    const L = S.db.pinjaman, y = T().slice(0, 4);
    const cairTh = L.filter(l => l.Tgl_Cair && l.Tgl_Cair.slice(0, 4) === y);
    const kol = Rep.kolektibilitas();
    const tung = new Set(D.tunggakan.map(t => t.loan.ID_Pinjaman));
    const c = k => L.filter(l => Pages.pinjaman.match(l, k, tung)).length;
    el.innerHTML = pageHead({ crumbs: [['Dashboard', 'dashboard'], ['Pembiayaan']], title: 'Daftar Pinjaman & Pembiayaan', desc: 'Kelola portofolio pembiayaan syariah: qardh/uang (bunga ' + fmtPct(Calc.rate('uang')) + '% dari pokok × lama angsuran) dan murabahah barang (margin ' + fmtPct(Calc.rate('barang')) + '% dari harga barang × lama angsuran), status persetujuan, dan jadwal tagihan.',
      actions: `<button class="btn btn-outline" onclick="Pages.pinjaman.excel()"><i class="bi bi-file-earmark-excel"></i> Export Excel</button><button class="btn btn-outline" onclick="Docs.laporan('pinjaman')"><i class="bi bi-printer"></i> Cetak Rekap</button>${canWrite() ? `<button class="btn btn-primary" ${on('Nav.go', 'pinjaman-form')}><i class="bi bi-plus-circle"></i> Pengajuan Pinjaman Baru</button>` : ''}` }) + `
      <div class="grid g-kpi mb-3">
        ${kpi({ label: 'Plafon Disalurkan ' + y, value: rp(sum(cairTh, 'Pokok')), icon: 'bi-cash-stack', sub: cairTh.length + ' akad cair tahun ini' })}
        ${kpi({ label: 'Sisa Pokok Piutang', value: rp(D.sisaPokok.uang + D.sisaPokok.barang), icon: 'bi-hourglass-split', tone: 'gold', sub: D.berjalan.length + ' akad berjalan' + progress(pct(D.sisaPokok.uang + D.sisaPokok.barang, sum(D.berjalan, 'Pokok')), 'mt-1') })}
        <div class="card-k" style="border-top:4px solid var(--primary)" role="button" tabindex="0" onclick="Pages.pinjaman.tab('menunggu')"><div class="kpi"><div class="kpi-top"><span class="kpi-label" style="color:var(--primary)">Verifikasi Sidang</span>${D.pending.length ? badge(D.pending.length + ' perlu sidang', 'b-gold') : ''}</div><div class="kpi-value" style="color:var(--primary)">${D.pending.length} <small>pengajuan</small></div><div class="kpi-sub">Antrean ${fmtRp(sum(D.pending, 'Pokok'))}</div></div></div>
        ${kpi({ label: 'Kolektibilitas / NPL', value: kol.lancar.toFixed(1).replace('.', ',') + '%', icon: 'bi-shield-check', sub: `<span class="text-danger">NPL ${kol.npl.toFixed(1).replace('.', ',')}%</span> · ${kol.debitur} debitur menunggak` + `<div class="progress-k mt-1" style="width:100%"><span style="width:${kol.lancar}%"></span><span class="red" style="width:${kol.npl}%"></span></div>` })}
      </div>
      <div class="card-k flush"><div class="p-3 stack" style="gap:12px">
        ${tabs([['semua', 'Semua', '', c('semua')], ['uang', 'Pinjaman Uang', '', c('uang')], ['barang', 'Pinjaman Barang', '', c('barang')], ['menunggu', 'Menunggu Persetujuan', '', c('menunggu')], ['disetujui', 'Siap Cair', '', c('disetujui')], ['berjalan', 'Berjalan', '', c('berjalan')], ['menunggak', 'Menunggak', '', c('menunggak')], ['lunas', 'Lunas', '', c('lunas')], ['ditolak', 'Ditolak/Batal', '', c('ditolak')]], s.tab, 'Pages.pinjaman.tab')}
        <div class="toolbar"><div class="inp-group grow"><span class="addon"><i class="bi bi-search"></i></span><input class="inp" type="search" value="${esc(s.q)}" placeholder="Cari no. perjanjian, nama pemohon, NIK, barang…" oninput="Pages.pinjaman.q(this.value)" aria-label="Cari pinjaman"></div>
          <select class="inp" style="width:auto" onchange="st('pinjaman').sort=this.value;Pages.pinjaman.list()" aria-label="Urutkan">${optList([['terbaru', 'Terbaru'], ['terlama', 'Terlama'], ['nominal', 'Nominal terbesar'], ['sisa', 'Sisa tagihan terbesar']], s.sort)}</select></div></div>
        <div id="pinjList"></div></div>`;
    Pages.pinjaman.list();
  },
  match(l, k, tung) {
    switch (k) {
      case 'uang': case 'barang': return l.Jenis === k;
      case 'menunggu': return l.Status === 'diajukan';
      case 'menunggak': return tung.has(l.ID_Pinjaman);
      case 'ditolak': return l.Status === 'ditolak' || l.Status === 'dibatalkan';
      case 'semua': return true;
      default: return l.Status === k;
    }
  },
  q: debounce(v => { st('pinjaman').q = v; Tbl.reset('pinj'); Pages.pinjaman.list(); }, 200),
  rows() {
    const s = st('pinjaman'), q = s.q.toLowerCase(), tung = new Set(D.tunggakan.map(t => t.loan.ID_Pinjaman));
    const rows = S.db.pinjaman.filter(l => Pages.pinjaman.match(l, s.tab, tung) && (!q || [l.ID_Pinjaman, l.No_Perjanjian, angName(l.ID_Anggota), (D.anggota[l.ID_Anggota] || {}).NIK_NIP, loanLabel(l)].some(v => String(v || '').toLowerCase().includes(q))));
    const so = { terbaru: (a, b) => String(b.Tgl_Pengajuan).localeCompare(String(a.Tgl_Pengajuan)), terlama: (a, b) => String(a.Tgl_Pengajuan).localeCompare(String(b.Tgl_Pengajuan)), nominal: (a, b) => b.Pokok - a.Pokok, sisa: (a, b) => b.Sisa_Tagihan - a.Sisa_Tagihan };
    return rows.sort(so[s.sort] || so.terbaru);
  },
  list() {
    const box = document.getElementById('pinjList'); if (!box) return;
    const rows = Pages.pinjaman.rows(), tung = new Set(D.tunggakan.map(t => t.loan.ID_Pinjaman));
    box.innerHTML = Tbl.html({ id: 'pinj', rows, unit: 'pembiayaan', emptyIcon: 'bi-credit-card-2-front', emptyTitle: 'Tidak ada data pembiayaan',
      rowAttr: l => on('Nav.go', 'pinjaman-detail', { id: l.ID_Pinjaman }), rowCls: l => tung.has(l.ID_Pinjaman) ? 'row-danger' : l.Status === 'diajukan' ? 'row-warn' : '',
      cols: [{ h: 'No. Perjanjian & Tgl', main: true, v: l => `<span class="mono fw-600">${esc(l.No_Perjanjian || l.ID_Pinjaman)}</span><div class="cell-sub">${esc(l.No_Perjanjian ? l.ID_Pinjaman + ' · ' : '')}${fmtDate(l.Tgl_Cair || l.Tgl_Pengajuan)}</div>` },
        { h: 'Anggota / Debitur', v: l => `<div class="person">${avatar(angName(l.ID_Anggota))}<div><div class="cell-main">${esc(angName(l.ID_Anggota))}</div><div class="cell-sub">${esc((D.anggota[l.ID_Anggota] || {}).Jabatan || '')} · ${esc(l.ID_Anggota)}</div></div></div>` },
        { h: 'Fasilitas & Komoditas', v: l => jenisBadge(l) + `<div class="cell-sub ellipsis" style="max-width:200px">${esc(loanLabel(l))}</div>` },
        { h: 'Plafon Pokok', cls: 'num', v: l => `<b>${fmtRp(l.Pokok)}</b>` },
        { h: 'Tenor', cls: 'num', v: l => `${l.Tenor} bln<div class="cell-sub">${fmtPct(Calc.loanPct(l))}%/bln</div>` },
        { h: 'Angsuran/bln', cls: 'num', v: l => fmtRp(l.Angsuran_per_Bulan) },
        { h: 'Sisa Tagihan', cls: 'num', v: l => `<b class="${tung.has(l.ID_Pinjaman) ? 'text-danger' : l.Status === 'berjalan' ? 'text-primary' : ''}">${fmtRp(['diajukan', 'disetujui', 'ditolak', 'dibatalkan'].includes(l.Status) ? 0 : l.Sisa_Tagihan)}</b>${l.Status === 'berjalan' ? `<div class="cell-sub">${paidCount(l)}/${l.Tenor} lunas</div>` : ''}` },
        { h: 'Status', v: loanBadge }],
      foot: `<tr><td class="td-main" colspan="3">Total plafon tersaring</td><td class="num">${fmtRp(sum(rows, 'Pokok'))}</td><td></td><td class="num">${fmtRp(sum(rows.filter(l => l.Status === 'berjalan'), 'Angsuran_per_Bulan'))}</td><td class="num">${fmtRp(sum(rows.filter(l => ['berjalan', 'lunas'].includes(l.Status)), 'Sisa_Tagihan'))}</td><td></td></tr>` });
  },
  excel() {
    Docs.excel('Portofolio_Pembiayaan_' + T(), [{ name: 'Pinjaman', rows: Pages.pinjaman.rows().map(l => ({ 'ID Pinjaman': l.ID_Pinjaman, 'No Perjanjian': l.No_Perjanjian, 'ID Anggota': l.ID_Anggota, Nama: angName(l.ID_Anggota), Jenis: l.Jenis, Komoditas: loanLabel(l),
      'Tgl Pengajuan': l.Tgl_Pengajuan, 'Tgl Cair': l.Tgl_Cair, Pokok: l.Pokok, 'Bunga %/bulan': Calc.loanPct(l), Tenor: l.Tenor, 'Total Bunga': l.Total_Bunga, 'Total Tagihan': l.Total_Tagihan, 'Angsuran/bln': l.Angsuran_per_Bulan, 'Sisa Tagihan': l.Sisa_Tagihan, Status: l.Status })) }]);
  }
};

// ════════════════════════════════════════════════════════
// FORMULIR PENGAJUAN PINJAMAN (staf & anggota) — simulasi live + draf otomatis
// ════════════════════════════════════════════════════════
const LoanForm = {
  key() { return 'sk_draft_loan_' + (S.user ? S.user.username : ''); },
  html(member, presetId) {
    const d = Store.lget(LoanForm.key(), {}) || {};
    const jenis = d.Jenis || 'uang', st0 = S.settings;
    const brg = S.db.barang.filter(b => b.Status !== 'nonaktif');
    return `<form id="loanForm" novalidate onsubmit="event.preventDefault();LoanForm.submit(${member ? 'true' : 'false'})" oninput="LoanForm.update()" onchange="LoanForm.update()">
      <div class="stepper" id="lfStep"></div>
      <div class="stack">
      ${member ? '' : `<div class="card-k"><div class="fg"><label>Anggota pemohon <span class="req">*</span></label>${anggotaPicker('lfAng', presetId || d.lfAngId || '', { onchange: 'LoanForm.update()' })}<div id="lfAngInfo" class="hint"></div><span class="err-msg"></span></div></div>`}
      <div class="card-k"><div class="row-between mb-2"><span class="label">Fasilitas pembiayaan</span><span class="xs fw-600 text-primary">Sesuai prinsip syariah</span></div>
        <div class="stack" style="gap:10px">
          <label class="choice"><input type="radio" name="Jenis" value="uang" ${jenis === 'uang' ? 'checked' : ''}><span class="c-body"><span class="c-icon"><i class="bi bi-cash-coin"></i></span><span style="flex:1"><b>Pinjaman Uang ${badge('Qardh', 'b-gold')}</b><small class="text-primary fw-600">Bunga ${fmtPct(Calc.rate('uang'))}% dari pokok × lama angsuran (bulan)</small><small>Kebutuhan tunai multiguna • plafon s.d. ${fmtRp(st0.PLAFON_UANG)}</small></span><span class="c-check"><i class="bi bi-check"></i></span></span></label>
          <label class="choice"><input type="radio" name="Jenis" value="barang" ${jenis === 'barang' ? 'checked' : ''}><span class="c-body"><span class="c-icon"><i class="bi bi-box-seam"></i></span><span style="flex:1"><b>Pinjaman Barang ${badge('Murabahah', 'b-gray')}</b><small class="text-primary fw-600">Margin ${fmtPct(Calc.rate('barang'))}% dari harga barang × lama angsuran (bulan)</small><small>Katalog elektronik, seragam & kebutuhan sekolah</small></span><span class="c-check"><i class="bi bi-check"></i></span></span></label>
        </div></div>
      <div class="card-k form-grid">
        ${member ? '' : `<div class="fg"><label>Tanggal pengajuan <span class="req">*</span></label><input class="inp" type="date" name="Tgl_Pengajuan" value="${esc(d.Tgl_Pengajuan && d.Tgl_Pengajuan >= tglMulaiPinjaman() && d.Tgl_Pengajuan <= T() ? d.Tgl_Pengajuan : T())}" min="${tglMulaiPinjaman()}" max="${T()}"><span class="hint">Untuk memasukkan <b>data pinjaman lama</b>, pilih tanggal sejak ${fmtDate(tglMulaiPinjaman())}. Tanggal lampau = data lama (stok & batas satu pinjaman aktif tidak diperiksa).</span></div>`}
        <div id="lfUang" class="fg"><label>Nominal pengajuan pinjaman <span class="req">*</span></label><div class="inp-group"><span class="addon rp">Rp</span><input class="inp money-inp" name="Pokok" data-money inputmode="numeric" placeholder="0" value="${d.Pokok ? fmtNum(d.Pokok) : ''}"></div>
          <div class="row-between xs mt-1"><span><i class="bi bi-shield-check text-primary"></i> Batas plafon guru/staf: s.d. ${fmtRp(st0.PLAFON_UANG)}</span><span class="text-primary fw-600">Bunga ${fmtPct(Calc.rate('uang'))}% × lama angsuran</span></div>
          <span class="err-msg"></span><div class="label mt-2">Pilihan nominal cepat:</div><div class="chips">${[1000000, 2500000, 5000000, 10000000].map(v => `<button type="button" class="chip-btn" onclick="LoanForm.add(${v})">+${fmtJt(v)}</button>`).join('')}<button type="button" class="chip-btn" onclick="LoanForm.add(0)">Reset</button></div></div>
        <div id="lfBarang" class="form-grid cols-2" hidden><div class="fg full"><label>Pilih barang dari katalog <span class="req">*</span></label><select class="inp" name="ID_Barang"><option value="">— pilih barang —</option>${brg.map(b => `<option value="${esc(b.ID_Barang)}" ${d.ID_Barang === b.ID_Barang ? 'selected' : ''} ${num(b.Stok) <= 0 ? 'disabled' : ''}>${esc(b.Nama)} — ${fmtRp(b.Harga_Jual)} (stok ${b.Stok})</option>`).join('')}</select><span class="err-msg"></span></div>
          <div class="fg"><label>Jumlah (qty)</label><input class="inp" type="number" name="Qty" min="1" value="${esc(d.Qty || 1)}"></div><div class="fg"><label>Spesifikasi</label><div class="hint" id="lfSpec" style="padding-top:12px">—</div></div></div>
        <div class="fg"><label>Jangka waktu (tenor) <span class="req">*</span></label><select class="inp" name="Tenor" id="lfTenor"></select><span class="hint" id="lfTenorHint"></span></div>
        <div class="fg"><label>Keperluan / tujuan pembiayaan</label><textarea class="inp" name="Keperluan" rows="2" maxlength="300" placeholder="mis. Biaya pendidikan & renovasi laptop dinas mengajar">${esc(d.Keperluan || '')}</textarea></div>
      </div>
      <div class="card-k mint"><div class="row-between mb-2"><div class="person"><span class="kpi-icon"><i class="bi bi-calculator"></i></span><div><b class="font-head">Simulasi Perhitungan Flat</b><div class="xs muted">Kalkulasi otomatis sistem</div></div></div><span id="lfRate"></span></div>
        <div class="card-k" style="box-shadow:none"><dl class="kv" id="lfSim"></dl></div>
        <div class="hero khatam-bg mt-2" style="padding:16px"><span class="khatam-star"></span><span class="eyebrow" style="color:#F4CF6B">Estimasi Angsuran Bulanan</span><div class="hero-amount" id="lfAngs">Rp 0</div><div class="small muted" id="lfAngsSub"></div></div>
        <button type="button" class="btn btn-ghost btn-sm mt-2" onclick="const b=document.getElementById('lfSched');b.hidden=!b.hidden"><i class="bi bi-calendar3"></i> Lihat rincian jadwal angsuran</button><div id="lfSched" hidden></div></div>
      ${member ? `<div class="card-k"><div class="row-between mb-2"><span class="label">Lampiran dokumen</span><span class="xs muted">PDF/JPG • maks. 5 MB</span></div><input class="inp" type="file" name="lampiran" accept=".pdf,.jpg,.jpeg,.png"><span class="hint">Opsional: slip gaji / rekomendasi unit. Diunggah ke folder Drive pribadi Anda.</span></div>` : ''}
      <div class="card-k"><label class="check"><input type="checkbox" name="setuju" required data-msg="Centang persetujuan akad terlebih dahulu"> <span>Saya menyetujui ketentuan <b>akad syariah</b> koperasi dan bersedia angsuran (pinjaman uang / pembelian barang) <b>dipotong dari gaji</b> bulanan ${esc(st0.SEKOLAH || '')} <b>setiap tanggal ${tglPotong()}</b>.</span></label><span class="err-msg"></span></div>
      <div id="lfWarn"></div>
      <div class="row-gap" style="flex-wrap:nowrap"><button type="button" class="btn btn-info-soft btn-lg" onclick="LoanForm.draft(true)"><i class="bi bi-bookmark"></i> Draf</button><button type="submit" class="btn btn-primary btn-lg" style="flex:1">Kirim Pengajuan <i class="bi bi-arrow-right"></i></button></div>
      </div></form>`;
  },
  mount(member) { LoanForm.member = member; LoanForm.update(true); },
  add(v) { const f = document.getElementById('loanForm'); f.Pokok.value = v ? fmtNum(Math.min(num(S.settings.PLAFON_UANG), parseRp(f.Pokok.value) + v)) : ''; LoanForm.update(); },
  read() {
    const f = document.getElementById('loanForm'); if (!f) return null;
    const jenis = f.Jenis.value || 'uang';
    const idAng = LoanForm.member ? S.user.idAnggota : pickId(f.lfAng && f.lfAng.value);
    const brg = D.barang[f.ID_Barang.value], qty = Math.max(1, parseInt(f.Qty.value, 10) || 1);
    const pokok = jenis === 'uang' ? parseRp(f.Pokok.value) : brg ? num(brg.Harga_Jual) * qty : 0;
    let tglAju = f.Tgl_Pengajuan ? f.Tgl_Pengajuan.value || T() : T();
    if (tglAju > T()) tglAju = T();
    return { f, jenis, idAng, brg, qty, pokok, tglAju, lama: tglAju < T(), tenor: parseInt(f.Tenor.value, 10) || 0, persen: Calc.rate(jenis), Keperluan: f.Keperluan.value.trim() };
  },
  /** Hitung ulang simulasi, validasi ringan & stepper — dipanggil setiap input (0 ms, lokal). */
  update(first) {
    const r = LoanForm.read(); if (!r) return;
    const f = r.f;
    document.getElementById('lfUang').hidden = r.jenis !== 'uang';
    document.getElementById('lfBarang').hidden = r.jenis !== 'barang';
    const tsel = document.getElementById('lfTenor'), opts = Calc.tenors(r.jenis), rg = Calc.tenorRange(r.jenis), sig = r.jenis + ':' + rg.min + '-' + rg.max;
    let prev = +(r.tenor || (Store.lget(LoanForm.key(), {}) || {}).Tenor || 0);
    if (!opts.includes(prev)) prev = opts.includes(10) ? 10 : opts[0];
    if (tsel.dataset.j !== sig) {
      tsel.innerHTML = opts.map(t => `<option value="${t}" ${t === prev ? 'selected' : ''}>${t} Bulan${t === 10 ? ' (rekomendasi kalender akademik)' : ''}</option>`).join('');
      tsel.dataset.j = sig;
      document.getElementById('lfTenorHint').textContent = 'Tenor yang diizinkan: ' + rg.min + ' sampai ' + rg.max + ' bulan.';
    }
    const tenor = parseInt(tsel.value, 10) || opts[0];
    const h = Calc.pinjaman(r.pokok, r.persen, tenor);
    document.getElementById('lfRate').innerHTML = badge((r.jenis === 'uang' ? 'Bunga ' : 'Margin ') + fmtPct(r.persen) + '% × ' + tenor + ' bln', 'b-solid');
    document.getElementById('lfSim').innerHTML = `<dt>${r.jenis === 'uang' ? 'Pokok pinjaman' : 'Harga barang' + (r.qty > 1 ? ' ×' + r.qty : '')}</dt><dd>${fmtRp(h.pokok)}</dd><dt>Total ${r.jenis === 'uang' ? 'bunga' : 'margin'} (${r.jenis === 'uang' ? 'pokok' : 'harga barang'} × ${fmtPct(r.persen)}% × ${tenor} bln)</dt><dd>${fmtRp(h.totalBunga)} <span class="xs muted">(${fmtRp(h.bungaBulan)}/bln × ${tenor})</span></dd><dt class="fw-700" style="color:var(--text)">Total pengembalian</dt><dd class="text-primary" style="font-size:15px">${fmtRp(h.total)}</dd>`;
    document.getElementById('lfAngs').innerHTML = rp(h.angsuran) + ' <span style="font-size:14px;font-weight:500;opacity:.8">/ bulan</span>';
    const first1 = addMonths(r.tglAju, 1, tglPotong());
    document.getElementById('lfAngsSub').innerHTML = `<i class="bi bi-check-circle"></i> Dipotong otomatis dari gaji setiap tanggal ${tglPotong()} • ${tenor}× angsuran • mulai ${fmtDate(first1)}`;
    const sch = Calc.jadwal({ ID_Pinjaman: 'SIM', Tenor: tenor, Pokok: h.pokok, Total_Bunga: h.totalBunga }, r.tglAju);
    document.getElementById('lfSched').innerHTML = h.pokok ? `<div class="table-wrap mt-2"><table class="tbl"><thead><tr><th>#</th><th>Jatuh tempo</th><th class="num">Pokok</th><th class="num">Bunga</th><th class="num">Total</th></tr></thead><tbody>${sch.map(x => `<tr><td>${x.Cicilan_Ke}</td><td>${fmtDate(x.Jatuh_Tempo)}</td><td class="num">${fmtNum(x.Pokok)}</td><td class="num">${fmtNum(x.Bunga)}</td><td class="num fw-600">${fmtNum(x.Total)}</td></tr>`).join('')}</tbody></table></div><div class="xs muted mt-1">Estimasi dihitung dari tanggal pengajuan ${fmtDate(r.tglAju)}: cicilan pertama ${fmtDate(first1)}, terakhir ${fmtDate(sch[sch.length - 1].Jatuh_Tempo)}. Jadwal resmi mengikuti tanggal pencairan.</div>` : '';
    [...f.ID_Barang.options].forEach(o => { const b = D.barang[o.value]; if (b) o.disabled = !r.lama && num(b.Stok) <= 0; });
    if (r.brg) document.getElementById('lfSpec').innerHTML = `${esc(r.brg.Spesifikasi || r.brg.Kategori)} · stok <b>${r.brg.Stok}</b> ${esc(r.brg.Satuan)}`;
    // Validasi informatif (aturan sama dengan server)
    const warn = [];
    if (r.idAng) {
      const a = D.anggota[r.idAng];
      if (a && a.Status !== 'aktif') warn.push('Anggota berstatus nonaktif tidak dapat mengajukan pembiayaan.');
      if (String(S.settings.SATU_PINJAMAN_AKTIF) === 'ya' && !r.lama) { const ak = (D.loansByAng[r.idAng] || []).find(l => l.Jenis === r.jenis && ['diajukan', 'disetujui', 'berjalan'].includes(l.Status)); if (ak) warn.push(`Masih ada pinjaman ${r.jenis} aktif (${ak.ID_Pinjaman}, ${ak.Status}). Aturan koperasi: satu pinjaman sejenis aktif per anggota.`); }
      if (!LoanForm.member) { const info = document.getElementById('lfAngInfo'); const s = D.saldo[r.idAng] || {}; if (info && a) info.innerHTML = `${esc(a.Jabatan || '')} · simpanan ${fmtRp(s.total || 0)} · bergabung ${masaGabung(a.Tgl_Bergabung)}`; }
    }
    if (r.jenis === 'uang' && r.pokok > num(S.settings.PLAFON_UANG)) warn.push('Nominal melebihi plafon ' + fmtRp(S.settings.PLAFON_UANG) + '.');
    if (r.f.Tgl_Pengajuan && r.tglAju < tglMulaiPinjaman()) warn.push('Tanggal pengajuan paling awal ' + fmtDate(tglMulaiPinjaman()) + '.');
    if (r.jenis === 'barang' && !r.lama && r.brg && r.qty > num(r.brg.Stok)) warn.push('Stok ' + r.brg.Nama + ' tidak mencukupi (tersedia ' + r.brg.Stok + ').');
    document.getElementById('lfWarn').innerHTML = warn.map(w => `<div class="info-box warn"><i class="bi bi-exclamation-triangle"></i><div>${esc(w)}</div></div>`).join('');
    const s1 = !!r.jenis, s2 = r.pokok > 0 && tenor > 0 && (LoanForm.member || !!r.idAng), s3 = f.setuju.checked;
    document.getElementById('lfStep').innerHTML = [['Jenis', s1], ['Detail & Hitung', s2], ['Konfirmasi', s3]].map((x, i, arr) => {
      const cls = x[1] ? 'done' : (i === 0 || arr[i - 1][1]) ? 'cur' : '';
      return `<div class="step ${cls}"><span class="dotn">${x[1] ? '<i class="bi bi-check-lg"></i>' : i + 1}</span>${x[0]}</div>${i < 2 ? `<div class="step-line ${x[1] ? 'done' : ''}"></div>` : ''}`;
    }).join('');
    if (!first) LoanForm.draft(false);
  },
  /** Draf tersimpan otomatis di perangkat (Instant UX: tidak ada data hilang). */
  draft(notify) {
    const r = LoanForm.read(); if (!r) return;
    Store.lset(LoanForm.key(), { Tgl_Pengajuan: r.f.Tgl_Pengajuan ? r.tglAju : '', Jenis: r.jenis, Pokok: r.jenis === 'uang' ? r.pokok : 0, ID_Barang: r.f.ID_Barang.value, Qty: r.qty, Tenor: parseInt(r.f.Tenor.value, 10), Keperluan: r.Keperluan, lfAngId: r.idAng || '' });
    if (notify) toast('Draf pengajuan tersimpan di perangkat ini.', 'success');
  },
  submit(member) {
    const r = LoanForm.read();
    const rules = { Pokok: v => r.jenis === 'uang' && !(parseRp(v) >= 100000) ? 'Nominal minimal Rp 100.000' : r.jenis === 'uang' && parseRp(v) > num(S.settings.PLAFON_UANG) ? 'Melebihi plafon' : '',
      ID_Barang: v => r.jenis === 'barang' && !v ? 'Pilih barang dari katalog' : r.jenis === 'barang' && !r.lama && r.brg && r.qty > num(r.brg.Stok) ? 'Stok tidak cukup' : '' };
    if (!member) rules.lfAng = v => pickId(v) ? '' : 'Pilih anggota dari daftar';
    const data = Form.check(r.f, rules);
    if (!data) return;
    if (document.getElementById('lfWarn').children.length) { toast('Periksa kembali peringatan pada formulir.', 'warning'); document.getElementById('lfWarn').scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    const tenor = parseInt(r.f.Tenor.value, 10), h = Calc.pinjaman(r.pokok, r.persen, tenor), tmp = uid();
    const file = member && r.f.lampiran && r.f.lampiran.files[0];
    const loan = { ID_Pinjaman: tmp, ID_Anggota: r.idAng, Jenis: r.jenis, Tgl_Pengajuan: r.tglAju, Tgl_Cair: '', Pokok: r.pokok, HPP: r.brg ? num(r.brg.Harga_Beli) * r.qty : 0, ID_Barang: r.jenis === 'barang' ? r.brg.ID_Barang : '', Qty: r.jenis === 'barang' ? r.qty : 0,
      Tenor: tenor, Bunga_Persen: r.persen, Total_Bunga: h.totalBunga, Total_Tagihan: h.total, Angsuran_per_Bulan: h.angsuran, Sisa_Tagihan: h.total, Status: 'diajukan', Disetujui_Oleh: '', No_Perjanjian: '', Keperluan: r.Keperluan, Catatan: '', Diajukan_Oleh: S.user.nama, _pending: true };
    commit({ action: 'pinjaman.ajukan', quiet: true, payload: { tmpId: tmp, Jenis: r.jenis, ID_Anggota: r.idAng, Tgl_Pengajuan: r.tglAju, Pokok: r.pokok, ID_Barang: loan.ID_Barang, Qty: loan.Qty, Tenor: tenor, Keperluan: r.Keperluan }, tables: ['pinjaman'], label: 'Pengajuan pinjaman',
      apply: () => S.db.pinjaman.push(loan),
      ok: () => { if (file) LoanForm.upload(file, r.idAng); } });
    Store.lset(LoanForm.key(), {});
    toast('Pengajuan ' + fmtRp(r.pokok) + ' terkirim ke bendahara untuk sidang komite.', 'success', 'Pengajuan terkirim');
    Nav.go('pinjaman-detail', { id: tmp });
  },
  upload(file, id) {
    if (file.size > 5 * 1024 * 1024) return toast('Lampiran > 5 MB tidak diunggah.', 'warning');
    const rd = new FileReader();
    rd.onload = () => callApi('anggota.unggah', { ID_Anggota: id, kategori: 'Lampiran Pengajuan', fileName: file.name, mimeType: file.type, base64: String(rd.result).split(',')[1], reqId: uid() })
      .then(res => toast(res.success ? 'Lampiran tersimpan di Google Drive.' : res.message, res.success ? 'success' : 'warning')).catch(() => {});
    rd.readAsDataURL(file);
  }
};
Pages['pinjaman-form'] = {
  title: 'Pengajuan Pinjaman', nav: 'pinjaman', roles: ['admin', 'bendahara'],
  render(el, p) {
    el.innerHTML = pageHead({ back: 'pinjaman', backLabel: 'Kembali ke Pinjaman', title: 'Pengajuan Pinjaman', desc: 'Formulir pembiayaan koperasi digital — simulasi angsuran dihitung otomatis sebelum disimpan.' }) +
      `<div class="grid g-main-side"><div>${LoanForm.html(false, p.id)}</div><div class="stack detail-panel"><div class="card-k soft"><h3 class="font-head mb-2" style="font-size:15px"><i class="bi bi-diagram-3 text-primary"></i> Alur setelah dikirim</h3><ol class="small mb-0" style="padding-left:18px;line-height:1.9"><li>Pengajuan masuk antrean <b>sidang komite</b></li><li>Bendahara/Admin <b>menyetujui</b> → nomor akad terbit</li><li><b>Pencairan</b> dana/serah terima barang (stok otomatis berkurang)</li><li>Jadwal angsuran dibuat otomatis & dipotong gaji setiap tanggal ${tglPotong()}</li></ol></div>
      <div class="info-box ok"><i class="bi bi-shield-check"></i><div>Bunga/margin <b>flat dari pokok awal</b> & disepakati di awal akad. Persentase akad lama tidak berubah walau pengaturan diubah.</div></div></div></div>`;
    LoanForm.mount(false);
  },
  refresh() { /* formulir tidak di-render ulang agar ketikan tidak hilang */ }
};

// ════════════════════════════════════════════════════════
// HALAMAN: DETAIL PINJAMAN, JADWAL & PANEL SIDANG KOMITE
// ════════════════════════════════════════════════════════
Pages['pinjaman-detail'] = {
  title: 'Detail Pinjaman',
  get nav() { return S.role === 'anggota' ? 'm-pinjaman' : 'pinjaman'; },
  render(el, p) {
    const id = Sync.idMap[p.id] || p.id, l = D.loans[id];
    const back = S.role === 'anggota' ? 'm-pinjaman' : 'pinjaman';
    if (!l) { el.innerHTML = pageHead({ back, title: 'Pinjaman tidak ditemukan' }) + `<div class="card-k">${empty('bi-search', 'Data tidak tersedia')}</div>`; return; }
    if (id !== p.id) S.params.id = id;
    const rows = D.rows[l.ID_Pinjaman] || [], pc = paidCount(l), cur = nextRow(l), t = T();
    const terbayar = sum(rows, 'Dibayar'), target = sum(rows, 'Total') || l.Total_Tagihan;
    const ui = st('pd-' + id, { all: false });
    const showRows = ui.all ? rows : rows.slice(0, Math.max(5, rows.indexOf(cur) + 2));
    const a = D.anggota[l.ID_Anggota] || {};
    const lunasSim = cur ? Calc.alokasi(rows.filter(r => Calc.sisaRow(r) > 0), 'lunas', { tanggal: t }).ledger : null;
    const pays = (D.pays[l.ID_Pinjaman] || []).slice().sort((x, y) => String(y.Tanggal).localeCompare(String(x.Tanggal)));
    const reviewable = canWrite() && ['diajukan', 'disetujui'].includes(l.Status);
    el.innerHTML = pageHead({ back, backLabel: S.role === 'anggota' ? 'Kembali ke Pinjaman Saya' : 'Kembali ke Pinjaman', eyebrow: 'Amanah Pembiayaan', title: l.Status === 'diajukan' && isStaff() ? 'Review & Persetujuan ' + esc(l.ID_Pinjaman) : 'Detail Pinjaman & Jadwal',
      actions: `<button class="btn btn-outline btn-sm" ${on('UI.copy', l.No_Perjanjian || l.ID_Pinjaman)}><i class="bi bi-share"></i> Salin No.</button>` }) + `
      <div class="grid ${reviewable || (isStaff() && l.Status === 'berjalan') ? 'g-main-side wide' : ''}">
      <div class="stack">
        <div class="card-k loan-card khatam-bg">
          <div class="lc-top"><span class="badge-k b-gray mono" style="font-weight:600"><i class="bi bi-file-earmark-text"></i>${esc(l.No_Perjanjian || l.ID_Pinjaman)}</span><span class="row-gap">${jenisBadge(l)} ${loanBadge(l)}</span></div>
          ${isStaff() ? `<div class="person mt-3" role="button" ${on('Nav.go', 'anggota-detail', { id: l.ID_Anggota })}>${avatar(angName(l.ID_Anggota))}<div><div class="cell-main">${esc(angName(l.ID_Anggota))} ${badge(l.ID_Anggota, 'b-green')}</div><div class="cell-sub">${esc(a.Jabatan || '')} · NIK ${esc(a.NIK_NIP || '')}</div></div></div>` : ''}
          <div class="loan-summary">
            <div class="stat-mini"><span>${l.Jenis === 'uang' ? 'Pokok Pinjaman' : 'Harga Barang' + (l.Qty > 1 ? ' ×' + l.Qty : '')}</span><b>${fmtRp(l.Pokok)}</b></div>
            <div class="stat-mini"><span>${l.Jenis === 'uang' ? 'Bunga' : 'Margin'} ${fmtPct(Calc.loanPct(l))}% × ${l.Tenor} bln</span><b>${fmtRp(Math.round(l.Total_Bunga / l.Tenor))}<small class="xs muted"> /bln</small></b><span>Total ${fmtRp(l.Total_Bunga)}</span></div>
            <div class="stat-mini"><span>Total Tagihan</span><b>${fmtRp(l.Total_Tagihan)}</b></div>
            <div class="stat-mini"><span>Angsuran Bulanan</span><b class="text-primary">${fmtRp(l.Angsuran_per_Bulan)}</b><span>Flat ${l.Tenor} bulan</span></div>
          </div>
          ${l.Jenis === 'barang' ? `<div class="info-box mt-2"><i class="bi bi-box-seam"></i><div><b>${esc(loanLabel(l))}</b><br><span class="xs">${esc((D.barang[l.ID_Barang] || {}).Spesifikasi || '')}</span></div></div>` : ''}
          <div class="loan-sisa khatam-bg"><span class="khatam-star"></span><div class="row-between"><span class="eyebrow" style="color:rgba(255,255,255,.8)">${l.Status === 'berjalan' || l.Status === 'lunas' ? 'Sisa Tagihan' : 'Total Kewajiban (rencana)'}</span>${l.Status === 'berjalan' ? badge((l.Tenor - pc) + ' cicilan lagi', 'b-solid') : l.Status === 'lunas' ? badge('LUNAS', 'b-solid') : ''}</div>
            <div class="hero-amount">${rp(l.Status === 'berjalan' || l.Status === 'lunas' ? l.Sisa_Tagihan : l.Total_Tagihan)}</div>
            <div class="row-between small muted"><span>${l.Tgl_Cair ? 'Pencairan: ' + fmtDate(l.Tgl_Cair) : 'Diajukan: ' + fmtDate(l.Tgl_Pengajuan)}</span><span>${rows.length ? 'Berakhir: ' + fmtDate(rows[rows.length - 1].Jatuh_Tempo) : ['diajukan', 'disetujui'].includes(l.Status) ? 'Estimasi berakhir: ' + fmtDate(Calc.jadwalEstimasi(l).slice(-1)[0].Jatuh_Tempo) : l.Tenor + ' bulan'}</span></div></div>
        </div>
        ${l.No_Perjanjian && !String(l.ID_Pinjaman).startsWith('tmp_') ? `<div class="grid g-2"><button class="btn btn-outline" ${on('Docs.akad', l.ID_Pinjaman)}><i class="bi bi-file-earmark-pdf"></i> Surat Akad (PDF)</button><button class="btn btn-outline" ${on('Docs.jadwal', l.ID_Pinjaman)} ${rows.length ? '' : 'disabled'}><i class="bi bi-calendar3"></i> Kartu Jadwal (PDF)</button></div>` : ''}
        ${rows.length ? `<div class="card-k"><div class="row-between mb-2"><b>Progres Pembayaran</b><b class="text-primary">${pc} dari ${l.Tenor} bulan (${pct(pc, l.Tenor)}%)</b></div>${progress(pct(terbayar, target), 'lg')}<div class="row-between small muted mt-2"><span>Terbayar: ${fmtRp(terbayar)}</span><span>Target: ${fmtRp(target)}</span></div></div>
          <div class="info-box"><i class="bi bi-info-circle"></i><div>Pembayaran angsuran dipotong otomatis dari gaji bulanan ${esc(S.settings.SEKOLAH || '')} setiap tanggal ${tglPotong()}. Tanpa denda riba; keterlambatan diselesaikan secara musyawarah.</div></div>
          <div><div class="row-between mb-2"><h3 class="font-head" style="font-size:18px"><i class="bi bi-calendar2-week text-primary"></i> Jadwal Angsuran</h3><span class="small muted">${l.Tenor} angsuran</span></div>
            ${showRows.map(r => { const s = Calc.sisaRow(r), late = s > 0 && r.Jatuh_Tempo < t, isCur = cur && r.ID_Angsuran === cur.ID_Angsuran; return `<div class="sched-item ${isCur ? 'cur' : ''} ${late ? 'late' : ''}"><span class="no">${r.Cicilan_Ke}</span><div class="s-body"><b>${fmtRp(r.Total)}</b><span>${fmtDate(r.Jatuh_Tempo)}${s === 0 ? ' • ' + esc(r.Dicatat_Oleh || 'Payroll') : isCur ? ' (Jatuh Tempo)' : ''}</span>${isCur ? `<div class="xs mt-1">Pokok: <b>${fmtRp(r.Pokok)}</b> · ${l.Jenis === 'uang' ? 'Bunga' : 'Margin'}: <b>${fmtRp(r.Bunga)}</b>${num(r.Dibayar) ? ' · Dibayar: <b>' + fmtRp(r.Dibayar) + '</b>' : ''}</div>` : ''}</div>${rowBadge(r)}${r.No_Bukti && s === 0 ? `<button class="btn btn-sm btn-ghost" aria-label="Kwitansi" ${on('Docs.kwitansi', r.No_Bukti)}><i class="bi bi-receipt"></i></button>` : ''}</div>`; }).join('')}
            ${rows.length > showRows.length || ui.all ? `<button class="btn btn-soft btn-block mt-2" onclick="st('pd-${esc(id)}').all=${!ui.all};Router.render()">${ui.all ? 'Tampilkan ringkas' : `Lihat cicilan #${showRows.length + 1} s.d. #${rows.length} (${rows.length - showRows.length} lagi)`} <i class="bi bi-chevron-${ui.all ? 'up' : 'down'}"></i></button>` : ''}</div>` :
          ['diajukan', 'disetujui'].includes(l.Status) ? (() => { const est = Calc.jadwalEstimasi(l); return `<div><div class="row-between mb-2"><h3 class="font-head" style="font-size:18px"><i class="bi bi-calendar2-week text-primary"></i> Estimasi Jadwal Angsuran</h3><span class="small muted">${l.Tenor} angsuran</span></div>
            <div class="info-box mb-2"><i class="bi bi-info-circle"></i><div class="xs">Estimasi dimulai dari tanggal pengajuan <b>${fmtDate(l.Tgl_Pengajuan)}</b>: cicilan pertama ${fmtDate(est[0].Jatuh_Tempo)}, terakhir ${fmtDate(est[est.length - 1].Jatuh_Tempo)}. Jadwal resmi dibuat saat pencairan, mengikuti tanggal pencairan.</div></div>
            <div class="table-wrap"><table class="tbl"><thead><tr><th>#</th><th>Jatuh tempo</th><th class="num">Pokok</th><th class="num">Bunga</th><th class="num">Total</th></tr></thead><tbody>${est.map(x => `<tr><td>${x.Cicilan_Ke}</td><td>${fmtDate(x.Jatuh_Tempo)}</td><td class="num">${fmtNum(x.Pokok)}</td><td class="num">${fmtNum(x.Bunga)}</td><td class="num fw-600">${fmtNum(x.Total)}</td></tr>`).join('')}</tbody></table></div></div>`; })()
          : `<div class="card-k">${empty('bi-calendar-x', 'Jadwal belum dibuat', 'Jadwal angsuran terbentuk otomatis saat pinjaman dicairkan.')}</div>`}
        ${lunasSim && l.Status === 'berjalan' ? `<div class="card-k mint"><div class="row-between"><div><b class="font-head">Simulasi Pelunasan Dipercepat</b><div class="xs muted">Bebas penalti${lunasSim.Diskon ? ' & potongan margin cicilan mendatang ' + fmtRp(lunasSim.Diskon) : ''}</div></div><b class="font-head text-primary" style="font-size:20px">${fmtRp(lunasSim.Jumlah)}</b></div>
          ${canWrite() ? `<button class="btn btn-primary btn-block mt-2" ${on('Pages.angsuran.open', l.ID_Pinjaman, 'lunas')}><i class="bi bi-check2-all"></i> Proses Pelunasan di Loket</button>` : '<div class="xs muted mt-2">Untuk pelunasan, silakan hubungi bendahara di loket koperasi.</div>'}</div>` : ''}
        ${pays.length ? `<div class="card-k"><h3 class="font-head mb-2" style="font-size:16px"><i class="bi bi-receipt-cutoff text-primary"></i> Riwayat Pembayaran</h3><div class="list">${pays.map(p => `<div class="list-item"><span class="li-icon"><i class="bi bi-arrow-down-left"></i></span><div class="li-body"><b>${esc(p.No_Bukti.startsWith('tmp_') ? 'menunggu nomor…' : p.No_Bukti)}</b><span>${fmtDate(p.Tanggal)} · cicilan ${esc(p.Cicilan)} · ${esc(cap(p.Metode))}${num(p.Diskon) ? ' · diskon ' + fmtRp(p.Diskon) : ''}</span></div><div class="li-end"><b class="amt-in">${fmtRp(p.Jumlah)}</b>${p.No_Bukti.startsWith('tmp_') ? '' : `<button class="btn btn-sm btn-ghost" ${on('Docs.kwitansi', p.No_Bukti)}><i class="bi bi-printer"></i></button>`}</div></div>`).join('')}</div></div>` : ''}
        ${l.Keperluan ? `<div class="card-k soft"><div class="label mb-1">Tujuan / keperluan pemohon</div><blockquote class="mb-0" style="font-style:italic;border-left:3px solid var(--primary);padding-left:12px">“${esc(l.Keperluan)}”</blockquote>${l.Catatan ? `<div class="small mt-2"><b>Catatan pengurus:</b> ${esc(l.Catatan)}</div>` : ''}</div>` : ''}
        ${S.role === 'anggota' && l.Status === 'diajukan' && !String(l.ID_Pinjaman).startsWith('tmp_') ? `<button class="btn btn-danger-soft btn-block" ${on('Pages.pinjamanDetail.batal', l.ID_Pinjaman)}><i class="bi bi-x-circle"></i> Batalkan Pengajuan</button>` : ''}
      </div>
      ${reviewable ? Pages.pinjamanDetail.panel(l) : ''}
      ${isStaff() && l.Status === 'berjalan' ? `<div class="stack detail-panel"><div class="card-k flush"><div class="panel-deep khatam-bg"><span class="khatam-star"></span><h3><i class="bi bi-bank"></i> Kasir Angsuran</h3><p>Tagihan berikutnya</p></div><div class="p-3">${cur ? `<dl class="kv"><dt>Cicilan</dt><dd>Ke-${cur.Cicilan_Ke} / ${l.Tenor}</dd><dt>Jatuh tempo</dt><dd>${fmtDate(cur.Jatuh_Tempo)}</dd><dt>Tagihan</dt><dd class="text-primary">${fmtRp(Calc.sisaRow(cur))}</dd><dt>Status</dt><dd>${rowBadge(cur)}</dd></dl>` : ''}
        ${canWrite() ? `<button class="btn btn-primary btn-block mt-3" ${on('Pages.angsuran.open', l.ID_Pinjaman)}><i class="bi bi-cash-coin"></i> Bayar di Loket</button>${D.tunggakan.find(x => x.loan.ID_Pinjaman === l.ID_Pinjaman) ? `<button class="btn btn-outline btn-block mt-2" ${on('Pages.angsuran.ingatkan', l.ID_Pinjaman)}><i class="bi bi-envelope"></i> Kirim Pengingat Email</button>` : ''}` : ''}</div></div></div>` : ''}
      </div>`;
    if (reviewable) Pages.pinjamanDetail.lama(l.ID_Pinjaman);
  }
};
Pages.pinjamanDetail = {
  /** Panel Sidang Komite: validasi parameter kepatuhan + keputusan. */
  panel(l) {
    const a = D.anggota[l.ID_Anggota] || {}, s = D.saldo[l.ID_Anggota] || { total: 0 };
    const bulan = a.Tgl_Bergabung ? Math.floor(daysBetween(a.Tgl_Bergabung, T()) / 30.44) : 0;
    const lain = (D.loansByAng[l.ID_Anggota] || []).filter(x => x.ID_Pinjaman !== l.ID_Pinjaman && x.Jenis === l.Jenis && ['diajukan', 'disetujui', 'berjalan'].includes(x.Status));
    const tung = D.tunggakan.filter(t => t.loan.ID_Anggota === l.ID_Anggota);
    const brg = D.barang[l.ID_Barang];
    const rasio = l.Pokok ? s.total / l.Pokok * 100 : 0;
    const lunas = (D.loansByAng[l.ID_Anggota] || []).filter(x => x.Status === 'lunas').length;
    const checks = [
      [a.Status === 'aktif' && bulan >= 3 ? 'ok' : a.Status === 'aktif' ? 'warn' : 'bad', `Keanggotaan aktif ≥ 3 bulan (${masaGabung(a.Tgl_Bergabung)} masa keanggotaan)`],
      [lain.length && String(S.settings.SATU_PINJAMAN_AKTIF) === 'ya' ? 'bad' : 'ok', lain.length ? `Masih ada pinjaman ${l.Jenis} aktif: ${lain.map(x => x.ID_Pinjaman).join(', ')}` : `Tidak memiliki pinjaman ${l.Jenis} berjalan sejenis`],
      [tung.length ? 'bad' : 'ok', tung.length ? `Menunggak ${tung[0].rows.length} cicilan di ${tung[0].loan.ID_Pinjaman}` : `Tidak ada tunggakan berjalan • ${lunas}× riwayat lunas`],
      [rasio >= 20 ? 'ok' : 'warn', `Simpanan internal ${fmtRp(s.total)} (${rasio.toFixed(0)}% dari plafon)`],
      l.Jenis === 'uang' ? [l.Pokok <= num(S.settings.PLAFON_UANG) ? 'ok' : 'bad', `Nominal dalam batas plafon ${fmtRp(S.settings.PLAFON_UANG)}`] : [brg && num(brg.Stok) >= l.Qty ? 'ok' : 'bad', `Stok ${brg ? brg.Nama : l.ID_Barang}: ${brg ? brg.Stok : 0} tersedia (butuh ${l.Qty})`]
    ];
    const lolos = checks.filter(c => c[0] === 'ok').length;
    const icon = { ok: 'bi-check-circle-fill', warn: 'bi-exclamation-circle-fill', bad: 'bi-x-circle-fill' };
    return `<div class="stack detail-panel"><div class="card-k flush"><div class="panel-deep khatam-bg"><span class="khatam-star"></span><div class="row-between"><div><h3><i class="bi bi-hammer"></i> Panel Sidang Komite</h3><p>Otorisasi bendahara & eksekusi akad</p></div>${badge(l.Status === 'diajukan' ? 'Tahap 1/2' : 'Tahap 2/2', 'b-gold')}</div></div>
      <div class="p-3 stack"><div><div class="row-between mb-2"><span class="label">Validasi parameter kepatuhan</span><span class="xs fw-600 ${lolos === checks.length ? 'text-success' : 'text-warning'}">${lolos}/${checks.length} lolos</span></div>
        <ul class="check-list">${checks.map(c => `<li class="${c[0]}"><i class="bi ${icon[c[0]]}"></i><span>${esc(c[1])}</span></li>`).join('')}</ul></div>
        <div class="fg"><label for="pdCat">Catatan pertimbangan komite</label><textarea id="pdCat" class="inp" rows="2" placeholder="mis. Riwayat angsuran baik, rasio aman. Disetujui pencairan penuh.">${esc(l.Catatan || '')}</textarea></div>
        <div class="fg"><label for="pdTgl">Tanggal akad / pencairan / serah terima</label><input id="pdTgl" class="inp" type="date" value="${l.Tgl_Pengajuan && l.Tgl_Pengajuan < T() && l.Tgl_Pengajuan >= tglMulaiPinjaman() ? esc(l.Tgl_Pengajuan) : T()}" min="${[tglMulaiPinjaman(), String(l.Tgl_Pengajuan || '')].sort().pop()}" max="${addDays(T(), 31)}" onchange="Pages.pinjamanDetail.lama('${esc(l.ID_Pinjaman)}')"><span class="hint">Data pinjaman lama: pilih tanggal sejak ${fmtDate([tglMulaiPinjaman(), String(l.Tgl_Pengajuan || '')].sort().pop())}.</span></div>
        <div id="pdLama"></div>
        ${l.Status === 'diajukan' ? `<button class="btn btn-primary btn-lg btn-block" ${on('Pages.pinjamanDetail.proses', l.ID_Pinjaman, 'setujui_cairkan')}><i class="bi bi-check-circle"></i> Setujui & Cairkan</button>
          <button class="btn btn-info-soft btn-block" ${on('Pages.pinjamanDetail.proses', l.ID_Pinjaman, 'setujui')}><i class="bi bi-patch-check"></i> Setujui (cairkan nanti)</button>`
        : `<button class="btn btn-primary btn-lg btn-block" ${on('Pages.pinjamanDetail.proses', l.ID_Pinjaman, 'cairkan')}><i class="bi bi-cash-stack"></i> Cairkan Sekarang</button>`}
        <button class="btn btn-danger-soft btn-block" ${on('Pages.pinjamanDetail.proses', l.ID_Pinjaman, 'tolak')}><i class="bi bi-x-circle"></i> Tolak Pengajuan</button>
        <div class="info-box"><i class="bi bi-info-circle"></i><div class="xs">Setelah disetujui, nomor akad resmi (${esc(String(S.settings[l.Jenis === 'uang' ? 'FMT_AKAD_UANG' : 'FMT_AKAD_BARANG'] || '').replace(/\{.*$/, '…'))}) terbit otomatis. Saat dicairkan, jadwal angsuran dibuat${l.Jenis === 'barang' ? ' dan stok barang berkurang (qabdh)' : ''}.</div></div>
      </div></div></div>`;
  },
  /** Opsi data lama (tanggal lampau): jumlah cicilan yang sudah dibayar & kurangi stok barang. */
  lama(id) {
    const l = D.loans[id], box = document.getElementById('pdLama'); if (!l || !box) return;
    const tgl = (document.getElementById('pdTgl') || {}).value || T();
    const sch = Calc.jadwal(l, tgl);
    const est = `<div class="info-box"><i class="bi bi-calendar-check"></i><div class="xs">Jadwal angsuran dimulai dari tanggal ${fmtDate(tgl)}: cicilan pertama <b>${fmtDate(sch[0].Jatuh_Tempo)}</b>, terakhir <b>${fmtDate(sch[sch.length - 1].Jatuh_Tempo)}</b> (${l.Tenor}× ${fmtRp(l.Angsuran_per_Bulan)}).</div></div>`;
    if (tgl >= T()) { box.innerHTML = est; return; }
    const jatuh = sch.filter(r => r.Jatuh_Tempo <= T()).length;
    box.innerHTML = est + `<div class="info-box warn"><i class="bi bi-clock-history"></i><div class="xs"><b>Input data pinjaman lama.</b> Jadwal dibuat mulai ${fmtDate(tgl)}; ${jatuh} cicilan sudah jatuh tempo s.d. hari ini. Tidak ada email notifikasi yang dikirim.</div></div>
      <div class="fg"><label for="pdBayar">Cicilan yang sudah dibayar sebelum aplikasi dipakai</label><div class="inp-group"><input id="pdBayar" class="inp" type="number" min="0" max="${jatuh}" value="${jatuh}"><span class="addon">dari ${l.Tenor} cicilan</span></div><span class="hint">Dicatat lunas (potong gaji) per tanggal jatuh tempo masing-masing, maks. ${jatuh}. Isi 0 bila belum ada yang dibayar.</span></div>
      ${l.Jenis === 'barang' ? `<label class="check"><input type="checkbox" id="pdStok"> <span>Kurangi stok barang sekarang (biarkan tidak dicentang bila barang sudah diserahkan sebelum aplikasi dipakai)</span></label>` : ''}`;
  },
  proses(id, aksi) {
    const l = D.loans[id]; if (!l) return;
    const catatan = (document.getElementById('pdCat') || {}).value || '', tgl = (document.getElementById('pdTgl') || {}).value || T();
    const isLama = tgl < T(), elB = document.getElementById('pdBayar'), elS = document.getElementById('pdStok');
    const sudahBayar = isLama && elB ? Math.max(0, parseInt(elB.value, 10) || 0) : 0;
    const kurangiStok = !(isLama && l.Jenis === 'barang' && elS && !elS.checked);
    const run = (cat) => {
      const tmpMut = uid();
      commit({ action: 'pinjaman.proses', payload: { ID_Pinjaman: id, aksi, Catatan: cat, Tgl_Cair: tgl, sudahBayar, kurangiStok, tmpId: tmpMut }, tables: ['pinjaman', 'angsuran', 'barang', 'mutasi', 'pembayaran'], label: 'Proses pinjaman',
        apply: () => {
          const x = S.db.pinjaman.find(p => p.ID_Pinjaman === id);
          if (aksi === 'tolak') { x.Status = 'ditolak'; x.Catatan = cat; return; }
          if (aksi !== 'cairkan') { x.Status = 'disetujui'; x.Disetujui_Oleh = S.user.nama; x.No_Perjanjian = x.No_Perjanjian || '(menunggu nomor)'; if (cat) x.Catatan = cat; }
          if (aksi !== 'setujui') {
            if (x.Jenis === 'barang' && kurangiStok) {
              const b = S.db.barang.find(z => z.ID_Barang === x.ID_Barang);
              if (!b || num(b.Stok) < x.Qty) throw new Error('Stok barang tidak cukup untuk dicairkan.');
              b.Stok = num(b.Stok) - x.Qty; x.HPP = num(b.Harga_Beli) * x.Qty;
              S.db.mutasi.push({ ID: tmpMut, ID_Barang: b.ID_Barang, Tanggal: tgl, Jenis: 'keluar', Qty: x.Qty, Harga_Satuan: b.Harga_Beli, Harga_Jual_Satuan: Math.round(x.Pokok / x.Qty), Sumber: 'pinjaman', Referensi: id, Keterangan: 'Akad murabahah', Dicatat_Oleh: S.user.nama, _pending: true });
            }
            x.Status = 'berjalan'; x.Tgl_Cair = tgl; x.Sisa_Tagihan = x.Total_Tagihan;
            Calc.jadwal(x, tgl).forEach(r => S.db.angsuran.push(r));
          }
        } });
    };
    if (aksi === 'tolak') {
      confirmDialog({ title: 'Tolak pengajuan ' + id + '?', text: 'Anggota akan menerima notifikasi email beserta alasan penolakan.', ok: 'Tolak pengajuan', danger: true, input: { label: 'Alasan penolakan', placeholder: 'mis. Masa keanggotaan belum memenuhi syarat' } })
        .then(r => { if (r) run(r); });
      return;
    }
    const labels = { setujui: 'Setujui pengajuan', cairkan: 'Cairkan pembiayaan', setujui_cairkan: 'Setujui & cairkan' };
    confirmDialog({ title: labels[aksi] + '?', html: `<b>${esc(angName(l.ID_Anggota))}</b> — ${fmtRp(l.Pokok)} × ${l.Tenor} bulan<br>Angsuran ${fmtRp(l.Angsuran_per_Bulan)}/bulan${aksi !== 'setujui' ? '<br>Tanggal pencairan: ' + fmtDate(tgl) : ''}${isLama && aksi !== 'setujui' ? '<br><b>Data lama</b> — ' + sudahBayar + ' cicilan dicatat sudah dibayar' + (l.Jenis === 'barang' ? (kurangiStok ? ', stok dikurangi' : ', stok tidak dikurangi') : '') : ''}`, ok: labels[aksi], icon: 'bi-patch-check' })
      .then(ok => { if (ok) run(catatan); });
  },
  batal(id) {
    confirmDialog({ title: 'Batalkan pengajuan?', text: 'Pengajuan ' + id + ' akan ditarik dan tidak diproses komite.', ok: 'Ya, batalkan', danger: true })
      .then(ok => { if (ok) commit({ action: 'pinjaman.batal', payload: { ID_Pinjaman: id }, tables: ['pinjaman'], apply: () => { S.db.pinjaman.find(p => p.ID_Pinjaman === id).Status = 'dibatalkan'; } }); });
  }
};

// ════════════════════════════════════════════════════════
// HALAMAN: ANGSURAN & LOKET (kasir, tunggakan, riwayat)
// ════════════════════════════════════════════════════════
Pages.angsuran = {
  title: 'Angsuran & Loket', roles: ['admin', 'bendahara', 'pengawas'],
  S() { return st('angsuran', { tab: 'loket', loan: '', mode: 'tagihan', n: 2, nominal: '', metode: 'payroll', tanggal: T(), ket: '', cetak: true, bucket: 'semua', q: '', bulan: '' }); },
  tab(t) { Pages.angsuran.S().tab = t; if (S.page === 'angsuran') Router.render(); else Nav.go('angsuran'); },
  open(id, mode) { const s = Pages.angsuran.S(); s.tab = 'loket'; s.loan = id; s.mode = mode || 'tagihan'; s.nominal = ''; if (S.page === 'angsuran') Router.render(); else Nav.go('angsuran'); },
  render(el) {
    const s = Pages.angsuran.S();
    el.innerHTML = pageHead({ crumbs: [['Dashboard', 'dashboard'], ['Pinjaman & Angsuran', 'pinjaman'], ['Loket Pembayaran']], title: 'Loket Pembayaran Angsuran',
      desc: 'Pencatatan setoran cicilan bulanan, pelunasan dipercepat, dan penerbitan kwitansi resmi ber-QR.', actions: `<span class="badge-k b-green"><i class="bi bi-calendar-check"></i> Hari ini: ${fmtRp(sum(S.db.pembayaran.filter(p => p.Tanggal === T()), 'Jumlah'))}</span>${canWrite() ? `<button class="btn btn-primary" id="btnPotongGaji" onclick="Pages.angsuran.potong()"><i class="bi bi-building-check"></i> Potong Gaji Tgl ${tglPotong()}</button>` : ''}` }) +
      `<div class="grid g-kpi mb-3" id="angKpi"></div>
      <div class="mb-3">${tabs([['loket', 'Loket Kasir', 'bi-bank'], ['tunggakan', 'Monitoring Tunggakan', 'bi-exclamation-triangle', D.tunggakan.length], ['riwayat', 'Riwayat Pembayaran', 'bi-clock-history', S.db.pembayaran.length]], s.tab, 'Pages.angsuran.tab')}</div>
      <div id="angBody"></div>`;
    Pages.angsuran.kpis();
    Pages.angsuran['draw_' + s.tab]();
  },
  refresh() {
    const s = Pages.angsuran.S();
    if (!document.getElementById('angKpi')) return Router.render();
    Pages.angsuran.kpis();
    if (s.tab === 'loket') { Pages.angsuran.drawLoan(); Pages.angsuran.calc(); } else Pages.angsuran['draw_' + s.tab]();
  },
  /** Pratinjau & proses potong gaji bulan ini (angsuran pinjaman uang & barang). */
  potong() {
    Modal.open({ title: 'Potong Gaji Bulan Ini', icon: 'bi-building-check', size: 'lg', sub: 'Angsuran pinjaman uang & pembelian barang • tanggal ' + tglPotong(),
      body: '<div id="pgBody" class="text-center p-4"><span class="spinner"></span> Memeriksa cicilan bulan ini…</div>',
      foot: '<button class="btn btn-outline" data-bs-dismiss="modal">Tutup</button><button class="btn btn-primary" id="btnPgProses" disabled><i class="bi bi-check2-circle"></i> <span>Proses Sekarang</span></button>' });
    callApi('angsuran.potongGaji.cek').then(r => {
      const box = document.getElementById('pgBody'); if (!box) return;
      if (!r.success) { box.innerHTML = `<div class="alert-k err"><i class="bi bi-x-octagon"></i><div>${esc(r.message)}</div></div>`; return; }
      const d = r.data, btn = document.getElementById('btnPgProses');
      const status = !d.otomatis ? `<div class="info-box"><i class="bi bi-pause-circle"></i><div><b>Potong otomatis NONAKTIF.</b> Aktifkan di Pengaturan → Margin & Pembiayaan, atau proses manual dengan tombol di bawah.</div></div>`
        : d.sudah ? `<div class="info-box ok"><i class="bi bi-check2-circle"></i><div><b>Bulan ${esc(d.bulan)} sudah diproses.</b> Otomatis berjalan lagi tanggal ${tglPotong()} bulan depan pukul 06.00.</div></div>`
        : d.mulaiBulanDepan ? `<div class="info-box"><i class="bi bi-calendar-event"></i><div>Potong otomatis aktif dan <b>mulai berlaku bulan depan</b> (diaktifkan setelah tanggal ${tglPotong()} bulan ini). Cicilan bulan ini bisa diproses manual.</div></div>`
        : `<div class="info-box ok"><i class="bi bi-robot"></i><div><b>Potong otomatis AKTIF</b> — dijalankan sistem pada <b>${fmtDate(d.tanggal)}</b> pukul 06.00. Tombol di bawah hanya perlu bila gaji dicairkan lebih awal.</div></div>`;
      const rows = d.items.length ? `<div class="table-wrap mt-3"><table class="tbl"><thead><tr><th>Anggota</th><th>Pinjaman</th><th class="num">Cicilan</th><th>Jatuh tempo</th><th class="num">Dipotong</th></tr></thead><tbody>${d.items.map(x => `<tr><td><b>${esc(x.Nama)}</b><div class="cell-sub">${esc(x.ID_Anggota)}</div></td><td>${esc(x.ID_Pinjaman)}<div class="cell-sub">${x.Jenis === 'barang' ? 'Pembelian barang' : 'Pinjaman uang'}</div></td><td class="num">ke-${esc(x.Cicilan)}</td><td>${fmtDate(x.Jatuh_Tempo)}</td><td class="num"><b>${fmtRp(x.Jumlah)}</b></td></tr>`).join('')}</tbody><tfoot><tr><td colspan="4"><b>Total ${d.items.length} angsuran</b></td><td class="num"><b class="text-primary">${fmtRp(d.total)}</b></td></tr></tfoot></table></div>`
        : `<div class="mt-3">${empty('bi-check2-all', 'Tidak ada cicilan bulan ini yang perlu dipotong', 'Semua angsuran bulan berjalan sudah terbayar.')}</div>`;
      box.className = '';
      box.innerHTML = status + rows + `<div class="xs muted mt-2">Hanya cicilan yang jatuh tempo <b>bulan ini</b> yang dipotong. Tunggakan bulan sebelumnya tetap ditagih lewat Loket. Setiap potongan menerbitkan kwitansi (metode: potong gaji), mengurangi sisa tagihan, dan mengirim email ke anggota.</div>`;
      if (d.items.length) { btn.disabled = false; btn.querySelector('span').textContent = 'Proses Sekarang (' + d.items.length + ' angsuran, ' + fmtRp(d.total) + ')'; btn.onclick = () => Pages.angsuran.potongGo(d); }
    }).catch(e => { const box = document.getElementById('pgBody'); if (box) box.innerHTML = `<div class="alert-k err"><i class="bi bi-wifi-off"></i><div>${esc(e.message || e)}</div></div>`; });
  },
  potongGo(d) {
    confirmDialog({ title: 'Proses potong gaji sekarang?', html: `${d.items.length} angsuran senilai <b>${fmtRp(d.total)}</b> akan dicatat terbayar dengan metode <b>potong gaji</b> per hari ini.`, ok: 'Ya, proses' }).then(yes => {
      if (!yes) return;
      Modal.close();
      commit({ action: 'angsuran.potongGaji', payload: {}, tables: ['angsuran', 'pinjaman', 'pembayaran'], label: 'Potong gaji', quiet: true,
        ok: res => toast(res.message, 'success', 'Potong gaji selesai') });
      toast('Memproses potong gaji ' + d.items.length + ' angsuran…', 'info');
    });
  },
  kpis() {
    const mk = monthKey(T()), today = sum(S.db.pembayaran.filter(p => p.Tanggal === T()), 'Jumlah');
    const rowsM = S.db.angsuran.filter(r => monthKey(r.Jatuh_Tempo) === mk && (D.loans[r.ID_Pinjaman] || {}).Status !== 'ditolak');
    const target = sum(rowsM, 'Total'), paid = sum(rowsM, 'Dibayar');
    const h3 = D.upcoming.filter(u => u.days >= 0 && u.days <= 3);
    document.getElementById('angKpi').innerHTML = kpi({ label: 'Angsuran Diterima Hari Ini', value: rp(today), icon: 'bi-cash-coin', sub: S.db.pembayaran.filter(p => p.Tanggal === T()).length + ' transaksi diproses' }) +
      kpi({ label: 'Target Periode Ini', value: rp(target), icon: 'bi-graph-up-arrow', tone: 'blue', sub: `${pct(paid, target)}% tercapai · ${rowsM.length} debitur` + progress(pct(paid, target)) }) +
      kpi({ label: 'Antrean Jatuh Tempo (H-3)', value: h3.length + ' <small>debitur</small>', icon: 'bi-alarm', tone: 'gold', sub: fmtRp(sum(h3, 'sisa')) + ' perlu ditagih' }) +
      kpi({ label: 'Debitur Menunggak', value: D.tunggakan.length + ' <small>orang</small>', icon: 'bi-exclamation-octagon', tone: 'red', sub: fmtRp(sum(D.tunggakan, 'total')), onclick: "Pages.angsuran.tab('tunggakan')" });
  },
  // ── Tab 1: Loket kasir ──
  draw_loket() {
    const s = Pages.angsuran.S();
    const act = D.berjalan.slice().sort((a, b) => angName(a.ID_Anggota).localeCompare(angName(b.ID_Anggota)));
    const quick = D.upcoming.slice(0, 4);
    document.getElementById('angBody').innerHTML = `<div class="grid g-main-side wide">
      <div class="stack"><div class="card-k"><div class="card-head"><h3><span class="badge-k b-solid">1</span> Cari & Pilih Pinjaman Aktif</h3><span class="xs muted fw-600">IDENTIFIKASI DEBITUR</span></div>
        <div class="inp-group"><span class="addon"><i class="bi bi-search"></i></span><input class="inp" list="dlLoan" id="loketPick" placeholder="Ketik nama anggota atau no. pinjaman…" value="${s.loan && D.loans[s.loan] ? esc(s.loan + ' — ' + angName(D.loans[s.loan].ID_Anggota)) : ''}" onchange="Pages.angsuran.pick(this.value)" aria-label="Pilih pinjaman"></div>
        <datalist id="dlLoan">${act.map(l => `<option value="${esc(l.ID_Pinjaman + ' — ' + angName(l.ID_Anggota))}">${esc(loanLabel(l))} · sisa ${fmtRp(l.Sisa_Tagihan)}</option>`).join('')}</datalist>
        <div class="row-gap mt-2"><span class="xs muted">Pintasan:</span>${quick.map(u => `<button class="chip-btn ${u.loan.ID_Pinjaman === s.loan ? 'on' : ''}" ${on('Pages.angsuran.open', u.loan.ID_Pinjaman)}>${u.days < 0 ? '<i class="bi bi-exclamation-triangle text-danger"></i> ' : ''}${esc(angName(u.loan.ID_Anggota).split(',')[0])} ${u.days < 0 ? '(H+' + (-u.days) + ')' : u.days <= 3 ? '(H-' + u.days + ')' : ''}</button>`).join('')}</div>
        <div id="loketLoan" class="mt-3"></div></div>
        <div class="card-k" id="loketTagihan"></div>
        <div class="card-k flush" id="loketJadwal"></div></div>
      <div class="detail-panel"><div class="card-k flush" id="kasirPanel">${Pages.angsuran.kasirHtml()}</div></div></div>`;
    Pages.angsuran.drawLoan(); Pages.angsuran.calc();
  },
  pick(v) { const m = String(v || '').match(/^(\S+)\s+—/); const id = m ? m[1] : String(v || '').trim(); if (D.loans[id]) Pages.angsuran.open(id); },
  drawLoan() {
    const s = Pages.angsuran.S(), l = D.loans[s.loan];
    const box = document.getElementById('loketLoan'), tg = document.getElementById('loketTagihan'), jd = document.getElementById('loketJadwal');
    if (!box) return;
    if (!l || l.Status !== 'berjalan') {
      box.innerHTML = l && l.Status === 'lunas' ? `<div class="info-box ok"><i class="bi bi-check2-all"></i><div>Pinjaman <b>${esc(l.ID_Pinjaman)}</b> sudah <b>LUNAS</b>. Alhamdulillah.</div></div>` : '';
      tg.innerHTML = empty('bi-hand-index', 'Pilih pinjaman aktif', 'Ketik nama/ID atau ketuk pintasan di atas untuk memulai transaksi.'); jd.innerHTML = ''; return;
    }
    const a = D.anggota[l.ID_Anggota] || {}, cur = nextRow(l), pc = paidCount(l), rows = D.rows[l.ID_Pinjaman] || [];
    box.innerHTML = `<div class="card-k soft" style="border-left:4px solid var(--primary)"><div class="row-between"><div class="person">${avatar(a.Nama || l.ID_Anggota, 'lg')}<div><div class="cell-main" style="font-size:16px">${esc(a.Nama || l.ID_Anggota)} ${badge(l.ID_Anggota, 'b-blue')}</div><div class="cell-sub">${esc(a.Jabatan || '')} · NIK ${esc(a.NIK_NIP || '')}</div></div></div>${badge('Berjalan (Cicilan ' + Math.min(l.Tenor, pc + 1) + ' dari ' + l.Tenor + ')', 'b-green')}</div>
      <div class="grid g-4 mt-2"><div class="stat-mini"><span>No. Akad</span><b class="mono" style="font-size:12.5px">${esc(l.No_Perjanjian)}</b></div><div class="stat-mini"><span>Jenis akad</span><b>${l.Jenis === 'uang' ? 'Qardh' : 'Murabahah'} ${fmtPct(Calc.loanPct(l))}%</b></div><div class="stat-mini"><span>Plafon</span><b>${fmtRp(l.Pokok)}</b></div><div class="stat-mini"><span>Sisa tagihan</span><b class="text-primary">${fmtRp(l.Sisa_Tagihan)}</b></div></div></div>`;
    if (cur) {
      const dn = Calc.denda(cur, Pages.angsuran.S().tanggal || T()), late = cur.Jatuh_Tempo < T();
      tg.innerHTML = `<div class="card-head"><h3><span class="badge-k b-solid">2</span> Rincian Tagihan Berjalan (Cicilan Ke-${cur.Cicilan_Ke})</h3>${badge('Periode: ' + fmtMonthLong(monthKey(cur.Jatuh_Tempo)), 'b-gold')}</div>
        <div class="info-box ${late ? 'danger' : ''}"><i class="bi bi-calendar-event"></i><div><b>Jatuh tempo: ${longDate(cur.Jatuh_Tempo)}</b> (${late ? 'terlambat ' + daysBetween(cur.Jatuh_Tempo, T()) + ' hari' : daysBetween(T(), cur.Jatuh_Tempo) === 0 ? 'hari ini' : 'tersisa ' + daysBetween(T(), cur.Jatuh_Tempo) + ' hari'}). ${String(S.settings.DENDA_AKTIF) === 'ya' ? 'Denda keterlambatan aktif (' + fmtRp(S.settings.DENDA_NOMINAL) + '/minggu setelah ' + S.settings.DENDA_TENGGANG + ' hari).' : 'Tidak dikenakan denda keterlambatan berbunga sesuai prinsip syariah.'}</div></div>
        <div class="grid g-2 mt-3"><div class="stat-mini"><span>Pokok cicilan ke-${cur.Cicilan_Ke}</span><b>${fmtRp(num(cur.Pokok) - num(cur.Bayar_Pokok))}</b></div><div class="stat-mini"><span>${l.Jenis === 'uang' ? 'Bunga' : 'Margin'} syariah (${fmtPct(Calc.loanPct(l))}%)</span><b>${fmtRp(num(cur.Bunga) - num(cur.Bayar_Bunga))}</b></div>
          <div class="stat-mini"><span>Denda keterlambatan (ta'zir)</span><b>${fmtRp(dn - num(cur.Bayar_Denda))}</b></div><div class="stat-mini" style="background:var(--hero-bg);color:#fff"><span style="color:rgba(255,255,255,.75)">Total tagihan bulan ini</span><b>${fmtRp(Calc.sisaRow(Object.assign({}, cur, { Denda: dn })))}</b></div></div>
        <div class="mt-3"><div class="row-between xs muted mb-1"><span>Progres kontrak: ${pct(pc, l.Tenor)}% (${pc} dari ${l.Tenor} cicilan lunas)</span><span>Sisa ${l.Tenor - pc} cicilan</span></div><div class="progress-k lg"><span style="width:${pct(pc, l.Tenor)}%"></span><span class="gold" style="width:${pct(1, l.Tenor)}%"></span></div></div>`;
    }
    jd.innerHTML = `<div class="card-head card-pad-x pt-3 mb-2"><div><h3><span class="badge-k b-solid">3</span> Kartu Jadwal & Riwayat Angsuran</h3><p>Kontrak ${esc(l.No_Perjanjian)} · ${l.Tenor} bulan</p></div><button class="btn btn-sm btn-outline" ${on('Docs.jadwal', l.ID_Pinjaman)}><i class="bi bi-printer"></i> Cetak Kartu</button></div>` +
      Tbl.html({ id: 'loket-rows', rows, noPage: true, rowCls: r => cur && r.ID_Angsuran === cur.ID_Angsuran ? 'row-current' : (Calc.sisaRow(r) > 0 && r.Jatuh_Tempo < T() ? 'row-danger' : ''),
        cols: [{ h: 'Cicilan', main: true, v: r => `<b>#${r.Cicilan_Ke}</b> <span class="cell-sub">· ${fmtDate(r.Jatuh_Tempo)}</span>` }, { h: 'Tgl Bayar', v: r => r.Tgl_Bayar ? fmtDate(r.Tgl_Bayar) : '—' },
          { h: 'Pokok', cls: 'num', v: r => fmtNum(r.Pokok) }, { h: l.Jenis === 'uang' ? 'Bunga' : 'Margin', cls: 'num', v: r => fmtNum(r.Bunga) }, { h: 'Denda', cls: 'num', v: r => fmtNum(r.Denda) },
          { h: 'Total', cls: 'num', v: r => `<b>${fmtNum(num(r.Pokok) + num(r.Bunga) + num(r.Denda))}</b>` }, { h: 'Status', v: rowBadge },
          { h: '', label: 'Kwitansi', cls: 'num', v: r => r.No_Bukti ? `<button class="btn btn-sm btn-ghost" ${on('Docs.kwitansi', r.No_Bukti)} aria-label="Kwitansi"><i class="bi bi-receipt"></i></button>` : '' }],
        foot: `<tr><td class="td-main" colspan="5">Total terbayar ${fmtRp(sum(rows, 'Dibayar'))}</td><td class="num" colspan="3">Sisa kewajiban ${fmtRp(l.Sisa_Tagihan)}</td></tr>` });
  },
  kasirHtml() {
    const s = Pages.angsuran.S();
    const opt = (v, t, sub, gold) => `<label class="pay-opt ${gold ? 'gold' : ''} ${s.mode === v ? 'on' : ''}"><input type="radio" name="mode" value="${v}" ${s.mode === v ? 'checked' : ''} onchange="Pages.angsuran.set('mode','${v}')"><span class="po-body"><b>${t}</b><span>${sub}</span></span><span class="po-amt" id="amt-${v}"></span></label>`;
    return `<div class="panel-deep khatam-bg"><span class="khatam-star"></span><div class="row-between"><div><h3><i class="bi bi-calculator"></i> Kasir Pembayaran</h3><p>Formulir penerimaan & kwitansi digital</p></div>${badge('LOKET 1', 'b-solid')}</div><div class="xs mt-2" style="opacity:.85"><i class="bi bi-receipt"></i> No. kwitansi: otomatis (${esc(String(S.settings.FMT_KWITANSI || '').replace(/\{N+\}/, '…').replace('{YYYY}', T().slice(0, 4)).replace('{MM}', T().slice(5, 7)))})</div></div>
      <form class="p-3 stack" onsubmit="event.preventDefault();Pages.angsuran.bayar()" novalidate>
        <div><div class="label mb-1">Metode pembayaran</div><div class="seg" style="width:100%;display:grid;grid-template-columns:repeat(3,1fr)">${[['payroll', 'Potong Gaji', 'bi-building'], ['tunai', 'Tunai Loket', 'bi-cash'], ['transfer', 'Transfer', 'bi-bank']].map(m => `<button type="button" class="${s.metode === m[0] ? 'on' : ''}" onclick="Pages.angsuran.set('metode','${m[0]}')"><i class="bi ${m[2]}"></i> ${m[1]}</button>`).join('')}</div></div>
        <div><div class="label mb-1">Opsi pembayaran angsuran</div>
          ${opt('tagihan', 'Bayar 1 bulan', 'Cicilan berjalan berikutnya')}
          <label class="pay-opt ${s.mode === 'multi' ? 'on' : ''}"><input type="radio" name="mode" value="multi" ${s.mode === 'multi' ? 'checked' : ''} onchange="Pages.angsuran.set('mode','multi')"><span class="po-body"><b>Bayar multi-bulan</b><span>Beberapa cicilan sekaligus</span></span><input class="inp" type="number" min="2" max="60" value="${s.n}" style="width:72px;min-height:36px" aria-label="Jumlah bulan" oninput="Pages.angsuran.set('n',this.value,true)" onclick="Pages.angsuran.set('mode','multi')"><span class="po-amt" id="amt-multi"></span></label>
          ${opt('lunas', 'Pelunasan dipercepat ' + badge('Bebas penalti', 'b-gold'), String(S.settings.DISKON_PELUNASAN) === 'ya' ? 'Diskon margin cicilan mendatang' : 'Lunasi seluruh sisa', true)}
          <label class="pay-opt ${s.mode === 'sebagian' ? 'on' : ''}"><input type="radio" name="mode" value="sebagian" ${s.mode === 'sebagian' ? 'checked' : ''} onchange="Pages.angsuran.set('mode','sebagian')"><span class="po-body"><b>Bayar sebagian</b><span>Nominal bebas (dialokasikan berurutan)</span></span></label></div>
        <div class="fg"><label>Jumlah diterima kasir <span class="xs text-primary" id="kasirHint"></span></label><div class="inp-group"><span class="addon rp">Rp</span><input class="inp money-inp" id="kasirNominal" data-money inputmode="numeric" value="${esc(s.nominal)}" oninput="Pages.angsuran.set('nominal',this.value,true)" ${s.mode === 'sebagian' ? '' : 'readonly'}></div><span class="err-msg"></span></div>
        <div class="form-grid cols-2"><div class="fg"><label>Tanggal transaksi</label><input class="inp" type="date" value="${esc(s.tanggal)}" max="${T()}" onchange="Pages.angsuran.set('tanggal',this.value)"></div><div class="fg"><label>Petugas kasir</label><input class="inp" value="${esc(S.user.nama)}" readonly></div></div>
        <div class="fg"><label>Catatan struk kwitansi</label><input class="inp" value="${esc(s.ket)}" placeholder="mis. Setoran cicilan reguler via payroll" oninput="Pages.angsuran.S().ket=this.value" maxlength="200"></div>
        <div id="kasirRincian"></div>
        <label class="check"><input type="checkbox" ${s.cetak ? 'checked' : ''} onchange="Pages.angsuran.S().cetak=this.checked"> Cetak kwitansi resmi setelah tersimpan</label>
        <button class="btn btn-primary btn-lg btn-block" id="btnBayar" ${canWrite() ? '' : 'disabled'}><i class="bi bi-check2-circle"></i> Simpan Transaksi & Cetak Kwitansi</button>
        <button type="button" class="btn btn-outline btn-block" onclick="Pages.angsuran.reset()">Batalkan / Reset</button>
        <div class="xs muted"><i class="bi bi-shield-lock"></i> Tersimpan instan di perangkat & disinkronkan otomatis ke Jurnal Kas Harian.</div></form>`;
  },
  set(k, v, soft) {
    const s = Pages.angsuran.S(); s[k] = v;
    if (soft) { Pages.angsuran.calc(); return; }
    const p = document.getElementById('kasirPanel'); if (p) p.innerHTML = Pages.angsuran.kasirHtml();
    Pages.angsuran.calc();
  },
  reset() { const s = Pages.angsuran.S(); s.mode = 'tagihan'; s.nominal = ''; s.ket = ''; s.tanggal = T(); const p = document.getElementById('kasirPanel'); if (p) p.innerHTML = Pages.angsuran.kasirHtml(); Pages.angsuran.calc(); },
  /** Hitung nominal tiap opsi secara lokal (identik dengan server). */
  alloc(mode) {
    const s = Pages.angsuran.S(), l = D.loans[s.loan];
    if (!l || l.Status !== 'berjalan') return null;
    const open = (D.rows[l.ID_Pinjaman] || []).filter(r => Calc.sisaRow(r) > 0);
    if (!open.length) return null;
    try { return Calc.alokasi(open, mode, { n: s.n, nominal: parseRp(s.nominal), tanggal: s.tanggal || T() }); } catch (e) { return { error: e.message }; }
  },
  calc() {
    const s = Pages.angsuran.S();
    ['tagihan', 'multi', 'lunas'].forEach(m => { const el = document.getElementById('amt-' + m); if (el) { const a = Pages.angsuran.alloc(m); el.textContent = a && a.ledger ? fmtRp(a.ledger.Jumlah) : '—'; } });
    const a = Pages.angsuran.alloc(s.mode), inp = document.getElementById('kasirNominal'), rin = document.getElementById('kasirRincian'), hint = document.getElementById('kasirHint');
    if (!inp) return;
    if (s.mode !== 'sebagian') inp.value = a && a.ledger ? fmtNum(a.ledger.Jumlah) : '';
    if (hint) hint.textContent = a && a.ledger ? (a.ledger.cicilan.length ? 'Cicilan ' + a.ledger.cicilan.join(', ') : '') : '';
    rin.innerHTML = !a ? '' : a.error ? `<div class="info-box warn"><i class="bi bi-exclamation-triangle"></i><div>${esc(a.error)}</div></div>`
      : `<dl class="kv small" style="background:var(--surface-2);padding:10px 12px;border-radius:12px"><dt>Pokok</dt><dd>${fmtRp(a.ledger.Pokok)}</dd><dt>Bunga / margin</dt><dd>${fmtRp(a.ledger.Bunga)}</dd>${a.ledger.Denda ? `<dt>Denda</dt><dd>${fmtRp(a.ledger.Denda)}</dd>` : ''}${a.ledger.Diskon ? `<dt>Potongan margin</dt><dd class="text-success">-${fmtRp(a.ledger.Diskon)}</dd>` : ''}<dt class="fw-700" style="color:var(--text)">Total diterima</dt><dd class="text-primary" style="font-size:15px">${fmtRp(a.ledger.Jumlah)}</dd></dl>`;
  },
  bayar() {
    const s = Pages.angsuran.S(), l = D.loans[s.loan];
    if (!l || l.Status !== 'berjalan') return toast('Pilih pinjaman berstatus berjalan terlebih dahulu.', 'warning');
    if (s.tanggal > T()) return toast('Tanggal pembayaran tidak boleh di masa depan.', 'warning');
    const a = Pages.angsuran.alloc(s.mode);
    if (!a || a.error || !a.ledger.Jumlah) { const g = document.getElementById('kasirNominal').closest('.fg'); g.classList.add('has-error'); g.querySelector('.err-msg').textContent = (a && a.error) || 'Nominal tidak valid.'; return; }
    const doIt = () => {
      const tmp = uid(), L = a.ledger, cetak = s.cetak;
      const cic = L.cicilan.length > 1 ? L.cicilan[0] + '-' + L.cicilan[L.cicilan.length - 1] : String(L.cicilan[0]);
      commit({ action: 'angsuran.bayar', quiet: true, payload: { tmpId: tmp, ID_Pinjaman: l.ID_Pinjaman, mode: s.mode, jumlahBulan: s.n, nominal: parseRp(s.nominal), Tanggal: s.tanggal, Metode: s.metode, Keterangan: s.ket },
        tables: ['angsuran', 'pinjaman', 'pembayaran'], label: 'Bayar angsuran',
        apply: () => {
          const byId = {}; a.rows.forEach(r => { byId[r.ID_Angsuran] = Object.assign({}, r, { Dicatat_Oleh: S.user.nama, No_Bukti: tmp }); });
          S.db.angsuran = S.db.angsuran.map(r => byId[r.ID_Angsuran] || r);
          const x = S.db.pinjaman.find(p => p.ID_Pinjaman === l.ID_Pinjaman);
          x.Sisa_Tagihan = S.db.angsuran.filter(r => r.ID_Pinjaman === l.ID_Pinjaman).reduce((t, r) => t + Calc.sisaRow(r), 0);
          if (x.Sisa_Tagihan === 0) x.Status = 'lunas';
          S.db.pembayaran.push({ No_Bukti: tmp, ID_Pinjaman: l.ID_Pinjaman, Jenis: l.Jenis, ID_Anggota: l.ID_Anggota, Tanggal: s.tanggal, Jumlah: L.Jumlah, Pokok: L.Pokok, Bunga: L.Bunga, Denda: L.Denda, Diskon: L.Diskon, Cicilan: cic, Mode: s.mode, Metode: s.metode, Keterangan: s.ket, Dicatat_Oleh: S.user.nama, _pending: true });
        },
        ok: res => { if (cetak && res.data.extra && res.data.extra.noBukti) Docs.kwitansi(res.data.extra.noBukti); } });
      toast(fmtRp(L.Jumlah) + ' diterima dari ' + angName(l.ID_Anggota) + (s.mode === 'lunas' ? ' — PELUNASAN' : ''), 'success', 'Pembayaran tercatat');
      s.mode = 'tagihan'; s.nominal = ''; s.ket = '';
      const p = document.getElementById('kasirPanel'); if (p) p.innerHTML = Pages.angsuran.kasirHtml();
      Pages.angsuran.calc();
    };
    if (s.mode === 'lunas') confirmDialog({ title: 'Proses pelunasan dipercepat?', html: `<b>${esc(angName(l.ID_Anggota))}</b> — ${esc(l.No_Perjanjian)}<br>Total diterima <b>${fmtRp(a.ledger.Jumlah)}</b>${a.ledger.Diskon ? '<br>Potongan margin ' + fmtRp(a.ledger.Diskon) : ''}`, ok: 'Ya, lunasi', icon: 'bi-check2-all' }).then(ok => { if (ok) doIt(); });
    else doIt();
  },
  // ── Tab 2: Monitoring tunggakan ──
  draw_tunggakan() {
    const s = Pages.angsuran.S(), T0 = D.tunggakan;
    const b = t => t.days <= 7 ? 'b1' : t.days <= 14 ? 'b2' : 'b3';
    const rows = T0.filter(t => s.bucket === 'semua' || b(t) === s.bucket);
    document.getElementById('angBody').innerHTML = `<div class="card-k flush"><div class="p-3 stack" style="gap:12px"><div class="row-between"><div><h3 class="font-head" style="font-size:16px">Monitoring Tunggakan & Teguran</h3><div class="xs muted">Deteksi dini keterlambatan — teguran bertahap secara santun (tabayyun & ta'awun), tanpa denda berbunga.</div></div>
        <button class="btn btn-sm btn-outline" onclick="Pages.angsuran.excelTunggakan()"><i class="bi bi-file-earmark-excel"></i> Ekspor</button></div>
      ${tabs([['semua', 'Semua tunggakan', '', T0.length], ['b1', 'H+1 s.d. H+7', '', T0.filter(t => b(t) === 'b1').length], ['b2', 'H+8 s.d. H+14', '', T0.filter(t => b(t) === 'b2').length], ['b3', 'Kritis > 15 hari', '', T0.filter(t => b(t) === 'b3').length]], s.bucket, 'Pages.angsuran.bucket')}</div>
      ${Tbl.html({ id: 'tunggak', rows, unit: 'debitur', emptyIcon: 'bi-emoji-smile', emptyTitle: 'Tidak ada tunggakan', emptyText: 'Seluruh debitur lancar. Alhamdulillah.', rowCls: t => t.days > 14 ? 'row-danger' : 'row-warn',
        cols: [{ h: 'Debitur & Unit', main: true, v: t => { const a = D.anggota[t.loan.ID_Anggota] || {}; return `<div class="person">${avatar(a.Nama || '?')}<div><div class="cell-main">${esc(a.Nama || t.loan.ID_Anggota)}</div><div class="cell-sub">${esc(a.Jabatan || '')} · ${esc(a.No_HP || '')}</div></div></div>`; } },
          { h: 'No. Akad & Fasilitas', v: t => `<span class="mono">${esc(t.loan.No_Perjanjian)}</span><div class="cell-sub">${esc(loanLabel(t.loan))}</div>` },
          { h: 'Cicilan & Jatuh Tempo', v: t => `Ke-${t.rows.map(r => r.Cicilan_Ke).join(', ')} / ${t.loan.Tenor}<div class="cell-sub">sejak ${fmtDate(t.rows[0].Jatuh_Tempo)}</div>` },
          { h: 'Keterlambatan', v: t => { const k = Calc.kolek(t.days); return badge(k.label, k.cls) + `<div class="cell-sub">${k.kol}</div>`; } },
          { h: 'Nominal', cls: 'num', v: t => `<b class="text-danger">${fmtRp(t.total)}</b>` },
          { h: '', label: 'Tindakan', cls: 'num nowrap', v: t => { const a = D.anggota[t.loan.ID_Anggota] || {}; const wa = UI.wa(a.No_HP, `Assalamu'alaikum ${a.Nama}. Kami dari pengurus koperasi menyampaikan pengingat santun: angsuran ${t.loan.No_Perjanjian} sebanyak ${t.rows.length} cicilan (${fmtRp(t.total)}) telah melewati jatuh tempo. Bila ada kendala, mari bermusyawarah di loket koperasi. Jazakumullah khairan.`);
            return `${wa ? `<a class="btn btn-sm btn-ghost" href="${esc(wa)}" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="bi bi-whatsapp"></i></a>` : ''}${canWrite() ? `<button class="btn btn-sm btn-ghost" aria-label="Email pengingat" ${on('Pages.angsuran.ingatkan', t.loan.ID_Pinjaman)}><i class="bi bi-envelope"></i></button><button class="btn btn-sm btn-soft" ${on('Pages.angsuran.open', t.loan.ID_Pinjaman)}>Bayar</button>` : ''}`; } }],
        foot: `<tr><td class="td-main" colspan="4">Total ${rows.length} debitur menunggak</td><td class="num text-danger">${fmtRp(sum(rows, 'total'))}</td><td></td></tr>` })}</div>
      <div class="info-box mt-3"><i class="bi bi-journal-check"></i><div><b>Fatwa DPS:</b> Teguran keterlambatan wajib mengedepankan asas tabayyun & ta'awun. Koperasi tidak mengenakan denda komersial/bunga yang menumpuk.</div></div>`;
  },
  bucket(b) { Pages.angsuran.S().bucket = b; Tbl.reset('tunggak'); Pages.angsuran.draw_tunggakan(); },
  ingatkan(id) {
    const l = D.loans[id], a = D.anggota[l.ID_Anggota] || {};
    if (!a.Email) return toast('Anggota belum memiliki alamat email. Gunakan WhatsApp.', 'warning');
    toast('Mengirim pengingat ke ' + a.Email + '…', 'info');
    callApi('notifikasi.kirim', { ID_Pinjaman: id }).then(r => toast(r.message, r.success ? 'success' : 'danger')).catch(e => toast(e.message || String(e), 'danger'));
  },
  excelTunggakan() {
    Docs.excel('Tunggakan_' + T(), [{ name: 'Tunggakan', rows: D.tunggakan.map(t => ({ Nama: angName(t.loan.ID_Anggota), 'ID Anggota': t.loan.ID_Anggota, 'No Akad': t.loan.No_Perjanjian, Fasilitas: loanLabel(t.loan), 'Cicilan Tertunggak': t.rows.map(r => r.Cicilan_Ke).join(', '), 'Jatuh Tempo Pertama': t.rows[0].Jatuh_Tempo, 'Hari Terlambat': t.days, Kolektibilitas: Calc.kolek(t.days).kol, Nominal: t.total })) }]);
  },
  // ── Tab 3: Riwayat pembayaran ──
  draw_riwayat() {
    const s = Pages.angsuran.S(), q = s.q.toLowerCase();
    const rows = S.db.pembayaran.filter(p => (!s.bulan || monthKey(p.Tanggal) === s.bulan) && (!q || [p.No_Bukti, p.ID_Pinjaman, angName(p.ID_Anggota)].some(v => String(v || '').toLowerCase().includes(q))))
      .sort((a, b) => String(b.Tanggal).localeCompare(String(a.Tanggal)) || String(b.No_Bukti).localeCompare(String(a.No_Bukti)));
    document.getElementById('angBody').innerHTML = `<div class="card-k flush"><div class="p-3 toolbar"><div class="inp-group grow"><span class="addon"><i class="bi bi-search"></i></span><input class="inp" type="search" value="${esc(s.q)}" placeholder="Cari no. kwitansi, pinjaman, nama…" oninput="Pages.angsuran.rq(this.value)" aria-label="Cari"></div><input class="inp" type="month" style="width:auto" value="${esc(s.bulan)}" onchange="Pages.angsuran.S().bulan=this.value;Pages.angsuran.draw_riwayat()" aria-label="Bulan"></div>
      ${Tbl.html({ id: 'riwayat', rows, unit: 'kwitansi', emptyIcon: 'bi-receipt',
        cols: [{ h: 'No. Kwitansi', main: true, v: p => `<span class="mono fw-600">${esc(p.No_Bukti.startsWith('tmp_') ? 'menunggu…' : p.No_Bukti)}</span><div class="cell-sub">${fmtDate(p.Tanggal)} · ${esc(cap(p.Metode))}</div>` },
          { h: 'Anggota', v: p => `<div class="cell-main">${esc(angName(p.ID_Anggota))}</div><div class="cell-sub">${esc(p.ID_Pinjaman)} · cicilan ${esc(p.Cicilan)}</div>` },
          { h: 'Pokok', cls: 'num', v: p => fmtNum(p.Pokok) }, { h: 'Bunga/Margin', cls: 'num', v: p => fmtNum(p.Bunga) }, { h: 'Denda', cls: 'num', v: p => fmtNum(p.Denda) },
          { h: 'Jumlah', cls: 'num', v: p => `<b class="amt-in">${fmtRp(p.Jumlah)}</b>${num(p.Diskon) ? `<div class="cell-sub">diskon ${fmtNum(p.Diskon)}</div>` : ''}` },
          { h: '', label: 'Cetak', cls: 'num', v: p => p.No_Bukti.startsWith('tmp_') ? '' : `<button class="btn btn-sm btn-ghost" ${on('Docs.kwitansi', p.No_Bukti)} aria-label="Cetak"><i class="bi bi-printer"></i></button>` }],
        foot: `<tr><td class="td-main" colspan="2">Total ${rows.length} kwitansi</td><td class="num">${fmtNum(sum(rows, 'Pokok'))}</td><td class="num">${fmtNum(sum(rows, 'Bunga'))}</td><td class="num">${fmtNum(sum(rows, 'Denda'))}</td><td class="num">${fmtRp(sum(rows, 'Jumlah'))}</td><td></td></tr>` })}</div>`;
  },
  rq: debounce(v => { Pages.angsuran.S().q = v; Tbl.reset('riwayat'); Pages.angsuran.draw_riwayat(); const i = document.querySelector('#angBody input[type=search]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250)
};


// ════════════════════════════════════════════════════════
// HALAMAN: STOK BARANG & INVENTARIS TOKO
// ════════════════════════════════════════════════════════
const murabahah = (hj, tenor) => Calc.pinjaman(hj, Calc.rate('barang'), tenor || 10).angsuran;
Pages.stok = {
  title: 'Stok Barang Koperasi', roles: ['admin', 'bendahara', 'pengawas'],
  render(el) {
    const s = st('stok', { kat: 'semua', q: '', sort: 'stok' });
    const B = S.db.barang, aktif = B.filter(b => b.Status !== 'nonaktif');
    const nilai = sum(aktif, b => num(b.Stok) * num(b.Harga_Beli)), potensi = sum(aktif, b => num(b.Stok) * (num(b.Harga_Jual) - num(b.Harga_Beli)));
    const kats = {}; aktif.forEach(b => { kats[b.Kategori] = (kats[b.Kategori] || 0) + 1; });
    const salur = D.berjalan.filter(l => l.Jenis === 'barang');
    el.innerHTML = pageHead({ crumbs: [['Dashboard', 'dashboard'], ['Toko & Logistik'], ['Stok Barang']], title: 'Manajemen Stok Barang & Inventaris Toko', desc: 'Etalase pengadaan barang, seragam sivitas, gadget edukasi guru, dan log mutasi inventaris yang terhubung otomatis dengan akad murabahah (margin ' + fmtPct(Calc.rate('barang')) + '% dari harga barang).',
      actions: `<button class="btn btn-outline" onclick="Pages.stok.excel()"><i class="bi bi-file-earmark-excel"></i> Ekspor Katalog</button>${canWrite() ? `<button class="btn btn-outline" onclick="Pages.stok.mutasi()"><i class="bi bi-box-arrow-in-down"></i> Barang Masuk</button><button class="btn btn-primary" onclick="Pages.stok.form()"><i class="bi bi-plus-square"></i> Tambah Produk</button>` : ''}` }) + `
      <div class="grid g-kpi mb-3">
        <div class="hero khatam-bg"><span class="khatam-star"></span><div class="row-between"><span class="eyebrow">Total Valuasi Aset Toko</span>${badge(T().slice(0, 4), 'b-solid')}</div><div class="hero-amount">${rp(nilai)}</div><div class="small"><span class="muted">HPP rata-rata tertimbang</span> · <span class="gold-text">Potensi margin +${fmtJt(potensi)}</span></div></div>
        ${kpi({ label: 'SKU Terdaftar', value: aktif.length + ' <small>SKU barang</small>', icon: 'bi-upc-scan', tag: badge('100% aktif', 'b-green'), sub: Object.keys(kats).slice(0, 4).map(k => badge(kats[k] + ' ' + k, 'b-gray')).join(' ') })}
        ${kpi({ label: 'Disalurkan Murabahah', value: rp(sum(salur, 'Pokok')), icon: 'bi-arrow-left-right', tone: 'gold', sub: salur.length + ' akad SP-B berjalan · stok auto-potong' })}
        ${kpi({ label: 'Status Peringatan', value: D.lowStock.length + ' <small>item kritis</small>', icon: 'bi-exclamation-triangle', tone: 'red', tag: D.lowStock.length ? badge('Perlu order', 'b-red') : '', sub: D.lowStock.slice(0, 3).map(b => esc(b.Nama.split(' ').slice(0, 2).join(' '))).join(' • ') || 'Semua stok aman' })}
      </div>
      <div class="grid g-main-side">
        <div class="card-k flush"><div class="p-3 stack" style="gap:12px">
          <div class="toolbar"><div class="inp-group grow"><span class="addon"><i class="bi bi-search"></i></span><input class="inp" type="search" value="${esc(s.q)}" placeholder="Cari kode, nama barang, spesifikasi…" oninput="Pages.stok.q(this.value)" aria-label="Cari barang"></div>
            <select class="inp" style="width:auto" onchange="Pages.stok.set('sort',this.value)" aria-label="Urutkan">${optList([['stok', 'Stok terendah'], ['nama', 'Nama A–Z'], ['nilai', 'Nilai terbesar'], ['kode', 'Kode SKU']], s.sort)}</select></div>
          <div class="chips">${[['semua', 'Semua kategori', aktif.length]].concat(Object.keys(kats).map(k => [k, k, kats[k]])).map(c => `<button class="chip-btn ${s.kat === c[0] ? 'on' : ''}" ${on('Pages.stok.set', 'kat', c[0])}>${esc(c[1])} (${c[2]})</button>`).join('')}</div></div>
          <div id="stokList"></div></div>
        <div class="stack">
          ${canWrite() ? `<div class="card-k"><div class="card-head"><h3><i class="bi bi-arrow-down-up"></i> Input Mutasi Stok</h3>${badge('Otomatis jurnal', 'b-blue')}</div><div id="mutForm">${Pages.stok.mutasiHtml('sm')}</div></div>` : ''}
          <div class="card-k"><div class="card-head"><h3><i class="bi bi-clock-history"></i> Log Mutasi Terkini</h3></div><div class="list" id="mutLog"></div></div>
          <div class="card-k soft"><div class="row-gap mb-2"><span class="kpi-icon"><i class="bi bi-patch-check"></i></span><b class="font-head">Kepatuhan Syariah: Akad Murabahah</b></div><p class="small mb-2">Sesuai Fatwa DSN-MUI No. 04/DSN-MUI/IV/2000: barang wajib dimiliki secara sah (qabdh) oleh koperasi sebelum diserahterimakan. Margin ${fmtPct(Calc.rate('barang'))}% dari harga barang × lama angsuran dinyatakan transparan di awal tanpa riba & denda berlipat.</p><div class="row-gap xs fw-600 text-primary"><span><i class="bi bi-check-circle"></i> Kepemilikan fisik sah</span><span><i class="bi bi-check-circle"></i> Ijab qabul tertulis</span></div></div>
        </div></div>`;
    Pages.stok.list();
  },
  refresh() { if (!document.getElementById('stokList')) return Router.render(); Pages.stok.list(); },
  set(k, v) { st('stok')[k] = v; Tbl.reset('stok'); if (k === 'kat') Router.render(); else Pages.stok.list(); },
  q: debounce(v => { st('stok').q = v; Tbl.reset('stok'); Pages.stok.list(); }, 200),
  rows() {
    const s = st('stok'), q = s.q.toLowerCase();
    const r = S.db.barang.filter(b => (s.kat === 'semua' || b.Kategori === s.kat) && (!q || [b.ID_Barang, b.Nama, b.Spesifikasi, b.Kategori].some(v => String(v || '').toLowerCase().includes(q))));
    const so = { stok: (a, b) => (num(a.Stok) - num(a.Stok_Min)) - (num(b.Stok) - num(b.Stok_Min)), nama: (a, b) => a.Nama.localeCompare(b.Nama), nilai: (a, b) => num(b.Stok) * num(b.Harga_Beli) - num(a.Stok) * num(a.Harga_Beli), kode: (a, b) => a.ID_Barang.localeCompare(b.ID_Barang) };
    return r.sort(so[s.sort] || so.stok);
  },
  list() {
    const box = document.getElementById('stokList'); if (!box) return;
    box.innerHTML = Tbl.html({ id: 'stok', rows: Pages.stok.rows(), unit: 'SKU', per: 10, emptyIcon: 'bi-box-seam', rowAttr: canWrite() ? (b => on('Pages.stok.form', b.ID_Barang)) : null, rowCls: b => num(b.Stok) <= num(b.Stok_Min) ? 'row-warn' : '',
      cols: [{ h: 'Kode SKU', v: b => `<span class="mono fw-600 text-primary">${esc(b.ID_Barang)}</span>${b.Status === 'nonaktif' ? '<div>' + badge('Nonaktif', 'b-gray') + '</div>' : ''}` },
        { h: 'Nama Produk & Kategori', main: true, v: b => `<div class="cell-main">${esc(b.Nama)}</div><div class="cell-sub">${badge(b.Kategori, 'b-gray')} ${esc(b.Spesifikasi || '')}</div>` },
        { h: 'Harga Tunai / HPP', cls: 'num', v: b => `<b>${fmtNum(b.Harga_Jual)}</b><div class="cell-sub">HPP ${fmtNum(b.Harga_Beli)}</div>` },
        { h: 'Murabahah 10 bln', cls: 'num', v: b => `<b class="text-gold nowrap">${fmtJt(murabahah(b.Harga_Jual))}/bln</b><div class="cell-sub">margin ${fmtPct(Calc.rate('barang'))}%/bln • 10 bln</div>` },
        { h: 'Stok', cls: 'num', v: b => `<b style="font-size:16px" class="${num(b.Stok) <= num(b.Stok_Min) ? 'text-danger' : ''}">${b.Stok}</b> <span class="cell-sub">${esc(b.Satuan)}</span>${num(b.Stok) <= num(b.Stok_Min) ? '<div>' + badge('Menipis (min ' + b.Stok_Min + ')', 'b-red') + '</div>' : ''}` },
        { h: '', label: 'Aksi', cls: 'num nowrap', v: b => canWrite() ? `<button class="btn btn-sm btn-ghost" aria-label="Mutasi" onclick="event.stopPropagation();${call('Pages.stok.mutasi', b.ID_Barang)}"><i class="bi bi-arrow-down-up"></i></button><button class="btn btn-sm btn-ghost" aria-label="Ubah" ${on('Pages.stok.form', b.ID_Barang)}><i class="bi bi-pencil"></i></button>` : '' }] });
    const log = document.getElementById('mutLog');
    if (log) {
      const ms = S.db.mutasi.slice().sort((a, b) => String(b.Tanggal).localeCompare(String(a.Tanggal))).slice(0, 6);
      log.innerHTML = ms.length ? ms.map(m => { const b = D.barang[m.ID_Barang] || {}; const inn = m.Jenis === 'masuk'; return `<div class="list-item"><span class="li-icon ${inn ? '' : m.Sumber === 'pinjaman' ? 'gold' : 'out'}"><i class="bi ${inn ? 'bi-box-arrow-in-down' : m.Sumber === 'pinjaman' ? 'bi-file-earmark-check' : 'bi-box-arrow-up'}"></i></span><div class="li-body"><b>${esc(b.Nama || m.ID_Barang)}</b><span>${esc(m.Referensi || m.Sumber)} · ${esc(cap(m.Sumber))}</span></div><div class="li-end"><b class="${inn ? 'amt-in' : 'amt-out'}">${inn ? '+' : '-'}${m.Qty} ${esc(b.Satuan || '')}</b><span>${fmtDate(m.Tanggal)}</span></div></div>`; }).join('') : empty('bi-clock', 'Belum ada mutasi');
    }
  },
  mutasiHtml(px, id) {
    const brg = S.db.barang.filter(b => b.Status !== 'nonaktif').sort((a, b) => a.Nama.localeCompare(b.Nama));
    return `<form id="${px}Mut" class="form-grid" novalidate onsubmit="event.preventDefault();Pages.stok.saveMutasi('${px}')">
      <div class="fg"><label>Pilih produk / SKU <span class="req">*</span></label><select class="inp" name="ID_Barang" required data-msg="Pilih barang" onchange="Pages.stok.mutInfo('${px}')"><option value="">— pilih —</option>${brg.map(b => `<option value="${esc(b.ID_Barang)}" ${b.ID_Barang === id ? 'selected' : ''}>${esc(b.ID_Barang)} • ${esc(b.Nama)}</option>`).join('')}</select><span class="hint" id="${px}MutInfo"></span></div>
      <div class="fg"><label>Jenis mutasi</label><div class="choice-grid" style="grid-template-columns:1fr 1fr">${[['masuk', 'Masuk (PO)', 'bi-plus-circle'], ['keluar', 'Keluar (POS)', 'bi-dash-circle']].map((o, i) => `<label class="choice"><input type="radio" name="Jenis" value="${o[0]}" ${i === 0 ? 'checked' : ''} onchange="Pages.stok.mutInfo('${px}')"><span class="c-body" style="padding:10px;align-items:center"><i class="bi ${o[2]}"></i><b style="font-size:13px">${o[1]}</b></span></label>`).join('')}</div></div>
      <div class="fg" id="${px}Sumber" hidden><label>Sumber barang keluar</label><select class="inp" name="Sumber">${optList([['tunai', 'Penjualan tunai toko'], ['rusak', 'Rusak / hilang (penyesuaian)']])}</select></div>
      <div class="form-grid cols-2"><div class="fg"><label>Jumlah (qty) <span class="req">*</span></label><input class="inp" type="number" name="Qty" min="1" required value="1" data-msg="Qty minimal 1"></div><div class="fg"><label>Tanggal</label><input class="inp" type="date" name="Tanggal" value="${T()}" max="${T()}"></div></div>
      <div class="fg"><label id="${px}HargaLbl">Harga beli satuan (HPP)</label><div class="inp-group"><span class="addon rp">Rp</span><input class="inp money-inp" name="Harga" data-money inputmode="numeric" placeholder="otomatis"></div></div>
      <div class="fg"><label>No. faktur / referensi</label><input class="inp" name="Referensi" placeholder="mis. RESTOCK-PO-104" maxlength="60"></div>
      <div class="fg"><label>Keterangan / supplier</label><input class="inp" name="Keterangan" placeholder="Pengadaan dari rekanan…" maxlength="200"></div>
      <button class="btn btn-primary btn-block"><i class="bi bi-check2-circle"></i> Simpan Mutasi & Perbarui Stok</button></form>`;
  },
  mutInfo(px) {
    const f = document.getElementById(px + 'Mut'); if (!f) return;
    const b = D.barang[f.ID_Barang.value], keluar = f.Jenis.value === 'keluar';
    document.getElementById(px + 'Sumber').hidden = !keluar;
    document.getElementById(px + 'HargaLbl').textContent = keluar ? 'Harga jual satuan (tunai)' : 'Harga beli satuan (HPP)';
    document.getElementById(px + 'MutInfo').innerHTML = b ? `Stok saat ini <b>${b.Stok} ${esc(b.Satuan)}</b> · HPP ${fmtRp(b.Harga_Beli)} · jual ${fmtRp(b.Harga_Jual)}` : '';
    f.Harga.placeholder = b ? fmtNum(keluar ? b.Harga_Jual : b.Harga_Beli) : 'otomatis';
  },
  mutasi(id) {
    if (!canWrite()) return;
    Modal.open({ title: 'Mutasi Stok Barang', sub: 'Barang masuk (pembelian) atau keluar (penjualan tunai / rusak)', icon: 'bi-arrow-down-up', body: Pages.stok.mutasiHtml('mm', id) });
    setTimeout(() => Pages.stok.mutInfo('mm'), 0);
  },
  saveMutasi(px) {
    const f = document.getElementById(px + 'Mut'), data = Form.check(f); if (!data) return;
    const b = D.barang[data.ID_Barang], qty = parseInt(data.Qty, 10), keluar = data.Jenis === 'keluar';
    if (keluar && qty > num(b.Stok)) { toast('Stok tidak cukup (tersedia ' + b.Stok + ' ' + b.Satuan + ').', 'warning'); return; }
    const harga = parseRp(data.Harga) || (keluar ? num(b.Harga_Jual) : num(b.Harga_Beli)), tmp = uid();
    const payload = { tmpId: tmp, ID_Barang: b.ID_Barang, Jenis: data.Jenis, Qty: qty, Sumber: keluar ? data.Sumber : 'pembelian', Tanggal: data.Tanggal, Referensi: data.Referensi, Keterangan: data.Keterangan };
    if (keluar) payload.Harga_Jual_Satuan = harga; else payload.Harga_Satuan = harga;
    commit({ action: 'stok.mutasi', payload, tables: ['barang', 'mutasi'], label: 'Mutasi stok',
      apply: () => {
        const x = S.db.barang.find(z => z.ID_Barang === b.ID_Barang), stok = num(x.Stok), hb = num(x.Harga_Beli);
        S.db.mutasi.push({ ID: tmp, ID_Barang: x.ID_Barang, Tanggal: data.Tanggal, Jenis: data.Jenis, Qty: qty, Harga_Satuan: keluar ? hb : harga, Harga_Jual_Satuan: keluar ? (data.Sumber === 'tunai' ? harga : 0) : num(x.Harga_Jual), Sumber: payload.Sumber, Referensi: data.Referensi, Keterangan: data.Keterangan, Dicatat_Oleh: S.user.nama, _pending: true });
        if (keluar) x.Stok = stok - qty; else { x.Harga_Beli = Math.round((stok * hb + qty * harga) / (stok + qty)); x.Stok = stok + qty; }
      } });
    if (px === 'mm') Modal.close(); else { f.Qty.value = 1; f.Harga.value = ''; f.Referensi.value = ''; f.Keterangan.value = ''; Pages.stok.mutInfo(px); }
  },
  form(id) {
    if (!canWrite()) return;
    const b = id ? D.barang[id] : null;
    const kat = ['Elektronik', 'Seragam', 'Media Ajar', 'Sembako', 'ATK'];
    Modal.open({ title: b ? 'Ubah Produk ' + b.ID_Barang : 'Tambah Produk Baru & Pengadaan', sub: 'Pencatatan SKU, HPP, kalkulator margin murabahah, dan label QR', icon: 'bi-box-seam', size: 'lg',
      body: `<form id="fBarang" class="stack" novalidate oninput="Pages.stok.sim()">
        <div><div class="label mb-2">Kategori produk</div><div class="chips">${kat.map(k => `<label class="chip-btn ${(b ? b.Kategori : 'Elektronik') === k ? 'on' : ''}" style="display:inline-flex;align-items:center"><input type="radio" name="Kategori" value="${k}" ${(b ? b.Kategori : 'Elektronik') === k ? 'checked' : ''} hidden onchange="this.closest('.chips').querySelectorAll('.chip-btn').forEach(c=>c.classList.toggle('on',c.contains(this)))">${k}</label>`).join('')}</div></div>
        <div class="form-grid cols-2">
          <div class="fg full"><label>Nama produk & spesifikasi <span class="req">*</span></label><input class="inp" name="Nama" required minlength="3" value="${esc(b ? b.Nama : '')}" placeholder="mis. Laptop Acer Aspire 5 Slim i5 16GB" data-msg="Nama barang wajib diisi"></div>
          <div class="fg full"><label>Keterangan spesifikasi</label><input class="inp" name="Spesifikasi" value="${esc(b ? b.Spesifikasi : '')}" placeholder="SSD 512GB, paket pembelajaran guru"></div>
          <div class="fg"><label>Satuan</label><select class="inp" name="Satuan">${optList(['Unit', 'Pcs', 'Stel', 'Paket', 'Buah', 'Lusin', 'Kg'], b ? b.Satuan : 'Unit')}</select></div>
          ${b ? `<div class="fg"><label>Status</label><select class="inp" name="Status">${optList([['aktif', 'Aktif dijual'], ['nonaktif', 'Nonaktif']], b.Status)}</select></div>` : `<div class="fg"><label>Stok masuk awal</label><input class="inp" type="number" name="stokAwal" min="0" value="0"></div>`}
          <div class="fg"><label>Safety stock (minimum)</label><input class="inp" type="number" name="Stok_Min" min="0" value="${esc(b ? b.Stok_Min : 3)}"></div>
          <div class="fg"><label>No. faktur pembelian (PO)</label><input class="inp" name="referensi" placeholder="PO-MEDU-2026-031" ${b ? 'disabled' : ''}></div>
          <div class="fg"><label>Harga pokok perolehan (HPP) <span class="req">*</span></label><div class="inp-group"><span class="addon rp">Rp</span><input class="inp money-inp" name="Harga_Beli" data-money required value="${b ? fmtNum(b.Harga_Beli) : ''}" ${b && num(b.Stok) > 0 ? 'readonly title="HPP dihitung otomatis (rata-rata) selama stok > 0"' : ''} data-msg="HPP wajib diisi"></div>${b && num(b.Stok) > 0 ? '<span class="hint">Terkunci: HPP rata-rata tertimbang otomatis saat barang masuk.</span>' : ''}</div>
          <div class="fg"><label>Harga tunai toko <span class="req">*</span> <span class="xs text-primary" id="fbMargin"></span></label><div class="inp-group"><span class="addon rp">Rp</span><input class="inp money-inp" name="Harga_Jual" data-money required value="${b ? fmtNum(b.Harga_Jual) : ''}" data-msg="Harga jual wajib diisi"></div></div>
        </div>
        <div class="card-k" style="background:var(--gold-soft);border-color:transparent;box-shadow:none"><div class="row-between mb-2"><b class="small"><i class="bi bi-calculator"></i> Simulasi Pembiayaan Murabahah Sivitas (Tenor 10 Bulan)</b>${badge('Margin ' + fmtPct(Calc.rate('barang')) + '% × 10 bln', 'b-gold')}</div><div class="grid g-3" id="fbSim"></div></div>
        ${b ? '' : `<label class="check"><input type="checkbox" name="qabdh" required data-msg="Konfirmasi serah terima fisik"> <span><b>Konfirmasi qabdh hissi (serah terima fisik).</b> Barang telah diterima utuh di gudang koperasi sebelum ditawarkan akad murabahah ke anggota.</span></label>`}
      </form>`,
      foot: `<button class="btn btn-outline" data-bs-dismiss="modal">Batal</button><button class="btn btn-primary" onclick="Pages.stok.save(${esc(JSON.stringify(id || ''))})"><i class="bi bi-check2-circle"></i> ${b ? 'Simpan Perubahan' : 'Simpan Produk'}</button>` });
    setTimeout(Pages.stok.sim, 0);
  },
  sim() {
    const f = document.getElementById('fBarang'); if (!f) return;
    const hb = parseRp(f.Harga_Beli.value), hj = parseRp(f.Harga_Jual.value), h = Calc.pinjaman(hj, Calc.rate('barang'), 10);
    document.getElementById('fbMargin').textContent = hb && hj ? '(+' + (Math.round((hj - hb) / hb * 1000) / 10).toString().replace('.', ',') + '% margin)' : '';
    document.getElementById('fbSim').innerHTML = `<div class="stat-mini" style="background:var(--surface)"><span>Total margin (${fmtPct(Calc.rate('barang'))}% × 10 bln)</span><b>${fmtRp(h.totalBunga)}</b></div><div class="stat-mini" style="background:var(--surface)"><span>Harga jual murabahah</span><b>${fmtRp(h.total)}</b></div><div class="stat-mini" style="background:var(--surface)"><span>Angsuran guru</span><b class="text-primary">${fmtRp(h.angsuran)}/bln</b></div>`;
  },
  save(id) {
    const f = document.getElementById('fBarang');
    const data = Form.check(f, { Harga_Jual: v => parseRp(v) > 0 ? '' : 'Harga jual harus lebih dari 0' });
    if (!data) return;
    const rec = { Nama: data.Nama, Kategori: data.Kategori || 'Elektronik', Spesifikasi: data.Spesifikasi, Satuan: data.Satuan, Stok_Min: parseInt(data.Stok_Min, 10) || 0, Harga_Beli: parseRp(data.Harga_Beli), Harga_Jual: parseRp(data.Harga_Jual) };
    if (id) {
      rec.ID_Barang = id; rec.Status = data.Status;
      commit({ action: 'barang.simpan', payload: { record: rec }, tables: ['barang'], apply: () => { const i = S.db.barang.findIndex(b => b.ID_Barang === id); S.db.barang[i] = Object.assign({}, S.db.barang[i], rec); } });
    } else {
      const tmp = uid(), awal = Math.max(0, parseInt(data.stokAwal, 10) || 0);
      commit({ action: 'barang.simpan', payload: { record: Object.assign({ ID_Barang: tmp }, rec), stokAwal: awal, referensi: data.referensi }, tables: ['barang', 'mutasi'],
        apply: () => {
          S.db.barang.push(Object.assign({ ID_Barang: tmp, Stok: awal, Status: 'aktif', Tgl_Update: T(), _pending: true }, rec));
          if (awal) S.db.mutasi.push({ ID: uid(), ID_Barang: tmp, Tanggal: T(), Jenis: 'masuk', Qty: awal, Harga_Satuan: rec.Harga_Beli, Harga_Jual_Satuan: rec.Harga_Jual, Sumber: 'pembelian', Referensi: data.referensi, Keterangan: 'Stok awal', Dicatat_Oleh: S.user.nama, _pending: true });
        },
        ok: () => { S.db.mutasi = S.db.mutasi.filter(m => !(m._pending && String(m.ID_Barang).startsWith('tmp_'))); derive(); Router.refresh(); } });
    }
    Modal.close();
  },
  excel() {
    Docs.excel('Katalog_Stok_' + T(), [{ name: 'Katalog', rows: Pages.stok.rows().map(b => ({ 'Kode SKU': b.ID_Barang, Nama: b.Nama, Kategori: b.Kategori, Spesifikasi: b.Spesifikasi, Satuan: b.Satuan, HPP: num(b.Harga_Beli), 'Harga Tunai': num(b.Harga_Jual), Stok: num(b.Stok), 'Stok Minimum': num(b.Stok_Min), 'Nilai Persediaan': num(b.Stok) * num(b.Harga_Beli), 'Angsuran Murabahah 10 bln': murabahah(b.Harga_Jual), Status: b.Status })) },
      { name: 'Mutasi', rows: S.db.mutasi.map(m => ({ ID: m.ID, 'Kode SKU': m.ID_Barang, Barang: (D.barang[m.ID_Barang] || {}).Nama, Tanggal: m.Tanggal, Jenis: m.Jenis, Qty: num(m.Qty), 'HPP Satuan': num(m.Harga_Satuan), 'Harga Jual Satuan': num(m.Harga_Jual_Satuan), Sumber: m.Sumber, Referensi: m.Referensi, Keterangan: m.Keterangan })) }]);
  }
};

// ════════════════════════════════════════════════════════
// LAPORAN: definisi data (dipakai layar, Excel & PDF sekaligus)
// ════════════════════════════════════════════════════════
const Reports = {
  list: [['simpanan', 'Rekap Simpanan', 'bi-piggy-bank'], ['pinjaman', 'Pinjaman & Angsuran', 'bi-credit-card-2-front'], ['stok', 'Stok & Penjualan', 'bi-box-seam'], ['labarugi', 'Laba Rugi', 'bi-graph-up'], ['neraca', 'Neraca', 'bi-columns-gap'], ['aruskas', 'Arus Kas', 'bi-water']],
  simpanan(a, b, q) {
    const rows = [], tot = [0, 0, 0, 0, 0, 0];
    S.db.anggota.filter(x => !q || x.Nama.toLowerCase().includes(q) || x.ID_Anggota.toLowerCase().includes(q)).forEach(ag => {
      let awal = 0, sp = 0, sw = 0, ss = 0, tr = 0;
      S.db.simpanan.forEach(x => { if (x.ID_Anggota !== ag.ID_Anggota || x.Status === 'batal') return; const v = num(x.Jumlah); if (x.Tanggal < a) awal += x.Tipe === 'tarik' ? -v : v; else if (x.Tanggal <= b) { if (x.Tipe === 'tarik') tr += v; else if (x.Jenis === 'pokok') sp += v; else if (x.Jenis === 'wajib') sw += v; else ss += v; } });
      const akhir = awal + sp + sw + ss - tr;
      if (!awal && !akhir && !sp && !sw && !ss && !tr) return;
      rows.push([ag.ID_Anggota, ag.Nama, awal, sp, sw, ss, tr, akhir]);
      [awal, sp, sw, ss, tr, akhir].forEach((v, i) => { tot[i] += v; });
    });
    rows.sort((x, y) => y[7] - x[7]);
    return { title: 'Rekap Simpanan Anggota', kpis: [['Saldo awal', tot[0]], ['Setoran (P+W+S)', tot[1] + tot[2] + tot[3]], ['Penarikan', tot[4]], ['Saldo akhir', tot[5]]],
      sections: [{ title: 'Rekap per anggota', cols: ['ID', 'Nama Anggota', 'Saldo Awal', 'Pokok', 'Wajib', 'Sukarela', 'Penarikan', 'Saldo Akhir'], money: [2, 3, 4, 5, 6, 7], rows, foot: ['', 'TOTAL ' + rows.length + ' anggota'].concat(tot) }] };
  },
  pinjaman(a, b, q) {
    const rows = [], t = { cair: 0, pokok: 0, bunga: 0, sisa: 0 };
    S.db.pinjaman.filter(l => ['berjalan', 'lunas'].includes(l.Status) && l.Tgl_Cair && l.Tgl_Cair <= b && (!q || angName(l.ID_Anggota).toLowerCase().includes(q) || l.ID_Pinjaman.toLowerCase().includes(q))).forEach(l => {
      const ps = (D.pays[l.ID_Pinjaman] || []).filter(p => p.Tanggal >= a && p.Tanggal <= b);
      const pk = sum(ps, 'Pokok'), bg = sum(ps, 'Bunga') + sum(ps, 'Denda');
      const tg = D.tunggakan.find(x => x.loan.ID_Pinjaman === l.ID_Pinjaman);
      if (l.Status === 'lunas' && !ps.length && !(l.Tgl_Cair >= a)) return;
      const cairIn = l.Tgl_Cair >= a ? num(l.Pokok) : 0;
      rows.push([l.No_Perjanjian || l.ID_Pinjaman, angName(l.ID_Anggota), cap(l.Jenis) + ' ' + fmtPct(Calc.loanPct(l)) + '%', l.Tgl_Cair, num(l.Pokok), pk, bg, num(l.Sisa_Tagihan), l.Status === 'lunas' ? 'Lunas' : tg ? 'Menunggak H+' + tg.days : 'Lancar']);
      t.cair += cairIn; t.pokok += pk; t.bunga += bg; t.sisa += num(l.Sisa_Tagihan);
    });
    return { title: 'Rekap Pinjaman & Angsuran', kpis: [['Pencairan periode ini', t.cair], ['Angsuran pokok diterima', t.pokok], ['Bunga/margin & denda', t.bunga], ['Sisa tagihan', t.sisa]],
      sections: [{ title: 'Portofolio pembiayaan', cols: ['No. Akad', 'Anggota', 'Jenis', 'Tgl Cair', 'Plafon', 'Pokok Diterima', 'Bunga+Denda', 'Sisa Tagihan', 'Kolektibilitas'], money: [4, 5, 6, 7], date: [3], rows, foot: ['TOTAL', rows.length + ' akad', '', '', sum(rows, 4), t.pokok, t.bunga, t.sisa, ''] },
        { title: 'Daftar tunggakan per ' + fmtDate(T()), cols: ['Anggota', 'No. Akad', 'Cicilan', 'Hari Terlambat', 'Nominal'], money: [4], rows: D.tunggakan.map(x => [angName(x.loan.ID_Anggota), x.loan.No_Perjanjian, x.rows.map(r => r.Cicilan_Ke).join(', '), 'H+' + x.days, x.total]), foot: ['TOTAL', D.tunggakan.length + ' debitur', '', '', sum(D.tunggakan, 'total')] }] };
  },
  stok(a, b, q) {
    const rows = [], t = [0, 0, 0, 0, 0, 0];
    S.db.barang.filter(x => !q || x.Nama.toLowerCase().includes(q)).forEach(br => {
      let awal = 0, masuk = 0, kredit = 0, tunai = 0, rusak = 0, jual = 0, laba = 0;
      S.db.mutasi.forEach(m => {
        if (m.ID_Barang !== br.ID_Barang) return;
        const q2 = num(m.Qty), sg = m.Jenis === 'masuk' ? q2 : -q2;
        if (m.Tanggal < a) { awal += sg; return; }
        if (m.Tanggal > b) return;
        if (m.Jenis === 'masuk') masuk += q2;
        else if (m.Sumber === 'pinjaman') { kredit += q2; jual += q2 * num(m.Harga_Jual_Satuan); laba += q2 * (num(m.Harga_Jual_Satuan) - num(m.Harga_Satuan)); }
        else if (m.Sumber === 'tunai') { tunai += q2; jual += q2 * num(m.Harga_Jual_Satuan); laba += q2 * (num(m.Harga_Jual_Satuan) - num(m.Harga_Satuan)); }
        else rusak += q2;
      });
      const akhir = awal + masuk - kredit - tunai - rusak;
      rows.push([br.ID_Barang, br.Nama, awal, masuk, kredit, tunai + rusak, akhir, akhir * num(br.Harga_Beli), jual, laba]);
      t[0] += akhir * num(br.Harga_Beli); t[1] += jual; t[2] += laba; t[3] += masuk; t[4] += kredit; t[5] += tunai;
    });
    return { title: 'Laporan Stok & Penjualan Barang', kpis: [['Nilai persediaan akhir', t[0]], ['Penjualan (kredit+tunai)', t[1]], ['Laba kotor barang', t[2]], ['Unit masuk', t[3], 'qty']],
      sections: [{ title: 'Mutasi & penjualan per SKU', cols: ['SKU', 'Nama Barang', 'Stok Awal', 'Masuk', 'Murabahah', 'Tunai/Rusak', 'Stok Akhir', 'Nilai Persediaan', 'Penjualan', 'Laba Kotor'], money: [7, 8, 9], rows, foot: ['TOTAL', rows.length + ' SKU', '', t[3], t[4], '', '', t[0], t[1], t[2]] }] };
  },
  labarugi(a, b) {
    const r = Rep.labaRugi(a, b);
    const rows = [{ c: ['PENDAPATAN', ''], s: 'head' }, { c: ['Bunga pinjaman uang (qardh ' + fmtPct(Calc.rate('uang')) + '%/bln dari pokok)', r.bungaUang], s: 'indent' }, { c: ['Margin pinjaman barang (murabahah ' + fmtPct(Calc.rate('barang')) + '%/bln dari harga)', r.bungaBarang], s: 'indent' },
      { c: ['Laba selisih harga barang (akad murabahah)', r.labaKredit], s: 'indent' }, { c: ['Laba penjualan tunai toko', r.labaTunai], s: 'indent' }];
    if (r.denda || String(S.settings.DENDA_AKTIF) === 'ya') rows.push({ c: ['Pendapatan denda keterlambatan', r.denda], s: 'indent' });
    rows.push({ c: ['Total Pendapatan', r.pendapatan], s: 'total' }, { c: ['BEBAN', ''], s: 'head' });
    Object.keys(r.biayaKat).sort().forEach(k => rows.push({ c: ['Beban ' + k, -r.biayaKat[k]], s: 'indent' }));
    if (r.rusak) rows.push({ c: ['Kerugian barang rusak / penyesuaian persediaan', -r.rusak], s: 'indent' });
    rows.push({ c: ['Total Beban', -r.beban], s: 'total' }, { c: [r.laba >= 0 ? 'LABA BERSIH PERIODE' : 'RUGI BERSIH PERIODE', r.laba], s: 'grand' });
    return { title: 'Laporan Laba Rugi', kpis: [['Total pendapatan', r.pendapatan], ['Total beban', r.beban], [r.laba >= 0 ? 'Laba bersih' : 'Rugi bersih', r.laba], ['Margin laba', r.pendapatan ? Math.round(r.laba / r.pendapatan * 100) : 0, '%']],
      sections: [{ title: 'Laba rugi periode ' + fmtDate(a) + ' s.d. ' + fmtDate(b), cols: ['Uraian', 'Jumlah (Rp)'], money: [1], stmt: true, rows }], note: 'Laporan sederhana (akuntansi koperasi dasar, basis kas untuk bunga/margin); bukan pengganti audit akuntan publik.' };
  },
  neraca(a, b) {
    const n = Rep.neraca(b);
    const rows = [{ c: ['ASET', ''], s: 'head' }, { c: ['Kas & bank', n.kas], s: 'indent' }, { c: ['Piutang pinjaman uang', n.piutangUang], s: 'indent' }, { c: ['Piutang pinjaman barang (murabahah)', n.piutangBarang], s: 'indent' }, { c: ['Persediaan barang toko', n.persediaan], s: 'indent' }, { c: ['TOTAL ASET', n.aset], s: 'grand' },
      { c: ['KEWAJIBAN & EKUITAS', ''], s: 'head' }, { c: ['Simpanan pokok anggota', n.simp.pokok], s: 'indent' }, { c: ['Simpanan wajib anggota', n.simp.wajib], s: 'indent' }, { c: ['Simpanan sukarela (wadiah)', n.simp.sukarela], s: 'indent' },
      { c: ['Cadangan / modal awal koperasi', n.modal], s: 'indent' }, { c: ['SHU / laba berjalan (akumulasi)', n.laba], s: 'indent' }, { c: ['TOTAL KEWAJIBAN & EKUITAS', n.pasiva], s: 'grand' }];
    return { title: 'Laporan Neraca', kpis: [['Total aset', n.aset], ['Simpanan anggota', n.simpTotal], ['Ekuitas (modal+laba)', n.modal + n.laba], ['Selisih (harus 0)', n.selisih]], balanced: n.selisih === 0,
      sections: [{ title: 'Neraca per ' + fmtDate(b), cols: ['Pos', 'Jumlah (Rp)'], money: [1], stmt: true, rows }], note: n.selisih === 0 ? 'Neraca SEIMBANG: total aset = total kewajiban & ekuitas.' : 'Perhatian: terdapat selisih ' + fmtRp(n.selisih) + '.' };
  },
  aruskas(a, b) {
    const r = Rep.arusKas(a, b);
    const rows = [{ c: ['A. ARUS KAS DARI AKTIVITAS OPERASI', ''], s: 'head' }, { c: ['Penerimaan angsuran pokok pinjaman', r.angsPokok], s: 'indent' }, { c: ['Penerimaan bunga & margin pembiayaan', r.bungaMargin], s: 'indent' }, { c: ['Penerimaan denda', r.denda], s: 'indent' }, { c: ['Penerimaan penjualan tunai toko', r.jualTunai], s: 'indent' },
      { c: ['Pembayaran pembelian barang / supplier', -r.beliBarang], s: 'indent' }, { c: ['Pembayaran biaya operasional', -r.biaya], s: 'indent' }, { c: ['Kas bersih dari aktivitas operasi (A)', r.operasi], s: 'total' },
      { c: ['B. ARUS KAS DARI AKTIVITAS PENDANAAN', ''], s: 'head' }, { c: ['Penerimaan simpanan pokok', r.setor.pokok], s: 'indent' }, { c: ['Penerimaan simpanan wajib', r.setor.wajib], s: 'indent' }, { c: ['Penerimaan simpanan sukarela', r.setor.sukarela], s: 'indent' },
      { c: ['Penarikan simpanan anggota', -r.tarik], s: 'indent' }, { c: ['Penyaluran pinjaman uang', -r.cairUang], s: 'indent' }, { c: ['Kas bersih dari aktivitas pendanaan (B)', r.pendanaan], s: 'total' },
      { c: ['KENAIKAN (PENURUNAN) BERSIH KAS (A + B)', r.naik], s: 'total' }, { c: ['Saldo kas awal periode', r.awal], s: 'indent' }, { c: ['SALDO KAS AKHIR PERIODE', r.akhir], s: 'grand' }];
    return { title: 'Laporan Arus Kas (Metode Langsung)', kpis: [['Saldo kas awal', r.awal], ['Kas masuk bersih operasi', r.operasi], ['Kas bersih pendanaan', r.pendanaan], ['Saldo kas akhir', r.akhir]], sections: [{ title: 'Arus kas ' + fmtDate(a) + ' s.d. ' + fmtDate(b), cols: ['Uraian', 'Jumlah (Rp)'], money: [1], stmt: true, rows }], note: 'Saldo kas akhir klop dengan pos Kas & bank pada Neraca per tanggal yang sama.' };
  },
  build(tab, a, b, q) { return Reports[tab](a, b, (q || '').toLowerCase()); }
};

Pages.laporan = {
  title: 'Pusat Laporan', roles: ['admin', 'bendahara', 'pengawas'],
  S() { const p = Rep.periode('tahun-ini'); return st('laporan', { tab: 'labarugi', preset: 'tahun-ini', a: p[0], b: p[1], q: '' }); },
  render(el) {
    const s = Pages.laporan.S();
    el.innerHTML = pageHead({ crumbs: [['Dashboard', 'dashboard'], ['Pusat Laporan']], title: 'Pusat Laporan Keuangan', desc: 'Rekap simpanan, pinjaman, stok, laba rugi, neraca, dan arus kas — dihitung seketika dari data terkini, siap unduh Excel & cetak PDF resmi ber-kop.',
      actions: `<button class="btn btn-outline" onclick="Pages.laporan.excel()"><i class="bi bi-file-earmark-excel"></i> Unduh Excel</button><button class="btn btn-primary" onclick="Pages.laporan.pdf()"><i class="bi bi-printer"></i> Cetak / PDF</button>` }) + `
      <div class="mb-3">${tabs(Reports.list.map(r => [r[0], r[1], r[2]]), s.tab, 'Pages.laporan.tab')}</div>
      <div class="card-k mb-3"><div class="toolbar"><div class="seg">${[['bulan-ini', 'Bulan ini'], ['bulan-lalu', 'Bulan lalu'], ['triwulan', '3 bulan'], ['tahun-ini', 'Tahun ini'], ['semua', 'Semua']].map(p => `<button class="${s.preset === p[0] ? 'on' : ''}" ${on('Pages.laporan.preset', p[0])}>${p[1]}</button>`).join('')}</div>
        <div class="row-gap"><input class="inp" type="date" style="width:auto" value="${s.a}" onchange="Pages.laporan.range('a',this.value)" aria-label="Dari tanggal" ${s.tab === 'neraca' ? 'disabled' : ''}><span class="muted">s.d.</span><input class="inp" type="date" style="width:auto" value="${s.b}" max="${T()}" onchange="Pages.laporan.range('b',this.value)" aria-label="Sampai tanggal"></div>
        ${['simpanan', 'pinjaman', 'stok'].includes(s.tab) ? `<div class="inp-group grow"><span class="addon"><i class="bi bi-search"></i></span><input class="inp" type="search" value="${esc(s.q)}" placeholder="Cari…" oninput="Pages.laporan.q(this.value)" aria-label="Cari"></div>` : ''}</div></div>
      <div id="lapBody"></div>`;
    Pages.laporan.body();
  },
  refresh() { if (!document.getElementById('lapBody')) return Router.render(); Pages.laporan.body(); },
  tab(t) { Pages.laporan.S().tab = t; Router.render(); },
  preset(p) { const s = Pages.laporan.S(), r = Rep.periode(p); s.preset = p; s.a = r[0]; s.b = r[1]; Router.render(); },
  range(k, v) { const s = Pages.laporan.S(); s[k] = v; s.preset = ''; Router.render(); },
  q: debounce(v => { Pages.laporan.S().q = v; Pages.laporan.body(); }, 250),
  data() { const s = Pages.laporan.S(); return Reports.build(s.tab, s.a, s.b, s.q); },
  body() {
    const s = Pages.laporan.S(), R = Pages.laporan.data(), box = document.getElementById('lapBody'); if (!box) return;
    const fmtK = k => k[2] === 'qty' ? fmtNum(k[1]) + ' unit' : k[2] === '%' ? k[1] + '%' : rp(k[1]);
    box.innerHTML = `<div class="grid g-kpi mb-3">${R.kpis.map((k, i) => i === R.kpis.length - 1 && !k[2] ? `<div class="hero khatam-bg"><span class="khatam-star"></span><span class="eyebrow">${esc(k[0])}</span><div class="hero-amount">${fmtK(k)}</div><div class="small muted">${s.tab === 'neraca' ? 'Per ' + fmtDate(s.b) : fmtDate(s.a) + ' – ' + fmtDate(s.b)}</div></div>` : kpi({ label: k[0], value: fmtK(k) })).join('')}</div>
      ${R.balanced !== undefined ? `<div class="info-box ${R.balanced ? 'ok' : 'danger'} mb-3"><i class="bi ${R.balanced ? 'bi-check2-circle' : 'bi-exclamation-octagon'}"></i><div><b>${R.balanced ? 'Neraca seimbang' : 'Neraca tidak seimbang'}</b> — ${esc(R.note)}</div></div>` : ''}
      ${R.sections.map((sec, i) => `<div class="card-k flush mb-3"><div class="card-head card-pad-x pt-3 mb-2"><div><h3><i class="bi ${Reports.list.find(r => r[0] === s.tab)[2]}"></i> ${esc(sec.title)}</h3><p>${esc(R.title)} · ${esc(S.settings.NAMA_KOPERASI || '')}</p></div></div>${Pages.laporan.table(sec, s.tab + i)}</div>`).join('')}
      ${R.note && R.balanced === undefined ? `<div class="info-box"><i class="bi bi-info-circle"></i><div>${esc(R.note)}</div></div>` : ''}`;
  },
  table(sec, id) {
    const money = new Set(sec.money || []), date = new Set(sec.date || []);
    const cell = (v, i) => money.has(i) && typeof v === 'number' ? (v < 0 ? `<span class="amt-out">(${fmtNum(-v)})</span>` : fmtNum(v)) : date.has(i) ? fmtDate(v) : esc(v);
    if (sec.stmt) {
      return `<div class="table-wrap"><table class="tbl"><thead><tr>${sec.cols.map((c, i) => `<th class="${i ? 'num' : ''}">${esc(c)}</th>`).join('')}</tr></thead><tbody>${sec.rows.map(r => {
        const st2 = r.s === 'head' ? 'background:var(--surface-2);font-weight:700;color:var(--primary-ink);font-size:12px;letter-spacing:.03em' : r.s === 'total' ? 'font-weight:700;background:var(--surface-3)' : r.s === 'grand' ? 'font-weight:800;background:var(--hero-bg);color:#fff' : '';
        return `<tr style="${st2}">${r.c.map((v, i) => `<td class="${i ? 'num' : ''}" style="${r.s === 'indent' && !i ? 'padding-left:28px' : ''}${r.s === 'grand' ? ';color:#fff;font-size:14px' : ''}">${v === '' ? '' : cell(v, i)}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div>`;
    }
    return Tbl.html({ id: 'lap-' + id, rows: sec.rows, unit: 'baris', per: 25, cols: sec.cols.map((c, i) => ({ h: c, cls: money.has(i) || (typeof (sec.rows[0] || [])[i] === 'number') ? 'num' : '', main: i === 1, v: r => i === 1 ? `<b>${cell(r[i], i)}</b>` : cell(r[i], i) })),
      foot: sec.foot ? `<tr>${sec.foot.map((v, i) => `<td class="${i === 1 ? 'td-main' : ''} ${typeof v === 'number' ? 'num' : ''}">${typeof v === 'number' ? (money.has(i) ? fmtRp(v) : fmtNum(v)) : esc(v)}</td>`).join('')}</tr>` : '' });
  },
  excel() {
    const s = Pages.laporan.S(), R = Pages.laporan.data();
    Docs.excel(R.title.replace(/\W+/g, '_') + '_' + s.a + '_' + s.b, R.sections.map((sec, i) => ({ name: (sec.title || 'Data').slice(0, 28).replace(/[\\/?*[\]:]/g, '-') + (i ? ' ' + i : ''),
      aoa: [[R.title], [S.settings.NAMA_KOPERASI], ['Periode: ' + s.a + ' s.d. ' + s.b], [], sec.cols].concat(sec.stmt ? sec.rows.map(r => r.c) : sec.rows).concat(sec.foot ? [sec.foot] : []) })));
  },
  pdf() { const s = Pages.laporan.S(); Docs.report(Pages.laporan.data(), s.tab === 'neraca' ? 'Per ' + fmtDate(s.b) : 'Periode ' + fmtDate(s.a) + ' s.d. ' + fmtDate(s.b)); }
};

// ════════════════════════════════════════════════════════
// HALAMAN: BIAYA OPERASIONAL
// ════════════════════════════════════════════════════════
Pages.biaya = {
  title: 'Biaya Operasional', roles: ['admin', 'bendahara', 'pengawas'],
  render(el) {
    const s = st('biaya', { bulan: '', kat: 'semua', q: '' }), mk = monthKey(T()), y = T().slice(0, 4), Bx = S.db.biaya;
    const bulanIni = sum(Bx.filter(b => monthKey(b.Tanggal) === mk), 'Jumlah'), tahun = sum(Bx.filter(b => String(b.Tanggal).startsWith(y)), 'Jumlah');
    const M = Rep.monthly(6), avg = sum(M, m => sum(Bx.filter(b => monthKey(b.Tanggal) === m.mk), 'Jumlah')) / 6;
    const kat = {}; Bx.filter(b => String(b.Tanggal).startsWith(y)).forEach(b => { kat[b.Kategori] = (kat[b.Kategori] || 0) + num(b.Jumlah); });
    const kats = Object.keys(kat).sort((a, b) => kat[b] - kat[a]);
    el.innerHTML = pageHead({ crumbs: [['Dashboard', 'dashboard'], ['Biaya Operasional']], title: 'Biaya Operasional', desc: 'Pencatatan beban operasional koperasi (honor pengelola, listrik, ATK, rapat, pemeliharaan) sebagai komponen Laporan Laba Rugi.',
      actions: `<button class="btn btn-outline" onclick="Pages.biaya.excel()"><i class="bi bi-file-earmark-excel"></i> Ekspor</button>${canWrite() ? '<button class="btn btn-primary" onclick="Pages.biaya.form()"><i class="bi bi-plus-circle"></i> Catat Biaya</button>' : ''}` }) + `
      <div class="grid g-kpi mb-3">${kpi({ label: 'Biaya Bulan Ini', value: rp(bulanIni), icon: 'bi-calendar-month', sub: fmtMonthLong(mk) })}${kpi({ label: 'Total Tahun ' + y, value: rp(tahun), icon: 'bi-receipt-cutoff', tone: 'gold' })}${kpi({ label: 'Rata-rata 6 Bulan', value: rp(Math.round(avg)), icon: 'bi-graph-down', tone: 'blue', sub: 'per bulan' })}${kpi({ label: 'Kategori Terbesar', value: esc(kats[0] || '—'), icon: 'bi-pie-chart', tone: 'red', sub: kats[0] ? fmtRp(kat[kats[0]]) + ' (' + pct(kat[kats[0]], tahun) + '%)' : '' })}</div>
      <div class="grid g-main-side"><div class="card-k flush"><div class="p-3 toolbar"><div class="inp-group grow"><span class="addon"><i class="bi bi-search"></i></span><input class="inp" type="search" value="${esc(s.q)}" placeholder="Cari keterangan…" oninput="Pages.biaya.q(this.value)" aria-label="Cari"></div>
        <select class="inp" style="width:auto" onchange="st('biaya').kat=this.value;Pages.biaya.list()" aria-label="Kategori">${optList([['semua', 'Semua kategori']].concat(Object.keys(kat)), s.kat)}</select><input class="inp" type="month" style="width:auto" value="${esc(s.bulan)}" onchange="st('biaya').bulan=this.value;Pages.biaya.list()" aria-label="Bulan"></div><div id="biayaList"></div></div>
        <div class="card-k"><div class="card-head"><h3><i class="bi bi-bar-chart"></i> Komposisi ${y}</h3></div>${kats.length ? kats.map(k => `<div class="mb-3"><div class="row-between small mb-1"><span class="fw-600">${esc(k)}</span><span>${fmtRp(kat[k])}</span></div>${progress(pct(kat[k], tahun))}</div>`).join('') : empty('bi-receipt', 'Belum ada biaya tahun ini')}</div></div>`;
    Pages.biaya.list();
  },
  refresh() { Router.render(); },
  q: debounce(v => { st('biaya').q = v; Tbl.reset('biaya'); Pages.biaya.list(); }, 200),
  rows() { const s = st('biaya'), q = s.q.toLowerCase(); return S.db.biaya.filter(b => (s.kat === 'semua' || b.Kategori === s.kat) && (!s.bulan || monthKey(b.Tanggal) === s.bulan) && (!q || String(b.Keterangan).toLowerCase().includes(q) || String(b.Kategori).toLowerCase().includes(q))).sort((a, b) => String(b.Tanggal).localeCompare(String(a.Tanggal))); },
  list() {
    const box = document.getElementById('biayaList'); if (!box) return;
    const rows = Pages.biaya.rows();
    box.innerHTML = Tbl.html({ id: 'biaya', rows, unit: 'catatan', emptyIcon: 'bi-receipt',
      cols: [{ h: 'Tanggal', v: b => fmtDate(b.Tanggal) }, { h: 'Kategori & Keterangan', main: true, v: b => `<div class="cell-main">${esc(b.Kategori)}</div><div class="cell-sub">${esc(b.Keterangan || '-')}</div>` },
        { h: 'Dicatat oleh', hideSm: true, v: b => esc(b.Dicatat_Oleh || '') }, { h: 'Jumlah', cls: 'num', v: b => `<b class="amt-out">${fmtRp(b.Jumlah)}</b>` },
        { h: '', label: 'Aksi', cls: 'num nowrap', v: b => canWrite() && !b._pending ? `<button class="btn btn-sm btn-ghost" aria-label="Ubah" ${on('Pages.biaya.form', b.ID)}><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-ghost text-danger" aria-label="Hapus" ${on('Pages.biaya.hapus', b.ID)}><i class="bi bi-trash"></i></button>` : '' }],
      foot: `<tr><td colspan="3" class="td-main">Total ${rows.length} catatan</td><td class="num">${fmtRp(sum(rows, 'Jumlah'))}</td><td></td></tr>` });
  },
  form(id) {
    if (!canWrite()) return;
    const b = id ? S.db.biaya.find(x => x.ID === id) : null;
    const kats = Array.from(new Set(['Honor Pengelola', 'Listrik, ATK & Internet', 'Rapat & Konsumsi', 'Pemeliharaan Inventaris', 'RAT & Pembinaan', 'Transportasi', 'Lain-lain'].concat(S.db.biaya.map(x => x.Kategori))));
    Modal.open({ title: b ? 'Ubah Biaya' : 'Catat Biaya Operasional', icon: 'bi-receipt', body: `<form id="fBiaya" class="form-grid cols-2" novalidate onsubmit="event.preventDefault();Pages.biaya.save('${esc(id || '')}')">
      <div class="fg"><label>Tanggal <span class="req">*</span></label><input class="inp" type="date" name="Tanggal" required value="${esc(b ? b.Tanggal : T())}" max="${T()}"></div>
      <div class="fg"><label>Kategori <span class="req">*</span></label><input class="inp" name="Kategori" list="dlKat" required value="${esc(b ? b.Kategori : '')}" placeholder="Pilih / ketik" data-msg="Kategori wajib diisi"><datalist id="dlKat">${kats.map(k => `<option value="${esc(k)}">`).join('')}</datalist></div>
      <div class="fg full"><label>Jumlah <span class="req">*</span></label><div class="inp-group"><span class="addon rp">Rp</span><input class="inp money-inp" name="Jumlah" data-money required value="${b ? fmtNum(b.Jumlah) : ''}" data-msg="Jumlah wajib diisi"></div></div>
      <div class="fg full"><label>Keterangan</label><input class="inp" name="Keterangan" value="${esc(b ? b.Keterangan : '')}" maxlength="200" placeholder="mis. Honor 3 staf pengelola bulan ini"></div>
      <button class="btn btn-primary btn-block full" style="grid-column:1/-1"><i class="bi bi-check2-circle"></i> Simpan</button></form>` });
  },
  save(id) {
    const data = Form.check(document.getElementById('fBiaya'), { Jumlah: v => parseRp(v) > 0 ? '' : 'Jumlah harus lebih dari 0' }); if (!data) return;
    const rec = { ID: id || uid(), Tanggal: data.Tanggal, Kategori: data.Kategori, Jumlah: parseRp(data.Jumlah), Keterangan: data.Keterangan, Dicatat_Oleh: S.user.nama };
    commit({ action: 'biaya.simpan', payload: { record: rec }, tables: ['biaya'], apply: () => { const i = S.db.biaya.findIndex(b => b.ID === rec.ID); if (i >= 0) S.db.biaya[i] = rec; else S.db.biaya.push(Object.assign({ _pending: true }, rec)); } });
    Modal.close();
  },
  hapus(id) {
    const b = S.db.biaya.find(x => x.ID === id);
    confirmDialog({ title: 'Hapus catatan biaya?', text: b.Kategori + ' — ' + fmtRp(b.Jumlah) + ' (' + fmtDate(b.Tanggal) + '). Tindakan tercatat di log aktivitas.', ok: 'Hapus', danger: true })
      .then(ok => { if (ok) commit({ action: 'biaya.hapus', payload: { ID: id }, tables: ['biaya'], apply: () => { S.db.biaya = S.db.biaya.filter(x => x.ID !== id); } }); });
  },
  excel() { Docs.excel('Biaya_Operasional_' + T(), [{ name: 'Biaya', rows: Pages.biaya.rows().map(b => ({ Tanggal: b.Tanggal, Kategori: b.Kategori, Jumlah: num(b.Jumlah), Keterangan: b.Keterangan, 'Dicatat oleh': b.Dicatat_Oleh })) }]); }
};

// ════════════════════════════════════════════════════════
// HALAMAN: DOKUMEN & TEMPLATE PDF
// ════════════════════════════════════════════════════════
Pages.dokumen = {
  title: 'Dokumen & Template PDF', roles: ['admin', 'bendahara', 'pengawas'],
  render(el) {
    const ang = S.db.anggota.slice().sort((a, b) => a.Nama.localeCompare(b.Nama)), loans = S.db.pinjaman.filter(l => l.No_Perjanjian && !String(l.No_Perjanjian).startsWith('('));
    const opts = { anggota: ang.map(a => [a.ID_Anggota, a.ID_Anggota + ' — ' + a.Nama]), akad: loans.map(l => [l.ID_Pinjaman, l.No_Perjanjian + ' — ' + angName(l.ID_Anggota)]), jadwal: loans.filter(l => l.Tgl_Cair).map(l => [l.ID_Pinjaman, l.No_Perjanjian + ' — ' + angName(l.ID_Anggota)]),
      bukti: S.db.simpanan.filter(x => x.No_Bukti).sort((a, b) => String(b.No_Bukti).localeCompare(String(a.No_Bukti))).slice(0, 150).map(x => [x.ID_Transaksi, x.No_Bukti + ' — ' + angName(x.ID_Anggota) + ' ' + fmtRp(x.Jumlah)]),
      kwitansi: S.db.pembayaran.filter(p => !p.No_Bukti.startsWith('tmp_')).sort((a, b) => String(b.No_Bukti).localeCompare(String(a.No_Bukti))).slice(0, 150).map(p => [p.No_Bukti, p.No_Bukti + ' — ' + angName(p.ID_Anggota) + ' ' + fmtRp(p.Jumlah)]) };
    const T0 = [['bukti', 'Bukti Setoran / Penarikan Simpanan', 'bi-receipt', 'Docs.bukti', 'FMT_BUKTI_SIMPANAN'], ['kartu', 'Kartu Simpanan Anggota', 'bi-journal-text', 'Docs.kartuSimpanan', 'anggota'],
      ['akad', 'Surat Perjanjian Pinjaman (Uang/Barang)', 'bi-file-earmark-text', 'Docs.akad', 'FMT_AKAD_UANG'], ['jadwal', 'Kartu / Jadwal Angsuran', 'bi-calendar3', 'Docs.jadwal', 'akad'],
      ['kwitansi', 'Bukti Pembayaran Angsuran (Kwitansi)', 'bi-receipt-cutoff', 'Docs.kwitansi', 'FMT_KWITANSI'], ['kta', 'Kartu Tanda Anggota (KTA)', 'bi-person-vcard', 'Docs.kta', 'anggota']];
    const arsip = S.db.arsip.slice().sort((a, b) => String(b.Waktu).localeCompare(String(a.Waktu)));
    el.innerHTML = pageHead({ crumbs: [['Dashboard', 'dashboard'], ['Dokumen & Template PDF']], title: 'Dokumen & Template PDF', desc: 'Dokumen resmi ber-kop koperasi, bernomor otomatis, dengan QR verifikasi keaslian. PDF yang diunduh otomatis diarsipkan di Google Drive per tahun/bulan.' }) + `
      <div class="grid g-2-lg mb-3">${T0.map(t => { const list = opts[t[0] === 'kartu' || t[0] === 'kta' ? 'anggota' : t[0]]; return `<div class="card-k"><div class="row-gap mb-2" style="flex-wrap:nowrap"><span class="kpi-icon"><i class="bi ${t[2]}"></i></span><div style="min-width:0"><b class="font-head">${t[1]}</b><div class="xs muted">${t[4].startsWith('FMT') ? 'Format: ' + esc(S.settings[t[4]] || '') : 'Kop surat + QR verifikasi + area tanda tangan'}</div></div></div>
        <div class="row-gap" style="flex-wrap:nowrap"><select class="inp" id="dk-${t[0]}" aria-label="Pilih data">${list.length ? optList(list) : '<option value="">Belum ada data</option>'}</select><button class="btn btn-soft" ${list.length ? '' : 'disabled'} onclick="${esc(t[3])}(document.getElementById('dk-${t[0]}').value)"><i class="bi bi-eye"></i> Pratinjau</button></div></div>`; }).join('')}
        <div class="card-k mint"><div class="row-gap mb-2"><span class="kpi-icon"><i class="bi bi-bar-chart-line"></i></span><div><b class="font-head">Laporan Keuangan (RAT)</b><div class="xs muted">Rekap, laba rugi, neraca, arus kas</div></div></div><button class="btn btn-primary btn-block" ${on('Nav.go', 'laporan')}><i class="bi bi-arrow-right"></i> Buka Pusat Laporan</button></div></div>
      <div class="grid g-main-side"><div class="card-k flush"><div class="card-head card-pad-x pt-3 mb-2"><div><h3><i class="bi bi-archive"></i> Arsip PDF di Google Drive</h3><p>${arsip.length} dokumen diarsipkan</p></div></div>
        ${Tbl.html({ id: 'arsip', rows: arsip, unit: 'dokumen', emptyIcon: 'bi-archive', emptyTitle: 'Belum ada arsip', emptyText: 'PDF tersimpan otomatis saat tombol "Unduh PDF" ditekan.',
          cols: [{ h: 'Dokumen', main: true, v: d => `<div class="cell-main">${esc(d.Jenis)}</div><div class="cell-sub mono">${esc(d.No_Dokumen)}</div>` }, { h: 'Anggota', v: d => esc(d.ID_Anggota ? angName(d.ID_Anggota) : '—') }, { h: 'Waktu', v: d => fmtDateTime(d.Waktu) + `<div class="cell-sub">${esc(d.Dibuat_Oleh)}</div>` },
            { h: '', label: 'Buka', cls: 'num', v: d => `<a class="btn btn-sm btn-ghost" href="${esc(d.URL)}" target="_blank" rel="noopener">Drive <i class="bi bi-box-arrow-up-right"></i></a>` }] })}</div>
        <div class="card-k"><div class="card-head"><h3><i class="bi bi-qr-code-scan"></i> Verifikasi Dokumen</h3></div><p class="small muted">Masukkan kode di bawah QR (format <span class="mono">NOMOR~KODE</span>) untuk memeriksa keaslian.</p>
          <form onsubmit="event.preventDefault();Pages.dokumen.verify(this.k.value)" class="stack" style="gap:8px"><input class="inp mono" name="k" required placeholder="KWT/2026/11/0001~ABC123DEF0"><button class="btn btn-outline btn-block">Periksa Keaslian</button></form><div id="dkVer" class="mt-2"></div></div></div>`;
  },
  verify(code) {
    const box = document.getElementById('dkVer'); box.innerHTML = '<span class="spinner"></span> Memeriksa…';
    Api.verify(code).then(r => { box.innerHTML = `<div class="info-box ${r.success ? 'ok' : 'danger'}"><i class="bi ${r.success ? 'bi-patch-check-fill' : 'bi-x-octagon-fill'}"></i><div><b>${esc(r.message)}</b>${r.success ? `<br>${esc(r.data.jenis)} · ${esc(r.data.nama)} · ${fmtDate(r.data.tanggal)}${r.data.jumlah ? ' · ' + fmtRp(r.data.jumlah) : ''}` : ''}</div></div>`; })
      .catch(e => { box.innerHTML = `<div class="info-box danger"><i class="bi bi-wifi-off"></i><div>${esc(e.message || e)}</div></div>`; });
  }
};

// ════════════════════════════════════════════════════════
// HALAMAN: PENGATURAN SISTEM (Admin)
// ════════════════════════════════════════════════════════
Pages.pengaturan = {
  title: 'Pengaturan Sistem', roles: ['admin'],
  draft: null,
  render(el) {
    const s = st('pengaturan', { tab: 'pembiayaan', simJenis: 'uang', simPokok: 5000000, simTenor: 10 });
    if (!Pages.pengaturan.draft) Pages.pengaturan.draft = Object.assign({}, S.settings);
    const d = Pages.pengaturan.draft, dirty = Object.keys(d).some(k => String(d[k]) !== String(S.settings[k]));
    el.innerHTML = pageHead({ crumbs: [['Dashboard', 'dashboard'], ['Administrasi'], ['Pengaturan']], title: 'Konfigurasi Kebijakan & Parameter Koperasi', desc: 'Mode audit aktif — setiap perubahan tercatat di Log Aktivitas dengan ID administrator.',
      actions: `<button class="btn btn-outline" onclick="Pages.pengaturan.discard()" ${dirty ? '' : 'disabled'}><i class="bi bi-arrow-counterclockwise"></i> Batalkan</button><button class="btn btn-primary" onclick="Pages.pengaturan.save()" ${dirty ? '' : 'disabled'}><i class="bi bi-save"></i> Simpan Semua Perubahan</button>` }) + `
      <div class="hero khatam-bg mb-3" style="padding:16px 20px"><span class="khatam-star"></span><div class="row-gap" style="flex-wrap:nowrap"><i class="bi bi-shield-lock" style="font-size:24px;color:#F4CF6B"></i><div><b class="font-head">Kepatuhan Syariah & Regulasi Internal ${badge('Terkunci regulasi', 'b-gold')}</b><div class="small muted">Perubahan persentase bunga/margin hanya berlaku untuk pengajuan akad baru, tidak surut (non-retroaktif) pada akad berjalan.</div></div></div></div>
      <div class="mb-3">${tabs([['pembiayaan', 'Margin & Pembiayaan', 'bi-percent'], ['simpanan', 'Simpanan & Modal', 'bi-piggy-bank'], ['nomor', 'Format Penomoran', 'bi-hash'], ['identitas', 'Identitas & KOP', 'bi-building'], ['pengguna', 'Pengguna & Peran', 'bi-people', S.db.pengguna.length], ['sistem', 'Sistem & Integrasi', 'bi-hdd-network']], s.tab, 'Pages.pengaturan.tab')}</div>
      <div class="grid g-main-side"><div id="setBody"></div><div class="stack detail-panel" id="setSide"></div></div>`;
    Pages.pengaturan.body(); Pages.pengaturan.side();
  },
  refresh() { if (st('pengaturan').tab === 'pengguna') Pages.pengaturan.body(); },
  tab(t) { st('pengaturan').tab = t; Router.render(); },
  set(k, v) { Pages.pengaturan.draft[k] = v; const btns = document.querySelectorAll('#page-pengaturan .page-head .actions button'); btns.forEach(b => { b.disabled = false; }); if (k.startsWith('FMT_')) Pages.pengaturan.fmtPreview(); Pages.pengaturan.side(); },
  discard() { Pages.pengaturan.draft = null; Router.render(); },
  fld(k, label, type, hint, extra) {
    const v = Pages.pengaturan.draft[k];
    if (type === 'switch') return `<div class="row-between" style="padding:10px 0;border-bottom:1px solid var(--border)"><div><b class="small">${label}</b>${hint ? `<div class="xs muted">${hint}</div>` : ''}</div><label class="switch"><input type="checkbox" ${String(v) === 'ya' ? 'checked' : ''} onchange="Pages.pengaturan.set('${k}',this.checked?'ya':'tidak')" aria-label="${esc(label)}"><span></span></label></div>`;
    if (type === 'money') return `<div class="fg"><label>${label}</label><div class="inp-group"><span class="addon rp">Rp</span><input class="inp money-inp" data-money value="${fmtNum(v)}" oninput="Pages.pengaturan.set('${k}',parseRp(this.value))"></div>${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
    if (type === 'pct') return `<div class="fg"><label>${label} <span class="req">*</span></label><div class="inp-group"><input class="inp money-inp" type="number" step="0.5" min="0" max="100" value="${esc(v)}" oninput="Pages.pengaturan.set('${k}',this.value)"><span class="addon">% / bulan</span></div>${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
    if (type === 'date') return `<div class="fg ${extra || ''}"><label>${label}</label><input class="inp" type="date" max="${T()}" value="${esc(v)}" onchange="Pages.pengaturan.set('${k}',this.value)">${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
    return `<div class="fg ${extra || ''}"><label>${label}</label><input class="inp ${type === 'mono' ? 'mono' : ''}" type="${type === 'number' ? 'number' : 'text'}" value="${esc(v)}" oninput="Pages.pengaturan.set('${k}',this.value)">${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
  },
  /** Tenor yang diizinkan = rentang bulan minimal s.d. maksimal (j = 'UANG' | 'BARANG'). */
  tenorBox(j) {
    const d = Pages.pengaturan.draft, inp = (k, lbl) => `<div class="fg"><label for="set_${k}">${lbl} <span class="req">*</span></label><div class="inp-group"><input id="set_${k}" class="inp money-inp" type="number" min="1" max="60" step="1" inputmode="numeric" value="${esc(d[k] !== undefined ? d[k] : '')}" oninput="Pages.pengaturan.set('${k}',this.value);Pages.pengaturan.tenorPrev('${j}')"><span class="addon">bulan</span></div></div>`;
    return `<div class="form-grid cols-2">${inp('TENOR_MIN_' + j, 'Tenor minimal')}${inp('TENOR_MAX_' + j, 'Tenor maksimal')}</div><div class="hint mt-1" id="tnPrev_${j}">${Pages.pengaturan.tenorText(j)}</div>`;
  },
  /** Cek rentang tenor pada draft; '' bila valid, selain itu pesan kesalahan. */
  tenorErr(j) {
    const d = Pages.pengaturan.draft, a = Number(d['TENOR_MIN_' + j]), b = Number(d['TENOR_MAX_' + j]);
    if (String(d['TENOR_MIN_' + j]).trim() === '' || String(d['TENOR_MAX_' + j]).trim() === '' || !Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b < 1 || a > 60 || b > 60) return 'Isi tenor dengan bilangan bulat 1–60 bulan.';
    if (a > b) return 'Tenor minimal tidak boleh lebih besar dari tenor maksimal.';
    return '';
  },
  tenorText(j) {
    const e = Pages.pengaturan.tenorErr(j), d = Pages.pengaturan.draft;
    if (e) return `<span class="text-danger"><i class="bi bi-exclamation-triangle"></i> ${e}</span>`;
    const a = Number(d['TENOR_MIN_' + j]), b = Number(d['TENOR_MAX_' + j]);
    return `<i class="bi bi-check-circle text-primary"></i> Pemohon dapat memilih <b>${b - a + 1} pilihan</b> tenor: <b>${a} sampai ${b} bulan</b>.`;
  },
  tenorPrev(j) { const el = document.getElementById('tnPrev_' + j); if (el) el.innerHTML = Pages.pengaturan.tenorText(j); },
  body() {
    const s = st('pengaturan'), F = Pages.pengaturan.fld, box = document.getElementById('setBody'); if (!box) return;
    if (s.tab === 'pembiayaan') box.innerHTML = `<div class="card-k mb-3"><div class="card-head"><div><h3><i class="bi bi-cash-coin"></i> 1. Pembiayaan Uang Kas (Qardh / Multiguna)</h3><p>Margin baku, plafon & tenor</p></div>${badge('PRD 4.2', 'b-gray')}</div>
        <div class="form-grid cols-2">${F('BUNGA_BULAN_UANG', 'Bunga pinjaman uang per bulan', 'pct', 'Total bunga = (pokok pinjaman × persen ini) × lama angsuran (bulan). Bawaan 1%.')}${F('PLAFON_UANG', 'Plafon maksimal per pengajuan', 'money')}</div><div class="label mt-3 mb-2">Tenor yang diizinkan</div>${Pages.pengaturan.tenorBox('UANG')}</div>
      <div class="card-k mb-3"><div class="card-head"><div><h3><i class="bi bi-box-seam"></i> 2. Pembiayaan Pengadaan Barang (Murabahah)</h3><p>Margin toko & tenor</p></div>${badge("Murabahah Ri'ayah", 'b-gold')}</div>
        <div class="form-grid cols-2">${F('BUNGA_BULAN_BARANG', 'Margin pinjaman barang per bulan', 'pct', 'Total margin = (harga barang × persen ini) × lama angsuran (bulan). Bawaan 2%.')}${F('TGL_POTONG_GAJI', 'Tanggal potong gaji (angsuran)', 'number', 'Angsuran pinjaman uang & barang dipotong gaji setiap tanggal ini (1–28)')}</div>${F('POTONG_OTOMATIS', 'Potong gaji otomatis setiap tanggal ' + tglPotong(), 'switch', 'Pukul 06.00 cicilan bulan berjalan dicatat terbayar (metode potong gaji): kwitansi terbit, sisa tagihan berkurang, email ke anggota. Tunggakan bulan sebelumnya tidak ikut.')}<div class="label mt-3 mb-2">Tenor yang diizinkan</div>${Pages.pengaturan.tenorBox('BARANG')}
        ${F('TGL_MULAI_PINJAMAN', 'Tanggal paling awal data pinjaman', 'date', 'Tanggal pengajuan/akad/pencairan pinjaman uang & barang boleh diisi mulai tanggal ini (untuk memasukkan data pinjaman lama). Bawaan 1 Januari 2025.')}
        ${F('SATU_PINJAMAN_AKTIF', 'Batasi satu pinjaman sejenis yang aktif', 'switch', 'Anggota tidak boleh mengajukan jenis yang sama selama masih berjalan')}${F('DISKON_PELUNASAN', 'Diskon margin pada pelunasan dipercepat', 'switch', 'Bunga cicilan yang belum jatuh tempo dibebaskan (ibra\')')}</div>
      <div class="card-k"><div class="card-head"><div><h3><i class="bi bi-hourglass"></i> Aturan Sanksi Ta'zir (Infaq Keterlambatan)</h3><p>Nonaktif secara bawaan sesuai prinsip syariah</p></div></div>
        ${F('DENDA_AKTIF', 'Aktifkan denda keterlambatan', 'switch', 'Bila aktif, denda dihitung per minggu setelah masa tenggang')}<div class="form-grid cols-2 mt-3">${F('DENDA_NOMINAL', 'Nominal denda per minggu', 'money')}${F('DENDA_TENGGANG', 'Masa tenggang (hari)', 'number')}</div></div>`;
    else if (s.tab === 'simpanan') box.innerHTML = `<div class="card-k"><div class="card-head"><div><h3><i class="bi bi-piggy-bank"></i> Pengaturan Simpanan Pokok & Wajib</h3><p>Ketetapan iuran & setoran awal sesuai AD/ART</p></div>${badge('AD/ART Pasal 8', 'b-gray')}</div>
      <div class="form-grid cols-2">${F('SIMPANAN_POKOK', 'Simpanan pokok (1× pendaftaran)', 'money', 'Terkunci oleh ketetapan Rapat Anggota Tahunan')}${F('SIMPANAN_WAJIB', 'Simpanan wajib per bulan', 'money', 'Diproses via potong payroll')}${F('MODAL_AWAL', 'Saldo kas awal / cadangan modal', 'money', 'Dasar perhitungan Kas & Ekuitas di Neraca')}</div>
      <div class="mt-3">${F('WAJIB_OTOMATIS', 'Simpanan wajib otomatis setiap tanggal ' + tglPotong(), 'switch', 'Setiap tanggal ' + tglPotong() + ' pukul 06.00, simpanan wajib dicatat (potong gaji) untuk setiap anggota aktif, dihitung mulai bulan bergabung. Bulan yang sudah ada setoran wajibnya dilewati.')}</div>
      <div class="form-grid cols-2 mt-2">${F('WAJIB_OTOMATIS_MULAI', 'Catat otomatis tidak sebelum tanggal', 'date', 'Bulan sebelum tanggal ini tidak dicatat otomatis (untuk anggota lama yang saldonya sudah dimasukkan manual). Bawaan 1 Januari 2025.')}</div></div>`;
    else if (s.tab === 'nomor') { box.innerHTML = `<div class="card-k"><div class="card-head"><div><h3><i class="bi bi-hash"></i> Format Penomoran Dokumen</h3><p>Token: {YYYY} tahun, {YY}, {MM} bulan, {NNN} penghitung (jumlah N = digit)</p></div></div><div id="fmtList" class="stack"></div></div>`; Pages.pengaturan.fmtPreview(); }
    else if (s.tab === 'identitas') box.innerHTML = `<div class="card-k mb-3" id="logoCard"><div class="card-head"><div><h3><i class="bi bi-image"></i> Logo Koperasi</h3><p>Tampil di halaman masuk, menu aplikasi, ikon tab browser, dan KOP semua dokumen PDF</p></div><span id="logoBadge">${Logo.url() ? badge('Logo unggahan', 'b-green') : badge('Logo bawaan', 'b-gray')}</span></div>
        <div class="logo-up"><div class="logo-prev" id="logoPrev">${Logo.html(96)}</div><div class="logo-up-body">
          <div class="small">Unggah gambar logo resmi koperasi. Gambar <b>otomatis diperkecil</b> menjadi maks. 256 piksel sebelum dikirim.</div>
          <div class="xs muted mt-1">PNG, JPG, WebP, atau SVG • maks. 5 MB • PNG berlatar transparan paling rapi (juga di mode gelap).</div>
          <div class="row-gap mt-2"><button type="button" class="btn btn-sm btn-primary" id="btnLogoUp" onclick="document.getElementById('logoFile').click()"><i class="bi bi-upload"></i> Unggah Logo</button><input type="file" id="logoFile" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onchange="Pages.pengaturan.logoPilih(this)">
            <button type="button" class="btn btn-sm btn-outline" id="btnLogoHapus" onclick="Pages.pengaturan.logoHapus()" ${Logo.url() ? '' : 'disabled'}><i class="bi bi-arrow-counterclockwise"></i> Gunakan logo bawaan</button></div>
        </div></div></div>
      <div class="card-k mb-3"><div class="card-head"><h3><i class="bi bi-building"></i> Identitas Lembaga (KOP Surat)</h3></div><div class="form-grid cols-2">${F('NAMA_KOPERASI', 'Nama resmi koperasi', 'text', '', 'full')}${F('NAMA_APLIKASI', 'Nama aplikasi')}${F('SEKOLAH', 'Sekolah / unit')}${F('ALAMAT', 'Alamat', 'text', '', 'full')}${F('TELEPON', 'Telepon')}${F('EMAIL_KOPERASI', 'Email koperasi')}${F('BADAN_HUKUM', 'No. badan hukum')}</div></div>
      <div class="card-k mb-3"><div class="card-head"><h3><i class="bi bi-pen"></i> Penandatangan Dokumen</h3></div><div class="form-grid cols-3">${F('KETUA', 'Ketua koperasi')}${F('BENDAHARA', 'Bendahara')}${F('PENGAWAS', 'Pengawas / DPS')}</div></div>
      <div class="card-k"><div class="card-head"><h3><i class="bi bi-envelope"></i> Notifikasi & Tampilan Login</h3></div>${F('EMAIL_BENDAHARA', 'Email bendahara (ringkasan tunggakan)')}${F('NOTIF_EMAIL', 'Kirim email pengingat & notifikasi', 'switch', 'Pengingat H-3 & H-0, persetujuan pinjaman, ringkasan tunggakan')}${F('MODE_DEMO', 'Tampilkan akun uji coba di halaman login', 'switch', '<b class="text-danger">Matikan sebelum dipakai resmi</b>')}</div>`;
    else if (s.tab === 'pengguna') box.innerHTML = `<div class="card-k flush"><div class="card-head card-pad-x pt-3 mb-2"><div><h3><i class="bi bi-people"></i> Pengguna & Hak Akses (RBAC)</h3><p>Hak akses diberlakukan di server pada setiap aksi</p></div><button class="btn btn-sm btn-primary" onclick="Pages.pengaturan.user()"><i class="bi bi-person-plus"></i> Tambah</button></div>
      ${Tbl.html({ id: 'users', rows: S.db.pengguna.slice().sort((a, b) => ['admin', 'bendahara', 'pengawas', 'anggota'].indexOf(a.Peran) - ['admin', 'bendahara', 'pengawas', 'anggota'].indexOf(b.Peran)), unit: 'pengguna',
        cols: [{ h: 'Pengguna', main: true, v: u => `<div class="person">${avatar(u.Nama || u.Username)}<div><div class="cell-main">${esc(u.Nama)}</div><div class="cell-sub mono">${esc(u.Username)}${u.ID_Anggota ? ' · ' + esc(u.ID_Anggota) : ''}</div></div></div>` },
          { h: 'Peran', v: u => badge(ROLE_LABEL[u.Peran] || u.Peran, { admin: 'b-red', bendahara: 'b-green', pengawas: 'b-blue', anggota: 'b-gray' }[u.Peran]) }, { h: 'Status', v: u => badge(cap(u.Status), u.Status === 'aktif' ? 'b-success' : 'b-gray') + (String(u.Wajib_Ganti_Sandi) === 'ya' ? ' ' + badge('Wajib ganti sandi', 'b-amber') : '') },
          { h: 'Login terakhir', v: u => u.Login_Terakhir ? fmtDateTime(u.Login_Terakhir) : '<span class="muted">belum pernah</span>' },
          { h: '', label: 'Aksi', cls: 'num nowrap', v: u => u._pending ? '<span class="spinner"></span>' : `<button class="btn btn-sm btn-ghost" ${on('Pages.pengaturan.user', u.Username)} aria-label="Ubah"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-ghost" ${on('Pages.pengaturan.reset', u.Username)} aria-label="Reset sandi"><i class="bi bi-key"></i></button>` }] })}</div>
      <div class="card-k mt-3"><div class="card-head"><h3><i class="bi bi-grid-3x3"></i> Matriks Hak Akses</h3></div><div class="table-wrap"><table class="tbl"><thead><tr><th>Fitur</th><th class="ctr">Admin</th><th class="ctr">Bendahara</th><th class="ctr">Pengawas</th><th class="ctr">Anggota</th></tr></thead><tbody>
        ${[['Kelola pengguna & pengaturan', 1, 0, 0, 0], ['Data anggota (tambah/ubah)', 1, 1, 'v', 0], ['Input simpanan & angsuran', 1, 1, 'v', 0], ['Persetujuan pinjaman', 1, 1, 'v', '+'], ['Stok barang & biaya', 1, 1, 'v', 0], ['Laporan keuangan', 1, 1, 'v', 0], ['Log aktivitas', 1, 0, 'v', 0], ['Data pribadi', 'semua', 'semua', 'semua', 'miliknya']].map(r => `<tr><td>${r[0]}</td>${r.slice(1).map(v => `<td class="ctr">${v === 1 ? '<i class="bi bi-check-circle-fill text-success"></i>' : v === 0 ? '<i class="bi bi-x-circle text-muted"></i>' : v === 'v' ? '<i class="bi bi-eye text-primary" title="hanya lihat"></i>' : v === '+' ? badge('ajukan', 'b-gold') : '<span class="xs">' + v + '</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    else if (s.tab === 'sistem') { box.innerHTML = `<div class="card-k"><div class="card-head"><h3><i class="bi bi-hdd-network"></i> Status Integrasi Sistem</h3><button class="btn btn-sm btn-outline" onclick="Pages.pengaturan.status()"><i class="bi bi-arrow-repeat"></i> Periksa</button></div><div id="sysStatus"><div class="text-center p-3 muted"><span class="spinner"></span> Memeriksa koneksi…</div></div></div>
      <div class="grid g-2 mt-3"><button class="btn btn-outline" onclick="Pages.pengaturan.sys('sistem.trigger')"><i class="bi bi-alarm"></i> Pasang Trigger Otomatis</button><button class="btn btn-outline" onclick="Pages.pengaturan.sys('sistem.cadangan')"><i class="bi bi-cloud-arrow-up"></i> Cadangkan Data Sekarang</button></div>
      <div class="info-box mt-3"><i class="bi bi-info-circle"></i><div class="small">Trigger harian (06.00 WIB) mengirim pengingat H-3/H-0 & ringkasan tunggakan; trigger mingguan (Minggu 01.00) mencadangkan spreadsheet ke folder <b>04 Cadangan Data</b> (8 versi terakhir).</div></div>`; Pages.pengaturan.status(); }
  },
  fmtPreview() {
    const box = document.getElementById('fmtList'); if (!box) return;
    const d = Pages.pengaturan.draft, t = T();
    const ex = f => String(f || '').replace('{YYYY}', t.slice(0, 4)).replace('{YY}', t.slice(2, 4)).replace('{MM}', t.slice(5, 7)).replace(/\{(N+)\}/, (m, n) => '0'.repeat(n.length - 1) + '1');
    const items = [['FMT_ANGGOTA', 'ID Kartu Anggota (KTA)'], ['FMT_PENGAJUAN_UANG', 'Pengajuan pinjaman uang'], ['FMT_PENGAJUAN_BARANG', 'Pengajuan pinjaman barang'], ['FMT_AKAD_UANG', 'Surat Perjanjian Uang (SP-U)'], ['FMT_AKAD_BARANG', 'Surat Perjanjian Barang (SP-B)'], ['FMT_BUKTI_SIMPANAN', 'Bukti setoran simpanan'], ['FMT_KWITANSI', 'Kwitansi angsuran'], ['FMT_BARANG', 'Kode SKU barang']];
    if (!box.children.length) box.innerHTML = items.map(i => `<div class="grid g-2" style="align-items:end"><div class="fg"><label>${i[1]}</label><input class="inp mono" value="${esc(d[i[0]])}" oninput="Pages.pengaturan.set('${i[0]}',this.value)"></div><div class="stat-mini"><span>Pratinjau</span><b class="mono text-primary" data-fmt="${i[0]}"></b></div></div>`).join('');
    items.forEach(i => { const el = box.querySelector(`[data-fmt="${i[0]}"]`); if (el) { const ok = /\{N+\}/.test(d[i[0]]); el.textContent = ok ? ex(d[i[0]]) : 'wajib memuat {NNN}'; el.className = 'mono ' + (ok ? 'text-primary' : 'text-danger'); } });
  },
  side() {
    const box = document.getElementById('setSide'); if (!box) return;
    const s = st('pengaturan'), d = Pages.pengaturan.draft;
    const rg = Calc.tenorRange(s.simJenis, d);
    s.simTenor = Math.min(rg.max, Math.max(rg.min, num(s.simTenor) || 10));
    const persen = Calc.rate(s.simJenis, d), h = Calc.pinjaman(s.simPokok, persen, s.simTenor);
    box.innerHTML = `<div class="card-k"><div class="card-head"><h3><i class="bi bi-calculator"></i> Simulator Hitung Akad</h3>${badge('Live', 'b-green')}</div>
      <div class="seg mb-3" style="width:100%;display:grid;grid-template-columns:1fr 1fr"><button class="${s.simJenis === 'uang' ? 'on' : ''}" onclick="st('pengaturan').simJenis='uang';Pages.pengaturan.side()">Uang (${fmtPct(Calc.rate('uang', d))}%/bln)</button><button class="${s.simJenis === 'barang' ? 'on' : ''}" onclick="st('pengaturan').simJenis='barang';Pages.pengaturan.side()">Barang (${fmtPct(Calc.rate('barang', d))}%/bln)</button></div>
      <div class="fg"><label>Nominal pengajuan</label><div class="inp-group"><span class="addon rp">Rp</span><input class="inp money-inp" data-money value="${fmtNum(s.simPokok)}" onchange="st('pengaturan').simPokok=parseRp(this.value);Pages.pengaturan.side()"></div></div>
      <div class="fg mt-2"><label><span>Jangka waktu</span><b class="text-primary">${s.simTenor} bulan</b></label><input type="range" min="${rg.min}" max="${rg.max}" value="${s.simTenor}" style="accent-color:var(--primary)" oninput="st('pengaturan').simTenor=+this.value;Pages.pengaturan.side()" aria-label="Tenor"><div class="row-between xs muted"><span>${rg.min} bln</span><span>${rg.max} bln</span></div></div>
      <div class="hero khatam-bg mt-3" style="padding:16px"><span class="khatam-star"></span><span class="eyebrow">Total angsuran bulanan</span><div class="hero-amount">${rp(h.angsuran)}<span style="font-size:13px;font-weight:500"> /bln</span></div><div class="hero-split"><div><span>Pokok/bln</span><b>${fmtJt(h.pokokBulan)}</b></div><div><span>Margin/bln</span><b>${fmtJt(h.bungaBulan)}</b></div><div><span>Total</span><b>${fmtJt(h.total)}</b></div></div></div>
      <div class="xs muted mt-2"><b>Formula:</b> Total bunga = (Pokok × % per bulan) × lama angsuran; Angsuran = (Pokok + Total bunga) ÷ lama angsuran, flat tiap bulan. Tidak ada bunga berbunga.</div></div>
      <div class="card-k"><div class="card-head"><h3><i class="bi bi-pen"></i> KOP & Penandatangan</h3></div><div class="small"><b>${esc(d.NAMA_KOPERASI)}</b><div class="muted">${esc(d.SEKOLAH)} • Badan Hukum ${esc(d.BADAN_HUKUM)}</div></div><div class="list mt-2">${[['Ketua', d.KETUA], ['Bendahara', d.BENDAHARA], ['Pengawas / DPS', d.PENGAWAS]].map((x, i) => `<div class="list-item"><span class="li-icon">${i + 1}</span><div class="li-body"><b>${esc(x[1])}</b><span>${x[0]}</span></div><i class="bi bi-patch-check text-primary"></i></div>`).join('')}</div></div>`;
  },
  // ── Logo koperasi ──
  /** Pilih gambar → perkecil di browser (maks. 256 px) → tampil seketika → unggah di latar. */
  logoPilih(inp) {
    const f = inp.files && inp.files[0]; inp.value = '';
    if (!f) return;
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(f.type)) { toast('Pilih berkas gambar PNG, JPG, WebP, atau SVG.', 'warning', 'Format tidak didukung'); return; }
    if (f.size > 5 * 1024 * 1024) { toast('Ukuran gambar maksimal 5 MB.', 'warning', 'Berkas terlalu besar'); return; }
    Pages.pengaturan.logoKecilkan(f).then(img => {
      Pages.pengaturan.logoKirim({ base64: img.dataUrl.split(',')[1], mimeType: img.mime }, img.dataUrl);
    }).catch(e => toast(e.message || 'Gambar tidak dapat dibaca.', 'danger', 'Logo gagal diproses'));
  },
  logoKecilkan(file) {
    return new Promise((resolve, reject) => {
      const rd = new FileReader();
      rd.onerror = () => reject(new Error('Berkas tidak dapat dibaca.'));
      rd.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Berkas bukan gambar yang valid.'));
        img.onload = () => {
          let w = img.naturalWidth || 256, h = img.naturalHeight || 256;
          const k = Math.min(1, 256 / Math.max(w, h));
          w = Math.max(1, Math.round(w * k)); h = Math.max(1, Math.round(h * k));
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, w, h);
          let mime = 'image/png', url = c.toDataURL(mime);
          if (url.length > 120000) { const wp = c.toDataURL('image/webp', 0.9); if (wp.indexOf('data:image/webp') === 0 && wp.length < url.length) { mime = 'image/webp'; url = wp; } }
          if (url.length > 600000) { reject(new Error('Gambar terlalu besar/rumit untuk dijadikan logo. Coba gambar lain.')); return; }
          resolve({ dataUrl: url, mime: mime });
        };
        img.src = rd.result;
      };
      rd.readAsDataURL(file);
    });
  },
  /** Kirim ke server; tampilan langsung berganti dan dikembalikan bila server menolak. */
  logoKirim(payload, preview) {
    const lama = Logo.url();
    Logo.set(preview); Pages.pengaturan.logoPrev(true);
    Sync.push({ action: 'pengaturan.logo', payload, label: 'Logo',
      ok: res => {
        const ex = (res.data && res.data.extra) || {};
        if (ex.settings) {
          S.settings = Object.assign({}, S.settings, ex.settings); Store.saveData();
          const dr = Pages.pengaturan.draft; if (dr) { dr.LOGO_FILE_ID = ex.settings.LOGO_FILE_ID; dr.LOGO_URL = ex.settings.LOGO_URL; }
        }
        Logo.set(ex.logo || '', ex.settings ? ex.settings.LOGO_FILE_ID : undefined); Pages.pengaturan.logoPrev(false);
        toast(res.message, 'success', 'Logo disimpan');
      },
      fail: msg => { Logo.set(lama); Pages.pengaturan.logoPrev(false); toast(msg, 'danger', 'Logo tidak tersimpan'); } });
  },
  logoHapus() {
    confirmDialog({ title: 'Gunakan logo bawaan?', text: 'Logo unggahan dipindah ke Sampah Google Drive dan diganti logo khatam bawaan aplikasi.', ok: 'Ya, gunakan bawaan' })
      .then(yes => { if (yes) Pages.pengaturan.logoKirim({ hapus: true }, ''); });
  },
  logoPrev(busy) {
    const p = document.getElementById('logoPrev'); if (p) { p.innerHTML = Logo.html(96) + (busy ? '<span class="logo-busy"><span class="spinner"></span></span>' : ''); p.classList.toggle('busy', !!busy); }
    const h = document.getElementById('btnLogoHapus'); if (h) h.disabled = !!busy || !Logo.url();
    const u = document.getElementById('btnLogoUp'); if (u) u.disabled = !!busy;
    const b = document.getElementById('logoBadge'); if (b) b.innerHTML = Logo.url() ? badge('Logo unggahan', 'b-green') : badge('Logo bawaan', 'b-gray');
  },
  save() {
    const d = Pages.pengaturan.draft, changes = {};
    Object.keys(d).forEach(k => { if (k !== 'LOGO_FILE_ID' && String(d[k]) !== String(S.settings[k])) changes[k] = String(d[k]); });
    if (!Object.keys(changes).length) return;
    const bad = Object.keys(changes).find(k => k.startsWith('FMT_') && !/\{N+\}/.test(changes[k]));
    if (bad) return toast('Format ' + bad + ' wajib memuat penghitung {NNN}.', 'warning');
    for (const j of ['UANG', 'BARANG']) {
      const e = Pages.pengaturan.tenorErr(j);
      if (e && (changes['TENOR_MIN_' + j] !== undefined || changes['TENOR_MAX_' + j] !== undefined)) return toast(e + ' (pinjaman ' + j.toLowerCase() + ')', 'warning', 'Tenor belum valid');
    }
    const old = Object.assign({}, S.settings);
    S.settings = Object.assign({}, S.settings, d); Pages.pengaturan.draft = null;
    Store.saveData(); Router.render(); Nav.build();
    Sync.push({ action: 'pengaturan.simpan', payload: { values: changes }, label: 'Pengaturan',
      ok: res => { toast(res.message, 'success', 'Pengaturan disimpan'); },
      fail: msg => { S.settings = old; Store.saveData(); Router.render(); toast(msg, 'danger', 'Pengaturan dibatalkan'); } });
  },
  user(username) {
    const u = username ? S.db.pengguna.find(x => x.Username === username) : null;
    Modal.open({ title: u ? 'Ubah Pengguna ' + u.Username : 'Tambah Pengguna', icon: 'bi-person-gear', body: `<form id="fUser" class="form-grid cols-2" novalidate>
      <div class="fg"><label>Username <span class="req">*</span></label><input class="inp mono" name="Username" required pattern="[A-Za-z0-9._\\-]{3,40}" value="${esc(u ? u.Username : '')}" ${u ? 'readonly' : ''} data-msg="3–40 karakter: huruf, angka, titik, minus"></div>
      <div class="fg"><label>Peran <span class="req">*</span></label><select class="inp" name="Peran" onchange="document.getElementById('fuAng').hidden=this.value!=='anggota'">${optList([['bendahara', 'Bendahara'], ['pengawas', 'Pengawas (hanya lihat)'], ['admin', 'Administrator'], ['anggota', 'Anggota']], u ? u.Peran : 'bendahara')}</select></div>
      <div class="fg full" id="fuAng" ${u && u.Peran === 'anggota' ? '' : 'hidden'}><label>Tautkan ke anggota</label>${anggotaPicker('fuIdAng', u ? u.ID_Anggota : '', { all: true })}</div>
      <div class="fg"><label>Nama tampilan</label><input class="inp" name="Nama" value="${esc(u ? u.Nama : '')}"></div><div class="fg"><label>Email</label><input class="inp" type="email" name="Email" value="${esc(u ? u.Email : '')}"></div>
      ${u ? `<div class="fg"><label>Status</label><select class="inp" name="Status">${optList([['aktif', 'Aktif'], ['nonaktif', 'Nonaktif']], u.Status)}</select></div>` : `<div class="fg full"><label>Sandi awal</label><input class="inp" type="text" name="sandi" placeholder="kosongkan = dibuat acak oleh sistem" autocomplete="new-password"><span class="hint">Minimal 8 karakter, huruf & angka. Pengguna wajib menggantinya saat masuk pertama.</span></div>`}</form>`,
      foot: `<button class="btn btn-outline" data-bs-dismiss="modal">Batal</button><button class="btn btn-primary" id="btnUser" onclick="Pages.pengaturan.saveUser(${u ? 'false' : 'true'})"><i class="bi bi-check2-circle"></i> Simpan</button>` });
  },
  saveUser(isNew) {
    const f = document.getElementById('fUser');
    const data = Form.check(f, { sandi: v => v && !(v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v)) ? 'Minimal 8 karakter dengan huruf & angka' : '' });
    if (!data) return;
    const rec = { Username: data.Username, Peran: data.Peran, Nama: data.Nama, Email: data.Email, Status: data.Status || 'aktif', ID_Anggota: data.Peran === 'anggota' ? pickId(data.fuIdAng) : '' };
    if (rec.Peran === 'anggota' && !rec.ID_Anggota) return toast('Pilih anggota yang ditautkan.', 'warning');
    if (isNew && S.db.pengguna.find(u => u.Username.toLowerCase() === rec.Username.toLowerCase())) return toast('Username sudah digunakan.', 'warning');
    commit({ action: 'pengguna.simpan', payload: { record: rec, sandi: data.sandi || '', isNew }, tables: ['pengguna'], quiet: true,
      apply: () => { const i = S.db.pengguna.findIndex(u => u.Username === rec.Username); if (i >= 0) S.db.pengguna[i] = Object.assign({}, S.db.pengguna[i], rec); else S.db.pengguna.push(Object.assign({ _pending: true, Wajib_Ganti_Sandi: 'ya' }, rec)); },
      ok: res => { toast(res.message, 'success'); if (res.data.extra && res.data.extra.akun) showCredential(res.data.extra.akun, 'Akun Pengguna Baru'); } });
    Modal.close();
  },
  reset(username) {
    confirmDialog({ title: 'Atur ulang sandi ' + username + '?', text: 'Sandi baru acak akan dibuat dan ditampilkan sekali. Pengguna wajib menggantinya saat masuk.', ok: 'Atur ulang sandi', icon: 'bi-key' }).then(ok => {
      if (!ok) return;
      callApi('pengguna.reset', { Username: username, reqId: uid() }).then(r => { if (r.success) { applyPatch(r.data); showCredential(r.data.extra.akun, 'Sandi Baru ' + username); } else toast(r.message, 'danger'); }).catch(e => toast(e.message || String(e), 'danger'));
    });
  },
  status() {
    callApi('sistem.status').then(r => {
      const box = document.getElementById('sysStatus'); if (!box) return;
      if (!r.success) { box.innerHTML = `<div class="info-box danger"><i class="bi bi-x-octagon"></i><div>${esc(r.message)}</div></div>`; return; }
      const d = r.data, trig = d.triggers || [];
      box.innerHTML = `<div class="list">${[['bi-table', 'Google Sheet Database', 'Terkoneksi', d.spreadsheetUrl], ['bi-folder2-open', 'Drive Folder Induk', 'Terkoneksi', d.folderUrl], ['bi-alarm', 'Trigger otomatis', trig.length ? trig.join(', ') : 'Belum dipasang', ''], ['bi-envelope', 'Kuota email harian', d.emailQuota === null ? 'Belum diizinkan' : d.emailQuota + ' tersisa', ''], ['bi-code-slash', 'Versi aplikasi', 'v' + d.version + ' · data ' + d.dataVersion, '']]
        .map(x => `<div class="list-item"><span class="li-icon"><i class="bi ${x[0]}"></i></span><div class="li-body"><b>${x[1]}</b><span>${esc(x[2])}</span></div>${x[3] ? `<a class="btn btn-sm btn-ghost" href="${esc(x[3])}" target="_blank" rel="noopener">Buka <i class="bi bi-box-arrow-up-right"></i></a>` : badge(x[2] === 'Belum dipasang' || x[2] === 'Belum diizinkan' ? 'Perlu tindakan' : 'OK', x[2] === 'Belum dipasang' || x[2] === 'Belum diizinkan' ? 'b-amber' : 'b-success')}</div>`).join('')}</div>`;
    }).catch(e => { const box = document.getElementById('sysStatus'); if (box) box.innerHTML = `<div class="info-box danger"><i class="bi bi-wifi-off"></i><div>${esc(e.message || e)}</div></div>`; });
  },
  sys(action) { toast('Memproses…', 'info'); callApi(action).then(r => { toast(r.message, r.success ? 'success' : 'danger'); Pages.pengaturan.status(); }).catch(e => toast(e.message || String(e), 'danger')); }
};

// ════════════════════════════════════════════════════════
// HALAMAN: LOG AKTIVITAS (Admin & Pengawas)
// ════════════════════════════════════════════════════════
Pages.log = {
  title: 'Log Aktivitas', roles: ['admin', 'pengawas'],
  render(el) {
    const s = st('log', { user: 'semua', aksi: 'semua', q: '' });
    const L = S.db.log, users = Array.from(new Set(L.map(l => l.Username))), aksi = Array.from(new Set(L.map(l => String(l.Aksi).split('_')[0])));
    el.innerHTML = pageHead({ crumbs: [['Dashboard', 'dashboard'], ['Log Aktivitas']], title: 'Log Aktivitas & Jejak Audit', desc: 'Setiap transaksi tercatat: siapa, kapan, dan apa. Menampilkan ' + L.length + ' aktivitas terakhir.',
      actions: `<button class="btn btn-outline" onclick="Sync.pull(true).then(()=>toast('Log diperbarui.','success'))"><i class="bi bi-arrow-repeat"></i> Muat Ulang</button><button class="btn btn-outline" onclick="Pages.log.excel()"><i class="bi bi-file-earmark-excel"></i> Ekspor</button>` }) + `
      <div class="card-k flush"><div class="p-3 toolbar"><div class="inp-group grow"><span class="addon"><i class="bi bi-search"></i></span><input class="inp" type="search" value="${esc(s.q)}" placeholder="Cari detail aktivitas…" oninput="Pages.log.q(this.value)" aria-label="Cari"></div>
        <select class="inp" style="width:auto" onchange="st('log').user=this.value;Pages.log.list()" aria-label="Pengguna">${optList([['semua', 'Semua pengguna']].concat(users), s.user)}</select>
        <select class="inp" style="width:auto" onchange="st('log').aksi=this.value;Pages.log.list()" aria-label="Aksi">${optList([['semua', 'Semua aksi']].concat(aksi), s.aksi)}</select></div><div id="logList"></div></div>`;
    Pages.log.list();
  },
  q: debounce(v => { st('log').q = v; Tbl.reset('log'); Pages.log.list(); }, 200),
  rows() { const s = st('log'), q = s.q.toLowerCase(); return S.db.log.filter(l => (s.user === 'semua' || l.Username === s.user) && (s.aksi === 'semua' || String(l.Aksi).startsWith(s.aksi)) && (!q || String(l.Detail).toLowerCase().includes(q) || String(l.Aksi).toLowerCase().includes(q))); },
  list() {
    const box = document.getElementById('logList'); if (!box) return;
    const tone = a => /TOLAK|BATAL|HAPUS|RESET/.test(a) ? 'b-red' : /LOGIN|LOGOUT/.test(a) ? 'b-gray' : /PENGATURAN|PENGGUNA|SETUP/.test(a) ? 'b-gold' : /BAYAR|SETOR|CAIR/.test(a) ? 'b-success' : 'b-blue';
    box.innerHTML = Tbl.html({ id: 'log', rows: Pages.log.rows(), unit: 'aktivitas', per: 25, emptyIcon: 'bi-clock-history',
      cols: [{ h: 'Waktu', v: l => `<span class="nowrap">${fmtDateTime(l.Waktu)}</span>` }, { h: 'Pengguna', v: l => `<div class="cell-main">${esc(l.Username)}</div><div class="cell-sub">${esc(ROLE_LABEL[l.Peran] || l.Peran)}</div>` },
        { h: 'Aksi', v: l => badge(String(l.Aksi).replace(/_/g, ' '), tone(String(l.Aksi))) }, { h: 'Detail', main: true, v: l => `<span style="word-break:break-word">${esc(l.Detail)}</span>` }] });
  },
  excel() { Docs.excel('Log_Aktivitas_' + T(), [{ name: 'Log', rows: Pages.log.rows().map(l => ({ Waktu: l.Waktu, Username: l.Username, Peran: l.Peran, Aksi: l.Aksi, Detail: l.Detail })) }]); }
};


// ════════════════════════════════════════════════════════
// HALAMAN ANGGOTA: BERANDA
// ════════════════════════════════════════════════════════
const me = () => D.anggota[S.user && S.user.idAnggota] || { ID_Anggota: S.user ? S.user.idAnggota : '', Nama: S.user ? S.user.nama : '', Status: 'aktif' };
const sapaan = n => { const first = String(n || '').replace(/^(Dra?s?\.|Hj?\.|H\.)\s*/i, '').split(/[\s,]/)[0]; return (/^(Sri|Siti|Dewi|Laila|Nur|Hj)/i.test(n) ? 'Bu ' : 'Pak ') + first; };
Pages['m-beranda'] = {
  title: 'Beranda', roles: ['anggota'],
  render(el) {
    const a = me(), s = D.saldo[a.ID_Anggota] || { pokok: 0, wajib: 0, sukarela: 0, total: 0 }, mk = monthKey(T());
    const loans = (D.loansByAng[a.ID_Anggota] || []);
    const aktif = loans.filter(l => l.Status === 'berjalan').sort((x, y) => String(x.Tgl_Cair).localeCompare(String(y.Tgl_Cair)));
    const main = aktif[0], cur = main ? nextRow(main) : null;
    const setorM = sum(S.db.simpanan.filter(x => x.ID_Anggota === a.ID_Anggota && x.Tipe === 'setor' && x.Status !== 'batal' && monthKey(x.Tanggal) === mk), 'Jumlah');
    const tagihanM = sum(D.dueMonth.filter(d => d.loan.ID_Anggota === a.ID_Anggota), 'sisa') + sum(D.overdue.filter(d => d.loan.ID_Anggota === a.ID_Anggota && monthKey(d.row.Jatuh_Tempo) !== mk), 'sisa');
    const up = D.upcoming.filter(u => u.loan.ID_Anggota === a.ID_Anggota)[0];
    const pend = loans.filter(l => ['diajukan', 'disetujui'].includes(l.Status));
    el.innerHTML = `
      <div class="row-between mb-3"><div><h1 class="font-head" style="font-size:22px">Assalamu'alaikum, ${esc(sapaan(a.Nama))} <i class="bi bi-patch-check text-primary" style="font-size:18px"></i></h1>
        <div class="row-gap mt-1">${badge(a.Status === 'aktif' ? 'Anggota Aktif' : 'Nonaktif', a.Status === 'aktif' ? 'b-green' : 'b-gray')}<span class="small muted">• ${esc(a.ID_Anggota)} • NIK ${esc(String(a.NIK_NIP || '').slice(0, 8))}…</span></div></div>
        <button class="icon-btn" style="background:var(--surface-2)" ${on('Nav.go', 'profil')} aria-label="Profil"><i class="bi bi-mortarboard"></i></button></div>
      <div class="grid g-12-lg">
      <div class="stack">
        <div class="hero khatam-bg"><span class="khatam-star"></span><div class="row-between"><span class="eyebrow"><i class="bi bi-wallet2"></i> Total Simpanan Anda</span><button class="eye-btn" onclick="UI.toggleAmounts()" aria-label="${S.hideAmounts ? 'Tampilkan' : 'Sembunyikan'} nominal"><i class="bi ${S.hideAmounts ? 'bi-eye-slash' : 'bi-eye'}"></i></button></div>
          <div class="hero-amount">${rp(s.total, true)}</div><div class="small gold-text">Setoran bulan ini: +${S.hideAmounts ? '•••' : fmtRp(setorM)} (${BLN[+mk.slice(5) - 1]})</div>
          <div class="hero-split"><div><span>Pokok (Kunci)</span><b>${S.hideAmounts ? '•••' : fmtRp(s.pokok)}</b></div><div><span>Wajib</span><b>${S.hideAmounts ? '•••' : fmtRp(s.wajib)}</b></div><div><span>Sukarela</span><b>${S.hideAmounts ? '•••' : fmtRp(s.sukarela)}</b></div></div></div>
        ${up && up.days <= 7 ? `<div class="reminder" role="button" ${on('Nav.go', 'pinjaman-detail', { id: up.loan.ID_Pinjaman })}><span class="r-ic"><i class="bi bi-bell"></i></span><div class="r-body"><b>Angsuran ke-${up.row.Cicilan_Ke} (${esc(up.loan.ID_Pinjaman)}) ${up.days < 0 ? 'Terlambat' : 'Segera Jatuh Tempo'}</b><span>${up.days < 0 ? 'Lewat ' + (-up.days) + ' hari' : up.days === 0 ? 'Jatuh tempo hari ini' : 'Jatuh tempo dalam ' + up.days + ' hari'} (${fmtDate(up.row.Jatuh_Tempo)}) · ${fmtRp(up.sisa)}</span></div><span class="btn btn-sm btn-outline" style="background:var(--surface)">Lihat <i class="bi bi-arrow-right"></i></span></div>` : ''}
        ${pend.length ? `<div class="info-box ok" role="button" ${on('Nav.go', 'pinjaman-detail', { id: pend[0].ID_Pinjaman })}><i class="bi bi-hourglass-split"></i><div>Pengajuan <b>${esc(pend[0].ID_Pinjaman.startsWith('tmp_') ? 'baru' : pend[0].ID_Pinjaman)}</b> ${fmtRp(pend[0].Pokok)} — ${pend[0].Status === 'diajukan' ? 'sedang ditinjau komite' : 'telah <b>disetujui</b>, menunggu pencairan'}.</div></div>` : ''}
        <div class="grid g-2">
          <div class="card-k hoverable" ${main ? on('Nav.go', 'pinjaman-detail', { id: main.ID_Pinjaman }) : on('Nav.go', 'm-ajukan')}><div class="row-between"><span class="small muted">Pinjaman Aktif</span><i class="bi bi-credit-card text-primary"></i></div>
            ${main ? `<div class="kpi-value mt-1" style="font-size:20px">${rp(main.Sisa_Tagihan, true)}</div><div class="xs muted">Sisa dari ${fmtRp(main.Total_Tagihan)}</div><div class="mt-2">${progress(pct(paidCount(main), main.Tenor))}</div><div class="row-between xs mt-1"><span class="muted">Cicilan ${paidCount(main)} / ${main.Tenor} bln</span><b class="text-primary">${pct(paidCount(main), main.Tenor)}%</b></div>`
              : `<div class="kpi-value mt-1" style="font-size:18px">Rp 0</div><div class="xs muted">Belum ada pinjaman berjalan</div><span class="btn btn-sm btn-soft mt-2">Ajukan sekarang</span>`}</div>
          <div class="card-k"><div class="row-between"><span class="small muted">Tagihan Bulan Ini</span><i class="bi bi-calendar2-check text-gold"></i></div><div class="kpi-value mt-1" style="font-size:20px">${rp(tagihanM, true)}</div>
            ${cur ? `<div class="mt-2">${badge(fmtDate(cur.Jatuh_Tempo).replace(/ \d{4}$/, '') + ' • Ke-' + cur.Cicilan_Ke, 'b-gold')}</div><div class="xs muted mt-2">Autodebet gaji sekolah</div>` : '<div class="xs muted mt-2">Tidak ada tagihan</div>'}</div>
        </div>
        <div><div class="row-between mb-2"><h3 class="font-head" style="font-size:17px">Layanan Cepat</h3><span class="xs fw-600 text-primary">Syariah Mandiri</span></div>
          <div class="quick-grid"><button class="quick" onclick="Pages.mBeranda.setor()"><span class="q-ic"><i class="bi bi-piggy-bank"></i></span>Setor Sukarela</button><button class="quick" ${on('Nav.go', 'm-pinjaman')}><span class="q-ic gold"><i class="bi bi-file-earmark-text"></i></span>Pinjaman Saya</button>
            <button class="quick" onclick="Pages.mBeranda.katalog()"><span class="q-ic blue"><i class="bi bi-shop"></i></span>Katalog Barang</button><button class="quick" ${on('Docs.kta', a.ID_Anggota)}><span class="q-ic"><i class="bi bi-person-vcard"></i></span>Cetak Kartu</button></div></div>
        <div class="card-k soft hoverable" onclick="Pages.mBeranda.katalog()"><div class="row-gap" style="flex-wrap:nowrap"><span class="kpi-icon gold" style="width:56px;height:56px;font-size:24px"><i class="bi bi-laptop"></i></span><div><div class="eyebrow">Pembiayaan Khusus Guru</div><b class="font-head">Laptop & Alat Pembelajaran ${fmtPct(Calc.rate('barang'))}%/bln</b><div class="small muted">Akad murabahah murni tanpa denda keterlambatan</div></div></div></div>
      </div>
      <div class="card-k"><div class="row-between mb-2"><h3 class="font-head" style="font-size:17px">Aktivitas Terakhir</h3><span class="small muted">${fmtMonth(monthKey(addMonths(T(), -1)))} – ${fmtMonth(mk)}</span></div>
        <div class="list">${Pages.mBeranda.feed(a.ID_Anggota).slice(0, 6).map(Pages.mBeranda.item).join('') || empty('bi-inbox', 'Belum ada aktivitas')}</div>
        <button class="btn btn-soft btn-block mt-2" ${on('Nav.go', 'm-transaksi')}>Lihat Semua Riwayat Transaksi <i class="bi bi-arrow-right"></i></button></div>
      </div>`;
  }
};
Pages.mBeranda = {
  /** Gabungan riwayat simpanan, angsuran, & pinjaman anggota (terbaru dulu). */
  feed(id) {
    const out = [];
    S.db.simpanan.filter(x => x.ID_Anggota === id).forEach(x => out.push({ t: x.Tanggal, k: 'simpanan', title: (x.Tipe === 'tarik' ? 'Penarikan ' : 'Setoran ') + 'Simpanan ' + cap(x.Jenis), sub: fmtDate(x.Tanggal) + ' • ' + cap(x.Metode || ''), amt: (x.Tipe === 'tarik' ? -1 : 1) * num(x.Jumlah), st: x.Status === 'batal' ? 'Batal' : x._pending ? 'Menyinkron' : 'Tercatat', ref: x.ID_Transaksi, icon: x.Tipe === 'tarik' ? 'bi-arrow-up-right' : 'bi-arrow-down-left', cls: x.Tipe === 'tarik' ? 'out' : '' }));
    S.db.pembayaran.filter(p => p.ID_Anggota === id).forEach(p => out.push({ t: p.Tanggal, k: 'angsuran', title: 'Angsuran ' + (D.loans[p.ID_Pinjaman] ? (D.loans[p.ID_Pinjaman].Jenis === 'barang' ? 'Barang ' : 'Uang ') : '') + '#' + p.Cicilan, sub: fmtDate(p.Tanggal) + ' • ' + (p.Metode === 'payroll' ? 'Potong Gaji' : cap(p.Metode)), amt: -num(p.Jumlah), st: 'Berhasil', ref: p.No_Bukti, icon: 'bi-arrow-up-right', cls: 'out' }));
    S.db.pinjaman.filter(l => l.ID_Anggota === id && l.Tgl_Cair).forEach(l => out.push({ t: l.Tgl_Cair, k: 'pinjaman', title: (l.Jenis === 'barang' ? 'Pembiayaan ' : 'Pencairan ') + loanLabel(l), sub: fmtDate(l.Tgl_Cair) + ' • ' + (l.Jenis === 'barang' ? 'Murabahah' : 'Qardh'), amt: num(l.Pokok), st: l.Status === 'lunas' ? 'LUNAS' : 'Berjalan', ref: l.ID_Pinjaman, icon: l.Jenis === 'barang' ? 'bi-laptop' : 'bi-cash-coin', cls: 'blue' }));
    return out.sort((a, b) => String(b.t).localeCompare(String(a.t)));
  },
  item(f) {
    const click = f.k === 'simpanan' ? on('Docs.bukti', f.ref) : f.k === 'angsuran' && !String(f.ref).startsWith('tmp_') ? on('Docs.kwitansi', f.ref) : f.k === 'pinjaman' ? on('Nav.go', 'pinjaman-detail', { id: f.ref }) : '';
    return `<div class="list-item" role="button" ${click}><span class="li-icon ${f.cls}"><i class="bi ${f.icon}"></i></span><div class="li-body"><b>${esc(f.title)}</b><span>${esc(f.sub)}</span></div><div class="li-end"><b class="${f.k === 'pinjaman' ? '' : f.amt < 0 ? 'amt-out' : 'amt-in'}">${f.k === 'pinjaman' ? fmtRp(f.amt) : (f.amt < 0 ? '-' : '+') + fmtRp(Math.abs(f.amt))}</b><span>${f.st === 'LUNAS' ? badge('LUNAS', 'b-success') : esc(f.st)}</span></div></div>`;
  },
  setor() {
    const st0 = S.settings;
    Modal.open({ title: 'Setor Simpanan Sukarela', icon: 'bi-piggy-bank', body: `<div class="stack"><div class="info-box ok"><i class="bi bi-info-circle"></i><div>Setoran sukarela (akad <b>wadiah</b>) dapat ditarik sewaktu-waktu. Lakukan setoran melalui salah satu cara berikut — bendahara akan mencatatnya dan bukti ber-QR otomatis muncul di aplikasi ini.</div></div>
      <div class="list"><div class="list-item"><span class="li-icon"><i class="bi bi-shop-window"></i></span><div class="li-body"><b>Tunai di loket koperasi</b><span>${esc(st0.ALAMAT || '')}</span></div></div>
      <div class="list-item"><span class="li-icon gold"><i class="bi bi-building"></i></span><div class="li-body"><b>Potong gaji (payroll)</b><span>Ajukan ke bendahara untuk potong rutin bulanan</span></div></div>
      <div class="list-item"><span class="li-icon blue"><i class="bi bi-envelope"></i></span><div class="li-body"><b>Konfirmasi transfer</b><span>${esc(st0.EMAIL_KOPERASI || '')} · ${esc(st0.TELEPON || '')}</span></div></div></div></div>`,
      foot: '<button class="btn btn-primary" data-bs-dismiss="modal">Mengerti</button>' });
  },
  katalog() {
    const B = S.db.barang.filter(b => b.Status !== 'nonaktif' && num(b.Stok) > 0).sort((a, b) => a.Kategori.localeCompare(b.Kategori));
    Modal.open({ title: 'Katalog Barang Koperasi', sub: 'Akad murabahah: margin ' + fmtPct(Calc.rate('barang')) + '% dari harga barang × lama angsuran • angsuran flat tiap bulan', icon: 'bi-shop', size: 'lg',
      body: B.length ? `<div class="grid g-2-lg">${B.map(b => `<div class="card-k"><div class="row-between">${badge(b.Kategori, 'b-gray')}<span class="xs muted">Stok ${b.Stok} ${esc(b.Satuan)}</span></div><b class="font-head d-block mt-2">${esc(b.Nama)}</b><div class="xs muted">${esc(b.Spesifikasi || '')}</div>
        <div class="row-between mt-2"><div><div class="xs muted">Harga tunai</div><b>${fmtRp(b.Harga_Jual)}</b></div><div class="text-end"><div class="xs muted">Cicil 10 bln</div><b class="text-gold">${fmtRp(murabahah(b.Harga_Jual))}/bln</b></div></div>
        <button class="btn btn-soft btn-block btn-sm mt-2" ${on('Pages.mBeranda.ajukanBarang', b.ID_Barang)}><i class="bi bi-cart-plus"></i> Ajukan Murabahah</button></div>`).join('')}</div>` : empty('bi-shop', 'Katalog kosong', 'Belum ada barang tersedia.') });
  },
  ajukanBarang(id) { Store.lset(LoanForm.key(), { Jenis: 'barang', ID_Barang: id, Qty: 1, Tenor: 10 }); Modal.close(); Nav.go('m-ajukan'); }
};

// ════════════════════════════════════════════════════════
// HALAMAN ANGGOTA: TRANSAKSI, PINJAMAN, AJUKAN
// ════════════════════════════════════════════════════════
Pages['m-transaksi'] = {
  title: 'Riwayat Transaksi', roles: ['anggota'],
  render(el) {
    const s = st('mtx', { k: 'semua', bulan: '' }), a = me();
    const feed = Pages.mBeranda.feed(a.ID_Anggota).filter(f => (s.k === 'semua' || f.k === s.k) && (!s.bulan || monthKey(f.t) === s.bulan));
    const groups = {}; feed.forEach(f => { (groups[monthKey(f.t)] = groups[monthKey(f.t)] || []).push(f); });
    el.innerHTML = pageHead({ title: 'Riwayat Transaksi', desc: 'Seluruh mutasi simpanan, angsuran, dan pembiayaan Anda. Ketuk transaksi untuk melihat bukti ber-QR.' }) + `
      <div class="card-k mb-3"><div class="toolbar"><div class="seg">${[['semua', 'Semua'], ['simpanan', 'Simpanan'], ['angsuran', 'Angsuran'], ['pinjaman', 'Pembiayaan']].map(x => `<button class="${s.k === x[0] ? 'on' : ''}" onclick="st('mtx').k='${x[0]}';Router.render()">${x[1]}</button>`).join('')}</div>
        <input class="inp" type="month" style="width:auto" value="${esc(s.bulan)}" onchange="st('mtx').bulan=this.value;Router.render()" aria-label="Filter bulan"><button class="btn btn-outline btn-sm" ${on('Docs.kartuSimpanan', a.ID_Anggota)}><i class="bi bi-printer"></i> Kartu Simpanan</button></div></div>
      ${Object.keys(groups).length ? Object.keys(groups).sort().reverse().map(k => `<div class="card-k mb-3"><div class="row-between mb-1"><b class="font-head">${fmtMonthLong(k)}</b><span class="small muted">${groups[k].length} transaksi</span></div><div class="list">${groups[k].map(Pages.mBeranda.item).join('')}</div></div>`).join('')
        : `<div class="card-k">${empty('bi-receipt', 'Tidak ada transaksi', 'Coba ubah filter.')}</div>`}`;
  }
};
Pages['m-pinjaman'] = {
  title: 'Pinjaman Saya', roles: ['anggota'],
  render(el) {
    const a = me(), L = (D.loansByAng[a.ID_Anggota] || []).slice().sort((x, y) => { const o = { berjalan: 0, disetujui: 1, diajukan: 2, lunas: 3, ditolak: 4, dibatalkan: 5 }; return (o[x.Status] - o[y.Status]) || String(y.Tgl_Pengajuan).localeCompare(String(x.Tgl_Pengajuan)); });
    const sisa = sum(L.filter(l => l.Status === 'berjalan'), 'Sisa_Tagihan'), angs = sum(L.filter(l => l.Status === 'berjalan'), 'Angsuran_per_Bulan');
    el.innerHTML = pageHead({ title: 'Pinjaman Saya', desc: 'Pantau sisa tagihan, jadwal angsuran, dan unduh surat akad Anda.', actions: `<button class="btn btn-gold" ${on('Nav.go', 'm-ajukan')}><i class="bi bi-plus-lg"></i> Ajukan Pinjaman</button>` }) + `
      <div class="grid g-2 mb-3"><div class="hero khatam-bg"><span class="khatam-star"></span><span class="eyebrow">Total Sisa Tagihan</span><div class="hero-amount">${rp(sisa, true)}</div><div class="small muted">${L.filter(l => l.Status === 'berjalan').length} pinjaman berjalan</div></div>
        ${kpi({ label: 'Angsuran per Bulan', value: rp(angs, true), icon: 'bi-calendar2-check', tone: 'gold', sub: 'Dipotong otomatis dari gaji tgl ' + tglPotong() })}</div>
      ${L.length ? `<div class="grid g-2-lg">${L.map(l => { const pc = paidCount(l), cur = nextRow(l); return `<div class="card-k hoverable" ${on('Nav.go', 'pinjaman-detail', { id: l.ID_Pinjaman })}><div class="row-between">${jenisBadge(l)}${loanBadge(l)}</div>
        <h4 class="font-head mt-2" style="font-size:16px">${esc(loanLabel(l))}</h4><div class="xs muted mono">${esc(l.No_Perjanjian && !l.No_Perjanjian.startsWith('(') ? l.No_Perjanjian : l.ID_Pinjaman.startsWith('tmp_') ? 'Menunggu nomor…' : l.ID_Pinjaman)}</div>
        <div class="grid g-2 mt-2"><div class="stat-mini"><span>Plafon</span><b>${fmtRp(l.Pokok)}</b></div><div class="stat-mini"><span>Angsuran</span><b>${fmtRp(l.Angsuran_per_Bulan)}</b></div></div>
        ${l.Status === 'berjalan' ? `<div class="mt-2">${progress(pct(pc, l.Tenor))}</div><div class="row-between xs mt-1"><span class="muted">${pc}/${l.Tenor} lunas${cur ? ' · berikutnya ' + fmtDate(cur.Jatuh_Tempo) : ''}</span><b class="text-primary">Sisa ${fmtRp(l.Sisa_Tagihan)}</b></div>` : l.Status === 'ditolak' ? `<div class="xs text-danger mt-2">${esc(l.Catatan || '')}</div>` : ''}</div>`; }).join('')}</div>`
        : `<div class="card-k">${empty('bi-wallet2', 'Belum ada pinjaman', 'Ajukan pembiayaan uang (bunga ' + fmtPct(Calc.rate('uang')) + '%/bln dari pokok) atau barang (margin ' + fmtPct(Calc.rate('barang')) + '%/bln dari harga) dengan simulasi angsuran otomatis.')}</div>`}`;
  }
};
Pages['m-ajukan'] = {
  title: 'Ajukan Pinjaman', nav: 'm-pinjaman', roles: ['anggota'],
  render(el) {
    el.innerHTML = pageHead({ back: 'm-beranda', backLabel: 'Kembali ke Beranda', title: 'Pengajuan Pinjaman', desc: 'Formulir pembiayaan koperasi digital — draf tersimpan otomatis di perangkat Anda.' }) +
      `<div class="grid g-main-side"><div>${me().Status === 'aktif' ? LoanForm.html(true) : `<div class="card-k">${empty('bi-person-x', 'Keanggotaan nonaktif', 'Pengajuan hanya untuk anggota aktif.')}</div>`}</div>
      <div class="stack detail-panel hide-sm"><div class="card-k soft"><b class="font-head">Ketentuan singkat</b><ul class="small mt-2 mb-0" style="padding-left:18px;line-height:1.8"><li>Bunga/margin flat dari pokok awal, disepakati di akad</li><li>Angsuran dipotong otomatis dari gaji setiap tanggal ${tglPotong()}</li><li>Pelunasan dipercepat bebas penalti</li><li>Satu pinjaman sejenis aktif per anggota</li></ul></div></div></div>`;
    if (me().Status === 'aktif') LoanForm.mount(true);
  },
  refresh() { /* jaga ketikan formulir */ }
};

// ════════════════════════════════════════════════════════
// HALAMAN: PROFIL & AKUN (semua peran)
// ════════════════════════════════════════════════════════
Pages.profil = {
  title: 'Profil & Akun',
  render(el) {
    if (S.role === 'anggota') return Pages.profil.member(el);
    const u = S.user;
    el.innerHTML = pageHead({ title: 'Profil & Akun', desc: 'Kelola keamanan akun dan preferensi tampilan Anda.' }) + `
      <div class="grid g-2-lg"><div class="card-k khatam-bg"><div class="person" style="gap:16px">${avatar(u.nama, 'lg')}<div><h2 class="font-head" style="font-size:20px">${esc(u.nama)}</h2><div class="row-gap mt-1">${badge(ROLE_LABEL[S.role], 'b-green')}<span class="mono small muted">${esc(u.username)}</span></div></div></div>
        <dl class="kv mt-3"><dt>Peran</dt><dd>${S.role === 'pengawas' ? 'Pengawas (hanya lihat)' : ROLE_LABEL[S.role] + ' (akses penuh)'}</dd><dt>Email</dt><dd>${esc(u.email || '-')}</dd><dt>Sesi</dt><dd>${S.remember ? 'Diingat di perangkat ini' : 'Berakhir saat tab ditutup'}</dd><dt>Antrean sinkron</dt><dd>${Sync.queue.length} transaksi</dd></dl></div>
      <div class="card-k"><h3 class="font-head mb-2" style="font-size:16px">Aksi & Preferensi</h3><div class="list">
        ${Pages.profil.row('bi-key', 'Ganti Kata Sandi', 'Ubah sandi akun SIMPEL-KOP Anda', 'Pages.profil.gantiSandi()')}
        ${Pages.profil.toggle('bi-moon-stars', 'Mode Gelap', 'Nyaman untuk mata di malam hari', UI.theme() === 'dark', 'UI.toggleTheme()')}
        ${Pages.profil.toggle('bi-eye-slash', 'Sembunyikan Nominal', 'Samarkan saldo di layar beranda', S.hideAmounts, 'UI.toggleAmounts()')}
        ${Pages.profil.row('bi-arrow-repeat', 'Sinkronkan Sekarang', 'Ambil data terbaru dari server', "Sync.pull(true).then(()=>toast('Data terbaru dimuat.','success'))")}
      </div><button class="btn btn-danger-soft btn-block mt-3" onclick="Auth.logout()"><i class="bi bi-box-arrow-right"></i> Keluar dari Akun</button></div></div>`;
  },
  row: (icon, t, s, fn, extra) => `<div class="list-item" role="button" tabindex="0" onclick="${esc(fn)}"><span class="li-icon"><i class="bi ${icon}"></i></span><div class="li-body"><b>${t}</b><span>${esc(s)}</span></div>${extra || ''}<i class="bi bi-chevron-right muted"></i></div>`,
  toggle: (icon, t, s, onx, fn) => `<div class="list-item"><span class="li-icon"><i class="bi ${icon}"></i></span><div class="li-body"><b>${t}</b><span>${esc(s)}</span></div><label class="switch"><input type="checkbox" ${onx ? 'checked' : ''} onchange="${esc(fn)}" aria-label="${esc(t)}"><span></span></label></div>`,
  member(el) {
    const a = me(), s = D.saldo[a.ID_Anggota] || { total: 0 }, L = D.loansByAng[a.ID_Anggota] || [];
    const sisa = sum(L.filter(l => l.Status === 'berjalan'), 'Sisa_Tagihan'), tung = D.tunggakan.some(t => t.loan.ID_Anggota === a.ID_Anggota);
    const mut = S.db.simpanan.filter(x => x.ID_Anggota === a.ID_Anggota).length + S.db.pembayaran.length;
    const lunasR = S.db.angsuran.filter(r => Calc.sisaRow(r) === 0).length, totR = S.db.angsuran.length;
    el.innerHTML = `<div class="grid g-12-lg"><div class="stack">
      <div class="card-k khatam-bg text-center" style="padding-top:24px"><div class="d-flex justify-content-center">${avatar(a.Nama, 'xl')}</div><h2 class="font-head mt-2" style="font-size:20px">${esc(a.Nama)}</h2>
        <div class="small muted">NIK: ${esc(a.NIK_NIP)} • ID: <b class="text-primary">${esc(a.ID_Anggota)}</b></div><div class="mt-2">${badge('Anggota ' + (a.Status === 'aktif' ? 'Aktif' : 'Nonaktif') + ' Sejak ' + (a.Tgl_Bergabung ? BULAN[+a.Tgl_Bergabung.slice(5, 7) - 1] + ' ' + a.Tgl_Bergabung.slice(0, 4) : '-'), a.Status === 'aktif' ? 'b-green' : 'b-gray', 'bi-check-circle')}</div>
        <div class="small mt-2"><i class="bi bi-mortarboard text-primary"></i> ${esc(a.Jabatan || '')} — ${esc(S.settings.SEKOLAH || '')}</div></div>
      <div><div class="row-between mb-2"><h3 class="font-head" style="font-size:17px">Ringkasan Portofolio</h3><a href="javascript:void(0)" class="small fw-600" ${on('Docs.kartuSimpanan', a.ID_Anggota)}>Buku Kas Syariah <i class="bi bi-journal"></i></a></div>
        <div class="grid g-2">${kpi({ label: 'Total Simpanan', value: rp(s.total, true), icon: 'bi-piggy-bank', tag: badge('Wadiah', 'b-green') })}${kpi({ label: 'Sisa Pembiayaan', value: rp(sisa, true), icon: 'bi-bank', tone: tung ? 'red' : '', tag: badge(tung ? 'Menunggak' : 'Lancar', tung ? 'b-red' : 'b-green') })}
          ${kpi({ label: 'Riwayat Mutasi', value: mut + ' <small>transaksi</small>', icon: 'bi-receipt', tone: 'blue' })}${kpi({ label: 'Cicilan Lunas', value: lunasR + ' <small>/ ' + totR + '</small>', icon: 'bi-award', tone: 'gold', tag: badge('Amanah', 'b-gold') })}</div></div>
      <div class="card-k"><div class="row-between mb-2"><h3 class="font-head" style="font-size:16px"><i class="bi bi-person-vcard text-primary"></i> Data Pokok Keanggotaan</h3><a href="javascript:void(0)" class="small fw-600" onclick="toast('Untuk koreksi data pribadi, silakan hubungi Admin/Bendahara koperasi.','info','Koreksi data')">Koreksi</a></div>
        <div class="stack" style="gap:8px">${[['bi-whatsapp', 'Nomor WhatsApp Terdaftar', a.No_HP], ['bi-envelope', 'Email Resmi Sekolah', a.Email], ['bi-geo-alt', 'Alamat Domisili Sesuai KTP', a.Alamat], ['bi-building', 'Status Kepegawaian', (a.Status_Pegawai || '') + ' • payroll ' + (S.settings.SEKOLAH || '')]].map(x => `<div class="stat-mini row-gap" style="flex-wrap:nowrap;align-items:flex-start"><i class="bi ${x[0]} text-primary" style="font-size:18px"></i><div style="min-width:0"><span>${x[1]}</span><b style="font-size:14px;font-family:var(--font-body)">${esc(x[2] || '-')}</b></div></div>`).join('')}</div></div>
      </div><div class="stack">
      <div class="card-k"><h3 class="font-head mb-2" style="font-size:16px">Aksi & Preferensi</h3><div class="list">
        ${Pages.profil.row('bi-key', 'Ganti Kata Sandi', 'Ubah sandi akun SIMPEL-KOP Anda', 'Pages.profil.gantiSandi()')}
        ${Pages.profil.row('bi-person-vcard', 'Unduh Kartu Anggota (PDF)', 'KTA digital terverifikasi QR', "Docs.kta('" + a.ID_Anggota + "')", badge('Resmi ber-QR', 'b-gold'))}
        ${Pages.profil.row('bi-journal-text', 'Kartu Simpanan (PDF)', 'Buku mutasi simpanan lengkap', "Docs.kartuSimpanan('" + a.ID_Anggota + "')")}
        ${Pages.profil.toggle('bi-bell', 'Notifikasi Email', 'Pengingat jatuh tempo H-3 & H-0', !!a.Email, "toast(this.checked?'Notifikasi email aktif ke '+(me().Email||'-'):'Hubungi admin untuk menonaktifkan notifikasi.','info')")}
        ${Pages.profil.toggle('bi-moon-stars', 'Mode Gelap', 'Nyaman untuk mata di malam hari', UI.theme() === 'dark', 'UI.toggleTheme()')}
        ${Pages.profil.toggle('bi-eye-slash', 'Sembunyikan Nominal', 'Samarkan saldo di layar', S.hideAmounts, 'UI.toggleAmounts()')}
        ${Pages.profil.row('bi-headset', 'Bantuan & Hubungi Bendahara', 'Konsultasi pembiayaan & data anggota', 'Pages.mBeranda.setor()')}
      </div></div>
      <button class="btn btn-danger-soft btn-lg btn-block" onclick="Auth.logout()"><i class="bi bi-box-arrow-right"></i> Keluar dari Akun SIMPEL-KOP</button>
      <div class="text-center xs muted">SIMPEL-KOP v${esc(BOOT.version || '1.4.7')} • Berlandaskan Prinsip Syariah<br>${esc(S.settings.NAMA_KOPERASI || '')}</div></div></div>`;
  },
  gantiSandi(wajib) {
    Modal.open({ title: 'Ganti Kata Sandi', icon: 'bi-key', sub: wajib ? 'Demi keamanan, ganti sandi sementara Anda sekarang.' : 'Gunakan minimal 8 karakter kombinasi huruf & angka',
      body: `${wajib ? '<div class="info-box warn mb-3"><i class="bi bi-shield-exclamation"></i><div>Akun Anda masih memakai <b>sandi sementara</b> dari admin. Silakan ganti sekarang.</div></div>' : ''}<form id="fPass" class="form-grid" novalidate onsubmit="event.preventDefault();Pages.profil.saveSandi()">
        <div class="fg"><label>Sandi lama <span class="req">*</span></label><input class="inp" type="password" name="lama" required autocomplete="current-password" data-msg="Sandi lama wajib diisi"></div>
        <div class="fg"><label>Sandi baru <span class="req">*</span></label><input class="inp" type="password" name="baru" required minlength="8" autocomplete="new-password" oninput="document.getElementById('pwStr').innerHTML=Pages.profil.strength(this.value)" data-msg="Minimal 8 karakter"><div id="pwStr" class="hint"></div></div>
        <div class="fg"><label>Ulangi sandi baru <span class="req">*</span></label><input class="inp" type="password" name="ulang" required autocomplete="new-password" data-msg="Ulangi sandi baru"></div>
        <button class="btn btn-primary btn-block" id="btnPass"><i class="bi bi-shield-check"></i> Simpan Sandi Baru</button></form>` });
  },
  strength(p) {
    let s = 0; if (p.length >= 8) s++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) s++;
    const l = [['Sangat lemah', 'red'], ['Lemah', 'red'], ['Cukup', 'gold'], ['Kuat', ''], ['Sangat kuat', '']][s];
    return `<div class="progress-k mt-1"><span class="${l[1]}" style="width:${s * 25}%"></span></div><span>Kekuatan: <b>${l[0]}</b></span>`;
  },
  saveSandi() {
    const f = document.getElementById('fPass');
    const data = Form.check(f, { baru: v => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v) ? '' : 'Minimal 8 karakter, kombinasi huruf & angka', ulang: (v, d) => v === d.baru ? '' : 'Konfirmasi sandi tidak sama' });
    if (!data) return;
    const btn = document.getElementById('btnPass'); Form.busy(btn, true);
    callApi('akun.sandi', { lama: data.lama, baru: data.baru, reqId: uid() }).then(r => {
      Form.busy(btn, false);
      if (r.success) { S.user.wajibGanti = false; Store.set('sk_session', { token: S.token, user: S.user, remember: S.remember }); Modal.close(); toast(r.message, 'success'); }
      else { const g = f.lama.closest('.fg'); g.classList.add('has-error'); g.querySelector('.err-msg') ? g.querySelector('.err-msg').textContent = r.message : toast(r.message, 'danger'); }
    }).catch(e => { Form.busy(btn, false); toast(e.message || String(e), 'danger'); });
  }
};


// ════════════════════════════════════════════════════════
// BAGIAN 17: DOKUMEN RESMI PDF (kop, nomor, QR verifikasi, tanda tangan)
// Template berbasis tabel + CSS sederhana agar konversi HTML→PDF di GAS rapi.
// ════════════════════════════════════════════════════════
function terbilang(n) {
  n = Math.floor(Math.abs(num(n)));
  const s = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  const f = x => x < 12 ? s[x] : x < 20 ? f(x - 10) + ' belas' : x < 100 ? f(Math.floor(x / 10)) + ' puluh ' + f(x % 10) : x < 200 ? 'seratus ' + f(x - 100)
    : x < 1000 ? f(Math.floor(x / 100)) + ' ratus ' + f(x % 100) : x < 2000 ? 'seribu ' + f(x - 1000) : x < 1e6 ? f(Math.floor(x / 1000)) + ' ribu ' + f(x % 1000)
      : x < 1e9 ? f(Math.floor(x / 1e6)) + ' juta ' + f(x % 1e6) : f(Math.floor(x / 1e9)) + ' miliar ' + f(x % 1e9);
  const r = (n === 0 ? 'nol' : f(n)).replace(/\s+/g, ' ').trim();
  return r.charAt(0).toUpperCase() + r.slice(1) + ' rupiah';
}

const Docs = {
  cur: null,
  /** QR sebagai data URL (pustaka qrcode-generator). */
  qr(text, cell) {
    try { if (!window.qrcode) return ''; const q = qrcode(0, 'M'); q.addData(String(text)); q.make(); return q.createDataURL(cell || 4, 2); } catch (e) { return ''; }
  },
  /** Tautan QR → halaman frontend ini (GitHub Pages) dengan ?v=NOMOR~KODE. */
  verifyUrl(no, code) { return Api.appUrl() + '?v=' + encodeURIComponent(no + '~' + code); },
  /** Tunggu hingga nomor dokumen resmi dari server tersedia (record optimistis). */
  ready(get, cb) {
    let n = 0;
    const tick = () => { const r = get(); if (r) return cb(r); if (++n > 40) return toast('Nomor dokumen belum tersedia. Periksa koneksi lalu coba lagi.', 'warning'); if (n === 1) toast('Menunggu nomor resmi dari server…', 'info'); setTimeout(tick, 400); };
    tick();
  },
  css() {
    return `@page{size:A4;margin:14mm 14mm 16mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;font-size:11.5px;color:#1F2A37;margin:0;line-height:1.45}
      .wrap{max-width:780px;margin:0 auto;padding:6px}table{border-collapse:collapse;width:100%}td,th{vertical-align:top}
      .kop td{vertical-align:middle}.kop .nm{font-size:17px;font-weight:bold;color:#0A5C47;letter-spacing:.3px}.kop .meta{font-size:9.5px;color:#4B5563;line-height:1.5}
      .rule1{border-top:3px solid #0F7B5F;margin-top:8px}.rule2{border-top:1px solid #D4A63A;margin-top:2px;margin-bottom:12px}
      .title{text-align:center;font-size:15px;font-weight:bold;color:#1F2A37;margin:6px 0 2px;letter-spacing:.5px}.sub{text-align:center;font-size:11px;color:#0F7B5F;font-weight:bold}
      .no{text-align:center;font-size:10.5px;color:#4B5563;margin:4px 0 12px}.chip{display:inline-block;background:#E8F5F0;color:#0A5C47;border-radius:10px;padding:2px 10px;font-weight:bold;font-size:10px}
      .kv td{padding:3px 4px;font-size:11.5px}.kv td.k{width:34%;color:#4B5563}.grid th{background:#E8F5F0;color:#0A5C47;font-size:10px;text-transform:uppercase;letter-spacing:.3px;padding:6px;border:1px solid #D8E6E0;text-align:left}
      .grid td{padding:5px 6px;border:1px solid #D8E6E0;font-size:10.5px}.grid tr.alt td{background:#F9FCFA}.r{text-align:right}.c{text-align:center}.b{font-weight:bold}
      .tot td{background:#0A5C47;color:#fff;font-weight:bold}.box{border:1px solid #D8E6E0;border-radius:8px;padding:10px;margin:10px 0;background:#F9FCFA}
      .amt{font-size:20px;font-weight:bold;color:#0A5C47}.terb{font-style:italic;color:#4B5563;font-size:11px}.pasal{font-weight:bold;color:#0A5C47;margin:10px 0 2px;font-size:11.5px}
      p{margin:3px 0 6px;text-align:justify}.sign td{text-align:center;padding:4px;font-size:11px;width:33%}.sign .sp{height:64px}.sign .nm{font-weight:bold;text-decoration:underline}
      .foot{margin-top:14px;border-top:1px dashed #BDC9C2;padding-top:6px;font-size:8.5px;color:#6B7280}.stmt td{padding:5px 8px;border-bottom:1px solid #E5EEEA;font-size:11px}
      .stmt tr.head td{background:#E8F5F0;color:#0A5C47;font-weight:bold;font-size:10px;letter-spacing:.3px}.stmt tr.total td{font-weight:bold;background:#F3F7F5}.stmt tr.grand td{font-weight:bold;background:#0A5C47;color:#fff;font-size:12px}.stmt tr.indent td.l{padding-left:22px}
      .neg{color:#B91C1C}.kpis td{border:1px solid #D8E6E0;padding:6px 8px;background:#F9FCFA;width:25%}.kpis .l{font-size:9px;color:#6B7280;text-transform:uppercase}.kpis .v{font-size:13px;font-weight:bold;color:#0A5C47}
      .stamp{display:inline-block;border:2px solid #0F7B5F;color:#0F7B5F;border-radius:6px;padding:2px 8px;font-size:9px;font-weight:bold;letter-spacing:1px;transform:rotate(-4deg)}`;
  },
  kop(qrData, code) {
    const st0 = S.settings, logo = Logo.url() || Logo._png;
    return `<table class="kop"><tr><td style="width:78px">${logo ? `<img src="${esc(logo)}" style="width:66px;height:66px" alt="logo">` : ''}</td>
      <td style="text-align:center"><div class="nm">${esc(String(st0.NAMA_KOPERASI || '').toUpperCase())}</div><div class="meta">Badan Hukum No. ${esc(st0.BADAN_HUKUM || '-')} • Unit ${esc(st0.SEKOLAH || '')}<br>${esc(st0.ALAMAT || '')}<br>Telp. ${esc(st0.TELEPON || '-')} • Email ${esc(st0.EMAIL_KOPERASI || '-')}</div></td>
      <td style="width:92px;text-align:center">${qrData ? `<img src="${qrData}" style="width:78px;height:78px" alt="QR verifikasi"><div style="font-size:7px;color:#6B7280;word-break:break-all">${esc(code || '')}</div>` : ''}</td></tr></table><div class="rule1"></div><div class="rule2"></div>`;
  },
  sign(cols, city) {
    return `<div style="text-align:right;font-size:11px;margin-top:14px">Jakarta Timur, ${longDate(T()).split(', ')[1]}</div><table class="sign"><tr>${cols.map(c => `<td>${esc(c[0])}<div style="font-size:9.5px;color:#6B7280">${esc(c[2] || '')}</div></td>`).join('')}</tr>
      <tr>${cols.map(c => `<td class="sp">${c[3] ? `<span class="stamp">${esc(c[3])}</span>` : ''}</td>`).join('')}</tr><tr>${cols.map(c => `<td class="nm">${esc(c[1] || '(..............................)')}</td>`).join('')}</tr></table>`;
  },
  shell(o) {
    const code = o.no && o.v ? o.no + '~' + o.v : '';
    const qrData = code ? Docs.qr(Docs.verifyUrl(o.no, o.v), 3) : '';
    return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>${esc(o.title)} ${esc(o.no || '')}</title><style>${Docs.css()}</style></head><body><div class="wrap">
      ${Docs.kop(qrData, code)}<div class="title">${esc(o.title)}</div>${o.sub ? `<div class="sub">${esc(o.sub)}</div>` : ''}${o.no ? `<div class="no">Nomor: <b>${esc(o.no)}</b>${o.chip ? ' &nbsp;<span class="chip">' + esc(o.chip) + '</span>' : ''}</div>` : '<div class="no"></div>'}
      ${o.body}${o.sign ? Docs.sign(o.sign) : ''}
      <div class="foot">Dokumen resmi dicetak dari SIMPEL-KOP pada ${fmtDateTime(new Date().toISOString().replace('T', ' ').slice(0, 16))} oleh ${esc(S.user ? S.user.nama : '-')}.${code ? ' Keaslian dapat diverifikasi dengan memindai QR atau memasukkan kode <b>' + esc(code) + '</b> pada menu Verifikasi Dokumen.' : ''} Dokumen ini sah tanpa tanda tangan basah apabila QR terverifikasi.</div>
      </div></body></html>`;
  },
  kv: rows => `<table class="kv">${rows.map(r => `<tr><td class="k">${esc(r[0])}</td><td>: ${r[2] ? r[1] : esc(r[1])}</td></tr>`).join('')}</table>`,

  /** Pratinjau dalam modal (bukan tab baru): Cetak • Unduh PDF (diarsipkan ke Drive) • Tutup */
  preview(o) {
    Docs.cur = o;
    const el = document.getElementById('docModal');
    document.getElementById('docContent').innerHTML = `<div class="modal-header"><div><h5 class="modal-title"><i class="bi bi-file-earmark-pdf text-primary me-2"></i>${esc(o.title)}</h5><div class="m-sub">${esc(o.no || '')} • A4 Portrait (210×297 mm)</div></div><button type="button" class="btn-close-k" data-bs-dismiss="modal" aria-label="Tutup"><i class="bi bi-x-lg"></i></button></div>
      <div class="modal-body" style="background:var(--surface-2)"><div class="doc-scale" id="docScale"><iframe id="docFrame" class="doc-frame" title="Pratinjau dokumen"></iframe></div></div>
      <div class="modal-footer"><span class="xs muted me-auto hide-sm"><i class="bi bi-cloud-check"></i> Unduh PDF otomatis diarsipkan ke Google Drive</span><button class="btn btn-outline" data-bs-dismiss="modal">Tutup</button><button class="btn btn-outline" onclick="Docs.print()"><i class="bi bi-printer"></i> Cetak</button><button class="btn btn-primary" id="btnPdf" onclick="Docs.pdf()"><i class="bi bi-download"></i> Unduh PDF</button></div>`;
    bootstrap.Modal.getOrCreateInstance(el).show();
    const fr = document.getElementById('docFrame');
    fr.srcdoc = o.html;
    // Pratinjau selebar kertas A4 (820 px) lalu diskalakan agar tampil utuh di layar kecil
    const fit = () => {
      const box = document.getElementById('docScale'); if (!box) return;
      const w = box.clientWidth, s = Math.min(1, w / 820), h = Math.round(window.innerHeight * 0.68);
      fr.style.width = (s < 1 ? 820 : w) + 'px'; fr.style.height = Math.round(h / s) + 'px';
      fr.style.transform = s < 1 ? 'scale(' + s + ')' : ''; box.style.height = h + 'px';
    };
    el.addEventListener('shown.bs.modal', function h() { el.removeEventListener('shown.bs.modal', h); fit(); });
    fit();
  },
  print() { const fr = document.getElementById('docFrame'); try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { toast('Gunakan tombol Unduh PDF lalu cetak dari berkas.', 'warning'); } },
  pdf() {
    const o = Docs.cur; if (!o) return;
    const btn = document.getElementById('btnPdf'); Form.busy(btn, true);
    callApi('dokumen.pdf', { html: o.html, nama: (o.file || o.title).replace(/[\\/:*?"<>|]/g, '-'), jenis: o.title, noDokumen: o.no || '', idAnggota: o.idAnggota || '', reqId: uid() }).then(r => {
      Form.busy(btn, false);
      if (!r.success) return toast(r.message, 'danger');
      applyPatch(r.data);
      const f = r.data.extra.file;
      Docs.download(f.name, 'application/pdf', f.base64);
      toast('PDF tersimpan & diarsipkan di Google Drive.', 'success', f.name);
    }).catch(e => { Form.busy(btn, false); toast('Gagal membuat PDF: ' + (e.message || e), 'danger'); });
  },
  download(name, mime, b64) {
    try {
      const bin = atob(b64), u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([u8], { type: mime }));
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) { toast('Unduhan diblokir browser. Buka dari arsip Google Drive.', 'warning'); }
  },
  /** Ekspor Excel (SheetJS dimuat saat dibutuhkan; cadangan CSV). sheets: [{name, rows:[obj]} | {name, aoa:[[...]]}] */
  excel(name, sheets) {
    toast('Menyiapkan berkas Excel…', 'info');
    loadScript(XLSX_URL).then(() => {
      const wb = XLSX.utils.book_new();
      sheets.forEach(s => { const ws = s.aoa ? XLSX.utils.aoa_to_sheet(s.aoa) : XLSX.utils.json_to_sheet(s.rows.length ? s.rows : [{ Info: 'Tidak ada data' }]); XLSX.utils.book_append_sheet(wb, ws, String(s.name).slice(0, 31)); });
      XLSX.writeFile(wb, name + '.xlsx');
    }).catch(() => {
      const s = sheets[0], rows = s.aoa || [Object.keys(s.rows[0] || {})].concat(s.rows.map(r => Object.values(r)));
      const csv = rows.map(r => r.map(v => '"' + String(v === undefined ? '' : v).replace(/"/g, '""') + '"').join(';')).join('\n');
      const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
      const a = document.createElement('a'); a.href = url; a.download = name + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast('Pustaka Excel tidak tersedia — diunduh sebagai CSV.', 'warning');
    });
  },

  // ── Template: Bukti setoran / penarikan simpanan ──
  bukti(id) {
    Docs.ready(() => { const realId = Sync.idMap[id] || id; const x = S.db.simpanan.find(t => t.ID_Transaksi === realId); return x && x.No_Bukti ? x : null; }, x => {
      Logo.png().then(() => {
        const a = D.anggota[x.ID_Anggota] || { Nama: angName(x.ID_Anggota) };
        const sorted = S.db.simpanan.filter(t => t.ID_Anggota === x.ID_Anggota && t.Jenis === x.Jenis && t.Status !== 'batal').sort((p, q) => (p.Tanggal + p.No_Bukti).localeCompare(q.Tanggal + q.No_Bukti));
        let saldo = 0; for (const t of sorted) { saldo += (t.Tipe === 'tarik' ? -1 : 1) * num(t.Jumlah); if (t.ID_Transaksi === x.ID_Transaksi) break; }
        const tarik = x.Tipe === 'tarik';
        const body = Docs.kv([['Tanggal transaksi', longDate(x.Tanggal)], ['Telah ' + (tarik ? 'dibayarkan kepada' : 'diterima dari'), `<b>${esc(a.Nama)}</b> (${esc(x.ID_Anggota)})`, 1], ['NIK / NIP', a.NIK_NIP || '-'], ['Jenis simpanan', 'Simpanan ' + cap(x.Jenis) + (x.Jenis === 'sukarela' ? ' (akad wadiah)' : '')], ['Metode', cap(x.Metode)], ['Keterangan', x.Keterangan || '-']]) +
          `<div class="box"><table><tr><td><div style="font-size:10px;color:#6B7280">${tarik ? 'JUMLAH PENARIKAN' : 'JUMLAH SETORAN'}</div><div class="amt">${fmtRp(x.Jumlah)}</div><div class="terb">Terbilang: ${terbilang(x.Jumlah)}</div></td><td class="r" style="width:40%"><div style="font-size:10px;color:#6B7280">SALDO ${x.Jenis.toUpperCase()} SETELAH TRANSAKSI</div><div class="b" style="font-size:15px">${fmtRp(saldo)}</div>${x.Status === 'batal' ? '<div class="neg b">DIBATALKAN</div>' : ''}</td></tr></table></div>`;
        Docs.preview({ title: tarik ? 'Bukti Penarikan Simpanan' : 'Bukti Setoran Simpanan', no: x.No_Bukti, idAnggota: x.ID_Anggota, file: 'Bukti ' + x.No_Bukti,
          html: Docs.shell({ title: tarik ? 'BUKTI PENARIKAN SIMPANAN' : 'BUKTI SETORAN SIMPANAN', sub: 'Simpanan ' + cap(x.Jenis) + ' Anggota', no: x.No_Bukti, v: x._v, chip: x.Status === 'batal' ? 'BATAL' : 'SAH', body,
            sign: [[tarik ? 'Penerima' : 'Penyetor', a.Nama, 'Anggota'], ['Petugas Kasir', x.Dicatat_Oleh, 'Koperasi', 'DITERIMA']] }) });
      });
    });
  },
  // ── Template: Kartu simpanan anggota (buku mutasi) ──
  kartuSimpanan(id) {
    const a = D.anggota[id]; if (!a) return toast('Data anggota belum tersedia.', 'warning');
    Logo.png().then(() => {
      const rows = S.db.simpanan.filter(t => t.ID_Anggota === id).sort((p, q) => (p.Tanggal + p.No_Bukti).localeCompare(q.Tanggal + q.No_Bukti));
      let run = 0; const s = D.saldo[id] || { pokok: 0, wajib: 0, sukarela: 0, total: 0 };
      const body = Docs.kv([['Nama anggota', `<b>${esc(a.Nama)}</b>`, 1], ['ID / NIK', a.ID_Anggota + ' / ' + a.NIK_NIP], ['Jabatan', (a.Jabatan || '-') + ' (' + (a.Status_Pegawai || '-') + ')'], ['Bergabung', longDate(a.Tgl_Bergabung)]]) +
        `<table class="kpis" style="margin:10px 0"><tr><td><div class="l">Pokok</div><div class="v">${fmtRp(s.pokok)}</div></td><td><div class="l">Wajib</div><div class="v">${fmtRp(s.wajib)}</div></td><td><div class="l">Sukarela</div><div class="v">${fmtRp(s.sukarela)}</div></td><td><div class="l">Total saldo</div><div class="v">${fmtRp(s.total)}</div></td></tr></table>
        <table class="grid"><tr><th>Tanggal</th><th>No. Bukti</th><th>Jenis</th><th>Keterangan</th><th class="r">Debet</th><th class="r">Kredit</th><th class="r">Saldo</th></tr>
        ${rows.map((t, i) => { const v = t.Status === 'batal' ? 0 : num(t.Jumlah); run += t.Tipe === 'tarik' ? -v : v; return `<tr class="${i % 2 ? 'alt' : ''}"><td>${fmtDate(t.Tanggal)}</td><td>${esc(t.No_Bukti)}</td><td>${esc(cap(t.Jenis))}</td><td>${esc(t.Keterangan || '')}${t.Status === 'batal' ? ' <b class="neg">[BATAL]</b>' : ''}</td><td class="r">${t.Tipe === 'tarik' ? fmtNum(t.Jumlah) : ''}</td><td class="r">${t.Tipe === 'setor' ? fmtNum(t.Jumlah) : ''}</td><td class="r b">${fmtNum(run)}</td></tr>`; }).join('')}
        <tr class="tot"><td colspan="6">SALDO AKHIR PER ${fmtDate(T()).toUpperCase()}</td><td class="r">${fmtNum(s.total)}</td></tr></table>`;
      Docs.preview({ title: 'Kartu Simpanan Anggota', no: a.ID_Anggota, idAnggota: id, file: 'Kartu Simpanan ' + a.ID_Anggota,
        html: Docs.shell({ title: 'KARTU SIMPANAN ANGGOTA', sub: 'Buku Mutasi Simpanan Pokok, Wajib & Sukarela', no: a.ID_Anggota, v: a._v, body, sign: [['Anggota', a.Nama], ['Bendahara', S.settings.BENDAHARA, '', 'TERVERIFIKASI']] }) });
    });
  },
  // ── Template: Surat perjanjian pinjaman (uang / barang) ──
  akad(id) {
    Docs.ready(() => { const l = D.loans[Sync.idMap[id] || id]; return l && l.No_Perjanjian && !l.No_Perjanjian.startsWith('(') ? l : null; }, l => {
      Logo.png().then(() => {
        const a = D.anggota[l.ID_Anggota] || { Nama: angName(l.ID_Anggota) }, st0 = S.settings, brg = D.barang[l.ID_Barang] || {}, rows = D.rows[l.ID_Pinjaman] || [];
        const uang = l.Jenis === 'uang';
        const pihak = `<p>Pada hari ini, ${longDate(Calc.mulai(l))}, yang bertanda tangan di bawah ini:</p>
          <table class="kv"><tr><td class="k">1. Nama</td><td>: <b>${esc(st0.KETUA)}</b>, Ketua ${esc(st0.NAMA_KOPERASI)}, bertindak untuk dan atas nama koperasi, selanjutnya disebut <b>PIHAK PERTAMA</b>.</td></tr>
          <tr><td class="k">2. Nama</td><td>: <b>${esc(a.Nama)}</b>, NIK/NIP ${esc(a.NIK_NIP || '-')}, ${esc(a.Jabatan || '')}, ID Anggota ${esc(l.ID_Anggota)}, beralamat di ${esc(a.Alamat || '-')}, selanjutnya disebut <b>PIHAK KEDUA</b>.</td></tr></table>
          <p>Kedua belah pihak sepakat mengikatkan diri dalam perjanjian ${uang ? 'pembiayaan uang' : 'jual beli murabahah barang'} dengan ketentuan sebagai berikut:</p>`;
        const pasal = uang ? [
          ['Pasal 1 — Pokok Pembiayaan', `PIHAK PERTAMA memberikan pembiayaan uang kepada PIHAK KEDUA sebesar <b>${fmtRp(l.Pokok)}</b> (${terbilang(l.Pokok)}) untuk keperluan: ${esc(l.Keperluan || '-')}.`],
          ['Pasal 2 — Bunga & Jangka Waktu', `Atas pembiayaan tersebut dikenakan bunga <b>${fmtPct(Calc.loanPct(l))}% dari pokok pinjaman per bulan × ${l.Tenor} bulan</b>, yaitu <b>${fmtRp(l.Total_Bunga)}</b> untuk seluruh jangka waktu <b>${l.Tenor} bulan</b>, sehingga total kewajiban <b>${fmtRp(l.Total_Tagihan)}</b> yang dibayar rata (flat) setiap bulan. Jumlah ini tetap hingga akhir akad.`],
          ['Pasal 3 — Cara Pembayaran', `PIHAK KEDUA membayar angsuran <b>${fmtRp(l.Angsuran_per_Bulan)}</b> per bulan melalui <b>pemotongan gaji</b> ${esc(st0.SEKOLAH || '')} <b>setiap tanggal ${tglPotong()}</b>, dimulai ${longDate((rows[0] || Calc.jadwalEstimasi(l)[0]).Jatuh_Tempo)}.`]]
          : [['Pasal 1 — Objek Akad', `PIHAK PERTAMA menjual kepada PIHAK KEDUA barang: <b>${esc(brg.Nama || l.ID_Barang)}</b> sebanyak ${l.Qty} ${esc(brg.Satuan || 'unit')} (${esc(brg.Spesifikasi || '')}) yang telah dimiliki secara sah (qabdh) oleh koperasi.`],
            ['Pasal 2 — Harga & Margin', `Harga pokok barang <b>${fmtRp(l.Pokok)}</b> ditambah margin <b>${fmtPct(Calc.loanPct(l))}% dari harga barang per bulan × ${l.Tenor} bulan</b> sebesar ${fmtRp(l.Total_Bunga)} untuk seluruh jangka waktu ${l.Tenor} bulan, sehingga harga jual murabahah <b>${fmtRp(l.Total_Tagihan)}</b> (${terbilang(l.Total_Tagihan)}), disepakati sejak awal dan tidak berubah.`],
            ['Pasal 3 — Serah Terima & Pembayaran', `Barang diserahterimakan pada ${longDate(Calc.mulai(l))}. PIHAK KEDUA membayar angsuran <b>${fmtRp(l.Angsuran_per_Bulan)}</b> per bulan melalui <b>pemotongan gaji</b> ${esc(st0.SEKOLAH || '')} <b>setiap tanggal ${tglPotong()}</b>, dimulai ${longDate((rows[0] || Calc.jadwalEstimasi(l)[0]).Jatuh_Tempo)}.`]];
        pasal.push(['Pasal 4 — Pelunasan Dipercepat', `PIHAK KEDUA boleh melunasi lebih cepat tanpa penalti.${String(st0.DISKON_PELUNASAN) === 'ya' ? ' Bunga/margin cicilan yang belum jatuh tempo dibebaskan (ibra\').' : ''}`],
          ['Pasal 5 — Keterlambatan', String(st0.DENDA_AKTIF) === 'ya' ? `Keterlambatan lebih dari ${st0.DENDA_TENGGANG} hari dikenakan denda ${fmtRp(st0.DENDA_NOMINAL)} per minggu sesuai ketetapan pengurus.` : 'Keterlambatan pembayaran diselesaikan secara musyawarah (tabayyun & ta\'awun) tanpa denda bunga berbunga.'],
          ['Pasal 6 — Penyelesaian Perselisihan', 'Segala perselisihan diselesaikan secara musyawarah untuk mufakat, dan apabila tidak tercapai, diselesaikan sesuai AD/ART koperasi.']);
        const body = pihak + pasal.map(p => `<div class="pasal">${p[0]}</div><p>${p[1]}</p>`).join('') +
          `<div class="box"><table class="kv"><tr><td class="k">No. Pengajuan</td><td>: ${esc(l.ID_Pinjaman)}</td><td class="k">Tanggal pencairan</td><td>: ${fmtDate(l.Tgl_Cair)}</td></tr><tr><td class="k">Total kewajiban</td><td>: <b>${fmtRp(l.Total_Tagihan)}</b></td><td class="k">Angsuran</td><td>: ${fmtRp(l.Angsuran_per_Bulan)} × ${l.Tenor}</td></tr></table></div>
          <p>Demikian perjanjian ini dibuat dengan penuh kesadaran dan tanpa paksaan, ditandatangani kedua belah pihak, serta berlaku sejak tanggal ditandatangani.</p>`;
        Docs.preview({ title: 'Surat Perjanjian Pinjaman ' + (uang ? 'Uang' : 'Barang'), no: l.No_Perjanjian, idAnggota: l.ID_Anggota, file: 'Akad ' + l.No_Perjanjian,
          html: Docs.shell({ title: 'SURAT PERJANJIAN ' + (uang ? 'PEMBIAYAAN UANG' : 'PEMBIAYAAN MURABAHAH BARANG'), sub: uang ? 'Akad Pembiayaan Multiguna Anggota' : "Akad Murabahah (Jual Beli dengan Margin Disepakati)", no: l.No_Perjanjian, v: l._v, chip: cap(l.Status), body,
            sign: [['PIHAK KEDUA', a.Nama, 'Anggota'], ['Bendahara', st0.BENDAHARA, 'Saksi'], ['PIHAK PERTAMA', st0.KETUA, 'Ketua Koperasi', 'DISAHKAN']] }) });
      });
    });
  },
  // ── Template: Kartu / jadwal angsuran ──
  jadwal(id) {
    const l = D.loans[Sync.idMap[id] || id]; if (!l) return;
    Logo.png().then(() => {
      const a = D.anggota[l.ID_Anggota] || { Nama: angName(l.ID_Anggota) }, rows = D.rows[l.ID_Pinjaman] || [];
      const body = Docs.kv([['Debitur', `<b>${esc(a.Nama)}</b> (${esc(l.ID_Anggota)})`, 1], ['Fasilitas', (l.Jenis === 'uang' ? 'Pinjaman uang, bunga ' : 'Murabahah, margin ') + fmtPct(Calc.loanPct(l)) + '%/bulan × ' + l.Tenor + ' bulan (flat) — ' + loanLabel(l)], ['Plafon / tenor', fmtRp(l.Pokok) + ' / ' + l.Tenor + ' bulan'], ['Tanggal pencairan', longDate(Calc.mulai(l))], ['Status', cap(l.Status) + ' • sisa ' + fmtRp(l.Sisa_Tagihan)]]) +
        `<table class="grid" style="margin-top:10px"><tr><th>Ke</th><th>Jatuh Tempo</th><th class="r">Pokok</th><th class="r">${l.Jenis === 'uang' ? 'Bunga' : 'Margin'}</th><th class="r">Denda</th><th class="r">Total</th><th>Tgl Bayar</th><th>No. Kwitansi</th><th class="c">Status</th></tr>
        ${rows.map((r, i) => { const s = Calc.sisaRow(r); return `<tr class="${i % 2 ? 'alt' : ''}"><td class="c">${r.Cicilan_Ke}</td><td>${fmtDate(r.Jatuh_Tempo)}</td><td class="r">${fmtNum(r.Pokok)}</td><td class="r">${fmtNum(r.Bunga)}</td><td class="r">${fmtNum(r.Denda)}</td><td class="r b">${fmtNum(num(r.Pokok) + num(r.Bunga) + num(r.Denda))}</td><td>${r.Tgl_Bayar ? fmtDate(r.Tgl_Bayar) : ''}</td><td>${esc(r.No_Bukti && !String(r.No_Bukti).startsWith('tmp_') ? r.No_Bukti : '')}</td><td class="c b" style="color:${s === 0 ? '#15803D' : r.Jatuh_Tempo < T() ? '#B91C1C' : '#6B7280'}">${s === 0 ? 'LUNAS' : num(r.Dibayar) ? 'SEBAGIAN' : r.Jatuh_Tempo < T() ? 'LEWAT' : '-'}</td></tr>`; }).join('')}
        <tr class="tot"><td colspan="2">TOTAL</td><td class="r">${fmtNum(sum(rows, 'Pokok'))}</td><td class="r">${fmtNum(sum(rows, 'Bunga'))}</td><td class="r">${fmtNum(sum(rows, 'Denda'))}</td><td class="r">${fmtNum(sum(rows, r => num(r.Pokok) + num(r.Bunga) + num(r.Denda)))}</td><td colspan="3">Terbayar ${fmtNum(sum(rows, 'Dibayar'))}</td></tr></table>`;
      Docs.preview({ title: 'Kartu Jadwal Angsuran', no: l.No_Perjanjian || l.ID_Pinjaman, idAnggota: l.ID_Anggota, file: 'Jadwal ' + (l.No_Perjanjian || l.ID_Pinjaman),
        html: Docs.shell({ title: 'KARTU JADWAL ANGSURAN', sub: 'Buku Kas Kartu Piutang Anggota', no: l.No_Perjanjian || l.ID_Pinjaman, v: l._v, body, sign: [['Debitur', a.Nama], ['Bendahara', S.settings.BENDAHARA, '', 'TERVERIFIKASI']] }) });
    });
  },
  // ── Template: Kwitansi pembayaran angsuran ──
  kwitansi(no) {
    Docs.ready(() => { const real = Sync.idMap[no] || no; const p = S.db.pembayaran.find(x => x.No_Bukti === real); return p && !String(p.No_Bukti).startsWith('tmp_') ? p : null; }, p => {
      Logo.png().then(() => {
        const l = D.loans[p.ID_Pinjaman] || {}, a = D.anggota[p.ID_Anggota] || { Nama: angName(p.ID_Anggota) };
        const after = (D.pays[p.ID_Pinjaman] || []).filter(x => (x.Tanggal + x.No_Bukti) <= (p.Tanggal + p.No_Bukti)).reduce((s, x) => s + num(x.Jumlah) + num(x.Diskon), 0);
        const body = Docs.kv([['Telah terima dari', `<b>${esc(a.Nama)}</b> (${esc(p.ID_Anggota)})`, 1], ['Uang sejumlah', `<b>${fmtRp(p.Jumlah)}</b>`, 1], ['Terbilang', `<i>${terbilang(p.Jumlah)}</i>`, 1],
          ['Untuk pembayaran', 'Angsuran ke-' + p.Cicilan + ' ' + (l.Jenis === 'barang' ? 'murabahah ' : 'pinjaman uang ') + (l.No_Perjanjian || p.ID_Pinjaman) + (p.Mode === 'lunas' ? ' (PELUNASAN DIPERCEPAT)' : '')], ['Tanggal bayar', longDate(p.Tanggal)], ['Metode', p.Metode === 'payroll' ? 'Potong gaji' : cap(p.Metode)]]) +
          `<table class="grid" style="margin-top:10px"><tr><th>Rincian</th><th class="r">Jumlah (Rp)</th></tr><tr><td>Pokok</td><td class="r">${fmtNum(p.Pokok)}</td></tr><tr class="alt"><td>${l.Jenis === 'barang' ? 'Margin murabahah' : 'Bunga'} (${fmtPct(Calc.loanPct(l))}%/bln × ${l.Tenor})</td><td class="r">${fmtNum(p.Bunga)}</td></tr><tr><td>Denda keterlambatan</td><td class="r">${fmtNum(p.Denda)}</td></tr>
          ${num(p.Diskon) ? `<tr class="alt"><td>Potongan margin pelunasan (ibra')</td><td class="r">(${fmtNum(p.Diskon)})</td></tr>` : ''}<tr class="tot"><td>TOTAL DITERIMA</td><td class="r">${fmtNum(p.Jumlah)}</td></tr></table>
          <div class="box"><table><tr><td>Sisa tagihan setelah pembayaran ini</td><td class="r b" style="font-size:14px">${fmtRp(Math.max(0, num(l.Total_Tagihan) + sum((D.rows[p.ID_Pinjaman] || []), r => num(r.Denda)) - after))}</td></tr></table>${p.Keterangan ? `<div class="terb">Catatan: ${esc(p.Keterangan)}</div>` : ''}</div>`;
        Docs.preview({ title: 'Kwitansi Pembayaran Angsuran', no: p.No_Bukti, idAnggota: p.ID_Anggota, file: 'Kwitansi ' + p.No_Bukti,
          html: Docs.shell({ title: 'KWITANSI PEMBAYARAN ANGSURAN', sub: 'Bukti Pembayaran Resmi', no: p.No_Bukti, v: p._v, chip: 'LUNAS', body, sign: [['Penyetor', a.Nama, 'Anggota'], ['Kasir / Bendahara', p.Dicatat_Oleh, '', 'DITERIMA']] }) });
      });
    });
  },
  // ── Template: Kartu Tanda Anggota ──
  kta(id) {
    const a = D.anggota[id]; if (!a || !a._v) return toast('KTA tersedia setelah data anggota tersinkron.', 'warning');
    Logo.png().then(() => {
      const st0 = S.settings, qrD = Docs.qr(Docs.verifyUrl(a.ID_Anggota, a._v), 3), logo = Logo.url() || Logo._png;
      const card = `<table style="width:340px;margin:10px auto;border-radius:14px;background:#0A5C47;color:#fff;border-collapse:separate"><tr><td style="padding:14px 16px">
        <table><tr><td>${logo ? `<img src="${esc(logo)}" style="width:38px;height:38px;background:#fff;border-radius:8px;padding:3px">` : ''}</td><td style="padding-left:8px"><div style="font-size:12px;font-weight:bold">${esc(st0.NAMA_APLIKASI || 'SIMPEL-KOP')} SYARIAH</div><div style="font-size:8.5px;opacity:.85">${esc(st0.SEKOLAH || '')}</div></td><td class="r"><span style="background:#D4A63A;color:#1F2A37;font-size:8px;font-weight:bold;padding:2px 6px;border-radius:4px">KTA DIGITAL</span></td></tr></table>
        <table style="margin-top:12px"><tr><td><div style="font-size:15px;font-weight:bold">${esc(a.Nama)}</div><div style="font-size:9.5px;opacity:.9">ID: ${esc(a.ID_Anggota)} • ${esc(a.Status_Pegawai || '')}</div><div style="font-size:9px;opacity:.85">${esc(a.Jabatan || '')}</div><div style="font-size:8.5px;opacity:.75;margin-top:6px">Anggota sejak ${fmtDate(a.Tgl_Bergabung)}</div></td>
        <td style="width:84px" class="r">${qrD ? `<img src="${qrD}" style="width:76px;height:76px;background:#fff;border-radius:6px;padding:3px">` : ''}</td></tr></table>
        <div style="font-size:7.5px;opacity:.75;margin-top:8px;word-break:break-all">${esc(a.ID_Anggota + '~' + a._v)} • Berlaku selama keanggotaan aktif</div></td></tr></table>`;
      const body = card + `<div class="box" style="margin-top:16px"><b>Ketentuan Kartu Anggota</b><ol style="margin:6px 0 0 16px;padding:0;font-size:10.5px"><li>Kartu ini adalah identitas resmi anggota ${esc(st0.NAMA_KOPERASI)}.</li><li>Keaslian kartu dapat diverifikasi dengan memindai QR code.</li><li>Kartu tidak dapat dipindahtangankan. Kehilangan kartu harap dilaporkan ke pengurus.</li><li>Pemegang kartu berhak atas layanan simpanan, pembiayaan syariah, dan toko koperasi.</li></ol></div>`;
      Docs.preview({ title: 'Kartu Tanda Anggota', no: a.ID_Anggota, idAnggota: id, file: 'KTA ' + a.ID_Anggota + ' ' + a.Nama, html: Docs.shell({ title: 'KARTU TANDA ANGGOTA (KTA)', sub: 'Kartu Identitas Digital Anggota Koperasi', no: a.ID_Anggota, v: a._v, body, sign: [['Anggota', a.Nama], ['Ketua Koperasi', st0.KETUA, '', 'SAH']] }) });
    });
  },
  // ── Template: Laporan (rekap/LR/neraca/arus kas) ──
  report(R, periode) {
    Logo.png().then(() => {
      const money = sec => new Set(sec.money || []);
      const cell = (v, i, m) => m.has(i) && typeof v === 'number' ? (v < 0 ? `<span class="neg">(${fmtNum(-v)})</span>` : fmtNum(v)) : esc(typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? fmtDate(v) : v);
      const body = `<div class="no" style="margin-top:-8px">${esc(periode)}</div><table class="kpis"><tr>${R.kpis.map(k => `<td><div class="l">${esc(k[0])}</div><div class="v">${k[2] === 'qty' ? fmtNum(k[1]) : k[2] === '%' ? k[1] + '%' : fmtRp(k[1])}</div></td>`).join('')}</tr></table>` +
        R.sections.map(sec => { const m = money(sec); return `<div class="pasal" style="margin-top:14px">${esc(sec.title)}</div>` + (sec.stmt
          ? `<table class="stmt">${sec.rows.map(r => `<tr class="${r.s || ''}"><td class="l">${esc(r.c[0])}</td><td class="r">${r.c[1] === '' ? '' : cell(r.c[1], 1, m)}</td></tr>`).join('')}</table>`
          : `<table class="grid"><tr>${sec.cols.map((c, i) => `<th class="${m.has(i) ? 'r' : ''}">${esc(c)}</th>`).join('')}</tr>${sec.rows.map((r, j) => `<tr class="${j % 2 ? 'alt' : ''}">${r.map((v, i) => `<td class="${m.has(i) || typeof v === 'number' ? 'r' : ''}">${cell(v, i, m)}</td>`).join('')}</tr>`).join('')}${sec.foot ? `<tr class="tot">${sec.foot.map((v, i) => `<td class="${typeof v === 'number' ? 'r' : ''}">${typeof v === 'number' ? fmtNum(v) : esc(v)}</td>`).join('')}</tr>` : ''}</table>`); }).join('') +
        (R.note ? `<p class="terb" style="margin-top:8px">* ${esc(R.note)}</p>` : '');
      const no = 'LAP/' + T().slice(0, 7).replace('-', '/') + '/' + R.title.replace(/[^A-Z]/g, '').slice(0, 4);
      Docs.preview({ title: R.title, no, file: R.title + ' ' + T(), html: Docs.shell({ title: R.title.toUpperCase(), sub: 'Dokumen Resmi untuk Rapat Anggota Tahunan (RAT)', no, body,
        sign: [['Penyusun Laporan', S.settings.BENDAHARA, 'Bendahara Koperasi', 'TERVERIFIKASI'], ['Menyetujui & Mengetahui', S.settings.KETUA, 'Ketua Koperasi', 'DISAHKAN'], ['Pemeriksa & Pengawas', S.settings.PENGAWAS, 'Dewan Pengawas Syariah', 'DIPERIKSA']] }) });
    });
  },
  laporan(kind) { const p = Rep.periode('tahun-ini'); Docs.report(Reports.build(kind, p[0], p[1], ''), 'Periode ' + fmtDate(p[0]) + ' s.d. ' + fmtDate(p[1])); }
};


// ════════════════════════════════════════════════════════
// BAGIAN 18: IMPOR DATA ANGGOTA DARI EXCEL (Admin)
// 1) Unggah .xlsx/.xls/.csv → diurai di browser (SheetJS, tanpa server)
// 2) Pemetaan kolom otomatis + validasi per baris (instan, lokal)
// 3) Kirim per batch ke server (divalidasi ulang, idempoten) + laporan hasil
// ════════════════════════════════════════════════════════
const Importer = {
  st: null,
  MAX_ROWS: 2000,
  FIELDS: [
    ['ID_Anggota', 'ID Anggota', ['id anggota', 'id', 'no anggota', 'nomor anggota', 'kode anggota', 'id_anggota']],
    ['Nama', 'Nama Lengkap', ['nama lengkap', 'nama', 'nama anggota', 'name', 'nama lengkap beserta gelar']],
    ['NIK_NIP', 'NIK / NIP', ['nik / nip', 'nik/nip', 'nik', 'nip', 'nik_nip', 'nuptk', 'no induk', 'nomor induk', 'nik nip']],
    ['Jabatan', 'Jabatan', ['jabatan', 'mapel', 'mata pelajaran', 'posisi', 'jabatan / mapel']],
    ['Status_Pegawai', 'Status Kepegawaian', ['status kepegawaian', 'status pegawai', 'kepegawaian', 'status_pegawai']],
    ['No_HP', 'No HP / WA', ['no hp / wa', 'no hp', 'hp', 'no wa', 'whatsapp', 'no whatsapp', 'telepon', 'no telp', 'nomor hp', 'no_hp']],
    ['Email', 'Email', ['email', 'e-mail', 'surel', 'alamat email']],
    ['Alamat', 'Alamat', ['alamat', 'domisili', 'alamat domisili']],
    ['Tgl_Bergabung', 'Tanggal Bergabung', ['tanggal bergabung', 'tgl bergabung', 'tanggal masuk', 'tgl masuk', 'bergabung', 'tgl_bergabung']],
    ['Status', 'Status Keanggotaan', ['status keanggotaan', 'status anggota', 'status']],
    ['pokok', 'Simpanan Pokok', ['simpanan pokok', 'saldo pokok', 'pokok']],
    ['wajib', 'Simpanan Wajib', ['simpanan wajib', 'saldo wajib', 'wajib']],
    ['sukarela', 'Simpanan Sukarela', ['simpanan sukarela', 'saldo sukarela', 'sukarela']]
  ],
  norm: h => String(h || '').toLowerCase().replace(/\*/g, '').replace(/[^a-z0-9]/g, ''),

  open() {
    if (!isAdmin()) return toast('Impor data anggota hanya untuk Administrator.', 'warning');
    Importer.st = { step: 1, fileName: '', headers: [], rows: [], map: {}, err: '', filter: 'semua', running: false, done: 0, total: 0, hasil: null, runId: uid(),
      opt: { mode: 'lewati', saldoAwal: true, tanggalSaldo: T(), buatAkun: true, folder: true } };
    const el = Modal.open({ title: 'Impor Data Anggota dari Excel', sub: 'Format .xlsx, .xls, atau .csv • maks. ' + fmtNum(Importer.MAX_ROWS) + ' baris • 5 MB', icon: 'bi-file-earmark-arrow-up', size: 'xl', body: '<div id="impWrap"></div>' });
    el.addEventListener('hide.bs.modal', function guard(e) {
      if (Importer.st && Importer.st.running) { e.preventDefault(); toast('Impor sedang berjalan — mohon tunggu hingga selesai.', 'warning'); return; }
      el.removeEventListener('hide.bs.modal', guard);
    });
    Importer.render();
    loadScript(XLSX_URL).catch(() => {});      // muat pustaka di latar agar penguraian terasa instan
  },

  stepper() {
    const s = Importer.st.step;
    return `<div class="stepper">${[['Unggah File', 1], ['Pratinjau & Validasi', 2], ['Proses & Hasil', 3]].map((x, i) => `<div class="step ${s > x[1] ? 'done' : s === x[1] ? 'cur' : ''}"><span class="dotn">${s > x[1] ? '<i class="bi bi-check-lg"></i>' : x[1]}</span>${x[0]}</div>${i < 2 ? `<div class="step-line ${s > x[1] ? 'done' : ''}"></div>` : ''}`).join('')}</div>`;
  },

  render() {
    const w = document.getElementById('impWrap'); if (!w || !Importer.st) return;
    const s = Importer.st;
    w.innerHTML = Importer.stepper() + (s.step === 1 ? Importer.step1() : s.step === 2 ? Importer.step2() : Importer.step3());
    if (s.step === 2) Importer.drawPreview();
    if (s.step === 3 && s.hasil) Importer.drawHasil();
  },

  // ── Langkah 1: unggah ──
  step1() {
    const s = Importer.st;
    return `<div class="grid g-12-lg">
      <div class="stack">
        <label class="dropzone" id="impDrop" ondragover="event.preventDefault();this.classList.add('over')" ondragleave="this.classList.remove('over')" ondrop="event.preventDefault();this.classList.remove('over');Importer.pick(event.dataTransfer.files[0])">
          <input type="file" id="impFile" accept=".xlsx,.xls,.csv" hidden onchange="Importer.pick(this.files[0])">
          <span class="kpi-icon" style="width:56px;height:56px;font-size:26px;border-radius:16px"><i class="bi bi-file-earmark-spreadsheet"></i></span>
          <b class="font-head mt-2">Seret file Excel ke sini atau klik untuk memilih</b>
          <span class="small muted">Lembar pertama (atau lembar bernama "Data Anggota") akan dibaca. Baris judul dideteksi otomatis.</span>
          ${s.loading ? '<span class="mt-2"><span class="spinner"></span> Membaca file…</span>' : ''}
        </label>
        ${s.err ? `<div class="alert-k err"><i class="bi bi-exclamation-octagon"></i><div><b>File tidak dapat dibaca</b>${esc(s.err)}</div></div>` : ''}
        <div class="info-box"><i class="bi bi-lightbulb"></i><div class="small"><b>Tips:</b> format kolom <b>NIK / NIP</b> dan <b>No HP</b> sebagai <i>Teks</i> di Excel sebelum mengetik/menempel, agar NIK 16–18 digit tidak berubah menjadi angka ilmiah (1,98E+17) dan nol di depan nomor HP tidak hilang.</div></div>
      </div>
      <div class="card-k soft"><div class="row-between mb-2"><b class="font-head">Template impor</b>${badge('Disarankan', 'b-green')}</div>
        <p class="small muted mb-2">Gunakan template agar kolom terpetakan otomatis. Kolom bertanda * wajib diisi.</p>
        <ul class="small mb-3" style="padding-left:18px;line-height:1.75">${Importer.FIELDS.map(f => `<li>${esc(f[1])}${['Nama', 'NIK_NIP'].includes(f[0]) ? ' <b class="text-danger">*</b>' : ''}</li>`).join('')}</ul>
        <button class="btn btn-primary btn-block" onclick="Importer.template()"><i class="bi bi-download"></i> Unduh Template Excel</button>
        <div class="xs muted mt-2">ID Anggota boleh dikosongkan (dibuat otomatis ${esc(String(S.settings.FMT_ANGGOTA || 'AGT-{NNN}').replace(/\{N+\}/, '…'))}). Isi bila ingin mempertahankan nomor anggota lama dari buku manual.</div></div></div>`;
  },

  /** Template .xlsx: lembar Data Anggota (kolom NIK/HP berformat Teks) + lembar Petunjuk berisi contoh. */
  template() {
    loadScript(XLSX_URL).then(() => {
      const head = ['ID Anggota', 'Nama Lengkap *', 'NIK / NIP *', 'Jabatan', 'Status Kepegawaian', 'No HP / WA', 'Email', 'Alamat', 'Tanggal Bergabung', 'Status Keanggotaan', 'Simpanan Pokok', 'Simpanan Wajib', 'Simpanan Sukarela'];
      const ws = XLSX.utils.aoa_to_sheet([head]);
      for (let r = 1; r <= 500; r++) ['C', 'F'].forEach(c => { ws[c + (r + 1)] = { t: 's', v: '', z: '@' }; });
      ws['!ref'] = 'A1:M501';
      ws['!cols'] = [12, 32, 22, 26, 18, 16, 28, 34, 16, 16, 14, 14, 16].map(w => ({ wch: w }));
      const help = XLSX.utils.aoa_to_sheet([
        ['PETUNJUK IMPOR DATA ANGGOTA — ' + (S.settings.NAMA_KOPERASI || 'SIMPEL-KOP')], [],
        ['Kolom', 'Wajib?', 'Keterangan', 'Contoh'],
        ['ID Anggota', 'Tidak', 'Kosongkan agar dibuat otomatis. Isi untuk mempertahankan nomor lama.', 'AGT-200'],
        ['Nama Lengkap', 'YA', 'Nama beserta gelar akademik (min. 3 huruf).', 'Muhammad Rizki Fauzan, S.Kom.'],
        ['NIK / NIP', 'YA', '8–20 digit angka, format sel TEKS. Kunci pengenal anggota (tidak boleh ganda).', '199203152021031002'],
        ['Jabatan', 'Tidak', 'Jabatan atau mata pelajaran.', 'Guru Produktif TKJ'],
        ['Status Kepegawaian', 'Tidak', 'GTY / GTT / TU / Operasional (boleh ditulis panjang, mis. "Guru Tetap Yayasan").', 'GTY'],
        ['No HP / WA', 'Tidak', 'Format sel TEKS agar nol di depan tidak hilang.', '081298421104'],
        ['Email', 'Tidak', 'Untuk notifikasi jatuh tempo & persetujuan.', 'rizki@pbsoedirman2.sch.id'],
        ['Alamat', 'Tidak', 'Sesuai KTP.', 'Jl. Raya Bogor No. 10, Ciracas'],
        ['Tanggal Bergabung', 'Tidak', 'Format tanggal Excel, atau teks 2021-03-01 / 01/03/2021. Kosong = hari impor.', '2021-03-01'],
        ['Status Keanggotaan', 'Tidak', 'aktif / nonaktif. Kosong = aktif.', 'aktif'],
        ['Simpanan Pokok', 'Tidak', 'Saldo awal (angka tanpa titik), maks. ' + fmtRp(S.settings.SIMPANAN_POKOK) + '. Hanya untuk anggota baru.', 100000],
        ['Simpanan Wajib', 'Tidak', 'Saldo awal simpanan wajib (migrasi buku manual).', 1500000],
        ['Simpanan Sukarela', 'Tidak', 'Saldo awal simpanan sukarela / wadiah.', 250000], [],
        ['Catatan: anggota yang NIK-nya sudah terdaftar akan dilewati, atau diperbarui bila opsi "Perbarui data" dipilih saat impor. Impor ulang file yang sama aman (tidak menggandakan data).']]);
      help['!cols'] = [{ wch: 20 }, { wch: 8 }, { wch: 80 }, { wch: 30 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Anggota');
      XLSX.utils.book_append_sheet(wb, help, 'Petunjuk');
      XLSX.writeFile(wb, 'Template_Impor_Anggota_SIMPEL-KOP.xlsx');
      toast('Template diunduh. Isi lembar "Data Anggota", lalu unggah kembali.', 'success');
    }).catch(() => toast('Pustaka Excel gagal dimuat. Periksa koneksi internet.', 'danger'));
  },

  pick(file) {
    const s = Importer.st; if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) { s.err = 'Format harus .xlsx, .xls, atau .csv.'; return Importer.render(); }
    if (file.size > 5 * 1024 * 1024) { s.err = 'Ukuran file maksimal 5 MB.'; return Importer.render(); }
    s.err = ''; s.loading = true; s.fileName = file.name; Importer.render();
    Promise.all([loadScript(XLSX_URL), file.arrayBuffer()]).then(res => {
      const wb = XLSX.read(res[1], { type: 'array', cellDates: false });
      const name = wb.SheetNames.find(n => /anggota/i.test(n)) || wb.SheetNames[0];
      const ws = wb.Sheets[name];
      // blankrows:true + titik awal rentang → nomor baris yang ditampilkan = nomor baris asli di Excel
      const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '', blankrows: true });
      const r0 = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']).s.r : 0;
      s.loading = false;
      Importer.parse(aoa, name, r0);
    }).catch(e => { s.loading = false; s.err = e.message || String(e); Importer.render(); });
  },

  /** Deteksi baris judul + pemetaan kolom otomatis berdasar sinonim. */
  parse(aoa, sheetName, r0) {
    const s = Importer.st, syn = {};
    Importer.FIELDS.forEach(f => f[2].forEach(x => { syn[Importer.norm(x)] = syn[Importer.norm(x)] || f[0]; }));
    let hr = -1;
    for (let i = 0; i < Math.min(20, aoa.length); i++) {
      const hits = (aoa[i] || []).filter(c => syn[Importer.norm(c)]).length;
      if (hits >= 2) { hr = i; break; }
    }
    if (hr < 0) { s.err = 'Baris judul kolom tidak ditemukan. Pastikan ada kolom "Nama" dan "NIK / NIP" (gunakan template).'; return Importer.render(); }
    s.headers = (aoa[hr] || []).map(String);
    s.map = {};
    s.headers.forEach((h, i) => { const f = syn[Importer.norm(h)]; if (f && s.map[f] === undefined) s.map[f] = i; });
    s.data = aoa.slice(hr + 1).map((r, i) => ({ r, baris: (r0 || 0) + hr + i + 2 })).filter(x => x.r.some(c => String(c).trim() !== ''));
    s.sheet = sheetName;
    if (!s.data.length) { s.err = 'Tidak ada baris data di bawah judul kolom.'; return Importer.render(); }
    if (s.data.length > Importer.MAX_ROWS) { s.err = 'File berisi ' + s.data.length + ' baris. Maksimal ' + Importer.MAX_ROWS + ' baris per impor — pecah menjadi beberapa file.'; return Importer.render(); }
    if (s.map.Nama === undefined || s.map.NIK_NIP === undefined) s.err = '';
    s.step = 2; Importer.build(); Importer.render();
  },

  // ── Konversi nilai sel ──
  txt(v) { return v === null || v === undefined ? '' : typeof v === 'number' ? String(v) : String(v).trim(); },
  nik(v) {
    if (typeof v === 'number') return Number.isSafeInteger(v) && v < 1e15 ? { v: String(v) } : { v: String(v), presisi: true };
    const s = String(v || '').trim().replace(/^'/, '');
    if (/^\d+(\.\d+)?e\+\d+$/i.test(s.replace(',', '.'))) return { v: s, presisi: true };
    return { v: s.replace(/[\s.\-]/g, '') };
  },
  hp(v) { let s = Importer.txt(v).replace(/^'/, ''); if (/^8\d{7,}$/.test(s)) s = '0' + s; return s; },
  money(v) { if (typeof v === 'number') return Math.round(v); const s = String(v || '').replace(/,\d{1,2}$/, '').replace(/[^\d-]/g, ''); return s ? Number(s) : 0; },
  date(v) {
    if (v === '' || v === null || v === undefined) return { v: '' };
    const ok = (y, m, d) => { const t = Date.UTC(y, m - 1, d), dt = new Date(t); return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? { v: utcToIso(t) } : { v: '', bad: true }; };
    if (typeof v === 'number') { if (v > 1000 && v < 80000) { const p = XLSX.SSF.parse_date_code(v); return ok(p.y, p.m, p.d); } return { v: '', bad: true }; }
    const s = String(v).trim().toLowerCase();
    let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/); if (m) return ok(+m[1], +m[2], +m[3]);
    m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/); if (m) return ok(+m[3], +m[2], +m[1]);
    const B = { jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7, agu: 8, agt: 8, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, des: 12, dec: 12 };
    m = s.match(/^(\d{1,2})\s+([a-z]+)\.?\s+(\d{4})$/); if (m && B[m[2].slice(0, 3)]) return ok(+m[3], B[m[2].slice(0, 3)], +m[1]);
    return { v: '', bad: true };
  },
  pegawai(v) { const s = Importer.norm(v); if (!s) return 'GTY'; if (s === 'gtt' || s.includes('tidaktetap') || s.includes('honor')) return 'GTT'; if (s === 'gty' || s.includes('tetap')) return 'GTY'; if (s === 'tu' || s.includes('tendik') || s.includes('tatausaha') || s.includes('staf')) return 'TU'; if (s.includes('operasional') || s.includes('sarpras') || s.includes('teknis')) return 'Operasional'; return null; },

  /** Bangun baris terstruktur dari data mentah + pemetaan, lalu validasi. */
  build() {
    const s = Importer.st, g = (r, f) => s.map[f] === undefined ? '' : r[s.map[f]];
    s.rows = s.data.map(x => {
      const r = x.r, nk = Importer.nik(g(r, 'NIK_NIP')), tg = Importer.date(g(r, 'Tgl_Bergabung'));
      return { _baris: x.baris, ID_Anggota: Importer.txt(g(r, 'ID_Anggota')).toUpperCase(), Nama: Importer.txt(g(r, 'Nama')), NIK_NIP: nk.v, _presisi: nk.presisi,
        Jabatan: Importer.txt(g(r, 'Jabatan')), Status_Pegawai: Importer.txt(g(r, 'Status_Pegawai')), No_HP: Importer.hp(g(r, 'No_HP')), Email: Importer.txt(g(r, 'Email')),
        Alamat: Importer.txt(g(r, 'Alamat')), Tgl_Bergabung: tg.v, _tglBad: tg.bad, Status: Importer.txt(g(r, 'Status')),
        pokok: Importer.money(g(r, 'pokok')), wajib: Importer.money(g(r, 'wajib')), sukarela: Importer.money(g(r, 'sukarela')) };
    });
    Importer.validate();
  },

  /** Validasi lokal (aturan sama dengan server) — dihitung ulang setiap opsi berubah. */
  validate() {
    const s = Importer.st, o = s.opt, seen = {};
    const byNik = {}, byId = {};
    S.db.anggota.forEach(a => { byNik[a.NIK_NIP] = a; byId[String(a.ID_Anggota).toUpperCase()] = a; });
    s.rows.forEach(r => {
      const e = [], w = [];
      if (r.Nama.length < 3) e.push('Nama wajib diisi');
      if (r._presisi) e.push('NIK tersimpan sebagai angka di Excel (digit hilang) — format kolom sebagai Teks');
      else if (!/^\d{8,20}$/.test(r.NIK_NIP)) e.push(r.NIK_NIP ? 'NIK/NIP harus 8–20 digit angka' : 'NIK/NIP wajib diisi');
      else if (seen[r.NIK_NIP]) e.push('NIK ganda di file (baris ' + seen[r.NIK_NIP] + ')');
      if (/^\d{8,20}$/.test(r.NIK_NIP) && !seen[r.NIK_NIP]) seen[r.NIK_NIP] = r._baris;
      if (r.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.Email)) e.push('Email tidak valid');
      if (r.No_HP && !/^[0-9+\-\s()]{8,20}$/.test(r.No_HP)) e.push('No HP tidak valid');
      if (r._tglBad) e.push('Tanggal bergabung tidak dikenali');
      else if (r.Tgl_Bergabung > T()) e.push('Tanggal bergabung di masa depan');
      if (r.ID_Anggota && !/^[A-Z0-9][A-Z0-9\-\/.]{1,24}$/.test(r.ID_Anggota)) e.push('Format ID anggota tidak valid');
      if ([r.pokok, r.wajib, r.sukarela].some(v => v < 0)) e.push('Saldo tidak boleh negatif');
      const exist = (r.ID_Anggota && byId[r.ID_Anggota]) || byNik[r.NIK_NIP];
      if (!exist && o.saldoAwal && r.pokok > num(S.settings.SIMPANAN_POKOK)) e.push('Simpanan pokok > ' + fmtRp(S.settings.SIMPANAN_POKOK));
      if (exist && o.mode === 'perbarui' && byNik[r.NIK_NIP] && byNik[r.NIK_NIP].ID_Anggota !== exist.ID_Anggota) e.push('NIK dipakai anggota lain (' + byNik[r.NIK_NIP].ID_Anggota + ')');
      if (Importer.pegawai(r.Status_Pegawai) === null) w.push('Status kepegawaian "' + r.Status_Pegawai + '" tidak dikenal → GTY');
      if (!r.No_HP && !r.Email) w.push('Tanpa kontak (HP/email)');
      if (!r.Tgl_Bergabung && !r._tglBad) w.push('Tanggal bergabung = hari ini');
      r._exist = exist ? exist.ID_Anggota : '';
      r._msgs = e; r._warn = w;
      r._status = e.length ? 'error' : exist ? (o.mode === 'perbarui' ? 'perbarui' : 'lewati') : 'baru';
    });
  },
  count() { const c = { baru: 0, perbarui: 0, lewati: 0, error: 0, warn: 0 }; Importer.st.rows.forEach(r => { c[r._status]++; if (r._warn.length && r._status !== 'error') c.warn++; }); return c; },

  // ── Langkah 2: pratinjau & validasi ──
  step2() {
    const s = Importer.st, c = Importer.count(), o = s.opt, kirim = c.baru + c.perbarui;
    const head = ['— tidak ada —'].concat(s.headers.map((h, i) => (h || 'Kolom ' + (i + 1))));
    const unmapped = Importer.FIELDS.filter(f => s.map[f[0]] === undefined).map(f => f[1]);
    return `<div class="row-between mb-3"><div class="row-gap"><span class="kpi-icon"><i class="bi bi-file-earmark-excel"></i></span><div><b>${esc(s.fileName)}</b><div class="xs muted">Lembar "${esc(s.sheet)}" • ${s.rows.length} baris data</div></div></div>
        <button class="btn btn-sm btn-outline" onclick="Importer.reset()"><i class="bi bi-arrow-repeat"></i> Ganti file</button></div>
      <div class="grid g-2 g-4 mb-3">
        <div class="stat-mini" style="background:var(--primary-soft)"><span>Anggota baru</span><b class="text-primary">${c.baru}</b></div>
        <div class="stat-mini" style="background:var(--info-soft)"><span>${o.mode === 'perbarui' ? 'Akan diperbarui' : 'Sudah terdaftar (dilewati)'}</span><b>${o.mode === 'perbarui' ? c.perbarui : c.lewati}</b></div>
        <div class="stat-mini" style="background:var(--danger-soft)"><span>Bermasalah (tidak diimpor)</span><b class="text-danger">${c.error}</b></div>
        <div class="stat-mini" style="background:var(--warning-soft)"><span>Peringatan</span><b class="text-warning">${c.warn}</b></div></div>
      <div class="grid g-2-lg mb-3">
        <div class="card-k"><b class="font-head d-block mb-2"><i class="bi bi-sliders text-primary"></i> Opsi impor</b>
          <div class="label mb-1">Jika NIK / ID sudah terdaftar</div>
          <div class="seg mb-2"><button class="${o.mode === 'lewati' ? 'on' : ''}" onclick="Importer.set('mode','lewati')">Lewati</button><button class="${o.mode === 'perbarui' ? 'on' : ''}" onclick="Importer.set('mode','perbarui')">Perbarui data</button></div>
          <label class="check mb-2"><input type="checkbox" ${o.saldoAwal ? 'checked' : ''} onchange="Importer.set('saldoAwal',this.checked)"> <span>Catat kolom simpanan sebagai <b>saldo awal</b> (bukti setoran bernomor, khusus anggota baru)</span></label>
          ${o.saldoAwal ? `<div class="fg mb-2" style="max-width:240px"><label>Tanggal saldo awal</label><input class="inp" type="date" value="${esc(o.tanggalSaldo)}" max="${T()}" onchange="Importer.set('tanggalSaldo',this.value)"></div>` : ''}
          <label class="check mb-2"><input type="checkbox" ${o.buatAkun ? 'checked' : ''} onchange="Importer.set('buatAkun',this.checked)"> <span>Buatkan <b>akun login</b> anggota baru (sandi sementara ada di file hasil)</span></label>
          <label class="check"><input type="checkbox" ${o.folder ? 'checked' : ''} onchange="Importer.set('folder',this.checked)"> <span>Buat <b>folder Google Drive</b> per anggota sekarang <span class="xs muted">(lebih lambat; bila tidak, dibuat saat unggah berkas pertama)</span></span></label></div>
        <div class="card-k"><details ${unmapped.length > 4 || s.map.Nama === undefined || s.map.NIK_NIP === undefined ? 'open' : ''}><summary class="font-head fw-600" style="cursor:pointer"><i class="bi bi-diagram-2 text-primary"></i> Pemetaan kolom ${unmapped.length ? `<span class="xs muted">(${Importer.FIELDS.length - unmapped.length}/${Importer.FIELDS.length} terpetakan)</span>` : badge('Semua terpetakan', 'b-green')}</summary>
          <div class="form-grid cols-2 mt-2">${Importer.FIELDS.map(f => `<div class="fg"><label>${esc(f[1])}${['Nama', 'NIK_NIP'].includes(f[0]) ? ' <span class="req">*</span>' : ''}</label><select class="inp" onchange="Importer.remap('${f[0]}',this.value)">${head.map((h, i) => `<option value="${i - 1}" ${(s.map[f[0]] === undefined ? -1 : s.map[f[0]]) === i - 1 ? 'selected' : ''}>${esc(h)}</option>`).join('')}</select></div>`).join('')}</div></details>
          <div class="map-chips mt-2">${Importer.FIELDS.map(f => s.map[f[0]] === undefined ? `<span class="map-chip off"><i class="bi bi-dash-circle"></i> ${esc(f[1])}</span>` : `<span class="map-chip" title="Kolom Excel: ${esc(s.headers[s.map[f[0]]])}"><i class="bi bi-check-circle-fill"></i> ${esc(f[1])}</span>`).join('')}</div>
          <div class="xs muted mt-2">Kolom dikenali dari nama judulnya. Klik <b>Pemetaan kolom</b> untuk mengubah bila ada yang keliru.</div>
          ${s.map.Nama === undefined || s.map.NIK_NIP === undefined ? '<div class="info-box danger mt-2"><i class="bi bi-exclamation-octagon"></i><div>Kolom <b>Nama</b> dan <b>NIK / NIP</b> wajib dipetakan.</div></div>' : ''}</div></div>
      <div class="card-k flush"><div class="p-3 row-between"><b class="font-head">Pratinjau data</b><div class="seg">${[['semua', 'Semua', s.rows.length], ['siap', 'Siap diimpor', kirim], ['masalah', 'Bermasalah', c.error]].map(x => `<button class="${s.filter === x[0] ? 'on' : ''}" onclick="Importer.set('filter','${x[0]}')">${x[1]} (${x[2]})</button>`).join('')}</div></div><div id="impPrev"></div></div>
      <div class="row-between mt-3"><button class="btn btn-outline" onclick="Importer.reset()"><i class="bi bi-arrow-left"></i> Kembali</button>
        <div class="row-gap">${c.error ? `<button class="btn btn-outline" onclick="Importer.errFile()"><i class="bi bi-file-earmark-excel"></i> Unduh daftar masalah</button>` : ''}
        <button class="btn btn-primary btn-lg" ${kirim && s.map.Nama !== undefined && s.map.NIK_NIP !== undefined ? '' : 'disabled'} onclick="Importer.run()"><i class="bi bi-cloud-upload"></i> Impor ${kirim} anggota</button></div></div>`;
  },
  drawPreview() {
    const s = Importer.st, box = document.getElementById('impPrev'); if (!box) return;
    const rows = s.rows.filter(r => s.filter === 'semua' || (s.filter === 'siap' ? ['baru', 'perbarui'].includes(r._status) : r._status === 'error'));
    const st2 = { baru: ['Baru', 'b-green', 'bi-plus-circle'], perbarui: ['Perbarui', 'b-blue', 'bi-arrow-repeat'], lewati: ['Lewati', 'b-gray', 'bi-skip-forward'], error: ['Error', 'b-red', 'bi-x-circle'] };
    box.innerHTML = Tbl.html({ id: 'imp-prev', rows, unit: 'baris', per: 10, emptyIcon: 'bi-check2-all', emptyTitle: 'Tidak ada baris pada filter ini', rowCls: r => r._status === 'error' ? 'row-danger' : r._warn.length ? 'row-warn' : '',
      cols: [{ h: 'Baris', v: r => `<span class="mono">${r._baris}</span>` },
        { h: 'Anggota', main: true, v: r => `<div class="cell-main">${esc(r.Nama || '—')}</div><div class="cell-sub mono">${esc(r.NIK_NIP || '—')}${r.ID_Anggota ? ' · ' + esc(r.ID_Anggota) : ''}</div>` },
        { h: 'Jabatan / Status', v: r => `${esc(r.Jabatan || '—')}<div class="cell-sub">${esc(Importer.pegawai(r.Status_Pegawai) || 'GTY')} · ${esc(r.Status || 'aktif')} · ${r.Tgl_Bergabung ? fmtDate(r.Tgl_Bergabung) : 'hari ini'}</div>` },
        { h: 'Kontak', hideSm: true, v: r => `${esc(r.No_HP || '—')}<div class="cell-sub">${esc(r.Email || '')}</div>` },
        { h: 'Saldo Awal', cls: 'num', v: r => r.pokok + r.wajib + r.sukarela ? `<b>${fmtRp(r.pokok + r.wajib + r.sukarela)}</b><div class="cell-sub">P ${fmtJt(r.pokok)} · W ${fmtJt(r.wajib)} · S ${fmtJt(r.sukarela)}</div>` : '—' },
        { h: 'Hasil Validasi', v: r => badge(st2[r._status][0] + (r._status === 'lewati' || r._status === 'perbarui' ? ' (' + r._exist + ')' : ''), st2[r._status][1], st2[r._status][2]) +
          r._msgs.map(m => `<div class="xs text-danger mt-1"><i class="bi bi-x"></i>${esc(m)}</div>`).join('') + r._warn.map(m => `<div class="xs text-warning mt-1"><i class="bi bi-exclamation-triangle"></i> ${esc(m)}</div>`).join('') }] });
  },
  set(k, v) { const s = Importer.st; if (k === 'filter') { s.filter = v; Tbl.reset('imp-prev'); return Importer.render(); } s.opt[k] = v; Importer.validate(); Importer.render(); },
  remap(f, idx) { const s = Importer.st, i = parseInt(idx, 10); if (i < 0) delete s.map[f]; else s.map[f] = i; Importer.build(); Importer.render(); },
  reset() { const s = Importer.st; s.step = 1; s.rows = []; s.data = []; s.err = ''; s.hasil = null; Importer.render(); },
  errFile() {
    Docs.excel('Masalah_Impor_Anggota_' + T(), [{ name: 'Baris Bermasalah', rows: Importer.st.rows.filter(r => r._status === 'error').map(r => ({ Baris: r._baris, Nama: r.Nama, 'NIK / NIP': r.NIK_NIP, Masalah: r._msgs.join('; ') })) }]);
  },

  // ── Langkah 3: kirim per batch (berurutan, idempoten) ──
  run() {
    const s = Importer.st;
    const send = s.rows.filter(r => r._status === 'baru' || r._status === 'perbarui');
    const local = s.rows.filter(r => r._status === 'error' || r._status === 'lewati').map(r => ({ baris: r._baris, status: r._status === 'error' ? 'gagal' : 'dilewati', id: r._exist, nama: r.Nama, pesan: r._status === 'error' ? r._msgs.join('; ') : 'Sudah terdaftar (' + r._exist + ')' }));
    const size = s.opt.folder ? 20 : 50, batches = [];
    for (let i = 0; i < send.length; i += size) batches.push(send.slice(i, i + size));
    s.step = 3; s.running = true; s.done = 0; s.total = send.length; s.hasil = local.slice(); s.batchNo = 0; s.batchTotal = batches.length;
    Importer.render();
    const clean = r => { const o = {}; Object.keys(r).forEach(k => { if (k === '_baris' || k.charAt(0) !== '_') o[k] = r[k]; }); return o; };
    const go = (i, tries) => {
      if (i >= batches.length) return Importer.finish();
      s.batchNo = i + 1; Importer.progress();
      callApi('anggota.impor', { rows: batches[i].map(clean), opsi: s.opt, fileName: s.fileName, reqId: s.runId + '-' + i }).then(res => {
        if (!res.success) {
          if (tries < 3 && /sibuk/i.test(res.message || '')) return setTimeout(() => go(i, tries + 1), 2500);
          batches[i].forEach(r => s.hasil.push({ baris: r._baris, status: 'gagal', id: '', nama: r.Nama, pesan: res.message }));
        } else {
          applyPatch(res.data);
          (res.data.extra.hasil || []).forEach(h => s.hasil.push(h));
        }
        s.done += batches[i].length; go(i + 1, 0);
      }).catch(err => {
        if (err && err.auth) { s.running = false; return; }
        if (tries < 3) return setTimeout(() => go(i, tries + 1), 1500 * (tries + 1));
        batches[i].forEach(r => s.hasil.push({ baris: r._baris, status: 'gagal', id: '', nama: r.Nama, pesan: 'Koneksi gagal: ' + (err.message || err) }));
        s.done += batches[i].length; go(i + 1, 0);
      });
    };
    go(0, 0);
  },
  progress() {
    const s = Importer.st, box = document.getElementById('impProg'); if (!box) return;
    const p = s.total ? Math.round(s.done / s.total * 100) : 100;
    box.innerHTML = `<div class="row-between small mb-1"><span>Batch ${s.batchNo} dari ${s.batchTotal} • ${s.done} dari ${s.total} baris</span><b>${p}%</b></div>${progress(p, 'lg')}`;
  },
  finish() {
    const s = Importer.st;
    s.running = false;
    s.hasil.sort((a, b) => (+a.baris || 0) - (+b.baris || 0));
    const c = { ditambah: 0, diperbarui: 0, dilewati: 0, gagal: 0 };
    s.hasil.forEach(h => { c[h.status] = (c[h.status] || 0) + 1; });
    s.ringkas = c;
    Importer.render();
    toast(c.ditambah + ' anggota ditambahkan, ' + c.diperbarui + ' diperbarui.', c.gagal ? 'warning' : 'success', 'Impor selesai');
  },
  step3() {
    const s = Importer.st;
    if (s.running) return `<div class="card-k text-center p-4"><span class="spinner" style="width:36px;height:36px;border-width:3px"></span><h3 class="font-head mt-3" style="font-size:17px">Mengimpor data anggota…</h3>
      <p class="small muted">Data dikirim bertahap dan divalidasi ulang di server. Jangan tutup jendela ini.</p><div id="impProg" class="mt-3 text-start"></div></div>`;
    const c = s.ringkas || {}, akun = s.hasil.filter(h => h.sandi).length;
    return `<div class="grid g-2 g-4 mb-3"><div class="stat-mini" style="background:var(--primary-soft)"><span>Ditambahkan</span><b class="text-primary">${c.ditambah || 0}</b></div><div class="stat-mini" style="background:var(--info-soft)"><span>Diperbarui</span><b>${c.diperbarui || 0}</b></div>
        <div class="stat-mini"><span>Dilewati</span><b>${c.dilewati || 0}</b></div><div class="stat-mini" style="background:var(--danger-soft)"><span>Gagal</span><b class="text-danger">${c.gagal || 0}</b></div></div>
      ${akun ? `<div class="info-box warn mb-3"><i class="bi bi-shield-lock"></i><div><b>${akun} akun login dibuat.</b> Sandi sementara hanya tersedia di file hasil — unduh sekarang dan bagikan secara pribadi. Anggota wajib mengganti sandi saat masuk pertama.</div></div>` : ''}
      <div class="card-k flush"><div id="impHasil"></div></div>
      <div class="row-between mt-3"><button class="btn btn-outline" onclick="Importer.reset()"><i class="bi bi-file-earmark-plus"></i> Impor file lain</button>
        <div class="row-gap"><button class="btn btn-outline" onclick="Importer.hasilFile()"><i class="bi bi-download"></i> Unduh Hasil (Excel)</button><button class="btn btn-primary" onclick="Modal.close();st('anggota').tab='semua';st('anggota').sort='baru';Nav.go('anggota')"><i class="bi bi-check2"></i> Selesai</button></div></div>`;
  },
  drawHasil() {
    const box = document.getElementById('impHasil'); if (!box) return;
    const cls = { ditambah: 'b-green', diperbarui: 'b-blue', dilewati: 'b-gray', gagal: 'b-red' };
    box.innerHTML = Tbl.html({ id: 'imp-hasil', rows: Importer.st.hasil, unit: 'baris', per: 10, rowCls: h => h.status === 'gagal' ? 'row-danger' : '',
      cols: [{ h: 'Baris', v: h => `<span class="mono">${esc(h.baris)}</span>` }, { h: 'Status', v: h => badge(cap(h.status), cls[h.status]) },
        { h: 'Anggota', main: true, v: h => `<div class="cell-main">${esc(h.nama || '—')}</div><div class="cell-sub mono">${esc(h.id || '')}</div>` },
        { h: 'Keterangan', v: h => esc(h.pesan || '') }, { h: 'Akun', v: h => h.username ? `<span class="mono small">${esc(h.username)}</span>` : '—' }] });
  },
  hasilFile() {
    Docs.excel('Hasil_Impor_Anggota_' + T(), [{ name: 'Hasil Impor', rows: Importer.st.hasil.map(h => ({ Baris: h.baris, Status: h.status, 'ID Anggota': h.id || '', Nama: h.nama || '', Keterangan: h.pesan || '', Username: h.username || '', 'Sandi Sementara': h.sandi || '' })) }]);
  }
};

