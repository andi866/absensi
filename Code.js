/****************************************************
 * ABSENSI PROMOTOR ELS.ID
 * V12.1 STABLE - Trigger Permission Fix
 ****************************************************/

const SHEET = {
  CONFIG: 'CONFIG',
  PROMOTOR: 'DATA_PROMOTOR',
  MANAGER: 'DATA_MANAGER',
  LOKASI: 'LOKASI_TOKO',
  SHIFT: 'SHIFT_SETTING',
  RAW: 'RAW_JADWAL',
  PROSES: 'JADWAL_PROSES',
  ABSENSI: 'ABSENSI',
  KOREKSI: 'REQUEST_KOREKSI',
  IZIN: 'REQUEST_IZIN_CUTI',
  INFO: 'INFO_PERUSAHAAN',
};

const APP_CONFIG = {
  TIMEZONE: 'Asia/Jakarta',
  // Semua data Drive dikumpulkan di SATU folder utama, isinya sub-folder di bawah ini.
  ROOT_FOLDER_NAME: 'ABSENSI ELS.ID',
  FOTO_FOLDER_NAME: 'Foto Absensi',
  FOTO_PROFIL_FOLDER_NAME: 'Foto Profil',
  FOTO_DASAR_FOLDER_NAME: 'Foto Dasar',
  LAMPIRAN_FOLDER_NAME: 'Lampiran Pengajuan',
  EXPORT_FOLDER_NAME: 'Export Excel',
  BACKUP_FOLDER_NAME: 'Backup',
  REKAP_FOLDER_NAME: 'Rekap Bulanan',
  // Nama folder versi lama -> otomatis dipindahkan ke folder utama saat pertama dipakai.
  LEGACY_FOLDER_NAMES: {
    'Foto Absensi': ['ABSENSI_PROMOTOR_ELS_FOTO'],
    'Foto Profil': ['ELS_FOTO_PROFIL'],
    'Foto Dasar': ['ELS_FOTO_DASAR'],
    'Lampiran Pengajuan': ['ABSENSI_PROMOTOR_ELS_LAMPIRAN'],
    'Export Excel': ['ABSENSI_PROMOTOR_ELS_EXPORT'],
    'Backup': ['ABSENSI_PROMOTOR_ELS_BACKUP']
  },
  APP_TITLE: 'Absensi Promotor ELS.ID',
  TOLERANSI_TERLAMBAT_MENIT: 0
};

/****************************************************
 * KEAMANAN LOGIN: PIN + SESSION TOKEN
 * V13.0 - Ditambahkan supaya login tidak lagi cuma
 * modal email (celah: siapapun tau email bisa masuk).
 ****************************************************/
const AUTH_CONFIG = {
  PIN_LENGTH: 6,
  MAX_FAILED_ATTEMPTS: 5,
  LOCK_MINUTES: 15,
  SESSION_HOURS: 6, // batas maksimum CacheService Apps Script (lapisan cepat)
  SESSION_DAYS: 30, // sesi panjang disimpan di PropertiesService, diperpanjang otomatis saat dipakai
  ACTIVATION_CODE_HOURS: 24
};

// Dinaikkan setiap ada perubahan; ditampilkan di layar Profil bersama versi aplikasi (index.html) untuk memastikan deploy sudah benar.
const APP_VERSION = '2026-11-06.1';

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  // ?ping=1 -> balasan JSON kecil. Dipakai untuk memastikan web app bisa dipanggil dari aplikasi yang di-hosting di GitHub.
  if (e && e.parameter && e.parameter.ping) {
    return jsonOut_({ ok: true, app: APP_CONFIG.APP_TITLE, version: APP_VERSION });
  }
  const out = HtmlService
    .createHtmlOutputFromFile('index')
    .setTitle(APP_CONFIG.APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  // Logo untuk tab & pintasan layar utama. Dipasang di halaman LUAR milik Google (hanya itu yang dibaca HP saat membuat pintasan);
  // ikon di dalam index.html tidak terbaca karena aplikasi berjalan di dalam bingkai. Diisi lewat menu "17. Pasang Logo Aplikasi".
  try {
    const logo = getLogoUrl_();
    if (logo) out.setFaviconUrl(logo);
  } catch (e) {}
  return out;
}

/**
 * API untuk aplikasi yang di-hosting di LUAR Apps Script (mis. GitHub Pages). Aplikasi mengirim
 *   POST  {"fn":"apiVerifyPin","args":[{...}]}
 * lalu fungsi bernama itu dijalankan dan hasilnya dibalas sebagai JSON {ok:true,value} atau {ok:false,error}.
 * Hanya fungsi berawalan "api" (tanpa garis bawah di akhir) yang boleh dipanggil: sama persis dengan yang sudah bisa dipanggil
 * lewat google.script.run, dan setiap fungsi tetap memeriksa sesi/PIN sendiri.
 */
function doPost(e) {
  let out;
  try {
    const raw = e && e.postData && e.postData.contents;
    let req;
    try { req = JSON.parse(raw || '{}'); } catch (x) { throw new Error('Permintaan tidak valid.'); }
    const fn = String((req && req.fn) || '');
    if (!/^api[A-Z][A-Za-z0-9]*$/.test(fn)) throw new Error('Fungsi tidak dikenal.');
    const target = globalThis[fn];
    if (typeof target !== 'function') throw new Error('Fungsi tidak dikenal.');
    const args = Array.isArray(req.args) ? req.args : [];
    const value = target.apply(null, args);
    out = { ok: true, value: value === undefined ? null : value };
  } catch (err) {
    out = { ok: false, error: String((err && err.message) || err) };
  }
  return jsonOut_(out);
}

function getLogoUrl_() {
  try { return PropertiesService.getScriptProperties().getProperty('LOGO_URL') || ''; } catch (e) { return ''; }
}

const LOGO_PNG_B64 = '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';

/** Menu 17: simpan logo jam ELS ke Drive (publik, hanya-lihat) lalu pasang sebagai ikon aplikasi. Aman dijalankan berulang. */
function pasangLogoAplikasi() {
  const props = PropertiesService.getScriptProperties();
  let file = null;
  const savedId = props.getProperty('LOGO_FILE_ID');
  if (savedId) { try { file = DriveApp.getFileById(savedId); } catch (e) { file = null; } }
  if (!file) {
    const blob = Utilities.newBlob(Utilities.base64Decode(LOGO_PNG_B64), 'image/png', 'ELS-Absensi-Logo.png');
    file = DriveApp.createFile(blob);
    props.setProperty('LOGO_FILE_ID', file.getId());
  }
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const url = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w256';
  props.setProperty('LOGO_URL', url);
  const pesan = 'Logo terpasang.\n\n1) Deploy > Kelola deployment > Edit > New version > Deploy.\n2) Di HP: hapus pintasan lama, buka aplikasi, lalu buat pintasan lagi (ikon lama tersimpan di HP).\n\nFile logo: ' + file.getUrl();
  Logger.log(pesan);
  // Kotak pesan hanya ada kalau dijalankan dari menu di Google Sheet; dari tombol Run di editor, cukup dicatat di log.
  try { SpreadsheetApp.getUi().alert(pesan); } catch (e) {}
  return url;
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ELS Absensi')
    .addItem('0. Izinkan Akses Drive', 'setupDriveAuthorization')
    .addItem('1. Setup Header Output', 'setupHeaderOutput')
    .addItem('2. Cek Struktur Sheet', 'cekStrukturSheet')
    .addItem('3. Proses RAW_JADWAL', 'prosesRawJadwal')
    .addItem('4. Terapkan Koreksi Disetujui', 'terapkanKoreksiDisetujui')
    .addItem('5. Setup Config Default', 'ensureConfigDefaults_')
    .addItem('6. Audit Jadwal Tanpa Email', 'auditJadwalTanpaEmail')
    .addItem('7. Sinkron Koreksi Shift Disetujui', 'syncKoreksiShiftDisetujui')
    .addItem('8. Izinkan Export Excel', 'setupExportExcelAuthorization')
    .addItem('9. Backup Manual Sekarang', 'runManualBackup')
    .addItem('10. Pasang Backup Otomatis Harian', 'installDailyBackupTrigger')
    .addItem('11. Setup Kolom PIN Login', 'ensurePinColumns_')
    .addItem('12. Rapikan Folder Drive (1 folder ABSENSI)', 'rapikanFolderDrive')
    .addItem('13. Buat Rekap Bulan Ini Sekarang', 'buatRekapBulanIni')
    .addItem('14. Pasang Rekap Otomatis Harian', 'pasangRekapOtomatis')
    .addItem('15. Diagnosa Sesi Login', 'diagnosaSesiLogin')
    .addItem('16. Rapikan Sesi Login', 'rapikanSesiLogin')
    .addItem('17. Pasang Logo Aplikasi', 'pasangLogoAplikasi')
    .addItem('18. Diagnosa Lokasi Toko', 'diagnosaLokasiToko')
    .addToUi();
}

function setupDriveAuthorization() {
  const fotoFolder = getOrCreateFolder_(APP_CONFIG.FOTO_FOLDER_NAME);
  const lampiranFolder = getOrCreateFolder_(APP_CONFIG.LAMPIRAN_FOLDER_NAME);
  const exportFolder = getOrCreateFolder_(APP_CONFIG.EXPORT_FOLDER_NAME);
  const backupFolder = getOrCreateFolder_(APP_CONFIG.BACKUP_FOLDER_NAME);

  Logger.log('Akses Google Drive aktif.');
  Logger.log('Folder foto: ' + fotoFolder.getName());
  Logger.log('Folder lampiran: ' + lampiranFolder.getName());
  Logger.log('Folder export: ' + exportFolder.getName());
  Logger.log('Folder backup: ' + backupFolder.getName());

  return {
    ok: true,
    message: 'Akses Google Drive aktif.',
    fotoFolder: fotoFolder.getName(),
    lampiranFolder: lampiranFolder.getName(),
    exportFolder: exportFolder.getName(),
    backupFolder: backupFolder.getName()
  };
}

function setupExportExcelAuthorization() {
  const exportFolder = getOrCreateFolder_(APP_CONFIG.EXPORT_FOLDER_NAME);

  // Membuat file spreadsheet sementara agar Google meminta izin:
  // https://www.googleapis.com/auth/spreadsheets
  const temp = SpreadsheetApp.create('ELS_ABSENSI_EXPORT_AUTH_TEST');
  const file = DriveApp.getFileById(temp.getId());
  file.setTrashed(true);

  // V10.8: sengaja memanggil UrlFetchApp agar Google meminta izin:
  // https://www.googleapis.com/auth/script.external_request
  const response = UrlFetchApp.fetch('https://www.google.com/generate_204', {
    muteHttpExceptions: true
  });

  Logger.log('Izin Export Excel aktif.');
  Logger.log('Folder export: ' + exportFolder.getName());
  Logger.log('File test sudah dibuat lalu dipindahkan ke trash: ' + temp.getId());
  Logger.log('Tes UrlFetch response code: ' + response.getResponseCode());

  return {
    ok: true,
    message: 'Izin Export Excel dan UrlFetch aktif. Setelah ini deploy ulang Web App dengan Version: New version.',
    exportFolder: exportFolder.getName(),
    urlFetchResponseCode: response.getResponseCode()
  };
}


/**
 * KHUSUS SETUP AWAL: dipakai SEKALI SAJA supaya manager pertama
 * (yang belum ada manager lain buat generate-in kode aktivasi) bisa
 * bikin PIN tanpa lewat alur aktivasi normal.
 *
 * CARA PAKAI:
 * 1. Ganti EMAIL_BOOTSTRAP dan PIN_BOOTSTRAP di bawah sesuai kebutuhan.
 * 2. Di Apps Script editor, pilih fungsi "bootstrapFirstManagerPin" di
 *    dropdown atas, klik Run. Izinkan akses kalau diminta.
 * 3. Buka web app, login pakai email itu + PIN yang barusan diset.
 * 4. Setelah berhasil login, SEGERA reset PIN ini lewat menu
 *    "Kelola PIN Login Tim" (isi email diri sendiri di kolom target,
 *    klik Reset PIN), lalu generate kode aktivasi buat diri sendiri
 *    dan buat PIN baru yang cuma Mas Andi tau.
 * 5. Kalau sudah tidak dipakai lagi, boleh dihapus fungsi ini.
 */
function bootstrapFirstManagerPin() {
  const EMAIL_BOOTSTRAP = 'andi@elsnotebookcenter.com';
  const PIN_BOOTSTRAP = '191281'; // ganti sesuka hati, wajib 6 digit angka

  if (!isValidPinFormat_(PIN_BOOTSTRAP)) throw new Error('PIN_BOOTSTRAP harus 6 digit angka.');

  ensurePinColumns_();
  const found = findAccountPin_(EMAIL_BOOTSTRAP);
  if (!found) throw new Error('Email ' + EMAIL_BOOTSTRAP + ' tidak ditemukan di DATA_PROMOTOR/DATA_MANAGER.');

  if (found.account.pinHash) {
    Logger.log('PIN untuk ' + EMAIL_BOOTSTRAP + ' sudah pernah dibuat. Tidak ditimpa. ' +
      'Kalau mau reset, pakai menu Reset PIN di web app setelah ada manager yang login.');
    return;
  }

  const sheet = getSs_().getSheetByName(found.sheetName);
  const pinCol = ensureColumn_(sheet, 'PIN Hash');
  sheet.getRange(found.account.rowNumber, pinCol).setValue(hashPin_(PIN_BOOTSTRAP, EMAIL_BOOTSTRAP));

  Logger.log('PIN berhasil diset untuk ' + EMAIL_BOOTSTRAP + '. Silakan login pakai PIN: ' + PIN_BOOTSTRAP);
}

/****************************************************
 * PIN, AKTIVASI, DAN SESSION TOKEN
 ****************************************************/

// Pastikan kolom "PIN Hash" ada di DATA_PROMOTOR dan DATA_MANAGER.
function ensurePinColumns_() {
  const ss = getSs_();
  const promotorSheet = ss.getSheetByName(SHEET.PROMOTOR);
  const managerSheet = ss.getSheetByName(SHEET.MANAGER);
  if (promotorSheet) ensureColumn_(promotorSheet, 'PIN Hash');
  if (managerSheet) ensureColumn_(managerSheet, 'PIN Hash');
  return { ok: true, message: 'Kolom PIN Hash siap di DATA_PROMOTOR dan DATA_MANAGER.' };
}

function isValidPinFormat_(pin) {
  const re = new RegExp('^\\d{' + AUTH_CONFIG.PIN_LENGTH + '}$');
  return re.test(String(pin || '').trim());
}

// Hash PIN pakai SHA-256 + salt (email + salt tetap), disimpan sebagai hex string.
function hashPin_(pin, email) {
  const raw = String(pin).trim() + '::' + String(email).trim().toLowerCase() + '::ELSID_PIN_SALT_V1';
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

// Cari akun (promotor/manager) berikut nomor barisnya untuk keperluan update PIN.
function getAccountPinInfo_(sheetName, emailKey, email) {
  const rows = getSheetObjectsWithRow_(sheetName);
  const target = String(email || '').trim().toLowerCase();

  const row = rows.find(function (r) {
    return String(r[emailKey] || '').trim().toLowerCase() === target &&
      normalizeText_(r.status) === 'AKTIF';
  });

  if (!row) return null;

  return {
    rowNumber: row.__rowNumber,
    pinHash: String(row.pinhash || '').trim()
  };
}

function findAccountPin_(email) {
  const promotor = getAccountPinInfo_(SHEET.PROMOTOR, 'email', email);
  if (promotor) return { role: 'PROMOTOR', sheetName: SHEET.PROMOTOR, account: promotor };

  const manager = getAccountPinInfo_(SHEET.MANAGER, 'emailmanager', email);
  if (manager) return { role: 'MANAGER', sheetName: SHEET.MANAGER, account: manager };

  return null;
}

// --- Rate limit percobaan PIN salah ---
function getLoginLockInfo_(email) {
  const cache = CacheService.getScriptCache();
  const lockUntil = Number(cache.get('PIN_LOCK_' + email) || 0);
  if (lockUntil && Date.now() < lockUntil) {
    return { locked: true, minutesLeft: Math.ceil((lockUntil - Date.now()) / 60000) };
  }
  return { locked: false };
}

function registerLoginFail_(email) {
  const cache = CacheService.getScriptCache();
  const key = 'PIN_FAIL_' + email;
  const count = Number(cache.get(key) || 0) + 1;

  if (count >= AUTH_CONFIG.MAX_FAILED_ATTEMPTS) {
    cache.put('PIN_LOCK_' + email, String(Date.now() + AUTH_CONFIG.LOCK_MINUTES * 60000), AUTH_CONFIG.LOCK_MINUTES * 60);
    cache.remove(key);
    return { locked: true, minutesLeft: AUTH_CONFIG.LOCK_MINUTES };
  }

  cache.put(key, String(count), 30 * 60);
  return { locked: false, remaining: AUTH_CONFIG.MAX_FAILED_ATTEMPTS - count };
}

function clearLoginFailCount_(email) {
  const cache = CacheService.getScriptCache();
  cache.remove('PIN_FAIL_' + email);
  cache.remove('PIN_LOCK_' + email);
}

// --- Session token, biar auto-refresh tidak perlu input PIN ulang tiap kali ---
function sessionProps_() { return PropertiesService.getScriptProperties(); }

const SESSION_MAX_PER_EMAIL = 8; // perangkat/peramban yang boleh login bersamaan per akun (yang tertua digeser)

function sessUserKey_(em) { return 'SU_' + em; }

// Peta {token: waktuKedaluwarsa} milik satu akun. Galat layanan sengaja DILEMPAR (bukan dianggap kosong).
function loadUserSessions_(props, em) {
  const raw = props.getProperty(sessUserKey_(em));
  if (!raw) return {};
  try {
    const o = JSON.parse(raw);
    return (o && typeof o === 'object') ? o : {};
  } catch (e) { return {}; }
}

// Simpan: buang yang kedaluwarsa, batasi jumlah, dan matikan juga cache token yang tergeser.
function saveUserSessions_(props, em, map) {
  const now = Date.now();
  const keep = Object.keys(map).filter(function (t) { return Number(map[t]) > now; })
    .sort(function (a, b) { return map[b] - map[a]; })
    .slice(0, SESSION_MAX_PER_EMAIL);
  const out = {};
  keep.forEach(function (t) { out[t] = map[t]; });
  props.setProperty(sessUserKey_(em), JSON.stringify(out));
  try {
    const cache = CacheService.getScriptCache();
    Object.keys(map).forEach(function (t) { if (!(t in out)) cache.remove('SESSION_' + t); });
  } catch (e) {}
  return out;
}

// Simpan sesi panjang. Dicoba 2x (setelah membersihkan yang kedaluwarsa). Mengembalikan true/false.
function persistSession_(em, token) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const props = sessionProps_();
      const map = loadUserSessions_(props, em);
      map[token] = Date.now() + AUTH_CONFIG.SESSION_DAYS * 86400000;
      saveUserSessions_(props, em, map);
      return true;
    } catch (e) {
      Logger.log('Simpan sesi gagal (percobaan ' + (attempt + 1) + '): ' + e.message);
      if (attempt === 0) {
        try { purgeExpiredSessions_(); } catch (e2) {}
        Utilities.sleep(150);
      }
    }
  }
  return false;
}

let __SESSION_PERSISTED__ = true; // hasil simpan sesi terakhir di eksekusi ini (dibaca apiVerifyPin)

function createSessionToken_(email) {
  const token = Utilities.getUuid();
  const em = String(email).trim().toLowerCase();
  CacheService.getScriptCache().put('SESSION_' + token, em, AUTH_CONFIG.SESSION_HOURS * 60 * 60);
  __SESSION_PERSISTED__ = persistSession_(em, token);
  if (Math.random() < 0.02) { try { purgeExpiredSessions_(); } catch (e) {} }
  return token;
}

// Cari pemilik token di penyimpanan panjang (dipanggil kalau cache 6 jam habis).
function lookupLongSession_(token, emailHint, cache) {
  const props = sessionProps_();
  const hint = String(emailHint || '').trim().toLowerCase();
  const now = Date.now();
  if (hint) {
    const map = loadUserSessions_(props, hint);
    const exp = Number(map[token]);
    if (exp && exp > now) {
      cache.put('SESSION_' + token, hint, AUTH_CONFIG.SESSION_HOURS * 60 * 60);
      if (exp - now < 7 * 86400000) {
        map[token] = now + AUTH_CONFIG.SESSION_DAYS * 86400000;
        saveUserSessions_(props, hint, map);
      }
      return hint;
    }
  }
  // Format lama (satu properti per token): tetap diterima, lalu dipindahkan ke format baru supaya penyimpanan tidak menumpuk.
  const raw = props.getProperty('SESS_' + token);
  if (!raw) return '';
  const parts = String(raw).split('|');
  const em = parts[0];
  const exp2 = Number(parts[1]);
  if (!em || !exp2 || now > exp2) { props.deleteProperty('SESS_' + token); return ''; }
  cache.put('SESSION_' + token, em, AUTH_CONFIG.SESSION_HOURS * 60 * 60);
  try {
    const map2 = loadUserSessions_(props, em);
    map2[token] = now + AUTH_CONFIG.SESSION_DAYS * 86400000;
    saveUserSessions_(props, em, map2);
    props.deleteProperty('SESS_' + token);
  } catch (e) { /* migrasi gagal: sesi lama tetap berlaku, dicoba lagi lain kali */ }
  return em;
}

// Mengembalikan email pemilik token, atau '' bila token tidak sah/kedaluwarsa.
// Galat layanan (Properties sibuk/kuota) BUKAN berarti sesi habis: dicoba ulang, lalu dilempar sebagai "server sibuk"
// supaya aplikasi tidak mengeluarkan pengguna hanya karena gangguan sesaat.
function getEmailFromToken_(token, emailHint) {
  if (!token) return '';
  const cache = CacheService.getScriptCache();
  const hit = cache.get('SESSION_' + token);
  if (hit) return String(hit);
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return lookupLongSession_(token, emailHint, cache);
    } catch (e) {
      lastErr = e;
      Utilities.sleep(150 * (attempt + 1));
    }
  }
  throw new Error('Server sedang sibuk, coba lagi sebentar.' + (lastErr && lastErr.message ? ' [' + lastErr.message + ']' : ''));
}

function revokeSessionsForEmail_(email) {
  const target = String(email || '').trim().toLowerCase();
  try {
    const props = sessionProps_();
    const cache = CacheService.getScriptCache();
    // format baru
    try {
      const map = loadUserSessions_(props, target);
      Object.keys(map).forEach(function (t) { cache.remove('SESSION_' + t); });
      props.deleteProperty(sessUserKey_(target));
    } catch (e) {}
    // format lama
    const all = props.getProperties();
    Object.keys(all).forEach(k => {
      if (k.indexOf('SESS_') !== 0) return;
      if (String(all[k]).split('|')[0] === target) {
        props.deleteProperty(k);
        cache.remove('SESSION_' + k.slice(5));
      }
    });
  } catch (e) {}
}

function purgeExpiredSessions_() {
  try {
    const props = sessionProps_();
    const all = props.getProperties();
    let removed = 0;
    Object.keys(all).forEach(k => {
      if (removed >= 25) return; // dibatasi: sisanya dibersihkan di kesempatan berikutnya
      if (k.indexOf('SESS_') !== 0) return;
      const exp = Number(String(all[k]).split('|')[1]);
      if (!exp || Date.now() > exp) { props.deleteProperty(k); removed++; }
    });
  } catch (e) {}
}

/**
 * Penanda "ada yang berubah" (disimpan di cache). Dipakai apiPing supaya aplikasi tahu kapan
 * harus memuat ulang, tanpa memuat data berat tiap beberapa detik.
 *   U = per orang, C = per cabang (dan ALL untuk admin), G = global
 */
function verKey_(type, id) { return 'VER_' + type + '_' + String(id || '').trim().toUpperCase().slice(0, 120); }

function bumpVer_(pairs) {
  const val = String(Date.now()) + String(Math.floor(Math.random() * 1000));
  const obj = {};
  pairs.forEach(p => { obj[verKey_(p[0], p[1])] = val; });
  try { CacheService.getScriptCache().putAll(obj, 21600); } catch (e) {}
}

function bumpCabangVer_(cabang, ownerEmail) {
  const pairs = [['C', cabang], ['C', 'ALL']];
  if (ownerEmail) pairs.push(['U', String(ownerEmail).toLowerCase()]);
  bumpVer_(pairs);
}

function readVer_(type, id) { return String(CacheService.getScriptCache().get(verKey_(type, id)) || '0'); }

/** Sangat ringan (tanpa baca sheet). Aplikasi memanggil ini tiap beberapa detik. */
/** Dipanggil saat layar login tampil: membangunkan server & menyiapkan cache pengaturan sebelum PIN dikirim. */
function apiWarmup(info) {
  try { getFaceConfig_(); } catch (err) { return { ok: false }; }
  try { if (info && info.screen === 'login') logLoginScreen_(info); } catch (e) {}
  return { ok: true };
}

// Catatan ringkas (25 terakhir) setiap kali layar login tampil: dari situ terlihat apakah HP kehilangan penyimpanannya
// (tidak punya email/token padahal pernah login), dan dari alamat (origin) mana aplikasi dibuka.
function logLoginScreen_(info) {
  const props = sessionProps_();
  let list = [];
  try { list = JSON.parse(props.getProperty('DIAG_LOGIN') || '[]'); } catch (e) { list = []; }
  list.push({
    t: Date.now(),
    o: String(info.origin || '').slice(0, 60),
    r: String(info.referrer || '').slice(0, 40),
    e: info.hadEmail ? 1 : 0,
    k: info.hadToken ? 1 : 0,
    s: String(info.storage || '').slice(0, 10),
    x: String(info.reason || '').slice(0, 10),
    u: String(info.ua || '').slice(0, 40)
  });
  props.setProperty('DIAG_LOGIN', JSON.stringify(list.slice(-25)));
}

/** Menu admin: laporan kondisi penyimpanan sesi login. */
function diagnosaSesiLogin() {
  const r = ringkasSesiLogin_();
  let msg = 'Penyimpanan sesi login\n\n' +
    'Akun dengan sesi (format baru): ' + r.akun + '\n' +
    'Sesi aktif (format baru): ' + r.tokenBaru + '\n' +
    'Sesi format lama (belum dipindah): ' + r.legacy + '\n' +
    'Properti lain: ' + r.lain + '\n' +
    'Perkiraan pemakaian: ' + Math.round(r.bytes / 1024) + ' KB dari batas 500 KB (' + Math.round(r.bytes / 5120) + '%)\n';
  if (r.bytes > 350 * 1024) msg += '\nPERINGATAN: penyimpanan hampir penuh. Jalankan menu "Rapikan Sesi Login".\n';
  msg += '\nLayar login tampil (25 catatan terakhir):\n' + r.layarLogin;
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
  return r;
}

function ringkasSesiLogin_() {
  const all = sessionProps_().getProperties();
  let akun = 0, tokenBaru = 0, legacy = 0, lain = 0, bytes = 0;
  const now = Date.now();
  Object.keys(all).forEach(function (k) {
    bytes += k.length + String(all[k]).length;
    if (k.indexOf('SU_') === 0) {
      akun++;
      try { const m = JSON.parse(all[k]); Object.keys(m).forEach(function (t) { if (Number(m[t]) > now) tokenBaru++; }); } catch (e) {}
    } else if (k.indexOf('SESS_') === 0) legacy++;
    else if (k !== 'DIAG_LOGIN') lain++;
  });
  let layarLogin = '(belum ada catatan)';
  try {
    const list = JSON.parse(all['DIAG_LOGIN'] || '[]');
    if (list.length) {
      const origins = {};
      list.forEach(function (x) { origins[x.o] = (origins[x.o] || 0) + 1; });
      const tanpaEmail = list.filter(function (x) { return !x.e; }).length;
      const adaEmailTanpaToken = list.filter(function (x) { return x.e && !x.k; }).length;
      const alasan = {};
      list.forEach(function (x) { const k = x.x || '-'; alasan[k] = (alasan[k] || 0) + 1; });
      const alasanTxt = Object.keys(alasan).map(function (k) { return k + '=' + alasan[k]; }).join(', ');
      layarLogin = list.length + ' kali (alasan: ' + alasanTxt + '); tanpa email tersimpan: ' + tanpaEmail + '; ada email tapi tanpa token: ' + adaEmailTanpaToken +
        '; penyimpanan HP bermasalah: ' + list.filter(function (x) { return x.s && x.s !== 'ok'; }).length +
        '\nAlamat (origin) berbeda: ' + Object.keys(origins).length + '\n' +
        Object.keys(origins).slice(0, 4).map(function (o) { return ' - ' + (o || '(kosong)') + ' x' + origins[o]; }).join('\n');
    }
  } catch (e) {}
  return { akun: akun, tokenBaru: tokenBaru, legacy: legacy, lain: lain, bytes: bytes, layarLogin: layarLogin };
}

/** Menu admin: pindahkan sesi format lama ke format ringkas (tidak ada yang dikeluarkan) dan buang yang kedaluwarsa. */
function rapikanSesiLogin() {
  const props = sessionProps_();
  const all = props.getProperties();
  const now = Date.now();
  const before = ringkasSesiLogin_().bytes;
  const live = {}; // email -> {token: exp}
  const legacyKeys = [];
  let expired = 0;
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('SESS_') !== 0) return;
    const parts = String(all[k]).split('|');
    const em = parts[0], exp = Number(parts[1]);
    legacyKeys.push([k, !!(em && exp && exp > now)]);
    if (!em || !exp || exp <= now) { expired++; return; }
    (live[em] = live[em] || {})[k.slice(5)] = exp;
  });
  const t0 = Date.now();
  // 1) buang yang sudah kedaluwarsa dulu (membebaskan kuota)
  legacyKeys.forEach(function (x) { if (!x[1] && Date.now() - t0 < 200000) props.deleteProperty(x[0]); });
  // 2) tulis ringkas per akun, 3) baru hapus properti lama yang masih berlaku
  let dipindah = 0;
  Object.keys(live).forEach(function (em) {
    const map = loadUserSessions_(props, em);
    Object.keys(live[em]).forEach(function (t) { map[t] = Math.max(Number(map[t]) || 0, live[em][t]); });
    saveUserSessions_(props, em, map);
    dipindah += Object.keys(live[em]).length;
  });
  legacyKeys.forEach(function (x) { if (x[1] && Date.now() - t0 < 230000) props.deleteProperty(x[0]); });
  const after = ringkasSesiLogin_();
  const msg = 'Rapikan sesi login selesai.\n\nKedaluwarsa dibuang: ' + expired + '\nSesi aktif dipindah: ' + dipindah +
    '\nPemakaian: ' + Math.round(before / 1024) + ' KB -> ' + Math.round(after.bytes / 1024) + ' KB\nTidak ada pengguna yang dikeluarkan.';
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
  return { expired: expired, dipindah: dipindah, sebelum: before, sesudah: after.bytes };
}

