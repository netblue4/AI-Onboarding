function createTextBox(field, capturedData, sanitizeForId) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.FieldName);

    const label = document.createElement('label');
    label.textContent = field.FieldName + ' - ' + field.requirement_control_number;
    label.classList.add('label-bold');
    fieldDiv.appendChild(label);

    const input = document.createElement('textarea');
    input.id = sanitizedId;
    input.name = sanitizedId;
    input.placeholder = field.FieldText;
    input.value = capturedData[field.FieldName] || ''; // Restore captured data
    fieldDiv.appendChild(input);

    return fieldDiv;
}
