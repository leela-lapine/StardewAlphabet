// just establishing variables
let allItems = [];
let selectedLetter = null;
let excludeOutsidePelican = false;
let excludePerfectionLocked = false;
let excludeMasteryLocked = false;
let excludeMineralLocked = false;
let currentItem = null;  
let isDayMode = false;
let wildcardMode = false;

// make alphabet buttons
function createAlphabet() {
    const alphabetContainer = document.getElementById('alphabet');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    letters.forEach(letter => {
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        btn.textContent = letter;
        btn.onclick = () => selectLetter(letter);
        alphabetContainer.appendChild(btn);
    });
}

// load CSV 
async function loadItems() {
    try {
        const response = await fetch('stardew_items_complete.csv');
        const csvText = await response.text();
        parseCSV(csvText);
    } catch (error) {
        console.error('Error loading CSV:', error);
        document.getElementById('result').innerHTML = 
            '<p class="error-message">Error loading items. Please make sure stardew_items_complete.csv is in the same folder as this HTML file.</p>';
    }
}

// Parse CSV data
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const item = {};
            headers.forEach((header, index) => {
                item[header] = values[index];
            });
            allItems.push(item);
        }
    }
    
    console.log(`Loaded ${allItems.length} items`);
}

// Parse a single CSV line (handles commas in quoted fields)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    
    return result;
}

// Select a letter and show random item
function selectLetter(letter) {
    selectedLetter = letter;
    
    // button visual stuff 
    document.querySelectorAll('.letter-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent === letter) {
            btn.classList.add('selected');
        }
    });
    
    // updated version for wildcard mode 
    let itemsForLetter;
    if (letter === 'X' && wildcardMode) {
        // Wildcard mode: get all items EXCEPT those starting with X
        itemsForLetter = allItems.filter(item => 
            item.name && item.name.charAt(0).toUpperCase() !== 'X'
        );
    } else {
        // Normal mode: get items starting with selected letter
        itemsForLetter = allItems.filter(item => 
            item.name && item.name.charAt(0).toUpperCase() === letter
        );
    }

    // Apply perfection-locked filter
    if (excludePerfectionLocked) {
        itemsForLetter = itemsForLetter.filter(item => {
            const perfectionLocked = item['Perfection-locked'] || item['perfection-locked'] || '';
            return perfectionLocked.toLowerCase() !== 'yes';
        });
    }
    
    // Apply mastery-locked filter
    if (excludeMasteryLocked) {
        itemsForLetter = itemsForLetter.filter(item => {
            const masteryLocked = item['Mastery-locked'] || item['mastery-locked'] || '';
            return masteryLocked.toLowerCase() !== 'yes';
        });
    }

    // Apply mineral-locked filter
    if (excludeMineralLocked) {
        itemsForLetter = itemsForLetter.filter(item => {
            const mineralLocked = item['Mineral'] || item['mineral'] || '';
            return mineralLocked.toLowerCase() !== 'yes';
        });
    }
    
    if (itemsForLetter.length === 0) {
        document.getElementById('result').innerHTML = 
            `<p class="error-message">No items found starting with "${letter}" with current filters</p>`;
        return;
    }
    
    // Pick random item
    const randomItem = itemsForLetter[Math.floor(Math.random() * itemsForLetter.length)];
    displayItem(randomItem);
}

