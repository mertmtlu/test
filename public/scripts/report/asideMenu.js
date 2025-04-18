import * as quill from './quill.js'
import * as python from './python.js';
import { showAlert, createCollapsibleSection, escapeSelector } from '../utilities.js';
import { IndexedDBStorage } from '../IndexedDBStorage.js';
import { fetchFrom, getImage, setImage, setReport, getImageExistence } from '../database.js';

const areasHome = await IndexedDBStorage.getItem('areasHome_' + sessionStorage.getItem('filterDurumu') + '_' + sessionStorage.getItem('teslimDurumu')) ? JSON.parse(await IndexedDBStorage.getItem('areasHome_' + sessionStorage.getItem('filterDurumu') + '_' + sessionStorage.getItem('teslimDurumu'))) : [];

const canUploadImagesWithFolderSelection = false; // Only host can upload images with folder. For others, it takes a long time to upload images

const tmNO = 'TM_no';
const reportNO = "MY_RAPOR_NO"
const asideMenu = document.getElementById('reportTools');
const indents = {
    'variable': '$', // For contents that can be changed in input boxes
    'dropdown': '#', // For contents that can be changed in dropdowns
    'operator': '!', // For contents that are dependent to other variables
    'image': '*', // For automated images
    'content': 'C' // For other automations
    // Add options for more feature
}

let selectedImageFolder = '';
let genelBilgiProcessed = [];
let tmInfo = [];
let digerRiskler = [];
let deterministic = [];

let dataFetched = false;
fetchAllData();

async function fetchAllData() {
    const refBtn = document.getElementById("refreshBtn");

    const spinner = document.createElement('span');
    spinner.classList.add('spinner-border', 'spinner-border-sm', 'me-2');
    spinner.setAttribute('role', 'status');
    spinner.setAttribute('aria-hidden', 'true');
    refBtn.prepend(spinner);

    const genelBilgiProcessedPromise = fetchFrom(1000, 'bina_genel_bilgi_processed');
    const tmInfoPromise = fetchFrom(1000, 'genel_bilgi');
    const digerRisklerPromise = fetchFrom(1000, 'diger_riskler');
    const deterministicPromise = fetchFrom(1000, 'bina_analiz_data_deterministic');

    // Fetch all data concurrently
    [genelBilgiProcessed, digerRiskler] = await Promise.all([
        genelBilgiProcessedPromise,
        digerRisklerPromise
    ]);

    const [tmInfoRaw, deterministicRaw] = await Promise.all([
        tmInfoPromise,
        deterministicPromise
    ]);

    tmInfo = tmInfoRaw;
    deterministic = deterministicRaw;

    // Set dataFetched to true to enable the button
    dataFetched = true;
    enableButton();
    spinner.remove();
    refBtn.textContent = 'Uygula';
}

function enableButton() {
    if (dataFetched) {
        // Enable the button
        document.getElementById("refreshBtn").disabled = false;
    }
}

export function createBuildingInfoEditor(alert = true) {
    asideMenu.innerHTML = '';
    const contents = getChangeableContent(quill.Instance.root.innerHTML, indents['variable']);
    const options = getChangeableContent(quill.Instance.root.innerHTML, indents['dropdown']);

    // Handle imperfections
    if (!validateTemplate(contents, options, alert)) {
        return;
    }


    // Check for missing info
    let buildings = fetchBuildings();
    if (!validateBuildings(buildings, contents, alert)) return;

    const main = document.createElement('div');
    main.style.flex = '1'

    // Append building checkboxes section
    const buildingCheckboxesSectionInner = createBuildingCheckboxes(buildings);
    const buildingCheckboxesSection = createCollapsibleSection(buildingCheckboxesSectionInner, 'Raporlar');
    main.appendChild(buildingCheckboxesSection);
    // asideMenu.appendChild(document.createElement('hr'));

    // Append building info section
    const buildingInfoSectionInner = createBuildingInfoSection(buildings, options, contents);
    const buildingInfoSection = createCollapsibleSection(buildingInfoSectionInner, 'Detaylar');
    main.appendChild(buildingInfoSection);

    // Button section
    const buttonContainer = createButtonContainer(buildings, buildingCheckboxesSection);
    asideMenu.appendChild(main);
    asideMenu.appendChild(buttonContainer);

    // Set max height for infoOuterDiv
    // const setInfoOuterDivMaxHeight = () => {
    //     const asideMenuHeight = asideMenu.offsetHeight;
    //     const buttonContainerHeight = buttonContainer.offsetHeight;
    //     const maxHeight = asideMenuHeight - buttonContainerHeight - 100;
    //     main.style.maxHeight = maxHeight + 'px';
    // }

    // window.addEventListener('resize', setInfoOuterDivMaxHeight);
}

