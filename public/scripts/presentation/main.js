import { initializeMap, adjustMapSize, addCustomButton } from './map.js';
import { setupEventListeners, asideMenuEventListeners } from './eventListeners.js';
import { createDataTable } from './dataTable.js';
import { renderCards, renderIcmal, disposeAllRenders, renderPdf } from './renderer.js';
import { createCollapsibleSection, showAlert } from '../utilities.js';
import { extractTMNumbers } from '../map/utilities.js';
import { searchPdf, fetchFrom } from '../database.js';
import { tmEqPerfData, tmNaturalDisasterData, tmEqRiskCostData, tmNaturalDisCostData, tmLocation } from "./tableFillers.js";
import { IndexedDBStorage } from '../IndexedDBStorage.js';
import { getDataFromLocations, getBuildingData } from '../map/dataManager.js';

const tmNo = extractTMNumbers(sessionStorage.getItem('tmNo'))

let areaID = tmNo.number1 < 10 ? "0" + tmNo.number1 : `${tmNo.number1}`;
let tmID = tmNo.number2 < 10 ? "0" + tmNo.number2 : `${tmNo.number2}`;

//#region Fetch data from database
const icmal = await fetchFrom(1000, 'icmal_tablosu_input_file');

const icmalColumns = icmal[0];
const icmalRows = icmal.slice(1);


const tapuParsel = await fetchFrom(1000, 'tapu_parsel_data');

const tapuParselColumns = tapuParsel[0];
const tapuParselRows = tapuParsel.slice(1);


const tmParsel = await fetchFrom(1000, 'tm_parsel_data');

const tmParselColumns = tmParsel[0];
const tmParselRows = tmParsel.slice(1);


const genelBilgi = await fetchFrom(1000, 'genel_bilgi');

const genelBilgiColumns = genelBilgi[0];
const genelBilgiRows = genelBilgi.slice(1);


let tapuParselRelatedRows = tapuParselRows
    .filter(row => row[tapuParselColumns.indexOf('TM_no')] === sessionStorage.getItem('tmNo'))
    .sort((a, b) => a[tapuParselColumns.indexOf('Alternatif_no')] - b[tapuParselColumns.indexOf('Alternatif_no')]);

let tmParselRelatedRows = tmParselRows
    .filter(row => row[tmParselColumns.indexOf('TM_no')] === sessionStorage.getItem('tmNo'))
    .sort((a, b) => a[tmParselColumns.indexOf('Alternatif_no')] - b[tmParselColumns.indexOf('Alternatif_no')]);

let genelBilgiRelatedRows = genelBilgiRows
    .filter(row => row[genelBilgiColumns.indexOf('TM_no')] === sessionStorage.getItem('tmNo'))
    .sort((a, b) => a[genelBilgiColumns.indexOf('Alternatif_no')] - b[genelBilgiColumns.indexOf('Alternatif_no')]);
//#endregion

await createMenu();
asideMenuEventListeners();

const lastBtnClicked = sessionStorage.getItem('lastBtnClicked');
if (lastBtnClicked) {
    document.getElementById(lastBtnClicked).click();
}

function runCards() {
    const eqPerfData = JSON.parse(sessionStorage.getItem("eqPerf"));
    const naturalDisasterData = JSON.parse(sessionStorage.getItem("naturalDisasterData"));
    const tmEqRiskCostData = JSON.parse(sessionStorage.getItem("tmEqRiskCostData"));
    const tmNaturalDisCostData = JSON.parse(sessionStorage.getItem("tmNaturalDisCostData"));
    const tmLocation = JSON.parse(sessionStorage.getItem("tmLocation"));
    const tmName = sessionStorage.getItem("tmName");

    document.getElementById("name").textContent = tmName + " Afet Risk Kartları";

    // Initialize map
    const map = initializeMap(sessionStorage.getItem('tmNo'), tmLocation, tapuParselRelatedRows, tapuParselColumns, tmParselRelatedRows, tmParselColumns, genelBilgiRelatedRows, genelBilgiColumns);
    addCustomButton(map, tmNo);

    // Initialize DataTables
    if (eqPerfData) createDataTable('#eqPerf', eqPerfData, 'eqPerf');
    if (naturalDisasterData) createDataTable('#naturalDisaster', naturalDisasterData, 'naturalDisaster');
    if (tmEqRiskCostData) createDataTable('#tmEqRiskCost', tmEqRiskCostData);
    if (tmNaturalDisCostData) createDataTable('#tmNaturalDisCost', tmNaturalDisCostData);

    // Adjust map size on load and on resize
    adjustMapSize(map);
    window.addEventListener('resize', () => adjustMapSize(map));

    // Setup event listeners
    setupEventListeners(map, tmLocation);
}

