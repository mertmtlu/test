import { valueForBuilding } from "./map/utilities.js";

export class Building {
    generalInfo = [];

    DD1 = "";
    DD2 = "";
    DD3 = "";

    constructor(BuildingID, BuildingTmID) {
        this.BuildingID = BuildingID;
        this.BuildingTmID = BuildingTmID;
    }

    //Functions

    //TODO Append here if you want to add properties for building
    updateGeneralInfo(colNames) {
        this.generalInfo.forEach(row => {
            // If not null or "" get information
            this.processedID = valueForBuilding("Bina_genel_bilgi_processed_id", row, colNames) !== null ? valueForBuilding("Bina_genel_bilgi_processed_id", row, colNames) : this.processedID;
            this.name = valueForBuilding("Bina_adi", row, colNames) !== null ? valueForBuilding("Bina_adi", row, colNames) : this.name;
            this.type = valueForBuilding("Bina_turu", row, colNames) !== null ? valueForBuilding("Bina_turu", row, colNames) : this.type;
            this.structureType = valueForBuilding("Bina_yapi_tipi", row, colNames) !== null ? valueForBuilding("Bina_yapi_tipi", row, colNames) : this.structureType;
            this.fc = valueForBuilding("Bina_fc", row, colNames) !== null ? valueForBuilding("Bina_fc", row, colNames) : this.fc;
            this.fy = valueForBuilding("Bina_fy", row, colNames) !== null ? valueForBuilding("Bina_fy", row, colNames) : this.fy;
            this.rho = valueForBuilding("Bina_donati_orani", row, colNames) !== null ? valueForBuilding("Bina_donati_orani", row, colNames) : this.rho;
            this.barSpacing = valueForBuilding("Bina_etriye_aralik", row, colNames) !== null ? valueForBuilding("Bina_etriye_aralik", row, colNames) : this.barSpacing;
            this.kanca = valueForBuilding("Bina_kanca", row, colNames) !== null ? valueForBuilding("Bina_kanca", row, colNames) : this.kanca;
            this.ground = valueForBuilding("Bina_zemin", row, colNames) !== null ? valueForBuilding("Bina_zemin", row, colNames) : this.ground;
            this.scoped = valueForBuilding("Bina_odtu_kapsamli", row, colNames) !== null ? valueForBuilding("Bina_odtu_kapsamli", row, colNames) : this.scoped;
            this.tmID = valueForBuilding("Bina_tm_id", row, colNames) !== null ? valueForBuilding("Bina_tm_id", row, colNames) : this.tmID;
            this.eqCost = valueForBuilding("Bina_guclendirme_maliyet", row, colNames) !== null ? valueForBuilding("Bina_guclendirme_maliyet", row, colNames) : this.eqCost;
            this.code = valueForBuilding("Bina_kod", row, colNames) !== null ? valueForBuilding("Bina_kod", row, colNames) : this.code;

            // Assign DD1, DD2, and DD3
            // this.DD1 = this.DD1 == "Sağlamıyor" ? this.DD1 = "Sağlamıyor" : typeof valueForBuilding("Bina_max_Pe_KH_DD-1", row, colNames) !== 'number' ? this.DD1 : valueForBuilding("Bina_max_Pe_KH_DD-1", row, colNames) > 0 ? "Sağlamıyor" : valueForBuilding("Bina_max_Pe_KH_DD-1", row, colNames) <= 0 ? "Sağlıyor" : this.DD1;
            // this.DD2 = this.DD2 == "Sağlamıyor" ? this.DD2 = "Sağlamıyor" : typeof valueForBuilding("Bina_max_Pe_KH_DD-2", row, colNames) !== 'number' ? this.DD2 : valueForBuilding("Bina_max_Pe_KH_DD-2", row, colNames) > 0 ? "Sağlamıyor" : valueForBuilding("Bina_max_Pe_KH_DD-2", row, colNames) <= 0 ? "Sağlıyor" : this.DD2;
            // this.DD3 = this.DD3 == "Sağlamıyor" ? this.DD3 = "Sağlamıyor" : typeof valueForBuilding("Bina_max_Pe_SH_DD-3", row, colNames) !== 'number' ? this.DD3 : valueForBuilding("Bina_max_Pe_SH_DD-3", row, colNames) > 0 ? "Sağlamıyor" : valueForBuilding("Bina_max_Pe_SH_DD-3", row, colNames) <= 0 ? "Sağlıyor" : this.DD3;


            this.DD1 = '';
            this.DD2 = '';
            this.DD3 = '';

            if (this.processedID == 383)
            {
                const a = 1
            }
            

            if (typeof valueForBuilding("Bina_max_Pe_KH_DD-1", row, colNames) === 'number') {
                if (valueForBuilding("Bina_max_Pe_KH_DD-1", row, colNames) > 0) this.DD1 = "Sağlamıyor";
                else if (valueForBuilding("Bina_max_Pe_KH_DD-1", row, colNames) <= 0) this.DD1 = "Sağlıyor";
            }

            if (typeof valueForBuilding("Bina_max_Pe_KH_DD-2", row, colNames) === 'number') {
                if (valueForBuilding("Bina_max_Pe_KH_DD-2", row, colNames) > 0) this.DD2 = "Sağlamıyor";
                else if (valueForBuilding("Bina_max_Pe_KH_DD-2", row, colNames) <= 0) this.DD2 = "Sağlıyor";
            }

            if (typeof valueForBuilding("Bina_max_Pe_SH_DD-3", row, colNames) === 'number') {
                if (valueForBuilding("Bina_max_Pe_SH_DD-3", row, colNames) > 0) this.DD3 = "Sağlamıyor";
                else if (valueForBuilding("Bina_max_Pe_SH_DD-3", row, colNames) <= 0) this.DD3 = "Sağlıyor";
            }

            // this.DD1 = this.DD1 == "Sağlamıyor" ? this.DD1 = "Sağlamıyor" : typeof valueForBuilding("Bina_max_Pe_KH_DD-1", row, colNames) !== 'number' ? this.DD1 : valueForBuilding("Bina_max_Pe_KH_DD-1", row, colNames) > 0 ? "Sağlamıyor" : "Sağlıyor";
            // this.DD2 = this.DD2 == "Sağlamıyor" ? this.DD2 = "Sağlamıyor" : typeof valueForBuilding("Bina_max_Pe_KH_DD-2", row, colNames) !== 'number' ? this.DD2 : valueForBuilding("Bina_max_Pe_KH_DD-2", row, colNames) > 0 ? "Sağlamıyor" : "Sağlıyor";
            // this.DD3 = this.DD3 == "Sağlamıyor" ? this.DD3 = "Sağlamıyor" : typeof valueForBuilding("Bina_max_Pe_SH_DD-3", row, colNames) !== 'number' ? this.DD3 : valueForBuilding("Bina_max_Pe_SH_DD-3", row, colNames) > 0 ? "Sağlamıyor" : "Sağlıyor";

            // this.DD1 = this.DD1 == "Sağlamıyor" ? valueForBuilding("Bina_max_Pe_KH_DD-1", row, colNames) > 0 : "Sağlıyor";
            // this.DD2 = this.DD2 == "Sağlamıyor" ? valueForBuilding("Bina_max_Pe_KH_DD-2", row, colNames) > 0 : "Sağlıyor";
            // this.DD3 = this.DD3 == "Sağlamıyor" ? valueForBuilding("Bina_max_Pe_SH_DD-3", row, colNames) > 0 : "Sağlıyor";

            // console.log(valueForBuilding("Bina_max_Pe_KH_DD-1", row, colNames) > 0)
            // console.log(valueForBuilding("Bina_max_Pe_KH_DD-2", row, colNames) > 0)
            // console.log(valueForBuilding("Bina_max_Pe_SH_DD-3", row, colNames) > 0)
        })
    }
}

