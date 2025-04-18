import * as quill from './quill.js'
import { setupCommon } from './eventListeners.js';
import { createBuildingInfoEditor } from './asideMenu.js';
import { IndexedDBStorage } from '../IndexedDBStorage.js'

document.getElementById('refreshBtn').addEventListener('click', async () => {
    createBuildingInfoEditor();
    IndexedDBStorage.setItem('textContent', quill.Instance.root.innerHTML);
});

const saveInterval = 1000; // 1000 milliseconds = 1 sec

setInterval(async () => {
    IndexedDBStorage.setItem('textContent', quill.Instance.root.innerHTML);
}, saveInterval);

setupCommon();


