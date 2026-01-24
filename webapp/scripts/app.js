// ============================================
// scripts/app.js (FIXED - Readonly innerHTML)
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
            console.error('=== App Initialization Failed ===');
            console.error('Error details:', error);
            console.error('Error stack:', error.stack);
            
            this.displayErrorMessage(error);
        }
    }

    /**
     * Display error message safely without using innerHTML
     * @param {Error} error - The error object
     */
    displayErrorMessage(error) {
        try {
            const contentArea = document.getElementById('content-area');
            if (!contentArea) {
                console.error('content-area element not found');
                return;
            }

            // Clear existing content
            while (contentArea.firstChild) {
                contentArea.removeChild(contentArea.firstChild);
            }

            // Create error container
            const errorDiv = document.createElement('div');
            errorDiv.className = 'empty-state';

            // Create title
            const title = document.createElement('h2');
            title.textContent = 'Initialization Error';
            errorDiv.appendChild(title);

            // Create message
            const message = document.createElement('p');
            message.textContent = 'Failed to initialize the application.';
            errorDiv.appendChild(message);

            // Create error details
            const errorDetail = document.createElement('p');
            const errorLabel = document.createElement('strong');
            errorLabel.textContent = 'Error: ';
            errorDetail.appendChild(errorLabel);
            const errorText = document.createTextNode(error.message);
            errorDetail.appendChild(errorText);
            errorDiv.appendChild(errorDetail);

            // Create console tip
            const tip = document.createElement('p');
            tip.textContent = 'Check the browser console for more details.';
            errorDiv.appendChild(tip);

            // Add to page
            contentArea.appendChild(errorDiv);

            console.error('Error message displayed in UI');
        } catch (displayError) {
            console.error('Failed to display error message:', displayError);
            alert('Application initialization failed. Check console for details.');
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