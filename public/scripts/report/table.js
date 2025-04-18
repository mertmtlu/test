import { showAlert } from '../utilities.js';

let isResizing = false;
let currentTable = null;
let startX, startY;
let startWidth, startHeight;
let resizingColumn = false;
let resizingRow = false;
let currentCell;

//#region Export Functions

export function reset(quill) {
    quill.root.innerHTML = '';
} 

export function insertTable(rows, cols, quill) {
    let tableHTML = '<table border="1" style="border-collapse: collapse;">';
    for (let i = 0; i < rows; i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < cols; j++) {
            tableHTML += '<td style="width: 100px; height: 30px;">&nbsp;</td>';
        }
        tableHTML += '</tr>';
    }
    tableHTML += '</table>';

    const range = quill.getSelection(true);
    const index = range ? range.index : quill.getLength();
    quill.clipboard.dangerouslyPasteHTML(index, tableHTML);
}

export function mergeSelectedCells(quill) {
    const range = quill.getSelection();
    if (!range) {
        showNotification('Please select some text.');
        return;
    }

    const [line, offset] = quill.getLine(range.index);
    if (line && line.domNode && line.domNode.tagName === 'TD') {
        const cell = line.domNode;
        const table = cell.closest('table');

        if (!table) {
            showNotification('No table found.');
            return;
        }

        const selectedCells = Array.from(table.querySelectorAll('td.selected'));

        if (selectedCells.some(cell => cell.rowSpan > 1 || cell.colSpan > 1)) {
            showNotification('Cannot merge cells with complex spans. Please select simpler cells.');
            return;
        }

        if (selectedCells.length < 2) {
            showNotification('Select at least two cells to merge.');
            return;
        }

        const cellDetails = selectedCells.map(cell => ({
            cell,
            row: cell.parentElement.rowIndex,
            col: getRealColIndex(table, cell),
            rowSpan: cell.rowSpan || 1,
            colSpan: cell.colSpan || 1
        }));

        const minRow = Math.min(...cellDetails.map(detail => detail.row));
        const minCol = Math.min(...cellDetails.map(detail => detail.col));
        const maxRow = Math.max(...cellDetails.map(detail => detail.row + detail.rowSpan - 1));
        const maxCol = Math.max(...cellDetails.map(detail => detail.col + detail.colSpan - 1));

        if (!validateRectangleSelection(table, selectedCells, minRow, maxRow, minCol, maxCol)) {
            showNotification('Selected cells do not form a rectangle.');
            return;
        }

        mergeCells(selectedCells, minRow, maxRow, minCol, maxCol);
    } else {
        showNotification('Please select table cells to merge.');
    }
}

export function getRealColIndex(table, selectedCell) {
    const rows = Array.from(table.rows);
    let maxColSize = 0;

    rows.forEach(row => {
        const currentColSize = Array.from(row.cells).reduce((acc, cell) => acc + (cell.colSpan || 1), 0);
        maxColSize = Math.max(maxColSize, currentColSize);
    });

    let cellMatrix = createCellMatrix(rows.length, maxColSize);

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        let colIndex = 0;

        for (let j = 0; j < row.cells.length; j++) {
            const cell = row.cells[j];
            let colSpn = cell.colSpan || 1;

            while (cellMatrix[i][colIndex]) {
                colIndex++;
            }

            if (cell === selectedCell) {
                return colIndex;
            }

            markCellMatrix(cellMatrix, i, colIndex, cell.rowSpan || 1, colSpn);
            colIndex += colSpn;
        }
    }

    return -1;
}

export function getCellFromRealColIndex(table, rowIndex, realColIndex) {
    const row = table.rows[rowIndex];
    if (!row) return null;

    for (let cell of row.cells) {
        if (getRealColIndex(table, cell) === realColIndex) {
            return cell;
        }
    }

    return null;
}

export function handleMouseMove(event) {
    if (isResizing && currentTable) {
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        if (resizingColumn) {
            resizeColumn(currentCell, startWidth + deltaX);
        } else if (resizingRow) {
            resizeRow(currentCell, startHeight + deltaY);
        }
    }
}

