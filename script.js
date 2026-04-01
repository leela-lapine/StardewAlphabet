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
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ?'.split('');
    
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
            '<p class="error-message">Error loading items.</p>';
    }
}

// parse CSV data
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

// parse a single CSV line (handles commas in quoted fields)
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

// updated selectLetter to accomodate preloads 
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
        // wildcard mode: get all items EXCEPT those starting with X
        itemsForLetter = allItems.filter(item => 
            item.name && item.name.charAt(0).toUpperCase() !== 'X'
        );
    } else {
        // normal mode: get items starting with selected letter
        itemsForLetter = allItems.filter(item => 
            item.name && item.name.charAt(0).toUpperCase() === letter
        );
    }

    // apply outside-pelican filter
    if (excludeOutsidePelican) {
        itemsForLetter = itemsForLetter.filter(item => {
            const outsidePelican = item['OutsidePelican'] || item['outsidepelican'] || '';
            return outsidePelican.toLowerCase() !== 'yes';
        });
    }

    // apply perfection-locked filter
    if (excludePerfectionLocked) {
        itemsForLetter = itemsForLetter.filter(item => {
            const perfectionLocked = item['Perfection-locked'] || item['perfection-locked'] || '';
            return perfectionLocked.toLowerCase() !== 'yes';
        });
    }
    
    // apply mastery-locked filter
    if (excludeMasteryLocked) {
        itemsForLetter = itemsForLetter.filter(item => {
            const masteryLocked = item['Mastery-locked'] || item['mastery-locked'] || '';
            return masteryLocked.toLowerCase() !== 'yes';
        });
    }

    // apply mineral-locked filter
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
    
    // pick the final random item
    const finalItem = itemsForLetter[Math.floor(Math.random() * itemsForLetter.length)];
    
    // preload images before starting animation to things don't look CRAZY 
    preloadImages(itemsForLetter, () => {
        // start animation after images are loaded
        slotMachineAnimation(itemsForLetter, finalItem);
    });
}


// new function that preloads imagines 
function preloadImages(items, callback) {
    let loadedCount = 0;
    const imagesToLoad = Math.min(items.length, 15); // only preload up to 15 images
    
    // if there are very few items, preload them all
    const itemsToPreload = items.slice(0, imagesToLoad);
    
    if (itemsToPreload.length === 0) {
        callback();
        return;
    }
    
    itemsToPreload.forEach(item => {
        const img = new Image();
        let imagePath = item.local_image_path || item['local_image_path'];
        const itemName = item.name;
        
        if (imagePath && !imagePath.includes('/')) {
            const firstLetter = itemName.charAt(0).toUpperCase();
            const folderName = /[A-Z]/.test(firstLetter) ? firstLetter : 'Other';
            imagePath = `stardew_item_images/${folderName}/${imagePath}`;
        }
        
        img.onload = img.onerror = () => {
            loadedCount++;
            if (loadedCount === itemsToPreload.length) {
                callback();
            }
        };
        
        img.src = imagePath;
    });
}


// slot machine animation before revealing final item
function slotMachineAnimation(itemsForLetter, finalItem) {
    const totalCycles = 12; // Total number of flashes
    let currentCycle = 0;
    
    // calculate timing - start fast, slow down at the end
    function getDelay(cycle) {
        if (cycle < 6) return 80;  // fast at the beginning
        if (cycle < 9) return 150; // medium speed
        return 300; // slow down at the end
    }
    
    function showNextItem() {
        if (currentCycle < totalCycles) {
            // pick a random item to flash (can repeat)
            const randomItem = itemsForLetter[Math.floor(Math.random() * itemsForLetter.length)];
            displayItem(randomItem, true); // true = animation mode
            
            currentCycle++;
            setTimeout(showNextItem, getDelay(currentCycle));
        } else {
            // animation done - show the final item
            displayItem(finalItem, false); // false = final reveal
        }
    }
    
    showNextItem();
}

