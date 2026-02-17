/**
 * MindMap Handler: Tree-style visualization with Compliance Dashboard Header
 */
function createMindMap(incapturedData, sanitizeForId, fieldStoredValue) {
    const webappData = window.originalWebappData;
    if (!webappData) return document.createElement('div');

    const mindmapData = buildMindmapData(webappData, sanitizeForId, fieldStoredValue);
    return renderMindmap(mindmapData, incapturedData || {}, sanitizeForId, fieldStoredValue);
}

/**
 * Data Processing: Filters for "Applicable" requirements
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
                        const soaStatus = fieldStoredValue(req, false); //
                        if (controlKey && soaStatus === 'Applicable') {
                            dataEntry.requirements.set(controlKey, { 
                                requirement: req, 
                                implementations: new Set() 
                            });
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
 * Main Rendering Function with Dashboard Header and Zoom/Pan
 */
function renderMindmap(mindmapData, capturedData, sanitizeForId, fieldStoredValue) {
    // VIEWPORT
    const viewport = document.createElement('div');
    viewport.className = 'mindmap-viewport';
    viewport.style.cssText = `
        position: relative; width: 100%; height: 85vh; 
        background: #2d333b; overflow: hidden; cursor: grab;
        border-radius: 8px; border: 1px solid #444c56;
    `;

    // --- DASHBOARD HEADER ---
    let totalControls = 0;
    let totalWithEvidence = 0;

    mindmapData.forEach(group => {
        group.requirements.forEach(req => {
            req.implementations.forEach(impl => {
                totalControls++;
                if (fieldStoredValue(impl, false)) totalWithEvidence++; //
            });
        });
    });

    const percent = totalControls > 0 ? Math.round((totalWithEvidence / totalControls) * 100) : 0;

    const dashboard = document.createElement('div');
    dashboard.style.cssText = `
        position: absolute; top: 20px; left: 20px; z-index: 1001;
        background: rgba(45, 51, 59, 0.9); padding: 15px 25px;
        border-radius: 10px; border: 1px solid #444c56; color: #adbac7;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4); backdrop-filter: blur(5px);
    `;
    dashboard.innerHTML = `
        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #768390; margin-bottom: 5px;">Overall Compliance</div>
        <div style="display: flex; align-items: center; gap: 15px;">
            <div style="font-size: 24px; font-weight: bold; color: ${percent === 100 ? '#238636' : '#adbac7'}">${percent}%</div>
            <div style="width: 150px; height: 8px; background: #374151; border-radius: 4px; overflow: hidden;">
                <div style="width: ${percent}%; height: 100%; background: #238636; transition: width 1s ease;"></div>
            </div>
            <div style="font-size: 11px; color: #768390;">${totalWithEvidence} / ${totalControls} Controls</div>
        </div>
    `;
    viewport.appendChild(dashboard);

    // INNER CANVAS
    const container = document.createElement('div');
    container.className = 'mindmap-canvas';
    container.style.cssText = `
        position: absolute; width: 5000px; height: 5000px;
        top: 0; left: 0; transform-origin: 0 0;
        display: flex; align-items: flex-start; padding: 250px;
    `;
    viewport.appendChild(container);

    let scale = 1, translateX = 0, translateY = 0, isDragging = false, startX, startY;
    const updateTransform = () => container.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

    // CONTROLS UI
    const controls = document.createElement('div');
    controls.style.cssText = "position: absolute; top: 20px; right: 20px; z-index: 1000; display: flex; gap: 10px;";
    const createBtn = (icon, title, action) => {
        const btn = document.createElement('button');
        btn.innerHTML = icon; btn.title = title;
        btn.style.cssText = "background: #374151; color: white; border: 1px solid #4b5563; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px;";
        btn.onclick = (e) => { e.stopPropagation(); action(); };
        return btn;
    };
    controls.appendChild(createBtn('+', 'Zoom In', () => { scale = Math.min(scale + 0.1, 2); updateTransform(); }));
    controls.appendChild(createBtn('-', 'Zoom Out', () => { scale = Math.max(scale - 0.1, 0.3); updateTransform(); }));
    controls.appendChild(createBtn('⟲', 'Reset', () => { scale = 1; translateX = 0; translateY = 0; updateTransform(); }));
    controls.appendChild(createBtn('><', 'Collapse All', () => {
        container.querySelectorAll('.node-children-container').forEach(el => el.style.display = 'none');
        container.querySelectorAll('.expand-btn').forEach(el => el.textContent = '>');
        requestAnimationFrame(() => drawAllConnections(container));
    }));
    viewport.appendChild(controls);

    // PANNING
    viewport.onmousedown = (e) => { if (e.target.closest('.mindmap-card') || e.target.closest('button')) return; isDragging = true; startX = e.clientX - translateX; startY = e.clientY - translateY; };
    window.onmousemove = (e) => { if (!isDragging) return; translateX = e.clientX - startX; translateY = e.clientY - startY; updateTransform(); };
    window.onmouseup = () => isDragging = false;

    // SVG LAYER
    const svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgLayer.id = "mindmap-svg";
    svgLayer.style.cssText = "position:absolute; top:0; left:0; pointer-events:none; z-index: 1; width:100%; height:100%;";
    container.appendChild(svgLayer);

    const treeRoot = document.createElement('div');
    treeRoot.style.cssText = "position: relative; display: flex; align-items: center; z-index: 2;";
    treeRoot.appendChild(createNodeCard("AI Compliance Assessment", "#4b5e71", true));

    const groupsContainer = document.createElement('div');
    groupsContainer.className = "node-children-container";
    groupsContainer.style.cssText = "display: flex; flex-direction: column; gap: 30px; margin-left: 100px;";
    
    // TREE RENDERING
    mindmapData.forEach((data, groupName) => {
        const groupWrapper = document.createElement('div');
        groupWrapper.style.cssText = "display: flex; align-items: center; position: relative;";

        let groupTotalReqs = data.requirements.size;
        let groupTotalImpControls = 0;
        let groupTotalWithEvidence = 0;
        data.requirements.forEach(req => {
            req.implementations.forEach(impl => {
                groupTotalImpControls++;
                if (fieldStoredValue(impl, false)) groupTotalWithEvidence++; //
            });
        });

        const groupTooltip = `COMPLIANCE STATS (${groupName}):\n• Total Requirements: ${groupTotalReqs}\n• Total Implementation Controls: ${groupTotalImpControls}\n• Controls with Evidence: ${groupTotalWithEvidence}`;
        const groupNode = createNodeCard(groupName, "#374151", true, groupTooltip);
        groupWrapper.appendChild(groupNode);

        const reqsContainer = document.createElement('div');
        reqsContainer.className = "node-children-container";
        reqsContainer.style.cssText = "display: none; flex-direction: column; gap: 20px; margin-left: 100px;";
        
        data.requirements.forEach((reqData, reqKey) => {
            const reqWrapper = document.createElement('div');
            reqWrapper.style.cssText = "display: flex; align-items: center; position: relative;";
            let reqImpCount = reqData.implementations.size;
            let reqEvidCount = 0;
            reqData.implementations.forEach(impl => { if (fieldStoredValue(impl, false)) reqEvidCount++; }); //

            let reqColor = "#2c3e50";
            if (reqImpCount > 0) {
                if (reqEvidCount === reqImpCount) reqColor = "#238636";
                else if (reqEvidCount > 0) reqColor = "#9e6a03";
                else reqColor = "#a31d23";
            }

            const reqNode = createNodeCard(`[${reqKey}]: ${reqData.requirement.jkName || 'Requirement'}`, reqColor, (reqImpCount > 0), `REQUIREMENT DATA:\nDescription: ${reqData.requirement.jkText || 'N/A'}`);
            reqWrapper.appendChild(reqNode);

            const implsContainer = document.createElement('div');
            implsContainer.className = "node-children-container";
            implsContainer.style.cssText = "display: none; flex-direction: column; gap: 10px; margin-left: 100px;";

            reqData.implementations.forEach(impl => {
                const evidence = fieldStoredValue(impl, false) || ''; //
                const implTooltip = `IMPLEMENTATION DETAILS:\n• Status: ${fieldStoredValue(impl, true) || 'Not Set'}\n• Evidence: ${evidence || 'No evidence provided.'}`; //
                implsContainer.appendChild(createNodeCard(`${impl.control_number || 'Field'}: ${impl.jkName || 'Implementation'}`, evidence ? "#1a7f37" : "#161b22", false, implTooltip));
            });

            reqWrapper.appendChild(implsContainer);
            if (reqImpCount > 0) {
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
    rootNode.querySelector('.expand-btn').onclick = (e) => {
        e.stopPropagation();
        const isOpen = groupsContainer.style.display === 'flex';
        groupsContainer.style.display = isOpen ? 'none' : 'flex';
        rootNode.querySelector('.expand-btn').textContent = isOpen ? '>' : '<';
        requestAnimationFrame(() => drawAllConnections(container));
    };

    setTimeout(() => drawAllConnections(container), 100);
    return viewport;
}

// createNodeCard and drawAllConnections logic remain consistent from previous iteration.
function createNodeCard(text, bgColor, hasChildren = false, tooltipText = null) {
    const card = document.createElement('div');
    card.className = "mindmap-card";
    card.style.cssText = `background: ${bgColor}; color: #adbac7; padding: 12px 18px; border-radius: 8px; font-size: 12px; width: 240px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); position: relative; border: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; z-index: 5; margin: 5px 0; transition: transform 0.2s ease;`;
    
    const label = document.createElement('span');
    label.textContent = text.length > 65 ? text.substring(0, 65) + '...' : text;
    label.style.cssText = "pointer-events: none; line-height: 1.4;";
    card.appendChild(label);

    if (tooltipText) {
        let isPinned = false;
        const infoIcon = document.createElement('div');
        infoIcon.innerHTML = 'ⓘ';
        infoIcon.style.cssText = "margin-left: 8px; opacity: 0.5; font-size: 14px; cursor: help;";
        card.appendChild(infoIcon);

        const tooltip = document.createElement('div');
        tooltip.style.cssText = `visibility: hidden; position: absolute; bottom: 120%; left: 50%; transform: translateX(-50%); width: 320px; background-color: #1c2128; color: #adbac7; text-align: left; padding: 15px; border-radius: 6px; border: 1px solid #444c56; box-shadow: 0 10px 25px rgba(0,0,0,0.6); z-index: 100; font-size: 11px; line-height: 1.6; pointer-events: none; opacity: 0; transition: opacity 0.3s, visibility 0.3s; white-space: pre-wrap;`;
        tooltip.textContent = tooltipText;
        card.appendChild(tooltip);

        const show = () => { tooltip.style.visibility = 'visible'; tooltip.style.opacity = '1'; tooltip.style.pointerEvents = 'auto'; card.style.transform = 'scale(1.02)'; };
        const hide = () => { if (!isPinned) { tooltip.style.visibility = 'hidden'; tooltip.style.opacity = '0'; tooltip.style.pointerEvents = 'none'; card.style.transform = 'scale(1)'; } };

        card.onmouseenter = show; card.onmouseleave = hide;
        card.onclick = (e) => { e.stopPropagation(); isPinned = !isPinned; if (isPinned) { show(); card.style.boxShadow = '0 0 0 2px #58a6ff'; } else { card.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)'; hide(); } };
    }

    if (hasChildren) {
        const btn = document.createElement('div');
        btn.className = "expand-btn";
        btn.textContent = ">";
        btn.style.cssText = "background: rgba(255,255,255,0.1); width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 4px; cursor: pointer; font-family: monospace; font-size: 14px;";
        btn.onclick = (e) => e.stopPropagation();
        card.appendChild(btn);
    }
    return card;
}

function drawAllConnections(container) {
    const svg = container.querySelector('#mindmap-svg');
    if (!svg) return;
    svg.innerHTML = '';
    const style = window.getComputedStyle(container);
    const matrix = new WebKitCSSMatrix(style.transform);
    const currentScale = matrix.a;
    const containerRect = container.getBoundingClientRect();
    container.querySelectorAll('.mindmap-card').forEach(card => {
        const subContainer = card.parentElement.querySelector('.node-children-container');
        if (subContainer && subContainer.style.display === 'flex') {
            const cardRect = card.getBoundingClientRect();
            const startX = (cardRect.right - containerRect.left) / currentScale;
            const startY = (cardRect.top - containerRect.top + (cardRect.height / 2)) / currentScale;
            Array.from(subContainer.children).forEach(childWrapper => {
                const targetCard = childWrapper.classList.contains('mindmap-card') ? childWrapper : childWrapper.querySelector('.mindmap-card');
                if (!targetCard) return;
                const targetRect = targetCard.getBoundingClientRect();
                const endX = (targetRect.left - containerRect.left) / currentScale;
                const endY = (targetRect.top - containerRect.top + (targetRect.height / 2)) / currentScale;
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                const midX = startX + (endX - startX) * 0.4;
                path.setAttribute("d", `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`);
                path.setAttribute("stroke", "#444c56");
                path.setAttribute("stroke-width", "1.5");
                path.setAttribute("fill", "none");
                svg.appendChild(path);
            });
        }
    });
}