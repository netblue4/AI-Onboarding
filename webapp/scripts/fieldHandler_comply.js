function createComplyField(field, capturedData, sanitizeForId) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    
    // 1. PRE-CHECK: Only render if TrustDimension contains "Requirement"
    if (!field.TrustDimension || !field.TrustDimension.includes("Requirement")) {
        // Return empty div if not a requirement, effectively hiding it
        return fieldDiv; 
    }

    // 2. HELPERS: Internal functions for this specific field
    function getControlKey(controlString) {
        if (typeof controlString !== 'string') return null;
        const key = controlString.split(' - ')[0].trim();
        return (key.startsWith('[') && key.endsWith(']')) ? key : null;
    }

    // Helper to check if a child node passes the current App filters
    function nodePassesFilters(node) {
        const roleSelect = document.getElementById('role-dropdown');
        const dimSelect = document.getElementById('dimension-dropdown');
        const currentRole = roleSelect ? roleSelect.value : "";
        const currentDimension = dimSelect ? dimSelect.value : "";

        if (!node) return false;

        // Role Filter
        if (currentRole && currentRole !== "") {
            if (!node.Role || !String(node.Role).split(',').map(r => r.trim()).includes(currentRole)) {
                return false;
            }
        }
        // Dimension Filter
        if (currentDimension && currentDimension !== "") {
            if (node.TrustDimension && !String(node.TrustDimension).split(',').map(d => d.trim()).includes(currentDimension)) {
                return false;
            }
        }
        return true;
    }

    // 3. DATA GATHERING: We need to find children (Risks/Plans) from the global data
    // NOTE: We assume 'window.originalWebappData' exists (see setup instructions below)
    const globalData = window.originalWebappData || {}; 
    const implementationNodes = [];

    // Flatten global data to find all potential children
    Object.values(globalData).flat().forEach(step => {
        if (step.Fields && Array.isArray(step.Fields)) {
            function collectFields(fieldList) {
                fieldList.forEach(f => {
                    if (f.FieldType === 'fieldGroup' && f.Fields) {
                        collectFields(f.Fields);
                    } else if (f.Control) {
                        // Only add if it has a Control AND passes current active filters
                        if (nodePassesFilters(f)) {
                            implementationNodes.push(f);
                        }
                    }
                });
            }
            collectFields(step.Fields);
        }
    });

    // 4. MAPPING: Link Implementations to Sub-Controls
    const subControlMap = new Map();
    
    // Initialize sub-controls from the current field definition
    if (field.controls && Array.isArray(field.controls)) {
        field.controls.forEach(subControl => {
            const controlKey = getControlKey(subControl.control);
            if (controlKey) {
                subControlMap.set(controlKey, {
                    subControl: subControl,
                    children: new Set()
                });
            }
        });
    }

    // Match children to these sub-controls
    implementationNodes.forEach(implNode => {
        if (implNode.FieldName === field.FieldName) return; // Skip self
        
        const implControlParts = implNode.Control.split(',').map(s => s.trim());
        for (const implKey of implControlParts) {
            if (subControlMap.has(implKey)) {
                subControlMap.get(implKey).children.add(implNode);
            }
        }
    });

    // 5. BUILD HTML: Replicating ai_onboarding_compliance.html structure
    
    // Calculate Progress
    const totalSubControls = subControlMap.size;
    let matchedSubControls = 0;
    subControlMap.forEach(data => {
        if (data.children.size > 0) matchedSubControls++;
    });
    
    const percentage = (totalSubControls > 0) ? (matchedSubControls / totalSubControls) * 100 : 0;
    const displayPercentage = (totalSubControls === 0) ? 100 : percentage;
    const progressText = (totalSubControls === 0) ? "N/A" : `${matchedSubControls} / ${totalSubControls}`;
    const progressColor = (displayPercentage >= 100) ? '#22c55e' : '#2563eb';

    // Create the Container for this Requirement
    const regItem = document.createElement('div');
    regItem.className = 'reg-item';

    // Unique ID for toggling
    const contentId = sanitizeForId(field.FieldName) + '_content';

    // Construct Header HTML
    const headerHtml = `
        <div class="reg-header" aria-expanded="false" style="cursor: pointer;">
            <div class="toggle-icon" style="margin-right:15px; font-weight:bold; width:20px; text-align:center;">+</div>
            <div class="reg-header-content" style="flex-grow:1;">
                <div class="reg-title" style="font-weight:700; color:#1e40af; margin-bottom:5px;">
                    ${field.FieldName}
                </div>
                
                <div class="progress-container" style="width:100%; height:18px; background:#e0e7ff; border-radius:9px; position:relative; overflow:hidden;">
                    <div class="progress-bar" style="width: ${displayPercentage}%; height:100%; background-color: ${progressColor}; transition: width 0.4s;"></div>
                    <div class="progress-text" style="position:absolute; top:0; left:0; width:100%; text-align:center; font-size:0.8em; line-height:18px; font-weight:600; color:#1e3a8a;">
                        ${progressText}
                    </div>
                </div>

                <div class="reg-meta" style="font-size:0.9em; color:#64748b; margin-top:5px;">
                    <strong>Control:</strong> ${field.Control}
                </div>
            </div>
        </div>
    `;
    
    // Construct Body HTML (Hidden by default)
    const listContainer = document.createElement('ul');
    listContainer.className = 'sub-control-list';
    listContainer.id = contentId;
    listContainer.style.display = 'none';
    listContainer.style.listStyle = 'none';
    listContainer.style.padding = '0';
    listContainer.style.margin = '0';

    if (subControlMap.size === 0) {
        listContainer.innerHTML = '<li class="sub-control-item" style="padding:15px;">No specific sub-controls defined.</li>';
    } else {
        // Sort sub-controls alphabetically
        const sortedKeys = Array.from(subControlMap.keys()).sort();
        
        sortedKeys.forEach(key => {
            const data = subControlMap.get(key);
            const subItem = document.createElement('li');
            subItem.className = 'sub-control-item';
            subItem.style.borderBottom = '1px solid #e2e8f0';
            subItem.style.padding = '15px 20px';

            // Sub-control Title
            const titleDiv = document.createElement('div');
            titleDiv.className = 'sub-control-title';
            titleDiv.style.fontWeight = '600';
            titleDiv.style.marginBottom = '10px';
            titleDiv.textContent = data.subControl.control;
            subItem.appendChild(titleDiv);

            // Implementations (Children)
            if (data.children.size > 0) {
                const impList = document.createElement('ul');
                impList.className = 'imp-list';
                impList.style.listStyle = 'none';
                impList.style.paddingLeft = '15px';
                impList.style.borderLeft = '3px solid #e2e8f0';
                
                Array.from(data.children).forEach(child => {
                    const impItem = document.createElement('li');
                    impItem.className = 'imp-item';
                    impItem.style.marginBottom = '8px';
                    impItem.style.background = '#f9fafb';
                    impItem.style.padding = '10px';
                    impItem.style.borderRadius = '4px';
                    impItem.style.display = 'flex';

                    // Badge Logic
                    let typeClass = 'background-color: #e2e8f0; color: #475569;'; // Default
                    let typeLabel = child.FieldType || 'FIELD';
                    
                    if (typeLabel === 'risk') {
                        typeClass = 'background-color: #fee2e2; color: #991b1b;';
                    } else if (typeLabel === 'plan') {
                        typeClass = 'background-color: #dcfce7; color: #166534;';
                    }

                    impItem.innerHTML = `
                        <span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:0.75em; font-weight:600; text-transform:uppercase; margin-right:10px; ${typeClass}">
                            ${typeLabel}
                        </span>
                        <div>
                            <div style="font-weight:500; font-size:0.95em;">${child.FieldName}</div>
                            <div style="font-size:0.85em; color:#64748b;">${child.Role ? 'Role: ' + child.Role : ''}</div>
                        </div>
                    `;
                    impList.appendChild(impItem);
                });
                subItem.appendChild(impList);
            } else {
                const noChild = document.createElement('div');
                noChild.textContent = 'No matching items found.';
                noChild.style.fontStyle = 'italic';
                noChild.style.color = '#94a3b8';
                noChild.style.fontSize = '0.9em';
                subItem.appendChild(noChild);
            }
            listContainer.appendChild(subItem);
        });
    }

    regItem.innerHTML = headerHtml;
    regItem.appendChild(listContainer);
    fieldDiv.appendChild(regItem);

    // 6. INTERACTION: Add Click Event to Header
    const header = regItem.querySelector('.reg-header');
    const icon = regItem.querySelector('.toggle-icon');
    
    header.addEventListener('click', () => {
        const isHidden = listContainer.style.display === 'none';
        listContainer.style.display = isHidden ? 'block' : 'none';
        icon.textContent = isHidden ? '−' : '+';
        header.setAttribute('aria-expanded', isHidden);
        header.style.backgroundColor = isHidden ? '#e0e7ff' : '#eff6ff';
    });

    return fieldDiv;
}