function runIcmal() {
    const tmLocation = JSON.parse(sessionStorage.getItem("tmLocation"));


    const tmName = sessionStorage.getItem("tmName");
    document.getElementById("name").textContent = tmName + " İcmal Tablosu";
    const tmIcmal = icmalRows.find(row => row[icmalColumns.indexOf('TM_no')] === sessionStorage.getItem('tmNo'));

    const data1 = [
        ['Maliyet Kalemi', 'Tutar (₺)'],
        ['Toplam Güncel Tesis İlk Yapım Bedeli', String(tmIcmal[icmalColumns.indexOf('A1.01')]).replace(/TL/g, '')],
        ['Tesis-Kullanılmış Amortisman', String(tmIcmal[icmalColumns.indexOf('A1.02')]).replace(/TL/g, '')],
        ['Tesis-Kalan Amortisman', String(tmIcmal[icmalColumns.indexOf('A1.03')]).replace(/TL/g, '')],
        ['Tesisin Yaşı (30\'dan Büyük Olamaz)', String(tmIcmal[icmalColumns.indexOf('A1.04')]).replace(/TL/g, '') + ' yıl'],
        ['Mevcutta Yapılmış Tevsiat/Büyük Bakım Onarım Bedeli', String(tmIcmal[icmalColumns.indexOf('A1.05')]).replace(/TL/g, '')],
        ['Tevsiat-Kullanılmış Amortisman', String(tmIcmal[icmalColumns.indexOf('A1.06')]).replace(/TL/g, '')],
        ['Tevsiat-Kalan Amortisman', String(tmIcmal[icmalColumns.indexOf('A1.07')]).replace(/TL/g, '')],
        ['Tevsiat Adedi', String(tmIcmal[icmalColumns.indexOf('A1.08')]).replace(/TL/g, '') + ' adet'],
        ['TM\'nin Demontaj Bedeli', String(tmIcmal[icmalColumns.indexOf('A1.09')]).replace(/TL/g, '')],
        ['Demontaj Hurda Bedeli (Çelik)', String(tmIcmal[icmalColumns.indexOf('A1.10')]).replace(/TL/g, '')],
        ['Demonte Edilen Malzemenin Kalan Amortisman Değeri (Elektrik Teçhizatları)', String(tmIcmal[icmalColumns.indexOf('A1.11')]).replace(/TL/g, '')]
    ];

    const data2 = [
        ['Maliyet Kalemi', 'Tutar (₺)'],
        ['Mevcut TM\'nin Satışından Elde Edilecek Bedel (Arazi Geliri)', String(tmIcmal[icmalColumns.indexOf('A2.01')]).replace(/TL/g, '')],
        ['2. Alternatif Yeni TM\'nin Kamulaştırma Bedeli', String(tmIcmal[icmalColumns.indexOf('A2.02')]).replace(/TL/g, '')],
        ['3. Alternatif Yeni TM\'nin Kamulaştırma Bedeli', String(tmIcmal[icmalColumns.indexOf('A2.03')]).replace(/TL/g, '')],
        ['4. Alternatif Yeni TM\'nin Kamulaştırma Bedeli', String(tmIcmal[icmalColumns.indexOf('A2.04')]).replace(/TL/g, '')],
    ];

    const data3 = [
        ['Maliyet Kalemi', 'Tutar (₺)'],
        ['Tevsiat/Bakım Onarım Maliyeti (Demontaj Dahil)', String(tmIcmal[icmalColumns.indexOf('A3.01')]).replace(/TL/g, '')],
        ['Yerinde Yenilenecek Tesisin Bedeli', String(tmIcmal[icmalColumns.indexOf('A3.02')]).replace(/TL/g, '')],
        ['2. Alternatif Tesisin Bedeli', String(tmIcmal[icmalColumns.indexOf('A3.03')]).replace(/TL/g, '')],
        ['3. Alternatif Tesisin Bedeli', String(tmIcmal[icmalColumns.indexOf('A3.04')]).replace(/TL/g, '')],
        ['4. Alternatif Tesisin Bedeli', String(tmIcmal[icmalColumns.indexOf('A3.05')]).replace(/TL/g, '')],
        ['Başka Kurum ya da Şirketlerce Yapılacak Bilabedel İmalat Bedelleri', String(tmIcmal[icmalColumns.indexOf('A3.06')]).replace(/TL/g, '')]
    ];

    const data4 = [
        ['TM\'nin Bakım-Onarım-\nGüçlendirme ile Rehabilite \nEdilmesi', 'Tutar (₺)'],
        ['Tevsiat/Bakım Onarım Maliyeti (Demontaj Dahil)', String(tmIcmal[icmalColumns.indexOf('A4.01')]).replace(/TL/g, '')],
        [' ', String(tmIcmal[icmalColumns.indexOf('A4.02')]).replace(/TL/g, '')],
        [' ', String(tmIcmal[icmalColumns.indexOf('A4.03')]).replace(/TL/g, '')],
        ['Mevcut Kamulaştırma Bedeli', String(tmIcmal[icmalColumns.indexOf('A4.04')]).replace(/TL/g, '')],
        ['TM\'nin Güncel Değeri Üzerinden Kullanılmış Amortisman Bedeli (Tesis+Tevsiat)', String(tmIcmal[icmalColumns.indexOf('A4.05')]).replace(/TL/g, '')],
        ['EİH Tesis ve Kayıp Maliyeti', String(tmIcmal[icmalColumns.indexOf('A4.06')]).replace(/TL/g, '')],
        [' ', String(tmIcmal[icmalColumns.indexOf('A4.07')]).replace(/TL/g, '')],
        [' ', String(tmIcmal[icmalColumns.indexOf('A4.08')]).replace(/TL/g, '')],
        [' ', String(tmIcmal[icmalColumns.indexOf('A4.09')]).replace(/TL/g, '')],
        [' ', String(tmIcmal[icmalColumns.indexOf('A4.10')]).replace(/TL/g, '')],
        ['Toplam', String(tmIcmal[icmalColumns.indexOf('A4.11')]).replace(/TL/g, '')]
    ];

    const data5 = [
        ['TM\'nin Yerinde Yenilenmesi', 'Tutar (₺)'],
        ['TM\'nin Demonaj Bedeli', String(tmIcmal[icmalColumns.indexOf('A5.01')]).replace(/TL/g, '')], // String(tmIcmal[icmalColumns.indexOf('A8.01')]).replace(/TL/g, '')],
        ['Yenilenecek Tesisin Bedeli', String(tmIcmal[icmalColumns.indexOf('A3.02')]).replace(/TL/g, '')], //String(tmIcmal[icmalColumns.indexOf('A8.02')]).replace(/TL/g, '')],
        ['Mevcut Kamulaştırma Bedeli', String(tmIcmal[icmalColumns.indexOf('A4.04')]).replace(/TL/g, '')], // String(tmIcmal[icmalColumns.indexOf('A8.03')]).replace(/TL/g, '')],
        ['TM\'nin Güncel Değeri Üzerinden Kalan Amortisman Bedeli (Tesis)', String(tmIcmal[icmalColumns.indexOf('A5.05')]).replace(/TL/g, '')], // String(tmIcmal[icmalColumns.indexOf('A8.04')]).replace(/TL/g, '')],
        ['Demonaj Hurda Bedeli (Çelik)', String(tmIcmal[icmalColumns.indexOf('A5.08')]).replace(/TL/g, '')], // String(tmIcmal[icmalColumns.indexOf('A8.05')]).replace(/TL/g, '')],
        ['Demonte Edile Malzemelerin Kalan Amortisman Değeri (Elektrik Teçhizatları)', String(tmIcmal[icmalColumns.indexOf('A5.09')]).replace(/TL/g, '')], // String(tmIcmal[icmalColumns.indexOf('A8.06')]).replace(/TL/g, '')],
        [' ', ' '],
        [' ', ' '],
        [' ', ' '],
        [' ', ' '],
        ['Toplam', (() => {
            // Get all numeric values except the header and empty rows
            const values = [
                Number(tmIcmal[icmalColumns.indexOf('A5.01')].replace(/TL/g, '').replace(/\./g, '').trim()),
                Number(tmIcmal[icmalColumns.indexOf('A3.02')].replace(/TL/g, '').replace(/\./g, '').trim()),
                Number(tmIcmal[icmalColumns.indexOf('A4.04')].replace(/TL/g, '').replace(/\./g, '').trim()),
                Number(tmIcmal[icmalColumns.indexOf('A5.05')].replace(/TL/g, '').replace(/\./g, '').trim()),
                Number(tmIcmal[icmalColumns.indexOf('A5.08')].replace(/TL/g, '').replace(/\./g, '').trim()),
                Number(tmIcmal[icmalColumns.indexOf('A5.09')].replace(/TL/g, '').replace(/\./g, '').trim())
            ];


            // Sum all values
            return values.reduce((sum, value) => sum + (isNaN(value) ? 0 : Number(value)), 0)
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        })()]
    ]; //TODO: make a new haeder for this table

    const data6 = [
        ['TM\'nin Farklı Yerde \nYenilenmesi (2. Alternatif)', 'Tutar (₺)'],
        ['Mevcut TM\'nin Demontaj Bedeli', String(tmIcmal[icmalColumns.indexOf('A5.01')]).replace(/TL/g, '')],
        ['Periyodik Bakım Onarım Maliyeti', String(tmIcmal[icmalColumns.indexOf('A5.02')]).replace(/TL/g, '')],
        ['2. Alternatif Tesisin Bedeli', String(tmIcmal[icmalColumns.indexOf('A5.03')]).replace(/TL/g, '')],
        ['Yeni TM\'nin Kamulaştırma Bedeli', String(tmIcmal[icmalColumns.indexOf('A5.04')]).replace(/TL/g, '')],
        ['TM\'nin Güncel Değeri Üzerinden Kalan Amortisman Bedeli (Tesis)', String(tmIcmal[icmalColumns.indexOf('A5.05')]).replace(/TL/g, '')],
        ['EİH Tesis ve Kayıp Maliyeti Farkı', String(tmIcmal[icmalColumns.indexOf('A5.06')]).replace(/TL/g, '')],
        ['OG Tesis ve Kayıp Maliyeti Farkı', String(tmIcmal[icmalColumns.indexOf('A5.07')]).replace(/TL/g, '')],
        ['Demontaj Hurda Bedeli (Çelik)', String(tmIcmal[icmalColumns.indexOf('A5.08')]).replace(/TL/g, '')],
        ['Demonte Edilen Malzemenin Kalan Amortisman Değeri (Elektrik Teçhizatları)', String(tmIcmal[icmalColumns.indexOf('A5.09')]).replace(/TL/g, '')],
        ['Başka Kurum ya da Şirketlerce Yapılacak Bilabedel İmalat Bedelleri', String(tmIcmal[icmalColumns.indexOf('A5.10')]).replace(/TL/g, '')],
        ['Toplam', String(tmIcmal[icmalColumns.indexOf('A5.11')]).replace(/TL/g, '')]
    ];

    const data7 = [
        ['TM\'nin Farklı Yerde \nYenilenmesi (3. Alternatif)', 'Tutar (₺)'],
        ['Mevcut TM\'nin Demontaj Bedeli', String(tmIcmal[icmalColumns.indexOf('A6.01')]).replace(/TL/g, '')],
        ['Periyodik Bakım Onarım Maliyeti', String(tmIcmal[icmalColumns.indexOf('A6.02')]).replace(/TL/g, '')],
        ['3. Alternatif Tesisin Bedeli', String(tmIcmal[icmalColumns.indexOf('A6.03')]).replace(/TL/g, '')],
        ['Yeni TM\'nin Kamulaştırma Bedeli', String(tmIcmal[icmalColumns.indexOf('A6.04')]).replace(/TL/g, '')],
        ['TM\'nin Güncel Değeri Üzerinden Kalan Amortisman Bedeli (Tesis)', String(tmIcmal[icmalColumns.indexOf('A6.05')]).replace(/TL/g, '')],
        ['EİH Tesis ve Kayıp Maliyeti Farkı', String(tmIcmal[icmalColumns.indexOf('A6.06')]).replace(/TL/g, '')],
        ['OG Tesis ve Kayıp Maliyeti Farkı', String(tmIcmal[icmalColumns.indexOf('A6.07')]).replace(/TL/g, '')],
        ['Demontaj Hurda Bedeli (Çelik)', String(tmIcmal[icmalColumns.indexOf('A6.08')]).replace(/TL/g, '')],
        ['Demonte Edilen Malzemenin Kalan Amortisman Değeri (Elektrik Teçhizatları)', String(tmIcmal[icmalColumns.indexOf('A6.09')]).replace(/TL/g, '')],
        ['Başka Kurum ya da Şirketlerce Yapılacak Bilabedel İmalat Bedelleri', String(tmIcmal[icmalColumns.indexOf('A6.10')]).replace(/TL/g, '')],
        ['Toplam', String(tmIcmal[icmalColumns.indexOf('A6.11')]).replace(/TL/g, '')]
    ];

    const data8 = [
        ['TM\'nin Farklı Yerde \nYenilenmesi (4. Alternatif)', 'Tutar (₺)'],
        ['Mevcut TM\'nin Demontaj Bedeli', String(tmIcmal[icmalColumns.indexOf('A7.01')]).replace(/TL/g, '')],
        ['Periyodik Bakım Onarım Maliyeti', String(tmIcmal[icmalColumns.indexOf('A7.02')]).replace(/TL/g, '')],
        ['3. Alternatif Tesisin Bedeli', String(tmIcmal[icmalColumns.indexOf('A7.03')]).replace(/TL/g, '')],
        ['Yeni TM\'nin Kamulaştırma Bedeli', String(tmIcmal[icmalColumns.indexOf('A7.04')]).replace(/TL/g, '')],
        ['TM\'nin Güncel Değeri Üzerinden Kalan Amortisman Bedeli (Tesis)', String(tmIcmal[icmalColumns.indexOf('A7.05')]).replace(/TL/g, '')],
        ['EİH Tesis ve Kayıp Maliyeti Farkı', String(tmIcmal[icmalColumns.indexOf('A7.06')]).replace(/TL/g, '')],
        ['OG Tesis ve Kayıp Maliyeti Farkı', String(tmIcmal[icmalColumns.indexOf('A7.07')]).replace(/TL/g, '')],
        ['Demontaj Hurda Bedeli (Çelik)', String(tmIcmal[icmalColumns.indexOf('A7.08')]).replace(/TL/g, '')],
        ['Demonte Edilen Malzemenin Kalan Amortisman Değeri (Elektrik Teçhizatları)', String(tmIcmal[icmalColumns.indexOf('A7.09')]).replace(/TL/g, '')],
        ['Başka Kurum ya da Şirketlerce Yapılacak Bilabedel İmalat Bedelleri', String(tmIcmal[icmalColumns.indexOf('A7.10')]).replace(/TL/g, '')],
        ['Toplam', String(tmIcmal[icmalColumns.indexOf('A7.11')]).replace(/TL/g, '')]
    ];

    // Re-enable the first table creation
    setTimeout(() => createDataTable('#table1', data1, 'icmal'), 0);
    setTimeout(() => createDataTable('#table2', data2, 'icmal'), 0);
    setTimeout(() => createDataTable('#table3', data3, 'icmal'), 0);
    setTimeout(() => createDataTable('#table4', data4, 'icmal'), 0);
    setTimeout(() => createDataTable('#table5', data5, 'icmal'), 0);
    setTimeout(() => createDataTable('#table6', data6, 'icmal'), 0);
    setTimeout(() => createDataTable('#table7', data7, 'icmal'), 0);
    setTimeout(() => createDataTable('#table8', data8, 'icmal'), 0);

    // Adjust table width
    document.getElementById('table1').style.width = '100%';
    document.getElementById('table2').style.width = '100%';
    document.getElementById('table3').style.width = '100%';
    document.getElementById('table4').style.width = '100%';
    document.getElementById('table5').style.width = '100%';
    document.getElementById('table6').style.width = '100%';
    document.getElementById('table7').style.width = '100%';

    // const mapHeight = document.getElementById('table1').style.height;
    const mapHeight = '615px';
    const mapDiv = document.getElementById('map');
    const map = initializeMap(sessionStorage.getItem('tmNo'), tmLocation, tapuParselRelatedRows, tapuParselColumns, tmParselRelatedRows, tmParselColumns, genelBilgiRelatedRows, genelBilgiColumns);

    window.addEventListener('resize', () => {
        adjustMapSize(map)
        mapDiv.style.height = mapHeight;
    });

    window.dispatchEvent(new Event('resize'));
}

