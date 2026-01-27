/**
 * Creates a compliance mapping field that links requirements to their implementations
 * and displays status tracking with collapsible sections.
 *
 * @param {object} field - The field object from the JSON data
 * @param {object} capturedData - Previously saved data to pre-fill the form
 * @param {function} sanitizeForId - Utility function to create safe HTML IDs
 * @returns {HTMLElement} The fully constructed div element for the compliance field
 */
 
 let capturedData = null;
 
function createComplyField(field, incapturedData, sanitizeForId) {
    
    capturedData = capturedData || {};
    
    const webappData = window.originalWebappData;

    if (!webappData) {
        const errDiv = document.createElement('div');
        errDiv.innerHTML = "<p style='color:red'>Error: Data not found. Please ensure window.originalWebappData is set in the main HTML file.</p>";
        return errDiv;
    }

    const complianceMap = buildComplianceMap(webappData,sanitizeForId);
    return renderMapping(complianceMap, sanitizeForId);
}

/**
 * Builds a map of requirements linked to their sub-controls and implementations
 */
function buildComplianceMap(data,sanitizeForId) {
    const requirementNodes = [];
    const implementationNodes = [];
    let allFields = [];

    // 1. Recursive helper (Kept from previous fix)
    function collectFieldsRecursively(fields) {
        if (!fields || !Array.isArray(fields)) return;

//field ID is incorrect

        fields.forEach(field => {
            allFields.push(field);
            if (field.Fields && Array.isArray(field.Fields)) {
                collectFieldsRecursively(field.Fields);
            }
        });
    }

    // 2. Flatten all fields recursively
    Object.values(data).flat().forEach(step => {
        if (step.Fields) {
            collectFieldsRecursively(step.Fields);
        }
    });

    // 3. Categorize fields
    allFields.forEach(field => {
        if (hasRequirementTrustDimension(field)) {
            requirementNodes.push(field);
        } else if (isImplementation(field)) {
            implementationNodes.push(field);
        }
    });

    // 4. Build the compliance map
    const complianceMap = new Map();

    requirementNodes.forEach(reqNode => {
        if (!reqNode.FieldName) return;

        const subControlMap = new Map();
        
        if (reqNode.controls && Array.isArray(reqNode.controls)) {
            reqNode.controls.forEach(subControl => {
                const controlKey = sanitizeForId(extractControlKey(subControl.control_number));
                if (controlKey) {
                    subControlMap.set(controlKey, {
                        subControl: subControl,
                        children: new Set()
                    });
                }
            });
        }

        // Only add the requirement node if it has relevant controls remaining
        // (Optional: remove this check if you still want the parent header to appear even if empty)
        complianceMap.set(reqNode.FieldName, {
            parentField: reqNode,
            subControlLinks: subControlMap
        });
    });

    // 5. Link implementations (Logic remains the same)
    linkImplementations(implementationNodes, complianceMap);

    return complianceMap;
}

/**
 * Links implementation nodes to their corresponding requirement sub-controls
 */
function linkImplementations(implementationNodes, complianceMap) {
    implementationNodes.forEach(implNode => {
        if (!implNode.requirement_control_number) return;

        const implControlParts = implNode.requirement_control_number.split(',').map(s => s.trim());

        for (const [parentName, data] of complianceMap.entries()) {
            const subControlLinks = data.subControlLinks;
            
            for (const implKey of implControlParts) {
                if (subControlLinks.has(implKey)) {
                    // Get the reference to the sub-control entry
                    const linkEntry = subControlLinks.get(implKey);

                    // --- UPDATED LOGIC START ---
                    // Check if the Parent Sub-Control is "Not Applicable"
                    if (linkEntry.subControl && linkEntry.subControl.control_status === "Not Applicable") {
                        
                        // 1. Update the child node's main status
                        implNode.control_status = "Not Applicable";

                        // 2. Iterate through the child's nested 'controls' array
                        //if (implNode.controls && Array.isArray(implNode.controls)) {
                        //    implNode.controls.forEach(childControl => {
                        //        childControl.control_status = "Not Applicable";
                        //    });
                        //}
                    }else{
                    	delete implNode.control_status;
                    }
                    // --- UPDATED LOGIC END ---

                    linkEntry.children.add(implNode);
                }
            }
        }
    });
}


/**
 * Renders the compliance mapping as an interactive HTML structure
 */
function renderMapping(complianceMap, sanitizeForId) {
    const container = document.createElement('div');
    container.className = 'mapping-container';

    attachToggleListener(container);

    if (complianceMap.size === 0) {
        container.innerHTML = '<p>No "Requirement" nodes found.</p>';
        return container;
    }

    complianceMap.forEach((data, parentFieldName) => {
        const regItem = createRegulationItem(data, sanitizeForId);
        container.appendChild(regItem);
    });

    return container;
}

/**
 * Creates a single regulation item with header and collapsible content
 */
