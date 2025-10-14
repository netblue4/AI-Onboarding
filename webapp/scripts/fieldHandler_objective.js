/**
 * Creates a collapsible HTML element to display a single objective.
 * The objective text is hidden by default and can be revealed by clicking the header.
 *
 * @param {object} objective - An object containing the objective details. 
 * It is expected to have a property `Objective` with the text to display.
 * @returns {HTMLElement} The fully constructed div element for the collapsible objective.
 */
function createObjective(objectives) {
    // --- 1. Build the Collapsible Structure ---

    // Main container for the entire field
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';

    // Header for the collapsible section (the part that is always visible)
    const headerDiv = document.createElement('div');
    headerDiv.className = 'collapsible-header';

    // Add the expand/collapse icon
    const icon = document.createElement('span');
    icon.className = 'collapse-icon';
    icon.textContent = '▶'; // Start in the collapsed state
    headerDiv.appendChild(icon);

    // Add a title to the header
    const titleLabel = document.createElement('label');
    titleLabel.textContent = "Objective"; // This will be the clickable title
    titleLabel.className = 'label-bold';
    headerDiv.appendChild(titleLabel);

    fieldDiv.appendChild(headerDiv);

    // Create the collapsible container for the detailed information
    const contentDiv = document.createElement('div');
    contentDiv.className = 'collapsible-content collapsed';



    if (objectives && Array.isArray(objectives)) {
        objectives.forEach(objectiveItem => {
    		// --- 2. Add the Objective Content ---
    		// This is the original content from your function, now placed inside the collapsible area.
    		const span = document.createElement('span');
    		span.className = 'auto-generated-label';
    		span.textContent = Objective; // The full objective text
    		contentDiv.appendChild(span);
        });
    }


    fieldDiv.appendChild(contentDiv);

    // --- 3. Add the Click Listener ---
    // Add the click listener to the header to toggle the content's visibility
    headerDiv.addEventListener('click', () => {
        const isCollapsed = contentDiv.classList.toggle('collapsed');
        // Change the icon to indicate the current state (expanded or collapsed)
        icon.textContent = isCollapsed ? '▶' : '▼';
    });

    return fieldDiv;
}