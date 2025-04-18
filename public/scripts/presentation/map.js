import { getImageFromNextCloud } from "../database.js";
import { showAlert } from "../utilities.js";

export function addCustomButton(map, tm_no) {
    // Create a custom control
    const CustomButton = L.Control.extend({
        options: {
            position: 'topleft' // Position below layer control
        },
        onAdd: function () {
            const buttonContainer = L.DomUtil.create('div', 'custom-button-container leaflet-bar');
            const button = L.DomUtil.create('button', 'custom-button', buttonContainer);

            // Button styling
            button.innerHTML = `
                <p style="font-size: 20px;">&#x1F5BC;</p>
            `;
            button.style.backgroundColor = 'white';
            button.style.width = '30px';
            button.style.height = '30px';
            button.style.cursor = 'pointer';
            button.style.border = 'none';
            button.style.borderRadius = '5px';


            // Prevent map interaction when clicking the button
            L.DomEvent.disableClickPropagation(button);

            // Handle button click
            L.DomEvent.on(button, 'click', function () {
                showForm(map, tm_no); // Call a function to display the form
            });

            return buttonContainer;
        }
    });

    // Add the button to the map
    map.addControl(new CustomButton());
}

function showForm(map, tm_no) {
    // Create a form element dynamically
    const formContainer = L.DomUtil.create('div', 'custom-form-container');
    formContainer.style.position = 'absolute';
    formContainer.style.top = '50%';
    formContainer.style.left = '50%';
    formContainer.style.transform = 'translate(-50%, -50%)';
    formContainer.style.backgroundColor = 'white';
    formContainer.style.padding = '20px';
    formContainer.style.border = '1px solid #ccc';
    formContainer.style.borderRadius = '10px';
    formContainer.style.zIndex = '1000';

    // Add form content
    formContainer.innerHTML = `
        <div id="imagePreview" style="margin-top: 20px; height: 700px; width: 700px; border: 1px solid #ccc; border-radius: 10px; display: flex; justify-content: center; align-items: center;">
            Loading...
        </div>
        <button id="closeForm" style="margin-top: 10px; margin-left: 50%; transform: translateX(-50%);">Close</button>
    `;

    document.body.appendChild(formContainer);

    document.getElementById('closeForm').addEventListener('click', () => {
        document.body.removeChild(formContainer);
    });

    fetchImage(tm_no)
}

async function fetchImage(tm_no) {
    try {
        const divElement = document.getElementById('imagePreview');
        divElement.innerHTML = '';

        const areaID = tm_no.number1;
        const centerID = tm_no.number2;

        const response = await getImageFromNextCloud(areaID, centerID);

        // Check the content type of the response
        const contentType = response.headers.get('content-type');

        // If we received JSON, it means there was an error
        if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(`${errorData.error} (Status: ${errorData.status})`);
        }

        if (!response.ok) {
            if (response.status === 404) {
                divElement.innerHTML = 'No image found';
                return;
            }

            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);

        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.maxWidth = '100%';
        img.alt = `TM ${areaID}-${centerID} Image`;  // Added for accessibility

        divElement.appendChild(img);

        // Clean up the object URL after the image loads
        img.onload = () => {
            URL.revokeObjectURL(imageUrl);
        };

        // Add error handling for image loading
        img.onerror = () => {
            divElement.innerHTML = 'Failed to load image';
            URL.revokeObjectURL(imageUrl);
        };

    } catch (error) {
        console.error('Error:', error);
        divElement.innerHTML = `Error loading image: ${error.message}`;
    }
}

