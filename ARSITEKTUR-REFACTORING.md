# Rencana Refactoring Arsitektur — SIDAMON (Gaharu Sempana Group)

> Tujuan: memecah `src/App.jsx` (±11.300 baris) menjadi struktur **feature-based clean architecture**,
> tetap 100% JSX (tanpa TypeScript, tanpa framework baru), tetap Vite + Firebase seperti sekarang.
> Refactoring ini **tidak mengubah perilaku aplikasi** — hanya memindahkan kode ke tempat yang tepat.

---

## 1. Masalah Saat Ini

- Hampir seluruh aplikasi (UI, state, akses Firebase, export Excel, print, modal) ada di **satu file** `App.jsx`.
- 76+ `useState`, 32+ fungsi `render...`, semuanya saling berbagi scope → sulit dites, sulit dibaca, rawan konflik saat kerja tim (semua orang edit file yang sama).
- Komponen `Icon` terduplikasi persis di `App.jsx` dan `Login.jsx`.
- Query Firebase (`db.ref('pmc_...')`) tersebar di banyak tempat, tercampur dengan logika UI.
- Tidak ada pemisahan antara **data access**, **business rule (RBAC)**, dan **presentasi**.

## 2. Prinsip Arsitektur yang Dipakai

1. **Feature-based, bukan layer-based murni** — setiap modul bisnis (Proyek, Tim, Inventaris, dst.) punya foldernya sendiri, isinya lengkap (halaman + sub-komponen + modal khusus modul itu).
2. **Service layer memisahkan akses Firebase dari UI** — komponen tidak lagi manggil `db.ref(...)` langsung, tapi lewat fungsi di `services/`.
3. **Shared layer** untuk apa pun yang dipakai ≥2 modul (Icon, tombol sidebar, sistem modal generik, hook umum).
4. **Auth & RBAC terpisah dari UI** — matrix permission jadi data (`permissions.js`), bukan menyatu di tiap komponen.
5. **`App.jsx` menyusut jadi "shell"** — cuma layout, routing tab, dan pemasangan context. Idealnya < 300 baris.

---

## 3. Struktur Folder Baru (Target)

```
src/
├── main.jsx
├── App.jsx                        ⭐ shell tipis: layout + switch antar-feature saja
├── index.css
│
├── app/
│   ├── AppShell.jsx                 (sidebar, topbar, bottom-nav, wrapper layout)
│   ├── AppRoutes.jsx                (peta activeTab -> komponen feature)
│   └── ModalProvider.jsx            (pengganti modalConfig state + switch renderModal)
│
├── auth/
│   ├── AuthContext.jsx              (pindah apa adanya dari src/AuthContext.jsx)
│   ├── Login.jsx
│   ├── useAuth.js                   (re-export useContext biar rapi importnya)
│   └── permissions.js               (matrix RBAC: canAccessMenu, canEditXxx — data only)
│
├── shared/
│   ├── components/
│   │   ├── Icon.jsx                 (satu-satunya sistem ikon, dipakai semua modul)
│   │   ├── SidebarItem.jsx
│   │   ├── MobileMenuItem.jsx
│   │   ├── BottomNavItem.jsx
│   │   ├── MetricCard.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── TeamCheckboxGroup.jsx
│   │   └── TeamVisionaryMultiSelect.jsx
│   ├── modals/
│   │   ├── AlertModal.jsx
│   │   ├── ConfirmModal.jsx         (dari renderFuturisticConfirm)
│   │   ├── PendingModal.jsx
│   │   ├── ResumeModal.jsx
│   │   └── DominoModal.jsx
│   ├── hooks/
│   │   ├── useFirebaseList.js       (generic: subscribe 1 node db -> {data, loading, error})
│   │   └── useInactivityLogout.js   (dipindah dari AuthContext, jadi reusable/testable)
│   └── utils/
│       ├── excelExport.js           (logika xlsx-js-style yang sekarang nempel di render*)
│       ├── dateHelpers.js
│       └── printHelpers.js          (renderPrintExecutiveReport, renderPrintTimeSchedule, dll)
│
├── services/                       ⭐ SATU-SATUNYA tempat yang boleh panggil db.ref()
│   ├── firebase.js                   (init, sama seperti sekarang)
│   ├── logService.js                 (logActivity)
│   ├── projectService.js             (CRUD node pmc_data)
│   ├── teamService.js
│   ├── expertService.js              (pmc_experts, pmc_cert_list)
│   ├── inventoryService.js           (pmc_inventory)
│   ├── lpseService.js                (pmc_lpse_list, pmc_assignments)
│   ├── userService.js                (pmc_users, pmc_role_list)
│   └── sopService.js                 (pmc_sops)
│
└── features/                       ⭐ satu folder = satu modul bisnis
    ├── dashboard/
    │   └── DashboardPage.jsx          (dari renderDashboard)
    ├── proyek/
    │   ├── ProyekPage.jsx              (renderProyek)
    │   ├── ProjectPrintCard.jsx
    │   ├── PrintExecutiveReport.jsx
    │   └── PrintZoomProjectModal.jsx
    ├── tim/
    │   ├── TimPage.jsx                 (renderTim)
    │   └── SubTeamProgress.jsx
    ├── jadwal/
    │   ├── GanttPage.jsx               (renderGantt)
    │   ├── TimeSchedulePage.jsx
    │   ├── MasterSchedulePage.jsx
    │   └── PrintTimeSchedule.jsx
    ├── tenaga-ahli/
    │   ├── TenagaAhliPage.jsx
    │   └── CertManagerModal.jsx
    ├── penugasan/                     (LPSE)
    │   ├── PenugasanPage.jsx
    │   └── LpseManagerModal.jsx
    ├── inventaris/
    │   ├── InventoryPage.jsx
    │   └── AdminAsetPage.jsx
    ├── kpi/
    │   ├── KPIPage.jsx
    │   └── KPIInfoModal.jsx
    ├── timesheet/
    │   ├── TimesheetPage.jsx
    │   └── LogbookPage.jsx
    ├── pengguna/                      (manajemen user & role)
    │   ├── ManajemenPenggunaPage.jsx
    │   └── RoleManagerModal.jsx
    └── sop/
        └── SOPPage.jsx
```