async function createMenu() {
    const menu = document.getElementById('menuContent');

    const ground = createGround();
    const switchYard = createSwitchYard();
    const disasters = createDisasters();
    const foyReport = createFoyReport();
    const riskCardBtn = createRiskCardBtn();
    const icmalBtn = createIcmalBtn();
    const tmSelectionDiv = await createTmSelectionDiv();
    const alternativeTMSelectionDiv = createAlternativeTM();
    const div = document.createElement('div');


    div.appendChild(document.createElement('hr'));
    div.appendChild(riskCardBtn);
    div.appendChild(ground);
    div.appendChild(switchYard);
    div.appendChild(disasters);
    div.appendChild(alternativeTMSelectionDiv);
    div.appendChild(foyReport);
    div.appendChild(icmalBtn);

    div.style.maxHeight = '720px';
    div.style.overflowY = 'auto';

    menu.appendChild(div);
    menu.appendChild(tmSelectionDiv);


    menu.style.overflowy = 'scroll';
}

function createRiskCardBtn() {
    const riskCardBtn = document.createElement('button');
    riskCardBtn.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    riskCardBtn.innerHTML = 'Risk Kartı';
    riskCardBtn.id = 'riskCardBtn';

    riskCardBtn.addEventListener('click', () => {
        renderCards();
        runCards();
        sessionStorage.setItem('lastBtnClicked', 'riskCardBtn');
    });

    return riskCardBtn;
}

