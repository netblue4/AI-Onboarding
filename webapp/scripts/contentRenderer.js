class ContentRenderer {
    constructor(stateManager, templateManager, dataRestore) {
        this.state = stateManager;
        this.templateManager = templateManager;
        this.dataRestore = dataRestore;
    }

    render() {
        console.log('ContentRenderer.render() called with role:', this.state.currentRole);
        
        const contentArea = document.getElementById('content-area');
        
        if (!contentArea) {
            console.error('content-area element not found');
            return;
        }

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

        for (const [phaseName, stepsInPhase] of Object.entries(this.state.templateData)) {
            
            const phaseDiv = document.createElement('div');
            phaseDiv.className = 'phase-section';

            const phaseHeader = document.createElement('div');
            phaseHeader.className = 'phase-header';
            phaseHeader.textContent = phaseName;

            let phaseHasContent = false;

            stepsInPhase.forEach(step => {
                const filteredStep = this.getDeepFilteredNode(step);
                
                if (!filteredStep) return;

                const stepDiv = document.createElement('div');
                stepDiv.className = 'step-section';

                // --- START COLLAPSIBLE SETUP ---
                const stepTitle = document.createElement('div');
                stepTitle.className = 'step-title step-header'; 
                stepTitle.innerHTML = `<span>${step.StepName || 'Procedure Step'}</span>`;
                
                const stepContent = document.createElement('div');
                stepContent.className = 'step-content';
                
                // [ACTIVE] Default to collapsed
                stepTitle.classList.add('collapsed');
                stepContent.classList.add('collapsed');

                // Toggle on click
                stepTitle.onclick = () => {
                    stepTitle.classList.toggle('collapsed');
                    stepContent.classList.toggle('collapsed');
                };

                stepDiv.appendChild(stepTitle);
                // --- END COLLAPSIBLE SETUP ---

                // Render objectives
                if (step.Objectives && step.Objectives.length > 0) {
                    const handler = getFieldHandler('objective');
                    if (handler) {
                        try {
                            const objectiveElement = handler(step.Objectives);
                            stepContent.appendChild(objectiveElement);
                        } catch (error) {
                            console.error('Error rendering objectives:', error);
                        }
                    }
                }

                // Render fields
                if (filteredStep.Fields && filteredStep.Fields.length > 0) {
                    filteredStep.Fields.forEach(field => {
                        try {
                            const handler = getFieldHandler(field.FieldType);
                            
                            if (!handler) return;
                            
                            const fieldElement = handler(
                                field, 
                                this.state.capturedData, 
                                this.templateManager.sanitizeForId.bind(this.templateManager)
                            );

                            if (!fieldElement) return;

                            if (field.FieldName) {
                                this.dataRestore.restoreFieldValues(field);
                            }

                            if (field.FieldName && 
                                this.templateManager.isFieldNew(field.FieldName) && 
                                this.state.newFieldsHighlighted) {
                                const wrapper = document.createElement('div');
                                wrapper.className = 'field-new';
                                wrapper.appendChild(fieldElement);
                                stepContent.appendChild(wrapper);
                            } else {
                                stepContent.appendChild(fieldElement);
                            }

                            phaseHasContent = true;
                        } catch (error) {
                            console.error('Error rendering field:', field.FieldName, error);
                        }
                    });
                }

                // Check if content exists before appending
                if (stepContent.children.length > 0) {
                    stepDiv.appendChild(stepContent);
                    phaseDiv.appendChild(stepDiv);
                }
            });

            if (phaseHasContent) {
                phaseDiv.insertBefore(phaseHeader, phaseDiv.firstChild);
                contentArea.appendChild(phaseDiv);
                hasContent = true;
            }
        }

        if (!hasContent) {
            contentArea.innerHTML = '<div class="empty-state"><h2>No Fields Available</h2><p>No fields match your current role and dimension filters.</p></div>';
        }
    }

    // (Helper function remains unchanged)
    getDeepFilteredNode(node) {
        if (!node) return null;
        const isRoleFilterActive = this.state.currentRole && this.state.currentRole !== "";
        const isDimFilterActive = this.state.currentDimension && this.state.currentDimension !== "";

        if (!isRoleFilterActive && !isDimFilterActive) return node;

        let matchesDirectly = true;

        if (isRoleFilterActive) {
            if (!node.Role) {
                matchesDirectly = false;
            } else {
                const nodeRoles = String(node.Role).split(',').map(r => r.trim());
                if (!nodeRoles.includes(this.state.currentRole)) matchesDirectly = false;
            }
        }

        if (isDimFilterActive && matchesDirectly) {
            const nodeDims = node.TrustDimension ? String(node.TrustDimension).split(',').map(d => d.trim()) : [];
            const isComplyOverride = nodeDims.includes("Comply");
            const matchesSelection = nodeDims.includes(this.state.currentDimension);
            if (!isComplyOverride && !matchesSelection) matchesDirectly = false;
        }

        let filteredChildren = [];
        if (node.Fields && Array.isArray(node.Fields)) {
            filteredChildren = node.Fields
                .map(child => this.getDeepFilteredNode(child))
                .filter(child => child !== null);
        }

        if (matchesDirectly) {
            return { ...node, Fields: filteredChildren };
        } else if (filteredChildren.length > 0) {
            return { ...node, Fields: filteredChildren };
        }

        return null;
    }
}