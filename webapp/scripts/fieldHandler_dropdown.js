function createDropdown(field, capturedData, sanitizeForId) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.FieldName);

    // This variable will hold the container for the main form elements.
    // Its value is determined by the conditional logic below.
    let contentContainer;

    // --- CONDITION: Only create a collapsible structure if FieldQuestionGroup exists. ---
    if (field.FieldQuestionGroup && typeof field.FieldQuestionGroup === 'string') {
        // CASE 1: Create the collapsible structure.
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

        const contentDiv = document.createElement('div');
        contentDiv.className = 'collapsible-content collapsed';
        fieldDiv.appendChild(contentDiv);

        // Add the event listener to the header to toggle the content's visibility.
        headerDiv.addEventListener('click', () => {
            const isCollapsed = contentDiv.classList.toggle('collapsed');
            icon.textContent = isCollapsed ? '▶' : '▼';
        });

        // Set the new collapsible div as the container for the form elements.
        contentContainer = contentDiv;

    } else {
        // CASE 2: Fallback to the original, non-collapsible behavior.
        // The main 'fieldDiv' will hold all elements directly.
        contentContainer = fieldDiv;
    }

    // --- COMMON LOGIC: Create and append form elements to the correct container. ---

    // FieldLabel (The main title for the field)
    const fieldLabel = document.createElement('label');
    fieldLabel.textContent = field.FieldLabel;
    fieldLabel.setAttribute('for', sanitizedId);
    fieldLabel.classList.add('label-bold');
    contentContainer.appendChild(fieldLabel);

    // Multiline FieldText
    if (field.FieldText && typeof field.FieldText === 'string') {
        field.FieldText.split('||').forEach(lineText => {
            const textLabel = document.createElement('label');
            textLabel.textContent = lineText.trim();
            textLabel.classList.add('multiline-label');
            contentContainer.appendChild(textLabel);
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
    contentContainer.appendChild(select);

    return fieldDiv;
}
