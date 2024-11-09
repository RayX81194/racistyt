// content.js

// Remove existing styles to avoid duplicate fonts
function removeExistingStyles() {
    const existingStyles = document.querySelectorAll('link[rel="stylesheet"]');
    existingStyles.forEach(style => {
        if (style.href.includes('-theme.css')) {
            style.remove();
        }
    });
}

// Apply the selected font
function applyFont(font) {
    const style = document.createElement('style');
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@160..700&display=swap');
        * {
            font-family: "${font}", sans-serif !important;
        }
    `;
    document.head.appendChild(style);
}

// Retrieve saved font and apply on page load
chrome.storage.sync.get('selectedFont', ({ selectedFont }) => {
    const font = selectedFont || 'Readex Pro';
    applyFont(font);
});

// Function to toggle shorts visibility
function toggleShortsVisibility(hide) {
    document.querySelectorAll('ytd-mini-guide-entry-renderer .title').forEach((title) => {
        if (title.textContent.trim() === 'Shorts') {
            title.closest('ytd-mini-guide-entry-renderer').style.display = hide ? 'none' : '';
        }
    });
}

// Apply initial shorts visibility state
chrome.storage.sync.get('shortsHidden', ({ shortsHidden }) => {
    toggleShortsVisibility(shortsHidden);
});

// Listen for messages to update font or shorts visibility
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'changeFont') {
        removeExistingStyles();
        applyFont(message.font);
    } else if (message.action === 'hideShorts') {
        toggleShortsVisibility(true);
    } else if (message.action === 'showShorts') {
        toggleShortsVisibility(false);
    }
});