// updated (version 3) display item function that should look ok on firefox 
function displayItem(item, isAnimating = false) {
    const resultContainer = document.getElementById('result');
    
    let imagePath = item.local_image_path || item['local_image_path'];
    const wikiUrl = item.wiki_url || item['wiki_url'];
    const itemName = item.name;
    
    // if the path doesn't include the folder, add it with letter subfolder
    if (imagePath && !imagePath.includes('/')) {
        const firstLetter = itemName.charAt(0).toUpperCase();
        // handle weird characters like ?
        const folderName = /[A-Z]/.test(firstLetter) ? firstLetter : 'Other';
        imagePath = `stardew_item_images/${folderName}/${imagePath}`;
    }
    
    // during animation, only update the image, keep text stable
    if (isAnimating) {
        // check if we already have the animation structure
        const existingImage = resultContainer.querySelector('.item-image');
        const existingName = resultContainer.querySelector('.item-name');
        
        if (existingImage && existingName) {
            // just update the image source and reset the name text
            existingImage.src = imagePath;
            existingImage.alt = itemName;
            existingName.textContent = 'generating item...';
            existingName.className = 'item-name generating';
        } else {
            // first time - build the structure
            resultContainer.innerHTML = `
                <img src="ui_elements/panel.png" alt="Panel" class="image-panel">
                <div class="item-name-container">
                    <div class="item-name generating">generating item...</div>
                </div>
                <div class="item-image-link">
                    <img src="${imagePath}" alt="${itemName}" class="item-image">
                </div>
            `;
        }
    } else {
        // final reveal - hide container while loading, then show when ready
        currentItem = item;
        
        // preload the final image first (this is for firefox's sake)
        const finalImg = new Image();
        finalImg.onload = () => {
            // Image is loaded, now safely update the HTML
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
        };
        
        // if image fails to load, still show the content
        finalImg.onerror = () => {
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
            
            document.getElementById('rerollBtn').addEventListener('click', () => {
                if (selectedLetter) {
                    selectLetter(selectedLetter);
                }
            });
        };
        
        // Start loading the image
        finalImg.src = imagePath;
    }
}


// setup wildcard mode
function setupWildcardMode() {
    const leftGif = document.querySelector('.footer-gif:first-of-type');
    const rightGif = document.querySelector('.footer-gif:last-of-type');
    const footer = document.querySelector('.footer');
    
    // create the status message element
    const statusMessage = document.createElement('p');
    statusMessage.className = 'wildcard-status';
    statusMessage.style.display = 'none';
    statusMessage.textContent = 'letter X wildcard mode engaged';
    footer.parentNode.insertBefore(statusMessage, footer.nextSibling);
    
    // left GIF - turn ON wildcard mode
    leftGif.addEventListener('click', () => {
        wildcardMode = true;
        statusMessage.style.display = 'block';
        leftGif.style.cursor = 'pointer';
        rightGif.style.cursor = 'pointer';
    });
    
    // right GIF - turn OFF wildcard mode if it was on
    rightGif.addEventListener('click', () => {
        if (wildcardMode) {
            wildcardMode = false;
            statusMessage.style.display = 'none';
        }
    });
    
    // add pointer cursor on hover to hint they're clickable
    leftGif.style.cursor = 'pointer';
    rightGif.style.cursor = 'pointer';
}


// initialize on page load
window.addEventListener('load', () => {
    createAlphabet();
    loadItems();
    setupToggleButtons();
    setupWildcardMode(); //new for wildcare mode 
    document.getElementById('modeToggle').addEventListener('click', toggleDayNight);
});

// setup toggle button functionality
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
        
        // only reroll if we have a selected letter and current item would be excluded
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
        
        // only reroll if we have a selected letter and current item would be excluded
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
    
        // only reroll if we have a selected letter and current item would be excluded
        if (selectedLetter && currentItem) {
            const mineralLocked = currentItem['Mineral'] || currentItem['mineral'] || '';
            if (excludeMineralLocked && mineralLocked.toLowerCase() === 'yes') {
                selectLetter(selectedLetter);
            }
        }
    });
}

// update toggle button image
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
        // day mode
        root.style.setProperty('--bg-color', '#e9e6df');
        root.style.setProperty('--text-color', '#000000');
        root.style.setProperty('--highlight-color', '#ad2f45');
        modeToggle.src = 'ui_elements/red_toggle.png';
        
        // update filter buttons if not pressed
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
        // night mode
        root.style.setProperty('--bg-color', 'black');
        root.style.setProperty('--text-color', 'white');
        root.style.setProperty('--highlight-color', '#63ab3f');
        modeToggle.src = 'ui_elements/green_toggle.png';
        
        // update filter buttons if not pressed
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