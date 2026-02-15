function createOptionBox(field, capturedData, sanitizeForId) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.control_number);

    // --- 1. Create the Radio Button Group First ---
    // We'll create them in a container and append the whole container later.
    const radioGroupContainer = document.createElement('div');
    radioGroupContainer.className = 'radio-group-container';

    const optionsString = field.jkType.split(':')[1]?.trim() || '';
    const options = optionsString.split('/');
    const selectedValue = capturedData[sanitizedId] ?? null;

    options.forEach((optionText, index) => {
        const trimmedOption = optionText.trim();
        const optionId = `${sanitizedId}-${index}`; // Unique ID for each option

        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.id = sanitizedId; //optionId; // Correctly assign the unique ID
        radioInput.name = sanitizedId; // Group buttons with the same name
        radioInput.value = trimmedOption;
        radioInput.required = true;
        
        if (trimmedOption === String(selectedValue).trim()) {
            radioInput.checked = true;
        }

        const radioLabel = document.createElement('label');
        radioLabel.setAttribute('for', optionId);
        radioLabel.textContent = trimmedOption;
        
        const wrapper = document.createElement('div');
        wrapper.classList.add('radio-option');
        wrapper.appendChild(radioInput);
        wrapper.appendChild(radioLabel);
        radioGroupContainer.appendChild(wrapper);
    });
    
    // --- 2. Check if a collapsible structure is needed ---
    if (field.FieldQuestionGroup && typeof field.FieldQuestionGroup === 'string') {
        // CASE 1: Build the COLLAPSIBLE structure.

        const headerDiv = document.createElement('div');
        headerDiv.className = 'collapsible-header';

        const icon = document.createElement('span');
        icon.className = 'collapse-icon';
        icon.textContent = '▶';
        headerDiv.appendChild(icon);

        const questionLabel = document.createElement('label');
        questionLabel.textContent = field.FieldQuestionGroup.trim();
        questionLabel.classList.add('label-bold');
        headerDiv.appendChild(questionLabel);

        fieldDiv.appendChild(headerDiv);

        // Append the Radio Button group to be always visible under the header.
        radioGroupContainer.classList.add('options-after-header');
        fieldDiv.appendChild(radioGroupContainer);
        
        // Create the collapsible container for the details.
        const contentDiv = document.createElement('div');
        contentDiv.className = 'collapsible-content collapsed';

        // Add the detailed labels INTO the collapsible container.
        const fieldLabel = document.createElement('label');
        fieldLabel.textContent = field.jkName + ' - ' + field.requirement_control_number;
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

        // Add the click listener to the header.
        headerDiv.addEventListener('click', () => {
            const isCollapsed = contentDiv.classList.toggle('collapsed');
            icon.textContent = isCollapsed ? '▶' : '▼';
        });

    } else {
        // CASE 2: Build the original FLAT structure.

        const fieldLabel = document.createElement('label');
        fieldLabel.textContent = field.control_number + ' - ' + field.jkName + ' (' + field.requirement_control_number + ')';
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
        
        // Add the radio button group last.
        fieldDiv.appendChild(radioGroupContainer);
    }

    return fieldDiv;
}
