export function showAlert(message, left, width, className='danger') {
    // Create the alert div
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-' + className;
    alertDiv.style.position = 'absolute';
    alertDiv.style.top= '20px';
    alertDiv.style.left = left;
    alertDiv.style.width = width;
    alertDiv.style.zIndex = '1000';
    alertDiv.innerText = message;

    // Append the alert div to the body
    document.body.appendChild(alertDiv);

    let hideTimeout = setTimeout(() => {
        alertDiv.remove();
    }, 3000); // Set timeout to remove the alert after 4 seconds

    // Pause timer on hover
    alertDiv.addEventListener('mouseover', () => {
        clearTimeout(hideTimeout);
    });

    // Restart timer when hover ends
    alertDiv.addEventListener('mouseout', () => {
        hideTimeout = setTimeout(() => {
            alertDiv.remove();
        }, 4000);
    });
}

export function escapeSelector(text) {
    return text.replace(/[.*+-/?^${}()|[\]\\]/g, '');
}

export function createCollapsibleSection(innerDiv, label, className = '') {
    const collapsibleDiv = document.createElement('div');

    if (className != '') collapsibleDiv.classList.add(escapeSelector(className.replace(/\s/g, '')));

    // Custom styled toggle button with a chevron indicator
    const toggleButton = document.createElement('div');
    toggleButton.classList.add('custom-toggle');

    const indicator = document.createElement('span');
    indicator.classList.add('indicator');
    indicator.innerHTML = '&#9655;';

    const buttonText = document.createElement('span');
    buttonText.classList.add('toggle-text');
    buttonText.textContent = label;

    toggleButton.appendChild(indicator);
    toggleButton.appendChild(buttonText);

    toggleButton.addEventListener('click', () => {
        const isExpanded = innerDiv.style.maxHeight && innerDiv.style.maxHeight !== '0px';

        if (isExpanded) {
            // Collapse
            requestAnimationFrame(() => {
                innerDiv.style.maxHeight = '0';
            });
        } else {
            // Expand
            // getInnerDivScrollHeight(innerDiv)
            innerDiv.style.maxHeight = `${getInnerDivScrollHeight(innerDiv) * 1.2}px`; // Increase the height to ensure all content is shown
        }
        updateParentCollapsibleMaxHeight(collapsibleDiv);

        toggleButton.classList.toggle('active');
    });

    // Style the innerDiv to be collapsible
    innerDiv.style.maxHeight = '0';
    innerDiv.style.overflow = 'hidden';
    innerDiv.style.transition = 'max-height 0.3s ease';
    innerDiv.classList.add('collapsible-content');

    collapsibleDiv.appendChild(toggleButton);
    collapsibleDiv.appendChild(innerDiv);

    return collapsibleDiv;
}

export function getInnerDivScrollHeight(innerDiv) {
    let scrollHeight = innerDiv.scrollHeight;
    let collapsibles = innerDiv.querySelectorAll('.collapsible-content');
    collapsibles.forEach(collapsible => {
        const isExpanded = collapsible.style.maxHeight && collapsible.style.maxHeight !== '0px';
        if (isExpanded) scrollHeight += getInnerDivScrollHeight(collapsible);
    });
    return scrollHeight;
}

export function updateSelfCollapsibleMaxHeight(collapsibleDiv) {
    collapsibleDiv.querySelector('.collapsible-content').style.maxHeight = `${getInnerDivScrollHeight(collapsibleDiv)}px`;
    updateParentCollapsibleMaxHeight(collapsibleDiv);
}

export function updateParentCollapsibleMaxHeight(collapsibleDiv) {
    let parent = collapsibleDiv.parentElement;
    while (parent && parent.classList.contains('collapsible-content')) {
        parent.style.maxHeight = `${getInnerDivScrollHeight(parent)}px`;
        parent = parent.parentElement;
    }
}