//eventListeners.js
import { showAlert } from '../utilities.js';
import { updateMarkersAndDropdown } from './mapManager.js';
import { extractTMNumbers } from './utilities.js';

function toLowercase(word) {
    // Character mapping dictionary for proper Turkish lowercase conversion
    const alphabet = {
      'A': 'a',
      'a': 'a',
      'B': 'b',
      'b': 'b',
      'C': 'c',
      'c': 'c',
      'Ç': 'ç',
      'ç': 'ç',
      'D': 'd',
      'd': 'd',
      'E': 'e',
      'e': 'e',
      'F': 'f',
      'f': 'f',
      'G': 'g',
      'g': 'g',
      'Ğ': 'ğ',
      'ğ': 'ğ',
      'H': 'h',
      'h': 'h',
      'I': 'ı', // Turkish dotless lowercase i
      'ı': 'ı',
      'İ': 'i', // Turkish dotted uppercase I
      'i': 'i',
      'J': 'j',
      'j': 'j',
      'K': 'k',
      'k': 'k',
      'L': 'l',
      'l': 'l',
      'M': 'm',
      'm': 'm',
      'N': 'n',
      'n': 'n',
      'O': 'o',
      'o': 'o',
      'Ö': 'ö',
      'ö': 'ö',
      'P': 'p',
      'p': 'p',
      'R': 'r',
      'r': 'r',
      'S': 's',
      's': 's',
      'Ş': 'ş',
      'ş': 'ş',
      'T': 't',
      't': 't',
      'U': 'u',
      'u': 'u',
      'Ü': 'ü',
      'ü': 'ü',
      'V': 'v',
      'v': 'v',
      'Y': 'y',
      'y': 'y',
      'Z': 'z',
      'z': 'z'
    };
  
    // Function to lowercase a single character
    function lowercaseChar(char) {
      if (char in alphabet) {
        return alphabet[char];
      } else {
        console.warn(`Warning: Unknown character in lowercase dictionary: ${char}, Using default function instead.`);
        return char.toLowerCase();
      }
    }
  
    // Handle entire word conversion
    let result = '';
    for (let i = 0; i < word.length; i++) {
      result += lowercaseChar(word[i]);
    }
    
    return result;
}
  
  // Function to lowercase entire text (multiple words)
function lowercaseText(text) {
    const words = text.split(' ');
    const lowercasedWords = words.map(word => toLowercase(word));
    return lowercasedWords.join(' ');
}
export function setupEventListeners(map, markers, locations, areasHome, dropdownMenu, markersLayer) {
    const searchBox = document.getElementById('searchBox');

    let typingTimer; // Timer identifier
    const typingDelay = 300; // Time in milliseconds

    // Function to handle the keyup event
    function handleKeyUp() {
        clearTimeout(typingTimer); // Clear any previous timer

        typingTimer = setTimeout(() => {
            const searchText = lowercaseText(document.getElementById('searchBox').value);
            const filteredLocations = locations.filter(location =>
                location.name.toLowerCase().includes(searchText) ||
                (location.search && lowercaseText(location.search).includes(searchText))
            );
            updateMarkersAndDropdown(map, markers, filteredLocations, areasHome, dropdownMenu, markersLayer);
        }, typingDelay);
    }

    // Remove any existing keyup event listener to avoid stacking
    searchBox.removeEventListener('keyup', handleKeyUp);
    // Attach the keyup event listener
    searchBox.addEventListener('keyup', handleKeyUp);


    document.getElementById('dataTypeDropdownMenu').addEventListener('click', () => {
        const dropdownMenu = document.getElementById('dropdownMenu');
        dropdownMenu.classList.toggle('show');
    });

    document.getElementById('goToCharts').addEventListener('click', function () {
        const dataType = document.getElementById('dataTypeDropdownMenu').textContent;

        if (dataType === 'Bölge Seçin') {
            showAlert('Lütfen bir bölge seçin', '37.5%', '25%');
            return
        }

        let tms = []

        areasHome.forEach(area => {
            if (area.AreaID != parseInt(dataType)) return;
            area.transformerCenters.forEach(tm => {
                tms.push(tm);
            })
        });

        sessionStorage.setItem('tms', JSON.stringify(tms));
        sessionStorage.setItem('dataType', dataType);
        window.location.href = `charts.html`;
    });

    document.getElementById('focus').addEventListener('click', function () {
        sessionStorage.setItem('focused', true);

        const dataType = document.getElementById('dataTypeDropdownMenu').textContent;

        if (dataType === 'Bölge Seçin') {
            showAlert('Lütfen bir bölge seçin', '37.5%', '25%');
            return;
        }

        const focusedLocations = locations.filter(location => (extractTMNumbers(location.name)).number1 === parseInt(dataType));

        const minLat = Math.min(...focusedLocations.map(location => location.lat));
        const maxLat = Math.max(...focusedLocations.map(location => location.lat));
        const minLng = Math.min(...focusedLocations.map(location => location.lon));
        const maxLng = Math.max(...focusedLocations.map(location => location.lon));

        map.fitBounds([[minLat, minLng], [maxLat, maxLng]]);

        updateMarkersAndDropdown(map, markers, focusedLocations, areasHome, dropdownMenu, markersLayer);

    });

    document.getElementById('removeFocus').addEventListener('click', function () {
        sessionStorage.setItem('focused', false);
        document.getElementById('dataTypeDropdownMenu').textContent = 'Bölge Seçin';

        updateMarkersAndDropdown(map, markers, locations, areasHome, dropdownMenu, markersLayer);
    });
}
