// ============================================
// scripts/systemWizard.js
// ============================================
/**
 * System Assessment Wizard
 * Presents a predefined question set to help compliance officers identify
 * the minimum viable set of applicable controls for a new AI system.
 * Calls Claude API directly from the browser to analyze answers and return
 * per-category justifications suitable for auditor review.
 */
class SystemWizard {
    constructor(stateManager) {
        this.state = stateManager;
        this.apiKey = localStorage.getItem('anthropic_api_key') || '';
    }

    // ─── Public entry point ───────────────────────────────────────────────────

    render() {
        const wrapper = document.createElement('div');
        wrapper.id = 'system-wizard-wrapper';
        wrapper.style.cssText = 'padding: 28px; max-width: 820px; margin: 0 auto;';

        // Header
        const header = document.createElement('div');
        header.style.marginBottom = '28px';
        const title = document.createElement('h2');
        title.textContent = 'System Assessment Wizard';
        title.style.cssText = 'color: #b8963e; margin: 0 0 10px 0; font-size: 22px;';
        const subtitle = document.createElement('p');
        subtitle.textContent = 'Answer the questions below to automatically identify the minimum viable set of applicable compliance controls. Claude will also produce a per-category justification you can share with auditors.';
        subtitle.style.cssText = 'color: #a0a0a0; margin: 0; font-size: 14px; line-height: 1.6;';
        header.appendChild(title);
        header.appendChild(subtitle);
        wrapper.appendChild(header);

        // API key
        wrapper.appendChild(this._buildApiKeySection());

        // System description (free text — submitted to Claude alongside the wizard answers)
        wrapper.appendChild(this._buildDescriptionSection());

        // Questions
        const questionsDiv = document.createElement('div');
        questionsDiv.id = 'wizard-questions';
        this._getQuestions().forEach((q, idx) => questionsDiv.appendChild(this._buildQuestion(q, idx)));
        wrapper.appendChild(questionsDiv);

        // Submit button
        const submitBtn = document.createElement('button');
        submitBtn.className = 'btn-primary';
        submitBtn.id = 'wizard-submit-btn';
        submitBtn.textContent = 'Analyze & Apply Controls';
        submitBtn.style.cssText = 'margin-top: 28px; padding: 12px 28px; font-size: 15px; cursor: pointer;';
        submitBtn.onclick = () => this.handleSubmit(wrapper);
        wrapper.appendChild(submitBtn);

        // Status message area
        const statusDiv = document.createElement('div');
        statusDiv.id = 'wizard-status';
        statusDiv.style.display = 'none';
        wrapper.appendChild(statusDiv);

        // Justification results area (populated after Claude responds, or restored from saved data)
        const resultsDiv = document.createElement('div');
        resultsDiv.id = 'wizard-results';
        wrapper.appendChild(resultsDiv);

        // Restore previous inputs and results after element is in the DOM
        setTimeout(() => {
            this._restorePreviousDescription();
            this._restorePreviousAnswers();
            const prevJustifications = this._getSavedJustifications();
            if (prevJustifications && prevJustifications.length > 0) {
                this._renderResults(resultsDiv, prevJustifications);
            }
        }, 60);

        return wrapper;
    }

    // ─── Event handler ────────────────────────────────────────────────────────

    async handleSubmit(wrapper) {
        const answers = this._collectAnswers();
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

        const descriptionEl = document.getElementById('wizard-description');
        const description = descriptionEl ? descriptionEl.value.trim() : '';

        const controls = this._extractComplianceControls();
        if (controls.length === 0) {
            this._showStatus(wrapper, 'No compliance controls found in template data. Ensure the template has loaded.', 'error');
            return;
        }

        const submitBtn = wrapper.querySelector('#wizard-submit-btn');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Analyzing…'; }
        this._showStatus(wrapper, '⏳ Sending system profile to Claude… this may take a few seconds.', 'loading');

        try {
            const { applicable_controls, justifications } = await this._callClaudeAPI(answers, description, controls, apiKey);

            if (!Array.isArray(applicable_controls) || applicable_controls.length === 0) {
                throw new Error('Claude returned an empty or invalid control list.');
            }

            // Enrich justifications with per-category control counts
            const enriched = this._enrichJustifications(justifications, applicable_controls, controls);

            // Persist wizard inputs and results into capturedData so they are saved with the file
            this._persistWizardData(answers, enriched, description);

            // Mark applicable controls in state
            this._applyResults(applicable_controls);

            const count = applicable_controls.length;
            this._showStatus(
                wrapper,
                `✅ ${count} control${count !== 1 ? 's' : ''} identified and pre-selected as Applicable. Switching to Compliance view in 3 seconds — review and finalise the suggestions there.`,
                'success'
            );

            // Show justifications immediately
            const resultsDiv = wrapper.querySelector('#wizard-results');
            if (resultsDiv) this._renderResults(resultsDiv, enriched);

            setTimeout(() => {
                if (typeof roleProgressTracker !== 'undefined') roleProgressTracker.selectRole('Compliance');
            }, 3000);

        } catch (err) {
            console.error('SystemWizard error:', err);
            this._showStatus(wrapper, `Error: ${err.message}`, 'error');
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Analyze & Apply Controls'; }
        }
    }

