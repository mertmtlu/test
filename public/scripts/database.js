import { IndexedDBStorage } from './IndexedDBStorage.js';
import * as python from './report/python.js';

// Can be changed according to database IP
const hostIP = '144.122.103.206';

const CACHE_DURATION = 1800000; // 30 minutes in milliseconds

export async function fetchFrom(limit, dataName) {
    const version = sessionStorage.getItem('filterDurumu');
    const teslimTpye = sessionStorage.getItem('teslimDurumu');

    // Check for data in IndexedDB cache first
    const cacheKey = `cache_${dataName}_${limit}_${version}_${teslimTpye}`;
    try {
        const cachedData = await IndexedDBStorage.getItem(cacheKey);
        if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
            return cachedData.data;
        }
    } catch (error) {
        console.warn(`Cache read error for ${dataName}:`, error);
    }

    // Display a loading indicator for large datasets
    // if (dataName === 'tapu_parsel_data' || dataName === 'tm_parsel_data' || dataName === 'genel_bilgi') {
    // }
    showLoadingIndicator(`Loading ${dataName}...`);

    // Fetch data from server
    let fetchedData = [];
    let currentOffset = 0;
    let hasMoreData = true;

    while (hasMoreData) {
        const url = `http://${hostIP}/fetch_data?offset=${currentOffset}&limit=${limit}&dataName=${dataName}&version=${version}&teslim=${teslimTpye}`;
        // console.log('url', url)
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const dd = await response.json();
            if (dd.length > 0) {
                fetchedData = fetchedData.concat(dd);
                currentOffset += limit;
                updateLoadingIndicator(`Loaded ${fetchedData.length} records...`);
            } else {
                hasMoreData = false;
            }
        } catch (error) {
            console.error(`Error fetching data for ${dataName}:`, error);
            hideLoadingIndicator();
            throw error;
        }
    }

    // Hide the loading indicator
    hideLoadingIndicator();

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

    // Cache the data for future use
    try {
        await IndexedDBStorage.setItem(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
    } catch (error) {
        console.warn(`Cache write error for ${dataName}:`, error);
    }

    return data;
}

/**
 * Clears cached data for a specific data name, or all cached data
 * @param {string} [dataName] - Optional. If provided, clears cache only for this data name
 * @param {number} [limit] - Optional. If provided along with dataName, clears only the specific cache entry
 * @returns {Promise<void>}
 */
export async function clearCache(dataName, limit) {
    try {
        if (dataName && limit) {
            // Clear specific cache entry
            const cacheKey = `cache_${dataName}_${limit}`;
            await IndexedDBStorage.removeItem(cacheKey);
        }
        else if (dataName) {
            // Clear all cache entries for a specific data name
            const allKeys = await IndexedDBStorage.keys();
            const keysToRemove = allKeys.filter(key => key.startsWith(`cache_${dataName}_`));

            await Promise.all(keysToRemove.map(key => IndexedDBStorage.removeItem(key)));
        }
        else {
            // Clear all cache entries
            const allKeys = await IndexedDBStorage.keys();
            const cacheKeys = allKeys.filter(key => key.startsWith('cache_'));

            await Promise.all(cacheKeys.map(key => IndexedDBStorage.removeItem(key)));
        }
    } catch (error) {
        console.error('Error clearing cache:', error);
        throw error;
    }
}

