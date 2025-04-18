document.addEventListener('DOMContentLoaded', function () {

    //#region Elements
    const columnForm = document.getElementById('columnForm');
    const dataTable = document.getElementById('dataTable');
    const sidePanel = document.getElementById('sidePanel');
    const resizer = document.getElementById('resizer');
    const content = document.getElementById('content');
    //#endregion

    //#region Storage
    let columnNames = []; // Array to store column names from Excel
    let allRows = []; // Store all rows for filtering
    //#endregion

    //#region Functions
    async function fetchAndDisplayData() {
        try {
            let data = JSON.parse(sessionStorage.getItem('dataFromDatabase')) ? await fetchFrom(1000, sessionStorage.getItem('dataName')) :JSON.parse(sessionStorage.getItem('data'));

            columnNames = data[0];
            allRows = data.slice(1);

            columnForm.innerHTML = '';
            const xAxisDiv = document.getElementById('xAxisDiv');
            xAxisDiv.innerHTML = '';

            columnNames.forEach(columnName => {
                // Check if column name is empty
                if (columnName != "") {
                    // Create and append column names in checkboxes
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.name = 'columns';
                    checkbox.value = columnName;
                    checkbox.checked = true;
                    const label = document.createElement('label');
                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode(columnName));
                    const checkboxDiv = document.createElement('div');
                    checkboxDiv.className = 'checkbox-group';

                    checkboxDiv.appendChild(label);
                    columnForm.appendChild(checkboxDiv);

                    // Create and append column names in dropdowns
                    const xDropdownMenuItem = document.createElement('a');
                    xDropdownMenuItem.className = "dropdown-item";
                    xDropdownMenuItem.setAttribute('data-value', columnName);
                    xDropdownMenuItem.textContent = columnName;
                    xDropdownMenuItem.addEventListener('click', function () {
                        const dropdownMenu = this.closest('.dropdown-menu');
                        const dropdownToggle = dropdownMenu.previousElementSibling;
                        const selectedValue = this.getAttribute('data-value');
                        dropdownToggle.textContent = selectedValue;
                    });

                    xAxisDiv.appendChild(xDropdownMenuItem);
                }
            });

            columnForm.addEventListener('change', updateTable);
            updateTable();
        } catch (error) {
            console.log(error)
            alert('Lütfen ilk önce veri aktarın.');
        }
    }

    function updateTable() {
        if ($.fn.DataTable.isDataTable(dataTable)) {
            $(dataTable).DataTable().clear().destroy();
        }

        const selectedColumns = Array.from(columnForm.elements['columns'])
            .filter(checkbox => checkbox.checked && !allRows.every(row => row[columnNames.indexOf(checkbox.value)] === ''))
            .map(checkbox => checkbox.value);

        dataTable.innerHTML = '';


        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        selectedColumns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        dataTable.appendChild(thead);


        const tbody = document.createElement('tbody');
        allRows.forEach(row => {
            if (selectedColumns.length > 0) {
                const tr = document.createElement('tr');
                selectedColumns.forEach(column => {
                    const td = document.createElement('td');
                    let cellValue = row[columnNames.indexOf(column)];
                    // console.log(cellValue);
                    // if (!isNaN(cellValue) && cellValue.trim() !== '') {
                    //     cellValue = parseFloat(cellValue);
                    // }
                    td.textContent = cellValue;
                    tr.appendChild(td);
                });


                while (tr.children.length < selectedColumns.length) {
                    const emptyTd = document.createElement('td');
                    emptyTd.textContent = '';
                    tr.appendChild(emptyTd);
                }

                tbody.appendChild(tr);
            }
        });
        dataTable.appendChild(tbody);

        const columnDefs = selectedColumns.map((column, index) => ({
            targets: index,
            type: 'num',
            render: function (data, type, row) {
                if (data == 'NaN') {
                    return '';
                }

                return !isNaN(data) ? parseFloat(data) : data;
            }
        }));

        $(dataTable).DataTable({
            "lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]],
            searching: true,
            columnDefs: columnDefs,
            initComplete: function () {
                var api = this.api();

                var searchRow = $('<tr>').appendTo($(dataTable).find('thead'));

                api.columns().every(function () {
                    var column = this;
                    columnIndex = column.index();
                    var title = column.header().textContent;

                    // Add serachboxes
                    var input = document.createElement('input');
                    input.className = 'form-control form-control-sm';
                    input.placeholder = title;
                    input.addEventListener('keyup', function () {
                        column.search(this.value
                            .replace(/I/g, 'ı')
                            .replace(/İ/g, 'i')
                            .replace(/Ğ/g, 'ğ')
                            .replace(/Ö/g, 'ö')
                            .toLocaleLowerCase('tr'), true, true).draw();
                    });

                    $('<th>').append(input).appendTo(searchRow);

                    $(input).on('click', function (event) {
                        event.stopPropagation();
                    });

                    $(input).on('keyup', function (event) {
                        event.stopPropagation();
                    });

                    //---------------------------------------------------------

                    // let column = this;

                    // let select = document.createElement('select');
                    // columnIndex = column.index();
                    // var title = column.header().textContent;
                    // select.ariaPlaceholder = title;

                    // select.addEventListener('change', function () {
                    //     column.search(select.value, { exact: true })
                    //         .draw();
                    // });

                    // column
                    //     .data()
                    //     .unique()
                    //     .sort()
                    //     .each(function (d, j) {
                    //         select.add(new Option(d));
                    //     })
                    // $('<th>').append(select).appendTo(searchRow)
                });
            }
        });
    }

    function getRandomColor() {
        var r = Math.floor(Math.random() * 156);
        var g = Math.floor(Math.random() * 156);
        var b = Math.floor(Math.random() * 156);

        var color = '#' + r.toString(16).padStart(2, '0') +
            g.toString(16).padStart(2, '0') +
            b.toString(16).padStart(2, '0');

        return color;
    }

    async function fetchFrom(limit, dataName) {
        // Fetch data from server
        let fetchedData = [];
        let currentOffset = 0;
        let hasMoreData = true;
    
        while (hasMoreData) {
            const url = `http://${String(location.host).split(':')[0]}/fetch_data?offset=${currentOffset}&limit=${limit}&dataName=${dataName}`;
    
            const response = await fetch(url);
            const dd = await response.json();
            if (dd.length > 0) {
                fetchedData = fetchedData.concat(dd);
                currentOffset += limit;
            } else {
                hasMoreData = false;
            }
        }
    
        // Extract column names
        let data = [];
        if (fetchedData.length > 0) {
            const fetchedColumnNames = Object.keys(fetchedData[0]);
            data = fetchedData.map(obj => fetchedColumnNames.map(key => {
                // Preserve 0 values
                return obj[key] !== null && obj[key] !== undefined ? obj[key] : '';
            }));
            data.unshift(fetchedColumnNames);
        }
    
        // console.log(data);
        return data;
    }
    //#endregion

    //#region Event Listeners
    document.getElementById('checkAllButton').addEventListener('click', function () {
        Array.from(columnForm.elements['columns']).forEach(checkbox => checkbox.checked = true);
        updateTable();
    });

    document.getElementById('uncheckAllButton').addEventListener('click', function () {
        Array.from(columnForm.elements['columns']).forEach(checkbox => checkbox.checked = false);
        updateTable();
    });

    let isResizing = false;
    let lastDownX = 0;

    resizer.addEventListener('mousedown', function (e) {
        isResizing = true;
        lastDownX = e.clientX;
    });

    document.addEventListener('mousemove', function (e) {
        if (!isResizing) return;
        const offsetRight = document.body.offsetWidth - (e.clientX - document.body.offsetLeft);
        const newPanelWidth = e.clientX - sidePanel.offsetLeft;
        if (newPanelWidth > 200 && offsetRight > 100 && newPanelWidth < 500) {
            sidePanel.style.width = newPanelWidth + 'px';
            resizer.style.left = newPanelWidth + 'px';
            content.style.marginLeft = newPanelWidth + 10 + 'px'; // Adjust for the resizer width
            newWidth = document.documentElement.clientWidth - sidePanel.offsetWidth - resizer.offsetWidth;

            // Change myChart width and size if exists
            if (document.getElementById("myChart") != null) {
                document.getElementById("myChart").style.width = newWidth + "px";
                document.getElementById("myChart").style.height = "100%";
            }
        }
    });

    document.querySelectorAll('.dropdown-menu .dropdown-item').forEach(item => {
        item.addEventListener('click', function () {
            const dropdownMenu = this.closest('.dropdown-menu');
            const dropdownToggle = dropdownMenu.previousElementSibling;
            const selectedValue = this.getAttribute('data-value');
            dropdownToggle.textContent = selectedValue;
        });
    });

    document.addEventListener('mouseup', function (e) {
        isResizing = false;
    });

    document.getElementById('exportButton').addEventListener('click', function () {
        const selectedColumns = Array.from(columnForm.elements['columns'])
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        if (selectedColumns.length === 0) {
            alert('Please select at least one column to export.');
            return;
        }

        const dataTableInstance = $(dataTable).DataTable();

        const filteredData = dataTableInstance.rows({ search: 'applied' }).data().toArray();

        const exportData = filteredData;

        exportData.unshift(selectedColumns);

        const ws = XLSX.utils.aoa_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

        XLSX.writeFile(wb, 'excel.xlsx');
    });

    document.getElementById('applyChart').addEventListener('click', function () {
        const dropdownmenu = document.getElementById('chartTypeDropdown');
        const text = dropdownmenu.textContent;
        const selectedColumns = Array.from(columnForm.elements['columns'])
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        if (document.getElementById("myChart") != null) {
            document.getElementById("myChart").remove();
        }

        const canvas = document.createElement('canvas');
        canvas.id = "myChart";
        canvas.style = "width:100%; margin-top: 20px;";
        document.getElementById('chartContent').appendChild(canvas);
        let typeOfGraph = "";
        let backgroundColor = "";
        let fillBool = true;
        let disp = false;

        const chartTypeDropdown = document.getElementById('chartTypeDropdown');
        const xAxisDropdown = document.getElementById('xAxisDropdown');
        const yAxisDropdowns = document.querySelectorAll('.yAxisDropdown');

        const xAxisLabel = xAxisDropdown.textContent.trim();
        const yAxisLabels = Array.from(yAxisDropdowns).map(dropdown => dropdown.textContent.trim());

        const filteredRows = $(dataTable).DataTable().rows({ search: 'applied' }).data().toArray();
        const columnHeaders = $(dataTable).DataTable().columns().header().toArray();
        const columnNames = columnHeaders.map(header => $(header).text().trim());

        let labels = filteredRows.map(row => row[columnNames.indexOf(xAxisLabel)]);
        let datasets = yAxisLabels.map((yAxisLabel, index) => {
            let data = filteredRows.map(row => {
                let value = row[columnNames.indexOf(yAxisLabel)].replace(/TL/g, '').replace(/\./g, '').replace(/,/g, '.');
                return parseInt(value, 10);
            });
            let colors = data.map(() => getRandomColor()); // Generate a color for each data point
            return {
                label: yAxisLabel,
                data: data,
                backgroundColor: text == "Pasta Dilimi" ? colors : getRandomColor(),
                borderColor: text == "Pasta Dilimi" ? colors : getRandomColor(),
                fill: text == "Pasta Dilimi"
            };
        });

        if (xAxisLabel == "Veri Seçin" || yAxisLabels.some(label => label == "Veri Seçin")) {
            alert('Lütfen X ve Y eksenleri için uygun bir veri seçin.');
            return;
        } else if (text == "Bar Çizelgesi") {
            typeOfGraph = "bar";
            backgroundColor = "rgba(0, 123, 255, 0.6)";
            fillBool = false;
            disp = false;
        } else if (text == "Pasta Dilimi") {
            typeOfGraph = "pie";
            fillBool = true;
            disp = false;
        } else {
            alert('Lütfen uygun bir grafip tipi seçin');
            return;
        }

        new Chart(canvas, {
            type: typeOfGraph,
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Chart'
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true // Ensure the Y-axis starts at 0
                        }
                    }]
                }
            }
        });
    });

    document.getElementById('addDatasetBtn').addEventListener('click', function () {
        const yAxisDiv = document.createElement('div');
        yAxisDiv.classList.add('dropdown');
        // yAxisDiv.style.marginTop = '10px';

        const yAxisDropdownButton = document.createElement('button');
        yAxisDropdownButton.classList.add('btn', 'btn-outline-secondary', 'dropdown-toggle', 'btn-block', 'yAxisDropdown');
        yAxisDropdownButton.type = 'button';
        yAxisDropdownButton.textContent = 'Veri Seçin';
        yAxisDropdownButton.dataset.toggle = 'dropdown';
        yAxisDropdownButton.ariaHaspopup = 'true';
        yAxisDropdownButton.ariaExpanded = 'false';

        const yAxisDropdownMenu = document.createElement('div');
        yAxisDropdownMenu.classList.add('dropdown-menu');

        columnNames.forEach(columnName => {
            const yDropdownMenuItem = document.createElement('a');
            yDropdownMenuItem.className = "dropdown-item";
            yDropdownMenuItem.setAttribute('data-value', columnName);
            yDropdownMenuItem.textContent = columnName;
            yDropdownMenuItem.addEventListener('click', function () {
                const dropdownMenu = this.closest('.dropdown-menu');
                const dropdownToggle = dropdownMenu.previousElementSibling;
                const selectedValue = this.getAttribute('data-value');
                dropdownToggle.textContent = selectedValue;
            });

            yAxisDropdownMenu.appendChild(yDropdownMenuItem);
        });

        yAxisDiv.appendChild(yAxisDropdownButton);
        yAxisDiv.appendChild(yAxisDropdownMenu);

        document.getElementById('chartDropdownGroups').appendChild(yAxisDiv);
    });
    //#endregion

    fetchAndDisplayData();
});