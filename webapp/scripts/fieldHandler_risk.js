function createRisk(field, capturedData, sanitizeForId, fieldStoredValue, mindmap) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    // --- 1. Build the Top-Level Collapsible Header ---
    const headerDiv = document.createElement('div');
    headerDiv.className = 'collapsible-header';

    const icon = document.createElement('span');
    icon.className = 'collapse-icon';
    icon.textContent = '▶';
    headerDiv.appendChild(icon);

    const questionLabel = document.createElement('label');
    questionLabel.textContent = field.jkName.trim();
    headerDiv.appendChild(questionLabel);

    fieldDiv.appendChild(headerDiv);

    // --- 2. Create the Top-Level Collapsible Content ---
    const contentDiv = document.createElement('div');
    contentDiv.className = 'collapsible-content collapsed';

    const riskTitle = document.createElement('label');
    riskTitle.textContent = 'Risk Description';
    contentDiv.appendChild(riskTitle);

    const riskLabel = document.createElement('label');
    riskLabel.textContent = field.RiskDescription;
    contentDiv.appendChild(riskLabel);

    const separator = document.createElement('hr');
    separator.className = 'control-separator';
    contentDiv.appendChild(separator);

    // --- 3. Controls Section Label ---
    const controlLabel = document.createElement('label');
    controlLabel.textContent = 'Controls';
    contentDiv.appendChild(controlLabel);

    // --- 4. Build Set of valid control numbers from mindmap ---
    const mindmapControlNumbers = new Set();
    if (mindmap) {
        mindmap.forEach(groups => groups.forEach(gData =>
            gData.requirements.forEach(reqEntry =>
                reqEntry.implementations.forEach(impl =>
                    mindmapControlNumbers.add(impl.control_number)
                )
            )
        ));
    }

    // --- 5. Iterate and Display Controls ---
    const controlsDiv = document.createElement('div');

    if (field.controls && Array.isArray(field.controls)) {
        field.controls.forEach(controlItem => {

            // --- Only display controls that appear in the mindmap ---
            if (!mindmapControlNumbers.has(controlItem.control_number)) return;

            const controlContainer = document.createElement('div');
            controlContainer.className = 'form-field';

            // Label wrapper — keeps control number and text on the same line
            const labelWrapper = document.createElement('span');

            const labelID = document.createElement('strong');
            labelID.textContent = controlItem.control_number;
            labelWrapper.appendChild(labelID);

            const labelT = document.createElement('label');
            labelT.textContent = '- ' + controlItem.jkText + ' ' + controlItem.requirement_control_number;
            labelT.style.display = 'inline';
            labelWrapper.appendChild(labelT);

            controlContainer.appendChild(labelWrapper);

            // --- Evidence field: link if Jira URL, otherwise textarea ---
            const evidenceValue = fieldStoredValue(controlItem);

            if (evidenceValue && evidenceValue.startsWith('http')) {
                // --- Render as Jira link ---
                const linkWrapper = document.createElement('div');
                linkWrapper.style.marginTop = '10px';

                const jiraLink = document.createElement('a');
                jiraLink.href = evidenceValue;
                jiraLink.target = '_blank';
                jiraLink.textContent = '🎫 View Jira Ticket';
                jiraLink.style.cssText = `
                    color: #b8963e;
                    font-size: 13px;
                    text-decoration: none;
                    font-weight: 600;
                `;
                jiraLink.addEventListener('mouseover', () => jiraLink.style.textDecoration = 'underline');
                jiraLink.addEventListener('mouseout',  () => jiraLink.style.textDecoration = 'none');

                linkWrapper.appendChild(jiraLink);
                controlContainer.appendChild(linkWrapper);

            } else {
                // --- Render as textarea ---
                const inputWrapper = document.createElement('div');
                inputWrapper.style.marginTop = '10px';

                const input = document.createElement('textarea');
                input.name = sanitizeForId(controlItem.control_number) + '_jkImplementationEvidence';
                input.placeholder = controlItem.jkImplementationEvidence || 'Enter implementation evidence...';
                if (evidenceValue) input.value = evidenceValue;
                inputWrapper.appendChild(input);
                controlContainer.appendChild(inputWrapper);
            }

            // --- 6. "Technical Detail" Nested Collapsible ---
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

            appendTechBlock('Maturity',      controlItem.jkMaturity,    false);
            appendTechBlock('Attack Vector', controlItem.jkAttackVector, false);
            appendTechBlock('Task',          controlItem.jkTask,         false);
            appendTechBlock('Code Sample',   controlItem.jkCodeSample,   true);

            techHeaderDiv.addEventListener('click', (e) => {
                e.stopPropagation();
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

    // --- 7. Toggle Listener for the Outer Risk Header ---
    headerDiv.addEventListener('click', () => {
        const isCollapsed = contentDiv.classList.toggle('collapsed');
        icon.textContent = isCollapsed ? '▶' : '▼';
    });

    return fieldDiv;
}