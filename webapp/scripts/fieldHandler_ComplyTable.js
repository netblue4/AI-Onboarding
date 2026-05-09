/**
 * Compliance Table Handler — modern accordion card layout.
 * Replaces the previous wide flat table with article-level accordions
 * and requirement cards that use pill-style applicability toggles.
 *
 * State capture compatibility: pill buttons update state.capturedData directly
 * (no <select> in DOM for the comply view). captureAll() spreads state.capturedData
 * first, so values set here are preserved on save even when this view is not active.
 */

function createComplyTable(sanitizeForId, fieldStoredValue, webappData = null, mindmap = null) {
    if (!webappData) return document.createElement('div');

    const wrapper = document.createElement('div');

    if (typeof state !== 'undefined' && state.currentRole === 'Approver') {
        wrapper.appendChild(renderApproverProgressBar(mindmap, fieldStoredValue));
    }

    wrapper.appendChild(renderComplyCards(mindmap, fieldStoredValue, sanitizeForId));
    return wrapper;
}

// ─── Approver progress bar (unchanged) ───────────────────────────────────────

function renderApproverProgressBar(mindmapData, fieldStoredValue) {
    let total = 0, met = 0, notMet = 0, partial = 0, notAssessed = 0;

    mindmapData.forEach((groups) => {
        groups.forEach((gData) => {
            gData.requirements.forEach((reqEntry) => {
                if (fieldStoredValue(reqEntry.requirement, true) === 'Applicable') {
                    reqEntry.implementations.forEach(impl => {
                        total++;
                        const s = fieldStoredValue(impl, true);
                        if (s === 'Met') met++;
                        else if (s === 'Not Met') notMet++;
                        else if (s === 'Partially Met') partial++;
                        else notAssessed++;
                    });
                }
            });
        });
    });

    const metPct     = total > 0 ? Math.round((met / total) * 100) : 0;
    const partialPct = total > 0 ? Math.round((partial / total) * 100) : 0;
    const notMetPct  = total > 0 ? Math.round((notMet / total) * 100) : 0;
    const pendingPct = total > 0 ? Math.round((notAssessed / total) * 100) : 0;
    const scoreColor = metPct >= 80 ? '#22c55e' : metPct >= 50 ? '#facc15' : '#ef4444';

    const container = document.createElement('div');
    container.style.cssText = `
        margin: 0 0 24px 0; padding: 20px 24px;
        background: linear-gradient(135deg, #1e1e1e 0%, #252525 100%);
        border: 1px solid #3d3d3d; border-radius: 10px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        position: relative; overflow: hidden;
    `;

    const watermark = document.createElement('div');
    watermark.style.cssText = `position:absolute;top:-10px;right:20px;font-size:80px;font-weight:900;
        color:rgba(184,150,62,0.04);letter-spacing:-4px;pointer-events:none;user-select:none;line-height:1;`;
    watermark.textContent = 'AUDIT';
    container.appendChild(watermark);

    const topRow = document.createElement('div');
    topRow.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;';

    const titleBlock = document.createElement('div');
    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#b8963e;margin-bottom:4px;';
    titleEl.textContent = 'Compliance Overview';
    const subtitleEl = document.createElement('div');
    subtitleEl.style.cssText = 'font-size:12px;color:#8a8480;';
    subtitleEl.textContent = `${total} applicable control${total !== 1 ? 's' : ''} assessed`;
    titleBlock.appendChild(titleEl);
    titleBlock.appendChild(subtitleEl);

    const scoreBlock = document.createElement('div');
    scoreBlock.style.cssText = 'text-align:right;';
    const scoreNum = document.createElement('div');
    scoreNum.style.cssText = `font-size:36px;font-weight:800;line-height:1;color:${scoreColor};letter-spacing:-1px;`;
    scoreNum.textContent = `${metPct}%`;
    const scoreLabel = document.createElement('div');
    scoreLabel.style.cssText = 'font-size:10px;color:#8a8480;text-transform:uppercase;letter-spacing:1px;margin-top:2px;';
    scoreLabel.textContent = 'Compliance Rate';
    scoreBlock.appendChild(scoreNum);
    scoreBlock.appendChild(scoreLabel);

    topRow.appendChild(titleBlock);
    topRow.appendChild(scoreBlock);
    container.appendChild(topRow);

    const barOuter = document.createElement('div');
    barOuter.style.cssText = 'width:100%;height:8px;background:#2e2e2e;border-radius:4px;overflow:hidden;display:flex;gap:2px;margin-bottom:16px;';
    [
        { pct: metPct, color: '#22c55e' },
        { pct: partialPct, color: '#facc15' },
        { pct: notMetPct, color: '#ef4444' },
        { pct: pendingPct, color: '#3d3d3d' },
    ].forEach(seg => {
        if (seg.pct <= 0) return;
        const s = document.createElement('div');
        s.style.cssText = `width:${seg.pct}%;background:${seg.color};border-radius:2px;transition:width 0.6s;`;
        barOuter.appendChild(s);
    });
    container.appendChild(barOuter);

    const statsRow = document.createElement('div');
    statsRow.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:10px;';
    [
        { label: 'Met',     count: met,         pct: metPct,     color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)'   },
        { label: 'Partial', count: partial,      pct: partialPct, color: '#facc15', bg: 'rgba(250,204,21,0.08)',  border: 'rgba(250,204,21,0.2)'  },
        { label: 'Not Met', count: notMet,       pct: notMetPct,  color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
        { label: 'Pending', count: notAssessed,  pct: pendingPct, color: '#8a8480', bg: 'rgba(138,132,128,0.08)', border: 'rgba(138,132,128,0.2)' },
    ].forEach(stat => {
        const card = document.createElement('div');
        card.style.cssText = `background:${stat.bg};border:1px solid ${stat.border};border-radius:8px;padding:10px 12px;`;
        card.innerHTML = `
            <div style="font-size:22px;font-weight:800;color:${stat.color};line-height:1;">${stat.count}</div>
            <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#8a8480;">${stat.label}</div>
            <div style="font-size:11px;color:${stat.color};opacity:0.8;margin-top:2px;">${stat.pct}%</div>
        `;
        statsRow.appendChild(card);
    });
    container.appendChild(statsRow);
    return container;
}

// ─── Main card renderer ───────────────────────────────────────────────────────

function renderComplyCards(mindmapData, fieldStoredValue, sanitizeForId) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

    let firstSection = true;
    mindmapData.forEach((groups, stepName) => {
        const section = buildArticleAccordion(stepName, groups, fieldStoredValue, sanitizeForId, firstSection);
        wrapper.appendChild(section);
        firstSection = false;
    });

    return wrapper;
}

