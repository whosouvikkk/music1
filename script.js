// ==========================================
// CONFIGURATION
// Put your playlist ID here
// ==========================================
const PLAYLIST_ID = "PLHfO6lzPQFTm2FvDcmGtZPVeVAHCMqI8Y";

// ==========================================
// DOM ELEMENTS & NAVIGATION
// ==========================================
const landingView = document.getElementById('landing-view');
const chatView = document.getElementById('chat-view');
const startBtn = document.getElementById('start-btn');
const backBtn = document.getElementById('back-btn');

startBtn.addEventListener('click', () => {
    landingView.classList.remove('active');
    landingView.classList.add('hidden');
    
    chatView.classList.remove('hidden');
    chatView.classList.add('active');
    
    // Load YouTube API only when user opens the chat page
    // This saves bandwidth and handles mobile autoplay rules better
    loadYouTubeAPI();
});

backBtn.addEventListener('click', () => {
    chatView.classList.remove('active');
    chatView.classList.add('hidden');
    
    landingView.classList.remove('hidden');
    landingView.classList.add('active');
});

// ==========================================
// YOUTUBE PLAYER API SETUP
// ==========================================
let ytPlayer;
let apiLoaded = false;

function loadYouTubeAPI() {
    if (apiLoaded) return;
    
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    apiLoaded = true;

    // Timeout in case YouTube fails to load
    setTimeout(() => {
        if (!ytPlayer) {
            document.getElementById('player-error').classList.remove('hidden');
        }
    }, 5000);
}

// This function is automatically called by the YouTube API when it's ready
window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('youtube-player', {
        playerVars: {
            listType: 'playlist',
            list: PLAYLIST_ID,
            playsinline: 1, // Crucial for mobile (prevents fullscreen takeover on iOS)
            controls: 1,    // We keep native controls as a reliable fallback
            rel: 0,
            modestbranding: 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

// ==========================================
// CUSTOM CONTROLS LOGIC
// ==========================================
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');

function onPlayerReady(event) {
    console.log("YouTube Player is ready!");
    
    // Wire up custom buttons
    playPauseBtn.addEventListener('click', () => {
        const state = ytPlayer.getPlayerState();
        // 1 = playing. If playing, pause it. Otherwise, play it.
        if (state === 1) {
            ytPlayer.pauseVideo();
        } else {
            ytPlayer.playVideo();
        }
    });

    prevBtn.addEventListener('click', () => {
        ytPlayer.previousVideo();
    });

    nextBtn.addEventListener('click', () => {
        ytPlayer.nextVideo();
    });
}

function onPlayerStateChange(event) {
    // YT.PlayerState.PLAYING = 1
    // YT.PlayerState.PAUSED = 2
    // YT.PlayerState.ENDED = 0
    
    if (event.data === 1) {
        // Video is playing, show Pause icon
        iconPlay.classList.add('hidden');
        iconPause.classList.remove('hidden');
    } else {
        // Video is paused, stopped, or buffering, show Play icon
        iconPause.classList.add('hidden');
        iconPlay.classList.remove('hidden');
    }
}

function onPlayerError(event) {
    console.error("YouTube Player Error", event.data);
    document.getElementById('player-error').classList.remove('hidden');
}
