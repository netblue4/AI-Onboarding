/**
 * Creates a multi-select field using checkboxes.
 */
function createMultiSelect(field, capturedData, sanitizeForId, fieldStoredValue) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field'; 
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
    


    // Render helper text (jkText split by ||)
    if (field.jkText && typeof field.jkText === 'string') {
        field.jkText.split('||').forEach(lineText => {
            const textLabel = document.createElement('p'); // Changed to <p> for proper spacing
            textLabel.textContent = lineText.trim();
            textLabel.className = 'multiline-label';
            fieldDiv.appendChild(textLabel);
        });
    }

    // --- 2. Create the Checkbox Group ---
    const checkboxGroupContainer = document.createElement('div');
    checkboxGroupContainer.className = 'checkbox-group-container';
    checkboxGroupContainer.style.marginTop = '15px'; // Matches the textarea spacing

    const optionsString = field.jkType.substring(field.jkType.indexOf(':') + 1).trim() || '';
    const options = optionsString.split('/');
    
    const selectedValues = capturedData[sanitizedId] ?? [];

    options.forEach((optionText, index) => {
        const trimmedOption = optionText.trim();
        const optionId = `${sanitizedId}-${index}`;

        const checkboxInput = document.createElement('input');
        checkboxInput.type = 'checkbox';
        checkboxInput.id = optionId; 
        checkboxInput.name = sanitizedId;
        checkboxInput.value = trimmedOption;
        
        if (Array.isArray(selectedValues) && selectedValues.includes(trimmedOption)) {
            checkboxInput.checked = true;
        }

        const checkboxLabel = document.createElement('label');
        checkboxLabel.setAttribute('for', optionId);
        checkboxLabel.textContent = trimmedOption;
        checkboxLabel.style.display = 'inline'; // Ensure label stays next to checkbox
        
        const wrapper = document.createElement('div');
        wrapper.classList.add('checkbox-option');
        wrapper.style.marginBottom = '8px'; // Spacing between each option
        
        wrapper.appendChild(checkboxInput);
        wrapper.appendChild(checkboxLabel);
        checkboxGroupContainer.appendChild(wrapper);
    });
    
    fieldDiv.appendChild(checkboxGroupContainer);

    return fieldDiv;
} 