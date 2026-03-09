/**
 * Creates a procedural note or decision point paragraph element.
 * @returns {HTMLElement} A paragraph element with a note message
 */
function createNoteField() {
    const note = document.createElement('p');
    note.textContent = "This is a procedural note or a decision point. Click 'Next' to continue.";
    return note;
}