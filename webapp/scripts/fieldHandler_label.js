function createDisabledLabel(field, capturedData, sanitizeForId) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    const label = document.createElement('label');
    label.textContent = field.FieldLabel;
    const span = document.createElement('span');
    span.className = 'auto-generated-label';

    span.textContent = field.FieldText;
    fieldDiv.appendChild(label);
    fieldDiv.appendChild(span);
    capturedData[field.FieldName] = uniqueId; // Update the captured data object

    return fieldDiv;
}
