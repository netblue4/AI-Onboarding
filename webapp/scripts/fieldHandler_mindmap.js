/**
 * MindMap Handler: Full-depth tree visualization (Groups -> Requirements -> Controls)
 */
function createMindMap(incapturedData, sanitizeForId, fieldStoredValue) {
    const webappData = window.originalWebappData;
    if (!webappData) return document.createElement('div');

    const mindmapData = buildMindmapData(webappData, sanitizeForId, fieldStoredValue);
    return renderMindmap(mindmapData, incapturedData || {}, sanitizeForId, fieldStoredValue);
}

/**
 * Data Processing Logic (Maintains your existing logic for mapping)
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

    return mindmapData;
}

/**
 * Main Rendering Function
 */
function renderMindmap(mindmapData, capturedData, sanitizeForId, fieldStoredValue) {
    const container = document.createElement('div');
    container.className = 'mindmap-canvas';
    container.style.cssText = `
        position: relative; width: 100%; min-height: 800px; 
        background: #2d333b; overflow: auto; padding: 100px;
        display: flex; align-items: flex-start; font-family: 'Segoe UI', sans-serif;
    `;

    const svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgLayer.id = "mindmap-svg";
    svgLayer.style.cssText = "position:absolute; top:0; left:0; pointer-events:none; z-index: 1;";
    container.appendChild(svgLayer);

    const treeRoot = document.createElement('div');
    treeRoot.style.cssText = "position: relative; display: flex; align-items: center; z-index: 2;";
    
    // 1. ROOT LEVEL
    const rootNode = createNodeCard("AI Compliance Assessment", "#4b5e71", true);
    treeRoot.appendChild(rootNode);

    const groupsContainer = document.createElement('div');
    groupsContainer.className = "node-children-container";
    groupsContainer.style.cssText = "display: flex; flex-direction: column; gap: 30px; margin-left: 100px;";
    
    // 2. GROUPS LEVEL
    mindmapData.forEach((data, groupName) => {
        const groupWrapper = document.createElement('div');
        groupWrapper.style.cssText = "display: flex; align-items: center; position: relative;";
        
        const groupNode = createNodeCard(groupName, "#374151", true);
        groupWrapper.appendChild(groupNode);

        const reqsContainer = document.createElement('div');
        reqsContainer.className = "node-children-container";
        reqsContainer.style.cssText = "display: none; flex-direction: column; gap: 20px; margin-left: 100px;";
        
        // 3. REQUIREMENTS LEVEL
        data.requirements.forEach((reqData, reqKey) => {
            const reqWrapper = document.createElement('div');
            reqWrapper.style.cssText = "display: flex; align-items: center; position: relative;";

            const hasImplementations = reqData.implementations.size > 0;
            const reqLabel = `[${reqKey}]: ${reqData.requirement.jkName || 'Requirement'}`;
            const reqNode = createNodeCard(reqLabel, "#2c3e50", hasImplementations);
            reqWrapper.appendChild(reqNode);

            const implsContainer = document.createElement('div');
            implsContainer.className = "node-children-container";
            implsContainer.style.cssText = "display: none; flex-direction: column; gap: 10px; margin-left: 100px;";

            // 4. IMPLEMENTATIONS/CONTROLS LEVEL
            reqData.implementations.forEach(impl => {
                const implLabel = `${impl.control_number || 'Field'}: ${impl.jkName || impl.jkText || 'Implementation'}`;
                const implNode = createNodeCard(implLabel, "#161b22", false);
                implsContainer.appendChild(implNode);
            });

            reqWrapper.appendChild(implsContainer);

            // Toggle Requirement -> Implementations
            if (hasImplementations) {
                reqNode.querySelector('.expand-btn').onclick = (e) => {
                    e.stopPropagation();
                    const isOpen = implsContainer.style.display === 'flex';
                    implsContainer.style.display = isOpen ? 'none' : 'flex';
                    reqNode.querySelector('.expand-btn').textContent = isOpen ? '>' : '<';
                    requestAnimationFrame(() => drawAllConnections(container));
                };
            }

            reqsContainer.appendChild(reqWrapper);
        });

        groupWrapper.appendChild(reqsContainer);
        
        // Toggle Group -> Requirements
        groupNode.querySelector('.expand-btn').onclick = (e) => {
            e.stopPropagation();
            const isOpen = reqsContainer.style.display === 'flex';
            reqsContainer.style.display = isOpen ? 'none' : 'flex';
            groupNode.querySelector('.expand-btn').textContent = isOpen ? '>' : '<';
            requestAnimationFrame(() => drawAllConnections(container));
        };

        groupsContainer.appendChild(groupWrapper);
    });

    treeRoot.appendChild(groupsContainer);
    container.appendChild(treeRoot);

    // Toggle Root -> Groups
    rootNode.querySelector('.expand-btn').onclick = (e) => {
        e.stopPropagation();
        const isOpen = groupsContainer.style.display === 'flex';
        groupsContainer.style.display = isOpen ? 'none' : 'flex';
        rootNode.querySelector('.expand-btn').textContent = isOpen ? '>' : '<';
        requestAnimationFrame(() => drawAllConnections(container));
    };

    window.addEventListener('resize', () => drawAllConnections(container));
    setTimeout(() => drawAllConnections(container), 100);

    return container;
}

