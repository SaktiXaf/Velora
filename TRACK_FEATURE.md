# Track Activity - GPS Tracking Feature

## ✨ Fitur yang Sudah Diimplementasikan

### 🗺️ **Real-time Map Tracking**
- Background map menampilkan lokasi user saat ini
- Real-time GPS tracking dengan akurasi tinggi
- Polyline path yang menampilkan rute yang telah ditempuh
- Auto-follow user location saat tracking aktif

### 📊 **Live Statistics Display**
- **Distance**: Jarak yang sudah ditempuh (km)
- **Time**: Durasi tracking secara real-time
- **Pace**: Kecepatan rata-rata (min/km)
- **Calories**: Kalori yang terbakar berdasarkan jenis aktivitas

### 🏃‍♂️ **Activity Types**
- **Run**: 60 kalori/km - untuk aktivitas lari
- **Bike**: 30 kalori/km - untuk aktivitas bersepeda  
- **Walk**: 40 kalori/km - untuk aktivitas jalan kaki

### 🎯 **User Experience**
- Interface yang clean dengan dark/light mode support
- Floating stats overlay di atas map
- Recording indicator saat tracking aktif
- One-touch start/stop tracking
- Confirmation dialog sebelum stop tracking
- Final stats summary setelah selesai

### 🔧 **Technical Features**
- GPS permission handling (foreground & background)
- High-accuracy location tracking
- Haversine formula untuk perhitungan jarak akurat
- Real-time speed calculation dan max speed tracking
- Background location support untuk tracking berkelanjutan
- Memory-efficient path tracking

### 🛡️ **Error Handling**
- Permission request dengan fallback
- Location service error handling
- Network connectivity handling
- User-friendly error messages

## 🚀 Cara Penggunaan

1. **Pilih Jenis Aktivitas**: Pilih Run, Bike, atau Walk sebelum memulai
2. **Tekan Start Tracking**: Aplikasi akan meminta izin lokasi
3. **Mulai Bergerak**: Map akan mengikuti pergerakan dan menampilkan rute
4. **Monitor Stats**: Lihat real-time distance, time, pace, dan calories
5. **Stop Tracking**: Tekan stop dan konfirmasi untuk melihat final stats

## 📱 Permissions Required
- Location (Always) - untuk tracking GPS
- Location (When in Use) - untuk map display
- Background App Refresh - untuk tracking berkelanjutan

Fitur ini menggunakan teknologi:
- 📍 Expo Location API
- 🗺️ React Native Maps
- 📊 Real-time data calculation
- 🎨 Responsive UI dengan theme support
