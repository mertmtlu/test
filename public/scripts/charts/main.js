import { fetchFrom } from '../database.js';
import { extractTMNumbers } from '../map/utilities.js';

const areaID = sessionStorage.getItem('dataType');
const tms = JSON.parse(sessionStorage.getItem('tms'));

let genelBilgiRows = await fetchFrom(1000, `genel_bilgi`);
const genelBilgiColumnNames = genelBilgiRows[0];
genelBilgiRows = (genelBilgiRows.slice(1)).filter(row => row[genelBilgiColumnNames.indexOf("Bolge_no")] == parseFloat(areaID));
genelBilgiRows = genelBilgiRows.filter(row => row[genelBilgiColumnNames.indexOf("Alternatif_no")] == 0);

let groundRows = await fetchFrom(1000, `zemin_notlari`);
const groundColumnNames = groundRows[0];
groundRows = (groundRows.slice(1)).filter(row => row[groundColumnNames.indexOf("Bolge_no")] == parseFloat(areaID));
groundRows = groundRows.filter(row => row[groundColumnNames.indexOf("Alternatif_no")] == 0);

let riskRows = await fetchFrom(1000, `diger_riskler`);
const riskColumnNames = riskRows[0];
riskRows = (riskRows.slice(1)).filter(row => row[riskColumnNames.indexOf("Bolge_no")] == parseFloat(areaID));
riskRows = riskRows.filter(row => row[riskColumnNames.indexOf("Alternatif_no")] == 0);

let maliyet = await fetchFrom(1000, `maliyet`);
const maliyetColumnNames = maliyet[0];
maliyet = (maliyet.slice(1)).filter(row => (extractTMNumbers(row[maliyetColumnNames.indexOf("TM_no")])).number1 == parseFloat(areaID));
maliyet = maliyet.filter(row => row[maliyetColumnNames.indexOf("Alternatif_no")] == 0);

class ChartManager {
    constructor() {
        this.charts = [];
        this.renderLayout();
    }

    renderLayout() {
        const main = document.getElementById('main');
        main.innerHTML = '';

        // Create the grid layout
        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid-container';

        // Create six histogram chart containers
        for (let i = 1; i <= 8; i++) {
            const chartItem = this.createChartContainer(i);
            gridContainer.appendChild(chartItem);
        }

        main.appendChild(gridContainer);

        // Initialize the charts
        this.initializeCharts();
    }

    createChartContainer(chartIndex) {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';

        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';

        // Chart canvas
        const canvas = document.createElement('canvas');
        canvas.id = `chart${chartIndex}`;
        chartContainer.appendChild(canvas);

        // Add a fullscreen button
        const fullscreenButton = document.createElement('button');
        fullscreenButton.textContent = '⛶';
        fullscreenButton.className = 'fullscreen-button';
        fullscreenButton.addEventListener('click', () => this.toggleFullscreen(chartIndex));
        chartContainer.appendChild(fullscreenButton);

        // Axis select (for 3rd chart)
        if (chartIndex === 3) {
            const intervalSelector = this.createIntervalSelector(chartIndex);
            chartContainer.appendChild(intervalSelector);
        }
        if (chartIndex === 4) {
            const selectors = ['Sel Bertaraf', 'Heyelan Bertaraf', 'Yangın Bertaraf', 'Güvenlik Bertaraf', 'Ses Bertaraf', 'Çığ Bertaraf'];
            const yAxisSelector = this.createYAxisSelector(chartIndex, selectors);
            chartContainer.appendChild(yAxisSelector);
        }
        if (chartIndex === 6) {
            const selectors = ['İnşaat İşleri', 'Elektrik İşleri']
            const yAxisSelector = this.createYAxisSelector(chartIndex, selectors);
            chartContainer.appendChild(yAxisSelector);
        }
        if (chartIndex === 8) {
            const riskSelector = this.createRiskSelector(chartIndex);
            chartContainer.appendChild(riskSelector);
        }

        gridItem.appendChild(chartContainer);
        return gridItem;
    }