function createGround() {
    const ground = document.createElement('div');
    ground.id = 'ground';
    ground.className = 'ground';

    const VRBtn = document.createElement('button');
    VRBtn.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    VRBtn.innerHTML = 'Veri Raporu';
    VRBtn.id = 'VRBtn';

    VRBtn.addEventListener('click', async () => {
        const pdf = await searchPdf(areaID, tmID, 'ZEV');
        if (!pdf) {
            const main = document.getElementById('main');

            main.innerHTML = '';
            showAlert('Rapor bulunamadı.');
            return;
        }
        renderPdf(pdf);
        sessionStorage.setItem('lastBtnClicked', 'VRBtn');
    });

    const GeoBtn = document.createElement('button');
    GeoBtn.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    GeoBtn.innerHTML = 'Geoteknik Raporu';
    GeoBtn.id = 'GeoBtn';

    GeoBtn.addEventListener('click', async () => {
        const pdf = await searchPdf(areaID, tmID, 'GEO');
        if (!pdf) {
            const main = document.getElementById('main');

            main.innerHTML = '';
            showAlert('Rapor bulunamadı.');
            return;
        }
        renderPdf(pdf);
        sessionStorage.setItem('lastBtnClicked', 'GeoBtn');
    });

    const DFBtn = document.createElement('button');
    DFBtn.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    DFBtn.innerHTML = 'Dirifay Raporu';
    DFBtn.id = 'DFBtn';

    DFBtn.addEventListener('click', async () => {
        const pdf = await searchPdf(areaID, tmID, 'FAY');
        if (!pdf) {
            const main = document.getElementById('main');

            main.innerHTML = '';
            showAlert('Rapor bulunamadı.');
            return;
        }
        renderPdf(pdf);
        sessionStorage.setItem('lastBtnClicked', 'DFBtn');
    });

    ground.appendChild(VRBtn);
    ground.appendChild(GeoBtn);
    ground.appendChild(DFBtn);

    const collapsibleSection = createCollapsibleSection(ground, 'Zemin');

    return collapsibleSection;
}

