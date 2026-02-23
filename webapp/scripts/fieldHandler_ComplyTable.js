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
        border: 1px solid #3d3d3d; 
        font-size: 13px; 
        table-layout: fixed; 
        background: #1a1a1a; 
        color: #e0d9ce; 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        margin-top: 10px;
    `;

    // Table Header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr style="background: linear-gradient(135deg, #b8963e 0%, #9a7a2e 100%); text-align: left; color: #e0d9ce;">
            <th style="${cellStyle()} width: 140px; color: #e0d9ce;">Article / Step</th>
            <th style="${cellStyle()} width: 140px; color: #e0d9ce;">Group</th>
            <th style="${cellStyle()} width: 220px; color: #e0d9ce;">Requirement</th>
            <th style="${cellStyle()} color: #e0d9ce;">Define</th>
            <th style="${cellStyle()} color: #e0d9ce;">Build (Risk)</th>
            <th style="${cellStyle()} color: #e0d9ce;">Test</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    mindmapData.forEach((groups, stepName) => {
        groups.forEach((gData, groupName) => {
            gData.requirements.forEach((reqEntry, reqKey) => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid #3d3d3d";

                // Hierarchy Columns
                tr.appendChild(createTableCell(stepName, "#252525"));
                tr.appendChild(createTableCell(groupName, "#2a2a2a"));

                // Requirement Column — with dropdown + attack vectors
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
 * Helper: Renders the Requirement card with dropdown + Attack Vectors.
 */
function createRequirementCell(reqEntry, reqKey, fieldStoredValue, sanitizeForId, mindmapData) {
    const req = reqEntry.requirement;
    const td = document.createElement('td');
    td.style.cssText = cellStyle() + `background: #252525; vertical-align: top; position: relative;`;

    const currentStatus = req.jkType === 'requirement'
        ? (fieldStoredValue(req, true) || 'Select')
        : null;

    // --- Outer card ---
    const card = document.createElement('div');
    card.style.cssText = `
        border-radius: 6px;
        border: 1px solid #3d3d3d;
        background: #2a2a2a;
        overflow: hidden;
    `;

    // --- Card Header (collapsible) ---
    const cardHeader = document.createElement('div');
    cardHeader.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px 10px;
        background: #252525;
        cursor: pointer;
        user-select: none;
        border-bottom: 1px solid #3d3d3d;
    `;

    const collapseIcon = document.createElement('span');
    collapseIcon.textContent = '▶';
    collapseIcon.style.cssText = "font-size: 9px; color: #8a8480; transition: transform 0.15s;";

    const cardLabel = document.createElement('span');
    cardLabel.style.cssText = "font-size: 11px; font-weight: 600; color: #e0d9ce; flex-grow: 1;";
    cardLabel.textContent = `[${reqKey}]: ${req.jkName}`;

    cardHeader.appendChild(collapseIcon);
    cardHeader.appendChild(cardLabel);

    // --- Card Body (collapsed by default) ---
    const cardBody = document.createElement('div');
    cardBody.style.cssText = "display: none; padding: 10px;";

    const descLine = document.createElement('div');
    descLine.style.cssText = "font-size: 11px; color: #8a8480; margin-bottom: 10px; line-height: 1.4;";
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
            background: #1e1e1e;
            color: #e0d9ce;
            border: 1px solid #444;
            border-radius: 6px;
            padding: 4px 28px 4px 8px;
            font-size: 12px;
            cursor: pointer;
            appearance: none;
            -webkit-appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23d4af37' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 0.75rem center;
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
                card.style.borderColor = '#22c55e';
            } else if (status === 'Not Applicable') {
                card.style.borderColor = '#b8963e';
            } else {
                card.style.borderColor = '#3d3d3d';
            }
        }
        applyStatusStyle(currentStatus);
        select.addEventListener('change', () => applyStatusStyle(select.value));

        actionRow.appendChild(select);

        // --- Attack Vectors: iterate implementations (Map) ---
        const attackVectors = [];
        if (reqEntry.implementations) {
            for (const impl of reqEntry.implementations.values()) {
                if (impl.jkAttackVector) {
                    attackVectors.push(impl);
                }
            }
        }

        if (attackVectors.length > 0) {
            const avHeader = document.createElement('div');
            avHeader.style.cssText = `
                display: flex;
                align-items: center;
                gap: 5px;
                cursor: pointer;
                user-select: none;
                color: #b8963e;
            `;

            const avIcon = document.createElement('span');
            avIcon.textContent = '▶';
            avIcon.style.cssText = "font-size: 9px; color: #b8963e;";

            const avLabel = document.createElement('span');
            avLabel.textContent = 'Attack Vectors';
            avLabel.style.cssText = "font-size: 12px; font-weight: 600; color: #b8963e;";

            avHeader.appendChild(avIcon);
            avHeader.appendChild(avLabel);
            actionRow.appendChild(avHeader);

            const avContent = document.createElement('div');
            avContent.style.cssText = "display: none; width: 100%; margin-top: 8px;";

            const ul = document.createElement('ul');
            ul.style.cssText = "margin: 0; padding-left: 20px; font-size: 11px; color: #c4bdb5; line-height: 1.6;";
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
    cardHeader.addEventListener('click', () => {
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
 * Helper: Renders control cards with dropdown + Attack Vectors.
 */
function createCategorizedCell(nodes, fieldStoredValue, sanitizeForId, reqEntry, mindmapData) {
    const td = document.createElement('td');
    td.style.cssText = cellStyle() + `background: #1a1a1a; vertical-align: top; position: relative;`;

    if (nodes.length === 0) {
        td.style.opacity = "0.3";
        td.textContent = "-";
        return td;
    }

    nodes.forEach(node => {
        const currentStatus = node.jkType === 'requirement'
            ? (fieldStoredValue(node, true) || 'Select')
            : null;

        // --- Outer card ---
        const card = document.createElement('div');
        card.style.cssText = `
            margin-bottom: 10px;
            border-radius: 6px;
            border: 1px solid #3d3d3d;
            background: #2a2a2a;
            overflow: hidden;
        `;

        // --- Card Header (collapsible) ---
        const cardHeader = document.createElement('div');
        cardHeader.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 7px 10px;
            background: #252525;
            cursor: pointer;
            user-select: none;
            border-bottom: 1px solid #3d3d3d;
        `;

        const collapseIcon = document.createElement('span');
        collapseIcon.textContent = '▶';
        collapseIcon.style.cssText = "font-size: 9px; color: #8a8480; transition: transform 0.15s;";

        const cardLabel = document.createElement('span');
        cardLabel.style.cssText = "font-size: 11px; font-weight: 600; color: #e0d9ce; flex-grow: 1;";
        cardLabel.textContent = `${node.control_number}: ${node.jkName}`;

        cardHeader.appendChild(collapseIcon);
        cardHeader.appendChild(cardLabel);

        // --- Card Body (collapsed by default) ---
        const cardBody = document.createElement('div');
        cardBody.style.cssText = "display: none; padding: 10px;";

        const descLine = document.createElement('div');
        descLine.style.cssText = "font-size: 11px; color: #8a8480; margin-bottom: 10px; line-height: 1.4;";
        descLine.textContent = node.jkText || '';
        cardBody.appendChild(descLine);

        // --- Dropdown + Attack Vectors: only for requirement-type nodes ---
        if (node.jkType === 'requirement') {

            const actionRow = document.createElement('div');
            actionRow.style.cssText = "display: flex; align-items: center; gap: 16px; flex-wrap: wrap;";

            // Applicability Dropdown
            const select = document.createElement('select');
            const sanitizedId = sanitizeForId ? sanitizeForId(node.control_number) : node.control_number;
            select.name = sanitizedId + '_jkSoa';
            select.style.cssText = `
                background: #1e1e1e;
                color: #e0d9ce;
                border: 1px solid #444;
                border-radius: 6px;
                padding: 4px 28px 4px 8px;
                font-size: 12px;
                cursor: pointer;
                appearance: none;
                -webkit-appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23d4af37' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 0.75rem center;
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
                    card.style.borderColor = '#22c55e';
                } else if (status === 'Not Applicable') {
                    card.style.borderColor = '#b8963e';
                } else {
                    card.style.borderColor = '#3d3d3d';
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
                    color: #b8963e;
                `;

                const avIcon = document.createElement('span');
                avIcon.textContent = '▶';
                avIcon.style.cssText = "font-size: 9px; color: #b8963e;";

                const avLabel = document.createElement('span');
                avLabel.textContent = 'Attack Vectors';
                avLabel.style.cssText = "font-size: 12px; font-weight: 600; color: #b8963e;";

                avHeader.appendChild(avIcon);
                avHeader.appendChild(avLabel);
                actionRow.appendChild(avHeader);

                const avContent = document.createElement('div');
                avContent.style.cssText = "display: none; width: 100%; margin-top: 8px;";

                const ul = document.createElement('ul');
                ul.style.cssText = "margin: 0; padding-left: 20px; font-size: 11px; color: #c4bdb5; line-height: 1.6;";
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
        cardHeader.addEventListener('click', () => {
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
 * Helper: Standard Cell (Article/Step and Group columns)
 */
function createTableCell(text, bgColor, tooltipText = null) {
    const td = document.createElement('td');
    td.style.cssText = cellStyle() + `background: ${bgColor}; vertical-align: top; position: relative;`;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = "display: flex; justify-content: space-between; align-items: flex-start;";

    const label = document.createElement('span');
    label.style.cssText = "color: #c4bdb5; font-size: 12px;";
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
    icon.style.cssText = "cursor: pointer; color: #b8963e; font-weight: bold; font-size: 14px; padding: 0 2px;";

    const tooltip = document.createElement('div');
    tooltip.className = 'compliance-tooltip';
    tooltip.style.cssText = `
        display: none; 
        position: absolute; 
        top: 25px;
        right: 0;
        width: 260px; 
        background: #252525; 
        color: #e0d9ce; 
        padding: 12px;
        border: 1px solid #b8963e; 
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
    return "padding: 12px; border: 1px solid #3d3d3d; line-height: 1.4; overflow-wrap: break-word;";
}