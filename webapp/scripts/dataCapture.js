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
        this.templateManager.fieldHelper(field, fieldType, "captureData", currentData);

        // Recurse into nested fields
        if (field.Fields && Array.isArray(field.Fields)) {
            field.Fields.forEach(f => this.captureField(f, currentData));
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

}

const dataCapture = new DataCapture(state, templateManager);