function validateTemplate(contents, options, alerted) {
    if (contents.length === 0 && options.length === 0) {
        if (alerted) showAlert('Lütfen bir şablon seçiniz.', "50%", "25%");
        return false;
    }
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        let optiondivided = option.split(indents['dropdown']);
        if (optiondivided.length % 2 == 0) {
            if (alerted) showAlert('Dropdowns (#{content}) are not correctly initialized.', "50%", "25%");
            return false;
        }
    }

    return true;
}

function validateBuildings(buildings, contents, alerted) {
    let returnVal = false;
    let alertStr = '';

    for (const building of buildings) {
        if (returnVal) break;
        for (const key in building.contents) {
            if (!contents.includes(key)) {
                alertStr += `Missing content: ${key}.\n`;
                returnVal = true;
            }
        }
    }

    if (alerted && alertStr) {
        showAlert(alertStr, "50%", "25%");
    }

    return !returnVal;
}

function createBuildingCheckboxes(buildings) {

    const buildingOuterDiv = createElement('div', {}, [], {
        overflowX: 'auto',
        overflowY: 'auto',
        marginLeft: '10px',
        marginTop: '15px',
        width: '90%',
        maxHeight: '20%',
    });

    buildings.forEach(building => {
        const newDiv = createElement('div', {}, ['form-group', 'mb-2', 'd-flex', 'align-items-center'], { marginLeft: '50px' });
        const label = createElement('label', { for: building.name }, [], { flex: '0 0 90%', marginRight: '10px' });
        label.textContent = `${building.name}:`;
        const checkbox = createElement('input', { type: 'checkbox', id: building.name, name: building.name }, ['form-check-input'], { position: 'relative', bottom: '5px', flex: '0 0 8%' });
        newDiv.appendChild(checkbox);
        newDiv.appendChild(label);
        buildingOuterDiv.appendChild(newDiv);
    });

    if (canUploadImagesWithFolderSelection) {
        const details = 'Konum fotoğraflarını içeren klasörü seçiniz';
        const labelElement = createSelectElement(details);

        buildingOuterDiv.appendChild(labelElement);
    }

    return buildingOuterDiv;
}

function createSelectElement(details) {
    // TODO drop this and make it a local folder to get files
    const folderSelectAttributes = {
        type: 'file',
        id: 'folderSelect',
        name: 'folderSelect',
        webkitdirectory: '',
        style: 'display: none;'
    };

    const labelAttributes = {
        for: 'folderSelect',
        title: details
    };

    const labelClasses = ['btn', 'btn-primary', 'btn-block'];
    const labelStyles = {
        cursor: 'pointer',
        display: 'inline-block',
        textAlign: 'center'
    };

    const folderSelectElement = createElement('input', folderSelectAttributes);
    const labelElement = createElement('label', labelAttributes, labelClasses, labelStyles);
    labelElement.textContent = 'Klasör seç';
    labelElement.appendChild(folderSelectElement);

    folderSelectElement.addEventListener('change', (event) => {
        selectedImageFolder = event.target.files;
    });

    return labelElement;
}

function createBuildingInfoSection(buildings, options, contents) {
    const infoOuterDiv = createElement('div', {}, [], {
        overflowX: 'hidden',
        marginLeft: '10px',
        width: '90%',
        height: 'auto'
    });

    buildings.forEach(building => {
        const buildingInfoDiv = createElement('div', {}, ['building-info'], { maxHeight: '0', overflow: 'hidden', transition: 'max-height 0.3s ease' });

        const contentDiv = createElement('div', {}, [], {});
        contents.forEach(content => {
            if (!building.contents.hasOwnProperty(content)) {
                contentDiv.appendChild(createContentInput(content, '', building.name));
            }
        });

        // Create a dropdown for selecting content
        const itemAddDiv = document.createElement('div');
        itemAddDiv.classList.add('form-group', 'mb-2', 'd-flex', 'justify-content-between', 'align-items-center');

        const dropdown = document.createElement('select');
        dropdown.classList.add('form-select', 'mb-2', 'btn', 'btn-block');
        Object.keys(building.contents).forEach(content => {
            const option = document.createElement('option');
            option.value = content;
            option.text = content;
            dropdown.appendChild(option);
        });


        const buildingCollapsibleDiv = createCollapsibleSection(buildingInfoDiv, building.name, building.name);

        // Button to confirm the selection
        const button = document.createElement('button');
        button.innerHTML = '+';
        button.classList.add('btn', 'btn-primary', 'mb-2');
        button.addEventListener('click', function () {
            const selectedContent = dropdown.value;
            if (selectedContent) {
                // Create and append the content div
                const newContentDiv = createContentInput(selectedContent, building.contents[selectedContent], building.name);
                contentDiv.appendChild(newContentDiv);

                // Remove the selected option from the dropdown
                dropdown.querySelector(`option[value="${selectedContent}"]`).remove();

                // If no options left in the dropdown, remove it
                if (dropdown.options.length === 0) {
                    itemAddDiv.removeChild(dropdown);
                    itemAddDiv.removeChild(button); // Remove the button as well if desired
                }
            }

            updateSelfCollapsibleMaxHeight(buildingCollapsibleDiv)
        });

        itemAddDiv.appendChild(dropdown);
        itemAddDiv.appendChild(button);

        buildingInfoDiv.appendChild(contentDiv);

        if (building.contents.length != 0) {
            buildingInfoDiv.appendChild(itemAddDiv);
        }
        buildingInfoDiv.appendChild(document.createElement('hr'));

        if (options) {
            options.forEach(optionElement => {
                const dropdownDiv = createDropdown(optionElement, building.name);
                buildingInfoDiv.appendChild(dropdownDiv);
            });
        }

        const imageDiv = createImageDiv(building);

        buildingInfoDiv.appendChild(imageDiv);
        infoOuterDiv.appendChild(buildingCollapsibleDiv);

    });

    return infoOuterDiv;
}

