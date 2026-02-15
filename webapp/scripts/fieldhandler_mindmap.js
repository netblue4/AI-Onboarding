/**
 * Creates an interactive mind map visualization that links requirements to their implementations
 * Allows clicking on nodes to expand and explore relationships between requirements, risks, tests, and field groups
 * 
 * @param {object} capturedData - Previously saved data to determine applicability and status
 * @param {function} sanitizeForId - Utility function to create safe HTML IDs
 * @param {function} fieldStoredValue - Function to retrieve stored field values
 * @returns {HTMLElement} The fully constructed mind map container element
 */

function createMindMap(incapturedData, sanitizeForId, fieldStoredValue) {
    const capturedData = incapturedData || {};
    
    const webappData = window.originalWebappData;
    if (!webappData) {
        const errDiv = document.createElement('div');
        errDiv.innerHTML = "<p style='color:red'>Error: Data not found. Please ensure window.originalWebappData is set.</p>";
        return errDiv;
    }

    const mindmapData = buildMindmapData(webappData, sanitizeForId, fieldStoredValue);
    const mindmapElement = renderMindmap(mindmapData, capturedData, sanitizeForId, fieldStoredValue);

    return mindmapElement;
}

/**
 * Builds the hierarchical data structure for the mind map
 * Structure: FieldGroups -> Requirements -> [Risks, Tests, FieldGroups]
 */
function buildMindmapData(data, sanitizeForId, fieldStoredValue) {
    const mindmapData = new Map();
    let allFields = [];

    // 1. Collect all fields recursively
    function collectFieldsRecursively(fields) {
        if (!fields || !Array.isArray(fields)) return;
        fields.forEach(field => {
            allFields.push(field);
            if (field.Fields && Array.isArray(field.Fields)) {
                collectFieldsRecursively(field.Fields);
            }
            if (field.controls && Array.isArray(field.controls)) {
                collectFieldsRecursively(field.controls);
            }
        });
    }

    // 2. Process all sections
    Object.values(data).flat().forEach(step => {
        if (step.Fields) collectFieldsRecursively(step.Fields);
    });

    // 3. Identify field groups containing requirements
    allFields.forEach(field => {
        if (field.jkType === 'fieldGroup' && field.controls && Array.isArray(field.controls)) {
            const containsRequirements = field.controls.some(c => c.jkType === 'requirement');

            if (containsRequirements) {
                if (!mindmapData.has(field.jkName)) {
                    mindmapData.set(field.jkName, {
                        groupField: field,
                        requirements: new Map()
                    });
                }

                const dataEntry = mindmapData.get(field.jkName);

                // Add applicable requirements
                field.controls.forEach(req => {
                    if (req.jkType === 'requirement') {
                        const controlKey = req.requirement_control_number;
                        
                        if (controlKey) {
                            const soa = fieldStoredValue(req, false);
                            
                            // Only include applicable requirements
                            if (soa === 'Applicable') {
                                dataEntry.requirements.set(controlKey, {
                                    requirement: req,
                                    implementations: new Set()
                                });
                            }
                        }
                    }
                });
            }
        }
    });

    // 4. Link implementations (risks, tests, fieldGroups) to requirements
    allFields.forEach(implNode => {
        if (implNode.requirement_control_number && implNode.jkType !== 'requirement') {
            const implControlParts = String(implNode.requirement_control_number).split(',').map(s => s.trim());

            mindmapData.forEach((data) => {
                const requirements = data.requirements;
                implControlParts.forEach(implKey => {
                    if (requirements.has(implKey)) {
                        requirements.get(implKey).implementations.add(implNode);
                    }
                });
            });
        }
    });

    // 5. Remove groups with no applicable requirements
    for (const [groupName, entry] of mindmapData.entries()) {
        if (entry.requirements.size === 0) {
            mindmapData.delete(groupName);
        }
    }

    return mindmapData;
}

/**
 * Renders the interactive mind map visualization
 */
