export function setupEventListeners(map, tmLocation) {
    document.getElementById('focus').addEventListener('click', function () {
        map.setView(tmLocation, 17);
    });
}

export function asideMenuEventListeners() {
    const toggleBtn = document.getElementById('toggleBtn');
    const asideMenu = document.getElementById('asideMenu');

    // Function to toggle menu and save state to session storage
    function toggleAsideMenu() {
        asideMenu.classList.toggle('open');

        // Save current state to session storage
        const isOpen = asideMenu.classList.contains('open');
        sessionStorage.setItem('asideMenuOpen', isOpen);
    }

    // Restore menu state on initialization
    const savedState = sessionStorage.getItem('asideMenuOpen');
    if (savedState !== null) {
        if (savedState === 'true') {
            asideMenu.classList.add('open');
        } else {
            asideMenu.classList.remove('open');
        }
    }

    // Add click event listener for toggle button
    toggleBtn.addEventListener('click', toggleAsideMenu);

    document.addEventListener('keydown', function (event) {
        if (event.key === 's' || event.key === 'S') {
            if (asideMenu.classList.contains('open')) {
                // Only trigger the dblclick if the menu is open
                const tmInputSelection = document.getElementById('tm-selection');
                const dblClickEvent = new MouseEvent('dblclick', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                tmInputSelection.dispatchEvent(dblClickEvent);
            }
        }

        if (event.key === 'Escape' || event.key === 'm' || event.key === 'M') {
            // Check if a popup exists
            const existingPopup = document.querySelector('.tm-search-popup');
            if (existingPopup) {
                // If a popup exists, remove it
                document.body.removeChild(existingPopup);
            }

            if (event.key !== 'Escape') {
                toggleBtn.click();
            }
        }
    });
}