    // ─── UI builders ──────────────────────────────────────────────────────────

    _buildDescriptionSection() {
        const div = document.createElement('div');
        div.style.cssText = 'background: #1e1e1e; border: 1px solid #3d3d3d; border-radius: 8px; padding: 18px; margin-bottom: 24px;';

        const heading = document.createElement('p');
        heading.textContent = 'System Description';
        heading.style.cssText = 'font-weight: 600; color: #e0d9ce; margin: 0 0 6px 0; font-size: 14px;';

        const instruction = document.createElement('p');
        instruction.textContent = 'Describe the system in your own words before answering the questions below. Include: the main purpose of the application, what it does, and the primary business processes it supports. This context is sent to Claude alongside your answers and helps it catch details the questions alone may not surface.';
        instruction.style.cssText = 'color: #888; font-size: 13px; margin: 0 0 12px 0; line-height: 1.6;';

        const textarea = document.createElement('textarea');
        textarea.id = 'wizard-description';
        textarea.placeholder = 'e.g. "This system is a customer-facing chatbot used by our retail banking division. It helps customers check account balances, initiate transfers, and get answers to FAQs. It is deployed on our public website and mobile app, and interacts with approximately 50,000 customers per month. It does not make credit or lending decisions but does surface personalised product recommendations."';
        textarea.rows = 6;
        textarea.style.cssText = 'width: 100%; padding: 10px 12px; background: #252525; border: 1px solid #444; border-radius: 5px; color: #e0d9ce; font-size: 13px; box-sizing: border-box; resize: vertical; line-height: 1.6; font-family: inherit;';

        div.appendChild(heading);
        div.appendChild(instruction);
        div.appendChild(textarea);
        return div;
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
        input.placeholder = 'sk-ant-api03-…';
        input.style.cssText = 'width: 100%; padding: 9px 12px; background: #252525; border: 1px solid #444; border-radius: 5px; color: #e0d9ce; font-size: 13px; box-sizing: border-box;';
        input.oninput = (e) => {
            this.apiKey = e.target.value.trim();
            localStorage.setItem('anthropic_api_key', this.apiKey);
        };

        const hint = document.createElement('p');
        hint.textContent = 'Stored in browser local storage only — sent exclusively to the Anthropic API.';
        hint.style.cssText = 'color: #555; font-size: 11px; margin: 6px 0 0 0;';

        div.appendChild(label);
        div.appendChild(input);
        div.appendChild(hint);
        return div;
    }

    _buildQuestion(q, idx) {
        const div = document.createElement('div');
        div.style.cssText = 'background: #1e1e1e; border: 1px solid #3d3d3d; border-radius: 8px; padding: 18px; margin-bottom: 14px;';

        const qlabel = document.createElement('p');
        qlabel.textContent = `${idx + 1}. ${q.question}`;
        qlabel.style.cssText = 'font-weight: 600; color: #e0d9ce; margin: 0 0 14px 0; font-size: 14px;';
        div.appendChild(qlabel);

        q.options.forEach(option => {
            const label = document.createElement('label');
            label.style.cssText = 'display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; cursor: pointer; color: #b0b0b0; font-size: 13px; line-height: 1.5;';
            label.addEventListener('mouseenter', () => { label.style.color = '#e0d9ce'; });
            label.addEventListener('mouseleave', () => { label.style.color = '#b0b0b0'; });

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `wizard_${q.id}`;
            radio.value = option;
            radio.style.cssText = 'margin-top: 2px; flex-shrink: 0; accent-color: #b8963e; width: 15px; height: 15px; cursor: pointer;';

            const span = document.createElement('span');
            span.textContent = option;

            label.appendChild(radio);
            label.appendChild(span);
            div.appendChild(label);
        });

        return div;
    }

