// ============================================
// scripts/systemWizard.js
// ============================================
/**
 * System Assessment Wizard
 * Presents a predefined question set to help compliance officers identify
 * the minimum viable set of applicable controls for a new AI system.
 * Calls Claude API directly from the browser to analyze answers.
 */
class SystemWizard {
    constructor(stateManager) {
        this.state = stateManager;
        this.apiKey = localStorage.getItem('anthropic_api_key') || '';
    }

    render() {
        const wrapper = document.createElement('div');
        wrapper.id = 'system-wizard-wrapper';
        wrapper.style.cssText = 'padding: 28px; max-width: 820px; margin: 0 auto;';

        const header = document.createElement('div');
        header.style.cssText = 'margin-bottom: 28px;';
        const title = document.createElement('h2');
        title.textContent = 'System Assessment Wizard';
        title.style.cssText = 'color: #b8963e; margin: 0 0 10px 0; font-size: 22px;';
        const subtitle = document.createElement('p');
        subtitle.textContent = 'Answer the questions below to automatically identify the minimum viable set of applicable compliance controls for your AI system. Once submitted, suggested controls will be pre-selected in the Compliance view for your review.';
        subtitle.style.cssText = 'color: #a0a0a0; margin: 0; font-size: 14px; line-height: 1.6;';
        header.appendChild(title);
        header.appendChild(subtitle);
        wrapper.appendChild(header);

        wrapper.appendChild(this._buildApiKeySection());

        const questionsDiv = document.createElement('div');
        questionsDiv.id = 'wizard-questions';
        this._getQuestions().forEach((q, idx) => {
            questionsDiv.appendChild(this._buildQuestion(q, idx));
        });
        wrapper.appendChild(questionsDiv);

        const submitBtn = document.createElement('button');
        submitBtn.className = 'btn-primary';
        submitBtn.textContent = 'Analyze & Apply Controls';
        submitBtn.style.cssText = 'margin-top: 28px; padding: 12px 28px; font-size: 15px; cursor: pointer;';
        submitBtn.onclick = () => this.handleSubmit(wrapper);
        wrapper.appendChild(submitBtn);

        const statusDiv = document.createElement('div');
        statusDiv.id = 'wizard-status';
        statusDiv.style.display = 'none';
        wrapper.appendChild(statusDiv);

        return wrapper;
    }

    _buildApiKeySection() {
        const div = document.createElement('div');
        div.style.cssText = 'background: #1e1e1e; border: 1px solid #3d3d3d; border-radius: 8px; padding: 18px; margin-bottom: 24px;';

        const label = document.createElement('label');
        label.textContent = 'Anthropic API Key:';
        label.style.cssText = 'display: block; color: #a0a0a0; margin-bottom: 8px; font-size: 13px; font-weight: 500;';

        const input = document.createElement('input');
        input.type = 'password';
        input.id = 'wizard-api-key';
        input.value = this.apiKey;
        input.placeholder = 'sk-ant-api03-...';
        input.style.cssText = 'width: 100%; padding: 9px 12px; background: #252525; border: 1px solid #444; border-radius: 5px; color: #e0d9ce; font-size: 13px; box-sizing: border-box;';
        input.oninput = (e) => {
            this.apiKey = e.target.value.trim();
            localStorage.setItem('anthropic_api_key', this.apiKey);
        };

        const hint = document.createElement('p');
        hint.textContent = 'Your API key is stored in your browser\'s local storage and is only sent directly to the Anthropic API.';
        hint.style.cssText = 'color: #555; font-size: 11px; margin: 6px 0 0 0;';

        div.appendChild(label);
        div.appendChild(input);
        div.appendChild(hint);
        return div;
    }

