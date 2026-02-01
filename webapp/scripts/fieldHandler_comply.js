/**
 * Creates a compliance mapping field that links requirements to their implementations
 * and displays status tracking with collapsible sections.
 *
 * @param {object} field - The field object from the JSON data
 * @param {object} capturedData - Previously saved data to pre-fill the form
 * @param {function} sanitizeForId - Utility function to create safe HTML IDs
 * @returns {HTMLElement} The fully constructed div element for the compliance field
 */

// --- GLOBAL VARIABLES ---
let capturedData = null;
let totalControls = 0;
let totalApplicableControls = 0;
let totalImplementationControls = 0;
let totalImplementationControlsWithEvidence = 0;
 
function createComplyField(field, incapturedData, sanitizeForId) {
    
    capturedData = incapturedData || {};
    
    // Reset global counters on every render
    totalControls = 0;
    totalApplicableControls = 0;
    totalImplementationControls = 0;
    totalImplementationControlsWithEvidence = 0;
    
    const webappData = window.originalWebappData;

    if (!webappData) {
        const errDiv = document.createElement('div');
        errDiv.innerHTML = "<p style='color:red'>Error: Data not found. Please ensure window.originalWebappData is set in the main HTML file.</p>";
        return errDiv;
    }

    const complianceMap = buildComplianceMap(webappData,sanitizeForId);
    const renderedElement = renderMapping(complianceMap, sanitizeForId);

    // Optional: Log global totals for verification
    console.log("Global Compliance Totals:", {
        totalControls,
        totalApplicableControls,
        totalImplementationControls,
        totalImplementationControlsWithEvidence
    });

    return renderedElement;
}

/**
 * Builds a map of requirements linked to their sub-controls and implementations
 */
function buildComplianceMap(data,sanitizeForId) {
    const requirementNodes = [];
    const implementationNodes = [];
    let allFields = [];

    // 1. Recursive helper
    function collectFieldsRecursively(fields) {
        if (!fields || !Array.isArray(fields)) return;

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
                const controlKey = extractControlKey(subControl.control_number);
                if (controlKey) {
                    subControlMap.set(controlKey, {
                        subControl: subControl,
                        children: new Set()
                    });
                }
            });
        }

        complianceMap.set(reqNode.FieldName, {
            parentField: reqNode,
            subControlLinks: subControlMap
        });
    });

    // 5. Link implementations
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

    // Calculate the 4 variables specifically for this Regulation/Article
    const stats = calculateProgress(data.subControlLinks, sanitizeForId);
    
    const contentId = generateContentId(data.parentField);

    // Pass the stats object to the header creator
    const header = createRegHeader(data.parentField, contentId, stats);
    regItem.appendChild(header);

	const content = createSubControlList(data.subControlLinks, contentId, sanitizeForId);
	regItem.appendChild(content);

    return regItem;
}

/**
 * Creates the collapsible header displaying the 4 variables
 */
