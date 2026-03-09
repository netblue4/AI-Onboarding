/**
 * Shared utility functions used across multiple field handlers.
 */

/**
 * Builds a nested Map of mindmap data from the raw webapp JSON.
 * Groups requirements by Article step → group → requirement, then performs
 * a global linking pass to attach implementation nodes to their requirements.
 *
 * @param {Object} data - The raw template data (window.originalWebappData)
 * @param {Function} sanitizeForId - Utility to sanitize strings for HTML IDs
 * @param {Function} fieldStoredValue - Utility to retrieve a stored field value
 * @returns {Map} Nested Map: stepName → groupName → { requirements: Map }
 */
function buildMindmapData(data, sanitizeForId, fieldStoredValue) {
    const mindmapData = new Map();
    const globalRequirementMap = new Map(); // Index for linking implementations
    const allImplementationNodes = [];

    Object.entries(data).forEach(([phaseName, steps]) => {
        steps.forEach(step => {
            const stepName = step.StepName || "General Procedure";
            const isArticleStep = stepName.trim().startsWith('Article');

            // Initialize hierarchy structure ONLY if it's an Article step
            if (isArticleStep && !mindmapData.has(stepName)) {
                mindmapData.set(stepName, new Map());
            }

            // Recursively collect fields from EVERY step
            let stepFields = [];
            function collect(fields) {
                if (!fields || !Array.isArray(fields)) return;
                fields.forEach(f => {
                    stepFields.push(f);
                    if (f.Fields) collect(f.Fields);
                    if (f.controls) collect(f.controls);
                });
            }
            collect(step.Fields);

            stepFields.forEach(field => {
                // Process Requirements ONLY if in an Article step
                if (isArticleStep) {
                    const stepGroups = mindmapData.get(stepName);
                    if (field.jkType === 'fieldGroup' && field.controls) {
                        const containsReqs = field.controls.some(c => c.jkType === 'requirement');
                        if (containsReqs) {
                            if (!stepGroups.has(field.jkName)) {
                                stepGroups.set(field.jkName, { requirements: new Map() });
                            }
                            const groupEntry = stepGroups.get(field.jkName);

                            field.controls.forEach(req => {
                                if (req.jkType === 'requirement') {
                                    const controlKey = req.requirement_control_number;
                                    if (controlKey) {
                                        const reqEntry = { requirement: req, implementations: new Set() };
                                        groupEntry.requirements.set(controlKey, reqEntry);
                                        globalRequirementMap.set(controlKey, reqEntry);
                                    }
                                }
                            });
                        }
                    }
                }

                // Collect potential implementations from EVERY step
                if (field.requirement_control_number && field.jkType !== 'requirement') {
                    allImplementationNodes.push(field);
                }
            });
        });
    });

    // Global linking pass: attach implementations to their indexed requirements
    allImplementationNodes.forEach(implNode => {
        const implKeys = String(implNode.requirement_control_number).split(',').map(s => s.trim());
        implKeys.forEach(key => {
            if (globalRequirementMap.has(key)) {
                globalRequirementMap.get(key).implementations.add(implNode);
            }
        });
    });

    return mindmapData;
}