export class TransformerCenter {
    buildings = [];
    masterView = [];

    no;
    name;
    latitude;
    longitude;

    constructor(CenterID) {
        this.CenterID = CenterID;
    }

    updateMasterView(colNames, row) {
        this.floodRisk = valueForBuilding("Sel_riski", row, colNames) !== null ? valueForBuilding("Sel_riski", row, colNames) : this.floodRisk;
        this.floodCost = valueForBuilding("Sel_bertaraf", row, colNames) !== null ? valueForBuilding("Sel_bertaraf", row, colNames) : '0';
        this.floodRiskScore = valueForBuilding("Sel_risk_skoru", row, colNames) !== null ? valueForBuilding("Sel_risk_skoru", row, colNames) : this.floodRiskScore;

        this.landslideRisk = valueForBuilding("Heyelan_riski", row, colNames) !== null ? valueForBuilding("Heyelan_riski", row, colNames) : this.landslideRisk;
        this.landslideCost = valueForBuilding("Heyelan_bertaraf", row, colNames) !== null ? valueForBuilding("Heyelan_bertaraf", row, colNames) : '0';
        this.landslideRiskScore = valueForBuilding("Heyelan_risk_skoru", row, colNames) !== null ? valueForBuilding("Heyelan_risk_skoru", row, colNames) : this.landslideRiskScore;

        this.fireRisk = valueForBuilding("Yangin_riski", row, colNames) !== null ? valueForBuilding("Yangin_riski", row, colNames) : this.fireRisk;
        this.fireCost = valueForBuilding("Yangin_bertaraf", row, colNames) !== null ? valueForBuilding("Yangin_bertaraf", row, colNames) : '0';
        this.fireRiskScore = valueForBuilding("Yangin_risk_skoru", row, colNames) !== null ? valueForBuilding("Yangin_risk_skoru", row, colNames) : this.fireRiskScore;

        this.securityRisk = valueForBuilding("Guvenlik_riski", row, colNames) !== null ? valueForBuilding("Guvenlik_riski", row, colNames) : this.securityRisk;
        this.securityCost = valueForBuilding("Guvenlik_bertaraf", row, colNames) !== null ? valueForBuilding("Guvenlik_bertaraf", row, colNames) : '0';
        this.securityRiskScore = valueForBuilding("Guvenlik_risk_skoru", row, colNames) !== null ? valueForBuilding("Guvenlik_risk_skoru", row, colNames) : this.securityRiskScore;

        this.soundRisk = valueForBuilding("Ses_riski", row, colNames) !== null ? valueForBuilding("Ses_riski", row, colNames) : this.soundRisk;
        this.soundCost = valueForBuilding("Ses_bertaraf", row, colNames) !== null ? valueForBuilding("Ses_bertaraf", row, colNames) : '0';
        this.soundRiskScore = valueForBuilding("Ses_risk_skoru", row, colNames) !== null ? valueForBuilding("Ses_risk_skoru", row, colNames) : this.soundRiskScore;

        this.snowslideRisk = valueForBuilding("Cig_riski", row, colNames) !== null ? valueForBuilding("Cig_riski", row, colNames) : this.snowslideRisk;
        this.snowslideCost = valueForBuilding("Cig_bertaraf", row, colNames) !== null ? valueForBuilding("Cig_bertaraf", row, colNames) : '0';
        this.snowslideRiskScore = valueForBuilding("Cig_risk_skoru", row, colNames) !== null ? valueForBuilding("Cig_risk_skoru", row, colNames) : this.snowslideRiskScore;

        this.eqRisk = valueForBuilding("Deprem_riski", row, colNames) !== null ? valueForBuilding("Deprem_riski", row, colNames) : this.eqRisk;
        this.eqCost = valueForBuilding("Deprem_bertaraf", row, colNames) !== null ? valueForBuilding("Deprem_bertaraf", row, colNames) : '0';
        this.eqRiskScore = valueForBuilding("Deprem_risk_skoru", row, colNames) !== null ? valueForBuilding("Deprem_risk_skoru", row, colNames) : this.eqRiskScore;

        this.eqBuildingRisk = valueForBuilding("Deprem_bina_riski", row, colNames) !== null ? valueForBuilding("Deprem_bina_riski", row, colNames) : this.eqBuildingRisk;
        this.eqBuildingCost = valueForBuilding("Deprem_bina_bertaraf", row, colNames) !== null ? valueForBuilding("Deprem_bina_bertaraf", row, colNames) : '0';
        this.eqBuildingRiskScore = valueForBuilding("Deprem_bina_risk_skoru", row, colNames) !== null ? valueForBuilding("Deprem_bina_risk_skoru", row, colNames) : this.eqBuildingRiskScore;

        this.eqSaltRiskAnkrajli = valueForBuilding("Deprem_salt_riski_ankrajli", row, colNames) !== null ? valueForBuilding("Deprem_salt_riski_ankrajli", row, colNames) : this.eqSaltRiskAnkrajli;
        this.eqSaltRiskAnkrajliCost = valueForBuilding("Salt_bertaraf", row, colNames) !== null ? valueForBuilding("Salt_bertaraf", row, colNames) : '0';
        this.eqSaltRiskScoreAnkrajli = valueForBuilding("Deprem_salt_risk_skoru_ankrajli", row, colNames) !== null ? valueForBuilding("Deprem_salt_risk_skoru_ankrajli", row, colNames) : this.eqSaltRiskScoreAnkrajli;

        this.dirifayRisk = valueForBuilding("Dirifay_riski", row, colNames) !== null ? valueForBuilding("Dirifay_riski", row, colNames) : this.dirifayRisk;
        this.dirifayCost = valueForBuilding("Dirifay_bertaraf", row, colNames) !== null ? valueForBuilding("Dirifay_bertaraf", row, colNames) : '0';
        this.dirifayRiskScore = valueForBuilding("Dirifay_risk_skoru", row, colNames) !== null ? valueForBuilding("Dirifay_risk_skoru", row, colNames) : this.dirifayRiskScore;

        this.saltRisk = valueForBuilding("Salt_riski", row, colNames) !== null ? valueForBuilding("Salt_riski", row, colNames) : this.saltRisk;
        this.saltCost = valueForBuilding("Salt_bertaraf", row, colNames) !== null ? valueForBuilding("Salt_bertaraf", row, colNames) : '0';
        this.saltRiskScore = valueForBuilding("Salt_risk_skoru", row, colNames) !== null ? valueForBuilding("Salt_risk_skoru", row, colNames) : this.saltRiskScore;

        this.eqTotalRisk = valueForBuilding("Deprem_riski_ankrajli", row, colNames) !== null ? valueForBuilding("Deprem_riski_ankrajli", row, colNames) : this.eqTotalRisk;
        this.eqTotalCost = valueForBuilding("Deprem_bertaraf_toplam", row, colNames) !== null ? valueForBuilding("Deprem_bertaraf_toplam", row, colNames) : this.eqTotalCost;
        this.eqTotalRiskScore = valueForBuilding("Deprem_risk_skoru_ankrajli", row, colNames) !== null ? valueForBuilding("Deprem_risk_skoru_ankrajli", row, colNames) : this.eqTotalRiskScore;

        // For tsunami risk if value is 'yok' then set it to 'çok düşük'
        // this.tsunamiRisk = valueForBuilding("Tsunami_riski", row, colNames) !== null ? valueForBuilding("Tsunami_riski", row, colNames) : this.tsunamiRisk;
        // if (this.tsunamiRisk === 'yok') this.tsunamiRisk = 'çok düşük';
        // this.tsunamiCost = valueForBuilding("Tsunami_bertaraf", row, colNames) !== null ? valueForBuilding("Tsunami_bertaraf", row, colNames) : '0';
        // this.tsunamiRiskScore = valueForBuilding("Tsunami_risk_skoru", row, colNames) !== null ? valueForBuilding("Tsunami_risk_skoru", row, colNames) : this.tsunamiRiskScore;

        this.constructionCost = valueForBuilding("Insaat_isleri_bertaraf", row, colNames) !== null ? valueForBuilding("Insaat_isleri_bertaraf", row, colNames) : this.constructionCost;
        this.electricalCost = valueForBuilding("Elektrik_isleri_bertaraf", row, colNames) !== null ? valueForBuilding("Elektrik_isleri_bertaraf", row, colNames) : this.electricalCost;

        this.toplamRiskScore = valueForBuilding("TM_toplam_riski", row, colNames) !== null ? valueForBuilding("TM_toplam_riski", row, colNames) : this.toplamRiskScore;
        this.toplamBertaraf = valueForBuilding("TM_toplam_bertaraf", row, colNames) !== null ? valueForBuilding("TM_toplam_bertaraf", row, colNames) : this.toplamBertaraf;
    }