function createSwitchYard() {
    const switchYard = document.createElement('div');
    switchYard.id = 'switchYard';
    switchYard.className = 'switchYard';

    const switchYardBtn = document.createElement('button');
    switchYardBtn.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    switchYardBtn.innerHTML = 'Şalt Raporu';
    switchYardBtn.id = 'switchYardBtn';

    switchYardBtn.addEventListener('click', async () => {
        const pdf = await searchPdf(areaID, tmID, 'SLT');
        if (!pdf) {
            const main = document.getElementById('main');

            main.innerHTML = '';
            showAlert('Rapor bulunamadı.');
            return;
        }
        renderPdf(pdf);
        sessionStorage.setItem('lastBtnClicked', 'switchYardBtn');
    });

    switchYard.appendChild(switchYardBtn);

    const collapsibleSection = createCollapsibleSection(switchYard, 'Şalt');

    return collapsibleSection;
}

function createDisasters() {
    const disasters = document.createElement('div');
    disasters.id = 'disasters';
    disasters.className = 'disasters';

    const floodBtn = document.createElement('button');
    floodBtn.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    floodBtn.innerHTML = 'Sel Riski Raporu';
    floodBtn.id = 'floodBtn';

    floodBtn.addEventListener('click', async () => {
        const pdf = await searchPdf(areaID, tmID, 'SEL');
        if (!pdf) {
            const main = document.getElementById('main');

            main.innerHTML = '';
            showAlert('Rapor bulunamadı.');
            return;
        }
        renderPdf(pdf);
        sessionStorage.setItem('lastBtnClicked', 'floodBtn');
    });

    const landslideBtn = document.createElement('button');
    landslideBtn.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    landslideBtn.innerHTML = 'Heyelan Riski Raporu';
    landslideBtn.id = 'landslideBtn';

    landslideBtn.addEventListener('click', async () => {
        const pdf = await searchPdf(areaID, tmID, 'HEY');
        if (!pdf) {
            const main = document.getElementById('main');

            main.innerHTML = '';
            showAlert('Rapor bulunamadı.');
            return;
        }
        renderPdf(pdf);
        sessionStorage.setItem('lastBtnClicked', 'landslideBtn');
    });

    const snowSlideBtn = document.createElement('button');
    snowSlideBtn.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    snowSlideBtn.innerHTML = 'Çığ Riski Raporu';
    snowSlideBtn.id = 'snowSlideBtn';

    snowSlideBtn.addEventListener('click', async () => {
        const pdf = await searchPdf(areaID, tmID, 'CIG');
        if (!pdf) {
            const main = document.getElementById('main');

            main.innerHTML = '';
            showAlert('Rapor bulunamadı.');
            return;
        }
        renderPdf(pdf);
        sessionStorage.setItem('lastBtnClicked', 'snowSlideBtn');
    });

    const fireBtn = document.createElement('button');
    fireBtn.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    fireBtn.innerHTML = 'Yangın Riski Raporu';
    fireBtn.id = 'fireBtn';

    fireBtn.addEventListener('click', async () => {
        let pdf = await searchPdf(areaID, tmID, 'YAN');
        if (!pdf) {
            pdf = await searchPdf(areaID, tmID, 'ORM');

            if (!pdf) {
                const main = document.getElementById('main');

                main.innerHTML = '';
                showAlert('Rapor bulunamadı.');
                return;
            }
            // showAlert('Rapor bulunamadı.');

        }
        renderPdf(pdf);
        sessionStorage.setItem('lastBtnClicked', 'fireBtn');
    });

    const securityBtn = document.createElement('button');
    securityBtn.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    securityBtn.innerHTML = 'Güvenlik Riski Raporu';
    securityBtn.id = 'securityBtn';

    securityBtn.addEventListener('click', async () => {
        const pdf = await searchPdf(areaID, tmID, 'GUV');
        if (!pdf) {
            const main = document.getElementById('main');

            main.innerHTML = '';
            showAlert('Rapor bulunamadı.');
            return;
        }
        renderPdf(pdf);
        sessionStorage.setItem('lastBtnClicked', 'securityBtn');
    });
    const soundBtn = document.createElement('button');
    soundBtn.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    soundBtn.innerHTML = 'Ses Riski Raporu';
    soundBtn.id = 'soundBtn';

    soundBtn.addEventListener('click', async () => {
        const pdf = await searchPdf(areaID, tmID, 'SES');
        if (!pdf) {
            const main = document.getElementById('main');

            main.innerHTML = '';
            showAlert('Rapor bulunamadı.');
            return;
        }
        renderPdf(pdf);
        sessionStorage.setItem('lastBtnClicked', 'soundBtn');
    });

    disasters.appendChild(floodBtn);
    disasters.appendChild(landslideBtn);
    disasters.appendChild(snowSlideBtn);
    disasters.appendChild(fireBtn);
    disasters.appendChild(securityBtn);
    disasters.appendChild(soundBtn);

    const collapsibleSection = createCollapsibleSection(disasters, 'Afetler');

    return collapsibleSection;
}

