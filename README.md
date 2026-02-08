# Ciku - Video & Audio Downloader

Aplikasi web untuk mendownload video dan audio dari YouTube, TikTok, dan Instagram dengan mudah dan cepat menggunakan yt-dlp.

## Fitur

- ⚡ Download video dari YouTube, TikTok, dan Instagram
- 🎵 Download audio only (MP3)
- 🎯 Interface yang mudah digunakan
- 🎨 Design modern dengan dark theme
- 📱 Responsive untuk semua perangkat
- 🎬 Preview video sebelum download
- 🎚️ Pilihan kualitas video lengkap (360p - 4K)
- 🌍 Support multi-platform

## Instalasi

### 1. Install Node.js
Download dan install Node.js dari https://nodejs.org/ (pilih versi LTS)

### 2. Install yt-dlp

**Windows:**
```powershell
# Menggunakan winget (Windows 11)
winget install yt-dlp

# Atau download manual dari:
# https://github.com/yt-dlp/yt-dlp/releases
# Letakkan yt-dlp.exe di folder yang ada di PATH
```

**Verifikasi instalasi:**
```bash
yt-dlp --version
```

### 3. Install Dependencies Project
```bash
cd c:\Antigravity\yutub
npm install
```

### 4. Jalankan Server
```bash
npm start
```

### 5. Buka Browser
Akses: http://localhost:3000

## Cara Penggunaan

1. Copy URL video dari YouTube, TikTok, atau Instagram
2. Paste URL ke input field
3. Klik "Ambil Info" untuk melihat informasi video
4. Pilih tipe download (Video atau Audio)
5. Pilih resolusi/kualitas yang diinginkan
6. Klik "Download Video"

### Download Audio Only

1. Setelah mengambil info video, klik tombol "Audio"
2. Pilih kualitas audio yang diinginkan:
   - Kualitas Terbaik (MP3)
   - High Quality (M4A)
   - Kualitas Rendah (Ukuran Kecil)
3. Klik "Download Video" untuk mendapatkan file MP3

## Teknologi

- **Backend**: Node.js + Express
- **Video Downloader**: yt-dlp (via yt-dlp-wrap)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript

## Resolusi yang Tersedia

- 4K (2160p)
- 1440p
- 1080p (Full HD)
- 720p (HD)
- 480p
- 360p
- 240p
- 144p

Plus opsi 60fps untuk video yang support!

## Deploy ke Render.com

Aplikasi ini siap di-deploy ke Render.com secara gratis!

### Quick Deploy

1. Push project ke GitHub
2. Buat akun di [Render.com](https://render.com)
3. Klik "New Web Service"
4. Connect repository GitHub Anda
5. Render akan otomatis detect konfigurasi dari `render.yaml`
6. Klik "Create Web Service"

Lihat panduan lengkap di [render-deployment.md](render-deployment.md)

### Konfigurasi Otomatis

File `render.yaml` sudah dikonfigurasi dengan:
- ✅ Node.js environment
- ✅ Auto-install dependencies
- ✅ Auto-download yt-dlp
- ✅ Free plan ready

## Troubleshooting

### yt-dlp tidak ditemukan
Pastikan yt-dlp sudah terinstall dan ada di PATH sistem Anda.

### Video tidak bisa didownload
Beberapa video mungkin memiliki pembatasan regional atau copyright. Coba video lain.

## Catatan

- Gunakan dengan bijak dan hormati hak cipta
- Pastikan koneksi internet stabil untuk download yang lancar
- Video akan tersimpan di folder Downloads browser Anda

## License

MIT