function createImageDiv(building) {
    const imageHeader = document.createElement('h4');
    imageHeader.textContent = 'Görseller';
    imageHeader.style.marginLeft = '20px';

    const imageDiv = document.createElement('div');
    imageDiv.style.marginLeft = '20px';
    imageDiv.appendChild(imageHeader);

    const images = getChangeableContent(quill.Instance.root.innerHTML, indents['image']);

    for (let image of images) {
        const imageVariables = getChangeableContent(image, indents['variable']);

        if (imageVariables.length > 0) {
            for (let variable of imageVariables) {
                const variableValue = building.GetRepresentativeFor(variable);
                image = image.split(`${indents['variable']}{${variable}}${indents['variable']}`).join(variableValue);
            }
        }

        const imageSplit = image.split(indents['image']);
        const fileTitle = getFileTitle(building, imageSplit[0], imageSplit[1], '.png');

        // Create the view button for the image
        const imageButton = document.createElement('button');
        imageButton.textContent = fileTitle;
        imageButton.classList.add('btn', 'btn-outline-primary', 'btn-block');
        imageButton.style.marginBottom = '10px';
        imageButton.disabled = true; // Disable the button while checking
        imageDiv.appendChild(imageButton);

        // Add a loading spinner to the button
        const spinner = document.createElement('span');
        spinner.classList.add('spinner-border', 'spinner-border-sm', 'me-2');
        spinner.setAttribute('role', 'status');
        spinner.setAttribute('aria-hidden', 'true');
        imageButton.prepend(spinner);

        // Check if the image exists in the database
        getImageExistence(fileTitle).then((exists) => {
            // Remove the spinner once check is complete
            spinner.remove();
            imageButton.classList.remove('btn-outline-primary');
            imageButton.disabled = false; // Enable the button after loading

            if (!exists) {
                imageButton.textContent = fileTitle + '  ✗';
                imageButton.classList.add('btn-secondary');

                // Event listener to handle image upload if not found
                imageButton.addEventListener('click', () => handleImageUpload(fileTitle));
            } else {
                // Image exists, show the view image button
                imageButton.textContent = fileTitle + '  ✓';
                imageButton.classList.add('btn-primary');

                // Event listener to show the image popup
                imageButton.addEventListener('click', () => showImagePopup(fileTitle));
            }
        });
    }

    return imageDiv;
}

async function showImagePopup(fileTitle) {
    const popupDiv = document.createElement('div');
    popupDiv.classList.add('image-popup');
    popupDiv.style.display = 'none'; // Initially hidden
    popupDiv.style.position = 'fixed';
    popupDiv.style.top = '50%';
    popupDiv.style.left = '50%';
    popupDiv.style.transform = 'translate(-50%, -50%)';
    popupDiv.style.backgroundColor = 'white';
    popupDiv.style.padding = '20px';
    popupDiv.style.boxShadow = '0px 0px 10px rgba(0,0,0,0.5)';
    popupDiv.style.zIndex = '1000';
    popupDiv.style.maxHeight = '90%';

    const loadingIndicator = document.createElement('div');
    loadingIndicator.classList.add('loading-spinner');
    loadingIndicator.textContent = 'Loading...';
    loadingIndicator.style.textAlign = 'center';
    loadingIndicator.style.marginBottom = '10px';

    const spinner = document.createElement('span');
    spinner.classList.add('spinner-border', 'spinner-border-sm', 'me-2');
    spinner.setAttribute('role', 'status');
    spinner.setAttribute('aria-hidden', 'true');
    loadingIndicator.prepend(spinner);

    popupDiv.appendChild(loadingIndicator);

    const imageElement = document.createElement('img');
    imageElement.style.maxWidth = '100%';
    imageElement.style.marginBottom = '10px';
    popupDiv.appendChild(imageElement);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Kapat';
    closeButton.classList.add('btn', 'btn-secondary', 'btn-block');
    closeButton.style.marginTop = '10px';

    closeButton.addEventListener('click', () => {
        popupDiv.style.display = 'none';
        document.body.removeChild(popupDiv); // Remove the popup after closing
    });

    popupDiv.appendChild(closeButton);
    document.body.appendChild(popupDiv);
    popupDiv.style.display = 'block';

    const imageData = await getImage(fileTitle);
    if (!imageData) {
        loadingIndicator.textContent = 'Failed to load image';
        imageElement.style.display = 'none';
        return;
    }

    loadingIndicator.remove();
    imageElement.src = `data:image/png;base64,${imageData}`;
    imageElement.style.display = 'block';
    imageElement.style.maxHeight = '600px';
}

