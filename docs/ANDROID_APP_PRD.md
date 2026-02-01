# PRD: EmasPOS Mobile - Aplikasi Android Pegawai

## Dokumen Spesifikasi Produk
**Versi:** 1.0
**Tanggal:** 1 Februari 2026
**Status:** Draft - Menunggu Review

---

## 1. Ringkasan Eksekutif

### 1.1 Latar Belakang
EmasPOS adalah sistem manajemen toko emas desktop yang sudah berjalan dengan fitur POS, inventaris, dan sinkronisasi Salesforce. Untuk meningkatkan produktivitas dan monitoring pegawai, diperlukan aplikasi mobile Android yang terintegrasi dengan sistem existing.

### 1.2 Tujuan Aplikasi
- **Tracking Produktivitas**: Monitor aktivitas dan kinerja pegawai secara real-time
- **Absensi Digital**: Clock in/out dengan verifikasi lokasi GPS
- **Transparansi Kinerja**: Pegawai dapat melihat performa sendiri
- **Monitoring Owner**: Pemilik dapat memantau semua cabang dari mana saja

### 1.3 Target Pengguna
| Role | Deskripsi | Akses |
|------|-----------|-------|
| **Owner** | Pemilik toko, bisa multi-cabang | Full monitoring semua cabang |
| **Kasir** | Pegawai di cabang | Absensi + lihat kinerja sendiri |

---

## 2. Arsitektur Sistem

### 2.1 Stack Teknologi

```
┌─────────────────────────────────────────────────────┐
│              Flutter Mobile App                      │
│         (Dart, Material Design 3)                   │
├─────────────────────────────────────────────────────┤
│                State Management                      │
│          (Riverpod / Bloc + Freezed)                │
├─────────────────────────────────────────────────────┤
│              Salesforce REST API                     │
│         (OAuth 2.0 Authentication)                  │
├─────────────────────────────────────────────────────┤
│            Salesforce Cloud                          │
│    (Custom Objects + Standard Objects)              │
└─────────────────────────────────────────────────────┘
```

### 2.2 Teknologi yang Digunakan

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| **Framework** | Flutter 3.x | Cross-platform, UI konsisten, performa bagus |
| **Bahasa** | Dart | Type-safe, async/await native |
| **State Management** | Riverpod 2.x | Reactive, testable, compile-safe |
| **HTTP Client** | Dio | Interceptors, retry logic, logging |
| **Local Storage** | Hive / Isar | NoSQL lokal untuk cache & offline |
| **Lokasi** | Geolocator | GPS tracking dengan battery optimization |
| **Auth** | Flutter Secure Storage | Simpan token dengan aman |
| **Push Notification** | Firebase Cloud Messaging | Notifikasi real-time |

### 2.3 Project Structure

```
/home/melvin/
├── SGM-SYS/                    # Desktop app (Tauri + React + Rust)
│   ├── src/                    # React frontend
│   ├── src-tauri/              # Rust backend
│   └── docs/                   # Documentation (PRD ini)
│
└── emas-pos-mobile/            # Mobile app (Flutter)
    ├── lib/                    # Dart source code
    ├── android/                # Android native
    └── ios/                    # iOS (future)
```

### 2.4 Integrasi Salesforce

Aplikasi akan terhubung ke Salesforce yang sama dengan sistem desktop EmasPOS:

```
EmasPOS Desktop ──┐
                  ├──► Salesforce Cloud ◄── EmasPOS Mobile
Other Branches ───┘
```

**Custom Objects Baru di Salesforce:**

| Object | Deskripsi |
|--------|-----------|
| `Attendance__c` | Record absensi (clock in/out, lokasi, foto) |
| `Daily_Target__c` | Target harian per pegawai |
| `Performance_Log__c` | Log aktivitas dan achievement |

---

## 3. Fitur Detail

### 3.1 Modul Autentikasi

#### 3.1.1 Login
- Login dengan username & password (sama dengan desktop)
- Remember me option
- Biometric login (fingerprint/face) setelah login pertama
- Auto-logout setelah inaktif 30 menit

#### 3.1.2 Session Management
- JWT token dari Salesforce OAuth
- Refresh token otomatis
- Multi-device detection (opsional)

