// ===== FONT HANDLING =====

// Remove old injected font styles
function removeExistingStyles() {
    document.querySelectorAll('#custom-font-style').forEach(el => el.remove());
}

// Apply selected font
function applyFont(font) {
    removeExistingStyles();

    const style = document.createElement('style');
    style.id = 'custom-font-style';

    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;600&display=swap');

        * {
            font-family: "${font}", sans-serif !important;
        }
    `;

    document.head.appendChild(style);
}


// ===== SHORTS REMOVAL (IMPROVED) =====

function hideShorts() {
    const selectors = [
        'ytd-reel-shelf-renderer',                 // Shorts shelf
        'ytd-rich-section-renderer',              // Homepage Shorts sections
        'a[href*="/shorts/"]',                    // Shorts links
        'ytd-video-renderer a[href*="/shorts/"]'
    ];

    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Sidebar "Shorts"
    document.querySelectorAll('ytd-mini-guide-entry-renderer').forEach(el => {
        if (el.innerText.includes('Shorts')) {
            el.style.display = 'none';
        }
    });
}

function showShorts() {
    location.reload(); // simplest and reliable restore
}


// ===== ELEMENT REMOVAL SYSTEM =====

// Remove saved elements
function removeSavedElements(selectors) {
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
    });
}


// Enable element picker
function enableElementPicker() {
    alert("Click any element to remove it");

    function handleClick(e) {
        e.preventDefault();
        e.stopPropagation();

        const el = e.target;

        const selector = getUniqueSelector(el);

        el.remove();

        chrome.storage.sync.get('blockedSelectors', ({ blockedSelectors = [] }) => {
            blockedSelectors.push(selector);
            chrome.storage.sync.set({ blockedSelectors });
        });

        document.removeEventListener('click', handleClick, true);
    }

    document.addEventListener('click', handleClick, true);
}


// Generate selector (basic but works)
function getUniqueSelector(el) {
    if (el.id) return `#${el.id}`;

    if (el.classList.length > 0) {
        return el.tagName.toLowerCase() + '.' + [...el.classList].join('.');
    }

    return el.tagName.toLowerCase();
}


// ===== INITIAL LOAD =====

chrome.storage.sync.get(
    ['selectedFont', 'shortsHidden', 'blockedSelectors'],
    ({ selectedFont, shortsHidden, blockedSelectors }) => {

        applyFont(selectedFont || 'Inter');

        if (shortsHidden) hideShorts();

        if (blockedSelectors) removeSavedElements(blockedSelectors);
    }
);


// ===== MESSAGE LISTENER =====

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'changeFont') {
        applyFont(message.font);
    }

    if (message.action === 'hideShorts') {
        hideShorts();
    }

    if (message.action === 'showShorts') {
        showShorts();
    }

    if (message.action === 'enablePicker') {
        enableElementPicker();
    }
});