/**
 * MindMap Handler: Tree-style hierarchical visualization
 */
function createMindMap(incapturedData, sanitizeForId, fieldStoredValue) {
    const webappData = window.originalWebappData;
    if (!webappData) return document.createElement('div');

    const mindmapData = buildMindmapData(webappData, sanitizeForId, fieldStoredValue);
    return renderMindmap(mindmapData, incapturedData || {}, sanitizeForId, fieldStoredValue);
}

/**
 * Data Processing Logic
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
    svgLayer.style.cssText = "position:absolute; top:0; left:0; width:3000px; height:3000px; pointer-events:none;";
    container.appendChild(svgLayer);

    const treeRoot = document.createElement('div');
    treeRoot.style.cssText = "position: relative; display: flex; align-items: center;";
    
    // 1. Create Root Node (The "International Public Law" equivalent)
    const rootNode = createNodeCard("AI Compliance Assessment", "#4b5e71");
    treeRoot.appendChild(rootNode);

    // 2. Container for the next level
    const childrenContainer = document.createElement('div');
    childrenContainer.style.cssText = "display: flex; flex-direction: column; gap: 20px; margin-left: 80px;";
    
    mindmapData.forEach((data, groupName) => {
        const groupWrapper = document.createElement('div');
        groupWrapper.style.cssText = "display: flex; align-items: center; position: relative;";
        
        const groupNode = createNodeCard(groupName, "#374151", true);
        groupWrapper.appendChild(groupNode);

        const subChildren = document.createElement('div');
        subChildren.style.cssText = "display: none; flex-direction: column; gap: 15px; margin-left: 80px;";
        
        data.requirements.forEach((reqData, reqKey) => {
            const reqNode = createNodeCard(`${reqKey}: ${reqData.requirement.jkName || 'Requirement'}`, "#1e293b", reqData.implementations.size > 0);
            subChildren.appendChild(reqNode);
            
            // Implementation logic could go deeper here...
        });

        groupWrapper.appendChild(subChildren);
        
        // Expansion Logic
        groupNode.querySelector('.expand-btn').onclick = () => {
            const isOpen = subChildren.style.display === 'flex';
            subChildren.style.display = isOpen ? 'none' : 'flex';
            groupNode.querySelector('.expand-btn').textContent = isOpen ? '>' : '<';
            setTimeout(() => drawAllConnections(svgLayer, container), 10);
        };

        childrenContainer.appendChild(groupWrapper);
    });

    treeRoot.appendChild(childrenContainer);
    container.appendChild(treeRoot);

    // Initial draw
    setTimeout(() => drawAllConnections(svgLayer, container), 50);

    return container;
}

/**
 * Creates a styled node card matching the image
 */
function createNodeCard(text, bgColor, hasChildren = false) {
    const card = document.createElement('div');
    card.className = "mindmap-card";
    card.style.cssText = `
        background: ${bgColor}; color: #adbac7; padding: 12px 24px;
        border-radius: 8px; font-size: 14px; min-width: 180px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3); position: relative;
        border: 1px solid rgba(255,255,255,0.1); display: flex;
        justify-content: space-between; align-items: center;
    `;
    
    const label = document.createElement('span');
    label.textContent = text.length > 40 ? text.substring(0, 40) + '...' : text;
    card.appendChild(label);

    if (hasChildren) {
        const btn = document.createElement('div');
        btn.className = "expand-btn";
        btn.textContent = ">";
        btn.style.cssText = "margin-left: 10px; cursor: pointer; opacity: 0.7; font-weight: bold;";
        card.appendChild(btn);
    }

    return card;
}

/**
 * Draws the curved lines between cards
 */
function drawAllConnections(svg, container) {
    svg.innerHTML = '';
    const cards = container.querySelectorAll('.mindmap-card');
    
    cards.forEach(card => {
        const parentWrapper = card.parentElement;
        const subContainer = parentWrapper.querySelector('div');
        
        if (subContainer && subContainer.style.display === 'flex') {
            const children = subContainer.children;
            const startX = card.offsetLeft + card.offsetWidth;
            const startY = card.offsetTop + (card.offsetHeight / 2);

            Array.from(children).forEach(child => {
                // Find the actual card inside the child wrapper if nested
                const targetCard = child.classList.contains('mindmap-card') ? child : child.querySelector('.mindmap-card');
                if (!targetCard) return;

                const endX = targetCard.getBoundingClientRect().left - container.getBoundingClientRect().left;
                const endY = (targetCard.getBoundingClientRect().top - container.getBoundingClientRect().top) + (targetCard.offsetHeight / 2);

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                const cp1x = startX + (endX - startX) / 2;
                const d = `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp1x} ${endY}, ${endX} ${endY}`;
                
                path.setAttribute("d", d);
                path.setAttribute("stroke", "#6e7681");
                path.setAttribute("stroke-width", "2");
                path.setAttribute("fill", "none");
                path.setAttribute("opacity", "0.5");
                svg.appendChild(path);
            });
        }
    });
}