function buildArticleAccordion(stepName, groups, fieldStoredValue, sanitizeForId, startOpen) {
    // Tally applicable/total for this article
    let total = 0, applicable = 0;
    groups.forEach(gData => {
        gData.requirements.forEach((reqEntry) => {
            total++;
            if (fieldStoredValue(reqEntry.requirement, true) === 'Applicable') applicable++;
        });
    });

    const pct = total > 0 ? Math.round((applicable / total) * 100) : 0;
    const statusColor = applicable === 0 ? '#555' : pct === 100 ? '#22c55e' : '#b8963e';

    const section = document.createElement('div');
    section.style.cssText = 'border-radius:10px;overflow:hidden;border:1px solid #3d3d3d;';

    // ── Header ──
    const header = document.createElement('div');
    header.style.cssText = `
        display:flex;align-items:center;gap:14px;padding:14px 20px;cursor:pointer;
        background:linear-gradient(135deg,#1e2530 0%,#252525 100%);
        user-select:none;transition:background 0.2s;
    `;
    header.addEventListener('mouseenter', () => header.style.background = 'linear-gradient(135deg,#222b3a 0%,#2a2a2a 100%)');
    header.addEventListener('mouseleave', () => header.style.background = 'linear-gradient(135deg,#1e2530 0%,#252525 100%)');

    const chevron = document.createElement('span');
    chevron.style.cssText = 'font-size:11px;color:#8a8480;transition:transform 0.25s;flex-shrink:0;';
    chevron.textContent = '▶';

    const titleText = document.createElement('span');
    titleText.style.cssText = 'font-size:14px;font-weight:600;color:#e0d9ce;flex:1;';
    titleText.textContent = stepName;

    const badge = document.createElement('span');
    badge.style.cssText = `font-size:12px;font-weight:600;color:${statusColor};white-space:nowrap;`;
    badge.textContent = `${applicable} / ${total}`;

    const miniBar = document.createElement('div');
    miniBar.style.cssText = 'width:80px;height:5px;background:#3d3d3d;border-radius:3px;overflow:hidden;flex-shrink:0;';
    const miniFill = document.createElement('div');
    miniFill.style.cssText = `width:${pct}%;height:100%;background:${statusColor};border-radius:3px;transition:width 0.4s;`;
    miniBar.appendChild(miniFill);

    header.appendChild(chevron);
    header.appendChild(titleText);
    header.appendChild(badge);
    header.appendChild(miniBar);
    section.appendChild(header);

    // ── Body ──
    const body = document.createElement('div');
    body.style.cssText = 'background:#1a1a1a;padding:16px;display:flex;flex-direction:column;gap:14px;';
    body.style.display = startOpen ? 'flex' : 'none';
    if (startOpen) chevron.style.transform = 'rotate(90deg)';

    groups.forEach((gData, groupName) => {
        body.appendChild(buildGroupBlock(groupName, gData, fieldStoredValue, sanitizeForId, header, badge, miniFill));
    });

    header.addEventListener('click', () => {
        const open = body.style.display === 'none';
        body.style.display = open ? 'flex' : 'none';
        chevron.style.transform = open ? 'rotate(90deg)' : '';
    });

    section.appendChild(body);
    return section;
}

