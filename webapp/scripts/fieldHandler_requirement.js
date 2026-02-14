function createRequirement(field, capturedData, sanitizeForId) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const sanitizedId = sanitizeForId(field.requirement_control_number);

    const label = document.createElement('label');
    label.textContent = field.jkName + ' (' + field.requirement_control_number + ')';
    label.classList.add('label-bold');
    fieldDiv.appendChild(label);
    
	//Control status
	const select = document.createElement('select');
	select.name = sanitizedId + '_requirement__soa';
	
	const options = ['Select', 'Applicable', 'Not Applicable'];
				
	options.forEach((optionText, index) => {
		const option = document.createElement('option');
		option.value = optionText;
		option.textContent = optionText;
		
		// Set selected if it matches the control_status
		if (field.jkSoa && optionText === field.jkSoa) {
			option.selected = true;
		}
		
		select.appendChild(option);
	});
	label.appendChild(select);	

    const input = document.createElement('textarea');
    input.id = sanitizedId;
    input.name = sanitizedId;
    input.value = field.jkText;
    fieldDiv.appendChild(input);

    return fieldDiv;
}
