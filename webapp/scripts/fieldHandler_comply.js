function createComplyField(field, capturedData, sanitizeForId) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    
 

        /**
         * Helper function to check if a field's TrustDimension contains a specific tag.
         */
        function hasTrustDimension(field, dimension) {
            if (!field || !field.TrustDimension || typeof field.TrustDimension !== 'string') {
                return false;
            }
            return field.TrustDimension.split(',').map(s => s.trim()).includes(dimension);
        }

        /**
         * Helper function to extract the control key (e.g., "[Art-10][Par-2][1]")
         * from the full control string.
         */
        function getControlKey(controlString) {
            if (typeof controlString !== 'string') return null;
            // Split at the " - " separator and take the first part
            const key = controlString.split(' - ')[0].trim();
            // Basic validation: must start with '[' and end with ']'
            if (key.startsWith('[') && key.endsWith(']')) {
                return key;
            }
            return null; // Return null if format is unexpected
        }

        function processAndRenderData(webappData) {
            // 1. Flatten all steps and extract all fields
            let allFields = [];
            Object.values(webappData).flat().forEach(step => {
                if (step.Fields && Array.isArray(step.Fields)) {
                    allFields = allFields.concat(step.Fields);
                }
            });

            // 2. Separate nodes into Requirements (Parents) and Implementations (Children)
            const requirementNodes = [];
            const implementationNodes = [];

            allFields.forEach(field => {
                if (hasTrustDimension(field, 'Requirement')) {
                    requirementNodes.push(field);
                } 
                else if (field.FieldType === 'fieldGroup' && field.Fields && Array.isArray(field.Fields)) {
                    // This is a fieldGroup, so we treat its *inner fields* as potential implementations
                    field.Fields.forEach(innerField => {
                        // Only add if it has a control to match
                        if (innerField.Control) {
                            implementationNodes.push(innerField);
                        }
                    });
                }
                else if (field.Control) {
                    // This catches top-level 'risk', 'plan', and any other field
                    // that is not a Requirement but has a Control.
                    implementationNodes.push(field);
                }
            });

            // 3. Build the compliance map.
            //    Key: Parent Requirement's FieldName
            //    Value: { parentField: object, subControlLinks: Map<string, { subControl: object, children: Set<object> }> }
            //    A Map is used here because it *preserves insertion order*, matching the JSON file order.
            const complianceMap = new Map();

            requirementNodes.forEach(reqNode => {
                const subControlMap = new Map();
                
                if (reqNode.controls && Array.isArray(reqNode.controls)) {
                    reqNode.controls.forEach(subControl => {
                        const controlKey = getControlKey(subControl.control);
                        if (controlKey) {
                            subControlMap.set(controlKey, {
                                subControl: subControl, // The full sub-control object
                                children: new Set()   // Place to store matching implementations
                            });
                        }
                    });
                }
                
                // Use FieldName as key, which is what the user iterates over later
                complianceMap.set(reqNode.FieldName, {
                    parentField: reqNode,
                    subControlLinks: subControlMap
                });
            });

            // 4. Link Implementations (Children) to the mapped Sub-Controls
            implementationNodes.forEach(implNode => {
                if (!implNode.Control) return; // This implementation can't be linked
                
                const implControlParts = implNode.Control.split(',').map(s => s.trim());

                // Check this implementation's keys against ALL sub-controls in our map
                for (const [parentName, data] of complianceMap.entries()) {
                    const subControlLinks = data.subControlLinks; // This is the Map
                    
                    for (const implKey of implControlParts) {
                        if (subControlLinks.has(implKey)) {
                            // Found a match! Add this child.
                            subControlLinks.get(implKey).children.add(implNode);
                        }
                    }
                }
            });

            // 5. Render the new, nested structure
            renderMapping(complianceMap);
        }

        function renderMapping(complianceMap) {
            const container = document.getElementById('content');
            container.innerHTML = '';

            if (complianceMap.size === 0) {
                 container.innerHTML = '<p>No "Requirement" nodes found in the data. Please check the JSON file for fields with "Requirement" in their TrustDimension.</p>';
                 return;
            }

            // *** CHANGE IS HERE ***
            // Removed alphabetical sorting.
            // We now iterate directly on complianceMap, which maintains insertion order.
            complianceMap.forEach((data, parentFieldName) => {
                const parent = data.parentField;
                const subControlLinks = data.subControlLinks; // The Map

                const regItem = document.createElement('div');
                regItem.className = 'reg-item';

                // --- Calculate Progress ---
                const totalSubControls = subControlLinks.size;
                let matchedSubControls = 0;
                
                subControlLinks.forEach(subControlData => {
                    if (subControlData.children.size > 0) {
                        matchedSubControls++;
                    }
                });

                // If 0/0, treat as 100% complete (N/A)
                const percentage = (totalSubControls > 0) ? (matchedSubControls / totalSubControls) * 100 : 0;
                const displayPercentage = (totalSubControls === 0) ? 100 : percentage;
                const progressText = (totalSubControls === 0) ? "N/A" : `${matchedSubControls} / ${totalSubControls}`;
                // Use green for 100%, blue otherwise
                const progressColor = (displayPercentage >= 100) ? 'var(--success-color)' : 'var(--primary-color)';

                // Create a unique ID for the collapsible content
                // Use the parent's control string for a more unique ID
                const safeIdBase = (parent.Control || parent.FieldName).replace(/[^a-zA-Z0-9_]/g, '-');
                const contentId = `content-${safeIdBase}`;


                // --- Render Regulatory Node Header ---
                const regHeader = document.createElement('div');
                regHeader.className = 'reg-header';
                regHeader.setAttribute('data-target', `#${contentId}`); // Link to content ID
                regHeader.setAttribute('aria-expanded', 'false');
                regHeader.setAttribute('aria-controls', contentId);
                regHeader.innerHTML = `
                    <div class="toggle-icon">+</div>
                    <div class="reg-header-content">
                        <div class="reg-title">${escapeHtml(parent.FieldName + ' - ' + parent.Control)}</div>
                        
                        <!-- Progress Bar -->
                        <div class="progress-container" title="Compliance Progress: ${progressText}">
                            <div class="progress-bar" style="width: ${displayPercentage}%; background-color: ${progressColor};"></div>
                            <div class="progress-text">${progressText}</div>
                        </div>

                        <div class="reg-meta"><strong>Top-level Control:</strong> ${escapeHtml(parent.Control)} | <strong>Trust Dimension:</strong> ${escapeHtml(parent.TrustDimension || 'N/A')}</div>
                    </div>
                `;
                regItem.appendChild(regHeader);


                // --- Render List of Sub-Controls ---
                const subControlList = document.createElement('ul');
                subControlList.className = 'sub-control-list'; // No 'expanded' by default
                subControlList.id = contentId;
                subControlList.setAttribute('aria-hidden', 'true');

                if (subControlLinks.size === 0) {
                    const noSubItems = document.createElement('li');
                    noSubItems.className = 'sub-control-item';
                    noSubItems.textContent = 'No specific sub-controls defined in the "controls" array for this requirement.';
                    subControlList.appendChild(noSubItems);
                } else {
                    // Sort sub-controls by their key (e.g., [Art-10][Par-2][1])
                    // We still sort the *sub-controls* for readability
                    const sortedSubControls = Array.from(subControlLinks.entries()).sort((a, b) => a[0].localeCompare(b[0]));
                    
                    sortedSubControls.forEach(([subControlKey, subControlData]) => {
                        const subControl = subControlData.subControl;
                        const children = subControlData.children; // The Set

                        const subControlItem = document.createElement('li');
                        subControlItem.className = 'sub-control-item';
                        
                        // Add sub-control title
                        const subControlTitle = document.createElement('div');
                        subControlTitle.className = 'sub-control-title';
                        subControlTitle.textContent = escapeHtml(subControl.control);
                        subControlItem.appendChild(subControlTitle);

                        // --- Render List of Implementations for this Sub-Control ---
                        if (children.size === 0) {
                            const noChildren = document.createElement('div');
                            noChildren.className = 'no-children';
                            noChildren.textContent = 'No matching implementation risks or plans found.';
                            subControlItem.appendChild(noChildren);
                        } else {
                            const impList = document.createElement('ul');
                            impList.className = 'imp-list';

                            const sortedChildren = Array.from(children).sort((a, b) => (a.FieldName || '').localeCompare(b.FieldName || ''));

                            sortedChildren.forEach(child => {
                                const impItem = document.createElement('li');
                                impItem.className = 'imp-item';
                                
                                // *** UPDATED BADGE LOGIC (from previous request) ***
                                let typeClass = 'type-other';
                                let typeName = child.FieldType || 'field'; // Get the original field type

                                if (typeName === 'risk') {
                                    typeClass = 'type-risk';
                                    // typeName is already 'risk'
                                } else if (typeName === 'plan') {
                                    typeClass = 'type-plan';
                                    // typeName is 'plan'
                                } else {
                                    // If it's not 'risk' or 'plan', set it to 'FIELD'
                                    typeClass = 'type-other';
                                    typeName = 'FIELD'; // Set the display name to FIELD
                                }
                                
                                impItem.innerHTML = `
                                    <span class="imp-type-badge ${typeClass}">${escapeHtml(typeName)}</span>
                                    <div class="imp-content">
                                        <div class="imp-title">${escapeHtml(child.FieldName)}</div>
                                        <div class="imp-meta">
                                            <strong>Matches Control:</strong> ${escapeHtml(child.Control)}
                                            ${child.Role ? ` | <strong>Role:</strong> ${escapeHtml(child.Role)}` : ''}
                                        </div>
                                    </div>
                                `;
                                impList.appendChild(impItem);
                            });
                            subControlItem.appendChild(impList);
                        }
                        subControlList.appendChild(subControlItem);
                    });
                }
                regItem.appendChild(subControlList);
                container.appendChild(regItem);
            });
        }

        // Utility to prevent HTML injection from JSON data
        function escapeHtml(unsafe) {
            if (typeof unsafe !== 'string') return unsafe;
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }



    return fieldDiv;
}