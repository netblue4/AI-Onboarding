function createOptionBox(field, capturedData, sanitizeForId) {
    // Destructure properties from the field object for cleaner access
    const { FieldName, FieldType, FieldLabel, FieldText, FieldQuestionGroup } = field;

    // --- 1. Basic Setup ---
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    const sanitizedId = sanitizeForId(FieldName);
    const selectedValue = capturedData[FieldName] ?? null;

    // --- 2. Create the Radio Button Group ---
    const radioGroupContainer = document.createElement('div');
    radioGroupContainer.className = 'radio-group-container';

    // Extract options from the FieldType string (e.g., "Decision:Yes/No")
    const options = (FieldType.split(':')[1] || '').split('/');

    options.forEach((optionText, index) => {
        const trimmedOption = optionText.trim();
        if (!trimmedOption) return; // Skip if the option is empty

        const optionId = `${sanitizedId}-${index}`; // Create a unique ID for each radio

        // Create the radio input element
        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.name = sanitizedId; // All radios in a group share the same name
        radioInput.value = trimmedOption;
        radioInput.id = optionId;      // *** FIX: Assign the unique ID to the input ***
        radioInput.required = true;    // Make selection mandatory

        // Pre-check the button if its value matches captured data
        if (trimmedOption === String(selectedValue).trim()) {
            radioInput.checked = true;
        }

        // Create the label for the radio button
        const radioLabel = document.createElement('label');
        radioLabel.htmlFor = optionId; // Link label to the input by its unique ID
        radioLabel.textContent = trimmedOption;

        // Wrap input and label in a div for styling
        const wrapper = document.createElement('div');
        wrapper.className = 'radio-option';
        wrapper.appendChild(radioInput);
        wrapper.appendChild(radioLabel);
        radioGroupContainer.appendChild(wrapper);
    });

    // --- 3. Build the Field Structure (Collapsible or Flat) ---
    if (FieldQuestionGroup) {
        // CASE: Collapsible Structure
        const headerDiv = document.createElement('div');
        headerDiv.className = 'collapsible-header';

        const icon = document.createElement('span');
        icon.className = 'collapse-icon';
        icon.textContent = '▶';

        const questionLabel = document.createElement('label');
        questionLabel.textContent = FieldQuestionGroup.trim();
        questionLabel.className = 'label-bold';
        
        headerDiv.append(icon, questionLabel); // Use append for multiple elements
        fieldDiv.appendChild(headerDiv);

        // Place radio buttons directly under the header, always visible
        radioGroupContainer.classList.add('options-after-header');
        fieldDiv.appendChild(radioGroupContainer);

        // Create the container for content that will collapse
        const contentDiv = document.createElement('div');
        contentDiv.className = 'collapsible-content collapsed';

        // Add detailed labels to the collapsible area
        const detailLabel = document.createElement('label');
        detailLabel.textContent = FieldLabel;
        detailLabel.className = 'label-bold';
        contentDiv.appendChild(detailLabel);

        if (FieldText) {
            FieldText.split('||').forEach(line => {
                const textNode = document.createElement('label');
                textNode.textContent = line.trim();
                textNode.className = 'multiline-label';
                contentDiv.appendChild(textNode);
            });
        }
        
        fieldDiv.appendChild(contentDiv);

        // Add click event to toggle visibility
        headerDiv.addEventListener('click', () => {
            const isCollapsed = contentDiv.classList.toggle('collapsed');
            icon.textContent = isCollapsed ? '▶' : '▼';
        });

    } else {
        // CASE: Standard Flat Structure
        const mainLabel = document.createElement('label');
        mainLabel.textContent = FieldLabel;
        mainLabel.className = 'label-bold';
        fieldDiv.appendChild(mainLabel);

        if (FieldText) {
            FieldText.split('||').forEach(line => {
                const textNode = document.createElement('label');
                textNode.textContent = line.trim();
                textNode.className = 'multiline-label';
                fieldDiv.appendChild(textNode);
            });
        }
        
        // Add the radio buttons at the end
        fieldDiv.appendChild(radioGroupContainer);
    }

    return fieldDiv;
}
