/**
 * MindMap Handler: Tree-style visualization with Phase/Step grouping
 * Hierarchy: Root -> StepName -> Group -> Requirement -> Implementation
 */
function createMindMap(incapturedData, sanitizeForId, fieldStoredValue) {
    const webappData = window.originalWebappData;
    if (!webappData) return document.createElement('div');

    const mindmapData = buildMindmapData(webappData, sanitizeForId, fieldStoredValue);
    return renderMindmap(mindmapData, incapturedData || {}, sanitizeForId, fieldStoredValue);
}

/**
 * Data Processing: Groups data by StepName before Groups
 */
function buildMindmapData(data, sanitizeForId, fieldStoredValue) {
    const mindmapData = new Map(); // Key: StepName, Value: Map of Groups

    Object.entries(data).forEach(([phaseName, steps]) => {
        steps.forEach(step => {
            const stepName = step.StepName || "General Procedure";
            
            // Initialize Step Level
            if (!mindmapData.has(stepName)) {
                mindmapData.set(stepName, new Map());
            }
            const stepGroups = mindmapData.get(stepName);

            // Flatten fields within this step to find groups and requirements
            let stepFields = [];
            function collect(fields) {
                if (!fields || !Array.isArray(fields)) return;
                fields.forEach(f => {
                    stepFields.push(f);
                    if (f.Fields) collect(f.Fields);
                    if (f.controls) collect(f.controls);
                });
            }
            collect(step.Fields);

            // Find Groups (fieldGroups) that contain Requirements
            stepFields.forEach(field => {
                if (field.jkType === 'fieldGroup' && field.controls) {
                    const containsReqs = field.controls.some(c => c.jkType === 'requirement');
                    if (containsReqs) {
                        if (!stepGroups.has(field.jkName)) {
                            stepGroups.set(field.jkName, { requirements: new Map() });
                        }
                        const groupEntry = stepGroups.get(field.jkName);

                        field.controls.forEach(req => {
                            if (req.jkType === 'requirement') {
                                const controlKey = req.requirement_control_number;
                                if (controlKey) {
                                    groupEntry.requirements.set(controlKey, {
                                        requirement: req,
                                        implementations: new Set()
                                    });
                                }
                            }
                        });
                    }
                }
            });

            // Link Implementation controls to those requirements
            stepFields.forEach(implNode => {
                if (implNode.requirement_control_number && implNode.jkType !== 'requirement') {
                    const implKeys = String(implNode.requirement_control_number).split(',').map(s => s.trim());
                    stepGroups.forEach(group => {
                        implKeys.forEach(key => {
                            if (group.requirements.has(key)) {
                                const reqEntry = group.requirements.get(key);
                                // Check applicability of parent requirement for implementation loading
                                if (fieldStoredValue(reqEntry.requirement, false) === 'Applicable') {
                                    reqEntry.implementations.add(implNode);
                                }
                            }
                        });
                    });
                }
            });
        });
    });

    // Cleanup: Remove empty Steps/Groups
    for (const [stepName, groups] of mindmapData.entries()) {
        groups.forEach((gData, gName) => {
            if (gData.requirements.size === 0) groups.delete(gName);
        });
        if (groups.size === 0) mindmapData.delete(stepName);
    }

    return mindmapData;
}

/**
 * Main Rendering Function
 */