**Wireframe Login:**
```
┌────────────────────────────┐
│         EmasPOS            │
│        [Logo Toko]         │
│                            │
│  ┌──────────────────────┐  │
│  │ Username             │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │ Password          👁  │  │
│  └──────────────────────┘  │
│                            │
│  ☑ Ingat Saya              │
│                            │
│  ┌──────────────────────┐  │
│  │       MASUK          │  │
│  └──────────────────────┘  │
│                            │
│  Gunakan Sidik Jari? 👆    │
└────────────────────────────┘
```

---

### 3.2 Modul Absensi (Attendance)

#### 3.2.1 Clock In
- Verifikasi lokasi GPS (radius dari toko)
- Capture foto selfie (anti-fraud)
- Timestamp otomatis
- Status: On-time / Terlambat (berdasarkan jadwal)

#### 3.2.2 Clock Out
- Verifikasi lokasi GPS
- Capture foto (opsional)
- Hitung total jam kerja
- Overtime detection

#### 3.2.3 Riwayat Absensi
- Calendar view bulanan
- Detail per hari (jam masuk, keluar, durasi)
- Summary: total hari kerja, terlambat, izin

**Wireframe Absensi:**
```
┌────────────────────────────┐
│ ◄  Absensi      📍 Cabang A│
├────────────────────────────┤
│                            │
│    ┌──────────────────┐    │
│    │   09:15 WIB      │    │
│    │   Senin, 1 Feb   │    │
│    └──────────────────┘    │
│                            │
│    📍 Lokasi Terdeteksi    │
│    Toko Emas Cabang A      │
│    ✓ Dalam radius 50m      │
│                            │
│    ┌──────────────────┐    │
│    │  📸 CLOCK IN     │    │
│    │  [Ambil Selfie]  │    │
│    └──────────────────┘    │
│                            │
│ ─────────────────────────  │
│ Riwayat Hari Ini:          │
│ • Clock In: 09:15 (Late)   │
│ • Clock Out: -             │
└────────────────────────────┘
```

#### 3.2.4 Skema Database Attendance__c

```yaml
Attendance__c:
  Id: string (auto)
  User__c: lookup(User)
  Branch__c: lookup(Branch__c)
  Date__c: date
  Clock_In_Time__c: datetime
  Clock_Out_Time__c: datetime
  Clock_In_Location__c: geolocation
  Clock_Out_Location__c: geolocation
  Clock_In_Photo__c: url (Salesforce Files)
  Clock_Out_Photo__c: url
  Status__c: picklist (Present, Late, Absent, Leave)
  Total_Hours__c: number (formula)
  Overtime_Hours__c: number
  Notes__c: text
  Device_Info__c: text
  CreatedDate: datetime (auto)
```

---

### 3.3 Modul Kinerja Pegawai (Self-View)

#### 3.3.1 Dashboard Pegawai
- Total transaksi hari ini
- Total nilai penjualan
- Perbandingan dengan target
- Grafik mingguan/bulanan

#### 3.3.2 Riwayat Transaksi
- List transaksi yang dilakukan pegawai
- Filter by tanggal, tipe (sale/buyback/exchange)
- Detail per transaksi

#### 3.3.3 Achievement & Badge
- Milestone badges (10 transaksi, 100 transaksi, dll)
- Monthly top performer
- Streak attendance

**Wireframe Dashboard Pegawai:**
```
┌────────────────────────────┐
│ ☰  Dashboard        👤 Ani │
├────────────────────────────┤
│                            │
│  Hari Ini (1 Feb 2026)     │
│  ┌────────┐ ┌────────┐     │
│  │  12    │ │ 45.5jt │     │
│  │Transaksi│ │Penjualan│    │
│  └────────┘ └────────┘     │
│                            │
│  Target Harian: 50jt       │
│  ████████████░░░░ 91%      │
│                            │
│  ┌────────────────────────┐│
│  │ 📈 Grafik Mingguan     ││
│  │    ▂▄▆█▄▆▇             ││
│  │   Sen-Min              ││
│  └────────────────────────┘│
│                            │
│  🏆 Achievement            │
│  ┌────┐ ┌────┐ ┌────┐     │
│  │ 🥇 │ │ 🔥 │ │ ⭐ │     │
│  │Top │ │7Day│ │100T│     │
│  └────┘ └────┘ └────┘     │
└────────────────────────────┘
```

---

### 3.4 Modul Monitoring Owner

#### 3.4.1 Overview Semua Cabang
- Card per cabang dengan status
- Total pegawai hadir / tidak hadir
- Total penjualan hari ini
- Alert jika ada anomali

