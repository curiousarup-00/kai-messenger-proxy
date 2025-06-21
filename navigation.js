window.addEventListener('load', () => {
    console.log("D-Pad Navigation Script Initialized!");

    let focusableElements = [];
    let currentFocusIndex = -1;

    function isVisible(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.width > 0 &&
            rect.height > 0 &&
            getComputedStyle(el).visibility !== 'hidden'
        );
    }
    
    function scanFocusableElements() {
        const elements = document.querySelectorAll(
            'a[href], [role="listitem"], [role="button"], input, [contenteditable="true"], button, [aria-label*="message"], [data-visualcompletion="ignore-dynamic"]'
        );
        
        const visibleElements = Array.from(elements).filter(isVisible);

        if (document.activeElement && document.activeElement.tagName === 'INPUT' || document.activeElement.getAttribute('contenteditable') === 'true') {
            // Do not rescan or change focus if user is typing
            return;
        }

        focusableElements = visibleElements;

        if (currentFocusIndex < 0 || currentFocusIndex >= focusableElements.length) {
             currentFocusIndex = 0;
        }
       
        updateFocus();
    }

    function updateFocus() {
        focusableElements.forEach(el => el.classList.remove('dpad-focus'));
        if (currentFocusIndex >= 0 && currentFocusIndex < focusableElements.length) {
            const currentElement = focusableElements[currentFocusIndex];
            if (currentElement) {
                currentElement.classList.add('dpad-focus');
                currentElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            }
        }
    }

    document.addEventListener('keydown', (e) => {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.getAttribute('contenteditable') === 'true') && e.key !== 'Enter') {
            // If typing, let the browser handle all keys except Enter for sending
            return;
        }
        
        switch (e.key) {
            case 'ArrowUp':
                currentFocusIndex = Math.max(0, currentFocusIndex - 1);
                updateFocus();
                e.preventDefault();
                break;
            case 'ArrowDown':
                currentFocusIndex = Math.min(focusableElements.length - 1, currentFocusIndex + 1);
                updateFocus();
                e.preventDefault();
                break;
            case 'Enter':
                if (currentFocusIndex !== -1 && focusableElements[currentFocusIndex]) {
                    focusableElements[currentFocusIndex].click();
                }
                break;
        }
    });
    
    // Messenger constantly changes the page content, so we must re-scan frequently.
    setInterval(scanFocusableElements, 1500);
    // Initial scan
    setTimeout(scanFocusableElements, 500);
});