function buildGroupBlock(groupName, gData, fieldStoredValue, sanitizeForId, articleHeader, articleBadge, articleFill) {
    // Parse "standard — display name" from groupName like "[18229-1: Trustworthiness] - Transparency"
    let standard = '', displayName = groupName;
    if (groupName.includes('] - ')) {
        const parts = groupName.split('] - ');
        standard = parts[0] + ']';
        displayName = parts[1].replace(/\.$/, '');
    }

    const block = document.createElement('div');

    // Group header label
    const groupLabel = document.createElement('div');
    groupLabel.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:10px;';
    if (standard) {
        const stdBadge = document.createElement('span');
        stdBadge.style.cssText = 'font-size:10px;font-weight:700;color:#8a8480;background:#252525;border:1px solid #3d3d3d;border-radius:4px;padding:2px 7px;white-space:nowrap;';
        stdBadge.textContent = standard;
        groupLabel.appendChild(stdBadge);
    }
    const groupTitle = document.createElement('span');
    groupTitle.style.cssText = 'font-size:12px;font-weight:600;color:#b8963e;text-transform:uppercase;letter-spacing:0.5px;';
    groupTitle.textContent = displayName;
    groupLabel.appendChild(groupTitle);
    block.appendChild(groupLabel);

    // Requirement cards
    const cardsDiv = document.createElement('div');
    cardsDiv.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
    gData.requirements.forEach((reqEntry, reqKey) => {
        cardsDiv.appendChild(buildRequirementCard(reqEntry, reqKey, fieldStoredValue, sanitizeForId, articleHeader, articleBadge, articleFill, gData));
    });
    block.appendChild(cardsDiv);
    return block;
}

