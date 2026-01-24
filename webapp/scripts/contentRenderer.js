// ============================================
// scripts/contentRenderer.js (FIXED)
// ============================================
/**
 * Renders the form content based on role and dimension filters
 */
class ContentRenderer {
    constructor(stateManager, templateManager, dataRestore) {
        this.state = stateManager;
        this.templateManager = templateManager;
        this.dataRestore = dataRestore;
    }

    /**
     * Main render function - renders all content for current role
     */
    render() {
        console.log('ContentRenderer.render() called with role:', this.state.currentRole);
        
        const contentArea = document.getElementById('content-area');
        
        if (!contentArea) {
            console.error('content-area element not found');
            return;
        }

        // Check prerequisites
        if (!this.state.templateData) {
            console.error('Template data not loaded');
            contentArea.innerHTML = '<div class="empty-state"><h2>Error</h2><p>Template data not loaded.</p></div>';
            return;
        }

        if (!this.state.currentRole) {
            console.log('No role selected');
            contentArea.innerHTML = '<div class="empty-state"><h2>Select Your Role</h2><p>Choose your role from the dropdown above to see relevant fields.</p></div>';
            return;
        }

        console.log('Rendering content for role:', this.state.currentRole);
        
        contentArea.innerHTML = '';
        let hasContent = false;

        // Iterate through all phases
        for (const [phaseName, stepsInPhase] of Object.entries(this.state.templateData)) {
            console.log('Processing phase:', phaseName);
            
            const phaseDiv = document.createElement('div');
            phaseDiv.className = 'phase-section';

            const phaseHeader = document.createElement('div');
            phaseHeader.className = 'phase-header';
            phaseHeader.textContent = phaseName;

            let phaseHasContent = false;

            // Iterate through steps in phase
            stepsInPhase.forEach(step => {
                const filteredStep = this.getDeepFilteredNode(step);
                
                if (!filteredStep) {
                    console.log('Step filtered out:', step.StepName);
                    return;
                }

                console.log('Rendering step:', step.StepName);

                const stepDiv = document.createElement('div');
                stepDiv.className = 'step-section';

                const stepTitle = document.createElement('div');
                stepTitle.className = 'step-title';
                stepTitle.textContent = step.StepName || 'Procedure Step';
                stepDiv.appendChild(stepTitle);

                // Render objectives
                if (step.Objectives && step.Objectives.length > 0) {
                    const handler = getFieldHandler('objective');
                    if (handler) {
                        try {
                            const objectiveElement = handler(step.Objectives);
                            stepDiv.appendChild(objectiveElement);
                        } catch (error) {
                            console.error('Error rendering objectives:', error);
                        }
                    }
                }

                // Render fields
                if (filteredStep.Fields && filteredStep.Fields.length > 0) {
                    console.log('Rendering', filteredStep.Fields.length, 'fields in step:', step.StepName);
                    
                    filteredStep.Fields.forEach(field => {
                        try {
                            const handler = getFieldHandler(field.FieldType);
                            
                            if (!handler) {
                                console.warn('No handler found for field type:', field.FieldType, 'Field:', field.FieldName);
                                return;
                            }

                            console.log('Rendering field:', field.FieldName, 'Type:', field.FieldType);
                            
                            const fieldElement = handler(
                                field, 
                                this.state.capturedData, 
                                this.templateManager.sanitizeForId.bind(this.templateManager)
                            );

                            if (!fieldElement) {
                                console.warn('Handler returned null element for field:', field.FieldName);
                                return;
                            }

                            // Restore previously saved values
                            if (field.FieldName) {
                                this.dataRestore.restoreFieldValues(field);
                            }

                            // Wrap with "new" styling if needed
                            if (field.FieldName && 
                                this.templateManager.isFieldNew(field.FieldName) && 
                                this.state.newFieldsHighlighted) {
                                const wrapper = document.createElement('div');
                                wrapper.className = 'field-new';
                                wrapper.appendChild(fieldElement);
                                stepDiv.appendChild(wrapper);
                            } else {
                                stepDiv.appendChild(fieldElement);
                            }

                            phaseHasContent = true;
                        } catch (error) {
                            console.error('Error rendering field:', field.FieldName, error);
                        }
                    });
                } else {
                    console.log('No fields in filtered step');
                }

                // Only add step if it has content
                if (stepDiv.children.length > 1) {
                    phaseDiv.appendChild(stepDiv);
                }
            });

            // Only add phase if it has content
            if (phaseHasContent) {
                phaseDiv.insertBefore(phaseHeader, phaseDiv.firstChild);
                contentArea.appendChild(phaseDiv);
                hasContent = true;
            }
        }

        // Display empty state if no content was rendered
        if (!hasContent) {
            console.warn('No content found for role:', this.state.currentRole, 'Dimension:', this.state.currentDimension);
            contentArea.innerHTML = '<div class="empty-state"><h2>No Fields Available</h2><p>No fields match your current role and dimension filters.</p></div>';
        } else {
            console.log('Content rendered successfully');
        }
    }

    /**
     * Filter a node based on role and dimension criteria
     * @param {Object} node - The field node to filter
     * @returns {Object|null} Filtered node or null if should be hidden
     */
    getDeepFilteredNode(node) {
        if (!node) return null;

        const isRoleFilterActive = this.state.currentRole && this.state.currentRole !== "";
        const isDimFilterActive = this.state.currentDimension && this.state.currentDimension !== "";

        // If no filters active, return node as-is
        if (!isRoleFilterActive && !isDimFilterActive) {
            return node;
        }

        let matchesDirectly = true;

        // Check role filter
        if (isRoleFilterActive) {
            if (!node.Role) {
                matchesDirectly = false;
            } else {
                const nodeRoles = String(node.Role)
                    .split(',')
                    .map(r => r.trim());
                
                if (!nodeRoles.includes(this.state.currentRole)) {
                    matchesDirectly = false;
                }
            }
        }

        // Check dimension filter
        if (isDimFilterActive && matchesDirectly) {
            const nodeDims = node.TrustDimension 
                ? String(node.TrustDimension).split(',').map(d => d.trim()) 
                : [];
            
            const isComplyOverride = nodeDims.includes("Comply");
            const matchesSelection = nodeDims.includes(this.state.currentDimension);

            if (!isComplyOverride && !matchesSelection) {
                matchesDirectly = false;
            }
        }

        // Recursively filter children
        let filteredChildren = [];
        if (node.Fields && Array.isArray(node.Fields)) {
            filteredChildren = node.Fields
                .map(child => this.getDeepFilteredNode(child))
                .filter(child => child !== null);
        }

        // Return node if it matches, or if any children match
        if (matchesDirectly) {
            return { ...node, Fields: filteredChildren };
        } else if (filteredChildren.length > 0) {
            return { ...node, Fields: filteredChildren };
        }

        return null;
    }
}

// Create global instance (will be initialized in eventHandlers)
let contentRenderer;