#### 3.4.2 Detail Per Cabang
- List pegawai dengan status absensi
- Transaksi per pegawai
- Perbandingan performa

#### 3.4.3 Detail Per Pegawai
- Profil lengkap
- Statistik absensi (% kehadiran, rata-rata jam kerja)
- Statistik transaksi (volume, nilai, rata-rata per hari)
- Trend kinerja (naik/turun)

#### 3.4.4 Laporan
- Export laporan absensi (PDF/Excel)
- Laporan kinerja bulanan
- Perbandingan antar pegawai

**Wireframe Owner Dashboard:**
```
┌────────────────────────────┐
│ ☰  Owner Dashboard   👤 Bos│
├────────────────────────────┤
│                            │
│  Ringkasan Hari Ini        │
│  ┌──────────────────────┐  │
│  │ 👥 12/15 Hadir       │  │
│  │ 💰 Rp 523.5jt Total  │  │
│  │ 📦 89 Transaksi      │  │
│  └──────────────────────┘  │
│                            │
│  Cabang                    │
│  ┌──────────────────────┐  │
│  │ 🏪 Cabang A     ✅    │  │
│  │ 5/5 hadir | 156.2jt  │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │ 🏪 Cabang B     ⚠️    │  │
│  │ 3/5 hadir | 98.1jt   │  │
│  │ ! 2 pegawai terlambat│  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │ 🏪 Cabang C     ✅    │  │
│  │ 4/5 hadir | 269.2jt  │  │
│  └──────────────────────┘  │
│                            │
│  [📊 Lihat Laporan]        │
└────────────────────────────┘
```

---

### 3.5 Modul Notifikasi

#### 3.5.1 Push Notification
- Reminder clock in (pagi hari)
- Reminder clock out (jam pulang)
- Alert keterlambatan (untuk owner)
- Update harga emas harian
- Achievement unlocked

#### 3.5.2 In-App Notification
- Inbox notifikasi
- Read/unread status
- Action buttons (jika applicable)

---

## 4. User Flow

### 4.1 Flow Pegawai (Kasir)

```
┌─────────┐     ┌─────────┐     ┌─────────────┐
│  Login  │────►│ Clock In│────►│  Dashboard  │
└─────────┘     └─────────┘     └─────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              ┌──────────┐     ┌──────────┐     ┌──────────┐
              │ Kinerja  │     │ Riwayat  │     │ Absensi  │
              │ Hari Ini │     │Transaksi │     │ History  │
              └──────────┘     └──────────┘     └──────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │  Clock Out   │
                              └──────────────┘
```

### 4.2 Flow Owner

```
┌─────────┐     ┌───────────────┐
│  Login  │────►│Owner Dashboard│
└─────────┘     └───────────────┘
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│Lihat Cabang│  │Lihat Pegawai│  │  Laporan   │
└────────────┘  └────────────┘  └────────────┘
       │               │
       ▼               ▼
┌────────────┐  ┌────────────┐
│Detail      │  │Detail      │
│Cabang      │  │Pegawai     │
└────────────┘  └────────────┘
```

---

## 5. Struktur Project Flutter

**Lokasi Project:** `/home/melvin/emas-pos-mobile/`

