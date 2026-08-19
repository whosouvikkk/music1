// ==========================================
// CONFIGURATION
// ==========================================
const PLAYLIST_ID = "PLHfO6lzPQFTm2FvDcmGtZPVeVAHCMqI8Y";

// Because we are NOT using the YouTube API, we cannot fetch the names automatically.
// We must write the song names manually. 
// The order of these songs MUST match the order in your YouTube playlist!
const MY_SONGS = [
    { title: "First Song Name", artist: "Artist Name" },
    { title: "Second Song Name", artist: "Artist Name" },
    { title: "Third Song Name", artist: "Artist Name" },
    { title: "Fourth Song Name", artist: "Artist Name" }
    // Add as many as you have in your playlist...
];

// ==========================================
// DOM ELEMENTS
// ==========================================
const landingView = document.getElementById('landing-view');
const chatView = document.getElementById('chat-view');
const startBtn = document.getElementById('start-btn');
const backBtn = document.getElementById('back-btn');
const songListContainer = document.getElementById('song-list');

let currentSongIndex = -1;

startBtn.addEventListener('click', () => {
    landingView.classList.remove('active');
    landingView.classList.add('hidden');
    chatView.classList.remove('hidden');
    chatView.classList.add('active');
    
    loadYouTubeAPI();
});

backBtn.addEventListener('click', () => {
    chatView.classList.remove('active');
    chatView.classList.add('hidden');
    landingView.classList.remove('hidden');
    landingView.classList.add('active');
});

// ==========================================
// RENDER CUSTOM SONG LIST
// ==========================================
function renderSongList() {
    songListContainer.innerHTML = ''; // Clear it

    MY_SONGS.forEach((song, index) => {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.id = `song-card-${index}`;
        
        card.innerHTML = `
            <div class="song-icon">🎵</div>
            <div class="song-info">
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
            </div>
        `;

        card.addEventListener('click', () => {
            playSongAtIndex(index);
        });

        songListContainer.appendChild(card);
    });
}

function updateActiveSongUI(index) {
    // Remove playing class from all
    document.querySelectorAll('.song-card').forEach(card => card.classList.remove('playing'));
    
    // Add playing class to current
    const activeCard = document.getElementById(`song-card-${index}`);
    if (activeCard) {
        activeCard.classList.add('playing');
    }
}

// ==========================================
// YOUTUBE PLAYER (HIDDEN)
// ==========================================
let ytPlayer;
let apiLoaded = false;

function loadYouTubeAPI() {
    renderSongList(); // Draw the UI cards

    if (apiLoaded) return;
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    apiLoaded = true;
}

window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('youtube-player', {
        height: '1',
        width: '1',
        playerVars: {
            listType: 'playlist',
            list: PLAYLIST_ID,
            playsinline: 1, 
            controls: 0,
            rel: 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
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
    playPauseBtn.addEventListener('click', () => {
        const state = ytPlayer.getPlayerState();
        if (state === 1) { // Playing
            ytPlayer.pauseVideo();
        } else {
            // If they click play and nothing is selected, start at 0
            if (currentSongIndex === -1) playSongAtIndex(0);
            else ytPlayer.playVideo();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentSongIndex > 0) playSongAtIndex(currentSongIndex - 1);
    });

    nextBtn.addEventListener('click', () => {
        if (currentSongIndex < MY_SONGS.length - 1) playSongAtIndex(currentSongIndex + 1);
    });
}

function playSongAtIndex(index) {
    currentSongIndex = index;
    updateActiveSongUI(index);
    ytPlayer.playVideoAt(index);
}

function onPlayerStateChange(event) {
    // 1 = playing, 2 = paused
    if (event.data === 1) {
        iconPlay.classList.add('hidden');
        iconPause.classList.remove('hidden');
        
        // Sync UI with YouTube's current playlist index (in case it auto-plays next)
        const ytIndex = ytPlayer.getPlaylistIndex();
        if (ytIndex !== currentSongIndex && ytIndex !== -1) {
            currentSongIndex = ytIndex;
            updateActiveSongUI(currentSongIndex);
        }
    } else {
        iconPause.classList.add('hidden');
        iconPlay.classList.remove('hidden');
    }
}
