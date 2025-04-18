// main.js

import { setupEventListeners } from './eventListeners.js';
import { fetchFrom } from '../database.js';

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();

    loadTemplates();
});

async function loadTemplates() {
    const templateDropdown = document.getElementById('templateDropdown');
    templateDropdown.innerHTML = ''; // Clear existing options

    try {
        const templateFiles = (await fetchFrom(100, 'templates')).slice(1); // Fetch templates, skip column names

        const disabledOption = document.createElement('option');
        disabledOption.disabled = true;
        disabledOption.selected = true;
        disabledOption.text = 'Şablonlar';
        templateDropdown.appendChild(disabledOption);

        templateFiles.forEach(template => {
            const option = document.createElement('option');
            option.value = template[2];
            option.text = template[1];
            templateDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load templates:', error);
    }
}
