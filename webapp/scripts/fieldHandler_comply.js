/**
 * FIELD HANDLER: Comply
 * Handles complex compliance mapping requirements with sub-controls.
 */
function createComplyField(field, capturedData, sanitizeForId) {
    
    // 1. Get the global data
    const webappData = window.originalWebappData;
    const selectedTrustDimension = window.selectedTrustDimension;

    if (!webappData) {
        const errDiv = document.createElement('div');
        errDiv.innerHTML = "<p style='color:red'>Error: Data not found. Please ensure window.originalWebappData is set in the main HTML file.</p>";
        return errDiv;
    }

    // 2. Process and Render
    return processAndRenderData(webappData);

    // --- HELPER FUNCTIONS ---

    function processAndRenderData(data) {
        // 1. Flatten all steps and extract all fields
        let allFields = [];
        Object.values(data).flat().forEach(step => {
            if (step.Fields && Array.isArray(step.Fields)) {
                allFields = allFields.concat(step.Fields);
            }
        });

        // 2. Separate nodes into Requirements (Parents) and Implementations (Children)
        const requirementNodes = [];
        const implementationNodes = [];

        allFields.forEach(f => {
            if (hasTrustDimension(f, 'Requirement')) {
                requirementNodes.push(f);
            } 
            else if (f.FieldType === 'fieldGroup' && f.Fields && Array.isArray(f.Fields)) {
                f.Fields.forEach(innerField => {
                    if (innerField.Control) implementationNodes.push(innerField);
                });
            }
            else if (f.Control) {
                implementationNodes.push(f);
            }
        });

        // 3. Build the compliance map
        const complianceMap = new Map();

        requirementNodes.forEach(reqNode => {
            const subControlMap = new Map();
            if (reqNode.controls && Array.isArray(reqNode.controls)) {
                reqNode.controls.forEach(subControl => {
                    const controlKey = getControlKey(subControl.control_number);
                    if (controlKey) {
                        subControlMap.set(controlKey, {
                            subControl: subControl,
                            children: new Set()
                        });
                    }
                });
            }
            if (reqNode.FieldName != "") {
				complianceMap.set(reqNode.FieldName, {
					parentField: reqNode,
					subControlLinks: subControlMap
				});
            }
        });

        // 4. Link Implementations (Children)
        implementationNodes.forEach(implNode => {
            if (!implNode.Control) return;
            const implControlParts = implNode.Control.split(',').map(s => s.trim());

            for (const [parentName, data] of complianceMap.entries()) {
                const subControlLinks = data.subControlLinks;
                for (const implKey of implControlParts) {
                    if (subControlLinks.has(implKey)) {
                        subControlLinks.get(implKey).children.add(implNode);
                    }
                }
            }
        });

        // 5. Render the result
        return renderMapping(complianceMap);
    }

    function renderMapping(complianceMap) {
        const container = document.createElement('div');
        container.className = 'mapping-container';

        // Event Delegation for toggling
        container.addEventListener('click', event => {
            const header = event.target.closest('.reg-header');
            if (!header) return;

            const targetId = header.getAttribute('data-target');
            if (!targetId) return;

            const content = container.querySelector(targetId);
            const icon = header.querySelector('.toggle-icon');

            if (content && icon) {
                const isExpanded = content.classList.toggle('expanded');
                if (isExpanded) {
                    icon.textContent = '−';
                    icon.classList.add('expanded');
                    header.setAttribute('aria-expanded', 'true');
                    content.setAttribute('aria-hidden', 'false');
                    content.style.display = 'block'; 
                } else {
                    icon.textContent = '+';
                    icon.classList.remove('expanded');
                    header.setAttribute('aria-expanded', 'false');
                    content.setAttribute('aria-hidden', 'true');
                    content.style.display = 'none'; 
                }
            }
        });

        if (complianceMap.size === 0) {
            container.innerHTML = '<p>No "Requirement" nodes found.</p>';
            return container;
        }

        complianceMap.forEach((data, parentFieldName) => {
            const parent = data.parentField;
            const subControlLinks = data.subControlLinks;

            // [FIX] Uncommented this check. 
            // We only want to render the controls for the specific field currently being built.
            if (parent.FieldName !== field.FieldName) return; 

            const regItem = document.createElement('div');
            regItem.className = 'reg-item';

            // Calculate Progress
            const totalSubControls = subControlLinks.size;
            let matchedSubControls = 0;
            subControlLinks.forEach(d => { if (d.children.size > 0) matchedSubControls++; });
            
            const percentage = (totalSubControls > 0) ? (matchedSubControls / totalSubControls) * 100 : 0;
            const displayPercentage = (totalSubControls === 0) ? 100 : percentage;
            const progressColor = (displayPercentage >= 100) ? 'var(--success-color, #22c55e)' : 'var(--primary-color, #2563eb)';

            const safeIdBase = (parent.Control || parent.FieldName).replace(/[^a-zA-Z0-9_]/g, '-');
            const contentId = `content-${safeIdBase}`;

            // Render Header
            const regHeader = document.createElement('div');
            regHeader.className = 'reg-header';
            regHeader.setAttribute('data-target', `#${contentId}`);
            regHeader.style.cursor = 'pointer'; 
            regHeader.innerHTML = `
                <div class="toggle-icon" style="margin-right:10px; font-weight:bold;">+</div>
                <div class="reg-header-content" style="flex-grow:1;">
                    <div class="reg-title" style="font-weight:bold; color:#1e40af;">${escapeHtml(parent.FieldName)}</div>
                    <div class="progress-container" style="background:#e0e7ff; height:10px; border-radius:5px; margin-top:5px;">
                        <div class="progress-bar" style="width: ${displayPercentage}%; background-color: ${progressColor}; height:100%;"></div>
                    </div>
                    <div class="reg-meta" style="font-size:0.9em; color:#64748b;">${escapeHtml(parent.Control)}</div>
                </div>
            `;
            regItem.appendChild(regHeader);

            // Render Content (Sub-controls)
            const subControlList = document.createElement('ul');
            subControlList.className = 'sub-control-list';
            subControlList.id = contentId;
            subControlList.style.display = 'none'; 
            subControlList.style.padding = '0';

            if (subControlLinks.size === 0) {
                subControlList.innerHTML = '<li class="sub-control-item" style="padding:10px;">No sub-controls.</li>';
            } else {
                const sortedSubControls = Array.from(subControlLinks.entries()).sort((a, b) => a[0].localeCompare(b[0]));
                
                sortedSubControls.forEach(([key, subData]) => {
					const subItem = document.createElement('li');
					subItem.className = 'sub-control-item';
					subItem.style.listStyle = 'none';
					subItem.style.padding = '10px';
					subItem.style.borderTop = '1px solid #eee';

                    // [FIX] Add the attributes required by captureCurrentValues in HTML
                    subItem.setAttribute('data-comply-field', sanitizeForId(parent.FieldName));
                    subItem.control_number = sanitizeForId(subData.subControl.control_number);
				
					// 1. Create Title
					const titleDiv = document.createElement('div');
					titleDiv.className = 'sub-control-title';
					titleDiv.innerHTML = `<strong>${escapeHtml(subData.subControl.control_number)}</strong>` + ` - ${escapeHtml(subData.subControl.control_description)}`;
					
					// 2. Create Dropdown
					const select = document.createElement('select');
					select.style.margin = '5px 0 10px 0'; 
					select.style.padding = '4px';
					select.style.borderRadius = '4px';
					select.style.border = '1px solid #ccc';
					
            		select.name = sanitizeForId(subData.subControl.control_number) + '_complystatus';
					
					const options = ['Select', 'N/A', 'Met', 'Not Met', 'Partially Met'];
					options.forEach((optionText) => {
						const option = document.createElement('option');
						option.value = optionText;
						option.textContent = optionText;
						select.appendChild(option);
					});
				
					select.addEventListener('change', (e) => {
						subData.subControl.control_status = e.target.value;
					});
				
					// 3. Create Evidence/Description
					const evidenceDiv = document.createElement('div');
					evidenceDiv.className = 'auto-generated-label';
					evidenceDiv.innerHTML = escapeHtml(subData.subControl.control_evidence);
				
					// 4. Append
					subItem.appendChild(titleDiv);
					subItem.appendChild(select); 
					subItem.appendChild(evidenceDiv);
					
					// 5. Handle Implementations
					if (subData.children.size > 0) {
						const impList = document.createElement('ul');
						impList.className = 'imp-list';
						subData.children.forEach(child => {
							const impItem = document.createElement('li');
							impItem.className = 'imp-item';
							impItem.style.marginBottom = '5px';
							
							let typeClass = 'type-other';
							let typeName = child.FieldType || 'field'; 
				
							if (typeName === 'risk') {
								typeClass = 'type-risk';
							} else if (typeName === 'plan') {
								typeClass = 'type-plan';
							} else {
								typeClass = 'type-other';
								typeName = 'FIELD'; 
							}
							
							impItem.innerHTML = `
								<span class="imp-type-badge ${typeClass}">${escapeHtml(typeName)}</span>
								<div class="imp-content">
									<div class="imp-title">${escapeHtml(child.FieldName)}</div>
									<div class="imp-meta">
										<strong>Matches Control:</strong> ${escapeHtml(child.Control)}
									</div>
									<div class="imp-meta">
										<strong>Evidence:</strong> ${escapeHtml(child.control_evidence)}
									</div>									
								</div>
							`;
				
							impList.appendChild(impItem);
						});
						subItem.appendChild(impList);
					} else {
						const noItemsDiv = document.createElement('div');
						noItemsDiv.style.color = '#999';
						noItemsDiv.style.fontStyle = 'italic';
						noItemsDiv.textContent = 'No linked items.';
						subItem.appendChild(noItemsDiv);
					}
					
					subControlList.appendChild(subItem);
				});
            }

            regItem.appendChild(subControlList);
            container.appendChild(regItem);
        });

        return container;
    }

    // --- UTILITIES ---
    function hasTrustDimension(field, dimension) {
        if (!field || !field.TrustDimension) return false;
        const matchesMandatory = field.TrustDimension.includes(dimension);
 
        if (field.TrustDimension.includes("Comply")) {
            return true;
        }
               
        if (!matchesMandatory) return false;

        if (selectedTrustDimension) {
             return field.TrustDimension.includes(selectedTrustDimension);
        }
        return true;
    }

    function getControlKey(str) {
        if (!str) return null;
        const key = str.split(' - ')[0].trim();
        return (key.startsWith('[') && key.endsWith(']')) ? key : null;
    }

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
}