function renderMindmap(mindmapData, capturedData, sanitizeForId, fieldStoredValue) {
    const viewport = document.createElement('div');
    viewport.className = 'mindmap-viewport';
    viewport.style.cssText = `position: relative; width: 100%; height: 85vh; background: #2d333b; overflow: hidden; cursor: grab; border-radius: 8px; border: 1px solid #444c56;`;

    // Inner Canvas
    const container = document.createElement('div');
    container.className = 'mindmap-canvas';
    container.style.cssText = `position: absolute; width: 6000px; height: 6000px; top: 0; left: 0; transform-origin: 0 0; display: flex; align-items: flex-start; padding: 300px;`;
    viewport.appendChild(container);

    // Zoom/Pan logic
    let scale = 1, translateX = 0, translateY = 0, isDragging = false, startX, startY;
    const updateTransform = () => container.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

    // Controls Panel
    const controls = document.createElement('div');
    controls.style.cssText = "position: absolute; top: 20px; right: 20px; z-index: 1000; display: flex; gap: 10px;";
    const createBtn = (icon, title, action) => {
        const btn = document.createElement('button');
        btn.innerHTML = icon; btn.style.cssText = "background: #374151; color: white; border: 1px solid #4b5563; padding: 8px 12px; border-radius: 6px; cursor: pointer;";
        btn.onclick = (e) => { e.stopPropagation(); action(); };
        return btn;
    };
    controls.appendChild(createBtn('+', 'Zoom In', () => { scale = Math.min(scale + 0.1, 2); updateTransform(); }));
    controls.appendChild(createBtn('-', 'Zoom Out', () => { scale = Math.max(scale - 0.1, 0.3); updateTransform(); }));
    controls.appendChild(createBtn('收', 'Collapse All', () => {
        container.querySelectorAll('.node-children-container').forEach(el => el.style.display = 'none');
        container.querySelectorAll('.expand-btn').forEach(el => el.textContent = '>');
        requestAnimationFrame(() => drawAllConnections(container));
    }));
    viewport.appendChild(controls);

    // Panning
    viewport.onmousedown = (e) => { if (e.target.closest('.mindmap-card') || e.target.closest('button')) return; isDragging = true; startX = e.clientX - translateX; startY = e.clientY - translateY; };
    window.onmousemove = (e) => { if (!isDragging) return; translateX = e.clientX - startX; translateY = e.clientY - startY; updateTransform(); };
    window.onmouseup = () => isDragging = false;

    // SVG Layer
    const svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgLayer.id = "mindmap-svg";
    svgLayer.style.cssText = "position:absolute; top:0; left:0; pointer-events:none; z-index: 1; width:100%; height:100%;";
    container.appendChild(svgLayer);

    // Root Hierarchy Rendering
    const treeRoot = document.createElement('div');
    treeRoot.style.cssText = "position: relative; display: flex; align-items: center; z-index: 2;";
    const rootNode = createNodeCard("AI Compliance Assessment", "#4b5e71", true);
    treeRoot.appendChild(rootNode);

    const stepsContainer = document.createElement('div');
    stepsContainer.className = "node-children-container";
    stepsContainer.style.cssText = "display: flex; flex-direction: column; gap: 40px; margin-left: 100px;";

    // LEVEL 1: StepName
    mindmapData.forEach((groups, stepName) => {
        const stepWrapper = document.createElement('div');
        stepWrapper.style.cssText = "display: flex; align-items: center; position: relative;";
        const stepNode = createNodeCard(stepName, "#2c3e50", true);
        stepWrapper.appendChild(stepNode);

        const groupsContainer = document.createElement('div');
        groupsContainer.className = "node-children-container";
        groupsContainer.style.display = 'none';
        groupsContainer.style.cssText += "flex-direction: column; gap: 30px; margin-left: 100px;";

        // LEVEL 2: Requirement Group (e.g., Transparency)
        groups.forEach((gData, groupName) => {
            const groupWrapper = document.createElement('div');
            groupWrapper.style.cssText = "display: flex; align-items: center; position: relative;";
            const groupNode = createNodeCard(groupName, "#374151", true);
            groupWrapper.appendChild(groupNode);

            const reqsContainer = document.createElement('div');
            reqsContainer.className = "node-children-container";
            reqsContainer.style.display = 'none';
            reqsContainer.style.cssText += "flex-direction: column; gap: 20px; margin-left: 100px;";

            // LEVEL 3: Requirements
            gData.requirements.forEach((reqEntry, reqKey) => {
                const reqWrapper = document.createElement('div');
                reqWrapper.style.cssText = "display: flex; align-items: center; position: relative;";
                
                let reqColor = fieldStoredValue(reqEntry.requirement, false) === 'Applicable' ? "#238636" : "#4b5563";
                const reqNode = createNodeCard(`[${reqKey}]: ${reqEntry.requirement.jkName}`, reqColor, (reqEntry.implementations.size > 0), `Requirement: ${reqEntry.requirement.jkText}`);
                reqWrapper.appendChild(reqNode);

                const implsContainer = document.createElement('div');
                implsContainer.className = "node-children-container";
                implsContainer.style.display = 'none';
                implsContainer.style.cssText += "flex-direction: column; gap: 10px; margin-left: 100px;";

                // LEVEL 4: Implementations
                reqEntry.implementations.forEach(impl => {
                    implsContainer.appendChild(createNodeCard(`${impl.control_number}: ${impl.jkName}`, "#161b22", false, `Type: ${impl.jkType}\nDesc: ${impl.jkText}`));
                });

                reqWrapper.appendChild(implsContainer);
                if (reqEntry.implementations.size > 0) {
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

        stepWrapper.appendChild(groupsContainer);
        stepNode.querySelector('.expand-btn').onclick = (e) => {
            e.stopPropagation();
            const isOpen = groupsContainer.style.display === 'flex';
            groupsContainer.style.display = isOpen ? 'none' : 'flex';
            stepNode.querySelector('.expand-btn').textContent = isOpen ? '>' : '<';
            requestAnimationFrame(() => drawAllConnections(container));
        };
        stepsContainer.appendChild(stepWrapper);
    });

    treeRoot.appendChild(stepsContainer);
    container.appendChild(treeRoot);
    rootNode.querySelector('.expand-btn').onclick = (e) => {
        e.stopPropagation();
        const isOpen = stepsContainer.style.display === 'flex';
        stepsContainer.style.display = isOpen ? 'none' : 'flex';
        rootNode.querySelector('.expand-btn').textContent = isOpen ? '>' : '<';
        requestAnimationFrame(() => drawAllConnections(container));
    };

    setTimeout(() => drawAllConnections(container), 100);
    return viewport;
}

// createNodeCard and drawAllConnections logic remain consistent with previous build.
function createNodeCard(text, bgColor, hasChildren = false, tooltipText = null) {
    const card = document.createElement('div');
    card.className = "mindmap-card";
    card.style.cssText = `background: ${bgColor}; color: #adbac7; padding: 12px 18px; border-radius: 8px; font-size: 11px; width: 220px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); position: relative; border: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; z-index: 5; margin: 5px 0; transition: transform 0.2s ease;`;
    
    const label = document.createElement('span');
    label.textContent = text.length > 55 ? text.substring(0, 55) + '...' : text;
    card.appendChild(label);

    if (tooltipText) {
        let isPinned = false;
        const infoIcon = document.createElement('div');
        infoIcon.innerHTML = 'ⓘ';
        infoIcon.style.cssText = "margin-left: 8px; opacity: 0.5; font-size: 14px; cursor: help;";
        card.appendChild(infoIcon);

        const tooltip = document.createElement('div');
        tooltip.style.cssText = `visibility: hidden; position: absolute; bottom: 120%; left: 50%; transform: translateX(-50%); width: 280px; background-color: #1c2128; color: #adbac7; text-align: left; padding: 12px; border-radius: 6px; border: 1px solid #444c56; box-shadow: 0 10px 25px rgba(0,0,0,0.6); z-index: 100; font-size: 11px; line-height: 1.5; pointer-events: none; opacity: 0; transition: opacity 0.3s; white-space: pre-wrap;`;
        tooltip.textContent = tooltipText;
        card.appendChild(tooltip);

        const show = () => { tooltip.style.visibility = 'visible'; tooltip.style.opacity = '1'; tooltip.style.pointerEvents = 'auto'; card.style.transform = 'scale(1.02)'; };
        const hide = () => { if (!isPinned) { tooltip.style.visibility = 'hidden'; tooltip.style.opacity = '0'; card.style.transform = 'scale(1)'; } };

        card.onmouseenter = show; card.onmouseleave = hide;
        card.onclick = (e) => { e.stopPropagation(); isPinned = !isPinned; if (isPinned) { show(); card.style.boxShadow = '0 0 0 2px #58a6ff'; } else { card.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)'; hide(); } };
    }

    if (hasChildren) {
        const btn = document.createElement('div');
        btn.className = "expand-btn";
        btn.textContent = ">";
        btn.style.cssText = "background: rgba(255,255,255,0.1); width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 4px; cursor: pointer;";
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