async function fetchWithProgressTracking(limit, dataName) {
    showLoadingIndicator(`Loading ${dataName}...`);

    try {
        // Use a simple fetch without custom headers to avoid CORS issues
        const url = `http://${hostIP}/fetch_data?limit=${limit}&dataName=${dataName}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get response as JSON
        const fetchedData = await response.json();
        updateLoadingIndicator(`Processing ${fetchedData.length} records...`);

        // Extract column names
        let data = [];
        if (fetchedData.length > 0) {
            const fetchedColumnNames = Object.keys(fetchedData[0]);

            // Process in chunks to avoid UI freezing
            data = [fetchedColumnNames];

            // Process rows in chunks of 1000
            const chunkSize = 1000;
            for (let i = 0; i < fetchedData.length; i += chunkSize) {
                updateLoadingIndicator(`Processing rows ${i + 1} to ${Math.min(i + chunkSize, fetchedData.length)}...`);

                const chunk = fetchedData.slice(i, i + chunkSize);
                const rows = chunk.map(obj => fetchedColumnNames.map(key => {
                    return obj[key] !== null && obj[key] !== undefined ? obj[key] : '';
                }));

                data.push(...rows);

                // Allow UI to update between chunks
                await new Promise(r => setTimeout(r, 0));
            }
        }

        // Cache the data for future use
        try {
            await IndexedDBStorage.setItem(`cache_${dataName}_${limit}`, {
                data: data,
                timestamp: Date.now()
            });
        } catch (error) {
            console.warn(`Cache write error for ${dataName}:`, error);
        }

        hideLoadingIndicator();
        return data;

    } catch (error) {
        console.error(`Error fetching data for ${dataName}:`, error);
        hideLoadingIndicator();

        // Try to retrieve older cached version as fallback
        try {
            const cachedData = await IndexedDBStorage.getItem(`cache_${dataName}_${limit}`);
            if (cachedData && cachedData.data) {
                return cachedData.data;
            }
        } catch (cacheError) {
            console.error(`No cached data available for ${dataName}`);
        }

        throw error;
    }
}

function showLoadingIndicator(message) {
    let loadingDiv = document.getElementById('loading-indicator');

    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-indicator';
        loadingDiv.style.position = 'fixed';
        loadingDiv.style.top = '10px';
        loadingDiv.style.left = '50%';
        loadingDiv.style.transform = 'translateX(-50%)';
        loadingDiv.style.padding = '10px 20px';
        loadingDiv.style.background = 'rgba(0, 0, 0, 0.7)';
        loadingDiv.style.color = 'white';
        loadingDiv.style.borderRadius = '5px';
        loadingDiv.style.zIndex = '10000';
        loadingDiv.style.display = 'flex';
        loadingDiv.style.alignItems = 'center';
        loadingDiv.style.gap = '10px';

        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.style.width = '20px';
        spinner.style.height = '20px';
        spinner.style.borderRadius = '50%';
        spinner.style.border = '3px solid rgba(255, 255, 255, 0.3)';
        spinner.style.borderTopColor = 'white';
        spinner.style.animation = 'spin 1s linear infinite';

        const textSpan = document.createElement('span');
        textSpan.className = 'loading-text';

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;

        document.head.appendChild(style);
        loadingDiv.appendChild(spinner);
        loadingDiv.appendChild(textSpan);
        document.body.appendChild(loadingDiv);
    }

    const textSpan = loadingDiv.querySelector('.loading-text');
    textSpan.textContent = message;
    loadingDiv.style.display = 'flex';
}

function updateLoadingIndicator(message) {
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
        const textSpan = loadingDiv.querySelector('.loading-text');
        textSpan.textContent = message;
    }
}

function hideLoadingIndicator() {
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}

export async function setImage(fileName, base64String) {
    fetch(`http://${hostIP}/setImage.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'name=' + encodeURIComponent(fileName) + '&content=' + encodeURIComponent(base64String)
    })
        .then(response => response.text())
        .then(data => console.log(data));
}

export function getImage(fileName) {
    // Define the URL for the getImage.php endpoint
    const url = `http://${hostIP}/getImage.php`;

    // Create a POST request to send the image name
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `name=${encodeURIComponent(fileName)}` // Send the fileName as part of the POST data
    })
        .then(response => response.json()) // Parse the response as JSON
        .then(data => {
            if (data.status === 'success') {
                // Return the encoded image content
                return data.content;
            } else {
                // Handle the case where the image is not found
                throw new Error(data.message);
            }
        })
        .catch(error => {
            // Handle network or other errors
            console.error('Error fetching image:', error);
            return null;
        });
}

export function getImageExistence(fileName) {
    // Define the URL for the checkImageExistence.php endpoint
    const url = `http://${hostIP}/checkImageExistence.php`;

    // Create a POST request to check if the image exists
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `name=${encodeURIComponent(fileName)}` // Send the fileName as part of the POST data
    })
        .then(response => response.json()) // Parse the response as JSON
        .then(data => {
            if (data.status === 'success') {
                // Return true if the image exists
                return true;
            } else if (data.status === 'error') {
                // Return false if the image does not exist
                return false;
            } else {
                throw new Error('Unexpected response format');
            }
        })
        .catch(error => {
            // Handle network or other errors
            console.error('Error checking image existence:', error);
            return false; // Return false if there's any error
        });
}