    updateFromOtherRisk(colNames, row) {
        // console.log(row)
        // console.log(colNames)
        this.tsunamiRisk = valueForBuilding("Tsunami_riski", row, colNames) !== null ? valueForBuilding("Tsunami_riski", row, colNames) : this.tsunamiRisk;
        this.tsunamiRisk = this.tsunamiRisk == 'yok' ? 'çok düşük' : this.tsunamiRisk;

        this.sdsDD1 = valueForBuilding("Sds_DD1", row, colNames) !== null ? valueForBuilding("Sds_DD1", row, colNames) : this.sdsDD1;
        this.sdsDD2 = valueForBuilding("Sds_DD2", row, colNames) !== null ? valueForBuilding("Sds_DD2", row, colNames) : this.sdsDD2;
        this.sdsDD3 = valueForBuilding("Sds_DD3", row, colNames) !== null ? valueForBuilding("Sds_DD3", row, colNames) : this.sdsDD3;
    }
}

export class Area {
    transformerCenters = [];

    constructor(AreaID) {
        this.AreaID = AreaID;
    }

    calculateStatistics() {
        let fcValues = [];
        let rhoValues = [];
        let barSpacingValues = [];

        this.transformerCenters.forEach(center => {
            center.buildings.forEach(building => {
                if (building.fc !== undefined) fcValues.push(building.fc);
                if (building.rho !== undefined) rhoValues.push(building.rho);
                if (building.barSpacing !== undefined) barSpacingValues.push(building.barSpacing);
            });
        });

        return {
            fc: this.calculateSummary(fcValues),
            rho: this.calculateSummary(rhoValues),
            barSpacing: this.calculateSummary(barSpacingValues)
        };
    }

    calculateSummary(values) {
        values = values.filter(value => value !== undefined && value !== null && value !== "");
        if (values.length === 0) return null;

        let sum = values.reduce((a, b) => a + b, 0);
        let avg = sum / values.length;
        let min = Math.min(...values);
        let max = Math.max(...values);
        let variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / (values.length - 1);
        let stddev = Math.sqrt(variance);

        return [String(this.AreaID) + ". Bölge", Math.round(avg * 100) / 100, min, max, Math.round(stddev * 100) / 100];
    }
}
