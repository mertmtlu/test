import { initializeMap, updateMarkersAndDropdown } from './mapManager.js';
import { getDataFromLocations, getBuildingData, updateDropdownData } from './dataManager.js';
import { setupEventListeners } from './eventListeners.js';
import { IndexedDBStorage } from '../IndexedDBStorage.js';

sessionStorage.setItem('lastBtnClicked', 'riskCardBtn');

let areasHome = [];
let locations = [];
const markers = {
    "default": [],
    "eqBuildings": [],
    "eq": [],
    "flood": [],
    "landslide": [],
    "fire": [],
    "security": [],
    "sound": [],
    "snow": [],
    "dirifay": [],
    "salt": [],
    "tsunami": [],
    "alternatives": [],
};

const generalInfoColumnNames = [];
const masterViewColumnsNames = [];
const otherRiskColumnNames = [];
const areaIDList = []
const dropdownMenu = document.getElementById('dropdownMenu');

// Initialize map first
const Instance = initializeMap(markers, locations, areasHome, dropdownMenu);
const map = Instance.map;
const markersLayer = Instance.markerLayers;

const version = sessionStorage.getItem('filterDurumu');
const teslimTpye = sessionStorage.getItem('teslimDurumu');

// Check if we have cached data
const cachedAreasHome = await IndexedDBStorage.getItem('areasHome_' + version + '_' + teslimTpye);
const cachedLocations = sessionStorage.getItem('locations_' + version + '_' + teslimTpye);

function sortLocations(locationsArray) {
    
    // Make a clean copy to avoid reference issues
    const sortedLocations = [...locationsArray];
    
    // Manual bubble sort (works in all browsers)
    for (let i = 0; i < sortedLocations.length; i++) {
        for (let j = 0; j < sortedLocations.length - i - 1; j++) {
            const nameA = sortedLocations[j] && sortedLocations[j].name 
                ? String(sortedLocations[j].name).toLowerCase() 
                : '';
                
            const nameB = sortedLocations[j+1] && sortedLocations[j+1].name 
                ? String(sortedLocations[j+1].name).toLowerCase() 
                : '';
                
            if (nameA > nameB) {
                // Swap elements
                const temp = sortedLocations[j];
                sortedLocations[j] = sortedLocations[j+1];
                sortedLocations[j+1] = temp;
            }
        }
    }
    
    return sortedLocations;
}

export async function initializeData() {
    if (cachedAreasHome && cachedLocations) {
        // Use cached data
        areasHome = JSON.parse(cachedAreasHome);
        locations = JSON.parse(cachedLocations);

        areasHome.forEach(element => {
            if (!(element.areaID in areaIDList)) {
                areaIDList.push(element.AreaID);
            }
        });

        // Sort the areaIDList in ascending order
        areaIDList.sort((a, b) => a - b);
        areasHome.sort((a, b) => a.AreaID - b.AreaID)

        areasHome.forEach(area => {
            area.transformerCenters.sort((a, b) => a.CenterID - b.CenterID);
        });

        // Sort locations by the 'name' property in ascending order
        // locations.sort((a, b) => a.name.localeCompare(b.name));
        locations = sortLocations(locations)

        // We still need to update the UI components
        await updateDropdownData(areaIDList);
        updateMarkersAndDropdown(map, markers, locations, areasHome, dropdownMenu, markersLayer);
    } else {
        // Load fresh data
        await getBuildingData(generalInfoColumnNames, masterViewColumnsNames, otherRiskColumnNames, areasHome);

        areasHome.forEach(element => {
            if (!(element.areaID in areaIDList)) {
                areaIDList.push(element.AreaID);
            }
        });
        
        areasHome.forEach(area => {
            area.transformerCenters.sort((a, b) => a.CenterID - b.CenterID);
        });

        await getDataFromLocations(locations, areaIDList, areasHome);

        // Sort the areaIDList in ascending order
        areaIDList.sort((a, b) => a - b);
        areasHome.sort((a, b) => a.AreaID - b.AreaID)

        // Sort locations by the 'name' property in ascending order
        // locations.sort((a, b) => a.name.localeCompare(b.name));
        locations = sortLocations(locations);

        await updateDropdownData(areaIDList);

        updateMarkersAndDropdown(map, markers, locations, areasHome, dropdownMenu, markersLayer);

        // Cache the data for future use
        IndexedDBStorage.setItem('areasHome_' + version + '_' + teslimTpye, JSON.stringify(areasHome));
        sessionStorage.setItem('locations_' + version + '_' + teslimTpye, JSON.stringify(locations));
    }

    // console.log('areasHome', areasHome);
    // console.log('locations', locations);
}

// Initialize data and set up event listeners
await initializeData();
setupEventListeners(map, markers, locations, areasHome, dropdownMenu, markersLayer);