    _getQuestions() {
        return [
            {
                id: 'system_type',
                question: 'What best describes this AI system?',
                options: [
                    'Generative AI — creates text, code, or images (e.g. chatbot, content generator)',
                    'Predictive / Classification — makes predictions or categorizes data (e.g. fraud detection, sentiment analysis)',
                    'Decision Support — recommends actions for a human to review (e.g. risk scoring, recommendations engine)',
                    'Process Automation — automates tasks without human input (e.g. AI-driven workflow, auto-routing)',
                    'Other / Not sure'
                ]
            },
            {
                id: 'user_interaction',
                question: 'Will end users interact directly with this AI system\'s outputs?',
                options: [
                    'Yes — users see and act on AI outputs directly',
                    'No — outputs are consumed internally or by automated downstream systems'
                ]
            },
            {
                id: 'decision_impact',
                question: 'Does this system make or heavily influence decisions that affect individuals (employees, customers, citizens)?',
                options: [
                    'Yes — high-stakes decisions (employment, credit, healthcare, legal, benefits)',
                    'Yes — moderate-impact decisions (marketing, recommendations, prioritization)',
                    'No — decisions do not directly affect individuals'
                ]
            },
            {
                id: 'data_privacy',
                question: 'Does this system process personal or sensitive data?',
                options: [
                    'Yes — personal data (names, emails, user behaviour, location)',
                    'Yes — sensitive data (health, financial, biometric, or children\'s data)',
                    'No — only anonymised or non-personal data'
                ]
            },
            {
                id: 'human_oversight',
                question: 'Is there a mandatory human review step before AI outputs are acted upon?',
                options: [
                    'Yes — every AI output is reviewed by a human before any action is taken',
                    'Sometimes — only for high-risk or edge cases flagged by the system',
                    'No — fully automated; no human review occurs'
                ]
            },
            {
                id: 'deployment_context',
                question: 'What is the primary deployment context?',
                options: [
                    'Internal — used only by employees inside the organisation',
                    'Customer-facing — deployed to external users, customers, or the public',
                    'Regulated industry — healthcare, financial services, legal, or HR'
                ]
            },
            {
                id: 'error_severity',
                question: 'What is the potential impact of an error or incorrect output from this system?',
                options: [
                    'Low — minor inconvenience, easily identified and corrected',
                    'Medium — significant but recoverable business or user impact',
                    'High — safety, legal, regulatory, or financial consequences'
                ]
            }
        ];
    }

    _buildQuestion(q, idx) {
        const div = document.createElement('div');
        div.style.cssText = 'background: #1e1e1e; border: 1px solid #3d3d3d; border-radius: 8px; padding: 18px; margin-bottom: 14px;';

        const questionLabel = document.createElement('p');
        questionLabel.textContent = `${idx + 1}. ${q.question}`;
        questionLabel.style.cssText = 'font-weight: 600; color: #e0d9ce; margin: 0 0 14px 0; font-size: 14px;';
        div.appendChild(questionLabel);

        q.options.forEach(option => {
            const label = document.createElement('label');
            label.style.cssText = 'display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; cursor: pointer; color: #b0b0b0; font-size: 13px; line-height: 1.5;';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `wizard_${q.id}`;
            radio.value = option;
            radio.style.cssText = 'margin-top: 2px; flex-shrink: 0; accent-color: #b8963e; width: 15px; height: 15px; cursor: pointer;';

            label.addEventListener('mouseenter', () => { label.style.color = '#e0d9ce'; });
            label.addEventListener('mouseleave', () => { label.style.color = '#b0b0b0'; });

            const span = document.createElement('span');
            span.textContent = option;

            label.appendChild(radio);
            label.appendChild(span);
            div.appendChild(label);
        });

        return div;
    }

    _getWizardAnswers() {
        const answers = {};
        this._getQuestions().forEach(q => {
            const selected = document.querySelector(`input[name="wizard_${q.id}"]:checked`);
            answers[q.question] = selected ? selected.value : null;
        });
        return answers;
    }

    _extractComplianceControls() {
        const controls = [];
        if (!this.state.templateData) return controls;

        const complianceSection = this.state.templateData['1. Compliance Requirements'];
        if (!complianceSection) return controls;

        complianceSection.forEach(step => {
            if (!step.Fields) return;
            step.Fields.forEach(field => {
                if (field.controls && Array.isArray(field.controls)) {
                    field.controls.forEach(control => {
                        if (control.jkType === 'requirement' && control.requirement_control_number) {
                            controls.push({
                                requirement_control_number: control.requirement_control_number,
                                jkName: control.jkName,
                                jkText: control.jkText,
                                group: field.jkName,
                                step: step.StepName
                            });
                        }
                    });
                }
            });
        });

        return controls;
    }

    async handleSubmit(wrapper) {
        const answers = this._getWizardAnswers();
        const unanswered = Object.entries(answers).filter(([, v]) => v === null);

        if (unanswered.length > 0) {
            this._showStatus(wrapper, `Please answer all ${unanswered.length} remaining question(s) before continuing.`, 'warning');
            return;
        }

        const apiKeyInput = document.getElementById('wizard-api-key');
        const apiKey = (apiKeyInput ? apiKeyInput.value : this.apiKey).trim();
        if (!apiKey) {
            this._showStatus(wrapper, 'Please enter your Anthropic API key above.', 'error');
            return;
        }
        this.apiKey = apiKey;
        localStorage.setItem('anthropic_api_key', apiKey);

        const controls = this._extractComplianceControls();
        if (controls.length === 0) {
            this._showStatus(wrapper, 'No compliance controls found in template data. Ensure the template is loaded.', 'error');
            return;
        }

        this._showStatus(wrapper, '⏳ Sending system profile to Claude for analysis… this may take a few seconds.', 'loading');

        try {
            const applicableControls = await this._callClaudeAPI(answers, controls, apiKey);
            if (!Array.isArray(applicableControls) || applicableControls.length === 0) {
                throw new Error('Claude returned an empty or invalid control list.');
            }

            this._applyResults(applicableControls);

            const count = applicableControls.length;
            this._showStatus(
                wrapper,
                `✅ ${count} control${count !== 1 ? 's' : ''} identified and pre-selected as Applicable. Switching to Compliance view in 2 seconds — review and finalise the suggestions there.`,
                'success'
            );

            setTimeout(() => {
                if (typeof roleProgressTracker !== 'undefined') {
                    roleProgressTracker.selectRole('Compliance');
                }
            }, 2000);

        } catch (err) {
            console.error('SystemWizard error:', err);
            this._showStatus(wrapper, `Error: ${err.message}`, 'error');
        }
    }

