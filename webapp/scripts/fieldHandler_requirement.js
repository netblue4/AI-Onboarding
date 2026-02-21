function createRequirement(field, capturedData, sanitizeForId, fieldStoredValue, mindmap) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.requirement_control_number);

    // --- 1. Build the Top-Level Collapsible Header ---
    const headerDiv = document.createElement('div');
    headerDiv.className = 'collapsible-header';

    const icon = document.createElement('span');
    icon.className = 'collapse-icon';
    icon.textContent = '▶'; 
    headerDiv.appendChild(icon);

    const label = document.createElement('label');
    label.textContent = field.jkName;
    label.className = 'label-bold';
    headerDiv.appendChild(label);

    fieldDiv.appendChild(headerDiv);

    // --- 2. Create the Top-Level Collapsible Content ---
    const contentDiv = document.createElement('div');
    contentDiv.className = 'collapsible-content collapsed';

    // Create a wrapper span to keep labels on the same line
    const labelWrapper = document.createElement('span');

    const labelID = document.createElement('strong');
    labelID.textContent = field.requirement_control_number;
    labelWrapper.appendChild(labelID);

    const labelT = document.createElement('label');
    labelT.textContent = '- ' + field.jkText;
    labelT.style.display = 'inline';
    labelWrapper.appendChild(labelT);

    contentDiv.appendChild(labelWrapper);

    // --- 3. Flex Container for Select and Attack Vectors ---
    const actionRow = document.createElement('div');
    actionRow.style.display = 'flex';
    actionRow.style.alignItems = 'center';
    actionRow.style.gap = '20px';
    actionRow.style.marginTop = '10px';

    // Control status dropdown
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

    // Always add select to the action row
    actionRow.appendChild(select);

    // --- 4. Attack Vectors Logic ---
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

    // Declare avContentDiv in outer scope so we can append it after actionRow
    let avContentDiv = null;

    if (attackVectors.length > 0) {
        const avHeaderDiv = document.createElement('div');
        avHeaderDiv.className = 'collapsible-header collapsible-header--nested';

        avHeaderDiv.style.width = 'auto';
        avHeaderDiv.style.margin = '0';
        avHeaderDiv.style.border = 'none';

        const avIcon = document.createElement('span');
        avIcon.className = 'collapse-icon';
        avIcon.textContent = '▶';
        avHeaderDiv.appendChild(avIcon);

        const avHeaderLabel = document.createElement('span');
        avHeaderLabel.textContent = 'Attack Vectors';
        avHeaderLabel.className = 'label-bold';
        avHeaderDiv.appendChild(avHeaderLabel);

        avContentDiv = document.createElement('div');
        avContentDiv.className = 'collapsible-content collapsible-content--nested collapsed';

        const ul = document.createElement('ul');
        attackVectors.forEach(impl => {
            const li = document.createElement('li');
            li.textContent = impl.control_number + ' - ' + impl.jkAttackVector;
            ul.appendChild(li);
        });
        avContentDiv.appendChild(ul);

        avHeaderDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCollapsed = avContentDiv.classList.toggle('collapsed');
            avIcon.textContent = isCollapsed ? '▶' : '▼';
        });

        actionRow.appendChild(avHeaderDiv);
    }

    // Always append actionRow first (select is always inside it)
    contentDiv.appendChild(actionRow);

    // Append avContentDiv after actionRow so it expands downward
    if (avContentDiv) {
        contentDiv.appendChild(avContentDiv);
    }

    fieldDiv.appendChild(contentDiv);

    headerDiv.addEventListener('click', () => {
        const isCollapsed = contentDiv.classList.toggle('collapsed');
        icon.textContent = isCollapsed ? '▶' : '▼';
    });

    return fieldDiv;
}
