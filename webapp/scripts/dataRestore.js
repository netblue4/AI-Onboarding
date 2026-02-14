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
            this.templateManager.fieldHelper(field, fieldType, "retrieveData");
        }, 100);
    }
}

const dataRestore = new DataRestore(state, templateManager);
