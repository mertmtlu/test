import { fetchFrom } from './database.js';

const frm = document.getElementById('frame');

const lastFrame = sessionStorage.getItem('lastFrame');
if (lastFrame) {
    frm.src = lastFrame;
}
else {
    frm.src = "frames/home.html";
}

document.getElementById('dropdownMenu').addEventListener('click', async function (event) {
    const target = event.target;
    if (target.classList.contains('fetch-data')) {
        const dataName = target.getAttribute('data-dataname');
        const data = await fetchFrom(1000, dataName);

        sessionStorage.setItem('dataName', dataName);
        sessionStorage.setItem('dataFromDatabase', JSON.stringify(true));
        frm.src = "frames/manageData.html"

        sessionStorage.setItem('lastFrame', "frames/manageData.html");
    }
});

document.getElementById('navItem').addEventListener('click', async function (event) {
    const target = event.target;
    if (target.classList.contains('report')) {
        const dataName = target.getAttribute('data-dataname');
        frm.src = "frames/" + dataName;

        sessionStorage.setItem('lastFrame', "frames/" + dataName);
    }
    if (target.classList.contains('classic')) {
        const dataName = target.getAttribute('data-dataname');
        frm.src = "frames/" + dataName;

        sessionStorage.setItem('lastFrame', "frames/" + dataName);
    }
})

document.addEventListener('DOMContentLoaded', function () {
    const toggleOptions = document.querySelectorAll('.toggle-option');
    const toggleSlider = document.querySelector('.toggle-slider');

    toggleOptions.forEach(option => {
        option.addEventListener('click', function () {
            // Remove active class from all options
            toggleOptions.forEach(opt => opt.classList.remove('active'));

            // Add active class to clicked option
            this.classList.add('active');

            // Move slider
            if (this.dataset.value === 'nihai') {
                toggleSlider.classList.add('right');
            } else {
                toggleSlider.classList.remove('right');
            }

            // Here you can add code to handle the state change
            const selectedValue = this.dataset.value;

            // For example, you could store the selection in sessionStorage
            sessionStorage.setItem('teslimDurumu', selectedValue);

            frm.contentWindow.location.reload();
        });
    });

    const filterDropdown = document.getElementById('filterDropdown');
    const filterOptions = document.querySelectorAll('.filter-option');

    // Initialize the value in sessionStorage if not already set
    if (!sessionStorage.getItem('filterDurumu')) {
        sessionStorage.setItem('filterDurumu', 'Tümü');
    }

    // Set initial dropdown text to match sessionStorage
    filterDropdown.textContent = sessionStorage.getItem('filterDurumu');

    // Handle dropdown option selection
    filterOptions.forEach(option => {
        option.addEventListener('click', function (e) {
            e.preventDefault();

            // Get the selected value
            const selectedValue = this.dataset.value;

            // Update dropdown button text
            filterDropdown.textContent = selectedValue;

            // Store in sessionStorage
            sessionStorage.setItem('filterDurumu', selectedValue);

            location.reload();
        });
    });
});

sessionStorage.setItem('teslimDurumu', 'nihai');

fetchFrom(1000, "tapu_parsel_data")
fetchFrom(1000, "tm_parsel_data")
fetchFrom(1000, "genel_bilgi")
fetchFrom(1000, "master_view")
fetchFrom(1000, "diger_riskler")
fetchFrom(1000, "bina_genel_bilgi_processed")

