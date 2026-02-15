/**
 * Creates a compliance mapping field that links requirements to their implementations
 * and displays status tracking with collapsible sections.
 * * UPDATED: To support new JSON structure where Requirements are inside 'controls' arrays
 * of FieldGroups.
 *
 * @param {object} field - The field object from the JSON data
 * @param {object} capturedData - Previously saved data to pre-fill the form
 * @param {function} sanitizeForId - Utility function to create safe HTML IDs
 * @returns {HTMLElement} The fully constructed div element for the compliance field
 */

// --- GLOBAL VARIABLES ---
let capturedData = null;

// 1. Requirement / Article Counters
let totalControls = 0;
let totalApplicableControls = 0;

// 2. Implementation Field Counters (Parent Items)
let totalImplementationFields = 0;
let totalImplementationFieldsWithResponse = 0;

// 3. Implementation Control Counters (Nested Children)
let totalImplementationControls = 0;
let totalImplementationControlsWithEvidence = 0;
 
function createComplyField(incapturedData, sanitizeForId,fieldInspector) {
    
    capturedData = incapturedData || {};
    
    // Reset global counters on every render
    totalControls = 0;
    totalApplicableControls = 0;
    totalImplementationFields = 0;
    totalImplementationFieldsWithResponse = 0;
    totalImplementationControls = 0;
    totalImplementationControlsWithEvidence = 0;
    
    const webappData = window.originalWebappData;

    if (!webappData) {
        const errDiv = document.createElement('div');
        errDiv.innerHTML = "<p style='color:red'>Error: Data not found. Please ensure window.originalWebappData is set in the main HTML file.</p>";
        return errDiv;
    }

    const complianceMap = buildComplianceMap(webappData, sanitizeForId);
    const renderedElement = renderMapping(complianceMap, sanitizeForId);

    // Optional: Log global totals for verification
    console.log("Global Compliance Totals:", {
        totalControls,
        totalApplicableControls,
        totalImplementationFields,
        totalImplementationFieldsWithResponse,
        totalImplementationControls,
        totalImplementationControlsWithEvidence
    });

    return renderedElement;
}

/**
 * Builds a map of regulations (parents) linked to requirements (sub-controls) 
 * and implementations (children).
 * * REWRITTEN for New Structure:
 * Parent = fieldGroup (e.g. "Transparency")
 * SubControl = Item inside fieldGroup.controls (e.g. "[18229-1.1] Intended Purpose")
 */
function buildComplianceMap(data, sanitizeForId) {
    const complianceMap = new Map();
    let allFields = [];

    // 1. Recursive helper to flatten all fields
    function collectFieldsRecursively(fields) {
        if (!fields || !Array.isArray(fields)) return;
        fields.forEach(field => {
            allFields.push(field);
            if (field.Fields && Array.isArray(field.Fields)) {
                collectFieldsRecursively(field.Fields);
            }
            if (field.controls && Array.isArray(field.controls)) {
                collectFieldsRecursively(field.controls);
            }
        });
    }

    // 2. Process every section
    Object.values(data).flat().forEach(step => {
        if (step.Fields) collectFieldsRecursively(step.Fields);
    });

    // 3. Pass 1: Identify "Regulation/Group" nodes
    allFields.forEach(field => {
        if (field.jkType === 'fieldGroup' && field.controls && Array.isArray(field.controls)) {
            
            const containsRequirements = field.controls.some(c => c.jkType === 'requirement');

            if (containsRequirements) {
                // Initialize the Map Entry
                if (!complianceMap.has(field.jkName)) {
                    complianceMap.set(field.jkName, {
                        parentField: field,
                        subControlLinks: new Map()
                    });
                }

                const dataEntry = complianceMap.get(field.jkName);

// Populate Sub-Controls ONLY if "Applicable"
                field.controls.forEach(req => {
                    if (req.jkType === 'requirement') {
                        const controlKey = req.requirement_control_number; 
                        
                        if (controlKey) {
                            // --- APPLICABILITY CHECK START ---
                            const sanitizeId = sanitizeForId(controlKey);
                            const soa = this.templateManager.fieldStoredValue(req, capturedData, false);
                            //capturedData[sanitizeId + '_jkSoa'];
                            
                            
                            // Only add to the map if it is marked as Applicable
                            if (soa === 'Applicable') {
                                dataEntry.subControlLinks.set(controlKey, {
                                    subControl: {
                                        // Specific fields requested
                                        requirement_control_number: req.requirement_control_number,
                                        control_number: req.control_number || controlKey,
                                        jkName: req.jkName,
                                        jkText: req.jkText, 
                                        jkType: req.jkType,
                                        jkObjective: req.jkObjective,
                                        jkImplementationStatus: req.jkImplementationStatus,
                                        jkImplementationEvidence: req.jkImplementationEvidence,
                                        
                                        // Keep these for backward compatibility with your existing script
                                        control_description: req.jkText || req.jkName,
                                        original_obj: req
                                    },
                                    children: new Set()
                                });
                            }
                            // --- APPLICABILITY CHECK END ---
                        }
                    }
                });
            }
        }
    });

    // 4. Pass 2: Link implementation nodes (Risk, Plan) to the requirements
    allFields.forEach(implNode => {
        if (implNode.requirement_control_number && implNode.jkType !== 'requirement') {
            const implControlParts = String(implNode.requirement_control_number).split(',').map(s => s.trim());

            complianceMap.forEach((data) => {
                const subControlLinks = data.subControlLinks;
                implControlParts.forEach(implKey => {
                    if (subControlLinks.has(implKey)) {
                        subControlLinks.get(implKey).children.add(implNode);
                    }
                });
            });
        }
    });

    // 5. Cleanup: Remove groups that have no applicable sub-controls
    for (const [groupName, entry] of complianceMap.entries()) {
        if (entry.subControlLinks.size === 0) {
            complianceMap.delete(groupName);
        }
    }

    return complianceMap;
}


