// ============================================
// scripts/stateManager.js (FIXED - Readonly Issue)
// ============================================
/**
 * Central state management for the application
 * Maintains all application state with getter/setter methods
 */
class StateManager {
    constructor() {
        // Initialize as plain properties (not getters/setters)
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
        console.log('✓ Template data set');
    }

    /**
     * Update captured user data
     * @param {Object} data - The captured form values
     */
    setCapturedData(data) {
        this.capturedData = data;
        console.log('✓ Captured data set');
    }

    /**
     * Update current role selection
     * @param {string} role - The selected role
     */
    setCurrentRole(role) {
        this.currentRole = role;
        console.log('✓ Current role set to:', role);
    }

    /**
     * Update current dimension filter
     * @param {string} dimension - The selected trust dimension
     */
    setCurrentDimension(dimension) {
        this.currentDimension = dimension;
        console.log('✓ Current dimension set to:', dimension);
    }

    /**
     * Update system ID
     * @param {string} id - The system identifier
     */
    setSystemId(id) {
        this.systemId = id;
        console.log('✓ System ID set to:', id);
    }

    /**
     * Update loaded template version
     * @param {string} version - The version string
     */
    setLoadedVersion(version) {
        this.loadedVersion = version;
        console.log('✓ Loaded version set to:', version);
    }

    /**
     * Toggle field highlighting state
     * @param {boolean} value - Whether to highlight new fields
     */
    setNewFieldsHighlighted(value) {
        this.newFieldsHighlighted = value;
        console.log('✓ New fields highlighted set to:', value);
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
        console.log('✓ State reset to initial values');
    }

    /**
     * Get a specific state property
     * @param {string} key - The property key
     * @returns {*} The property value
     */
    get(key) {
        return this[key] || null;
    }

    /**
     * Set a specific state property
     * @param {string} key - The property key
     * @param {*} value - The value to set
     */
    set(key, value) {
        this[key] = value;
        console.log(`✓ ${key} set to:`, value);
    }
}

// Create global state instance
const state = new StateManager();
console.log('✓ StateManager initialized');