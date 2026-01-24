// ============================================
// 8. scripts/contentRenderer.js
// ============================================
class ContentRenderer {
    constructor(stateManager, templateManager, dataRestore) {
        this.state = stateManager;
        this.templateManager = templateManager;
        this.dataRestore = dataRestore;
    }

    render() {
        const contentArea = document.getElementById('content-area');

        if (!this.state.templateData || !this.state.currentRole) {
            contentArea.innerHTML = '<div class="empty-state"><h2>Select Your Role</h2><p>Choose your role from the dropdown above to see relevant fields.</p></div>';
            return;
        }

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

                const stepTitle = document.createElement('div');
                stepTitle.className = 'step-title';
                stepTitle.textContent = step.StepName || 'Procedure Step';
                stepDiv.appendChild(stepTitle);

                // Render objectives
                if (step.Objectives && step.Objectives.length > 0) {
                    const handler = getFieldHandler('objective');
                    if (handler) {
                        const objectiveElement = handler(step.Objectives);
                        stepDiv.appendChild(objectiveElement);
                    }
                }

                // Render fields
                if (filteredStep.Fields && filteredStep.Fields.length > 0) {
                    filteredStep.Fields.forEach(field => {
                        const handler = getFieldHandler(field.FieldType);
                        if (handler) {
                            const fieldElement = handler(field, this.state.capturedData, this.templateManager.sanitizeForId.bind(this.templateManager));

                            this.dataRestore.restoreFieldValues(field);

                            // Wrap with "new" styling if needed
                            if (field.FieldName && this.templateManager.isFieldNew(field.FieldName) && this.state.newFieldsHighlighted) {
                                const wrapper = document.createElement('div');
                                wrapper.className = 'field-new';
                                wrapper.appendChild(fieldElement);
                                stepDiv.appendChild(wrapper);
                            } else {
                                stepDiv.appendChild(fieldElement);
                            }

                            phaseHasContent = true;
                        }
                    });
                }

                if (stepDiv.children.length > 1) {
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

    getDeepFilteredNode(node) {
        if (!node) return null;

        const isRoleFilterActive = this.state.currentRole && this.state.currentRole !== "";
        const isDimFilterActive = this.state.currentDimension && this.state.currentDimension !== "";

        if (!isRoleFilterActive && !isDimFilterActive) return node;

        let matchesDirectly = true;
        if (isRoleFilterActive) {
            if (!node.Role || !String(node.Role).split(',').map(r => r.trim()).includes(this.state.currentRole)) {
                matchesDirectly = false;
            }
        }

        if (isDimFilterActive && matchesDirectly) {
            const nodeDims = node.TrustDimension ? String(node.TrustDimension).split(',').map(d => d.trim()) : [];
            const isComplyOverride = nodeDims.includes("Comply");
            const matchesSelection = nodeDims.includes(this.state.currentDimension);

            if (!isComplyOverride && !matchesSelection) {
                matchesDirectly = false;
            }
        }

        let filteredChildren = [];
        if (node.Fields && Array.isArray(node.Fields)) {
            filteredChildren = node.Fields.map(child => this.getDeepFilteredNode(child)).filter(child => child !== null);
        }

        if (matchesDirectly) {
            return { ...node, Fields: filteredChildren };
        } else if (filteredChildren.length > 0) {
            return { ...node, Fields: filteredChildren };
        }

        return null;
    }
}

const contentRenderer = new ContentRenderer(state, templateManager, dataRestore);