```
emas-pos-mobile/
├── android/                    # Android native code
├── ios/                        # iOS native code (future)
├── lib/
│   ├── main.dart              # Entry point
│   ├── app.dart               # App configuration
│   │
│   ├── core/
│   │   ├── config/
│   │   │   ├── app_config.dart
│   │   │   ├── salesforce_config.dart
│   │   │   └── theme_config.dart
│   │   ├── constants/
│   │   │   ├── app_constants.dart
│   │   │   └── api_endpoints.dart
│   │   ├── errors/
│   │   │   ├── exceptions.dart
│   │   │   └── failures.dart
│   │   └── utils/
│   │       ├── date_utils.dart
│   │       ├── currency_utils.dart
│   │       └── location_utils.dart
│   │
│   ├── data/
│   │   ├── datasources/
│   │   │   ├── remote/
│   │   │   │   ├── salesforce_api.dart
│   │   │   │   ├── auth_remote_ds.dart
│   │   │   │   ├── attendance_remote_ds.dart
│   │   │   │   ├── transaction_remote_ds.dart
│   │   │   │   └── user_remote_ds.dart
│   │   │   └── local/
│   │   │       ├── auth_local_ds.dart
│   │   │       ├── cache_local_ds.dart
│   │   │       └── preferences_local_ds.dart
│   │   ├── models/
│   │   │   ├── user_model.dart
│   │   │   ├── branch_model.dart
│   │   │   ├── attendance_model.dart
│   │   │   ├── transaction_model.dart
│   │   │   └── performance_model.dart
│   │   └── repositories/
│   │       ├── auth_repository_impl.dart
│   │       ├── attendance_repository_impl.dart
│   │       ├── transaction_repository_impl.dart
│   │       └── user_repository_impl.dart
│   │
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── user.dart
│   │   │   ├── branch.dart
│   │   │   ├── attendance.dart
│   │   │   ├── transaction.dart
│   │   │   └── performance.dart
│   │   ├── repositories/
│   │   │   ├── auth_repository.dart
│   │   │   ├── attendance_repository.dart
│   │   │   ├── transaction_repository.dart
│   │   │   └── user_repository.dart
│   │   └── usecases/
│   │       ├── auth/
│   │       │   ├── login_usecase.dart
│   │       │   ├── logout_usecase.dart
│   │       │   └── get_current_user.dart
│   │       ├── attendance/
│   │       │   ├── clock_in_usecase.dart
│   │       │   ├── clock_out_usecase.dart
│   │       │   └── get_attendance_history.dart
│   │       ├── transaction/
│   │       │   ├── get_my_transactions.dart
│   │       │   └── get_branch_transactions.dart
│   │       └── performance/
│   │           ├── get_my_performance.dart
│   │           └── get_team_performance.dart
│   │
│   ├── presentation/
│   │   ├── providers/                  # Riverpod providers
│   │   │   ├── auth_provider.dart
│   │   │   ├── attendance_provider.dart
│   │   │   ├── transaction_provider.dart
│   │   │   ├── performance_provider.dart
│   │   │   └── location_provider.dart
│   │   ├── pages/
│   │   │   ├── splash/
│   │   │   │   └── splash_page.dart
│   │   │   ├── auth/
│   │   │   │   ├── login_page.dart
│   │   │   │   └── widgets/
│   │   │   ├── home/
│   │   │   │   ├── home_page.dart       # Bottom nav container
│   │   │   │   └── widgets/
│   │   │   ├── attendance/
│   │   │   │   ├── attendance_page.dart
│   │   │   │   ├── clock_in_page.dart
│   │   │   │   ├── attendance_history_page.dart
│   │   │   │   └── widgets/
│   │   │   ├── dashboard/
│   │   │   │   ├── employee_dashboard_page.dart
│   │   │   │   ├── owner_dashboard_page.dart
│   │   │   │   └── widgets/
│   │   │   ├── transactions/
│   │   │   │   ├── my_transactions_page.dart
│   │   │   │   ├── transaction_detail_page.dart
│   │   │   │   └── widgets/
│   │   │   ├── monitoring/               # Owner only
│   │   │   │   ├── branches_page.dart
│   │   │   │   ├── branch_detail_page.dart
│   │   │   │   ├── employees_page.dart
│   │   │   │   ├── employee_detail_page.dart
│   │   │   │   └── widgets/
│   │   │   ├── reports/                  # Owner only
│   │   │   │   ├── reports_page.dart
│   │   │   │   ├── attendance_report_page.dart
│   │   │   │   ├── performance_report_page.dart
│   │   │   │   └── widgets/
│   │   │   ├── profile/
│   │   │   │   ├── profile_page.dart
│   │   │   │   ├── edit_profile_page.dart
│   │   │   │   └── widgets/
│   │   │   └── settings/
│   │   │       ├── settings_page.dart
│   │   │       └── widgets/
│   │   └── widgets/                     # Shared widgets
│   │       ├── cards/
│   │       ├── charts/
│   │       ├── buttons/
│   │       ├── inputs/
│   │       └── dialogs/
│   │
│   └── services/
│       ├── location_service.dart
│       ├── camera_service.dart
│       ├── notification_service.dart
│       └── biometric_service.dart
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── test/
│   ├── unit/
│   ├── widget/
│   └── integration/
│
├── pubspec.yaml
├── analysis_options.yaml
└── README.md
```

---

## 6. Salesforce Custom Objects

### 6.1 Object Baru yang Perlu Dibuat

