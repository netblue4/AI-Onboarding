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
                if (!field.jkName) return false;                
                
                 	let statusvalue = 0;
                 	if(field.jkType != 'requirement'){
                 		statusvalue = this.state.capturedData[templateManager.sanitizeForId(field.control_number) + '_jkImplementationStatus'];
                 	} else {
                 		statusvalue = this.state.capturedData[templateManager.sanitizeForId(field.requirement_control_number) + '_jkSoa'];
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
    if (!this.state.templateData) return fields;

    for (const [phaseName, stepsInPhase] of Object.entries(this.state.templateData)) {
        stepsInPhase.forEach(step => {
            if (!step.Fields) return;

            const extractFieldsForRole = (field, isInRole = false) => {
                if (!field) return;

                // 1. Check/Update inRole
                let currentInRole = isInRole;
                if (field.Role) {
                    const fieldRoles = String(field.Role).split(',').map(r => r.trim());
                    currentInRole = fieldRoles.includes(role);
                }
                
                let currentIsRequirement = false;
                if (field.jkType === 'requirement') {
                    currentIsRequirement = true;
                }             
                   
                let currentIsControl = false;
                if (field.jkImplementationEvidence) {
                    currentIsControl = true;
                } 
                
				let currentIsApplicable = false;
				if (field.requirement_control_number) {
					// 1. Split the string into an array of IDs and trim whitespace
					const controlIds = String(field.requirement_control_number).split(',').map(id => id.trim());
				
					// 2. Check if at least one ID is 'Applicable'
					// This exits immediately (returns true) the moment it finds a match
					const hasAnyApplicable = controlIds.some(id => {
						const sanitizeId = templateManager.sanitizeForId(id);
						const soa = this.state.capturedData[sanitizeId + '_jkSoa'];
						return soa === 'Applicable';
					});
				
					// 3. Set the final applicability status
					currentIsApplicable = hasAnyApplicable || currentIsRequirement;
				}
                
                const isApplicableControl = (currentIsControl && currentIsApplicable);
                
                const isValidField = (field.jkType != 'fieldGroup' 
                && field.jkType != 'risk' 
                && field.jkType != 'plan'
                && field.jkType != 'Auto generated number')
                
                const isApplicableField = (!currentIsControl && (currentIsApplicable));
                
                
                // 2. Process the field if authorized
                if(currentInRole && (isApplicableControl || isApplicableField)) {
						fields.push(field);
				}
                //if(currentInRole) {
				//	if (isApplicableControl || currentIsRequirement || isValidField || isApplicableField) {
				//		fields.push(field);
				//	}
				//}

                // 3. Recurse: Pass the 'currentFieldAuthorized' status down
                if (field.Fields && Array.isArray(field.Fields)) {
                    const currfieldRoles = String(field.Role).split(',').map(r => r.trim());
                    const isInRole = currfieldRoles.includes(role);
                    field.Fields.forEach(f => extractFieldsForRole(f, isInRole));
                }
                
                if (field.Fields && Array.isArray(field.Fields)) {
					// 1. Convert the Role string into a clean array of roles
					const currfieldRoles = String(field.Role || "").split(',').map(r => r.trim());
				
					// 2. Check if the provided 'role' matches any of the roles in the array
					// .some() will return true and stop iterating as soon as a match is found
					const isInRole = currfieldRoles.some(r => r === role);
				
					// 3. Recurse through child fields, passing the authorization status
					field.Fields.forEach(f => extractFieldsForRole(f, isInRole));
				}

                if (field.controls && Array.isArray(field.controls)) {
                    const currfieldRoles = String(field.Role).split(',').map(r => r.trim());
                    const isInRole = currfieldRoles.includes(role);
                    field.controls.forEach(c => extractFieldsForRole(c, isInRole));
                }
            };

            step.Fields.forEach(f => extractFieldsForRole(f));
        });
    }
    return fields;
}

//                    const currfieldRoles = String(field.Role).split(',').map(r => r.trim());
//                    const isInRole = currfieldRoles.includes(role);

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
        
			if(this.state.currentRole === "Requirements Map"){
			    contentRenderer.renderMindMap();
			}
			if (this.state.currentRole === "Approver" ) {
				contentRenderer.renderAIAssessmentView();
			} else {
				contentRenderer.render();
			}

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
                if (!field.jkName) return false;
					const statusvalue = this.state.capturedData[templateManager.sanitizeForId(field.control_number) + '_jkImplementationStatus'];
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