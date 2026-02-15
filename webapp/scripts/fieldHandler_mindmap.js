/**
 * Creates an interactive mind map visualization that links requirements to their implementations.
 * This version uses a radial layout with expandable branches.
 */
function createMindMap(incapturedData, sanitizeForId, fieldStoredValue) {
    const capturedData = incapturedData || {};
    const webappData = window.originalWebappData;
    
    if (!webappData) {
        const errDiv = document.createElement('div');
        errDiv.innerHTML = "<p style='color:red'>Error: Data not found. Please ensure window.originalWebappData is set.</p>";
        return errDiv;
    }

    const mindmapData = buildMindmapData(webappData, sanitizeForId, fieldStoredValue);
    return renderMindmap(mindmapData, capturedData, sanitizeForId, fieldStoredValue);
}

/**
 * Builds the hierarchical data structure (Remains consistent with your logic)
 */
function buildMindmapData(data, sanitizeForId, fieldStoredValue) {
    const mindmapData = new Map();
    let allFields = [];

    function collectFieldsRecursively(fields) {
        if (!fields || !Array.isArray(fields)) return;
        fields.forEach(field => {
            allFields.push(field);
            if (field.Fields) collectFieldsRecursively(field.Fields);
            if (field.controls) collectFieldsRecursively(field.controls);
        });
    }

    Object.values(data).flat().forEach(step => {
        if (step.Fields) collectFieldsRecursively(step.Fields);
    });

    allFields.forEach(field => {
        if (field.jkType === 'fieldGroup' && field.controls) {
            const containsRequirements = field.controls.some(c => c.jkType === 'requirement');
            if (containsRequirements) {
                if (!mindmapData.has(field.jkName)) {
                    mindmapData.set(field.jkName, { groupField: field, requirements: new Map() });
                }
                const dataEntry = mindmapData.get(field.jkName);
                field.controls.forEach(req => {
                    if (req.jkType === 'requirement') {
                        const controlKey = req.requirement_control_number;
                        const soa = fieldStoredValue(req, false);
                        if (controlKey && (soa === 'Applicable' || !soa)) {
                            dataEntry.requirements.set(controlKey, { requirement: req, implementations: new Set() });
                        }
                    }
                });
            }
        }
    });

    allFields.forEach(implNode => {
        if (implNode.requirement_control_number && implNode.jkType !== 'requirement') {
            const implControlParts = String(implNode.requirement_control_number).split(',').map(s => s.trim());
            mindmapData.forEach((data) => {
                implControlParts.forEach(implKey => {
                    if (data.requirements.has(implKey)) {
                        data.requirements.get(implKey).implementations.add(implNode);
                    }
                });
            });
        }
    });

    for (const [groupName, entry] of mindmapData.entries()) {
        if (entry.requirements.size === 0) mindmapData.delete(groupName);
    }

    return mindmapData;
}

/**
 * Renders the Radial Mind Map
 */
function renderMindmap(mindmapData, capturedData, sanitizeForId, fieldStoredValue) {
    const container = document.createElement('div');
    container.className = 'mindmap-canvas';
    container.style.cssText = `
        position: relative; width: 100%; min-height: 800px; 
        background: #f8fafc; overflow: hidden; display: flex; 
        justify-content: center; align-items: center; font-family: sans-serif;
    `;

    if (mindmapData.size === 0) {
        container.innerHTML = '<p style="color:#64748b;">No applicable requirements found.</p>';
        return container;
    }

    const wrapper = document.createElement('div');
    wrapper.id = 'mindmap-wrapper';
    wrapper.style.cssText = 'position: relative; width: 1px; height: 1px;';

    const centralHub = document.createElement('div');
    centralHub.style.cssText = `
        position: absolute; transform: translate(-50%, -50%);
        width: 120px; height: 120px; background: #1e293b; color: white;
        border-radius: 50%; display: flex; align-items: center; 
        justify-content: center; font-weight: bold; z-index: 100;
        box-shadow: 0 0 20px rgba(0,0,0,0.2); text-align: center;
    `;
    centralHub.innerHTML = "AI Compliance<br>Map";
    wrapper.appendChild(centralHub);

    const groups = Array.from(mindmapData.entries());
    const radius = 280;

    groups.forEach(([groupName, data], index) => {
        const angle = (index / groups.length) * (2 * Math.PI);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        const line = createSvgLine(0, 0, x, y);
        wrapper.appendChild(line);

        const groupNode = createNode(groupName, x, y, '#6366f1', () => {
            toggleBranch(groupNode, data.requirements, x, y, angle, '#f43f5e');
        });
        wrapper.appendChild(groupNode);
    });

    container.appendChild(wrapper);
    return container;
}

function createNode(label, x, y, color, onClick) {
    const node = document.createElement('div');
    node.style.cssText = `
        position: absolute; left: ${x}px; top: ${y}px;
        transform: translate(-50%, -50%); background: ${color};
        color: white; padding: 10px 18px; border-radius: 20px;
        cursor: pointer; white-space: nowrap; font-size: 13px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 10;
        transition: all 0.2s ease;
    `;
    node.textContent = label.length > 30 ? label.substring(0, 30) + '...' : label;
    node.onclick = (e) => { e.stopPropagation(); onClick(); };
    return node;
}

function createSvgLine(x1, y1, x2, y2) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.cssText = `position: absolute; top: 0; left: 0; overflow: visible; pointer-events: none;`;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1); line.setAttribute("y1", y1);
    line.setAttribute("x2", x2); line.setAttribute("y2", y2);
    line.setAttribute("stroke", "#cbd5e1"); line.setAttribute("stroke-width", "2");
    svg.appendChild(line);
    return svg;
}

function toggleBranch(parentNode, childrenMap, parentX, parentY, parentAngle, color) {
    const isExpanded = parentNode.getAttribute('data-expanded') === 'true';
    
    if (isExpanded) {
        const branchId = parentNode.getAttribute('data-branch-id');
        document.querySelectorAll(`[data-parent-id="${branchId}"]`).forEach(el => el.remove());
        parentNode.setAttribute('data-expanded', 'false');
        return;
    }

    const branchId = 'branch-' + Math.random().toString(36).substr(2, 9);
    parentNode.setAttribute('data-branch-id', branchId);
    parentNode.setAttribute('data-expanded', 'true');

    const children = Array.from(childrenMap.entries());
    const spread = Math.PI / 2; 
    const startAngle = parentAngle - spread / 2;

    children.forEach(([key, data], index) => {
        const angle = startAngle + (index / (children.length || 1)) * spread;
        const dist = 200;
        const childX = parentX + Math.cos(angle) * dist;
        const childY = parentY + Math.sin(angle) * dist;

        const line = createSvgLine(parentX, parentY, childX, childY);
        line.setAttribute('data-parent-id', branchId);
        parentNode.parentNode.appendChild(line);

        const childNode = createNode(key, childX, childY, color, () => {
            alert(`ID: ${key}\n${data.requirement.jkText || 'No description'}`);
        });
        childNode.setAttribute('data-parent-id', branchId);
        parentNode.parentNode.appendChild(childNode);
    });
}