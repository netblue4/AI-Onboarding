/**
 * Compliance Table Handler: Removed restrictive container to allow tooltip overflow.
 */
function createComplyTable(incapturedData, sanitizeForId, fieldStoredValue) {
    const webappData = window.originalWebappData;
    if (!webappData) return document.createElement('div');

    // Keep the data processing engine
    const mindmapData = buildMindmapData(webappData, sanitizeForId, fieldStoredValue);
    return renderComplyTable(mindmapData, fieldStoredValue);
}

function renderComplyTable(mindmapData, fieldStoredValue) {
    // Creating the table directly without a restrictive wrapper
    const table = document.createElement('table');
    table.className = 'comply-table-main';
    table.style.cssText = `
        width: 100%; 
        border-collapse: collapse; 
        border: 1px solid #444c56; 
        font-size: 13px; 
        table-layout: fixed; 
        background: #2d333b; 
        color: #adbac7; 
        font-family: sans-serif;
        margin-top: 10px;
    `;

    // Table Header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr style="background: #1c2128; text-align: left;">
            <th style="${cellStyle()} width: 140px;">Article / Step</th>
            <th style="${cellStyle()} width: 140px;">Group</th>
            <th style="${cellStyle()} width: 220px;">Requirement</th>
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

                // 1. Hierarchy Columns
                tr.appendChild(createTableCell(stepName, "#4b5e71"));
                tr.appendChild(createTableCell(groupName, "#374151"));
                
                const reqText = `[${reqKey}]: ${reqEntry.requirement.jkName}`;
                const reqTooltip = `REQUIREMENT DATA:\n${reqEntry.requirement.jkText}`;
                tr.appendChild(createTableCell(reqText, "#2c3e50", reqTooltip));

                // 2. Control Sorting Logic
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

                // 3. Categorized Columns
                tr.appendChild(createCategorizedCell(defineNodes, fieldStoredValue));
                tr.appendChild(createCategorizedCell(buildNodes, fieldStoredValue));
                tr.appendChild(createCategorizedCell(testNodes, fieldStoredValue));

                tbody.appendChild(tr);
            });
        });
    });

    table.appendChild(tbody);
    return table; // Return the table directly
}

/**
 * Helper: Renders controls with click-to-show tooltips
 */
function createCategorizedCell(nodes, fieldStoredValue) {
    const td = document.createElement('td');
    td.style.cssText = cellStyle() + `background: #161b22; vertical-align: top; position: relative;`;
    
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
        item.style.cssText = `
            margin-bottom: 8px; 
            padding: 8px; 
            border-radius: 6px; 
            background: ${evidence !== 'No evidence provided.' ? "#23863622" : "#444c5622"}; 
            border: 1px solid #444c56;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const label = document.createElement('div');
        label.style.cssText = "font-size: 11px; flex-grow: 1; margin-right: 5px;";
        label.textContent = `${node.control_number}: ${node.jkName}`;
        
        item.appendChild(label);
        item.appendChild(createInfoIcon(tooltipText));
        td.appendChild(item);
    });

    return td;
}

/**
 * Helper: Standard Cell with Icon support
 */
function createTableCell(text, bgColor, tooltipText = null) {
    const td = document.createElement('td');
    td.style.cssText = cellStyle() + `background: ${bgColor}; vertical-align: top; position: relative;`;
    
    const wrapper = document.createElement('div');
    wrapper.style.cssText = "display: flex; justify-content: space-between; align-items: flex-start;";
    
    const label = document.createElement('span');
    label.textContent = text;
    
    wrapper.appendChild(label);
    if (tooltipText) wrapper.appendChild(createInfoIcon(tooltipText));
    
    td.appendChild(wrapper);
    return td;
}

/**
 * Creates the Info Icon and the Click-Logic Tooltip
 */
function createInfoIcon(text) {
    const wrapper = document.createElement('span');
    wrapper.style.cssText = "position: relative; display: inline-flex; align-items: center; height: 100%;";

    const icon = document.createElement('span');
    icon.innerHTML = 'ⓘ';
    icon.style.cssText = "cursor: pointer; color: #58a6ff; font-weight: bold; font-size: 14px; padding: 0 2px;";
    
    const tooltip = document.createElement('div');
    tooltip.className = 'compliance-tooltip';
    tooltip.style.cssText = `
        display: none; 
        position: absolute; 
        top: 25px; /* Position below the icon so it doesn't get cut off at the top */
        right: 0;
        width: 260px; 
        background: #1c2128; 
        color: #adbac7; 
        padding: 12px;
        border: 1px solid #444c56; 
        border-radius: 8px; 
        z-index: 10000;
        white-space: pre-wrap; 
        font-size: 11px; 
        box-shadow: 0 8px 24px rgba(0,0,0,0.9);
        pointer-events: auto;
    `;
    tooltip.textContent = text;

    icon.onclick = (e) => {
        e.stopPropagation();
        const isVisible = tooltip.style.display === 'block';
        // Close all other tooltips first
        document.querySelectorAll('.compliance-tooltip').forEach(t => t.style.display = 'none');
        tooltip.style.display = isVisible ? 'none' : 'block';
    };

    // Global listener to close tooltip
    document.addEventListener('click', () => { tooltip.style.display = 'none'; });

    wrapper.appendChild(icon);
    wrapper.appendChild(tooltip);
    return wrapper;
}

function cellStyle() {
    return "padding: 12px; border: 1px solid #444c56; line-height: 1.4; overflow-wrap: break-word;";
}