import * as quill from './quill.js'
import * as python from './python.js';

const asideMenu = document.getElementById('reportTools');
const indents = {
    'variable': '$', // For contents that can be changed in input boxes
    'dropdown': '#', // For contents that can be changed in dropdowns
    'operator': '/', // For contents that are dependent to other variables
    'image': '*', // For automated images
    'content': 'C' // For other automations
    // Add options for more feature
}

let selectedImageFolder = '';
const genelBilgiProcessed = await fetchFrom(1000, 'bina_genel_bilgi_processed');
const tmInfo = await fetchFrom(1000, 'genel_bilgi');

//#region Toggle sidebar (dropped)
// // Create the toggle button and append it to the body or a specific container

// const toggleButton = document.createElement('button');
// toggleButton.textContent = 'Toggle Menu';
// toggleButton.classList.add('btn', 'btn-secondary');
// toggleButton.style.position = 'fixed';
// toggleButton.style.top = '10px';
// toggleButton.style.right = '10px';
// asideMenu.appendChild(toggleButton);

// // Toggle the visibility of the asideMenu when the button is clicked
// toggleButton.addEventListener('click', () => {
//     if (asideMenu.style.display === 'none') {
//         asideMenu.style.display = 'block';
//     } else {
//         asideMenu.style.display = 'none';
//     }
// });
//#endregion

//TODO Has not been updated since I decided to drop this
export function createContentEditor() {
    const contents = getChangeableContent(quill.Instance.root.innerHTML, indents['variable']);
    const options = getChangeableContent(quill.Instance.root.innerHTML, indents['dropdown']);

    asideMenu.innerHTML = '';
    if (contents.length == 0) {
        return;
    }

    const variableHead = document.createElement('h3');
    variableHead.innerHTML = 'Değişkenler:';
    variableHead.style.marginTop = '15px';
    variableHead.style.marginLeft = '10px';
    asideMenu.appendChild(variableHead);

    const variablesDiv = document.createElement('div');
    variablesDiv.style.overflowX = 'auto';
    variablesDiv.style.maxHeight = '85%';
    variablesDiv.style.marginLeft = '10px';
    variablesDiv.style.marginTop = '15px';
    variablesDiv.style.width = '380px';
    variablesDiv.style.maxHeight = '35%';

    contents.forEach(content => {
        const newDiv = document.createElement('div');
        newDiv.classList.add('form-group', 'mb-2', 'd-flex', 'align-items-center');

        const label = document.createElement('label');
        label.setAttribute('for', content);
        label.textContent = content + ':';
        label.style.flex = '0 0 60%';
        label.style.marginRight = '10px';
        label.style.maxWidth = '60%';

        const textbox = document.createElement('input');
        textbox.setAttribute('type', 'text');
        textbox.setAttribute('id', content);
        textbox.setAttribute('name', content);
        textbox.classList.add('form-control');
        textbox.style.flex = '1';

        newDiv.appendChild(label);
        newDiv.appendChild(textbox);
        variablesDiv.appendChild(newDiv);
    });

    asideMenu.appendChild(variablesDiv);

    if (options.length != 0) {
        const dropdownHead = document.createElement('h3');
        dropdownHead.innerHTML = 'Sonuç:';
        dropdownHead.style.marginTop = '15px';
        dropdownHead.style.marginLeft = '10px';
        asideMenu.appendChild(dropdownHead);
    }

    const dropdownsDiv = document.createElement('div');
    dropdownsDiv.style.overflowX = 'auto';
    dropdownsDiv.style.maxHeight = '85%';
    dropdownsDiv.style.marginLeft = '10px';
    dropdownsDiv.style.marginTop = '15px';
    dropdownsDiv.style.width = '380px';
    dropdownsDiv.style.maxHeight = '35%';

    options.forEach(dropdown => {
        const drpContent = dropdown.split(indents['dropdown']);
        if (drpContent.length === 0) return;

        const label = drpContent[0];
        const dropdownDiv = document.createElement('div');
        dropdownDiv.classList.add('form-group', 'mb-2', 'd-flex', 'align-items-center');

        const labelElement = document.createElement('label');
        labelElement.textContent = label + ':';
        labelElement.style.flex = '0 0 60%';
        labelElement.style.marginRight = '10px';
        labelElement.style.maxWidth = '60%';

        const select = document.createElement('select');
        select.classList.add('form-control');
        select.style.flex = '1';
        select.setAttribute('name', label);

        select.addEventListener('change', () => {
            select.setAttribute('content', select.value);
        })


        for (let i = 1; i < drpContent.length; i += 2) {
            const option = document.createElement('option');
            option.value = drpContent[i + 1] || drpContent[i];
            option.textContent = drpContent[i];
            select.appendChild(option);
        }

        dropdownDiv.appendChild(labelElement);
        dropdownDiv.appendChild(select);
        dropdownsDiv.appendChild(dropdownDiv);
    });

    asideMenu.appendChild(dropdownsDiv);

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('submit-button-container', 'd-flex', 'justify-content-end');

    const button = document.createElement('button');
    button.textContent = 'Submit';
    button.classList.add('btn', 'btn-block', 'btn-primary');
    buttonContainer.appendChild(button);

    asideMenu.appendChild(buttonContainer);

    button.addEventListener('click', () => {
        // Replace variables
        contents.forEach(content => {
            const textbox = document.getElementById(content);
            const value = textbox.value;
            const editorContent = quill.Instance.root.innerHTML;

            const placeholder = `\${${content}}`;

            // Use split and join to replace the placeholder with the textbox value
            const newContent = editorContent.split(placeholder).join(value);
            quill.Instance.root.innerHTML = newContent;
        });

        // Replace dropdown selections
        options.forEach(dropdown => {
            const drpContent = dropdown.split(indents['dropdown']);
            if (drpContent.length === 0) return;

            const label = drpContent[0];
            const select = document.querySelector(`select[name="${label}"]`);

            const selectedValue = select.value.trim();

            const placeholder = `#{${dropdown}}`;
            const editorContent = quill.Instance.root.innerHTML;

            // Use split and join to replace the placeholder
            const newContent = editorContent.split(placeholder).join(selectedValue);
            quill.Instance.root.innerHTML = newContent;
        });
    });


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
    asideMenu.appendChild(main)
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
        if (alerted) showAlert('Lütfen bir şablon seçiniz.');
        return false;
    }
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        let optiondivided = option.split(indents['dropdown']);
        if (optiondivided.length % 2 == 0) {
            if (alerted) showAlert('Dropdowns (#{content}) are not correctly initialized.');
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
        for (const element of building.contents) {
            if (!contents.includes(element)) {
                alertStr += `Missing content: ${element}.\n`;
                returnVal = true;
                break;
            }
        }
    }

    if (alerted && alertStr) {
        showAlert(alertStr);
    }

    return !returnVal;
}

