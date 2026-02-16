/**
 * MindMap Handler: Tree-style hierarchical visualization with Bézier connections
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
    // Ensure position relative so SVG and absolute children coordinate correctly
    container.style.cssText = `
        position: relative; width: 100%; min-height: 800px; 
        background: #2d333b; overflow: auto; padding: 100px;
        display: flex; align-items: flex-start; font-family: 'Segoe UI', sans-serif;
    `;

    // The SVG must be inside the scrollable container and cover the scrollWidth/Height
    const svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgLayer.id = "mindmap-svg";
    svgLayer.style.cssText = "position:absolute; top:0; left:0; pointer-events:none; z-index: 1;";
    container.appendChild(svgLayer);

    const treeRoot = document.createElement('div');
    treeRoot.style.cssText = "position: relative; display: flex; align-items: center; z-index: 2;";
    
    // 1. Root Node
    const rootNode = createNodeCard("AI Compliance Assessment", "#4b5e71", true);
    treeRoot.appendChild(rootNode);

    // 2. Groups Level
    const childrenContainer = document.createElement('div');
    childrenContainer.className = "node-children-container";
    childrenContainer.style.cssText = "display: flex; flex-direction: column; gap: 24px; margin-left: 100px;";
    
    mindmapData.forEach((data, groupName) => {
        const groupWrapper = document.createElement('div');
        groupWrapper.style.cssText = "display: flex; align-items: center; position: relative;";
        
        const groupNode = createNodeCard(groupName, "#374151", true);
        groupWrapper.appendChild(groupNode);

        const reqChildrenContainer = document.createElement('div');
        reqChildrenContainer.className = "node-children-container";
        reqChildrenContainer.style.cssText = "display: none; flex-direction: column; gap: 16px; margin-left: 100px;";
        
        data.requirements.forEach((reqData, reqKey) => {
            const reqLabel = `${reqKey}: ${reqData.requirement.jkName || 'Requirement'}`;
            const reqNode = createNodeCard(reqLabel, "#1e293b", false);
            reqChildrenContainer.appendChild(reqNode);
        });

        groupWrapper.appendChild(reqChildrenContainer);
        
        // Toggle Logic
        groupNode.querySelector('.expand-btn').onclick = (e) => {
            e.stopPropagation();
            const isOpen = reqChildrenContainer.style.display === 'flex';
            reqChildrenContainer.style.display = isOpen ? 'none' : 'flex';
            groupNode.querySelector('.expand-btn').textContent = isOpen ? '>' : '<';
            // Slight delay to allow DOM to reflow before drawing lines
            requestAnimationFrame(() => drawAllConnections(container));
        };

        childrenContainer.appendChild(groupWrapper);
    });

    treeRoot.appendChild(childrenContainer);
    container.appendChild(treeRoot);

    // Global toggle for Root
    rootNode.querySelector('.expand-btn').onclick = (e) => {
        e.stopPropagation();
        const isOpen = childrenContainer.style.display === 'flex';
        childrenContainer.style.display = isOpen ? 'none' : 'flex';
        rootNode.querySelector('.expand-btn').textContent = isOpen ? '>' : '<';
        requestAnimationFrame(() => drawAllConnections(container));
    };

    // Initial draw and window resize handling
    window.addEventListener('resize', () => drawAllConnections(container));
    setTimeout(() => drawAllConnections(container), 100);

    return container;
}

function createNodeCard(text, bgColor, hasChildren = false) {
    const card = document.createElement('div');
    card.className = "mindmap-card";
    card.style.cssText = `
        background: ${bgColor}; color: #adbac7; padding: 14px 20px;
        border-radius: 10px; font-size: 13px; width: 220px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4); position: relative;
        border: 1px solid rgba(255,255,255,0.1); display: flex;
        justify-content: space-between; align-items: center;
        flex-shrink: 0; z-index: 5;
    `;
    
    const label = document.createElement('span');
    label.textContent = text.length > 55 ? text.substring(0, 55) + '...' : text;
    label.style.cssText = "pointer-events: none;";
    card.appendChild(label);

    if (hasChildren) {
        const btn = document.createElement('div');
        btn.className = "expand-btn";
        btn.textContent = ">";
        btn.style.cssText = `
            background: rgba(255,255,255,0.1); width: 24px; height: 24px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 4px; cursor: pointer; font-family: monospace;
        `;
        card.appendChild(btn);
    }

    return card;
}

/**
 * Enhanced Line Drawing using relative coordinates
 */
function drawAllConnections(container) {
    const svg = container.querySelector('#mindmap-svg');
    if (!svg) return;

    // Adjust SVG size to match scrollable content
    svg.setAttribute('width', container.scrollWidth);
    svg.setAttribute('height', container.scrollHeight);
    svg.innerHTML = '';

    const cards = container.querySelectorAll('.mindmap-card');
    const containerRect = container.getBoundingClientRect();

    cards.forEach(card => {
        // Find the sibling children container
        const parentWrapper = card.parentElement;
        const subContainer = parentWrapper.querySelector('.node-children-container');
        
        if (subContainer && subContainer.style.display === 'flex') {
            const cardRect = card.getBoundingClientRect();
            
            // Calculate start point (right center of parent card)
            const startX = (cardRect.right - containerRect.left) + container.scrollLeft;
            const startY = (cardRect.top - containerRect.top + (cardRect.height / 2)) + container.scrollTop;

            Array.from(subContainer.children).forEach(childWrapper => {
                // The child could be a direct card or a wrapper containing a card
                const targetCard = childWrapper.classList.contains('mindmap-card') 
                                   ? childWrapper 
                                   : childWrapper.querySelector('.mindmap-card');
                
                if (!targetCard) return;

                const targetRect = targetCard.getBoundingClientRect();
                
                // Calculate end point (left center of child card)
                const endX = (targetRect.left - containerRect.left) + container.scrollLeft;
                const endY = (targetRect.top - containerRect.top + (targetRect.height / 2)) + container.scrollTop;

                // Draw Cubic Bezier curve
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                const midX = startX + (endX - startX) * 0.5;
                
                // M = Move, C = Cubic Bezier (control point 1, control point 2, end point)
                const d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
                
                path.setAttribute("d", d);
                path.setAttribute("stroke", "#57606a");
                path.setAttribute("stroke-width", "2");
                path.setAttribute("fill", "none");
                svg.appendChild(path);
            });
        }
    });
}