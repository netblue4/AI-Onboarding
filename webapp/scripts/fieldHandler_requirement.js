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
    // strong is inline, so it will stay next to the labelT
    labelWrapper.appendChild(labelID);
    
    const labelT = document.createElement('label');
    labelT.textContent = ' - ' + field.jkText;
    
    /* Note: Since your CSS defines .form-field label as 'display: block', 
       we override it inline just for this instance so it stays next to the ID.
    */
    labelT.style.display = 'inline'; 
    labelWrapper.appendChild(labelT);

    fieldDiv.appendChild(labelWrapper);
    

    // --- NEW: Flex Container for Select and Attack Vectors ---
    const actionRow = document.createElement('div');
    actionRow.style.display = 'flex';
    actionRow.style.alignItems = 'center';
    actionRow.style.gap = '20px'; // Space between dropdown and the collapsible header
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
    
    // Add dropdown to the row
    actionRow.appendChild(select);

    // --- 3. Attack Vectors Logic ---
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
        
        // Inline override: Remove the default 100% width and margins to keep it inline
        avHeaderDiv.style.width = 'auto';
        avHeaderDiv.style.margin = '0';
        avHeaderDiv.style.border = 'none'; // Keeps the row clean

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

        avHeaderDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCollapsed = avContentDiv.classList.toggle('collapsed');
            avIcon.textContent = isCollapsed ? '▶' : '▼';
        });

        // Add the collapsible header to the flex row
        actionRow.appendChild(avHeaderDiv);
        
        // Add the row to the content
        contentDiv.appendChild(actionRow);
        
        // The expanded list still goes below the row for readability
        contentDiv.appendChild(avContentDiv);
    } else {
        // If no attack vectors, just add the select to the content
        contentDiv.appendChild(select);
    }

    fieldDiv.appendChild(contentDiv);

    headerDiv.addEventListener('click', () => {
        const isCollapsed = contentDiv.classList.toggle('collapsed');
        icon.textContent = isCollapsed ? '▶' : '▼';
    });

    return fieldDiv;
}