// Display the selected item
function displayItem(item) {
    currentItem = item; 
    const resultContainer = document.getElementById('result');
    
    let imagePath = item.local_image_path || item['local_image_path'];
    const wikiUrl = item.wiki_url || item['wiki_url'];
    const itemName = item.name;
    
    // If the path doesn't include the folder, add it
    if (imagePath && !imagePath.includes('/')) {
        imagePath = 'stardew_item_images/' + imagePath;
    }
    
    resultContainer.innerHTML = `
        <img src="ui_elements/panel.png" alt="Panel" class="image-panel">
        <div class="item-name-container">
            <img src="ui_elements/d6.png" alt="Reroll" class="reroll-btn" id="rerollBtn">
            <div class="item-name">${itemName}</div>
    </div>
    <a href="${wikiUrl}" target="_blank" class="item-image-link">
        <img src="${imagePath}" alt="${itemName}" class="item-image">
    </a>
    <p class="wiki-hint">click the image above<br>to be taken to the wiki</p>
`;
    
    // Add click handler to reroll button
    document.getElementById('rerollBtn').addEventListener('click', () => {
        if (selectedLetter) {
            selectLetter(selectedLetter);
        }
    });
}


// Setup wildcard mode
function setupWildcardMode() {
    const leftGif = document.querySelector('.footer-gif:first-of-type');
    const rightGif = document.querySelector('.footer-gif:last-of-type');
    const footer = document.querySelector('.footer');
    
    // Create the status message element
    const statusMessage = document.createElement('p');
    statusMessage.className = 'wildcard-status';
    statusMessage.style.display = 'none';
    statusMessage.textContent = 'letter X wildcard mode engaged';
    footer.parentNode.insertBefore(statusMessage, footer.nextSibling);
    
    // Left GIF - turn ON wildcard mode
    leftGif.addEventListener('click', () => {
        wildcardMode = true;
        statusMessage.style.display = 'block';
        leftGif.style.cursor = 'pointer';
        rightGif.style.cursor = 'pointer';
    });
    
    // Right GIF - turn OFF wildcard mode (only if it was on)
    rightGif.addEventListener('click', () => {
        if (wildcardMode) {
            wildcardMode = false;
            statusMessage.style.display = 'none';
        }
    });
    
    // Add pointer cursor on hover to hint they're clickable
    leftGif.style.cursor = 'pointer';
    rightGif.style.cursor = 'pointer';
}


// Initialize on page load
window.addEventListener('load', () => {
    createAlphabet();
    loadItems();
    setupToggleButtons();
    setupWildcardMode(); //new for wildcare mode 
    document.getElementById('modeToggle').addEventListener('click', toggleDayNight);
});

// Setup toggle button functionality
function setupToggleButtons() {
    const pelicanToggle = document.getElementById('pelicanToggle');
    const perfectionToggle = document.getElementById('perfectionToggle');
    const masteryToggle = document.getElementById('masteryToggle');
    const mineralToggle = document.getElementById('mineralToggle');

    pelicanToggle.addEventListener('click', () => {
        excludeOutsidePelican = !excludeOutsidePelican;
        updateToggleButton(pelicanToggle, excludeOutsidePelican);
        
        if (selectedLetter && currentItem) {
            const outsidePelican = currentItem['OutsidePelican'] || currentItem['outsidepelican'] || '';
            if (excludeOutsidePelican && outsidePelican.toLowerCase() === 'yes') {
                selectLetter(selectedLetter);
            }
        }
    });


    perfectionToggle.addEventListener('click', () => {
        excludePerfectionLocked = !excludePerfectionLocked;
        updateToggleButton(perfectionToggle, excludePerfectionLocked);
        
        // Only reroll if we have a selected letter and current item would be excluded
        if (selectedLetter && currentItem) {
            const perfectionLocked = currentItem['Perfection-locked'] || currentItem['perfection-locked'] || '';
            if (excludePerfectionLocked && perfectionLocked.toLowerCase() === 'yes') {
                selectLetter(selectedLetter);
            }
        }
    });
    
    masteryToggle.addEventListener('click', () => {
        excludeMasteryLocked = !excludeMasteryLocked;
        updateToggleButton(masteryToggle, excludeMasteryLocked);
        
        // Only reroll if we have a selected letter and current item would be excluded
        if (selectedLetter && currentItem) {
            const masteryLocked = currentItem['Mastery-locked'] || currentItem['mastery-locked'] || '';
            if (excludeMasteryLocked && masteryLocked.toLowerCase() === 'yes') {
                selectLetter(selectedLetter);
            }
        }
    });

    mineralToggle.addEventListener('click', () => {
        excludeMineralLocked = !excludeMineralLocked;
        updateToggleButton(mineralToggle, excludeMineralLocked);
    
        // Only reroll if we have a selected letter and current item would be excluded
        if (selectedLetter && currentItem) {
            const mineralLocked = currentItem['Mineral'] || currentItem['mineral'] || '';
            if (excludeMineralLocked && mineralLocked.toLowerCase() === 'yes') {
                selectLetter(selectedLetter);
            }
        }
    });
}

