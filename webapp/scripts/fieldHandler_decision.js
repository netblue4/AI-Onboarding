function createDecisionField(field, capturedData) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    const decisionsString = field.FieldType.split(':')[1]?.trim() || '';
    const decisions = decisionsString.split('/');
    
    const capturedData_field_name_to_interogate = field.FieldName;
    const decision_Yes = options[0].split('=')[1];
    const decision_No = options[1].split('=')[1];
    const selectedValue = capturedData[capturedData_field_name_to_interogate]

    window.getStepKeyByString(selectedValue);

}
