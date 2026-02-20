function createRequirement(field, capturedData, sanitizeForId, fieldStoredValue, mindmap) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.requirement_control_number);
    const label = document.createElement('label');
    label.textContent = field.jkName + ' (' + field.requirement_control_number + ')';
    label.classList.add('label-bold');
    fieldDiv.appendChild(label);

    // Control status
    const select = document.createElement('select');
    select.name = sanitizedId + '_jkSoa';

    const options = ['Select', 'Applicable', 'Not Applicable'];

    options.forEach((optionText, index) => {
        const option = document.createElement('option');
        option.value = optionText;
        option.textContent = optionText;

        if (field.jkSoa && optionText === field.jkSoa) {
            option.selected = true;
        }

        select.appendChild(option);
    });
    label.appendChild(select);

    const input = document.createElement('textarea');
    input.id = sanitizedId;
    input.name = sanitizedId;
    input.value = field.jkText;
    fieldDiv.appendChild(input);

    // --- Attack Vectors Collapsible ---
    // Find the implementations Set by searching all article keys for the matching requirement
    let implementations = null;
    if (mindmap) {
        for (const [articleKey, articleValue] of mindmap) {
            if (articleValue.requirements && articleValue.requirements.has(field.requirement_control_number)) {
                implementations = articleValue.requirements.get(field.requirement_control_number).implementations;
                break;
            }
        }
    }

    // Only render the collapsible if there are implementations with attack vectors
    const attackVectors = implementations
        ? [...implementations].filter(impl => impl.jkAttackVector)
        : [];

    if (attackVectors.length > 0) {
        // Collapsible header
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

        // Collapsible content
        const avContentDiv = document.createElement('div');
        avContentDiv.className = 'collapsible-content collapsible-content--nested collapsed';

        // Bullet list of jkAttackVector entries
        const ul = document.createElement('ul');
        ul.className = 'attack-vector-list';

        attackVectors.forEach(impl => {
            const li = document.createElement('li');
            li.className = 'attack-vector-item';

            // Control number as a bold prefix if available
            if (impl.control_number) {
                const controlRef = document.createElement('strong');
                controlRef.textContent = impl.control_number + ' — ';
                li.appendChild(controlRef);
            }

            const vectorText = document.createTextNode(impl.jkAttackVector);
            li.appendChild(vectorText);
            ul.appendChild(li);
        });

        avContentDiv.appendChild(ul);

        // Toggle listener
        avHeaderDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCollapsed = avContentDiv.classList.toggle('collapsed');
            avIcon.textContent = isCollapsed ? '▶' : '▼';
        });

        fieldDiv.appendChild(avHeaderDiv);
        fieldDiv.appendChild(avContentDiv);
    }

    return fieldDiv;
}