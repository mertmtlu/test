//utilities.js
import { Area, TransformerCenter, Building } from "../classes.js";

export function valueForBuilding(columnName, row, buildingDataColumnNames) {
    if (buildingDataColumnNames === undefined) {
        return null;
    }
    const index = buildingDataColumnNames.indexOf(columnName);
    if (index === -1) {
        return null;
    }
    return row[index];
}

export function extractTMNumbers(input) {
    const pattern = /(\d+)-(\d+)/;
    const match = input.match(pattern);

    if (match) {
        return { number1: parseInt(match[1], 10), number2: parseInt(match[2], 10) };
    } else {
        return null;
    }
}

export function getArea(areaID, areas) {
    let area = areas.find(a => a.AreaID === areaID);
    if (!area) {
        area = new Area(areaID);
        areas.push(area);
    }
    return area;
}

export function getTransformerCenter(centerID, transformerCenters) {
    let center = transformerCenters.find(tc => tc.CenterID === centerID);
    if (!center) {
        center = new TransformerCenter(centerID);
        transformerCenters.push(center);
    }
    return center;
}

export function getBuilding(BuildingID, buildingTmID, buildings) {
    let building = buildings.find(b => b.BuildingID === BuildingID && b.BuildingTmID === buildingTmID);
    if (!building) {
        building = new Building(BuildingID, buildingTmID);
        buildings.push(building);
    }
    return building;
}
