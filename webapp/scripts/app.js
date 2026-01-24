// ============================================
// scripts/app.js (FIXED)
// ============================================
/**
 * Main application class - orchestrates initialization
 */
class App {
    constructor(
        stateManager,
        templateManager,
        fileManager,
        roleProgressTracker
    ) {
        this.state = stateManager;
        this.templateManager = templateManager;
        this.fileManager = fileManager;
        this.roleProgressTracker = roleProgressTracker;
    }

    /**
     * Initialize the entire application
     */
    async initialize() {
        console.log('=== App Initialization Started ===');

        try {
            // Step 0: Set template manager reference in roleProgressTracker
            console.log('Step 0: Setting template manager reference...');
            this.roleProgressTracker.setTemplateManager(this.templateManager);
            console.log('✓ Template manager reference set');

            // Step 1: Load template
            console.log('Step 1: Loading template...');
            await this.templateManager.load();
            console.log('✓ Template loaded successfully');

            // Step 2: Create dataCapture instance
            console.log('Step 2: Creating dataCapture instance...');
            window.dataCapture = new DataCapture(this.state, this.templateManager);
            dataCapture = window.dataCapture;
            console.log('✓ DataCapture created');

            // Step 3: Create dataRestore instance
            console.log('Step 3: Creating dataRestore instance...');
            window.dataRestore = new DataRestore(this.state, this.templateManager);
            dataRestore = window.dataRestore;
            console.log('✓ DataRestore created');

            // Step 4: Create contentRenderer instance
            console.log('Step 4: Creating contentRenderer instance...');
            window.contentRenderer = new ContentRenderer(
                this.state,
                this.templateManager,
                window.dataRestore
            );
            contentRenderer = window.contentRenderer;
            console.log('✓ ContentRenderer created');

            // Step 5: Initialize role progress UI
            console.log('Step 5: Initializing role progress tracker...');
            this.roleProgressTracker.initialize();
            console.log('✓ Role progress tracker initialized');

            // Step 6: Create and setup event handlers
            console.log('Step 6: Setting up event handlers...');
            window.eventHandlers = new EventHandlers(
                this.state,
                this.fileManager,
                window.dataCapture,
                ContentRenderer,
                this.roleProgressTracker
            );
            eventHandlers = window.eventHandlers;
            window.eventHandlers.setup();
            console.log('✓ Event handlers setup complete');

            // Step 7: Auto-generate system ID
            console.log('Step 7: Generating system ID...');
            if (!this.state.systemId) {
                const systemId = this.fileManager.generateSystemId();
                this.state.setSystemId(systemId);
                const systemIdInput = document.getElementById('system-id-input');
                if (systemIdInput) {
                    systemIdInput.value = systemId;
                }
            }
            console.log('✓ System ID:', this.state.systemId);

            console.log('=== App Initialization Complete ===');
            console.log('Ready for user interaction');

        } catch (error) {
            //console.error('=== App Initialization Failed ===');
           // console.error('Error details:', error);
            
            const contentArea = document.getElementById('content-area');
            if (contentArea) {
                contentArea.innerHTML = `
                    <div class="empty-state">
                        <h2>Initialization Error</h2>
                        <p>Failed to initialize the application.</p>
                        <p><strong>Error:</strong> ${error.message}</p>
                        <p>Check the browser console for more details.</p>
                    </div>
                `;
            }
        }
    }
}

// ===== PAGE LOAD INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    console.log('Template data available:', !!window.originalWebappData);
    
    // Create and initialize app
    const app = new App(
        state,
        templateManager,
        fileManager,
        roleProgressTracker
    );

    app.initialize();
});

// Log when document is ready (for debugging)
console.log('app.js script loaded');