export function initializeMap(tmNo, tmLocation, tapuParselRows, tapuParselColumns, tmParselRows, tmParselColumns, genelBilgiRows, genelBilgiColumns) {
    // Initialize the map
    const map = L.map('map').setView(tmLocation, 17);

    // Define the two tile layers
    const googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    const googleMaps = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    // Add Google Satellite layer as default
    googleSat.addTo(map);

    // Create an object for the base layers
    const baseLayers = {
        "Google Satellite": googleSat,
        "Google Maps": googleMaps
    };

    // Add the layer control to the map
    L.control.layers(baseLayers).addTo(map);

    // Add marker at tmLocation
    // const marker = L.marker(tmLocation).addTo(map);

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

    // try {
    const allPolygonCoordinates = [];

    // Loop through tapuParselRows and add polygons
    tapuParselRows.forEach((row, index) => {
        let polygon;
        let polygonCoordinates;
        try {
            polygon = row[tapuParselColumns.indexOf('geometry')];
            polygonCoordinates = parseMultipolygon(polygon);

            polygonCoordinates.forEach(polygonCoordinate => {
                allPolygonCoordinates.push(...polygonCoordinate);
                const color = index === 0 ? 'red' : 'blue';
                const polygonLayer = L.polygon(polygonCoordinate, { color }).addTo(map);

                const tmNo = row[tapuParselColumns.indexOf('TM_no')];
                const alternatifNo = row[tapuParselColumns.indexOf('Alternatif_no')];
                const area = row[tapuParselColumns.indexOf('area')];

                polygonLayer.bindTooltip(`TM no: ${tmNo}<br>Alternatif no: ${alternatifNo}<br>Alan: ${area} m&sup2;`, {
                    sticky: true
                });
            });
        }
        catch {
            console.error(`Error: TM:${tmNo}\n\nTapu Data from Database: ${polygon}\nParsed Data: ${polygonCoordinates}`)
        }
    });

    // Loop through tmParselRelatedRows and add polygons without "area" in the tooltip
    tmParselRows.forEach((row, index) => {
        let polygon;
        let polygonCoordinates;
        try {
            polygon = row[tmParselColumns.indexOf('geometry')];
            polygonCoordinates = parseMultipolygon(polygon).map(subArray =>
                subArray.filter(coords => !coords.includes(null) && !coords.includes(undefined))
            ); //TODO drop this filtering when database is updated for tm_parsel_data table.

            // console.log(polygonCoordinates);
            const color = index === 0 ? 'turquoise' : 'yellow';
            const polygonLayer = L.polygon(polygonCoordinates, { color }).addTo(map);

            const tmNo = row[tmParselColumns.indexOf('TM_no')];
            const alternatifNo = row[tmParselColumns.indexOf('Alternatif_no')];

            const genelBilgi = genelBilgiRows.find(genelBilgiRow => genelBilgiRow[genelBilgiColumns.indexOf('TM_no')] === tmNo && genelBilgiRow[genelBilgiColumns.indexOf('Alternatif_no')] === alternatifNo);

            const ada = genelBilgi[genelBilgiColumns.indexOf('Ada')];
            const parsel = genelBilgi[genelBilgiColumns.indexOf('Parsel')];
            const center = polygonLayer.getBounds().getCenter();

            polygonLayer.bindTooltip(`TM no: ${tmNo}<br>Alternatif no: ${alternatifNo}<br>Ada: ${ada}<br>Parsel: ${parsel}<br>Merkez: ${round(center.lat, 2)}, ${round(center.lng, 2)}`, {
                sticky: true
            });

            const mark = alternatifNo === 0 ? `${tmNo}` : `Alt-${alternatifNo}`;
            const size = alternatifNo === 0 ? 70 : 60;

            // Add text around the polygon with Alternatif No
            L.marker(center, {
                icon: L.divIcon({
                    className: 'polygon-label',
                    html: `<div style="
                    font-size: 25px; 
                    background-color: rgba(255, 255, 255, 0.6); /* Light background */
                    color: black; /* White text */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: ${size}px;
                    height: 40px;
                    text-align: center;
                    border-radius: 10px;
                ">${mark}</div>`,
                    iconSize: [size, 40]
                })
            }).addTo(map);
        }
        catch {
            console.error(`Error: TM:${tmNo}\n\nTm Data from Database: ${polygon}\nParsed Data: ${polygonCoordinates}`)
        }
    });


    try {
        // Fit the map bounds to the polygons
        if (allPolygonCoordinates.length > 0) {
            const bounds = L.latLngBounds(allPolygonCoordinates);
            map.fitBounds(bounds);

            const currentZoom = map.getZoom();
            const targetZoom = 14;
            if (currentZoom < targetZoom) {
                map.setZoom(targetZoom);
            }
        }
    }
    catch {

        showAlert('TM arsası ile ilgili veri bulunamadı.', '40%', '20%')
    }

    return map;

    // }
    // catch {
    //     showAlert('Harita ile ilgili bir sorunla karşılaşıldı', '40%', '20%')
    //     map.remove()
    //     document.getElementById('map').style.height = '0px'
    // }
}

export function adjustMapSize(map) {
    if (map) {
        const columnLayouts = document.querySelectorAll('.columnLayout');
        let totalWidth = 0;

        columnLayouts.forEach(column => {
            if (!column.classList.contains('map-container')) {
                totalWidth += column.offsetWidth;
            }
        });

        const mapContainer = document.querySelector('.map-container');
        const availableWidth = window.innerWidth - totalWidth - 40; // 20px padding on each side
        mapContainer.style.width = `${availableWidth - 100}px`;
        map.invalidateSize();
    }
}

function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}
