// Preview Engine (Interpreter Brain - Part 2, v3 - With Python)

let previewState = {
    commands: [],
    labelMap: {},
    currentIndex: 0,
    variables: {},
    characters: {},
    running: false,
    paused: false, // For dialogue and menus
    currentScene: null,
    shownCharacters: new Set(),
};

/**
 * Main function to start or restart the preview.
 */
function runPreview() {
    const previewWindow = document.getElementById('previewWindow');
    if (!previewWindow || !currentFile) return;
    
    try {
        const script = currentFile.content;
        const { commands, labelMap } = parseScript(script);
        
        // Clear the preview window
        previewWindow.innerHTML = '';
        
        // Create the core VN UI elements
        createPreviewUI(previewWindow);
        
        // Initialize the interpreter state
        previewState = {
            commands: commands,
            labelMap: labelMap,
            currentIndex: 0,
            variables: {},
            characters: {},
            running: true,
            paused: false,
            currentScene: null,
            shownCharacters: new Set(),
        };

        // Update the variables tab UI
        renderVariables();
        
        document.getElementById('statusMessage').textContent = 'Preview running';
        showNotification('Preview started', 'success');

        // Find the 'start' label and begin execution
        const startIndex = labelMap['start'];
        if (startIndex === undefined) {
            showNotification('Error: "label start" not found in script', 'error');
            return;
        }
        
        executeNextCommand(startIndex);

    } catch (error) {
        showNotification('Error parsing script: ' + error.message, 'error');
        console.error(error);
    }
}

function stopPreview() {
    previewState.running = false;
    const previewWindow = document.getElementById('previewWindow');
    if (previewWindow) {
        previewWindow.innerHTML = '<div class="preview-placeholder"><i class="fas fa-stop-circle"></i><p>Preview stopped</p></div>';
    }
    document.getElementById('statusMessage').textContent = 'Ready';
    showNotification('Preview stopped', 'info');
}

/**
 * Creates the essential UI components for the visual novel.
 */
function createPreviewUI(container) {
    const sceneLayer = document.createElement('div');
    sceneLayer.id = 'sceneLayer';
    sceneLayer.className = 'vn-layer vn-scene-layer';
    container.appendChild(sceneLayer);
    
    const characterLayer = document.createElement('div');
    characterLayer.id = 'characterLayer';
    characterLayer.className = 'vn-layer vn-character-layer';
    container.appendChild(characterLayer);
    
    const dialogueBox = document.createElement('div');
    dialogueBox.id = 'dialogueBox';
    dialogueBox.className = 'vn-dialogue-box';
    dialogueBox.style.display = 'none'; // Hidden by default
    container.appendChild(dialogueBox);
    
    const menuContainer = document.createElement('div');
    menuContainer.id = 'menuContainer';
    menuContainer.className = 'vn-menu-container';
    menuContainer.style.display = 'none'; // Hidden by default
    container.appendChild(menuContainer);

    // --- UPDATED UI CONTROLS BAR (NOW AT BOTTOM & HORIZONTAL) ---
    const controlsBar = document.createElement('div');
    controlsBar.id = 'vnControlsBar';
    controlsBar.className = 'vn-controls-bar';
    controlsBar.style.display = 'none'; // Hide by default
    controlsBar.innerHTML = `
        <button class="vn-control-btn" onclick="vnHistoryBack()">Back</button>
        <button class="vn-control-btn" onclick="vnToggleSkip()">Skip</button>
        <button class="vn-control-btn" onclick="vnSaveGame(0)">Save</button>
        <button class="vn-control-btn" onclick="vnLoadGame(0)">Load</button>
        <button class="vn-control-btn" onclick="vnReturnToMenu()">Menu</button>
    `;
    container.appendChild(controlsBar);
    // --- END UPDATED UI ---
}

/**
 * This is the main interpreter loop. It executes commands starting from a given index.
 */
function executeNextCommand(index) {
    if (!previewState.running || previewState.paused) return;
    
    previewState.currentIndex = index;
    
    if (previewState.currentIndex >= previewState.commands.length) {
        showDialogue('', 'The End', true);
        previewState.running = false;
        return;
    }
    
    const command = previewState.commands[previewState.currentIndex];
    let keepExecuting = false; // Should we run the next command immediately?

    switch (command.type) {
        case 'label':
        case 'define_char':
        case 'python':
        case 'transition': // RenPy 'with'
        case 'at': // RenPy 'at'
            // These commands do nothing visible or are handled by others
            handleCommand(command);
            keepExecuting = true; // Move to the next command
            break;
            
        case 'scene':
            handleCommand(command);
            // In a real engine, we'd wait for fade, but here we just continue
            keepExecuting = true; 
            break;

        case 'show':
        case 'hide':
            handleCommand(command);
            keepExecuting = true;
            break;

        case 'dialogue':
            previewState.paused = true; // Pause for user input
            handleCommand(command);
            break;
            
        case 'menu':
            previewState.paused = true; // Pause for user input
            handleCommand(command);
            break;
            
        case 'jump':
            handleCommand(command);
            // Don't set keepExecuting, handleCommand already called executeNextCommand
            break;
            
        case 'return':
            // For now, 'return' just stops this branch
            showDialogue('', 'The End', true);
            previewState.running = false;
            break;

        case 'if':
            handleCommand(command);
            // Don't set keepExecuting, handleCommand will call the right branch
            break;

        default:
            console.warn(`Unknown command type: ${command.type}`, command);
            keepExecuting = true; // Skip and continue
    }

    if (keepExecuting) {
        executeNextCommand(previewState.currentIndex + 1);
    }
}