Kalau nanti satu feature makin gemuk (misal `proyek/` mulai ratusan baris lagi), tinggal tambah
subfolder `components/` dan `hooks/` **di dalam** folder feature itu sendiri — pola ini scalable
tanpa perlu ubah struktur besar lagi.

---

## 4. Penjelasan Tiap Layer

| Layer | Isi | Boleh import dari | Contoh aturan |
|---|---|---|---|
| `services/` | Fungsi CRUD ke Firebase | `firebase.js` saja | `projectService.getAll(cb)`, `projectService.create(data)` — **tidak tahu apa-apa soal React/UI** |
| `auth/` | Login, context user, matrix izin | `services/` | Komponen manapun tanya `useAuth()` untuk tahu role & izin |
| `shared/` | Komponen & hook generik, tidak spesifik 1 modul bisnis | `services/` (jarang) | `<Icon name="briefcase" />`, `useFirebaseList('pmc_data')` |
| `features/` | Halaman & komponen 1 modul bisnis | `shared/`, `services/`, `auth/` | `ProyekPage.jsx` boleh pakai `projectService` + `<MetricCard/>`, **tidak boleh** diimport modul lain |
| `app/` | Perakit semua feature jadi satu aplikasi | semua di atas | `AppShell.jsx` render sidebar + `AppRoutes` sesuai `activeTab` |

Aturan sederhana biar tidak "spaghetti" lagi: **panah import hanya boleh mengarah ke bawah**
(`app` → `features` → `shared`/`auth` → `services`), tidak pernah sebaliknya, dan antar-folder
di `features/` **tidak saling import**.

---

## 5. Pemetaan Kode Lama → Baru

| Fungsi/komponen di `App.jsx` sekarang | Pindah ke |
|---|---|
| `renderDashboard` | `features/dashboard/DashboardPage.jsx` |
| `renderProyek`, `renderProjectPrintCard`, `renderPrintExecutiveReport`, `renderPrintZoomProjectModal` | `features/proyek/*` |
| `renderTim`, `renderSubTeamProgress` | `features/tim/*` |
| `renderGantt`, `renderTimeSchedule`, `renderMasterSchedule`, `renderPrintTimeSchedule` | `features/jadwal/*` |
| `renderTenagaAhli`, `renderCertManagerModal` | `features/tenaga-ahli/*` |
| `renderPenugasan`, `renderLpseManagerModal` | `features/penugasan/*` |
| `renderInventory`, `renderAdminAset` | `features/inventaris/*` |
| `renderKPI`, `renderKPIInfoModal` | `features/kpi/*` |
| `renderTimesheet`, `renderLogbook` | `features/timesheet/*` |
| `renderManajemenPengguna`, `renderRoleManagerModal` | `features/pengguna/*` |
| `renderSOP` | `features/sop/SOPPage.jsx` |
| `renderAlertModal`, `renderFuturisticConfirm`, `renderPendingModal`, `renderResumeModal`, `renderDominoModal`, `renderDeveloperPromptModal` | `shared/modals/*` |
| `Icon`, `SidebarItem`, `MobileMenuItem`, `BottomNavItem`, `MetricCard`, `StatusBadge`, `TeamCheckboxGroup`, `TeamVisionaryMultiSelect` | `shared/components/*` |
| Semua `db.ref('pmc_xxx')` | `services/xxxService.js` sesuai domainnya (lihat tabel node di bawah) |
| `canAccessMenu`, `canCreateProject`, dst (isi logikanya, bukan context-nya) | `auth/permissions.js` |

