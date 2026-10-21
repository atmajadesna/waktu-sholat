/* Waktu Sholat — jadwal, pengingat adzan, arah kiblat, tasbih.
 * Seluruh perhitungan berjalan di peramban. Tanpa dependensi.
 */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ===================================================================
   * 1. KOTA & METODE
   * =================================================================== */

  const KOTA = [
    { id: 'solo', nama: 'Surakarta', lat: -7.5755, lng: 110.8243, tz: 7 },
    { id: 'jogja', nama: 'Yogyakarta', lat: -7.7956, lng: 110.3695, tz: 7 },
    { id: 'semarang', nama: 'Semarang', lat: -6.9667, lng: 110.4167, tz: 7 },
    { id: 'jakarta', nama: 'Jakarta', lat: -6.2088, lng: 106.8456, tz: 7 },
    { id: 'bandung', nama: 'Bandung', lat: -6.9175, lng: 107.6191, tz: 7 },
    { id: 'surabaya', nama: 'Surabaya', lat: -7.2575, lng: 112.7521, tz: 7 },
    { id: 'malang', nama: 'Malang', lat: -7.9666, lng: 112.6326, tz: 7 },
    { id: 'palembang', nama: 'Palembang', lat: -2.9761, lng: 104.7754, tz: 7 },
    { id: 'medan', nama: 'Medan', lat: 3.5952, lng: 98.6722, tz: 7 },
    { id: 'aceh', nama: 'Banda Aceh', lat: 5.5483, lng: 95.3238, tz: 7 },
    { id: 'padang', nama: 'Padang', lat: -0.9471, lng: 100.4172, tz: 7 },
    { id: 'denpasar', nama: 'Denpasar', lat: -8.65, lng: 115.2167, tz: 8 },
    { id: 'mataram', nama: 'Mataram', lat: -8.5833, lng: 116.1167, tz: 8 },
    { id: 'banjarmasin', nama: 'Banjarmasin', lat: -3.3186, lng: 114.5944, tz: 8 },
    { id: 'pontianak', nama: 'Pontianak', lat: -0.0263, lng: 109.3425, tz: 7 },
    { id: 'makassar', nama: 'Makassar', lat: -5.1477, lng: 119.4327, tz: 8 },
    { id: 'manado', nama: 'Manado', lat: 1.4748, lng: 124.8421, tz: 8 },
    { id: 'jayapura', nama: 'Jayapura', lat: -2.5916, lng: 140.669, tz: 9 }
  ];

  const METODE = {
    kemenag: { fajr: 20, isha: 18 },
    mwl: { fajr: 18, isha: 17 },
    isna: { fajr: 15, isha: 15 },
    ummalqura: { fajr: 18.5, ishaMenit: 90 },
    egypt: { fajr: 19.5, isha: 17.5 }
  };

  const SHOLAT = [
    { kunci: 'imsak', nama: 'Imsak', arab: 'الإمساك' },
    { kunci: 'subuh', nama: 'Subuh', arab: 'الفجر' },
    { kunci: 'syuruq', nama: 'Syuruq', arab: 'الشروق' },
    { kunci: 'dzuhur', nama: 'Dzuhur', arab: 'الظهر' },
    { kunci: 'ashar', nama: 'Ashar', arab: 'العصر' },
    { kunci: 'maghrib', nama: 'Maghrib', arab: 'المغرب' },
    { kunci: 'isya', nama: 'Isya', arab: 'العشاء' }
  ];

  const SHOLAT_WAJIB = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
  const KAABAH = { lat: 21.4225, lng: 39.8262 };

  /* ===================================================================
   * 2. PERHITUNGAN WAKTU
   * =================================================================== */

  const D2R = Math.PI / 180;
  const R2D = 180 / Math.PI;
  const dsin = (d) => Math.sin(d * D2R);
  const dcos = (d) => Math.cos(d * D2R);
  const dtan = (d) => Math.tan(d * D2R);
  const dasin = (x) => R2D * Math.asin(x);
  const dacos = (x) => R2D * Math.acos(x);
  const datan2 = (y, x) => R2D * Math.atan2(y, x);

  const fix = (a, b) => { const r = a - b * Math.floor(a / b); return r < 0 ? r + b : r; };
  const fixAngle = (a) => fix(a, 360);
  const fixHour = (a) => fix(a, 24);

  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }

  function posisiMatahari(jd) {
    const D = jd - 2451545.0;
    const g = fixAngle(357.529 + 0.98560028 * D);
    const q = fixAngle(280.459 + 0.98564736 * D);
    const L = fixAngle(q + 1.915 * dsin(g) + 0.020 * dsin(2 * g));
    const e = 23.439 - 0.00000036 * D;
    const RA = datan2(dcos(e) * dsin(L), dcos(L)) / 15;
    const decl = dasin(dsin(e) * dsin(L));
    const eqt = q / 15 - fixHour(RA);
    return { decl, eqt };
  }

  function waktuSudut(angle, lat, decl, noon, arah) {
    const cosT = (-dsin(angle) - dsin(decl) * dsin(lat)) / (dcos(decl) * dcos(lat));
    if (cosT > 1 || cosT < -1) return null;
    const t = dacos(cosT) / 15;
    return noon + (arah === 'sebelum' ? -t : t);
  }

  function hitungWaktu(tanggal, kota, metode) {
    const { lat, lng, tz } = kota;
    const m = METODE[metode] || METODE.kemenag;
    const jd = julian(tanggal.getFullYear(), tanggal.getMonth() + 1, tanggal.getDate()) - lng / (15 * 24);
    const { decl, eqt } = posisiMatahari(jd);
    const noon = fixHour(12 - eqt);
    const geser = tz - lng / 15;

    const sudutAshar = -R2D * Math.atan(1 / (1 + dtan(Math.abs(lat - decl))));

    const hasil = {};
    const fajr = waktuSudut(m.fajr, lat, decl, noon, 'sebelum');
    const syuruq = waktuSudut(0.833, lat, decl, noon, 'sebelum');
    const dzuhur = noon;
    const ashar = waktuSudut(sudutAshar, lat, decl, noon, 'sesudah');
    const maghrib = waktuSudut(0.833, lat, decl, noon, 'sesudah');
    const isya = m.ishaMenit
      ? maghrib + m.ishaMenit / 60
      : waktuSudut(m.isha, lat, decl, noon, 'sesudah');

    const keLokal = (t) => (t === null ? null : fixHour(t + geser));

    hasil.imsak = keLokal(fajr === null ? null : fajr - 10 / 60);
    hasil.subuh = keLokal(fajr);
    hasil.syuruq = keLokal(syuruq);
    hasil.dzuhur = keLokal(dzuhur);
    hasil.ashar = keLokal(ashar);
    hasil.maghrib = keLokal(maghrib);
    hasil.isya = keLokal(isya);
    return hasil;
  }

  function keDetik(jam) {
    if (jam === null || jam === undefined) return null;
    const total = Math.round(jam * 3600);
    return ((total % 86400) + 86400) % 86400;
  }

  function formatJam(jam, format) {
    if (jam === null || jam === undefined) return '—';
    // dibulatkan ke menit terdekat agar sama dengan jadwal cetak
    let total = Math.round(jam * 60);
    total = ((total % 1440) + 1440) % 1440;
    let h = Math.floor(total / 60);
    const mnt = total % 60;
    let akhiran = '';
    if (format === '12') {
      akhiran = h >= 12 ? ' PM' : ' AM';
      h = h % 12 === 0 ? 12 : h % 12;
    }
    return `${String(h).padStart(2, '0')}.${String(mnt).padStart(2, '0')}${akhiran}`;
  }

  function tanggalISO(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function tanggalPanjang(d) {
    return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  }

  function hijriah(d) {
    try {
      return new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    } catch (e) {
      return '';
    }
  }

  /* ===================================================================
   * 3. KEADAAN
   * =================================================================== */

  const KUNCI = 'sholat.v1';
  const bawaan = {
    kota: 'solo',
    metode: 'kemenag',
    koreksi: 0,
    format: '24',
    volume: 70,
    auto: true,
    iqamah: 10,
    pengingat: 10,
    tasbih: { n: 0, putaran: 0, target: 33 },
    ceklis: {}
  };

  let state = muat();

  function muat() {
    try {
      const s = JSON.parse(localStorage.getItem(KUNCI) || '{}');
      return { ...bawaan, ...s, tasbih: { ...bawaan.tasbih, ...(s.tasbih || {}) }, ceklis: s.ceklis || {} };
    } catch (e) {
      return { ...bawaan };
    }
  }

  function simpan() {
    try { localStorage.setItem(KUNCI, JSON.stringify(state)); } catch (e) { /* mode privat */ }
  }

  function kotaAktif() {
    return KOTA.find((k) => k.id === state.kota) || KOTA[0];
  }

  /* ===================================================================
   * 4. RENDER
   * =================================================================== */

  const el = {
    kota: $('#kota'), metode: $('#metode'), koreksi: $('#koreksi'), format: $('#format'),
    heroNama: $('#hero-nama'), heroArab: $('#hero-arab'), heroJam: $('#hero-jam'),
    heroSisa: $('#hero-sisa'), heroLabel: $('#hero-label'), heroTanggal: $('#hero-tanggal'),
    heroHijri: $('#hero-hijri'), heroLokasi: $('#hero-lokasi'), lafaz: $('#lafaz-subuh'),
    daftar: $('#jadwal-daftar'), jadwalTanggal: $('#jadwal-tanggal'),
    bulananIsi: $('#bulanan-isi'), bulananNama: $('#bulanan-nama'),
    ceklis: $('#ceklis-daftar'), ceklisTanggal: $('#ceklis-tanggal'), streak: $('#streak'),
    audio: $('#audio'), putar: $('#putar'), ikon: $('#ikon-putar'), gelombang: $('#gelombang'),
    status: $('#adzan-status'), volume: $('#volume'), nilaiVolume: $('#nilai-volume'),
    auto: $('#auto-adzan'), iqamah: $('#iqamah'), nilaiIqamah: $('#nilai-iqamah'), iqamahKet: $('#iqamah-ket'),
    kiblatDerajat: $('#kiblat-derajat'), kiblatKet: $('#kiblat-ket'), kiblatStatus: $('#kiblat-status'),
    jarum: $('#kompas-jarum'), kaabah: $('#kompas-kaabah'), kompasKet: $('#kompas-ket'),
    tasbihAngka: $('#tasbih-angka'), tasbihPutaran: $('#tasbih-putaran'), tasbihTarget: $('#tasbih-target'),
    tasbihPilih: $('#tasbih-pilih')
  };

  function isiPilihanKota() {
    el.kota.innerHTML = KOTA.map((k) => `<option value="${k.id}">${k.nama}</option>`).join('')
      + '<option value="gps">— pakai lokasi perangkat —</option>';
    el.kota.value = state.kota;
  }

  function waktuHariIni(tgl = new Date()) {
    const hasil = hitungWaktu(tgl, kotaAktif(), state.metode);
    if (state.koreksi) {
      for (const k in hasil) if (hasil[k] !== null) hasil[k] = fixHour(hasil[k] + state.koreksi / 60);
    }
    return hasil;
  }

  function tanggalDariJam(tgl, jam) {
    const d = new Date(tgl.getFullYear(), tgl.getMonth(), tgl.getDate(), 0, 0, 0, 0);
    d.setSeconds(keDetik(jam));
    return d;
  }

  function berikutnya(tgl, waktu) {
    const kini = new Date();
    for (const k of SHOLAT_WAJIB) {
      const d = tanggalDariJam(tgl, waktu[k]);
      if (d > kini) return { kunci: k, waktu: d };
    }
    const besok = new Date(tgl.getFullYear(), tgl.getMonth(), tgl.getDate() + 1);
    const w = hitungWaktu(besok, kotaAktif(), state.metode);
    return { kunci: 'subuh', waktu: tanggalDariJam(besok, w.subuh), besok: true };
  }

  function renderJadwal(waktu) {
    const kini = new Date();
    el.daftar.innerHTML = SHOLAT.map((s) => {
      const jam = waktu[s.kunci];
      const d = tanggalDariJam(kini, jam);
      const lewat = d <= kini;
      const tanda = s.kunci === 'subuh'
        ? '<span class="jadwal__tanda" title="Adzan Subuh menambahkan lafaz: ash-shalatu khairun minan-naum">+ خَيْرٌ مِنَ النَّوْمِ</span>'
        : '';
      return `<li class="jadwal__baris" data-kunci="${s.kunci}" data-status="${lewat ? 'lewat' : 'menunggu'}">
        <span class="jadwal__nama"><span class="arab">${s.arab}</span><span class="latin">${s.nama}</span>${tanda}</span>
        <span class="jadwal__jam">${formatJam(jam, state.format)}</span>
      </li>`;
    }).join('');
    el.jadwalTanggal.textContent = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(kini);
  }

  function renderHero(waktu) {
    const kini = new Date();
    const n = berikutnya(kini, waktu);
    const info = SHOLAT.find((s) => s.kunci === n.kunci);
    el.heroNama.textContent = info.nama;
    el.heroArab.textContent = info.arab;
    el.heroJam.textContent = formatJam(waktu[n.kunci], state.format);
    el.heroLabel.textContent = n.besok ? 'Subuh berikutnya · besok' : 'Sholat berikutnya';
    el.lafaz.hidden = n.kunci !== 'subuh';
    el.heroTanggal.textContent = tanggalPanjang(kini);
    el.heroHijri.textContent = hijriah(kini);
    const k = kotaAktif();
    el.heroLokasi.textContent = `${k.nama} · ${Math.abs(k.lat).toFixed(2)}° ${k.lat < 0 ? 'LS' : 'LU'} ${k.lng.toFixed(2)}° BT`;

    $$('.jadwal__baris').forEach((b) => {
      b.dataset.status = b.dataset.kunci === n.kunci ? 'sekarang' : (b.dataset.status === 'sekarang' ? 'menunggu' : b.dataset.status);
    });

    return n;
  }

  function renderHitungMundur(target) {
    const sisa = Math.max(0, target - Date.now());
    const total = Math.floor(sisa / 1000);
    const j = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const d = total % 60;
    el.heroSisa.textContent = `${String(j).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(d).padStart(2, '0')}`;
  }

  function renderBulanan() {
    const kini = new Date();
    const tahun = kini.getFullYear(), bulan = kini.getMonth();
    const jumlah = new Date(tahun, bulan + 1, 0).getDate();
    const baris = [];
    for (let t = 1; t <= jumlah; t++) {
      const tgl = new Date(tahun, bulan, t);
      const w = waktuHariIni(tgl);
      const ini = t === kini.getDate();
      baris.push(`<tr data-hari-ini="${ini ? 'ya' : 'tidak'}"><td>${t}</td>${
        SHOLAT.map((s) => `<td>${formatJam(w[s.kunci], state.format)}</td>`).join('')
      }</tr>`);
    }
    el.bulananIsi.innerHTML = baris.join('');
    el.bulananNama.textContent = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(kini);
  }

  /* ---------- checklist ---------- */

  function renderCeklis() {
    const hari = tanggalISO(new Date());
    const sudah = state.ceklis[hari] || [];
    el.ceklis.innerHTML = SHOLAT_WAJIB.map((k) => {
      const info = SHOLAT.find((s) => s.kunci === k);
      const aktif = sudah.includes(k);
      return `<label class="checklist__baris" data-selesai="${aktif ? 'ya' : 'tidak'}">
        <input type="checkbox" data-ceklis="${k}" ${aktif ? 'checked' : ''}>
        <span>${info.nama}</span>
      </label>`;
    }).join('');
    el.ceklisTanggal.textContent = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date());
    $('#ceklis-progres').style.width = `${(sudah.length / SHOLAT_WAJIB.length) * 100}%`;
    const besok = new Date();
    besok.setDate(besok.getDate() + 1);
    const wBesok = hitungWaktu(besok, kotaAktif(), state.metode);
    const jamBesok = fixHour(wBesok.subuh + state.koreksi / 60);
    $('#ceklis-besok').textContent = `Besok Subuh ${formatJam(jamBesok, state.format)} — lafaz “ash-shalatu khairun minan-naum” dikumandangkan pada adzannya.`;
    renderStreak();
  }

  function renderStreak() {
    let jumlah = 0;
    const d = new Date();
    for (let i = 0; i < 400; i++) {
      const kunci = tanggalISO(d);
      const isi = state.ceklis[kunci] || [];
      if (SHOLAT_WAJIB.every((k) => isi.includes(k))) {
        jumlah++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    el.streak.textContent = jumlah;
  }

  /* ---------- kiblat ---------- */

  function arahKiblat() {
    const k = kotaAktif();
    const dLng = KAABAH.lng - k.lng;
    const y = dsin(dLng) * dcos(KAABAH.lat);
    const x = dcos(k.lat) * dsin(KAABAH.lat) - dsin(k.lat) * dcos(KAABAH.lat) * dcos(dLng);
    return fixAngle(datan2(y, x));
  }

  function renderKiblat() {
    const b = arahKiblat();
    const k = kotaAktif();
    el.kiblatDerajat.textContent = `${b.toFixed(1)}°`;
    el.kompasKet.textContent = `Dari ${k.nama}, Ka'bah berada pada ${b.toFixed(1)}° dari utara sejati (searah jarum jam).`;
    posisiKiblat(b, null);

    const jarak = jarakKaabah(k);
    $('#kiblat-jarak').textContent = `${Math.round(jarak).toLocaleString('id-ID')} km`;
    $('#kiblat-arah').textContent = arahMataAngin(b);
  }

  function jarakKaabah(k) {
    const R = 6371;
    const dLat = (KAABAH.lat - k.lat) * D2R;
    const dLng = (KAABAH.lng - k.lng) * D2R;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(k.lat * D2R) * Math.cos(KAABAH.lat * D2R) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function arahMataAngin(b) {
    const nama = ['utara', 'timur laut', 'timur', 'tenggara', 'selatan', 'barat daya', 'barat', 'barat laut'];
    return nama[Math.round(b / 45) % 8];
  }

  function posisiKiblat(bearing, heading) {
    const sudut = heading === null ? bearing : fixAngle(bearing - heading);
    el.jarum.style.transform = `rotate(${sudut}deg)`;
    el.kaabah.style.transform = `rotate(${sudut}deg) translateY(-34px)`;
  }

  /* ---------- tasbih ---------- */

  function renderTasbih() {
    const t = state.tasbih;
    el.tasbihAngka.textContent = t.n;
    el.tasbihPutaran.textContent = `putaran ${t.putaran}`;
    el.tasbihTarget.textContent = `target ${t.target}`;
    el.tasbihPilih.value = String(t.target);
  }

  /* ===================================================================
   * 5. AUDIO & PENGINGAT
   * =================================================================== */

  const batangGelombang = [];
  for (let i = 0; i < 26; i++) {
    const b = document.createElement('i');
    b.style.height = `${18 + Math.random() * 40}%`;
    el.gelombang.appendChild(b);
    batangGelombang.push(b);
  }

  let animasiGelombang = null;

  function gelombang(hidup) {
    el.gelombang.dataset.aktif = hidup ? 'ya' : 'tidak';
    if (animasiGelombang) { clearInterval(animasiGelombang); animasiGelombang = null; }
    if (!hidup) {
      batangGelombang.forEach((b, i) => { b.style.height = `${18 + ((i * 37) % 40)}%`; });
      return;
    }
    animasiGelombang = setInterval(() => {
      batangGelombang.forEach((b) => { b.style.height = `${16 + Math.random() * 78}%`; });
    }, 160);
  }

  function putarAdzan(pemicu) {
    el.audio.volume = state.volume / 100;
    const janji = el.audio.play();
    if (janji && janji.catch) {
      janji.catch(() => {
        el.status.textContent = 'klik untuk bunyi';
        tampilPita('Adzan', 'Peramban memblokir pemutaran otomatis. Ketuk tombol putar untuk mendengarkan.');
      });
    } else {
      el.status.textContent = pemicu === 'otomatis' ? 'adzan otomatis' : 'memutar';
    }
  }

  el.audio.addEventListener('play', () => {
    el.ikon.innerHTML = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';
    el.status.textContent = 'memutar adzan';
    gelombang(true);
  });

  el.audio.addEventListener('ended', () => {
    el.ikon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    el.status.textContent = 'selesai';
    gelombang(false);
  });

  el.audio.addEventListener('pause', () => {
    el.ikon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    gelombang(false);
  });

  el.putar.addEventListener('click', () => {
    if (el.audio.paused) {
      putarAdzan('manual');
      mulaiIqamah();
    } else {
      el.audio.pause();
      el.status.textContent = 'dijeda';
    }
  });

  el.volume.addEventListener('input', (e) => {
    state.volume = +e.target.value;
    el.audio.volume = state.volume / 100;
    el.nilaiVolume.textContent = `${state.volume}%`;
    simpan();
  });

  el.iqamah.addEventListener('input', (e) => {
    state.iqamah = +e.target.value;
    el.nilaiIqamah.textContent = `${state.iqamah} menit`;
    simpan();
  });

  el.auto.addEventListener('change', (e) => { state.auto = e.target.checked; simpan(); });

  const elPengingat = $('#pengingat');
  elPengingat.value = String(state.pengingat);
  elPengingat.addEventListener('change', () => { state.pengingat = +elPengingat.value; simpan(); });

  $('#izin-notif').addEventListener('click', async () => {
    if (!('Notification' in window)) {
      tampilPita('Notifikasi', 'Peramban ini tidak mendukung notifikasi.');
      return;
    }
    const izin = await Notification.requestPermission();
    tampilPita('Notifikasi', izin === 'granted'
      ? 'Izin diberikan. Pengingat akan muncul selama halaman ini terbuka.'
      : 'Izin ditolak. Pengingat hanya tampil di dalam halaman.');
  });

  let iqamahTimer = null;

  function mulaiIqamah() {
    if (iqamahTimer) clearInterval(iqamahTimer);
    if (!state.iqamah) {
      el.iqamahKet.textContent = 'Jeda iqamah dimatikan.';
      return;
    }
    const selesai = Date.now() + state.iqamah * 60000;
    const tik = () => {
      const sisa = selesai - Date.now();
      if (sisa <= 0) {
        clearInterval(iqamahTimer);
        iqamahTimer = null;
        el.iqamahKet.textContent = 'Waktu iqamah tiba.';
        return;
      }
      const m = Math.floor(sisa / 60000);
      const d = Math.floor((sisa % 60000) / 1000);
      el.iqamahKet.textContent = `Iqamah dalam ${m}:${String(d).padStart(2, '0')}`;
    };
    tik();
    iqamahTimer = setInterval(tik, 1000);
  }

  function tampilPita(judul, isi) {
    const lama = $('.pita');
    if (lama) lama.remove();
    const p = document.createElement('div');
    p.className = 'pita';
    p.innerHTML = `<div><strong>${judul}</strong><p>${isi}</p></div>`;
    const tutup = document.createElement('button');
    tutup.className = 'tombol';
    tutup.textContent = 'Tutup';
    tutup.addEventListener('click', () => p.remove());
    p.appendChild(tutup);
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 12000);
  }

  let adzanTerakhir = null;
  let ingatTerakhir = sessionStorage.getItem('sholat.ingat') || null;

  function periksaJadwal(waktu) {
    const kini = new Date();
    const kunciHari = tanggalISO(kini);

    for (const k of SHOLAT_WAJIB) {
      const d = tanggalDariJam(kini, waktu[k]);
      const selisih = kini - d;

      // adzan otomatis
      if (state.auto && selisih >= 0 && selisih < 45000 && adzanTerakhir !== kunciHari + k) {
        adzanTerakhir = kunciHari + k;
        const info = SHOLAT.find((s) => s.kunci === k);
        putarAdzan('otomatis');
        mulaiIqamah();
        tampilPita(`Waktu ${info.nama}`, k === 'subuh'
          ? 'Adzan Subuh — ash-shalatu khairun minan-naum.'
          : 'Sudah masuk waktu sholat.');
      }

      // pengingat sebelum
      if (state.pengingat > 0) {
        const sisaMenit = (d - kini) / 60000;
        const tanda = kunciHari + k;
        if (sisaMenit > 0 && sisaMenit <= state.pengingat && ingatTerakhir !== tanda) {
          ingatTerakhir = tanda;
          try { sessionStorage.setItem('sholat.ingat', tanda); } catch (e) { /* mode privat */ }
          const info = SHOLAT.find((s) => s.kunci === k);
          const pesan = `${info.nama} ${formatJam(waktu[k], state.format)} — ${Math.ceil(sisaMenit)} menit lagi.`;
          if ('Notification' in window && Notification.permission === 'granted') {
            try { new Notification('Waktu Sholat', { body: pesan }); } catch (e) { /* diabaikan */ }
          }
          tampilPita(`Menuju ${info.nama}`, pesan);
        }
      }
    }
  }

  /* ===================================================================
   * 6. PERISTIWA
   * =================================================================== */

  el.kota.addEventListener('change', () => {
    if (el.kota.value === 'gps') {
      if (!navigator.geolocation) {
        tampilPita('Lokasi', 'Peramban ini tidak mendukung geolokasi.');
        el.kota.value = state.kota;
        return;
      }
      tampilPita('Lokasi', 'Meminta izin lokasi perangkat…');
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        const id = 'perangkat';
        const ada = KOTA.findIndex((k) => k.id === id);
        const baru = { id, nama: 'Lokasi perangkat', lat: latitude, lng: longitude, tz: -new Date().getTimezoneOffset() / 60 };
        if (ada >= 0) KOTA[ada] = baru; else KOTA.push(baru);
        if (!KOTA.some((k) => k.id === id)) KOTA.push(baru);
        state.kota = id;
        isiPilihanKota();
        el.kota.value = id;
        simpan();
        renderSemua();
      }, () => {
        tampilPita('Lokasi', 'Izin lokasi ditolak. Pilih kota dari daftar.');
        el.kota.value = state.kota;
      }, { timeout: 10000 });
      return;
    }
    state.kota = el.kota.value;
    simpan();
    renderSemua();
  });

  el.metode.addEventListener('change', () => { state.metode = el.metode.value; simpan(); renderSemua(); });
  el.koreksi.addEventListener('input', () => { state.koreksi = +el.koreksi.value || 0; simpan(); renderSemua(); });
  el.format.addEventListener('change', () => { state.format = el.format.value; simpan(); renderSemua(); });

  el.ceklis.addEventListener('change', (e) => {
    const kotak = e.target.closest('input[data-ceklis]');
    if (!kotak) return;
    const hari = tanggalISO(new Date());
    const daftar = new Set(state.ceklis[hari] || []);
    if (kotak.checked) daftar.add(kotak.dataset.ceklis); else daftar.delete(kotak.dataset.ceklis);
    state.ceklis[hari] = Array.from(daftar);
    simpan();
    renderCeklis();
  });

  el.tasbihPilih.addEventListener('change', () => {
    state.tasbih.target = +el.tasbihPilih.value;
    state.tasbih.n = 0;
    simpan();
    renderTasbih();
  });

  $('#tasbih-tambah').addEventListener('click', () => {
    const t = state.tasbih;
    t.n++;
    if (t.n >= t.target) {
      t.putaran++;
      t.n = 0;
      el.tasbihAngka.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }],
        { duration: 320, easing: 'ease-out' }
      );
    }
    simpan();
    renderTasbih();
  });

  $('#tasbih-reset').addEventListener('click', () => {
    state.tasbih.n = 0;
    state.tasbih.putaran = 0;
    simpan();
    renderTasbih();
  });

  $('#pakai-kompas').addEventListener('click', async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const izin = await DeviceOrientationEvent.requestPermission();
        if (izin !== 'granted') { tampilPita('Kompas', 'Izin sensor ditolak.'); return; }
      } catch (e) { tampilPita('Kompas', 'Sensor tidak dapat diakses.'); return; }
    }
    if (!('DeviceOrientationEvent' in window)) {
      tampilPita('Kompas', 'Perangkat ini tidak memiliki sensor arah.');
      return;
    }
    const b = arahKiblat();
    window.addEventListener('deviceorientationabsolute', tanganiOrientasi, true);
    window.addEventListener('deviceorientation', tanganiOrientasi, true);
    el.kiblatStatus.textContent = 'kompas aktif';

    function tanganiOrientasi(ev) {
      const heading = typeof ev.webkitCompassHeading === 'number' ? ev.webkitCompassHeading : (ev.alpha === null ? null : fixAngle(360 - ev.alpha));
      if (heading === null) return;
      posisiKiblat(b, heading);
      el.kiblatStatus.textContent = `${heading.toFixed(0)}°`;
    }
  });

  /* ===================================================================
   * 7. SIKLUS
   * =================================================================== */

  let waktuSekarang = null;

  function renderSemua() {
    waktuSekarang = waktuHariIni(new Date());
    renderJadwal(waktuSekarang);
    const n = renderHero(waktuSekarang);
    renderHitungMundur(n.waktu.getTime());
    renderBulanan();
    renderKiblat();
  }

  function tik() {
    if (!waktuSekarang) return;
    const n = berikutnya(new Date(), waktuSekarang);
    renderHitungMundur(n.waktu.getTime());
    periksaJadwal(waktuSekarang);

    // ganti hari
    if (n.besok && n.waktu - Date.now() < 60000) return;
    const jamSekarang = new Date().getHours();
    if (jamSekarang === 0 && new Date().getMinutes() === 0) renderSemua();
  }

  function mulai() {
    isiPilihanKota();
    el.metode.value = state.metode;
    el.koreksi.value = state.koreksi;
    el.format.value = state.format;
    el.volume.value = state.volume;
    el.nilaiVolume.textContent = `${state.volume}%`;
    el.auto.checked = state.auto;
    el.iqamah.value = state.iqamah;
    el.nilaiIqamah.textContent = `${state.iqamah} menit`;
    el.audio.volume = state.volume / 100;
    renderTasbih();
    renderCeklis();
    renderSemua();
    setInterval(tik, 1000);
    setInterval(renderSemua, 300000);
  }

  mulai();
})();