function createRegulationItem(data, sanitizeForId) {
    const regItem = document.createElement('div');
    regItem.className = 'reg-item';

    const { progressPercentage, matchedControls, totalControls } = calculateProgress(data.subControlLinks);
    const contentId = generateContentId(data.parentField);

    const header = createRegHeader(data.parentField, contentId, progressPercentage);
    regItem.appendChild(header);

    const content = createSubControlList(data.subControlLinks, contentId, sanitizeForId);
    regItem.appendChild(content);

    return regItem;
}

/**
 * Creates the collapsible header with toggle icon and progress bar
 */
function createRegHeader(parent, contentId, progressPercentage) {
    const regHeader = document.createElement('div');
    regHeader.className = 'reg-header';
    regHeader.setAttribute('data-target', `#${contentId}`);
    regHeader.style.cursor = 'pointer';

    const progressColor = progressPercentage >= 100 ? 'var(--success-color, #22c55e)' : 'var(--primary-color, #2563eb)';

    regHeader.innerHTML = `
        <div class="toggle-icon" style="margin-right:10px; font-weight:bold;">+</div>
        <div class="reg-header-content" style="flex-grow:1;">
            <div class="reg-title" style="font-weight:bold; color:#1e40af;">${escapeHtml(parent.FieldName)}</div>
            <div class="progress-container" style="background:#e0e7ff; height:10px; border-radius:5px; margin-top:5px;">
                <div class="progress-bar" style="width: ${progressPercentage}%; background-color: ${progressColor}; height:100%;"></div>
            </div>
            <div class="reg-meta" style="font-size:0.9em; color:#64748b;">${escapeHtml(parent.requirement_control_number)}</div>
        </div>
    `;

    return regHeader;
}

/**
 * Creates the collapsible content area with sub-controls
 */