export function handleMouseDown(event) {
    const table = event.target.closest('table');
    if (!table) return;

    const cell = event.target.closest('td, th');
    if (!cell) return;

    const rect = cell.getBoundingClientRect();
    const offset = 5; // Sensitivity for detecting borders

    if (Math.abs(event.clientX - rect.right) < offset) {
        startResizing('col', event, table, cell, rect.width);
    } else if (Math.abs(event.clientY - rect.bottom) < offset) {
        startResizing('row', event, table, cell, rect.height);
    }
}

export function handleMouseUp(quill) {
    if (isResizing) {
        isResizing = false;
        resizingColumn = false;
        resizingRow = false;
        currentTable = null;
        document.querySelectorAll('table').forEach(table => table.style.cursor = '');
        sessionStorage.setItem('textContent', quill.root.innerHTML);
    }
}

export function resizeColumn(selectedCell, newWidth) {
    let table = selectedCell.parentElement.parentElement
    const cellIndex = getRealColIndex(table, selectedCell);
    const movedLine = cellIndex + selectedCell.colSpan - 1;
    let rows = Array.from(table.rows);
    const selectedCellRect = selectedCell.getBoundingClientRect();
    const delta = newWidth - selectedCellRect.width;

    let upperRowContainsMergedCell = false;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        let rowIsDone = false;
        let movingcellIndex = 0;

        for (let j = 0; j < row.cells.length; j++) {
            const currentCell = row.cells[j];
            let currentCellRect = currentCell.getBoundingClientRect();

            if (!rowIsDone) {
                movingcellIndex += currentCell.colSpan;
                if (selectedCell.parentElement.rowIndex > row.rowIndex 
                    && getRealColIndex(table, currentCell) <= getRealColIndex(table, selectedCell) 
                    && getRealColIndex(table, currentCell) + currentCell.colSpan > getRealColIndex(table, selectedCell) + selectedCell.colSpan
                ) {
                    upperRowContainsMergedCell = true;
                    currentCell.style.width = currentCellRect.width + delta + 'px';
                    // console.log(currentCell)

                }

                if (movingcellIndex - 1 == movedLine && !upperRowContainsMergedCell) {
                    currentCell.style.width = currentCellRect.width + delta + 'px';
                    rowIsDone = true;
                    // console.log(currentCell)

                }
            }
        }
    }

}

export function resizeRow(selectedCell, newHeight) {
    selectedCell.style.height = `${newHeight}px`;
}

export function arrangeTables(quill) {
    // Get all tables within the Quill editor
    const tables = quill.root.querySelectorAll('table');

    // Define default dimensions
    const defaultWidth = '200px';
    const defaultHeight = '25px';

    // Iterate through each table
    tables.forEach(table => {
        // Get all table cells (both td and th)
        const cells = table.querySelectorAll('td, th');

        // Iterate through each cell
        cells.forEach(cell => {
            // Check if the cell does not have a width style
            if (!cell.style.width) {
                cell.style.width = defaultWidth;
            }

            // Check if the cell does not have a height style
            if (!cell.style.height) {
                cell.style.height = defaultHeight;
            }
        });
    });
}

