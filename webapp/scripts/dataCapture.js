// ============================================
// 6. scripts/dataCapture.js
// ============================================
/**
 * Captures form data from the current DOM state and stores it in the application state.
 */
class DataCapture {
    constructor(stateManager, templateManager) {
        this.state = stateManager;
        this.templateManager = templateManager;
    }

    /**
     * Captures all field values from the current form state and returns them.
     * @returns {Object} An object containing all captured field values
     */
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

    /**
     * Captures a single field's value into currentData.
     * @param {Object} field - The field definition object from the template
     * @param {Object} currentData - The data object to write the captured value into
     */
    captureField(field, currentData) {
        if (!field) return;

        const fieldType = field.jkType;
        const fieldName = field.jkName;
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
        fieldHelper(field, fieldType, "captureData", currentData);

        // Recurse into nested fields
        if (field.Fields && Array.isArray(field.Fields)) {
            field.Fields.forEach(f => this.captureField(f, currentData));
        }
    }

    /**
     * Captures compliance status values for a field.
     * @param {string} fieldName - The field name key to store the compliance data under
     * @param {Object} currentData - The data object to write the captured values into
     */
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

}

const dataCapture = new DataCapture(state, templateManager);