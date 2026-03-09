/**
 * Shared utility functions used across multiple field handlers.
 */

/**
 * Looks up a stored value for a given field from the application's captured data.
 * The key used depends on the field's jkType.
 *
 * @param {Object} field - The field definition object from the template
 * @param {boolean} [implementationStatus=false] - If true, returns the compliance/implementation
 *   status value instead of the primary response value
 * @returns {*} The stored value, or null if not found
 */
function fieldStoredValue(field, implementationStatus = false) {
    if (!field || !field.jkType) return null;

    const cleanType = String(field.jkType).split(':')[0];
    let sanitizedId = 0;

    switch (cleanType) {
        case "requirement":
            sanitizedId = templateManager.sanitizeForId(field.requirement_control_number);
            return state.capturedData[sanitizedId + '_jkSoa'];
        case "MultiSelect":
            sanitizedId = templateManager.sanitizeForId(field.control_number);
            if (implementationStatus) {
                return state.capturedData[sanitizedId + "_complystatus"];
            }
            return state.capturedData[sanitizedId + "_response"];
        case "risk_control":
        case "test_control":
            sanitizedId = templateManager.sanitizeForId(field.control_number);
            if (implementationStatus) {
                return state.capturedData[sanitizedId + "_complystatus"];
            }
            return state.capturedData[sanitizedId + "_jkImplementationEvidence"];
        default:
            sanitizedId = templateManager.sanitizeForId(field.control_number);
            if (implementationStatus) {
                return state.capturedData[sanitizedId + "_complystatus"] || null;
            }
            return state.capturedData[sanitizedId + "_response"] || null;
    }
}

/**
 * Handles data capture and restore operations for a single field node.
 * Reads from or writes to the DOM based on the operation requested.
 *
 * @param {Object} field - The field definition object from the template
 * @param {string} fieldType - The field's jkType value
 * @param {string} operation - Either "captureData" (DOM → state) or "retrieveData" (state → DOM)
 * @param {Object|null} [currentData=null] - The data object to write into (required for captureData)
 */
