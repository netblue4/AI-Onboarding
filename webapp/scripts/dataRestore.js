// ============================================
// 7. scripts/dataRestore.js
// ============================================
/**
 * Restores previously-saved form values into the DOM.
 */
class DataRestore {
    constructor(stateManager) {
        this.state = stateManager;
    }

    /**
     * Restores a single field's saved value into its DOM element.
     * @param {Object} field - The field definition object from the template
     */
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
            fieldHelper(field, field.jkType, "retrieveData");
        }, 100);
    }
}

const dataRestore = new DataRestore(state);