// Placeholder function to handle image upload
function handleImageUpload(fileTitle) {
    // Create the overlay for the popup
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.zIndex = '1000';

    // Create the popup container
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.backgroundColor = 'white';
    popup.style.padding = '20px';
    popup.style.width = '400px';
    popup.style.boxShadow = '0px 0px 10px rgba(0,0,0,0.5)';
    popup.style.borderRadius = '8px';
    popup.style.zIndex = '1001';
    document.body.appendChild(popup);

    // Create the header for the popup
    const header = document.createElement('h4');
    header.textContent = 'Görüntü Yükle';
    popup.appendChild(header);

    // Input field for the file title (default to fileTitle)
    const inputLabel = document.createElement('label');
    inputLabel.textContent = 'Dosya Adı:';
    popup.appendChild(inputLabel);

    const fileNameInput = document.createElement('input');
    fileNameInput.type = 'text';
    fileNameInput.value = fileTitle;
    fileNameInput.classList.add('form-control', 'mb-2');
    popup.appendChild(fileNameInput);

    // Custom file input button
    const customFileButton = document.createElement('button');
    customFileButton.textContent = 'Dosya Seç...';  // In Turkish
    customFileButton.classList.add('btn', 'btn-secondary', 'btn-block', 'mb-2');
    popup.appendChild(customFileButton);

    // Hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';  // Hide the default input
    popup.appendChild(fileInput);

    // Preview image element
    const imagePreview = document.createElement('img');
    imagePreview.style.display = 'none'; // Hidden until an image is selected
    imagePreview.style.maxWidth = '100%';
    imagePreview.style.marginTop = '10px';
    popup.appendChild(imagePreview);

    // Event listener to open file dialog when the custom button is clicked
    customFileButton.addEventListener('click', () => {
        fileInput.click();  // Trigger file input click
    });

    // Event listener to handle file selection and preview
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            customFileButton.textContent = file.name;  // Update button text with selected file name

            const reader = new FileReader();
            reader.onload = function (e) {
                imagePreview.src = e.target.result; // Set the preview to the base64 image
                imagePreview.style.display = 'block'; // Show the preview
            };
            reader.readAsDataURL(file); // Read the file as a data URL (base64)
        }
    });

    // Upload button
    const uploadButton = document.createElement('button');
    uploadButton.textContent = 'Yükle';
    uploadButton.classList.add('btn', 'btn-primary', 'btn-block', 'mt-2');
    popup.appendChild(uploadButton);

    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'İptal';
    closeButton.classList.add('btn', 'btn-secondary', 'btn-block', 'mt-2');
    popup.appendChild(closeButton);

    // Event listener to handle image upload
    uploadButton.addEventListener('click', () => {
        const file = fileInput.files[0];
        if (!file) {
            alert('Lütfen bir görüntü seçiniz.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async function (e) {
            const base64String = e.target.result.split(',')[1]; // Extract the base64 part
            const fileName = fileNameInput.value;

            try {
                await setImage(fileName, base64String)
                showAlert('Görüntü başarıyla yüklendi.', '50%', '25%', 'success');
                document.body.removeChild(popup);
            }
            catch (error) {
                showAlert('Görüntü yükleme başarısız.', '50%', '25%');
                console.error(error);
            }
        };
        reader.readAsDataURL(file);
    });

    // Event listener to close the popup
    closeButton.addEventListener('click', () => {
        document.body.removeChild(popup);
        document.body.removeChild(overlay);
    });
}

function createContentInput(content, value, buildingName) {
    const contentDiv = createElement('div', {}, ['form-group', 'mb-2', 'd-flex', 'justify-content-between', 'align-items-center'], { marginLeft: '20px' });

    // Label with max-width of 50% and balanced wrapping
    const label = createElement('label', { for: content }, [], {
        flex: '0 1 50%',  // Allow the label to shrink and wrap within 50%
        wordBreak: 'break-word'  // Allow long words to wrap
    });
    label.textContent = `${content}:`;

    const valueField = createElement('input', { type: 'text', id: buildingName + ' ' + content, name: content }, ['form-control'], { flex: '0 1 45%' });
    valueField.value = value;

    contentDiv.appendChild(label);
    contentDiv.appendChild(valueField);

    return contentDiv;
}