function showAlert(message) {
    // Create the alert div
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger';
    alertDiv.style.position = 'absolute';
    alertDiv.style.top= '20px';
    alertDiv.style.right = '25.3%';
    alertDiv.style.width = '25%';
    alertDiv.style.zIndex = '1000';
    alertDiv.innerText = message;

    // Append the alert div to the body
    document.body.appendChild(alertDiv);

    let hideTimeout = setTimeout(() => {
        alertDiv.remove();
    }, 4000); // Set timeout to remove the alert after 4 seconds

    // Pause timer on hover
    alertDiv.addEventListener('mouseover', () => {
        clearTimeout(hideTimeout);
    });

    // Restart timer when hover ends
    alertDiv.addEventListener('mouseout', () => {
        hideTimeout = setTimeout(() => {
            alertDiv.remove();
        }, 4000);
    });
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

    const details = 'Konum fotoğraflarını içeren klasörü seçiniz';
    const labelElement = createSelectElement(details);

    buildingOuterDiv.appendChild(labelElement);

    return buildingOuterDiv;
}

function createSelectElement(details) {
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
            if (!building.contents.includes(content)) {
                contentDiv.appendChild(createContentInput(content, '', building.name));
            }
        });

        // Create a dropdown for selecting content
        const itemAddDiv = document.createElement('div');
        itemAddDiv.classList.add('form-group', 'mb-2', 'd-flex', 'justify-content-between', 'align-items-center');

        const dropdown = document.createElement('select');
        dropdown.classList.add('form-select', 'mb-2', 'btn', 'btn-block');
        building.contents.forEach(content => {
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
                const newContentDiv = createContentInput(selectedContent, building.representatives[building.contents.indexOf(selectedContent)], building.name);
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

        if ( building.contents.length != 0){
            buildingInfoDiv.appendChild(itemAddDiv);
        }
        buildingInfoDiv.appendChild(document.createElement('hr'));

        if (options) {
            options.forEach(optionElement => {
                const dropdownDiv = createDropdown(optionElement, building.name);
                buildingInfoDiv.appendChild(dropdownDiv);
            });
        }

        infoOuterDiv.appendChild(buildingCollapsibleDiv);
    });

    return infoOuterDiv;
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
        buildings.forEach(building => {
            building.contents.forEach((content, index) => {
                const valueField = document.querySelector(`input[id="${content}"]`);
                if (valueField) {
                    building.representatives[index] = valueField.value;
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
            showAlert('Lütfen en az bir bina seçin.');
            return;
        }

        for (const building of checkedBuildings) {  // Change to for...of to support async/await
            let newContent = quill.Instance.root.innerHTML;
            let className = building.name;

            const selectedElement = '.' + escapeSelector(`${className.replace(/\s/g, '')}`);
            const collapsibleDiv = document.querySelector(selectedElement); // big bug when name is (GEBZE OSB (GOSB) TM İLAVE METAL CLAD BİNASI - 2) it cant select
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

                    if (building.contents.includes(input.getAttribute('name'))) {
                        building.representatives[building.contents.indexOf(input.getAttribute('name'))] = value
                    }
                    else {
                        building.contents.push(input.getAttribute('name'));
                        building.representatives.push(value);
                    }
                }
            });

            building.contents.forEach(cont => {
                if (!changed.includes(cont)) {
                    let index = building.contents.indexOf(cont);
                    const value = building.representatives[index];
                    const placeholder = `${indents['variable']}{${cont}}${indents['variable']}`;
                    newContent = newContent.split(placeholder).join(value);
                }
            });
            //#endregion

            //#region Operator Element Handle

            const operators = getChangeableContent(newContent, indents['operator']);

            operators.forEach(element => { 
                const elementSplited = element.split(indents['operator']);
                const operatorPlaceholder = `${indents['operator']}{${element}}${indents['operator']}`;

                if (elementSplited.length === 3) {
                    const condition = elementSplited[2];
                    const swicthBool = getConditionValue(condition);
                    const operatorValue = swicthBool ? elementSplited[0] : elementSplited[1];

                    newContent = newContent.split(operatorPlaceholder).join(operatorValue);
                } else if (elementSplited.length === 1) {
                    const condition = elementSplited[0];
                    const operatorValue = evaluateArithmetic(condition); //TODO div sign should be changed

                    newContent = newContent.split(operatorPlaceholder).join(operatorValue);
                }
            });
            //#endregion

            //#region Image Element Handle

            const images = getChangeableContent(newContent, indents['image']);
            for (const image of images) {
                const splited = image.split(indents['image']);
                const prefix = splited[0];
                const suffix = splited[1];

                const fileName = getFileTitle(building, prefix, suffix, '.png'); 
                try {
                    const base64String = await findAndEncodePNG(selectedImageFolder, fileName);
                    if (base64String) {
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
                switch (content){
                    case 'generalInfo':
                        value = building.parentBuildingsStr;
                    case 'pageBreak':
                        value = 'pageBreak';
                    }
                newContent = newContent.split(placeholder).join(value);

            }

            //#endregion

            // Download new content
            python.downloadPython(newContent, building.name);
        }

        // Handle file download or other actions
    });
}

