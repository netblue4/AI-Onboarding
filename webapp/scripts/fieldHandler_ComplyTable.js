/**
 * Compliance Table Handler
 * Converts hierarchical compliance data into a structured table view.
 */
function createComplyTable(incapturedData, sanitizeForId, fieldStoredValue) {
    const webappData = window.originalWebappData;
    if (!webappData) return document.createElement('div');

    // Reuse your existing data processing logic
    const mindmapData = buildMindmapData(webappData, sanitizeForId, fieldStoredValue);
    return renderComplyTable(mindmapData, fieldStoredValue);
}

/**
 * Main Rendering Function for the Table
 */
function renderComplyTable(mindmapData, fieldStoredValue) {
    const container = document.createElement('div');
    container.className = 'comply-table-container';
    container.style.cssText = `padding: 20px; background: #2d333b; color: #adbac7; font-family: sans-serif; overflow-x: auto;`;

    const table = document.createElement('table');
    table.style.cssText = `width: 100%; border-collapse: collapse; border: 1px solid #444c56; font-size: 13px;`;

    // Table Header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr style="background: #1c2128; text-align: left;">
            <th style="${cellStyle()}">Article / Step</th>
            <th style="${cellStyle()}">Group</th>
            <th style="${cellStyle()}">Requirement</th>
            <th style="${cellStyle()}">Implementation / Control</th>
            <th style="${cellStyle()}">Status</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    // Flattening the Map into Rows
    mindmapData.forEach((groups, stepName) => {
        groups.forEach((gData, groupName) => {
            gData.requirements.forEach((reqEntry, reqKey) => {
                
                // If no implementations, still show the requirement
                const impls = reqEntry.implementations.size > 0 
                    ? Array.from(reqEntry.implementations) 
                    : [null];

                impls.forEach((impl, index) => {
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = "1px solid #444c56";

                    // 1. Step Cell
                    if (index === 0 && groupName === Array.from(groups.keys())[0] && reqKey === Array.from(gData.requirements.keys())[0]) {
                        tr.appendChild(createTableCell(stepName, "#4b5e71"));
                    } else {
                        tr.appendChild(createTableCell("", "transparent")); // Empty for visual grouping
                    }

                    // 2. Group Cell
                    tr.appendChild(createTableCell(groupName, "#374151"));

                    // 3. Requirement Cell
                    const reqText = `[${reqKey}]: ${reqEntry.requirement.jkName}`;
                    const reqTooltip = `REQUIREMENT DATA:\n${reqEntry.requirement.jkText}`;
                    tr.appendChild(createTableCell(reqText, "#2c3e50", reqTooltip));

                    // 4. Implementation Cell
                    if (impl) {
                        const status = fieldStoredValue(impl, true) || 'Not Set';
                        const evidence = fieldStoredValue(impl, false) || 'No evidence provided.';
                        const implTooltip = `IMPLEMENTATION DATA:\n• Type: ${impl.jkType}\n• Description: ${impl.jkText}\n\nPROGRESS:\n• Status: ${status}\n• Evidence: ${evidence}`;
                        
                        tr.appendChild(createTableCell(`${impl.control_number}: ${impl.jkName}`, "#161b22", implTooltip));
                        
                        // 5. Status Cell
                        const statusCell = createTableCell(status, evidence !== 'No evidence provided.' ? "#238636" : "#9e6a03");
                        tr.appendChild(statusCell);
                    } else {
                        tr.appendChild(createTableCell("No controls linked", "#161b22"));
                        tr.appendChild(createTableCell("N/A", "#444c56"));
                    }

                    tbody.appendChild(tr);
                });
            });
        });
    });

    table.appendChild(tbody);
    container.appendChild(table);
    return container;
}

/**
 * Helper: Create a Styled Table Cell with Tooltip support
 */
function createTableCell(text, bgColor, tooltipText = null) {
    const td = document.createElement('td');
    td.style.cssText = cellStyle() + `background: ${bgColor}; vertical-align: top; position: relative;`;
    
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `display: flex; justify-content: space-between; align-items: center;`;
    
    const label = document.createElement('span');
    label.textContent = text;
    wrapper.appendChild(label);

    if (tooltipText) {
        const infoIcon = document.createElement('span');
        infoIcon.innerHTML = ' ⓘ';
        infoIcon.style.cssText = "cursor: help; opacity: 0.6; font-size: 12px; margin-left: 5px;";
        wrapper.appendChild(infoIcon);

        // Tooltip Element
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
            visibility: hidden; position: absolute; bottom: 100%; right: 0;
            width: 250px; background: #1c2128; color: #adbac7; padding: 10px;
            border: 1px solid #444c56; border-radius: 6px; z-index: 1000;
            white-space: pre-wrap; font-size: 11px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            opacity: 0; transition: opacity 0.2s; pointer-events: none;
        `;
        tooltip.textContent = tooltipText;
        td.appendChild(tooltip);

        td.onmouseenter = () => { tooltip.style.visibility = 'visible'; tooltip.style.opacity = '1'; };
        td.onmouseleave = () => { tooltip.style.visibility = 'hidden'; tooltip.style.opacity = '0'; };
    }

    td.appendChild(wrapper);
    return td;
}

function cellStyle() {
    return "padding: 12px; border: 1px solid #444c56; line-height: 1.4; min-width: 120px;";
}
