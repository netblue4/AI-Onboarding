// ============================================
// 10. scripts/app.js
// ============================================
class App {
    constructor(
        stateManager,
        templateManager,
        fileManager,
        roleProgressTracker,
        contentRenderer,
        eventHandlers
    ) {
        this.state = stateManager;
        this.templateManager = templateManager;
        this.fileManager = fileManager;
        this.roleProgressTracker = roleProgressTracker;
        this.contentRenderer = contentRenderer;
        this.eventHandlers = eventHandlers;
    }

    async initialize() {
        try {
            // Load template
            await this.templateManager.load();

            // Initialize UI
            this.roleProgressTracker.initialize();
            this.eventHandlers.setup();

            // Auto-generate system ID
            if (!this.state.systemId) {
                const systemId = this.fileManager.generateSystemId();
                this.state.setSystemId(systemId);
                document.getElementById('system-id-input').value = systemId;
            }

            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Error initializing application:', error);
            const contentArea = document.getElementById('content-area');
            contentArea.innerHTML = '<div class="empty-state"><h2>Error</h2><p>Failed to load application. Please check the console for details.</p></div>';
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App(
        state,
        templateManager,
        fileManager,
        roleProgressTracker,
        contentRenderer,
        eventHandlers
    );
    app.initialize();
});