Node Firebase → service:

| Node di Realtime DB | Service |
|---|---|
| `pmc_data` | `projectService.js` |
| `pmc_experts`, `pmc_cert_list` | `expertService.js` |
| `pmc_assignments`, `pmc_lpse_list` | `lpseService.js` |
| `pmc_inventory` | `inventoryService.js` |
| `pmc_users`, `pmc_role_list` | `userService.js` |
| `pmc_sops` | `sopService.js` |
| `pmc_logs` | `logService.js` |

---

## 6. Contoh Konkret: Migrasi Modul "Proyek"

**Sebelum** (di dalam `App.jsx`, tercampur dengan state global & fungsi lain):

```jsx
// di dalam function App() { ... }
const [projects, setProjects] = useState([]);
useEffect(() => {
  const ref = db.ref('pmc_data');
  ref.on('value', snap => setProjects(Object.values(snap.val() || {})));
  return () => ref.off();
}, []);

const renderProyek = () => (
  <div>{/* ratusan baris JSX proyek di sini */}</div>
);
```

**Sesudah:**

```js
// src/services/projectService.js
import { db } from './firebase';

export const subscribeProjects = (callback) => {
  const ref = db.ref('pmc_data');
  ref.on('value', snap => callback(Object.values(snap.val() || {})));
  return () => ref.off();
};

export const createProject = (data) => db.ref('pmc_data').push(data);
export const updateProject = (id, data) => db.ref(`pmc_data/${id}`).update(data);
export const deleteProject = (id) => db.ref(`pmc_data/${id}`).remove();
```

```jsx
// src/features/proyek/ProyekPage.jsx
import { useState, useEffect } from 'react';
import { subscribeProjects } from '../../services/projectService';
import { useAuth } from '../../auth/useAuth';
import MetricCard from '../../shared/components/MetricCard';

export default function ProyekPage() {
  const [projects, setProjects] = useState([]);
  const { canCreateProject } = useAuth();

  useEffect(() => subscribeProjects(setProjects), []);

  return (
    <div>{/* JSX proyek — sama persis kontennya, cuma pindah rumah */}</div>
  );
}
```

```jsx
// src/app/AppRoutes.jsx
import ProyekPage from '../features/proyek/ProyekPage';
import DashboardPage from '../features/dashboard/DashboardPage';
// ...import feature lain

export default function AppRoutes({ activeTab }) {
  switch (activeTab) {
    case 'proyek': return <ProyekPage />;
    case 'dashboard': return <DashboardPage />;
    // ...
    default: return <DashboardPage />;
  }
}
```

`App.jsx` sesudah refactor tinggal jadi shell:

```jsx
// src/App.jsx
import { useAuth } from './auth/useAuth';
import Login from './auth/Login';
import AppShell from './app/AppShell';

export default function App() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Login />;
  return <AppShell />;
}
```

---

## 7. Strategi Migrasi Bertahap (Wajib Bertahap, Jangan Big-Bang)

Karena tidak ada automated test sama sekali di project ini, refactor **harus** dilakukan
sedikit-sedikit dengan verifikasi manual tiap langkah, supaya kalau ada yang rusak gampang dilacak.

1. **Siapkan jaring pengaman**
   - Buat branch baru: `git checkout -b refactor/clean-architecture`.
   - Commit kecil-kecil, satu modul = satu commit/PR.
2. **Langkah 1 — Pindahkan komponen "daun" (tanpa state, tanpa efek samping) dulu**
   `Icon`, `StatusBadge`, `MetricCard`, `SidebarItem`, dst → `shared/components/`.
   Risiko rendah karena murni presentational, tinggal ganti import di `App.jsx`.
3. **Langkah 2 — Buat `services/`**
   Bungkus tiap `db.ref('pmc_xxx')` jadi fungsi di service terkait, lalu panggil fungsi itu
   dari `App.jsx` (belum pindah UI-nya). Test: pastikan data masih muncul sama seperti sebelumnya.
4. **Langkah 3 — Ekstrak sistem modal generik**
   Ganti `modalConfig` + switch besar jadi `shared/modals/*` + `ModalProvider`.