export function setReport(name, content, images, newContent, buildingName) {
    fetch(`http://${hostIP}/setReport.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            content: content,
            images: images
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'exists') {
                // Show custom prompt with options
                showPrompt(
                    `${data.message}`,
                    '50%',
                    '400px',
                    (userChoice) => {
                        if (userChoice) {
                            // User clicked OK, alter the report
                            fetch(`http://${hostIP}/setReport.php`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    name: name,
                                    content: content,
                                    images: images,
                                    action: 'alter'
                                })
                            })
                                .then(response => response.json())
                                .then(updatedData => console.log(updatedData.message));
                        } else {
                            console.log("User chose to exit.");
                        }
                    },
                    newContent,
                    buildingName,
                    data.data
                );
            }
            else {
                python.downloadPython(newContent, buildingName);
                console.log(data.message);
            }
        })
        .catch(error => console.error('Error:', error));
}

export function saveTemp(templateName, textContent) {
    if (templateName) {
        fetch(`http://${hostIP}/setTemplate.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'name=' + encodeURIComponent(templateName) + '&content=' + encodeURIComponent(textContent)
        })
            .then(response => response.text())
            .then(data => console.log(data));
    }
}

export async function searchPdf(areaID, tmID, type, preference = 'M00-00') {

    // Make a request to the PHP file to search for the PDF
    const response = await fetch(`http://${hostIP}/searchPdf.php?areaID=${areaID}&tmID=${tmID}&type=${type}&preference=${preference}&teslim=${sessionStorage.getItem('teslimDurumu')}`);
    const data = await response.json();

    if (data.filePath) {
        if (data.filePath.includes(`http://${hostIP}/`)) {
            data.filePath = data.filePath.replace(`http://${hostIP}/`, '');
        }
        return "http://" + hostIP + data.filePath; // Return the file path for rendering
    } else {
        console.error(data.error || 'File not found');
        return null;
    }

}

export async function searchCadFile(areaID, tmID, type, preference) {
    // Make a request to the PHP file to search for the PDF
    const response = await fetch(`http://${hostIP}/searchCadFile.php?areaID=${areaID}&tmID=${tmID}&type=${type}&preference=${preference}`);
    const data = await response.json();

    return data;
}

/**
 * Download a CAD file from the server
 * @param {string} filePath - Path or URL to the CAD file
 */
export function downloadCadFile(filePath, filename) {
    // First, clean up the file path
    let cleanPath = filePath;

    // Handle both server-side paths and URLs
    if (filePath.includes(':\\') || filePath.includes('/www/')) {
        // Extract just the filename from server path
        const pathParts = filePath.split(/[\/\\]/);
        const fileName = pathParts[pathParts.length - 1];
        cleanPath = 'cadFiles/' + fileName;
    }

    // Create download endpoint URL
    const downloadUrl = `http://${hostIP}/downloadCadFile.php?file=` + encodeURIComponent(cleanPath);

    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'cad-download-indicator';
    loadingIndicator.textContent = 'Dosya indiriliyor...';

    Object.assign(loadingIndicator.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '10px 20px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        borderRadius: '4px',
        zIndex: '10000',
        fontFamily: 'Arial, sans-serif'
    });

    document.body.appendChild(loadingIndicator);

    // Start file download
    fetch(downloadUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            // Get filename from Content-Disposition header if available
            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            return response.blob().then(blob => {
                return { blob, filename };
            });
        })
        .then(({ blob, filename }) => {
            // Create download link and trigger it
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();

            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            document.body.removeChild(loadingIndicator);

            // Show success message
            showAlert('Dosya başarıyla indirildi: ' + filename);
        })
        .catch(error => {
            console.error('Download error:', error);
            document.body.removeChild(loadingIndicator);
            showAlert('Dosya indirilirken hata oluştu. Lütfen tekrar deneyin.');
        });
}

