export function tmNaturalDisasterData(tm) {
    const exportData = [["Doğal Afet", "Risk Seviyesi", "Risk Skoru"]];

    exportData.push(["Deprem-Dirifay", tm.dirifayRisk, tm.dirifayRiskScore]);
    exportData.push(["Deprem-Bina", tm.eqBuildingRisk, tm.eqBuildingRiskScore]);
    exportData.push(["Deprem-Şalt", tm.eqSaltRiskAnkrajli, tm.eqSaltRiskScoreAnkrajli]);
    exportData.push(['', '', '']);
    exportData.push(['Deprem (Toplam)', tm.eqTotalRisk, tm.eqTotalRiskScore]);
    exportData.push(["Sel-Taşkın", tm.floodRisk, tm.floodRiskScore]);
    exportData.push(["Çığ", tm.snowslideRisk, tm.snowslideRiskScore]);
    exportData.push(["Heyelan", tm.landslideRisk, tm.landslideRiskScore]);
    exportData.push(["Yangın", tm.fireRisk, tm.fireRiskScore]);
    exportData.push(["Güvenlik", tm.securityRisk, tm.securityRiskScore]);
    exportData.push(["Ses", tm.soundRisk, tm.soundRiskScore]);
    exportData.push(['Tsunami', tm.tsunamiRisk, '']);
    exportData.push(['', '', '']);
    exportData.push(['Toplam TM Riski', '', tm.toplamRiskScore]);

    return exportData;
}


function formatMaliyet(number) {
    let roundedNumber = Math.round(number / 1000) * 1000;
    let formattedNumber = roundedNumber.toLocaleString('tr-TR') + ' ₺';
    return formattedNumber;
}

export function tmEqRiskCostData(tm) {
    const exportData = [["Binalar", "Deprem Riski Bertaraf Maliyeti"]];
    tm.buildings.forEach(building => {
        if (parseInt(building.scoped) == 0) return;

        const eqCost = building.eqCost ? formatMaliyet(building.eqCost) : '0 ₺';

        exportData.push([shortenBuildingName(building.name), eqCost]);
    });
    return exportData;
}


export function tmNaturalDisCostData(tm) {
    const exportData = [["Doğal Afetler", "Bertaraf Maliyetleri"]];

    exportData.push(["Deprem-Dirifay", formatMaliyet(tm.dirifayCost)]);
    exportData.push(["Deprem-Bina", formatMaliyet(tm.eqBuildingCost)]);
    exportData.push(["Deprem-Şalt", formatMaliyet(tm.saltCost)]);
    exportData.push(['', '', '']);
    exportData.push(['Deprem (Toplam)', formatMaliyet(tm.eqTotalCost)]);
    exportData.push(["Sel-Taşkın", formatMaliyet(tm.floodCost)]);
    exportData.push(["Çığ", formatMaliyet(tm.snowslideCost)]);
    exportData.push(["Heyelan", formatMaliyet(tm.landslideCost)]);
    exportData.push(["Yangın", formatMaliyet(tm.fireCost)]);
    exportData.push(["Güvenlik", formatMaliyet(tm.securityCost)]);
    exportData.push(["Ses", formatMaliyet(tm.soundCost)]);
    exportData.push(['', '', '']);
    exportData.push(['Toplam Bertaraf Maliyeti', formatMaliyet(tm.toplamBertaraf)]);

    return exportData;
}

export function tmLocation(tm) {
    return [tm.latitude, tm.longitude];
}

export function tmEqPerfData(tm) {
    const sdsDD1 = isNaN(parseFloat(tm.sdsDD1)) ? tm.sdsDD1 : parseFloat(tm.sdsDD1).toFixed(2);
    const sdsDD2 = isNaN(parseFloat(tm.sdsDD2)) ? tm.sdsDD2 : parseFloat(tm.sdsDD2).toFixed(2);
    const sdsDD3 = isNaN(parseFloat(tm.sdsDD3)) ? tm.sdsDD3 : parseFloat(tm.sdsDD3).toFixed(2);

    const exportData = [["No", "Binalar", "DD1 (KH)\n SDS=" + sdsDD1 + " g", "DD2 (KH)\n SDS=" + sdsDD2 + " g", "DD3 (SH)\n SDS=" + sdsDD3 + " g", "Tip", "TmID"]];
    // const exportData = [["No", "Binalar", "DD1 (KH)", "DD2 (KH)", "DD3 (SH)", "Tip", "TmID"]];

    tm.buildings.forEach(building => {
        if (parseInt(building.scoped) == 0) return;

        exportData.push([building.BuildingID, shortenBuildingName(building.name), building.DD1, building.DD2, building.DD3, building.type, building.tmID]);
    });

    return exportData;
}

function shortenBuildingName(name) {
    const nameSplited = name.split(' ');
    let shortenedName = '';
    let found = false;
    if (nameSplited.length < 3) {
        return name; // return the name as it is (no need to shorten)
    }

    nameSplited.forEach(word => {
        if (found) {
            shortenedName += word + ' ';
        }

        if (word == 'TM' || word == 'Tm' || word == 'tm') {
            found = true;
        }
    });

    shortenedName = shortenedName == '' ? name : shortenedName;
    return found ? shortenedName : name;
}