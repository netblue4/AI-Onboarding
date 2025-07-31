function createDisabledLabel(field, capturedData, sanitizeForId) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.FieldName);

    const label = document.createElement('label');
    label.textContent = field.FieldLabel;
    label.classList.add('label-bold');
    fieldDiv.appendChild(label);

    const labeldis = document.createElement('label');
    labeldis.id = sanitizedId;
    labeldis.name = sanitizedId;
    labeldis.placeholder = field.FieldText;
    labeldis.className = 'auto-generated-label';
    fieldDiv.appendChild(labeldis);
    return fieldDiv;
}
