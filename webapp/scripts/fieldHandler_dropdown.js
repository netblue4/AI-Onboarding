function createDropdown(field, capturedData, sanitizeForId) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.FieldName);

    // Handle multiline labels split by "||"
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
        label.setAttribute('for', sanitizedId);
        label.textContent = field.FieldName || 'Label not available';
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