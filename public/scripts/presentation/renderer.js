export function renderCards() {
    // Create main container
    const main = document.getElementById('main');
    main.style.width = '100vw';
    main.style.height = '100vh';
    main.style.margin = '0';
    main.style.padding = '0';
    main.style.paddingLeft = '50px';
    main.style.overflow = 'scroll';

    // Clear any existing content in the main container
    main.innerHTML = '';

    // Title Section
    const titleDiv = document.createElement('div');
    titleDiv.className = 'title';
    const titleHeader = document.createElement('h1');
    titleHeader.id = 'name';
    titleDiv.appendChild(titleHeader);
    main.appendChild(titleDiv);

    // Container for the content
    const containerContent = document.createElement('div');
    containerContent.className = 'containerContent';

    // DataTables and map section
    const dataTablesDiv = document.createElement('div');
    dataTablesDiv.className = 'dataTables';

    // First Column Layout - Deprem Performans Seviyesi
    const firstColumn = document.createElement('div');
    firstColumn.className = 'columnLayout';

    const eqPerfHeader = document.createElement('h5');
    eqPerfHeader.textContent = 'Deprem Performans Seviyesi';

    const eqPerfTable = document.createElement('table');
    eqPerfTable.id = 'eqPerf';
    eqPerfTable.className = 'display';

    const reportButton = document.createElement('button');
    reportButton.id = 'getCheckedRowsBtn';
    reportButton.className = 'btn btn-block btn-primary';
    reportButton.textContent = 'Rapor Oluştur';
    reportButton.style.display = 'none'; //TODO Report button visibility

    const naturalDisasterTable = document.createElement('table');
    naturalDisasterTable.id = 'naturalDisaster';
    naturalDisasterTable.className = 'display';
    naturalDisasterTable.style.marginTop = '50px';

    firstColumn.appendChild(eqPerfHeader);
    firstColumn.appendChild(eqPerfTable);
    firstColumn.appendChild(reportButton);
    firstColumn.appendChild(naturalDisasterTable);

    // Second Column Layout - Map Section
    const secondColumn = document.createElement('div');
    secondColumn.className = 'columnLayout map-container';

    const mapDiv = document.createElement('div');
    mapDiv.id = 'map';

    const focusButton = document.createElement('button');
    focusButton.id = 'focus';
    focusButton.className = 'btn btn-block btn-secondary';
    focusButton.textContent = 'Tekrar Odaklan';

    secondColumn.appendChild(mapDiv);
    secondColumn.appendChild(focusButton);

    // Third Column Layout - Bertaraf Maliyeti
    const thirdColumn = document.createElement('div');
    thirdColumn.className = 'columnLayout';

    const riskCostHeader = document.createElement('h5');
    riskCostHeader.textContent = 'Bertaraf Maliyeti';

    const riskCostTable = document.createElement('table');
    riskCostTable.id = 'tmEqRiskCost';
    riskCostTable.className = 'display';

    const naturalDisCostTable = document.createElement('table');
    naturalDisCostTable.id = 'tmNaturalDisCost';
    naturalDisCostTable.className = 'display';
    naturalDisCostTable.style.marginTop = '50px';

    thirdColumn.appendChild(riskCostHeader);
    thirdColumn.appendChild(riskCostTable);
    thirdColumn.appendChild(naturalDisCostTable);

    // Append all columns to the dataTablesDiv
    dataTablesDiv.appendChild(firstColumn);
    dataTablesDiv.appendChild(secondColumn);
    dataTablesDiv.appendChild(thirdColumn);

    // Append the dataTablesDiv to the containerContent
    containerContent.appendChild(dataTablesDiv);

    // Append the containerContent to the main container
    main.appendChild(containerContent);
}

export function disposeAllRenders() {
    const mainDiv = document.getElementById('main');

    if (mainDiv) {
        // Iterate through all child nodes
        const childNodes = Array.from(mainDiv.childNodes);

        childNodes.forEach(child => {
            // Recursively remove event listeners for all child elements
            removeAllEventListeners(child);

            // Remove the child element from the DOM
            mainDiv.removeChild(child);
        });
    }
}

