function createDecisionField(field, capturedData) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    const optionsString = field.FieldType.split(':')[1]?.trim() || '';
    const options = optionsString.split('/');
    const selectedValue = capturedData[field.FieldName] ?? null;



    
    options.forEach((optionText, index) => {
        const trimmedOption = optionText.trim();

        const label = document.createElement('label');
        label.textContent = trimmedOption;
        fieldDiv.appendChild(label);
    });




    return fieldDiv;
}
