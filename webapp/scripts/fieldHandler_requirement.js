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

    // Step 1: Store the key we are looking for
    const requirementKey = field.requirement_control_number;

    // Step 2: Traverse mindmap -> groups -> gData.requirements
    // and find the reqEntry whose reqKey matches requirementKey
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

    // Step 3: Iterate the implementations Set and collect every object that has jkAttackVector
    const attackVectors = [];
    if (matchedRequirement && matchedRequirement.implementations) {
        for (const impl of matchedRequirement.implementations) {
            if (impl.jkAttackVector) {
                attackVectors.push(impl);
            }
        }
    }

    // Step 4: Only render the collapsible if at least one attack vector was found
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

        // Collapsible content — collapsed by default
        const avContentDiv = document.createElement('div');
        avContentDiv.className = 'collapsible-content collapsible-content--nested collapsed';

        // Bullet list — one <li> per implementation object that carries a jkAttackVector
        const ul = document.createElement('ul');
        ul.className = 'attack-vector-list';

        attackVectors.forEach(impl => {
            const li = document.createElement('li');
            li.className = 'attack-vector-item';

            // Bold control number prefix so the engineer can cross-reference the control
            if (impl.control_number) {
                const controlRef = document.createElement('strong');
                controlRef.textContent = impl.control_number + ' — ';
                li.appendChild(controlRef);
            }

            li.appendChild(document.createTextNode(impl.jkAttackVector));
            ul.appendChild(li);
        });

        avContentDiv.appendChild(ul);

        // Toggle — stopPropagation prevents bubbling to any outer collapsible header
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