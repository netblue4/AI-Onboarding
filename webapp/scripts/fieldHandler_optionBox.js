function createOptionBox(field, capturedData, sanitizeForId) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.FieldName);

    // Field header
    const label = document.createElement('label');
    label.textContent = field.FieldLabel;
    label.setAttribute('for', sanitizedId);
    label.classList.add('label-bold');
    fieldDiv.appendChild(label);
    
    if (field.FieldText && typeof field.FieldText === 'string') {
        field.FieldText.split('||').forEach(lineText => {
            const label = document.createElement('label');
            label.textContent = lineText.trim();
            label.classList.add('multiline-label');
            fieldDiv.appendChild(label);
        });
    } else {
        const label = document.createElement('label');
        label.textContent = field.FieldText || 'FieldText not available';
        fieldDiv.appendChild(label);
    }

    const optionsString = field.FieldType.split(':')[1]?.trim() || '';
    const options = optionsString.split('/');
    
    // By setting the default to null, no radio button will be selected initially.
    const defaultValue = null; 
    
    const selectedValue = capturedData[field.FieldName] ?? defaultValue;

    options.forEach((optionText, index) => {
        const trimmedOption = optionText.trim();
        const optionId = `${sanitizedId}-${index}`;

        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.id = sanitizedId; //optionId;
        radioInput.name = sanitizedId;
        radioInput.value = trimmedOption;
        
        // This check will now only be true if a value was previously captured
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
