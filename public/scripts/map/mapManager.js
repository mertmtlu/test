//mapManager.js
import { extractTMNumbers } from "./utilities.js";
import { tmEqPerfData, tmNaturalDisasterData, tmEqRiskCostData, tmNaturalDisCostData, tmLocation } from "../presentation/tableFillers.js";
import { fetchFrom } from "../database.js";

const possibleRisks = ['çok düşük', 'düşük', 'orta', 'yüksek'];

const tapuParsel = await fetchFrom(1000, 'tapu_parsel_data');

const tapuParselColumns = tapuParsel[0];
const tapuParselRows = tapuParsel.slice(1);


const tmParsel = await fetchFrom(1000, 'tm_parsel_data');

const tmParselColumns = tmParsel[0];
const tmParselRows = tmParsel.slice(1);


const genelBilgi = await fetchFrom(1000, 'genel_bilgi');

const genelBilgiColumns = genelBilgi[0];
const genelBilgiRows = genelBilgi.slice(1);

export function initializeMap(markers, locations, areasHome, dropdownMenu) {
    sessionStorage.setItem('focused', false);

    const map = L.map('map').setView([39.3, 34.9], 7);

    const tileLayers = {
        "Google Uydu": L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }),
        "Google Harita": L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }),
        "Diri Faylar": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }),
        "Deprem Riski": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }),
        "Deprem Riski (Bina)": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }),
        "Dirifay Riski": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }),
        "Şalt Riski": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }),
        "Sel-Taşkın Riski": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }),
        "Heyelan Riski": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }),
        "Yangın Riski": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }),
        "Güvenlik Riski": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }),
        "Ses Riski": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }),
        "Çığ Riski": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }),
        "Tsunami Riski": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }),
        "Alternatifler": L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }),
    };

    tileLayers["Google Uydu"].addTo(map);

    L.control.betterScale({
        position: 'bottomright',
        maxWidth: 150,
        metric: true,
        imperial: false,
        updateWhenIdle: false
    }).addTo(map);

    omnivore.kml('../scripts/map/assets/DFY_GEO_WGS84_2013.kml').on('ready', function () {
        this.eachLayer(function (layer) {
            layer.setStyle(
                {
                    color: 'red',
                    weight: 3,
                }
            );
        });
    }).addTo(map);

    const markerLayers = {
        "default": L.layerGroup().addTo(map),
        "eqBuildings": L.layerGroup(),
        "eq": L.layerGroup(),
        "flood": L.layerGroup(),
        "landslide": L.layerGroup(),
        "fire": L.layerGroup(),
        "security": L.layerGroup(),
        "sound": L.layerGroup(),
        "snow": L.layerGroup(),
        "dirifay": L.layerGroup(),
        "salt": L.layerGroup(),
        "tsunami": L.layerGroup(),
        "alternatives": L.layerGroup()
    };

    // Create our custom dropdown layer control
    createCustomLayerControl(map, tileLayers);

    map.on('baselayerchange', function (event) {
        handleLayerChange(event, map, markerLayers, tileLayers);
    });

    return { map, markerLayers };
}

