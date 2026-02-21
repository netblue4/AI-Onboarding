/**
 * Creates an HTML form field for a requirement.
 * Refactored to match the collapsible structure of fieldHandler_risk.js.
 */
function createRequirement(field, capturedData, sanitizeForId, fieldStoredValue, mindmap) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.requirement_control_number);

    // --- 1. Build the Top-Level Collapsible Header ---
    const headerDiv = document.createElement('div');
    headerDiv.className = 'collapsible-header';

    const icon = document.createElement('span');
    icon.className = 'collapse-icon';
    icon.textContent = '▶'; // Start collapsed
    headerDiv.appendChild(icon);

    const label = document.createElement('label');
    label.textContent = field.jkName;
    label.className = 'label-bold';
    headerDiv.appendChild(label);

    fieldDiv.appendChild(headerDiv);

    // --- 2. Create the Top-Level Collapsible Content ---
    const contentDiv = document.createElement('div');
    contentDiv.className = 'collapsible-content collapsed';

    // Requirement Control Number and Text
    const controlText = document.createElement('p');
    controlText.id = sanitizedId;
    controlText.name = sanitizedId;
    controlText.textContent = field.requirement_control_number + ' - ' + field.jkText;
    contentDiv.appendChild(controlText);

    // Control status dropdown
    const selectAttckwrapper = document.createElement('span');
    contentDiv.appendChild(selectAttckwrapper);
    
    const select = document.createElement('select');
    select.name = sanitizedId + '_jkSoa';
    const options = ['Select', 'Applicable', 'Not Applicable'];
    options.forEach((optionText) => {
        const option = document.createElement('option');
        option.value = optionText;
        option.textContent = optionText;

        if (field.jkSoa && optionText === field.jkSoa) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    selectAttckwrapper.appendChild(select);

    // --- 3. Attack Vectors Logic (Nested Collapsible) ---
    const requirementKey = field.requirement_control_number;
    let matchedRequirement = null;

    mindmap.forEach((groups, stepName) => {
        groups.forEach((gData, groupName) => {
            gData.requirements.forEach((reqEntry, reqKey) => {
                if (reqKey === requirementKey) {
                    matchedRequirement = reqEntry;
                }
            });
        });
    });

    const attackVectors = [];
    if (matchedRequirement && matchedRequirement.implementations) {
        for (const impl of matchedRequirement.implementations) {
            if (impl.jkAttackVector) {
                attackVectors.push(impl);
            }
        }
    }

    if (attackVectors.length > 0) {
        const avHeaderDiv = document.createElement('div');
        avHeaderDiv.className = 'collapsible-header collapsible-header--nested';

        const avIcon = document.createElement('span');
        avIcon.className = 'collapse-icon';
        avIcon.textContent = '▶';
        avHeaderDiv.appendChild(avIcon);

        const avHeaderLabel = document.createElement('span');
        avHeaderLabel.textContent = 'Attack Vectors';
        avHeaderLabel.className = 'label-bold';
        avHeaderDiv.appendChild(avHeaderLabel);

        const avContentDiv = document.createElement('div');
        avContentDiv.className = 'collapsible-content collapsible-content--nested collapsed';

        const ul = document.createElement('ul');
        attackVectors.forEach(impl => {
            const li = document.createElement('li');
            li.textContent = impl.control_number + ' - ' + impl.jkAttackVector;
            ul.appendChild(li);
        });
        avContentDiv.appendChild(ul);

        // Toggle Nested Listener
        avHeaderDiv.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents parent from closing when clicking this
            const isCollapsed = avContentDiv.classList.toggle('collapsed');
            avIcon.textContent = isCollapsed ? '▶' : '▼';
        });

        selectAttckwrapper.appendChild(avHeaderDiv);
        selectAttckwrapper.appendChild(avContentDiv);
    }

    fieldDiv.appendChild(contentDiv);

    // --- 4. Toggle Listener for the Outer Requirement Header ---
    headerDiv.addEventListener('click', () => {
        const isCollapsed = contentDiv.classList.toggle('collapsed');
        icon.textContent = isCollapsed ? '▶' : '▼';
    });

    return fieldDiv;
}