/**
 * Creates a read-only label field displaying static text from the template.
 * @param {Object} field - The field definition object from the template
 * @param {Object} capturedData - The captured data object; the field value is written into it
 * @returns {HTMLElement} The fully constructed div element for the disabled label
 */
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
