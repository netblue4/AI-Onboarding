// ============================================
// 6. scripts/dataCapture.js
// ============================================
class DataCapture {
    constructor(stateManager, templateManager) {
        this.state = stateManager;
        this.templateManager = templateManager;
    }

    captureAll() {
        if (!this.state.templateData) return {};

        const currentData = { ...this.state.capturedData };

        for (const [phaseName, stepsInPhase] of Object.entries(this.state.templateData)) {
            stepsInPhase.forEach(step => {
                if (!step.Fields) return;

                step.Fields.forEach(field => {
                    this.captureField(field, currentData);
                });
            });
        }

        return currentData;
    }

    captureField(field, currentData) {
        if (!field) return;

        const fieldType = field.FieldType;
        const fieldName = field.FieldName;
        const fieldControlNumber = field.control_number;

        // Skip auto-generated and fieldGroup types
        if (fieldType === 'Auto generated number' || fieldType === 'fieldGroup') {
            if (field.controls && Array.isArray(field.controls)) {
                field.controls.forEach(f => this.captureField(f, currentData));
            }
            return;
        }

        if (!fieldName) return;

        const sanitizedId = this.templateManager.sanitizeForId(fieldControlNumber);

        // Handle MultiSelect (checkboxes)
        if (fieldType && fieldType.startsWith('MultiSelect')) {
            this.captureMultiSelect(field, sanitizedId, fieldName, currentData);
        }
        // Handle Option box (radio buttons)
        else if (fieldType && fieldType.startsWith('Option box with values')) {
            this.captureOptionBox(field, sanitizedId, fieldName, currentData);
        }
        // Handle requirement fields
        else if (fieldType === 'requirement') {
            this.captureRequirement(field, this.templateManager.sanitizeForId(field.requirement_control_number), fieldName, currentData);
        }    
        // Handle risk fields
        else if (fieldType === 'risk') {
            this.captureRisk(field, sanitizedId, fieldName, currentData);
        }
        // Handle plan fields
        else if (fieldType === 'plan') {
            this.capturePlan(field, sanitizedId, fieldName, currentData);
        }
        // Handle comply fields
        else if (fieldType === 'comply') {
            this.captureComply(fieldName, currentData);
        }
        // Handle standard fields
        else {
            this.captureStandard(field, sanitizedId, fieldName, currentData);
        }

        // Recurse into nested fields
        if (field.Fields && Array.isArray(field.Fields)) {
            field.Fields.forEach(f => this.captureField(f, currentData));
        }
    }

    captureMultiSelect(field, sanitizedId, fieldName, currentData) {
        const checkboxes = document.querySelectorAll(`input[type="checkbox"][name="${sanitizedId}_response"]:checked`);
        if (checkboxes.length > 0) {
        	currentData[field.control_number] = fieldName;
			currentData[sanitizedId + "_response"] = Array.from(checkboxes).map(cb => cb.value);
        } else if (document.querySelector(`input[type="checkbox"][name="${sanitizedId}_response"]`)) {
            delete currentData[sanitizedId + "_response"];
        }
    }

    captureOptionBox(field, sanitizedId, fieldName, currentData) {
        const checked = document.querySelector(`input[name="${sanitizedId}_response"]:checked`);
        if (checked) {
           currentData[field.control_number] = fieldName;
            currentData[sanitizedId + "_response"] = checked.value;
        } else if (document.querySelector(`input[name="${sanitizedId}_response"]`)) {
            delete currentData[sanitizedId] + "_response";
        }
    }

captureRequirement(field, sanitizedId, fieldName, currentData) {
    const requirementSelect = document.querySelector(`select[name="${sanitizedId}_requirement__soa"]`);
    // Only update if value exists and has changed
    if (requirementSelect && (requirementSelect.value && requirementSelect.value != 'Select')) {
        if (currentData[sanitizedId + '_requirement__soa'] !== requirementSelect.value) {
            currentData[sanitizedId + '_requirement'] = field.FieldName +': ' + field.FieldText;
            currentData[sanitizedId + '_requirement__soa'] = requirementSelect.value;
        }
    } else if (requirementSelect && currentData[sanitizedId + '_requirement__soa']) {
        // Only delete if it previously had a value
        delete currentData[sanitizedId + '_requirement__soa'];
        delete currentData[sanitizedId + '_requirement']
    }
}
captureRisk(field, sanitizedId, fieldName, currentData) {
    const riskSelect = document.querySelector(`select[name="${sanitizedId}"]`);
    
    // Only update if value exists and has changed
    if (riskSelect && riskSelect.value) {
        if (currentData[fieldName] !== riskSelect.value) {
            currentData[fieldName] = riskSelect.value;
        }
    } else if (riskSelect && currentData[fieldName]) {
        // Only delete if it previously had a value
        delete currentData[fieldName];
    }

    if (field.controls && Array.isArray(field.controls)) {
        field.controls.forEach(control => {
            const controlKey = this.templateManager.sanitizeForId(control.control_number);
            const statusElement = document.querySelector(`select[name="${controlKey}_status"]`);
            const evidenceElement = document.querySelector(`textarea[name="${controlKey}_evidence"]`);

            const statusValue = statusElement ? statusElement.value : null;
            const evidenceValue = evidenceElement ? evidenceElement.value : null;

			if (
				(statusValue !== null && statusValue !== "") || 
				(evidenceValue !== null && evidenceValue !== "")
			) {
				currentData[control.control_number] = control.control_description;
				currentData[`${controlKey}_status`] = statusValue;
				currentData[`${controlKey}_evidence`] = evidenceValue;
			}
            
        });
    }
}

capturePlan(field, sanitizedId, fieldName, currentData) {
    if (field.controls && Array.isArray(field.controls)) {
        field.controls.forEach((criteria, index) => {
            const criteriaKey = this.templateManager.sanitizeForId(criteria.control_number);

            
            const textareaElement = document.querySelector(`textarea[name="${criteriaKey}_evidence"]`);
            
            if (textareaElement && textareaElement.value) {
                // Only update if value has changed
                if (currentData[criteriaKey] !== textareaElement.value) {
                    currentData[criteria.control_number] = criteria.control_description;
                    currentData[`${criteriaKey}_evidence`] = textareaElement.value;
                }
            } else if (textareaElement && currentData[criteriaKey]) {
                // Only delete if it previously had a value
                delete currentData[criteriaKey];
            }
        });
    }
}

    captureComply(fieldName, currentData) {
        const complySelects = document.querySelectorAll('select[name$="_complystatus"]');
        const complyData = {};

        complySelects.forEach(select => {
            const selectName = select.name;
            if (select.value && select.value !== 'Select') {
                complyData[selectName] = select.value;
            }
        });

        if (Object.keys(complyData).length > 0) {
            currentData[fieldName] = complyData;
        } else {
            delete currentData[fieldName];
        }
    }

    captureStandard(field, sanitizedId, fieldName, currentData) {
        const inputElement = document.getElementById(sanitizedId + "_response");

        if (inputElement) {
            if (inputElement.tagName === 'SELECT' || inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
                if (inputElement.value) {
                    currentData[field.control_number] = fieldName;
                    currentData[sanitizedId + "_response"] = inputElement.value;
                } else {
                    delete currentData[sanitizedId];
                }
            }
        }
    }
}

const dataCapture = new DataCapture(state, templateManager);