function renderMindmap(mindmapData, capturedData, sanitizeForId, fieldStoredValue) {
    const container = document.createElement('div');
    container.className = 'mindmap-container';
    container.style.cssText = `
        padding: 20px;
        background: #f8fafc;
        min-height: 600px;
        position: relative;
    `;

    if (mindmapData.size === 0) {
        container.innerHTML = '<p style="text-align:center;color:#64748b;padding:40px;">No applicable requirements found for mind map visualization.</p>';
        return container;
    }

    // Create title
    const title = document.createElement('h2');
    title.textContent = 'AI Compliance Mind Map';
    title.style.cssText = 'text-align:center;color:#1e293b;margin-bottom:30px;';
    container.appendChild(title);

    // Create instruction text
    const instructions = document.createElement('p');
    instructions.textContent = 'Click on any node to expand and explore relationships';
    instructions.style.cssText = 'text-align:center;color:#64748b;margin-bottom:30px;font-style:italic;';
    container.appendChild(instructions);

    // Create central view area
    const viewArea = document.createElement('div');
    viewArea.className = 'mindmap-view';
    viewArea.style.cssText = `
        position: relative;
        min-height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        padding: 30px;
    `;

    // Render root level (Field Groups)
    renderRootLevel(viewArea, mindmapData, capturedData, sanitizeForId, fieldStoredValue);

    container.appendChild(viewArea);

    return container;
}

/**
 * Renders the root level showing all field groups
 */
function renderRootLevel(viewArea, mindmapData, capturedData, sanitizeForId, fieldStoredValue) {
    viewArea.innerHTML = '';

    const rootContainer = document.createElement('div');
    rootContainer.className = 'mindmap-root';
    rootContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        justify-content: center;
        align-items: flex-start;
    `;

    mindmapData.forEach((data, groupName) => {
        const groupNode = createGroupNode(groupName, data, viewArea, capturedData, sanitizeForId, fieldStoredValue);
        rootContainer.appendChild(groupNode);
    });

    viewArea.appendChild(rootContainer);
}

/**
 * Creates a visual node for a field group
 */
function createGroupNode(groupName, data, viewArea, capturedData, sanitizeForId, fieldStoredValue) {
    const node = document.createElement('div');
    node.className = 'mindmap-node group-node';
    
    const requirementCount = data.requirements.size;
    const stats = calculateGroupStats(data, capturedData, sanitizeForId, fieldStoredValue);
    
    node.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        min-width: 200px;
        max-width: 250px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        text-align: center;
    `;

    node.innerHTML = `
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 10px;">${escapeHtml(groupName)}</div>
        <div style="font-size: 14px; opacity: 0.9;">${requirementCount} Requirement${requirementCount !== 1 ? 's' : ''}</div>
        <div style="font-size: 12px; opacity: 0.8; margin-top: 8px;">
            ${stats.implementationCount} Implementation${stats.implementationCount !== 1 ? 's' : ''}
        </div>
    `;

    node.addEventListener('mouseenter', () => {
        node.style.transform = 'translateY(-4px) scale(1.05)';
        node.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
    });

    node.addEventListener('mouseleave', () => {
        node.style.transform = 'translateY(0) scale(1)';
        node.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    });

    node.addEventListener('click', () => {
        renderRequirementLevel(viewArea, groupName, data, capturedData, sanitizeForId, fieldStoredValue);
    });

    return node;
}

/**
 * Renders the requirement level when a group is clicked
 */
