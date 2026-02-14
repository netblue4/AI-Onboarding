/**
 * scripts/fieldHandler_comply.js
 * * Manages the compliance mapping view.
 * Uses direct JSON keys (jkName, jkText, jkObjective).
 */

// --- GLOBAL VARIABLES ---
let capturedData = null;

/**
 * Main entry point called by the app to create the Comply tab content.
 */
function createComplyField(incapturedData, sanitizeForId) {
    capturedData = incapturedData || {};
    
    // Get the global data loaded by templateManager.js
    const webappData = window.originalWebappData;

    if (!webappData) {
        const errDiv = document.createElement('div');
        errDiv.style.color = 'red';
        errDiv.style.padding = '20px';
        errDiv.textContent = "Error: Original webapp data not found. Please reload.";
        return errDiv;
    }

    // 1. Organize the data into a Map
    const complianceMap = buildComplianceMap(webappData, sanitizeForId);
    
    // 2. Turn that Map into HTML elements
    return renderMapping(complianceMap, sanitizeForId);
}

/**
 * Iterates through the JSON to find 'requirement' nodes.
 */
function buildComplianceMap(data, sanitizeForId) {
    const complianceMap = new Map();
    let allFields = [];

    // Helper to find all fields in your specific JSON structure
    function collectFieldsRecursively(fields) {
        if (!fields || !Array.isArray(fields)) return;
        fields.forEach(field => {
            allFields.push(field);
            // Look in standard nested fields and the 'controls' array
            if (field.Fields) collectFieldsRecursively(field.Fields);
            if (field.controls) collectFieldsRecursively(field.controls);
        });
    }

    // Flatten the sections (Compliance, Define, etc.) into one list
    Object.values(data).flat().forEach(step => {
        if (step.Fields) collectFieldsRecursively(step.Fields);
    });

    // Pass 1: Find Group headers (fieldGroups)
    allFields.forEach(field => {
        if (field.jkType === 'fieldGroup' && field.controls) {
            const hasReqs = field.controls.some(c => c.jkType === 'requirement');

            if (hasReqs) {
                if (!complianceMap.has(field.jkName)) {
                    complianceMap.set(field.jkName, {
                        parentField: field,
                        subControlLinks: new Map()
                    });
                }

                const entry = complianceMap.get(field.jkName);

                field.controls.forEach(req => {
                    if (req.jkType === 'requirement') {
                        const controlKey = req.requirement_control_number; 
                        if (controlKey) {
                            // Only show if the user marked it as 'Applicable' in earlier steps
                            const soa = capturedData[sanitizeForId(controlKey) + '_requirement__soa'];
                            if (soa === 'Applicable') {
                                entry.subControlLinks.set(controlKey, {
                                    requirementNode: req, 
                                    children: new Set()
                                });
                            }
                        }
                    }
                });
            }
        }
    });

    // Pass 2: Link Risks or Test Plans to these requirements
    allFields.forEach(implNode => {
        if (implNode.requirement_control_number && implNode.jkType !== 'requirement') {
            const keys = String(implNode.requirement_control_number).split(',').map(s => s.trim());
            complianceMap.forEach((groupData) => {
                keys.forEach(key => {
                    if (groupData.subControlLinks.has(key)) {
                        groupData.subControlLinks.get(key).children.add(implNode);
                    }
                });
            });
        }
    });

    return complianceMap;
}

/**
 * Builds the top-level container for the Comply view.
 */
function renderMapping(complianceMap, sanitizeForId) {
    const container = document.createElement('div');
    container.className = 'mapping-container';
    container.style.fontFamily = 'sans-serif';

    if (complianceMap.size === 0) {
        const p = document.createElement('p');
        p.textContent = 'No applicable compliance requirements to display. Please ensure requirements are marked as "Applicable" in the previous steps.';
        p.style.padding = '20px';
        container.appendChild(p);
        return container;
    }

    complianceMap.forEach((data) => {
        container.appendChild(createRegulationItem(data, sanitizeForId));
    });

    return container;
}

/**
 * Creates a collapsible group (e.g., "Transparency").
 */