function fieldHelper(field, fieldType, operation, currentData = null) {
    if (!field || !field.jkType) return null;

    const cleanType = String(field.jkType).split(':')[0];

    switch (operation) {
        case "captureData":
            switch (cleanType) {
                case "requirement": {
                    const sanitizedId = templateManager.sanitizeForId(field.requirement_control_number);
                    const requirementSelect = document.querySelector(`select[name="${sanitizedId}_jkSoa"]`);
                    if (requirementSelect && requirementSelect.value && requirementSelect.value !== 'Select') {
                        if (currentData[sanitizedId + '_jkSoa'] !== requirementSelect.value) {
                            currentData[sanitizedId + '_requirement'] = field.jkName + ': ' + field.jkText;
                            currentData[sanitizedId + '_jkSoa'] = requirementSelect.value;
                        }
                    } else if (requirementSelect && currentData[sanitizedId + '_jkSoa']) {
                        delete currentData[sanitizedId + '_jkSoa'];
                        delete currentData[sanitizedId + '_requirement'];
                    }
                    break;
                }
                case "risk":
                case "plan":
                    if (field.controls && Array.isArray(field.controls)) {
                        field.controls.forEach(control => {
                            const controlKey = templateManager.sanitizeForId(control.control_number);
                            const evidenceElement = document.querySelector(`textarea[name="${controlKey}_jkImplementationEvidence"]`);
                            const evidenceValue = evidenceElement ? evidenceElement.value : "";
                            if (evidenceValue !== "") {
                                currentData[controlKey] = control.jkText;
                                currentData[`${controlKey}_jkImplementationEvidence`] = evidenceValue;
                            }
                            const complyStatusElement = document.querySelector(`select[name="${controlKey}_complystatus"]`);
                            const complyStatusValue = complyStatusElement ? complyStatusElement.value : "";
                            if (complyStatusValue !== "") {
                                currentData[controlKey + "_complystatus"] = complyStatusValue;
                            } else {
                                delete currentData[controlKey + "_complystatus"];
                            }
                        });
                    }
                    break;
                case "MultiSelect": {
                    const sanitizedId_mul = templateManager.sanitizeForId(field.control_number);
                    const checkboxes = document.querySelectorAll(`input[type="checkbox"][name="${sanitizedId_mul}_response"]:checked`);
                    if (checkboxes.length > 0) {
                        currentData[sanitizedId_mul + "_response"] = Array.from(checkboxes).map(cb => cb.value);
                    } else if (document.querySelector(`input[type="checkbox"][name="${sanitizedId_mul}_response"]`)) {
                        delete currentData[sanitizedId_mul + "_response"];
                    }
                    const mulcomplyStatusElement = document.querySelector(`select[name="${sanitizedId_mul}_complystatus"]`);
                    const mulcomplyStatusValue = mulcomplyStatusElement ? mulcomplyStatusElement.value : "";
                    if (mulcomplyStatusValue !== "") {
                        currentData[sanitizedId_mul + "_complystatus"] = mulcomplyStatusValue;
                    } else {
                        delete currentData[sanitizedId_mul + "_complystatus"];
                    }
                    break;
                }
                default: {
                    const sanitizedId_default = templateManager.sanitizeForId(field.control_number);
                    const evidenceElement = document.querySelector(`select[name="${sanitizedId_default}_response"]`);
                    if (evidenceElement) {
                        if (evidenceElement.value) {
                            currentData[sanitizedId_default + "_response"] = evidenceElement.value;
                        } else {
                            delete currentData[sanitizedId_default];
                        }
                    }
                    const complyStatusElement = document.querySelector(`select[name="${sanitizedId_default}_complystatus"]`);
                    if (complyStatusElement) {
                        if (complyStatusElement.value) {
                            currentData[sanitizedId_default + "_complystatus"] = complyStatusElement.value;
                        } else {
                            delete currentData[sanitizedId_default];
                        }
                    }
                    break;
                }
            }
            break;

        case "retrieveData":
            switch (cleanType) {
                case "requirement": {
                    const sanitizedId = templateManager.sanitizeForId(field.requirement_control_number);
                    if (state.capturedData && state.capturedData[sanitizedId + '_jkSoa']) {
                        const select = document.querySelector(`select[name="${sanitizedId}_jkSoa"]`);
                        if (select) select.value = state.capturedData[sanitizedId + '_jkSoa'];
                    }
                    break;
                }
                case "risk":
                case "plan":
                    if (field.controls && Array.isArray(field.controls)) {
                        field.controls.forEach(control => {
                            const controlKey = templateManager.sanitizeForId(control.control_number);
                            const evidenceElement = document.querySelector(`textarea[name="${controlKey}_jkImplementationEvidence"]`);
                            if (evidenceElement && state.capturedData[`${controlKey}_jkImplementationEvidence`]) {
                                evidenceElement.value = state.capturedData[`${controlKey}_jkImplementationEvidence`];
                            }
                            const complyStatusElement = document.querySelector(`textarea[name="${controlKey}_complystatus"]`);
                            if (complyStatusElement && state.capturedData[`${controlKey}_complystatus`]) {
                                complyStatusElement.value = state.capturedData[`${controlKey}_complystatus`];
                            }
                        });
                    }
                    break;
                case "MultiSelect": {
                    const sanitizedId_mul = templateManager.sanitizeForId(field.control_number);
                    const allCheckboxes = document.querySelectorAll(`input[type="checkbox"][name="${sanitizedId_mul}_response"]`);
                    allCheckboxes.forEach(cb => cb.checked = false);
                    const selectedValues = state.capturedData[sanitizedId_mul + "_response"];
                    if (Array.isArray(selectedValues)) {
                        selectedValues.forEach(value => {
                            const checkbox = document.querySelector(`input[type="checkbox"][name="${sanitizedId_mul}_response"][value="${value}"]`);
                            if (checkbox) checkbox.checked = true;
                        });
                    }
                    const mulcomplyStatusElement = document.querySelector(`textarea[name="${sanitizedId_mul}_complystatus"]`);
                    if (mulcomplyStatusElement && state.capturedData[`${sanitizedId_mul}_complystatus`]) {
                        mulcomplyStatusElement.value = state.capturedData[`${sanitizedId_mul}_complystatus`];
                    }
                    break;
                }
                default: {
                    const sanitizedId_default = templateManager.sanitizeForId(field.control_number);
                    if (state.capturedData[sanitizedId_default + "_response"]) {
                        const inputElement = document.querySelector(`select[name="${sanitizedId_default}_response"]`);
                        if (inputElement) inputElement.value = state.capturedData[sanitizedId_default + "_response"];
                    }
                    if (state.capturedData[sanitizedId_default + "_complystatus"]) {
                        const complyStatusElement = document.querySelector(`select[name="${sanitizedId_default}_complystatus"]`);
                        if (complyStatusElement) complyStatusElement.value = state.capturedData[sanitizedId_default + "_complystatus"];
                    }
                    break;
                }
            }
            break;

        default:
            console.warn("Unknown operation:", operation);
            return null;
    }
}