function createCustomLayerControl(map, tileLayers) {
    // Create the control container
    const controlContainer = L.DomUtil.create('div', 'leaflet-control leaflet-custom-layers-control');
    controlContainer.style.backgroundColor = 'white';
    controlContainer.style.padding = '5px';
    controlContainer.style.borderRadius = '4px';
    controlContainer.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
    controlContainer.style.cursor = 'pointer';
    controlContainer.style.zIndex = '1000';
    
    // Create the dropdown button
    const dropdownButton = L.DomUtil.create('div', 'leaflet-custom-layers-button', controlContainer);
    dropdownButton.innerHTML = '<i class="fa fa-layers"></i> Katmanlar';
    dropdownButton.style.padding = '5px';
    dropdownButton.style.fontWeight = 'bold';
    
    // Create the dropdown content container
    const dropdownContent = L.DomUtil.create('div', 'leaflet-custom-layers-dropdown', controlContainer);
    dropdownContent.style.display = 'none';
    dropdownContent.style.position = 'absolute';
    dropdownContent.style.backgroundColor = 'white';
    dropdownContent.style.minWidth = '200px';
    dropdownContent.style.boxShadow = '0px 8px 16px 0px rgba(0,0,0,0.2)';
    dropdownContent.style.zIndex = '1001';
    dropdownContent.style.maxHeight = '400px';
    dropdownContent.style.overflowY = 'auto';
    
    // Create layer groups
    const groups = {
        "Temel Haritalar": ["Google Uydu", "Google Harita"],
        "Deprem Riskleri": ["Deprem Riski", "Deprem Riski (Bina)", "Diri Faylar", "Dirifay Riski", "Şalt Riski"],
        "Doğal Afet Riskleri": ["Sel-Taşkın Riski", "Heyelan Riski", "Çığ Riski", "Tsunami Riski"],
        "Diğer Riskler": ["Yangın Riski", "Güvenlik Riski", "Ses Riski"],
        "Özel Katmanlar": ["Alternatifler"]
    };
    
    // Keep track of the active layer
    let activeLayer = "Google Uydu";
    
    // Create the groups and layer items
    for (const [groupName, layerNames] of Object.entries(groups)) {
        // Create group header
        const groupHeader = L.DomUtil.create('div', 'leaflet-custom-layers-group', dropdownContent);
        groupHeader.innerHTML = groupName;
        groupHeader.style.padding = '8px 12px';
        groupHeader.style.fontWeight = 'bold';
        groupHeader.style.borderBottom = '1px solid #ddd';
        groupHeader.style.backgroundColor = '#f8f9fa';
        
        // Create layer items
        layerNames.forEach(layerName => {
            const layerItem = L.DomUtil.create('div', 'leaflet-custom-layers-item', dropdownContent);
            layerItem.innerHTML = `
                <input type="radio" name="layer" value="${layerName}" 
                ${layerName === activeLayer ? 'checked' : ''}>
                <span>${layerName}</span>
            `;
            layerItem.style.padding = '8px 12px 8px 24px';
            layerItem.style.cursor = 'pointer';
            layerItem.style.borderBottom = '1px solid #eee';
            
            L.DomEvent.on(layerItem, 'click', function() {
                // Update active layer
                activeLayer = layerName;
                
                // Update UI to show the selected layer
                document.querySelectorAll('.leaflet-custom-layers-item input').forEach(input => {
                    if (input.value === layerName) {
                        input.checked = true;
                    } else {
                        input.checked = false;
                    }
                });
                
                // Remove all layers first
                Object.values(tileLayers).forEach(layer => {
                    if (map.hasLayer(layer)) {
                        map.removeLayer(layer);
                    }
                });
                
                // Add the selected layer
                map.addLayer(tileLayers[layerName]);
                
                // Trigger the baselayerchange event manually
                map.fire('baselayerchange', { 
                    layer: tileLayers[layerName],
                    name: layerName 
                });
                
                // Hide dropdown after selection
                dropdownContent.style.display = 'none';
            });
        });
    }
    
    // Toggle dropdown visibility when clicking the button
    L.DomEvent.on(dropdownButton, 'click', function(e) {
        L.DomEvent.stopPropagation(e);
        if (dropdownContent.style.display === 'none') {
            dropdownContent.style.display = 'block';
        } else {
            dropdownContent.style.display = 'none';
        }
    });
    
    // Close dropdown when clicking outside
    L.DomEvent.on(document, 'click', function() {
        dropdownContent.style.display = 'none';
    });
    
    // Prevent map interactions when interacting with the control
    L.DomEvent.disableClickPropagation(controlContainer);
    L.DomEvent.disableScrollPropagation(controlContainer);
    
    // Add the control to the map
    const customControl = L.Control.extend({
        options: {
            position: 'topright'
        },
        onAdd: function() {
            return controlContainer;
        }
    });
    
    map.addControl(new customControl());
}

