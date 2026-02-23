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

    // --- 4. Iterate and Display Controls ---
    const controlsDiv = document.createElement('div');

    if (field.controls && Array.isArray(field.controls)) {
        field.controls.forEach(controlItem => {

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

            // ✅ Wrap select in a block div so it always renders on a new line
            const selectWrapper = document.createElement('div');
            selectWrapper.style.marginTop = '10px';

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

            selectWrapper.appendChild(select);
            controlContainer.appendChild(selectWrapper);

            // Implementation evidence textarea
            if (controlItem.jkImplementationStatus && controlItem.jkImplementationStatus.startsWith("Applicable")) {
                select.value = controlItem.jkImplementationStatus;

                const textarea = document.createElement('textarea');
                textarea.classList.add('form-field');
                textarea.name = sanitizeForId(controlItem.control_number) + '_jkImplementationEvidence';
                textarea.value = controlItem.jkImplementationEvidence;
                textarea.disabled = true;
                controlContainer.appendChild(textarea);

            } else {
                select.value = options[0]?.trim();

                const input = document.createElement('textarea');
                input.name = sanitizeForId(controlItem.control_number) + '_jkImplementationEvidence';
                input.placeholder = controlItem.jkImplementationEvidence;
                controlContainer.appendChild(input);
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

            appendTechBlock('Maturity',      controlItem.jkMaturity,      false);
            appendTechBlock('Attack Vector', controlItem.jkAttackVector,   false);
            appendTechBlock('Task',          controlItem.jkTask,           false);
            appendTechBlock('Code Sample',   controlItem.jkCodeSample,     true);

            techHeaderDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                const isCollapsed = techContentDiv.classList.toggle('collapsed');
                techIcon.textContent = isCollapsed ? '▶' : '▼';
            });


const ttt =  controlItem.control_number + '- ' + controlItem.jkText + ' ' + controlItem.requirement_control_number;

const jiraLink = createJiraLink('Compliance gap: ' + ttt, 'NETBL-1');
controlContainer.appendChild(jiraLink);

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

function createJiraLink(summary, projectId, issueTypeId = 10001) {
    const link = document.createElement('a');
    link.textContent = 'Create Jira Ticket';
    link.href = '#';
    link.style.cssText = `
        color: #b8963e;
        font-size: 12px;
        cursor: pointer;
        text-decoration: none;
    `;

    link.addEventListener('click', (e) => {
        e.preventDefault();
        const encodedSummary = encodeURIComponent(summary);
        const url = `https://netblue4.atlassian.net/secure/CreateIssueDetails!init.jspa?pid=${projectId}&issuetype=${issueTypeId}&summary=${encodedSummary}`;
        window.open(url, '_blank');
    });

    return link;
}