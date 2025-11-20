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
        
        const implControl