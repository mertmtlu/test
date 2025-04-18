//datamanager.js
import { extractTMNumbers, valueForBuilding, getArea, getTransformerCenter, getBuilding } from "./utilities.js";
import { fetchFrom } from "../database.js";

export async function getDataFromLocations(locations, areaIDList, areasHome) {
    const data = await fetchFrom(1000, `genel_bilgi`);

    const deleted = ['01-05', '01-36', '01-39', '05-04', '05-21', '12-21', '12-30', '12-58', '13-02', '13-03', '18-03', '18-07', '18-41'];
    const columnNamesForLocation = data[0];
    const tmNoIndex = columnNamesForLocation.indexOf("TM_no");
    const latIndex = columnNamesForLocation.indexOf("Enlem");
    const lonIndex = columnNamesForLocation.indexOf("Boylam");
    const nameIndex = columnNamesForLocation.indexOf("TM_adi");

    const allRows = data.slice(1).filter(row => !deleted.includes(row[tmNoIndex]));;
    // console.log(allRows);
    allRows.forEach(row => {
        if (row[columnNamesForLocation.indexOf('Alternatif_no')] != 0) return;

        let appendedLine = { lat: parseFloat(row[latIndex]), lon: parseFloat(row[lonIndex]), name: row[tmNoIndex], search: row[nameIndex] };
        locations.push(appendedLine);

        const tmNo = extractTMNumbers(row[tmNoIndex]);
        const AreaID = tmNo.number1;
        const CenterID = tmNo.number2;

        if (!areaIDList.includes(AreaID)) {
            areaIDList.push(AreaID);
        }

        if (deleted.includes(row[tmNoIndex])) return;

        const area = getArea(AreaID, areasHome);
        const center = getTransformerCenter(CenterID, area.transformerCenters);

        center.latitude = parseFloat(row[latIndex]);
        center.longitude = parseFloat(row[lonIndex]);
        center.no = row[tmNoIndex];
        center.name = row[nameIndex];
    });
}

export async function getBuildingData(generalInfoColumnNames, masterViewColumnNames, otherRiskColumnNames, areasHome) {
    const generalInfoProcessed = await fetchFrom(1000, `bina_genel_bilgi_processed`);
    const masterView = await fetchFrom(1000, `master_view`);
    const otherRisks = await fetchFrom(1000, 'diger_riskler')

    generalInfoColumnNames.push(...generalInfoProcessed[0]);
    const generalInfoRows = generalInfoProcessed.slice(1);

    masterViewColumnNames.push(...masterView[0]);
    const masterViewRows = masterView.slice(1);

    otherRiskColumnNames.push(...otherRisks[0])
    const otherRisksRows = otherRisks.slice(1)



    const deleted = ['01-05', '01-36', '01-39', '05-04', '05-21', '12-21', '12-30', '12-58', '13-02', '13-03', '18-03', '18-07', '18-41'];
    let bina_no = 1;
    generalInfoRows.forEach(row => {
        const tmNoRaw = valueForBuilding("TM_no", row, generalInfoColumnNames);
        const tmNo = extractTMNumbers(tmNoRaw);
        const AreaID = tmNo.number1;
        const CenterID = tmNo.number2;
        const buildingCode = valueForBuilding("Bina_kod", row, generalInfoColumnNames);
        const buildingTMID = valueForBuilding("Bina_tm_id", row, generalInfoColumnNames);

        if (deleted.includes(tmNoRaw)) return;

        const area = getArea(AreaID, areasHome);
        const center = getTransformerCenter(CenterID, area.transformerCenters);
        // const building = getBuilding(parseFloat(valueForBuilding("Bina_no", row, generalInfoColumnNames)), center.buildings);
        const building = getBuilding(buildingCode, buildingTMID, center.buildings);
        building.generalInfo.push(row);
        building.updateGeneralInfo(generalInfoColumnNames);
        bina_no = bina_no + 1;
    });

    masterViewRows.forEach(row => {
        if (valueForBuilding("Alternatif_no", row, masterViewColumnNames) !== 0) return;

        const tmNoRaw = valueForBuilding("TM_no", row, masterViewColumnNames);
        const tmNo = extractTMNumbers(tmNoRaw);
        const AreaID = tmNo.number1;
        const CenterID = tmNo.number2;

        if (deleted.includes(tmNoRaw)) return;

        const area = getArea(AreaID, areasHome);
        const center = getTransformerCenter(CenterID, area.transformerCenters);
        center.masterView.push(row);
        center.updateMasterView(masterViewColumnNames, row);
    });

    otherRisksRows.forEach(row => {
        if (valueForBuilding("Alternatif_no", row, otherRiskColumnNames)) return;

        const tmNoRaw = valueForBuilding("TM_no", row, otherRiskColumnNames);

        const tmNo = extractTMNumbers(tmNoRaw);
        const AreaID = tmNo.number1;
        const CenterID = tmNo.number2;

        if (deleted.includes(tmNoRaw)) return;

        const area = getArea(AreaID, areasHome);
        const center = getTransformerCenter(CenterID, area.transformerCenters);

        center.updateFromOtherRisk(otherRiskColumnNames, row)
    })
}

export async function updateDropdownData(areaIDList) {
    const dropdownData = document.getElementById("dropdownMenuData");
    for (const areaID of areaIDList) { //<a class="dropdown-item" data-value="Etriye Aralığı">Etriye Aralığı</a>
        const a = document.createElement('a');
        a.className = 'dropdown-item';
        a.dataset.value = areaID;
        a.textContent = areaID;

        a.addEventListener('click', function () {
            const dropdownMenu = this.closest('.dropdown-menu');
            const dropdownToggle = dropdownMenu.previousElementSibling;
            const selectedValue = this.getAttribute('data-value');
            dropdownToggle.textContent = selectedValue;
        });

        dropdownData.appendChild(a);
    }
}