function createFoyReport() {
    const foyReport = document.createElement('div');
    foyReport.id = 'foyReport';
    foyReport.className = 'foyReport';

    const foyReportBtn = document.createElement('button');
    foyReportBtn.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    foyReportBtn.innerHTML = 'Mevcut Föy Raporu';
    foyReportBtn.id = 'foyReportBtn';

    foyReportBtn.addEventListener('click', async () => {
        const pdf = await searchPdf(areaID, tmID, 'FOY');
        if (!pdf) {
            const main = document.getElementById('main');

            main.innerHTML = '';
            showAlert('Rapor bulunamadı.');
            return;
        }
        renderPdf(pdf);
        sessionStorage.setItem('lastBtnClicked', 'foyReportBtn');
    });

    const firstAltFoyReportBtn = document.createElement('button');
    firstAltFoyReportBtn.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    firstAltFoyReportBtn.innerHTML = 'Alternatif 1 Föy Raporu';
    firstAltFoyReportBtn.id = 'firstAltFoyReportBtn';

    firstAltFoyReportBtn.addEventListener('click', async () => {
        const pdf = await searchPdf(areaID, tmID, 'FOY', 'A01-00');
        if (!pdf) {
            const main = document.getElementById('main');

            main.innerHTML = '';
            showAlert('Rapor bulunamadı.');
            return;
        }
        renderPdf(pdf);
        sessionStorage.setItem('lastBtnClicked', 'firstAltFoyReportBtn');
    });

    const secondAltFoyReportBtn = document.createElement('button');
    secondAltFoyReportBtn.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    secondAltFoyReportBtn.innerHTML = 'Alternatif 2 Föy Raporu';
    secondAltFoyReportBtn.id = 'secondAltFoyReportBtn';

    secondAltFoyReportBtn.addEventListener('click', async () => {
        const pdf = await searchPdf(areaID, tmID, 'FOY', 'A02-00');
        if (!pdf) {
            const main = document.getElementById('main');

            main.innerHTML = '';
            showAlert('Rapor bulunamadı.');
            return;
        }
        renderPdf(pdf);
        sessionStorage.setItem('lastBtnClicked', 'secondAltFoyReportBtn');
    });

    const thirdAltFoyReportBtn = document.createElement('button');
    thirdAltFoyReportBtn.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    thirdAltFoyReportBtn.innerHTML = 'Alternatif 3 Föy Raporu';
    thirdAltFoyReportBtn.id = 'thirdAltFoyReportBtn';

    thirdAltFoyReportBtn.addEventListener('click', async () => {
        const pdf = await searchPdf(areaID, tmID, 'FOY', 'A03-00');
        if (!pdf) {
            const main = document.getElementById('main');

            main.innerHTML = '';
            showAlert('Rapor bulunamadı.');
            return;
        }
        renderPdf(pdf);
        sessionStorage.setItem('lastBtnClicked', 'thirdAltFoyReportBtn');
    });

    foyReport.appendChild(foyReportBtn);
    foyReport.appendChild(firstAltFoyReportBtn);
    foyReport.appendChild(secondAltFoyReportBtn);
    foyReport.appendChild(thirdAltFoyReportBtn);

    const collapsibleSection = createCollapsibleSection(foyReport, 'Föy Raporu');

    return collapsibleSection;
}

function createAlternativeTM() {
    const alternativeTM = document.createElement('div');
    alternativeTM.id = 'alternativeTM';
    alternativeTM.className = 'alternativeTM';

    const firstAltTM = document.createElement('button');
    firstAltTM.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    firstAltTM.innerHTML = 'Alternatif 1 TM';
    firstAltTM.id = 'firstAltTM';

    firstAltTM.addEventListener('click', async () => {
        const pdf = await searchPdf(areaID, tmID, 'ALT', 'A01-00');
        if (!pdf) {
            const main = document.getElementById('main');

            main.innerHTML = '';
            showAlert('Rapor bulunamadı.');
            return;
        }
        renderPdf(pdf);
    });

    const secondAltTM = document.createElement('button');
    secondAltTM.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    secondAltTM.innerHTML = 'Alternatif 2 TM';
    secondAltTM.id = 'secondAltTM';

    secondAltTM.addEventListener('click', async () => {
        const pdf = await searchPdf(areaID, tmID, 'ALT', 'A02-00');
        if (!pdf) {
            const main = document.getElementById('main');

            main.innerHTML = '';
            showAlert('Rapor bulunamadı.');
            return;
        }
        renderPdf(pdf);
    });

    const thirdAltTM = document.createElement('button');
    thirdAltTM.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    thirdAltTM.innerHTML = 'Alternatif 3 TM';
    thirdAltTM.id = 'thirdAltTM';

    thirdAltTM.addEventListener('click', async () => {
        const pdf = await searchPdf(areaID, tmID, 'ALT', 'A03-00');
        if (!pdf) {
            const main = document.getElementById('main');

            main.innerHTML = '';
            showAlert('Rapor bulunamadı.');
            return;
        }
        renderPdf(pdf);
    });

    alternativeTM.appendChild(firstAltTM);
    alternativeTM.appendChild(secondAltTM);
    alternativeTM.appendChild(thirdAltTM);

    const collapsibleSection = createCollapsibleSection(alternativeTM, 'Alternatif TM Raporu');

    return collapsibleSection;
}