/**
 * Renders the compliance mapping as an interactive HTML structure
 */
function renderMapping(complianceMap, sanitizeForId) {
    const container = document.createElement('div');
    container.className = 'mapping-container';

    attachToggleListener(container);

    if (complianceMap.size === 0) {
        container.innerHTML = '<p>No Compliance Requirements found in the data.</p>';
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

    // Calculate the 6 variables specifically for this Regulation/Article
    const stats = calculateProgress(data.subControlLinks, sanitizeForId);
    
    // For unique ID, use the parent FieldName (e.g. Transparency)
    const contentId = generateContentId(data.parentField);

    // Pass the stats object to the header creator
    const header = createRegHeader(data.parentField, contentId, stats);
    regItem.appendChild(header);

	const content = createSubControlList(data.subControlLinks, contentId, sanitizeForId);
	regItem.appendChild(content);

    return regItem;
}

/**
 * Creates the collapsible header displaying the 6 variables
 */
function createRegHeader(parent, contentId, stats) {
    const regHeader = document.createElement('div');
    regHeader.className = 'reg-header';
    regHeader.setAttribute('data-target', `#${contentId}`);
    regHeader.style.cursor = 'pointer';

    // In new JSON, FieldGroup doesn't have a requirement_control_number usually, 
    // so we fall back to empty string or Role if needed.
    const metaText = parent.requirement_control_number || parent.Role || "";

    regHeader.innerHTML = `
        <div class="toggle-icon" style="margin-right:10px; font-weight:bold;">+</div>
        <div class="reg-header-content" style="flex-grow:1;">
            <div class="reg-title" style="font-weight:bold; color:#1e40af;">${escapeHtml(parent.jkName)}</div>
            
            <div class="stats-container" style="display:flex; flex-wrap:wrap; gap:15px; margin-top:5px; font-size:0.85em; color:#475569;">
                <div title="Total Controls defined by the Article">
                    <strong>Total Req:</strong> ${stats.totalControls}
                </div>
                <div title="Total Applicable Controls">
                    <strong>Applicable:</strong> ${stats.totalApplicableControls}
                </div>
                <div style="border-left: 1px solid #ccc; padding-left: 10px;" title="Total Implementation Fields (Parent Items)">
                     <strong>Imp. Fields:</strong> ${stats.totalImplementationFields}
                </div>
                <div title="Implementation Fields with Response">
                     <strong>Responses:</strong> ${stats.totalImplementationFieldsWithResponse}
                </div>
                <div style="border-left: 1px solid #ccc; padding-left: 10px;" title="Total Implementation Controls (Child Items)">
                    <strong>Imp. Controls:</strong> ${stats.totalImplementationControls}
                </div>
                <div title="Implementation Controls with Evidence">
                    <strong>Evidence:</strong> ${stats.totalImplementationControlsWithEvidence}
                </div>
            </div>

            <div class="reg-meta" style="font-size:0.9em; color:#64748b; margin-top:2px;">${escapeHtml(metaText)}</div>
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

	const value = this.templateManager.fieldStoredValue(subData.subControl, capturedData, true);
	//capturedData[sanitizeForId(subData.subControl.control_number) + '_jkImplementationStatus']  
	
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

    // Create the strong element for the number
    const strong = document.createElement('strong');
    strong.textContent = subControl.control_number;

    // Create a text node for the separator and the jkText
    const textNode = document.createTextNode(` - ${subControl.jkText}`);

    // Append both to the parent div
    titleDiv.appendChild(strong);
    titleDiv.appendChild(textNode);

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

	const statusvalue = this.templateManager.fieldStoredValue(subControl, capturedData, true);
	//capturedData[`${criteriaKey}_jkImplementationStatus`]; 
	
	const evidencevalue = this.templateManager.fieldStoredValue(subControl, capturedData, false);
	//capturedData[`${criteriaKey}_jkImplementationEvidence`];  

    evidenceDiv.innerHTML = '<strong>' + (statusvalue || '') + "</strong></br>" + (evidencevalue || '');
    
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
    
    const { typeClass, typeName } = getImplementationType(child.jkType.split(':')[0]);

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
    titleDiv.textContent = child.control_number + ': ' + child.jkText;
    contentDiv.appendChild(titleDiv);

    // Create requirement controls meta
    //const requirementDiv = document.createElement('div');
    //requirementDiv.className = 'imp-meta';
    //const requirementStrong = document.createElement('strong');
    //requirementStrong.textContent = 'Requirement Controls:';
    //requirementDiv.appendChild(requirementStrong);
    //requirementDiv.appendChild(document.createTextNode(` ${child.requirement_control_number}`));
    //contentDiv.appendChild(requirementDiv);

    // Create status/response meta
	if (child.jkType !== "risk" && child.jkType !== "plan") {
        
        // --- GLOBAL COUNT FOR IMPLEMENTATION FIELDS (Parent Items) ---
        totalImplementationFields++;

		const statusDiv = document.createElement('div');
		statusDiv.className = 'imp-meta';
		const statusStrong = document.createElement('strong');
		statusStrong.textContent = 'Implementation status: ';
		statusDiv.appendChild(statusStrong);
		
		const value = this.templateManager.fieldStoredValue(child, capturedData, true);
		//capturedData[sanitizeForId(child.control_number) + "_jkImplementationStatus"];
		
		statusDiv.appendChild(document.createTextNode(` ${value || ''}`));
		contentDiv.appendChild(statusDiv);

		const evidenceDiv = document.createElement('div');
		evidenceDiv.className = 'imp-meta';
		const evidenceStrong = document.createElement('strong');
		evidenceStrong.textContent = 'Implementation evidence: ';
		evidenceDiv.appendChild(evidenceStrong);
		
		const evidencevalue = this.templateManager.fieldStoredValue(child, capturedData, false);
		//capturedData[sanitizeForId(child.control_number) + "_jkImplementationEvidence"];
		
		
		
		evidenceDiv.appendChild(document.createTextNode(` ${evidencevalue || ''}`));
		contentDiv.appendChild(evidenceDiv);
		
        // --- GLOBAL COUNT FOR IMPLEMENTATION FIELDS RESPONSE ---
        if (hasContent(value)) {
            totalImplementationFieldsWithResponse++;
        }
	}

    // Create controls section if applicable
    if (child.jkImplementationStatus !== "Not Applicable" && child.controls && Array.isArray(child.controls) && child.controls.length > 0) {
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
            const evidenceVal = this.templateManager.fieldStoredValue(ctl, capturedData, false);
            //capturedData[`${controlKey}_jkImplementationEvidence`];

            // --- GLOBAL COUNT: IMP CONTROLS (Child Controls) ---
            totalImplementationControls++;

            // --- GLOBAL COUNT: EVIDENCE (Child Controls) ---
            if (hasContent(evidenceVal)) {
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
            controlDiv.appendChild(document.createTextNode(ctl.jkText || ''));

            const brTag = document.createElement('br');
            controlDiv.appendChild(brTag);

            const statusStrong = document.createElement('strong');
            statusStrong.textContent = 'Status: ';
            controlDiv.appendChild(statusStrong);
            controlDiv.appendChild(document.createTextNode(
            this.templateManager.fieldStoredValue(ctl, capturedData, true)
            //capturedData[`${controlKey}_jkImplementationStatus`]
            || ''));

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

/**
 * Safely checks if a value has content (handles Strings and Arrays)
 */
function hasContent(val) {
    if (!val) return false;
    if (Array.isArray(val)) return val.length > 0;
    return String(val).trim() !== '';
}

function generateContentId(parent) {
    // New JSON uses 'FieldName' for Groups (e.g. Transparency)
    const base = parent.jkName || "group"; 
    const safeIdBase = base.replace(/[^a-zA-Z0-9_]/g, '-');
    return `content-${safeIdBase}`;
}

function getImplementationType(fieldType) {
    const typeMap = {
        'risk_control': { typeClass: 'type-risk', typeName: 'Risk' },
        'test_control': { typeClass: 'type-plan', typeName: 'Test' },
        'MultiSelect': { typeClass: 'type-multiSelect', typeName: 'Multi' },
    };
    return typeMap[fieldType] || { typeClass: 'type-other', typeName: 'Field' };
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe || '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/**
 * Calculates the 6 variables specifically for a given Regulation/Article
 * This allows the header to display the correct stats before the content is fully rendered
 */
function calculateProgress(subControlLinks, sanitizeForId) {
    let localTotalControls = 0;
    let localTotalApplicableControls = 0;
    let localTotalImplementationFields = 0;
    let localTotalImplementationFieldsWithResponse = 0;
    let localTotalImplementationControls = 0;
    let localTotalImplementationControlsWithEvidence = 0;

    subControlLinks.forEach((subData) => {
        // 1. Count Total Controls
        localTotalControls++;

        // 2. Count Applicable Controls
        const controlNum = subData.subControl.control_number;
        const statusVal = this.templateManager.fieldStoredValue(subData.subControl, capturedData);
        //capturedData[sanitizeForId(controlNum) + '_jkSoa'];
        
        // --- ONLY COUNT IMPLEMENTATIONS IF THE REQUIREMENT IS APPLICABLE ---
        if (statusVal !== "Not Applicable") {
            localTotalApplicableControls++;

            // 3. Loop through linked implementations
            if (subData.children) {
                subData.children.forEach(child => {
                    
                    // --- Count Implementation FIELDS (Parent Items) ---
                    if (child.jkType !== "risk" && child.jkType !== "plan") {
                        localTotalImplementationFields++;
                        
                        const responseKey = sanitizeForId(child.control_number) + "_response";
                        const responseVal = this.templateManager.fieldStoredValue(child, capturedData);
                        //capturedData[responseKey];
                        
                        if (hasContent(responseVal)) {
                            localTotalImplementationFieldsWithResponse++;
                        }
                    }

                    // --- Count Nested Implementation CONTROLS (Child Items) ---
                    if (child.jkImplementationStatus !== "Not Applicable" && child.controls && Array.isArray(child.controls)) {
                        child.controls.forEach(ctl => {
                            // Increment Implementation Controls
                            localTotalImplementationControls++;

                            // Check Evidence
                            const ctlKey = sanitizeForId(ctl.control_number) + '_evidence';
                            const evidenceVal = this.templateManager.fieldStoredValue(ctl, capturedData);
                            //capturedData[ctlKey];
                            
                            if (hasContent(evidenceVal)) {
                                localTotalImplementationControlsWithEvidence++;
                            }
                        });
                    }
                });
            }
        }
    });

    return { 
        totalControls: localTotalControls, 
        totalApplicableControls: localTotalApplicableControls,
        totalImplementationFields: localTotalImplementationFields,
        totalImplementationFieldsWithResponse: localTotalImplementationFieldsWithResponse,
        totalImplementationControls: localTotalImplementationControls, 
        totalImplementationControlsWithEvidence: localTotalImplementationControlsWithEvidence 
    };
}