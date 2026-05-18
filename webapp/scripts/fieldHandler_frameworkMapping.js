/**
 * Framework Mapping Handler — read-only reference table.
 * Columns: AI Act Article | Standard | Requirement | Define | Build | Test
 * Rows are clickable (toggle gold highlight). Article/standard groups are
 * visually separated by heavier top borders.
 */

function createFrameworkMapping(sanitizeForId, fieldStoredValue, webappData = null, mindmap = null) {
    if (!mindmap) return document.createElement('div');

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';

    // ── Page header ──────────────────────────────────────────────────────────
    const pageHeader = document.createElement('div');
    pageHeader.style.cssText = 'padding:20px 24px 16px;border-bottom:1px solid #2a2a2a;margin-bottom:16px;';
    pageHeader.innerHTML = `
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#b8963e;margin-bottom:4px;">Framework Mapping</div>
        <div style="font-size:13px;color:#7a7470;">EU AI Act articles mapped to harmonised standards, requirements, and implementation controls.</div>
    `;
    wrapper.appendChild(pageHeader);

    // ── Table ─────────────────────────────────────────────────────────────────
    const tableContainer = document.createElement('div');
    tableContainer.style.cssText = 'overflow-x:auto;padding:0 8px 24px;';

    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:12px;';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const columns = [
        { label: 'AI Act Article', width: '15%' },
        { label: 'Standard',       width: '18%' },
        { label: 'Requirement',    width: '18%' },
        { label: 'Define',         width: '16%' },
        { label: 'Build',          width: '16%' },
        { label: 'Test',           width: '17%' },
    ];
    columns.forEach(col => {
        const th = document.createElement('th');
        th.style.cssText = `
            padding:10px 14px;text-align:left;width:${col.width};
            background:#1e1e1e;color:#b8963e;
            font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;
            border-bottom:2px solid #3d3d3d;border-right:1px solid #2a2a2a;
            position:sticky;top:0;z-index:1;
        `;
        th.textContent = col.label;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    let rowIndex = 0;
    let selectedRow = null;

    mindmap.forEach((groups, articleName) => {
        let isFirstArticleRow = true;

        groups.forEach((gData, standardName) => {
            let isFirstStandardRow = true;

            gData.requirements.forEach((reqEntry, reqKey) => {
                const req = reqEntry.requirement;

                // Classify implementations by control_number pattern
                const defineImpls = [], buildImpls = [], testImpls = [];
                reqEntry.implementations.forEach(impl => {
                    const cn = String(impl.control_number || '');
                    if (cn.includes('T'))      testImpls.push(impl);
                    else if (cn.includes('R')) buildImpls.push(impl);
                    else                       defineImpls.push(impl);
                });

                const isEven = rowIndex % 2 === 0;
                const baseBg = isEven ? '#1a1a1a' : '#161616';

                const row = document.createElement('tr');
                row.style.cssText = `background:${baseBg};cursor:pointer;transition:background 0.15s;`;
                row.dataset.baseBg = baseBg;

                row.addEventListener('mouseenter', () => {
                    if (selectedRow !== row) row.style.background = '#1e2530';
                });
                row.addEventListener('mouseleave', () => {
                    if (selectedRow !== row) row.style.background = row.dataset.baseBg;
                });
                row.addEventListener('click', () => {
                    if (selectedRow && selectedRow !== row) {
                        selectedRow.style.background = selectedRow.dataset.baseBg;
                        selectedRow.style.boxShadow = '';
                    }
                    if (selectedRow === row) {
                        row.style.background = row.dataset.baseBg;
                        row.style.boxShadow = '';
                        selectedRow = null;
                    } else {
                        row.style.background = '#1a2530';
                        row.style.boxShadow = 'inset 3px 0 0 #b8963e';
                        selectedRow = row;
                    }
                });

                // Top border: heavy on article boundary, medium on standard boundary, light otherwise
                const topBorder = isFirstArticleRow
                    ? '2px solid #3d3d3d'
                    : isFirstStandardRow
                        ? '1px solid #303030'
                        : '1px solid #252525';

                const cellBase = `padding:10px 14px;vertical-align:top;line-height:1.5;
                    border-top:${topBorder};border-bottom:1px solid #1f1f1f;border-right:1px solid #252525;`;

                // Article cell — full text on first row only, dimmed repeat otherwise
                const articleCell = document.createElement('td');
                articleCell.style.cssText = cellBase + (isFirstArticleRow
                    ? 'font-weight:600;color:#e0d9ce;border-right:1px solid #2a2a2a;'
                    : 'color:#404040;border-right:1px solid #2a2a2a;');
                articleCell.textContent = articleName;
                row.appendChild(articleCell);

                // Standard cell — full text on first row of each standard group
                const standardCell = document.createElement('td');
                standardCell.style.cssText = cellBase + (isFirstStandardRow
                    ? 'color:#7eb3c8;border-right:1px solid #2a2a2a;'
                    : 'color:#303545;border-right:1px solid #2a2a2a;');
                standardCell.textContent = standardName;
                row.appendChild(standardCell);

                // Requirement cell
                const reqCell = document.createElement('td');
                reqCell.style.cssText = cellBase + 'border-right:1px solid #2a2a2a;';
                reqCell.appendChild(makeControlEntry(reqKey, req.jkName, '#7eb3ff', '#1a2035', '#2a3a5e'));
                row.appendChild(reqCell);

                // Define / Build / Test cells
                const implColors = [
                    { num: '#7eb3ff', bg: '#1a2035', border: '#2a3a5e' },  // Define
                    { num: '#a78bfa', bg: '#1e1a35', border: '#2e2850' },  // Build
                    { num: '#34d399', bg: '#0f2520', border: '#1a3830' },  // Test
                ];
                [defineImpls, buildImpls, testImpls].forEach((impls, i) => {
                    const td = document.createElement('td');
                    td.style.cssText = cellBase;
                    if (impls.length === 0) {
                        td.style.color = '#303030';
                        td.textContent = '—';
                    } else {
                        impls.forEach(impl => {
                            td.appendChild(makeControlEntry(
                                impl.control_number, impl.jkName,
                                implColors[i].num, implColors[i].bg, implColors[i].border
                            ));
                        });
                    }
                    row.appendChild(td);
                });

                tbody.appendChild(row);

                isFirstArticleRow  = false;
                isFirstStandardRow = false;
                rowIndex++;
            });
        });
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);
    wrapper.appendChild(tableContainer);
    return wrapper;
}

function makeControlEntry(controlNum, name, numColor, numBg, numBorder) {
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom:8px;';

    if (controlNum) {
        const badge = document.createElement('span');
        badge.style.cssText = `
            display:inline-block;font-size:10px;font-weight:700;
            color:${numColor};background:${numBg};border:1px solid ${numBorder};
            border-radius:4px;padding:1px 6px;margin-bottom:3px;white-space:nowrap;
        `;
        badge.textContent = controlNum;
        div.appendChild(badge);
    }

    if (name) {
        const nameEl = document.createElement('div');
        nameEl.style.cssText = 'font-size:11px;color:#c4bdb5;line-height:1.4;';
        nameEl.textContent = name;
        div.appendChild(nameEl);
    }

    return div;
}
