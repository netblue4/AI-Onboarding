/**
 * Compliance Table Handler: Table view with inline dropdown + Attack Vectors per control card.
 */
function createComplyTable(incapturedData, sanitizeForId, fieldStoredValue) {
    const webappData = window.originalWebappData;
    if (!webappData) return document.createElement('div');

    const mindmapData = buildMindmapData(webappData, sanitizeForId, fieldStoredValue);
    return renderComplyTable(mindmapData, fieldStoredValue, sanitizeForId);
}

function renderComplyTable(mindmapData, fieldStoredValue, sanitizeForId) {
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

                // Hierarchy Columns
                tr.appendChild(createTableCell(stepName, "#4b5e71"));
                tr.appendChild(createTableCell(groupName, "#374151"));

                // Requirement Column — now with dropdown + attack vectors
                tr.appendChild(createRequirementCell(reqEntry, reqKey, fieldStoredValue, sanitizeForId, mindmapData));

                // Control Sorting
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

                // Categorized Columns — with dropdown + attack vectors
                tr.appendChild(createCategorizedCell(defineNodes, fieldStoredValue, sanitizeForId, reqEntry, mindmapData));
                tr.appendChild(createCategorizedCell(buildNodes, fieldStoredValue, sanitizeForId, reqEntry, mindmapData));
                tr.appendChild(createCategorizedCell(testNodes, fieldStoredValue, sanitizeForId, reqEntry, mindmapData));

                tbody.appendChild(tr);
            });
        });
    });

    table.appendChild(tbody);
    return table;
}

/**
 * Helper: Renders the Requirement card with dropdown + Attack Vectors,
 * mirroring the pattern used in createCategorizedCell.
 */
