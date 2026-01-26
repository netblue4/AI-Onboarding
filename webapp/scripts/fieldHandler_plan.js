/**
 * Creates an HTML form field for a high-risk AI system requirement based on the AI Act JSON structure.
 * This function generates a collapsible section for each risk, containing a primary question,
 * a set of controls with their objectives, and radio buttons for user input.
 *
 * @param {object} field - The field object from the JSON data, representing a single risk area.
 * @param {object} capturedData - An object containing previously saved data to pre-fill the form.
 * @param {function} sanitizeForId - A utility function to create a safe string for use as an HTML ID.
 * @returns {HTMLElement} The fully constructed div element for the form field.
 */
function createPlan(field, capturedData, sanitizeForId) {
    // Main container for the entire field
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    // --- 2. Build the Collapsible Structure ---

    // Header for the collapsible section
    const headerDiv = document.createElement('div');
    headerDiv.className = 'collapsible-header';

    const icon = document.createElement('span');
    icon.className = 'collapse-icon';
    icon.textContent = '▶'; // Start in collapsed state
    headerDiv.appendChild(icon);

    const planFieldNameLabel = document.createElement('label');
    planFieldNameLabel.textContent = field.FieldName.trim() + ' - ' + field.requirement_control_number; // The main risk title
    planFieldNameLabel.className = 'label-bold';
    headerDiv.appendChild(planFieldNameLabel);

    fieldDiv.appendChild(headerDiv);


    // Create the collapsible container for the detailed information
    const contentDiv = document.createElement('div');
    contentDiv.className = 'collapsible-content collapsed';

    /**
     * Renders the standardized Test Criteria Metadata in a descriptive list format.
     * @param {Object} metadata - The standardized TestCriteriaMetadata object.
     * @returns {HTMLElement} A div containing the formatted metadata.
     */
    function renderTestCriteriaMetadata(metadata) {
        if (!metadata) return null;

        const container = document.createElement('div');
        container.className = 'metadata-container p-4 bg-gray-50 border border-gray-200 rounded-lg mb-6';
        
        // Title (Test Category)
        const title = document.createElement('h3');
        title.textContent = `${metadata.TestCategory || 'Test Plan Details'} (ID: ${metadata.ControlID || 'N/A'})`;
        title.className = 'text-base font-semibold text-indigo-700 mb-3';
        container.appendChild(title);

        const dl = document.createElement('dl');
        dl.className = 'grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm';
        container.appendChild(dl);

        const addTerm = (term, definition) => {
            if (!definition) return;
            const dt = document.createElement('dt');
            dt.textContent = term;
            dt.className = 'font-medium text-gray-700 col-span-1 border-b border-gray-100 pb-1';
            
            const dd = document.createElement('dd');
            dd.textContent = definition;
            dd.className = 'text-gray-900 col-span-1 border-b border-gray-100 pb-1';
            
            dl.appendChild(dt);
            dl.appendChild(dd);
        };

        // 1. Purpose
        addTerm('Purpose', metadata.Purpose);

        // 2. Metric Name & Threshold (combined for easy comparison)
        const metricName = metadata.PrimaryMetric?.Name || 'N/A';
        const threshold = metadata.PassCriteria?.Threshold || 'N/A';
        addTerm('Metric / Threshold', `${metricName} (Goal: ${threshold})`);

        // 3. Metric Definition
        addTerm('Definition', metadata.PrimaryMetric?.Definition);

        // 4. Calculation Detail
        addTerm('Calculation Detail', metadata.PrimaryMetric?.CalculationDetail);

        return container;
    }

    // --- Render Test Criteria Metadata (New Logic) ---
    if (field.TestDatasetMetadata) {
        // Add the Metadata label
        const metadataLabel = document.createElement('label');
        metadataLabel.textContent = "Test Criteria Metadata";
        metadataLabel.className = 'label-bold';
        contentDiv.appendChild(metadataLabel);

        // Add separator
        const separator = document.createElement('hr');
        separator.className = 'control-separator';
        contentDiv.appendChild(separator);

        // Render the metadata
        const metadataElement = renderTestCriteriaMetadata(field.TestDatasetMetadata);
        if (metadataElement) {
            contentDiv.appendChild(metadataElement);
        }
    }


    /**
     * Golden Dataset Table Renderer.
     * Creates a table element with dynamic headers and rows based on the array of objects.
     * @param {Array<Object>} goldenDatasetArray - The array of GoldenDataset objects (the `field.GoldenDataset` node).
     * @returns {HTMLElement} The constructed table element.
     */
    function createGoldenDatasetTable(goldenDatasetArray) {
        if (!goldenDatasetArray || goldenDatasetArray.length === 0) return null;

        const table = document.createElement('table');
        // Basic inline styles for table appearance
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginBottom = '20px';
        table.style.fontSize = '12px';

        // 1. Get Headers from the first object
        const headers = Object.keys(goldenDatasetArray[0]);

        // 2. Create Table Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.style.backgroundColor = '#e0e0e0';
        headerRow.style.fontWeight = 'bold';

        headers.forEach(key => {
            const th = document.createElement('th');
            th.textContent = key.replace(/_/g, ' '); // Improve readability of column names
            th.style.border = '1px solid #ccc';
            th.style.padding = '8px';
            th.style.textAlign = 'left';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // 3. Create Table Body
        const tbody = document.createElement('tbody');
        goldenDatasetArray.forEach((item, index) => {
            const row = document.createElement('tr');
            row.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f9f9f9'; // Zebra striping

            headers.forEach(key => {
                const td = document.createElement('td');
                td.textContent = item[key] || '';
                td.style.border = '1px solid #ccc';
                td.style.padding = '8px';
                td.style.verticalAlign = 'top';
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        return table;
    }

    // --- Render Golden Dataset if data is present (Previous Feature) ---
    if (field.TestDataset && Array.isArray(field.TestDataset)) {
        // Add the Golden Dataset label
        const goldenDatasetLabel = document.createElement('label');
        goldenDatasetLabel.textContent = "Golden Datasets";
        goldenDatasetLabel.className = 'label-bold';
        contentDiv.appendChild(goldenDatasetLabel);
        
        // Add separator
        const separator = document.createElement('hr');
        separator.className = 'control-separator';
        contentDiv.appendChild(separator);

        // Crreate the Golden Dataset div and append the table
        const goldenDatasetDiv = document.createElement('div');
        // NOTE: The function is now called with field.TestDataset directly
        const table = createGoldenDatasetTable(field.TestDataset); 
        if (table) {
            goldenDatasetDiv.appendChild(table);
        } else {
            const p = document.createElement('p');
            p.textContent = 'No Golden Dataset items to display.';
            goldenDatasetDiv.appendChild(p);
        }
        contentDiv.appendChild(goldenDatasetDiv);
    }
    

 /**
 * Plan Criteria.
 */

    // Add the criteria label  inside the collapsible area
    const planCriteriaLabel = document.createElement('label');
    planCriteriaLabel.textContent = "Criteria";
    planCriteriaLabel.className = 'label-bold';
    contentDiv.appendChild(planCriteriaLabel);
    
    // Add separator
    const separator = document.createElement('hr');
    separator.className = 'control-separator';
    contentDiv.appendChild(separator);


    // Crreate the criteria  div
    const criteriaDiv = document.createElement('div');  


    if (field.PlanCriteria && Array.isArray(field.PlanCriteria)) {
        field.PlanCriteria.forEach(criteriaItem => {
            const criteriaContainer = document.createElement('div');

            const criteriaText = document.createElement('p');
            criteriaText.textContent = criteriaItem.criteria;
            criteriaContainer.appendChild(criteriaText);
            
            const input = document.createElement('textarea');
    		input.placeholder = criteriaItem.criteria_evidence;
    		criteriaText.appendChild(input);
 
            criteriaDiv.appendChild(criteriaContainer);
        });
    }
    contentDiv.appendChild(criteriaDiv);

    

 /**
 * Plan steps.
 */

    // Add the criteria label  inside the collapsible area
    const planStepsLabel = document.createElement('label');
    planStepsLabel.textContent = "Steps";
    planStepsLabel.className = 'label-bold';
    contentDiv.appendChild(planStepsLabel);

    // Add separator
    const separatorStep = document.createElement('hr');
    separatorStep.className = 'control-separator';
    contentDiv.appendChild(separatorStep);


    // Crreate the criteria  div
    const planStepsDiv = document.createElement('div');  


    if (field.PlanSteps && Array.isArray(field.PlanSteps)) {
        field.PlanSteps.forEach(stepItem => {
            const stepContainer = document.createElement('div');

            const stepText = document.createElement('p');
            stepText.textContent = stepItem.step;
            stepContainer.appendChild(stepText);
 
            planStepsDiv.appendChild(stepContainer);
        });
    }
    contentDiv.appendChild(planStepsDiv);


    
    fieldDiv.appendChild(contentDiv);

    // Add the click listener to the header to toggle the content visibility
    headerDiv.addEventListener('click', () => {
        const isCollapsed = contentDiv.classList.toggle('collapsed');
        icon.textContent = isCollapsed ? '▶' : '▼';
    });

    return fieldDiv;
}
