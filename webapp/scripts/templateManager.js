// ============================================
// scripts/templateManager.js
// ============================================
/**
 * Manages template loading, parsing, and utility functions
 */
class TemplateManager {
    constructor(stateManager) {
        this.state = stateManager;
    }

    /**
     * Load and parse the template JSON file
     * @returns {Promise<Object>} The parsed template data
     */
    async load() {
        try {
            const response = await fetch(CONFIG.TEMPLATE_FILE);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            const data = await response.json();
            this.state.setTemplateData(data);
            
            // Make globally available for field handlers
            window.originalWebappData = data;
            
            return data;
        } catch (error) {
            console.error('Error loading template:', error);
            throw error;
        }
    }

    /**
     * Extract all field names from template recursively
     * @returns {Set<string>} Set of all field names
     */
    getAllFieldNames() {
        const fieldNames = new Set();
        
        if (!this.state.templateData) return fieldNames;

        for (const [phaseName, stepsInPhase] of Object.entries(this.state.templateData)) {
            stepsInPhase.forEach(step => {
                if (!step.Fields) return;

                const extractNames = (field) => {
                    // Add field name if it's a real field (not auto-generated or fieldGroup)
                    if (field.jkName && 
                        field.jkType !== 'Auto generated number' && 
                        field.jkType !== 'fieldGroup') {
                        fieldNames.add(field.jkName);
                    }
                    
                    // Recurse into nested fields
                    if (field.Fields && Array.isArray(field.Fields)) {
                        field.Fields.forEach(extractNames);
                    }
                };

                step.Fields.forEach(extractNames);
            });
        }

        return fieldNames;
    }

    /**
     * Check if a field is new (wasn't in the previous template version)
     * @param {string} fieldName - The field name to check
     * @returns {boolean} True if field is new
     */
    isFieldNew(fieldName) {
        // If no version difference, field is not new
        if (!this.state.loadedVersion || this.state.loadedVersion === CONFIG.CURRENT_TEMPLATE_VERSION) {
            return false;
        }
        
        // Field is new if it's not in captured data
        return !this.state.capturedData.hasOwnProperty(fieldName);
    }

    /**
     * Get all steps from template
     * @returns {Array} Array of all steps
     */
    getAllSteps() {
        const steps = [];
        
        if (!this.state.templateData) return steps;

        for (const [phaseName, stepsInPhase] of Object.entries(this.state.templateData)) {
            stepsInPhase.forEach(step => {
                steps.push({
                    phase: phaseName,
                    step: step
                });
            });
        }

        return steps;
    }

    /**
     * Get steps filtered by role
     * @param {string} role - The role to filter by
     * @returns {Array} Array of steps relevant to the role
     */
    getStepsByRole(role) {
        const steps = [];
        
        if (!this.state.templateData) return steps;

        for (const [phaseName, stepsInPhase] of Object.entries(this.state.templateData)) {
            stepsInPhase.forEach(step => {
                if (!step.Fields) return;
                
                const hasRoleField = this.hasRoleInFields(step.Fields, role);
                if (hasRoleField) {
                    steps.push({
                        phase: phaseName,
                        step: step
                    });
                }
            });
        }

        return steps;
    }

    /**
     * Check if any field in the array belongs to the specified role
     * @param {Array} fields - Array of fields to check
     * @param {string} role - The role to check for
     * @returns {boolean} True if role is found
     */
    hasRoleInFields(fields, role) {
        if (!fields || !Array.isArray(fields)) return false;

        for (const field of fields) {
            if (field.Role && String(field.Role).split(',').map(r => r.trim()).includes(role)) {
                return true;
            }

            // Check nested fields
            if (field.Fields && this.hasRoleInFields(field.Fields, role)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Calculates role and applicability flags for a field.
     * Single source of truth for field filtering logic used by ContentRenderer and RoleProgressTracker.
     * @param {Object} field - The field definition object
     * @param {string} role - The role to check against
     * @param {boolean} [isInRole=false] - Whether a parent node already matched this role
     * @param {Object} [capturedData={}] - Current captured data for SOA lookups
     * @returns {{ inRole: boolean, isRequirement: boolean, isControl: boolean, isApplicable: boolean }}
     */
    getFieldApplicability(field, role, isInRole = false, capturedData = {}) {
        let inRole = isInRole;
        if (field.Role) {
            const fieldRoles = String(field.Role).split(',').map(r => r.trim());
            inRole = fieldRoles.includes(role);
        }

        const isRequirement = field.jkType === 'requirement';
        const isControl = !!field.jkImplementationEvidence;

        let isApplicable = false;
        if (field.requirement_control_number) {
            const controlNumbers = String(field.requirement_control_number).split(',').map(id => id.trim());
            const hasApplicableControl = controlNumbers.some(id => {
                return capturedData[sanitizeForId(id) + '_jkSoa'] === 'Applicable';
            });
            isApplicable = hasApplicableControl || isRequirement;
        }

        return { inRole, isRequirement, isControl, isApplicable };
    }
}

const templateManager = new TemplateManager(state);