function apiPing(payload) {
  try {
    const data = payload || {};
    const email = String(data.email || '').trim().toLowerCase();
    if (!requireSession_(email, data.token)) return { ok: false, sessionExpired: true };
    const scope = String(data.cabang || '').trim() || 'ALL';
    // Promotor hanya perlu perubahan datanya sendiri (U) dan info global (G). Versi cabang (C) khusus manager:
    // kalau tidak, setiap absen satu orang membuat SEMUA promotor di cabang memuat ulang seluruh data.
    if (data.noCabang === true || data.noCabang === 'true') {
      return { ok: true, ver: [readVer_('U', email), readVer_('G', '')].join('|') };
    }
    return { ok: true, ver: [readVer_('U', email), readVer_('C', scope), readVer_('G', '')].join('|') };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

function requireSession_(email, token) {
  const target = String(email || '').trim().toLowerCase();
  const owner = getEmailFromToken_(token, target);
  return !!target && owner === target;
}

/**
 * Cek status email sebelum masuk layar PIN.
 * Tidak mengembalikan data apapun yang sensitif, aman dipanggil sebelum autentikasi.
 */
function apiCheckLoginEmail(emailInput) {
  try {
    const email = String(emailInput || '').trim().toLowerCase();
    if (!email) return { ok: false, message: 'Silakan masukkan email.' };

    ensurePinColumns_();

    const found = findAccountPin_(email);
    if (!found) {
      return { ok: false, needRegister: true, message: 'Email belum terdaftar sebagai promotor atau manager. Hubungi manager kamu.' };
    }

    const lock = getLoginLockInfo_(email);
    if (lock.locked) {
      return { ok: false, locked: true, message: 'Terlalu banyak percobaan PIN salah. Coba lagi dalam ' + lock.minutesLeft + ' menit.' };
    }

    return {
      ok: true,
      role: found.role,
      needSetPin: !found.account.pinHash
    };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

/**
 * Manager generate kode aktivasi 6 digit untuk promotor/manager lain
 * yang belum punya PIN. Kode diberikan manual (WA/lisan) oleh manager,
 * BUKAN oleh sistem otomatis, supaya identitas tetap diverifikasi manusia.
 */
function apiGenerateActivationCode(payload) {
  try {
    const data = payload || {};
    const managerEmail = String(data.managerEmail || '').trim().toLowerCase();
    const token = String(data.token || '').trim();
    const targetEmail = String(data.targetEmail || '').trim().toLowerCase();

    const manager = findManagerByEmail_(managerEmail);
    if (!manager) throw new Error('Email manager tidak terdaftar atau tidak aktif.');
    if (!requireSession_(managerEmail, token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');
    if (!targetEmail) throw new Error('Email tujuan wajib diisi.');

    const found = findAccountPin_(targetEmail);
    if (!found) throw new Error('Email ' + targetEmail + ' tidak ditemukan di DATA_PROMOTOR/DATA_MANAGER.');
    if (found.account.pinHash) throw new Error('Akun ini sudah punya PIN. Gunakan menu Reset PIN kalau lupa.');

    const code = String(Math.floor(100000 + Math.random() * 900000));
    CacheService.getScriptCache().put('ACTIVATE_' + targetEmail, code, AUTH_CONFIG.ACTIVATION_CODE_HOURS * 60 * 60);

    return {
      ok: true,
      message: 'Kode aktivasi dibuat. Berikan kode ini langsung ke ' + targetEmail + ' (berlaku 24 jam).',
      activationCode: code,
      targetEmail: targetEmail
    };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

/**
 * Manager reset PIN akun yang lupa PIN. PIN lama dihapus,
 * akun wajib minta kode aktivasi baru untuk set PIN lagi.
 */
function apiResetPin(payload) {
  try {
    const data = payload || {};
    const managerEmail = String(data.managerEmail || '').trim().toLowerCase();
    const token = String(data.token || '').trim();
    const targetEmail = String(data.targetEmail || '').trim().toLowerCase();

    const manager = findManagerByEmail_(managerEmail);
    if (!manager) throw new Error('Email manager tidak terdaftar atau tidak aktif.');
    if (!requireSession_(managerEmail, token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');

    const found = findAccountPin_(targetEmail);
    if (!found) throw new Error('Email ' + targetEmail + ' tidak ditemukan.');

    const sheet = getSs_().getSheetByName(found.sheetName);
    const pinCol = ensureColumn_(sheet, 'PIN Hash');
    sheet.getRange(found.account.rowNumber, pinCol).setValue('');
    clearLoginFailCount_(targetEmail);
    revokeSessionsForEmail_(targetEmail); // perangkat lama otomatis keluar

    return { ok: true, message: 'PIN untuk ' + targetEmail + ' sudah direset. Minta dia generate kode aktivasi baru untuk buat PIN.' };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

/**
 * Set PIN pertama kali. Wajib pakai kode aktivasi dari manager
 * supaya orang lain yang cuma tau email tidak bisa klaim akun duluan.
 */
function apiSetPin(payload) {
  try {
    const data = payload || {};
    const email = String(data.email || '').trim().toLowerCase();
    const activationCode = String(data.activationCode || '').trim();
    const pin = String(data.pin || '').trim();
    const confirmPin = String(data.confirmPin || '').trim();

    if (!email) throw new Error('Email kosong.');
    if (!isValidPinFormat_(pin)) throw new Error('PIN harus ' + AUTH_CONFIG.PIN_LENGTH + ' digit angka.');
    if (pin !== confirmPin) throw new Error('Konfirmasi PIN tidak cocok.');

    const found = findAccountPin_(email);
    if (!found) throw new Error('Email tidak terdaftar.');

    const savedCode = CacheService.getScriptCache().get('ACTIVATE_' + email);
    if (!savedCode || savedCode !== activationCode) {
      throw new Error('Kode verifikasi salah atau sudah kedaluwarsa. Klik "Kirim Kode ke Email" lagi.');
    }

    const sheet = getSs_().getSheetByName(found.sheetName);
    const pinCol = ensureColumn_(sheet, 'PIN Hash');
    sheet.getRange(found.account.rowNumber, pinCol).setValue(hashPin_(pin, email));

    CacheService.getScriptCache().remove('ACTIVATE_' + email);
    clearLoginFailCount_(email);

    return { ok: true, message: 'PIN berhasil disimpan. Silakan login pakai PIN barumu.' };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

/**
 * Kirim kode verifikasi 6 digit ke email yang bersangkutan (self-service).
 * Dipakai buat 2 skenario: bikin PIN pertama kali, ATAU reset PIN yang lupa.
 * Aman karena kodenya cuma bisa dibaca lewat inbox email orang itu sendiri,
 * bukan ditampilkan ke siapapun yang sekadar tau alamat emailnya.
 */
function apiRequestOtp(payload) {
  try {
    const data = payload || {};
    const email = String(data.email || '').trim().toLowerCase();
    if (!email) throw new Error('Email kosong.');

    const found = findAccountPin_(email);
    if (!found) throw new Error('Email ' + email + ' belum terdaftar di data promotor/manager. Hubungi manager untuk didaftarkan dulu.');

    const cache = CacheService.getScriptCache();
    const cooldownKey = 'OTP_COOLDOWN_' + email;
    if (cache.get(cooldownKey)) {
      Logger.log('OTP DITOLAK (cooldown) untuk ' + email);
      throw new Error('Tunggu sebentar sebelum minta kode lagi (maks 1x per 60 detik).');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    cache.put('ACTIVATE_' + email, code, AUTH_CONFIG.ACTIVATION_CODE_HOURS * 60 * 60);
    cache.put(cooldownKey, '1', 60);

    const subject = 'Kode Verifikasi Absensi ELS.ID';
    const body =
      'Halo,\n\n' +
      'Kode verifikasi PIN Absensi Promotor ELS.ID kamu:\n\n' +
      code + '\n\n' +
      'Masukkan kode ini di aplikasi untuk membuat atau reset PIN login. ' +
      'Kode berlaku selama ' + AUTH_CONFIG.ACTIVATION_CODE_HOURS + ' jam.\n\n' +
      'Kalau kamu tidak merasa meminta kode ini, abaikan saja email ini.\n\n' +
      '— Sistem Absensi ELS.ID';

    Logger.log('Mengirim OTP ' + code + ' ke ' + email + ' ...');

    MailApp.sendEmail(email, subject, body);

    Logger.log('MailApp.sendEmail selesai dipanggil untuk ' + email + ' (tidak error).');

    return {
      ok: true,
      message: 'Kode verifikasi sudah dikirim ke ' + email + '. Cek inbox (atau folder Spam/Promosi) ya.'
    };
  } catch (err) {
    Logger.log('OTP ERROR: ' + err.message);
    return { ok: false, message: err.message };
  }
}

/**
 * Verifikasi PIN saat login. Kalau benar, buatkan session token
 * dan langsung kembalikan initial data (menggantikan alur lama
 * yang cuma modal email tanpa verifikasi apapun).
 */
function apiVerifyPin(payload) {
  return withReadMemo_(function () { return apiVerifyPinImpl_(payload); });
}

function apiVerifyPinImpl_(payload) {
  try {
    const data = payload || {};
    const email = String(data.email || '').trim().toLowerCase();
    const pin = String(data.pin || '').trim();

    if (!email) throw new Error('Email kosong.');
    if (!isValidPinFormat_(pin)) throw new Error('PIN harus ' + AUTH_CONFIG.PIN_LENGTH + ' digit angka.');

    const lock = getLoginLockInfo_(email);
    if (lock.locked) {
      throw new Error('Terlalu banyak percobaan PIN salah. Coba lagi dalam ' + lock.minutesLeft + ' menit.');
    }

    const found = findAccountPin_(email);
    if (!found) throw new Error('Email tidak terdaftar.');
    if (!found.account.pinHash) throw new Error('PIN belum dibuat. Minta kode aktivasi ke manager dulu.');

    if (found.account.pinHash !== hashPin_(pin, email)) {
      const failInfo = registerLoginFail_(email);
      if (failInfo.locked) {
        throw new Error('PIN salah 5 kali berturut-turut. Akun dikunci sementara ' + failInfo.minutesLeft + ' menit.');
      }
      throw new Error('PIN salah. Sisa percobaan: ' + failInfo.remaining + '.');
    }

    clearLoginFailCount_(email);
    const token = createSessionToken_(email);
    const initialData = buildInitialDataForEmail_(email);
    initialData.token = token;
    initialData.sessionPersistent = __SESSION_PERSISTED__ !== false;
    return initialData;

  } catch (err) {
    return { ok: false, message: err.message };
  }
}

function apiLogout(payload) {
  const data = payload || {};
  const token = String(data.token || '').trim();
  let em = String(data.email || '').trim().toLowerCase();
  if (token) {
    const cache = CacheService.getScriptCache();
    if (!em) em = String(cache.get('SESSION_' + token) || ''); // aplikasi versi lama tidak mengirim email
    cache.remove('SESSION_' + token);
    try {
      const props = sessionProps_();
      props.deleteProperty('SESS_' + token);
      if (!em) {
        // cadangan: cari akun pemilik token di penyimpanan
        const all = props.getProperties();
        Object.keys(all).forEach(function (k) {
          if (k.indexOf('SU_') !== 0 || em) return;
          try { if (JSON.parse(all[k])[token]) em = k.slice(3); } catch (e2) {}
        });
      }
      if (em) {
        const map = loadUserSessions_(props, em);
        if (map[token]) { delete map[token]; saveUserSessions_(props, em, map); }
      }
    } catch (e) {}
  }
  return { ok: true };
}

/****************************************************
 * API WEB APP
 ****************************************************/

/**
 * Dipakai untuk refresh berkala (auto-refresh) setelah login berhasil.
 * Wajib sertakan token session hasil apiVerifyPin - tanpa token valid,
 * data tidak akan dikembalikan meskipun email-nya benar.
 */
/**
 * "Rekan Setim" - lihat status hadir teman satu cabang hari ini.
 * Reuse logika getManagerMonitoring_ dengan objek manager palsu yang
 * di-scope ke cabang promotor sendiri (role bukan ADMIN, jadi otomatis
 * dibatasi ke cabangnya saja).
 */
function apiGetTeamStatus(payload) {
  try {
    const data = payload || {};
    const email = String(data.email || '').trim().toLowerCase();
    const token = String(data.token || '').trim();
    const tanggal = normalizeDateString_(data.tanggal) || getToday_();

    const promotor = findPromotorByEmail_(email);
    if (!promotor) throw new Error('Email promotor tidak terdaftar.');
    if (!requireSession_(email, token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');

    const pseudoManager = { cabang: promotor.cabang, role: 'PROMOTOR_TEAM_VIEW' };
    const monitoring = getManagerMonitoring_(pseudoManager, { tanggal: tanggal, brand: '' });

    const rows = monitoring.rows.map(function (row) {
      return {
        nama: row.nama,
        shift: row.shift,
        jamMasukJadwal: row.jamMasukJadwal,
        jamPulangJadwal: row.jamPulangJadwal,
        jamMasukAktual: row.masuk ? row.masuk.jamAktual : '',
        jamPulangAktual: row.pulang ? row.pulang.jamAktual : '',
        statusLabel: row.statusLabel,
        isSelf: row.email === email
      };
    });

    return {
      ok: true,
      tanggal: tanggal,
      cabang: promotor.cabang,
      counts: monitoring.counts,
      rows: rows
    };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

function apiGetInitialData(emailInput, token) {
  return withReadMemo_(function () { return apiGetInitialDataImpl_(emailInput, token); });
}

function apiGetInitialDataImpl_(emailInput, token) {
  try {
    const email = String(emailInput || '').trim().toLowerCase();

    if (!email) {
      return { ok: false, needLogin: true, message: 'Silakan masukkan email.' };
    }

    if (!requireSession_(email, token)) {
      return { ok: false, needLogin: true, sessionExpired: true, message: 'Sesi login habis. Silakan login ulang dengan PIN.' };
    }

    return buildInitialDataForEmail_(email);
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

// Logika asli apiGetInitialData, sekarang jadi helper privat yang dipanggil
// setelah email+token (atau email+PIN) tervalidasi.
function buildInitialDataForEmail_(emailInput) {
  try {
    const email = String(emailInput || '').trim().toLowerCase();

    if (!email) {
      return {
        ok: false,
        needLogin: true,
        message: 'Silakan masukkan email.'
      };
    }

    const promotor = findPromotorByEmail_(email);
    const manager = promotor ? null : findManagerByEmail_(email);

    if (!promotor && !manager) {
      return {
        ok: false,
        needLogin: true,
        message: 'Email belum terdaftar sebagai promotor atau manager.'
      };
    }

    if (manager && !promotor) {
      const todayMgr = getToday_();
      const managerDashboard = getManagerDashboard_(manager, { tanggal: todayMgr });
      const mgrSchedule = getFlexibleScheduleForManager_(manager, todayMgr);
      const mgrAttendance = getAttendanceToday_(manager.email, todayMgr);
      const mgrLokasi = findLokasiByCabang_(manager.cabang);

      return {
        ok: true,
        role: 'MANAGER',
        today: todayMgr,
        faceConfig: getFaceConfig_(),
        favoritMenus: getFavoriteMenus_(),
        serverVersion: APP_VERSION,
        user: manager,
        schedule: mgrSchedule,
        attendance: mgrAttendance,
        lokasi: mgrLokasi,
        managerDashboard: managerDashboard,
        notificationCount: (managerDashboard.pending || []).length
      };
    }

    const today = getToday_();
    const schedule = findScheduleForPromotor_(promotor, today);
    const attendance = getAttendanceToday_(promotor.email, today);
    const lokasi = findLokasiByCabang_(promotor.cabang);
    const requests = getMyRequests_(promotor.email);
    const companyInfo = getActiveCompanyInfo_(promotor);

    return {
      ok: true,
      role: 'PROMOTOR',
      today,
      faceConfig: getFaceConfig_(),
      favoritMenus: getFavoriteMenus_(),
      serverVersion: APP_VERSION,
      user: promotor,
      schedule,
      attendance,
      lokasi,
      requests,
      companyInfo,
      notificationCount: countPromotorNotifications_(requests)
    };

  } catch (err) {
    return {
      ok: false,
      message: err.message
    };
  }
}

function apiGetManagerDashboard(emailInput, options) {
  return withReadMemo_(function () { return apiGetManagerDashboardImpl_(emailInput, options); });
}

function apiGetManagerDashboardImpl_(emailInput, options) {
  try {
    const email = String(emailInput || '').trim().toLowerCase();
    const manager = findManagerByEmail_(email);

    if (!manager) {
      throw new Error('Email manager tidak terdaftar atau tidak aktif.');
    }
    if (!requireSession_(email, (options || {}).token)) {
      return { ok: false, sessionExpired: true, message: 'Sesi login habis. Silakan login ulang dengan PIN.' };
    }

    const managerDashboard = getManagerDashboard_(manager, options || {});
    const todayMgr = getToday_();
    return {
      ok: true,
      role: 'MANAGER',
      today: todayMgr,
      faceConfig: getFaceConfig_(),
      favoritMenus: getFavoriteMenus_(),
      serverVersion: APP_VERSION,
      user: manager,
      schedule: getFlexibleScheduleForManager_(manager, todayMgr),
      attendance: getAttendanceToday_(manager.email, todayMgr),
      lokasi: findLokasiByCabang_(manager.cabang),
      managerDashboard: managerDashboard,
      notificationCount: (managerDashboard.pending || []).length
    };

  } catch (err) {
    return {
      ok: false,
      message: err.message
    };
  }
}



function apiGetDailyAudit(emailInput, options) {
  try {
    const email = String(emailInput || '').trim().toLowerCase();
    const manager = findManagerByEmail_(email);

    if (!manager) {
      throw new Error('Email manager tidak terdaftar atau tidak aktif.');
    }
    if (!requireSession_(email, (options || {}).token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');

    return {
      ok: true,
      audit: getDailyAudit_(manager, options || {})
    };

  } catch (err) {
    return {
      ok: false,
      message: err.message
    };
  }
}

function apiRunBackupNow(emailInput, token) {
  try {
    const email = String(emailInput || '').trim().toLowerCase();
    const manager = findManagerByEmail_(email);

    if (!manager) {
      throw new Error('Email manager tidak terdaftar atau tidak aktif.');
    }
    if (!requireSession_(email, token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');

    const result = createBackupFile_({
      mode: 'MANUAL_WEB',
      actor: manager.nama + ' (' + manager.email + ')'
    });

    return {
      ok: true,
      message: 'Backup berhasil dibuat.',
      fileName: result.fileName,
      fileUrl: result.fileUrl,
      backupAt: result.backupAt,
      sheets: result.sheets
    };

  } catch (err) {
    return {
      ok: false,
      message: err.message
    };
  }
}


function apiGetPromotorSchedule(emailInput, options) {
  try {
    const email = String(emailInput || '').trim().toLowerCase();
    const promotor = findPromotorByEmail_(email);

    if (!promotor) {
      throw new Error('Email promotor tidak terdaftar atau tidak aktif.');
    }
    if (!requireSession_(email, (options || {}).token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');

    const opts = options || {};
    const selectedDate = normalizeDateString_(opts.selectedDate) || getToday_();
    const month = String(opts.month || selectedDate.slice(0, 7)).trim();

    return {
      ok: true,
      scheduleView: getPromotorScheduleView_(promotor, opts)
    };

  } catch (err) {
    return {
      ok: false,
      message: err.message
    };
  }
}



function apiExportManagerExcel(emailInput, options) {
  try {
    const email = String(emailInput || '').trim().toLowerCase();
    const manager = findManagerByEmail_(email);

    if (!manager) {
      throw new Error('Email manager tidak terdaftar atau tidak aktif.');
    }
    if (!requireSession_(email, (options || {}).token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');

    const exportResult = createManagerExcelExport_(manager, options || {});
    return {
      ok: true,
      message: 'File Excel berhasil dibuat.',
      fileName: exportResult.fileName,
      fileUrl: exportResult.fileUrl,
      downloadUrl: exportResult.downloadUrl,
      sheetCount: exportResult.sheetCount,
      startDate: exportResult.startDate,
      endDate: exportResult.endDate
    };

  } catch (err) {
    let message = err.message || 'Gagal export Excel.';

    if (message.indexOf('UrlFetchApp.fetch') >= 0 || message.indexOf('script.external_request') >= 0) {
      message =
        'Izin Export Excel belum lengkap untuk UrlFetchApp. ' +
        'Buka Apps Script, jalankan function setupExportExcelAuthorization, klik Allow/Izinkan, ' +
        'lalu Deploy ulang dengan Version: New version. Detail: ' + message;
    }

    if (message.indexOf('SpreadsheetApp.create') >= 0 || message.indexOf('/auth/spreadsheets') >= 0) {
      message =
        'Izin Export Excel belum lengkap untuk membuat Spreadsheet. ' +
        'Buka Apps Script, jalankan function setupExportExcelAuthorization, klik Allow/Izinkan, ' +
        'lalu Deploy ulang dengan Version: New version. Detail: ' + message;
    }

    return {
      ok: false,
      message: message
    };
  }
}


function apiGetAdminSettings(emailInput, token) {
  try {
    const email = String(emailInput || '').trim().toLowerCase();
    const manager = findManagerByEmail_(email);
    if (!manager) throw new Error('Email manager tidak terdaftar atau tidak aktif.');
    if (!requireSession_(email, token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');

    return {
      ok: true,
      settings: getAdminSettings_(manager)
    };
  } catch (err) {
    return {
      ok: false,
      message: err.message
    };
  }
}

/**
 * Upload Jadwal Shift dari file Excel (format export GreatDay: sheet
 * "Jadwal Shift [Bulan] [Tahun]" + sheet "Daftar Shift"). Parsing file
 * dilakukan di browser (SheetJS), server cuma terima JSON hasil parsing.
 *
 * Aman: hanya menghapus & menulis ulang baris JADWAL_PROSES untuk
 * bulan + cabang yang benar-benar ke-upload, bulan/cabang lain tidak disentuh.
 */
/**
 * Data mentah buat generate file template Jadwal Shift (dibuat jadi .xlsx
 * di browser pakai SheetJS, server cuma kasih data promotor aktif + master shift).
 */
function apiGetScheduleTemplateData(payload) {
  try {
    const data = payload || {};
    const managerEmail = String(data.managerEmail || '').trim().toLowerCase();
    const manager = findManagerByEmail_(managerEmail);
    if (!manager) throw new Error('Email manager tidak terdaftar atau tidak aktif.');
    if (!requireSession_(managerEmail, data.token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');

    const isAdmin = normalizeText_(manager.role).includes('ADMIN');

    const employees = getSheetObjects_(SHEET.PROMOTOR)
      .filter(row => normalizeText_(row.status) === 'AKTIF')
      .filter(row => isAdmin || normalizeText_(row.cabang) === normalizeText_(manager.cabang))
      .map(row => ({
        kodeKaryawan: String(row.kodekaryawan || '').trim(),
        nama: normalizeText_(row.nama)
      }))
      .sort((a, b) => {
        // Yang sudah punya Kode Karyawan diurutkan duluan (natural sort, biar SPW-R-P-AC-2 < SPW-R-P-AC-10),
        // yang belum punya kode ditaruh di bawah, diurutkan berdasarkan nama.
        if (a.kodeKaryawan && b.kodeKaryawan) {
          return a.kodeKaryawan.localeCompare(b.kodeKaryawan, undefined, { numeric: true, sensitivity: 'base' });
        }
        if (a.kodeKaryawan && !b.kodeKaryawan) return -1;
        if (!a.kodeKaryawan && b.kodeKaryawan) return 1;
        return a.nama.localeCompare(b.nama);
      });

    const shifts = getSheetObjectsWithRow_(SHEET.SHIFT)
      .map(row => ({
        nama: normalizeShift_(row.shift),
        jamMasuk: formatJam_(row.jammasuk),
        jamPulang: formatJam_(row.jampulang)
      }))
      .filter(item => item.nama);

    // Jadwal yang sudah ada (opsional) supaya revisi tinggal mengubah hari yang perlu.
    let existing = {};
    const month = String(data.month || '').trim();
    if (data.includeExisting && /^\d{4}-\d{2}$/.test(month)) {
      getSheetObjects_(SHEET.PROSES).forEach(row => {
        const tgl = normalizeDateString_(row.tanggal);
        if (tgl.slice(0, 7) !== month) return;
        if (!isAdmin && normalizeText_(row.cabang) !== normalizeText_(manager.cabang)) return;
        const nama = normalizeText_(row.nama);
        if (!nama) return;
        (existing[nama] = existing[nama] || {})[Number(tgl.slice(8, 10))] = normalizeShift_(row.shift);
      });
    }

    return { ok: true, employees, shifts, cabang: manager.cabang, existing };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

function apiUploadJadwal(payload) {
  try {
    const data = payload || {};
    const managerEmail = String(data.managerEmail || '').trim().toLowerCase();
    const manager = findManagerByEmail_(managerEmail);
    if (!manager) throw new Error('Email manager tidak terdaftar atau tidak aktif.');
    if (!requireSession_(managerEmail, data.token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');

    const month = String(data.month || '').trim(); // format YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(month)) throw new Error('Bulan tidak terbaca dari file. Pastikan judul sheet mengandung nama bulan dan tahun.');

    const shiftMasterInput = Array.isArray(data.shiftMaster) ? data.shiftMaster : [];
    const employeesInput = Array.isArray(data.employees) ? data.employees : [];
    if (!employeesInput.length) throw new Error('Tidak ada data karyawan yang terbaca dari file.');

    const isAdmin = normalizeText_(manager.role).includes('ADMIN');
    const ss = getSs_();

    // 1) Upsert Daftar Shift ke SHEET.SHIFT (nambah kode shift baru kalau belum ada).
    const shiftSheet = ss.getSheetByName(SHEET.SHIFT);
    const existingShiftRows = getSheetObjectsWithRow_(SHEET.SHIFT);
    const existingShiftNames = {};
    existingShiftRows.forEach(row => { existingShiftNames[normalizeShift_(row.shift)] = row.__rowNumber; });

    const newShiftCodes = [];
    shiftMasterInput.forEach(item => {
      const nama = normalizeShift_(item.nama);
      if (!nama) return;
      if (existingShiftNames[nama]) return; // sudah ada, tidak ditimpa (biar toleransi telat manual tetap kepakai)
      shiftSheet.appendRow([nama, item.jamMasuk || '', item.jamPulang || '', 'AKTIF']);
      newShiftCodes.push(nama);
    });

    const shiftMap = getShiftMap_();

    // 2) Pastikan kolom "Kode Karyawan" ada di DATA_PROMOTOR buat matching yang lebih presisi ke depannya.
    const promotorSheet = ss.getSheetByName(SHEET.PROMOTOR);
    const kodeCol = ensureColumn_(promotorSheet, 'Kode Karyawan');

    const promotorRows = getSheetObjectsWithRow_(SHEET.PROMOTOR)
      .filter(row => normalizeText_(row.status) === 'AKTIF')
      .filter(row => isAdmin || normalizeText_(row.cabang) === normalizeText_(manager.cabang));

    const byKode = {};
    const byLooseName = {};
    promotorRows.forEach(row => {
      const kode = String(row.kodekaryawan || '').trim().toUpperCase();
      if (kode) byKode[kode] = row;
      const looseName = normalizeLooseName_(row.nama);
      if (looseName && !byLooseName[looseName]) byLooseName[looseName] = row;
    });

    const monthParts = month.split('-');
    const year = Number(monthParts[0]);
    const monthIndex = Number(monthParts[1]) - 1;

    const outputRows = [];
    const unmatchedNames = [];
    const touchedCabang = {};
    const matchedPersonKeys = {};
    const updatedPeople = [];
    const replaceAll = data.replaceAll === true || data.replaceAll === 'true';
    let matchedCount = 0;

    employeesInput.forEach(emp => {
      const kode = String(emp.kodeKaryawan || '').trim().toUpperCase();
      const nama = normalizeText_(emp.nama);
      if (!nama) return;

      let promotorRow = kode ? byKode[kode] : null;
      if (!promotorRow) promotorRow = byLooseName[normalizeLooseName_(nama)];

      if (!promotorRow) {
        unmatchedNames.push(nama + (kode ? ' (' + kode + ')' : ''));
        return;
      }

      // Simpan Kode Karyawan ke DATA_PROMOTOR biar upload berikutnya makin akurat.
      if (kode && !String(promotorRow.kodekaryawan || '').trim()) {
        promotorSheet.getRange(promotorRow.__rowNumber, kodeCol).setValue(kode);
      }

      const email = String(promotorRow.email || '').trim().toLowerCase();
      const promNama = normalizeText_(promotorRow.nama);
      const brand = normalizeText_(promotorRow.brand);
      const cabang = normalizeText_(promotorRow.cabang);
      touchedCabang[cabang] = true;
      matchedPersonKeys[email || promNama] = true;
      matchedCount++;
      const rowsBefore = outputRows.length;

      const days = emp.days || {};
      Object.keys(days).forEach(dayKey => {
        const dayNumber = Number(dayKey);
        if (!dayNumber) return;

        const shift = normalizeShift_(days[dayKey]);
        if (!shift) return;

        const shiftInfo = shiftMap[shift] || {};
        const dateObj = new Date(year, monthIndex, dayNumber);
        const tanggal = Utilities.formatDate(dateObj, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
        const hari = getHariIndonesia_(dateObj);

        let jamMasuk = shiftInfo.jamMasuk || '';
        let jamPulang = shiftInfo.jamPulang || '';
        let statusJadwal = 'MASUK';

        if (shift === 'OFF') {
          jamMasuk = '';
          jamPulang = '';
          statusJadwal = 'OFF';
        } else if (!shiftInfo.status) {
          statusJadwal = 'SHIFT_TIDAK_DIKENAL';
        }

        const idJadwal = makeId_(['JDW', tanggal, email || promNama, brand]);

        outputRows.push([idJadwal, tanggal, hari, email, promNama, brand, cabang, shift, jamMasuk, jamPulang, statusJadwal]);
      });
      updatedPeople.push({ nama: promNama, hari: outputRows.length - rowsBefore });
    });

    if (!matchedCount) {
      throw new Error('Tidak ada satupun nama di file yang cocok dengan DATA_PROMOTOR. Cek ejaan nama atau isi kolom Kode Karyawan dulu.');
    }

    // 3) Rapikan duplikat di file (nama sama / tanggal sama -> yang terakhir menang).
    const uniq = {};
    outputRows.forEach(r => { uniq[(r[3] || r[4]) + '|' + r[1]] = r; });
    const finalOutput = Object.keys(uniq).map(k => uniq[k]);

    // 4) Ganti baris HANYA untuk orang yang ada di file:
    //    - default: hanya hari yang terisi di file yang diganti (hari lain & orang lain tidak berubah)
    //    - replaceAll: seluruh jadwal bulan itu milik orang tersebut ditimpa (hari kosong ikut hilang)
    const dayKeys = {};
    finalOutput.forEach(r => { dayKeys[(r[3] || r[4]) + '|' + r[1]] = true; });

    const cabangSet = Object.keys(touchedCabang);
    const prosesSheet = ss.getSheetByName(SHEET.PROSES);
    const allRows = prosesSheet.getDataRange().getValues();
    const header = allRows[0];
    const kept = [header];
    let removedCount = 0;

    for (let i = 1; i < allRows.length; i++) {
      const row = allRows[i];
      const tglCell = normalizeDateString_(row[1]);
      const person = String(row[3] || '').trim().toLowerCase() || normalizeText_(row[4]);
      const remove = replaceAll
        ? (tglCell.slice(0, 7) === month && matchedPersonKeys[person] === true)
        : (dayKeys[person + '|' + tglCell] === true);
      if (remove) removedCount++; else kept.push(row);
    }

    const finalRows = kept.concat(finalOutput);
    prosesSheet.clearContents();
    prosesSheet.getRange(1, 1, finalRows.length, header.length).setValues(finalRows);

    bumpVer_([['G', '']]);
    return {
      ok: true,
      message: 'Jadwal bulan ' + month + ' berhasil diupload. ' + matchedCount + ' orang diperbarui, ' + finalOutput.length + ' hari jadwal ditulis. Jadwal orang lain tidak berubah.',
      matchedCount,
      totalRows: finalOutput.length,
      updatedPeople,
      replaced: removedCount,
      replaceAll,
      unmatchedNames,
      newShiftCodes,
      cabangTerupdate: cabangSet
    };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

function apiSaveAdminSettings(payload) {
  try {
    const data = payload || {};
    const email = String(data.managerEmail || '').trim().toLowerCase();
    const manager = findManagerByEmail_(email);
    if (!manager) throw new Error('Email manager tidak terdaftar atau tidak aktif.');
    if (!requireSession_(email, data.token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');

    const result = saveAdminSettings_(manager, data);
    bumpVer_([['G', '']]);
    return {
      ok: true,
      message: 'Pengaturan berhasil disimpan.',
      settings: getAdminSettings_(manager),
      result
    };
  } catch (err) {
    return {
      ok: false,
      message: err.message
    };
  }
}

function apiGetMonthlyPerformance(emailInput, options) {
  try {
    const email = String(emailInput || '').trim().toLowerCase();
    const manager = findManagerByEmail_(email);
    if (!manager) throw new Error('Email manager tidak terdaftar atau tidak aktif.');
    if (!requireSession_(email, (options || {}).token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');

    return {
      ok: true,
      performance: getMonthlyPerformance_(manager, options || {})
    };
  } catch (err) {
    return {
      ok: false,
      message: err.message
    };
  }
}

function apiGetKoreksiDetail(emailInput, tanggalInput, token) {
  try {
    const email = String(emailInput || '').trim().toLowerCase();
    const tanggal = normalizeDateString_(tanggalInput) || getToday_();

    const promotor = findPromotorByEmail_(email);
    if (!promotor) throw new Error('Email promotor tidak terdaftar.');
    if (!requireSession_(email, token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');

    const schedule = findSchedule_(promotor.email, tanggal);
    const attendance = getAttendanceToday_(promotor.email, tanggal);

    return {
      ok: true,
      tanggal: tanggal,
      user: promotor,
      schedule: schedule,
      attendance: attendance
    };

  } catch (err) {
    return {
      ok: false,
      message: err.message
    };
  }
}

function apiUpdateProfile(payload) {
  try {
    const data = payload || {};
    const email = String(data.email || '').trim().toLowerCase();
    const token = String(data.token || '').trim();
    const nama = String(data.nama || '').trim();
    const noHp = String(data.noHp || '').trim();
    const catatanProfil = String(data.catatanProfil || '').trim();

    if (!email) throw new Error('Email kosong.');
    if (!requireSession_(email, token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');
    if (!nama) throw new Error('Nama wajib diisi.');

    const ss = getSs_();
    const sheet = ss.getSheetByName(SHEET.PROMOTOR);
    if (!sheet) throw new Error('Sheet DATA_PROMOTOR tidak ditemukan.');

    ensureColumn_(sheet, 'No HP');
    ensureColumn_(sheet, 'Catatan Profil');

    const values = sheet.getDataRange().getDisplayValues();
    const headers = values[0].map(normalizeHeader_);
    const idxEmail = headers.indexOf('email');
    const idxNama = headers.indexOf('nama');
    const idxNoHp = headers.indexOf('nohp');
    const idxCatatan = headers.indexOf('catatanprofil');

    if (idxEmail < 0 || idxNama < 0) throw new Error('Header DATA_PROMOTOR minimal harus ada Email dan Nama.');

    let targetRow = -1;
    for (let r = 1; r < values.length; r++) {
      if (String(values[r][idxEmail] || '').trim().toLowerCase() === email) {
        targetRow = r + 1;
        break;
      }
    }

    if (targetRow < 0) throw new Error('Data promotor tidak ditemukan.');

    sheet.getRange(targetRow, idxNama + 1).setValue(nama);
    if (idxNoHp >= 0) sheet.getRange(targetRow, idxNoHp + 1).setValue(noHp);
    if (idxCatatan >= 0) sheet.getRange(targetRow, idxCatatan + 1).setValue(catatanProfil);

    return buildInitialDataForEmail_(email);

  } catch (err) {
    return {
      ok: false,
      message: err.message
    };
  }
}



function apiSubmitCompanyInfo(payload) {
  try {
    const data = payload || {};
    const managerEmail = String(data.managerEmail || '').trim().toLowerCase();
    const manager = findManagerByEmail_(managerEmail);
    if (!manager) throw new Error('Email manager tidak terdaftar.');
    if (!requireSession_(managerEmail, data.token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');

    const judul = String(data.judul || '').trim();
    const isi = String(data.isi || '').trim();
    const targetBrand = normalizeText_(data.targetBrand || 'ALL') || 'ALL';
    const targetCabang = normalizeText_(data.targetCabang || manager.cabang || 'ALL') || 'ALL';
    const tanggalMulai = normalizeDateString_(data.tanggalMulai) || getToday_();
    const tanggalSelesai = normalizeDateString_(data.tanggalSelesai) || tanggalMulai;

    if (!judul) throw new Error('Judul informasi wajib diisi.');
    if (!isi) throw new Error('Isi informasi wajib diisi.');
    if (new Date(tanggalSelesai + 'T00:00:00') < new Date(tanggalMulai + 'T00:00:00')) {
      throw new Error('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
    }

    const sheet = ensureCompanyInfoSheet_();
    const now = Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    const id = makeId_(['INFO', tanggalMulai, manager.email, new Date().getTime()]);

    sheet.appendRow([
      id,
      now,
      manager.email,
      manager.nama,
      targetCabang,
      targetBrand,
      judul,
      isi,
      tanggalMulai,
      tanggalSelesai,
      'AKTIF'
    ]);

    bumpVer_([['G', '']]);
    return {
      ok: true,
      message: 'Informasi berhasil dikirim ke promotor.',
      info: getAllCompanyInfo_().slice(0, 10)
    };

  } catch (err) {
    return {
      ok: false,
      message: err.message
    };
  }
}


/**
 * Manager tidak punya jadwal shift di JADWAL_PROSES (itu sistemnya promotor).
 * Supaya manager tetap bisa Rekam Waktu, kasih jadwal "fleksibel" virtual:
 * tidak ada jam pembanding, tidak pernah OFF, status absen selalu netral (TERCATAT).
 */
function getFlexibleScheduleForManager_(manager, tanggal) {
  const dateObj = new Date(tanggal + 'T00:00:00');
  return {
    tanggal: tanggal,
    hari: getHariIndonesia_(dateObj),
    shift: 'FLEKSIBEL',
    jamMasuk: '',
    jamPulang: '',
    statusJadwal: 'MASUK',
    isSelected: true
  };
}

/** Cari baris absensi berdasarkan ID (kolom A). Petunjuk baris dicoba dulu, lalu 300 baris terakhir, baru semuanya. */
function findAttendanceRow_(sheet, id, rowHint) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2 || !id) return 0;
  const hint = Number(rowHint);
  if (hint >= 2 && hint <= lastRow && String(sheet.getRange(hint, 1, 1, 1).getValues()[0][0]) === id) return hint;

  const tailStart = Math.max(2, lastRow - 299);
  let vals = sheet.getRange(tailStart, 1, lastRow - tailStart + 1, 1).getValues();
  for (let i = vals.length - 1; i >= 0; i--) {
    if (String(vals[i][0]) === id) return tailStart + i;
  }
  if (tailStart > 2) {
    vals = sheet.getRange(2, 1, tailStart - 2, 1).getValues();
    for (let j = vals.length - 1; j >= 0; j--) {
      if (String(vals[j][0]) === id) return 2 + j;
    }
  }
  return 0;
}

/** Foto absen menyusul setelah absen tercatat. Aman dipanggil ulang (kalau foto sudah ada, tidak ditimpa). */
function apiAttachAttendancePhoto(payload) {
  try {
    const data = payload || {};
    const email = String(data.email || '').trim().toLowerCase();
    const id = String(data.id || '').trim();
    const photoDataUrl = String(data.photoDataUrl || '');

    if (!email || !id) throw new Error('Data foto tidak lengkap.');
    if (!requireSession_(email, data.token)) return { ok: false, sessionExpired: true, message: 'Sesi login habis.' };
    if (photoDataUrl.indexOf('data:image/') !== 0) throw new Error('Foto tidak valid.');
    if (photoDataUrl.length > 900000) throw new Error('Foto terlalu besar.');

    const sheet = getSs_().getSheetByName(SHEET.ABSENSI);
    if (!sheet) throw new Error('Sheet ABSENSI tidak ditemukan.');

    const row = findAttendanceRow_(sheet, id, data.rowHint);
    if (!row) throw new Error('Data absen tidak ditemukan.');

    const rec = sheet.getRange(row, 1, 1, 13).getValues()[0]; // A..M
    if (String(rec[3] || '').trim().toLowerCase() !== email) throw new Error('Data absen bukan milik akun ini.');
    if (String(rec[12] || '').trim()) return { ok: true, already: true }; // foto sudah ada

    const tanggal = normalizeDateString_(rec[2]);
    const fotoUrl = savePhoto_(photoDataUrl, String(rec[4] || ''), normalizeText_(rec[7]), tanggal);
    sheet.getRange(row, 13).setValue(fotoUrl);
    bumpCabangVer_(rec[6], '');

    return { ok: true };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

function apiSubmitAttendance(payload) {
  try {
    const data = payload || {};
    const email = String(data.email || '').trim().toLowerCase();
    const token = String(data.token || '').trim();
    const jenisAbsen = normalizeText_(data.jenisAbsen);
    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);
    const photoDataUrl = String(data.photoDataUrl || '');
    const deferPhoto = data.deferPhoto === true || data.deferPhoto === 'true';
    const faceStatus = normalizeText_(data.faceStatus);
    const faceDistance = Number(data.faceDistance);

    const allowed = [
      'ABSEN_MASUK',
      'MULAI_ISTIRAHAT',
      'SELESAI_ISTIRAHAT',
      'ABSEN_PULANG'
    ];

    if (!email) throw new Error('Email kosong.');
    if (!requireSession_(email, token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN sebelum absen.');
    if (!allowed.includes(jenisAbsen)) throw new Error('Jenis absen tidak valid.');
    if (!photoDataUrl && !deferPhoto) throw new Error('Foto wajib diambil.');
    if (!latitude || !longitude) throw new Error('Lokasi GPS wajib aktif.');

    let actor = findPromotorByEmail_(email);
    let isManagerActor = false;
    let schedule;

    if (actor) {
      if (!actor.fotoDasarId) throw new Error('Foto dasar belum ada. Buka Profil lalu upload Foto Dasar dulu sebelum absen.');
      const today0 = getToday_();
      schedule = findScheduleForPromotor_(actor, today0);

      if (!schedule) {
        throw new Error('Jadwal hari ini belum ditemukan. Pastikan JADWAL_PROSES sudah dibuat.');
      }
      if (schedule.statusJadwal === 'OFF' || schedule.shift === 'OFF') {
        throw new Error('Hari ini kamu OFF, absensi tidak aktif.');
      }
    } else {
      const manager = findManagerByEmail_(email);
      if (!manager) throw new Error('Email tidak terdaftar sebagai promotor atau manager.');
      isManagerActor = true;
      if (!manager.fotoDasarId) throw new Error('Foto dasar belum ada. Buka Profil lalu upload Foto Dasar dulu sebelum absen.');
      actor = {
        email: manager.email,
        nama: manager.nama,
        brand: 'MANAJEMEN',
        cabang: manager.cabang,
        fotoDasarDesc: manager.fotoDasarDesc
      };
      schedule = getFlexibleScheduleForManager_(manager, getToday_());
    }

    const promotor = actor;
    const today = getToday_();

    // Verifikasi wajah: kalau WAJIB, hanya wajah yang cocok dengan foto dasar yang boleh absen.
    const faceCfg = getFaceConfig_();
    if (faceCfg.mode === 'WAJIB') {
      if (faceStatus === 'TIDAK_COCOK') throw new Error('Wajah tidak sesuai dengan foto dasar. Ulangi foto.');
      if (faceStatus === 'TANPA_WAJAH') throw new Error('Wajah tidak terdeteksi di foto. Ulangi foto.');
      if (faceStatus === 'COCOK' || faceStatus === 'MIRIP') {
        const jarakOk = isFinite(faceDistance) && faceDistance > 0 && faceDistance <= faceCfg.batas + 0.0001;
        if (!jarakOk) throw new Error('Verifikasi wajah belum berhasil. Pastikan koneksi internet stabil, lalu ulangi foto.');
      } else if (faceCfg.onError === 'BLOKIR') {
        // Pengenal wajah gagal/macet atau foto dasar lama belum disiapkan, dan admin memilih BLOKIR.
        throw new Error(!actor.fotoDasarDesc
          ? 'Foto dasar kamu belum bisa dicocokkan wajahnya. Buka Profil lalu ambil ulang Foto Dasar.'
          : 'Verifikasi wajah belum berhasil. Pastikan koneksi internet stabil, lalu ulangi foto.');
      }
      // onError = IZINKAN: lanjut, tercatat sebagai TIDAK_DIVERIFIKASI untuk ditinjau manager.
    }

    const existing = getAttendanceToday_(promotor.email, today);

    if (existing.some(item => item.jenisAbsen === jenisAbsen)) {
      throw new Error('Kamu sudah melakukan ' + jenisAbsen.replace(/_/g, ' ') + ' hari ini.');
    }

    validateAttendanceFlow_(jenisAbsen, existing);

    const lokasiList = findLokasiListByCabang_(promotor.cabang);
    if (!lokasiList.length) throw new Error('Lokasi toko untuk cabang ini belum disetting.');

    const geoAccuracy = Number(data.accuracy);
    const lokasiEval = evaluateLokasiAbsen_(lokasiList, latitude, longitude, geoAccuracy, lokasiMarginMaks_());
    const jarak = lokasiEval.jarak;

    if (!lokasiEval.ok) {
      logLokasiDitolak_(promotor, jenisAbsen, latitude, longitude, lokasiEval);
      const eLok = new Error(pesanDiLuarRadius_(lokasiEval));
      eLok.detail = { outsideRadius: true, jarakMeter: Math.round(lokasiEval.jarak), radiusMeter: Math.round(lokasiEval.radius), akurasi: Math.round(lokasiEval.akurasi) };
      throw eLok;
    }
    // Diterima karena akurasi GPS (di luar radius tapi dalam margin): ditandai supaya manager bisa meninjau.
    const batasCatatan = lokasiEval.lewatMargin
      ? 'LOKASI_BATAS:' + Math.round(lokasiEval.jarak) + 'm/radius ' + Math.round(lokasiEval.radius) + 'm'
      : '';

    const now = new Date();
    const timestamp = Utilities.formatDate(now, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    const jamAktual = Utilities.formatDate(now, APP_CONFIG.TIMEZONE, 'HH:mm');

    let jamJadwal = '';
    if (jenisAbsen === 'ABSEN_MASUK') jamJadwal = schedule.jamMasuk;
    if (jenisAbsen === 'ABSEN_PULANG') jamJadwal = schedule.jamPulang;

    const status = evaluateStatusAbsensi_(jenisAbsen, jamAktual, schedule);
    // deferPhoto: absen dicatat dulu (cepat), foto menyusul lewat apiAttachAttendancePhoto.
    const fotoUrl = (deferPhoto && !photoDataUrl) ? '' : savePhoto_(photoDataUrl, promotor.nama, jenisAbsen, today);

    // Hasil cek wajah (dihitung di HP) dicatat di kolom catatan untuk ditinjau manager.
    const faceAllowed = ['COCOK', 'MIRIP', 'TIDAK_COCOK', 'TANPA_WAJAH', 'TIDAK_DIVERIFIKASI'];
    const geoAcc = Number(data.accuracy);
    const akurasiCatatan = (isFinite(geoAcc) && geoAcc > 0) ? 'AKURASI:' + Math.round(geoAcc) + 'm' : '';
    const faceCatatan0 = (faceAllowed.includes(faceStatus)
      ? 'WAJAH:' + faceStatus + (isFinite(faceDistance) && faceDistance > 0 ? ' (' + faceDistance.toFixed(2) + ')' : '')
      : '') + (akurasiCatatan ? (faceAllowed.includes(faceStatus) ? ' | ' : '') + akurasiCatatan : '');
    const faceCatatan = faceCatatan0 + (batasCatatan ? (faceCatatan0 ? ' | ' : '') + batasCatatan : '');

    const id = makeId_([
      'ABS',
      today,
      promotor.email,
      jenisAbsen,
      new Date().getTime()
    ]);

    const ss = getSs_();
    const sheet = ss.getSheetByName(SHEET.ABSENSI);
    if (!sheet) throw new Error('Sheet ABSENSI tidak ditemukan.');

    sheet.appendRow([
      id,
      timestamp,
      today,
      promotor.email,
      promotor.nama,
      promotor.brand,
      promotor.cabang,
      jenisAbsen,
      schedule.shift,
      jamJadwal,
      jamAktual,
      status,
      fotoUrl,
      latitude,
      longitude,
      Math.round(jarak),
      faceCatatan
    ]);

    const rowHint = sheet.getLastRow();
    bumpCabangVer_(promotor.cabang, '');

    // Daftar absensi terbaru disusun langsung (tanpa membaca sheet lagi).
    const newEntry = {
      id: id,
      timestamp: timestamp,
      tanggal: today,
      jenisAbsen: jenisAbsen,
      shift: normalizeText_(schedule.shift),
      jamJadwal: formatJam_(jamJadwal),
      jamAktual: formatJam_(jamAktual),
      status: status,
      foto: fotoUrl,
      jarakMeter: String(Math.round(jarak))
    };

    return {
      ok: true,
      message: 'Absensi berhasil disimpan.',
      status,
      jamAktual,
      jarak: Math.round(jarak),
      jamJadwal: formatJam_(jamJadwal),
      selisihMenit: (jenisAbsen === 'ABSEN_MASUK' && jamJadwal) ? (timeToMinutes_(jamAktual) - timeToMinutes_(jamJadwal)) : 0,
      attendance: existing.concat([newEntry]),
      photoPending: !fotoUrl,
      attendanceId: id,
      rowHint: rowHint
    };

  } catch (err) {
    const d = err && err.detail;
    return d
      ? { ok: false, message: err.message, outsideRadius: !!d.outsideRadius, jarakMeter: d.jarakMeter, radiusMeter: d.radiusMeter, akurasi: d.akurasi }
      : { ok: false, message: err.message };
  }
}

const KOREKSI_JENIS = 'KOREKSI_JAM';
const SHIFT_JENIS_UBAH = 'PERUBAHAN_SHIFT';       // ubah shift sendiri pada satu tanggal
const SHIFT_JENIS_TUKAR = 'TUKAR_SHIFT_TEMAN';    // tukar shift (atau OFF) dengan teman satu cabang pada satu tanggal

// Pilihan shift yang tersedia (dari sheet SHIFT_SETTING). Urutan: PAGI, SIANG, MIDDLE, OFF, lalu yang lain.
function shiftOptions_() {
  const map = getShiftMap_();
  const urut = ['PAGI', 'SIANG', 'MIDDLE', 'OFF'];
  const semua = Object.keys(map).filter(function (k) { return k !== 'MIDLE'; });
  const hasil = urut.filter(function (s) { return map[s]; }).concat(semua.filter(function (s) { return urut.indexOf(s) < 0; }));
  return hasil.map(function (s) { return { shift: s, jamMasuk: map[s].jamMasuk || '', jamPulang: map[s].jamPulang || '' }; });
}

function emailTemanDariData_(dataBaru) {
  const m = /Email teman:\s*(\S+@\S+)/i.exec(String(dataBaru || ''));
  return m ? m[1].trim().toLowerCase() : '';
}

// Sudah ada pengajuan shift yang menunggu untuk orang ini pada tanggal itu (sebagai pengaju ATAU sebagai teman)?
function adaPengajuanShiftMenunggu_(email, tanggal) {
  return getSheetObjects_(SHEET.KOREKSI).some(function (r) {
    if (normalizeText_(r.statusapproval) !== 'MENUNGGU_APPROVAL') return false;
    if (normalizeDateString_(r.tanggal) !== tanggal) return false;
    const jenis = normalizeText_(r.jeniskoreksi);
    if (!(jenis === SHIFT_JENIS_UBAH || jenis === SHIFT_JENIS_TUKAR || isShiftKoreksiJenis_(jenis))) return false;
    if (String(r.email || '').trim().toLowerCase() === email) return true;
    return jenis === SHIFT_JENIS_TUKAR && emailTemanDariData_(r.databaru) === email;
  });
}

function sudahAbsenPadaTanggal_(email, tanggal) {
  return getAttendanceToday_(email, tanggal).some(function (x) { return !!x.jamAktual; });
}

/** Data untuk formulir Perubahan Shift pada satu tanggal: jadwal saya, pilihan shift, dan teman satu cabang beserta jadwalnya. */
function apiGetShiftChangeData(emailInput, tanggalInput, token) {
  try {
    const email = String(emailInput || '').trim().toLowerCase();
    const today = getToday_();
    const tanggal = normalizeDateString_(tanggalInput) || today;
    if (!requireSession_(email, token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');
    const promotor = findPromotorByEmail_(email);
    if (!promotor) throw new Error('Email promotor tidak terdaftar.');

    const jadwal = {};
    getSheetObjects_(SHEET.PROSES).forEach(function (r) {
      if (normalizeDateString_(r.tanggal) !== tanggal) return;
      const e = String(r.email || '').trim().toLowerCase();
      if (e) jadwal[e] = scheduleFromRow_(r);
    });
    const mine = jadwal[promotor.email] || null;

    const teman = getSheetObjects_(SHEET.PROMOTOR)
      .filter(function (p) {
        return normalizeText_(p.status) === 'AKTIF' && normalizeText_(p.cabang) === promotor.cabang &&
          String(p.email || '').trim().toLowerCase() !== promotor.email && String(p.email || '').trim();
      })
      .map(function (p) {
        const e = String(p.email || '').trim().toLowerCase();
        const s = jadwal[e] || null;
        return { email: e, nama: normalizeText_(p.nama), brand: normalizeText_(p.brand),
          shift: s ? normalizeText_(s.shift) : '', jamMasuk: s ? (s.jamMasuk || '') : '', jamPulang: s ? (s.jamPulang || '') : '' };
      })
      .sort(function (a, b) { return a.nama < b.nama ? -1 : (a.nama > b.nama ? 1 : 0); });

    let bolehAjukan = true, alasan = '';
    if (tanggal < today) { bolehAjukan = false; alasan = 'Tanggal sudah lewat.'; }
    else if (!mine) { bolehAjukan = false; alasan = 'Jadwal kamu pada tanggal ini belum ada.'; }
    else if (sudahAbsenPadaTanggal_(promotor.email, tanggal)) { bolehAjukan = false; alasan = 'Kamu sudah absen pada tanggal ini.'; }
    else if (adaPengajuanShiftMenunggu_(promotor.email, tanggal)) { bolehAjukan = false; alasan = 'Masih ada pengajuan shift untuk tanggal ini yang menunggu persetujuan.'; }

    return {
      ok: true,
      tanggal: tanggal,
      bolehAjukan: bolehAjukan,
      alasan: alasan,
      mySchedule: mine ? { shift: normalizeText_(mine.shift), jamMasuk: mine.jamMasuk || '', jamPulang: mine.jamPulang || '' } : null,
      shifts: shiftOptions_(),
      teman: teman
    };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

/**
 * Perubahan shift: promotor mengajukan sendiri, manager tinggal menyetujui (jadwal berubah otomatis).
 * mode 'UBAH'  : ubah shift saya pada tanggal itu -> shiftBaru
 * mode 'TUKAR' : tukar shift (atau OFF) saya dengan teman satu cabang pada tanggal itu -> temanEmail
 */
function apiSubmitPerubahanShift(payload) {
  try {
    const data = payload || {};
    const email = String(data.email || '').trim().toLowerCase();
    const tanggal = normalizeDateString_(data.tanggal);
    const mode = normalizeText_(data.mode);
    const alasan = String(data.alasan || '').trim();

    if (!email) throw new Error('Email kosong.');
    if (!requireSession_(email, data.token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');
    if (!tanggal) throw new Error('Tanggal wajib dipilih.');
    if (mode !== 'UBAH' && mode !== 'TUKAR') throw new Error('Pilih dulu: ubah shift saya atau tukar dengan teman.');
    if (alasan.length < 5) throw new Error('Alasan wajib diisi (minimal 5 huruf).');

    const today = getToday_();
    if (tanggal < today) throw new Error('Tanggal sudah lewat. Perubahan shift hanya untuk hari ini dan seterusnya.');
    const maksHari = Math.max(1, Number(getConfigValue_('PERUBAHAN_SHIFT_MAKS_HARI', '31')) || 31);
    if (daysBetweenDates_(today, tanggal) > maksHari) throw new Error('Perubahan shift hanya bisa untuk ' + maksHari + ' hari ke depan.');

    const promotor = findPromotorByEmail_(email);
    if (!promotor) throw new Error('Email promotor tidak terdaftar.');

    const mine = findSchedule_(promotor.email, tanggal);
    if (!mine) throw new Error('Jadwal kamu pada tanggal ini belum ada. Hubungi manager.');
    const shiftSaya = normalizeText_(mine.shift);
    if (sudahAbsenPadaTanggal_(promotor.email, tanggal)) throw new Error('Kamu sudah absen pada tanggal ini, jadi shift tidak bisa diubah.');
    if (adaPengajuanShiftMenunggu_(promotor.email, tanggal)) throw new Error('Masih ada pengajuan shift untuk tanggal ini yang menunggu persetujuan manager.');

    const shiftMap = getShiftMap_();
    let jenis, dataLama, dataBaru, temanEmail = '';

    if (mode === 'UBAH') {
      const shiftBaru = normalizeText_(data.shiftBaru).replace('MIDLE', 'MIDDLE');
      if (!shiftBaru || !shiftMap[shiftBaru]) throw new Error('Shift baru tidak dikenal.');
      if (shiftBaru === shiftSaya) throw new Error('Shift baru sama dengan shift kamu sekarang (' + shiftSaya + ').');
      jenis = SHIFT_JENIS_UBAH;
      dataLama = 'Shift: ' + shiftSaya;
      dataBaru = 'Shift: ' + shiftBaru;
    } else {
      temanEmail = String(data.temanEmail || '').trim().toLowerCase();
      if (!temanEmail) throw new Error('Pilih teman yang mau ditukar.');
      if (temanEmail === promotor.email) throw new Error('Tidak bisa menukar dengan diri sendiri.');
      const teman = findPromotorByEmail_(temanEmail);
      if (!teman) throw new Error('Teman tidak ditemukan atau tidak aktif.');
      if (teman.cabang !== promotor.cabang) throw new Error('Tukar shift hanya dengan teman satu cabang.');
      const jadwalTeman = findSchedule_(teman.email, tanggal);
      if (!jadwalTeman) throw new Error('Jadwal ' + teman.nama + ' pada tanggal ini belum ada.');
      const shiftTeman = normalizeText_(jadwalTeman.shift);
      if (shiftTeman === shiftSaya) throw new Error('Shift kamu dan ' + teman.nama + ' sama (' + shiftSaya + '), tidak perlu ditukar.');
      if (sudahAbsenPadaTanggal_(teman.email, tanggal)) throw new Error(teman.nama + ' sudah absen pada tanggal ini, jadi shift tidak bisa ditukar.');
      if (adaPengajuanShiftMenunggu_(teman.email, tanggal)) throw new Error(teman.nama + ' masih punya pengajuan shift pada tanggal ini yang menunggu persetujuan.');
      jenis = SHIFT_JENIS_TUKAR;
      dataLama = 'Saya: ' + shiftSaya + ' | Teman: ' + shiftTeman;
      dataBaru = 'Saya: ' + shiftTeman + ' | Teman: ' + shiftSaya + ' | Email teman: ' + teman.email + ' | Nama teman: ' + teman.nama;
    }

    const timestamp = Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    const id = makeId_(['KOR', tanggal, promotor.email, jenis, new Date().getTime()]);
    const sheet = getSs_().getSheetByName(SHEET.KOREKSI);
    if (!sheet) throw new Error('Sheet REQUEST_KOREKSI tidak ditemukan.');
    sheet.appendRow([id, timestamp, promotor.email, promotor.nama, promotor.brand, promotor.cabang,
      tanggal, jenis, dataLama, dataBaru, alasan, 'MENUNGGU_APPROVAL', '', '', '']);

    bumpCabangVer_(promotor.cabang, promotor.email);
    if (temanEmail) { try { bumpVer_([['U', temanEmail]]); } catch (e) {} }
    return { ok: true, message: 'Pengajuan shift terkirim dan menunggu persetujuan manager.' };

  } catch (err) {
    return { ok: false, message: err.message };
  }
}


// Jam harus berformat HH:mm / H.mm. Kosong -> ''. Isi tidak valid -> galat (bukan diam-diam diabaikan).
function parseJamStrict_(value, label) {
  const t = String(value == null ? '' : value).trim();
  if (!t) return '';
  if (!/^\d{1,2}[.:]\d{2}$/.test(t)) throw new Error('Format ' + label + ' tidak valid. Contoh: 08:30.');
  const jam = parseJamFromText_(t);
  if (!jam) throw new Error(label.charAt(0).toUpperCase() + label.slice(1) + ' tidak valid.');
  return jam;
}

function daysBetweenDates_(fromIso, toIso) {
  const a = new Date(fromIso + 'T00:00:00Z').getTime();
  const b = new Date(toIso + 'T00:00:00Z').getTime();
  return Math.round((b - a) / 86400000);
}

// Dari teks "Masuk: 08:20 | Pulang: -" -> {masuk, pulang}
function parseKoreksiJamBaru_(text) {
  const t = String(text || '');
  const m = t.match(/Masuk\s*:\s*(\d{1,2}[.:]\d{2})/i);
  const p = t.match(/Pulang\s*:\s*(\d{1,2}[.:]\d{2})/i);
  return { masuk: m ? parseJamFromText_(m[1]) : '', pulang: p ? parseJamFromText_(p[1]) : '' };
}

/**
 * Koreksi kehadiran = hanya jam masuk dan/atau jam pulang pada satu tanggal.
 * (Perubahan shift / tukar OFF bukan koreksi kehadiran: jadwal diubah manager lewat unggah jadwal.)
 */
function apiSubmitKoreksi(payload) {
  try {
    const data = payload || {};
    const email = String(data.email || '').trim().toLowerCase();
    const tanggal = normalizeDateString_(data.tanggal);
    const alasan = String(data.alasan || '').trim();

    if (!email) throw new Error('Email kosong.');
    if (!requireSession_(email, data.token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');
    if (!tanggal) throw new Error('Tanggal koreksi wajib dipilih.');
    if (alasan.length < 5) throw new Error('Alasan koreksi wajib diisi (minimal 5 huruf).');

    let jamMasuk = parseJamStrict_(data.jamMasuk, 'jam masuk');
    let jamPulang = parseJamStrict_(data.jamPulang, 'jam pulang');

    // Aplikasi versi lama masih mengirim "jenis + data baru": jam tetap diterima, perubahan shift / tukar OFF tidak.
    const jenisLama = normalizeText_(data.jenisKoreksi);
    if (!jamMasuk && !jamPulang && jenisLama) {
      if (isShiftKoreksiJenis_(jenisLama)) {
        throw new Error('Perubahan shift / tukar OFF tidak lewat koreksi kehadiran lagi. Hubungi manager untuk mengubah jadwal.');
      }
      const jamLama = parseJamFromText_(data.dataBaru);
      if (jenisLama === 'EDIT_JAM_MASUK' || jenisLama === 'LUPA_ABSEN_MASUK') jamMasuk = jamLama;
      else if (jenisLama === 'EDIT_JAM_PULANG' || jenisLama === 'LUPA_ABSEN_PULANG') jamPulang = jamLama;
      else throw new Error('Jenis koreksi tidak dikenal. Tutup lalu buka lagi aplikasi untuk memperbarui.');
    }
    if (!jamMasuk && !jamPulang) throw new Error('Isi minimal salah satu: jam masuk atau jam pulang.');

    const today = getToday_();
    if (tanggal > today) throw new Error('Tanggal koreksi tidak boleh di masa depan.');
    const maksHari = Math.max(1, Number(getConfigValue_('KOREKSI_MAKS_HARI', '31')) || 31);
    if (daysBetweenDates_(tanggal, today) > maksHari) throw new Error('Koreksi hanya bisa untuk ' + maksHari + ' hari terakhir.');

    const promotor = findPromotorByEmail_(email);
    if (!promotor) throw new Error('Email promotor tidak terdaftar.');

    // Jam yang sudah tercatat pada tanggal itu (dihitung di server, bukan percaya kiriman aplikasi).
    const tercatat = getAttendanceToday_(promotor.email, tanggal);
    const jamTercatat = function (jenis) {
      const row = tercatat.find(function (x) { return x.jenisAbsen === jenis; });
      return row ? (parseJamFromText_(row.jamAktual) || '') : '';
    };
    const lamaMasuk = jamTercatat('ABSEN_MASUK');
    const lamaPulang = jamTercatat('ABSEN_PULANG');

    // Yang sama dengan data tercatat bukan perubahan.
    if (jamMasuk && jamMasuk === lamaMasuk) jamMasuk = '';
    if (jamPulang && jamPulang === lamaPulang) jamPulang = '';
    if (!jamMasuk && !jamPulang) throw new Error('Jam yang kamu isi sama dengan jam yang sudah tercatat. Ubah salah satunya.');

    // Jam pulang harus setelah jam masuk (memakai jam baru, atau yang sudah tercatat bila tidak diubah).
    const masukAkhir = jamMasuk || lamaMasuk;
    const pulangAkhir = jamPulang || lamaPulang;
    if (masukAkhir && pulangAkhir && timeToMinutes_(pulangAkhir) <= timeToMinutes_(masukAkhir)) {
      throw new Error('Jam pulang (' + pulangAkhir + ') harus setelah jam masuk (' + masukAkhir + ').');
    }

    // Satu pengajuan yang menunggu per tanggal.
    const adaMenunggu = getSheetObjects_(SHEET.KOREKSI).some(function (r) {
      return String(r.email || '').trim().toLowerCase() === promotor.email &&
        normalizeDateString_(r.tanggal) === tanggal &&
        normalizeText_(r.statusapproval) === 'MENUNGGU_APPROVAL';
    });
    if (adaMenunggu) throw new Error('Masih ada pengajuan koreksi untuk tanggal ini yang menunggu persetujuan manager.');

    const dataLama = 'Masuk: ' + (lamaMasuk || '--:--') + ' | Pulang: ' + (lamaPulang || '--:--');
    const dataBaru = 'Masuk: ' + (jamMasuk || '-') + ' | Pulang: ' + (jamPulang || '-');

    const timestamp = Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    const id = makeId_(['KOR', tanggal, promotor.email, KOREKSI_JENIS, new Date().getTime()]);

    const sheet = getSs_().getSheetByName(SHEET.KOREKSI);
    if (!sheet) throw new Error('Sheet REQUEST_KOREKSI tidak ditemukan.');

    sheet.appendRow([
      id, timestamp, promotor.email, promotor.nama, promotor.brand, promotor.cabang,
      tanggal, KOREKSI_JENIS, dataLama, dataBaru, alasan, 'MENUNGGU_APPROVAL', '', '', ''
    ]);

    bumpCabangVer_(promotor.cabang, promotor.email);
    return { ok: true, message: 'Pengajuan koreksi terkirim dan menunggu persetujuan manager.' };

  } catch (err) {
    return { ok: false, message: err.message };
  }
}

function apiSubmitIzinCuti(payload) {
  try {
    const data = payload || {};
    const email = String(data.email || '').trim().toLowerCase();
    const jenisPengajuan = normalizeText_(data.jenisPengajuan);
    const tanggalMulai = normalizeDateString_(data.tanggalMulai);
    const tanggalSelesai = normalizeDateString_(data.tanggalSelesai);
    const keterangan = String(data.keterangan || '').trim();
    const lampiranDataUrl = String(data.lampiranDataUrl || '');
    const lampiranFileName = String(data.lampiranFileName || '').trim();

    if (!email) throw new Error('Email kosong.');
    if (!requireSession_(email, data.token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');
    if (!jenisPengajuan) throw new Error('Jenis pengajuan wajib dipilih.');
    if (!tanggalMulai) throw new Error('Tanggal mulai wajib dipilih.');
    if (!tanggalSelesai) throw new Error('Tanggal selesai wajib dipilih.');
    if (!keterangan) throw new Error('Keterangan wajib diisi.');

    if (new Date(tanggalSelesai) < new Date(tanggalMulai)) {
      throw new Error('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
    }

    if (['SAKIT', 'CUTI_TAHUNAN'].includes(jenisPengajuan) && !lampiranDataUrl) {
      throw new Error('Pengajuan ' + readableStatusServer_(jenisPengajuan) + ' wajib melampirkan dokumen/foto pendukung.');
    }

    const promotor = findPromotorByEmail_(email);
    if (!promotor) throw new Error('Email promotor tidak terdaftar.');

    let lampiranUrl = '';
    if (lampiranDataUrl) {
      lampiranUrl = saveAttachment_(
        lampiranDataUrl,
        promotor.nama,
        jenisPengajuan,
        tanggalMulai,
        lampiranFileName
      );
    }

    const now = new Date();
    const timestamp = Utilities.formatDate(now, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

    const id = makeId_([
      'IZN',
      tanggalMulai,
      promotor.email,
      jenisPengajuan,
      new Date().getTime()
    ]);

    const sheet = getSs_().getSheetByName(SHEET.IZIN);
    if (!sheet) throw new Error('Sheet REQUEST_IZIN_CUTI tidak ditemukan.');

    sheet.appendRow([
      id,
      timestamp,
      promotor.email,
      promotor.nama,
      promotor.brand,
      promotor.cabang,
      jenisPengajuan,
      tanggalMulai,
      tanggalSelesai,
      keterangan,
      lampiranUrl,
      'MENUNGGU_APPROVAL',
      '',
      '',
      ''
    ]);

    bumpCabangVer_(promotor.cabang, promotor.email);
    return {
      ok: true,
      message: 'Pengajuan berhasil dikirim dan menunggu approval manager.'
    };

  } catch (err) {
    return {
      ok: false,
      message: err.message
    };
  }
}

// Inti satu persetujuan (tanpa cek sesi). Dipakai satuan maupun massal.
function processOneApproval_(manager, requestType, requestId, decision, catatan) {
  if (!requestId) throw new Error('ID request kosong.');
  if (!['KOREKSI', 'IZIN'].includes(requestType)) throw new Error('Tipe request tidak valid.');
  if (!['DISETUJUI', 'DITOLAK'].includes(decision)) throw new Error('Keputusan approval tidak valid.');
  if (decision === 'DITOLAK' && !catatan) throw new Error('Catatan wajib diisi saat menolak pengajuan.');
  const sheetName = requestType === 'KOREKSI' ? SHEET.KOREKSI : SHEET.IZIN;
  return updateApprovalStatus_(sheetName, requestId, decision, manager, catatan);
}

function apiProcessApproval(payload) {
  try {
    const data = payload || {};
    const managerEmail = String(data.managerEmail || '').trim().toLowerCase();
    const token = String(data.token || '').trim();
    const requestType = normalizeText_(data.requestType);
    const requestId = String(data.requestId || '').trim();
    const decision = normalizeText_(data.decision);
    const catatan = String(data.catatan || '').trim();

    if (!managerEmail) throw new Error('Email manager kosong.');
    if (!requireSession_(managerEmail, token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');

    const manager = findManagerByEmail_(managerEmail);
    if (!manager) throw new Error('Email manager tidak terdaftar atau tidak aktif.');

    const result = processOneApproval_(manager, requestType, requestId, decision, catatan);
    bumpCabangVer_(result.cabang || manager.cabang, result.requesterEmail);
    (result.extraBumpEmails || []).forEach(function (e) { try { bumpVer_([['U', e]]); } catch (x) {} });

    return {
      ok: true,
      message: 'Pengajuan berhasil diproses sebagai ' + decision + '.',
      updated: result
    };

  } catch (err) {
    return {
      ok: false,
      message: err.message
    };
  }
}

/**
 * Persetujuan MASSAL dalam satu panggilan: sheet pengajuan dibaca sekali, bukan sekali per pengajuan.
 * payload: {managerEmail, token, decision, catatan, items:[{type, id}]}. Tiap pengajuan berhasil/gagal sendiri-sendiri.
 */
function apiProcessApprovalBulk(payload) {
  try {
    const data = payload || {};
    const managerEmail = String(data.managerEmail || '').trim().toLowerCase();
    const token = String(data.token || '').trim();
    const decision = normalizeText_(data.decision) || 'DISETUJUI';
    const catatan = String(data.catatan || '').trim();
    const items = Array.isArray(data.items) ? data.items : [];

    if (!managerEmail) throw new Error('Email manager kosong.');
    if (!requireSession_(managerEmail, token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');
    if (!items.length) throw new Error('Tidak ada pengajuan yang dipilih.');
    if (items.length > 100) throw new Error('Maksimal 100 pengajuan sekali proses.');

    const manager = findManagerByEmail_(managerEmail);
    if (!manager) throw new Error('Email manager tidak terdaftar atau tidak aktif.');

    const results = [];
    const bumpPairs = [];
    const seen = {};
    withReadMemo_(function () {
      items.forEach(function (it) {
        const type = normalizeText_(it && it.type);
        const id = String((it && it.id) || '').trim();
        const key = type + '|' + id;
        if (seen[key]) return;           // jangan proses id yang sama dua kali
        seen[key] = true;
        try {
          const r = processOneApproval_(manager, type, id, decision, catatan);
          bumpPairs.push([r.cabang || manager.cabang, r.requesterEmail]);
          (r.extraBumpEmails || []).forEach(function (e) { bumpPairs.push([manager.cabang, e]); });
          results.push({ type: type, id: id, ok: true, updated: r });
        } catch (e) {
          results.push({ type: type, id: id, ok: false, message: e.message });
        }
      });
    });

    const pairs = [];
    const dedupe = {};
    bumpPairs.forEach(function (p) {
      [['C', p[0]], ['U', p[1]]].forEach(function (x) {
        const k = x[0] + '|' + x[1];
        if (x[1] && !dedupe[k]) { dedupe[k] = true; pairs.push(x); }
      });
    });
    pairs.push(['C', 'ALL']);
    try { bumpVer_(pairs); } catch (e) {}

    const okCount = results.filter(function (r) { return r.ok; }).length;
    return { ok: true, results: results, okCount: okCount, failCount: results.length - okCount };

  } catch (err) {
    return { ok: false, message: err.message };
  }
}


/****************************************************
 * MANAGER EXPORT EXCEL
 ****************************************************/

function createManagerExcelExport_(manager, options) {
  const range = getExportDateRange_(options || {});
  const type = normalizeText_((options && options.exportType) || 'SEMUA_DATA') || 'SEMUA_DATA';
  const brandFilter = normalizeText_(options && options.brand);
  const cabangManager = normalizeText_(manager.cabang);
  const isAdmin = normalizeText_(manager.role).includes('ADMIN');

  const exports = [];

  if (type === 'SEMUA_DATA' || type === 'JADWAL_KEHADIRAN') {
    exports.push(buildJadwalKehadiranExport_(manager, range, brandFilter, isAdmin, cabangManager));
  }

  if (type === 'SEMUA_DATA' || type === 'LOG_ABSENSI') {
    exports.push(buildAbsensiLogExport_(manager, range, brandFilter, isAdmin, cabangManager));
  }

  if (type === 'SEMUA_DATA' || type === 'CUTI_IZIN') {
    exports.push(buildIzinCutiExport_(manager, range, brandFilter, isAdmin, cabangManager));
  }

  if (type === 'SEMUA_DATA' || type === 'KOREKSI') {
    exports.push(buildKoreksiExport_(manager, range, brandFilter, isAdmin, cabangManager));
  }

  const cleanType = type.replace(/[^A-Z0-9]+/g, '_');
  const fileName = makeId_([
    'EXPORT_ABSENSI_PROMOTOR_ELS',
    cleanType,
    range.startDate,
    range.endDate,
    brandFilter || 'SEMUA_BRAND'
  ]);

  const file = createXlsxFileFromSheets_(fileName, exports);

  return {
    fileName: file.getName(),
    fileUrl: file.getUrl(),
    downloadUrl: 'https://drive.google.com/uc?export=download&id=' + file.getId(),
    sheetCount: exports.length,
    startDate: range.startDate,
    endDate: range.endDate
  };
}

function getExportDateRange_(options) {
  const month = String((options && options.month) || '').trim();
  let startDate = normalizeDateString_(options && options.startDate);
  let endDate = normalizeDateString_(options && options.endDate);

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const parts = month.split('-');
    const year = Number(parts[0]);
    const monthIndex = Number(parts[1]) - 1;
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0);
    startDate = Utilities.formatDate(start, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
    endDate = Utilities.formatDate(end, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
  }

  if (!startDate && !endDate) {
    startDate = getToday_();
    endDate = getToday_();
  }

  if (startDate && !endDate) endDate = startDate;
  if (!startDate && endDate) startDate = endDate;

  if (new Date(endDate + 'T00:00:00') < new Date(startDate + 'T00:00:00')) {
    throw new Error('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
  }

  return { startDate, endDate };
}

function buildJadwalKehadiranExport_(manager, range, brandFilter, isAdmin, cabangManager) {
  const scheduleRows = getSheetObjects_(SHEET.PROSES)
    .filter(item => isDateInRange_(normalizeDateString_(item.tanggal), range.startDate, range.endDate))
    .filter(item => isAdmin || normalizeText_(item.cabang) === cabangManager)
    .filter(item => !brandFilter || normalizeText_(item.brand) === brandFilter);

  const absensi = getSheetObjects_(SHEET.ABSENSI)
    .filter(item => isDateInRange_(normalizeDateString_(item.tanggal), range.startDate, range.endDate))
    .filter(item => isAdmin || normalizeText_(item.cabang) === cabangManager)
    .filter(item => !brandFilter || normalizeText_(item.brand) === brandFilter);

  const absensiMap = {};
  absensi.forEach(item => {
    const key = makeAttendanceKey_(normalizeDateString_(item.tanggal), String(item.email || '').trim().toLowerCase(), normalizeText_(item.jenisabsen));
    absensiMap[key] = item;
  });

  const izinRows = getSheetObjects_(SHEET.IZIN)
    .filter(item => isAdmin || normalizeText_(item.cabang) === cabangManager)
    .filter(item => !brandFilter || normalizeText_(item.brand) === brandFilter)
    .filter(item => isRangeOverlap_(normalizeDateString_(item.tanggalmulai), normalizeDateString_(item.tanggalselesai), range.startDate, range.endDate));

  const izinMap = {};
  izinRows.forEach(item => {
    const email = String(item.email || '').trim().toLowerCase();
    const mulai = normalizeDateString_(item.tanggalmulai);
    const selesai = normalizeDateString_(item.tanggalselesai);
    eachDateInRange_(range.startDate, range.endDate, dateText => {
      if (isDateBetween_(dateText, mulai, selesai)) {
        const key = dateText + '|' + email;
        const status = normalizeText_(item.statusapproval);
        if (!izinMap[key] || status === 'DISETUJUI') izinMap[key] = item;
      }
    });
  });

  const values = scheduleRows.map(item => {
    const tanggal = normalizeDateString_(item.tanggal);
    const email = String(item.email || '').trim().toLowerCase();
    const masuk = absensiMap[makeAttendanceKey_(tanggal, email, 'ABSEN_MASUK')] || {};
    const mulaiIstirahat = absensiMap[makeAttendanceKey_(tanggal, email, 'MULAI_ISTIRAHAT')] || {};
    const selesaiIstirahat = absensiMap[makeAttendanceKey_(tanggal, email, 'SELESAI_ISTIRAHAT')] || {};
    const pulang = absensiMap[makeAttendanceKey_(tanggal, email, 'ABSEN_PULANG')] || {};
    const izin = izinMap[tanggal + '|' + email] || {};

    let statusFinal = 'BELUM ABSEN';
    const shift = normalizeShift_(item.shift);
    const statusJadwal = normalizeText_(item.statusjadwal);
    if (shift === 'OFF' || statusJadwal === 'OFF') statusFinal = 'OFF';
    else if (izin && izin.jenispengajuan) statusFinal = readableStatusServer_(izin.jenispengajuan) + ' - ' + normalizeText_(izin.statusapproval);
    else if (masuk.jamaktual && normalizeText_(masuk.status) === 'TERLAMBAT') statusFinal = 'TERLAMBAT';
    else if (masuk.jamaktual) statusFinal = 'HADIR';

    return [
      tanggal,
      normalizeText_(item.hari),
      email,
      normalizeText_(item.nama),
      normalizeText_(item.brand),
      normalizeText_(item.cabang),
      shift,
      formatJam_(item.jammasuk),
      formatJam_(item.jampulang),
      formatJam_(masuk.jamaktual),
      normalizeText_(masuk.status),
      masuk.jarakmeter || '',
      formatJam_(mulaiIstirahat.jamaktual),
      formatJam_(selesaiIstirahat.jamaktual),
      formatJam_(pulang.jamaktual),
      normalizeText_(pulang.status),
      pulang.jarakmeter || '',
      statusFinal,
      normalizeText_(izin.jenispengajuan),
      normalizeText_(izin.statusapproval),
      izin.keterangan || '',
      masuk.foto || '',
      pulang.foto || '',
      izin.lampiran || '',
      masuk.catatan || pulang.catatan || ''
    ];
  });

  return {
    name: 'JADWAL_KEHADIRAN',
    headers: [
      'Tanggal', 'Hari', 'Email', 'Nama', 'Brand', 'Cabang', 'Shift',
      'Jam Masuk Jadwal', 'Jam Pulang Jadwal',
      'Jam Masuk Aktual', 'Status Masuk', 'Jarak Masuk Meter',
      'Mulai Istirahat', 'Selesai Istirahat',
      'Jam Pulang Aktual', 'Status Pulang', 'Jarak Pulang Meter',
      'Status Final', 'Jenis Izin/Cuti', 'Status Izin/Cuti', 'Keterangan Izin/Cuti',
      'Link Foto Masuk', 'Link Foto Pulang', 'Link Lampiran', 'Catatan'
    ],
    rows: values
  };
}

function buildAbsensiLogExport_(manager, range, brandFilter, isAdmin, cabangManager) {
  const rows = getSheetObjects_(SHEET.ABSENSI)
    .filter(item => isDateInRange_(normalizeDateString_(item.tanggal), range.startDate, range.endDate))
    .filter(item => isAdmin || normalizeText_(item.cabang) === cabangManager)
    .filter(item => !brandFilter || normalizeText_(item.brand) === brandFilter)
    .map(item => [
      item.id || '',
      item.timestamp || '',
      normalizeDateString_(item.tanggal),
      String(item.email || '').trim().toLowerCase(),
      normalizeText_(item.nama),
      normalizeText_(item.brand),
      normalizeText_(item.cabang),
      normalizeText_(item.jenisabsen),
      normalizeText_(item.shift),
      formatJam_(item.jamjadwal),
      formatJam_(item.jamaktual),
      normalizeText_(item.status),
      item.foto || '',
      item.latitude || '',
      item.longitude || '',
      item.jarakmeter || '',
      item.catatan || ''
    ]);

  return {
    name: 'LOG_ABSENSI',
    headers: [
      'ID', 'Timestamp', 'Tanggal', 'Email', 'Nama', 'Brand', 'Cabang',
      'Jenis Absen', 'Shift', 'Jam Jadwal', 'Jam Aktual', 'Status',
      'Link Foto', 'Latitude', 'Longitude', 'Jarak Meter', 'Catatan'
    ],
    rows
  };
}

function buildIzinCutiExport_(manager, range, brandFilter, isAdmin, cabangManager) {
  const rows = getSheetObjects_(SHEET.IZIN)
    .filter(item => isAdmin || normalizeText_(item.cabang) === cabangManager)
    .filter(item => !brandFilter || normalizeText_(item.brand) === brandFilter)
    .filter(item => isRangeOverlap_(normalizeDateString_(item.tanggalmulai), normalizeDateString_(item.tanggalselesai), range.startDate, range.endDate))
    .map(item => [
      item.idrequest || '',
      item.timestamp || '',
      String(item.email || '').trim().toLowerCase(),
      normalizeText_(item.nama),
      normalizeText_(item.brand),
      normalizeText_(item.cabang),
      normalizeText_(item.jenispengajuan),
      normalizeDateString_(item.tanggalmulai),
      normalizeDateString_(item.tanggalselesai),
      item.keterangan || '',
      item.lampiran || '',
      normalizeText_(item.statusapproval),
      item.approvedby || '',
      item.catatanmanager || '',
      item.waktuapproval || ''
    ]);

  return {
    name: 'CUTI_IZIN',
    headers: [
      'ID Request', 'Timestamp', 'Email', 'Nama', 'Brand', 'Cabang',
      'Jenis Pengajuan', 'Tanggal Mulai', 'Tanggal Selesai', 'Keterangan',
      'Link Lampiran', 'Status Approval', 'Approved By', 'Catatan Manager', 'Waktu Approval'
    ],
    rows
  };
}

function buildKoreksiExport_(manager, range, brandFilter, isAdmin, cabangManager) {
  const rows = getSheetObjects_(SHEET.KOREKSI)
    .filter(item => isAdmin || normalizeText_(item.cabang) === cabangManager)
    .filter(item => !brandFilter || normalizeText_(item.brand) === brandFilter)
    .filter(item => isDateInRange_(normalizeDateString_(item.tanggal), range.startDate, range.endDate))
    .map(item => [
      item.idrequest || '',
      item.timestamp || '',
      String(item.email || '').trim().toLowerCase(),
      normalizeText_(item.nama),
      normalizeText_(item.brand),
      normalizeText_(item.cabang),
      normalizeDateString_(item.tanggal),
      normalizeText_(item.jeniskoreksi),
      item.datalama || '',
      item.databaru || '',
      item.alasan || '',
      normalizeText_(item.statusapproval),
      item.approvedby || '',
      item.catatanmanager || '',
      item.waktuapproval || ''
    ]);

  return {
    name: 'KOREKSI',
    headers: [
      'ID Request', 'Timestamp', 'Email', 'Nama', 'Brand', 'Cabang',
      'Tanggal', 'Jenis Koreksi', 'Data Lama', 'Data Baru', 'Alasan',
      'Status Approval', 'Approved By', 'Catatan Manager', 'Waktu Approval'
    ],
    rows
  };
}

function createXlsxFileFromSheets_(fileName, sheetsData) {
  const folder = getOrCreateFolder_(APP_CONFIG.EXPORT_FOLDER_NAME);
  const tempSs = SpreadsheetApp.create(fileName);
  const tempFile = DriveApp.getFileById(tempSs.getId());

  try {
    const defaultSheet = tempSs.getSheets()[0];

    sheetsData.forEach((sheetData, index) => {
      const sheet = index === 0 ? defaultSheet : tempSs.insertSheet();
      sheet.setName(sanitizeSheetName_(sheetData.name || ('DATA_' + (index + 1))));

      const headers = sheetData.headers || [];
      const rows = sheetData.rows || [];
      const values = [headers].concat(rows);

      sheet.clearContents();
      if (values.length && headers.length) {
        sheet.getRange(1, 1, values.length, headers.length).setValues(values);
        sheet.setFrozenRows(1);
        const headerRange = sheet.getRange(1, 1, 1, headers.length);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#f37021');
        headerRange.setFontColor('#ffffff');
        sheet.autoResizeColumns(1, Math.min(headers.length, 25));
        if (rows.length > 0) {
          sheet.getRange(2, 1, rows.length, headers.length).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
        }
      }
    });

    SpreadsheetApp.flush();
    Utilities.sleep(800);

    const exportUrl = 'https://docs.google.com/spreadsheets/d/' + tempSs.getId() + '/export?format=xlsx';
    const response = UrlFetchApp.fetch(exportUrl, {
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      throw new Error('Gagal membuat file Excel. Response code: ' + response.getResponseCode() + '. ' + response.getContentText().slice(0, 300));
    }

    const blob = response.getBlob().setName(fileName + '.xlsx');
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return file;

  } finally {
    try {
      tempFile.setTrashed(true);
    } catch (err) {
      Logger.log('Gagal menghapus temp spreadsheet: ' + err.message);
    }
  }
}

function sanitizeSheetName_(name) {
  const clean = String(name || 'DATA')
    .replace(/[\\/?*\[\]:]/g, ' ')
    .trim()
    .slice(0, 90);

  return clean || 'DATA';
}

function makeAttendanceKey_(tanggal, email, jenisAbsen) {
  return [
    normalizeDateString_(tanggal),
    String(email || '').trim().toLowerCase(),
    normalizeText_(jenisAbsen)
  ].join('|');
}

function isDateInRange_(dateText, startDate, endDate) {
  const d = normalizeDateString_(dateText);
  if (!d) return false;
  return d >= startDate && d <= endDate;
}

function isRangeOverlap_(itemStart, itemEnd, rangeStart, rangeEnd) {
  const start = normalizeDateString_(itemStart) || rangeStart;
  const end = normalizeDateString_(itemEnd) || start;
  return start <= rangeEnd && end >= rangeStart;
}

function eachDateInRange_(startDate, endDate, callback) {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    callback(Utilities.formatDate(d, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd'));
  }
}




/****************************************************
 * AUDIT HARIAN MANAGER + BACKUP OTOMATIS
 ****************************************************/

function getDailyAudit_(manager, options) {
  const tanggal = normalizeDateString_(options && options.tanggal) || getToday_();
  const brandFilter = normalizeText_(options && options.brand);
  const cabangManager = normalizeText_(manager.cabang);
  const isAdmin = normalizeText_(manager.role).includes('ADMIN');

  const monitoring = getManagerMonitoring_(manager, {
    tanggal,
    brand: brandFilter
  });

  const sections = {
    belumMasuk: [],
    sudahMasukBelumPulang: [],
    pulangTanpaMasuk: [],
    terlambat: [],
    izinPending: [],
    lampiranKosong: [],
    lokasiDiLuarRadius: []
  };

  (monitoring.rows || []).forEach(row => {
    const isOff = row.status === 'OFF' || row.shift === 'OFF';
    const hasApprovedIzin = row.izin && row.izin.status === 'DISETUJUI';

    if (!isOff && !hasApprovedIzin && !row.masuk) {
      sections.belumMasuk.push(auditPersonFromMonitoring_(row, 'Belum absen masuk'));
    }

    if (!isOff && !hasApprovedIzin && row.masuk && !row.pulang) {
      sections.sudahMasukBelumPulang.push(auditPersonFromMonitoring_(row, 'Sudah masuk, belum pulang'));
    }

    if (!row.masuk && row.pulang) {
      sections.pulangTanpaMasuk.push(auditPersonFromMonitoring_(row, 'Ada absen pulang tanpa absen masuk'));
    }

    if (row.masuk && row.masuk.status === 'TERLAMBAT') {
      sections.terlambat.push(auditPersonFromMonitoring_(row, 'Terlambat: ' + (row.masuk.jamAktual || '-')));
    }
  });

  const izinRows = getSheetObjects_(SHEET.IZIN)
    .filter(item => isAdmin || normalizeText_(item.cabang) === cabangManager)
    .filter(item => !brandFilter || normalizeText_(item.brand) === brandFilter)
    .filter(item => isDateBetween_(tanggal, normalizeDateString_(item.tanggalmulai), normalizeDateString_(item.tanggalselesai)));

  izinRows.forEach(item => {
    const status = normalizeText_(item.statusapproval);
    const jenis = normalizeText_(item.jenispengajuan);
    const lampiran = String(item.lampiran || '').trim();

    if (status === 'MENUNGGU_APPROVAL') {
      sections.izinPending.push({
        nama: normalizeText_(item.nama),
        brand: normalizeText_(item.brand),
        cabang: normalizeText_(item.cabang),
        status: readableStatusServer_(jenis),
        detail: 'Menunggu approval • ' + normalizeDateString_(item.tanggalmulai) + ' s.d. ' + normalizeDateString_(item.tanggalselesai),
        link: lampiran
      });
    }

    if (['SAKIT', 'CUTI_TAHUNAN'].includes(jenis) && !lampiran && ['MENUNGGU_APPROVAL', 'DISETUJUI'].includes(status)) {
      sections.lampiranKosong.push({
        nama: normalizeText_(item.nama),
        brand: normalizeText_(item.brand),
        cabang: normalizeText_(item.cabang),
        status: readableStatusServer_(jenis),
        detail: 'Lampiran kosong pada pengajuan ' + readableStatusServer_(jenis) + ' • Status: ' + readableStatusServer_(status),
        link: ''
      });
    }
  });

  const lokasiMap = {};
  getSheetObjects_(SHEET.LOKASI).forEach(item => {
    const cabang = normalizeText_(item.cabang);
    if (!cabang) return;
    lokasiMap[cabang] = {
      radius: Number(item.radiusmeter || 0) || 0
    };
  });

  getSheetObjects_(SHEET.ABSENSI)
    .filter(item => normalizeDateString_(item.tanggal) === tanggal)
    .filter(item => isAdmin || normalizeText_(item.cabang) === cabangManager)
    .filter(item => !brandFilter || normalizeText_(item.brand) === brandFilter)
    .forEach(item => {
      const cabang = normalizeText_(item.cabang);
      const radius = lokasiMap[cabang] ? Number(lokasiMap[cabang].radius || 0) : 0;
      const jarak = Number(item.jarakmeter || 0);

      if (radius > 0 && jarak > radius) {
        sections.lokasiDiLuarRadius.push({
          nama: normalizeText_(item.nama),
          brand: normalizeText_(item.brand),
          cabang,
          status: normalizeText_(item.jenisabsen),
          detail: 'Jarak sekitar ' + Math.round(jarak) + ' m dari titik toko. Radius: ' + radius + ' m.',
          link: item.foto || ''
        });
      }
    });

  const counts = {};
  Object.keys(sections).forEach(key => counts[key] = sections[key].length);

  const totalIssues = Object.keys(counts).reduce((sum, key) => sum + counts[key], 0);

  return {
    tanggal,
    brand: brandFilter,
    cabang: isAdmin ? 'ALL' : cabangManager,
    counts,
    totalIssues,
    sections
  };
}

function auditPersonFromMonitoring_(row, detail) {
  return {
    nama: row.nama || '',
    brand: row.brand || '',
    cabang: row.cabang || '',
    status: row.statusLabel || row.status || '',
    detail: detail || '',
    shift: row.shift || '',
    jamMasukJadwal: row.jamMasukJadwal || '',
    jamPulangJadwal: row.jamPulangJadwal || '',
    masuk: row.masuk || null,
    pulang: row.pulang || null,
    link: row.fotoMasuk || row.fotoPulang || ''
  };
}

function runManualBackup() {
  const result = createBackupFile_({
    mode: 'MANUAL_SHEET',
    actor: Session.getActiveUser().getEmail() || 'OWNER'
  });

  SpreadsheetApp.getUi().alert(
    'Backup berhasil dibuat.\\n\\n' +
    result.fileName + '\\n' +
    result.fileUrl
  );
}

function installDailyBackupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction && trigger.getHandlerFunction() === 'backupDailyTrigger') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('backupDailyTrigger')
    .timeBased()
    .everyDays(1)
    .atHour(23)
    .create();

  SpreadsheetApp.getUi().alert('Backup otomatis harian berhasil dipasang. Backup akan berjalan sekitar pukul 23.00 setiap hari.');
}

function backupDailyTrigger() {
  return createBackupFile_({
    mode: 'AUTO_DAILY',
    actor: 'TRIGGER_HARIAN'
  });
}

function createBackupFile_(options) {
  options = options || {};
  const ss = getSs_();
  const folder = getOrCreateFolder_(APP_CONFIG.BACKUP_FOLDER_NAME);
  const now = new Date();
  const backupAt = Utilities.formatDate(now, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  const stamp = Utilities.formatDate(now, APP_CONFIG.TIMEZONE, 'yyyyMMdd_HHmmss');
  const mode = normalizeText_(options.mode || 'MANUAL');
  const fileName = 'BACKUP_ABSENSI_PROMOTOR_ELS_' + mode + '_' + stamp;

  const backupSs = SpreadsheetApp.create(fileName);
  const backupFile = DriveApp.getFileById(backupSs.getId());

  try {
    moveFileToFolder_(backupFile, folder);

    const sheetNames = [
      SHEET.CONFIG,
      SHEET.PROMOTOR,
      SHEET.MANAGER,
      SHEET.LOKASI,
      SHEET.SHIFT,
      SHEET.RAW,
      SHEET.PROSES,
      SHEET.ABSENSI,
      SHEET.KOREKSI,
      SHEET.IZIN,
      SHEET.INFO
    ];

    const defaultSheet = backupSs.getSheets()[0];
    let usedDefault = false;
    let copied = 0;

    sheetNames.forEach(name => {
      const source = ss.getSheetByName(name);
      if (!source) return;

      const target = usedDefault ? backupSs.insertSheet(sanitizeSheetName_(name)) : defaultSheet;
      if (!usedDefault) {
        target.setName(sanitizeSheetName_(name));
        usedDefault = true;
      }

      const values = source.getDataRange().getValues();
      target.clear();
      if (values.length && values[0].length) {
        target.getRange(1, 1, values.length, values[0].length).setValues(values);
        target.setFrozenRows(1);
        target.autoResizeColumns(1, Math.min(values[0].length, 30));
      }
      copied++;
    });

    const info = backupSs.insertSheet('INFO_BACKUP');
    info.getRange(1, 1, 6, 2).setValues([
      ['Backup At', backupAt],
      ['Mode', mode],
      ['Actor', options.actor || ''],
      ['Source Spreadsheet', ss.getName()],
      ['Source ID', ss.getId()],
      ['Total Sheet Copied', copied]
    ]);
    info.autoResizeColumns(1, 2);

    SpreadsheetApp.flush();

    backupFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      fileName,
      fileUrl: backupFile.getUrl(),
      backupAt,
      sheets: copied
    };

  } catch (err) {
    throw new Error('Backup gagal: ' + err.message);
  }
}

function moveFileToFolder_(file, folder) {
  try {
    file.moveTo(folder);
  } catch (err) {
    folder.addFile(file);
    try {
      DriveApp.getRootFolder().removeFile(file);
    } catch (e) {}
  }
}



/****************************************************
 * JADWAL PROMOTOR
 ****************************************************/

function getPromotorScheduleView_(promotor, options) {
  const today = getToday_();
  const selectedDate = normalizeDateString_(options && options.selectedDate) || today;
  const month = String((options && options.month) || selectedDate.slice(0, 7) || today.slice(0, 7)).trim();
  const cabang = normalizeText_(promotor.cabang);
  const myEmail = String(promotor.email || '').trim().toLowerCase();

  const schedules = getSheetObjects_(SHEET.PROSES);
  const monthRows = schedules
    .filter(item => normalizeDateString_(item.tanggal).slice(0, 7) === month)
    .filter(item => normalizeText_(item.cabang) === cabang);

  // Absensi aktual bulan ini punya sendiri, buat kasih jam masuk/pulang beneran di kalender.
  const myAttendanceMonth = getSheetObjects_(SHEET.ABSENSI)
    .filter(item => String(item.email || '').trim().toLowerCase() === myEmail)
    .filter(item => normalizeDateString_(item.tanggal).slice(0, 7) === month);

  const attendanceByDate = {};
  myAttendanceMonth.forEach(item => {
    const tgl = normalizeDateString_(item.tanggal);
    if (!attendanceByDate[tgl]) attendanceByDate[tgl] = {};
    const jenis = normalizeText_(item.jenisabsen);
    if (jenis === 'ABSEN_MASUK') {
      attendanceByDate[tgl].jamMasukAktual = formatJam_(item.jamaktual);
      attendanceByDate[tgl].statusMasuk = normalizeText_(item.status);
    }
    if (jenis === 'ABSEN_PULANG') {
      attendanceByDate[tgl].jamPulangAktual = formatJam_(item.jamaktual);
      attendanceByDate[tgl].statusPulang = normalizeText_(item.status);
    }
  });

  // Tandai tanggal yang masih ada pengajuan koreksi/izin menunggu approval (buat badge "!").
  const pendingDates = {};
  getSheetObjects_(SHEET.KOREKSI)
    .filter(item => String(item.email || '').trim().toLowerCase() === myEmail)
    .filter(item => normalizeText_(item.statusapproval) === 'MENUNGGU_APPROVAL')
    .forEach(item => { pendingDates[normalizeDateString_(item.tanggal)] = true; });

  getSheetObjects_(SHEET.IZIN)
    .filter(item => String(item.email || '').trim().toLowerCase() === myEmail)
    .filter(item => normalizeText_(item.statusapproval) === 'MENUNGGU_APPROVAL')
    .forEach(item => {
      eachDateInRange_(normalizeDateString_(item.tanggalmulai), normalizeDateString_(item.tanggalselesai), tgl => {
        if (tgl.slice(0, 7) === month) pendingDates[tgl] = true;
      });
    });

  const myMonthRows = monthRows
    .filter(item => isScheduleRowForPromotor_(item, promotor))
    .map(item => {
      const lite = scheduleLiteFromRow_(item, selectedDate);
      const att = attendanceByDate[lite.tanggal] || {};
      lite.jamMasukAktual = att.jamMasukAktual || '';
      lite.jamPulangAktual = att.jamPulangAktual || '';
      lite.statusMasuk = att.statusMasuk || '';
      lite.hasPending = !!pendingDates[lite.tanggal];
      return lite;
    })
    .sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)));

  const selectedRows = schedules
    .filter(item => normalizeDateString_(item.tanggal) === selectedDate)
    .filter(item => normalizeText_(item.cabang) === cabang);

  const mySchedule = findScheduleForPromotor_(promotor, selectedDate);

  const groups = {
    PAGI: [],
    SIANG: [],
    MIDDLE: [],
    OFF: [],
    LAINNYA: []
  };

  selectedRows.forEach(item => {
    const shift = normalizeShift_(item.shift) || 'LAINNYA';
    const groupKey = groups[shift] ? shift : 'LAINNYA';

    groups[groupKey].push({
      nama: normalizeText_(item.nama),
      brand: normalizeText_(item.brand),
      cabang: normalizeText_(item.cabang),
      email: String(item.email || '').trim().toLowerCase(),
      shift,
      jamMasuk: formatJam_(item.jammasuk),
      jamPulang: formatJam_(item.jampulang),
      statusJadwal: normalizeText_(item.statusjadwal),
      isMe: isScheduleRowForPromotor_(item, promotor)
    });
  });

  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => {
      if (a.isMe !== b.isMe) return a.isMe ? -1 : 1;
      return String(a.nama).localeCompare(String(b.nama));
    });
  });

  const counts = {};
  Object.keys(groups).forEach(key => counts[key] = groups[key].length);

  return {
    month,
    selectedDate,
    today,
    user: {
      email: promotor.email,
      nama: promotor.nama,
      brand: promotor.brand,
      cabang: promotor.cabang
    },
    mySchedule: mySchedule ? {
      tanggal: mySchedule.tanggal,
      hari: mySchedule.hari,
      shift: mySchedule.shift,
      jamMasuk: mySchedule.jamMasuk,
      jamPulang: mySchedule.jamPulang,
      statusJadwal: mySchedule.statusJadwal
    } : null,
    myMonthRows,
    groups,
    counts
  };
}

function isScheduleRowForPromotor_(item, promotor) {
  const rowEmail = String(item.email || '').trim().toLowerCase();
  const targetEmail = String((promotor && promotor.email) || '').trim().toLowerCase();

  if (rowEmail && targetEmail && rowEmail === targetEmail) return true;

  const rowNama = normalizeText_(item.nama);
  const targetNama = normalizeText_((promotor && promotor.nama) || '');
  const rowBrand = normalizeText_(item.brand);
  const targetBrand = normalizeText_((promotor && promotor.brand) || '');
  const rowCabang = normalizeText_(item.cabang);
  const targetCabang = normalizeText_((promotor && promotor.cabang) || '');

  if (rowNama === targetNama && rowBrand === targetBrand && rowCabang === targetCabang) return true;

  const rowLoose = normalizeLooseName_(rowNama);
  const targetLoose = normalizeLooseName_(targetNama);
  return rowLoose && targetLoose && rowLoose === targetLoose && rowBrand === targetBrand && rowCabang === targetCabang;
}

function scheduleLiteFromRow_(item, selectedDate) {
  const tanggal = normalizeDateString_(item.tanggal);
  const shift = normalizeShift_(item.shift);

  return {
    tanggal,
    hari: normalizeText_(item.hari),
    shift,
    jamMasuk: formatJam_(item.jammasuk),
    jamPulang: formatJam_(item.jampulang),
    statusJadwal: normalizeText_(item.statusjadwal),
    isSelected: tanggal === selectedDate
  };
}


/****************************************************
 * MANAGER DASHBOARD & APPROVAL
 ****************************************************/

function getManagerDashboard_(manager, options) {
  const cabangManager = normalizeText_(manager.cabang);
  const isAdmin = normalizeText_(manager.role).includes('ADMIN');

  const result = {
    pending: [],
    history: [],
    monitoring: getManagerMonitoring_(manager, options || {}),
    companyInfo: getAllCompanyInfo_().slice(0, 20),
    counts: {
      pendingKoreksi: 0,
      pendingIzin: 0,
      done: 0
    }
  };

  const koreksi = getSheetObjectsWithRow_(SHEET.KOREKSI);
  koreksi.forEach(item => {
    if (!isAdmin && normalizeText_(item.cabang) !== cabangManager) return;

    const request = {
      type: 'KOREKSI',
      id: item.idrequest || '',
      timestamp: item.timestamp || '',
      email: String(item.email || '').trim().toLowerCase(),
      nama: normalizeText_(item.nama),
      brand: normalizeText_(item.brand),
      cabang: normalizeText_(item.cabang),
      tanggal: normalizeDateString_(item.tanggal),
      jenis: normalizeText_(item.jeniskoreksi),
      dataLama: item.datalama || '',
      dataBaru: item.databaru || '',
      alasan: item.alasan || '',
      status: normalizeText_(item.statusapproval),
      approvedBy: item.approvedby || '',
      catatanManager: item.catatanmanager || '',
      waktuApproval: item.waktuapproval || '',
      rowNumber: item.__rowNumber
    };

    if (request.status === 'MENUNGGU_APPROVAL') {
      result.pending.push(request);
      result.counts.pendingKoreksi++;
    } else if (request.status) {
      result.history.push(request);
      result.counts.done++;
    }
  });

  const izin = getSheetObjectsWithRow_(SHEET.IZIN);
  izin.forEach(item => {
    if (!isAdmin && normalizeText_(item.cabang) !== cabangManager) return;

    const request = {
      type: 'IZIN',
      id: item.idrequest || '',
      timestamp: item.timestamp || '',
      email: String(item.email || '').trim().toLowerCase(),
      nama: normalizeText_(item.nama),
      brand: normalizeText_(item.brand),
      cabang: normalizeText_(item.cabang),
      jenis: normalizeText_(item.jenispengajuan),
      tanggalMulai: normalizeDateString_(item.tanggalmulai),
      tanggalSelesai: normalizeDateString_(item.tanggalselesai),
      keterangan: item.keterangan || '',
      lampiran: item.lampiran || '',
      status: normalizeText_(item.statusapproval),
      approvedBy: item.approvedby || '',
      catatanManager: item.catatanmanager || '',
      waktuApproval: item.waktuapproval || '',
      rowNumber: item.__rowNumber
    };

    if (request.status === 'MENUNGGU_APPROVAL') {
      result.pending.push(request);
      result.counts.pendingIzin++;
    } else if (request.status) {
      result.history.push(request);
      result.counts.done++;
    }
  });

  const currentMonth = getToday_().slice(0, 7);
  // Riwayat hanya bulan berjalan. Tanggal yang tak terbaca tetap ditampilkan (lebih aman daripada hilang).
  result.history = result.history.filter(r => { const mo = monthOfText_(r.waktuApproval || r.timestamp); return !mo || mo === currentMonth; });
  result.counts.done = result.history.length;

  result.pending.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  result.history.sort((a, b) => String(b.waktuApproval || b.timestamp).localeCompare(String(a.waktuApproval || a.timestamp)));
  result.history = result.history.slice(0, 200);

  return result;
}


function getManagerMonitoring_(manager, options) {
  const cabangManager = normalizeText_(manager.cabang);
  const isAdmin = normalizeText_(manager.role).includes('ADMIN');
  const tanggal = normalizeDateString_(options && options.tanggal) || getToday_();
  const brandFilter = normalizeText_(options && options.brand);

  const schedules = getSheetObjects_(SHEET.PROSES)
    .filter(item => normalizeDateString_(item.tanggal) === tanggal)
    .filter(item => isAdmin || normalizeText_(item.cabang) === cabangManager)
    .filter(item => !brandFilter || normalizeText_(item.brand) === brandFilter);

  const absensi = (tanggal === getToday_() ? getSheetObjectsTail_(SHEET.ABSENSI, 1500) : getSheetObjects_(SHEET.ABSENSI))
    .filter(item => normalizeDateString_(item.tanggal) === tanggal);

  const absensiMap = {};
  absensi.forEach(item => {
    const email = String(item.email || '').trim().toLowerCase();
    if (!email) return;
    if (!absensiMap[email]) absensiMap[email] = {};

    const jenis = normalizeText_(item.jenisabsen);
    absensiMap[email][jenis] = {
      jenisAbsen: jenis,
      jamAktual: formatJam_(item.jamaktual),
      jamJadwal: formatJam_(item.jamjadwal),
      status: normalizeText_(item.status),
      foto: item.foto || '',
      jarakMeter: item.jarakmeter || '',
      catatan: item.catatan || ''
    };
  });

  const izinRows = getSheetObjects_(SHEET.IZIN)
    .filter(item => isAdmin || normalizeText_(item.cabang) === cabangManager)
    .filter(item => !brandFilter || normalizeText_(item.brand) === brandFilter)
    .filter(item => isDateBetween_(tanggal, normalizeDateString_(item.tanggalmulai), normalizeDateString_(item.tanggalselesai)))
    .filter(item => ['MENUNGGU_APPROVAL', 'DISETUJUI'].includes(normalizeText_(item.statusapproval)));

  const izinMap = {};
  izinRows.forEach(item => {
    const email = String(item.email || '').trim().toLowerCase();
    if (!email) return;
    const current = izinMap[email];
    const status = normalizeText_(item.statusapproval);
    if (!current || status === 'DISETUJUI') {
      izinMap[email] = {
        jenis: normalizeText_(item.jenispengajuan),
        status: status,
        tanggalMulai: normalizeDateString_(item.tanggalmulai),
        tanggalSelesai: normalizeDateString_(item.tanggalselesai),
        keterangan: item.keterangan || '',
        lampiran: item.lampiran || ''
      };
    }
  });

  const photoMap = {};
  getSheetObjects_(SHEET.PROMOTOR).forEach(r => {
    const em = String(r.email || '').trim().toLowerCase();
    if (em) photoMap[em] = { dasar: r.fotodasar || '', profil: r.fotoprofil || '' };
  });

  const rows = [];
  const seenEmails = {};

  schedules.forEach(item => {
    const email = String(item.email || '').trim().toLowerCase();
    const nama = normalizeText_(item.nama);
    const brand = normalizeText_(item.brand);
    const cabang = normalizeText_(item.cabang);
    const shift = normalizeShift_(item.shift);
    const statusJadwal = normalizeText_(item.statusjadwal);
    const isOff = shift === 'OFF' || statusJadwal === 'OFF';
    const att = absensiMap[email] || {};
    const masuk = att.ABSEN_MASUK || null;
    const pulang = att.ABSEN_PULANG || null;
    const izin = izinMap[email] || null;

    let status = 'BELUM_MASUK';
    let statusLabel = 'Belum Absen';
    let sort = 30;

    if (isOff) {
      status = 'OFF';
      statusLabel = 'OFF';
      sort = 70;
    } else if (izin && izin.status === 'DISETUJUI') {
      status = izin.jenis || 'IZIN_CUTI';
      statusLabel = readableStatusServer_(izin.jenis || 'IZIN/CUTI');
      sort = 60;
    } else if (izin && izin.status === 'MENUNGGU_APPROVAL') {
      status = 'IZIN_MENUNGGU';
      statusLabel = 'Izin Menunggu';
      sort = 20;
    } else if (!masuk) {
      status = 'BELUM_MASUK';
      statusLabel = 'Belum Absen';
      sort = 10;
    } else if (pulang) {
      status = 'SUDAH_PULANG';
      statusLabel = 'Sudah Pulang';
      sort = 50;
    } else if (masuk.status === 'TERLAMBAT') {
      status = 'BELUM_PULANG_TERLAMBAT';
      statusLabel = 'Belum Pulang';
      sort = 15;
    } else {
      status = 'BELUM_PULANG';
      statusLabel = 'Belum Pulang';
      sort = 40;
    }

    rows.push({
      email,
      nama,
      brand,
      cabang,
      tanggal,
      hari: normalizeText_(item.hari),
      shift,
      jamMasukJadwal: formatJam_(item.jammasuk),
      jamPulangJadwal: formatJam_(item.jampulang),
      status,
      statusLabel,
      sort,
      masuk,
      pulang,
      izin,
      fotoMasuk: masuk ? masuk.foto : '',
      fotoPulang: pulang ? pulang.foto : '',
      fotoDasar: photoMap[email] ? driveThumbUrl_(photoMap[email].dasar, 300) : '',
      fotoProfil: photoMap[email] ? driveThumbUrl_(photoMap[email].profil, 200) : '',
      jarakMasuk: masuk ? masuk.jarakMeter : '',
      jarakPulang: pulang ? pulang.jarakMeter : ''
    });

    if (email) seenEmails[email] = true;
  });

  izinRows.forEach(item => {
    const email = String(item.email || '').trim().toLowerCase();
    if (!email || seenEmails[email]) return;
    const izin = izinMap[email];
    rows.push({
      email,
      nama: normalizeText_(item.nama),
      brand: normalizeText_(item.brand),
      cabang: normalizeText_(item.cabang),
      tanggal,
      hari: '',
      shift: '-',
      jamMasukJadwal: '',
      jamPulangJadwal: '',
      status: izin.status === 'DISETUJUI' ? izin.jenis : 'IZIN_MENUNGGU',
      statusLabel: izin.status === 'DISETUJUI' ? readableStatusServer_(izin.jenis) : 'Izin Menunggu',
      sort: izin.status === 'DISETUJUI' ? 60 : 20,
      masuk: null,
      pulang: null,
      izin,
      fotoMasuk: '',
      fotoPulang: '',
      jarakMasuk: '',
      jarakPulang: ''
    });
  });

  const counts = {
    total: rows.length,
    terjadwal: 0,
    off: 0,
    masuk: 0,
    belumMasuk: 0,
    terlambat: 0,
    sudahPulang: 0,
    belumPulang: 0,
    izinCuti: 0
  };

  rows.forEach(row => {
    const isOff = row.status === 'OFF';
    const hasApprovedIzin = row.izin && row.izin.status === 'DISETUJUI';
    const hasPendingIzin = row.izin && row.izin.status === 'MENUNGGU_APPROVAL';

    if (isOff) counts.off++;
    if (!isOff) counts.terjadwal++;
    if (!isOff && !hasApprovedIzin && row.masuk && !row.pulang) {
      counts.masuk++;
      counts.belumPulang++;
    }
    if (row.masuk && row.masuk.status === 'TERLAMBAT') counts.terlambat++;
    if (row.pulang) counts.sudahPulang++;
    if (!isOff && !hasApprovedIzin && !row.masuk) counts.belumMasuk++;
    if (hasApprovedIzin || hasPendingIzin) counts.izinCuti++;
  });

  rows.sort((a, b) => {
    if (a.sort !== b.sort) return a.sort - b.sort;
    return String(a.nama).localeCompare(String(b.nama));
  });

  return {
    tanggal,
    brand: brandFilter,
    cabang: isAdmin ? 'ALL' : cabangManager,
    counts,
    rows
  };
}

function isDateBetween_(target, start, end) {
  if (!target || !start) return false;
  const t = new Date(target + 'T00:00:00').getTime();
  const s = new Date(start + 'T00:00:00').getTime();
  const e = new Date((end || start) + 'T00:00:00').getTime();
  if (isNaN(t) || isNaN(s) || isNaN(e)) return false;
  return t >= s && t <= e;
}

function readableStatusServer_(value) {
  return normalizeText_(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Menulis beberapa sel pada satu baris. Sel yang kolomnya berurutan digabung jadi SATU panggilan setValues
 * (tiap panggilan tulis ke Google Sheets memakan ±0,1-0,3 dtk, jadi ini menentukan kecepatan persetujuan).
 * pairs = [[indeksKolom0, nilai], ...]; indeks < 0 diabaikan.
 */
function writeRowCells_(sheet, row, pairs) {
  const items = pairs.filter(function (p) { return p[0] >= 0; }).sort(function (a, b) { return a[0] - b[0]; });
  let i = 0;
  while (i < items.length) {
    let j = i;
    while (j + 1 < items.length && items[j + 1][0] === items[j][0] + 1) j++;
    const vals = items.slice(i, j + 1).map(function (p) { return p[1]; });
    sheet.getRange(row, items[i][0] + 1, 1, vals.length).setValues([vals]);
    i = j + 1;
  }
}

function updateApprovalStatus_(sheetName, requestId, decision, manager, catatan) {
  const ss = getSs_();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' tidak ditemukan.');

  const values = readSheetValues_(sheetName);
  if (values.length < 2) throw new Error('Data request masih kosong.');

  const headers = values[0].map(normalizeHeader_);
  const idxId = headers.indexOf('idrequest');
  const idxCabang = headers.indexOf('cabang');
  const idxStatus = headers.indexOf('statusapproval');
  const idxApprovedBy = headers.indexOf('approvedby');
  const idxCatatan = headers.indexOf('catatanmanager');
  const idxWaktu = headers.indexOf('waktuapproval');

  if (idxId < 0 || idxStatus < 0 || idxApprovedBy < 0 || idxCatatan < 0 || idxWaktu < 0) {
    throw new Error('Header approval pada sheet ' + sheetName + ' belum lengkap. Jalankan Setup Header Output.');
  }

  let targetRow = -1;
  let targetStatus = '';
  let targetCabang = '';
  let targetData = null;

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idxId] || '').trim() === requestId) {
      targetRow = r + 1;
      targetStatus = normalizeText_(values[r][idxStatus]);
      targetCabang = idxCabang >= 0 ? normalizeText_(values[r][idxCabang]) : '';
      targetData = rowToObject_(headers, values[r]);
      break;
    }
  }

  if (targetRow < 0) throw new Error('Request tidak ditemukan.');
  if (targetStatus !== 'MENUNGGU_APPROVAL') {
    throw new Error('Request ini sudah diproses sebelumnya.');
  }

  const isAdmin = normalizeText_(manager.role).includes('ADMIN');
  if (!isAdmin && targetCabang && targetCabang !== normalizeText_(manager.cabang)) {
    throw new Error('Manager hanya bisa memproses pengajuan dari cabangnya sendiri.');
  }

  let applyResult = null;
  if (decision === 'DISETUJUI') {
    applyResult = applyApprovedRequest_(sheetName, targetData, manager, catatan);
  }

  const now = Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  const approvedBy = manager.nama + ' (' + manager.email + ')';

  writeRowCells_(sheet, targetRow, [[idxStatus, decision], [idxApprovedBy, approvedBy], [idxCatatan, catatan], [idxWaktu, now]]);

  return {
    id: requestId,
    status: decision,
    approvedBy,
    waktuApproval: now,
    applyResult,
    cabang: targetCabang,
    requesterEmail: String((targetData && targetData.email) || '').trim().toLowerCase(),
    extraBumpEmails: (function () { const t = emailTemanDariData_(targetData && targetData.databaru); return t ? [t] : []; })()
  };
}

/****************************************************
 * APPLY APPROVAL RESULT KE ABSENSI / JADWAL
 ****************************************************/

function applyApprovedRequest_(sheetName, requestData, manager, catatan) {
  if (sheetName === SHEET.KOREKSI) {
    return applyApprovedKoreksi_(requestData, manager, catatan);
  }

  if (sheetName === SHEET.IZIN) {
    return {
      applied: false,
      message: 'Status izin/cuti sudah disetujui. Perubahan jadwal izin/cuti akan dibuat di tahap berikutnya.'
    };
  }

  return {
    applied: false,
    message: 'Tipe approval tidak dikenali.'
  };
}

function applyApprovedKoreksi_(req, manager, catatan) {
  const jenis = normalizeText_(req.jeniskoreksi);
  const tanggal = normalizeDateString_(req.tanggal);
  const email = String(req.email || '').trim().toLowerCase();
  const nama = normalizeText_(req.nama);
  const brand = normalizeText_(req.brand);
  const cabang = normalizeText_(req.cabang);
  const dataBaru = String(req.databaru || '').trim();
  const alasan = String(req.alasan || '').trim();

  if (!email || !tanggal) {
    throw new Error('Data koreksi tidak lengkap untuk diaplikasikan.');
  }

  if (jenis === KOREKSI_JENIS) {
    const jam = parseKoreksiJamBaru_(dataBaru);
    if (!jam.masuk && !jam.pulang) throw new Error('Data Baru koreksi jam tidak terbaca.');
    const diperbarui = [];
    const ctx = {}; // ABSENSI dibaca SEKALI untuk kedua jam
    if (jam.masuk) {
      upsertAbsensiKoreksi_({ tanggal, email, nama, brand, cabang, jenisAbsen: 'ABSEN_MASUK', jamAktual: jam.masuk, alasan, manager, catatan }, ctx);
      diperbarui.push('jam masuk ' + jam.masuk);
    }
    if (jam.pulang) {
      upsertAbsensiKoreksi_({ tanggal, email, nama, brand, cabang, jenisAbsen: 'ABSEN_PULANG', jamAktual: jam.pulang, alasan, manager, catatan }, ctx);
      diperbarui.push('jam pulang ' + jam.pulang);
    }
    return { applied: true, target: 'ABSENSI', message: 'Absensi diperbarui: ' + diperbarui.join(' dan ') + '.' };
  }

  if (jenis === SHIFT_JENIS_TUKAR) {
    return applyTukarShiftTeman_(req, manager, catatan);
  }

  // Ubah shift sendiri: pastikan jadwal belum berubah sejak diajukan (mis. manager sempat mengunggah jadwal baru).
  if (jenis === SHIFT_JENIS_UBAH) {
    const lama = /Shift:\s*([A-Za-z]+)/.exec(String(req.datalama || ''));
    if (lama) {
      const sekarang = findSchedule_(email, tanggal);
      if (sekarang && normalizeText_(sekarang.shift) !== normalizeText_(lama[1])) {
        throw new Error('Jadwal berubah sejak pengajuan dibuat (sekarang ' + normalizeText_(sekarang.shift) + ', saat diajukan ' + normalizeText_(lama[1]) + '). Tolak pengajuan ini dan minta diajukan ulang.');
      }
    }
  }

  // (pengajuan lama sebelum penyederhanaan tetap bisa diproses)
  if (jenis === 'EDIT_JAM_MASUK' || jenis === 'LUPA_ABSEN_MASUK') {
    const jamBaru = parseJamFromText_(dataBaru);
    if (!jamBaru) throw new Error('Data Baru untuk jam masuk harus format jam, contoh 08:30.');

    return upsertAbsensiKoreksi_({
      tanggal,
      email,
      nama,
      brand,
      cabang,
      jenisAbsen: 'ABSEN_MASUK',
      jamAktual: jamBaru,
      alasan,
      manager,
      catatan
    });
  }

  if (jenis === 'EDIT_JAM_PULANG' || jenis === 'LUPA_ABSEN_PULANG') {
    const jamBaru = parseJamFromText_(dataBaru);
    if (!jamBaru) throw new Error('Data Baru untuk jam pulang harus format jam, contoh 16:30.');

    return upsertAbsensiKoreksi_({
      tanggal,
      email,
      nama,
      brand,
      cabang,
      jenisAbsen: 'ABSEN_PULANG',
      jamAktual: jamBaru,
      alasan,
      manager,
      catatan
    });
  }

  if (jenis === 'PERUBAHAN_SHIFT' || jenis === 'TUKAR_OFF' || jenis === 'TUKAR_SHIFT' || jenis === 'TUKAR_SHIFT_OFF') {
    const shiftBaru = resolveShiftFromKoreksiText_(dataBaru);
    const shiftMap = getShiftMap_();

    if (!shiftBaru || !shiftMap[shiftBaru]) {
      return {
        applied: false,
        message: 'Approval tersimpan, tetapi jadwal belum otomatis berubah karena Data Baru tidak terbaca sebagai shift valid. Isi Data Baru dengan PAGI, SIANG, MIDDLE, atau OFF. Data Baru saat ini: ' + dataBaru
      };
    }

    return updateJadwalProsesKoreksi_({
      tanggal,
      email,
      nama,
      brand,
      cabang,
      shiftBaru,
      alasan,
      manager,
      catatan
    });
  }

  return {
    applied: false,
    message: 'Approval tersimpan. Jenis koreksi ini belum mengubah data absensi/jadwal otomatis.'
  };
}

/** Tukar shift dua orang: keduanya diubah atau tidak sama sekali (kalau yang kedua gagal, yang pertama dikembalikan). */
function applyTukarShiftTeman_(req, manager, catatan) {
  const tanggal = normalizeDateString_(req.tanggal);
  const emailSaya = String(req.email || '').trim().toLowerCase();
  const dataBaru = String(req.databaru || '');
  const alasan = String(req.alasan || '').trim();

  const mSaya = /Saya:\s*([A-Za-z]+)/.exec(dataBaru);
  const mTeman = /\|\s*Teman:\s*([A-Za-z]+)/.exec(dataBaru);
  const emailTeman = emailTemanDariData_(dataBaru);
  if (!tanggal || !emailSaya || !mSaya || !mTeman || !emailTeman) throw new Error('Data tukar shift tidak terbaca.');
  const sayaBaru = normalizeText_(mSaya[1]);
  const temanBaru = normalizeText_(mTeman[1]);

  const shiftMap = getShiftMap_();
  if (!shiftMap[sayaBaru] || !shiftMap[temanBaru]) throw new Error('Shift pada pengajuan tidak ada di SHIFT_SETTING.');

  const teman = findPromotorByEmail_(emailTeman);
  if (!teman) throw new Error('Teman tidak ditemukan atau sudah tidak aktif.');

  // Jadwal sekarang harus masih seperti saat diajukan (saya memegang shift yang kini dipegang teman, dan sebaliknya).
  const sekarangSaya = findSchedule_(emailSaya, tanggal);
  const sekarangTeman = findSchedule_(emailTeman, tanggal);
  if (!sekarangSaya || !sekarangTeman) throw new Error('Jadwal salah satu orang tidak ditemukan pada tanggal itu.');
  if (normalizeText_(sekarangSaya.shift) !== temanBaru || normalizeText_(sekarangTeman.shift) !== sayaBaru) {
    throw new Error('Jadwal berubah sejak pengajuan dibuat (sekarang ' + normalizeText_(req.nama) + ': ' + normalizeText_(sekarangSaya.shift) + ', ' + teman.nama + ': ' + normalizeText_(sekarangTeman.shift) + '). Tolak pengajuan ini dan minta diajukan ulang.');
  }

  const dataSaya = { tanggal: tanggal, email: emailSaya, nama: normalizeText_(req.nama), brand: normalizeText_(req.brand), cabang: normalizeText_(req.cabang), shiftBaru: sayaBaru, alasan: alasan, manager: manager, catatan: catatan };
  const dataTeman = { tanggal: tanggal, email: emailTeman, nama: normalizeText_(teman.nama), brand: normalizeText_(teman.brand), cabang: normalizeText_(teman.cabang), shiftBaru: temanBaru, alasan: alasan, manager: manager, catatan: catatan };

  updateJadwalProsesKoreksi_(dataSaya);
  try {
    updateJadwalProsesKoreksi_(dataTeman);
  } catch (e) {
    try { updateJadwalProsesKoreksi_(Object.assign({}, dataSaya, { shiftBaru: temanBaru })); } catch (e2) { Logger.log('Pengembalian jadwal gagal: ' + e2.message); }
    throw new Error('Gagal menukar jadwal ' + teman.nama + ': ' + e.message + ' (jadwal pengaju sudah dikembalikan).');
  }
  return { applied: true, target: 'JADWAL_PROSES', message: 'Jadwal ditukar: ' + normalizeText_(req.nama) + ' ke ' + sayaBaru + ', ' + teman.nama + ' ke ' + temanBaru + '.' };
}

function upsertAbsensiKoreksi_(data, ctx) {
  // ctx (opsional) = {sheet, values}: dipakai bersama supaya masuk + pulang cukup membaca ABSENSI SEKALI.
  const ss = getSs_();
  const sheet = (ctx && ctx.sheet) || ss.getSheetByName(SHEET.ABSENSI);
  if (!sheet) throw new Error('Sheet ABSENSI tidak ditemukan.');

  const schedule = findSchedule_(data.email, data.tanggal) || {};
  const values = (ctx && ctx.values) || sheet.getDataRange().getDisplayValues();
  if (ctx && !ctx.values) { ctx.sheet = sheet; ctx.values = values; }

  if (values.length < 1) throw new Error('Header ABSENSI belum ada. Jalankan Setup Header Output.');

  const headers = values[0].map(normalizeHeader_);
  const idxEmail = headers.indexOf('email');
  const idxTanggal = headers.indexOf('tanggal');
  const idxJenis = headers.indexOf('jenisabsen');
  const idxShift = headers.indexOf('shift');
  const idxJamJadwal = headers.indexOf('jamjadwal');
  const idxJamAktual = headers.indexOf('jamaktual');
  const idxStatus = headers.indexOf('status');
  const idxCatatan = headers.indexOf('catatan');

  if (idxEmail < 0 || idxTanggal < 0 || idxJenis < 0 || idxJamAktual < 0 || idxStatus < 0) {
    throw new Error('Header ABSENSI belum lengkap. Jalankan Setup Header Output.');
  }

  let targetRow = -1;
  for (let r = 1; r < values.length; r++) {
    const sameEmail = String(values[r][idxEmail] || '').trim().toLowerCase() === data.email;
    const sameTanggal = normalizeDateString_(values[r][idxTanggal]) === data.tanggal;
    const sameJenis = normalizeText_(values[r][idxJenis]) === data.jenisAbsen;

    if (sameEmail && sameTanggal && sameJenis) {
      targetRow = r + 1;
      break;
    }
  }

  const jamJadwal = data.jenisAbsen === 'ABSEN_MASUK'
    ? (schedule.jamMasuk || '')
    : (schedule.jamPulang || '');

  const catatanKoreksi = buildCatatanKoreksi_(data);

  if (targetRow > 0) {
    writeRowCells_(sheet, targetRow, [
      [idxShift, schedule.shift || ''], [idxJamJadwal, jamJadwal], [idxJamAktual, data.jamAktual],
      [idxStatus, 'KOREKSI_DISETUJUI'], [idxCatatan, catatanKoreksi]
    ]);
    if (ctx) {
      const rowV = values[targetRow - 1];
      if (idxShift >= 0) rowV[idxShift] = schedule.shift || '';
      if (idxJamJadwal >= 0) rowV[idxJamJadwal] = jamJadwal;
      rowV[idxJamAktual] = data.jamAktual; rowV[idxStatus] = 'KOREKSI_DISETUJUI';
    }

    return {
      applied: true,
      target: 'ABSENSI',
      action: 'UPDATE',
      jenisAbsen: data.jenisAbsen,
      jamAktual: data.jamAktual,
      message: 'Data absensi lama berhasil diperbarui dari koreksi.'
    };
  }

  const now = Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  const id = makeId_([
    'ABS-KOREKSI',
    data.tanggal,
    data.email,
    data.jenisAbsen,
    new Date().getTime()
  ]);

  const newRowAbs = [
    id,
    now,
    data.tanggal,
    data.email,
    data.nama,
    data.brand,
    data.cabang,
    data.jenisAbsen,
    schedule.shift || '',
    jamJadwal,
    data.jamAktual,
    'KOREKSI_DISETUJUI',
    '',
    '',
    '',
    '',
    catatanKoreksi
  ];
  sheet.appendRow(newRowAbs);
  if (ctx) values.push(newRowAbs.map(String));

  return {
    applied: true,
    target: 'ABSENSI',
    action: 'INSERT',
    jenisAbsen: data.jenisAbsen,
    jamAktual: data.jamAktual,
    message: 'Data absensi koreksi berhasil dibuat.'
  };
}

function updateJadwalProsesKoreksi_(data) {
  const ss = getSs_();
  const sheet = ss.getSheetByName(SHEET.PROSES);
  if (!sheet) throw new Error('Sheet JADWAL_PROSES tidak ditemukan.');

  const shiftMap = getShiftMap_();
  const shiftInfo = shiftMap[data.shiftBaru];
  if (!shiftInfo) throw new Error('Shift baru tidak ditemukan di SHIFT_SETTING.');

  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0].map(normalizeHeader_);

  const idxTanggal = headers.indexOf('tanggal');
  const idxEmail = headers.indexOf('email');
  const idxNama = headers.indexOf('nama');
  const idxBrand = headers.indexOf('brand');
  const idxCabang = headers.indexOf('cabang');
  const idxShift = headers.indexOf('shift');
  const idxJamMasuk = headers.indexOf('jammasuk');
  const idxJamPulang = headers.indexOf('jampulang');
  const idxStatus = headers.indexOf('statusjadwal');

  if (idxTanggal < 0 || idxEmail < 0 || idxNama < 0 || idxBrand < 0 || idxCabang < 0 || idxShift < 0 || idxJamMasuk < 0 || idxJamPulang < 0 || idxStatus < 0) {
    throw new Error('Header JADWAL_PROSES belum lengkap. Jalankan Setup Header Output.');
  }

  const targetEmail = String(data.email || '').trim().toLowerCase();
  const targetNama = normalizeText_(data.nama);
  const targetNamaLoose = normalizeLooseName_(targetNama);
  const targetBrand = normalizeText_(data.brand);
  const targetCabang = normalizeText_(data.cabang);

  let targetRow = -1;
  for (let r = 1; r < values.length; r++) {
    const sameTanggal = normalizeDateString_(values[r][idxTanggal]) === data.tanggal;
    if (!sameTanggal) continue;

    const rowEmail = String(values[r][idxEmail] || '').trim().toLowerCase();
    const rowNama = normalizeText_(values[r][idxNama]);
    const rowNamaLoose = normalizeLooseName_(rowNama);
    const rowBrand = normalizeText_(values[r][idxBrand]);
    const rowCabang = normalizeText_(values[r][idxCabang]);

    const sameEmail = rowEmail && rowEmail === targetEmail;
    const sameIdentity = rowNama === targetNama && rowBrand === targetBrand && rowCabang === targetCabang;
    const sameLooseIdentity = rowNamaLoose && rowNamaLoose === targetNamaLoose && rowBrand === targetBrand && rowCabang === targetCabang;

    // Pencocokan lewat nama HANYA untuk baris lama yang tidak punya email; baris yang sudah beremail dicocokkan lewat email saja
    // (dulu nama mirip + brand/cabang sama bisa membuat baris ORANG LAIN ikut tertimpa).
    if (sameEmail || (!rowEmail && (sameIdentity || sameLooseIdentity))) {
      targetRow = r + 1;
      break;
    }
  }

  let jamMasuk = shiftInfo.jamMasuk || '';
  let jamPulang = shiftInfo.jamPulang || '';
  let statusJadwal = 'MASUK';

  if (data.shiftBaru === 'OFF') {
    jamMasuk = '';
    jamPulang = '';
    statusJadwal = 'OFF';
  }

  let action = 'UPDATE';

  if (targetRow > 0) {
    writeRowCells_(sheet, targetRow, [
      [idxEmail, targetEmail], [idxNama, targetNama], [idxBrand, targetBrand], [idxCabang, targetCabang],
      [idxShift, data.shiftBaru], [idxJamMasuk, jamMasuk], [idxJamPulang, jamPulang], [idxStatus, statusJadwal]
    ]);
  } else {
    const idJadwal = makeId_(['JDW-KOREKSI', data.tanggal, targetEmail, targetBrand]);
    const dateObj = new Date(data.tanggal + 'T00:00:00');
    const hari = isNaN(dateObj.getTime()) ? '' : getHariIndonesia_(dateObj);

    sheet.appendRow([
      idJadwal,
      data.tanggal,
      hari,
      targetEmail,
      targetNama,
      targetBrand,
      targetCabang,
      data.shiftBaru,
      jamMasuk,
      jamPulang,
      statusJadwal
    ]);
    action = 'INSERT';
  }

  const syncResult = syncAbsensiAfterShiftCorrection_({
    tanggal: data.tanggal,
    email: targetEmail,
    nama: targetNama,
    brand: targetBrand,
    cabang: targetCabang,
    shiftBaru: data.shiftBaru,
    jamMasuk,
    jamPulang
  });

  return {
    applied: true,
    target: 'JADWAL_PROSES',
    action,
    shift: data.shiftBaru,
    jamMasuk,
    jamPulang,
    syncAbsensi: syncResult,
    message: 'Jadwal proses berhasil diperbarui dari koreksi. Absensi yang sudah ada juga disinkronkan.'
  };
}

function resolveShiftFromKoreksiText_(value) {
  const raw = String(value || '').trim();
  const compact = normalizeText_(raw).replace(/[^A-Z0-9]/g, '');
  const shiftMap = getShiftMap_();

  if (!raw) return '';

  const knownShifts = Object.keys(shiftMap).sort((a, b) => b.length - a.length);
  for (let i = 0; i < knownShifts.length; i++) {
    const shift = knownShifts[i];
    if (!shift) continue;
    if (compact.indexOf(shift) >= 0) return shift;
    if (shift === 'MIDDLE' && compact.indexOf('MIDLE') >= 0) return 'MIDDLE';
    if (shift === 'MIDLE' && compact.indexOf('MIDDLE') >= 0) return 'MIDLE';
  }

  const times = extractTimesFromText_(raw);
  if (times.length) {
    for (let i = 0; i < knownShifts.length; i++) {
      const shift = knownShifts[i];
      const info = shiftMap[shift];
      const masuk = formatJam_(info.jamMasuk);
      const pulang = formatJam_(info.jamPulang);

      if (masuk && pulang && times.indexOf(masuk) >= 0 && times.indexOf(pulang) >= 0) return shift;
      if (masuk && times.indexOf(masuk) >= 0) return shift;
    }
  }

  return normalizeShift_(raw);
}

function extractTimesFromText_(value) {
  const text = String(value || '');
  const matches = text.match(/(\d{1,2})[.:](\d{2})/g) || [];
  return matches.map(item => parseJamFromText_(item)).filter(Boolean);
}

function syncAbsensiAfterShiftCorrection_(data) {
  const ss = getSs_();
  const sheet = ss.getSheetByName(SHEET.ABSENSI);
  if (!sheet) return { updated: 0, message: 'Sheet ABSENSI tidak ditemukan.' };

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return { updated: 0, message: 'Belum ada data absensi.' };

  const headers = values[0].map(normalizeHeader_);
  const idxTanggal = headers.indexOf('tanggal');
  const idxEmail = headers.indexOf('email');
  const idxNama = headers.indexOf('nama');
  const idxBrand = headers.indexOf('brand');
  const idxCabang = headers.indexOf('cabang');
  const idxJenis = headers.indexOf('jenisabsen');
  const idxShift = headers.indexOf('shift');
  const idxJamJadwal = headers.indexOf('jamjadwal');
  const idxJamAktual = headers.indexOf('jamaktual');
  const idxStatus = headers.indexOf('status');
  const idxCatatan = headers.indexOf('catatan');

  if (idxTanggal < 0 || idxEmail < 0 || idxJenis < 0 || idxShift < 0 || idxJamJadwal < 0 || idxJamAktual < 0 || idxStatus < 0) {
    return { updated: 0, message: 'Header ABSENSI belum lengkap.' };
  }

  const targetEmail = String(data.email || '').trim().toLowerCase();
  const targetNama = normalizeText_(data.nama);
  const targetNamaLoose = normalizeLooseName_(targetNama);
  const targetBrand = normalizeText_(data.brand);
  const targetCabang = normalizeText_(data.cabang);
  const scheduleForEval = {
    shift: data.shiftBaru,
    jamMasuk: data.jamMasuk,
    jamPulang: data.jamPulang,
    statusJadwal: data.shiftBaru === 'OFF' ? 'OFF' : 'MASUK'
  };

  let updated = 0;

  for (let r = 1; r < values.length; r++) {
    const sameTanggal = normalizeDateString_(values[r][idxTanggal]) === data.tanggal;
    if (!sameTanggal) continue;

    const rowEmail = String(values[r][idxEmail] || '').trim().toLowerCase();
    const rowNama = idxNama >= 0 ? normalizeText_(values[r][idxNama]) : '';
    const rowNamaLoose = normalizeLooseName_(rowNama);
    const rowBrand = idxBrand >= 0 ? normalizeText_(values[r][idxBrand]) : '';
    const rowCabang = idxCabang >= 0 ? normalizeText_(values[r][idxCabang]) : '';

    const sameEmail = rowEmail && rowEmail === targetEmail;
    const sameIdentity = rowNama === targetNama && rowBrand === targetBrand && rowCabang === targetCabang;
    const sameLooseIdentity = rowNamaLoose && rowNamaLoose === targetNamaLoose && rowBrand === targetBrand && rowCabang === targetCabang;

    if (!(sameEmail || (!rowEmail && (sameIdentity || sameLooseIdentity)))) continue;   // lihat catatan di updateJadwalProsesKoreksi_

    const jenis = normalizeText_(values[r][idxJenis]);
    const jamAktual = formatJam_(values[r][idxJamAktual]);

    let jamJadwal = '';
    if (jenis === 'ABSEN_MASUK') jamJadwal = data.jamMasuk || '';
    if (jenis === 'ABSEN_PULANG') jamJadwal = data.jamPulang || '';

    let status = normalizeText_(values[r][idxStatus]);
    if (data.shiftBaru !== 'OFF' && jamAktual && (jenis === 'ABSEN_MASUK' || jenis === 'ABSEN_PULANG')) {
      status = evaluateStatusAbsensi_(jenis, jamAktual, scheduleForEval);
    }

    // Tulis hanya sel yang nilainya BERUBAH (dulu semua sel ditulis satu per satu: ~8 panggilan per baris).
    const pairs = [];
    const ubah = function (idx, nilai) {
      if (idx < 0) return;
      if (String(values[r][idx] == null ? '' : values[r][idx]) !== String(nilai == null ? '' : nilai)) pairs.push([idx, nilai]);
    };
    ubah(idxEmail, targetEmail);
    ubah(idxNama, targetNama);
    ubah(idxBrand, targetBrand);
    ubah(idxCabang, targetCabang);
    ubah(idxShift, data.shiftBaru);
    ubah(idxJamJadwal, jamJadwal);
    ubah(idxStatus, status);
    if (idxCatatan >= 0) {
      const oldCatatan = String(values[r][idxCatatan] || '').trim();
      const newCatatan = 'Shift disesuaikan dari approval koreksi: ' + data.shiftBaru;
      if (oldCatatan.indexOf(newCatatan) < 0) pairs.push([idxCatatan, oldCatatan ? oldCatatan + ' | ' + newCatatan : newCatatan]);
    }
    if (pairs.length) writeRowCells_(sheet, r + 1, pairs);

    updated++;
  }

  return {
    updated,
    message: updated + ' baris absensi disinkronkan.'
  };
}

function parseJamFromText_(value) {
  const text = String(value || '').trim();
  if (!text) return '';

  const match = text.match(/(\d{1,2})[.:](\d{2})/);
  if (!match) return '';

  const h = Number(match[1]);
  const m = Number(match[2]);

  if (h < 0 || h > 23 || m < 0 || m > 59) return '';

  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function buildCatatanKoreksi_(data) {
  const approvedBy = data.manager.nama + ' (' + data.manager.email + ')';
  const now = Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

  return [
    'Koreksi disetujui otomatis',
    'Jenis: ' + data.jenisAbsen,
    'Jam koreksi: ' + data.jamAktual,
    'Alasan: ' + (data.alasan || '-'),
    'Catatan manager: ' + (data.catatan || '-'),
    'Approved by: ' + approvedBy,
    'Waktu: ' + now
  ].join(' | ');
}

function rowToObject_(headers, row) {
  const obj = {};
  headers.forEach((header, i) => {
    obj[header] = row[i];
  });
  return obj;
}

function terapkanKoreksiDisetujui() {
  const rows = getSheetObjects_(SHEET.KOREKSI);
  const systemManager = {
    nama: 'SYSTEM_REAPPLY',
    email: 'system@els.id',
    cabang: 'ALL',
    role: 'ADMIN'
  };

  let success = 0;
  let skipped = 0;
  const errors = [];

  rows.forEach(row => {
    const status = normalizeText_(row.statusapproval);
    if (status !== 'DISETUJUI') return;

    try {
      const result = applyApprovedKoreksi_(row, systemManager, row.catatanmanager || 'Terapkan ulang koreksi disetujui');
      if (result && result.applied) {
        success++;
      } else {
        skipped++;
      }
    } catch (err) {
      errors.push((row.idrequest || '-') + ': ' + err.message);
    }
  });

  let message = 'Terapkan ulang koreksi selesai.\n\nBerhasil diterapkan: ' + success + '\nDilewati: ' + skipped + '\nError: ' + errors.length;
  if (errors.length) {
    message += '\n\nDetail error maksimal 5:\n' + errors.slice(0, 5).join('\n');
  }

  SpreadsheetApp.getUi().alert(message);
}






function syncKoreksiShiftDisetujui() {
  const rows = getSheetObjects_(SHEET.KOREKSI);
  const systemManager = {
    nama: 'SYSTEM_SHIFT_SYNC',
    email: 'system@els.id',
    cabang: 'ALL',
    role: 'ADMIN'
  };

  let success = 0;
  let skipped = 0;
  const errors = [];

  rows.forEach(row => {
    const status = normalizeText_(row.statusapproval);
    const jenis = normalizeText_(row.jeniskoreksi);

    if (status !== 'DISETUJUI') return;
    if (!isShiftKoreksiJenis_(jenis)) return;

    try {
      const result = applyApprovedKoreksi_(row, systemManager, row.catatanmanager || 'Sinkron ulang koreksi shift disetujui');
      if (result && result.applied) {
        success++;
      } else {
        skipped++;
      }
    } catch (err) {
      errors.push((row.idrequest || '-') + ': ' + err.message);
    }
  });

  let message = 'Sinkron koreksi shift selesai.\n\nBerhasil: ' + success + '\nDilewati: ' + skipped + '\nError: ' + errors.length;
  if (errors.length) {
    message += '\n\nDetail error maksimal 5:\n' + errors.slice(0, 5).join('\n');
  }

  SpreadsheetApp.getUi().alert(message);
}

function autoApplyApprovedShiftKoreksiForPromotor_(promotor, startDate, endDate) {
  try {
    const rows = getSheetObjects_(SHEET.KOREKSI);
    const systemManager = {
      nama: 'SYSTEM_AUTO_SHIFT_SYNC',
      email: 'system@els.id',
      cabang: 'ALL',
      role: 'ADMIN'
    };

    const start = normalizeDateString_(startDate);
    const end = normalizeDateString_(endDate || startDate) || start;
    let applied = 0;

    rows.forEach(row => {
      const status = normalizeText_(row.statusapproval);
      const jenis = normalizeText_(row.jeniskoreksi);
      const tanggal = normalizeDateString_(row.tanggal);

      if (status !== 'DISETUJUI') return;
      if (!isShiftKoreksiJenis_(jenis)) return;
      if (!isDateInRange_(tanggal, start, end)) return;
      if (!isKoreksiRowForPromotor_(row, promotor)) return;

      try {
        const result = applyApprovedKoreksi_(row, systemManager, row.catatanmanager || 'Auto sync koreksi shift disetujui');
        if (result && result.applied) applied++;
      } catch (err) {
        Logger.log('Auto sync koreksi shift gagal: ' + (row.idrequest || '-') + ' - ' + err.message);
      }
    });

    return applied;
  } catch (err) {
    Logger.log('Auto sync koreksi shift error: ' + err.message);
    return 0;
  }
}

function isShiftKoreksiJenis_(jenis) {
  const value = normalizeText_(jenis);
  return ['PERUBAHAN_SHIFT', 'TUKAR_OFF', 'TUKAR_SHIFT', 'TUKAR_SHIFT_OFF'].includes(value);
}

function isKoreksiRowForPromotor_(row, promotor) {
  const rowEmail = String(row.email || '').trim().toLowerCase();
  const targetEmail = String((promotor && promotor.email) || '').trim().toLowerCase();

  if (rowEmail && targetEmail && rowEmail === targetEmail) return true;

  const rowNama = normalizeText_(row.nama);
  const targetNama = normalizeText_((promotor && promotor.nama) || '');
  const rowBrand = normalizeText_(row.brand);
  const targetBrand = normalizeText_((promotor && promotor.brand) || '');
  const rowCabang = normalizeText_(row.cabang);
  const targetCabang = normalizeText_((promotor && promotor.cabang) || '');

  if (rowNama === targetNama && rowBrand === targetBrand && rowCabang === targetCabang) return true;

  const rowLoose = normalizeLooseName_(rowNama);
  const targetLoose = normalizeLooseName_(targetNama);

  return rowLoose && targetLoose && rowLoose === targetLoose && rowBrand === targetBrand && rowCabang === targetCabang;
}


function auditJadwalTanpaEmail() {
  const ss = getSs_();
  const proses = ss.getSheetByName(SHEET.PROSES);
  if (!proses) throw new Error('Sheet JADWAL_PROSES tidak ditemukan.');

  const values = getSheetObjects_(SHEET.PROSES);
  const missing = values.filter(item => {
    return !String(item.email || '').trim() &&
      normalizeText_(item.statusjadwal) !== 'OFF';
  });

  if (!missing.length) {
    SpreadsheetApp.getUi().alert('Aman. Tidak ada jadwal masuk yang email-nya kosong.');
    return;
  }

  const preview = missing.slice(0, 20).map(item => {
    return [
      normalizeDateString_(item.tanggal),
      normalizeText_(item.nama),
      normalizeText_(item.brand),
      normalizeText_(item.cabang),
      normalizeShift_(item.shift)
    ].join(' | ');
  }).join('\n');

  SpreadsheetApp.getUi().alert(
    'Ditemukan ' + missing.length + ' baris jadwal masuk tanpa email.\n\n' +
    'Contoh:\n' + preview + '\n\n' +
    'Solusi: pastikan NAMA dan BRAND di RAW_JADWAL sama dengan DATA_PROMOTOR, lalu jalankan Proses RAW_JADWAL lagi. ' +
    'Versi 10.1 sudah punya pencocokan nama longgar untuk mengurangi masalah seperti FADELA/FADELLA.'
  );
}

/****************************************************
 * ADMIN SETTINGS & REKAP PERFORMA BULANAN
 ****************************************************/

function getAdminSettings_(manager) {
  ensureConfigDefaults_();

  const cabangManager = normalizeText_(manager.cabang);
  const isAdmin = normalizeText_(manager.role).includes('ADMIN');

  const config = getConfigMap_();

  const lokasi = getSheetObjectsWithRow_(SHEET.LOKASI)
    .filter(item => isAdmin || normalizeText_(item.cabang) === cabangManager)
    .map(item => ({
      rowNumber: item.__rowNumber,
      cabang: normalizeText_(item.cabang),
      latitude: parseCoordinate_(item.latitude),
      longitude: parseCoordinate_(item.longitude),
      radiusMeter: Number(item.radiusmeter || 100)
    }));

  const shifts = getSheetObjectsWithRow_(SHEET.SHIFT)
    .map(item => ({
      rowNumber: item.__rowNumber,
      shift: normalizeShift_(item.shift),
      jamMasuk: formatJam_(item.jammasuk),
      jamPulang: formatJam_(item.jampulang),
      status: normalizeText_(item.status)
    }))
    .filter(item => item.shift);

  const promoters = getSheetObjectsWithRow_(SHEET.PROMOTOR)
    .filter(item => isAdmin || normalizeText_(item.cabang) === cabangManager)
    .map(item => ({
      rowNumber: item.__rowNumber,
      email: String(item.email || '').trim().toLowerCase(),
      nama: normalizeText_(item.nama),
      brand: normalizeText_(item.brand),
      cabang: normalizeText_(item.cabang),
      kodeKaryawan: String(item.kodekaryawan || '').trim(),
      status: normalizeText_(item.status) || 'AKTIF'
    }))
    .filter(item => item.email || item.nama);

  return {
    toleransiTelatMenit: Number(config.TOLERANSI_TERLAMBAT_MENIT || APP_CONFIG.TOLERANSI_TERLAMBAT_MENIT || 0),
    favoritMenus: getFavoriteMenus_(),
    lokasi,
    shifts,
    promoters,
    brands: getAllBrands_(),
    cabangManager: cabangManager,
    isAdmin: isAdmin
  };
}

function saveAdminSettings_(manager, data) {
  const cabangManager = normalizeText_(manager.cabang);
  const isAdmin = normalizeText_(manager.role).includes('ADMIN');
  const actor = manager.nama + ' (' + manager.email + ')';
  const result = {
    configUpdated: false,
    lokasiUpdated: 0,
    shiftsUpdated: 0,
    promotersUpdated: 0
  };

  if (Object.prototype.hasOwnProperty.call(data, 'toleransiTelatMenit')) {
    const tol = Math.max(0, Number(data.toleransiTelatMenit || 0));
    setConfigValue_('TOLERANSI_TERLAMBAT_MENIT', tol, 'Toleransi telat dalam menit untuk status absen masuk.', actor);
    result.configUpdated = true;
  }

  if (Array.isArray(data.favoritMenus)) {
    const menus = normalizeFavoriteMenus_(data.favoritMenus);
    setConfigValue_('MENU_FAVORIT', menus.length ? menus.join(',') : 'TIDAK_ADA', 'Menu Favorit di beranda promotor (diatur manager lewat Pengaturan Admin).', actor);
    result.configUpdated = true;
    result.favoritUpdated = true;
  }

  if (Array.isArray(data.lokasi)) {
    const sheet = getSs_().getSheetByName(SHEET.LOKASI);
    if (!sheet) throw new Error('Sheet LOKASI_TOKO tidak ditemukan.');

    const values = sheet.getDataRange().getDisplayValues();
    const headers = values[0].map(normalizeHeader_);
    const idxCabang = headers.indexOf('cabang');
    const idxLat = headers.indexOf('latitude');
    const idxLng = headers.indexOf('longitude');
    const idxRadius = headers.indexOf('radiusmeter');

    if ([idxCabang, idxLat, idxLng, idxRadius].some(i => i < 0)) {
      throw new Error('Header LOKASI_TOKO harus berisi Cabang, Latitude, Longitude, Radius Meter.');
    }

    data.lokasi.forEach(item => {
      const cabang = normalizeText_(item.cabang);
      if (!cabang) return;
      if (!isAdmin && cabang !== cabangManager) return;

      let rowNumber = -1;
      // Kalau aplikasi mengirim nomor baris dan baris itu memang milik cabang ini, pakai baris itu (cabang boleh punya beberapa titik).
      const rn = Number(item.rowNumber);
      if (rn >= 2 && rn <= values.length && normalizeText_(values[rn - 1][idxCabang]) === cabang) rowNumber = rn;
      if (rowNumber < 0) {
        for (let r = 1; r < values.length; r++) {
          if (normalizeText_(values[r][idxCabang]) === cabang) {
            rowNumber = r + 1;
            break;
          }
        }
      }

      const lat = parseCoordinate_(item.latitude);
      const lng = parseCoordinate_(item.longitude);
      const radius = Math.max(20, Number(item.radiusMeter || 100));

      if (rowNumber > 0) {
        sheet.getRange(rowNumber, idxLat + 1).setValue(lat);
        sheet.getRange(rowNumber, idxLng + 1).setValue(lng);
        sheet.getRange(rowNumber, idxRadius + 1).setValue(radius);
      } else if (isAdmin) {
        sheet.appendRow([cabang, lat, lng, radius]);
      }

      result.lokasiUpdated++;
    });
  }

  if (Array.isArray(data.shifts)) {
    const sheet = getSs_().getSheetByName(SHEET.SHIFT);
    if (!sheet) throw new Error('Sheet SHIFT_SETTING tidak ditemukan.');

    const values = sheet.getDataRange().getDisplayValues();
    const headers = values[0].map(normalizeHeader_);
    const idxShift = headers.indexOf('shift');
    const idxMasuk = headers.indexOf('jammasuk');
    const idxPulang = headers.indexOf('jampulang');
    const idxStatus = headers.indexOf('status');

    if ([idxShift, idxMasuk, idxPulang, idxStatus].some(i => i < 0)) {
      throw new Error('Header SHIFT_SETTING harus berisi Shift, Jam Masuk, Jam Pulang, Status.');
    }

    data.shifts.forEach(item => {
      const shift = normalizeShift_(item.shift);
      if (!shift) return;

      let rowNumber = -1;
      for (let r = 1; r < values.length; r++) {
        if (normalizeShift_(values[r][idxShift]) === shift) {
          rowNumber = r + 1;
          break;
        }
      }

      const rowData = [
        shift,
        formatJam_(item.jamMasuk),
        formatJam_(item.jamPulang),
        normalizeText_(item.status || 'AKTIF')
      ];

      if (rowNumber > 0) {
        sheet.getRange(rowNumber, idxShift + 1).setValue(rowData[0]);
        sheet.getRange(rowNumber, idxMasuk + 1).setValue(rowData[1]);
        sheet.getRange(rowNumber, idxPulang + 1).setValue(rowData[2]);
        sheet.getRange(rowNumber, idxStatus + 1).setValue(rowData[3]);
      } else {
        sheet.appendRow(rowData);
      }

      result.shiftsUpdated++;
    });
  }

  if (Array.isArray(data.promoters)) {
    const sheet = getSs_().getSheetByName(SHEET.PROMOTOR);
    if (!sheet) throw new Error('Sheet DATA_PROMOTOR tidak ditemukan.');

    const kodeCol = ensureColumn_(sheet, 'Kode Karyawan');

    const values = sheet.getDataRange().getDisplayValues();
    const headers = values[0].map(normalizeHeader_);
    const idxEmail = headers.indexOf('email');
    const idxCabang = headers.indexOf('cabang');
    const idxStatus = headers.indexOf('status');

    if (idxEmail < 0 || idxStatus < 0) {
      throw new Error('Header DATA_PROMOTOR harus berisi Email dan Status.');
    }

    data.promoters.forEach(item => {
      const email = String(item.email || '').trim().toLowerCase();
      const status = normalizeText_(item.status);
      if (!email || !['AKTIF', 'NONAKTIF'].includes(status)) return;

      for (let r = 1; r < values.length; r++) {
        const rowEmail = String(values[r][idxEmail] || '').trim().toLowerCase();
        const rowCabang = idxCabang >= 0 ? normalizeText_(values[r][idxCabang]) : '';
        if (rowEmail === email && (isAdmin || rowCabang === cabangManager)) {
          sheet.getRange(r + 1, idxStatus + 1).setValue(status);
          if (Object.prototype.hasOwnProperty.call(item, 'kodeKaryawan')) {
            sheet.getRange(r + 1, kodeCol).setValue(String(item.kodeKaryawan || '').trim());
          }
          result.promotersUpdated++;
          break;
        }
      }
    });
  }

  return result;
}

const REKAP_BULAN_ = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
function rekapMonthLabel_(month) {
  const p = String(month).split('-');
  return REKAP_BULAN_[Number(p[1]) - 1] + ' ' + p[0];
}
function rekapDateLabel_(dateText) {
  const p = String(dateText).split('-');
  return Number(p[2]) + ' ' + REKAP_BULAN_[Number(p[1]) - 1].slice(0, 3) + ' ' + p[0];
}

function getMonthlyPerformance_(manager, options) {
  const rs = normalizeDateString_(options && options.startDate);
  const re = normalizeDateString_(options && options.endDate);
  const rangeMode = !!(rs && re);
  const month = rangeMode ? '' : (String((options && options.month) || '').trim() || Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyy-MM'));
  let startDate, endDate, periodKey, periodLabel;
  if (rangeMode) {
    if (rs > re) throw new Error('Tanggal mulai harus sebelum tanggal selesai.');
    if ((new Date(re) - new Date(rs)) / 86400000 > 370) throw new Error('Rentang tanggal maksimal 1 tahun.');
    startDate = rs;
    endDate = re;
    periodKey = rs + '_' + re;
    periodLabel = rekapDateLabel_(rs) + ' - ' + rekapDateLabel_(re);
  } else {
    if (!/^\d{4}-\d{2}$/.test(month)) throw new Error('Format bulan tidak valid.');
    const startEnd = monthToDateRange_(month);
    startDate = startEnd.startDate;
    endDate = startEnd.endDate;
    periodKey = month;
    periodLabel = rekapMonthLabel_(month);
  }
  const brandFilter = normalizeText_(options && options.brand);
  const cabangManager = normalizeText_(manager.cabang);
  const isAdmin = normalizeText_(manager.role).includes('ADMIN');

  const schedules = getSheetObjects_(SHEET.PROSES)
    .filter(item => isDateInRange_(normalizeDateString_(item.tanggal), startDate, endDate))
    .filter(item => isAdmin || normalizeText_(item.cabang) === cabangManager)
    .filter(item => !brandFilter || normalizeText_(item.brand) === brandFilter);

  const absensi = getSheetObjects_(SHEET.ABSENSI)
    .filter(item => isDateInRange_(normalizeDateString_(item.tanggal), startDate, endDate))
    .filter(item => isAdmin || normalizeText_(item.cabang) === cabangManager)
    .filter(item => !brandFilter || normalizeText_(item.brand) === brandFilter);

  const izinRows = getSheetObjects_(SHEET.IZIN)
    .filter(item => isAdmin || normalizeText_(item.cabang) === cabangManager)
    .filter(item => !brandFilter || normalizeText_(item.brand) === brandFilter)
    .filter(item => normalizeText_(item.statusapproval) === 'DISETUJUI')
    .filter(item => isRangeOverlap_(normalizeDateString_(item.tanggalmulai), normalizeDateString_(item.tanggalselesai), startDate, endDate));

  const koreksiRows = getSheetObjects_(SHEET.KOREKSI)
    .filter(item => isAdmin || normalizeText_(item.cabang) === cabangManager)
    .filter(item => !brandFilter || normalizeText_(item.brand) === brandFilter)
    .filter(item => isDateInRange_(normalizeDateString_(item.tanggal), startDate, endDate));

  const absensiMap = {};
  absensi.forEach(item => {
    const tanggal = normalizeDateString_(item.tanggal);
    const email = String(item.email || '').trim().toLowerCase();
    const jenis = normalizeText_(item.jenisabsen);
    if (!tanggal || !email || !jenis) return;
    const key = tanggal + '|' + email;
    if (!absensiMap[key]) absensiMap[key] = {};
    absensiMap[key][jenis] = {
      jamAktual: formatJam_(item.jamaktual),
      status: normalizeText_(item.status),
      jarakMeter: item.jarakmeter || '',
      catatan: item.catatan || ''
    };
  });

  const izinDateMap = {};
  izinRows.forEach(item => {
    const email = String(item.email || '').trim().toLowerCase();
    const mulai = normalizeDateString_(item.tanggalmulai);
    const selesai = normalizeDateString_(item.tanggalselesai) || mulai;
    eachDateInRange_(startDate, endDate, dateText => {
      if (isDateBetween_(dateText, mulai, selesai)) {
        izinDateMap[dateText + '|' + email] = {
          jenis: normalizeText_(item.jenispengajuan),
          keterangan: item.keterangan || ''
        };
      }
    });
  });

  const koreksiCount = {};
  koreksiRows.forEach(item => {
    const email = String(item.email || '').trim().toLowerCase();
    if (!email) return;
    koreksiCount[email] = (koreksiCount[email] || 0) + 1;
  });

  const todayText = getToday_();
  const map = {};
  schedules.forEach(item => {
    const email = String(item.email || '').trim().toLowerCase();
    const nama = normalizeText_(item.nama);
    const brand = normalizeText_(item.brand);
    const cabang = normalizeText_(item.cabang);
    if (!email && !nama) return;

    const keyEmail = email || (nama + '|' + brand);
    if (!map[keyEmail]) {
      map[keyEmail] = {
        email,
        nama,
        brand,
        cabang,
        totalHari: 0,
        jadwalMasuk: 0,
        hadir: 0,
        telat: 0,
        pulangCepat: 0,
        belumMasuk: 0,
        belumPulang: 0,
        tidakLengkap: 0,
        off: 0,
        izinCuti: 0,
        koreksi: 0,
        persentaseHadir: 0,
        telatMenit: 0,
        alpa: 0,
        sakit: 0,
        izin: 0,
        cuti: 0,
        izinPengajuan: 0
      };
    }

    const row = map[keyEmail];
    row.totalHari++;

    const tanggal = normalizeDateString_(item.tanggal);
    const shift = normalizeShift_(item.shift);
    const statusJadwal = normalizeText_(item.statusjadwal);
    const isOff = shift === 'OFF' || statusJadwal === 'OFF';
    const izin = izinDateMap[tanggal + '|' + email];
    const att = absensiMap[tanggal + '|' + email] || {};
    const masuk = att.ABSEN_MASUK || null;
    const pulang = att.ABSEN_PULANG || null;

    if (isOff) {
      row.off++;
      return;
    }

    if (izin) {
      row.izinCuti++;
      const jenisIzin = normalizeText_(izin.jenis);
      if (jenisIzin.indexOf('SAKIT') >= 0) row.sakit++;
      else if (jenisIzin.indexOf('CUTI') >= 0) row.cuti++;
      else row.izin++;
      return;
    }

    row.jadwalMasuk++;

    if (masuk) {
      row.hadir++;
      if (masuk.status === 'TERLAMBAT') {
        row.telat++;
        const selisih = timeToMinutes_(masuk.jamAktual) - timeToMinutes_(formatJam_(item.jammasuk));
        if (selisih > 0) row.telatMenit += selisih;
      }
    } else {
      row.belumMasuk++;
      if (tanggal < todayText) row.alpa++; // hanya hari yang sudah lewat
    }

    if (pulang) {
      if (pulang.status === 'PULANG_CEPAT') row.pulangCepat++;
    } else if (masuk) {
      row.belumPulang++;
    }

    if (!masuk || (masuk && !pulang)) row.tidakLengkap++;
  });

  Object.keys(koreksiCount).forEach(email => {
    if (map[email]) {
      map[email].koreksi = koreksiCount[email];
    }
  });

  const izinPengajuanCount = {};
  izinRows.forEach(item => {
    const em = String(item.email || '').trim().toLowerCase();
    if (em) izinPengajuanCount[em] = (izinPengajuanCount[em] || 0) + 1;
  });
  Object.keys(izinPengajuanCount).forEach(em => {
    if (map[em]) map[em].izinPengajuan = izinPengajuanCount[em];
  });

  const rows = Object.values(map).map(row => {
    row.persentaseHadir = row.jadwalMasuk > 0 ? Math.round((row.hadir / row.jadwalMasuk) * 100) : 0;
    return row;
  }).sort((a, b) => {
    if (a.persentaseHadir !== b.persentaseHadir) return b.persentaseHadir - a.persentaseHadir;
    return String(a.nama).localeCompare(String(b.nama));
  });

  const summary = rows.reduce((acc, row) => {
    acc.promotor++;
    acc.jadwalMasuk += row.jadwalMasuk;
    acc.hadir += row.hadir;
    acc.telat += row.telat;
    acc.izinCuti += row.izinCuti;
    acc.off += row.off;
    acc.tidakLengkap += row.tidakLengkap;
    acc.koreksi += row.koreksi;
    return acc;
  }, {
    promotor: 0,
    jadwalMasuk: 0,
    hadir: 0,
    telat: 0,
    izinCuti: 0,
    off: 0,
    tidakLengkap: 0,
    koreksi: 0
  });

  summary.persentaseHadir = summary.jadwalMasuk > 0 ? Math.round((summary.hadir / summary.jadwalMasuk) * 100) : 0;

  const makeRank = (field, extraField) => rows
    .filter(r => r[field] > 0)
    .slice()
    .sort((a, b) => (b[field] - a[field]) || String(a.nama).localeCompare(String(b.nama)))
    .slice(0, 5)
    .map(r => ({ nama: r.nama, brand: r.brand, value: r[field], extra: extraField ? r[extraField] : null }));

  const ranking = {
    telat: makeRank('telat', 'telatMenit'),
    koreksi: makeRank('koreksi'),
    izin: makeRank('izinPengajuan', 'izinCuti'),
    alpa: makeRank('alpa')
  };

  return {
    month,
    periodKey,
    periodLabel,
    startDate,
    endDate,
    brand: brandFilter,
    cabang: isAdmin ? 'ALL' : cabangManager,
    summary,
    ranking,
    rows
  };
}

/**
 * Tulis rekap bulanan ke sheet REKAP_BULANAN (per promotor) dan REKAP_PERINGKAT
 * (siapa paling sering telat / koreksi / izin / tidak hadir). Selalu ditimpa dengan data terbaru.
 */
function buildRekapSheet_(perf, targetSs) {
  const ss = targetSs || getSs_();
  const judulBulan = perf.periodLabel || perf.month;
  const stamp = Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm');

  function getFreshSheet(name) {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    sh.clear();
    sh.setFrozenRows(0);
    return sh;
  }
  const ORANGE = '#ff7a1a', SOFT = '#fff1e6';

  // ---- REKAP_BULANAN ----
  const sh = getFreshSheet('REKAP_BULANAN');
  const header = ['No', 'Nama', 'Brand', 'Cabang', 'Hari Jadwal', 'Hadir', '% Hadir', 'Terlambat (x)', 'Total Menit Telat', 'Pulang Cepat', 'Tidak Hadir', 'Sakit (hari)', 'Izin (hari)', 'Cuti (hari)', 'Koreksi (x)', 'Tidak Lengkap', 'OFF'];
  sh.getRange(1, 1).setValue('REKAP ABSENSI PROMOTOR — ' + judulBulan).setFontSize(14).setFontWeight('bold');
  sh.getRange(2, 1).setValue('Diperbarui ' + stamp + ' • Cabang: ' + perf.cabang + (perf.brand ? ' • Brand: ' + perf.brand : '')).setFontColor('#6b7280');
  sh.getRange(4, 1, 1, header.length).setValues([header]).setBackground(ORANGE).setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center').setWrap(true);

  const body = (perf.rows || []).map((r, i) => [
    i + 1, r.nama, r.brand, r.cabang, r.jadwalMasuk, r.hadir, (r.persentaseHadir || 0) / 100,
    r.telat, r.telatMenit, r.pulangCepat, r.alpa, r.sakit, r.izin, r.cuti, r.koreksi, r.tidakLengkap, r.off
  ]);
  if (body.length) {
    const rng = sh.getRange(5, 1, body.length, header.length);
    rng.setValues(body);
    rng.setBackgrounds(body.map((_, i) => Array(header.length).fill(i % 2 ? SOFT : '#ffffff')));
    sh.getRange(5, 7, body.length, 1).setNumberFormat('0%');
    sh.getRange(5, 1, body.length, 1).setHorizontalAlignment('center');
    sh.getRange(5, 5, body.length, header.length - 4).setHorizontalAlignment('center');
    const totalRow = ['', 'TOTAL', '', '', perf.summary.jadwalMasuk, perf.summary.hadir, (perf.summary.persentaseHadir || 0) / 100, perf.summary.telat, '', '', '', '', '', '', perf.summary.koreksi, perf.summary.tidakLengkap, perf.summary.off];
    const tr = sh.getRange(5 + body.length, 1, 1, header.length);
    tr.setValues([totalRow]).setFontWeight('bold').setBackground('#ffe2cc');
    sh.getRange(5 + body.length, 7).setNumberFormat('0%');
    sh.getRange(5 + body.length, 5, 1, header.length - 4).setHorizontalAlignment('center');
  } else {
    sh.getRange(5, 1).setValue('Belum ada data untuk bulan ini.');
  }
  sh.setFrozenRows(4);
  sh.setFrozenColumns(2);
  sh.setColumnWidth(1, 40);
  sh.setColumnWidth(2, 190);
  sh.setColumnWidths(3, 2, 110);
  sh.setColumnWidths(5, header.length - 4, 92);
  sh.setRowHeight(4, 44);

  // ---- REKAP_PERINGKAT ----
  const rk = getFreshSheet('REKAP_PERINGKAT');
  rk.getRange(1, 1).setValue('PERINGKAT ABSENSI — ' + judulBulan).setFontSize(14).setFontWeight('bold');
  rk.getRange(2, 1).setValue('Diperbarui ' + stamp).setFontColor('#6b7280');
  const blocks = [
    { title: 'Paling Sering Terlambat', unit: 'kali', list: perf.ranking.telat, extra: e => e + ' menit' },
    { title: 'Paling Sering Ajukan Koreksi', unit: 'kali', list: perf.ranking.koreksi, extra: () => '' },
    { title: 'Paling Sering Izin / Sakit / Cuti', unit: 'pengajuan', list: perf.ranking.izin, extra: e => e + ' hari' },
    { title: 'Paling Sering Tidak Hadir', unit: 'hari', list: perf.ranking.alpa, extra: () => '' }
  ];
  blocks.forEach((b, idx) => {
    const col = 1 + idx * 5;
    rk.getRange(4, col, 1, 4).merge().setValue(b.title).setBackground(ORANGE).setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
    rk.getRange(5, col, 1, 4).setValues([['#', 'Nama', 'Jumlah (' + b.unit + ')', 'Keterangan']]).setBackground(SOFT).setFontWeight('bold');
    const lines = (b.list || []).map((r, i) => [i + 1, r.nama + (r.brand ? ' (' + r.brand + ')' : ''), r.value, r.extra != null ? b.extra(r.extra) : '']);
    if (lines.length) rk.getRange(6, col, lines.length, 4).setValues(lines);
    else rk.getRange(6, col).setValue('Tidak ada');
    rk.setColumnWidth(col, 34);
    rk.setColumnWidth(col + 1, 190);
    rk.setColumnWidth(col + 2, 100);
    rk.setColumnWidth(col + 3, 90);
    rk.setColumnWidth(col + 4, 20);
  });

  // Buang sheet kosong bawaan "Sheet1" pada spreadsheet bulanan yang baru dibuat.
  const bawaan = ss.getSheetByName('Sheet1');
  if (bawaan && ss.getSheets().length > 1) ss.deleteSheet(bawaan);
  ss.setActiveSheet(sh);

  return { url: ss.getUrl() + '#gid=' + sh.getSheetId(), gidRekap: sh.getSheetId(), gidPeringkat: rk.getSheetId() };
}

/**
 * REKAP BULANAN OTOMATIS
 * Satu spreadsheet per bulan per cabang, disimpan di folder "Rekap Bulanan" (dalam ABSENSI ELS.ID).
 * Bulan berjalan diperbarui tiap hari. Pada tanggal 1-2 bulan baru, bulan lalu dibuat final
 * sekali lagi lalu tidak disentuh lagi (jadi arsip). Tidak perlu salin manual.
 */
function getRekapFolder_() {
  return getOrCreateFolder_(APP_CONFIG.REKAP_FOLDER_NAME);
}

function getOrCreateRekapSpreadsheet_(month, label) {
  const folder = getRekapFolder_();
  const name = 'REKAP ABSENSI ' + month + ' - ' + label;
  const it = folder.getFilesByName(name);
  if (it.hasNext()) {
    const f = it.next();
    return { ss: SpreadsheetApp.openById(f.getId()), file: f, created: false };
  }
  const ss = SpreadsheetApp.create(name);
  const file = DriveApp.getFileById(ss.getId());
  try {
    file.moveTo(folder);
  } catch (e) {
    folder.addFile(file);
    try { DriveApp.getRootFolder().removeFile(file); } catch (e2) {}
  }
  return { ss: ss, file: file, created: true };
}

/** Beri akses lihat ke manager yang berhak (admin = semua, manager toko = cabangnya). */
function shareRekapFile_(file, cabang) {
  const target = normalizeText_(cabang);
  getSheetObjects_(SHEET.MANAGER).forEach(m => {
    if (normalizeText_(m.status) !== 'AKTIF') return;
    const em = String(m.emailmanager || '').trim().toLowerCase();
    if (!em) return;
    const isAdmin = normalizeText_(m.role).includes('ADMIN');
    if (isAdmin || (target && normalizeText_(m.cabang) === target)) {
      try { file.addViewer(em); } catch (e) {}
    }
  });
}

function buildRekapForScope_(period, scope) {
  const opts = (typeof period === 'string') ? { month: period } : (period || {});
  const pseudoManager = { cabang: scope.cabang, role: scope.cabang ? 'MANAGER' : 'ADMIN' };
  const perf = getMonthlyPerformance_(pseudoManager, { month: opts.month, startDate: opts.startDate, endDate: opts.endDate, brand: scope.brand || '' });
  const label = scope.label + (scope.brand ? ' - ' + scope.brand : '');
  const holder = getOrCreateRekapSpreadsheet_(perf.periodKey, label);
  buildRekapSheet_(perf, holder.ss);
  if (holder.created) shareRekapFile_(holder.file, scope.cabang);
  return { month: perf.periodKey, label: label, url: holder.ss.getUrl(), file: holder.file, created: holder.created };
}

function getRekapScopes_() {
  const scopes = [];
  const seen = {};
  let adaAdmin = false;
  getSheetObjects_(SHEET.MANAGER).forEach(m => {
    if (normalizeText_(m.status) !== 'AKTIF') return;
    if (normalizeText_(m.role).includes('ADMIN')) { adaAdmin = true; return; }
    const c = normalizeText_(m.cabang);
    if (!c || seen[c]) return;
    seen[c] = true;
    scopes.push({ cabang: c, label: c, brand: '' });
  });
  if (adaAdmin) scopes.unshift({ cabang: '', label: 'SEMUA CABANG', brand: '' });
  return scopes;
}

function prevMonthText_(month) {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const d = new Date(y, m - 2, 1);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
}

/** Dipanggil trigger harian: update bulan berjalan; tanggal 1-2 juga memfinalkan bulan lalu. */
function jalankanRekapOtomatis() {
  const today = getToday_();
  const month = today.slice(0, 7);
  const day = Number(today.slice(8, 10));
  const months = [month];
  if (day <= 2) months.push(prevMonthText_(month));

  const results = [];
  const scopes = getRekapScopes_();
  months.forEach(m => scopes.forEach(sc => {
    try {
      const r = buildRekapForScope_(m, sc);
      results.push({ month: r.month, label: r.label, url: r.url, created: r.created });
    } catch (err) {
      Logger.log('Rekap gagal ' + m + ' / ' + sc.label + ': ' + err.message);
    }
  }));
  return results;
}

/** Pasang trigger harian (sekitar pukul 01.00). Aman dipanggil berulang. */
function ensureRekapTrigger_() {
  const ada = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction && t.getHandlerFunction() === 'jalankanRekapOtomatis');
  if (ada) return false;
  ScriptApp.newTrigger('jalankanRekapOtomatis').timeBased().everyDays(1).atHour(1).inTimeZone(APP_CONFIG.TIMEZONE).create();
  return true;
}

function apiBuildRekapSheet(payload) {
  try {
    const data = payload || {};
    const email = String(data.managerEmail || '').trim().toLowerCase();
    const manager = findManagerByEmail_(email);
    if (!manager) throw new Error('Email manager tidak terdaftar atau tidak aktif.');
    if (!requireSession_(email, data.token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');

    const rs = normalizeDateString_(data.startDate);
    const re = normalizeDateString_(data.endDate);
    const period = (rs && re) ? { startDate: rs, endDate: re } : { month: String(data.month || '').trim() || getToday_().slice(0, 7) };
    if (period.month && !/^\d{4}-\d{2}$/.test(period.month)) throw new Error('Format bulan tidak valid.');

    const isAdmin = normalizeText_(manager.role).includes('ADMIN');
    const scope = {
      cabang: isAdmin ? '' : manager.cabang,
      label: isAdmin ? 'SEMUA CABANG' : manager.cabang,
      brand: normalizeText_(data.brand)
    };
    const out = buildRekapForScope_(period, scope);
    try { out.file.addViewer(email); } catch (e) {}
    try { ensureRekapTrigger_(); } catch (e) {}

    return {
      ok: true,
      message: 'Rekap ' + out.month + ' tersimpan sebagai spreadsheet sendiri di folder Rekap Bulanan.' + (period.month ? ' Diperbarui otomatis tiap hari.' : ''),
      url: out.url
    };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

/** Menu spreadsheet: buat/perbarui rekap bulan berjalan sekarang. */
function buatRekapBulanIni() {
  const hasil = jalankanRekapOtomatis();
  try { SpreadsheetApp.getUi().alert('Selesai. ' + hasil.length + ' file rekap diperbarui di folder Rekap Bulanan.'); } catch (e) {}
  return hasil;
}

/** Menu spreadsheet: pasang rekap otomatis harian, lalu jalankan sekali sekarang. */
function pasangRekapOtomatis() {
  const baru = ensureRekapTrigger_();
  const hasil = jalankanRekapOtomatis();
  try {
    SpreadsheetApp.getUi().alert((baru ? 'Rekap otomatis dipasang (jalan tiap hari sekitar pukul 01.00). ' : 'Rekap otomatis sudah terpasang. ') + hasil.length + ' file rekap diperbarui di folder Rekap Bulanan.');
  } catch (e) {}
  return hasil;
}

function monthToDateRange_(month) {
  const parts = String(month || '').split('-');
  const year = Number(parts[0]);
  const monthIndex = Number(parts[1]) - 1;
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  return {
    startDate: Utilities.formatDate(start, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd'),
    endDate: Utilities.formatDate(end, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd')
  };
}

// Daftar menu yang bisa jadi "Menu Favorit" promotor (urutan tampil = urutan di sini).
const FAVORIT_MENU_KEYS = ['KOREKSI', 'IZIN', 'SHIFT', 'RIWAYAT', 'JADWAL', 'TIM'];
const FAVORIT_MENU_DEFAULT = ['KOREKSI', 'IZIN', 'SHIFT', 'JADWAL'];

function normalizeFavoriteMenus_(list) {
  const set = {};
  (Array.isArray(list) ? list : []).forEach(function (k) { set[normalizeText_(k)] = true; });
  return FAVORIT_MENU_KEYS.filter(function (k) { return set[k]; });   // buang yang tak dikenal & kembar, urut sesuai daftar
}

function getFavoriteMenus_() {
  const raw = getConfigValue_('MENU_FAVORIT', null);
  if (raw === null || raw === undefined || String(raw).trim() === '') return FAVORIT_MENU_DEFAULT.slice();
  if (normalizeText_(raw) === 'TIDAK_ADA') return [];
  return normalizeFavoriteMenus_(String(raw).split(','));
}

function ensureConfigDefaults_() {
  const sheet = ensureConfigSheet_();
  const defaults = [
    ['TOLERANSI_TERLAMBAT_MENIT', APP_CONFIG.TOLERANSI_TERLAMBAT_MENIT, 'Toleransi telat dalam menit untuk status absen masuk.'],
    ['VERIFIKASI_WAJAH', 'WAJIB', 'WAJIB = absen hanya bisa kalau wajah cocok dengan foto dasar. PERINGATAN = boleh absen tapi ditandai untuk manager. MATI = tanpa cek wajah.'],
    ['WAJAH_BATAS', '0.6', 'Batas kemiripan wajah (0.4 - 0.8). Makin kecil makin ketat. Naikkan sedikit (mis. 0.65) kalau terlalu sering menolak orang yang benar.'],
    ['LOKASI_MARGIN_AKURASI_MAKS', '75', 'Kelonggaran lokasi absen (meter). HP melaporkan akurasi GPS-nya (±N m); absen yang jaraknya melewati radius tetapi masih dalam akurasi itu tetap diterima (maksimal sebesar angka ini) dan ditandai LOKASI_BATAS di catatan. 0 = ketat (hanya di dalam radius).'],
    ['MENU_FAVORIT', FAVORIT_MENU_DEFAULT.join(','), 'Menu Favorit di beranda promotor (diatur manager lewat Pengaturan Admin). Pilihan: KOREKSI, IZIN, SHIFT, RIWAYAT, JADWAL, TIM. TIDAK_ADA = tidak menampilkan menu favorit.'],
    ['PERUBAHAN_SHIFT_MAKS_HARI', '31', 'Perubahan shift / tukar shift hanya boleh untuk sekian hari ke depan (hari ini dan seterusnya).'],
    ['KOREKSI_MAKS_HARI', '31', 'Koreksi kehadiran hanya boleh untuk sekian hari terakhir (tidak boleh tanggal masa depan).'],
    ['VERIFIKASI_JIKA_ERROR', 'IZINKAN', 'Kalau pengenal wajah di HP gagal/macet (bukan wajah salah): IZINKAN = absen tetap bisa, ditandai "tidak diverifikasi" untuk manager. BLOKIR = absen ditolak sampai pengenal wajah berhasil. Wajah yang jelas tidak cocok tetap selalu ditolak.']
  ];

  defaults.forEach(row => {
    if (getConfigValue_(row[0], null) === null) {
      setConfigValue_(row[0], row[1], row[2], 'SYSTEM');
    }
  });

  return true;
}

function ensureConfigSheet_() {
  const ss = getSs_();
  let sheet = ss.getSheetByName(SHEET.CONFIG);
  if (!sheet) sheet = ss.insertSheet(SHEET.CONFIG);

  const headers = ['Key', 'Value', 'Catatan', 'Updated At', 'Updated By'];
  const current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getDisplayValues()[0];
  if (normalizeHeader_(current[0]) !== 'key') {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

let __CONFIG_MEMO__ = null; // hanya hidup selama 1 eksekusi (tiap panggilan aplikasi), jadi aman

function getConfigMap_() {
  if (__CONFIG_MEMO__) return __CONFIG_MEMO__;
  try {
    const hit = CacheService.getScriptCache().get('CFG_MAP_V1');
    if (hit) { __CONFIG_MEMO__ = JSON.parse(hit); return __CONFIG_MEMO__; }
  } catch (e) {}
  const sheet = ensureConfigSheet_();
  const values = sheet.getDataRange().getDisplayValues();
  const map = {};
  if (values.length < 2) return map;

  const headers = values[0].map(normalizeHeader_);
  const idxKey = headers.indexOf('key');
  const idxValue = headers.indexOf('value');

  values.slice(1).forEach(row => {
    const key = normalizeText_(row[idxKey]);
    if (!key) return;
    map[key] = row[idxValue];
  });

  __CONFIG_MEMO__ = map;
  try { CacheService.getScriptCache().put('CFG_MAP_V1', JSON.stringify(map), 30); } catch (e) {}
  return map;
}

function getConfigValue_(key, fallback) {
  const map = getConfigMap_();
  const k = normalizeText_(key);
  if (Object.prototype.hasOwnProperty.call(map, k)) return map[k];
  return fallback;
}

function setConfigValue_(key, value, catatan, updatedBy) {
  __CONFIG_MEMO__ = null;
  try { CacheService.getScriptCache().remove('CFG_MAP_V1'); } catch (e) {}
  const sheet = ensureConfigSheet_();
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0].map(normalizeHeader_);
  const idxKey = headers.indexOf('key');
  const idxValue = headers.indexOf('value');
  const idxCatatan = headers.indexOf('catatan');
  const idxUpdatedAt = headers.indexOf('updatedat');
  const idxUpdatedBy = headers.indexOf('updatedby');

  const k = normalizeText_(key);
  let targetRow = -1;

  for (let r = 1; r < values.length; r++) {
    if (normalizeText_(values[r][idxKey]) === k) {
      targetRow = r + 1;
      break;
    }
  }

  const now = Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

  if (targetRow > 0) {
    sheet.getRange(targetRow, idxValue + 1).setValue(value);
    if (idxCatatan >= 0) sheet.getRange(targetRow, idxCatatan + 1).setValue(catatan || '');
    if (idxUpdatedAt >= 0) sheet.getRange(targetRow, idxUpdatedAt + 1).setValue(now);
    if (idxUpdatedBy >= 0) sheet.getRange(targetRow, idxUpdatedBy + 1).setValue(updatedBy || '');
  } else {
    sheet.appendRow([k, value, catatan || '', now, updatedBy || '']);
  }
}

/** Aturan verifikasi wajah: {mode: WAJIB|PERINGATAN|MATI, batas: 0.4-0.8}. */
function getFaceConfig_() {
  if (getConfigValue_('VERIFIKASI_WAJAH', null) === null) {
    try { ensureConfigDefaults_(); } catch (e) {}
  }
  const modeRaw = normalizeText_(getConfigValue_('VERIFIKASI_WAJAH', 'WAJIB'));
  const mode = ['WAJIB', 'PERINGATAN', 'MATI'].indexOf(modeRaw) >= 0 ? modeRaw : 'WAJIB';
  let batas = Number(String(getConfigValue_('WAJAH_BATAS', 0.6)).replace(',', '.'));
  if (!isFinite(batas) || batas <= 0) batas = 0.6;
  batas = Math.min(0.8, Math.max(0.4, batas));
  if (getConfigValue_('VERIFIKASI_JIKA_ERROR', null) === null) {
    try { ensureConfigDefaults_(); } catch (e) {}
  }
  const onError = normalizeText_(getConfigValue_('VERIFIKASI_JIKA_ERROR', 'IZINKAN')) === 'BLOKIR' ? 'BLOKIR' : 'IZINKAN';
  return { mode: mode, batas: batas, onError: onError };
}

function getToleransiTelatMenit_() {
  const value = getConfigValue_('TOLERANSI_TERLAMBAT_MENIT', APP_CONFIG.TOLERANSI_TERLAMBAT_MENIT);
  return Math.max(0, Number(value || 0));
}

function getAllBrands_() {
  const brandMap = {};
  try {
    getSheetObjects_(SHEET.PROMOTOR).forEach(item => {
      const brand = normalizeText_(item.brand);
      if (brand) brandMap[brand] = true;
    });
    getSheetObjects_(SHEET.PROSES).forEach(item => {
      const brand = normalizeText_(item.brand);
      if (brand) brandMap[brand] = true;
    });
  } catch (err) {}
  return Object.keys(brandMap).sort();
}


/****************************************************
 * SETUP SHEET
 ****************************************************/

function setupHeaderOutput() {
  const ss = getSs_();

  setHeader_(ss, SHEET.CONFIG, [
    'Key',
    'Value',
    'Catatan',
    'Updated At',
    'Updated By'
  ]);
  ensureConfigDefaults_();

  setHeader_(ss, SHEET.PROSES, [
    'ID Jadwal',
    'Tanggal',
    'Hari',
    'Email',
    'Nama',
    'Brand',
    'Cabang',
    'Shift',
    'Jam Masuk',
    'Jam Pulang',
    'Status Jadwal'
  ]);

  setHeader_(ss, SHEET.ABSENSI, [
    'ID',
    'Timestamp',
    'Tanggal',
    'Email',
    'Nama',
    'Brand',
    'Cabang',
    'Jenis Absen',
    'Shift',
    'Jam Jadwal',
    'Jam Aktual',
    'Status',
    'Foto',
    'Latitude',
    'Longitude',
    'Jarak Meter',
    'Catatan'
  ]);

  setHeader_(ss, SHEET.KOREKSI, [
    'ID Request',
    'Timestamp',
    'Email',
    'Nama',
    'Brand',
    'Cabang',
    'Tanggal',
    'Jenis Koreksi',
    'Data Lama',
    'Data Baru',
    'Alasan',
    'Status Approval',
    'Approved By',
    'Catatan Manager',
    'Waktu Approval'
  ]);

  setHeader_(ss, SHEET.IZIN, [
    'ID Request',
    'Timestamp',
    'Email',
    'Nama',
    'Brand',
    'Cabang',
    'Jenis Pengajuan',
    'Tanggal Mulai',
    'Tanggal Selesai',
    'Keterangan',
    'Lampiran',
    'Status Approval',
    'Approved By',
    'Catatan Manager',
    'Waktu Approval'
  ]);

  setHeader_(ss, SHEET.INFO, [
    'ID Info',
    'Timestamp',
    'Email Manager',
    'Nama Manager',
    'Cabang Target',
    'Brand Target',
    'Judul',
    'Isi',
    'Tanggal Mulai',
    'Tanggal Selesai',
    'Status'
  ]);

  SpreadsheetApp.getUi().alert('Header output sudah disiapkan.');
}

function cekStrukturSheet() {
  const ss = getSs_();
  const requiredSheets = Object.values(SHEET);
  const missing = [];

  requiredSheets.forEach(name => {
    if (!ss.getSheetByName(name)) missing.push(name);
  });

  if (missing.length > 0) {
    SpreadsheetApp.getUi().alert(
      'Sheet berikut belum ada:\n\n' + missing.join('\n')
    );
    return;
  }

  SpreadsheetApp.getUi().alert('Struktur sheet sudah aman.');
}

/****************************************************
 * PROSES RAW_JADWAL KE JADWAL_PROSES
 ****************************************************/

function prosesRawJadwal() {
  const ss = getSs_();
  const rawSheet = ss.getSheetByName(SHEET.RAW);
  const prosesSheet = ss.getSheetByName(SHEET.PROSES);

  if (!rawSheet) throw new Error('Sheet RAW_JADWAL tidak ditemukan.');
  if (!prosesSheet) throw new Error('Sheet JADWAL_PROSES tidak ditemukan.');

  const bulanText = rawSheet.getRange('B1').getDisplayValue().trim();
  const tahunText = rawSheet.getRange('B2').getDisplayValue().trim();
  const cabangDefault = normalizeText_(rawSheet.getRange('B3').getDisplayValue());

  if (!bulanText || !tahunText || !cabangDefault) {
    SpreadsheetApp.getUi().alert('Bulan, tahun, atau cabang di RAW_JADWAL belum lengkap.');
    return;
  }

  const monthIndex = getMonthIndex_(bulanText);
  const year = Number(tahunText);

  if (monthIndex === null || !year) {
    SpreadsheetApp.getUi().alert('Format bulan atau tahun tidak terbaca. Contoh: MEI dan 2026.');
    return;
  }

  const promotorMap = getPromotorMap_();
  const shiftMap = getShiftMap_();

  const lastRow = rawSheet.getLastRow();
  const lastCol = rawSheet.getLastColumn();

  if (lastRow < 6 || lastCol < 3) {
    SpreadsheetApp.getUi().alert('RAW_JADWAL belum berisi data jadwal.');
    return;
  }

  const hariRow = rawSheet.getRange(4, 3, 1, lastCol - 2).getDisplayValues()[0];
  const tanggalRow = rawSheet.getRange(5, 3, 1, lastCol - 2).getDisplayValues()[0];
  const data = rawSheet.getRange(6, 1, lastRow - 5, lastCol).getDisplayValues();

  const output = [];

  data.forEach(row => {
    const nama = normalizeText_(row[0]);
    const brand = normalizeText_(row[1]);

    if (!nama || !brand) return;

    const promotor =
      promotorMap[makePromotorKey_(nama, brand)] ||
      promotorMap[makePromotorLooseKey_(nama, brand)] ||
      promotorMap[nama] ||
      promotorMap[normalizeLooseName_(nama)] ||
      {};

    const email = promotor.email || '';
    const cabang = promotor.cabang || cabangDefault;

    for (let c = 2; c < lastCol; c++) {
      const dayNumber = Number(tanggalRow[c - 2]);
      if (!dayNumber) continue;

      const shiftRaw = row[c];
      const shift = normalizeShift_(shiftRaw);
      if (!shift) continue;

      const shiftInfo = shiftMap[shift] || {};
      const dateObj = new Date(year, monthIndex, dayNumber);
      const tanggal = Utilities.formatDate(dateObj, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
      const hari = normalizeText_(hariRow[c - 2]) || getHariIndonesia_(dateObj);

      let jamMasuk = shiftInfo.jamMasuk || '';
      let jamPulang = shiftInfo.jamPulang || '';
      let statusJadwal = 'MASUK';

      if (shift === 'OFF') {
        jamMasuk = '';
        jamPulang = '';
        statusJadwal = 'OFF';
      } else if (!shiftInfo.status) {
        statusJadwal = 'SHIFT_TIDAK_DIKENAL';
      }

      const idJadwal = makeId_([
        'JDW',
        tanggal,
        email || nama,
        brand
      ]);

      output.push([
        idJadwal,
        tanggal,
        hari,
        email,
        nama,
        brand,
        cabang,
        shift,
        jamMasuk,
        jamPulang,
        statusJadwal
      ]);
    }
  });

  prosesSheet.clearContents();
  prosesSheet.getRange(1, 1, 1, 11).setValues([[
    'ID Jadwal',
    'Tanggal',
    'Hari',
    'Email',
    'Nama',
    'Brand',
    'Cabang',
    'Shift',
    'Jam Masuk',
    'Jam Pulang',
    'Status Jadwal'
  ]]);

  if (output.length > 0) {
    prosesSheet.getRange(2, 1, output.length, output[0].length).setValues(output);
    prosesSheet.autoResizeColumns(1, 11);
  }

  SpreadsheetApp.getUi().alert(
    'JADWAL_PROSES berhasil dibuat.\nTotal data: ' + output.length + ' baris.'
  );
}

/****************************************************
 * DATA READER
 ****************************************************/

function findPromotorByEmail_(email) {
  const values = getSheetObjects_(SHEET.PROMOTOR);
  const target = String(email || '').trim().toLowerCase();

  const row = values.find(item => {
    return String(item.email || '').trim().toLowerCase() === target &&
      normalizeText_(item.status) === 'AKTIF';
  });

  if (!row) return null;

  return {
    email: String(row.email || '').trim().toLowerCase(),
    nama: normalizeText_(row.nama),
    brand: normalizeText_(row.brand),
    cabang: normalizeText_(row.cabang),
    status: normalizeText_(row.status),
    noHp: row.nohp || '',
    catatanProfil: row.catatanprofil || '',
    fotoProfilId: String(row.fotoprofil || '').trim(),
    fotoDasarId: String(row.fotodasar || '').trim(),
    fotoProfil: driveThumbUrl_(row.fotoprofil, 300),
    fotoDasar: driveThumbUrl_(row.fotodasar, 500),
    fotoDasarDesc: parseFaceDesc_(row.fotodasardesc)
  };
}

function parseFaceDesc_(text) {
  try {
    const arr = JSON.parse(String(text || ''));
    return (Array.isArray(arr) && arr.length === 128) ? arr : null;
  } catch (e) {
    return null;
  }
}

function findManagerByEmail_(email) {
  const values = getSheetObjects_(SHEET.MANAGER);
  const target = String(email || '').trim().toLowerCase();

  const row = values.find(item => {
    return String(item.emailmanager || '').trim().toLowerCase() === target &&
      normalizeText_(item.status) === 'AKTIF';
  });

  if (!row) return null;

  return {
    email: String(row.emailmanager || '').trim().toLowerCase(),
    nama: normalizeText_(row.namamanager),
    cabang: normalizeText_(row.cabang),
    role: normalizeText_(row.role),
    status: normalizeText_(row.status),
    fotoProfilId: String(row.fotoprofil || '').trim(),
    fotoDasarId: String(row.fotodasar || '').trim(),
    fotoProfil: driveThumbUrl_(row.fotoprofil, 300),
    fotoDasar: driveThumbUrl_(row.fotodasar, 500),
    fotoDasarDesc: parseFaceDesc_(row.fotodasardesc)
  };
}

function findSchedule_(email, tanggal) {
  const values = getSheetObjects_(SHEET.PROSES);
  const targetEmail = String(email || '').trim().toLowerCase();
  const targetTanggal = normalizeDateString_(tanggal);

  const row = values.find(item => {
    return String(item.email || '').trim().toLowerCase() === targetEmail &&
      normalizeDateString_(item.tanggal) === targetTanggal;
  });

  return row ? scheduleFromRow_(row) : null;
}

function findScheduleForPromotor_(promotor, tanggal) {
  const values = getSheetObjects_(SHEET.PROSES);
  const targetTanggal = normalizeDateString_(tanggal);
  const targetEmail = String((promotor && promotor.email) || '').trim().toLowerCase();
  const targetNama = normalizeText_((promotor && promotor.nama) || '');
  const targetNamaLoose = normalizeLooseName_(targetNama);
  const targetBrand = normalizeText_((promotor && promotor.brand) || '');
  const targetCabang = normalizeText_((promotor && promotor.cabang) || '');

  if (!targetTanggal) return null;

  // Prioritas 1: email sama persis.
  let row = values.find(item => {
    return normalizeDateString_(item.tanggal) === targetTanggal &&
      String(item.email || '').trim().toLowerCase() === targetEmail;
  });

  if (row) return scheduleFromRow_(row);

  // Prioritas 2: nama + brand + cabang sama persis.
  row = values.find(item => {
    return normalizeDateString_(item.tanggal) === targetTanggal &&
      normalizeText_(item.nama) === targetNama &&
      normalizeText_(item.brand) === targetBrand &&
      normalizeText_(item.cabang) === targetCabang;
  });

  if (row) return scheduleFromRow_(row);

  // Prioritas 3: nama longgar + brand + cabang.
  // Contoh: FADELA dan FADELLA tetap dianggap orang yang sama.
  row = values.find(item => {
    return normalizeDateString_(item.tanggal) === targetTanggal &&
      normalizeLooseName_(item.nama) === targetNamaLoose &&
      normalizeText_(item.brand) === targetBrand &&
      normalizeText_(item.cabang) === targetCabang;
  });

  if (row) return scheduleFromRow_(row);

  // Prioritas 4: nama longgar + brand, jika cabang kosong/tidak konsisten.
  row = values.find(item => {
    return normalizeDateString_(item.tanggal) === targetTanggal &&
      normalizeLooseName_(item.nama) === targetNamaLoose &&
      normalizeText_(item.brand) === targetBrand;
  });

  if (row) return scheduleFromRow_(row);

  return null;
}

function scheduleFromRow_(row) {
  if (!row) return null;

  return {
    idJadwal: row.idjadwal || '',
    tanggal: normalizeDateString_(row.tanggal),
    hari: normalizeText_(row.hari),
    email: String(row.email || '').trim().toLowerCase(),
    nama: normalizeText_(row.nama),
    brand: normalizeText_(row.brand),
    cabang: normalizeText_(row.cabang),
    shift: normalizeShift_(row.shift),
    jamMasuk: formatJam_(row.jammasuk),
    jamPulang: formatJam_(row.jampulang),
    statusJadwal: normalizeText_(row.statusjadwal)
  };
}

function getAttendanceToday_(email, tanggal) {
  const targetEmail = String(email || '').trim().toLowerCase();
  const targetTanggal = normalizeDateString_(tanggal);
  // Hari ini -> cukup baca baris terakhir. Tanggal lama (koreksi) -> baca semua.
  const values = targetTanggal === getToday_()
    ? getSheetObjectsTail_(SHEET.ABSENSI, 1200)
    : getSheetObjects_(SHEET.ABSENSI);

  return values
    .filter(item => {
      return String(item.email || '').trim().toLowerCase() === targetEmail &&
        normalizeDateString_(item.tanggal) === targetTanggal;
    })
    .map(item => ({
      id: item.id || '',
      timestamp: item.timestamp || '',
      tanggal: normalizeDateString_(item.tanggal),
      jenisAbsen: normalizeText_(item.jenisabsen),
      shift: normalizeText_(item.shift),
      jamJadwal: formatJam_(item.jamjadwal),
      jamAktual: formatJam_(item.jamaktual),
      status: normalizeText_(item.status),
      foto: item.foto || '',
      jarakMeter: item.jarakmeter || ''
    }));
}

function getMyRequests_(email) {
  const targetEmail = String(email || '').trim().toLowerCase();
  const result = {
    koreksi: [],
    izin: []
  };

  const currentMonth = getToday_().slice(0, 7);
  const koreksi = getSheetObjects_(SHEET.KOREKSI);
  result.koreksi = koreksi
    .filter(item => String(item.email || '').trim().toLowerCase() === targetEmail ||
      (normalizeText_(item.jeniskoreksi) === SHIFT_JENIS_TUKAR && emailTemanDariData_(item.databaru) === targetEmail))
    .filter(item => { const mo = monthOfText_(item.timestamp); return normalizeText_(item.statusapproval) === 'MENUNGGU_APPROVAL' || !mo || mo === currentMonth; })
    .slice(-30)
    .reverse()
    .map(item => ({
      id: item.idrequest || '',
      timestamp: item.timestamp || '',
      tanggal: normalizeDateString_(item.tanggal),
      jenis: normalizeText_(item.jeniskoreksi),
      sebagaiTeman: String(item.email || '').trim().toLowerCase() !== targetEmail,
      diajukanOleh: String(item.email || '').trim().toLowerCase() !== targetEmail ? normalizeText_(item.nama) : '',
      dataLama: item.datalama || '',
      dataBaru: item.databaru || '',
      alasan: item.alasan || '',
      status: normalizeText_(item.statusapproval),
      catatanManager: item.catatanmanager || ''
    }));

  const izin = getSheetObjects_(SHEET.IZIN);
  result.izin = izin
    .filter(item => String(item.email || '').trim().toLowerCase() === targetEmail)
    .filter(item => { const mo = monthOfText_(item.timestamp); return normalizeText_(item.statusapproval) === 'MENUNGGU_APPROVAL' || !mo || mo === currentMonth; })
    .slice(-30)
    .reverse()
    .map(item => ({
      id: item.idrequest || '',
      timestamp: item.timestamp || '',
      jenis: normalizeText_(item.jenispengajuan),
      tanggalMulai: normalizeDateString_(item.tanggalmulai),
      tanggalSelesai: normalizeDateString_(item.tanggalselesai),
      keterangan: item.keterangan || '',
      lampiran: item.lampiran || '',
      status: normalizeText_(item.statusapproval),
      catatanManager: item.catatanmanager || ''
    }));

  return result;
}


function countPromotorNotifications_(requests) {
  const koreksi = (requests && requests.koreksi) ? requests.koreksi : [];
  const izin = (requests && requests.izin) ? requests.izin : [];
  return koreksi.concat(izin)
    .filter(item => ['DISETUJUI', 'DITOLAK'].includes(normalizeText_(item.status)))
    .slice(0, 10)
    .length;
}

// ===== Pengecekan lokasi absen =====

// Margin akurasi (meter): HP melaporkan "posisi saya ±A meter". Selisih sampai A meter di luar radius masih mungkin benar-benar
// di dalam toko, jadi diberi kelonggaran sebesar akurasi itu, TETAP dibatasi nilai ini. 0 = ketat seperti sebelumnya.
function lokasiMarginMaks_() {
  const v = Number(String(getConfigValue_('LOKASI_MARGIN_AKURASI_MAKS', '75')).replace(',', '.'));
  return isFinite(v) && v >= 0 ? Math.min(v, 300) : 75;
}

// Semua titik toko milik satu cabang (cabang boleh punya lebih dari satu baris di LOKASI_TOKO; yang terdekat dipakai).
function findLokasiListByCabang_(cabang) {
  const target = normalizeText_(cabang);
  return getSheetObjects_(SHEET.LOKASI)
    .filter(function (item) { return normalizeText_(item.cabang) === target; })
    .map(function (row) {
      return {
        cabang: normalizeText_(row.cabang),
        latitude: parseCoordinate_(row.latitude),
        longitude: parseCoordinate_(row.longitude),
        radiusMeter: Number(row.radiusmeter || 100)
      };
    })
    .filter(function (l) { return isFinite(l.latitude) && isFinite(l.longitude) && (l.latitude || l.longitude); });
}

/**
 * Menilai posisi HP terhadap titik-titik toko. Mengembalikan titik TERDEKAT (relatif terhadap radiusnya):
 * ok = di dalam radius, atau di luar radius tetapi masih dalam margin akurasi GPS (lewatMargin = true).
 */
function evaluateLokasiAbsen_(lokasiList, lat, lng, accuracy, marginMaks) {
  let best = null;
  (lokasiList || []).forEach(function (l, i) {
    const jarak = calculateDistanceMeter_(lat, lng, l.latitude, l.longitude);
    const lebih = jarak - l.radiusMeter;                       // <= 0: di dalam radius
    if (!best || lebih < best.lebih) best = { index: i, jarak: jarak, radius: l.radiusMeter, lebih: lebih, titik: l };
  });
  if (!best) return null;
  const akurasi = (isFinite(accuracy) && accuracy > 0) ? accuracy : 0;
  const margin = Math.min(akurasi, Math.max(0, marginMaks || 0));
  const diDalam = best.lebih <= 0;
  const lewatMargin = !diDalam && best.lebih <= margin;
  return {
    ok: diDalam || lewatMargin, diDalamRadius: diDalam, lewatMargin: lewatMargin,
    jarak: best.jarak, radius: best.radius, margin: margin, akurasi: akurasi,
    titik: best.titik, jumlahTitik: lokasiList.length
  };
}

function pesanDiLuarRadius_(ev) {
  let msg = 'Lokasi kamu berada di luar radius toko. Jarak saat ini sekitar ' + Math.round(ev.jarak) +
    ' meter dari titik toko (radius ' + Math.round(ev.radius) + ' m).';
  if (ev.akurasi > 0) msg += ' Akurasi GPS HP kamu ±' + Math.round(ev.akurasi) + ' m.';
  msg += ev.akurasi > 100
    ? ' Sinyal GPS masih lemah: pindah ke area terbuka atau dekat jendela, tunggu sekitar 15 detik, lalu tekan Simpan Absen lagi.'
    : ' Kalau kamu sudah di toko, tunggu sekitar 15 detik lalu tekan Simpan Absen lagi (lokasi dibaca ulang).';
  return msg;
}

const LOG_LOKASI_SHEET = 'LOG_LOKASI';
const LOG_LOKASI_HEADER = ['Waktu', 'Email', 'Nama', 'Brand', 'Cabang', 'Jenis Absen', 'Latitude', 'Longitude', 'Akurasi Meter', 'Jarak Meter', 'Radius Meter', 'Titik Toko Lat', 'Titik Toko Lng'];

// Catat setiap absen yang ditolak karena lokasi, supaya bisa dicek polanya (menu 18). Tidak boleh sampai mengganggu absen.
function logLokasiDitolak_(promotor, jenisAbsen, lat, lng, ev) {
  try {
    const ss = getSs_();
    let sheet = ss.getSheetByName(LOG_LOKASI_SHEET);
    if (!sheet) {
      sheet = ss.insertSheet(LOG_LOKASI_SHEET);
      sheet.appendRow(LOG_LOKASI_HEADER);
      try { sheet.setFrozenRows(1); } catch (e) {}
    }
    sheet.appendRow([
      Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss'),
      promotor.email, promotor.nama, promotor.brand, promotor.cabang, jenisAbsen,
      lat, lng, Math.round(ev.akurasi || 0), Math.round(ev.jarak), Math.round(ev.radius),
      ev.titik ? ev.titik.latitude : '', ev.titik ? ev.titik.longitude : ''
    ]);
    if (sheet.getLastRow() > 3000) sheet.deleteRows(2, 1000);    // simpan yang terbaru saja
  } catch (e) { Logger.log('logLokasiDitolak_: ' + e.message); }
}

// ===== Diagnosa lokasi toko (menu 18) =====

function medianOf_(arr) {
  const a = (arr || []).filter(function (x) { return isFinite(x); }).sort(function (x, y) { return x - y; });
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function percentileOf_(arr, p) {
  const a = (arr || []).filter(function (x) { return isFinite(x); }).sort(function (x, y) { return x - y; });
  if (!a.length) return null;
  return a[Math.min(a.length - 1, Math.max(0, Math.ceil(p * a.length) - 1))];
}

function geoValid_(lat, lng) { return isFinite(lat) && isFinite(lng) && (lat !== 0 || lng !== 0) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180; }

/**
 * Membandingkan titik toko di LOKASI_TOKO dengan data nyata 30 hari terakhir:
 *  - absen yang DITERIMA (ABSENSI: koordinat, jarak, akurasi di catatan),
 *  - absen yang DITOLAK karena lokasi (LOG_LOKASI).
 * Hasilnya per cabang: statistik + kesimpulan dalam bahasa biasa + usulan koordinat bila titik toko tampak bergeser.
 */
function buildDiagnosaLokasi_(lokasiRows, absensiRows, logRows, todayIso) {
  const HARI = 30;
  const inWindow = function (tgl) {
    const t = normalizeDateString_(tgl);
    if (!t) return false;
    const sel = daysBetweenDates_(t, todayIso);
    return sel >= 0 && sel <= HARI;
  };
  const num = function (v) { return Number(String(v == null ? '' : v).replace(',', '.')); };
  const akurasiDari = function (catatan) { const m = /AKURASI:(\d+)m/.exec(String(catatan || '')); return m ? Number(m[1]) : null; };
  const geoMedian = function (list) { return { lat: medianOf_(list.map(function (x) { return x.lat; })), lng: medianOf_(list.map(function (x) { return x.lng; })) }; };
  const fmtGeo = function (g) { return g.lat.toFixed(6) + ', ' + g.lng.toFixed(6); };

  const cabangMap = {};
  (lokasiRows || []).forEach(function (r) {
    const c = normalizeText_(r.cabang); if (!c) return;
    (cabangMap[c] = cabangMap[c] || []).push({ lat: parseCoordinate_(r.latitude), lng: parseCoordinate_(r.longitude), radius: Number(r.radiusmeter || 100) });
  });

  const hasil = Object.keys(cabangMap).sort().map(function (cabang) {
    const titik = cabangMap[cabang];
    const radius = titik[0].radius;
    const diterima = (absensiRows || []).filter(function (r) { return normalizeText_(r.cabang) === cabang && inWindow(r.tanggal); })
      .map(function (r) { return { lat: num(r.latitude), lng: num(r.longitude), jarak: num(r.jarakmeter), akurasi: akurasiDari(r.catatan), batas: /LOKASI_BATAS/.test(String(r.catatan || '')) }; })
      .filter(function (x) { return geoValid_(x.lat, x.lng); });
    const ditolak = (logRows || []).filter(function (r) { return normalizeText_(r.cabang) === cabang && inWindow(String(r.waktu || '').slice(0, 10)); })
      .map(function (r) { return { lat: num(r.latitude), lng: num(r.longitude), jarak: num(r.jarakmeter), akurasi: num(r.akurasimeter) }; })
      .filter(function (x) { return geoValid_(x.lat, x.lng); });

    const baris = {
      cabang: cabang, radius: radius, jumlahTitik: titik.length,
      titikToko: titik.length === 1 ? fmtGeo(titik[0]) : titik.length + ' titik',
      diterima: diterima.length, medianJarak: medianOf_(diterima.map(function (x) { return x.jarak; })),
      p90Jarak: percentileOf_(diterima.map(function (x) { return x.jarak; }), 0.9),
      lewatMargin: diterima.filter(function (x) { return x.batas; }).length,
      ditolak: ditolak.length, medianJarakDitolak: medianOf_(ditolak.map(function (x) { return x.jarak; })),
      medianAkurasiDitolak: medianOf_(ditolak.map(function (x) { return x.akurasi; })),
      usulan: '', selisihUsulan: null, catatan: []
    };

    if (titik.length > 1) {
      baris.catatan.push('Cabang ini punya ' + titik.length + ' titik toko; yang terdekat dipakai. Usulan koordinat tidak dihitung.');
    } else {
      const bagus = diterima.filter(function (x) { return x.akurasi !== null && x.akurasi <= 60; });
      const pakai = bagus.length >= 8 ? bagus : diterima;
      if (pakai.length >= 8) {
        const g = geoMedian(pakai);
        const selisih = calculateDistanceMeter_(titik[0].lat, titik[0].lng, g.lat, g.lng);
        baris.selisihUsulan = Math.round(selisih);
        if (selisih > Math.max(50, 0.4 * radius)) {
          baris.usulan = fmtGeo(g);
          baris.catatan.push('Titik toko kemungkinan bergeser sekitar ' + Math.round(selisih) + ' m dari tempat promotor biasanya absen. Usulan titik baru: ' + baris.usulan + ' (ubah di LOKASI_TOKO).');
        }
      }
      if (ditolak.length >= 3) {
        const rendah = ditolak.filter(function (x) { return x.akurasi > 100; }).length / ditolak.length;
        if (rendah >= 0.5) baris.catatan.push(Math.round(rendah * 100) + '% penolakan terjadi saat akurasi GPS rendah (di atas 100 m): kendalanya sinyal HP, bukan titik toko.');
        const bagusTolak = ditolak.filter(function (x) { return x.akurasi > 0 && x.akurasi <= 60; });
        if (bagusTolak.length >= 3) {
          const gt = geoMedian(bagusTolak);
          const sebar = medianOf_(bagusTolak.map(function (x) { return calculateDistanceMeter_(gt.lat, gt.lng, x.lat, x.lng); }));
          const jauh = calculateDistanceMeter_(titik[0].lat, titik[0].lng, gt.lat, gt.lng);
          if (sebar <= 60 && jauh > radius) baris.catatan.push('Penolakan dengan GPS bagus menumpuk di satu tempat sekitar ' + Math.round(jauh) + ' m dari titik toko (' + fmtGeo(gt) + '). Mungkin promotor memang bertugas di sana: pertimbangkan menambah titik toko atau memperbesar radius.');
        }
      }
    }
    if (!baris.catatan.length) baris.catatan.push(diterima.length < 8 && ditolak.length < 3 ? 'Data belum cukup untuk menyimpulkan.' : 'Tidak ada pola yang mencurigakan.');
    return baris;
  });

  const terbaru = (logRows || []).slice().sort(function (a, b) { return String(b.waktu).localeCompare(String(a.waktu)); }).slice(0, 30);
  return { perCabang: hasil, ditolakTerbaru: terbaru };
}

/** Menu 18: tulis hasil diagnosa ke sheet DIAGNOSA_LOKASI. */
function diagnosaLokasiToko() {
  const today = getToday_();
  let logRows = [];
  try { if (getSs_().getSheetByName(LOG_LOKASI_SHEET)) logRows = getSheetObjects_(LOG_LOKASI_SHEET); } catch (e) { logRows = []; }
  const d = buildDiagnosaLokasi_(getSheetObjects_(SHEET.LOKASI), getSheetObjects_(SHEET.ABSENSI), logRows, today);

  const ss = getSs_();
  let sheet = ss.getSheetByName('DIAGNOSA_LOKASI');
  if (!sheet) sheet = ss.insertSheet('DIAGNOSA_LOKASI'); else sheet.clear();
  const f = function (v, unit) { return v === null || v === undefined ? '-' : Math.round(v) + (unit || ''); };
  const tabel1 = [['Cabang', 'Titik Toko', 'Radius (m)', 'Diterima 30 hari', 'Median jarak (m)', 'Jarak 90% (m)', 'Diterima lewat margin akurasi', 'Ditolak 30 hari', 'Median jarak ditolak (m)', 'Median akurasi ditolak (m)', 'Selisih titik toko vs tempat absen (m)', 'Usulan titik baru', 'Kesimpulan']]
    .concat(d.perCabang.map(function (b) { return [b.cabang, b.titikToko, b.radius, b.diterima, f(b.medianJarak), f(b.p90Jarak), b.lewatMargin, b.ditolak, f(b.medianJarakDitolak), f(b.medianAkurasiDitolak), f(b.selisihUsulan), b.usulan || '-', b.catatan.join(' ')]; }));
  const tabel2 = [['Penolakan lokasi terbaru (maks 30)', '', '', '', '', '', '', '', '']]
    .concat([['Waktu', 'Nama', 'Cabang', 'Jenis Absen', 'Akurasi (m)', 'Jarak (m)', 'Radius (m)', 'Latitude', 'Longitude']])
    .concat(d.ditolakTerbaru.map(function (r) { return [r.waktu, r.nama, r.cabang, r.jenisabsen, r.akurasimeter, r.jarakmeter, r.radiusmeter, r.latitude, r.longitude]; }));
  sheet.getRange(1, 1, 1, 1).setValue('Diagnosa Lokasi Toko — ' + today + ' (data 30 hari terakhir)');
  sheet.getRange(3, 1, tabel1.length, tabel1[0].length).setValues(tabel1);
  sheet.getRange(3 + tabel1.length + 1, 1, tabel2.length, 9).setValues(tabel2);
  try { sheet.getRange(1, 1, 1, 1).setFontWeight('bold'); sheet.getRange(3, 1, 1, tabel1[0].length).setFontWeight('bold'); sheet.autoResizeColumns(1, 12); } catch (e) {}

  const ringkas = d.perCabang.map(function (b) { return b.cabang + ': ' + b.catatan.join(' '); }).join('\n\n');
  Logger.log(ringkas);
  try { SpreadsheetApp.getUi().alert('Diagnosa lokasi selesai. Detail ada di sheet DIAGNOSA_LOKASI.\n\n' + ringkas.slice(0, 1200)); } catch (e) {}
  return d;
}

function findLokasiByCabang_(cabang) {
  const values = getSheetObjects_(SHEET.LOKASI);
  const target = normalizeText_(cabang);

  const row = values.find(item => normalizeText_(item.cabang) === target);
  if (!row) return null;

  return {
    cabang: normalizeText_(row.cabang),
    latitude: parseCoordinate_(row.latitude),
    longitude: parseCoordinate_(row.longitude),
    radiusMeter: Number(row.radiusmeter || 100)
  };
}

function getPromotorMap_() {
  const values = getSheetObjects_(SHEET.PROMOTOR);
  const map = {};

  values.forEach(row => {
    const email = String(row.email || '').trim().toLowerCase();
    const nama = normalizeText_(row.nama);
    const brand = normalizeText_(row.brand);
    const cabang = normalizeText_(row.cabang);
    const status = normalizeText_(row.status);

    if (!nama || !brand || status !== 'AKTIF') return;

    const item = { email, nama, brand, cabang, status };

    map[makePromotorKey_(nama, brand)] = item;
    map[makePromotorLooseKey_(nama, brand)] = item;
    map[nama] = item;
    map[normalizeLooseName_(nama)] = item;
  });

  return map;
}

function getShiftMap_() {
  const values = getSheetObjects_(SHEET.SHIFT);
  const map = {};

  values.forEach(row => {
    const shift = normalizeShift_(row.shift);
    if (!shift) return;

    map[shift] = {
      jamMasuk: formatJam_(row.jammasuk),
      jamPulang: formatJam_(row.jampulang),
      status: normalizeText_(row.status)
    };
  });

  if (map.MIDDLE && !map.MIDLE) map.MIDLE = map.MIDDLE;
  if (map.MIDLE && !map.MIDDLE) map.MIDDLE = map.MIDLE;

  return map;
}

/****************************************************
 * VALIDASI ABSENSI
 ****************************************************/

function validateAttendanceFlow_(jenisAbsen, existing) {
  const done = existing.map(item => item.jenisAbsen);

  if (jenisAbsen === 'MULAI_ISTIRAHAT' && !done.includes('ABSEN_MASUK')) {
    throw new Error('Kamu harus Absen Masuk dulu sebelum Mulai Istirahat.');
  }

  if (jenisAbsen === 'SELESAI_ISTIRAHAT' && !done.includes('MULAI_ISTIRAHAT')) {
    throw new Error('Kamu harus Mulai Istirahat dulu sebelum Selesai Istirahat.');
  }

  if (jenisAbsen === 'ABSEN_PULANG' && !done.includes('ABSEN_MASUK')) {
    throw new Error('Kamu harus Absen Masuk dulu sebelum Absen Pulang.');
  }
}

function evaluateStatusAbsensi_(jenisAbsen, jamAktual, schedule) {
  if (jenisAbsen === 'ABSEN_MASUK') {
    if (!schedule.jamMasuk) return 'TERCATAT'; // jadwal fleksibel (misal manager), tidak ada jam pembanding
    const aktualMenit = timeToMinutes_(jamAktual);
    const jadwalMenit = timeToMinutes_(schedule.jamMasuk) + getToleransiTelatMenit_();

    if (aktualMenit > jadwalMenit) return 'TERLAMBAT';
    return 'TEPAT_WAKTU';
  }

  if (jenisAbsen === 'ABSEN_PULANG') {
    if (!schedule.jamPulang) return 'TERCATAT';
    const aktualMenit = timeToMinutes_(jamAktual);
    const jadwalMenit = timeToMinutes_(schedule.jamPulang);

    if (aktualMenit < jadwalMenit) return 'PULANG_CEPAT';
    return 'SESUAI';
  }

  return 'TERCATAT';
}

/****************************************************
 * FOTO & LAMPIRAN DRIVE
 ****************************************************/

/**
 * Foto profil & foto dasar disimpan di folder Drive TERPISAH.
 * Yang disimpan di sheet cuma ID file-nya (kolom "Foto Profil" / "Foto Dasar").
 */
function driveThumbUrl_(fileId, size) {
  const id = String(fileId || '').trim();
  if (!id) return '';
  return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w' + (size || 400);
}

function monthOfText_(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  // 2026-10-04 10:00:00
  let m = text.match(/(\d{4})-(\d{2})/);
  if (m) return m[1] + '-' + m[2];
  // 04/10/2026 10:00:00 atau 4.10.2026 (hari/bulan/tahun, format Indonesia)
  m = text.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2);
  // format lain yang bisa dibaca Date (mis. objek tanggal dari sheet)
  const d = new Date(text);
  if (!isNaN(d.getTime())) return Utilities.formatDate(d, APP_CONFIG.TIMEZONE, 'yyyy-MM');
  return '';
}

function getOrCreateSubFolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function saveUserPhoto_(type, dataUrl, nama, email, oldId) {
  const folderName = type === 'PROFIL' ? APP_CONFIG.FOTO_PROFIL_FOLDER_NAME : APP_CONFIG.FOTO_DASAR_FOLDER_NAME;
  const folder = getOrCreateFolder_(folderName);
  ensureFolderShared_(folder);
  const parsed = parseDataUrl_(dataUrl);
  const fileName = makeId_([type, nama, email, new Date().getTime()]) + parsed.extension;
  const file = folder.createFile(Utilities.newBlob(parsed.bytes, parsed.contentType, fileName));
  if (oldId) {
    try { DriveApp.getFileById(oldId).setTrashed(true); } catch (e) {}
  }
  return file.getId();
}

/**
 * Simpan / ganti foto profil atau foto dasar milik sendiri (promotor maupun manager).
 * type: 'PROFIL' atau 'DASAR'. Foto dasar bisa diganti kapan saja, tapi wajib ada.
 */
/** Cari akun (promotor/manager) beserta barisnya untuk keperluan foto. */
function findAccountForPhoto_(email) {
  let user = findPromotorByEmail_(email);
  let sheetName = SHEET.PROMOTOR;
  let emailKey = 'email';
  if (!user) {
    user = findManagerByEmail_(email);
    sheetName = SHEET.MANAGER;
    emailKey = 'emailmanager';
  }
  if (!user) throw new Error('Akun tidak ditemukan.');
  const sheet = getSs_().getSheetByName(sheetName);
  const rowObj = getSheetObjectsWithRow_(sheetName).find(r => String(r[emailKey] || '').trim().toLowerCase() === email);
  if (!rowObj) throw new Error('Baris akun tidak ditemukan di sheet.');
  return { user: user, sheet: sheet, rowObj: rowObj };
}

/** Foto dasar yang sudah ada, dikirim sebagai data gambar agar HP bisa membuat sidik wajah tanpa minta ambil ulang. */
function apiGetBaselinePhoto(payload) {
  try {
    const data = payload || {};
    const email = String(data.email || '').trim().toLowerCase();
    if (!email) throw new Error('Email kosong.');
    if (!requireSession_(email, data.token)) return { ok: false, sessionExpired: true, message: 'Sesi login habis.' };

    const acc = findAccountForPhoto_(email);
    const fileId = String(acc.rowObj.fotodasar || '').trim();
    if (!fileId) throw new Error('Foto dasar belum ada.');

    const blob = DriveApp.getFileById(fileId).getBlob();
    const bytes = blob.getBytes();
    if (bytes.length > 900000) throw new Error('Foto dasar terlalu besar.');
    return { ok: true, dataUrl: 'data:' + (blob.getContentType() || 'image/jpeg') + ';base64,' + Utilities.base64Encode(bytes) };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

/** Simpan sidik wajah untuk foto dasar yang sudah ada. Hanya mengisi kalau masih kosong (tidak menimpa yang sudah benar). */
function apiSaveFaceDescriptor(payload) {
  try {
    const data = payload || {};
    const email = String(data.email || '').trim().toLowerCase();
    if (!email) throw new Error('Email kosong.');
    if (!requireSession_(email, data.token)) return { ok: false, sessionExpired: true, message: 'Sesi login habis.' };

    const d = Array.isArray(data.descriptor) ? data.descriptor.map(Number) : [];
    if (!(d.length === 128 && d.every(n => isFinite(n)))) throw new Error('Sidik wajah tidak valid.');

    const acc = findAccountForPhoto_(email);
    if (!String(acc.rowObj.fotodasar || '').trim()) throw new Error('Foto dasar belum ada.');
    const descCol = ensureColumn_(acc.sheet, 'Foto Dasar Desc');
    const current = String(acc.sheet.getRange(acc.rowObj.__rowNumber, descCol, 1, 1).getValues()[0][0] || '').trim();
    if (current) return { ok: true, already: true };

    acc.sheet.getRange(acc.rowObj.__rowNumber, descCol).setValue(JSON.stringify(d.map(n => Math.round(n * 10000) / 10000)));
    bumpCabangVer_(acc.user.cabang, email);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

function apiSaveUserPhoto(payload) {
  try {
    const data = payload || {};
    const email = String(data.email || '').trim().toLowerCase();
    const type = normalizeText_(data.type);
    const photoDataUrl = String(data.photoDataUrl || '');

    if (!email) throw new Error('Email kosong.');
    if (!requireSession_(email, data.token)) throw new Error('Sesi login habis. Silakan login ulang dengan PIN.');
    if (!['PROFIL', 'DASAR'].includes(type)) throw new Error('Jenis foto tidak valid.');
    if (!photoDataUrl) throw new Error('Foto belum diambil.');

    let user = findPromotorByEmail_(email);
    let sheetName = SHEET.PROMOTOR;
    let emailKey = 'email';
    if (!user) {
      user = findManagerByEmail_(email);
      sheetName = SHEET.MANAGER;
      emailKey = 'emailmanager';
    }
    if (!user) throw new Error('Akun tidak ditemukan.');

    const sheet = getSs_().getSheetByName(sheetName);
    const col = ensureColumn_(sheet, type === 'PROFIL' ? 'Foto Profil' : 'Foto Dasar');

    const rowObj = getSheetObjectsWithRow_(sheetName).find(r => String(r[emailKey] || '').trim().toLowerCase() === email);
    if (!rowObj) throw new Error('Baris akun tidak ditemukan di sheet.');

    const oldId = String((type === 'PROFIL' ? rowObj.fotoprofil : rowObj.fotodasar) || '').trim();
    const fileId = saveUserPhoto_(type, photoDataUrl, user.nama, email, oldId);
    sheet.getRange(rowObj.__rowNumber, col).setValue(fileId);

    if (type === 'DASAR') {
      // "Sidik wajah" foto dasar (128 angka, dihitung di HP). Foto baru tanpa sidik wajah -> hapus yang lama.
      const descCol = ensureColumn_(sheet, 'Foto Dasar Desc');
      const d = Array.isArray(data.descriptor) ? data.descriptor.map(Number) : [];
      const valid = d.length === 128 && d.every(n => isFinite(n));
      sheet.getRange(rowObj.__rowNumber, descCol).setValue(valid ? JSON.stringify(d.map(n => Math.round(n * 10000) / 10000)) : '');
    }
    bumpCabangVer_(user.cabang, email);

    return {
      ok: true,
      message: type === 'PROFIL' ? 'Foto profil tersimpan.' : 'Foto dasar tersimpan.',
      type: type,
      url: driveThumbUrl_(fileId, type === 'PROFIL' ? 300 : 500)
    };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

/** Foto absensi: ROOT / yyyy-MM / yyyy-MM-dd supaya rapi & gampang dihapus per bulan. */
function savePhoto_(dataUrl, nama, jenisAbsen, tanggal) {
  const root = getOrCreateFolder_(APP_CONFIG.FOTO_FOLDER_NAME);
  ensureFolderShared_(root);
  const tgl = String(tanggal || '');
  let monthF = folderFromCache_('M_' + tgl.slice(0, 7));
  if (!monthF) monthF = folderRemember_('M_' + tgl.slice(0, 7), getOrCreateSubFolder_(root, tgl.slice(0, 7)), true);
  let folder = folderFromCache_('D_' + tgl);
  if (!folder) folder = folderRemember_('D_' + tgl, getOrCreateSubFolder_(monthF, tgl), false);

  const parsed = parseDataUrl_(dataUrl);
  const safeName = makeId_([
    tanggal,
    nama,
    jenisAbsen,
    new Date().getTime()
  ]);

  const blob = Utilities.newBlob(
    parsed.bytes,
    parsed.contentType,
    safeName + parsed.extension
  );

  const file = folder.createFile(blob);
  return file.getUrl();
}

function saveAttachment_(dataUrl, nama, jenisPengajuan, tanggal, originalFileName) {
  const folder = getOrCreateFolder_(APP_CONFIG.LAMPIRAN_FOLDER_NAME);

  const parsed = parseDataUrl_(dataUrl, originalFileName);
  const safeName = makeId_([
    'LAMPIRAN',
    tanggal,
    nama,
    jenisPengajuan,
    new Date().getTime()
  ]);

  const blob = Utilities.newBlob(
    parsed.bytes,
    parsed.contentType,
    safeName + parsed.extension
  );

  const file = folder.createFile(blob);
  file.setDescription('Lampiran pengajuan ' + jenisPengajuan + ' - ' + nama + ' - ' + tanggal);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file.getUrl();
}

function parseDataUrl_(dataUrl, originalFileName) {
  const matches = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) throw new Error('Format file lampiran tidak valid atau belum selesai diproses.');

  const contentType = matches[1] || 'application/octet-stream';
  const base64 = matches[2];
  const bytes = Utilities.base64Decode(base64);

  let extension = '.file';
  const lowerName = String(originalFileName || '').toLowerCase();

  if (contentType === 'image/jpeg') extension = '.jpg';
  if (contentType === 'image/png') extension = '.png';
  if (contentType === 'image/webp') extension = '.webp';
  if (contentType === 'image/heic' || contentType === 'image/heif') extension = lowerName.endsWith('.heif') ? '.heif' : '.heic';
  if (contentType === 'application/pdf') extension = '.pdf';

  // Fallback jika browser tidak mengirim MIME dengan benar.
  if (extension === '.file' && lowerName) {
    const extMatch = lowerName.match(/\\.([a-z0-9]{2,5})$/);
    if (extMatch) extension = '.' + extMatch[1];
  }

  return {
    contentType,
    bytes,
    extension
  };
}

function folderFromCache_(key) {
  const cache = CacheService.getScriptCache();
  let id = cache.get('FID_' + key);
  if (!id) {
    try { id = PropertiesService.getScriptProperties().getProperty('FID_' + key) || ''; } catch (e) { id = ''; }
    if (id) cache.put('FID_' + key, id, 21600);
  }
  if (!id) return null;
  try {
    const f = DriveApp.getFolderById(id);
    if (!f.isTrashed()) return f;
  } catch (e) {}
  cache.remove('FID_' + key);
  try { PropertiesService.getScriptProperties().deleteProperty('FID_' + key); } catch (e) {}
  return null;
}

function folderRemember_(key, folder, persist) {
  CacheService.getScriptCache().put('FID_' + key, folder.getId(), 21600);
  if (persist) { try { PropertiesService.getScriptProperties().setProperty('FID_' + key, folder.getId()); } catch (e) {} }
  return folder;
}

/** Bagikan folder (lihat saja via link) sekali saja; file di dalamnya ikut, jadi tidak perlu setSharing per file. */
function ensureFolderShared_(folder) {
  const flag = 'SHARED_' + folder.getId();
  try {
    const props = PropertiesService.getScriptProperties();
    if (props.getProperty(flag)) return;
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    props.setProperty(flag, '1');
  } catch (e) {}
}

function getRootFolder_() {
  const cached = folderFromCache_('ROOT');
  if (cached) return cached;
  const it = DriveApp.getFoldersByName(APP_CONFIG.ROOT_FOLDER_NAME);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(APP_CONFIG.ROOT_FOLDER_NAME);
  return folderRemember_('ROOT', folder, true);
}

/**
 * Ambil/buat sub-folder di dalam folder utama "ABSENSI ELS.ID".
 * Kalau folder versi lama masih ada (nama lama), otomatis dipindah ke dalam folder utama
 * beserta isinya (foto/backup yang sudah ada selama ini). ID folder di-cache supaya cepat.
 */
function getOrCreateFolder_(folderName) {
  try {
    const cached = folderFromCache_('SUB_' + folderName);
    if (cached) return cached;

    const root = getRootFolder_();
    let folder = null;
    const existing = root.getFoldersByName(folderName);
    if (existing.hasNext()) {
      folder = existing.next();
    } else {
      const legacyNames = (APP_CONFIG.LEGACY_FOLDER_NAMES || {})[folderName] || [];
      for (let i = 0; i < legacyNames.length && !folder; i++) {
        const old = DriveApp.getFoldersByName(legacyNames[i]);
        if (old.hasNext()) {
          folder = old.next();
          try { folder.moveTo(root); folder.setName(folderName); } catch (moveErr) {}
        }
      }
      if (!folder) folder = root.createFolder(folderName);
    }
    return folderRemember_('SUB_' + folderName, folder, true);
  } catch (err) {
    throw new Error(
      'Akses Google Drive belum aktif untuk menyimpan foto/lampiran. ' +
      'Buka Apps Script dari akun owner, jalankan menu ELS Absensi > 0. Izinkan Akses Drive, ' +
      'setujui permission Google, lalu deploy ulang New version. Detail: ' + err.message
    );
  }
}

/** Menu: rapikan semua folder lama ke dalam satu folder utama ABSENSI ELS.ID. */
function rapikanFolderDrive() {
  const names = [
    APP_CONFIG.FOTO_FOLDER_NAME, APP_CONFIG.FOTO_PROFIL_FOLDER_NAME, APP_CONFIG.FOTO_DASAR_FOLDER_NAME,
    APP_CONFIG.LAMPIRAN_FOLDER_NAME, APP_CONFIG.EXPORT_FOLDER_NAME, APP_CONFIG.BACKUP_FOLDER_NAME,
    APP_CONFIG.REKAP_FOLDER_NAME
  ];
  names.forEach(n => getOrCreateFolder_(n));
  const root = getRootFolder_();
  const msg = 'Selesai. Semua folder sekarang ada di dalam: ' + root.getName() + '\n' + root.getUrl();
  Logger.log(msg);
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) {}
  return { ok: true, message: msg, url: root.getUrl() };
}


/****************************************************
 * INFO PERUSAHAAN
 ****************************************************/

function ensureCompanyInfoSheet_() {
  const ss = getSs_();
  let sheet = ss.getSheetByName(SHEET.INFO);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET.INFO);
  }

  const headers = [
    'ID Info',
    'Timestamp',
    'Email Manager',
    'Nama Manager',
    'Cabang Target',
    'Brand Target',
    'Judul',
    'Isi',
    'Tanggal Mulai',
    'Tanggal Selesai',
    'Status'
  ];

  const current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getDisplayValues()[0];
  const hasHeader = current.some(cell => String(cell || '').trim() !== '');
  if (!hasHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }

  return sheet;
}

function getAllCompanyInfo_() {
  ensureCompanyInfoSheet_();

  const rows = getSheetObjects_(SHEET.INFO);
  return rows
    .filter(item => normalizeText_(item.status || 'AKTIF') !== 'NONAKTIF')
    .map(item => ({
      id: item.idinfo || '',
      timestamp: item.timestamp || '',
      emailManager: String(item.emailmanager || '').trim().toLowerCase(),
      namaManager: item.namamanager || '',
      cabangTarget: normalizeText_(item.cabangtarget || 'ALL') || 'ALL',
      brandTarget: normalizeText_(item.brandtarget || 'ALL') || 'ALL',
      judul: item.judul || '',
      isi: item.isi || '',
      tanggalMulai: normalizeDateString_(item.tanggalmulai),
      tanggalSelesai: normalizeDateString_(item.tanggalselesai),
      status: normalizeText_(item.status || 'AKTIF') || 'AKTIF'
    }))
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
}

function getActiveCompanyInfo_(promotor) {
  const today = getToday_();
  const brand = normalizeText_(promotor && promotor.brand);
  const cabang = normalizeText_(promotor && promotor.cabang);

  return getAllCompanyInfo_()
    .filter(item => item.status === 'AKTIF')
    .filter(item => isDateBetween_(today, item.tanggalMulai, item.tanggalSelesai || item.tanggalMulai))
    .filter(item => item.brandTarget === 'ALL' || item.brandTarget === brand)
    .filter(item => item.cabangTarget === 'ALL' || item.cabangTarget === cabang)
    .slice(0, 5);
}


/****************************************************
 * HELPER SHEET
 ****************************************************/

function getSs_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function setHeader_(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}


function ensureColumn_(sheet, headerName) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(normalizeHeader_);
  const key = normalizeHeader_(headerName);
  if (headers.indexOf(key) >= 0) return headers.indexOf(key) + 1;

  const newCol = lastCol + 1;
  sheet.getRange(1, newCol).setValue(headerName);
  sheet.autoResizeColumn(newCol);
  return newCol;
}

/** Baca hanya N baris terakhir sheet (data baru ada di bawah) - jauh lebih cepat untuk sheet yang terus bertambah. */
function getSheetObjectsTail_(sheetName, maxRows) {
  const sheet = getSs_().getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' tidak ditemukan.');
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  // Judul kolom jarang berubah: disimpan 10 menit (diabaikan otomatis kalau jumlah kolom berubah) -> hemat 1 baca sheet.
  let headers = null;
  const hdrKey = 'HDR_' + sheetName;
  try {
    const hit = CacheService.getScriptCache().get(hdrKey);
    if (hit) { const arr = JSON.parse(hit); if (arr.length === lastCol) headers = arr; }
  } catch (e) {}
  if (!headers) {
    headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(normalizeHeader_);
    try { CacheService.getScriptCache().put(hdrKey, JSON.stringify(headers), 600); } catch (e) {}
  }
  const startRow = Math.max(2, lastRow - maxRows + 1);
  const values = sheet.getRange(startRow, 1, lastRow - startRow + 1, lastCol).getDisplayValues();
  return values
    .filter(row => row.some(cell => String(cell || '').trim() !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((header, i) => { obj[header] = row[i]; });
      return obj;
    });
}

let __READ_MEMO__ = null; // hidup hanya selama satu panggilan API baca (tiap eksekusi Apps Script memulai ulang)

// Hanya sheet kecil yang tidak ditulis di tengah alur baca (login / muat data awal / dashboard manager).
function memoSheet_(name) {
  return name === SHEET.PROMOTOR || name === SHEET.MANAGER || name === SHEET.LOKASI ||
    name === SHEET.INFO || name === SHEET.IZIN || name === SHEET.KOREKSI;
}

function withReadMemo_(fn) {
  const prev = __READ_MEMO__;
  __READ_MEMO__ = prev || {};
  try { return fn(); } finally { __READ_MEMO__ = prev; }
}

// Data mentah sheet. Dalam lingkup withReadMemo_, sheet kecil dibaca sekali lalu dipakai bersama oleh semua pembaca.
// Pembaca selalu membuat objek baru dari data ini (tidak mengubahnya), jadi aman dibagi.
function readSheetValues_(sheetName) {
  const memo = __READ_MEMO__ && memoSheet_(sheetName);
  if (memo && __READ_MEMO__['v:' + sheetName]) return __READ_MEMO__['v:' + sheetName];
  const ss = getSs_();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' tidak ditemukan.');
  const values = sheet.getDataRange().getDisplayValues();
  if (memo) __READ_MEMO__['v:' + sheetName] = values;
  return values;
}

function getSheetObjects_(sheetName) {
  return readSheetObjects_(sheetName);
}

function readSheetObjects_(sheetName) {
  const values = readSheetValues_(sheetName);
  if (values.length < 2) return [];

  const headers = values[0].map(normalizeHeader_);

  return values.slice(1)
    .filter(row => row.some(cell => String(cell || '').trim() !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i];
      });
      return obj;
    });
}

function getSheetObjectsWithRow_(sheetName) {
  return readSheetObjectsWithRow_(sheetName);
}

function readSheetObjectsWithRow_(sheetName) {
  const values = readSheetValues_(sheetName);
  if (values.length < 2) return [];

  const headers = values[0].map(normalizeHeader_);

  return values.slice(1)
    .map((row, idx) => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i];
      });
      obj.__rowNumber = idx + 2;
      return obj;
    })
    .filter(obj => Object.keys(obj).some(key => key !== '__rowNumber' && String(obj[key] || '').trim() !== ''));
}

/****************************************************
 * HELPER UMUM
 ****************************************************/

function normalizeHeader_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/_/g, '')
    .trim();
}

function normalizeText_(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function normalizeShift_(value) {
  const shift = normalizeText_(value).replace(/\s+/g, '');
  if (!shift) return '';
  if (shift === 'MIDLE') return 'MIDDLE';
  return shift;
}

function makePromotorKey_(nama, brand) {
  return normalizeText_(nama) + '|' + normalizeText_(brand);
}

function normalizeLooseName_(value) {
  return normalizeText_(value)
    .replace(/[^A-Z0-9]/g, '')
    .replace(/(.)\1+/g, '$1');
}

function makePromotorLooseKey_(nama, brand) {
  return normalizeLooseName_(nama) + '|' + normalizeText_(brand);
}

function makeId_(parts) {
  return parts
    .join('-')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatJam_(value) {
  const text = String(value || '').trim();
  if (!text) return '';

  const parts = text.split(':');
  if (parts.length >= 2) {
    const h = String(Number(parts[0])).padStart(2, '0');
    const m = String(Number(parts[1])).padStart(2, '0');
    return h + ':' + m;
  }

  return text;
}

function getToday_() {
  return Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

function normalizeDateString_(value) {
  const text = String(value || '').trim();
  if (!text) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const d = new Date(text);
  if (!isNaN(d.getTime())) {
    return Utilities.formatDate(d, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
  }

  return text;
}

function timeToMinutes_(timeText) {
  const text = formatJam_(timeText);
  const parts = text.split(':');
  if (parts.length < 2) return 0;

  return Number(parts[0]) * 60 + Number(parts[1]);
}

function parseCoordinate_(value) {
  let text = String(value || '').trim();

  if (!text) return 0;

  text = text.replace(',', '.');

  const dotCount = (text.match(/\./g) || []).length;
  if (dotCount > 1) {
    const firstDot = text.indexOf('.');
    text =
      text.slice(0, firstDot + 1) +
      text.slice(firstDot + 1).replace(/\./g, '');
  }

  return Number(text);
}

function calculateDistanceMeter_(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function getMonthIndex_(bulan) {
  const key = normalizeText_(bulan);
  const map = {
    'JANUARI': 0,
    'JANUARY': 0,
    'FEBRUARI': 1,
    'FEBRUARY': 1,
    'MARET': 2,
    'MARCH': 2,
    'APRIL': 3,
    'MEI': 4,
    'MAY': 4,
    'JUNI': 5,
    'JUNE': 5,
    'JULI': 6,
    'JULY': 6,
    'AGUSTUS': 7,
    'AUGUST': 7,
    'SEPTEMBER': 8,
    'OKTOBER': 9,
    'OCTOBER': 9,
    'NOVEMBER': 10,
    'DESEMBER': 11,
    'DECEMBER': 11
  };

  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
}

function getHariIndonesia_(dateObj) {
  const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
  return days[dateObj.getDay()];
}
