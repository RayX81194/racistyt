// popup.js

// Font selection logic
document.getElementById('font-select').addEventListener('change', function () {
    const selectedFont = this.value;
    chrome.storage.sync.set({ selectedFont }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'changeFont', font: selectedFont });
        });
    });
});

// Set font selector to saved font on popup load
chrome.storage.sync.get('selectedFont', ({ selectedFont }) => {
    if (selectedFont) {
        document.getElementById('font-select').value = selectedFont;
    }
});

// Toggle shorts visibility
const toggleButton = document.getElementById('toggleButton');
const toggleIcon = document.getElementById('toggleIcon');

// Update icon based on storage state
function updateIcon(isEnabled) {
    toggleIcon.src = isEnabled ? 'assets/off.svg' : 'assets/on.svg';
}

// Set initial state on popup load
chrome.storage.sync.get('shortsHidden', ({ shortsHidden }) => {
    updateIcon(shortsHidden);
});

// Handle toggle click to update state and icon
toggleButton.addEventListener('click', () => {
    chrome.storage.sync.get('shortsHidden', ({ shortsHidden }) => {
        const newState = !shortsHidden;
        chrome.storage.sync.set({ shortsHidden: newState }, () => {
            updateIcon(newState);

            // Send message to toggle shorts visibility
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: newState ? 'hideShorts' : 'showShorts' });
            });
        });
    });
});