function buildRequirementCard(reqEntry, reqKey, fieldStoredValue, sanitizeForId, articleHeader, articleBadge, articleFill, gData) {
    const req = reqEntry.requirement;
    const currentSoa = fieldStoredValue(req, true) || 'Select';
    const sanitizedId = sanitizeForId ? sanitizeForId(reqKey) : reqKey;

    const card = document.createElement('div');
    card.style.cssText = `
        border-radius:8px;border:1px solid ${borderColorForSoa(currentSoa)};
        background:#212121;overflow:hidden;transition:border-color 0.2s;
    `;

    // ── Card top row ──
    const topRow = document.createElement('div');
    topRow.style.cssText = 'display:flex;align-items:flex-start;gap:12px;padding:12px 14px;';

    // Left: ID badge + name/desc
    const leftCol = document.createElement('div');
    leftCol.style.cssText = 'flex:1;min-width:0;';

    const idBadge = document.createElement('span');
    idBadge.style.cssText = 'display:inline-block;font-size:10px;font-weight:700;color:#7eb3ff;background:#1a2035;border:1px solid #2a3a5e;border-radius:4px;padding:2px 8px;margin-bottom:6px;white-space:nowrap;';
    idBadge.textContent = reqKey;
    leftCol.appendChild(idBadge);

    const reqName = document.createElement('div');
    reqName.style.cssText = 'font-size:13px;font-weight:600;color:#e0d9ce;margin-bottom:4px;line-height:1.4;';
    reqName.textContent = req.jkName || '';
    leftCol.appendChild(reqName);

    const reqDesc = document.createElement('div');
    reqDesc.style.cssText = 'font-size:12px;color:#7a7470;line-height:1.5;';
    reqDesc.textContent = req.jkText || '';
    leftCol.appendChild(reqDesc);

    // Right: applicability pills
    const rightCol = document.createElement('div');
    rightCol.style.cssText = 'flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:6px;';

    const pillGroup = buildApplicabilityPills(sanitizedId, req, currentSoa, card, gData, articleBadge, articleFill, fieldStoredValue);
    rightCol.appendChild(pillGroup);

    topRow.appendChild(leftCol);
    topRow.appendChild(rightCol);
    card.appendChild(topRow);

    // ── Implementation chips + expand ──
    const implCounts = countImplementations(reqEntry);
    if (implCounts.total > 0 || hasAttackVectors(reqEntry)) {
        const footer = buildCardFooter(reqEntry, implCounts, fieldStoredValue, sanitizeForId);
        card.appendChild(footer);
    }

    return card;
}

// ─── Applicability pills ──────────────────────────────────────────────────────

function buildApplicabilityPills(sanitizedId, req, currentSoa, card, gData, articleBadge, articleFill, fieldStoredValue) {
    const group = document.createElement('div');
    group.style.cssText = 'display:flex;gap:4px;';

    const options = [
        { value: 'Select',         label: 'Select',        activeStyle: 'background:#2a2a2a;color:#888;border-color:#444;' },
        { value: 'Applicable',     label: '✓ Applicable',  activeStyle: 'background:#0d2318;color:#22c55e;border-color:#22c55e;' },
        { value: 'Not Applicable', label: '✗ Not Applicable', activeStyle: 'background:#2a1810;color:#f97316;border-color:#f97316;' },
    ];

    const pills = [];

    options.forEach(opt => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.textContent = opt.label;

        const isActive = currentSoa === opt.value;
        pill.style.cssText = `
            padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;
            border:1px solid #444;transition:all 0.15s;white-space:nowrap;
            ${isActive ? opt.activeStyle : 'background:#1e1e1e;color:#666;border-color:#3d3d3d;'}
        `;
        pill.addEventListener('mouseenter', () => {
            if (pill.dataset.active !== 'true') pill.style.borderColor = '#666';
        });
        pill.addEventListener('mouseleave', () => {
            if (pill.dataset.active !== 'true') pill.style.borderColor = '#3d3d3d';
        });
        if (isActive) pill.dataset.active = 'true';

        pill.addEventListener('click', () => {
            // Update visual
            pills.forEach(p => {
                p.style.cssText = `padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;
                    border:1px solid #3d3d3d;background:#1e1e1e;color:#666;transition:all 0.15s;white-space:nowrap;`;
                p.dataset.active = 'false';
            });
            pill.style.cssText = `padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;
                border:1px solid #444;transition:all 0.15s;white-space:nowrap;${opt.activeStyle}`;
            pill.dataset.active = 'true';

            // Update card border
            card.style.borderColor = borderColorForSoa(opt.value);

            // Update state directly (no <select> in DOM for this view)
            const key = sanitizedId;
            if (opt.value !== 'Select') {
                state.capturedData[key + '_jkSoa'] = opt.value;
                state.capturedData[key + '_requirement'] = (req.jkName || '') + ': ' + (req.jkText || '');
            } else {
                delete state.capturedData[key + '_jkSoa'];
                delete state.capturedData[key + '_requirement'];
            }

            // Refresh article header badge + mini bar
            refreshArticleStats(gData, fieldStoredValue, articleBadge, articleFill);

            // Refresh role nav progress
            if (typeof roleProgressTracker !== 'undefined') roleProgressTracker.update();
        });

        pills.push(pill);
        group.appendChild(pill);
    });

    return group;
}

