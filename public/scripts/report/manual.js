import * as quill from './quill.js'
import { setupCommon } from './eventListeners.js';
import { IndexedDBStorage } from '../IndexedDBStorage.js'

quill.Instance.on('text-change', (delta, oldDelta, source) => {
    IndexedDBStorage.setItem('textContent', quill.Instance.root.innerHTML);
    // console.log(quill.root.innerHTML);
});

document.getElementById('submitBtn').addEventListener('click', () => {
});

setupCommon()

window.addEventListener('message', function(event) {
    if (event.data.type === 'storageChanged') {
        quill.Instance.root.innerHTML = event.data.content;
    }
});

const data =  JSON.parse(await IndexedDBStorage.getItem('reportData'))
if (data != '' && data != null) {
    quill.Instance.root.innerHTML = data["content"];
    IndexedDBStorage.setItem('reportData', '')
}