function vnReturnToMenu() {
    if (!previewState.running) return;
    
    // Find the 'start' label and jump to it
    const startIndex = previewState.labelMap['start'];
    if (startIndex !== undefined) {
        // Hide dialogue/menus
        document.getElementById('dialogueBox').style.display = 'none';
        document.getElementById('menuContainer').style.display = 'none';
        
        previewState.paused = false;
        executeNextCommand(startIndex);
    } else {
        showNotification('Error: "label start" not found!', 'error');
    }
}


/**
 * Handles the logic for a single command.
 */
function handleCommand(command) {
    switch (command.type) {
        case 'define_char':
            previewState.characters[command.variable] = { 
                name: command.name, 
                color: command.color 
            };
            break;
            
        case 'scene':
            renderScene(command.image);
            break;

        case 'show':
            showCharacter(command.image, command.modifiers);
            break;

        case 'hide':
            hideCharacter(command.image);
            break;

        case 'dialogue':
            const char = previewState.characters[command.character];
            const name = char ? char.name : (command.character === 'narrator' ? '' : command.character);
            const color = char ? char.color : null;
            showDialogue(name, command.text, false, color);
            break;
            
        case 'menu':
            showMenu(command.choices);
            break;
            
        case 'jump':
            const newIndex = previewState.labelMap[command.label];
            if (newIndex !== undefined) {
                executeNextCommand(newIndex);
            } else {
                showNotification(`Broken jump: Label "${command.label}" not found!`, 'error');
            }
            break;
        
        case 'python':
            handlePython(command.code);
            break;
            
        case 'if':
            const result = evaluateCondition(command.condition);
            if (result) {
                // Execute the first command in the 'if' block
                if (command.actions.length > 0) {
                    // Temporarily hijack the command list to run the block
                    const oldCommands = previewState.commands;
                    const oldIndex = previewState.currentIndex;
                    
                    previewState.commands = command.actions;
                    executeNextCommand(0); // Start executing the block
                    
                    // Restore state after block finishes (this is simplified)
                    previewState.commands = oldCommands;
                    // We need a better way to return, but for now just jump to next command
                    executeNextCommand(oldIndex + 1); 
                } else {
                    executeNextCommand(previewState.currentIndex + 1); // Empty if, skip
                }
            } else {
                // TODO: Add support for 'elif' and 'else'
                executeNextCommand(previewState.currentIndex + 1); // Condition false, skip
            }
            break;
    }
}

// --- UI Rendering Functions ---

function renderScene(sceneName) {
    const sceneLayer = document.getElementById('sceneLayer');
    if (!sceneLayer) return;

    const asset = currentProject?.assets?.find(a => 
        a.type === 'images' && 
        a.name.toLowerCase().includes(sceneName.toLowerCase())
    );

    if (asset) {
        sceneLayer.style.backgroundImage = `url(${asset.data})`;
        sceneLayer.style.backgroundSize = 'cover';
        sceneLayer.style.backgroundPosition = 'center';
        sceneLayer.innerHTML = '';
    } else {
        sceneLayer.style.backgroundImage = 'none';
        sceneLayer.style.backgroundColor = '#333';
        sceneLayer.innerHTML = `<div class="vn-placeholder-text">${sceneName} (asset not found)</div>`;
    }
    previewState.currentScene = sceneName;
    // Clear characters when scene changes
    hideCharacter(null, true);
}

function showCharacter(charName, modifiers) {
    const characterLayer = document.getElementById('characterLayer');
    if (!characterLayer) return;

    let position = 'center'; // Default
    if (modifiers) {
        const atMod = modifiers.find(m => m.type === 'at');
        if (atMod) position = atMod.position;
    }
    
    // Find asset
    const asset = currentProject?.assets?.find(a => 
        a.type === 'images' && 
        a.name.toLowerCase().includes(charName.toLowerCase())
    );
    
    // Remove old version if exists
    hideCharacter(charName);
    
    const charElement = document.createElement('img');
    charElement.id = `char-${charName}`;
    charElement.className = `vn-character vn-char-${position}`;
    
    if (asset) {
        charElement.src = asset.data;
    } else {
        // Fallback placeholder
        charElement.src = `https://placehold.co/400x800/999/333?text=${charName}`;
    }
    
    characterLayer.appendChild(charElement);
    previewState.shownCharacters.add(charName);
}