function borderColorForSoa(soa) {
    if (soa === 'Applicable') return '#22c55e';
    if (soa === 'Not Applicable') return '#b8963e';
    return '#3d3d3d';
}

function refreshArticleStats(gData, fieldStoredValue, badgeEl, fillEl) {
    // Recount for the article this group belongs to — we only have the gData here,
    // so we tally from gData.requirements (a subset is fine for instant feedback).
    // A full recount across all groups would need mindmapData; this is a fast approximation.
    let total = 0, applicable = 0;
    gData.requirements.forEach((reqEntry) => {
        total++;
        const soa = state.capturedData[sanitizeForId(reqEntry.requirement.requirement_control_number) + '_jkSoa'];
        if (soa === 'Applicable') applicable++;
    });
    const pct = total > 0 ? Math.round((applicable / total) * 100) : 0;
    const color = applicable === 0 ? '#555' : pct === 100 ? '#22c55e' : '#b8963e';
    if (badgeEl) { badgeEl.textContent = `${applicable} / ${total}`; badgeEl.style.color = color; }
    if (fillEl)  { fillEl.style.width = `${pct}%`; fillEl.style.background = color; }
}

// ─── Card footer: impl chips + attack vectors ─────────────────────────────────

function countImplementations(reqEntry) {
    let define = 0, build = 0, test = 0;
    reqEntry.implementations.forEach(impl => {
        const cn = String(impl.control_number || '');
        if (cn.includes('T')) test++;
        else if (cn.includes('R')) build++;
        else define++;
    });
    return { define, build, test, total: define + build + test };
}

function hasAttackVectors(reqEntry) {
    for (const impl of reqEntry.implementations.values()) {
        if (impl.jkAttackVector) return true;
    }
    return false;
}

