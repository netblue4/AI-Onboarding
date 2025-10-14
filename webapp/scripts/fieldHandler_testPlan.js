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
function createTestPlan(field, capturedData, sanitizeForId) {
    // Main container for the entire field
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

    const testPlanFieldNameLabel = document.createElement('label');
    testPlanFieldNameLabel.textContent = field.FieldName.trim(); // The main risk title
    testPlanFieldNameLabel.className = 'label-bold';
    headerDiv.appendChild(testPlanFieldNameLabel);

    fieldDiv.appendChild(headerDiv);


    // Create the collapsible container for the detailed information
    const contentDiv = document.createElement('div');
    contentDiv.className = 'collapsible-content collapsed';


 /**
 * Test Criteria.
 */

    // Add the criteria label  inside the collapsible area
    const testPlanCriteriaLabel = document.createElement('label');
    testPlanCriteriaLabel.textContent = "Test Criteria";
    testPlanCriteriaLabel.className = 'label-bold';
    contentDiv.appendChild(testPlanCriteriaLabel);
    
    // Add separator
    const separator = document.createElement('hr');
    separator.className = 'control-separator';
    contentDiv.appendChild(separator);


    // Crreate the criteria  div
    const criteriaDiv = document.createElement('div');  


    if (field.TestCriteria && Array.isArray(field.TestCriteria)) {
        field.TestCriteria.forEach(criteriaItem => {
            const criteriaContainer = document.createElement('div');

            const criteriaText = document.createElement('p');
            criteriaText.textContent = criteriaItem.criteria;
            criteriaContainer.appendChild(criteriaText);
            
            const input = document.createElement('textarea');
    		input.placeholder = criteriaItem.criteria_evidence;
    		criteriaContainer.appendChild(input);
 
            criteriaDiv.appendChild(criteriaContainer);
        });
    }
    contentDiv.appendChild(criteriaDiv);

    

 /**
 * Test steps.
 */

    // Add the criteria label  inside the collapsible area
    const testPlanStepsLabel = document.createElement('label');
    testPlanStepsLabel.textContent = "Test Steps";
    testPlanStepsLabel.className = 'label-bold';
    contentDiv.appendChild(testPlanStepsLabel);

    // Add separator
    const separatorStep = document.createElement('hr');
    separatorStep.className = 'control-separator';
    contentDiv.appendChild(separatorStep);


    // Crreate the criteria  div
    const testStepsDiv = document.createElement('div');  


    if (field.TestSteps && Array.isArray(field.TestSteps)) {
        field.TestSteps.forEach(stepItem => {
            const stepContainer = document.createElement('div');

            const stepText = document.createElement('p');
            stepText.textContent = stepItem.step;
            stepContainer.appendChild(stepText);
 
            testStepsDiv.appendChild(stepContainer);
        });
    }
    contentDiv.appendChild(testStepsDiv);


    
    fieldDiv.appendChild(contentDiv);

    // Add the click listener to the header to toggle the content visibility
    headerDiv.addEventListener('click', () => {
        const isCollapsed = contentDiv.classList.toggle('collapsed');
        icon.textContent = isCollapsed ? '▶' : '▼';
    });

    return fieldDiv;
}
