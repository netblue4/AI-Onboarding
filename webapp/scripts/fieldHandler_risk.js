/**
 * Creates an HTML form field for a high-risk AI system requirement based on the AI Act JSON structure.
 * This function generates a collapsible section for each risk, containing a primary question,
 * a set of controls with their objectives, and radio buttons for user input.
 *
 * Each control also contains a nested "Technical Detail" collapsible div showing:
 *   - jkMaturity   : the maturity level and rationale for this control
 *   - jkAttackVector: a concrete attack scenario the control defends against
 *   - jkTask        : the implementation task description for the engineer
 *   - jkCodeSample  : a runnable code sample demonstrating the control
 *
 * @param {object} field - The field object from the JSON data, representing a single risk area.
 * @param {object} capturedData - An object containing previously saved data to pre-fill the form.
 * @param {function} sanitizeForId - A utility function to create a safe string for use as an HTML ID.
 * @param {*} fieldStoredValue - Previously stored value for this field (reserved for future use).
 * @returns {HTMLElement} The fully constructed div element for the form field.
 */
function createRisk(field, capturedData, sanitizeForId, fieldStoredValue, mindmap) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    // --- 1. Build the Top-Level Collapsible Header ---
    const headerDiv = document.createElement('div');
    headerDiv.className = 'collapsible-header';

    const icon = document.createElement('span');
    icon.className = 'collapse-icon';
    icon.textContent = '▶'; // Start in collapsed state
    headerDiv.appendChild(icon);

    const questionLabel = document.createElement('label');
    questionLabel.textContent = field.jkName.trim(); // The main risk title
    questionLabel.className = 'label-bold';
    headerDiv.appendChild(questionLabel);

    fieldDiv.appendChild(headerDiv);

    // --- 2. Create the Top-Level Collapsible Content ---
    const contentDiv = document.createElement('div');
    contentDiv.className = 'collapsible-content collapsed';

    // Risk description
    const riskTitle = document.createElement('strong');
    riskTitle.textContent = 'Risk Description';
    contentDiv.appendChild(riskTitle);
    
    const riskLabel = document.createElement('label');
    riskLabel.textContent = field.RiskDescription;
    contentDiv.appendChild(riskLabel);

    // Separator
    const separator = document.createElement('hr');
    separator.className = 'control-separator';
    contentDiv.appendChild(separator);

    // --- 3. Controls Section Label ---
    const controlLabel = document.createElement('strong');
    controlLabel.textContent = 'Controls';
    contentDiv.appendChild(controlLabel);

    // --- 4. Iterate and Display Controls ---
    const controlsDiv = document.createElement('div');

    if (field.controls && Array.isArray(field.controls)) {
        field.controls.forEach(controlItem => {

            const controlContainer = document.createElement('div');
            controlContainer.className = 'form-field';
            
            // Control number + jkText
            const controlText = document.createElement('p');
            controlText.textContent = controlItem.control_number + " - " + controlItem.jkText + ' ' + controlItem.requirement_control_number;
            controlContainer.appendChild(controlText);

            // Control implementation status dropdown
            const select = document.createElement('select');
            select.name = sanitizeForId(controlItem.control_number) + '_jkImplementationStatus';

            let options;
            if (state.currentRole === "Compliance") {
                options = ['Select', 'Applicable', 'Not Applicable'];
            } else {
                options = ['Select', 'Not Applicable with justification', 'Implemented with evidence'];
            }

            options.forEach((optionText) => {
                const option = document.createElement('option');
                option.value = optionText;
                option.textContent = optionText;
                if (controlItem.jkImplementationStatus && optionText === controlItem.jkImplementationStatus) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
            controlText.appendChild(select);

            // Implementation evidence — disabled textarea if already applicable, editable otherwise
            if (controlItem.jkImplementationStatus && controlItem.jkImplementationStatus.startsWith("Applicable")) {
                select.value = controlItem.jkImplementationStatus;

                const textarea = document.createElement('textarea');
                textarea.classList.add('form-field');
                textarea.name = sanitizeForId(controlItem.control_number) + '_jkImplementationEvidence';
                textarea.value = controlItem.jkImplementationEvidence;
                textarea.disabled = true;
                controlText.appendChild(textarea);

            } else {
                select.value = options[0]?.trim();

                const input = document.createElement('textarea');
                input.name = sanitizeForId(controlItem.control_number) + '_jkImplementationEvidence';
                input.placeholder = controlItem.jkImplementationEvidence;
                controlText.appendChild(input);
            }

            // --- 5. "Technical Detail" Nested Collapsible ---
            const techHeaderDiv = document.createElement('div');
            techHeaderDiv.className = 'collapsible-header collapsible-header--nested';

            const techIcon = document.createElement('span');
            techIcon.className = 'collapse-icon';
            techIcon.textContent = '▶';
            techHeaderDiv.appendChild(techIcon);

            const techHeaderLabel = document.createElement('span');
            techHeaderLabel.textContent = 'Technical Detail';
            techHeaderLabel.className = 'label-bold';
            techHeaderDiv.appendChild(techHeaderLabel);

            const techContentDiv = document.createElement('div');
            techContentDiv.className = 'collapsible-content collapsible-content--nested collapsed';

            // Helper: append a labelled block inside the technical detail div
            function appendTechBlock(labelText, value, isCode) {
                if (!value) return;

                const blockLabel = document.createElement('p');
                blockLabel.textContent = labelText;
                blockLabel.className = 'label-bold';
                techContentDiv.appendChild(blockLabel);

                if (isCode) {
                    const pre = document.createElement('pre');
                    const code = document.createElement('code');
                    code.textContent = value;
                    pre.appendChild(code);
                    pre.className = 'tech-detail-code';
                    techContentDiv.appendChild(pre);
                } else {
                    const p = document.createElement('p');
                    p.textContent = value;
                    p.className = 'tech-detail-text';
                    techContentDiv.appendChild(p);
                }

                const divider = document.createElement('hr');
                divider.className = 'control-separator';
                techContentDiv.appendChild(divider);
            }

            appendTechBlock('Maturity',       controlItem.jkMaturity,     false);
            appendTechBlock('Attack Vector',  controlItem.jkAttackVector,  false);
            appendTechBlock('Task',           controlItem.jkTask,          false);
            appendTechBlock('Code Sample',    controlItem.jkCodeSample,    true);

            // Toggle listener for the nested "Technical Detail" header
            techHeaderDiv.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent bubbling to the outer collapsible header
                const isCollapsed = techContentDiv.classList.toggle('collapsed');
                techIcon.textContent = isCollapsed ? '▶' : '▼';
            });

            controlContainer.appendChild(techHeaderDiv);
            controlContainer.appendChild(techContentDiv);

            controlsDiv.appendChild(controlContainer);
        });
    }

    contentDiv.appendChild(controlsDiv);
    fieldDiv.appendChild(contentDiv);

    // --- 6. Toggle Listener for the Outer Risk Header ---
    headerDiv.addEventListener('click', () => {
        const isCollapsed = contentDiv.classList.toggle('collapsed');
        icon.textContent = isCollapsed ? '▶' : '▼';
    });

    return fieldDiv;
}