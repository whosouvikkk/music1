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

// Lightweight visit notification.
// The Discord webhook itself is kept server-side in /api/visit.js,
// so it is never exposed in the browser source.
function trackWebsiteVisit() {
    try {
        fetch('/api/visit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                referrer: document.referrer || 'Direct',
                page: window.location.pathname || '/'
            }),
            keepalive: true
        }).catch(() => {
            // Tracking must never affect the music player or page UI.
        });
    } catch (_) {
        // Ignore tracking errors so existing site logic remains untouched.
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackWebsiteVisit, { once: true });
} else {
    trackWebsiteVisit();
}

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
    
    // Start with a different/random playlist item on each page load.
    // Shuffle remains enabled, while explicitly choosing a random starting
    // position prevents the site from always opening on the same song.
    startRandomTrack();
    
    // Bind UI Buttons
    ui.btnPlayPause.addEventListener('click', togglePlay);
    ui.btnNext.addEventListener('click', playNextWithWrap);
    ui.btnPrev.addEventListener('click', playPreviousWithWrap);
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
            // Never leave the player stopped at the playlist boundary.
            // If the current track was the final item, start again from
            // the beginning. Otherwise let YouTube continue normally.
            stopProgressBar();
            ui.progressFill.style.width = '0%';

            if (isAtPlaylistEnd()) {
                playPlaylistIndex(0);
            }
            break;
        case YT.PlayerState.BUFFERING:
            // Optional buffering state could be added here
            break;
    }
}

function onPlayerError(event) {
    ui.trackTitle.innerText = "The night is still";
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

function startRandomTrack() {
    // YouTube can need a moment to populate the playlist after onReady.
    // Keep the existing player/API logic intact and only choose the
    // starting position randomly.
    const chooseRandomTrack = () => {
        if (!player || typeof player.getPlaylist !== 'function') return;

        const playlist = player.getPlaylist();
        if (playlist && playlist.length > 0) {
            const randomIndex = Math.floor(Math.random() * playlist.length);
            playPlaylistIndex(randomIndex);
        } else {
            // Fallback to the normal player behavior if the playlist
            // has not populated yet.
            player.playVideo();
        }
    };

    setTimeout(chooseRandomTrack, 250);
}

function playPlaylistIndex(index) {
    if (!player || typeof player.playVideoAt !== 'function') return;
    player.playVideoAt(index);
}

function getPlaylistLength() {
    if (!player || typeof player.getPlaylist !== 'function') return 0;
    const playlist = player.getPlaylist();
    return Array.isArray(playlist) ? playlist.length : 0;
}

function getCurrentPlaylistIndex() {
    if (!player || typeof player.getPlaylistIndex !== 'function') return -1;
    return player.getPlaylistIndex();
}

function isAtPlaylistEnd() {
    const length = getPlaylistLength();
    const index = getCurrentPlaylistIndex();
    return length > 0 && index >= length - 1;
}

function playNextWithWrap() {
    const length = getPlaylistLength();
    const index = getCurrentPlaylistIndex();

    if (length > 0 && index >= length - 1) {
        // Next from the final song wraps to the first song.
        playPlaylistIndex(0);
    } else {
        player.nextVideo();
    }
}

function playPreviousWithWrap() {
    const length = getPlaylistLength();
    const index = getCurrentPlaylistIndex();

    if (length > 0 && index <= 0) {
        // Previous from the first song wraps to the final song.
        playPlaylistIndex(length - 1);
    } else {
        player.previousVideo();
    }
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
