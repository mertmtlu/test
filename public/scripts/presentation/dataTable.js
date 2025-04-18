import { renderPdf } from "./renderer.js";
import { searchPdf, searchCadFile, downloadCadFile } from "../database.js";
import { extractTMNumbers } from "../map/utilities.js";
import { showAlert } from "../utilities.js";

const finder = {
    'KUMANDA': '01',
    'KAPALI ŞALT': '02',
    'METALCLAD': '03',
    'KUMANDA+MC': '04',
    'ŞALT (RÖLE)': '05',
    'HİZMET (TELEKOM)': '06',
    'GIS-154': '07',
    'GIS-400': '08',
    'GÜVENLİK': '10',
    'TRAFO BİNASI': '11'
}

/**
 * Creates and displays a popup showing CAD files
 * @param {Array} cadFiles - Array of CAD files to display
 * @param {Event} originalEvent - The original right-click event for positioning
 */
export function showCadFilesPopup(cadFiles, originalEvent) {
    // Remove any existing popups
    const existingPopup = document.querySelector('.cad-files-popup');
    if (existingPopup) {
        document.body.removeChild(existingPopup);
    }

    // Create popup container
    const popup = document.createElement('div');
    popup.className = 'cad-files-popup';

    // Style the popup
    Object.assign(popup.style, {
        position: 'absolute',
        zIndex: '1000',
        background: 'white',
        border: '1px solid #ccc',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        borderRadius: '4px',
        minWidth: '250px',
        fontFamily: 'Arial, sans-serif'
    });

    // Create header
    const header = document.createElement('div');
    header.textContent = 'Rölöveler';

    // Style the header
    Object.assign(header.style, {
        fontWeight: 'bold',
        padding: '10px',
        borderBottom: '1px solid #ccc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px 4px 0 0'
    });

    popup.appendChild(header);

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';

    // Style close button
    Object.assign(closeButton.style, {
        background: 'none',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        color: '#555',
        padding: '0 5px'
    });

    closeButton.onclick = () => document.body.removeChild(popup);
    header.appendChild(closeButton);

    // Create content container
    const content = document.createElement('div');
    content.style.padding = '10px';

    // Check if we have any files
    if (cadFiles && cadFiles.length > 0) {
        // Create file list
        const fileList = document.createElement('div');

        // Process each file
        cadFiles.forEach(file => {
            // Create file item element
            const fileItem = document.createElement('div');

            // Style file item
            Object.assign(fileItem.style, {
                padding: '8px',
                marginBottom: '5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '3px'
            });

            // Determine file properties
            let fileName, fileExtension;

            if (typeof file === 'object' && file !== null) {
                fileName = file.name || file.fileName || 'File';
                fileExtension = file.extension || '';

                // Try to extract extension from name if not provided
                if (!fileExtension && fileName.includes('.')) {
                    const parts = fileName.split('.');
                    fileExtension = parts[parts.length - 1].toLowerCase();
                }
            } else if (typeof file === 'string') {
                // Extract filename from path
                if (file.includes('/') || file.includes('\\')) {
                    const pathParts = file.split(/[/\\]/);
                    fileName = pathParts[pathParts.length - 1];
                } else {
                    fileName = file;
                }

                // Extract extension
                if (fileName.includes('.')) {
                    const parts = fileName.split('.');
                    fileExtension = parts[parts.length - 1].toLowerCase();
                } else {
                    fileExtension = '';
                }
            } else {
                // Fallback for unexpected types
                fileName = String(file);
                fileExtension = '';
            }

            // Create icon based on file extension
            const icon = document.createElement('span');
            icon.style.marginRight = '10px';
            icon.style.fontSize = '18px';

            if (fileExtension === 'dwg') {
                icon.textContent = '📐'; // DWG icon
            } else if (fileExtension === 'dxf') {
                icon.textContent = '📏'; // DXF icon
            } else if (['dwf', 'dwfx'].includes(fileExtension)) {
                icon.textContent = '📑'; // DWF icon
            } else if (['pdf'].includes(fileExtension)) {
                icon.textContent = '📄'; // PDF icon
            } else {
                icon.textContent = '📎'; // Generic file icon
            }

            fileItem.appendChild(icon);

            // Create text container for filename
            const textContainer = document.createElement('div');
            textContainer.style.overflow = 'hidden';
            textContainer.style.textOverflow = 'ellipsis';
            textContainer.style.whiteSpace = 'nowrap';
            textContainer.textContent = fileName;

            fileItem.appendChild(textContainer);

            // Add hover effect
            fileItem.onmouseover = () => {
                fileItem.style.backgroundColor = '#f0f0f0';
            };

            fileItem.onmouseout = () => {
                fileItem.style.backgroundColor = '';
            };

            // Add click handler
            fileItem.onclick = () => {
                handleCadFileSelection(file, fileName);
                document.body.removeChild(popup);
            };

            fileList.appendChild(fileItem);
        });

        content.appendChild(fileList);
    } else {
        // No files message
        const noFiles = document.createElement('div');
        noFiles.textContent = 'Dosya bulunamadı.';
        noFiles.style.padding = '10px';
        noFiles.style.color = '#888';
        content.appendChild(noFiles);
    }

    popup.appendChild(content);

    // Add to document body
    document.body.appendChild(popup);

    // Position popup near the original right-click
    if (originalEvent) {
        popup.style.left = `${originalEvent.clientX}px`;
        popup.style.top = `${originalEvent.clientY}px`;
    } else {
        // Center if no event
        popup.style.left = '50%';
        popup.style.top = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
    }

    // Keep popup within viewport
    const rect = popup.getBoundingClientRect();

    if (rect.right > window.innerWidth) {
        popup.style.left = `${window.innerWidth - rect.width - 10}px`;
    }

    if (rect.bottom > window.innerHeight) {
        popup.style.top = `${window.innerHeight - rect.height - 10}px`;
    }

    // Event listener to close when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closePopup(e) {
            if (!popup.contains(e.target)) {
                if (document.body.contains(popup)) {
                    document.body.removeChild(popup);
                }
                document.removeEventListener('click', closePopup);
            }
        });
    }, 100); // Small delay to prevent immediate closing

    // Event listener to close on ESC key
    document.addEventListener('keydown', function handleEsc(e) {
        if (e.key === 'Escape') {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
            }
            document.removeEventListener('keydown', handleEsc);
        }
    });

    document.addEventListener("wheel", function handleWheel(event) {
        if (document.body.contains(popup)) {
            document.body.removeChild(popup);
        }
        document.removeEventListener('wheel', handleWheel);
    });
}

