/**
 * Creates a multi-select field using checkboxes, allowing for multiple selections.
 * This handler is designed to be called when a field's FieldType starts with "MultiSelect:".
 * It supports both a flat layout and a collapsible layout using the FieldQuestionGroup property.
 * @param {object} field - The field configuration object from the JSON data.
 * @param {object} capturedData - The object containing all previously captured form data.
 * @param {function} sanitizeForId - A utility function to create safe element IDs.
 * @returns {HTMLElement} The fully constructed DOM element for the multi-select field.
 */
function createMultiSelect(field, capturedData, sanitizeForId) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.control_number) + "_response";

    // --- 1. Create the Checkbox Group ---
    const checkboxGroupContainer = document.createElement('div');
    checkboxGroupContainer.className = 'checkbox-group-container'; // CHANGED: Renamed for clarity

    // CHANGED: Logic to parse options from "MultiSelect:" string
    const optionsString = field.jkType.substring(field.jkType.indexOf(':') + 1).trim() || '';
    const options = optionsString.split('/');
    
    // NOTE: For multi-select, the captured data should be an array of selected values.
    const selectedValues = capturedData[sanitizedId] ?? [];

    options.forEach((optionText, index) => {
        const trimmedOption = optionText.trim();
        // Use a more specific ID for each checkbox and its label
        const optionId = `${sanitizedId}-${index}`;

        // CHANGED: Use <input type="checkbox"> instead of "radio"
        const checkboxInput = document.createElement('input');
        checkboxInput.type = 'checkbox';
        checkboxInput.id = optionId; // Use the unique ID for the checkbox itself
        checkboxInput.name = sanitizedId; // Group checkboxes logically
        checkboxInput.value = trimmedOption;
        
        // CHANGED: Check if the current option is in the array of selected values
        if (Array.isArray(selectedValues) && selectedValues.includes(trimmedOption)) {
            checkboxInput.checked = true;
        }

        const checkboxLabel = document.createElement('label');
        checkboxLabel.setAttribute('for', optionId); // The 'for' attribute must match the input's 'id'
        checkboxLabel.textContent = trimmedOption;
        
        const wrapper = document.createElement('div');
        wrapper.classList.add('checkbox-option'); // CHANGED: Class name for styling
        wrapper.appendChild(checkboxInput);
        wrapper.appendChild(checkboxLabel);
        checkboxGroupContainer.appendChild(wrapper);
    });
    
    // --- 2. Check if a collapsible structure is needed (This logic remains the same) ---
    if (field.FieldQuestionGroup && typeof field.FieldQuestionGroup === 'string') {
        // CASE 1: Build the COLLAPSIBLE structure.

        const headerDiv = document.createElement('div');
        headerDiv.className = 'collapsible-header';

        const icon = document.createElement('span');
        icon.className = 'collapse-icon';
        icon.textContent = '▶';
        headerDiv.appendChild(icon);

        const questionLabel = document.createElement('label');
        questionLabel.textContent = field.FieldQuestionGroup.trim();
        questionLabel.classList.add('label-bold');
        headerDiv.appendChild(questionLabel);

        fieldDiv.appendChild(headerDiv);

        checkboxGroupContainer.classList.add('options-after-header');
        fieldDiv.appendChild(checkboxGroupContainer);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'collapsible-content collapsed';

        const fieldLabel = document.createElement('label');
        fieldLabel.textContent = field.control_number + ' - ' + field.jkName + ' (' + field.requirement_control_number + ')';
        fieldLabel.classList.add('label-bold');
        contentDiv.appendChild(fieldLabel);

        if (field.jkText && typeof field.jkText === 'string') {
            field.jkText.split('||').forEach(lineText => {
                const textLabel = document.createElement('label');
                textLabel.textContent = lineText.trim();
                textLabel.classList.add('multiline-label');
                contentDiv.appendChild(textLabel);
            });
        }
        
        fieldDiv.appendChild(contentDiv);

        headerDiv.addEventListener('click', () => {
            const isCollapsed = contentDiv.classList.toggle('collapsed');
            icon.textContent = isCollapsed ? '▶' : '▼';
        });

    } else {
        // CASE 2: Build the original FLAT structure.

        const fieldLabel = document.createElement('label');
        fieldLabel.textContent = field.control_number + ' - ' + field.jkName + ' (' + field.requirement_control_number + ')';
        fieldLabel.classList.add('label-bold');
        fieldDiv.appendChild(fieldLabel);

        if (field.jkText && typeof field.jkText === 'string') {
            field.jkText.split('||').forEach(lineText => {
                const textLabel = document.createElement('label');
                textLabel.textContent = lineText.trim();
                textLabel.classList.add('multiline-label');
                fieldDiv.appendChild(textLabel);
            });
        }
        
        fieldDiv.appendChild(checkboxGroupContainer);
    }

    return fieldDiv;
}