function createRegHeader(parent, contentId, stats) {
    const regHeader = document.createElement('div');
    regHeader.className = 'reg-header';
    regHeader.setAttribute('data-target', `#${contentId}`);
    regHeader.style.cursor = 'pointer';

    regHeader.innerHTML = `
        <div class="toggle-icon" style="margin-right:10px; font-weight:bold;">+</div>
        <div class="reg-header-content" style="flex-grow:1;">
            <div class="reg-title" style="font-weight:bold; color:#1e40af;">${escapeHtml(parent.FieldName)}</div>
            
            <div class="stats-container" style="display:flex; flex-wrap:wrap; gap:15px; margin-top:5px; font-size:0.85em; color:#475569;">
                <div title="Total Controls defined by the Article">
                    <strong>Total:</strong> ${stats.totalControls}
                </div>
                <div title="Total Applicable Controls">
                    <strong>Applicable:</strong> ${stats.totalApplicableControls}
                </div>
                <div title="Total Implementation Controls">
                    <strong>Imp. Controls:</strong> ${stats.totalImplementationControls}
                </div>
                <div title="Implementation Controls with Evidence">
                    <strong>Evidence:</strong> ${stats.totalImplementationControlsWithEvidence}
                </div>
            </div>

            <div class="reg-meta" style="font-size:0.9em; color:#64748b; margin-top:2px;">${escapeHtml(parent.requirement_control_number)}</div>
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

    const subItem = createSubControlItem(subData, sanitizeForId);
    subControlList.appendChild(subItem);
    
    });

    return subControlList;
}

/**
 * Creates a single sub-control item with status dropdown and linked implementations
 */
function createSubControlItem(subData, sanitizeForId) {
    // --- GLOBAL COUNT: TOTAL CONTROLS ---
    totalControls++;

    const subItem = document.createElement('li');
    subItem.className = 'sub-control-item';
    subItem.style.listStyle = 'none';
    subItem.style.padding = '10px';
    subItem.style.borderTop = '1px solid #eee';

    // Title
    const titleDiv = createSubControlTitle(subData.subControl);
    subItem.appendChild(titleDiv);

	const value = capturedData[sanitizeForId(subData.subControl.control_number) + '_status']  
	
	if (value !== "Not Applicable") {
        // --- GLOBAL COUNT: APPLICABLE CONTROLS ---
        totalApplicableControls++;

		// Status dropdown
		const select = createStatusDropdown(subData.subControl, sanitizeForId);
		subItem.appendChild(select);
    }

    // Evidence description
    const evidenceDiv = createEvidenceDiv(subData.subControl, sanitizeForId);
    subItem.appendChild(evidenceDiv);

	// Only create and append the item if the status is NOT "Not Applicable"
	if (subData.subControl && value !== "Not Applicable") {
		// Linked implementations
		if (subData.children.size > 0) {
			const impList = createImplementationList(subData.children, sanitizeForId);
			subItem.appendChild(impList);
		} else {
			const noItemsDiv = createNoItemsMessage();
			subItem.appendChild(noItemsDiv);
		}
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

    const options = ['Select', 'Met', 'Not Met', 'Partially Met'];
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
function createEvidenceDiv(subControl, sanitizeForId) {
    const evidenceDiv = document.createElement('div');
    evidenceDiv.className = 'auto-generated-label';
    const criteriaKey = sanitizeForId(subControl.control_number);

	const statusvalue = capturedData[`${criteriaKey}_status`]; 
	const evidencevalue = capturedData[`${criteriaKey}_evidence`];  

    evidenceDiv.innerHTML = '<strong>' + statusvalue + "</strong></br>" + evidencevalue ;
    
    return evidenceDiv;
}

/**
 * Creates the list of linked implementations
 */
function createImplementationList(children, sanitizeForId) {
    const impList = document.createElement('ul');
    impList.className = 'imp-list';

    children.forEach(child => {
        const impItem = createImplementationItem(child, sanitizeForId);
        impList.appendChild(impItem);
    });

    return impList;
}

/**
 * Creates a single implementation item
 */
function createImplementationItem(child, sanitizeForId) {
    const impItem = document.createElement('li');
    impItem.className = 'imp-item';
    impItem.style.marginBottom = '5px';
    
    const { typeClass, typeName } = getImplementationType(child.FieldType);

    // Create the badge
    const badge = document.createElement('span');
    badge.className = `imp-type-badge ${typeClass}`;
    badge.textContent = typeName;
    impItem.appendChild(badge);

    // Create the content wrapper
    const contentDiv = document.createElement('div');
    contentDiv.className = 'imp-content';

    // Create title
    const titleDiv = document.createElement('div');
    titleDiv.className = 'imp-title';
    titleDiv.textContent = child.FieldName;
    contentDiv.appendChild(titleDiv);

    // Create requirement controls meta
    const requirementDiv = document.createElement('div');
    requirementDiv.className = 'imp-meta';
    const requirementStrong = document.createElement('strong');
    requirementStrong.textContent = 'Requirement Controls:';
    requirementDiv.appendChild(requirementStrong);
    requirementDiv.appendChild(document.createTextNode(` ${child.requirement_control_number}`));
    contentDiv.appendChild(requirementDiv);

    // Create status/response meta
	if (child.FieldType !== "risk" && child.FieldType !== "plan") {
		const statusDiv = document.createElement('div');
		statusDiv.className = 'imp-meta';
		const statusStrong = document.createElement('strong');
		statusStrong.textContent = 'Response: ';
		statusDiv.appendChild(statusStrong);
		const value = capturedData[sanitizeForId(child.control_number) + "_response"]  
		statusDiv.appendChild(document.createTextNode(` ${value}`));
		contentDiv.appendChild(statusDiv);
	}

    // Create controls section if applicable
    if (child.control_status !== "Not Applicable" && child.controls && Array.isArray(child.controls) && child.controls.length > 0) {
        // Controls header
        const controlsHeaderDiv = document.createElement('div');
        controlsHeaderDiv.style.marginTop = '10px';
        const controlsHeaderStrong = document.createElement('strong');
        controlsHeaderStrong.textContent = 'Controls:';
        controlsHeaderDiv.appendChild(controlsHeaderStrong);
        contentDiv.appendChild(controlsHeaderDiv);

        // Controls list items
        child.controls.forEach(ctl => {
        
            const controlKey = sanitizeForId(ctl.control_number);
            const evidenceVal = capturedData[`${controlKey}_evidence`];

            // --- GLOBAL COUNT: IMP CONTROLS ---
            totalImplementationControls++;

            // --- GLOBAL COUNT: EVIDENCE ---
            if (evidenceVal && evidenceVal.trim() !== '') {
                totalImplementationControlsWithEvidence++;
            }

            const controlDiv = document.createElement('div');
            controlDiv.style.marginTop = '5px';
            controlDiv.style.marginBottom = '10px';
            controlDiv.style.paddingLeft = '10px';
            controlDiv.style.borderLeft = '3px solid #e2e8f0';

            const controlNumberStrong = document.createElement('strong');
            controlNumberStrong.textContent = `${ctl.control_number || ''}: `;
            controlDiv.appendChild(controlNumberStrong);
            controlDiv.appendChild(document.createTextNode(ctl.control_description || ''));

            const brTag = document.createElement('br');
            controlDiv.appendChild(brTag);

            const statusStrong = document.createElement('strong');
            statusStrong.textContent = 'Status: ';
            controlDiv.appendChild(statusStrong);
            controlDiv.appendChild(document.createTextNode(capturedData[`${controlKey}_status`]|| ''));

            const brTag2 = document.createElement('br');
            controlDiv.appendChild(brTag2);

            const evidenceStrong = document.createElement('strong');
            evidenceStrong.textContent = 'Evidence: ';
            controlDiv.appendChild(evidenceStrong);
            controlDiv.appendChild(document.createTextNode(evidenceVal || ''));

            contentDiv.appendChild(controlDiv);
        });
    }

    impItem.appendChild(contentDiv);
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

/**
 * Calculates the 4 variables specifically for a given Regulation/Article
 * This allows the header to display the correct stats before the content is fully rendered
 */
function calculateProgress(subControlLinks, sanitizeForId) {
    let localTotalControls = 0;
    let localTotalApplicableControls = 0;
    let localTotalImplementationControls = 0;
    let localTotalImplementationControlsWithEvidence = 0;

    subControlLinks.forEach((subData) => {
        // 1. Count Total Controls
        localTotalControls++;

        // 2. Count Applicable Controls
        const controlNum = subData.subControl.control_number;
        const statusVal = capturedData[sanitizeForId(controlNum) + '_status'];
        
        if (statusVal !== "Not Applicable") {
            localTotalApplicableControls++;
        }

        // 3. Count Implementation Controls & Evidence (Looping through children)
        if (subData.children) {
            subData.children.forEach(child => {
                // We check if the implementation child itself is applicable
                if (child.control_status !== "Not Applicable" && child.controls && Array.isArray(child.controls)) {
                    child.controls.forEach(ctl => {
                        // Increment Implementation Controls
                        localTotalImplementationControls++;

                        // Check Evidence
                        const ctlKey = sanitizeForId(ctl.control_number) + '_evidence';
                        const evidenceVal = capturedData[ctlKey];
                        
                        if (evidenceVal && evidenceVal.trim() !== '') {
                            localTotalImplementationControlsWithEvidence++;
                        }
                    });
                }
            });
        }
    });

    return { 
        totalControls: localTotalControls, 
        totalApplicableControls: localTotalApplicableControls, 
        totalImplementationControls: localTotalImplementationControls, 
        totalImplementationControlsWithEvidence: localTotalImplementationControlsWithEvidence 
    };
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