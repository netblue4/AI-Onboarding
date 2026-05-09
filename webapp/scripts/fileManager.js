// ============================================
// scripts/fileManager.js
// ============================================
/**
 * Manages file operations: save, load, download
 */
class FileManager {
    constructor(stateManager, templateManager) {
        this.state = stateManager;
        this.templateManager = templateManager;
    }

    /**
     * Generate a unique system ID based on current date and random number
     * Format: AI-YYYYMMDD-XXX
     * @returns {string} Generated system ID
     */
    generateSystemId() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `AI-${year}${month}${day}-${random}`;
    }

    /**
     * Save progress data to a JSON file
     * @param {Object} capturedValues - The form data to save
     */
	saveProgress(capturedValues) {
		if (!this.state.systemId) {
			const systemIdInput = document.getElementById('system-id-input');
			const newSystemId = systemIdInput.value || this.generateSystemId();
			this.state.setSystemId(newSystemId);
			systemIdInput.value = newSystemId;
		}
	
		const dataFile = {
			_metadata: {
				templateVersion: CONFIG.CURRENT_TEMPLATE_VERSION,
				systemId: this.state.systemId,
				lastModifiedBy: this.state.currentRole,
				lastModifiedDate: new Date().toISOString()
			},
			capturedData: capturedValues
		};
	
		this.state.setCapturedData(capturedValues);
	
		// Updated naming convention: SystemID_SavedData_DateTime.json
		const dateTime = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
		this.downloadJSON(dataFile, `${this.state.systemId}_SavedData_${dateTime}.json`);
	}

    /**
     * Generate and download a regulator-ready HTML compliance report
     * @param {Object} capturedValues - The form data for the report
     */
    generateReport(capturedValues) {
        if (!this.state.systemId) {
            alert(CONFIG.MESSAGES.SYSTEM_ID_REQUIRED);
            return;
        }

        const webappData = window.originalWebappData;
        if (!webappData) { alert('Template data not loaded.'); return; }

        function esc(str) {
            return String(str || '')
                .replace(/&/g, '&amp;').replace(/</g, '&lt;')
                .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        const mindmapData = buildMindmapData(webappData, sanitizeForId, fieldStoredValue);

        // ── Aggregate scores ──────────────────────────────────────────────────
        let totalControls = 0, metCount = 0, partialCount = 0, notMetCount = 0, pendingCount = 0;
        let soaApplicable = 0, soaNotApplicable = 0, soaNotSet = 0;

        mindmapData.forEach((groups) => {
            groups.forEach((gData) => {
                gData.requirements.forEach((reqEntry) => {
                    const soa = fieldStoredValue(reqEntry.requirement, true);
                    if (soa === 'Applicable') {
                        soaApplicable++;
                        reqEntry.implementations.forEach(impl => {
                            totalControls++;
                            const s = fieldStoredValue(impl, true);
                            if (s === 'Met')            metCount++;
                            else if (s === 'Not Met')   notMetCount++;
                            else if (s === 'Partially Met') partialCount++;
                            else                        pendingCount++;
                        });
                    } else if (soa === 'Not Applicable') {
                        soaNotApplicable++;
                    } else {
                        soaNotSet++;
                    }
                });
            });
        });

        const soaTotal  = soaApplicable + soaNotApplicable + soaNotSet;
        const metPct     = totalControls > 0 ? Math.round((metCount     / totalControls) * 100) : 0;
        const partialPct = totalControls > 0 ? Math.round((partialCount / totalControls) * 100) : 0;
        const notMetPct  = totalControls > 0 ? Math.round((notMetCount  / totalControls) * 100) : 0;
        const pendingPct = totalControls > 0 ? Math.round((pendingCount / totalControls) * 100) : 0;

        const reportDate     = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        const reportDateTime = new Date().toISOString();
        const auditLog       = capturedValues._auditLog || [];

        const barStyle = totalControls > 0
            ? `background:linear-gradient(to right,#16a34a ${metPct}%,#ca8a04 ${metPct}% ${metPct + partialPct}%,#dc2626 ${metPct + partialPct}% ${metPct + partialPct + notMetPct}%,#9ca3af ${metPct + partialPct + notMetPct}% 100%)`
            : 'background:#e5e7eb';

        // ── Article sections ──────────────────────────────────────────────────
        let articleSectionsHtml = '';

        mindmapData.forEach((groups, stepName) => {
            let groupsHtml = '';

            groups.forEach((gData, groupName) => {
                let standard = '', displayName = groupName;
                if (groupName.includes('] - ')) {
                    const parts = groupName.split('] - ');
                    standard    = parts[0] + ']';
                    displayName = parts[1].replace(/\.$/, '');
                }

                let reqsHtml = '';

                gData.requirements.forEach((reqEntry, reqKey) => {
                    const req       = reqEntry.requirement;
                    const soaStatus = fieldStoredValue(req, true) || 'Not Set';
                    const soaClass  = soaStatus === 'Applicable'     ? 'badge-applicable'
                                    : soaStatus === 'Not Applicable' ? 'badge-not-applicable'
                                    : 'badge-pending';

                    let implHtml = '';
                    if (soaStatus === 'Applicable' && reqEntry.implementations.size > 0) {
                        let implRows = '';
                        reqEntry.implementations.forEach(impl => {
                            const complyStatus = fieldStoredValue(impl, true) || 'Pending';
                            const ev           = fieldStoredValue(impl, false) || '';
                            const noteKey      = sanitizeForId(impl.control_number) + '_complynote';
                            const note         = capturedValues[noteKey] || '';
                            const statusClass  = complyStatus === 'Met'           ? 'status-met'
                                               : complyStatus === 'Partially Met' ? 'status-partial'
                                               : complyStatus === 'Not Met'       ? 'status-notmet'
                                               : 'status-pending';
                            const evidenceHtml = (ev && ev.startsWith('http'))
                                ? `<a href="${esc(ev)}" target="_blank">${esc(ev)}</a>`
                                : esc(ev) || '—';
                            implRows += `<tr>
                                <td class="ctrl-number">${esc(impl.control_number)}</td>
                                <td>${esc(impl.jkName || impl.jkText || '')}</td>
                                <td><span class="status-badge ${statusClass}">${esc(complyStatus)}</span></td>
                                <td class="evidence-cell">${evidenceHtml}</td>
                                <td class="note-cell">${esc(note) || '—'}</td>
                            </tr>`;
                        });
                        implHtml = `<table class="impl-table">
                            <thead><tr>
                                <th>Control</th><th>Description</th><th>Status</th>
                                <th>Evidence / JIRA</th><th>Approver Note</th>
                            </tr></thead>
                            <tbody>${implRows}</tbody>
                        </table>`;
                    }

                    const dimStyle = (soaStatus === 'Not Applicable') ? 'opacity:0.5;' : '';
                    reqsHtml += `<div class="requirement-block" style="${dimStyle}">
                        <div class="req-header">
                            <span class="req-id">${esc(reqKey)}</span>
                            <span class="req-name">${esc(req.jkName || '')}</span>
                            <span class="badge ${soaClass}">${esc(soaStatus)}</span>
                        </div>
                        <p class="req-desc">${esc(req.jkText || '')}</p>
                        ${implHtml}
                    </div>`;
                });

                groupsHtml += `<div class="group-block">
                    <div class="group-header">
                        ${standard ? `<span class="std-badge">${esc(standard)}</span>` : ''}
                        <span class="group-name">${esc(displayName)}</span>
                    </div>
                    ${reqsHtml}
                </div>`;
            });

            articleSectionsHtml += `<div class="article-section">
                <h2 class="article-title">${esc(stepName)}</h2>
                ${groupsHtml}
            </div>`;
        });

        // ── Audit log section ─────────────────────────────────────────────────
        let auditLogHtml = '';
        if (auditLog.length > 0) {
            const rows = auditLog.map(entry => {
                const toClass = entry.to === 'Met'           ? 'status-met'
                              : entry.to === 'Partially Met' ? 'status-partial'
                              : entry.to === 'Not Met'       ? 'status-notmet'
                              : 'status-pending';
                return `<tr>
                    <td class="log-time">${esc(new Date(entry.timestamp).toLocaleString())}</td>
                    <td class="ctrl-number">${esc(entry.controlNumber)}</td>
                    <td>${esc(entry.controlName)}</td>
                    <td>${esc(entry.from || '—')}</td>
                    <td><span class="status-badge ${toClass}">${esc(entry.to)}</span></td>
                    <td class="note-cell">${esc(entry.note || '—')}</td>
                </tr>`;
            }).join('');

            auditLogHtml = `<div class="audit-section">
                <h2 class="section-title">Assessment Audit Log</h2>
                <p class="section-desc">Immutable record of all compliance status determinations made during this assessment.</p>
                <table class="audit-table">
                    <thead><tr>
                        <th>Timestamp</th><th>Control</th><th>Control Name</th>
                        <th>Previous Status</th><th>New Status</th><th>Justification</th>
                    </tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
        }

        // ── HTML template ─────────────────────────────────────────────────────
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>AI Compliance Assessment &mdash; ${esc(this.state.systemId)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;font-size:13px;color:#1a1a1a;background:#fff}
.cover{padding:48px 60px 36px;border-bottom:3px solid #1a1a1a}
.cover-label{font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#6b7280;margin-bottom:8px}
.cover-title{font-size:26px;font-weight:800;color:#111;line-height:1.2;margin-bottom:24px}
.cover-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.meta-item label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;display:block;margin-bottom:3px}
.meta-item span{font-size:13px;font-weight:600;color:#111}
.reg-banner{margin-top:24px;padding:10px 16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;font-size:12px;color:#166534;line-height:1.6}
.scorecard{padding:32px 60px;border-bottom:1px solid #e5e7eb;background:#fafafa}
.section-title{font-size:15px;font-weight:700;color:#111;margin-bottom:4px}
.section-desc{font-size:12px;color:#6b7280;margin-bottom:20px}
.score-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:18px}
.score-card{background:#fff;border-radius:8px;padding:16px;border:1px solid #e5e7eb}
.score-card .count{font-size:30px;font-weight:800;line-height:1}
.score-card .label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-top:4px}
.score-card .pct{font-size:11px;margin-top:3px}
.s-met{color:#16a34a}.s-partial{color:#ca8a04}.s-notmet{color:#dc2626}.s-pending{color:#6b7280}
.compliance-bar{height:10px;border-radius:5px;margin-bottom:10px}
.bar-legend{display:flex;gap:16px;font-size:11px;color:#374151;margin-bottom:16px}
.legend-item{display:flex;align-items:center;gap:5px}
.legend-dot{width:8px;height:8px;border-radius:50%}
.soa-summary{padding:10px 14px;background:#fff;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;color:#374151}
.findings{padding:32px 60px}
.findings-title{font-size:15px;font-weight:700;color:#111;margin-bottom:4px}
.findings-desc{font-size:12px;color:#6b7280;margin-bottom:24px}
.article-section{margin-bottom:40px}
.article-title{font-size:14px;font-weight:700;color:#fff;background:#1a1a1a;padding:10px 16px;border-radius:6px;margin-bottom:14px}
.group-block{margin-bottom:18px}
.group-header{display:flex;align-items:center;gap:10px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #e5e7eb}
.std-badge{font-size:10px;font-weight:700;color:#6b7280;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:4px;padding:2px 8px;white-space:nowrap}
.group-name{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#374151}
.requirement-block{margin-bottom:12px;padding:12px 14px;border:1px solid #e5e7eb;border-radius:8px}
.req-header{display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap}
.req-id{font-size:10px;font-weight:700;color:#2563eb;background:#eff6ff;border:1px solid #bfdbfe;border-radius:4px;padding:2px 8px;white-space:nowrap}
.req-name{font-size:13px;font-weight:600;color:#111;flex:1}
.req-desc{font-size:12px;color:#6b7280;line-height:1.6;margin-bottom:10px}
.badge{font-size:10px;font-weight:700;border-radius:12px;padding:3px 10px;white-space:nowrap}
.badge-applicable{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
.badge-not-applicable{background:#fff7ed;color:#c2410c;border:1px solid #fed7aa}
.badge-pending{background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb}
.status-badge{font-size:10px;font-weight:700;border-radius:10px;padding:2px 8px;white-space:nowrap}
.status-met{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
.status-partial{background:#fefce8;color:#ca8a04;border:1px solid #fde68a}
.status-notmet{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
.status-pending{background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb}
.impl-table{width:100%;border-collapse:collapse;font-size:12px;margin-top:4px}
.impl-table th{background:#f9fafb;text-align:left;padding:7px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;border-bottom:1px solid #e5e7eb}
.impl-table td{padding:7px 10px;border-bottom:1px solid #f3f4f6;vertical-align:top}
.impl-table tr:last-child td{border-bottom:none}
.ctrl-number{font-family:monospace;font-size:11px;color:#374151;white-space:nowrap}
.evidence-cell{max-width:220px;overflow-wrap:break-word;font-size:11px}
.evidence-cell a{color:#2563eb;text-decoration:none}
.note-cell{font-size:11px;color:#6b7280;font-style:italic}
.audit-section{padding:32px 60px;border-top:1px solid #e5e7eb;background:#fafafa}
.audit-table{width:100%;border-collapse:collapse;font-size:12px}
.audit-table th{background:#f3f4f6;text-align:left;padding:7px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;border-bottom:1px solid #e5e7eb}
.audit-table td{padding:7px 10px;border-bottom:1px solid #f3f4f6;vertical-align:top}
.audit-table tr:last-child td{border-bottom:none}
.log-time{font-size:11px;color:#6b7280;white-space:nowrap}
.footer{padding:14px 60px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;display:flex;justify-content:space-between}
@media print{
  body{font-size:11px}
  .cover,.scorecard,.findings,.audit-section{padding-left:40px;padding-right:40px}
  .article-section{page-break-inside:avoid}
  .evidence-cell a{color:#2563eb}
}
</style>
</head>
<body>

<div class="cover">
  <div class="cover-label">Compliance Assessment Report</div>
  <div class="cover-title">AI System Compliance Assessment &mdash; ${esc(this.state.systemId)}</div>
  <div class="cover-meta">
    <div class="meta-item"><label>System ID</label><span>${esc(this.state.systemId)}</span></div>
    <div class="meta-item"><label>Assessment Date</label><span>${esc(reportDate)}</span></div>
    <div class="meta-item"><label>Generated By</label><span>${esc(this.state.currentRole || 'System')}</span></div>
    <div class="meta-item"><label>Template Version</label><span>${esc(CONFIG.CURRENT_TEMPLATE_VERSION)}</span></div>
    <div class="meta-item"><label>Regulatory Framework</label><span>EU AI Act</span></div>
    <div class="meta-item"><label>Technical Standard</label><span>prEN 18229</span></div>
  </div>
  <div class="reg-banner"><strong>Regulatory Reference:</strong> This assessment is conducted against prEN 18229, the CEN-CENELEC technical standard referenced under Article 40(1) of the EU AI Act. Compliance with this standard supports Presumption of Conformity once the standard is cited in the Official Journal of the European Union.</div>
</div>

<div class="scorecard">
  <div class="section-title">Compliance Overview</div>
  <div class="section-desc">Aggregate status of all applicable implementation controls</div>
  <div class="score-grid">
    <div class="score-card"><div class="count s-met">${metCount}</div><div class="label">Met</div><div class="pct s-met">${metPct}% of controls</div></div>
    <div class="score-card"><div class="count s-partial">${partialCount}</div><div class="label">Partially Met</div><div class="pct s-partial">${partialPct}% of controls</div></div>
    <div class="score-card"><div class="count s-notmet">${notMetCount}</div><div class="label">Not Met</div><div class="pct s-notmet">${notMetPct}% of controls</div></div>
    <div class="score-card"><div class="count s-pending">${pendingCount}</div><div class="label">Pending Assessment</div><div class="pct s-pending">${pendingPct}% of controls</div></div>
  </div>
  <div class="compliance-bar" style="${barStyle}"></div>
  <div class="bar-legend">
    <div class="legend-item"><div class="legend-dot" style="background:#16a34a"></div>Met</div>
    <div class="legend-item"><div class="legend-dot" style="background:#ca8a04"></div>Partially Met</div>
    <div class="legend-item"><div class="legend-dot" style="background:#dc2626"></div>Not Met</div>
    <div class="legend-item"><div class="legend-dot" style="background:#9ca3af"></div>Pending</div>
  </div>
  <div class="soa-summary"><strong>Statement of Applicability:</strong> ${soaTotal} requirements assessed &mdash; <span class="s-met">${soaApplicable} Applicable</span>, <span style="color:#c2410c">${soaNotApplicable} Not Applicable</span>, <span class="s-pending">${soaNotSet} Not Yet Assessed</span></div>
</div>

<div class="findings">
  <div class="findings-title">Compliance Findings</div>
  <div class="findings-desc">Detailed findings by EU AI Act article and prEN 18229 control group. Not Applicable requirements are shown dimmed.</div>
  ${articleSectionsHtml}
</div>

${auditLogHtml}

<div class="footer">
  <span>AI System Compliance Assessment &mdash; ${esc(this.state.systemId)}</span>
  <span>Generated: ${esc(reportDateTime)} &nbsp;|&nbsp; Standard: prEN 18229 v${esc(CONFIG.CURRENT_TEMPLATE_VERSION)}</span>
</div>

</body>
</html>`;

        const dateStr = new Date().toISOString().slice(0, 10);
        this.downloadHTML(html, `${this.state.systemId}_ComplianceReport_${dateStr}.html`);
    }

    /**
     * Trigger download of a JSON object as a file
     * @param {Object} data - The object to download
     * @param {string} filename - The filename for the download
     */
    downloadJSON(data, filename) {
        const jsonData = JSON.stringify(data, null, 4);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Trigger download of an HTML string as a file
     * @param {string} htmlString - The HTML content to download
     * @param {string} filename - The filename for the download
     */
    downloadHTML(htmlString, filename) {
        const blob = new Blob([htmlString], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Load and parse a JSON file from user input
     * @param {File} file - The file object to load
     * @returns {Promise<Object>} The parsed file contents
     */
    loadFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const loadedFile = JSON.parse(event.target.result);
                    resolve(loadedFile);
                } catch (error) {
                    reject(new Error('Invalid JSON file: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Export captured data for external use
     * @param {Object} data - The data to export
     * @param {string} format - Export format ('json', 'csv')
     * @returns {string} Formatted data as string
     */
    exportData(data, format = 'json') {
        if (format === 'json') {
            return JSON.stringify(data, null, 4);
        } else if (format === 'csv') {
            // Simple CSV export: field name, value
            let csv = 'Field Name,Value\n';
            for (const [key, value] of Object.entries(data)) {
                const escapedValue = String(value).replace(/"/g, '""');
                csv += `"${key}","${escapedValue}"\n`;
            }
            return csv;
        }
        return '';
    }
}

const fileManager = new FileManager(state, templateManager);
