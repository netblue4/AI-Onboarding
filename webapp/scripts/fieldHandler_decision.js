function createDecisionField(field, capturedData) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    const decisionsString = field.FieldType.split(':')[1]?.trim() || '';
    const decisions = decisionsString.split('/');
    
    const capturedData_field_name_to_interogate = field.FieldName;
    const target_Yes = field.YesTarget;//decisions[0].split('=')[1];
    const target_No = field.NoTarget;//decisions[1].split('=')[1];
    const selectedValue = capturedData[capturedData_field_name_to_interogate]

    if (selectedValue === "Yes") {
        window.getStepKeyByString(target_Yes);
    } else {
        window.getStepKeyByString(target_No);
    }

    return fieldDiv;
}