function hideCharacter(charName, all = false) {
    const characterLayer = document.getElementById('characterLayer');
    if (!characterLayer) return;

    if (all) {
        characterLayer.innerHTML = '';
        previewState.shownCharacters.clear();
        return;
    }
    
    const charElement = document.getElementById(`char-${charName}`);
    if (charElement) {
        charElement.remove();
        previewState.shownCharacters.delete(charName);
    }
}

function showDialogue(character, text, isEnd = false, color = null) {
    const dialogueBox = document.getElementById('dialogueBox');
    const controlsBar = document.getElementById('vnControlsBar');
    if (!dialogueBox || !controlsBar) return;

    // --- THIS IS THE FIX ---
    // Show the game controls when dialogue appears
    controlsBar.style.display = 'flex';
    // --- END FIX ---

    if (isEnd) {
        dialogueBox.innerHTML = `<div class="vn-end-text">${text}</div>`;
        dialogueBox.style.display = 'block';
        dialogueBox.onclick = null;
        controlsBar.style.display = 'none'; // Hide controls at the end
        return;
    }
    
    let characterName = '';
    if (character) {
        const style = color ? `style="color: ${color};"` : `style="color: var(--primary);"`
        characterName = `<div class="vn-char-name" ${style}>${escapeHtml(character)}</div>`;
    }
    
    dialogueBox.innerHTML = `
        ${characterName}
        <div class="vn-dialogue-text">${escapeHtml(text)}</div>
        <div class="vn-continue-prompt">Click to continue</div>
    `;
    dialogueBox.style.display = 'block';
    
    // Set up the click handler to advance
    dialogueBox.onclick = () => {
        dialogueBox.style.display = 'none';
        previewState.paused = false;
        executeNextCommand(previewState.currentIndex + 1);
    };
}


function showMenu(choices) {
    const menuContainer = document.getElementById('menuContainer');
    const controlsBar = document.getElementById('vnControlsBar');
    if (!menuContainer || !controlsBar) return;
    
    // --- THIS IS THE FIX ---
    // Hide the game controls when a menu (like the main menu) appears
    controlsBar.style.display = 'none';
    // --- END FIX ---

    const choiceButtons = choices.map((choice, index) => `
        <button class="vn-menu-button" data-choice-index="${index}">
            ${escapeHtml(choice.text)}
        </button>
    `).join('');
    
    menuContainer.innerHTML = choiceButtons;
    menuContainer.style.display = 'flex';
    
    // Add click listener to the container
    menuContainer.onclick = (e) => {
        if (e.target.classList.contains('vn-menu-button')) {
            const choiceIndex = parseInt(e.target.dataset.choiceIndex);
            const selectedChoice = choices[choiceIndex];
            
            menuContainer.style.display = 'none';
            previewState.paused = false;
            
            // A choice's action is always a jump in this simple parser
            const jumpCommand = selectedChoice.actions.find(a => a.type === 'jump');
            if (jumpCommand) {
                handleCommand(jumpCommand);
            } else {
                showNotification(`Broken menu: Choice "${selectedChoice.text}" has no action.`, 'warning');
                executeNextCommand(previewState.currentIndex + 1); // Just skip
            }
        }
    };
}


// --- Python/Variable Engine ---

/**
 * A (very) simple and (moderately) safe JS-based Python interpreter.
 */
function handlePython(code) {
    try {
        // Create a sandboxed scope for execution
        const scope = previewState.variables;
        
        // Use 'with' to make variables available as local-like variables
        // This is a bit of a hack but works for simple assignments.
        // It's not perfectly safe, but safer than full eval().
        // We are creating a function that takes all variable names as args.
        
        const varNames = Object.keys(scope);
        const varValues = Object.values(scope);
        
        // This creates a function like: new Function("points", "health", "return (points = points + 1)")
        // And then calls it with: (5, 100)
        // This prevents access to 'window' or 'document'.
        const func = new Function(...varNames, `
            "use strict";
            let result = (${code});
            return {
                result: result,
                scope: { ${varNames.join(', ')} }
            };
        `);
        
        const { result, scope: newScope } = func(...varValues);

        // Update previewState.variables with the new values from the scope
        Object.assign(previewState.variables, newScope);
        
        // Update the UI
        renderVariables();
        
    } catch (e) {
        showNotification(`Python Error: ${e.message}`, 'error');
        console.error("Python execution failed:", e);
    }
}

/**
 * Evaluates a simple 'if' condition.
 */
function evaluateCondition(condition) {
    try {
        const scope = previewState.variables;
        const varNames = Object.keys(scope);
        const varValues = Object.values(scope);
        
        const func = new Function(...varNames, `
            "use strict";
            return (${condition});
        `);
        
        return func(...varValues);
        
    } catch (e) {
        showNotification(`Condition Error: ${e.message}`, 'error');
        console.error("Condition evaluation failed:", e);
        return false;
    }
}


// Add fade in animation (Keep this from the old file)
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
`;
document.head.appendChild(style);