/**
 * Builds a nested Map of mindmap data from the raw webapp JSON.
 * Groups requirements by Article step → group → requirement, then performs
 * a global linking pass to attach implementation nodes to their requirements.
 *
 * @param {Object} data - The raw template data (window.originalWebappData)
 * @param {Function} sanitizeForId - Utility to sanitize strings for HTML IDs
 * @param {Function} fieldStoredValue - Utility to retrieve a stored field value
 * @returns {Map} Nested Map: stepName → groupName → { requirements: Map }
 */
function buildMindmapData(data, sanitizeForId, fieldStoredValue) {
    const mindmapData = new Map();
    const globalRequirementMap = new Map(); // Index for linking implementations
    const allImplementationNodes = [];

    Object.entries(data).forEach(([phaseName, steps]) => {
        steps.forEach(step => {
            const stepName = step.StepName || "General Procedure";
            const isArticleStep = stepName.trim().startsWith('Article');

            // Initialize hierarchy structure ONLY if it's an Article step
            if (isArticleStep && !mindmapData.has(stepName)) {
                mindmapData.set(stepName, new Map());
            }

            // Recursively collect fields from EVERY step
            let stepFields = [];
            function collect(fields) {
                if (!fields || !Array.isArray(fields)) return;
                fields.forEach(f => {
                    stepFields.push(f);
                    if (f.Fields) collect(f.Fields);
                    if (f.controls) collect(f.controls);
                });
            }
            collect(step.Fields);

            stepFields.forEach(field => {
                // Process Requirements ONLY if in an Article step
                if (isArticleStep) {
                    const stepGroups = mindmapData.get(stepName);
                    if (field.jkType === 'fieldGroup' && field.controls) {
                        const containsReqs = field.controls.some(c => c.jkType === 'requirement');
                        if (containsReqs) {
                            if (!stepGroups.has(field.jkName)) {
                                stepGroups.set(field.jkName, { requirements: new Map() });
                            }
                            const groupEntry = stepGroups.get(field.jkName);

                            field.controls.forEach(req => {
                                if (req.jkType === 'requirement') {
                                    const controlKey = req.requirement_control_number;
                                    if (controlKey) {
                                        const reqEntry = { requirement: req, implementations: new Set() };
                                        groupEntry.requirements.set(controlKey, reqEntry);
                                        globalRequirementMap.set(controlKey, reqEntry);
                                    }
                                }
                            });
                        }
                    }
                }

                // Collect potential implementations from EVERY step
                if (field.requirement_control_number && field.jkType !== 'requirement') {
                    allImplementationNodes.push(field);
                }
            });
        });
    });

    // Global linking pass: attach implementations to their indexed requirements
    allImplementationNodes.forEach(implNode => {
        const implKeys = String(implNode.requirement_control_number).split(',').map(s => s.trim());
        implKeys.forEach(key => {
            if (globalRequirementMap.has(key)) {
                globalRequirementMap.get(key).implementations.add(implNode);
            }
        });
    });

    return mindmapData;
}

