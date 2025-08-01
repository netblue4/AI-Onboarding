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

    const options = (FieldType.split(':')[1] || '').split('/');

    options.forEach((optionText, index) => {
        const trimmedOption = optionText.trim();
        if (!trimmedOption) return;

        const optionId = `${sanitizedId}-${index}`;

        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.name = sanitizedId;
        radioInput.value = trimmedOption;
        radioInput.id = sanitizedId;
        radioInput.required = true; // This handles the validation logic

        if (trimmedOption === String(selectedValue).trim()) {
            radioInput.checked = true;
        }

        const radioLabel = document.createElement('label');
        radioLabel.htmlFor = optionId;
        radioLabel.textContent = trimmedOption;

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
        questionLabel.classList.add('required-label'); // *** ADD THIS CLASS FOR CSS ***

        headerDiv.append(icon, questionLabel);
        fieldDiv.appendChild(headerDiv);

        radioGroupContainer.classList.add('options-after-header');
        fieldDiv.appendChild(radioGroupContainer);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'collapsible-content collapsed';

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

        headerDiv.addEventListener('click', () => {
            const isCollapsed = contentDiv.classList.toggle('collapsed');
            icon.textContent = isCollapsed ? '▶' : '▼';
        });

    } else {
        // CASE: Standard Flat Structure
        const mainLabel = document.createElement('label');
        mainLabel.textContent = FieldLabel;
        mainLabel.className = 'label-bold';
        mainLabel.classList.add('required-label'); // *** ADD THIS CLASS FOR CSS ***
        fieldDiv.appendChild(mainLabel);

        if (FieldText) {
            FieldText.split('||').forEach(line => {
                const textNode = document.createElement('label');
                textNode.textContent = line.trim();
                textNode.className = 'multiline-label';
                fieldDiv.appendChild(textNode);
            });
        }
        
        fieldDiv.appendChild(radioGroupContainer);
    }

    return fieldDiv;
}
