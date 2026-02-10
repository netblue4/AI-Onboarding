// ============================================
// 7. scripts/dataRestore.js
// ============================================
class DataRestore {
    constructor(stateManager, templateManager) {
        this.state = stateManager;
        this.templateManager = templateManager;
    }

    restoreFieldValues(field) {
    
        const fieldType = field.FieldType;
        const fieldName = field.FieldName;
        const fieldControlNumber = field.control_number;

        // Skip auto-generated and fieldGroup types
        if (fieldType === 'Auto generated number' || fieldType === 'fieldGroup') {
            if (field.Fields && Array.isArray(field.Fields)) {
                field.Fields.forEach(f => this.restoreFieldValues(f));
            }
            return;
        }
    
    
        if (!field.FieldName) return;

        setTimeout(() => {
            const sanitizedId = this.templateManager.sanitizeForId(field.control_number);
            const fieldType = field.FieldType;

            if (fieldType && fieldType.startsWith('MultiSelect')) {
                this.restoreMultiSelect(sanitizedId, field.FieldName);
            } else if (fieldType && fieldType.startsWith('Option box with values')) {
                this.restoreOptionBox(sanitizedId, field.FieldName);
            } else if (fieldType === 'requirement') {
                this.restoreRequirement(field, this.templateManager.sanitizeForId(field.requirement_control_number));
            } else if (fieldType === 'risk') {
                this.restoreRisk(field, sanitizedId);
            } else if (fieldType === 'plan') {
                this.restorePlan(field, sanitizedId);
            } else if (fieldType === 'comply') {
                this.restoreComply(field.FieldName);
            } else {
                this.restoreStandard(sanitizedId, field.FieldName);
            }
        }, 100);
    }

    restoreMultiSelect(sanitizedId, fieldName) {
        const allCheckboxes = document.querySelectorAll(`input[type="checkbox"][name="${sanitizedId}_response"]`);
        allCheckboxes.forEach(cb => cb.checked = false);

        const selectedValues = this.state.capturedData[sanitizedId + "_response"];
        if (Array.isArray(selectedValues)) {
            selectedValues.forEach(value => {
                const checkbox = document.querySelector(`input[type="checkbox"][name="${sanitizedId}_response"][value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    }

    restoreOptionBox(sanitizedId, fieldName) {
        if (this.state.capturedData.hasOwnProperty(sanitizedId)) {
            const radioToCheck = document.querySelector(`input[name="${sanitizedId}_response"][value="${this.state.capturedData[fieldName]}"]`);
            if (radioToCheck) radioToCheck.checked = true;
        }
    }

	restoreRequirement(field, sanitizedId){	
        if (this.state.currentData[sanitizedId  + '_soa') { 
            const requirementSelect = document.querySelector(`select[name="${sanitizedId}_soa"]`);
            if (requirementSelect) requirementSelect.value = this.state.capturedData[sanitizedId + '_soa'];
        }	
	}
	
    restoreRisk(field, sanitizedId) {
        if (this.state.capturedData[field.FieldName]) {
            const riskSelect = document.querySelector(`select[name="${sanitizedId}"]`);
            if (riskSelect) riskSelect.value = this.state.capturedData[field.FieldName];
        }

        if (field.controls && Array.isArray(field.controls)) {
            field.controls.forEach(control => {
                const controlKey = this.templateManager.sanitizeForId(control.control_number);

                const statusElement = document.querySelector(`select[name="${controlKey}_status"]`);
                if (statusElement && this.state.capturedData[`${controlKey}_status`]) {
                    statusElement.value = this.state.capturedData[`${controlKey}_status`];
                    //control.control_status = this.state.capturedData[`${controlKey}_status`]; 
                }

                const evidenceElement = document.querySelector(`textarea[name="${controlKey}_evidence"]`);
                if (evidenceElement && this.state.capturedData[`${controlKey}_evidence`]) {
                    evidenceElement.value = this.state.capturedData[`${controlKey}_evidence`];
                    //control.control_evidence = this.state.capturedData[`${controlKey}_evidence`];      
                }
            });
        }
    }

    restorePlan(field, sanitizedId) {
        if (field.controls && Array.isArray(field.controls)) {
            field.controls.forEach((criteria, index) => {
                            	
            	const controlKey = this.templateManager.sanitizeForId(criteria.control_number);
                
                const evidenceElement = document.querySelector(`textarea[name="${controlKey}_evidence"]`);
                if (evidenceElement && this.state.capturedData[`${controlKey}_evidence`]) {
                    evidenceElement.value = this.state.capturedData[`${controlKey}_evidence`];
                    //criteria.control_evidence = this.state.capturedData[`${controlKey}_evidence`];   
                } 
            });
        }
    }

    restoreComply(fieldName) {
        const complyData = this.state.capturedData[fieldName];
        if (complyData && typeof complyData === 'object') {
            for (const [selectName, selectValue] of Object.entries(complyData)) {
                const select = document.querySelector(`select[name="${selectName}"]`);
                if (select) {
                    select.value = selectValue;
                }
            }
        }
    }

    restoreStandard(sanitizedId, fieldName) {
        if (this.state.capturedData.hasOwnProperty(sanitizedId + "_response")) {
            const inputElement = document.getElementById(sanitizedId + "_response");
            if (inputElement) {
                inputElement.value = this.state.capturedData[sanitizedId + "_response"];
            }
        }
    }
}

const dataRestore = new DataRestore(state, templateManager);
