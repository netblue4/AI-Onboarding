// ============================================
// scripts/app.js (FIXED - Class Loading)
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

            // Step 2: Verify classes are available
            console.log('Step 2: Verifying required classes...');
            if (typeof DataCapture === 'undefined') {
                throw new Error('DataCapture class not found');
            }
            if (typeof DataRestore === 'undefined') {
                throw new Error('DataRestore class not found');
            }
            if (typeof ContentRenderer === 'undefined') {
                throw new Error('ContentRenderer class not found');
            }
            if (typeof EventHandlers === 'undefined') {
                throw new Error('EventHandlers class not found');
            }
            console.log('✓ All required classes available');

            // Step 3: Create dataCapture instance
            console.log('Step 3: Creating dataCapture instance...');
            let dataCapture;
            try {
                dataCapture = new DataCapture(this.state, this.templateManager);
                window.dataCapture = dataCapture;
                console.log('✓ DataCapture created');
            } catch (e) {
                console.error('Failed to create DataCapture:', e);
                throw e;
            }

            // Step 4: Create dataRestore instance
            console.log('Step 4: Creating dataRestore instance...');
            let dataRestore;
            try {
                dataRestore = new DataRestore(this.state, this.templateManager);
                window.dataRestore = dataRestore;
                console.log('✓ DataRestore created');
            } catch (e) {
                console.error('Failed to create DataRestore:', e);
                throw e;
            }

            // Step 5: Create contentRenderer instance
            console.log('Step 5: Creating contentRenderer instance...');
            let contentRenderer;
            try {
                contentRenderer = new ContentRenderer(
                    this.state,
                    this.templateManager,
                    dataRestore
                );
                window.contentRenderer = contentRenderer;
                console.log('✓ ContentRenderer created');
            } catch (e) {
                console.error('Failed to create ContentRenderer:', e);
                throw e;
            }

            // Step 6: Initialize role progress UI
            console.log('Step 6: Initializing role progress tracker...');
            this.roleProgressTracker.initialize();
            console.log('✓ Role progress tracker initialized');

            // Step 7: Create and setup event handlers
            console.log('Step 7: Setting up event handlers...');
            let eventHandlers;
            try {
                eventHandlers = new EventHandlers(
                    this.state,
                    this.fileManager,
                    dataCapture,
                    ContentRenderer,
                    this.roleProgressTracker
                );
                window.eventHandlers = eventHandlers;
                eventHandlers.setup();
                console.log('✓ Event handlers setup complete');
            } catch (e) {
                console.error('Failed to setup event handlers:', e);
                throw e;
            }

            // Step 8: Auto-generate system ID
            console.log('Step 8: Generating system ID...');
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
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
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
                alert('Initialization failed: ' + error.message);
                return;
            }

            // Clear existing content using textContent first
            contentArea.textContent = '';

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
            alert('Application initialization failed. Check console for details: ' + error.message);
        }
    }
}

// ===== PAGE LOAD INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    console.log('Checking if required managers are available...');
    
    // Verify all required managers exist
    if (typeof state === 'undefined') {
        console.error('state is not defined');
        return;
    }
    if (typeof templateManager === 'undefined') {
        console.error('templateManager is not defined');
        return;
    }
    if (typeof fileManager === 'undefined') {
        console.error('fileManager is not defined');
        return;
    }
    if (typeof roleProgressTracker === 'undefined') {
        console.error('roleProgressTracker is not defined');
        return;
    }

    console.log('✓ All managers available');
    
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