// AI Assistant Integration

// AI Assistant Integration

const apikey = process.env.FIREBASE_KEY_AUTO_1; 
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apikey}`;




function showAIAssistant() {
    openModal('aiAssistantModal');
}

function useAIFeature(feature) {
    closeModal('aiAssistantModal');
    switchRightTab('ai');
    
    const aiMode = document.getElementById('aiMode');
    if (aiMode) {
        const modeMap = {
            'dialogue': 'dialogue',
            'scene': 'scene',
            'character': 'character',
            'plot': 'plot',
            'translate': 'dialogue',
            'voice': 'dialogue'
        };
        aiMode.value = modeMap[feature] || 'dialogue';
    }
    
    const prompts = {
        'dialogue': 'Write a conversation between two characters...',
        'scene': 'Describe a beautiful scene for my visual novel...',
        'character': 'Create a unique character with personality traits...',
        'plot': 'Generate an interesting plot for my story...',
        'translate': 'Translate this text to another language...',
        'voice': 'Generate voice dialogue for this scene...'
    };
    
    document.getElementById('aiPrompt').placeholder = prompts[feature];
    showNotification(`${feature} mode activated`, 'info');
}

async function generateWithAI() {
    const mode = document.getElementById('aiMode').value;
    const action = document.getElementById('aiAction').value; // Get the action
    const prompt = document.getElementById('aiPrompt').value.trim();
    const output = document.getElementById('aiOutput');
    
    if (!prompt) {
        showNotification('Please enter a prompt', 'error');
        return;
    }
    
    output.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);"><i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i><br><br>Generating with AI...</div>';
    
    try {
        // Generate based on mode without making external API call
        const result = await generateContentLocally(mode, prompt);
        
        if (action === 'new_project') {
            // This function needs to be in your project.js file
            createNewProjectWithContent(result, prompt); 
            output.innerHTML = `<div style="padding: 20px; color: var(--text-secondary);">New project created based on your prompt!</div>`;
            showNotification('New project created successfully!', 'success');
        } else {
            // This is the 'append' action
            insertAIResult(result); // Pass the result directly
            output.innerHTML = `
                <div style="margin-bottom: 10px; font-weight: bold; color: var(--text-secondary);">Appended to editor:</div>
                <pre style="background: var(--bg-primary); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); overflow-x: auto; white-space: pre-wrap;">${escapeHtml(result)}</pre>
            `;
            showNotification('Content appended to editor!', 'success');
        }
        
    } catch (error) {
        output.innerHTML = `<div style="color: var(--error); padding: 20px;">Error: ${error.message}</div>`;
        showNotification('Failed to generate content', 'error');
    }
}

async function generateContentLocally(mode, prompt) {
    // Simulate AI generation with template-based responses
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const templates = {
        dialogue: `# Generated Dialogue\n\ncharacter1 "${prompt}"\n\ncharacter2 "That's interesting! Tell me more."\n\ncharacter1 "Well, let me explain..."\n\ncharacter2 "I understand now. Thank you!"`,
        scene: `# Generated Scene\n\nscene ${prompt.toLowerCase().replace(/\s+/g, '_')}\nwith fade\n\n"You find yourself in a ${prompt}. The atmosphere is mysterious and captivating."\n\n"Every detail tells a story of its own."`,
        character: `# Generated Character\n\ndefine char = Character("${prompt}", color="#c8ffc8")\n\n# Character Profile:\n# - Name: ${prompt}\n# - Personality: Friendly and adventurous\n# - Background: A mysterious traveler\n# - Goals: Seeking knowledge and friendship`,
        plot: `# Generated Plot\n\nlabel start:\n    scene bg main\n    \n    "${prompt}"\n    \n    "The story begins with an unexpected event..."\n    \n    menu:\n        "Investigate further":\n            jump investigate\n        \n        "Seek help":\n            jump seek_help\n\nlabel investigate:\n    "You decide to look into the matter yourself."\n    jump end\n\nlabel seek_help:\n    "You reach out to your allies for assistance."\n    jump end\n\nlabel end:\n    "And so the adventure continues..."\n    return`,
        choices: `# Generated Choices\n\nmenu:\n    "${prompt}"\n    \n    "Option 1":\n        "You chose the first path."\n        jump path1\n    \n    "Option 2":\n        "You chose the second path."\n        jump path2\n    \n    "Option 3":\n        "You chose the third path."\n        jump path3`
    };
    
    return templates[mode] || templates.dialogue;
}


function insertAIResult(result) {
    if (!result) return;
    
    const textarea = document.getElementById('editorTextarea');
    if (!textarea) return;
    
    const currentContent = textarea.value.trim();
    
    // Append to the end of the file with proper spacing
    textarea.value = currentContent + '\n\n' + result + '\n';
    
    onEditorInput(); // This updates line numbers, stats, etc.
    
    // Scroll to the bottom to show the new content
    textarea.scrollTop = textarea.scrollHeight;
}