function handleLayerChange(event, map, markerLayers, tileLayers) {
    const legend = map.legend || initializeLegend(event.name);
    map.legend = legend;

    Object.values(markerLayers).forEach(layer => map.removeLayer(layer));
    clearTexts();

    let layerKey = '';
    for (const [key, layer] of Object.entries(tileLayers)) {
        if (event.layer === layer) {
            layerKey = convertKey(key);
            map.addLayer(markerLayers[layerKey]);
        }
    }

    if (sessionStorage.getItem('focused') === 'true') {
        document.getElementById('focus').click();
    }

    // Show legend for specific layers, hide for "default"
    if (layerKey === 'default') {
        map.removeControl(legend);
    } else {
        if (!legend._map) {
            legend.addTo(map);
        }
        updateLegend(layerKey, legend, event.name);
    }

    // Additional logic for filtering and updating markers
}

function initializeLegend(name) {
    // Define legend content for each layer
    const legend = L.control({ position: 'bottomleft' });

    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        div.innerHTML += `<h4>${name}</h4>`;
        return div;
    };

    return legend;
}

function updateLegend(layerKey, legend, name) {
    const legendDiv = [
        { color: "red", label: "Yüksek" },
        { color: "orange", label: "Orta" },
        { color: "yellow", label: "Düşük" },
        { color: "green", label: "Çok Düşük" }
    ]

    const legendContent = {
        "eqBuildings": legendDiv,
        "eq": legendDiv,
        "flood": legendDiv,
        "landslide": legendDiv,
        "fire": legendDiv,
        "security": legendDiv,
        "sound": legendDiv,
        "snow": legendDiv,
        "dirifay": legendDiv,
        "salt": legendDiv,
        "tsunami": legendDiv
    };

    if (legendContent[layerKey]) {
        legend.getContainer().innerHTML = `<h4>${name}</h4>`;
        legendContent[layerKey].forEach(item => {
            legend.getContainer().innerHTML += `
                <i style="background: ${item.color}; border-radius: 50%; width: 15px; height: 15px; display: inline-block;"></i>
                <span>${item.label}</span><br>
            `;
        });
    } else {
        // Hide the legend for default or other cases
        legend.getContainer().innerHTML = '';
    }
}

export function convertKey(key) {
    switch (key) {
        case "Deprem Riski (Bina)":
            return "eqBuildings";
        case "Deprem Riski":
            return "eq";
        case "Sel-Taşkın Riski":
            return "flood";
        case "Heyelan Riski":
            return "landslide";
        case "Yangın Riski":
            return "fire";
        case "Güvenlik Riski":
            return "security";
        case "Ses Riski":
            return "sound";
        case "Çığ Riski":
            return "snow";
        case "Deprem Riski":
            return "eq";
        case "Dirifay Riski":
            return "dirifay";
        case "Şalt Riski":
            return "salt";
        case "Tsunami Riski":
            return "tsunami";
        case "Alternatifler":
            return "alternatives";
        default:
            return "default";
    }
}

export function updateMarkersAndDropdown(map, markers, locations, areasHome, dropdownMenu, markerLayers) {// TODO change this funtion instead of clearing all and replacing with new ones, diasble show and hide of layers
    const a = document.querySelectorAll('#leaflet-pane leaflet-marker-pane')
    a.innerHTML = ''
    clearTexts();
    Object.keys(markerLayers).forEach(key => {
        clearPolygons(markerLayers[key], markers[key]);
        clearMarkers(markerLayers[key], markers[key]);
        markers[key].forEach(marker => {
            marker.off()
            marker.remove();
        });
        markers[key] = [];
        markerLayers[key]._layers = [];
    });

    dropdownMenu.innerHTML = '';

    locations.forEach(location => {
        let found = false;
        
        for (let i = 0; i < areasHome.length; i++) {
            const area = areasHome[i];
            // area.transformerCenters.sort((a, b) => a.CenterID - b.CenterID);
            
            for (let j = 0; j < area.transformerCenters.length; j++) {
                const tm = area.transformerCenters[j];
                if (tm.no === location.name) {
                    addMarkerToLayers(tm, markerLayers, markers, dropdownMenu, map);
                    found = true;
                    break; // Exit the inner loop once a match is found
                }
            }
            
            if (found) {
                break; // Exit the areas loop once a match is found
            }
        }
    });

    // console.log('Calculating...')
    // console.log('Map Size: ' + roughSizeOfObject(map));
    // console.log('Markers Size: ' + roughSizeOfObject(markers));
    // console.log('Locations Size: ' + roughSizeOfObject(locations));
    // console.log('AreasHome Size: ' + roughSizeOfObject(areasHome));
    // console.log('DropdownMenu Size: ' + roughSizeOfObject(dropdownMenu));
    // console.log((markerLayers['alternatives']._layers));
}