function createIcmalBtn() {
    const icmalPDFBtn = document.createElement('button');
    icmalPDFBtn.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    icmalPDFBtn.innerHTML = 'İcmal PDF';
    icmalPDFBtn.id = 'icmalPDFBtn';

    icmalPDFBtn.addEventListener('click', async () => {
        const pdf = await searchPdf(areaID, tmID, 'ICM');
        if (!pdf) {
            const main = document.getElementById('main');

            main.innerHTML = '';
            showAlert('Rapor bulunamadı.');
            return;
        }
        renderPdf(pdf);

        sessionStorage.setItem('lastBtnClicked', 'icmalPDFBtn');
    });

    const icmalHTMLBtn = document.createElement('button');
    icmalHTMLBtn.classList.add('btn', 'btn-block', 'btn-outline-secondary');
    icmalHTMLBtn.innerHTML = 'İcmal Tablosu';
    icmalHTMLBtn.id = 'icmalHTMLBtn';

    icmalHTMLBtn.addEventListener('click', async () => {
        renderIcmal();
        runIcmal();
        sessionStorage.setItem('lastBtnClicked', 'icmalHTMLBtn');
    });

    return icmalHTMLBtn;
}

async function createTmSelectionDiv() {
    const tmSelectionDiv = document.createElement('div');
    tmSelectionDiv.classList.add('tm-selection');

    let { nextTM, prevTM } = await findNextAndPrevTM();

    // Create the span to display tmNo
    const tmText = document.createElement('span');
    tmText.classList.add('tm-text');
    const tmNo = sessionStorage.getItem('tmNo');
    tmText.innerText = tmNo ? tmNo : 'No Data';
    tmText.id = 'tm-selection';

    // Add double-click event to show search form
    tmText.addEventListener('dblclick', (event) => {
        const existingPopup = document.querySelector('.tm-search-popup');
        if (existingPopup) {
            // If a popup already exists, remove it first
            document.body.removeChild(existingPopup);
        }

        // Create a popup form for searching
        const popup = document.createElement('div');
        popup.classList.add('tm-search-popup');

        // Position the popup above the tmText element
        const rect = tmText.getBoundingClientRect();
        popup.style.position = 'absolute';
        popup.style.left = `${rect.left}px`;
        popup.style.top = `${rect.top - 50}px`; // Position above the text
        popup.style.backgroundColor = 'white';
        popup.style.border = '1px solid #ccc';
        popup.style.borderRadius = '4px';
        popup.style.padding = '10px';
        popup.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        popup.style.zIndex = '1000';

        // Create the input field
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'TM No (##-##)';
        input.style.width = '120px';
        input.style.marginRight = '5px';
        input.style.padding = '5px';
        input.maxLength = 5;

        // Add event listener to format input as ##-##
        input.addEventListener('input', function () {
            // Remove all non-numeric characters (including dashes)
            let value = this.value.replace(/\D/g, '');

            // Format as ##-##
            if (value.length > 2) {
                value = value.substring(0, 2) + '-' + value.substring(2);
            }

            // Limit to format ##-## (5 characters total with dash)
            if (value.length > 5) {
                value = value.substring(0, 5);
            }

            // Update the input value
            this.value = value;
        });
        // Create the go button
        const goButton = document.createElement('button');
        goButton.textContent = 'Git';
        goButton.style.padding = '5px 10px';
        goButton.style.backgroundColor = '#0275d8';
        goButton.style.color = 'white';
        goButton.style.border = 'none';
        goButton.style.borderRadius = '4px';
        goButton.style.cursor = 'pointer';

        // Create the form container
        const formContainer = document.createElement('div');
        formContainer.style.display = 'flex';
        formContainer.appendChild(input);
        formContainer.appendChild(goButton);

        popup.appendChild(formContainer);
        document.body.appendChild(popup);

        // Focus the input
        input.focus();

        // Handle form submission
        const handleSubmit = async () => {
            const searchValue = input.value.trim();
            if (searchValue.match(/^\d{2}-\d{2}$/)) {
                const areasHome = JSON.parse(await IndexedDBStorage.getItem('areasHome_' + sessionStorage.getItem('filterDurumu') + '_' + sessionStorage.getItem('teslimDurumu')));
                let foundTM = null;

                // Search for the TM
                for (const area of areasHome) {
                    foundTM = area.transformerCenters.find(tm => tm.no === searchValue);
                    if (foundTM) break;
                }

                if (foundTM) {
                    await navigateToTM(foundTM);
                    document.body.removeChild(popup);
                } else {
                    showAlert('TM bulunamadı: ' + searchValue, '40%', '20%');
                }
            } else if (searchValue !== '') {
                showAlert('Geçerli TM No giriniz (##-##)', '40%', '20%');
            } else {
                document.body.removeChild(popup);
            }
        };

        goButton.addEventListener('click', handleSubmit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSubmit();
            }
        });

        // Close popup when clicking outside
        document.addEventListener('click', function closePopup(e) {
            if (!popup.contains(e.target) && e.target !== tmText) {
                document.body.removeChild(popup);
                document.removeEventListener('click', closePopup);
            }
        });
    });

    // Create the left circular button
    const leftButton = document.createElement('button');
    leftButton.classList.add('circle-button');
    leftButton.innerHTML = '🡐'; // Left arrow
    leftButton.id = 'leftButton';

    leftButton.addEventListener('click', async () => {
        if (prevTM == null) {
            showAlert('Önceki TM bulunamadı', '50%', '20%');
            return;
        }
        await navigateToTM(prevTM);
        document.getElementById('rightButton').disabled = false;
    });

    // Create the right circular button
    const rightButton = document.createElement('button');
    rightButton.classList.add('circle-button');
    rightButton.innerHTML = '🡒'; // Right arrow
    rightButton.id = 'rightButton';

    rightButton.addEventListener('click', async () => {
        if (nextTM == null) {
            showAlert('Sonraki TM bulunamadı.', '40%', '20%');
            return;
        }
        await navigateToTM(nextTM);
        document.getElementById('leftButton').disabled = false;
    });

    // Helper function to navigate to a specific TM
    async function navigateToTM(tm) {
        sessionStorage.setItem("eqPerf", JSON.stringify(tmEqPerfData(tm)));
        sessionStorage.setItem("naturalDisasterData", JSON.stringify(tmNaturalDisasterData(tm)));
        sessionStorage.setItem("tmEqRiskCostData", JSON.stringify(tmEqRiskCostData(tm)));
        sessionStorage.setItem("tmNaturalDisCostData", JSON.stringify(tmNaturalDisCostData(tm)));
        sessionStorage.setItem("tmName", `${tm.no} ${tm.name}:`);
        sessionStorage.setItem("tmLocation", JSON.stringify(tmLocation(tm)));
        sessionStorage.setItem('tmNo', tm.no);

        const tmNoSplitted = tm.no.split('-');
        areaID = tmNoSplitted[0];
        tmID = tmNoSplitted[1];

        let tmGroup = await findNextAndPrevTM();
        nextTM = tmGroup.nextTM;
        prevTM = tmGroup.prevTM;

        tmText.innerText = tm.no;

        tapuParselRelatedRows = tapuParselRows
            .filter(row => row[tapuParselColumns.indexOf('TM_no')] === tm.no)
            .sort((a, b) => a[tapuParselColumns.indexOf('Alternatif_no')] - b[tapuParselColumns.indexOf('Alternatif_no')]);

        tmParselRelatedRows = tmParselRows
            .filter(row => row[tmParselColumns.indexOf('TM_no')] === tm.no)
            .sort((a, b) => a[tmParselColumns.indexOf('Alternatif_no')] - b[tmParselColumns.indexOf('Alternatif_no')]);

        genelBilgiRelatedRows = genelBilgiRows
            .filter(row => row[genelBilgiColumns.indexOf('TM_no')] === tm.no)
            .sort((a, b) => a[genelBilgiColumns.indexOf('Alternatif_no')] - b[genelBilgiColumns.indexOf('Alternatif_no')]);

        document.getElementById(sessionStorage.getItem('lastBtnClicked')).click();
    }

    tmSelectionDiv.appendChild(leftButton);
    tmSelectionDiv.appendChild(tmText);
    tmSelectionDiv.appendChild(rightButton);

    // Add styling for the TM text to indicate it's interactive
    tmText.style.cursor = 'pointer';
    tmText.style.padding = '5px 10px';
    tmText.style.backgroundColor = '#f0f0f0';
    tmText.style.borderRadius = '4px';
    tmText.style.margin = '0 10px';

    // Add hover effect to indicate it's clickable
    tmText.addEventListener('mouseover', () => {
        tmText.style.backgroundColor = '#e0e0e0';
    });

    tmText.addEventListener('mouseout', () => {
        tmText.style.backgroundColor = '#f0f0f0';
    });

    // Add keyboard navigation with Ctrl+arrow keys
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey) {
            if (event.key === 'ArrowLeft') {
                // Trigger left button click
                leftButton.click();
                event.preventDefault(); // Prevent default browser behavior
            } else if (event.key === 'ArrowRight') {
                // Trigger right button click
                rightButton.click();
                event.preventDefault(); // Prevent default browser behavior
            }
        }
    });

    return tmSelectionDiv;
}

