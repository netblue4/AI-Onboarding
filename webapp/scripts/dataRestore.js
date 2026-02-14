// ============================================
// 7. scripts/dataRestore.js
// ============================================
class DataRestore {
    constructor(stateManager, templateManager) {
        this.state = stateManager;
        this.templateManager = templateManager;
    }

    restoreFieldValues(field) {
    
        const fieldType = field.jkType;
        const fieldName = field.jkName;
        const fieldControlNumber = field.control_number;

        // Skip auto-generated and fieldGroup types
        if (fieldType === 'Auto generated number' || fieldType === 'fieldGroup') {
            if (field.Fields && Array.isArray(field.Fields)) {
                field.Fields.forEach(f => this.restoreFieldValues(f));
            }
            return;
        }
    
    
        if (!field.jkName) return;

        setTimeout(() => {
            const sanitizedId = this.templateManager.sanitizeForId(field.control_number);
            const fieldType = field.jkType;

            if (fieldType && fieldType.startsWith('MultiSelect')) {
                this.templateManager.fieldHelper(field, fieldType, "retrieveData");
            } else if (fieldType && fieldType.startsWith('Option box with values')) {
                this.restoreOptionBox(sanitizedId, field.jkName);
            } else if (fieldType === 'requirement') {
                this.templateManager.fieldHelper(field, fieldType, "retrieveData");
            } else if (fieldType === 'risk') {
                this.templateManager.fieldHelper(field, fieldType, "retrieveData");
            } else if (fieldType === 'plan') {
                this.templateManager.fieldHelper(field, fieldType, "retrieveData");
            } else if (fieldType === 'comply') {
                this.restoreComply(field.jkName);
            } else {
                this.restoreStandard(sanitizedId, field.jkName);
            }
        }, 100);
    }

//    restoreMultiSelect(sanitizedId, fieldName) {
//        const allCheckboxes = document.querySelectorAll(`input[type="checkbox"][name="${sanitizedId}_response"]`);
//        allCheckboxes.forEach(cb => cb.checked = false);
//
//        const selectedValues = this.state.capturedData[sanitizedId + "_response"];
//        if (Array.isArray(selectedValues)) {
//            selectedValues.forEach(value => {
//                const checkbox = document.querySelector(`input[type="checkbox"][name="${sanitizedId}_response"][value="${value}"]`);
//                if (checkbox) checkbox.checked = true;
//            });
//        }
//    }

    restoreOptionBox(sanitizedId, fieldName) {
        if (this.state.capturedData.hasOwnProperty(sanitizedId)) {
            const radioToCheck = document.querySelector(`input[name="${sanitizedId}_response"][value="${this.state.capturedData[fieldName]}"]`);
            if (radioToCheck) radioToCheck.checked = true;
        }
    }

	//restoreRequirement(field, sanitizedId){	
    //    this.templateManager.fieldHelper(field,"retrieveData");
        //if (this.state.capturedData[sanitizedId  + '_jkSoa']) { 
        //    const requirementSelect = document.querySelector(`select[name="${sanitizedId}_jkSoa"]`);
        //    if (requirementSelect) requirementSelect.value = this.state.capturedData[sanitizedId + '_jkSoa'];
        //}	
	//}
	
    //restoreRisk(field, sanitizedId) {
    //    if (this.state.capturedData[field.jkName]) {
    //        const riskSelect = document.querySelector(`select[name="${sanitizedId}"]`);
    //        if (riskSelect) riskSelect.value = this.state.capturedData[field.jkName];
    //    }
//
//        if (field.controls && Array.isArray(field.controls)) {
//            field.controls.forEach(control => {
//                const controlKey = this.templateManager.sanitizeForId(control.control_number);
//
//                const statusElement = document.querySelector(`select[name="${controlKey}_jkImplementationStatus"]`);
//                if (statusElement && this.state.capturedData[`${controlKey}_jkImplementationStatus`]) {
//                    statusElement.value = this.state.capturedData[`${controlKey}_jkImplementationStatus`];
//                }
//
//                const evidenceElement = document.querySelector(`textarea[name="${controlKey}_jkImplementationEvidence"]`);
//                if (evidenceElement && this.state.capturedData[`${controlKey}_jkImplementationEvidence`]) {
//                    evidenceElement.value = this.state.capturedData[`${controlKey}_jkImplementationEvidence`];
//                }
//            });
//        }
//    }

//    restorePlan(field, sanitizedId) {
//        if (field.controls && Array.isArray(field.controls)) {
//            field.controls.forEach((criteria, index) => {
//                            	
//            	const controlKey = this.templateManager.sanitizeForId(criteria.control_number);
//                
//                const evidenceElement = document.querySelector(`textarea[name="${controlKey}_jkImplementationEvidence"]`);
//                if (evidenceElement && this.state.capturedData[`${controlKey}_jkImplementationEvidence`]) {
//                    evidenceElement.value = this.state.capturedData[`${controlKey}_jkImplementationEvidence`];
//                } 
//            });
//        }
//    }

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
