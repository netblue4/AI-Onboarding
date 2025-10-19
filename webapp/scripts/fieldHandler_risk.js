/**
 * Creates an HTML form field for a high-risk AI system requirement based on the AI Act JSON structure.
 * This function generates a collapsible section for each risk, containing a primary question,
 * a set of controls with their objectives, and radio buttons for user input.
 *
 * @param {object} field - The field object from the JSON data, representing a single risk area.
 * @param {object} capturedData - An object containing previously saved data to pre-fill the form.
 * @param {function} sanitizeForId - A utility function to create a safe string for use as an HTML ID.
 * @returns {HTMLElement} The fully constructed div element for the form field.
 */
function createRisk(field, capturedData, sanitizeForId) {
    // Main container for the entire field
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    // Use the 'risk' text to create a unique and stable ID.
    const sanitizedId = sanitizeForId(field.FieldName);

   // --- 2. Build the Collapsible Structure ---

    // Header for the collapsible section
    const headerDiv = document.createElement('div');
    headerDiv.className = 'collapsible-header';
    
    // --- 1. Create Radio Button Group ---
    // These options are standard for this type of compliance form.
    const radioGroupContainer = document.createElement('div');
    //radioGroupContainer.className = 'radio-group-container options-after-header';
    const options = ['Applicable', 'Not Applicable'];
    const selectedValue = capturedData[field.FieldName] ?? null; // Use field.risk as the key

    options.forEach((optionText, index) => {
        const trimmedOption = optionText.trim();
        const optionId = `${sanitizedId}-${index}`;

        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.id = sanitizedId; // Use unique ID for the input
        radioInput.name = sanitizedId; // Group buttons by the sanitized risk name
        radioInput.value = trimmedOption;
        radioInput.required = true;

        // Pre-select the radio button if there's saved data
        if (trimmedOption === String(selectedValue).trim()) {
            radioInput.checked = true;
        }

        const radioLabel = document.createElement('label');
        radioLabel.setAttribute('for', optionId);
        radioLabel.textContent = trimmedOption;

        const wrapper = document.createElement('div');
        wrapper.className = 'radio-option';
        wrapper.appendChild(radioInput);
        wrapper.appendChild(radioLabel);
        radioGroupContainer.appendChild(wrapper);
    });

    const icon = document.createElement('span');
    icon.className = 'collapse-icon';
    icon.textContent = '▶'; // Start in collapsed state
    headerDiv.appendChild(icon);

    const questionLabel = document.createElement('label');
    questionLabel.textContent = field.question.trim(); // The main risk title
    questionLabel.className = 'label-bold';
    headerDiv.appendChild(questionLabel);

    fieldDiv.appendChild(headerDiv);

    // Append the radio buttons to be always visible directly under the header
    fieldDiv.appendChild(radioGroupContainer);

    // Create the collapsible container for the detailed information
    const contentDiv = document.createElement('div');
    contentDiv.className = 'collapsible-content collapsed';

    // Add the primary question inside the collapsible area
    const riskLabel = document.createElement('label');
    riskLabel.textContent = field.FieldName;
    riskLabel.className = 'label-bold';
    contentDiv.appendChild(riskLabel);
    
    // Add separator
    const separator = document.createElement('hr');
    separator.className = 'control-separator';
    contentDiv.appendChild(separator);


    // --- 3. Iterate and Display Controls ---
    // Crreate the controls  div
    const controlsDiv = document.createElement('div');  
    // Create label for the controls div
    const controlLabel = document.createElement('p');
    controlLabel.textContent = 'Controls';
    controlLabel.className = 'label-bold';
    contentDiv.appendChild(controlLabel);

    if (field.controls && Array.isArray(field.controls)) {
        field.controls.forEach(controlItem => {
            const controlContainer = document.createElement('div');

            const controlText = document.createElement('p');
            controlText.textContent = controlItem.control;
            controlContainer.appendChild(controlText);  	
            
            //Control status
            const select = document.createElement('select');
            const options = ['', 'Met', 'Not Met', 'Partially Met'];
    		options.forEach((optionText, index) => {
				const option = document.createElement('option');
				option.value = optionText;
				option.textContent = optionText;
				select.appendChild(option);
    		});
			controlText.appendChild(select);	

    		
    		// Check if control_status exists and starts with "MET"
			if (controlItem.control_status && controlItem.control_status.startsWith("MET")) {

        		select.value = controlItem.control_status

				const span = document.createElement('span');
				span.className = 'auto-generated-label'; // Using your class name
				span.textContent = controlItem.control_evidence; // Set evidence text
	
				controlText.appendChild(span); // Nest span inside label
				//controlContainer.appendChild(label); // Add the whole label to container
	
			} else {

        		select.value = options[0]?.trim();
				
				const input = document.createElement('textarea');
				input.placeholder = controlItem.control_evidence;

				controlText.appendChild(input); // Nest span inside label
				//controlContainer.appendChild(input);
			}
    		
            controlsDiv.appendChild(controlContainer);
        });
    }
    contentDiv.appendChild(controlsDiv);

    fieldDiv.appendChild(contentDiv);

    // Add the click listener to the header to toggle the content visibility
    headerDiv.addEventListener('click', () => {
        const isCollapsed = contentDiv.classList.toggle('collapsed');
        icon.textContent = isCollapsed ? '▶' : '▼';
    });

    return fieldDiv;
}
