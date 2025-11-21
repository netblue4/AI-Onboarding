function createComplyField(field, capturedData, sanitizeForId) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    // 1. VALIDATION: Only show if this is a "Requirement"
    if (!field.TrustDimension || !field.TrustDimension.includes("Requirement")) {
        return fieldDiv; // Return empty div (hide it)
    }

    // 2. GET GLOBAL DATA: We need to look outside this specific field to find linked Risks/Plans
    // Note: This requires the change in ai_onboarding_app.html (Step 2 below)
    const globalData = window.originalWebappData || {}; 

    // 3. HELPER: Filter Logic (Matches your app's dropdowns)
    function nodePassesFilters(node) {
        const roleSelect = document.getElementById('role-dropdown');
        const dimSelect = document.getElementById('dimension-dropdown');
        const currentRole = roleSelect ? roleSelect.value : "";
        const currentDimension = dimSelect ? dimSelect.value : "";

        if (!node) return false;

        // Check Role
        if (currentRole && currentRole !== "") {
            if (!node.Role || !String(node.Role).split(',').map(r => r.trim()).includes(currentRole)) {
                return false;
            }
        }
        // Check Dimension (Usually not applied to risks, but keeping consistency)
        if (currentDimension && currentDimension !== "") {
            if (node.TrustDimension && !String(node.TrustDimension).split(',').map(d => d.trim()).includes(currentDimension)) {
                return false;
            }
        }
        return true;
    }

    function getControlKey(controlString) {
        if (typeof controlString !== 'string') return null;
        const key = controlString.split(' - ')[0].trim();
        return (key.startsWith('[') && key.endsWith(']')) ? key : null;
    }

    // 4. FIND CHILDREN: Scan the whole file for Risks/Plans linked to this Requirement
    const implementationNodes = [];
    Object.values(globalData).flat().forEach(step => {
        if (step.Fields && Array.isArray(step.Fields)) {
            // Helper to dig into fieldGroups
            const collectFields = (list) => {
                list.forEach(f => {
                    if (f.FieldType === 'fieldGroup' && f.Fields) collectFields(f.Fields);
                    else if (f.Control && nodePassesFilters(f)) implementationNodes.push(f);
                });
            };
            collectFields(step.Fields);
        }
    });

    // 5. MAPPING: Link found children to this Requirement's Sub-Controls
    const subControlMap = new Map();
    
    // Initialize map with this Requirement's specific controls
    if (field.controls && Array.isArray(field.controls)) {
        field.controls.forEach(subControl => {
            const key = getControlKey(subControl.control);
            if (key) subControlMap.set(key, { subControl, children: new Set() });
        });
    }

    // Match the global risks/plans to the map
    implementationNodes.forEach(implNode => {
        if (implNode.FieldName === field.FieldName) return; // Don't link to self
        const keys = implNode.Control.split(',').map(s => s.trim());
        keys.forEach(k => {
            if (subControlMap.has(k)) subControlMap.get(k).children.add(implNode);
        });
    });

    // 6. RENDER: Build the HTML (Replicating compliance.html look)
    
    // Stats for Progress Bar
    let total = subControlMap.size;
    let matched = 0;
    subControlMap.forEach(v => { if(v.children.size > 0) matched++; });
    let pct = total > 0 ? (matched / total) * 100 : (total === 0 ? 100 : 0);
    let color = pct >= 100 ? '#22c55e' : '#2563eb';

    // Unique ID for this instance
    const uniqueId = sanitizeForId(field.FieldName) + '_comply';

    // Create Container
    const regItem = document.createElement('div');
    regItem.className = 'reg-item';
    regItem.style.cssText = "border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; margin-bottom:20px; background:white;";

    // Create Header
    const header = document.createElement('div');
    header.className = 'reg-header';
    header.style.cssText = "background:#eff6ff; padding:15px; cursor:pointer; display:flex; align-items:center; border-bottom:1px solid #e2e8f0;";
    header.innerHTML = `
        <div class="toggle-icon" style="margin-right:15px; font-weight:bold; font-size:1.2em; width:20px; text-align:center;">+</div>
        <div style="flex:1;">
            <div style="font-weight:700; color:#1e40af; margin-bottom:5px;">${field.FieldName}</div>
            <div style="background:#e0e7ff; height:18px; border-radius:9px; position:relative; overflow:hidden;">
                <div style="width:${pct}%; height:100%; background:${color}; transition:width 0.4s;"></div>
                <div style="position:absolute; top:0; width:100%; text-align:center; font-size:0.8em; line-height:18px; font-weight:600; color:#1e3a8a;">
                    ${total === 0 ? "N/A" : matched + " / " + total}
                </div>
            </div>
            <div style="font-size:0.85em; color:#64748b; margin-top:5px;">Control: ${field.Control}</div>
        </div>
    `;

    // Create Body (Hidden List)
    const content = document.createElement('ul');
    content.id = uniqueId;
    content.style.display = 'none';
    content.style.listStyle = 'none';
    content.style.padding = '0';
    content.style.margin = '0';

    if (subControlMap.size === 0) {
        content.innerHTML = '<li style="padding:15px; color:#64748b; font-style:italic;">No sub-controls defined.</li>';
    } else {
        Array.from(subControlMap.keys()).sort().forEach(key => {
            const data = subControlMap.get(key);
            const li = document.createElement('li');
            li.style.cssText = "padding:15px 20px; border-bottom:1px solid #f1f5f9;";
            
            // Sub-control text
            const title = document.createElement('div');
            title.textContent = data.subControl.control;
            title.style.fontWeight = '600';
            title.style.marginBottom = '10px';
            li.appendChild(title);

            // Children (Risks/Plans)
            if (data.children.size > 0) {
                const childList = document.createElement('ul');
                childList.style.cssText = "list-style:none; padding-left:15px; border-left:3px solid #e2e8f0;";
                
                data.children.forEach(child => {
                    const childLi = document.createElement('li');
                    childLi.style.cssText = "margin-bottom:8px; background:#f8fafc; padding:8px; border-radius:4px; display:flex; align-items:flex-start;";
                    
                    // Badge Logic
                    let bg = '#e2e8f0', txt = '#475569', type = child.FieldType || 'Field';
                    if(type === 'risk') { bg = '#fee2e2'; txt = '#991b1b'; }
                    if(type === 'plan') { bg = '#dcfce7'; txt = '#166534'; }
                    
                    childLi.innerHTML = `
                        <span style="background:${bg}; color:${txt}; padding:2px 8px; border-radius:10px; font-size:0.7em; font-weight:700; text-transform:uppercase; margin-right:10px; margin-top:3px;">${type}</span>
                        <div>
                            <div style="font-size:0.95em; font-weight:500;">${child.FieldName}</div>
                            <div style="font-size:0.8em; color:#94a3b8;">${child.Role || ''}</div>
                        </div>
                    `;
                    childList.appendChild(childLi);
                });
                li.appendChild(childList);
            } else {
                const empty = document.createElement('div');
                empty.textContent = "No matching implementations found.";
                empty.style.cssText = "font-style:italic; color:#cbd5e1; font-size:0.85em;";
                li.appendChild(empty);
            }
            content.appendChild(li);
        });
    }

    // 7. CLICK HANDLER (Internal to this specific field)
    header.addEventListener('click', () => {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        header.querySelector('.toggle-icon').textContent = isHidden ? '−' : '+';
        header.style.backgroundColor = isHidden ? '#e0e7ff' : '#eff6ff';
    });

    regItem.appendChild(header);
    regItem.appendChild(content);
    fieldDiv.appendChild(regItem);

    return fieldDiv;
}