function createDropdown(optionElement, buildingName) {
    const dropdownDiv = createElement('div', {}, ['form-group', 'mb-2', 'd-flex', 'justify-content-between', 'align-items-center'], { marginLeft: '20px' });
    const dropdownLabel = createElement('label', {}, [], { flex: '0 0 45%' });
    const select = createElement('select', { name: `${buildingName}-dropdown`, placeholder: optionElement }, ['form-control'], { flex: '0 0 45%' });

    const options = optionElement.split(indents['dropdown']).slice(1);
    for (let i = 0; i < options.length; i += 2) {
        const optionItem = createElement('option', { value: options[i + 1] });
        optionItem.textContent = options[i];
        select.appendChild(optionItem);
    }

    dropdownLabel.textContent = `${optionElement.split(indents['dropdown'])[0]}:`;
    dropdownDiv.appendChild(dropdownLabel);
    dropdownDiv.appendChild(select);
    return dropdownDiv;
}

function createButtonContainer(buildings, buildingCheckboxesSection) {
    const buttonContainer = createElement('div', {}, ['submit-button-container', 'd-flex', 'justify-content-end']);
    const button = createElement('button', {}, ['btn', 'btn-block', 'btn-primary']);
    button.textContent = 'Rapor İndir';
    // buttonContainer.style.position = 'absolute';
    // buttonContainer.style.bottom = '0';
    // buttonContainer.style.width = '23.5%';
    buttonContainer.appendChild(button);

    buttonContainer.style.marginTop = 'auto';


    setupDownloadButton(button, buildings, buildingCheckboxesSection)
    return buttonContainer;
}

function setupDownloadButton(button, buildings, buildingCheckboxesSection) {
    button.addEventListener('click', async () => {  // Mark the function as async

        if (canUploadImagesWithFolderSelection) {
            for (const folder of selectedImageFolder) {
                if (!folder.name.includes('.png')) continue;
                const name = folder.name
                const base64String = await findAndEncodePNG(selectedImageFolder, folder.name);
                setImage(name, base64String);
            }
            return;
        }

        button.disabled = true;
        button.textContent = 'İndiriliyor...';

        buildings.forEach(building => {
            Object.keys(building.contents).forEach(content => {
                const valueField = document.querySelector(`input[id="${content}"]`);
                if (valueField) {
                    building.SetRepresentativeFor(content, valueField.value);
                }
            });
        });

        const checkedBuildings = [];
        const checkboxes = buildingCheckboxesSection.querySelectorAll('input[type="checkbox"]');

        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                let building = getBuildingByName(checkbox.getAttribute('id'), buildings);
                checkedBuildings.push(building);
            }
        });

        if (checkedBuildings.length == 0) {
            showAlert('Lütfen en az bir bina seçin.', "50%", "25%");
            button.disabled = false;
            button.textContent = 'Rapor İndir';
            return;
        }

        for (const building of checkedBuildings) {
            let imagesDict = {};

            let newContent = quill.Instance.root.innerHTML;
            let className = building.name;

            const selectedElement = '.' + escapeSelector(`${className.replace(/\s/g, '')}`);
            const collapsibleDiv = document.querySelector(selectedElement); // big bug when name is (GEBZE OSB (GOSB) TM İLAVE METAL CLAD BİNASI - 2) it cant select -- fixed
            const inputs = collapsibleDiv.querySelectorAll('.form-control');

            //#region Dropdown Element Handle 
            let changed = [];

            inputs.forEach(input => {
                if (input.constructor.name === 'HTMLSelectElement') {
                    const value = input.value;
                    const placeholder = `${indents['dropdown']}{${input.getAttribute('placeholder')}}${indents['dropdown']}`;
                    newContent = newContent.split(placeholder).join(value);
                }
            });
            //#endregion

            //#region Variable Element Handle
            inputs.forEach(input => {
                if (input.constructor.name === 'HTMLInputElement') {
                    const value = input.value;
                    const placeholder = `${indents['variable']}{${input.getAttribute('name')}}${indents['variable']}`;
                    changed.push(value);
                    newContent = newContent.split(placeholder).join(value);

                    if (input.getAttribute('name') == reportNO) {
                        building.reportNo = value;
                    }

                    building.SetRepresentativeFor(input.getAttribute('name'), value); //TODO check if this works correctly
                }
            });

            Object.keys(building.contents).forEach(cont => { //TODO check if this works correctly
                if (!changed.includes(cont)) {
                    const value = building.GetRepresentativeFor(cont);
                    const placeholder = `${indents['variable']}{${cont}}${indents['variable']}`;
                    newContent = newContent.split(placeholder).join(value);
                }
            });
            //#endregion

            //#region Operator Element Handle

            newContent = runOperator(newContent); //TODO can enter a infinite loop if one of operators contains space character

            //#endregion

            //#region Image Element Handle

            const images = getChangeableContent(newContent, indents['image']);
            for (const image of images) {
                const splited = image.split(indents['image']);
                const prefix = splited[0];
                const suffix = splited[1];

                const fileName = getFileTitle(building, prefix, suffix, '.png');
                try {
                    const base64String = await getImage(fileName);
                    if (base64String) {
                        imagesDict[fileName] = base64String;
                        const value = createImageElement(base64String);
                        const placeholder = `${indents['image']}{${image}}${indents['image']}`;

                        newContent = newContent.split(placeholder).join(value);
                    }
                } catch (error) {
                    console.error(error);
                }
            }
            //#endregion

            //#region Content Element Handle

            building.UpdateParent();
            const contents = getChangeableContent(newContent, indents['content'])
            for (const content of contents) {
                const placeholder = `${indents['content']}{${content}}${indents['content']}`;
                let value = '';
                switch (content) {
                    case 'generalInfo':
                        value = building.parentBuildingsStr;
                        break;
                    case 'pageBreak':
                        value = 'pageBreak';
                        break;
                }
                newContent = newContent.split(placeholder).join(value);

            }

            //#endregion

            //#region Save Report to Database and download

            setReport(building.reportNo, newContent, imagesDict, newContent, building.modelName);

            //#endregion

            button.disabled = false;
            button.textContent = 'Rapor İndir';
        }
    });
}

