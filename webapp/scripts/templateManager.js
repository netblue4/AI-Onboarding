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
     * Convert a field name to a safe HTML ID attribute
     * @param {string} text - The text to sanitize
     * @returns {string} Sanitized text safe for use as ID
     */
    sanitizeForId(text) {
        if (typeof text !== 'string') return '';
        return text.replace(/[^a-zA-Z0-9_]/g, '_');
    }


	//const myJkTypes = [
	//	"requirement",      // Standard compliance requirement
	//	"fieldGroup",       // A container for other fields or controls
	//	"MultiSelect",      // Fields with multiple options (e.g., "MultiSelect:PDF/Manual")
	//	"TextBox",          // Standard text entry fields
	//	"Option box",       // Yes/No selection boxes
	//	"Dropdown box",     // Selection list (e.g., Low/Medium/High)
	//	"risk",             // High-level risk definition
	//	"risk_control",     // Specific control addressing a risk
	//	"plan",             // Test or implementation plan
	//	"test_control",     // Specific control for a test plan
	//	"comply"            // The special field type for the compliance mapping
	//];
			
	 //     //potential property values to query
	 //     "requirement_control_number": 
	 //     "control_number": 
	 //     “jkName" 
	 //     “jkText": 
	 //     "jkType”: "test_control"
	 //     “jkObjective”: 
	 //     
	 //     “jkImplementationStatus" 
	 //     “jkImplementationEvidence": 
	 //     “jkSoa": 	
	 //     "_response"	
	 
	fieldStoredValue(field, implementationStatus = false) {
		if (!field || !field.jkType) return null;
	
		// Clean the type (e.g., "MultiSelect:PDF" -> "MultiSelect")
		const cleanType = String(field.jkType).split(':')[0];
	    let sanitizedId = 0;
		switch (cleanType) {
			case "requirement":
			    sanitizedId = this.sanitizeForId(field.requirement_control_number);
				return this.state.capturedData[sanitizedId + '_jkSoa'];	
			case "MultiSelect":
				if (implementationStatus) {
					return "";
				}
				sanitizedId = this.sanitizeForId(field.control_number);
				return this.state.capturedData[sanitizedId + "_response"];
			case "risk_control":
			case "test_control":	
			    sanitizedId = this.sanitizeForId(field.control_number);
				if (implementationStatus) {
					return this.state.capturedData[sanitizedId + "_jkImplementationStatus"];
				}
				return this.state.capturedData[sanitizedId + "_jkImplementationEvidence"];				
			default:	
				if (implementationStatus) {
					return "";
				}
				sanitizedId = this.sanitizeForId(field.control_number);
				return this.state.capturedData[sanitizedId + "_response"] || null;
		}
	}

	/**
	 * Builds a map of regulations (parents) linked to requirements (sub-controls) 
	 * and implementations (children).
	 * * REWRITTEN for New Structure:
	 * Parent = fieldGroup (e.g. "Transparency")
	 * SubControl = Item inside fieldGroup.controls (e.g. "[18229-1.1] Intended Purpose")
	 */
	function buildComplianceMap(data, sanitizeForId, fieldStoredValue) {
		const complianceMap = new Map();
		let allFields = [];
	
		// 1. Recursive helper to flatten all fields
		function collectFieldsRecursively(fields) {
			if (!fields || !Array.isArray(fields)) return;
			fields.forEach(field => {
				allFields.push(field);
				if (field.Fields && Array.isArray(field.Fields)) {
					collectFieldsRecursively(field.Fields);
				}
				if (field.controls && Array.isArray(field.controls)) {
					collectFieldsRecursively(field.controls);
				}
			});
		}
	
		// 2. Process every section
		Object.values(data).flat().forEach(step => {
			if (step.Fields) collectFieldsRecursively(step.Fields);
		});
	
		// 3. Pass 1: Identify "Regulation/Group" nodes
		allFields.forEach(field => {
			if (field.jkType === 'fieldGroup' && field.controls && Array.isArray(field.controls)) {
				
				const containsRequirements = field.controls.some(c => c.jkType === 'requirement');
	
				if (containsRequirements) {
					// Initialize the Map Entry
					if (!complianceMap.has(field.jkName)) {
						complianceMap.set(field.jkName, {
							parentField: field,
							subControlLinks: new Map()
						});
					}
	
					const dataEntry = complianceMap.get(field.jkName);
	
	// Populate Sub-Controls ONLY if "Applicable"
					field.controls.forEach(req => {
						if (req.jkType === 'requirement') {
							const controlKey = req.requirement_control_number; 
							
							if (controlKey) {
								// --- APPLICABILITY CHECK START ---
								const sanitizeId = sanitizeForId(controlKey);
								const soa = fieldStoredValue(req, false);
								//capturedData[sanitizeId + '_jkSoa'];
								
								
								// Only add to the map if it is marked as Applicable
								//if (soa === 'Applicable') {
									dataEntry.subControlLinks.set(controlKey, {
										subControl: {
											// Specific fields requested
											requirement_control_number: req.requirement_control_number,
											control_number: req.control_number || controlKey,
											jkName: req.jkName,
											jkText: req.jkText, 
											jkType: req.jkType,
											jkObjective: req.jkObjective,
											jkImplementationStatus: req.jkImplementationStatus,
											jkImplementationEvidence: req.jkImplementationEvidence,
											
											// Keep these for backward compatibility with your existing script
											control_description: req.jkText || req.jkName,
											original_obj: req
										},
										children: new Set()
									});
								//}
								// --- APPLICABILITY CHECK END ---
							}
						}
					});
				}
			}
		});
	
		// 4. Pass 2: Link implementation nodes (Risk, Plan) to the requirements
		allFields.forEach(implNode => {
			if (implNode.requirement_control_number && implNode.jkType !== 'requirement') {
				const implControlParts = String(implNode.requirement_control_number).split(',').map(s => s.trim());
	
				complianceMap.forEach((data) => {
					const subControlLinks = data.subControlLinks;
					implControlParts.forEach(implKey => {
						if (subControlLinks.has(implKey)) {
							subControlLinks.get(implKey).children.add(implNode);
						}
					});
				});
			}
		});
	
		// 5. Cleanup: Remove groups that have no applicable sub-controls
		for (const [groupName, entry] of complianceMap.entries()) {
			if (entry.subControlLinks.size === 0) {
				complianceMap.delete(groupName);
			}
		}
	
		return complianceMap;
	}
	/**
	 * Handles data operations on a specific field node based on its jkType.
	 * * @param {object} field - The actual JSON field object/node.
	 * @param {string} operation - Either "captureData" or "retrieveData".
	 * @returns {void}
	 */
	fieldHelper(field, fieldType, operation, currentData = null) {
		if (!field || !field.jkType) return null;
	
		// Clean the type (e.g., "MultiSelect:PDF" -> "MultiSelect")
		const cleanType = String(field.jkType).split(':')[0];
	
		switch (operation) {
			case "captureData":
				switch (cleanType) {
					case "requirement":
						// Use 'this.' to call class methods
						const sanitizedId = this.sanitizeForId(field.requirement_control_number);
						const requirementSelect = document.querySelector(`select[name="${sanitizedId}_jkSoa"]`);
						
						// Only update if value exists and is not the default 'Select'
						if (requirementSelect && (requirementSelect.value && requirementSelect.value != 'Select')) {
							if (currentData[sanitizedId + '_jkSoa'] !== requirementSelect.value) {
								currentData[sanitizedId + '_requirement'] = field.jkName +': ' + field.jkText;
								currentData[sanitizedId + '_jkSoa'] = requirementSelect.value;
							}
						} else if (requirementSelect && currentData[sanitizedId + '_jkSoa']) {
							// Only delete if it previously had a value
							delete currentData[sanitizedId + '_jkSoa'];
							delete currentData[sanitizedId + '_requirement']
						}
						break;
	
					case "risk":
					case "plan":
						if (field.controls && Array.isArray(field.controls)) {
							field.controls.forEach(control => {
								const controlKey = this.sanitizeForId(control.control_number);
								const statusElement = document.querySelector(`select[name="${controlKey}_jkImplementationStatus"]`);
								const evidenceElement = document.querySelector(`textarea[name="${controlKey}_jkImplementationEvidence"]`);
					
								const statusValue = statusElement ? statusElement.value : "Select";
								const evidenceValue = evidenceElement ? evidenceElement.value : "";
					
								if ((statusValue !== "Select") || (evidenceValue !== "")) {
									currentData[controlKey] = control.jkText;
									currentData[`${controlKey}_jkImplementationStatus`] = statusValue;
									currentData[`${controlKey}_jkImplementationEvidence`] = evidenceValue;
								}
							});
						}	
						break;
						
					case "MultiSelect":
						const sanitizedId_mul = this.sanitizeForId(field.control_number);
						const checkboxes = document.querySelectorAll(`input[type="checkbox"][name="${sanitizedId_mul}_response"]:checked`);
						if (checkboxes.length > 0) {
							currentData[sanitizedId_mul + "_response"] = Array.from(checkboxes).map(cb => cb.value);
						} else if (document.querySelector(`input[type="checkbox"][name="${sanitizedId_mul}_response"]`)) {
							delete currentData[sanitizedId_mul + "_response"];
						}						
						break;
						
				    default:	
						const sanitizedId_default = this.sanitizeForId(field.control_number);
						const inputElement = document.getElementById(sanitizedId_default + "_response");
						if (inputElement) {
							if (inputElement.tagName === 'SELECT' || inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
								if (inputElement.value) {
									currentData[sanitizedId_default + "_response"] = inputElement.value;
								} else {
									delete currentData[sanitizedId_default];
								}
							}
						}						
				}
				break; // Break for "captureData" case
	
			case "retrieveData":
				switch (cleanType) {
					case "requirement":
						const sanitizedId = this.sanitizeForId(field.requirement_control_number);
						// Check if we have saved data in the state
						if (this.state.capturedData && this.state.capturedData[sanitizedId + '_jkSoa']) { 
							const select = document.querySelector(`select[name="${sanitizedId}_jkSoa"]`);
							if (select) {
								select.value = this.state.capturedData[sanitizedId + '_jkSoa'];
							}
						}
						break;
	
					case "risk":
					case "plan":
						if (field.controls && Array.isArray(field.controls)) {
							field.controls.forEach(control => {
								const controlKey = this.sanitizeForId(control.control_number);
				
								const statusElement = document.querySelector(`select[name="${controlKey}_jkImplementationStatus"]`);
								if (statusElement && this.state.capturedData[`${controlKey}_jkImplementationStatus`]) {
									statusElement.value = this.state.capturedData[`${controlKey}_jkImplementationStatus`];
								}
				
								const evidenceElement = document.querySelector(`textarea[name="${controlKey}_jkImplementationEvidence"]`);
								if (evidenceElement && this.state.capturedData[`${controlKey}_jkImplementationEvidence`]) {
									evidenceElement.value = this.state.capturedData[`${controlKey}_jkImplementationEvidence`];
								}
							});
						}					
						break;
							
					case "MultiSelect":
						const sanitizedId_mul = this.sanitizeForId(field.control_number);
						const allCheckboxes = document.querySelectorAll(`input[type="checkbox"][name="${sanitizedId_mul}_response"]`);
						allCheckboxes.forEach(cb => cb.checked = false);
				
						const selectedValues = this.state.capturedData[sanitizedId_mul + "_response"];
						if (Array.isArray(selectedValues)) {
							selectedValues.forEach(value => {
								const checkbox = document.querySelector(`input[type="checkbox"][name="${sanitizedId_mul}_response"][value="${value}"]`);
								if (checkbox) checkbox.checked = true;
							});
						}					
						break;
						
				    default:	
				        const sanitizedId_default = this.sanitizeForId(field.control_number);
						if (this.state.capturedData[sanitizedId_default + "_response"]) {
							const inputElement = document.getElementById(sanitizedId_default + "_response");
							if (inputElement) {
								inputElement.value = this.state.capturedData[sanitizedId_default + "_response"];
							}
						}
				      return null;
						
				}
				break; // Break for "retrieveData" case
	
			default:
				console.warn("Unknown operation:", operation);
				return null;
		}
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
}

const templateManager = new TemplateManager(state);
