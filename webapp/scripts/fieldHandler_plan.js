function createPlan(field, capturedData, sanitizeForId, fieldStoredValue, mindmap) {
    // Main container for the entire field
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    // --- Build the Collapsible Structure ---
    const headerDiv = document.createElement('div');
    headerDiv.className = 'collapsible-header';

    const icon = document.createElement('span');
    icon.className = 'collapse-icon';
    icon.textContent = '▶';
    headerDiv.appendChild(icon);

    const planFieldNameLabel = document.createElement('label');
    planFieldNameLabel.textContent = field.jkName.trim() + ' (' + field.requirement_control_number + ')';
    planFieldNameLabel.className = 'label-bold';
    headerDiv.appendChild(planFieldNameLabel);

    fieldDiv.appendChild(headerDiv);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'collapsible-content collapsed';

    // --- Build Set of valid control numbers from mindmap ---
    const mindmapControlNumbers = new Set();
    if (mindmap) {
        mindmap.forEach(groups => groups.forEach(gData =>
            gData.requirements.forEach(reqEntry => {
                // --- Only include controls from applicable requirements ---
                if (fieldStoredValue(reqEntry.requirement, true) !== 'Applicable') return;
                reqEntry.implementations.forEach(impl =>
                    mindmapControlNumbers.add(impl.control_number)
                );
            })
        ));
    }

    function renderTestCriteriaMetadata(metadata) {
        if (!metadata) return null;

        const container = document.createElement('div');
        container.className = 'metadata-container p-4 bg-gray-50 border border-gray-200 rounded-lg mb-6';
        
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

        addTerm('Purpose', metadata.Purpose);
        const metricName = metadata.PrimaryMetric?.Name || 'N/A';
        const threshold = metadata.PassCriteria?.Threshold || 'N/A';
        addTerm('Metric / Threshold', `${metricName} (Goal: ${threshold})`);
        addTerm('Definition', metadata.PrimaryMetric?.Definition);
        addTerm('Calculation Detail', metadata.PrimaryMetric?.CalculationDetail);

        return container;
    }

    if (field.TestDatasetMetadata) {
        // commented out sections preserved as-is
    }

    function createGoldenDatasetTable(goldenDatasetArray) {
        if (!goldenDatasetArray || goldenDatasetArray.length === 0) return null;

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginBottom = '20px';
        table.style.fontSize = '12px';

        const headers = Object.keys(goldenDatasetArray[0]);

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.style.backgroundColor = '#e0e0e0';
        headerRow.style.fontWeight = 'bold';

        headers.forEach(key => {
            const th = document.createElement('th');
            th.textContent = key.replace(/_/g, ' ');
            th.style.border = '1px solid #ccc';
            th.style.padding = '8px';
            th.style.textAlign = 'left';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        goldenDatasetArray.forEach((item, index) => {
            const row = document.createElement('tr');
            row.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f9f9f9';
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

    if (field.TestDataset && Array.isArray(field.TestDataset)) {
        const goldenDatasetLabel = document.createElement('label');
        goldenDatasetLabel.textContent = "Golden Datasets";
        goldenDatasetLabel.className = 'label-bold';
        contentDiv.appendChild(goldenDatasetLabel);

        const separator = document.createElement('hr');
        separator.className = 'control-separator';
        contentDiv.appendChild(separator);

        const goldenDatasetDiv = document.createElement('div');
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

    // --- Plan Criteria ---
    const planControliaLabel = document.createElement('label');
    planControliaLabel.textContent = "Criteria";
    planControliaLabel.className = 'label-bold';
    contentDiv.appendChild(planControliaLabel);

    const separator = document.createElement('hr');
    separator.className = 'control-separator';
    contentDiv.appendChild(separator);

    const controlDiv = document.createElement('div');

    if (field.controls && Array.isArray(field.controls)) {
        field.controls.forEach(controlItem => {

            // --- Only display controls that appear in the mindmap ---
            if (!mindmapControlNumbers.has(controlItem.control_number)) return;

            const sanitizedId = sanitizeForId(controlItem.control_number);
            const controlContainer = document.createElement('div');

            const controlText = document.createElement('p');
            controlText.textContent = controlItem.control_number + " - " + controlItem.jkText;
            controlContainer.appendChild(controlText);

            // --- Evidence field: link if Jira URL, otherwise textarea ---
            const evidenceValue = fieldStoredValue(controlItem);

            if (evidenceValue && evidenceValue.startsWith('http')) {
                // --- Render as Jira link ---
                const linkWrapper = document.createElement('div');
                linkWrapper.style.marginTop = '10px';

                const jiraLink = document.createElement('a');
                jiraLink.href = evidenceValue;
                jiraLink.target = '_blank';
                jiraLink.textContent = '🎫 View Jira Ticket';
                jiraLink.style.cssText = `
                    color: #b8963e;
                    font-size: 13px;
                    text-decoration: none;
                    font-weight: 600;
                `;
                jiraLink.addEventListener('mouseover', () => jiraLink.style.textDecoration = 'underline');
                jiraLink.addEventListener('mouseout',  () => jiraLink.style.textDecoration = 'none');

                linkWrapper.appendChild(jiraLink);
                controlContainer.appendChild(linkWrapper);

            } else {
                // --- Render as textarea ---
                const input = document.createElement('textarea');
                input.name = sanitizedId + '_jkImplementationEvidence';
                input.placeholder = controlItem.jkImplementationEvidence || 'Enter implementation evidence...';
                if (evidenceValue) input.value = evidenceValue;
                controlText.appendChild(input);
            }

            controlDiv.appendChild(controlContainer);
        });
    }
    contentDiv.appendChild(controlDiv);

    // --- Plan Steps ---
    const planStepsLabel = document.createElement('label');
    planStepsLabel.textContent = "Steps";
    planStepsLabel.className = 'label-bold';
    contentDiv.appendChild(planStepsLabel);

    const separatorStep = document.createElement('hr');
    separatorStep.className = 'control-separator';
    contentDiv.appendChild(separatorStep);

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

    headerDiv.addEventListener('click', () => {
        const isCollapsed = contentDiv.classList.toggle('collapsed');
        icon.textContent = isCollapsed ? '▶' : '▼';
    });

    return fieldDiv;
}