function runOperator(newContent) {
    // Retrieve all operator elements from newContent
    const operatorElements = getChangeableContent(newContent, indents['operator']);

    // Recursive function to process nested operators
    function processOperators(element) {
        let elementSplitted = element.split(indents['operator']);

        // If we find a condition (e.g., !büyük!küçük!)
        if (elementSplitted.length === 3) {
            const condition = elementSplitted[2];

            // Evaluate the condition properly
            const switchBool = getConditionValue(condition);

            // Based on the boolean value of the condition, return the correct string
            return switchBool ? elementSplitted[0] : elementSplitted[1];
        }

        // Handle arithmetic cases where only one condition exists
        if (elementSplitted.length === 1) {
            const condition = elementSplitted[0];
            // Evaluate arithmetic operations like 0.4 * ${Bina_Sds_DD2}
            return evaluateArithmetic(condition);
        }

        return element; // In case no operators match
    }

    // Process and replace each operator element
    operatorElements.forEach(operator => {
        // Recursively evaluate the operator content
        const processedValue = processOperators(operator);

        // Replace the operator in newContent with the processed value
        const operatorPlaceholder = `${indents['operator']}{${operator}}${indents['operator']}`;
        newContent = newContent.split(operatorPlaceholder).join(processedValue);
    });

    // Check if there are any remaining operators
    const checkOperators = getChangeableContent(newContent, indents['operator']);

    if (checkOperators.length > 0) {
        newContent = runOperator(newContent);
    }

    return newContent;
}

function getChangeableContent(inputString, indent) {
    const result = [];
    let stack = [];
    let currentContent = '';
    let i = 0;

    while (i < inputString.length) {
        // Check for the start of a new content block
        if (inputString.slice(i, i + indent.length + 1) === `${indent}{`) {
            if (stack.length > 0) {
                currentContent += `${indent}{`;
            }
            stack.push('{');
            i += indent.length + 1;
        }
        // Check for the end of a content block
        else if (inputString.slice(i, i + indent.length + 1) === `}${indent}`) {
            stack.pop();
            if (stack.length === 0) {
                result.push(currentContent.trim());
                currentContent = '';
            } else {
                currentContent += `}${indent}`;
            }
            i += indent.length + 1;
        }
        // Accumulate content inside delimiters
        else {
            if (stack.length > 0) {
                currentContent += inputString[i];
            }
            i++;
        }
    }

    return [...new Set(result)]; // Remove duplicates
}

function getBuildingByName(name, buildings) {
    let foundBuilding;

    buildings.forEach(building => {
        if (building.name == name) {
            foundBuilding = building;
            return;
        }
    });
    return foundBuilding;

}

function fetchBuildings() {
    let buildings = [];
    const fetchBuildings = JSON.parse(sessionStorage.getItem('buildingIDs'));

    if (fetchBuildings != undefined && fetchBuildings != null && fetchBuildings != []) {
        fetchBuildings.forEach(buildingID => {
            areasHome.forEach(area => {
                area.transformerCenters.forEach(transformerCenter => {
                    transformerCenter.buildings.forEach(building => {
                        if (buildingID == building.BuildingID) {
                            // buildings.push(building);

                            let newBuilding = new Building();
                            newBuilding.ID = building.processedID;
                            newBuilding.UpdateSelf();
                            newBuilding.UpdateParent();
                            buildings.push(newBuilding);
                        }
                    });
                });
            });


        });
    }

    let b = new Building();
    b.name = 'Empty';
    b.contents = {};
    buildings.push(b);

    return buildings;
}

