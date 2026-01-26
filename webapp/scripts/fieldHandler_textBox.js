function createTextBox(field, capturedData, sanitizeForId) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.control_number);

    const label = document.createElement('label');
    label.textContent = field.control_number + ' - ' + field.FieldName + ' (' + field.requirement_control_number + ')';
    label.classList.add('label-bold');
    fieldDiv.appendChild(label);

    const input = document.createElement('textarea');
    input.id = sanitizedId;
    input.name = sanitizedId;
    input.placeholder = field.FieldText;
    input.value = capturedData[sanitizeForId] || ''; // Restore captured data
    fieldDiv.appendChild(input);

    return fieldDiv;
}
