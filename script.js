document.addEventListener('DOMContentLoaded', () => {
    const videoContainer = document.getElementById('videoContainer');
    const video = document.getElementById('videoPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const restartBtn = document.getElementById('restartBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const playIndicator = document.getElementById('playIndicator');

    const iconPlay = document.getElementById('iconPlay');
    const iconPause = document.getElementById('iconPause');
    const iconExpand = document.getElementById('iconExpand');
    const iconCompress = document.getElementById('iconCompress');

    const TOP_EDGE_SECONDS = 60;      // 1 minuto para el borde superior
    const FULL_PERIMETER_SECONDS = 240; // 4 minutos para todo el contorno

    let animationFrameId = null;

    function updateIndicatorPosition() {
        const rect = videoContainer.getBoundingClientRect();
        const dotSize = 8;
        const marginX = 16;
        const marginY = 16;

        const minX = marginX;
        const minY = marginY;
        const maxX = Math.max(minX, rect.width - marginX - dotSize);
        const maxY = Math.max(minY, rect.height - marginY - dotSize);

        const rawTime = video.currentTime || 0;
        const t = rawTime % FULL_PERIMETER_SECONDS;

        let x = minX;
        let y = minY;

        if (t <= TOP_EDGE_SECONDS) {
            // Tramo 1 (0s - 60s): borde superior de izquierda a derecha
            const pTop = t / TOP_EDGE_SECONDS;
            x = minX + pTop * (maxX - minX);
            y = minY;
        } else {
            // Tramo 2 (60s - 240s): borde derecho, inferior e izquierdo hasta cerrar el contorno
            const remainingDuration = FULL_PERIMETER_SECONDS - TOP_EDGE_SECONDS;
            const pRest = (t - TOP_EDGE_SECONDS) / remainingDuration;

            const rightLen = maxY - minY;
            const bottomLen = maxX - minX;
            const leftLen = maxY - minY;
            const totalRestLen = Math.max(1, rightLen + bottomLen + leftLen);

            const d = pRest * totalRestLen;

            if (d <= rightLen) {
                // Borde derecho: de arriba hacia abajo
                x = maxX;
                y = minY + d;
            } else if (d <= rightLen + bottomLen) {
                // Borde inferior: de derecha a izquierda
                const dBottom = d - rightLen;
                x = maxX - dBottom;
                y = maxY;
            } else {
                // Borde izquierdo: de abajo hacia arriba
                const dLeft = d - rightLen - bottomLen;
                x = minX;
                y = maxY - dLeft;
            }
        }

        playIndicator.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    }

    function stepLoop() {
        updateIndicatorPosition();
        if (!video.paused && !video.ended) {
            animationFrameId = requestAnimationFrame(stepLoop);
        } else {
            animationFrameId = null;
        }
    }

    function startLoop() {
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(stepLoop);
        }
    }

    function stopLoop() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        updateIndicatorPosition();
    }

    function togglePlayPause() {
        if (video.paused || video.ended) {
            video.play();
        } else {
            video.pause();
        }
    }

    function restartVideo() {
        video.currentTime = 0;
        updateIndicatorPosition();
        video.play();
    }

    function updatePlayState(isPlaying) {
        if (isPlaying) {
            iconPlay.classList.add('hidden');
            iconPause.classList.remove('hidden');
            playIndicator.classList.add('active');
            startLoop();
        } else {
            iconPause.classList.add('hidden');
            iconPlay.classList.remove('hidden');
            playIndicator.classList.remove('active');
            stopLoop();
        }
    }

    video.addEventListener('play', () => updatePlayState(true));
    video.addEventListener('pause', () => updatePlayState(false));
    video.addEventListener('ended', () => updatePlayState(false));
    video.addEventListener('seeked', updateIndicatorPosition);

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            videoContainer.requestFullscreen().catch((err) => {
                console.error(`Error al activar pantalla completa: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    document.addEventListener('fullscreenchange', () => {
        const isFullscreen = Boolean(document.fullscreenElement);
        iconExpand.classList.toggle('hidden', isFullscreen);
        iconCompress.classList.toggle('hidden', !isFullscreen);
        updateIndicatorPosition();
    });

    window.addEventListener('resize', updateIndicatorPosition);

    playPauseBtn.addEventListener('click', togglePlayPause);
    restartBtn.addEventListener('click', restartVideo);
    video.addEventListener('click', togglePlayPause);
    fullscreenBtn.addEventListener('click', toggleFullscreen);

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlayPause();
        }
    });

    updateIndicatorPosition();
});