function getChangeableContent(text, indent) {
    let contents = [];
    let i = 0;

    while (i < text.length) {
        if (text[i] === indent && text[i + 1] === '{') {
            let content = '';
            i += 2;

            while (i < text.length && text[i] !== '}' || text[i + 1] !== indent) {
                content += text[i];
                i++;
            }

            if (i < text.length && text[i] === '}' && text[i + 1] === indent) {
                if (!contents.includes(content)) contents.push(content);
                i++;
            }
        } else {
            i++;
        }
    }
    return contents;
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

// Not a demo anymore 
function fetchBuildings() {
    let buildings = [];
    const fetchBuildings = JSON.parse(sessionStorage.getItem('buildingNames'));

    if (fetchBuildings != undefined && fetchBuildings != null && fetchBuildings != []) {
        fetchBuildings.forEach(building => {
            let newBuilding = new Building();
            newBuilding.name = building;
            newBuilding.UpdateSelf();
            newBuilding.UpdateParent();
            buildings.push(newBuilding);
        });
    }

    let a = new Building();
    a.name = 'Trial';
    a.contents = ['MY_TM_KODU', 'MY_TM_ADI', 'MY_BINA_ADI', 'MY_IL', 'MY_TMILCE', 'MY_MAHALLE', 'MY_PARSEL', 'MY_tm_DD2_PGA_SDSbased'];
    a.representatives = ['15-01', 'tm', 'bina', 'ankara', 'çankaya', 'malazgirt', 'dikmen', '1.5'];
    buildings.push(a);

    let b = new Building();
    b.name = 'Empty'; 
    b.contents = [];
    b.representatives = [];
    buildings.push(b);

    return buildings;
}

async function fetchFrom(limit, dataName) {
    // Fetch data from server
    let fetchedData = [];
    let currentOffset = 0;
    let hasMoreData = true;

    while (hasMoreData) {
        const url = `http://${String(location.host).split(':')[0]}/fetch_data?offset=${currentOffset}&limit=${limit}&dataName=${dataName}`;

        const response = await fetch(url);
        const dd = await response.json();
        if (dd.length > 0) {
            fetchedData = fetchedData.concat(dd);
            currentOffset += limit;
        } else {
            hasMoreData = false;
        }
    }

    // Extract column names
    let data = [];
    if (fetchedData.length > 0) {
        const fetchedColumnNames = Object.keys(fetchedData[0]);
        data = fetchedData.map(obj => fetchedColumnNames.map(key => {
            // Preserve 0 values
            return obj[key] !== null && obj[key] !== undefined ? obj[key] : '';
        }));
        data.unshift(fetchedColumnNames);
    }

    return data;
}

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

function createCollapsibleSection(innerDiv, label, className = '') {
    const collapsibleDiv = document.createElement('div');

    if (className != '') collapsibleDiv.classList.add(escapeSelector(className.replace(/\s/g, '')));

    // Custom styled toggle button with a chevron indicator
    const toggleButton = document.createElement('div');
    toggleButton.classList.add('custom-toggle');

    const indicator = document.createElement('span');
    indicator.classList.add('indicator');
    indicator.innerHTML = '&#9655;';

    const buttonText = document.createElement('span');
    buttonText.classList.add('toggle-text');
    buttonText.textContent = label;

    toggleButton.appendChild(indicator);
    toggleButton.appendChild(buttonText);

    toggleButton.addEventListener('click', () => {
        const isExpanded = innerDiv.style.maxHeight && innerDiv.style.maxHeight !== '0px';

        if (isExpanded) {
            // Collapse
            requestAnimationFrame(() => {
                innerDiv.style.maxHeight = '0';
            });
        } else {
            // Expand
            getInnerDivScrollHeight(innerDiv)
            innerDiv.style.maxHeight = `${getInnerDivScrollHeight(innerDiv)}px`;
        }
        updateParentCollapsibleMaxHeight(collapsibleDiv);

        toggleButton.classList.toggle('active');
    });

    // Style the innerDiv to be collapsible
    innerDiv.style.maxHeight = '0';
    innerDiv.style.overflow = 'hidden';
    innerDiv.style.transition = 'max-height 0.3s ease';
    innerDiv.classList.add('collapsible-content');

    collapsibleDiv.appendChild(toggleButton);
    collapsibleDiv.appendChild(innerDiv);

    return collapsibleDiv;
}

function getInnerDivScrollHeight(innerDiv) {
    let scrollHeight = innerDiv.scrollHeight;
    let collapsibles = innerDiv.querySelectorAll('.collapsible-content');
    collapsibles.forEach(collapsible => {
        const isExpanded = collapsible.style.maxHeight && collapsible.style.maxHeight !== '0px';
        if (isExpanded) scrollHeight += getInnerDivScrollHeight(collapsible);
    });
    return scrollHeight;
}

function updateSelfCollapsibleMaxHeight(collapsibleDiv) {
    collapsibleDiv.querySelector('.collapsible-content').style.maxHeight = `${getInnerDivScrollHeight(collapsibleDiv)}px`;
    updateParentCollapsibleMaxHeight(collapsibleDiv);
}

function updateParentCollapsibleMaxHeight(collapsibleDiv) {
    let parent = collapsibleDiv.parentElement;
    while (parent && parent.classList.contains('collapsible-content')) {
        parent.style.maxHeight = `${getInnerDivScrollHeight(parent)}px`;
        parent = parent.parentElement;
    }
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

                reader.onload = function(event) {
                    const base64String = event.target.result.split(',')[1];
                    resolve(base64String);
                };

                reader.onerror = function(error) {
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
    const tmNo = building.GetRepresentativeFor('MY_TM_KODU');
    return prefix + tmNo + suffix + type;
}

function createImageElement(encodedImg) {
    let str = `<img src="data:image/png;base64,`;
    str += encodedImg;
    str += `">`;

    return str;
}

function escapeSelector(text) {
    return text.replace(/[.*+-/?^${}()|[\]\\]/g, '');
}

class Building {
    contents = [];
    representatives = [];
    name;
    parentBuildingsArr = [];
    parentBuildingsStr = '';

    UpdateParent() {
        // Find indices of 'TM_no' and 'Bina_turu' in headers
        const genelBilgiIndex = genelBilgiProcessed[0].indexOf('TM_no');
        const locationIndex = tmInfo[1].indexOf('TM_no');

        // Iterate through genelBilgiProcessed rows
        for (let i = 1; i < genelBilgiProcessed.length; i++) {
            const row = genelBilgiProcessed[i];
            if (row[genelBilgiIndex] == this.GetRepresentativeFor('MY_TM_KODU')) {
                const buildingType = row[genelBilgiProcessed[0].indexOf('Bina_turu')];
                // Check for building type except KAPALI ŞALT
                if (buildingType != 'KAPALI ŞALT') {
                    this.AppendToParent(buildingType);
                }
            }
        }

        // Iterate through tmInfo rows
        //TODO CHANGE STARTING POSITION FOR COLUMNS IN tmInfo WHEN SERVER IS FIXED
        const columnIndex = 1; 
        for (let i = columnIndex + 1; i < tmInfo.length; i++) {
            const row = tmInfo[i];
            if (row[locationIndex] == this.GetRepresentativeFor('MY_TM_KODU')) {
                const updates = {
                    'TM_adi': 'MY_TM_ADI',
                    'Il': 'MY_IL',
                    'Ilce': 'MY_TMILCE',
                    'Mahalle': 'MY_MAHALLE',
                    'Enlem': 'MY_ENLEM',
                    'Boylam': 'MY_BOYLAM',
                };
                // Update building data with tmInfo values
                for (const key in updates) {
                    this.UpdateBuildingData(updates[key], row[tmInfo[columnIndex].indexOf(key)]);
                }
                // Handle imperfect data
                const adaIndex = tmInfo[columnIndex].indexOf('Ada');
                const parselIndex = tmInfo[columnIndex].indexOf('Parsel');
                if (adaIndex != -1 && parselIndex != -1) {
                    let ada = row[adaIndex];
                    let parsel = row[parselIndex];
                    if (ada != '' && parsel != '') {
                        let adaParsel = ada + ' / ' + parsel;
                        this.UpdateBuildingData('MY_PARSEL', adaParsel);
                    }
                }
            }
        }

        this.UpdateBuildingData('MY_BINA_ADET', String(this.parentBuildingsArr.length));
    }

    UpdateSelf() {
        const index = genelBilgiProcessed[0].indexOf('Bina_adi');


        for (let i = 1; i < genelBilgiProcessed.length; i++) {
            const row = genelBilgiProcessed[i];
            if (row[index] == this.name) {
                const updates = {
                    'Bina_adi': 'MY_BINA_ADI',
                    'Bolge_no': 'MY_BOLGE_KODU',
                    'Bina_x_uzunluk': 'MY_BINA_UzunYönUzunluk', //TODO check
                    'Bina_y_uzunluk': 'MY_BINA_KısaYönUzunluk', //TODO check
                    'Bina_Htotal': 'MY_BINA_yükseklik',
                    'Bina_zemin': 'MY_ZEMINSINIFI',
                    'Bina_Sds_DD1': 'MY_DD1_SDS',
                    'Bina_Sds_DD2': 'MY_DD2_SDS',
                    'Bina_Sds_DD3': 'MY_DD3_SDS',
                    'Bina_Sd1_DD1': 'MY_DD1_SD1',
                    'Bina_Sd1_DD2': 'MY_DD2_SD1',
                    'Bina_Sd1_DD3': 'MY_DD3_SD1',
                    'TM_no': 'MY_TM_KODU',
                } //TODO add for more data

                for (const key in updates) {
                    this.UpdateBuildingData(updates[key], row[genelBilgiProcessed[0].indexOf(key)]);
                }
            }
        }
    }

    UpdateBuildingData(key, value) {
        let index = this.contents.indexOf(key);
        if (index == -1) {
            this.contents.push(key);
            this.representatives.push(value);
        }
        else {
            this.representatives[index] = value;
        }
    }

    GetRepresentativeFor(content) {
        let index = this.contents.indexOf(content);
        return this.representatives[index];
    }

    AppendToParent(text) {
        if (!this.parentBuildingsArr.includes(text)) {
            this.parentBuildingsArr.push(text);
            this.parentBuildingsStr += '        ⦁	' + text + '\n';
        }
    }
}