// Update toggle button image
function updateToggleButton(button, isPressed) {
    console.log('Toggle button - isPressed:', isPressed);
    
    const buttonPrefix = isDayMode ? 'red' : 'green';
    
    if (isPressed) {
        button.src = `ui_elements/${buttonPrefix}_pressed_square_1.png`;
        console.log('Button pressed');
    } else {
        const unpressedFile = isDayMode ? 'red_square_44.png' : 'green_square_45.png';
        button.src = `ui_elements/${unpressedFile}`;
        console.log('Button unpressed');
    }
}

function toggleDayNight() {
    isDayMode = !isDayMode;
    const root = document.documentElement;
    const modeToggle = document.getElementById('modeToggle');
    const pelicanToggle = document.getElementById('pelicanToggle'); 
    const perfectionToggle = document.getElementById('perfectionToggle');
    const masteryToggle = document.getElementById('masteryToggle');
    const mineralToggle = document.getElementById('mineralToggle');

    if (isDayMode) {
        // Day mode
        root.style.setProperty('--bg-color', '#e9e6df');
        root.style.setProperty('--text-color', '#000000');
        root.style.setProperty('--highlight-color', '#ad2f45');
        modeToggle.src = 'ui_elements/red_toggle.png';
        
        // Update filter buttons if not pressed
        if (!excludeOutsidePelican) {
            pelicanToggle.src = 'ui_elements/red_square_44.png';
        } else {
            pelicanToggle.src = 'ui_elements/red_pressed_square_1.png';
        }
        if (!excludePerfectionLocked) {
            perfectionToggle.src = 'ui_elements/red_square_44.png';
        } else {
            perfectionToggle.src = 'ui_elements/red_pressed_square_1.png';
        }
        if (!excludeMasteryLocked) {
            masteryToggle.src = 'ui_elements/red_square_44.png';
        } else {
            masteryToggle.src = 'ui_elements/red_pressed_square_1.png';
        }
        if (!excludeMineralLocked) {
            mineralToggle.src = 'ui_elements/red_square_44.png';
        } else {
            mineralToggle.src = 'ui_elements/red_pressed_square_1.png';
        }
    } else {
        // Night mode
        root.style.setProperty('--bg-color', 'black');
        root.style.setProperty('--text-color', 'white');
        root.style.setProperty('--highlight-color', '#63ab3f');
        modeToggle.src = 'ui_elements/green_toggle.png';
        
        // Update filter buttons if not pressed
        if (!excludeOutsidePelican) {
            pelicanToggle.src = 'ui_elements/green_square_45.png';
        } else {
            pelicanToggle.src = 'ui_elements/green_pressed_square_1.png';
        }
        if (!excludePerfectionLocked) {
            perfectionToggle.src = 'ui_elements/green_square_45.png';
        } else {
            perfectionToggle.src = 'ui_elements/green_pressed_square_1.png';
        }
        if (!excludeMasteryLocked) {
            masteryToggle.src = 'ui_elements/green_square_45.png';
        } else {
            masteryToggle.src = 'ui_elements/green_pressed_square_1.png';
        }
        if (!excludeMineralLocked) {
             mineralToggle.src = 'ui_elements/green_square_45.png';
        } else {
            mineralToggle.src = 'ui_elements/green_pressed_square_1.png';
        }
    }
}