    toggleFullscreen(chartIndex) {
        const chartContainer = document.getElementById(`chart${chartIndex}`).parentElement;
        const canvas = document.getElementById(`chart${chartIndex}`);

        // Toggle fullscreen class
        chartContainer.classList.toggle('full-screen-chart');

        // Re-render the chart to adjust the canvas size
        this.charts[chartIndex - 1].resize();
    }

    initializeCharts() {
        const fontSize = 12;
        const barWidth = 40; // Set the desired bar width

        // Initialize 3 histograms
        for (let i = 1; i <= 8; i++) {
            const ctx = document.getElementById(`chart${i}`).getContext('2d');

            const config = {
                type: 'bar',
                data: {
                    datasets: [{
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        maxBarThickness: barWidth  // Set a fixed bar width
                    }]
                },
                options: {
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: '',
                                font: { size: fontSize }  // Increase x-axis title font size
                            },
                            ticks: {
                                autoSkip: false,
                                font: { size: fontSize },  // Increase x-axis tick font size
                                maxRotation: 90
                            },
                            offset: true,  // Center the ticks between the bars
                            grid: {
                                display: true,  // Enable grid lines
                                drawOnChartArea: false,  // Only show tick lines, not grid lines on the chart area
                                drawTicks: true,  // Show tick lines
                                tickLength: 10,  // Adjust tick line length
                                color: 'rgba(0, 0, 0, 0.2)'  // Set the color of the tick lines
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: '',
                                font: { size: fontSize }  // Increase y-axis title font size
                            },
                            ticks: {
                                font: { size: fontSize }  // Increase y-axis tick font size
                            },
                            grid: {
                                display: true,  // Enable grid lines on the y-axis
                                color: 'rgba(0, 0, 0, 0.1)'  // Set the color of the grid lines
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                font: { size: fontSize }  // Increase legend font size
                            }
                        }
                    }
                }
            };

            const chart = new Chart(ctx, config);
            this.charts.push(chart);
        }

        // Update charts with the right data
        this.updateDateHistogram(1);
        this.updateStringHistogram(2);
        this.updateFloatHistogram(3);
        this.updateCostChart(4);
        this.updateKamulastirma(5);
        this.updateCostChart(6);
        this.updateBuildingChart(7, tms);
        this.updateTmChart(8, tms);
    }

    createDDSelector(chartIndex) {
        const container = document.createElement('div');
        container.className = 'dd-selector';

        const label = document.createElement('label');
        label.textContent = 'DD:';

        const select = document.createElement('select');
        select.id = `dd-select-${chartIndex}`;

        const options = ['DD1', 'DD2', 'DD3'];
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });

        select.addEventListener('change', () => this.updateBuildingChart(chartIndex, tms));

        container.appendChild(label);
        container.appendChild(select);

        return container;
    }

    createRiskSelector(chartIndex) {
        const container = document.createElement('div');
        container.className = 'dd-selector';

        const label = document.createElement('label');
        label.textContent = 'Riskler:';

        const select = document.createElement('select');
        select.id = `risk-select-${chartIndex}`;

        const options = ['Sel-Taşkın', 'Heyelan', 'Yangın', 'Güvenlik', 'Ses', 'Çığ'];
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });

        select.addEventListener('change', () => this.updateTmChart(chartIndex, tms));

        container.appendChild(label);
        container.appendChild(select);

        return container;
    }

    createIntervalSelector(chartIndex) {
        const container = document.createElement('div');
        container.className = 'interval-selector';

        const label = document.createElement('label');
        label.textContent = 'Aralık:';

        const input = document.createElement('input');
        input.type = 'number';
        input.id = `interval-${chartIndex}`;
        input.value = 0.25;
        input.step = 0.25;
        input.addEventListener('change', () => this.updateFloatHistogram(chartIndex));

        container.appendChild(label);
        container.appendChild(input);

        return container;
    }

    createYAxisSelector(chartIndex, selector) {
        const container = document.createElement('div');
        container.className = 'y-axis-selector';

        const label = document.createElement('label');
        label.textContent = 'Maliyet: ';

        const select = document.createElement('select');
        select.id = `y-axis-${chartIndex}`;

        selector.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });

        select.addEventListener('change', () => this.updateCostChart(chartIndex));

        container.appendChild(label);
        container.appendChild(select);

        return container;
    }

    updateDateHistogram(chartIndex) {
        const yearIndex = genelBilgiColumnNames.indexOf("Gecici_kabul_tarihi");
        const data = genelBilgiRows.map(row => row[yearIndex]);

        const chart = this.charts[chartIndex - 1];

        // Process data for date-based histogram
        const histogramData = this.getDateHistogramData(data, 10);  // 10-year interval

        chart.data.labels = histogramData.labels;
        chart.data.datasets[0].data = histogramData.values;
        chart.data.datasets[0].label = 'Yapım Yılı';
        chart.options.scales.x.title.text = '';
        chart.options.scales.y.title.text = 'Adet';
        chart.update();
    }

    updateStringHistogram(chartIndex) {
        const order = ['ZA', 'ZB', 'ZC', 'ZD', 'ZE'];
        const groundIndex = groundColumnNames.indexOf("Zemin_sinifi_nihai");
        const data = groundRows.map(row => row[groundIndex]);

        const chart = this.charts[chartIndex - 1];

        // Process data for string occurrence histogram
        const histogramData = this.getStringHistogramData(data);

        const sortedLabels = order.concat(
            histogramData.labels.filter(label => !order.includes(label))
        );

        chart.data.labels = sortedLabels;
        chart.data.datasets[0].data = sortedLabels.map(label => histogramData.values[histogramData.labels.indexOf(label)]);
        chart.data.datasets[0].label = 'Zemin Sınıfları';
        chart.options.scales.x.title.text = '';
        chart.options.scales.y.title.text = 'Adet';
        chart.update();
    }

    updateFloatHistogram(chartIndex) {
        const interval = parseFloat(document.getElementById(`interval-${chartIndex}`).value);

        const sdsIndex = riskColumnNames.indexOf("Sds_DD1");
        const data = riskRows.map(row => row[sdsIndex]);

        const chart = this.charts[chartIndex - 1];

        // Process data for float histogram
        const histogramData = this.getFloatHistogramData(data, interval);

        chart.data.labels = histogramData.labels;
        chart.data.datasets[0].data = histogramData.values;
        chart.data.datasets[0].label = 'Sds DD1';
        chart.options.scales.x.title.text = '';
        chart.options.scales.y.title.text = 'Adet';
        chart.update();
    }

    updateCostChart(chartIndex) {
        const yAxisColumn = document.getElementById(`y-axis-${chartIndex}`).value;

        const data = tms.map(tm => ({
            x: tm.no,
            y: yAxisColumn === 'Sel Bertaraf' ? tm.floodCost :
                yAxisColumn === 'Heyelan Bertaraf' ? tm.landslideCost :
                yAxisColumn === 'Yangın Bertaraf' ? tm.fireCost :
                yAxisColumn === 'Güvenlik Bertaraf' ? tm.securityCost :
                yAxisColumn === 'Ses Bertaraf' ? tm.soundCost :
                yAxisColumn === 'Çığ Bertaraf' ? tm.snowslideCost :
                yAxisColumn === 'İnşaat İşleri' ? tm.constructionCost :
                yAxisColumn === 'Elektrik İşleri' ? tm.electricalCost :
                0
        }));

        const chart = this.charts[chartIndex - 1];

        // Update the chart with the selected y-axis data
        chart.data.labels = data.map(d => d.x);
        chart.data.datasets[0].data = data.map(d => d.y);
        chart.data.datasets[0].label = yAxisColumn;
        chart.options.scales.x.title.text = 'TM No';
        chart.options.scales.y.title.text = yAxisColumn;
        chart.update();
    }


    updateKamulastirma(chartIndex) {
        const yAxisColumn = 'Kamulastirma_bedel';
        const tmIndex = maliyetColumnNames.indexOf('TM_no');
        const yAxisIndex = maliyetColumnNames.indexOf(yAxisColumn);

        const data = maliyet.map(row => ({
            x: row[tmIndex],
            y: row[yAxisIndex]
        }));

        const chart = this.charts[chartIndex - 1];

        // Update the chart with the selected y-axis data
        chart.data.labels = data.map(d => d.x);
        chart.data.datasets[0].data = data.map(d => d.y);
        chart.data.datasets[0].label = 'Kamulaştırma Bedeli';
        chart.options.scales.x.title.text = 'TM No';
        chart.options.scales.y.title.text = 'Kamulaştırma Bedeli';
        chart.update();
    }

    updateTmChart(chartIndex, tms) {
        const selectedRisk = document.getElementById(`risk-select-${chartIndex}`).value; // Get the selected risk type
        const chart = this.charts[chartIndex - 1];

        const tmNames = [];
        const riskData = [];
        const riskColors = [];

        // Loop through all tms to get the data based on the selected risk type
        tms.forEach(tm => {
            tmNames.push(tm.no);

            // Get the value for the selected risk type
            const riskValue = selectedRisk == 'Sel-Taşkın' ? tm.floodRisk :
                selectedRisk == 'Heyelan' ? tm.landslideRisk :
                    selectedRisk == 'Çığ' ? tm.snowslideRisk :
                        selectedRisk == 'Yangın' ? tm.fireRisk :
                            selectedRisk == 'Güvenlik' ? tm.securityRisk :
                                selectedRisk == 'Ses' ? tm.soundRisk :
                                    "no Data";

            const riskColor = riskValue == 'yüksek' ? 'red' :
                riskValue == 'orta' ? 'orange' :
                    riskValue == 'düşük' ? 'yellow' :
                        riskValue == 'çok düşük' ? 'green' :
                            'gray';

            const riskRep = riskValue == 'yüksek' ? 2 :
                riskValue == 'orta' ? 1 :
                    riskValue == 'düşük' ? -1 :
                        riskValue == 'çok düşük' ? -2 :
                            0;

            // Push the risk value into the riskData array
            riskData.push(riskRep);
            riskColors.push(riskColor);
        });

        // Prepare the dataset for the chart
        const data = {
            labels: tmNames,
            datasets: [
                {
                    label: selectedRisk, // Label based on the selected risk
                    data: riskData,
                    backgroundColor: riskColors // Adjust the color as needed
                }
            ]
        };

        // Update the chart data
        chart.data = data;

        // Update axis titles
        chart.options.scales.x.title.text = 'TM No';
        chart.options.scales.y.title.text = selectedRisk;

        chart.options.plugins = {
            legend: {
                display: true,
                labels: {
                    generateLabels: function (chart) {
                        const dataset = chart.data.datasets[0]; // Assumes one dataset
                        return [
                            {
                                text: 'Yüksek',
                                fillStyle: 'red',
                                strokeStyle: 'red',
                                hidden: false
                            },
                            {
                                text: 'Orta',
                                fillStyle: 'orange',
                                strokeStyle: 'orange',
                                hidden: false
                            },
                            {
                                text: 'Düşük',
                                fillStyle: 'yellow',
                                strokeStyle: 'yellow',
                                hidden: false
                            },
                            {
                                text: 'Çok Düşük',
                                fillStyle: 'green',
                                strokeStyle: 'green',
                                hidden: false
                            }
                        ];
                    }
                }
            }
        };

        // Update the chart with the new data and legend
        chart.update();
    }

    updateBuildingChart(chartIndex, tms) {
        const chart = this.charts[chartIndex - 1];

        const tmNo = [];
        const sagliyorCounts = [];
        const saglamiyorCounts = [];
        const noDataCounts = [];

        // Loop through all tms
        tms.forEach(tm => {
            let sagliyorCount = 0;
            let saglamiyorCount = 0;
            let noDataCount = 0;

            // Loop through tm.buildings to count the statuses
            tm.buildings.forEach(building => {
                if (building.scope == 0) return;

                // const nonTechnicals = ['01']

                const value = building.code == 10 ? building.DD2 :
                    building.DD1 == 'Sağlamıyor' || building.DD3 == 'Sağlamıyor' ? 'Sağlamıyor' :
                        building.DD1 == 'Sağlıyor' && building.DD3 == 'Sağlıyor' ? 'Sağlıyor' :
                            'no Data';

                if (value === 'Sağlamıyor') {
                    saglamiyorCount++;
                } else if (value === 'Sağlıyor') {
                    sagliyorCount++;
                } else {
                    noDataCount++;
                }
            });

            // Store the tm name and counts
            tmNo.push(tm.no);
            sagliyorCounts.push(sagliyorCount);
            saglamiyorCounts.push(saglamiyorCount);
            noDataCounts.push(noDataCount);
        });



        // Prepare datasets for the chart
        const data = {
            labels: tmNo,
            datasets: [
                {
                    label: 'Sağlıyor',
                    data: sagliyorCounts,
                    backgroundColor: 'green'
                },
                {
                    label: 'Sağlamıyor',
                    data: saglamiyorCounts,
                    backgroundColor: 'red'
                },
                {
                    label: 'No Data',
                    data: noDataCounts,
                    backgroundColor: 'gray'
                }
            ]
        };

        // Update the chart data
        chart.data = data;

        // Update axis titles
        chart.options.scales.x.title.text = 'TM No';
        chart.options.scales.y.title.text = 'Bina adeti';

        // Update the chart with the new data
        chart.update();
    }

    // Helper functions for histogram data processing
    getDateHistogramData(data) {
        const result = {
            "1920-1999": 0,
            "2000-2008": 0,
            "2009-2018": 0,
            "2019-2024": 0
        };

        // Iterate through the data to find the min and max year and group by year
        data.forEach(element => {
            const dateParts = element.split('/');
            if (dateParts.length !== 3) {
                console.error(`Invalid date format: ${element}`);
                return;
            }
            const year = parseInt(dateParts[2]); // Extract year from date

            if (year >= 1920 && year <= 1999) {
                result["1920-1999"] += 1;
            } else if (year >= 2000 && year <= 2008) {
                result["2000-2008"] += 1;
            }
            else if (year >= 2009 && year <= 2018) {
                result["2009-2018"] += 1;
            }
            else if (year >= 2019 && year <= 2024) {
                result["2019-2024"] += 1;
            }
        });

        // Convert result to labels and values arrays for charting
        const labels = Object.keys(result);
        const values = Object.values(result);

        return { labels, values };
    }

    getStringHistogramData(data) {
        const stringCounts = {};
        data.forEach(string => {
            if (string == '') return;
            if (stringCounts[string]) {
                stringCounts[string] += 1;
            } else {
                stringCounts[string] = 1;
            }
        });

        return { labels: Object.keys(stringCounts), values: Object.values(stringCounts) };
    }

    getFloatHistogramData(data, interval) {
        const intervalStr = interval.toString();
        const decimalPlaces = intervalStr.indexOf('.') === -1 ? 0 : intervalStr.length - intervalStr.indexOf('.') - 1;
        const floatCounts = {};

        data.forEach(f => {
            if (f === '' || f === 0) return;
            // Calculate the lower bound based on the interval
            const lowerBound = Math.floor(f / interval) * interval;
            const upperBound = lowerBound + interval;

            // Format the bounds to the correct number of decimal places
            const lowerBoundStr = lowerBound.toFixed(decimalPlaces);
            const upperBoundStr = upperBound.toFixed(decimalPlaces);

            // Create a label for the range
            const range = `${lowerBoundStr}-${upperBoundStr}`;

            // Count occurrences for each range
            if (floatCounts[range]) {
                floatCounts[range] += 1;
            } else {
                floatCounts[range] = 1;
            }
        });

        // Sort the ranges based on the numeric value of the lower bound
        const sortedLabels = Object.keys(floatCounts).sort((a, b) => {
            const lowerA = parseFloat(a.split('-')[0]);
            const lowerB = parseFloat(b.split('-')[0]);
            return lowerA - lowerB;
        });

        return { labels: sortedLabels, values: sortedLabels.map(label => floatCounts[label]) };
    }

}

// Initialize ChartManager
const chartManager = new ChartManager();
