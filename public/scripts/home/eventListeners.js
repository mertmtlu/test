const bursa = document.querySelectorAll('.st0')
const edirne = document.querySelectorAll('.st1')
const istanbulAnadolu = document.querySelectorAll('.st3')
const istanbulAvrupa = document.querySelectorAll('.st4')
const antalya = document.querySelectorAll('.st5')
const isparta = document.querySelectorAll('.st6')
const izmir = document.querySelectorAll('.st7')
const denizli = document.querySelectorAll('.st8')
const samsun = document.querySelectorAll('.st9')
const kütahya = document.querySelectorAll('.st10')
const ankara = document.querySelectorAll('.st11')
const konya = document.querySelectorAll('.st12')
const kayseri = document.querySelectorAll('.st13')
const trabzon = document.querySelectorAll('.st14')
const batman = document.querySelectorAll('.st15')
const elazıg = document.querySelectorAll('.st16')
const erzurum = document.querySelectorAll('.st17')
const van = document.querySelectorAll('.st18')
const gaziantep = document.querySelectorAll('.st19')
const adana = document.querySelectorAll('.st20')
const kastamonu = document.querySelectorAll('.st21')
const sakarya = document.querySelectorAll('.st22')

const allCities = {
    "1. Bölge Müdürlüğü - İstanbul/Avrupa": istanbulAvrupa,
    "2. Bölge Müdürlüğü - Bursa": bursa,
    "3. Bölge Müdürlüğü - İzmir": izmir,
    "4. Bölge Müdürlüğü - İstanbul/Anadolu": istanbulAnadolu,
    "5. Bölge Müdürlüğü - Sakarya": sakarya,
    "6. Bölge Müdürlüğü - Kütahya": kütahya,
    "7. Bölge Müdürlüğü - Isparta": isparta,
    "8. Bölge Müdürlüğü - Ankara": ankara,
    "9. Bölge Müdürlüğü - Konya": konya,
    "10. Bölge Müdürlüğü - Samsun": samsun,
    "11. Bölge Müdürlüğü - Kayseri": kayseri,
    "12. Bölge Müdürlüğü - Gaziantep": gaziantep,
    "13. Bölge Müdürlüğü - Elazığ": elazıg,
    "14. Bölge Müdürlüğü - Trabzon": trabzon,
    "15. Bölge Müdürlüğü - Erzurum": erzurum,
    "16. Bölge Müdürlüğü - Batman": batman,
    "17. Bölge Müdürlüğü - Van": van,
    "18. Bölge Müdürlüğü - Adana": adana,
    "19. Bölge Müdürlüğü - Antalya": antalya,
    "20. Bölge Müdürlüğü - Edirne": edirne,
    "21. Bölge Müdürlüğü - Denizli": denizli,
    "22. Bölge Müdürlüğü - Kastamonu": kastamonu,
}

Object.keys(allCities).forEach(key => {
    allCities[key].forEach(cities => {
        if (Array.isArray(cities)) {
            cities.forEach(city => {
                city.addEventListener('click', () => {
                    console.log(key);
                });

                const infoDiv = document.createElement('div');
                infoDiv.style.position = 'absolute';
                infoDiv.style.backgroundColor = 'white';
                infoDiv.style.border = '1px solid black';
                infoDiv.style.borderRadius = '5px';
                infoDiv.style.padding = '5px';
                infoDiv.style.zIndex = '1000';

                city.addEventListener('mouseover', () => {
                    infoDiv.textContent = key;
                    // Create a div with the key inside

                    document.body.appendChild(infoDiv);

                    // Position the div near the mouse cursor
                    city.addEventListener('mousemove', (e) => {
                        infoDiv.style.left = `${e.pageX + 10}px`;
                        infoDiv.style.top = `${e.pageY + 10}px`;
                    });

                    Object.keys(allCities).forEach(otherKey => {
                        if (otherKey !== key) {
                            allCities[otherKey].forEach(otherCity => {
                                otherCity.style.opacity = '0.3'; // Make other cities darker
                            });
                        }
                    });
                });

                city.addEventListener('mouseout', () => {
                    if (infoDiv) {
                        infoDiv.remove();
                    }

                    Object.keys(allCities).forEach(otherKey => {
                        if (otherKey !== key) {
                            allCities[otherKey].forEach(otherCity => {
                                otherCity.style.opacity = ''; // Reset the opacity of other cities
                            });
                        }
                    });
                });
            });
        } else {
            cities.addEventListener('click', () => {
                console.log(key);
            });

            const infoDiv = document.createElement('div');
            infoDiv.style.position = 'absolute';
            infoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'; // Dark background with some transparency
            infoDiv.style.color = 'white'; // White text
            // infoDiv.style.border = '1px solid #ccc'; // Light border
            infoDiv.style.borderRadius = '8px'; // Slightly more rounded corners
            infoDiv.style.padding = '10px'; // More padding for a modern look
            infoDiv.style.zIndex = '1000';
            infoDiv.style.fontFamily = 'Arial, sans-serif';
            infoDiv.style.fontSize = '20px';
            
            cities.addEventListener('mouseover', () => {
                // Create a div with the key inside
                infoDiv.textContent = key;
                infoDiv.style.padding = '20px';
                document.body.appendChild(infoDiv);

                // Position the div near the mouse cursor
                cities.addEventListener('mousemove', (e) => {
                    infoDiv.style.left = `${e.pageX + 10}px`;
                    infoDiv.style.top = `${e.pageY + 10}px`;
                });

                Object.keys(allCities).forEach(otherKey => {
                    if (otherKey !== key) {
                        allCities[otherKey].forEach(otherCity => {
                            otherCity.style.opacity = '0.3'; // Make other cities darker
                        });
                    }
                });
            });

            cities.addEventListener('mouseout', () => {
                if (infoDiv) {
                    infoDiv.remove();
                }

                Object.keys(allCities).forEach(otherKey => {
                    if (otherKey !== key) {
                        allCities[otherKey].forEach(otherCity => {
                            otherCity.style.opacity = ''; // Reset the opacity of other cities
                        });
                    }
                });
            });
        }
    });
});