function createDecisionField() {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    const label = document.createElement('label');
    label.textContent = 'Branch' + ': ';
    fieldDiv.appendChild(label);

    return fieldDiv;
}