    async _callClaudeAPI(answers, controls, apiKey) {
        const answersText = Object.entries(answers)
            .map(([q, a]) => `• ${q}\n  → ${a}`)
            .join('\n\n');

        const controlsSummary = controls.map(c =>
            `${c.requirement_control_number} | ${c.step} | ${c.group} | ${c.jkName}: ${c.jkText}`
        ).join('\n');

        const prompt = `You are an AI compliance expert specialising in the EU AI Act and ISO/IEC 42001.

A compliance officer is onboarding a new AI system. Based on their answers below, identify the MINIMUM VIABLE set of controls that are applicable to this specific system.

## System Characteristics

${answersText}

## Available Controls (format: control_number | article_step | group | name: description)

${controlsSummary}

## Instructions

Return ONLY a valid JSON array containing the requirement_control_number values that should be marked "Applicable".

Guidance:
- Include controls that are directly required for the stated system type, user exposure, decision impact, data handling, and risk level.
- For high-stakes / customer-facing / high error-severity systems: include transparency, human oversight, and data handling controls.
- For low-risk / internal / automated systems: limit to core documentation and transparency controls.
- Omit controls that are clearly irrelevant given the answers (e.g. skip human-oversight controls if the system is fully automated with no path to adding oversight; skip data-privacy controls if no personal data is processed).
- Do NOT include every control — return only the minimum set needed for compliance.

Return ONLY the JSON array. No explanation, no markdown fences, just valid JSON.
Example: ["[18229-1.1]","[18229-1.2]","[18229-2.3]"]`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            let errMsg = `API request failed (HTTP ${response.status})`;
            try {
                const errData = await response.json();
                errMsg = errData.error?.message || errMsg;
            } catch (_) {}
            throw new Error(errMsg);
        }

        const data = await response.json();
        const text = (data.content?.[0]?.text || '').trim();

        const match = text.match(/\[[\s\S]*\]/);
        if (!match) throw new Error('Unexpected response format from Claude. Raw response: ' + text.slice(0, 200));

        return JSON.parse(match[0]);
    }

    _applyResults(controlNumbers) {
        if (!Array.isArray(controlNumbers)) return;

        const applicableSet = new Set(controlNumbers.map(n => String(n).trim()));

        if (!this.state.templateData) return;
        const complianceSection = this.state.templateData['1. Compliance Requirements'];
        if (!complianceSection) return;

        complianceSection.forEach(step => {
            if (!step.Fields) return;
            step.Fields.forEach(field => {
                if (!field.controls || !Array.isArray(field.controls)) return;
                field.controls.forEach(control => {
                    if (control.jkType !== 'requirement' || !control.requirement_control_number) return;
                    const key = sanitizeForId(control.requirement_control_number);
                    if (applicableSet.has(control.requirement_control_number)) {
                        this.state.capturedData[key + '_jkSoa'] = 'Applicable';
                        this.state.capturedData[key + '_requirement'] = (control.jkName || '') + ': ' + (control.jkText || '');
                    }
                });
            });
        });

        if (typeof roleProgressTracker !== 'undefined') {
            roleProgressTracker.update();
        }
    }

    _showStatus(wrapper, message, type) {
        const statusDiv = wrapper.querySelector('#wizard-status');
        if (!statusDiv) return;

        const styles = {
            loading: 'background:#1a2035;border:1px solid #3a6fd8;color:#7eb3ff;',
            success: 'background:#0f2d1a;border:1px solid #22c55e;color:#4ade80;',
            error:   'background:#2d0f0f;border:1px solid #ef4444;color:#fca5a5;',
            warning: 'background:#2d2000;border:1px solid #f59e0b;color:#fcd34d;'
        };

        statusDiv.style.cssText = `margin-top:18px;padding:14px 18px;border-radius:7px;font-size:14px;line-height:1.5;${styles[type] || styles.loading}`;
        statusDiv.style.display = 'block';
        statusDiv.textContent = message;
    }
}