/**
 * Exports applicable compliance controls to a Jira-compatible CSV file and triggers a download.
 * After download, prompts the user to confirm the Jira upload, then marks all exported controls
 * with their Jira ticket search URLs and auto-saves progress.
 */
function exportToJiraCsv() {
    const rows = [];
    const projectKey = 10001;

    const sanitizeForId = templateManager.sanitizeForId.bind(templateManager);
    const webappData = window.originalWebappData;
    const mindmapData = buildMindmapData(webappData, sanitizeForId, fieldStoredValue);

    // --- Get System ID from metadata ---
    const systemId = webappData?._metadata?.systemId || state.systemId || 'UNKNOWN';

    // --- Sanitize text for Jira wiki markup ---
    function sanitizeForCsv(text) {
        if (!text) return '';
        return text
            .replace(/```[\w]*\n?/g, '')
            .replace(/```/g, '')
            .replace(/\r\n/g, '\n')
            .trim();
    }

    // --- Helper: determine category from control_number ---
    function getCategory(control_number) {
        const cNum = String(control_number || '');
        if (cNum.includes('R')) return 'Build';
        if (cNum.includes('T')) return 'Test';
        return 'Define';
    }

    // --- Helper: build Jira search URL using systemId + control_number ---
    function buildJiraUrl(controlNumber) {
        const searchTerm = `${systemId} ${controlNumber}`;
        const cleanSearchTerm = searchTerm.replace(/[\[\],-]/g, '');
        return `https://netblue4.atlassian.net/issues?jql=summary%20~%20%22${encodeURIComponent(cleanSearchTerm)}%22`;
    }

    // --- Helper: build zipped task + code sample description for Build/Test ---
    function buildTaskCodeDescription(impl) {
        const taskArray = Array.isArray(impl.jkTask)
            ? impl.jkTask
            : [impl.jkTask].filter(Boolean);
        const codeArray = Array.isArray(impl.jkCodeSample)
            ? impl.jkCodeSample
            : [impl.jkCodeSample].filter(Boolean);

        if (taskArray.length === 0) return '';

        return taskArray.map((task, i) => {
            const parts = [`h4. Task ${i + 1}\n${sanitizeForCsv(task)}`];
            if (codeArray[i]) {
                parts.push(`h4. Code Sample ${i + 1}\n{code:python}\n${codeArray[i]}\n{code}`);
            }
            return parts.join('\n\n');
        }).join('\n\n----\n\n');
    }

    // --- Helper: build Define description from jkType options or TextBox ---
    function buildDefineDescription(impl) {
        const cleanType = String(impl.jkType || '').split(':')[0];
        const optionsString = String(impl.jkType || '').split(':')[1] || '';

        const parts = [
            `h3. [Define] ${impl.control_number} - ${impl.jkName || ''}`,
            impl.jkObjective ? `h4. Objective\n${sanitizeForCsv(impl.jkObjective)}` : '',
            impl.jkText      ? `h4. Guidance\n${sanitizeForCsv(impl.jkText)}`       : '',
        ];

        if (cleanType === 'MultiSelect' && optionsString) {
            const options = optionsString.split('/').map(o => o.trim()).filter(Boolean);
            const checkboxList = options.map(opt => `() ${opt}`).join('\n');
            parts.push(`h4. Select all that apply\n${checkboxList}`);
        } else if (cleanType === 'TextBox') {
            parts.push(`h4. Developer Response\n_Please provide your response below:_\n\n&nbsp;`);
        }

        parts.push(`h4. Requirement Reference\n${impl.requirement_control_number || ''}`);

        return parts.filter(Boolean).join('\n\n');
    }

    // --- CSV Header ---
    rows.push(['Work item Id', 'Summary', 'Description', 'Work type', 'Priority', 'Parent']);

    let idCounter = 1;
    const exportedImpls = [];

    mindmapData.forEach((groups, stepName) => {
        groups.forEach((gData, groupName) => {
            gData.requirements.forEach((reqEntry, reqKey) => {
                const req = reqEntry.requirement;

                // Only export applicable requirements
                if (fieldStoredValue(req, true) !== 'Applicable') return;

                const parentId = idCounter++;
                const parentSummary = `${stepName} | ${groupName} | ${reqKey}: ${req.jkName || ''}`;
                rows.push([parentId, parentSummary, sanitizeForCsv(req.jkText), 'Task', 'Medium', '']);

                // Deduplicate implementations by control_number
                const seen = new Set();

                reqEntry.implementations.forEach(impl => {
                    const category = getCategory(impl.control_number);
                    const cNum = String(impl.control_number || '');

                    if (seen.has(cNum)) return;
                    seen.add(cNum);

                    let descriptionParts = '';
                    let subTaskSummary = '';

                    if (category === 'Define') {
                        descriptionParts = buildDefineDescription(impl);
                        subTaskSummary = `[${systemId}] [Define] ${impl.control_number}: ${impl.jkName || ''}`;
                    } else {
                        const taskCodeSection = buildTaskCodeDescription(impl);
                        descriptionParts = [
                            `h3. Control: ${impl.control_number} - ${impl.jkName || ''}`,
                            impl.jkText         ? `h4. Description\n${sanitizeForCsv(impl.jkText)}`          : '',
                            impl.jkAttackVector ? `h4. Attack Vector\n${sanitizeForCsv(impl.jkAttackVector)}` : '',
                            taskCodeSection     ? taskCodeSection                                              : '',
                        ].filter(Boolean).join('\n\n');
                        subTaskSummary = `[${systemId}] [${category}] ${impl.control_number}: ${impl.jkName || impl.jkText || ''}`;
                    }

                    exportedImpls.push({ impl, category });
                    rows.push([idCounter++, subTaskSummary, descriptionParts, 'Subtask', impl.jkMaturity || 'Medium', parentId]);
                });
            });
        });
    });

    // Convert rows to CSV string and trigger download
    const csvContent = rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const dateTime = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${systemId}_JiraImport_${dateTime}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`✅ Jira CSV exported with ${rows.length - 1} rows`);

    // Prompt user to confirm upload, then stamp all controls with Jira URLs
    setTimeout(() => {
        const confirmed = confirm(
            `✅ Your Jira CSV has been downloaded.\n\n` +
            `Please upload it into Jira now.\n\n` +
            `Once uploaded successfully, click OK to mark all ${exportedImpls.length} controls with their Jira ticket URL.\n\n` +
            `Click Cancel to skip.`
        );

        if (!confirmed) return;

        exportedImpls.forEach(({ impl, category }) => {
            const sanitizedKey = sanitizeForId(impl.control_number);
            const jiraUrl = buildJiraUrl(impl.control_number);

            if (category === 'Define') {
                const responseKey = `${sanitizedKey}_response`;
                const responseElement = document.querySelector(
                    `input[name="${responseKey}"], textarea[name="${responseKey}"]`
                );
                if (responseElement) responseElement.value = jiraUrl;
                state.capturedData[responseKey] = jiraUrl;
            } else {
                const evidenceKey = `${sanitizedKey}_jkImplementationEvidence`;
                const evidenceElement = document.querySelector(`textarea[name="${evidenceKey}"]`);
                if (evidenceElement) evidenceElement.value = jiraUrl;
                state.capturedData[evidenceKey] = jiraUrl;
            }

            fieldHelper(impl, impl.jkType, 'captureData', state.capturedData);
        });

        const capturedValues = dataCapture.captureAll();
        fileManager.saveProgress(capturedValues);

        alert(`✅ ${exportedImpls.length} controls have been updated with their Jira ticket URLs and saved.`);
    }, 1000);
}