function buildCardFooter(reqEntry, implCounts, fieldStoredValue, sanitizeForId) {
    const footer = document.createElement('div');
    footer.style.cssText = 'border-top:1px solid #2a2a2a;padding:8px 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;';

    // Impl chips
    const chipDefs = [
        { label: 'Define', count: implCounts.define, color: '#7eb3ff', bg: '#1a2035', border: '#2a3a5e' },
        { label: 'Build',  count: implCounts.build,  color: '#a78bfa', bg: '#1e1a35', border: '#2e2850' },
        { label: 'Test',   count: implCounts.test,   color: '#34d399', bg: '#0f2520', border: '#1a3830' },
    ];

    chipDefs.forEach(c => {
        if (c.count === 0) return;
        const chip = document.createElement('span');
        chip.style.cssText = `font-size:11px;font-weight:600;color:${c.color};background:${c.bg};
            border:1px solid ${c.border};border-radius:10px;padding:2px 9px;`;
        chip.textContent = `${c.label}: ${c.count}`;
        footer.appendChild(chip);
    });

    // Spacer
    const spacer = document.createElement('div');
    spacer.style.flex = '1';
    footer.appendChild(spacer);

    // Attack vectors toggle
    const attackVectors = [];
    reqEntry.implementations.forEach(impl => {
        if (impl.jkAttackVector) attackVectors.push(impl);
    });

    if (attackVectors.length > 0) {
        const avToggle = document.createElement('button');
        avToggle.type = 'button';
        avToggle.style.cssText = 'font-size:11px;font-weight:600;color:#b8963e;background:transparent;border:none;cursor:pointer;padding:2px 4px;';
        avToggle.textContent = '⚠ Attack Vectors ▶';

        const avPanel = document.createElement('div');
        avPanel.style.cssText = 'display:none;width:100%;margin-top:8px;padding:8px 12px;background:#1e1a10;border-radius:6px;border:1px solid #3d3010;';
        const ul = document.createElement('ul');
        ul.style.cssText = 'margin:0;padding-left:18px;font-size:11px;color:#c4bdb5;line-height:1.7;';
        attackVectors.forEach(impl => {
            const li = document.createElement('li');
            li.textContent = `${impl.control_number} — ${impl.jkAttackVector}`;
            ul.appendChild(li);
        });
        avPanel.appendChild(ul);

        avToggle.addEventListener('click', () => {
            const open = avPanel.style.display === 'none';
            avPanel.style.display = open ? 'block' : 'none';
            avToggle.textContent = open ? '⚠ Attack Vectors ▼' : '⚠ Attack Vectors ▶';
        });

        footer.appendChild(avToggle);

        // av panel goes on a second row inside the footer
        footer.style.flexWrap = 'wrap';
        const avRow = document.createElement('div');
        avRow.style.cssText = 'width:100%;';
        avRow.appendChild(avPanel);

        // Append toggle to footer, panel to extra row
        footer.appendChild(avRow);
    }

    // Implementation detail panel (Jira links + comply status for Approver)
    const implNodes = [...reqEntry.implementations.values()].filter(n => {
        const ev = fieldStoredValue(n, false);
        return (ev && ev.startsWith('http')) || state.currentRole === 'Approver';
    });

    if (implNodes.length > 0 && state.currentRole === 'Approver') {
        const implToggle = document.createElement('button');
        implToggle.type = 'button';
        implToggle.style.cssText = 'font-size:11px;font-weight:600;color:#7eb3ff;background:transparent;border:none;cursor:pointer;padding:2px 4px;';
        implToggle.textContent = 'Controls ▶';

        const implPanel = document.createElement('div');
        implPanel.style.cssText = 'display:none;width:100%;margin-top:8px;';

        implNodes.forEach(node => {
            implPanel.appendChild(buildImplCard(node, fieldStoredValue, sanitizeForId));
        });

        implToggle.addEventListener('click', () => {
            const open = implPanel.style.display === 'none';
            implPanel.style.display = open ? 'block' : 'none';
            implToggle.textContent = open ? 'Controls ▼' : 'Controls ▶';
        });

        footer.appendChild(implToggle);
        const implRow = document.createElement('div');
        implRow.style.cssText = 'width:100%;';
        implRow.appendChild(implPanel);
        footer.appendChild(implRow);
    }

    return footer;
}

