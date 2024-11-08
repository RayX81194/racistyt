// content.js

// Function to remove existing theme styles
function removeExistingStyles() {
    const existingStyles = document.querySelectorAll('link[rel="stylesheet"]');
    existingStyles.forEach(style => {
        if (style.href.includes('-theme.css')) {
            style.remove();
        }
    });
}

// Immediately apply the black theme
const theme = 'black';
removeExistingStyles();
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = chrome.runtime.getURL(`${theme}-theme.css`);
document.head.appendChild(link);

// Function to apply the selected font
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

// Retrieve and apply the selected font from storage
chrome.storage.sync.get('selectedFont', ({ selectedFont }) => {
    const font = selectedFont || 'Readex Pro'; // Default font
    applyFont(font);
});
