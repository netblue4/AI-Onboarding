function createDecisionField(field, capturedData) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    const optionsString = field.FieldType.split(':')[1]?.trim() || '';
    const options = optionsString.split('/');
    
    const options_CapturedData = options[0].split('=')[1];
    const options_Yes = options[1].split('=')[1];
    const options_No = options[2].split('=')[1];
    const selectedValue = capturedData[options_CapturedData]

    
    window.getStepKeyByString(options_Yes);

    
    options.forEach((optionText, index) => {
        const trimmedOption = optionText.trim();

        const label = document.createElement('label');
        label.textContent = trimmedOption;
        fieldDiv.appendChild(label);
    });




    return fieldDiv;
}