function createSubControlList(subControlLinks, contentId, sanitizeForId) {
    const subControlList = document.createElement('ul');
    subControlList.className = 'sub-control-list';
    subControlList.id = contentId;
    subControlList.style.display = 'none';
    subControlList.style.padding = '0';

    if (subControlLinks.size === 0) {
        subControlList.innerHTML = '<li class="sub-control-item" style="padding:10px;">No sub-controls.</li>';
        return subControlList;
    }

    const sortedSubControls = Array.from(subControlLinks.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    sortedSubControls.forEach(([key, subData]) => {
        // --- NEW LOGIC START ---
        // Only create and append the item if the status is NOT "Not Applicable"
        // We use ?. (optional chaining) to be safe in case subControl is undefined
        if (subData.subControl?.control_status !== "Not Applicable") {
            const subItem = createSubControlItem(subData, sanitizeForId);
            subControlList.appendChild(subItem);
        }
        // --- NEW LOGIC END ---
    });

    return subControlList;
}

/**
 * Creates a single sub-control item with status dropdown and linked implementations
 */
function createSubControlItem(subData, sanitizeForId) {
    const subItem = document.createElement('li');
    subItem.className = 'sub-control-item';
    subItem.style.listStyle = 'none';
    subItem.style.padding = '10px';
    subItem.style.borderTop = '1px solid #eee';

    // Title
    const titleDiv = createSubControlTitle(subData.subControl);
    subItem.appendChild(titleDiv);

    // Status dropdown
    const select = createStatusDropdown(subData.subControl, sanitizeForId);
    subItem.appendChild(select);

    // Evidence description
    const evidenceDiv = createEvidenceDiv(subData.subControl);
    subItem.appendChild(evidenceDiv);

    // Linked implementations
    if (subData.children.size > 0) {
        const impList = createImplementationList(subData.children);
        subItem.appendChild(impList);
    } else {
        const noItemsDiv = createNoItemsMessage();
        subItem.appendChild(noItemsDiv);
    }

    return subItem;
}

/**
 * Creates the sub-control title element
 */
function createSubControlTitle(subControl) {
    const titleDiv = document.createElement('div');
    titleDiv.className = 'sub-control-title';
    titleDiv.innerHTML = `<strong>${escapeHtml(subControl.control_number)}</strong> - ${escapeHtml(subControl.control_description)}`;
    return titleDiv;
}

/**
 * Creates the status dropdown select element
 */
function createStatusDropdown(subControl, sanitizeForId) {
    const select = document.createElement('select');
    select.style.margin = '5px 0 10px 0';
    select.style.padding = '4px';
    select.style.borderRadius = '4px';
    select.style.border = '1px solid #ccc';
    select.name = sanitizeForId(subControl.control_number) + '_complystatus';

    const options = ['Select', 'N/A', 'Met', 'Not Met', 'Partially Met'];
    options.forEach((optionText) => {
        const option = document.createElement('option');
        option.value = optionText;
        option.textContent = optionText;
        select.appendChild(option);
    });

    return select;
}

/**
 * Creates the evidence/description div
 */
function createEvidenceDiv(subControl) {
    const evidenceDiv = document.createElement('div');
    evidenceDiv.className = 'auto-generated-label';
    const sanitizedId = sanitizeForId(controlItem.control_number);
    evidenceDiv.innerHTML = capturedData[`${controlKey}_evidence`];
    sanitizeForId(subControl.control_number)
    
    return evidenceDiv;
}

/**
 * Creates the list of linked implementations
 */
function createImplementationList(children) {
    const impList = document.createElement('ul');
    impList.className = 'imp-list';

    children.forEach(child => {
        const impItem = createImplementationItem(child);
        impList.appendChild(impItem);
    });

    return impList;
}

/**
 * Creates a single implementation item
 */
function createImplementationItem(child) {
    const impItem = document.createElement('li');
    impItem.className = 'imp-item';
    impItem.style.marginBottom = '5px';

    const { typeClass, typeName } = getImplementationType(child.FieldType);


	let controlsHtml = '';
	if (child.control_status !== "Not Applicable") {
		// --- NEW LOGIC: Build the Controls List ---
			
		if (child.controls && Array.isArray(child.controls) && child.controls.length > 0) {
			// Create the header
			controlsHtml += '<div style="margin-top: 10px;"><strong>Controls:</strong></div>';
			
			// Loop through each control in the array
			const controlsList = child.controls.map(ctl => `
				<div style="margin-top: 5px; margin-bottom: 10px; padding-left: 10px; border-left: 3px solid #e2e8f0;">
					<strong>${escapeHtml(ctl.control_number || '')}: </strong>${escapeHtml(ctl.control_description || '')}<br>
					<strong>Status:</strong> ${escapeHtml(ctl.control_status || '')}<br>
					</strong>Evidence:</strong>${escapeHtml(ctl.control_evidence || '')}
				</div>
			`).join('');
	
			controlsHtml += controlsList;
		}
    }
    // Determine the Label and the Value
    const label = child.control_status ? "Status" : "Response";
    const value = child.control_status || child.CapturedData || '';

    impItem.innerHTML = `<span class="imp-type-badge ${typeClass}">${escapeHtml(typeName)}</span>
        <div class="imp-content">
            <div class="imp-title">${escapeHtml(child.FieldName)}</div>
            <div class="imp-meta">
                <strong>Requirement Controls:</strong> ${escapeHtml(child.requirement_control_number)}
            </div>
            <div class="imp-meta">
                <strong>${label}:</strong> ${escapeHtml(value)}
            </div>            
            ${controlsHtml}    
        </div>`;

    return impItem;
}

/**
 * Creates the "No linked items" message
 */
function createNoItemsMessage() {
    const noItemsDiv = document.createElement('div');
    noItemsDiv.style.color = '#999';
    noItemsDiv.style.fontStyle = 'italic';
    noItemsDiv.textContent = 'No linked items.';
    return noItemsDiv;
}

/**
 * Attaches the click listener for collapsible toggle functionality
 */
function attachToggleListener(container) {
    container.addEventListener('click', event => {
        const header = event.target.closest('.reg-header');
        if (!header) return;

        const targetId = header.getAttribute('data-target');
        if (!targetId) return;

        const content = container.querySelector(targetId);
        const icon = header.querySelector('.toggle-icon');

        if (content && icon) {
            toggleContent(content, icon, header);
        }
    });
}

/**
 * Toggles the visibility of collapsible content
 */
function toggleContent(content, icon, header) {
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

// --- UTILITY FUNCTIONS ---

function hasRequirementTrustDimension(field) {
    if (!field || !field.TrustDimension) return false;
    return field.TrustDimension.includes('Requirement');
}

function isImplementation(field) {
    if (field.FieldType === 'fieldGroup' && field.Fields && Array.isArray(field.Fields)) {
        return field.Fields.some(f => f.requirement_control_number);
    }
    return !!field.requirement_control_number;
}

function extractControlKey(str) {
    if (!str) return null;
    const key = str.split(' - ')[0].trim();
    return (key.startsWith('[') && key.endsWith(']')) ? key : null;
}

function calculateProgress(subControlLinks) {
    const totalControls = subControlLinks.size;
    let matchedControls = 0;

    subControlLinks.forEach(d => {
        if (d.children.size > 0) matchedControls++;
    });

    const progressPercentage = totalControls > 0 ? (matchedControls / totalControls) * 100 : 100;
    return { progressPercentage, matchedControls, totalControls };
}

function generateContentId(parent) {
    const safeIdBase = (parent.requirement_control_number || parent.FieldName).replace(/[^a-zA-Z0-9_]/g, '-');
    return `content-${safeIdBase}`;
}

function getImplementationType(fieldType) {
    const typeMap = {
        'risk': { typeClass: 'type-risk', typeName: 'risk' },
        'plan': { typeClass: 'type-plan', typeName: 'plan' },
    };
    return typeMap[fieldType] || { typeClass: 'type-other', typeName: 'FIELD' };
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}