function createRequirementCell(reqEntry, reqKey, fieldStoredValue, sanitizeForId, mindmapData) {
    const req = reqEntry.requirement;
    const td = document.createElement('td');
    td.style.cssText = cellStyle() + `background: #2c3e50; vertical-align: top; position: relative;`;

    const currentStatus = req.jkType === 'requirement'
        ? (fieldStoredValue(req, true) || 'Select')
        : null;

    // --- Outer card ---
    const card = document.createElement('div');
    card.style.cssText = `
        border-radius: 6px;
        border: 1px solid #444c56;
        background: #1c2128;
        overflow: hidden;
    `;

    // --- Card Header (collapsible) ---
    const cardHeader = document.createElement('div');
    cardHeader.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px 10px;
        background: #2d333b;
        cursor: pointer;
        user-select: none;
    `;

    const collapseIcon = document.createElement('span');
    collapseIcon.textContent = '▶';
    collapseIcon.style.cssText = "font-size: 9px; color: #768390; transition: transform 0.15s;";

    const cardLabel = document.createElement('span');
    cardLabel.style.cssText = "font-size: 11px; font-weight: bold; color: #adbac7; flex-grow: 1;";
    cardLabel.textContent = `[${reqKey}]: ${req.jkName}`;

    const reqTooltip = `REQUIREMENT DATA:\n${req.jkText}`;
    const infoIcon = createInfoIcon(reqTooltip);

    cardHeader.appendChild(collapseIcon);
    cardHeader.appendChild(cardLabel);
    cardHeader.appendChild(infoIcon);

    // --- Card Body (collapsed by default) ---
    const cardBody = document.createElement('div');
    cardBody.style.cssText = "display: none; padding: 10px;";

    const descLine = document.createElement('div');
    descLine.style.cssText = "font-size: 11px; color: #768390; margin-bottom: 10px; line-height: 1.4;";
    descLine.textContent = req.jkText || '';
    cardBody.appendChild(descLine);

    // --- Dropdown + Attack Vectors ---
    if (req.jkType === 'requirement') {
        const actionRow = document.createElement('div');
        actionRow.style.cssText = "display: flex; align-items: center; gap: 16px; flex-wrap: wrap;";

        // Applicability Dropdown
        const select = document.createElement('select');
        const sanitizedId = sanitizeForId ? sanitizeForId(reqKey) : reqKey;
        select.name = sanitizedId + '_jkSoa';
        select.style.cssText = `
            background: #2d333b;
            color: #adbac7;
            border: 1px solid #444c56;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 12px;
            cursor: pointer;
        `;

        ['Select', 'Applicable', 'Not Applicable'].forEach(optText => {
            const opt = document.createElement('option');
            opt.value = optText;
            opt.textContent = optText;
            if (currentStatus === optText) opt.selected = true;
            select.appendChild(opt);
        });

        function applyStatusStyle(status) {
            if (status === 'Applicable') {
                card.style.borderColor = '#238636';
            } else if (status === 'Not Applicable') {
                card.style.borderColor = '#6e40c9';
            } else {
                card.style.borderColor = '#444c56';
            }
        }
        applyStatusStyle(currentStatus);
        select.addEventListener('change', () => applyStatusStyle(select.value));

        actionRow.appendChild(select);

        // --- Attack Vectors ---
        const attackVectors = [];
        if (mindmapData) {
            mindmapData.forEach((groups) => {
                groups.forEach((gData) => {
                    gData.requirements.forEach((rEntry) => {
                        rEntry.implementations.forEach(impl => {
                            if (impl.control_number === reqKey && impl.jkAttackVector) {
                                attackVectors.push(impl);
                            }
                        });
                    });
                });
            });
        }

        if (attackVectors.length > 0) {
            const avHeader = document.createElement('div');
            avHeader.style.cssText = `
                display: flex;
                align-items: center;
                gap: 5px;
                cursor: pointer;
                user-select: none;
                color: #adbac7;
            `;

            const avIcon = document.createElement('span');
            avIcon.textContent = '▶';
            avIcon.style.cssText = "font-size: 9px; color: #768390;";

            const avLabel = document.createElement('span');
            avLabel.textContent = 'Attack Vectors';
            avLabel.style.cssText = "font-size: 12px; font-weight: bold;";

            avHeader.appendChild(avIcon);
            avHeader.appendChild(avLabel);
            actionRow.appendChild(avHeader);

            const avContent = document.createElement('div');
            avContent.style.cssText = "display: none; width: 100%; margin-top: 8px;";

            const ul = document.createElement('ul');
            ul.style.cssText = "margin: 0; padding-left: 20px; font-size: 11px; color: #adbac7; line-height: 1.6;";
            attackVectors.forEach(impl => {
                const li = document.createElement('li');
                li.textContent = `${impl.control_number} - ${impl.jkAttackVector}`;
                ul.appendChild(li);
            });
            avContent.appendChild(ul);

            avHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                const isHidden = avContent.style.display === 'none';
                avContent.style.display = isHidden ? 'block' : 'none';
                avIcon.textContent = isHidden ? '▼' : '▶';
            });

            cardBody.appendChild(actionRow);
            cardBody.appendChild(avContent);
        } else {
            cardBody.appendChild(actionRow);
        }
    }

    // --- Toggle card body on header click ---
    cardHeader.addEventListener('click', (e) => {
        if (e.target.closest && e.target.closest('.comply-info-icon-wrapper')) return;
        const isHidden = cardBody.style.display === 'none';
        cardBody.style.display = isHidden ? 'block' : 'none';
        collapseIcon.textContent = isHidden ? '▼' : '▶';
    });

    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    td.appendChild(card);
    return td;
}

/**
 * Helper: Renders control cards with a dropdown (Applicable/Not Applicable) 
 * and a collapsible Attack Vectors section — mirroring fieldHandler_requirement.js.
 */
function createCategorizedCell(nodes, fieldStoredValue, sanitizeForId, reqEntry, mindmapData) {
    const td = document.createElement('td');
    td.style.cssText = cellStyle() + `background: #161b22; vertical-align: top; position: relative;`;

    if (nodes.length === 0) {
        td.style.opacity = "0.3";
        td.textContent = "-";
        return td;
    }

    nodes.forEach(node => {
        // Only read stored status for requirement-type nodes
        const currentStatus = node.jkType === 'requirement'
            ? (fieldStoredValue(node, true) || 'Select')
            : null;

        // --- Outer card ---
        const card = document.createElement('div');
        card.style.cssText = `
            margin-bottom: 10px;
            border-radius: 6px;
            border: 1px solid #444c56;
            background: #1c2128;
            overflow: hidden;
        `;

        // --- Card Header (collapsible) ---
        const cardHeader = document.createElement('div');
        cardHeader.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 7px 10px;
            background: #2d333b;
            cursor: pointer;
            user-select: none;
        `;

        const collapseIcon = document.createElement('span');
        collapseIcon.textContent = '▶';
        collapseIcon.style.cssText = "font-size: 9px; color: #768390; transition: transform 0.15s;";

        const cardLabel = document.createElement('span');
        cardLabel.style.cssText = "font-size: 11px; font-weight: bold; color: #adbac7; flex-grow: 1;";
        cardLabel.textContent = `${node.control_number}: ${node.jkName}`;

        // Info icon for full control details (non-blocking tooltip)
        const evidence = fieldStoredValue(node, false) || 'No evidence provided.';
        const tooltipText = `CONTROL DATA:\n• ID: ${node.control_number}\n• Name: ${node.jkName}\n• Description: ${node.jkText}\n\nPROGRESS:\n• Evidence: ${evidence}`;
        const infoIcon = createInfoIcon(tooltipText);

        cardHeader.appendChild(collapseIcon);
        cardHeader.appendChild(cardLabel);
        cardHeader.appendChild(infoIcon);

        // --- Card Body (collapsed by default) ---
        const cardBody = document.createElement('div');
        cardBody.style.cssText = "display: none; padding: 10px;";

        // Description line (mirrors [reqKey] - jkText style)
        const descLine = document.createElement('div');
        descLine.style.cssText = "font-size: 11px; color: #768390; margin-bottom: 10px; line-height: 1.4;";
        descLine.textContent = node.jkText || '';
        cardBody.appendChild(descLine);

        // --- Dropdown + Attack Vectors: only for requirement-type nodes ---
        if (node.jkType === 'requirement') {

            // --- Action Row: Dropdown + Attack Vectors (mirrors fieldHandler_requirement.js) ---
            const actionRow = document.createElement('div');
            actionRow.style.cssText = "display: flex; align-items: center; gap: 16px; flex-wrap: wrap;";

            // Applicability Dropdown
            const select = document.createElement('select');
            const sanitizedId = sanitizeForId ? sanitizeForId(node.control_number) : node.control_number;
            select.name = sanitizedId + '_jkSoa';
            select.style.cssText = `
                background: #2d333b;
                color: #adbac7;
                border: 1px solid #444c56;
                border-radius: 4px;
                padding: 4px 8px;
                font-size: 12px;
                cursor: pointer;
            `;

            ['Select', 'Applicable', 'Not Applicable'].forEach(optText => {
                const opt = document.createElement('option');
                opt.value = optText;
                opt.textContent = optText;
                if (currentStatus === optText) opt.selected = true;
                select.appendChild(opt);
            });

            // Update card border colour based on selection
            function applyStatusStyle(status) {
                if (status === 'Applicable') {
                    card.style.borderColor = '#238636';
                } else if (status === 'Not Applicable') {
                    card.style.borderColor = '#6e40c9';
                } else {
                    card.style.borderColor = '#444c56';
                }
            }
            applyStatusStyle(currentStatus);
            select.addEventListener('change', () => applyStatusStyle(select.value));

            actionRow.appendChild(select);

            // --- Attack Vectors (mirrors fieldHandler_requirement.js logic) ---
            const attackVectors = [];
            if (mindmapData) {
                mindmapData.forEach((groups) => {
                    groups.forEach((gData) => {
                        gData.requirements.forEach((reqEntry) => {
                            reqEntry.implementations.forEach(impl => {
                                if (
                                    impl.control_number === node.control_number &&
                                    impl.jkAttackVector
                                ) {
                                    attackVectors.push(impl);
                                }
                            });
                        });
                    });
                });
            }

            if (attackVectors.length > 0) {
                const avHeader = document.createElement('div');
                avHeader.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    cursor: pointer;
                    user-select: none;
                    color: #adbac7;
                `;

                const avIcon = document.createElement('span');
                avIcon.textContent = '▶';
                avIcon.style.cssText = "font-size: 9px; color: #768390;";

                const avLabel = document.createElement('span');
                avLabel.textContent = 'Attack Vectors';
                avLabel.style.cssText = "font-size: 12px; font-weight: bold;";

                avHeader.appendChild(avIcon);
                avHeader.appendChild(avLabel);
                actionRow.appendChild(avHeader);

                const avContent = document.createElement('div');
                avContent.style.cssText = "display: none; width: 100%; margin-top: 8px;";

                const ul = document.createElement('ul');
                ul.style.cssText = "margin: 0; padding-left: 20px; font-size: 11px; color: #adbac7; line-height: 1.6;";
                attackVectors.forEach(impl => {
                    const li = document.createElement('li');
                    li.textContent = `${impl.control_number} - ${impl.jkAttackVector}`;
                    ul.appendChild(li);
                });
                avContent.appendChild(ul);

                avHeader.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isHidden = avContent.style.display === 'none';
                    avContent.style.display = isHidden ? 'block' : 'none';
                    avIcon.textContent = isHidden ? '▼' : '▶';
                });

                cardBody.appendChild(actionRow);
                cardBody.appendChild(avContent);
            } else {
                cardBody.appendChild(actionRow);
            }

        } // end jkType === 'requirement'

        // --- Toggle card body on header click ---
        cardHeader.addEventListener('click', (e) => {
            // Don't toggle if clicking the info icon
            if (e.target.closest && e.target.closest('.comply-info-icon-wrapper')) return;
            const isHidden = cardBody.style.display === 'none';
            cardBody.style.display = isHidden ? 'block' : 'none';
            collapseIcon.textContent = isHidden ? '▼' : '▶';
        });

        card.appendChild(cardHeader);
        card.appendChild(cardBody);
        td.appendChild(card);
    });

    return td;
}

/**
 * Helper: Standard Cell with optional tooltip icon
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
 * Creates the Info Icon with click-to-show tooltip
 */
function createInfoIcon(text) {
    const wrapper = document.createElement('span');
    wrapper.className = 'comply-info-icon-wrapper';
    wrapper.style.cssText = "position: relative; display: inline-flex; align-items: center; height: 100%;";

    const icon = document.createElement('span');
    icon.innerHTML = 'ⓘ';
    icon.style.cssText = "cursor: pointer; color: #58a6ff; font-weight: bold; font-size: 14px; padding: 0 2px;";

    const tooltip = document.createElement('div');
    tooltip.className = 'compliance-tooltip';
    tooltip.style.cssText = `
        display: none; 
        position: absolute; 
        top: 25px;
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
        document.querySelectorAll('.compliance-tooltip').forEach(t => t.style.display = 'none');
        tooltip.style.display = isVisible ? 'none' : 'block';
    };

    document.addEventListener('click', () => { tooltip.style.display = 'none'; });

    wrapper.appendChild(icon);
    wrapper.appendChild(tooltip);
    return wrapper;
}

function cellStyle() {
    return "padding: 12px; border: 1px solid #444c56; line-height: 1.4; overflow-wrap: break-word;";
}