// ============================================
// scripts/stateManager.js
// ============================================
/**
 * Central state management for the application
 * Maintains all application state with getter/setter methods
 */
class StateManager {
    constructor() {
        this.templateData = null;           // The JSON template structure
        this.capturedData = {};             // User-entered form data
        this.currentRole = "";              // Currently selected role
        this.currentDimension = "";         // Currently selected trust dimension filter
        this.systemId = "";                 // Unique system identifier
        this.loadedVersion = null;          // Version of loaded file
        this.newFieldsHighlighted = false;  // Whether to highlight new fields
    }

    /**
     * Update template data
     * @param {Object} data - The template JSON data
     */
    setTemplateData(data) {
        this.templateData = data;
    }

    /**
     * Update captured user data
     * @param {Object} data - The captured form values
     */
    setCapturedData(data) {
        this.capturedData = data;
    }

    /**
     * Update current role selection
     * @param {string} role - The selected role
     */
    setCurrentRole(role) {
        this.currentRole = role;
    }

    /**
     * Update current dimension filter
     * @param {string} dimension - The selected trust dimension
     */
    setCurrentDimension(dimension) {
        this.currentDimension = dimension;
    }

    /**
     * Update system ID
     * @param {string} id - The system identifier
     */
    setSystemId(id) {
        this.systemId = id;
    }

    /**
     * Update loaded template version
     * @param {string} version - The version string
     */
    setLoadedVersion(version) {
        this.loadedVersion = version;
    }

    /**
     * Toggle field highlighting state
     * @param {boolean} value - Whether to highlight new fields
     */
    setNewFieldsHighlighted(value) {
        this.newFieldsHighlighted = value;
    }

    /**
     * Get complete state snapshot
     * @returns {Object} Current state object
     */
    getState() {
        return {
            templateData: this.templateData,
            capturedData: this.capturedData,
            currentRole: this.currentRole,
            currentDimension: this.currentDimension,
            systemId: this.systemId,
            loadedVersion: this.loadedVersion,
            newFieldsHighlighted: this.newFieldsHighlighted
        };
    }

    /**
     * Reset all state to initial values
     */
    reset() {
        this.templateData = null;
        this.capturedData = {};
        this.currentRole = "";
        this.currentDimension = "";
        this.systemId = "";
        this.loadedVersion = null;
        this.newFieldsHighlighted = false;
    }
}

// Create global state instance
const state = new StateManager();

