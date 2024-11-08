document.getElementById('font-select').addEventListener('change', function () {
    const selectedFont = this.value;
    // Save the selected font to Chrome storage
    chrome.storage.sync.set({ selectedFont });
});

// On popup load, set the select box to the saved font
chrome.storage.sync.get('selectedFont', ({ selectedFont }) => {
    if (selectedFont) {
        document.getElementById('font-select').value = selectedFont;
    }
});