function renderRequirementLevel(viewArea, groupName, data, capturedData, sanitizeForId, fieldStoredValue) {
    viewArea.innerHTML = '';

    // Breadcrumb navigation
    const breadcrumb = createBreadcrumb([
        { label: 'All Groups', onClick: () => renderRootLevel(viewArea, new Map([[groupName, data]]), capturedData, sanitizeForId, fieldStoredValue) }
    ], groupName);
    viewArea.appendChild(breadcrumb);

    // Requirements container
    const reqContainer = document.createElement('div');
    reqContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        justify-content: center;
        margin-top: 30px;
    `;

    data.requirements.forEach((reqData, reqKey) => {
        const reqNode = createRequirementNode(reqKey, reqData, viewArea, groupName, data, capturedData, sanitizeForId, fieldStoredValue);
        reqContainer.appendChild(reqNode);
    });

    viewArea.appendChild(reqContainer);
}

/**
 * Creates a visual node for a requirement
 */
function createRequirementNode(reqKey, reqData, viewArea, groupName, groupData, capturedData, sanitizeForId, fieldStoredValue) {
    const node = document.createElement('div');
    node.className = 'mindmap-node requirement-node';
    
    const implCount = reqData.implementations.size;
    const req = reqData.requirement;
    
    node.style.cssText = `
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        min-width: 220px;
        max-width: 280px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;

    const reqText = req.jkText || req.jkName || 'Requirement';
    const displayText = reqText.length > 80 ? reqText.substring(0, 80) + '...' : reqText;

    node.innerHTML = `
        <div style="font-size: 12px; font-weight: 600; opacity: 0.9; margin-bottom: 8px;">${escapeHtml(reqKey)}</div>
        <div style="font-size: 14px; margin-bottom: 12px; line-height: 1.4;">${escapeHtml(displayText)}</div>
        <div style="font-size: 12px; opacity: 0.9; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 10px;">
            ${implCount} Linked Item${implCount !== 1 ? 's' : ''}
        </div>
    `;

    node.addEventListener('mouseenter', () => {
        node.style.transform = 'translateY(-4px) scale(1.05)';
        node.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
    });

    node.addEventListener('mouseleave', () => {
        node.style.transform = 'translateY(0) scale(1)';
        node.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    });

    node.addEventListener('click', () => {
        renderImplementationLevel(viewArea, reqKey, reqData, groupName, groupData, capturedData, sanitizeForId, fieldStoredValue);
    });

    return node;
}

/**
 * Renders the implementation level when a requirement is clicked
 */
function renderImplementationLevel(viewArea, reqKey, reqData, groupName, groupData, capturedData, sanitizeForId, fieldStoredValue) {
    viewArea.innerHTML = '';

    // Breadcrumb navigation
    const breadcrumb = createBreadcrumb([
        { label: 'All Groups', onClick: () => {
            const fullMap = new Map();
            fullMap.set(groupName, groupData);
            renderRootLevel(viewArea, fullMap, capturedData, sanitizeForId, fieldStoredValue);
        }},
        { label: groupName, onClick: () => renderRequirementLevel(viewArea, groupName, groupData, capturedData, sanitizeForId, fieldStoredValue) }
    ], reqKey);
    viewArea.appendChild(breadcrumb);

    // Show requirement details
    const reqDetails = createRequirementDetails(reqData.requirement);
    viewArea.appendChild(reqDetails);

    // Implementations container
    const implContainer = document.createElement('div');
    implContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        justify-content: center;
        margin-top: 30px;
    `;

    if (reqData.implementations.size === 0) {
        const noImpl = document.createElement('div');
        noImpl.style.cssText = 'text-align:center;color:#64748b;padding:20px;font-style:italic;';
        noImpl.textContent = 'No implementations linked to this requirement';
        implContainer.appendChild(noImpl);
    } else {
        reqData.implementations.forEach(impl => {
            const implNode = createImplementationNode(impl, viewArea, reqKey, reqData, groupName, groupData, capturedData, sanitizeForId, fieldStoredValue);
            implContainer.appendChild(implNode);
        });
    }

    viewArea.appendChild(implContainer);
}

/**
 * Creates a details card showing requirement information
 */
function createRequirementDetails(req) {
    const details = document.createElement('div');
    details.style.cssText = `
        background: #f1f5f9;
        padding: 20px;
        border-radius: 8px;
        margin-top: 20px;
        border-left: 4px solid #f5576c;
    `;

    details.innerHTML = `
        <div style="font-weight: 600; color: #1e293b; margin-bottom: 10px;">Requirement Details</div>
        <div style="color: #475569; font-size: 14px; line-height: 1.6;">
            <strong>ID:</strong> ${escapeHtml(req.requirement_control_number || 'N/A')}<br>
            <strong>Name:</strong> ${escapeHtml(req.jkName || 'N/A')}<br>
            <strong>Description:</strong> ${escapeHtml(req.jkText || 'N/A')}
            ${req.jkObjective ? `<br><strong>Objective:</strong> ${escapeHtml(req.jkObjective)}` : ''}
        </div>
    `;

    return details;
}

/**
 * Creates a visual node for an implementation (risk, test, or field)
 */
function createImplementationNode(impl, viewArea, reqKey, reqData, groupName, groupData, capturedData, sanitizeForId, fieldStoredValue) {
    const node = document.createElement('div');
    node.className = 'mindmap-node implementation-node';
    
    const typeInfo = getImplementationTypeInfo(impl.jkType);
    const hasControls = impl.controls && Array.isArray(impl.controls) && impl.controls.length > 0;
    
    node.style.cssText = `
        background: ${typeInfo.gradient};
        color: white;
        padding: 20px;
        border-radius: 12px;
        min-width: 200px;
        max-width: 250px;
        cursor: ${hasControls ? 'pointer' : 'default'};
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;

    const implText = impl.jkText || impl.jkName || 'Implementation';
    const displayText = implText.length > 60 ? implText.substring(0, 60) + '...' : implText;

    node.innerHTML = `
        <div style="font-size: 11px; font-weight: 600; opacity: 0.9; margin-bottom: 5px; text-transform: uppercase;">${typeInfo.label}</div>
        <div style="font-size: 13px; font-weight: 500; margin-bottom: 8px;">${escapeHtml(impl.control_number || '')}</div>
        <div style="font-size: 14px; line-height: 1.4;">${escapeHtml(displayText)}</div>
        ${hasControls ? `<div style="font-size: 11px; margin-top: 10px; opacity: 0.9; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 8px;">${impl.controls.length} Control${impl.controls.length !== 1 ? 's' : ''}</div>` : ''}
    `;

    if (hasControls) {
        node.addEventListener('mouseenter', () => {
            node.style.transform = 'translateY(-4px) scale(1.05)';
            node.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
        });

        node.addEventListener('mouseleave', () => {
            node.style.transform = 'translateY(0) scale(1)';
            node.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        });

        node.addEventListener('click', () => {
            renderControlLevel(viewArea, impl, reqKey, reqData, groupName, groupData, capturedData, sanitizeForId, fieldStoredValue);
        });
    }

    return node;
}