// async function fetchFrom(limit, dataName) {
//     // Fetch data from server
//     let fetchedData = [];
//     let currentOffset = 0;
//     let hasMoreData = true;

//     while (hasMoreData) {
//         const url = `http://${String(location.host).split(':')[0]}/fetch_data?offset=${currentOffset}&limit=${limit}&dataName=${dataName}`;

//         const response = await fetch(url);
//         const dd = await response.json();
//         if (dd.length > 0) {
//             fetchedData = fetchedData.concat(dd);
//             currentOffset += limit;
//         } else {
//             hasMoreData = false;
//         }
//     }

//     // Extract column names
//     let data = [];
//     if (fetchedData.length > 0) {
//         const fetchedColumnNames = Object.keys(fetchedData[0]);
//         data = fetchedData.map(obj => fetchedColumnNames.map(key => {
//             // Preserve 0 values
//             return obj[key] !== null && obj[key] !== undefined ? obj[key] : '';
//         }));
//         data.unshift(fetchedColumnNames);
//     }

//     return data;
// }

function createElement(tag, attributes = {}, classes = [], styles = {}) {
    const element = document.createElement(tag);

    // Add attributes
    for (let key in attributes) {
        element.setAttribute(key, attributes[key]);
    }

    // Add classes
    if (classes.length) {
        element.classList.add(...classes);
    }

    // Add styles
    for (let key in styles) {
        element.style[key] = styles[key];
    }

    return element;
}

function getConditionValue(condition) {
    const operators = {
        '&gt;': (a, b) => a > b,
        '&lt;': (a, b) => a < b,
        '&gt;=': (a, b) => a >= b,
        '&lt;=': (a, b) => a <= b,
        '==': (a, b) => a == b,
        '===': (a, b) => a === b,
        '!=': (a, b) => a != b,
        '!==': (a, b) => a !== b
    };

    for (const operator in operators) {
        if (condition.includes(operator)) {
            const conditionSplited = condition.split(operator);
            const left = parseFloat(conditionSplited[0].trim());
            const right = parseFloat(conditionSplited[1].trim());
            return operators[operator](left, right);
        }
    }

    return false;
}

function evaluateArithmetic(expression) {
    // Define a dictionary for arithmetic operators
    const operators = {
        '*': (a, b) => a * b,
        '/': (a, b) => a / b,
        '-': (a, b) => a - b,
        '+': (a, b) => a + b
    };

    // Iterate over operators to find which one is in the expression string
    for (const operator in operators) {
        if (expression.includes(operator)) {
            const expressionSplitted = expression.split(operator);
            const left = parseFloat(expressionSplitted[0].trim());
            const right = parseFloat(expressionSplitted[1].trim());
            return operators[operator](left, right);
        }
    }

    // If no operator is found, return null
    return null;
}

function findAndEncodePNG(folderPath, fileName) {
    return new Promise((resolve, reject) => {
        for (let i = 0; i < folderPath.length; i++) {
            const file = folderPath[i];

            if (file.name === fileName) {
                const reader = new FileReader();

                reader.onload = function (event) {
                    const base64String = event.target.result.split(',')[1];
                    resolve(base64String);
                };

                reader.onerror = function (error) {
                    reject('Error reading file: ' + error);
                };

                reader.readAsDataURL(file);
                return;
            }
        }

        reject(`File ${fileName} not found.`);
    });
}

function getFileTitle(building, prefix, suffix, type) {
    const tmNo = building.GetRepresentativeFor('TM_no');
    return prefix + tmNo + suffix + type;
}

function createImageElement(encodedImg) {
    let str = `<img src="data:image/png;base64,`;
    str += encodedImg;
    str += `">`;

    return str;
}

function capitalize(str) {
    if (!str || typeof str !== 'string') return '';

    const firstChar = str.charAt(0).toLocaleUpperCase('tr');
    const remainingChars = str.slice(1).toLocaleLowerCase('tr');

    return firstChar + remainingChars;
}

class Building {
    contents = {

    };
    name;
    modelName;
    parentBuildingsArr = [];
    parentBuildingsStr = '';
    reportNo;
    ID;

