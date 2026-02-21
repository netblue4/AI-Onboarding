function createTextBox(field, capturedData, sanitizeForId, fieldStoredValue) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.control_number) + "_response";

    const label = document.createElement('p');
    label.textContent = '<strong>' + field.control_number + '</strong>' + ' - ' + field.jkName + ' (' + field.requirement_control_number + ')';
    fieldDiv.appendChild(label);


    const input = document.createElement('textarea');
    input.id = sanitizedId;
    input.name = sanitizedId;
    input.placeholder = field.jkText;
    input.value = capturedData[sanitizedId] || ''; // Restore captured data
    fieldDiv.appendChild(input);

    return fieldDiv;
}