// Helper function to remove all event listeners from an element
function removeAllEventListeners(element) {
    const clonedElement = element.cloneNode(true);
    element.parentNode.replaceChild(clonedElement, element);
}

export function renderPdf(pdfUrl) {
    // console.log(pdfUrl);

    // Create main container
    const main = document.getElementById('main');
    main.style.width = '100vw';
    main.style.height = '100vh';
    main.style.margin = '0';
    main.style.padding = '0';
    main.style.overflow = 'hidden';

    // Clear any existing content in the main container
    main.innerHTML = '';

    // PDF Container
    const pdfContainer = document.createElement('div');
    pdfContainer.className = 'pdf-container';
    pdfContainer.style.position = 'relative';
    pdfContainer.style.width = '100%';
    pdfContainer.style.height = '100%';

    // PDF Iframe
    const iframe = document.createElement('iframe');
    iframe.src = pdfUrl;
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    // Append iframe to PDF container
    pdfContainer.appendChild(iframe);

    // Append PDF container to main container
    main.appendChild(pdfContainer);
}

export function renderIcmal() {
    // Create main container
    const main = document.getElementById('main');
    main.style.width = '100vw';
    main.style.height = '100vh';
    main.style.margin = '0';
    main.style.padding = '0';
    main.style.paddingLeft = '50px';
    main.style.overflow = 'scroll';

    // Clear any existing content in the main container
    main.innerHTML = '';

    // Title Section
    const titleDiv = document.createElement('div');
    titleDiv.className = 'title';
    const titleHeader = document.createElement('h1');
    titleHeader.id = 'name';
    titleDiv.appendChild(titleHeader);
    main.appendChild(titleDiv);

    // Container for the content
    const containerContent = document.createElement('div');
    containerContent.className = 'containerContent';

    // Create first row for the tables
    const firstRow = document.createElement('div');
    firstRow.className = 'row';
    firstRow.id = 'firstRow';
    firstRow.style.width = '100vw';
    firstRow.style.paddingLeft = '30px';
    firstRow.style.paddingRight = '30px';

    // First column of first row
    const firstColFirstRow = document.createElement('div');
    firstColFirstRow.className = 'col';
    const firstTable = document.createElement('table');
    firstTable.id = 'table1';
    firstTable.className = 'display';
    firstColFirstRow.appendChild(firstTable);
    firstColFirstRow.style.width = '20vw';
    firstRow.appendChild(firstColFirstRow);

    // Second column of first row
    const secondColFirstRow = document.createElement('div');
    secondColFirstRow.className = 'col';
    const secondTable = document.createElement('table');
    secondTable.id = 'table2';
    secondTable.className = 'display';
    secondTable.style.marginTop = '0px';
    secondTable.style.paddingTop = '0px';
    const thirdTable = document.createElement('table');
    thirdTable.id = 'table3';
    thirdTable.className = 'display';
    secondColFirstRow.style.width = '20vw';
    secondColFirstRow.appendChild(secondTable);
    secondColFirstRow.appendChild(thirdTable);
    firstRow.appendChild(secondColFirstRow);

    const thirdColFirstRow = document.createElement('div');
    thirdColFirstRow.className = 'col';
    thirdColFirstRow.id = 'map';
    thirdColFirstRow.classList.add('map-container');
    thirdColFirstRow.style.width = '60vw';
    // const focusButton = document.createElement('button');
    // focusButton.id = 'focus';
    // focusButton.className = 'btn btn-block btn-secondary';
    // focusButton.textContent = 'Tekrar Odaklan'
    firstRow.appendChild(thirdColFirstRow);

    // Add the first row to the container content
    containerContent.appendChild(firstRow);

    // Create second row for the tables
    const secondRow = document.createElement('div');
    secondRow.className = 'row';

    // Loop to create 5 tables side by side
    for (let i = 1; i <= 5; i++) {
        const col = document.createElement('div');
        col.className = 'col';
        const table = document.createElement('table');
        table.id = `table${i + 3}`;
        table.className = 'display';
        col.appendChild(table);
        secondRow.appendChild(col);
        col.style.width = '20vw'; // Set a specific width for each column
    }

    // Add the second row to the container content
    containerContent.appendChild(secondRow);

    // Append the container content to the main element
    main.appendChild(containerContent);
}
