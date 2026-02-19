/**
 * Compliance Table Handler: Column Split & Click-Triggered Tooltips
 */
function createComplyTable(incapturedData, sanitizeForId, fieldStoredValue) {
    const webappData = window.originalWebappData;
    if (!webappData) return document.createElement('div');

    const mindmapData = buildMindmapData(webappData, sanitizeForId, fieldStoredValue);
    return renderComplyTable(mindmapData, fieldStoredValue);
}

function renderComplyTable(mindmapData, fieldStoredValue) {
    const container = document.createElement('div');
    container.className = 'comply-table-container';
    container.style.cssText = `padding: 20px; background: #2d333b; color: #adbac7; font-family: sans-serif; overflow-x: auto;`;

    const table = document.createElement('table');
    table.style.cssText = `width: 100%; border-collapse: collapse; border: 1px solid #444c56; font-size: 13px; table-layout: fixed;`;

    // Updated Table Header with Split Columns
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr style="background: #1c2128; text-align: left;">
            <th style="${cellStyle()} width: 150px;">Article / Step</th>
            <th style="${cellStyle()} width: 150px;">Group</th>
            <th style="${cellStyle()} width: 250px;">Requirement</th>
            <th style="${cellStyle()}">Define</th>
            <th style="${cellStyle()}">Build (Risk)</th>
            <th style="${cellStyle()}">Test</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    mindmapData.forEach((groups, stepName) => {
        groups.forEach((gData, groupName) => {
            gData.requirements.forEach((reqEntry, reqKey) => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid #444c56";

                // 1. Static Hierarchy Columns
                tr.appendChild(createTableCell(stepName, "#4b5e71"));
                tr.appendChild(createTableCell(groupName, "#374151"));
                
                const reqText = `[${reqKey}]: ${reqEntry.requirement.jkName}`;
                const reqTooltip = `REQUIREMENT DATA:\n${reqEntry.requirement.jkText}`;
                tr.appendChild(createTableCell(reqText, "#2c3e50", reqTooltip));

                // 2. Prepare categorized containers for this Requirement
                const defineNodes = [];
                const buildNodes = [];
                const testNodes = [];

                reqEntry.implementations.forEach(impl => {
                    const cNum = String(impl.control_number || "");
                    if (cNum.includes('T')) {
                        testNodes.push(impl);
                    } else if (cNum.includes('R')) {
                        buildNodes.push(impl);
                    } else {
                        defineNodes.push(impl);
                    }
                });

                // 3. Render Categorized Columns
                tr.appendChild(createCategorizedCell(defineNodes, fieldStoredValue));
                tr.appendChild(createCategorizedCell(buildNodes, fieldStoredValue));
                tr.appendChild(createCategorizedCell(testNodes, fieldStoredValue));

                tbody.appendChild(tr);
            });
        });
    });

    table.appendChild(tbody);
    container.appendChild(table);
    return container;
}

/**
 * Helper: Renders multiple controls inside a single categorized cell
 */
function createCategorizedCell(nodes, fieldStoredValue) {
    const td = document.createElement('td');
    td.style.cssText = cellStyle() + `background: #161b22; vertical-align: top;`;
    
    if (nodes.length === 0) {
        td.style.opacity = "0.3";
        td.textContent = "-";
        return td;
    }

    nodes.forEach(node => {
        const status = fieldStoredValue(node, true) || 'Not Set';
        const evidence = fieldStoredValue(node, false) || 'No evidence provided.';
        const tooltipText = `CONTROL DATA:\n• ID: ${node.control_number}\n• Name: ${node.jkName}\n• Description: ${node.jkText}\n\nPROGRESS:\n• Status: ${status}\n• Evidence: ${evidence}`;
        
        const item = document.createElement('div');
        item.style.cssText = `margin-bottom: 8px; padding: 5px; border-radius: 4px; background: ${evidence !== 'No evidence provided.' ? "#23863633" : "#444c5633"}; border: 1px solid #444c56;`;
        
        const label = document.createElement('div');
        label.style.fontSize = "11px";
        label.textContent = `${node.control_number}: ${node.jkName}`;
        
        item.appendChild(label);
        item.appendChild(createInfoIcon(tooltipText));
        td.appendChild(item);
    });

    return td;
}

/**
 * Helper: Create Table Cell with Click-to-Show Tooltip
 */
function createTableCell(text, bgColor, tooltipText = null) {
    const td = document.createElement('td');
    td.style.cssText = cellStyle() + `background: ${bgColor}; vertical-align: top; position: relative;`;
    
    const label = document.createElement('span');
    label.textContent = text;
    td.appendChild(label);

    if (tooltipText) {
        td.appendChild(createInfoIcon(tooltipText));
    }

    return td;
}

/**
 * Creates the Info Icon and the Click-Logic Tooltip
 */
function createInfoIcon(text) {
    const wrapper = document.createElement('span');
    wrapper.style.cssText = "position: relative; display: inline-block; margin-left: 5px;";

    const icon = document.createElement('span');
    icon.innerHTML = ' ⓘ';
    icon.style.cssText = "cursor: pointer; color: #58a6ff; font-weight: bold;";
    
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
        display: none; position: absolute; bottom: 120%; left: 50%; transform: translateX(-50%);
        width: 220px; background: #1c2128; color: #adbac7; padding: 12px;
        border: 1px solid #444c56; border-radius: 8px; z-index: 9999;
        white-space: pre-wrap; font-size: 11px; box-shadow: 0 8px 20px rgba(0,0,0,0.8);
    `;
    tooltip.textContent = text;

    icon.onclick = (e) => {
        e.stopPropagation();
        const isVisible = tooltip.style.display === 'block';
        // Close all other tooltips first
        document.querySelectorAll('.compliance-tooltip').forEach(t => t.style.display = 'none');
        tooltip.style.display = isVisible ? 'none' : 'block';
    };

    // Close tooltip if clicking anywhere else
    document.addEventListener('click', () => { tooltip.style.display = 'none'; });

    tooltip.className = 'compliance-tooltip';
    wrapper.appendChild(icon);
    wrapper.appendChild(tooltip);
    return wrapper;
}

function cellStyle() {
    return "padding: 10px; border: 1px solid #444c56; line-height: 1.4; overflow-wrap: break-word;";
}