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
