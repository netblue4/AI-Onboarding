// ============================================
// scripts/roleProgress.js (FIXED)
// ============================================
/**
 * Manages role completion progress tracking and UI
 */
class RoleProgressTracker {
    constructor(stateManager) {
        this.state = stateManager;
        this.templateManager = null; // Will be set later
    }

    /**
     * Set the template manager reference (called after templateManager is created)
     */
    setTemplateManager(templateManager) {
        this.templateManager = templateManager;
    }

    /**
     * Initialize the role progress UI with all roles
     */
    initialize() {
        const container = document.getElementById('role-progress-container');
        if (!container) {
            console.error('role-progress-container element not found');
            return;
        }

        console.log('Initializing role progress tracker');

        container.innerHTML = '';

        CONFIG.ROLES.forEach(role => {
            const item = document.createElement('div');
            item.className = 'role-progress-item';
            item.id = `progress-${role}`;
            item.onclick = () => this.selectRole(role);

            item.innerHTML = `
                <div class="role-progress-name">${role}</div>
                <div class="role-progress-bar">
                    <div class="role-progress-fill" style="width: 0%"></div>
                </div>
                <div class="role-progress-number">0 of 0</div>
            `;

            container.appendChild(item);
        });

        this.update();
    }

    /**
     * Update progress bars for all roles based on captured data
     */
    update() {
        CONFIG.ROLES.forEach(role => {
            const progressItem = document.getElementById(`progress-${role}`);
            if (!progressItem) return;

            const roleFields = this.getFieldsForRole(role);

            // Handle roles with no fields
            if (roleFields.length === 0) {
                progressItem.classList.remove('completed', 'in-progress', 'current');
                progressItem.classList.add('completed');
                progressItem.querySelector('.role-progress-fill').style.width = '100%';
                //progressItem.querySelector('.role-progress-text').textContent = 'N/A';
                progressItem.querySelector('.role-progress-number').textContent = 'N/A';
                return;
            }

            // Count completed fields
            const completedFields = roleFields.filter(field => {
                if (!field.FieldName) return false;                
                
                 	let statusvalue = 0;
                 	if(field.FieldType != 'requirement'){
                 		statusvalue = this.state.capturedData[templateManager.sanitizeForId(field.control_number) + '_status'];
                 	} else {
                 		statusvalue = this.state.capturedData[templateManager.sanitizeForId(field.requirement_control_number) + '_requirement__soa'];
                 	}
                
					const evidencesvalue = this.state.capturedData[templateManager.sanitizeForId(field.control_number) + '_evidence'];
					const value = this.state.capturedData[templateManager.sanitizeForId(field.control_number) + '_response'];
					
					const isStatusValid = statusvalue !== undefined && statusvalue !== null && statusvalue !== '';
					const isEvidenceValid = evidencesvalue !== undefined && evidencesvalue !== null && evidencesvalue !== '';
					const isValueValid = value !== undefined && value !== null && value !== '';
					
					return isStatusValid || isEvidenceValid || isValueValid;

            }).length;

            const percentage = Math.round((completedFields / roleFields.length) * 100);

            // Update progress bar
            progressItem.querySelector('.role-progress-fill').style.width = percentage + '%';
            //progressItem.querySelector('.role-progress-text').textContent = percentage + '%';
            progressItem.querySelector('.role-progress-number').textContent = completedFields + ' of ' + roleFields.length;

            // Update status class
            progressItem.classList.remove('completed', 'in-progress', 'current');
            
            if (role === this.state.currentRole) {
                progressItem.classList.add('current');
            } else if (percentage === 100) {
                progressItem.classList.add('completed');
            } else if (percentage > 0) {
                progressItem.classList.add('in-progress');
            }
        });
    }

