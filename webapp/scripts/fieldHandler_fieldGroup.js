/**
 * Handler for FieldType: "fieldGroup"
 * Creates a visually grouped box for related fields with a title.
 * It iterates through the nested 'controls' array and calls the appropriate
 * existing field handler for each control's FieldType.
 *
 * @param {object} field - The field object with FieldType: "fieldGroup".
 * @param {object} capturedData - The object where collected data is stored (passed to nested handlers).
 * @param {function} sanitizeForId - The function used to sanitize field names for HTML IDs.
 * @returns {HTMLElement} The complete field group container element.
 */
function createFieldGroup(field, capturedData, sanitizeForId) {
    // 1. Create the main container for the group box
    const groupContainer = document.createElement('div');
    groupContainer.className = 'field-group-container'; // Class for styling the box

    // 2. Create and set the Group Title (Legend/Header)
    if (field.GroupTitle) {
        const groupTitle = document.createElement('h3');
        groupTitle.className = 'field-group-title';
        groupTitle.textContent = field.GroupTitle;
        groupContainer.appendChild(groupTitle);
    }
    
    // Create a container for the actual fields to better manage layout/padding inside the group box
    const fieldsWrapper = document.createElement('div');
    fieldsWrapper.className = 'field-group-wrapper'; 
    groupContainer.appendChild(fieldsWrapper);

    // 3. Iterate through the nested 'controls' array
    if (field.Fields && Array.isArray(field.Fields)) {
        field.Fields.forEach(nestedField => {
            if (!nestedField.FieldType) {
                // If a nested field uses 'Control' instead of 'FieldType' for control flow, 
                // we'll assume a standard TextBox if no type is explicitly defined.
                nestedField.FieldType = nestedField.FieldType || 'TextBox'; 
            }
            
            // Note: In your JSON example for "fieldGroup", the nested items use "Control" and "FieldName" 
            // but are missing "FieldType". We must infer or assume a default type 
            // for the inner fields to be rendered by the factory. 
            // Assuming default to 'TextBox' for maximum compatibility if missing.
            const fieldType = nestedField.FieldType || nestedField.Control ? nestedField.FieldType : 'TextBox';

            // Retrieve the appropriate handler using the global 'getFieldHandler' (from fieldFactory.js)
            const handler = getFieldHandler(fieldType);
            
            if (handler) {
                // Call the existing handler for the nested field
                const fieldElement = handler(nestedField, capturedData, sanitizeForId);
                fieldsWrapper.appendChild(fieldElement);
            } else {
                console.warn(`[FieldGroup]: No handler found for nested FieldType: ${fieldType}`);
                // Optional: add a placeholder for clarity
                const warning = document.createElement('p');
                warning.textContent = `[Warning: No handler for ${fieldType} for field ${nestedField.FieldName}]`;
                fieldsWrapper.appendChild(warning);
            }
        });
    } else {
         const warning = document.createElement('p');
         warning.textContent = `[Error: fieldGroup is missing the 'fields' array.]`;
         fieldsWrapper.appendChild(warning);
    }

    return groupContainer;
}

// Register the new handler with the field factory
// You need a way to integrate this function into your main fieldFactory.js
// For your setup, you would add a reference to this file in your HTML:
// <script src="scripts/fieldHandler_fieldGroup.js"></script>
// and ensure the fieldFactory.js knows to call createFieldGroup when it sees 'fieldGroup'.

// Assuming you have a way to register it in your fieldFactory.js or a global scope:
window.createFieldGroup = createFieldGroup;
