const savedPort = localStorage.getItem('OmnisearchPort') || '51361';

function SearchResults(parent) {
    const query = new URLSearchParams(window.location.search).get('q');
    const apiUrl = `http://localhost:${savedPort}/search?q=${encodeURIComponent(query)}`;
    console.log(apiUrl);

    fetch(apiUrl, {
        headers: {
          "Content-Type": "application/json"
        }
      }).then(response => response.json())
        .then(data => {
            parent.innerHTML = ''; // Clear previous results
            if (data && data.length > 0) {
                data.forEach(result => {
                    const resultElement = document.createElement('div');
                    resultElement.style.cssText = `
                        padding: 10px;
                        margin-bottom: 5px;
                        border-radius: 5px;
                        background-color: ${window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
                    `;

                    const titleLink = document.createElement('a');
                    titleLink.href = `obsidian://open?vault=${encodeURIComponent(result.vault)}&file=${encodeURIComponent(result.path)}`;
                    titleLink.style.textDecoration = 'none';
                    titleLink.style.color = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000';

                    const titleElement = document.createElement('h3');
                    titleElement.textContent = result.basename;
                    titleElement.style.cssText = `
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 5px;
                        /* Remove default link styling */
                        color: inherit; /* Inherit color from the link */
                    `;
                    titleLink.appendChild(titleElement);

                    const contentElement = document.createElement('p');
                    contentElement.style.cssText = `
                        font-size: 14px;
                        color: ${window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000'};
                    `;
                    contentElement.textContent = result.excerpt ? result.excerpt.replaceAll("<br />", " ").replaceAll("<br>", " ") : 'No content available.';

                    resultElement.appendChild(titleLink);
                    resultElement.appendChild(contentElement);
                    parent.appendChild(resultElement);
                });
            } else {
                const noResultsElement = document.createElement('p');
                noResultsElement.textContent = 'No results found in Obsidian.';
                noResultsElement.style.color = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000';
                parent.appendChild(noResultsElement);
            }
        })
        .catch(error => {
            console.error('Error fetching data from Omnisearch:', error);
            const errorElement = document.createElement('p');
            errorElement.textContent = 'Error fetching search results from Obsidian.';
            errorElement.style.color = 'red';
            parent.appendChild(errorElement);
        });
}

