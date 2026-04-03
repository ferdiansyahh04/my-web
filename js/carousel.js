// ================= CAROUSEL AUTO SCROLL =================
let currentSlide = 1;
const totalSlides = 3;
let autoScrollInterval = null;

function nextSlide() {
    currentSlide = currentSlide >= totalSlides ? 1 : currentSlide + 1;

    const radio = document.getElementById(`carousel-${currentSlide}`);
    if (radio) {
        radio.checked = true;
    }
}

function startAutoScroll() {
    stopAutoScroll();
    autoScrollInterval = setInterval(nextSlide, 5000);
}

function stopAutoScroll() {
    if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
    }
}

// ===== EXPOSE CAROUSEL FUNCTIONS =====
window.startAutoScroll = startAutoScroll;
window.stopAutoScroll = stopAutoScroll;