#### Attendance__c
```yaml
Label: Attendance
API Name: Attendance__c
Fields:
  - User__c (Lookup to User)
  - Branch__c (Lookup to Branch__c)
  - Date__c (Date)
  - Clock_In_Time__c (DateTime)
  - Clock_Out_Time__c (DateTime)
  - Clock_In_Latitude__c (Number 10,7)
  - Clock_In_Longitude__c (Number 10,7)
  - Clock_Out_Latitude__c (Number 10,7)
  - Clock_Out_Longitude__c (Number 10,7)
  - Clock_In_Photo_URL__c (URL)
  - Clock_Out_Photo_URL__c (URL)
  - Status__c (Picklist: Present, Late, Absent, Leave, Half_Day)
  - Late_Minutes__c (Number)
  - Total_Hours__c (Formula: Clock_Out - Clock_In)
  - Overtime_Hours__c (Number)
  - Device_Id__c (Text 100)
  - Notes__c (Long Text Area)
```

#### Daily_Target__c
```yaml
Label: Daily Target
API Name: Daily_Target__c
Fields:
  - User__c (Lookup to User)
  - Branch__c (Lookup to Branch__c)
  - Date__c (Date)
  - Transaction_Target__c (Number)
  - Sales_Amount_Target__c (Currency)
  - Actual_Transactions__c (Number, rollup/formula)
  - Actual_Sales_Amount__c (Currency, rollup/formula)
  - Achievement_Percentage__c (Formula)
```

#### Achievement__c
```yaml
Label: Achievement
API Name: Achievement__c
Fields:
  - User__c (Lookup to User)
  - Badge_Type__c (Picklist: First_Sale, 10_Transactions, 100_Transactions,
                   Top_Performer, Perfect_Attendance, 7_Day_Streak, etc.)
  - Earned_Date__c (DateTime)
  - Description__c (Text)
```

### 6.2 Modifikasi Object Existing

#### User (Standard Object)
Tambah field:
- `Mobile_Device_Id__c` (Text 100)
- `FCM_Token__c` (Text 255) - untuk push notification
- `Last_Mobile_Login__c` (DateTime)
- `Biometric_Enabled__c` (Checkbox)

#### Branch__c
Tambah field:
- `Latitude__c` (Number 10,7)
- `Longitude__c` (Number 10,7)
- `Geofence_Radius__c` (Number) - radius dalam meter (default: 50)
- `Work_Start_Time__c` (Time)
- `Work_End_Time__c` (Time)
- `Late_Tolerance_Minutes__c` (Number, default: 15)

---

## 7. API Endpoints (Salesforce REST)

### 7.1 Authentication
```
POST /services/oauth2/token
  - grant_type: password
  - client_id, client_secret
  - username, password + security_token
```

### 7.2 Attendance
```
# Clock In
POST /services/data/v58.0/sobjects/Attendance__c
Body: {
  User__c, Branch__c, Date__c, Clock_In_Time__c,
  Clock_In_Latitude__c, Clock_In_Longitude__c,
  Clock_In_Photo_URL__c, Status__c, Device_Id__c
}

# Clock Out (Update)
PATCH /services/data/v58.0/sobjects/Attendance__c/{id}
Body: {
  Clock_Out_Time__c, Clock_Out_Latitude__c, Clock_Out_Longitude__c,
  Clock_Out_Photo_URL__c
}

# Get History
GET /services/data/v58.0/query?q=SELECT+...+FROM+Attendance__c+WHERE+User__c='xxx'+ORDER+BY+Date__c+DESC
```

### 7.3 Transactions
```
# Get My Transactions
GET /services/data/v58.0/query?q=SELECT+...+FROM+Transaction__c+WHERE+User__c='xxx'+AND+Date__c>=LAST_N_DAYS:30

# Get Branch Transactions (Owner)
GET /services/data/v58.0/query?q=SELECT+...+FROM+Transaction__c+WHERE+Branch__c='xxx'+AND+Date__c=TODAY
```

### 7.4 Performance
```
# Get Daily Summary
GET /services/data/v58.0/query?q=SELECT+COUNT(Id),+SUM(Total_Amount__c)+FROM+Transaction__c+WHERE+User__c='xxx'+AND+Date__c=TODAY+GROUP+BY+User__c

# Get Branch Performance (Owner)
GET /services/data/v58.0/query?q=SELECT+User__c,+COUNT(Id),+SUM(Total_Amount__c)+FROM+Transaction__c+WHERE+Branch__c='xxx'+AND+Date__c=TODAY+GROUP+BY+User__c
```

---

## 8. Keamanan

