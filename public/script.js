const form = document.getElementById('downloadForm');
const submitBtn = document.getElementById('submitBtn');
const videoUrlInput = document.getElementById('videoUrl');
const videoInfo = document.getElementById('videoInfo');
const downloadBtn = document.getElementById('downloadBtn');
const message = document.getElementById('message');

let currentVideoUrl = '';
let downloadType = 'video'; // 'video' or 'audio'

// Format durasi dari detik ke MM:SS
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Tampilkan pesan
function showMessage(text, type = 'error') {
    message.textContent = text;
    message.className = `message ${type}`;
    message.classList.remove('hidden');

    setTimeout(() => {
        message.classList.add('hidden');
    }, 5000);
}

// Handle download type toggle
document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active from all buttons
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));

        // Add active to clicked button
        btn.classList.add('active');

        // Update download type
        downloadType = btn.dataset.type;

        // Update quality selector label
        const qualityLabel = document.querySelector('.quality-selector label');
        if (downloadType === 'audio') {
            qualityLabel.textContent = 'Pilih Kualitas Audio:';
            updateQualityOptionsForAudio();
        } else {
            qualityLabel.textContent = 'Pilih Resolusi & Kualitas:';
            // Re-populate with video formats if we have current data
            if (currentVideoUrl && window.currentVideoData) {
                populateVideoFormats(window.currentVideoData);
            }
        }
    });
});

function updateQualityOptionsForAudio() {
    const qualitySelect = document.getElementById('qualitySelect');
    qualitySelect.innerHTML = `
        <option value="bestaudio">Kualitas Terbaik (MP3)</option>
        <option value="bestaudio[ext=m4a]">High Quality (M4A)</option>
        <option value="worstaudio">Kualitas Rendah (Ukuran Kecil)</option>
    `;
}

function populateVideoFormats(data) {
    const qualitySelect = document.getElementById('qualitySelect');
    qualitySelect.innerHTML = '';

    if (data.formats && data.formats.length > 0) {
        data.formats.forEach(format => {
            const option = document.createElement('option');
            option.value = format.format_id;

            let optionText = format.resolution || format.quality;
            if (format.fps && format.fps > 30) {
                optionText += ` ${format.fps}fps`;
            }
            if (format.filesize && format.filesize !== 'Unknown') {
                optionText += ` (${format.filesize})`;
            }

            option.textContent = optionText;
            option.dataset.format = JSON.stringify(format);
            qualitySelect.appendChild(option);
        });
    } else {
        const option = document.createElement('option');
        option.value = 'best';
        option.textContent = 'Kualitas Terbaik';
        qualitySelect.appendChild(option);
    }
}

// Handle form submit untuk mendapatkan info video
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const url = videoUrlInput.value.trim();
    if (!url) return;

    currentVideoUrl = url;

    // Set loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    videoInfo.classList.add('hidden');
    message.classList.add('hidden');
    document.getElementById('processingMsg').classList.add('hidden');

    try {
        const response = await fetch('/api/info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Gagal mendapatkan info video');
        }

        // Tampilkan info video
        document.getElementById('thumbnail').src = data.thumbnail;
        document.getElementById('videoTitle').textContent = data.title;
        document.getElementById('videoAuthor').textContent = data.author;
        document.getElementById('videoDuration').textContent = formatDuration(data.duration);

        // Store data globally for type switching
        window.currentVideoData = data;

        // Populate formats based on current download type
        if (downloadType === 'audio') {
            updateQualityOptionsForAudio();
        } else {
            populateVideoFormats(data);
        }

        videoInfo.classList.remove('hidden');
        showMessage('Info video berhasil dimuat!', 'success');

    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
});

// Handle download button
downloadBtn.addEventListener('click', async () => {
    if (!currentVideoUrl) return;

    const format_id = document.getElementById('qualitySelect').value;
    const processingMsg = document.getElementById('processingMsg');

    try {
        // Set loading state for download button
        downloadBtn.classList.add('loading');
        downloadBtn.disabled = true;
        processingMsg.classList.remove('hidden');

        // Step 1: Prepare the download (merging/processing)
        const prepareResponse = await fetch('/api/prepare', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: currentVideoUrl,
                format_id: format_id
            })
        });

        const prepareData = await prepareResponse.json();

        if (!prepareResponse.ok) {
            throw new Error(prepareData.error || 'Gagal memproses video');
        }

        // Step 2: Download the prepared file
        if (prepareData.success && prepareData.file) {
            // Sembunyikan loading/processing UI
            processingMsg.classList.add('hidden');
            downloadBtn.classList.remove('loading');
            downloadBtn.disabled = false;

            showMessage('Proses selesai! Download dimulai...', 'success');

            // Trigger download menggunakan endpoint get-file
            const downloadUrl = `/api/get-file?file=${encodeURIComponent(prepareData.file)}`;
            window.location.assign(downloadUrl);
        }

    } catch (error) {
        showMessage(error.message || 'Gagal mendownload video. Silakan coba lagi.', 'error');
        downloadBtn.classList.remove('loading');
        downloadBtn.disabled = false;
        processingMsg.classList.add('hidden');
    }
});

// Auto-focus input saat halaman dimuat
window.addEventListener('load', () => {
    videoUrlInput.focus();
});
