// Audio elements for natural sounds
const sounds = {
    rain: new Audio(),
    fire: new Audio(),
    ocean: new Audio(),
    forest: new Audio()
};

// White noise using Web Audio API
let whiteNoisePlaying = false;
let audioCtx = null;
let whiteNodeObj = null;
let whiteGain = null;

// Sound URLs (working free CDN samples from Pixabay – replace with your own if needed)
sounds.rain.src = 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_8b6d5e6d1c.mp3?filename=rain-soft-01.mp3';
sounds.fire.src = 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_2a2b3c4d.mp3?filename=fireplace-crackling-01.mp3';
sounds.ocean.src = 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_9f9e8d7c.mp3?filename=ocean-waves-01.mp3';
sounds.forest.src = 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_4d5e6f7a.mp3?filename=forest-birds-01.mp3';

// Loop all natural sounds
for (let key in sounds) {
    sounds[key].loop = true;
    sounds[key].volume = 0.5;
}

// Video elements
const videos = {
    rain: document.getElementById('rainVideo'),
    fire: document.getElementById('fireVideo'),
    ocean: document.getElementById('oceanVideo'),
    forest: document.getElementById('forestVideo'),
    whitenoise: document.getElementById('whiteVideo')
};

// Preload videos
for (let v of Object.values(videos)) {
    if (v) v.load();
}

// ---------- White Noise Generator ----------
function initWhiteNoise() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        whiteGain = audioCtx.createGain();
        whiteGain.gain.value = 0.5;
        whiteGain.connect(audioCtx.destination);
    }
    const bufferSize = 4096;
    const whiteNode = audioCtx.createScriptProcessor(bufferSize, 1, 1);
    whiteNode.onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
    };
    whiteNode.connect(whiteGain);
    return whiteNode;
}

function playWhiteNoise() {
    if (!audioCtx) {
        whiteNodeObj = initWhiteNoise();
        audioCtx.resume();
    } else if (whiteNodeObj === null) {
        whiteNodeObj = initWhiteNoise();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    whiteNoisePlaying = true;
}

function stopWhiteNoise() {
    if (whiteNodeObj) {
        whiteNodeObj.disconnect();
        whiteNodeObj = null;
    }
    whiteNoisePlaying = false;
}

function setWhiteNoiseVolume(vol) {
    if (whiteGain) whiteGain.gain.value = vol;
}

// Fake audio object for white noise to unify control
const fakeWhiteAudio = {
    play: () => playWhiteNoise(),
    pause: () => stopWhiteNoise(),
    setVolume: (v) => setWhiteNoiseVolume(v),
    _volume: 0.5
};

// ---------- App State ----------
let activeSound = null;   // either an Audio object or fakeWhiteAudio
let activeType = null;    // 'rain', 'fire', 'ocean', 'forest', 'whitenoise'
let timerInterval = null;

// Master volume
const masterSlider = document.getElementById('masterVolume');
let masterVolume = 0.6;
masterSlider.addEventListener('input', (e) => {
    masterVolume = parseFloat(e.target.value);
    if (activeSound && activeSound !== fakeWhiteAudio) {
        activeSound.volume = masterVolume;
    } else if (activeType === 'whitenoise') {
        setWhiteNoiseVolume(masterVolume);
    }
});

function updateMasterVolume() {
    if (activeSound && activeSound !== fakeWhiteAudio) activeSound.volume = masterVolume;
    else if (activeType === 'whitenoise') setWhiteNoiseVolume(masterVolume);
}

// Play a sound type
function playSound(type) {
    // Stop current sound
    stopAllSounds();

    if (type === 'whitenoise') {
        fakeWhiteAudio.play();
        activeSound = fakeWhiteAudio;
        activeType = 'whitenoise';
        setWhiteNoiseVolume(masterVolume);
    } else {
        const audio = sounds[type];
        audio.volume = masterVolume;
        audio.play().catch(e => console.log("Autoplay blocked? Click page first", e));
        activeSound = audio;
        activeType = type;
    }

    // Update UI indicators
    document.querySelectorAll('.sound-card').forEach(card => {
        const indicator = card.querySelector('.playing-indicator');
        if (card.dataset.sound === type || (type === 'whitenoise' && card.dataset.sound === 'whitenoise')) {
            indicator.textContent = '🔊 Playing...';
        } else {
            indicator.textContent = '';
        }
    });

    // Switch background video
    for (let vid of Object.values(videos)) {
        if (vid) vid.classList.remove('active');
    }
    const videoKey = type === 'whitenoise' ? 'whitenoise' : type;
    if (videos[videoKey]) {
        videos[videoKey].classList.add('active');
        videos[videoKey].play().catch(e => console.log);
    }
}

// Stop all sounds and clear timer
function stopAllSounds() {
    if (activeSound && activeSound !== fakeWhiteAudio) {
        activeSound.pause();
        activeSound.currentTime = 0;
    }
    if (activeType === 'whitenoise') {
        stopWhiteNoise();
    }
    activeSound = null;
    activeType = null;
    document.querySelectorAll('.playing-indicator').forEach(el => el.textContent = '');
    for (let vid of Object.values(videos)) {
        if (vid) vid.classList.remove('active');
    }
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        document.getElementById('timerDisplay').textContent = '';
    }
}