function addSideResults() {
    // Page detection
    let ParentContainer = document.querySelector('#rhs');
    let OnSide = false;
    let OnAPhone = false;

    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
    if (isDarkMode) {
        console.log('Dark mode detected');
    } else {
        console.log('Light mode detected');
    }

    if (ParentContainer === null) {
        console.log("Could not find #rhs. Trying #w7tRq");
        ParentContainer = document.querySelector('#w7tRq');
        OnSide = true;
        const screenWidth = window.innerWidth;
        if (ParentContainer === null || screenWidth < 900) {
            OnSide = false;
            console.log("Could not find #w7tRq, assuming the user in on a phone. Trying #center_col");
            ParentContainer = document.querySelector('#center_col');
            OnAPhone = true;
            if (ParentContainer === null) {
                console.error("Could not find required containers.");
                return;
            }
        }
    }

    //Adding the settings icon
    function createThemeCSS() {
        const themeLink = document.createElement("link");
        themeLink.setAttribute("rel", "stylesheet");
        themeLink.setAttribute("type", "text/css");
        themeLink.setAttribute("href", chrome.runtime.getURL("styles.css"));
        document.head.appendChild(themeLink);
    }

    function createIconsCSS() {
        const iconLink = document.createElement("link");
        iconLink.setAttribute("rel", "stylesheet");
        iconLink.setAttribute("type", "text/css");
        // Add google fonts stylesheet to the head of the document
        iconLink.setAttribute("href", 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=settings');
        document.head.appendChild(iconLink);

        const style = document.createElement("style");
        style.textContent = `
            .material-symbols-outlined {
            font-variation-settings:
                'FILL' 0,
                'wght' 400,
                'GRAD' 0,
                'opsz' 24
            }
        `;
        document.head.appendChild(style);
    }

    createThemeCSS();
    createIconsCSS();

    // Create the new results container
    const sideResultsContainer = document.createElement('div');
    sideResultsContainer.id = 'side_results';
    sideResultsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        padding: 20px;
        margin-top: 10px;
        margin-bottom: 10px;
        margin-right: 10px;
        margin-left: 10px;
        height: fit-content;
        max-height: 500px;
        width: ${OnSide ? 'calc(290px - 60px)' : `calc(100% - 60px)`};
        border-radius: 5px;
        background-color: ${isDarkMode ? '#49377c' : '#9173e5'};
    `;
    
    function setMaxHeight() {
        const footer = document.querySelector('#footcnt');
        if (footer && !OnAPhone) {
            const footerRect = footer.getBoundingClientRect();
            const containerRect = sideResultsContainer.getBoundingClientRect();
            const availableHeight = footerRect.top - containerRect.top - 10;
            console.log(`Available height: ${availableHeight}px, footer top: ${footerRect.top}px, container top: ${containerRect.top}px`);
            sideResultsContainer.style.maxHeight = `${availableHeight}px`;
        } else {
            console.log('No footer found / phone detected');
            sideResultsContainer.style.maxHeight = '500px';
        }
    }
    setTimeout(setMaxHeight, 1000);

    const observer = new MutationObserver(mutationsList => {
        for (let mutation of mutationsList) {
            if (mutation.addedNodes.length) {
                const footer = document.querySelector('#footcnt');
                if (footer) {
                    setMaxHeight();
                    observer.disconnect();
                    return;
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const ResultsContainer = document.createElement('div');
    ResultsContainer.id = 'results';
    ResultsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        height: fit-content;
        max-height: 100%;
        width: 100%;
        border-radius: 5px;
        overflow-y: auto;
    `;

    // Setup the settings
    let SettingsOpen = false;
    let SettingsAnimationRunning = false;

    const SettingsContainer = document.createElement('div');
    SettingsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        padding: 0px;
        margin-bottom: 0px;
        height: 0px;
        width: calc(100% - 20px);
        border-radius: 5px;
        transition: opacity 0.1s ease-in-out, transform 0.2s ease-in-out, margin-bottom 0.2s ease-in-out, padding 0.2s ease-in-out, height 0.2s ease-in-out;
        background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
        opacity: 0;
        overflow: hidden;
    `;


    const SettingsTitle = document.createElement('h2');
    SettingsTitle.textContent = 'Settings';
    SettingsTitle.style.cssText = `
        color: ${isDarkMode ? '#ffffff' : '#000000'};
        font-size: 18px;
        font-weight: bold;
        padding-bottom: 10px;
    `;

    function createInputField(labelText, inputType, savedValue, storageKey) {
        const container = document.createElement('div');
        container.style.marginBottom = '10px';

        const label = document.createElement('label');
        label.textContent = labelText;
        label.style.display = 'block';
        label.style.marginBottom = '5px';
        label.style.color = isDarkMode ? '#ffffff' : '#000000';

        const input = document.createElement('input');
        input.type = inputType;
        input.value = savedValue;
        input.style.padding = '8px';
        input.style.border = '1px solid #ccc';
        input.style.backgroundColor = `${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
        input.style.borderRadius = '3px';
        input.style.width = 'calc(100% - 18px)'

        input.addEventListener('change', (event) => {
            localStorage.setItem(storageKey, event.target.value);
            console.log(`Saved ${storageKey}:`, event.target.value)
        });

        container.appendChild(label);
        container.appendChild(input);
        return container;
    }

    const portField = createInputField('Omnisearch HTTP Server Port', 'number', savedPort, 'OmnisearchPort');

    SettingsContainer.appendChild(SettingsTitle);
    SettingsContainer.appendChild(portField);

    function ToggleSettings() {
        if (SettingsAnimationRunning) return;
        SettingsAnimationRunning = true;
        if (SettingsOpen) {
            SettingsContainer.style.transform = 'scaleY(0)';
            SettingsContainer.style.opacity = '0';
            SettingsContainer.style.marginBottom = '0px';
            SettingsContainer.style.padding = '0px';
            SettingsContainer.style.height = '0px'
            setTimeout(() => {
                SettingsAnimationRunning = false;
                SettingsOpen = false;
            }, 200);
            SearchResults(ResultsContainer);
        } else {
            SettingsContainer.style.height = '246.88px';
            SettingsContainer.style.marginBottom = '20px';
            SettingsContainer.style.padding = '10px';
            SettingsContainer.style.transform = 'scaleY(1)';
            setTimeout(() => {
                SettingsContainer.style.opacity = '1';
            }, 100);
            setTimeout(() => {
                SettingsAnimationRunning = false;
                SettingsOpen = true;
            }, 200);
        }
    }
    sideResultsContainer.appendChild(SettingsContainer);

    // Create the title
    function CreateTitle(parent) {
        const TitleBar = document.createElement('div');
        TitleBar.style.cssText = `
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-direction: row;
            margin-bottom: 10px;
            color: ${isDarkMode ? '#ffffff' : '#000000'};
        `;

        const TitleText = document.createElement('h1');
        TitleText.textContent = 'Obsidian search';
        TitleText.style.cssText = `
            font-size: 20px;
            font-weight: bold;
        `;

        const TitleButton = document.createElement('button');
        TitleButton.innerHTML = '<span class="material-symbols-outlined">settings</span>';
        TitleButton.style.cssText = `
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 20px;
            border: none;
            background-color: transparent;
            color: ${isDarkMode ? '#ffffff' : '#000000'};
            cursor: pointer;
            transition: background-color 0.2s ease-out;
            transition: transform 0.2s ease-out;
            width: 36px;
            height: 36px;
        `;

        let isHovering = false;
        let ClickAnimationRunning = false;


        TitleButton.onmouseover = function () {
            isHovering = true;
            if (ClickAnimationRunning) return;
            this.style.background = 'rgba(255, 255, 255, 0.1)';
            this.style.transform = 'scale(1.1)';
        }
        TitleButton.onmouseout = function () {
            isHovering = false;
            if (ClickAnimationRunning) return;
            this.style.background = 'transparent';
            this.style.transform = 'scale(1)';
        }

        TitleButton.onclick = function () {
            if (ClickAnimationRunning) return;
            this.style.transform = 'scale(0.9)';
            this.style.opacity = '0.5';
            ClickAnimationRunning = true;
            setTimeout(() => {
                this.style.transform = `scale(${isHovering ? '1.1' : '1'})`;
                this.style.background = `${isHovering ? 'rgba(255, 255, 255, 0.1)' : 'transparent'}`;
                this.style.opacity = '1';
                ToggleSettings();
                ClickAnimationRunning = false;
            }, 200);
        }

        TitleBar.appendChild(TitleText);
        TitleBar.appendChild(TitleButton);
        parent.insertBefore(TitleBar, parent.firstChild);
    }
    CreateTitle(sideResultsContainer);

    sideResultsContainer.appendChild(ResultsContainer);
    SearchResults(ResultsContainer);

    // insert new container
    if (OnAPhone) {
        ParentContainer.insertBefore(sideResultsContainer, ParentContainer.firstChild);
    } else {
        ParentContainer.appendChild(sideResultsContainer)
    }
}

addSideResults();
