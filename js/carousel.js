// ================= CAROUSEL AUTO SCROLL =================
// Carousel radio buttons no longer exist in the current HTML.
// These functions are kept as no-ops so callers don't throw errors.

function startAutoScroll() { /* no-op */ }
function stopAutoScroll()  { /* no-op */ }

// ===== EXPOSE CAROUSEL FUNCTIONS =====
window.startAutoScroll = startAutoScroll;
window.stopAutoScroll = stopAutoScroll;