5. **Langkah 4 — Ekstrak `auth/permissions.js`**
   Pindahkan isi `canAccessMenu` dkk dari `AuthContext.jsx` jadi objek/fungsi murni di
   `permissions.js`, lalu `AuthContext.jsx` tinggal import dan pakai.
6. **Langkah 5 — Migrasi feature satu per satu, mulai dari yang paling kecil/mandiri**
   Urutan disarankan (dari kecil→besar berdasarkan kompleksitas):
   `sop` → `kpi` → `tenaga-ahli` → `inventaris` → `tim` → `penugasan` → `timesheet` →
   `pengguna` → `jadwal` → `proyek` → `dashboard` (dashboard terakhir karena biasanya
   menampilkan ringkasan dari semua modul lain).
   Tiap modul: pindah JSX + state lokal + service call → jalankan `npm run dev` →
   cek manual semua tombol/CRUD di modul itu → commit.
7. **Langkah 6 — `App.jsx` jadi shell**
   Setelah semua feature pindah, yang tersisa di `App.jsx` cuma layout + `activeTab` state
   + pemasangan `AppShell`/`AppRoutes`.
8. **Langkah 7 — Bersih-bersih project (lihat §9)**

> Estimasi: kalau dikerjakan sendiri sambil tetap jalan fitur lain, realistis 1 modul per sesi kerja.
> Jangan coba refactor semua modul dalam satu commit besar — kalau ada bug lebih sulit dicari.

---

## 8. Konvensi Penamaan & Standar Kode

- **Komponen**: PascalCase, satu komponen utama per file (`ProyekPage.jsx`, bukan `proyek.jsx`).
- **Service/hook/util**: camelCase (`projectService.js`, `useFirebaseList.js`).
- **Halaman utama tiap feature** diakhiri `Page.jsx` (`DashboardPage.jsx`) supaya gampang dibedakan
  dari sub-komponennya.
- **Satu file = satu tanggung jawab**: kalau sebuah `Page.jsx` mulai >400–500 baris, pecah bagian
  JSX berulang jadi sub-komponen di folder `components/` milik feature itu.
- **Tidak ada lagi akses `db.ref()` langsung di komponen** — selalu lewat `services/`. Ini aturan
  paling penting supaya logika Firebase tidak tersebar lagi.
- Hindari duplikasi seperti `Icon` yang sekarang ada 2 kali (`App.jsx` & `Login.jsx`) — sekali
  dipindah ke `shared/components/Icon.jsx`, import dari situ di semua tempat.

---

## 9. Rekomendasi Tambahan (Opsional, Kerjakan Setelah Refactor Utama Selesai)

- **Pindahkan `workflows/deploy.yml` ke `.github/workflows/deploy.yml`** — saat ini GitHub Actions
  tidak pernah jalan karena lokasinya salah.
- **Hapus `App.jsx` duplikat di root** (yang di `src/` adalah sumber kebenaran).
- **Putuskan status folder `assets/`, `index.html`, `404.html` di root** — apakah itu hasil build
  yang sengaja di-commit untuk GitHub Pages manual, atau sisa lama yang harus di-`.gitignore`-kan
  dan digantikan proses build otomatis lewat Actions.
- **Buat `main.js`** kalau mode Electron (`npm start`) memang masih mau dipakai — saat ini file itu
  direferensikan di `package.json` tapi tidak ada.
- Setelah struktur rapi, migrasi ke **React Router** (`react-router-dom`) untuk ganti pola
  `activeTab` string jadi URL asli (`/proyek`, `/tim`, dst.) — lebih natural untuk deep-link &
  tombol back browser. Ini perubahan terpisah, jangan digabung dengan refactor struktur folder.

---

## 10. Checklist Migrasi

- [ ] Branch `refactor/clean-architecture` dibuat
- [ ] `shared/components/*` dipindah & `App.jsx`/`Login.jsx` pakai `Icon` yang sama
- [ ] `services/*.js` dibuat, semua `db.ref()` dibungkus
- [ ] `shared/modals/*` + `ModalProvider` menggantikan `modalConfig` switch
- [ ] `auth/permissions.js` diekstrak dari `AuthContext.jsx`
- [ ] Modul: `sop`
- [ ] Modul: `kpi`
- [ ] Modul: `tenaga-ahli`
- [ ] Modul: `inventaris`
- [ ] Modul: `tim`
- [ ] Modul: `penugasan`
- [ ] Modul: `timesheet`
- [ ] Modul: `pengguna`
- [ ] Modul: `jadwal`
- [ ] Modul: `proyek`
- [ ] Modul: `dashboard`
- [ ] `App.jsx` jadi shell < 300 baris
- [ ] `workflows/deploy.yml` dipindah ke `.github/workflows/`
- [ ] `App.jsx` duplikat di root dihapus