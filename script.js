/**
 * Configuration Constant
 * The requested YouTube playlist ID
 */
const PLAYLIST_ID = "PLQMOvIibwSoQ";

// UI Elements
const ui = {
    time: document.getElementById('ind-time'),
    trackTitle: document.getElementById('track-title'),
    trackArtist: document.getElementById('track-artist'),
    trackArt: document.getElementById('track-art'),
    trackArtGlow: document.getElementById('track-art-glow'),
    timeCurrent: document.getElementById('time-current'),
    timeTotal: document.getElementById('time-total'),
    progressWrapper: document.getElementById('progress-wrapper'),
    progressFill: document.getElementById('progress-fill'),
    btnPlayPause: document.getElementById('btn-play-pause'),
    iconPlayPause: document.getElementById('icon-play-pause'),
    btnNext: document.getElementById('btn-next'),
    btnPrev: document.getElementById('btn-prev'),
    btnShuffle: document.getElementById('btn-shuffle'),
    playerFooter: document.querySelector('.music-player')
};

let player;
let progressInterval;
let isShuffled = true;

// 1. Time Logic (Indian Standard Time)
function updateIndianTime() {
    const options = { 
        timeZone: 'Asia/Kolkata', 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
    };
    ui.time.innerText = new Date().toLocaleTimeString('en-IN', options).toLowerCase();
}
setInterval(updateIndianTime, 1000);
updateIndianTime();

// 2. YouTube IFrame API Initialization
function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Called automatically by YouTube API script when ready
window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('yt-player', {
        height: '10',
        width: '10',
        playerVars: {
            listType: 'playlist',
            list: PLAYLIST_ID,
            playsinline: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            iv_load_policy: 3
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
};

// 3. Player Event Handlers
function onPlayerReady(event) {
    // Enable shuffle by default
    player.setShuffle(isShuffled);
    ui.btnShuffle.classList.toggle('active', isShuffled);
    
    // Attempt Autoplay
    // Browsers often block autoplay without user interaction.
    player.playVideo();
    
    // Bind UI Buttons
    ui.btnPlayPause.addEventListener('click', togglePlay);
    ui.btnNext.addEventListener('click', () => player.nextVideo());
    ui.btnPrev.addEventListener('click', () => player.previousVideo());
    ui.btnShuffle.addEventListener('click', toggleShuffle);
    
    // Bind Progress Bar seeking
    ui.progressWrapper.addEventListener('click', handleSeek);
}

function onPlayerStateChange(event) {
    switch(event.data) {
        case YT.PlayerState.PLAYING:
            ui.iconPlayPause.classList.replace('ph-play', 'ph-pause');
            ui.playerFooter.classList.add('is-playing');
            updateMetadata();
            startProgressBar();
            break;
        case YT.PlayerState.PAUSED:
            ui.iconPlayPause.classList.replace('ph-pause', 'ph-play');
            ui.playerFooter.classList.remove('is-playing');
            stopProgressBar();
            break;
        case YT.PlayerState.ENDED:
            // Auto advance happens natively with playlists, but we reset UI
            stopProgressBar();
            ui.progressFill.style.width = '0%';
            break;
        case YT.PlayerState.BUFFERING:
            // Optional buffering state could be added here
            break;
    }
}

function onPlayerError(event) {
    ui.trackTitle.innerText = "The highway is quiet right now.";
    ui.trackArtist.innerText = "Track unavailable or blocked.";
}

// 4. UI Updates
function updateMetadata() {
    const data = player.getVideoData();
    if (data && data.video_id) {
        // Truncate logic is handled by CSS .truncate
        ui.trackTitle.innerText = data.title || "Unknown Title";
        ui.trackArtist.innerText = data.author || "Unknown Artist";
        
        // Fetch highest quality thumbnail available
        const thumbnailUrl = `https://i.ytimg.com/vi/${data.video_id}/mqdefault.jpg`;
        ui.trackArt.src = thumbnailUrl;
        ui.trackArtGlow.style.backgroundImage = `url(${thumbnailUrl})`;
    }
    
    const duration = player.getDuration();
    ui.timeTotal.innerText = formatTime(duration);
}

function togglePlay() {
    if (player.getPlayerState() === YT.PlayerState.PLAYING) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}

function toggleShuffle() {
    isShuffled = !isShuffled;
    player.setShuffle(isShuffled);
    ui.btnShuffle.classList.toggle('active', isShuffled);
}

function handleSeek(e) {
    if (!player || player.getPlayerState() !== YT.PlayerState.PLAYING) return;
    
    const rect = ui.progressWrapper.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    const seekTime = percent * player.getDuration();
    
    player.seekTo(seekTime, true);
    updateProgressBarUI();
}

// 5. Progress Bar Engine
function startProgressBar() {
    stopProgressBar();
    progressInterval = setInterval(updateProgressBarUI, 500);
}

function stopProgressBar() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
}

function updateProgressBarUI() {
    if (player && player.getCurrentTime) {
        const current = player.getCurrentTime();
        const duration = player.getDuration();
        
        if (duration > 0) {
            const percent = (current / duration) * 100;
            ui.progressFill.style.width = `${percent}%`;
            ui.timeCurrent.innerText = formatTime(current);
        }
    }
}

// Formatting Helper
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Init
loadYouTubeAPI();