/**
 * Renders the control level when an implementation with controls is clicked
 */
function renderControlLevel(viewArea, impl, reqKey, reqData, groupName, groupData, capturedData, sanitizeForId, fieldStoredValue) {
    viewArea.innerHTML = '';

    // Breadcrumb navigation
    const breadcrumb = createBreadcrumb([
        { label: 'All Groups', onClick: () => {
            const fullMap = new Map();
            fullMap.set(groupName, groupData);
            renderRootLevel(viewArea, fullMap, capturedData, sanitizeForId, fieldStoredValue);
        }},
        { label: groupName, onClick: () => renderRequirementLevel(viewArea, groupName, groupData, capturedData, sanitizeForId, fieldStoredValue) },
        { label: reqKey, onClick: () => renderImplementationLevel(viewArea, reqKey, reqData, groupName, groupData, capturedData, sanitizeForId, fieldStoredValue) }
    ], impl.control_number || impl.jkName || 'Implementation');
    viewArea.appendChild(breadcrumb);

    // Show implementation details
    const implDetails = createImplementationDetails(impl, capturedData, sanitizeForId, fieldStoredValue);
    viewArea.appendChild(implDetails);

    // Controls container
    const ctrlContainer = document.createElement('div');
    ctrlContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin-top: 30px;
    `;

    impl.controls.forEach(control => {
        const ctrlCard = createControlCard(control, capturedData, sanitizeForId, fieldStoredValue);
        ctrlContainer.appendChild(ctrlCard);
    });

    viewArea.appendChild(ctrlContainer);
}

/**
 * Creates a details card showing implementation information
 */
function createImplementationDetails(impl, capturedData, sanitizeForId, fieldStoredValue) {
    const details = document.createElement('div');
    const typeInfo = getImplementationTypeInfo(impl.jkType);
    
    details.style.cssText = `
        background: #f1f5f9;
        padding: 20px;
        border-radius: 8px;
        margin-top: 20px;
        border-left: 4px solid ${typeInfo.color};
    `;

    const status = fieldStoredValue(impl, true) || 'Not Set';
    const evidence = fieldStoredValue(impl, false) || 'No evidence provided';

    details.innerHTML = `
        <div style="font-weight: 600; color: #1e293b; margin-bottom: 10px;">${typeInfo.label} Details</div>
        <div style="color: #475569; font-size: 14px; line-height: 1.6;">
            <strong>ID:</strong> ${escapeHtml(impl.control_number || 'N/A')}<br>
            <strong>Description:</strong> ${escapeHtml(impl.jkText || impl.jkName || 'N/A')}<br>
            ${impl.jkObjective ? `<strong>Objective:</strong> ${escapeHtml(impl.jkObjective)}<br>` : ''}
            <strong>Implementation Status:</strong> ${escapeHtml(status)}<br>
            <strong>Evidence:</strong> ${escapeHtml(evidence)}
        </div>
    `;

    return details;
}

/**
 * Creates a card displaying control information
 */
function createControlCard(control, capturedData, sanitizeForId, fieldStoredValue) {
    const card = document.createElement('div');
    card.style.cssText = `
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    `;

    const status = fieldStoredValue(control, true) || 'Not Set';
    const evidence = fieldStoredValue(control, false) || 'No evidence provided';

    card.innerHTML = `
        <div style="font-weight: 600; color: #1e293b; margin-bottom: 10px; font-size: 14px;">
            ${escapeHtml(control.control_number || 'Control')}
        </div>
        <div style="color: #475569; font-size: 13px; line-height: 1.5; margin-bottom: 12px;">
            ${escapeHtml(control.jkText || 'No description')}
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 12px;">
            <div style="margin-bottom: 6px;">
                <span style="font-weight: 600; color: #64748b;">Status:</span>
                <span style="color: #1e293b;"> ${escapeHtml(status)}</span>
            </div>
            <div>
                <span style="font-weight: 600; color: #64748b;">Evidence:</span>
                <span style="color: #1e293b;"> ${escapeHtml(evidence.length > 100 ? evidence.substring(0, 100) + '...' : evidence)}</span>
            </div>
        </div>
    `;

    return card;
}

/**
 * Creates a breadcrumb navigation component
 */
function createBreadcrumb(pathItems, currentItem) {
    const breadcrumb = document.createElement('div');
    breadcrumb.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 0;
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 20px;
        font-size: 14px;
    `;

    pathItems.forEach((item, index) => {
        const link = document.createElement('span');
        link.textContent = item.label;
        link.style.cssText = `
            color: #3b82f6;
            cursor: pointer;
            text-decoration: none;
        `;
        link.addEventListener('mouseenter', () => {
            link.style.textDecoration = 'underline';
        });
        link.addEventListener('mouseleave', () => {
            link.style.textDecoration = 'none';
        });
        link.addEventListener('click', item.onClick);
        breadcrumb.appendChild(link);

        if (index < pathItems.length - 1 || currentItem) {
            const separator = document.createElement('span');
            separator.textContent = '›';
            separator.style.color = '#94a3b8';
            breadcrumb.appendChild(separator);
        }
    });

    if (currentItem) {
        const current = document.createElement('span');
        current.textContent = currentItem.length > 40 ? currentItem.substring(0, 40) + '...' : currentItem;
        current.style.color = '#64748b';
        breadcrumb.appendChild(current);
    }

    return breadcrumb;
}

