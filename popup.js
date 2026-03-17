// FONT CHANGE
const fontSelect = document.getElementById('font-select');

fontSelect.addEventListener('change', function () {
    const selectedFont = this.value;

    chrome.storage.sync.set({ selectedFont });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'changeFont',
            font: selectedFont
        });
    });
});

// Load saved font
chrome.storage.sync.get('selectedFont', ({ selectedFont }) => {
    if (selectedFont) {
        fontSelect.value = selectedFont;
    }
});


// SHORTS TOGGLE (NEW SWITCH)
const toggleSwitch = document.getElementById('toggleSwitch');

// Load initial state
chrome.storage.sync.get('shortsHidden', ({ shortsHidden }) => {
    toggleSwitch.checked = !!shortsHidden;
});

// On toggle change
toggleSwitch.addEventListener('change', () => {
    const isEnabled = toggleSwitch.checked;

    chrome.storage.sync.set({ shortsHidden: isEnabled });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: isEnabled ? 'hideShorts' : 'showShorts'
        });
    });
});


// ELEMENT PICKER FEATURE
const pickBtn = document.getElementById('pick-element');

if (pickBtn) {
    pickBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'enablePicker'
            });
        });
    });
}