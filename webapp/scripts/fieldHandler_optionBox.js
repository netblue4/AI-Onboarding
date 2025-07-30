function createOptionBox(field, capturedData, sanitizeForId) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.FieldName);

    if (field.FieldLabel && typeof field.FieldLabel === 'string') {
        field.FieldLabel.split('||').forEach(lineText => {
            const label = document.createElement('label');
            label.setAttribute('for', sanitizedId);
            label.textContent = lineText.trim();
            label.classList.add('multiline-label');
            fieldDiv.appendChild(label);
        });
    } else {
        const label = document.createElement('label');
        label.textContent = field.FieldName || 'Label not available';
        label.setAttribute('for', sanitizedId);
        fieldDiv.appendChild(label);
    }

    const optionsString = field.FieldType.split(':')[1]?.trim() || '';
    const options = optionsString.split('/');
    const defaultValue = options[0]?.trim() || '';
    const selectedValue = capturedData[field.FieldName] ?? defaultValue;

    options.forEach((optionText, index) => {
        const trimmedOption = optionText.trim();
        const optionId = `${sanitizedId}-${index}`;

        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.id = sanitizedId; //optionId;
        radioInput.name = sanitizedId;
        radioInput.value = trimmedOption;
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
        fieldDiv.appendChild(wrapper);
    });

    return fieldDiv;
}
