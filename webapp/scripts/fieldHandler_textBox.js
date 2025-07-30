function createTextBox(field, capturedData, sanitizeForId) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.FieldName);

    const label = document.createElement('label');
    label.textContent = 'Risk' + ': ';
    fieldDiv.appendChild(label);

    const input = document.createElement('textarea');
    input.id = sanitizedId;
    input.name = sanitizedId;
    input.placeholder = field.FieldLabel;
    input.rows = 3;
    input.value = capturedData[field.FieldName] || ''; // Restore captured data
    fieldDiv.appendChild(input);

    return fieldDiv;
}