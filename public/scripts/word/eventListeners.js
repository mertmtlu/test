// eventListeners.js

import { handleDocxImport, writeFile } from './helpers.js';
import { IndexedDBStorage } from '../IndexedDBStorage.js';
import { showAlert } from '../utilities.js';
import { saveTemp } from '../database.js';

export function setupEventListeners() {
    //#region Elements

    const templateDropdown = document.getElementById('templateDropdown');
    const saveTemplateBtn = document.getElementById('saveTemplateBtn');
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    const importDocx = document.getElementById('importDocx');
    const importConfig = document.getElementById('importConfig');
    const fileInput = document.getElementById('fileInput');
    //#endregion

    //#region Event Listeners
    document.getElementById('toggleBtn').addEventListener('click', function() { // TODO there is a bug with this I dont know what it is.
        var asideMenu = document.getElementById('asideMenu');
        asideMenu.classList.toggle('open');
    });

    templateDropdown.addEventListener('change', async () => {
        let data = '';
        IndexedDBStorage.setItem('textContent', data);
        sessionStorage.setItem('textContent', '');

        data = templateDropdown.value;

        await IndexedDBStorage.setItem('textContent', data);
        sessionStorage.setItem('textContent', 'changed');
    });


    saveTemplateBtn.addEventListener('click', async () => {
        const textContent = await IndexedDBStorage.getItem('textContent');
        const templateName = prompt("Enter template name:");

        const existingOption = Array.from(templateDropdown.options).find(option => option.text === templateName);
        if (existingOption) {
            showAlert('Aynı adı kullanan bir şablon zaten mevcut.', '55%', '23%');
            return;
        }

        saveTemp(templateName, textContent);

        const newOption = document.createElement('option');
        newOption.text = templateName;
        newOption.value = textContent;
        templateDropdown.add(newOption);
    });

    saveConfigBtn.addEventListener('click', async () => {
        const textContent = await IndexedDBStorage.getItem('textContent') || '';
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'config.txt'; // The name of the file to download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Clean up the URL object
    });

    importDocx.addEventListener('click', () => {
        fileInput.click();
        fileInput.value = '';
    });

    fileInput.addEventListener('change', handleDocxImport);

    importConfig.addEventListener('change', (event) => {
        const file = event.target.files[0];
        writeFile(file);
    });

    window.addEventListener('message', (event) => {
        if (event.data.action === 'viewReport') {
            window.location.href = '../../frames/manualLayout.html';
        }
    });

    //#endregion
}