/**
 * Gets styling information for different implementation types
 */
function getImplementationTypeInfo(jkType) {
    const typeMap = {
        'risk': {
            label: 'Risk',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: '#fa709a'
        },
        'risk_control': {
            label: 'Risk Control',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: '#fa709a'
        },
        'plan': {
            label: 'Test Plan',
            gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
            color: '#30cfd0'
        },
        'test_control': {
            label: 'Test Control',
            gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
            color: '#30cfd0'
        },
        'fieldGroup': {
            label: 'Field Group',
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            color: '#a8edea'
        },
        'MultiSelect': {
            label: 'Multi-Select',
            gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            color: '#ffecd2'
        }
    };

    return typeMap[jkType] || {
        label: 'Field',
        gradient: 'linear-gradient(135deg, #e0e7ff 0%, #cffafe 100%)',
        color: '#e0e7ff'
    };
}

/**
 * Calculates statistics for a field group
 */
function calculateGroupStats(data, capturedData, sanitizeForId, fieldStoredValue) {
    let implementationCount = 0;

    data.requirements.forEach((reqData) => {
        implementationCount += reqData.implementations.size;
    });

    return {
        requirementCount: data.requirements.size,
        implementationCount: implementationCount
    };
}

/**
 * Utility function to escape HTML
 */
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe || '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
