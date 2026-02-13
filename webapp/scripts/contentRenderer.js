class ContentRenderer {
    constructor(stateManager, templateManager, dataRestore) {
        this.state = stateManager;
        this.templateManager = templateManager;
        this.dataRestore = dataRestore;
    }


	renderAIAssessmentView() {
		console.log('Rendering AI Assessment View');
		
		const contentArea = document.getElementById('content-area');
		if (!contentArea) return;
	
		// 1. Clear previous content
		contentArea.innerHTML = '';
		
		try {
			// 2. Get the specialized handler
			const handler = getFieldHandler('comply');
			
			if (handler) {
				// 3. Call the handler. 
				// Note: Since we aren't looping, we pass null or a global config 
				// if the handler is already "data-aware".
				const assessmentElement = handler(
					this.state.capturedData, 
					this.templateManager.sanitizeForId.bind(this.templateManager)
				);
	
				if (assessmentElement) {
					contentArea.appendChild(assessmentElement);
				} else {
					contentArea.innerHTML = '<div class="empty-state">No assessment data found.</div>';
				}
			}
		} catch (error) {
			console.error('Error in AI Assessment rendering:', error);
			contentArea.innerHTML = '<div class="error">Failed to render assessment view.</div>';
		}
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
                                this.templateManager.isFieldNew(field.control_number) && 
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
    getDeepFilteredNode(node, isInRole = false) {
        if (!node) return null;
        const isRoleFilterActive = this.state.currentRole && this.state.currentRole !== "";
        const isDimFilterActive = this.state.currentDimension && this.state.currentDimension !== "";

        if (!isRoleFilterActive && !isDimFilterActive) return node;

        let matchesDirectly = false;

        if (isRoleFilterActive) {

                let currentInRole = isInRole;
                if (node.Role) {
                    const fieldRoles = String(node.Role).split(',').map(r => r.trim());
                    currentInRole = fieldRoles.includes(this.state.currentRole);
                }
                
            
                let currentIsRequirement = false;
                if (node.FieldType === 'requirement') {
                    currentIsRequirement = true;
                }             
                   
                let currentIsControl = false;
                if (node.control_evidence) {
                    currentIsControl = true;
                } 
                
				let currentIsApplicable = false;				
				if (node.requirement_control_number) {
					// 1. Split the string by comma and trim any whitespace
					const controlNumbers = String(node.requirement_control_number).split(',').map(id => id.trim());
				
					// 2. Use .some() to check if at least one ID satisfies the condition
					const hasApplicableControl = controlNumbers.some(id => {
						const sanitizeId = templateManager.sanitizeForId(id);
						const soa = this.state.capturedData[sanitizeId + '_requirement__soa'];
						return soa === 'Applicable';
					});
				
					// 3. Set applicability based on the check or the requirement status
					currentIsApplicable = hasApplicableControl || currentIsRequirement;
				}
                
                const isApplicableControl = (currentIsControl && currentIsApplicable);
                const isApplicableField = (!currentIsControl && currentIsApplicable);


                if (this.state.currentRole === "Approver" && !currentIsRequirement) {
					currentInRole = true;
                }

				if (currentInRole && (currentIsApplicable || currentIsRequirement || isApplicableField)) {
					matchesDirectly = true;
				}
             
        }

        //if (isDimFilterActive && matchesDirectly) {
        //    const nodeDims = node.TrustDimension ? String(node.TrustDimension).split(',').map(d => d.trim()) : [];
        //    const isComplyOverride = nodeDims.includes("Comply");
        //    const matchesSelection = nodeDims.includes(this.state.currentDimension);
        //    if (!isComplyOverride && !matchesSelection) matchesDirectly = false;
        //}

        let filteredChildren = [];
        if (node.Fields && Array.isArray(node.Fields)) {
            const currfieldRoles = String(node.Role).split(',').map(r => r.trim());
            const isInRole = currfieldRoles.includes(this.state.currentRole);
            filteredChildren = node.Fields
                .map(child => this.getDeepFilteredNode(child, isInRole))
                .filter(child => child !== null);
        }
		if (node.controls && Array.isArray(node.controls)) {
		     const currfieldRoles = String(node.Role).split(',').map(r => r.trim());
             const isInRole = currfieldRoles.includes(this.state.currentRole);
	         filteredChildren = node.controls
				.map(child => this.getDeepFilteredNode(child, isInRole))
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