### 8.1 Authentication & Authorization
- OAuth 2.0 dengan Salesforce
- Token disimpan dengan Flutter Secure Storage (encrypted)
- Role-based access control (Owner vs Kasir)
- Session timeout 30 menit inaktif

### 8.2 Data Protection
- HTTPS untuk semua API calls
- Certificate pinning (opsional)
- No sensitive data in logs
- Biometric untuk re-authentication

### 8.3 Location Security
- GPS spoofing detection
- Device ID tracking
- Photo verification untuk clock in

---

## 9. Offline Capability

### 9.1 Fitur Offline
- View cached data (dashboard, history)
- Queue clock in/out jika offline
- Sync otomatis saat online

### 9.2 Sync Strategy
- Last-write-wins untuk conflicts
- Retry dengan exponential backoff
- Background sync dengan WorkManager

---

## 10. Timeline Implementasi

### Phase 1: Foundation (Minggu 1-2)
- [ ] Setup Flutter project
- [ ] Implementasi arsitektur (clean architecture)
- [ ] Setup Salesforce connection
- [ ] Buat custom objects di Salesforce
- [ ] Auth module (login/logout)

### Phase 2: Absensi (Minggu 3-4)
- [ ] Clock in dengan GPS + foto
- [ ] Clock out
- [ ] Riwayat absensi
- [ ] Calendar view

### Phase 3: Kinerja Pegawai (Minggu 5-6)
- [ ] Dashboard pegawai
- [ ] Riwayat transaksi
- [ ] Grafik performa
- [ ] Achievement badges

### Phase 4: Owner Monitoring (Minggu 7-8)
- [ ] Owner dashboard
- [ ] List cabang dengan status
- [ ] Detail per pegawai
- [ ] Laporan sederhana

### Phase 5: Polish & Testing (Minggu 9-10)
- [ ] Push notification
- [ ] Biometric login
- [ ] Offline mode
- [ ] Testing & bug fixing
- [ ] Play Store release

---

## 11. Dependencies (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter

  # State Management
  flutter_riverpod: ^2.4.0
  riverpod_annotation: ^2.3.0

  # Networking
  dio: ^5.4.0
  retrofit: ^4.0.3

  # Local Storage
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  flutter_secure_storage: ^9.0.0

  # Location
  geolocator: ^11.0.0
  geocoding: ^3.0.0

  # Camera
  camera: ^0.10.5
  image_picker: ^1.0.7

  # UI
  flutter_svg: ^2.0.9
  cached_network_image: ^3.3.1
  shimmer: ^3.0.0
  fl_chart: ^0.66.0
  table_calendar: ^3.0.9

  # Utils
  intl: ^0.19.0
  freezed_annotation: ^2.4.1
  json_annotation: ^4.8.1
  equatable: ^2.0.5
  dartz: ^0.10.1

  # Firebase (Notifications)
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.10

  # Biometric
  local_auth: ^2.1.8

  # Permissions
  permission_handler: ^11.1.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.4.8
  freezed: ^2.4.6
  json_serializable: ^6.7.1
  retrofit_generator: ^8.0.6
  riverpod_generator: ^2.3.9
  mockito: ^5.4.4
  flutter_lints: ^3.0.1
```

---

## 12. Pertimbangan Tambahan

### 12.1 Scalability
- Pagination untuk list data
- Image compression sebelum upload
- Caching strategy yang efisien

### 12.2 Performance
- Lazy loading untuk screens
- Optimized queries ke Salesforce
- Background sync tidak mengganggu UX

### 12.3 Maintenance
- Error logging (Sentry/Firebase Crashlytics)
- Analytics tracking
- Remote config untuk feature flags

---

## 13. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| GPS spoofing | Pegawai fake location | Foto selfie + device fingerprint |
| Offline prolonged | Data tidak sync | Queue + retry mechanism |
| Salesforce API limit | App tidak bisa sync | Batching + caching |
| Device compatibility | App crash | Testing di berbagai device |

---

## 14. Approval Checklist

- [ ] Fitur sudah sesuai kebutuhan
- [ ] Arsitektur disetujui
- [ ] Timeline realistic
- [ ] Budget/resource tersedia
- [ ] Salesforce subscription mendukung API access

---

**Dokumen ini perlu di-review dan disetujui sebelum implementasi dimulai.**

---

*Dibuat oleh: Claude AI Assistant*
*Untuk: EmasPOS Mobile Development*
