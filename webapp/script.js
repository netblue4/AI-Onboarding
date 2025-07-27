document.addEventListener('DOMContentLoaded', () => {
    const formContainer = document.getElementById('form-container');
    const nextBtn = document.getElementById('next-btn');
    const downloadBtn = document.getElementById('download-btn');
    const mainTitle = document.getElementById('main-title');

    let webappData = {};
    let procedureSteps = [];
    let currentStepIndex = 0;
    const capturedData = {};

    async function initializeApp() {
        try {
            const response = await fetch('webapp_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            webappData = await response.json();
            procedureSteps = Object.keys(webappData);
            if (procedureSteps.length > 0) {
                renderCurrentStep();
            } else {
                 mainTitle.textContent = "Error";
                 formContainer.innerHTML = '<p>No procedure steps found in the data file.</p>';
            }
        } catch (error) {
            console.error('Failed to load or parse webapp_data.json:', error);
            alert('CRITICAL ERROR: Could not load webapp_data.json. Make sure the file exists and you are running this from a web server (like VS Code Live Server).');
            mainTitle.textContent = "Loading Error";
            formContainer.innerHTML = `<p>Could not load application data. See the browser's developer console for more details.</p>`;
        }
    }

    function sanitizeForId(text) {
        if (typeof text !== 'string') return '';
        return text.replace(/[^a-zA-Z0-9_]/g, '_');
    }

    function renderCurrentStep() {
        const stepKey = procedureSteps[currentStepIndex];
        const stepData = webappData[stepKey];
        
        if (!stepData) {
            mainTitle.textContent = "Error";
            formContainer.innerHTML = "<p>Could not find step data. Please check the data source.</p>";
            return;
        }

        mainTitle.textContent = stepData.WebFormTitle || "Procedure Step";
        formContainer.innerHTML = ''; 

        const formStepDiv = document.createElement('div');
        formStepDiv.className = 'form-step';

        if (!stepData.Fields || stepData.Fields.length === 0) {
             const note = document.createElement('p');
             note.textContent = "This is a procedural note or a decision point. Click 'Next' to continue.";
             formStepDiv.appendChild(note);
        } else {
            stepData.Fields.forEach(field => {
                if (!field) return;
                const fieldDiv = document.createElement('div');
                fieldDiv.className = 'form-field';
                const sanitizedId = sanitizeForId(field.FieldName);

                if (field.FieldType === 'Auto generated number') {
                    const label = document.createElement('label');
                    label.textContent = field.FieldLabel + ': ';
                    const span = document.createElement('span');
                    span.className = 'auto-generated-label';
                    const uniqueId = 'AutoGen_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                    span.textContent = uniqueId;
                    fieldDiv.appendChild(label);
                    fieldDiv.appendChild(span);
                    capturedData[field.FieldName] = uniqueId;
                } else if (field.FieldType === 'TextBox') {
                    const label = document.createElement('label');
                    label.setAttribute('for', sanitizedId);
                    label.textContent = field.FieldLabel;
                    const input = document.createElement('textarea');
                    input.id = sanitizedId;
                    input.name = sanitizedId;
                    input.rows = 3;
                    fieldDiv.appendChild(label);
                    fieldDiv.appendChild(input);
                } else if (field.FieldType && field.FieldType.startsWith('Dropdown box with values')) {
                    const label = document.createElement('label');
                    label.setAttribute('for', sanitizedId);
                    label.textContent = field.FieldLabel.replace(/\n/g, '<br>');
                    const select = document.createElement('select');
                    select.id = sanitizedId;
                    select.name = sanitizedId;
                    
                    const optionsString = field.FieldType.split(':')[1]?.trim() || '';
                    const options = optionsString.split('/');
                    
                    options.forEach(optionText => {
                        const option = document.createElement('option');
                        option.value = optionText.trim();
                        option.textContent = optionText.trim();
                        select.appendChild(option);
                    });
                    
                    fieldDiv.appendChild(label);
                    fieldDiv.appendChild(select);
                }
                formStepDiv.appendChild(fieldDiv);
            });
        }
        formContainer.appendChild(formStepDiv);
    }

    nextBtn.addEventListener('click', () => {
        const currentStepKey = procedureSteps[currentStepIndex];
        const stepData = webappData[currentStepKey];

        if (stepData && stepData.Fields) {
            stepData.Fields.forEach(field => {
                if (field && field.FieldType !== 'Auto generated number') {
                    const sanitizedId = sanitizeForId(field.FieldName);
                    const inputElement = document.getElementById(sanitizedId);
                    if (inputElement) {
                        capturedData[field.FieldName] = inputElement.value;
                    }
                }
            });
        }

        currentStepIndex++;
        if (currentStepIndex < procedureSteps.length) {
            renderCurrentStep();
        } else {
            formContainer.innerHTML = '<h2>Onboarding procedure completed!</h2><p>You can now download the generated JSON file containing all your input.</p>';
            mainTitle.textContent = "Finished";
            nextBtn.style.display = 'none';
            downloadBtn.style.display = 'block';
        }
    });

    downloadBtn.addEventListener('click', () => {
        const jsonData = JSON.stringify(capturedData, null, 4);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = 'onboarding_documentation.json';
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    initializeApp();
});