/**
 * Handles user selection of a CAD file
 * @param {Object|String} file - The selected CAD file
 */
function handleCadFileSelection(file, fileName) {
    // Get file path
    let filePath;
    if (typeof file === 'object' && file !== null) {
        filePath = file.path || file.url || file.name || file.toString();
    } else {
        filePath = String(file);
    }

    downloadCadFile(filePath, fileName); // Example: filePath = "C:\\wamp64\\www/cadFiles/TEI-B01-TM-03-SRL-M03-01-R0.dwg";
}

export function createDataTable(selector, rawData, applyConditionalStyling = '') {
    let parsedData = rawData;

    if (applyConditionalStyling == 'eqPerf') {
        parsedData = parsedData.map(row => row.slice(0, -1));
        parsedData = parsedData.map(row => row.slice(0, -1));
    }

    const columns = applyConditionalStyling === 'eqPerf'
        ? [{ title: 'Seç' }, ...parsedData[0].map(title => ({
            title: title.includes('\n')
                ? title.split('\n')
                    .map(line => line.replace(/SDS\s*=\s*/, 'S<sub>DS</sub> = '))
                    .join('<br/>')
                : title
        }))]
        : (applyConditionalStyling === 'columnless'
            ? []
            : parsedData[0].map(title => ({
                title: title.includes('\n')
                    ? title.split('\n').join('<br/>')
                    : title
            })));

    const tableData = parsedData.slice(1).map(row =>
        applyConditionalStyling == 'eqPerf' ? ['<input type="checkbox" class="row-checkbox">', ...row] : row
    );

    $(selector).addClass('center').DataTable({
        searching: false,
        paging: false,
        order: [],
        data: tableData,
        columns: columns,
        info: false,
        language: {
            emptyTable: "Herhangi bir veri bulunamadı.",
        },
        createdRow: function (row, data, dataIndex) {
            if (applyConditionalStyling == 'eqPerf') {
                $('td', row).addClass('centered-cell');
                // $('td:first-child', row).css('display', 'none');
                data.slice(1).forEach((cellData, cellIndex) => {
                    if (cellIndex > 1) {
                        const cell = $('td', row).eq(cellIndex + 1);
                        if (cellData === 'Sağlıyor') {
                            cell.css('background-color', 'rgba(0, 255, 0, 0.2)');
                        } else if (cellData === 'Sağlamıyor') {
                            cell.css('background-color', 'rgba(255, 0, 0, 0.2)');
                        } else {
                            cell.css('background-color', '#d3d3d3');
                        }
                    }

                    if (cellIndex === 1) {
                        const cell = $('td', row).eq(cellIndex + 1);
                        cell.addClass('clickable-cell');
                        cell.on('click', async function () {
                            const tmNo = sessionStorage.getItem('tmNo') ? extractTMNumbers(sessionStorage.getItem('tmNo')) : null;

                            const areaID = tmNo.number1 < 10 ? "0" + tmNo.number1 : `${tmNo.number1}`;
                            const tmID = tmNo.number2 < 10 ? "0" + tmNo.number2 : `${tmNo.number2}`;

                            const rawIndex = dataIndex + 1;

                            // console.log(rawData[rawIndex]);

                            let preference = 'M' + finder[rawData[rawIndex][rawData[rawIndex].length - 2]];
                            // console.log(rawData[rawIndex][rawData[rawIndex].length - 1]);
                            preference += rawData[rawIndex][rawData[rawIndex].length - 1] === '#1' ? '-01'
                                : rawData[rawIndex][rawData[rawIndex].length - 1] === '#2' ? '-02'
                                    : '-03';
                            const pdf = await searchPdf(areaID, tmID, 'DIR', preference);
                            if (!pdf) {
                                showAlert('Rapor bulunamadı.');
                                return;
                            }

                            renderPdf(pdf);

                        });

                        cell.on('contextmenu', async function (event) {
                            // Store the event for later use with popup positioning
                            const originalEvent = event;
                            // Prevent default context menu
                            event.preventDefault();

                            const tmNo = sessionStorage.getItem('tmNo') ? extractTMNumbers(sessionStorage.getItem('tmNo')) : null;

                            const areaID = tmNo.number1 < 10 ? "0" + tmNo.number1 : `${tmNo.number1}`;
                            const tmID = tmNo.number2 < 10 ? "0" + tmNo.number2 : `${tmNo.number2}`;

                            const rawIndex = dataIndex + 1;

                            let preference = 'M' + finder[rawData[rawIndex][rawData[rawIndex].length - 2]];
                            preference += rawData[rawIndex][rawData[rawIndex].length - 1] === '#1' ? '-01'
                                : rawData[rawIndex][rawData[rawIndex].length - 1] === '#2' ? '-02'
                                    : '-03';

                            const cadFiles = await searchCadFile(areaID, tmID, 'SRL', preference);
                            const pdfFiles = await searchCadFile(areaID, tmID, 'EK-A', preference);


                            if ((!cadFiles.files || cadFiles.count === 0) && (!pdfFiles.files || pdfFiles.count === 0)) {
                                showAlert('Eşleşen pdf dosyası veya rölöve bulunamadı.');
                                return;
                            }

                            // Show the popup with the CAD files
                            showCadFilesPopup([...cadFiles.files, ...pdfFiles.files], originalEvent); // Example cadFiles: ['file1.dwg', 'file2.dwg', ...]
                        });
                    }
                });

                document.getElementById('getCheckedRowsBtn').addEventListener('click', function () {
                    const selectedRows = getCheckedRows();

                    if (selectedRows.length === 0) {
                        alert('Lütfen en az bir satır seçin.');
                        return;
                    }

                    let buildingIDs = [];

                    selectedRows.forEach(row => {
                        buildingIDs.push(row[0]);
                    });

                    sessionStorage.setItem('buildingIDs', JSON.stringify(buildingIDs));
                    window.location.href = 'autoLayout.html';
                });
            }
            else if (applyConditionalStyling == 'naturalDisaster') {
                $('td', row).addClass('centered-cell');
                data.slice(1).forEach((cellData, cellIndex) => {
                    if (cellIndex != 0) return

                    const cell = $('td', row).eq(cellIndex + 1);
                    if (cellData === 'yüksek') {
                        cell.css('background-color', 'rgba(255, 0, 0, 0.2)');
                    }
                    else if (cellData === 'orta') {
                        cell.css('background-color', 'rgba(255, 105, 0, 0.2)');
                    }
                    else if (cellData === 'düşük') {
                        cell.css('background-color', 'rgba(245, 255, 0, 0.2)');
                    }
                    else if (cellData === 'çok düşük') {
                        cell.css('background-color', 'rgba(0, 255, 0, 0.2)');
                    }
                });
            }
        }
    });

    // console.log($(selector));
}

// Add this function to handle the button click for retrieving checked rows
export function getCheckedRows() {
    const checkedRows = [];
    $('input.row-checkbox:checked').each(function () {
        const row = $(this).closest('tr');
        const rowData = row.find('td').map(function () {
            return $(this).text();
        }).get();
        checkedRows.push(rowData.slice(1)); // Skip the checkbox column data
    });
    return checkedRows; // Returns an array of selected rows' data
}