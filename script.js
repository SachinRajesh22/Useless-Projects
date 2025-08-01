const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const previewContainer = document.getElementById('imagePreviewContainer');
const placeholderText = document.querySelector('.placeholder-text');
const analyzeBtn = document.getElementById('analyzeBtn');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resultText = document.getElementById('resultText');
const canvas = document.getElementById('hiddenCanvas');
const ctx = canvas.getContext('2d');

let palmReadingLog = [];

imageUpload.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            previewContainer.style.backgroundImage = 'none';
            placeholderText.style.display = 'none';
            analyzeBtn.disabled = false;

            const img = new Image();
            img.onload = function () {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

resetBtn.addEventListener('click', function () {
    imageUpload.value = '';
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    previewContainer.style.backgroundImage = 'url("sample.jpg")';
    placeholderText.style.display = 'block';
    analyzeBtn.disabled = true;
    resultText.innerHTML = '';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

analyzeBtn.addEventListener('click', function () {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    let sobelLines = 0;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = (y * width + x) * 4;
            const getGray = (dx, dy) => {
                const idx = ((y + dy) * width + (x + dx)) * 4;
                return (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
            };
            const gx =
                -1 * getGray(-1, -1) + 1 * getGray(1, -1) +
                -2 * getGray(-1, 0) + 2 * getGray(1, 0) +
                -1 * getGray(-1, 1) + 1 * getGray(1, 1);
            const gy =
                -1 * getGray(-1, -1) + -2 * getGray(0, -1) + -1 * getGray(1, -1) +
                 1 * getGray(-1, 1) +  2 * getGray(0, 1) +  1 * getGray(1, 1);
            const magnitude = Math.sqrt(gx * gx + gy * gy);
            if (magnitude > 100) {
                sobelLines++;
            }
        }
    }

    const totalLines = Math.floor(sobelLines / 800);
    resultText.innerHTML = `Detected lines: <strong>${totalLines}</strong>`;

    const entry = {
        timestamp: new Date().toLocaleString(),
        linesDetected: totalLines,
        base64Image: canvas.toDataURL("image/jpeg")
    };

    palmReadingLog.push(entry);
    localStorage.setItem('yomiPalmLog', JSON.stringify(palmReadingLog));
});

downloadBtn.addEventListener('click', function () {
    const blob = new Blob([JSON.stringify(palmReadingLog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `YOMI-Palm-Log.json`;
    link.click();
    URL.revokeObjectURL(url);
});