export function openTableSelector(quillInstance, event) {
    // Remove any existing selector
    const existingForm = document.getElementById('table-size-selector');
    if (existingForm) {
        document.body.removeChild(existingForm);
    }

    // Create the form container
    const form = document.createElement('div');
    form.id = 'table-size-selector';
    form.style.position = 'absolute';
    form.style.zIndex = '1000';
    form.style.backgroundColor = 'white';
    form.style.border = '1px solid #ccc';
    form.style.padding = '10px';
    form.style.borderRadius = '8px';
    form.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    form.style.display = 'grid';
    form.style.gridTemplateRows = 'auto auto';
    form.style.gridGap = '10px';

    // Position the form below the clicked element
    form.style.top = `${event.clientY + 10}px`;
    form.style.left = `${event.clientX}px`;

    // Create a title for the form
    const title = document.createElement('div');
    title.textContent = 'Tablo boyutunu seçin';
    title.style.fontSize = '16px';
    title.style.fontWeight = 'bold';
    title.style.textAlign = 'center';

    // Create the grid for table size selection
    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(10, 20px)';
    gridContainer.style.gridTemplateRows = 'repeat(10, 20px)';
    gridContainer.style.justifyContent = 'center';

    let selectedCells = { rows: 0, cols: 0 };

    // Create 10x10 grid cells
    for (let row = 1; row <= 10; row++) {
        for (let col = 1; col <= 10; col++) {
            const cell = document.createElement('div');
            cell.style.width = '20px';
            cell.style.height = '20px';
            cell.style.border = '1px solid #909090';
            cell.style.cursor = 'pointer';
            cell.style.backgroundColor = '#fff';

            cell.addEventListener('mouseover', function () {
                highlightGrid(gridContainer, row, col);
                selectedCells = { rows: row, cols: col };
            });

            cell.addEventListener('click', function () {
                insertTable(selectedCells.rows, selectedCells.cols, quillInstance);
                document.body.removeChild(form);
            });

            gridContainer.appendChild(cell);
        }
    }

    // Append elements to the form
    form.appendChild(title);
    form.appendChild(gridContainer);

    // Append form to body
    document.body.appendChild(form);

    // Set up a timeout to remove the form if the mouse is outside for 2 seconds
    let hideTimeout;
    
    form.addEventListener('mouseleave', () => {
        hideTimeout = setTimeout(() => {
            document.body.removeChild(form);
        }, 500);
    });

    form.addEventListener('mouseenter', () => {
        clearTimeout(hideTimeout);
    });
}

//#endregion

//#region Helper Functions

function highlightGrid(container, rows, cols) {
    const cells = container.children;
    for (let i = 0; i < cells.length; i++) {
        const row = Math.floor(i / 10) + 1;
        const col = (i % 10) + 1;
        if (row <= rows && col <= cols) {
            cells[i].style.backgroundColor = 'rgba(0, 0, 255, 0.25)';
        } else {
            cells[i].style.backgroundColor = '#fff';
        }
    }
}

function createCellMatrix(rows, cols) {
    return Array.from({ length: rows }, () => Array(cols).fill(false));
}

function showNotification(message) {
    

    showAlert(message, '50%', '25%');
}

function mergeCells(selectedCells, minRow, maxRow, minCol, maxCol) {
    const firstCell = selectedCells[0];
    const rowSpan = maxRow - minRow + 1;
    const colSpan = maxCol - minCol + 1;

    let content = '';
    selectedCells.forEach(cell => {
        content += cell.innerHTML + ' ';
        if (cell !== firstCell) {
            cell.remove();
        }
    });

    firstCell.rowSpan = rowSpan;
    firstCell.colSpan = colSpan;
    firstCell.innerHTML = content.trim();

    selectedCells.forEach(cell => cell.classList.remove('selected'));
}

function validateRectangleSelection(table, selectedCells, minRow, maxRow, minCol, maxCol) {
    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            const cell = getCellFromRealColIndex(table, r, c);
            if (!selectedCells.includes(cell)) {
                return false;
            }
        }
    }
    return true;
}

function startResizing(type, event, table, cell, startSize) {
    isResizing = true;
    resizingColumn = type === 'col';
    resizingRow = type === 'row';
    currentTable = table;
    currentCell = cell;
    table.style.cursor = resizingColumn ? 'col-resize' : 'row-resize';
    if (resizingColumn) {
        startX = event.clientX;
        startWidth = startSize;
    } else {
        startY = event.clientY;
        startHeight = startSize;
    }
}

function adjustColumnWidth(table, colIndex, delta) {
    Array.from(table.rows).forEach(row => {
        const cell = getCellFromRealColIndex(table, row.rowIndex, colIndex);
        if (cell) {
            const currentWidth = cell.getBoundingClientRect().width;
            cell.style.width = `${Math.max(currentWidth + delta, 30)}px`;
        }
    });
}

function markCellMatrix(matrix, row, col, rowSpan, colSpan) {
    for (let i = 0; i < rowSpan; i++) {
        for (let j = 0; j < colSpan; j++) {
            matrix[row + i][col + j] = true;
        }
    }
}

//#endregion