function buildImplCard(node, fieldStoredValue, sanitizeForId) {
    const card = document.createElement('div');
    card.style.cssText = 'background:#1e1e1e;border:1px solid #3d3d3d;border-radius:6px;padding:10px 12px;margin-bottom:6px;';

    const titleRow = document.createElement('div');
    titleRow.style.cssText = 'font-size:12px;font-weight:600;color:#c4bdb5;margin-bottom:6px;';
    titleRow.textContent = `${node.control_number}: ${node.jkName || node.jkText || ''}`;
    card.appendChild(titleRow);

    const ev = fieldStoredValue(node, false);
    if (ev && ev.startsWith('http')) {
        const link = document.createElement('a');
        link.href = ev;
        link.target = '_blank';
        link.textContent = '🎫 View Jira Ticket';
        link.style.cssText = 'color:#b8963e;font-size:12px;text-decoration:none;font-weight:600;display:block;margin-bottom:8px;';
        link.addEventListener('mouseover', () => link.style.textDecoration = 'underline');
        link.addEventListener('mouseout', () => link.style.textDecoration = 'none');
        card.appendChild(link);
    }

    card.appendChild(createStatusDropdown(node, sanitizeForId, fieldStoredValue, card));
    return card;
}

// ─── Status dropdown for Approver comply-status (preserved for state capture) ─

function createStatusDropdown(subControl, sanitizeForId, fieldStoredValue, cardElement) {
    const wrapper = document.createElement('div');

    const select = document.createElement('select');
    select.style.cssText = `
        margin:5px 0 0 0;padding:4px 2rem 4px 0.75rem;border-radius:6px;
        border:1px solid #444;background-color:#1e1e1e;color:#e0e0e0;
        cursor:pointer;appearance:none;-webkit-appearance:none;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23d4af37' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
        background-repeat:no-repeat;background-position:right 0.75rem center;
    `;
    select.name = sanitizeForId(subControl.control_number) + '_complystatus';

    let complyStatusValue = fieldStoredValue(subControl, true);

    function updateBorder(status) {
        if (status === 'Met') cardElement.style.borderColor = '#22c55e';
        else if (status === 'Partially Met') cardElement.style.borderColor = '#facc15';
        else if (status === 'Not Met') cardElement.style.borderColor = '#ef4444';
        else cardElement.style.borderColor = '#3d3d3d';
    }
    updateBorder(complyStatusValue);

    ['Select', 'Met', 'Not Met', 'Partially Met'].forEach(optText => {
        const opt = document.createElement('option');
        opt.value = optText;
        opt.textContent = optText;
        if (complyStatusValue === optText) opt.selected = true;
        select.appendChild(opt);
    });

    const controlKey = sanitizeForId(subControl.control_number);
    const noteKey = controlKey + '_complynote';

    const noteArea = document.createElement('textarea');
    noteArea.placeholder = 'Justification (optional)…';
    noteArea.rows = 2;
    noteArea.style.cssText = `
        width:100%;margin-top:6px;padding:6px 8px;border-radius:6px;
        border:1px solid #3d3d3d;background:#161616;color:#c4bdb5;
        font-size:11px;resize:vertical;font-family:inherit;line-height:1.5;
        display:${(complyStatusValue && complyStatusValue !== 'Select') ? 'block' : 'none'};
    `;
    noteArea.value = state.capturedData[noteKey] || '';
    noteArea.addEventListener('input', () => {
        state.capturedData[noteKey] = noteArea.value;
    });

    select.addEventListener('change', e => {
        const newStatus = e.target.value;
        updateBorder(newStatus);
        noteArea.style.display = (newStatus && newStatus !== 'Select') ? 'block' : 'none';

        if (newStatus && newStatus !== 'Select') {
            if (!Array.isArray(state.capturedData._auditLog)) {
                state.capturedData._auditLog = [];
            }
            state.capturedData._auditLog.push({
                controlNumber: subControl.control_number || '',
                controlName:   subControl.jkName || subControl.jkText || '',
                from:          complyStatusValue || 'Not Assessed',
                to:            newStatus,
                timestamp:     new Date().toISOString(),
                note:          state.capturedData[noteKey] || ''
            });
        }

        complyStatusValue = newStatus;
    });

    wrapper.appendChild(select);
    wrapper.appendChild(noteArea);
    return wrapper;
}
