function createDisabledLabel(field, capturedData) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.FieldName);

    const label = document.createElement('label');
    label.textContent = field.FieldLabel;
    label.classList.add('label-bold');
    fieldDiv.appendChild(label);

    const label = document.createElement('label');
    label.id = sanitizedId;
    label.name = sanitizedId;
    label.placeholder = field.FieldText;
    label.className = 'auto-generated-label';
    fieldDiv.appendChild(input);
    return fieldDiv;
}
