// ---------- AUDIO SETUP ----------
const sounds = {
    rain: new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_8b6d5e6d1c.mp3?filename=rain-soft-01.mp3'),
    fire: new Audio('https://cdn.pixabay.com/download/audio/2022/05/27/audio_2a2b3c4d.mp3?filename=fireplace-crackling-01.mp3'),
    ocean: new Audio('https://cdn.pixabay.com/download/audio/2022/01/18/audio_9f9e8d7c.mp3?filename=ocean-waves-01.mp3'),
    forest: new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_4d5e6f7a.mp3?filename=forest-birds-01.mp3'),
    thunder: new Audio('https://cdn.pixabay.com/download/audio/2022/04/04/audio_1b1c2d3e.mp3?filename=thunder-rain-01.mp3'),
    campfire: new Audio('https://cdn.pixabay.com/download/audio/2022/11/22/audio_5f5e5d5c.mp3?filename=campfire-crackling-01.mp3'),
    waterfall: new Audio('https://cdn.pixabay.com/download/audio/2022/08/15/audio_3a3b3c3d.mp3?filename=waterfall-01.mp3')
};

// Loop all sounds
for (let key in sounds) {
    sounds[key].loop = true;
    sounds[key].volume = 0.5;
}

// White noise (Web Audio) as extra? But we already have 7 sounds, enough.

// Video elements mapping
const videos = {
    rain: document.getElementById('rainVideo'),
    fire: document.getElementById('fireVideo'),
    ocean: document.getElementById('oceanVideo'),
    forest: document.getElementById('forestVideo'),
    thunder: document.getElementById('thunderVideo'),
    campfire: document.getElementById('campfireVideo'),
    waterfall: document.getElementById('waterfallVideo')
};

// Preload videos & ensure they can play muted
for (let v of Object.values(videos)) {
    if (v) v.load();
}

// ---------- STATE ----------
let activeSound = null;     // Audio object currently playing
let activeType = null;      // e.g., 'rain'
let timerInterval = null;

// Master volume
const masterSlider = document.getElementById('masterVolume');
let masterVolume = 0.55;
masterSlider.addEventListener('input', (e) => {
    masterVolume = parseFloat(e.target.value);
    if (activeSound) activeSound.volume = masterVolume;
});

// Play a specific sound + activate its video background
function playSound(type) {
    // Stop current
    stopAllSounds();

    const audio = sounds[type];
    audio.volume = masterVolume;
    audio.play().catch(e => console.log("Autoplay blocked – click anywhere first", e));
    activeSound = audio;
    activeType = type;

    // Update UI indicators
    document.querySelectorAll('.sound-card').forEach(card => {
        const indicator = card.querySelector('.playing-indicator');
        if (card.dataset.sound === type) {
            indicator.textContent = '🔊 Playing...';
        } else {
            indicator.textContent = '';
        }
    });

    // Switch background video: deactivate all, activate current
    for (let vid of Object.values(videos)) {
        if (vid) vid.classList.remove('active');
    }
    if (videos[type]) {
        videos[type].classList.add('active');
        videos[type].play().catch(e => console.log("Video play error", e));
    }
}

// Stop everything (audio + videos + timer)
function stopAllSounds() {
    if (activeSound) {
        activeSound.pause();
        activeSound.currentTime = 0;
    }
    activeSound = null;
    activeType = null;

    // Clear indicators
    document.querySelectorAll('.playing-indicator').forEach(el => el.textContent = '');
    // Deactivate all videos
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
    const endTime = Date.now() + minutes * 60 * 1000;
    const updateDisplay = () => {
        const remaining = Math.max(0, endTime - Date.now());
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

// Event listeners for buttons
document.getElementById('setTimerBtn').addEventListener('click', () => {
    const mins = parseInt(document.getElementById('timerMinutes').value, 10);
    setTimer(mins);
});
document.getElementById('stopAllBtn').addEventListener('click', stopAllSounds);

// Blackout mode toggle
const blackoutBtn = document.getElementById('blackoutBtn');
blackoutBtn.addEventListener('click', () => {
    document.body.classList.toggle('blackout-mode');
    blackoutBtn.textContent = document.body.classList.contains('blackout-mode') ? '☀️ Wake up' : '🌙 Black screen';
});

// ---------- DYNAMIC CARD CREATION ----------
const soundList = [
    { id: 'rain', name: 'Rainfall', desc: 'Soft shower on leaves', emoji: '🌧️' },
    { id: 'fire', name: 'Fireplace', desc: 'Crackling warmth', emoji: '🕯️🔥' },
    { id: 'ocean', name: 'Ocean Waves', desc: 'Calming surf', emoji: '🌊' },
    { id: 'forest', name: 'Forest Stream', desc: 'Birds & gentle water', emoji: '🌲💧' },
    { id: 'thunder', name: 'Thunderstorm', desc: 'Distant rumbles', emoji: '⛈️' },
    { id: 'campfire', name: 'Campfire', desc: 'Wood crackling', emoji: '🏕️🔥' },
    { id: 'waterfall', name: 'Waterfall', desc: 'Steady white noise', emoji: '💧🏔️' }
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

    // Individual volume slider (overrides master temporarily? better: relative to master)
    volSlider.addEventListener('input', (e) => {
        const vol = parseFloat(e.target.value);
        if (activeType === s.id && sounds[s.id]) {
            sounds[s.id].volume = vol * masterVolume;
        }
        // store preference if needed
    });
    grid.appendChild(card);
});

// Unmute videos and resume audio context on first user interaction
window.addEventListener('click', () => {
    for (let vid of Object.values(videos)) {
        if (vid && vid.classList.contains('active') && vid.paused) {
            vid.play().catch(e=>{});
        }
    }
});

console.log("Sleep Sanctum ready – blurred videos & soothing sounds");