function roughSizeOfObject(object) {
    const objectList = [];
    const stack = [object];
    let bytes = 0;

    while (stack.length) {
        const value = stack.pop();

        switch (typeof value) {
            case 'boolean':
                bytes += 4;
                break;
            case 'string':
                bytes += value.length * 2;
                break;
            case 'number':
                bytes += 8;
                break;
            case 'object':
                if (!objectList.includes(value)) {
                    objectList.push(value);
                    for (const prop in value) {
                        if (value.hasOwnProperty(prop)) {
                            stack.push(value[prop]);
                        }
                    }
                }
                break;
        }
    }

    return bytes / (1024 * 1024) + ' mb';
}

export function addMarkerToLayers(tm, markerLayers, markers, dropdownMenu, map) {
    addDefaultMarker(tm, markerLayers["default"], markers["default"], dropdownMenu, map);
    addLandslideMarker(tm, markerLayers["landslide"], markers["landslide"]);
    addFloodMarker(tm, markerLayers["flood"], markers["flood"]);
    addFireMarker(tm, markerLayers["fire"], markers["fire"]);
    addSecurityMarker(tm, markerLayers["security"], markers["security"]);
    addSoundMarker(tm, markerLayers["sound"], markers["sound"]);
    addSnowslideMarker(tm, markerLayers["snow"], markers["snow"]);
    addEarthquakeBuildingsMarker(tm, markerLayers["eqBuildings"], markers["eqBuildings"]);
    addEarthquakeMarker(tm, markerLayers["eq"], markers["eq"]);
    addDirifayMarker(tm, markerLayers["dirifay"], markers["dirifay"]);
    addSaltMarker(tm, markerLayers["salt"], markers["salt"]);
    addTsunamiMarker(tm, markerLayers["tsunami"], markers["tsunami"]);
    addAlternativeMarker(tm, markerLayers["alternatives"], markers["alternatives"]);
}

function getClassnameFor(tmNo) {
    const areaID = tmNo.split('-')[0];

    switch (areaID) {
        case '01':
            return 'st4';
        case '02':
            return 'st0';
        case '03':
            return 'st7';
        case '04':
            return 'st3';
        case '05':
            return 'st22';
        case '06':
            return 'st10';
        case '07':
            return 'st6';
        case '08':
            return 'st11';
        case '09':
            return 'st12';
        case '10':
            return 'st9';
        case '11':
            return 'st13';
        case '12':
            return 'st19';
        case '13':
            return 'st16';
        case '14':
            return 'st14';
        case '15':
            return 'st17';
        case '16':
            return 'st15';
        case '17':
            return 'st18';
        case '18':
            return 'st20';
        case '19':
            return 'st5';
        case '20':
            return 'st1';
        case '21':
            return 'st8';
        case '22':
            return 'st21';
    }
}