    _renderResults(container, justifications) {
        container.innerHTML = '';

        const timestamp = this.state.capturedData['_wizard_timestamp'];

        const sectionHeader = document.createElement('div');
        sectionHeader.style.cssText = 'margin-top: 36px; padding-top: 28px; border-top: 1px solid #3d3d3d;';

        const sectionTitle = document.createElement('h3');
        sectionTitle.textContent = 'Auditor Justification';
        sectionTitle.style.cssText = 'color: #b8963e; margin: 0 0 6px 0; font-size: 18px;';

        const sectionSub = document.createElement('p');
        sectionSub.textContent =
            `Analysis run: ${timestamp ? new Date(timestamp).toLocaleString() : 'Unknown'}. ` +
            'The following explains why each control category was included. This is automatically saved with the assessment file.';
        sectionSub.style.cssText = 'color: #666; font-size: 12px; margin: 0 0 20px 0; line-height: 1.5;';

        sectionHeader.appendChild(sectionTitle);
        sectionHeader.appendChild(sectionSub);
        container.appendChild(sectionHeader);

        if (!justifications || justifications.length === 0) {
            const empty = document.createElement('p');
            empty.textContent = 'No justifications available.';
            empty.style.color = '#666';
            container.appendChild(empty);
            return;
        }

        justifications.forEach(({ category, reason, count }) => {
            const card = document.createElement('div');
            card.style.cssText = 'background: #141c2e; border: 1px solid #2a3a5e; border-radius: 8px; padding: 16px 18px; margin-bottom: 12px;';

            const cardHead = document.createElement('div');
            cardHead.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';

            const catName = document.createElement('span');
            catName.textContent = category;
            catName.style.cssText = 'font-weight: 600; color: #7eb3ff; font-size: 13px;';

            cardHead.appendChild(catName);

            if (count !== undefined) {
                const badge = document.createElement('span');
                badge.textContent = `${count} control${count !== 1 ? 's' : ''}`;
                badge.style.cssText = 'background: #1e2e4a; color: #7eb3ff; font-size: 11px; padding: 3px 9px; border-radius: 10px; white-space: nowrap; margin-left: 12px;';
                cardHead.appendChild(badge);
            }

            const reasonText = document.createElement('p');
            reasonText.textContent = reason;
            reasonText.style.cssText = 'color: #b8c8e0; font-size: 13px; margin: 0; line-height: 1.65;';

            card.appendChild(cardHead);
            card.appendChild(reasonText);
            container.appendChild(card);
        });
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

    // ─── Data helpers ─────────────────────────────────────────────────────────

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

    _collectAnswers() {
        const answers = {};
        this._getQuestions().forEach(q => {
            const selected = document.querySelector(`input[name="wizard_${q.id}"]:checked`);
            answers[q.question] = selected ? selected.value : null;
        });
        return answers;
    }

    _restorePreviousDescription() {
        const saved = this.state.capturedData['_wizard_description'];
        if (!saved) return;
        const textarea = document.getElementById('wizard-description');
        if (textarea) textarea.value = saved;
    }

    _restorePreviousAnswers() {
        const prevAnswers = this._getSavedAnswers();
        if (!prevAnswers) return;
        this._getQuestions().forEach(q => {
            const saved = prevAnswers[q.question];
            if (!saved) return;
            document.querySelectorAll(`input[name="wizard_${q.id}"]`).forEach(radio => {
                if (radio.value === saved) radio.checked = true;
            });
        });
    }

    _getSavedAnswers() {
        const raw = this.state.capturedData['_wizard_answers'];
        if (!raw) return null;
        try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (_) { return null; }
    }

    _getSavedJustifications() {
        const raw = this.state.capturedData['_wizard_justifications'];
        if (!raw) return null;
        try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (_) { return null; }
    }

    _extractComplianceControls() {
        const controls = [];
        if (!this.state.templateData) return controls;
        const section = this.state.templateData['1. Compliance Requirements'];
        if (!section) return controls;
        section.forEach(step => {
            if (!step.Fields) return;
            step.Fields.forEach(field => {
                if (!field.controls || !Array.isArray(field.controls)) return;
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
            });
        });
        return controls;
    }

    _enrichJustifications(justifications, applicableControls, allControls) {
        // Build a map: step → count of selected controls in that step
        const stepCounts = {};
        const applicableSet = new Set(applicableControls.map(n => String(n).trim()));
        allControls.forEach(c => {
            if (applicableSet.has(c.requirement_control_number)) {
                stepCounts[c.step] = (stepCounts[c.step] || 0) + 1;
            }
        });

        return (justifications || []).map(j => ({
            category: j.category,
            reason: j.reason,
            count: stepCounts[j.category] !== undefined ? stepCounts[j.category] : undefined
        }));
    }

    _persistWizardData(answers, justifications, description) {
        this.state.capturedData['_wizard_answers']        = JSON.stringify(answers);
        this.state.capturedData['_wizard_justifications'] = JSON.stringify(justifications);
        this.state.capturedData['_wizard_description']    = description || '';
        this.state.capturedData['_wizard_timestamp']      = new Date().toISOString();
    }

    _applyResults(controlNumbers) {
        if (!Array.isArray(controlNumbers)) return;
        const applicableSet = new Set(controlNumbers.map(n => String(n).trim()));
        if (!this.state.templateData) return;
        const section = this.state.templateData['1. Compliance Requirements'];
        if (!section) return;

        section.forEach(step => {
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

        if (typeof roleProgressTracker !== 'undefined') roleProgressTracker.update();
    }

    // ─── Claude API ───────────────────────────────────────────────────────────

    async _callClaudeAPI(answers, description, controls, apiKey) {
        const answersText = Object.entries(answers)
            .map(([q, a]) => `• ${q}\n  → ${a}`)
            .join('\n\n');

        // Summarise controls: control_number | article_step | group | name: description
        const controlsSummary = controls
            .map(c => `${c.requirement_control_number} | ${c.step} | ${c.group} | ${c.jkName}: ${c.jkText}`)
            .join('\n');

        // Collect unique article steps so Claude knows what categories to justify
        const uniqueSteps = [...new Set(controls.map(c => c.step))].join(', ');

        const descriptionBlock = description
            ? `## System Description (free-text provided by compliance officer)\n\n${description}\n\n`
            : '';

        const prompt = `You are an AI compliance expert specialising in the EU AI Act and ISO/IEC 42001.

A compliance officer is onboarding a new AI system. Based on their description and intake answers, identify:
1. The MINIMUM VIABLE set of applicable controls for this specific system.
2. A short justification (2–4 sentences) for EACH article-step category that contains at least one selected control.

${descriptionBlock}## System Characteristics (wizard answers)

${answersText}

## Available Controls (format: control_number | article_step | group | name: description)

${controlsSummary}

## Available Article-Step Categories

${uniqueSteps}

## Instructions

Return a single JSON object with this exact structure — no markdown, no extra text, just valid JSON:

{
  "applicable_controls": ["[18229-1.1]", "..."],
  "justifications": [
    {
      "category": "<exact article_step name from the list above>",
      "reason": "<2–4 sentences explaining why controls in this category are required for this specific system>"
    }
  ]
}

Rules:
- Include only controls that are directly required given the system type, user exposure, decision impact, data handling, and risk level.
- For high-stakes / customer-facing / high error-severity systems: include transparency, human oversight, and data handling controls.
- For low-risk / internal / automated systems: limit to core documentation and transparency controls.
- Omit controls clearly irrelevant given the answers.
- Only include a category in "justifications" if at least one of its controls appears in "applicable_controls".
- Justifications must be specific to the wizard answers — do not give generic boilerplate.`;

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
                max_tokens: 2048,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            let errMsg = `API request failed (HTTP ${response.status})`;
            try { const e = await response.json(); errMsg = e.error?.message || errMsg; } catch (_) {}
            throw new Error(errMsg);
        }

        const data = await response.json();
        const text = (data.content?.[0]?.text || '').trim();

        // Extract JSON object from response (Claude may occasionally add a brief preamble)
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Unexpected response format from Claude. Raw: ' + text.slice(0, 300));

        const parsed = JSON.parse(match[0]);
        if (!parsed.applicable_controls || !parsed.justifications) {
            throw new Error('Claude response is missing required fields (applicable_controls or justifications).');
        }
        return parsed;
    }
}
