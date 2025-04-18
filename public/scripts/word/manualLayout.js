import { fetchFrom } from '../database.js';

const childIframe = document.getElementById('frame');
const sidebar = document.getElementById('sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
const content = document.getElementById('content');
const sidebarCont = document.getElementById('sidebarContent');

const templateData = await fetchFrom(1000, 'raports');

const nameIndex = templateData[0].indexOf('name');
const contentIndex = templateData[0].indexOf('content');

const templates = templateData.slice(1);

const $dropdown = $('#templateDropdown');

templates.forEach(template => {
    const templateName = template[nameIndex];
    const templateContent = template[contentIndex];
    const option  = new Option(templateName, templateContent);

    option.addEventListener('click', () => {
        handleDropdownChange(templateContent);
    });

    $dropdown.append(option);
});

$dropdown.select2({
    placeholder: 'Şablon Seçin',
    allowClear: true
});

$dropdown.on('change', function() {
    const selectedContent = $(this).val();
    handleDropdownChange(selectedContent);
});

function handleDropdownChange(selectedContent) {
    // console.log("Selected template content:", selectedContent);

    childIframe.contentWindow.postMessage({ type: 'storageChanged', content: selectedContent }, '*');

}

document.getElementById('toggleBtn').addEventListener('click', function() {
    var asideMenu = document.getElementById('asideMenu');
    asideMenu.classList.toggle('open');

    // Adjust main content margin when menu is expanded or collapsed
    var mainContent = document.getElementById('main');
    if (asideMenu.classList.contains('open')) {
        mainContent.style.marginLeft = '300px';
    } else {
        mainContent.style.marginLeft = '50px';
    }
});