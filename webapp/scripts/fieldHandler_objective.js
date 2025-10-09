function createObjective(objective) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    //const label = document.createElement('label');
    //label.textContent = "Objective";
    const span = document.createElement('span');
    span.className = 'auto-generated-label';

    span.textContent = objective.Objective;
    //fieldDiv.appendChild(label);
    fieldDiv.appendChild(span);

    return fieldDiv;
}