function createRegulationItem(data, sanitizeForId) {
    const regItem = document.createElement('div');
    regItem.className = 'reg-item';
    regItem.style.marginBottom = '10px';
    regItem.style.border = '1px solid #ddd';
    regItem.style.borderRadius = '8px';

    const contentId = `content-${sanitizeForId(data.parentField.jkName)}`;

    // Header (Clickable)
    const header = document.createElement('div');
    header.style.padding = '15px';
    header.style.backgroundColor = '#f1f5f9';
    header.style.cursor = 'pointer';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';

    const title = document.createElement('strong');
    title.textContent = data.parentField.jkName;
    title.style.color = '#1e40af';

    const icon = document.createElement('span');
    icon.textContent = '+';
    icon.className = 'toggle-icon';

    header.appendChild(title);
    header.appendChild(icon);

    // List of Requirements
    const list = document.createElement('ul');
    list.id = contentId;
    list.style.display = 'none'; // Hidden by default
    list.style.margin = '0';
    list.style.padding = '0';
    list.style.listStyle = 'none';

    Array.from(data.subControlLinks.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([key, subData]) => {
            list.appendChild(createSubControlItem(subData, sanitizeForId));
        });

    // Toggle logic
    header.onclick = () => {
        const isHidden = list.style.display === 'none';
        list.style.display = isHidden ? 'block' : 'none';
        icon.textContent = isHidden ? '−' : '+';
    };

    regItem.appendChild(header);
    regItem.appendChild(list);

    return regItem;
}

/**
 * Creates a single requirement row with the Info/Hover icon.
 */
function createSubControlItem(subData, sanitizeForId) {
    const node = subData.requirementNode; 
    const controlId = node.requirement_control_number;

    const li = document.createElement('li');
    li.style.padding = '15px';
    li.style.borderTop = '1px solid #eee';

    // 1. Text Wrapper
    const textContainer = document.createElement('div');
    textContainer.style.display = 'flex';
    textContainer.style.alignItems = 'flex-start';
    textContainer.style.gap = '8px';

    // Hover Icon for jkObjective
    if (node.jkObjective) {
        const infoIcon = document.createElement('span');
        infoIcon.textContent = ' ⓘ';
        infoIcon.style.color = '#3b82f6';
        infoIcon.style.cursor = 'help';
        infoIcon.style.fontSize = '1.1em';
        infoIcon.title = `Objective: ${node.jkObjective}`; // Browser tooltip
        textContainer.appendChild(infoIcon);
    }

    const label = document.createElement('div');
    
    const boldId = document.createElement('strong');
    boldId.textContent = controlId;
    
    const boldName = document.createElement('strong');
    boldName.textContent = ` - ${node.jkName}: `;

    const description = document.createElement('span');
    description.textContent = node.jkText;

    label.appendChild(boldId);
    label.appendChild(boldName);
    label.appendChild(description);
    textContainer.appendChild(label);
    li.appendChild(textContainer);

    // 2. Results (Status and Evidence from capturedData)
    const resultsDiv = document.createElement('div');
    resultsDiv.style.marginTop = '10px';
    resultsDiv.style.padding = '10px';
    resultsDiv.style.backgroundColor = '#f8fafc';
    resultsDiv.style.borderRadius = '6px';
    resultsDiv.style.borderLeft = '4px solid #cbd5e1';

    const status = document.createElement('div');
    status.style.fontWeight = 'bold';
    status.style.fontSize = '0.85em';
    status.style.color = '#334155';
    status.textContent = `Status: ${capturedData[sanitizeForId(controlId) + '_status'] || 'N/A'}`;

    const evidence = document.createElement('div');
    evidence.style.fontSize = '0.9em';
    evidence.style.color = '#64748b';
    evidence.style.fontStyle = 'italic';
    evidence.style.marginTop = '4px';
    evidence.textContent = capturedData[sanitizeForId(controlId) + '_evidence'] || 'No evidence provided.';

    resultsDiv.appendChild(status);
    resultsDiv.appendChild(evidence);
    li.appendChild(resultsDiv);

    // 3. Linked Implementations (Risks/Plans)
    if (subData.children.size > 0) {
        const childUl = document.createElement('ul');
        childUl.style.marginTop = '10px';
        childUl.style.paddingLeft = '20px';
        
        subData.children.forEach(child => {
            const childLi = document.createElement('li');
            childLi.style.fontSize = '0.85em';
            childLi.style.color = '#475569';
            childLi.style.marginBottom = '4px';
            childLi.textContent = `Linked [${child.jkType}]: ${child.jkName}`;
            childUl.appendChild(childLi);
        });
        li.appendChild(childUl);
    }

    return li;
}