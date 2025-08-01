function createDecisionField(field, capturedData) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    const optionsString = field.FieldType.split(':')[1]?.trim() || '';
    const options = optionsString.split('/');
    
    const options_CapturedData_field_name_to_interogate = field.FieldType;
    const options_Yes = options[0].split('=')[1];
    const options_No = options[1].split('=')[1];
    const selectedValue = capturedData[options_CapturedData_field_name_to_interogate]

    window.getStepKeyByString(selectedValue);

}
