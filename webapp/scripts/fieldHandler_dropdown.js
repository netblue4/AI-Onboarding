function createDropdown(field, capturedData, sanitizeForId) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.FieldName);

    // --- 1. Create the Collapsible Header (Always Visible) ---
    const headerDiv = document.createElement('div');
    headerDiv.className = 'collapsible-header';

    const icon = document.createElement('span');
    icon.className = 'collapse-icon';
    icon.textContent = '▶'; // Use '▶' for collapsed and '▼' for expanded
    headerDiv.appendChild(icon);

    if (field.FieldQuestionGroup) {
        const questionLabel = document.createElement('label');
        questionLabel.textContent = field.FieldQuestionGroup.trim();
        questionLabel.classList.add('label-bold');
        headerDiv.appendChild(questionLabel);
    }
    fieldDiv.appendChild(headerDiv);


    // --- 2. Create the Collapsible Content Wrapper ---
    // It starts with the 'collapsed' class to be hidden by default.
    const contentDiv = document.createElement('div');
    contentDiv.className = 'collapsible-content collapsed';


    // --- 3. Add All Form Content into the Wrapper ---
    // FieldLabel
    const fieldLabel = document.createElement('label');
    fieldLabel.textContent = field.FieldLabel;
    fieldLabel.setAttribute('for', sanitizedId);
    fieldLabel.classList.add('label-bold');
    contentDiv.appendChild(fieldLabel);

    // Multiline FieldText
    if (field.FieldText && typeof field.FieldText === 'string') {
        field.FieldText.split('||').forEach(lineText => {
            const textLabel = document.createElement('label');
            textLabel.textContent = lineText.trim();
            textLabel.classList.add('multiline-label');
            contentDiv.appendChild(textLabel);
        });
    }

    // Dropdown Select Element
    const select = document.createElement('select');
    select.id = sanitizedId;
    select.name = sanitizedId;
    const optionsString = field.FieldType.split(':')[1]?.trim() || '';
    const options = optionsString.split('/');

    options.forEach(optionText => {
        const option = document.createElement('option');
        const trimmedOption = optionText.trim();
        option.value = trimmedOption;
        option.textContent = trimmedOption;
        select.appendChild(option);
    });
    select.value = capturedData[field.FieldName] || options[0]?.trim();
    contentDiv.appendChild(select);

    // Add the content wrapper to the main div
    fieldDiv.appendChild(contentDiv);


    // --- 4. Add Click Event Listener to Toggle Content ---
    headerDiv.addEventListener('click', () => {
        const isCollapsed = contentDiv.classList.toggle('collapsed');
        icon.textContent = isCollapsed ? '▶' : '▼'; // Update the icon based on state
    });

    return fieldDiv;
}
