function createDropdown(field, capturedData, sanitizeForId) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.FieldName);

    // Field header
    const label = document.createElement('label');
    label.textContent = field.FieldLabel;
    label.setAttribute('for', sanitizedId);
    label.classList.add('label-bold');
    fieldDiv.appendChild(label);



    // Handle question groups to make the form look less busy"
    if (field.FieldQuestionGroup && typeof field.FieldQuestionGroup === 'string') {
            const label = document.createElement('label');
            label.setAttribute('for', sanitizedId);
            label.textContent = field.FieldQuestionGroup.trim();
            label.classList.add('label-bold');
            fieldDiv.appendChild(label);
    }
    
    // Handle multiline Text split by "||"
    if (field.FieldText && typeof field.FieldText === 'string') {
        field.FieldText.split('||').forEach(lineText => {
            const label = document.createElement('label');
            label.setAttribute('for', sanitizedId);
            label.textContent = lineText.trim();
            label.classList.add('multiline-label');
            fieldDiv.appendChild(label);
        });
    } else {
        const label = document.createElement('label');
        label.setAttribute('for', sanitizedId);
        label.textContent = field.FieldText || 'FieldText not available';
        fieldDiv.appendChild(label);
    }

    const select = document.createElement('select');
    select.id = sanitizedId;
    select.name = sanitizedId;
    const optionsString = field.FieldType.split(':')[1]?.trim() || '';
    const options = optionsString.split('/');

    options.forEach(optionText => {
        const option = document.createElement('option');
        option.value = optionText.trim();
        option.textContent = optionText.trim();
        select.appendChild(option);
    });
    select.value = capturedData[field.FieldName] || options[0]?.trim(); // Restore
    fieldDiv.appendChild(select);

    return fieldDiv;
}
