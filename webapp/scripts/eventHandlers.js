// ============================================
// 9. scripts/eventHandlers.js
// ============================================
class EventHandlers {
    constructor(stateManager, fileManager, dataCapture, contentRenderer, roleProgressTracker) {
        this.state = stateManager;
        this.fileManager = fileManager;
        this.dataCapture = dataCapture;
        this.contentRenderer = contentRenderer;
        this.roleProgressTracker = roleProgressTracker;
    }

    setup() {
        const roleDropdown = document.getElementById('role-dropdown');
        const dimensionDropdown = document.getElementById('dimension-dropdown');
        const systemIdInput = document.getElementById('system-id-input');
        const fileInput = document.getElementById('file-input');
        const saveBtn = document.getElementById('save-btn');
        const downloadBtn = document.getElementById('download-btn');
        const infoBanner = document.getElementById('info-banner');
        const versionBanner = document.getElementById('version-banner');
        const highlightNewBtn = document.getElementById('highlight-new-btn');

        // Role change
        roleDropdown.addEventListener('change', (e) => {
            this.state.setCurrentRole(e.target.value);
            this.contentRenderer.render();
        });

        // Dimension change
        dimensionDropdown.addEventListener('change', (e) => {
            this.state.setCurrentDimension(e.target.value);
            this.contentRenderer.render();
        });

        // System ID change
        systemIdInput.addEventListener('change', (e) => {
            this.state.setSystemId(e.target.value);
        });

        // Save progress
        saveBtn.addEventListener('click', () => {
            const currentValues = this.dataCapture.captureAll();
            this.fileManager.saveProgress(currentValues);
            this.roleProgressTracker.update();
            alert('Progress saved! File downloaded: ' + this.state.systemId + '_data.json');
        });

        // Download report
        downloadBtn.addEventListener('click', () => {
            const currentValues = this.dataCapture.captureAll();
            this.fileManager.generateReport(currentValues);
            alert('Compliance report downloaded!');
        });

        // Load file
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            this.fileManager.loadFile(file).then(loadedFile => {
                if (loadedFile._metadata) {
                    this.state.setSystemId(loadedFile._metadata.systemId || '');
                    systemIdInput.value = this.state.systemId;
                    this.state.setLoadedVersion(loadedFile._metadata.templateVersion || "1.0");

                    infoBanner.classList.add('show');
                    document.getElementById('loaded-file-info').textContent =
                        `System ID: ${this.state.systemId} | Last modified by: ${loadedFile._metadata.lastModifiedBy || 'Unknown'} | Date: ${loadedFile._metadata.lastModifiedDate ? new Date(loadedFile._metadata.lastModifiedDate).toLocaleString() : 'Unknown'}`;
                }

                if (loadedFile.capturedData) {
                    this.state.setCapturedData(loadedFile.capturedData);
                } else {
                    this.state.setCapturedData({});
                }

                if (this.state.loadedVersion !== CONFIG.CURRENT_TEMPLATE_VERSION) {
                    versionBanner.classList.add('show');
                    const templateFields = templateManager.getAllFieldNames();
                    const existingFields = new Set(Object.keys(this.state.capturedData));
                    const newFields = [...templateFields].filter(f => !existingFields.has(f));

                    document.getElementById('version-message').textContent =
                        `This assessment was created with template v${this.state.loadedVersion}, but you're using v${CONFIG.CURRENT_TEMPLATE_VERSION}. ${newFields.length} new field(s) detected.`;
                } else {
                    versionBanner.classList.remove('show');
                }

                if (this.state.currentRole) {
                    this.contentRenderer.render();
                }

                this.roleProgressTracker.update();
                alert('Data file loaded successfully!');
            }).catch(error => {
                alert('Error loading file: ' + error.message);
            });
        });

        // Highlight new fields
        highlightNewBtn.addEventListener('click', () => {
            this.state.setNewFieldsHighlighted(!this.state.newFieldsHighlighted);
            this.contentRenderer.render();
            highlightNewBtn.textContent = this.state.newFieldsHighlighted ? 'Hide Highlights' : 'Highlight New Fields';
        });
    }
}

const eventHandlers = new EventHandlers(state, fileManager, dataCapture, contentRenderer, roleProgressTracker);

