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


/**
 * Renders a modernized, "glassmorphism" progress bar for the Approver role
 */
function renderApproverProgressBar(mindmapData, fieldStoredValue) {
    let total = 0, met = 0, notMet = 0, partial = 0;

    // Logic for counting (remains the same as your requirement)
    mindmapData.forEach((groups) => {
        groups.forEach((gData) => {
            gData.requirements.forEach((reqEntry) => {
                if (fieldStoredValue(reqEntry.requirement, true) === 'Applicable') {
                    reqEntry.implementations.forEach(impl => {
                        total++;
                        const status = fieldStoredValue(impl, true);
                        if (status === 'Met') met++;
                        else if (status === 'Not Met') notMet++;
                        else if (status === 'Partially Met') partial++;
                    });
                }
            });
        });
    });

    const percent = total > 0 ? Math.round((met / total) * 100) : 0;

    const container = document.createElement('div');
    container.style.cssText = `
        margin: 20px 0 30px 0;
        padding: 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        backdrop-filter: blur(10px);
        font-family: -apple-system, sans-serif;
    `;

    // Header with Badge-style stats
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px;';
    header.innerHTML = `
        <div>
            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #8a8480; margin-bottom: 4px;">Compliance Overview</div>
            <div style="font-size: 20px; font-weight: 700; color: #e0d9ce;">${percent}% <span style="font-size: 12px; font-weight: 400; color: #8a8480;">Completed</span></div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #c4bdb5;">
            <span style="padding: 2px 8px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 4px; color: #22c55e; margin-right: 4px;">Met: ${met}</span>
            <span style="padding: 2px 8px; background: rgba(244, 68, 68, 0.1); border: 1px solid rgba(244, 68, 68, 0.2); border-radius: 4px; color: #ef4444;">To-Do: ${notMet + partial}</span>
        </div>
    `;

    // The Glass Track
    const track = document.createElement('div');
    track.style.cssText = 'width: 100%; height: 8px; background: rgba(0,0,0,0.3); border-radius: 10px; overflow: hidden; display: flex; box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);';

    const getWidth = (count) => total > 0 ? (count / total) * 100 : 0;

    const segments = [
        { width: getWidth(met), color: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)' },
        { width: getWidth(partial), color: '#facc15', glow: 'rgba(250, 204, 21, 0.3)' },
        { width: getWidth(notMet), color: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' }
    ];

    segments.forEach(seg => {
        const s = document.createElement('div');
        s.style.cssText = `
            width: ${seg.width}%;
            background-color: ${seg.color};
            height: 100%;
            transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 0 10px ${seg.glow};
        `;
        track.appendChild(s);
    });

    container.appendChild(header);
    container.appendChild(track);
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
            cardElement.style.borderColor = '#22c55e'; // Green
        } else if (status === 'Partially Met') {
            cardElement.style.borderColor = '#facc15'; // Yellow
        } else if (status === 'Not Met') {
            cardElement.style.borderColor = '#ef4444'; // Red
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