async function findNextAndPrevTM() {
    const item = await IndexedDBStorage.getItem('areasHome_' + sessionStorage.getItem('filterDurumu') + '_' + sessionStorage.getItem('teslimDurumu'));
    if (!item) {
        console.error('No areasHome found in IndexedDBStorage');
        const newAreasHome = [];
        await getBuildingData([], [], [], newAreasHome);
        await getDataFromLocations([], [], newAreasHome);
        IndexedDBStorage.setItem('areasHome_' + sessionStorage.getItem('filterDurumu') + '_' + sessionStorage.getItem('teslimDurumu'), JSON.stringify(newAreasHome));
        return findNextAndPrevTM();
    }
    const areasHome = JSON.parse(item);

    areasHome.forEach(area => {
        area.transformerCenters.sort((a, b) => a.CenterID - b.CenterID);
    });

    let tmFound = false;
    let nextTM = null;
    let prevTM = null;

    for (let i = 0; i < areasHome.length; i++) {
        const area = areasHome[i];
        for (let j = 0; j < area.transformerCenters.length; j++) {
            const tm = area.transformerCenters[j];

            if (tm.no == sessionStorage.getItem('tmNo')) {
                // Current transformer is found
                tmFound = true;

                // Check if there is a next transformer in the same area
                if (j + 1 < area.transformerCenters.length) {
                    nextTM = area.transformerCenters[j + 1];
                } else if (i + 1 < areasHome.length && areasHome[i + 1].transformerCenters.length > 0) {
                    // If there is no next transformer in the current area, check the next area
                    nextTM = areasHome[i + 1].transformerCenters[0];
                }

                break; // No need to continue once found
            }

            // If tm is not found yet, set the current tm as the previous one
            if (!tmFound) {
                prevTM = tm;
            }
        }

        // If transformer is found, break the outer loop
        if (tmFound) break;
    }

    return { nextTM, prevTM };
}