function createTextBox(field, capturedData, sanitizeForId, fieldStoredValue) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field'; // Uses your margin, border-bottom, and padding
    const sanitizedId = sanitizeForId(field.control_number) + "_response";

    // Create a wrapper span to keep labels on the same line
    const labelWrapper = document.createElement('span');

    const labelID = document.createElement('strong');
    labelID.textContent = field.control_number;
    // strong is inline, so it will stay next to the labelT
    labelWrapper.appendChild(labelID);
    
    const labelT = document.createElement('label');
    labelT.textContent = ' - ' + field.jkName + ' (' + field.requirement_control_number + ')';
    
    /* Note: Since your CSS defines .form-field label as 'display: block', 
       we override it inline just for this instance so it stays next to the ID.
    */
    labelT.style.display = 'inline'; 
    labelWrapper.appendChild(labelT);

    fieldDiv.appendChild(labelWrapper);

    const input = document.createElement('textarea');
    input.id = sanitizedId;
    input.name = sanitizedId;
    input.placeholder = field.jkText;
    input.value = capturedData[sanitizedId] || ''; 
    
    // This will use your .form-field textarea styles (charcoal bg, gold focus)
    fieldDiv.appendChild(input);

    return fieldDiv;
}