function addDefaultMarker(tm, layer, markers, dropdownMenu, map) {
    // Predefine icons for different zoom levels
    const defaultIcon = L.divIcon({
        className: getClassnameFor(tm.no), // Custom class for styling the div
        html: `
            <div class="icon-wrapper" style="
                width: 0px; 
                height: 0px; 
                border: 2px solid rgba(0, 0, 0, 0.8); 
                border-radius: 50%;
                box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);">
            </div>
        `,
        iconSize: [16, 16], // Adjust size as needed
        iconAnchor: [8, 8], // Center anchor point for the circle
        popupAnchor: [0, -8] // Adjust popup position
    });

    const zoomedIcon = L.divIcon({
        className: getClassnameFor(tm.no), // Custom class for styling the div
        html: `
            <div class="icon-wrapper">
                <img src='../scripts/map/assets/icons8-substation.svg' alt="Transformer Icon" />
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [26, 0],
        popupAnchor: [0, 0]
    });

    // Create the marker with the default icon
    const marker = L.marker([tm.latitude, tm.longitude], { icon: defaultIcon }).addTo(layer);

    // Push the marker to the markers array
    markers.push(marker);

    // Create and configure button for the popup
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-block';
    btn.textContent = `${tm.no} ${tm.name}`;
    btn.addEventListener('click', function () {
        sessionStorage.setItem("eqPerf", JSON.stringify(tmEqPerfData(tm)));
        sessionStorage.setItem("naturalDisasterData", JSON.stringify(tmNaturalDisasterData(tm)));
        sessionStorage.setItem("tmEqRiskCostData", JSON.stringify(tmEqRiskCostData(tm)));
        sessionStorage.setItem("tmNaturalDisCostData", JSON.stringify(tmNaturalDisCostData(tm)));
        sessionStorage.setItem("tmName", `${tm.no} ${tm.name}:`);
        sessionStorage.setItem("tmLocation", JSON.stringify(tmLocation(tm)));
        sessionStorage.setItem('tmNo', tm.no);

        window.location.href = "presentation.html";
    });

    // Add button to the marker's popup
    const dv = document.createElement('div');
    dv.appendChild(btn);
    marker.bindPopup(dv);

    // Create and configure dropdown item
    const div = document.createElement('div');
    div.className = 'dropdown-item';
    div.textContent = tm.no;
    div.dataset.lat = tm.latitude;
    div.dataset.lon = tm.longitude;
    dropdownMenu.appendChild(div);

    // Add click event to dropdown item
    div.addEventListener('click', function () {
        map.setView([tm.latitude, tm.longitude], 18);
        marker.openPopup();
    });

    // Listen for map zoom level changes
    const zoomThreshold = 10; // Define the threshold
    map.on("zoomend", () => {
        const currentZoom = map.getZoom();
        const newIcon = currentZoom > zoomThreshold ? zoomedIcon : defaultIcon;

        // Only update the icon if it is different
        if (marker.getIcon() !== newIcon) {
            marker.setIcon(newIcon);
        }
    });
}

function createMarker(tm, layer, markers, riskType, possibleRisks) {
    // const nullCase = ""; 
    // if (!(possibleRisks.includes(tm[riskType]) || tm[riskType] === nullCase)) {
    //     tm[riskType] = 'çok düşük';
    // }

    const color = getInterpolatedColor(tm[riskType]);

    // Create a circle marker with the interpolated color
    const marker = L.circleMarker([tm.latitude, tm.longitude], {
        radius: 12, // Adjust the radius as needed
        color: color,
        fillColor: color,
        fillOpacity: 0.8
    }).addTo(layer);

    // Create and configure the text label
    createTextLabel(tm, layer);

    // Create and configure the popup button
    createPopupButton(tm, marker);

    // Create and configure the tooltip with detailed risk card-like content
    const tooltipContent = `
        <div class="risk-card">
            <h4>${tm.name} (${tm.no})</h4>
            <table>
                <tr><th>Risk</th><td>${tm[riskType]}</td></tr>
                <tr><th>Enlem</th><td>${tm.latitude}</td></tr>
                <tr><th>Boylam</th><td>${tm.longitude}</td></tr>
                <tr><th>Dirifay Riski</th><td>${tm.dirifayRisk}</td></tr>
                <tr><th>Sel Riski</th><td>${tm.floodRisk}</td></tr>
                <tr><th>Çığ Riski</th><td>${tm.snowslideRisk}</td></tr>
                <tr><th>Heyelan Riski</th><td>${tm.landslideRisk}</td></tr>
                <tr><th>Yangın Riski</th><td>${tm.fireRisk}</td></tr>
                <tr><th>Güvenlik Riski</th><td>${tm.securityRisk}</td></tr>
                <tr><th>Ses Riski</th><td>${tm.soundRisk}</td></tr>
                <tr><th>Deprem Riski (Bina)</th><td>${tm.eqBuildingRisk}</td></tr>
                <tr><th>Şalt Riski</th><td>${tm.saltRisk}</td></tr>
                <tr><th>Deprem Riski</th><td>${tm.eqRisk}</td></tr>
                <tr><th>Tsunami Riski</th><td>${tm.tsunamiRisk}</td></tr>
            </table>
        </div>
    `;
    marker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -10] });

    // Push the marker to the markers array
    markers.push(marker);
}

function createPieChartMarker(tm, layer, markers, riskType, possibleRisks) {
    const nullCase = "";

    let sagliyorCount = 0;
    let saglamiyorCount = 0;
    let noDataCount = 0;

    // Loop through tm.buildings to count the statuses
    tm.buildings.forEach(building => {
        if (building.scoped == 0) return;

        const value = building.code == 10 ? building.DD2 : // Why this was 01 before?
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

    const totalCount = sagliyorCount + saglamiyorCount + noDataCount;

    if (totalCount === 0) {
        // No data available, we can skip creating a marker or create a default one
        return;
    }

    // Calculate the percentage for each segment of the pie
    const sagliyorPercentage = (sagliyorCount / totalCount) * 360;
    const saglamiyorPercentage = (saglamiyorCount / totalCount) * 360;
    const noDataPercentage = (noDataCount / totalCount) * 360;

    const iconSize = 30;

    // Create the pie chart using CSS conic-gradient
    const pieChartHtml = `
        <div class="pie-chart-container" style="width: ${iconSize}px; height: ${iconSize}px; border-radius: 50%; background: conic-gradient(
            #00FF00 ${sagliyorPercentage}deg,       /* Sağlıyor - Green */
            #FF0000 ${sagliyorPercentage}deg ${sagliyorPercentage + saglamiyorPercentage}deg,  /* Sağlamıyor - Red */
            #CCCCCC ${sagliyorPercentage + saglamiyorPercentage}deg 360deg  /* No Data - Gray */
        );"></div>
    `;


    // Create a custom DivIcon for the pie chart marker
    const pieChartIcon = L.divIcon({
        html: pieChartHtml,
        className: 'pie-chart-icon', // Optional class for additional styling
        iconSize: [iconSize, iconSize], // Adjust icon size as needed
        iconAnchor: [iconSize / 2, iconSize / 2], // Center the icon
        popupAnchor: [0, -10]
    });

    // Create the marker with the pie chart icon
    const marker = L.marker([tm.latitude, tm.longitude], { icon: pieChartIcon }).addTo(layer);

    // Create and configure the text label
    createTextLabel(tm, layer);

    // Create and configure the popup button
    createPopupButton(tm, marker);

    // Optional: Bind a tooltip or popup for more details
    const tooltipContent = `
        <div>
            <strong>${tm.name}</strong><br>
            Sağlıyor: ${sagliyorCount}<br>
            Sağlamıyor: ${saglamiyorCount}<br>
            No Data: ${noDataCount}
        </div>
    `;
    marker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -10] });

    // Add the marker to the markers array
    markers.push(marker);
}

function createAlternativeMarker(tm, layer, markers, tapuParselRows, tapuParselColumns, tmParselRows, tmParselColumns, genelBilgiRows, genelBilgiColumns) {

    const allPolygonCoordinates = [];

    tapuParselRows.forEach(row => {
        let polygon;
        let polygonCoordinates;
        try {
            polygon = row[tapuParselColumns.indexOf('geometry')];
            polygonCoordinates = parseMultipolygon(polygon).map(subArray =>
                subArray.filter(coords => !coords.includes(null) && !coords.includes(undefined))
            ); //TODO drop this filtering when database is updated for tm_parsel_data table from Norgen's database.

            polygonCoordinates.forEach(polygonCoordinate => {
                allPolygonCoordinates.push(...polygonCoordinate);
                const color = row[tapuParselColumns.indexOf('Alternatif_no')] === 0 ? 'red' : 'blue';
                const polygonLayer = L.polygon(polygonCoordinate, { color }).addTo(layer);
                markers.push(polygonLayer);

                const tmNo = row[tapuParselColumns.indexOf('TM_no')];
                const alternatifNo = row[tapuParselColumns.indexOf('Alternatif_no')];
                const area = row[tapuParselColumns.indexOf('area')];

                polygonLayer.bindTooltip(`TM no: ${tmNo}<br>Alternatif no: ${alternatifNo}<br>Alan: ${area} m&sup2;`, {
                    sticky: true
                });

            });
        }
        catch {
            // console.error(`Error: TM:${tm.no}\n\nTapu Data from Database: ${polygon}\nParsed Data: ${polygonCoordinates}`)
        }


    });

    tmParselRows.forEach(row => {
        let polygon;
        let polygonCoordinates;
        try {
            polygon = row[tmParselColumns.indexOf('geometry')];
            polygonCoordinates = parseMultipolygon(polygon).map(subArray =>
                subArray.filter(coords => !coords.includes(null) && !coords.includes(undefined))
            ); //TODO drop this filtering when database is updated for tm_parsel_data table from Norgen's database.

            const color = row[tmParselColumns.indexOf('Alternatif_no')] === 0 ? 'turquoise' : 'yellow';
            const polygonLayer = L.polygon(polygonCoordinates, { color }).addTo(layer);
            markers.push(polygonLayer);

            const tmNo = row[tmParselColumns.indexOf('TM_no')];
            const alternatifNo = row[tmParselColumns.indexOf('Alternatif_no')];

            const genelBilgi = genelBilgiRows.find(genelBilgiRow => genelBilgiRow[genelBilgiColumns.indexOf('TM_no')] === tmNo && genelBilgiRow[genelBilgiColumns.indexOf('Alternatif_no')] === alternatifNo);

            const ada = genelBilgi[genelBilgiColumns.indexOf('Ada')];
            const parsel = genelBilgi[genelBilgiColumns.indexOf('Parsel')];
            const center = polygonLayer.getBounds().getCenter();

            polygonLayer.bindTooltip(`TM no: ${tmNo}<br>Alternatif no: ${alternatifNo}<br>Ada: ${ada}<br>Parsel: ${parsel}<br>Merkez: ${round(center.lat, 2)}, ${round(center.lng, 2)}`, {
                sticky: true
            });

            const mark = alternatifNo === 0 ? `${tmNo}: Mevcut` : `${tmNo}: Alt-${alternatifNo}`;
            const size = alternatifNo === 0 ? 95 : 80;

            // Add text around the polygon with Alternatif No

            const polygonDiv = document.createElement('div');
            polygonDiv.className = 'polygon-label';
            polygonDiv.innerHTML = `<div>${mark}</div>`;

            L.marker(center, {
                icon: L.divIcon({
                    className: 'polygon-label',
                    html: polygonDiv.outerHTML,
                    iconSize: [size, 1]
                })
            }).addTo(layer);
        }
        catch {
            // console.error(`Error: TM:${tm.no}\n\nTm Data from Database: ${polygon}\nParsed Data: ${polygonCoordinates}`)
        }


    });
}

function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}


// Helper function to convert MULTIPOLYGON string to an array of LatLng coordinates
function parseMultipolygon(multipolygonStr) {
    let coordinatesStr = multipolygonStr
        .replace('MULTIPOLYGON (((', '')
        .replace('POLYGON ((', '')
        .replace('MULTIPOLYGON Z (((', '')
        .replace('POLYGON Z ((', '')
        .replace(/\)\)\)/g, '');


    const polygonSets = coordinatesStr.split(')), ((');

    const polygons = polygonSets.map(polygonStr => {
        if (polygonStr.includes('), (')) {
            const firstPolygon = polygonStr.split('), (')[0];
            return firstPolygon.split(', ').map(coord => {
                const coords = coord.split(' ').map(Number);
                return [coords[1], coords[0]]; // [lat, lng], ignore Z if present
            });
        }

        return polygonStr.split(', ').map(coord => {
            const coords = coord.replace(',', '').replace('))', '').split(' ').map(Number);
            return [coords[1], coords[0]]; // [lat, lng], ignore Z if present
        });
    });

    return polygons;
}

function createTextLabel(tm, layer) {
    const labelIcon = L.divIcon({
        className: 'text-label',
        html: `<span>${tm.no}</span>`,
        iconSize: [0, 0]
    });

    // Create a marker with the div icon as the text label
    L.marker([tm.latitude, tm.longitude], { icon: labelIcon }).addTo(layer);

    // Add styling for the text label
    const style = document.createElement('style');
    style.innerHTML = `
        .text-label {
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            color: black;
            white-space: nowrap;
            transform: translate(-50%, -20px);
        }
    `;
    document.head.appendChild(style);
}

function createPopupButton(tm, marker) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-block';
    btn.textContent = `${tm.no} ${tm.name}`;

    btn.addEventListener('click', function () {
        sessionStorage.setItem("eqPerf", JSON.stringify(tmEqPerfData(tm)));
        sessionStorage.setItem("naturalDisasterData", JSON.stringify(tmNaturalDisasterData(tm)));
        sessionStorage.setItem("tmEqRiskCostData", JSON.stringify(tmEqRiskCostData(tm)));
        sessionStorage.setItem("tmNaturalDisCostData", JSON.stringify(tmNaturalDisCostData(tm)));
        sessionStorage.setItem("tmName", `${tm.no} ${tm.name}:`);
        sessionStorage.setItem("tmLocation", JSON.stringify(tmLocation(tm)));
        sessionStorage.setItem('tmNo', tm.no);

        window.location.href = "presentation.html";
    });

    const dv = document.createElement('div');
    dv.appendChild(btn);
    marker.bindPopup(dv);
}

// Wrapper functions for each marker type
function addFloodMarker(tm, layer, markers) {
    createMarker(tm, layer, markers, 'floodRisk', possibleRisks);
}

function addLandslideMarker(tm, layer, markers) {
    createMarker(tm, layer, markers, 'landslideRisk', possibleRisks);
}

function addFireMarker(tm, layer, markers) {
    createMarker(tm, layer, markers, 'fireRisk', possibleRisks);
}

function addSecurityMarker(tm, layer, markers) {
    createMarker(tm, layer, markers, 'securityRisk', possibleRisks);
}

function addSoundMarker(tm, layer, markers) {
    createMarker(tm, layer, markers, 'soundRisk', possibleRisks);
}

function addSnowslideMarker(tm, layer, markers) {
    createMarker(tm, layer, markers, 'snowslideRisk', possibleRisks);
}

function addEarthquakeBuildingsMarker(tm, layer, markers) {
    createPieChartMarker(tm, layer, markers, 'eqBuildingRisk', possibleRisks);
    // createMarker(tm, layer, markers, 'eqBuildingRisk', possibleRisks);
}

function addEarthquakeMarker(tm, layer, markers) {
    createMarker(tm, layer, markers, 'eqRisk', possibleRisks);
}

function addDirifayMarker(tm, layer, markers) {
    createMarker(tm, layer, markers, 'dirifayRisk', possibleRisks);
}

function addSaltMarker(tm, layer, markers) {
    createMarker(tm, layer, markers, 'saltRisk', possibleRisks);
}

function addTsunamiMarker(tm, layer, markers) {
    createMarker(tm, layer, markers, 'tsunamiRisk', possibleRisks);
}

function addAlternativeMarker(tm, layer, markers) {
    createAlternativeMarker(tm, layer, markers, tapuParselRows.filter(row => row[tapuParselColumns.indexOf('TM_no')] == tm.no), tapuParselColumns,
        tmParselRows.filter(row => row[tmParselColumns.indexOf('TM_no')] == tm.no), tmParselColumns,
        genelBilgiRows.filter(row => row[genelBilgiColumns.indexOf('TM_no')] == tm.no), genelBilgiColumns);
    const a = 1;
}

function getInterpolatedColor(name) {
    switch (name) {
        case "çok düşük":
            return "rgba(0, 255, 0, 1)";
        case "düşük":
            return "rgba(255, 255, 0, 1)";
        case "orta":
            return "rgba(255, 144, 0, 1)";
        case "yüksek":
            return "rgba(255, 0, 0, 1)";
        case "çok yüksek":
            return "rgba(140, 0, 0, 1)";
        default:
            return "rgba(128, 128, 128, 1)";
    }
}

function clearMarkers(layer, markers) {
    markers.forEach(marker => layer.removeLayer(marker));
}

function clearPolygons(layer, polygons) {
    const polygonLabel = document.querySelectorAll('.polygon-label');
    polygonLabel.forEach(label => {
        label.remove();
    });

    polygons.forEach(polygon => layer.removeLayer(polygon));
}

function clearTexts() {
    const texts = document.querySelectorAll('.text-label');
    texts.forEach(text => text.innerHTML = '');
}