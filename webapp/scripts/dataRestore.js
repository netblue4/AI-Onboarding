// ============================================
// 7. scripts/dataRestore.js
// ============================================
class DataRestore {
    constructor(stateManager, templateManager) {
        this.state = stateManager;
        this.templateManager = templateManager;
    }

    restoreFieldValues(field) {
        if (!field.FieldName) return;

        setTimeout(() => {
            const sanitizedId = this.templateManager.sanitizeForId(field.FieldName);
            const fieldType = field.FieldType;

            if (fieldType && fieldType.startsWith('MultiSelect')) {
                this.restoreMultiSelect(sanitizedId, field.FieldName);
            } else if (fieldType && fieldType.startsWith('Option box with values')) {
                this.restoreOptionBox(sanitizedId, field.FieldName);
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
        const allCheckboxes = document.querySelectorAll(`input[type="checkbox"][name="${sanitizedId}"]`);
        allCheckboxes.forEach(cb => cb.checked = false);

        const selectedValues = this.state.capturedData[fieldName];
        if (Array.isArray(selectedValues)) {
            selectedValues.forEach(value => {
                const checkbox = document.querySelector(`input[type="checkbox"][name="${sanitizedId}"][value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    }

    restoreOptionBox(sanitizedId, fieldName) {
        if (this.state.capturedData.hasOwnProperty(fieldName)) {
            const radioToCheck = document.querySelector(`input[name="${sanitizedId}"][value="${this.state.capturedData[fieldName]}"]`);
            if (radioToCheck) radioToCheck.checked = true;
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
                }

                const evidenceElement = document.querySelector(`textarea[name="${controlKey}_evidence"]`);
                if (evidenceElement && this.state.capturedData[`${controlKey}_evidence`]) {
                    evidenceElement.value = this.state.capturedData[`${controlKey}_evidence`];
                }
            });
        }
    }

    restorePlan(field, sanitizedId) {
        if (field.PlanCriteria && Array.isArray(field.PlanCriteria)) {
            field.PlanCriteria.forEach((criteria, index) => {
                const criteriaKey = `${field.FieldName}_criteria_${index}_evidence`;
                const textareaElements = document.querySelectorAll(`textarea[name="${sanitizedId}_criteria_${index}"]`);

                if (textareaElements.length > 0 && this.state.capturedData[criteriaKey]) {
                    textareaElements[0].value = this.state.capturedData[criteriaKey];
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
        if (this.state.capturedData.hasOwnProperty(fieldName)) {
            const inputElement = document.getElementById(sanitizedId);
            if (inputElement) {
                inputElement.value = this.state.capturedData[fieldName];
            }
        }
    }
}

const dataRestore = new DataRestore(state, templateManager);
