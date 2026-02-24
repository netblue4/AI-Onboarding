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
        this.downloadJSON(dataFile, `${capturedValues}_data.json`);
    }

    /**
     * Generate and download a compliance report
     * @param {Object} capturedValues - The form data for the report
     */
    generateReport(capturedValues) {
        if (!this.state.systemId) {
            alert(CONFIG.MESSAGES.SYSTEM_ID_REQUIRED);
            return;
        }

        const report = {
            _metadata: {
                templateVersion: CONFIG.CURRENT_TEMPLATE_VERSION,
                systemId: this.state.systemId,
                reportGeneratedBy: this.state.currentRole,
                reportGeneratedDate: new Date().toISOString(),
                reportType: "AI Compliance Report"
            },
            capturedData: capturedValues,
            summary: {
                totalFields: Object.keys(capturedValues).length,
                completedFields: Object.values(capturedValues).filter(v => v && v !== '').length,
                completionPercentage: Math.round(
                    (Object.values(capturedValues).filter(v => v && v !== '').length / 
                     Object.keys(capturedValues).length) * 100
                ) || 0
            }
        };

        this.downloadJSON(report, `${this.state.systemId}_compliance_report.json`);
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
