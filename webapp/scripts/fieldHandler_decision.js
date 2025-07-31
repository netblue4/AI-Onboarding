function createDecisionField(field, capturedData) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    const label = document.createElement('label');
    label.textContent = field.FieldText;
    fieldDiv.appendChild(label);

    return fieldDiv;
}
