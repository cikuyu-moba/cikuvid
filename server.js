const express = require('express');
const YTDlpWrap = require('yt-dlp-wrap').default;
const cors = require('cors');
const sanitize = require('sanitize-filename');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Path untuk menyimpan yt-dlp binary
const ytDlpPath = path.join(__dirname, 'bin', 'yt-dlp.exe');

// Initialize yt-dlp dengan path custom
let ytDlp;

// Buat folder temp jika belum ada
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Function untuk download yt-dlp jika belum ada
async function ensureYtDlp() {
  const binDir = path.join(__dirname, 'bin');

  // Cek apakah yt-dlp sudah ada
  if (fs.existsSync(ytDlpPath)) {
    console.log('✅ yt-dlp sudah tersedia');
    ytDlp = new YTDlpWrap(ytDlpPath);
    return;
  }

  console.log('📥 Downloading yt-dlp binary...');

  // Buat folder bin jika belum ada
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  try {
    // Download yt-dlp binary
    await YTDlpWrap.downloadFromGithub(ytDlpPath);
    console.log('✅ yt-dlp berhasil didownload!');
    ytDlp = new YTDlpWrap(ytDlpPath);
  } catch (error) {
    console.error('❌ Gagal download yt-dlp:', error);
    throw error;
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Endpoint untuk mendapatkan info video
app.post('/api/info', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL video diperlukan' });
    }

    // Dapatkan info video menggunakan yt-dlp
    const videoInfo = await ytDlp.getVideoInfo(url);

    // Ambil semua format yang memiliki video (audio bisa terpisah)
    const allFormats = videoInfo.formats || [];

    // Buat map untuk menyimpan resolusi unik
    const resolutionMap = new Map();

    allFormats.forEach(format => {
      // Skip format yang tidak punya video
      if (!format.height || format.vcodec === 'none') return;

      const height = format.height;
      const fps = format.fps || 30;
      const filesize = format.filesize || format.filesize_approx || 0;

      // Buat key unik berdasarkan resolusi
      const key = `${height}p`;

      // Simpan format dengan bitrate tertinggi untuk setiap resolusi
      if (!resolutionMap.has(key) || (resolutionMap.get(key).tbr || 0) < (format.tbr || 0)) {
        resolutionMap.set(key, {
          quality: `${height}p`,
          resolution: `${format.width}x${height}`,
          fps: fps,
          container: format.ext,
          videoCodec: format.vcodec,
          audioCodec: format.acodec || 'separate',
          bitrate: format.tbr,
          filesize: filesize > 0 ? `${(filesize / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
          format_id: format.format_id,
          height: height
        });
      }
    });

    // Convert map ke array dan sort berdasarkan resolusi (tertinggi ke terendah)
    const sortedFormats = Array.from(resolutionMap.values())
      .filter(f => f.height > 0)
      .sort((a, b) => b.height - a.height);

    res.json({
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      duration: videoInfo.duration,
      author: videoInfo.uploader || videoInfo.channel,
      formats: sortedFormats
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Gagal mendapatkan informasi video. Pastikan URL valid dan video tersedia.'
    });
  }
});

// Endpoint untuk mempersiapkan download (pemrosesan merging)
app.post('/api/prepare', async (req, res) => {
  try {
    const { url, format_id } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL video diperlukan' });
    }

    // Dapatkan info video untuk nama file
    const videoInfo = await ytDlp.getVideoInfo(url);
    let title = sanitize(videoInfo.title);

    // Encode filename untuk header (hapus karakter non-ASCII dan karakter khusus)
    title = title.replace(/[^\x00-\x7F]/g, ''); // Hapus non-ASCII
    title = title.replace(/[<>:"/\\|?*]/g, ''); // Hapus karakter invalid untuk filename
    title = title.trim() || 'video'; // Fallback jika title kosong

    // Deteksi apakah ini audio download
    const isAudio = format_id && (format_id.includes('audio') || format_id === 'bestaudio' || format_id === 'worstaudio');
    const fileExtension = isAudio ? '.mp3' : '.mp4';

    // Generate temporary file path
    const tempFileName = `${Date.now()}-${title}${fileExtension}`;
    const tempFilePath = path.join(tempDir, tempFileName);

    // Download options
    const downloadOptions = isAudio ? [
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '--format', format_id || 'bestaudio',
      '--output', tempFilePath,
      url
    ] : [
      // Untuk video: format_id+bestaudio, fallback ke best
      '--format', format_id ? `${format_id}+bestaudio[ext=m4a]/best` : 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best',
      '--merge-output-format', 'mp4',
      '--output', tempFilePath,
      url
    ];

    console.log('Prepare request:', { url, format_id, isAudio });

    // Download menggunakan .exec() untuk menunggu prosess selesai (merging)
    const ytDlpProcess = ytDlp.exec(downloadOptions);

    ytDlpProcess.on('error', (error) => {
      console.error('yt-dlp error:', error);
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Gagal memproses video' });
      }
    });

    ytDlpProcess.on('close', () => {
      if (fs.existsSync(tempFilePath)) {
        res.json({
          success: true,
          file: tempFileName,
          title: `${title}${fileExtension}`
        });
      } else {
        if (!res.headersSent) {
          res.status(500).json({ error: 'Proses gagal, file tidak ditemukan' });
        }
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Gagal memproses video. Pastikan URL valid dan video tersedia.'
    });
  }
});

// Endpoint untuk mengambil file hasil proses
app.get('/api/get-file', (req, res) => {
  const { file } = req.query;
  if (!file) return res.status(400).send('File parameter required');

  const filePath = path.join(tempDir, file);

  if (fs.existsSync(filePath)) {
    res.download(filePath, file, (err) => {
      // Hapus file temp setelah dikirim
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (err) {
        console.error('Error sending file:', err);
      }
    });
  } else {
    res.status(404).send('File not found or already deleted');
  }
});



// Start server dengan auto-download yt-dlp
async function startServer() {
  try {
    // Pastikan yt-dlp tersedia
    await ensureYtDlp();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
      console.log(`📦 Menggunakan yt-dlp untuk download video`);
    });
  } catch (error) {
    console.error('❌ Gagal memulai server:', error);
    process.exit(1);
  }
}

startServer();
