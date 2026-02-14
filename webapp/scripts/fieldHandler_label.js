function createDisabledLabel(field, capturedData) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    const label = document.createElement('label');
    label.textContent = field.jkName + ' - ' + field.requirement_control_number;
    const span = document.createElement('span');
    span.className = 'auto-generated-label';

    span.textContent = field.jkText;
    fieldDiv.appendChild(label);
    fieldDiv.appendChild(span);
    capturedData[field.jkName] = field.jkText; // Update the captured data object

    return fieldDiv;
}