// Sleep timer
function setTimer(minutes) {
    if (timerInterval) clearInterval(timerInterval);
    if (minutes <= 0) {
        document.getElementById('timerDisplay').textContent = '';
        return;
    }
    const end = Date.now() + minutes * 60 * 1000;
    const updateDisplay = () => {
        const remaining = Math.max(0, end - Date.now());
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        document.getElementById('timerDisplay').textContent = `${mins}:${secs.toString().padStart(2,'0')}`;
        if (remaining <= 0) {
            clearInterval(timerInterval);
            stopAllSounds();
            document.getElementById('timerDisplay').textContent = 'Time’s up';
        }
    };
    updateDisplay();
    timerInterval = setInterval(updateDisplay, 1000);
}

// Event listeners
document.getElementById('setTimerBtn').addEventListener('click', () => {
    const mins = parseInt(document.getElementById('timerMinutes').value, 10);
    setTimer(mins);
});
document.getElementById('stopAllBtn').addEventListener('click', stopAllSounds);

// Blackout mode toggle
const blackoutBtn = document.getElementById('blackoutBtn');
blackoutBtn.addEventListener('click', () => {
    document.body.classList.toggle('blackout-mode');
    blackoutBtn.textContent = document.body.classList.contains('blackout-mode') ? '☀️ Wake up' : '🌙 Black screen mode';
});

// Dynamically create sound cards
const soundList = [
    { id: 'rain', name: 'Rainfall', desc: 'Gentle shower on leaves', emoji: '🌧️' },
    { id: 'fire', name: 'Fireplace', desc: 'Crackling warmth', emoji: '🕯️🔥' },
    { id: 'ocean', name: 'Ocean Waves', desc: 'Calming surf', emoji: '🌊' },
    { id: 'forest', name: 'Forest Birds', desc: 'Soft birdsong', emoji: '🌲🐦' },
    { id: 'whitenoise', name: 'White Noise', desc: 'Soothing constant hum', emoji: '🤍' }
];

const grid = document.getElementById('soundsGrid');
soundList.forEach(s => {
    const card = document.createElement('div');
    card.className = 'sound-card';
    card.dataset.sound = s.id;
    card.innerHTML = `
        <div class="card-content">
            <span class="emoji">${s.emoji}</span>
            <h3>${s.name}</h3>
            <p>${s.desc}</p>
            <div class="controls">
                <button class="play-btn">Play</button>
                <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="0.5">
            </div>
            <div class="playing-indicator"></div>
        </div>
    `;
    const playBtn = card.querySelector('.play-btn');
    const volSlider = card.querySelector('.volume-slider');

    playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playSound(s.id);
    });

    volSlider.addEventListener('input', (e) => {
        const vol = parseFloat(e.target.value);
        if (activeType === s.id) {
            if (s.id === 'whitenoise') setWhiteNoiseVolume(vol * masterVolume);
            else if (sounds[s.id]) sounds[s.id].volume = vol * masterVolume;
        }
        // Save volume preference if needed
    });
    grid.appendChild(card);
});

// Resume audio context on first user click (required by browsers)
window.addEventListener('click', () => {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    for (let vid of Object.values(videos)) {
        if (vid && vid.classList.contains('active') && vid.paused) vid.play().catch(e=>{});
    }
});
