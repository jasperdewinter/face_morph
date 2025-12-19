const canvas = document.getElementById('morphCanvas');
const ctx = canvas.getContext('2d');
const faceInput = document.getElementById('faceInput');
const loadSamplesBtn = document.getElementById('loadSamples');
const faceList = document.getElementById('faceList');
const faceCount = document.getElementById('faceCount');
const startBtn = document.getElementById('startMorph');
const stopBtn = document.getElementById('stopMorph');
const durationInput = document.getElementById('durationInput');
const pauseInput = document.getElementById('pauseInput');
const statusEl = document.getElementById('status');
const progressBar = document.getElementById('progressBar');

const faces = [];
let isMorphing = false;
let animationFrame = null;

faceInput.addEventListener('change', (event) => {
  const files = Array.from(event.target.files || []);
  files.forEach((file) => loadFileAsFace(file));
  faceInput.value = '';
});

loadSamplesBtn.addEventListener('click', async () => {
  const manifest = await fetchFacesFromManifest();
  manifest.forEach((entry) => loadFace(entry.url, entry.label));
});

startBtn.addEventListener('click', () => {
  if (faces.length < 2) {
    setStatus('Add at least two faces to start morphing.');
    return;
  }
  isMorphing = true;
  stopBtn.disabled = false;
  startBtn.disabled = true;
  setStatus('Morphing…');
  runMorphSequence();
});

stopBtn.addEventListener('click', () => {
  isMorphing = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  progressBar.style.width = '0%';
  setStatus('Stopped');
});

async function fetchFacesFromManifest() {
  try {
    const response = await fetch('faces/manifest.json');
    const data = await response.json();
    return data.faces || [];
  } catch (error) {
    console.error('Could not load sample faces', error);
    setStatus('Could not load sample faces (check console).');
    return [];
  }
}

function loadFileAsFace(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    loadFace(ev.target.result, file.name);
  };
  reader.readAsDataURL(file);
}

function loadFace(url, label = 'Face') {
  const img = new Image();
  img.onload = () => {
    faces.push({ img, label });
    renderFaceList();
    setStatus(`${faces.length} face${faces.length === 1 ? '' : 's'} ready.`);
  };
  img.onerror = () => {
    setStatus(`Could not load ${label}.`);
  };
  img.src = url;
}

function renderFaceList() {
  faceList.innerHTML = '';
  faces.forEach(({ img, label }, index) => {
    const tile = document.createElement('div');
    tile.className = 'face-tile';
    tile.setAttribute('role', 'listitem');

    const imageEl = document.createElement('img');
    imageEl.src = img.src;
    imageEl.alt = label;

    const caption = document.createElement('div');
    caption.className = 'label';
    caption.textContent = `${index + 1}. ${label}`;

    tile.appendChild(imageEl);
    tile.appendChild(caption);
    faceList.appendChild(tile);
  });

  faceCount.textContent = `${faces.length} face${faces.length === 1 ? '' : 's'}`;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function clearCanvas() {
  ctx.fillStyle = '#0b121b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawImageCover(img) {
  const canvasRatio = canvas.width / canvas.height;
  const imgRatio = img.width / img.height;
  let drawWidth = canvas.width;
  let drawHeight = canvas.height;
  if (imgRatio > canvasRatio) {
    drawHeight = canvas.height;
    drawWidth = imgRatio * drawHeight;
  } else {
    drawWidth = canvas.width;
    drawHeight = drawWidth / imgRatio;
  }
  const offsetX = (canvas.width - drawWidth) / 2;
  const offsetY = (canvas.height - drawHeight) / 2;
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

async function runMorphSequence() {
  const duration = Number(durationInput.value) * 1000;
  const pause = Number(pauseInput.value) * 1000;

  for (let i = 0; i < faces.length - 1 && isMorphing; i++) {
    const current = faces[i];
    const next = faces[i + 1];
    await crossfade(current.img, next.img, duration, i, faces.length - 1);
    if (!isMorphing) break;
    setStatus(`Paused before morph ${i + 2}`);
    await wait(pause);
  }

  if (isMorphing) {
    setStatus('Finished. Add more faces or press start to replay.');
  }

  isMorphing = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  progressBar.style.width = '0%';
}

function crossfade(imgA, imgB, duration, pairIndex, totalPairs) {
  return new Promise((resolve) => {
    const start = performance.now();

    const animate = (now) => {
      if (!isMorphing) {
        cancelAnimationFrame(animationFrame);
        return resolve();
      }
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);

      clearCanvas();
      ctx.globalAlpha = 1;
      drawImageCover(imgA);
      ctx.globalAlpha = easeInOut(t);
      drawImageCover(imgB);
      ctx.globalAlpha = 1;

      const overallProgress = ((pairIndex + t) / totalPairs) * 100;
      progressBar.style.width = `${overallProgress}%`;
      setStatus(`Morphing ${pairIndex + 1} → ${pairIndex + 2}`);

      if (t < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };

    animationFrame = requestAnimationFrame(animate);
  });
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Kick things off with samples if available
fetchFacesFromManifest().then((entries) => {
  if (!entries.length) return;
  entries.forEach((entry) => loadFace(entry.url, entry.label));
  setStatus('Sample faces loaded. Add more or press start to morph.');
});

clearCanvas();
