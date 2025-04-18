import * as quill from './quill.js'
import {handleMouseMove, handleMouseDown, handleMouseUp, mergeSelectedCells} from './table.js'
import { IndexedDBStorage } from '../IndexedDBStorage.js';


export function setupCommon() {
    document.addEventListener('mouseup', () => {
        handleMouseUp(quill.Instance);
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            document.querySelectorAll('td.selected').forEach(cell => cell.classList.remove('selected'));
        } else if (event.key === 'm' && event.ctrlKey) {
            mergeSelectedCells(quill.Instance);
        }
    });

    document.getElementById('insert-table').addEventListener('click', function (event) {
        quill.Instance.getModule('toolbar').handlers.table(event);
    });    

    document.getElementById('resetQuill').addEventListener('click', function() {
        quill.Instance.getModule('toolbar').handlers.resetQuill();
    })
    
    document.getElementById('merge-cells').addEventListener('click', function () {
        quill.Instance.getModule('toolbar').handlers.mergeCells();
    })

    document.getElementById('saveBtn').addEventListener('click', async function () {
        IndexedDBStorage.setItem('textContent', quill.Instance.root.innerHTML );
    })
    
    window.addEventListener('storage', async function (e) {
        if (e.key === 'textContent') {
            // console.log(e.newValue);
            sessionStorage.setItem('textContent', '');
            // quill.clipboard.dangerouslyPasteHTML(e.newValue);
            quill.Instance.root.innerHTML = await IndexedDBStorage.getItem('textContent');
    
        }
    });

    document.addEventListener('click', function (event) {
        if (event.target.tagName === 'TD' && event.ctrlKey) {
            event.target.classList.toggle('selected');
        } else {
            document.querySelectorAll('td.selected').forEach(cell => cell.classList.remove('selected'));
        }
    });
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
}