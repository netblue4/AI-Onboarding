// ============================================
// scripts/config.js
// ============================================
/**
 * Global configuration constants for the AI Onboarding application
 */
const CONFIG = {
    // Template management
    CURRENT_TEMPLATE_VERSION: "1.0",
    TEMPLATE_FILE: 'ai_onboarding_procedure_data.json',
    
    // Role definitions
    ROLES: [
        'Compliance',
        'Compliance Map'
        'Requester',
        'Data Engineer',
        'Engineer',
        'Tester',
        'Deployment',
        'Operation',
        'Approver',
    ],
    
    // UI messages
    MESSAGES: {
        PROGRESS_SAVED: 'Progress saved! File downloaded: ',
        REPORT_DOWNLOADED: 'Compliance report downloaded!',
        FILE_LOADED: 'Data file loaded successfully!',
        SYSTEM_ID_REQUIRED: 'Please set a System ID first',
        FILE_LOAD_ERROR: 'Error loading file: ',
        TEMPLATE_LOAD_ERROR: 'Failed to load template data.'
    }
};
