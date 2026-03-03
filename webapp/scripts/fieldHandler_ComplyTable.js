/**
 * Compliance Table Handler: Table view with inline dropdown + Attack Vectors per control card.
 */

function createComplyTable(sanitizeForId, fieldStoredValue, webappData = null, mindmap = null) {
    if (!webappData) return document.createElement('div');
    
    // Assume mindmapData is built as per your existing logic
    // const mindmapData = buildMindmapData(webappData, sanitizeForId, fieldStoredValue);
    
    const wrapper = document.createElement('div');
    
    // 1. Check for Approver role (assuming 'state' is globally available or passed in)
    if (typeof state !== 'undefined' && state.currentRole === "Approver") {
        wrapper.appendChild(renderApproverProgressBar(mindmapData, fieldStoredValue));
    }

    const table = renderComplyTable(mindmapData, fieldStoredValue, sanitizeForId);
    wrapper.appendChild(table);
    
    return wrapper;
}

function renderApproverProgressBar(mindmapData, fieldStoredValue) {
    let total = 0;
    let met = 0;
    let notMet = 0;
    let partial = 0;
    let notAssessed = 0;

    mindmapData.forEach((groups) => {
        groups.forEach((gData) => {
            gData.requirements.forEach((reqEntry) => {
                const req = reqEntry.requirement;
                const applicability = fieldStoredValue(req, true);
                if (applicability === 'Applicable') {
                    reqEntry.implementations.forEach(impl => {
                        total++;
                        const status = fieldStoredValue(impl, true);
                        if (status === 'Met') met++;
                        else if (status === 'Not Met') notMet++;
                        else if (status === 'Partially Met') partial++;
                        else notAssessed++;
                    });
                }
            });
        });
    });

    const metPct      = total > 0 ? Math.round((met / total) * 100) : 0;
    const partialPct  = total > 0 ? Math.round((partial / total) * 100) : 0;
    const notMetPct   = total > 0 ? Math.round((notMet / total) * 100) : 0;
    const pendingPct  = total > 0 ? Math.round((notAssessed / total) * 100) : 0;

    // --- Compliance score colour ---
    const scoreColor = metPct >= 80 ? '#22c55e' : metPct >= 50 ? '#facc15' : '#ef4444';

    const container = document.createElement('div');
    container.style.cssText = `
        margin: 0 0 24px 0;
        padding: 20px 24px;
        background: linear-gradient(135deg, #1e1e1e 0%, #252525 100%);
        border: 1px solid #3d3d3d;
        border-radius: 10px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        position: relative;
        overflow: hidden;
    `;

    // --- Subtle background watermark ---
    const watermark = document.createElement('div');
    watermark.style.cssText = `
        position: absolute;
        top: -10px;
        right: 20px;
        font-size: 80px;
        font-weight: 900;
        color: rgba(184, 150, 62, 0.04);
        letter-spacing: -4px;
        pointer-events: none;
        user-select: none;
        line-height: 1;
    `;
    watermark.textContent = 'AUDIT';
    container.appendChild(watermark);

    // --- Top row: title + compliance score ---
    const topRow = document.createElement('div');
    topRow.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
    `;

    const titleBlock = document.createElement('div');

    const title = document.createElement('div');
    title.style.cssText = `
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: #b8963e;
        margin-bottom: 4px;
    `;
    title.textContent = 'Compliance Overview';

    const subtitle = document.createElement('div');
    subtitle.style.cssText = `font-size: 12px; color: #8a8480;`;
    subtitle.textContent = `${total} applicable control${total !== 1 ? 's' : ''} assessed`;

    titleBlock.appendChild(title);
    titleBlock.appendChild(subtitle);

    // --- Big compliance score ---
    const scoreBlock = document.createElement('div');
    scoreBlock.style.cssText = `text-align: right;`;

    const scoreNum = document.createElement('div');
    scoreNum.style.cssText = `
        font-size: 36px;
        font-weight: 800;
        line-height: 1;
        color: ${scoreColor};
        letter-spacing: -1px;
    `;
    scoreNum.textContent = `${metPct}%`;

    const scoreLabel = document.createElement('div');
    scoreLabel.style.cssText = `font-size: 10px; color: #8a8480; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;`;
    scoreLabel.textContent = 'Compliance Rate';

    scoreBlock.appendChild(scoreNum);
    scoreBlock.appendChild(scoreLabel);

    topRow.appendChild(titleBlock);
    topRow.appendChild(scoreBlock);
    container.appendChild(topRow);

    // --- Segmented progress bar ---
    const barWrapper = document.createElement('div');
    barWrapper.style.cssText = `margin-bottom: 16px;`;

    const barOuter = document.createElement('div');
    barOuter.style.cssText = `
        width: 100%;
        height: 8px;
        background: #2e2e2e;
        border-radius: 4px;
        overflow: hidden;
        display: flex;
        gap: 2px;
    `;

    const segments = [
        { pct: metPct,     color: '#22c55e', label: 'Met' },
        { pct: partialPct, color: '#facc15', label: 'Partial' },
        { pct: notMetPct,  color: '#ef4444', label: 'Not Met' },
        { pct: pendingPct, color: '#3d3d3d', label: 'Pending' },
    ];

    segments.forEach(seg => {
        if (seg.pct <= 0) return;
        const s = document.createElement('div');
        s.style.cssText = `
            width: ${seg.pct}%;
            background: ${seg.color};
            border-radius: 2px;
            transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        barOuter.appendChild(s);
    });

    barWrapper.appendChild(barOuter);
    container.appendChild(barWrapper);

    // --- Stat cards row ---
    const statsRow = document.createElement('div');
    statsRow.style.cssText = `
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
    `;

    const statCards = [
        { label: 'Met',        count: met,          pct: metPct,     color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)'   },
        { label: 'Partial',    count: partial,       pct: partialPct, color: '#facc15', bg: 'rgba(250,204,21,0.08)',  border: 'rgba(250,204,21,0.2)'  },
        { label: 'Not Met',    count: notMet,        pct: notMetPct,  color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
        { label: 'Pending',    count: notAssessed,   pct: pendingPct, color: '#8a8480', bg: 'rgba(138,132,128,0.08)', border: 'rgba(138,132,128,0.2)' },
    ];

    statCards.forEach(stat => {
        const card = document.createElement('div');
        card.style.cssText = `
            background: ${stat.bg};
            border: 1px solid ${stat.border};
            border-radius: 8px;
            padding: 10px 12px;
            display: flex;
            flex-direction: column;
            gap: 2px;
        `;

        const cardCount = document.createElement('div');
        cardCount.style.cssText = `
            font-size: 22px;
            font-weight: 800;
            color: ${stat.color};
            line-height: 1;
            letter-spacing: -0.5px;
        `;
        cardCount.textContent = stat.count;

        const cardLabel = document.createElement('div');
        cardLabel.style.cssText = `
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #8a8480;
        `;
        cardLabel.textContent = stat.label;

        const cardPct = document.createElement('div');
        cardPct.style.cssText = `
            font-size: 11px;
            color: ${stat.color};
            opacity: 0.8;
            margin-top: 2px;
        `;
        cardPct.textContent = `${stat.pct}%`;

        card.appendChild(cardCount);
        card.appendChild(cardLabel);
        card.appendChild(cardPct);
        statsRow.appendChild(card);
    });

    container.appendChild(statsRow);
    return container;
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

    // Table Header - Added "Harmonised Standard" column
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr style="background: linear-gradient(135deg, #b8963e 0%, #9a7a2e 100%); text-align: left; color: #e0d9ce;">
            <th style="${cellStyle()} width: 140px; color: #e0d9ce;">AI Article</th>
            <th style="${cellStyle()} width: 180px; color: #e0d9ce;">Harmonised Standard</th>
            <th style="${cellStyle()} width: 140px; color: #e0d9ce;">Category</th>
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
            
            // --- LOGIC TO SPLIT GROUP NAME ---
            // Input example: "[18229-1: Trustworthiness] - Transparency."
            let standardPart = "";
            let displayGroupName = groupName;

            if (groupName.includes("] - ")) {
                const parts = groupName.split("] - ");
                standardPart = parts[0] + "]"; // Re-add the closing bracket
                displayGroupName = parts[1].replace(/\.$/, ""); // Remove trailing dot if exists
            }
            // ---------------------------------

            gData.requirements.forEach((reqEntry, reqKey) => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid #3d3d3d";

                // Hierarchy Columns
                tr.appendChild(createTableCell(stepName, "#252525"));
                
                // New Harmonised Standard Column
                tr.appendChild(createTableCell(standardPart, "#2a2a2a"));
                
                // Updated Group Column (using displayGroupName)
                tr.appendChild(createTableCell(displayGroupName, "#2a2a2a"));

                // Requirement Column
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

                // Categorized Columns
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
else{


	const evidenceValue = fieldStoredValue(node, false);

	if (evidenceValue && evidenceValue.startsWith('http')) {
		// --- Render as Jira link ---
		const linkWrapper = document.createElement('div');
		linkWrapper.style.marginTop = '10px';

		const jiraLink = document.createElement('a');
		jiraLink.href = evidenceValue;
		jiraLink.target = '_blank';
		jiraLink.textContent = '🎫 View Jira Ticket';
		jiraLink.style.cssText = `
			color: #b8963e;
			font-size: 13px;
			text-decoration: none;
			font-weight: 600;
		`;
		jiraLink.addEventListener('mouseover', () => jiraLink.style.textDecoration = 'underline');
		jiraLink.addEventListener('mouseout',  () => jiraLink.style.textDecoration = 'none');

		linkWrapper.appendChild(jiraLink);
		cardBody.appendChild(linkWrapper);
		
				// Status dropdown
		const select = createStatusDropdown(node, sanitizeForId, fieldStoredValue, card);		
		cardBody.appendChild(select);
		
		
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
    });

    return td;
}


/**
 * Creates the status dropdown select element with border-color triggers
 */
function createStatusDropdown(subControl, sanitizeForId, fieldStoredValue, cardElement) {
    const select = document.createElement('select');
    // ... existing style code ...
    select.style.margin = '5px 0 10px 0';
    select.style.padding = '4px 2rem 4px 0.75rem';
    select.style.borderRadius = '6px';
    select.style.border = '1px solid #444';
    select.style.backgroundColor = '#1e1e1e';
    select.style.color = '#e0e0e0';
    select.style.cursor = 'pointer';
    select.style.appearance = 'none';
    select.style.backgroundImage = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23d4af37' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1-1.506 0z'/%3E%3C%2Fsvg%3E\")";
    select.style.backgroundRepeat = 'no-repeat';
    select.style.backgroundPosition = 'right 0.75rem center';
    select.name = sanitizeForId(subControl.control_number) + '_complystatus';

    const complyStatusValue = fieldStoredValue(subControl, true);

    // Helper function to update the card border based on status
    function updateBorder(status) {
        if (status === 'Met') {
            cardElement.style.borderColor = 'rgba(34,197,94,0.2)'; // Green
        } else if (status === 'Partially Met') {
            cardElement.style.borderColor = 'rgba(250,204,21,0.2)'; // Yellow
        } else if (status === 'Not Met') {
            cardElement.style.borderColor = 'rgba(239,68,68,0.2)'; // Red
        } else {
            cardElement.style.borderColor = '#3d3d3d'; // Default Gray
        }
    }

    // Initialize border on load
    updateBorder(complyStatusValue);

    const options = ['Select', 'Met', 'Not Met', 'Partially Met'];
    options.forEach((optionText) => {
        const option = document.createElement('option');
        option.value = optionText; 
        option.textContent = optionText;
        if (complyStatusValue === optionText) option.selected = true;  
        select.appendChild(option);
    });

    // Listener for real-time updates
    select.addEventListener('change', (e) => updateBorder(e.target.value));

    return select;
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

function cellStyle() {
    return "padding: 12px; border: 1px solid #3d3d3d; line-height: 1.4; overflow-wrap: break-word;";
}