function createNodeCard(text, bgColor, hasChildren = false) {
    const card = document.createElement('div');
    card.className = "mindmap-card";
    card.style.cssText = `
        background: ${bgColor}; color: #adbac7; padding: 12px 18px;
        border-radius: 8px; font-size: 12px; width: 240px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3); position: relative;
        border: 1px solid rgba(255,255,255,0.1); display: flex;
        justify-content: space-between; align-items: center;
        flex-shrink: 0; z-index: 5; margin: 5px 0;
    `;
    
    const label = document.createElement('span');
    label.textContent = text.length > 65 ? text.substring(0, 65) + '...' : text;
    label.style.cssText = "pointer-events: none; line-height: 1.4;";
    card.appendChild(label);

    if (hasChildren) {
        const btn = document.createElement('div');
        btn.className = "expand-btn";
        btn.textContent = ">";
        btn.style.cssText = `
            background: rgba(255,255,255,0.1); width: 20px; height: 20px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 4px; cursor: pointer; font-family: monospace; font-size: 14px;
        `;
        card.appendChild(btn);
    }

    return card;
}

function drawAllConnections(container) {
    const svg = container.querySelector('#mindmap-svg');
    if (!svg) return;

    svg.setAttribute('width', container.scrollWidth);
    svg.setAttribute('height', container.scrollHeight);
    svg.innerHTML = '';

    const containerRect = container.getBoundingClientRect();
    const cards = container.querySelectorAll('.mindmap-card');

    cards.forEach(card => {
        const parentWrapper = card.parentElement;
        const subContainer = parentWrapper.querySelector('.node-children-container');
        
        // If subContainer is expanded, draw lines to its direct children
        if (subContainer && subContainer.style.display === 'flex') {
            const cardRect = card.getBoundingClientRect();
            const startX = (cardRect.right - containerRect.left) + container.scrollLeft;
            const startY = (cardRect.top - containerRect.top + (cardRect.height / 2)) + container.scrollTop;

            // Iterate over the wrappers in the sub-container to find the cards
            Array.from(subContainer.children).forEach(childWrapper => {
                const targetCard = childWrapper.classList.contains('mindmap-card') 
                                   ? childWrapper 
                                   : childWrapper.querySelector('.mindmap-card');
                
                if (!targetCard) return;

                const targetRect = targetCard.getBoundingClientRect();
                const endX = (targetRect.left - containerRect.left) + container.scrollLeft;
                const endY = (targetRect.top - containerRect.top + (targetRect.height / 2)) + container.scrollTop;

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                const midX = startX + (endX - startX) * 0.4;
                const d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
                
                path.setAttribute("d", d);
                path.setAttribute("stroke", "#444c56");
                path.setAttribute("stroke-width", "1.5");
                path.setAttribute("fill", "none");
                svg.appendChild(path);
            });
        }
    });
}