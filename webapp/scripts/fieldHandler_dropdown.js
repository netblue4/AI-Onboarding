function createDropdown(field, capturedData, sanitizeForId) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.control_number) + "_response";

    // --- Create the Dropdown Select Element First ---
    // It will be appended in the correct position by the logic below.
    const select = document.createElement('select');
    select.id = sanitizedId;
    select.name = sanitizedId;
    const optionsString = field.jkType.split(':')[1]?.trim() || '';
    const options = optionsString.split('/');

    options.forEach(optionText => {
        const option = document.createElement('option');
        const trimmedOption = optionText.trim();
        option.value = trimmedOption;
        option.textContent = trimmedOption;
        select.appendChild(option);
    });
    select.value = capturedData[sanitizedId] || options[0]?.trim();


    // --- CONDITION: Check if a collapsible structure is needed ---
    if (field.FieldQuestionGroup && typeof field.FieldQuestionGroup === 'string') {
        // CASE 1: Build the COLLAPSIBLE structure.

        // 1a. Create the visible header with the question.
        const headerDiv = document.createElement('div');
        headerDiv.className = 'collapsible-header';

        const icon = document.createElement('span');
        icon.className = 'collapse-icon';
        icon.textContent = '▶'; // Icon to indicate collapsible details
        headerDiv.appendChild(icon);

        const questionLabel = document.createElement('label');
        questionLabel.textContent = field.FieldQuestionGroup.trim();
        questionLabel.classList.add('label-bold');
        headerDiv.appendChild(questionLabel);

        fieldDiv.appendChild(headerDiv);

        // 1b. Append the SELECT dropdown to be always visible under the header.
        select.classList.add('dropdown-after-header');
        fieldDiv.appendChild(select);
        
        // 1c. Create the collapsible container for the details.
        const contentDiv = document.createElement('div');
        contentDiv.className = 'collapsible-content collapsed';

        // 1d. Add the detailed labels (FieldLabel, FieldText) INTO the collapsible container.
        const fieldLabel = document.createElement('label');
        fieldLabel.textContent = field.control_number + ' - ' + field.jkName + ' (' + field.requirement_control_number + ')';
        fieldLabel.classList.add('label-bold');
        contentDiv.appendChild(fieldLabel);

        if (field.jkText && typeof field.jkText === 'string') {
            field.jkText.split('||').forEach(lineText => {
                const textLabel = document.createElement('label');
                textLabel.textContent = lineText.trim();
                textLabel.classList.add('multiline-label');
                contentDiv.appendChild(textLabel);
            });
        }
        
        fieldDiv.appendChild(contentDiv);

        // 1e. Add the click listener to the header to control the contentDiv.
        headerDiv.addEventListener('click', () => {
            const isCollapsed = contentDiv.classList.toggle('collapsed');
            icon.textContent = isCollapsed ? '▶' : '▼';
        });

    } else {
        // CASE 2: Build the original FLAT structure (no question group).

        const fieldLabel = document.createElement('label');
        fieldLabel.textContent = field.control_number + ' - ' + field.jkName + ' (' + field.requirement_control_number + ')';
        fieldLabel.setAttribute('for', sanitizedId);
        fieldLabel.classList.add('label-bold');
        fieldDiv.appendChild(fieldLabel);

        if (field.jkText && typeof field.jkText === 'string') {
            field.jkText.split('||').forEach(lineText => {
                const textLabel = document.createElement('label');
                textLabel.textContent = lineText.trim();
                textLabel.classList.add('multiline-label');
                fieldDiv.appendChild(textLabel);
            });
        }
        
        // Add the SELECT dropdown last in the flat structure.
        fieldDiv.appendChild(select);
    }

    return fieldDiv;
}