export async function validateUser(username, password, login = 'login') {
    const adress = `http://${hostIP}/check_user.php?username=${username}&password=${password}&login=${login}`;

    const response = await fetch(
        adress
    );
    const data = await response.json();

    if (data.exists) {
        return true; // User exists
    } else {
        return null; // User does not exist
    }
}

export async function getImageFromNextCloud(areaID, centerID) {
    const adress = `http://${hostIP}/getImageFromNextCloud.php?area_id=${areaID}&center_id=${centerID}`;

    const response = await fetch(
        adress
    );

    return response;
}

export async function requestNewPassword(username) {
    const adress = `http://${hostIP}/request_password_reset.php?username=${username}`;

    const response = await fetch(
        adress
    );
    const data = await response.json();

    if (data.exists) {
        return true; // User exists
    } else {
        return null; // User does not exist
    }
}

export async function checkUsernameExists(username) {
    const adress = `http://${hostIP}/user_exists.php?username=${username}`;

    const response = await fetch(
        adress
    );
    const data = await response.json();

    if (data.exists) {
        return true; // User exists
    } else {
        return null; // User does not exist
    }
}

export async function addUser(username, password, email) {
    try {
        const response = await fetch(
            `http://${hostIP}/add_user.php?username=${username}&password=${password}&email=${email}`,
        );

        const data = await response.json();
        if (response.ok) {
            console.log("User added successfully:", data);
        } else {
            console.error("Error adding user:", data.error);
        }
    } catch (error) {
        console.error("Request failed:", error);
    }
}

function showPrompt(message, left, width, callback, newContent, buildingName, reportData = null) {
    const promptDiv = document.createElement('div');
    promptDiv.className = 'prompt-container';
    promptDiv.style.position = 'absolute';
    promptDiv.style.top = '20px';
    promptDiv.style.left = left;
    promptDiv.style.width = width;
    promptDiv.style.zIndex = '1000';
    promptDiv.style.backgroundColor = '#f8f9fa';
    promptDiv.style.border = '1px solid #ced4da';
    promptDiv.style.padding = '20px';
    promptDiv.style.borderRadius = '5px';
    promptDiv.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';

    const messageDiv = document.createElement('div');
    messageDiv.innerText = message;
    messageDiv.style.marginBottom = '10px';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between'; // Space between the button groups
    buttonContainer.style.width = '100%';

    const leftButtonGroup = document.createElement('div');
    const rightButtonGroup = document.createElement('div');

    const okButton = document.createElement('button');
    okButton.className = 'btn btn-primary';
    okButton.innerText = 'Evet';
    okButton.style.marginRight = '10px';

    const cancelButton = document.createElement('button');
    cancelButton.className = 'btn btn-secondary';
    cancelButton.innerText = 'Hayır';
    cancelButton.style.marginRight = '10px';

    // View Report Button
    const viewReportButton = document.createElement('button');
    viewReportButton.className = 'btn btn-info';
    viewReportButton.innerText = 'Raporu Görüntüle';

    leftButtonGroup.appendChild(viewReportButton); // Align to the left
    rightButtonGroup.appendChild(okButton); // Align to the right
    rightButtonGroup.appendChild(cancelButton); // Align to the right

    buttonContainer.appendChild(leftButtonGroup);
    buttonContainer.appendChild(rightButtonGroup);

    promptDiv.appendChild(messageDiv);
    promptDiv.appendChild(buttonContainer);

    document.body.appendChild(promptDiv);

    // OK Button Click
    okButton.addEventListener('click', () => {
        callback(true);  // User chose to alter the report
        promptDiv.remove();
        python.downloadPython(newContent, buildingName);
    });

    // Cancel Button Click
    cancelButton.addEventListener('click', () => {
        callback(null);  // User chose to exit
        promptDiv.remove();
    });

    // View Report Button Click
    viewReportButton.addEventListener('click', () => {
        if (reportData) {
            // Send a message to the parent window to handle the view action
            window.parent.postMessage({
                action: 'viewReport',
            }, '*');

            IndexedDBStorage.setItem('reportData', JSON.stringify(reportData));
        }
        promptDiv.remove();
    });

    // Close prompt on outside click
    document.addEventListener('click', (event) => {
        if (!promptDiv.contains(event.target)) {
            callback(null);
            promptDiv.remove();
        }
    }, { once: true });
}