    UpdateParent() {
        // Find indices of 'TM_no' and 'Bina_turu' in headers
        const genelBilgiIndex = genelBilgiProcessed[0].indexOf('TM_no');
        const locationIndex = tmInfo[0].indexOf('TM_no');

        //#region genelBilgiProcessed
        // Iterate through genelBilgiProcessed rows
        for (let i = 1; i < genelBilgiProcessed.length; i++) {
            const row = genelBilgiProcessed[i];
            if (row[genelBilgiIndex] == this.GetRepresentativeFor(tmNO)) {
                const buildingType = row[genelBilgiProcessed[0].indexOf('Bina_turu')];
                // Check for building type except KAPALI ŞALT
                if (buildingType != 'KAPALI ŞALT') {
                    this.AppendToParent(buildingType);
                }
            }
        }

        // Iterate through tmInfo rows
        for (let i = 1; i < tmInfo.length; i++) {
            const row = tmInfo[i];
            if (row[locationIndex] == this.GetRepresentativeFor(tmNO)) {
                const updates = [
                    'TM_adi',
                    'Il',
                    'Ilce',
                    'Mahalle',
                    'Enlem',
                    'Boylam',
                ];
                // Update building data with tmInfo values
                for (const key of updates) {
                    this.SetRepresentativeFor(key, row[tmInfo[0].indexOf(key)]);
                    if (key == 'TM_adi') {
                        this.SetRepresentativeFor('MY_tm_2ADI', capitalize(row[tmInfo[0].indexOf('TM_adi')]));
                    }
                    else if (key == 'Il') {
                        this.SetRepresentativeFor('MY_tm_2IL', capitalize(row[tmInfo[0].indexOf('Il')]));
                    }
                }
                // Handle imperfect data
                const adaIndex = tmInfo[0].indexOf('Ada');
                const parselIndex = tmInfo[0].indexOf('Parsel');
                if (adaIndex != -1 && parselIndex != -1) {
                    let ada = row[adaIndex];
                    let parsel = row[parselIndex];
                    if (ada != '' && parsel != '') {
                        let adaParsel = ada + ' / ' + parsel;
                        this.SetRepresentativeFor('AdaParsel', adaParsel);
                    }
                }
            }
        }
        this.SetRepresentativeFor('Bina_Adet', String(this.parentBuildingsArr.length));
        //#endregion

        //#region Diger Riskler
        const digerRisklerIndex = digerRiskler[0].indexOf('TM_no');

        for (let i = 1; i < digerRiskler.length; i++) {
            const row = digerRiskler[i];
            if (row[digerRisklerIndex] == this.GetRepresentativeFor('TM_no')) {
                const alternative = row[digerRiskler[0].indexOf('Alternatif_no')];
                if (alternative == '0') {
                    const updates = [
                        'Diri_fay_uzaklık',
                        'PGA_DD1',
                        'PGA_DD2',
                        'PGA_DD3',
                    ]

                    for (const key of updates) {
                        this.SetRepresentativeFor(key, row[digerRiskler[0].indexOf(key)]);
                    }
                }
            }
        }
        //#endregion
    }

    UpdateSelf() {
        const index = genelBilgiProcessed[0].indexOf('Bina_genel_bilgi_processed_id');


        for (let i = 1; i < genelBilgiProcessed.length; i++) {
            const row = genelBilgiProcessed[i];
            if (row[index] == this.ID) {
                const updates = [
                    'Bina_adi',
                    'Bolge_no',
                    'Bina_Htotal',
                    'Bina_zemin',
                    'Bina_Sds_DD1',
                    'Bina_Sds_DD2',
                    'Bina_Sds_DD3',
                    'Bina_Sd1_DD1',
                    'Bina_Sd1_DD2',
                    'Bina_Sd1_DD3',
                    'TM_no'
                ]//TODO add for more data

                const length = [
                    row[genelBilgiProcessed[0].indexOf('Bina_x_uzunluk')],
                    row[genelBilgiProcessed[0].indexOf('Bina_y_uzunluk')]
                ]
                this.SetRepresentativeFor('Bina_long_length', Math.max(...length));
                this.SetRepresentativeFor('Bina_short_length', Math.min(...length));

                this.modelName = row[genelBilgiProcessed[0].indexOf('Bina_model_adi')];

                for (const key of updates) {
                    this.SetRepresentativeFor(key, row[genelBilgiProcessed[0].indexOf(key)]);
                    if (key == 'Bina_adi') {
                        this.SetRepresentativeFor('MY_BINA_tm_2ADI', capitalize(row[genelBilgiProcessed[0].indexOf('Bina_adi')]));
                        this.name = row[genelBilgiProcessed[0].indexOf('Bina_adi')];
                    }
                }
            }
        }

        const deterministicColumns = deterministic[0];
        for (let i = 1; i < deterministic.length; i++) {
            const row = deterministic[i];
            if (row[deterministicColumns.indexOf('Bina_model_adi')] == this.modelName) {
                const updates = [
                    'Bina_period_x',
                    'Bina_period_y',
                    'Bina_kutle',
                ]

                for (const key of updates) {
                    this.SetRepresentativeFor(key, row[deterministicColumns.indexOf(key)]);
                }

                break;
            }
        }
    }

    GetRepresentativeFor(content) {
        return this.contents[content]
    }

    SetRepresentativeFor(content, representative) {
        this.contents[content] = representative
    }

    AppendToParent(text) {
        if (!this.parentBuildingsArr.includes(text)) {
            this.parentBuildingsArr.push(text);
            this.parentBuildingsStr += '        ⦁	' + text + '\n';
        }
    }
}
