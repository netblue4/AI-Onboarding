// ============================================
// scripts/eventHandlers.js (FIXED)
// ============================================
/**
 * Sets up all event listeners for the application
 */
class EventHandlers {
    constructor(stateManager, fileManager, dataCapture, contentRendererClass, roleProgressTracker) {
        this.state = stateManager;
        this.fileManager = fileManager;
        this.dataCapture = dataCapture;
        this.ContentRendererClass = contentRendererClass;
        this.roleProgressTracker = roleProgressTracker;
        this.contentRenderer = null; // Will be initialized
    }

    /**
     * Initialize content renderer and setup all event listeners
     */
    setup() {
        // Create content renderer instance
        this.contentRenderer = new ContentRenderer(
            this.state,
            templateManager,
            dataRestore
        );

        // Make it globally available
        window.contentRenderer = this.contentRenderer;
        contentRenderer = this.contentRenderer;

        console.log('EventHandlers.setup() called');

        //const roleDropdown = document.getElementById('role-dropdown');
        const dimensionDropdown = document.getElementById('dimension-dropdown');
        const systemIdInput = document.getElementById('system-id-input');
        const fileInput = document.getElementById('file-input');
        const compliancemapBtn = document.getElementById('compliancemap-btn');
        const saveBtn = document.getElementById('save-btn');
        const downloadBtn = document.getElementById('download-btn');
        const infoBanner = document.getElementById('info-banner');
        const versionBanner = document.getElementById('version-banner');
        const highlightNewBtn = document.getElementById('highlight-new-btn');

        // ===== DIMENSION DROPDOWN =====
        if (dimensionDropdown) {
            dimensionDropdown.addEventListener('change', (e) => {
                console.log('Dimension changed to:', e.target.value);
                this.state.setCurrentDimension(e.target.value);
                this.contentRenderer.render();
            });
        }

        // ===== SYSTEM ID INPUT =====
        if (systemIdInput) {
            systemIdInput.addEventListener('change', (e) => {
                this.state.setSystemId(e.target.value);
            });
        }
        
        // ===== COMPLIANE MAP BUTTON =====
        compliancemapBtn.addEventListener('click', () => {
            console.log('Load Compliance map button clicked');

			const contentArea = document.getElementById('content-area');
			if (!contentArea) return;
		
			// 1. Clear previous content
			contentArea.innerHTML = '';
			
			try {
				// 2. Get the specialized handler
				const handler = getFieldHandler('mindmap');
				
				if (handler) {
					// 3. Call the handler. 
					// Note: Since we aren't looping, we pass null or a global config 
					// if the handler is already "data-aware".
					const mindmapElement = handler(
						this.state.capturedData, 
						templateManager.sanitizeForId.bind(templateManager),
						templateManager.fieldStoredValue.bind(templateManager)
					);
		
					console.log('Mindmap Element produced:', mindmapElement); // Add this!
		
					if (mindmapElement) {
						contentArea.appendChild(mindmapElement);
					} else {
						contentArea.innerHTML = '<div class="empty-state">No mindmap data found.</div>';
					}
				}
			} catch (error) {
				console.error('Error in Mindmap rendering:', error);
				contentArea.innerHTML = '<div class="error">Failed to render mindmap view.</div>';
			}

        });

        // ===== SAVE PROGRESS BUTTON =====
        saveBtn.addEventListener('click', () => {
            console.log('Save button clicked');
            const currentValues = this.dataCapture.captureAll();
            this.fileManager.saveProgress(currentValues);
            this.roleProgressTracker.update();
            alert(CONFIG.MESSAGES.PROGRESS_SAVED + this.state.systemId + '_data.json');
        });

        // ===== DOWNLOAD REPORT BUTTON =====
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                console.log('Download button clicked');
                const currentValues = this.dataCapture.captureAll();
                this.fileManager.generateReport(currentValues);
                alert(CONFIG.MESSAGES.REPORT_DOWNLOADED);
            });
        }

        // ===== FILE INPUT HANDLER =====
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                console.log('Loading file:', file.name);

                this.fileManager.loadFile(file)
                    .then(loadedFile => {
                        console.log('File loaded successfully');

                        // Extract metadata
                        if (loadedFile._metadata) {
                            this.state.setSystemId(loadedFile._metadata.systemId || '');
                            systemIdInput.value = this.state.systemId;
                            this.state.setLoadedVersion(loadedFile._metadata.templateVersion || "1.0");

                            if (infoBanner) {
                                infoBanner.classList.add('show');
                                document.getElementById('loaded-file-info').textContent =
                                    `System ID: ${this.state.systemId} | Last modified by: ${loadedFile._metadata.lastModifiedBy || 'Unknown'} | Date: ${loadedFile._metadata.lastModifiedDate ? new Date(loadedFile._metadata.lastModifiedDate).toLocaleString() : 'Unknown'}`;
                            }
                        }

                        // Extract captured data
                        if (loadedFile.capturedData) {
                            this.state.setCapturedData(loadedFile.capturedData);
                        } else {
                            this.state.setCapturedData({});
                        }

                        // Check version compatibility
                        if (this.state.loadedVersion !== CONFIG.CURRENT_TEMPLATE_VERSION) {
                            if (versionBanner) {
                                versionBanner.classList.add('show');
                                const templateFields = templateManager.getAllFieldNames();
                                const existingFields = new Set(Object.keys(this.state.capturedData));
                                const newFields = [...templateFields].filter(f => !existingFields.has(f));

                                document.getElementById('version-message').textContent =
                                    `This assessment was created with template v${this.state.loadedVersion}, but you're using v${CONFIG.CURRENT_TEMPLATE_VERSION}. ${newFields.length} new field(s) detected.`;
                            }
                        } else {
                            if (versionBanner) {
                                versionBanner.classList.remove('show');
                            }
                        }

                        // Render content if role is selected
                        if (this.state.currentRole) {
                            this.contentRenderer.render();
                        }

                        this.roleProgressTracker.update();
                        alert(CONFIG.MESSAGES.FILE_LOADED);
                        
                        
                        
                        
                        
                        
                        
                        compliancemapBtn.classList.remove("btn-primary");
                        compliancemapBtn.className = "btn-primary";
                        
                        
                        
                        
                        
                        
                        
                    })
                    .catch(error => {
                        console.error('Error loading file:', error);
                        alert(CONFIG.MESSAGES.FILE_LOAD_ERROR + error.message);
                    });
            });
        }

        // ===== HIGHLIGHT NEW FIELDS BUTTON =====
        if (highlightNewBtn) {
            highlightNewBtn.addEventListener('click', () => {
                this.state.setNewFieldsHighlighted(!this.state.newFieldsHighlighted);
                this.contentRenderer.render();
                highlightNewBtn.textContent = this.state.newFieldsHighlighted 
                    ? 'Hide Highlights' 
                    : 'Highlight New Fields';
            });
        }

        console.log('All event listeners attached successfully');
    }
}

// Create global instance (initialized in app.js)
let eventHandlers;