    /**
     * Get all fields that belong to a specific role
     * @param {string} role - The role to get fields for
     * @returns {Array} Array of field objects for the role
     */
    getFieldsForRole(role) {
        const fields = [];

        if (!this.state.templateData) {
            console.warn('Template data not available in roleProgressTracker');
            return fields;
        }

        for (const [phaseName, stepsInPhase] of Object.entries(this.state.templateData)) {
            stepsInPhase.forEach(step => {
                if (!step.Fields) return;

                const extractFieldsForRole = (field) => {
                    if (!field) return;


                    // Check if field matches the role
                    if (field.Role) {
                        const fieldRoles = String(field.Role)
                            .split(',')
                            .map(r => r.trim());
                        
                        if (fieldRoles.includes(role)) {
                            // Only add real fields, not auto-generated or fieldGroups
                            if (field.FieldName && 
                                field.FieldType !== 'Auto generated number' && 
                                field.FieldType !== 'fieldGroup' &&
                                field.FieldType !== 'risk' &&
                                field.FieldType !== 'plan') { 
                                
								//If the field is associated with a requirement that has been marked as 'Not Applicable' 
								//Then do not count the field, unless its a requirement.
								const sanitizeId = templateManager.sanitizeForId(field.requirement_control_number);
								const soa = this.state.capturedData[sanitizeId + '_requirement__soa'];
								if ((!soa || soa === 'Not Applicable' || soa === 'Select') && field.FieldType != 'requirement') { 
									return;
								}	
					
                                fields.push(field);
                            }
                        }
                    }

                    // Recurse into nested fields
                    if (field.Fields && Array.isArray(field.Fields)) {
                        field.Fields.forEach(extractFieldsForRole);
                    }
                    if (field.controls && Array.isArray(field.controls)) {
                        field.controls.forEach(extractFieldsForRole);
                    }                    
                };

                step.Fields.forEach(extractFieldsForRole);
            });
        }

        return fields;
    }

    /**
     * Switch to a different role
     * @param {string} role - The role to select
     */
    selectRole(role) {
        //const roleDropdown = document.getElementById('role-dropdown');
       // if (roleDropdown) {
       //     roleDropdown.value = role;
       // }
        this.state.setCurrentRole(role);
        this.update();
        
        // Trigger content rendering
        if (typeof contentRenderer !== 'undefined' && contentRenderer) {
            contentRenderer.render();
        }
    }

    /**
     * Get completion statistics for all roles
     * @returns {Object} Statistics object with completion data
     */
    getCompletionStats() {
        const stats = {};
        let totalFields = 0;
        let totalCompleted = 0;

        CONFIG.ROLES.forEach(role => {
            const roleFields = this.getFieldsForRole(role);
            const completedFields = roleFields.filter(field => {
                if (!field.FieldName) return false;
					const statusvalue = this.state.capturedData[templateManager.sanitizeForId(field.control_number) + '_status'];
					const evidencesvalue = this.state.capturedData[templateManager.sanitizeForId(field.control_number) + '_evidence'];
					const value = this.state.capturedData[templateManager.sanitizeForId(field.control_number)];
					
					const isStatusValid = statusvalue !== undefined && statusvalue !== null && statusvalue !== '';
					const isEvidenceValid = evidencesvalue !== undefined && evidencesvalue !== null && evidencesvalue !== '';
					const isValueValid = value !== undefined && value !== null && value !== '';
					
					return isStatusValid || isEvidenceValid || isValueValid;
            }).length;

            const percentage = roleFields.length > 0 
                ? Math.round((completedFields / roleFields.length) * 100)
                : 100;

            stats[role] = {
                total: roleFields.length,
                completed: completedFields,
                percentage: percentage
            };

            totalFields += roleFields.length;
            totalCompleted += completedFields;
        });

        return {
            byRole: stats,
            overall: {
                total: totalFields,
                completed: totalCompleted,
                percentage: totalFields > 0 
                    ? Math.round((totalCompleted / totalFields) * 100)
                    : 0
            }
        };
    }
}

// Create global instance with just state manager (templateManager will be set later)
const roleProgressTracker = new RoleProgressTracker(state);