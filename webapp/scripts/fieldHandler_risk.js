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
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
   // --- 2. Build the Collapsible Structure ---
    // Header for the collapsible section
    const headerDiv = document.createElement('div');
    headerDiv.className = 'collapsible-header';

    const icon = document.createElement('span');
    icon.className = 'collapse-icon';
    icon.textContent = '▶'; // Start in collapsed state
    headerDiv.appendChild(icon);

    const questionLabel = document.createElement('label');
    questionLabel.textContent = field.FieldName.trim() + ' (' + field.requirement_control_number + ')'; // The main risk title
    questionLabel.className = 'label-bold';
    headerDiv.appendChild(questionLabel);
    
    fieldDiv.appendChild(headerDiv);

/*	const radioInput = document.createElement('select');
	radioInput.name = sanitizeForId(field.FieldName);
	const options = ['Select', 'Applicable', 'Not Applicable'];
	options.forEach((optionText, index) => {
		const option = document.createElement('option');
		option.value = optionText;
		option.textContent = optionText;
		radioInput.appendChild(option);
	});
    fieldDiv.appendChild(radioInput);
*/
    // Create the collapsible container for the detailed information
    const contentDiv = document.createElement('div');
    contentDiv.className = 'collapsible-content collapsed';

    // Add the primary question inside the collapsible area
    const riskLabel = document.createElement('label');
    riskLabel.textContent = field.RiskDescription;
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
            controlText.textContent = controlItem.control_number + " - " + controlItem.control_description;
            controlContainer.appendChild(controlText);  	
            
            //Control status
            const select = document.createElement('select');
            select.name = sanitizeForId(controlItem.control_number) + '_status';
			
			let options;
			
			if (state.currentRole === "Compliance") {
				options = ['', 'Attestation', 'Not Applicable'];
			} else {
				options = ['', 'Not Applicable', 'Implemented with evidence'];
			}
			            
    		options.forEach((optionText, index) => {
				const option = document.createElement('option');
				option.value = optionText;
				option.textContent = optionText;
				
				// Set selected if it matches the control_status
				if (controlItem.control_status && optionText === controlItem.control_status) {
					option.selected = true;
				}
				
				select.appendChild(option);
    		});
			controlText.appendChild(select);	

    		
    		// Check if control_status exists and starts with "Attestation"
			if (controlItem.control_status && controlItem.control_status.startsWith("Attestation")) {

        		select.value = controlItem.control_status;

				const textarea = document.createElement('textarea');
				textarea.classList.add('form-field'); // Ensure the class matches your query
				textarea.name = sanitizeForId(controlItem.control_number) + '_evidence';
				textarea.value = controlItem.control_evidence; // Use .value for inputs
				textarea.disabled = true;
	
				controlText.appendChild(textarea); // Nest span inside label
				//controlContainer.appendChild(label); // Add the whole label to container
	
			} else {

        		select.value = options[0]?.trim();
				
				const input = document.createElement('textarea');
				input.name = sanitizeForId(controlItem.control_number) + '_evidence';
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
