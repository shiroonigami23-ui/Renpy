// RenPy Script Parser (Interpreter Brain - Part 1, v3 - With Python)

/**
 * Parses a RenPy script into a command list and a label map.
 * This is the "compiler" part.
 * @param {string} script - The raw RenPy script text.
 * @returns {{commands: Array<Object>, labelMap: Object}}
 */
function parseScript(script) {
    const lines = script.split('\n');
    const commands = [];
    const labelMap = {};
    let currentMenu = null;
    let lastChoice = null;
    let lastCommand = null; // To handle multi-line commands like 'show'

    let menuIndent = -1;
    let choiceIndent = -1;
    let blockIndent = -1; // For 'if' blocks
    let currentBlock = null; // To hold 'if' statements

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        const currentIndent = line.length - line.trimStart().length;

        if (!trimmedLine || trimmedLine.startsWith('#')) {
            lastCommand = null; // Comments break multi-line
            continue;
        }

        // --- Indentation-based state management ---
        if (currentMenu && currentIndent < menuIndent) {
            currentMenu = null; lastChoice = null; menuIndent = -1; choiceIndent = -1;
        } else if (lastChoice && currentIndent <= choiceIndent) {
            lastChoice = null; choiceIndent = -1;
        } else if (currentBlock && currentIndent <= blockIndent) {
            currentBlock = null; blockIndent = -1;
        }
        
        // --- Command Parsing ---
        const command = parseRenpyCommand(trimmedLine);
        command.lineNumber = i + 1;

        // --- Multi-line command logic ---
        if (lastCommand && (command.type === 'at' || command.type === 'with')) {
            // This 'at' or 'with' belongs to the previous 'show' or 'scene'
            lastCommand.modifiers = lastCommand.modifiers || [];
            lastCommand.modifiers.push(command);
            continue; // Don't add this as a separate command
        }
        
        // --- Block logic (if statements) ---
        if (currentBlock && currentIndent > blockIndent) {
            currentBlock.actions.push(command);
            lastCommand = command;
            continue;
        }

        // Reset lastCommand if it's not a multi-line starter
        lastCommand = null;

        if (command.type === 'label') {
            labelMap[command.name] = commands.length;
            commands.push(command);
            currentMenu = null; lastChoice = null; currentBlock = null; // Reset all states
        } else if (command.type === 'menu') {
            currentMenu = command;
            command.choices = [];
            menuIndent = currentIndent;
            commands.push(command);
        } else if (command.type === 'choice') {
            if (currentMenu) {
                lastChoice = command;
                lastChoice.actions = [];
                choiceIndent = currentIndent;
                currentMenu.choices.push(lastChoice);
            } else {
                console.warn(`Choice found outside of menu: ${trimmedLine} (L${i+1})`);
            }
        } else if (lastChoice && currentIndent > choiceIndent) {
            lastChoice.actions.push(command);
        } else if (command.type === 'if') {
            currentBlock = command;
            command.actions = [];
            blockIndent = currentIndent;
            commands.push(command);
        } else if (command.type === 'show' || command.type === 'scene') {
            lastCommand = command; // This might be a multi-line command
            commands.push(command);
        } else if (command.type !== 'unknown' && command.type !== 'transition' && command.type !== 'at' && command.type !== 'with') {
            commands.push(command);
        } else {
            if (command.type !== 'unknown') {
                console.log(`Skipped standalone modifier: ${trimmedLine}`);
            } else {
                console.log(`Skipped unknown command: ${trimmedLine} (L${i+1})`);
            }
        }
    }
    
    return { commands, labelMap };
}

/**
 * This is the old executeScript function, which is now just a wrapper.
 */
function executeScript(script) {
    return parseScript(script);
}

/**
 * Parses a single line of RenPy code into a command object.
 * @param {string} line - A single, trimmed line of code.
 * @returns {Object}
 */
function parseRenpyCommand(line) {
    // --- THIS IS THE FIX ---
    // Strip comments from the line FIRST
    line = line.split('#')[0].trim();
    if (!line) return { type: 'comment' }; // If line was ONLY a comment
    // --- END FIX ---

    // Label: label start:
    if (line.startsWith('label ')) {
        return { type: 'label', name: line.substring(6).replace(':', '').trim() };
    }

    // Define Character: define e = Character("Eileen", color="#c8ffc8")
    if (line.startsWith('define ')) {
        const match = line.match(/define (\w+) = Character\("(.+?)"(?:,\s*color="(.+?)")?\)/);
        if (match) {
            return { 
                type: 'define_char', 
                variable: match[1], 
                name: match[2], 
                color: match[3] || null 
            };
        }
    }

    // Scene: scene bg room
    if (line.startsWith('scene ')) {
        return { type: 'scene', image: line.substring(6).trim() };
    }

    // Show: show eileen happy
    if (line.startsWith('show ')) {
        return { type: 'show', image: line.substring(5).trim() };
    }

    // Hide: hide eileen
    if (line.startsWith('hide ')) {
        return { type: 'hide', image: line.substring(5).trim() };
    }

    // Jump: jump main_menu
    if (line.startsWith('jump ')) {
        return { type: 'jump', label: line.substring(5).trim() };
    }

    // Menu: menu:
    if (line.startsWith('menu:')) {
        return { type: 'menu' };
    }
    
    // Play: play music "file.mp3"
    if (line.startsWith('play ')) {
        const parts = line.split(' ');
        return { type: parts[1], file: parts.slice(2).join(' ').replace(/"/g, '') };
    }

    // Stop: stop music
    if (line.startsWith('stop ')) {
        return { type: 'stop', channel: line.split(' ')[1] };
    }
    
    // Return: return
    if (line.startsWith('return')) {
        return { type: 'return' };
    }

    // Position/Transition: at center / with fade
    if (line.startsWith('at ')) {
        return { type: 'at', position: line.substring(3).trim() };
    }
    if (line.startsWith('with ')) {
        return { type: 'with', effect: line.substring(5).trim() };
    }

    // Choice: "Start Game":
    const choiceMatch = line.match(/^"(.+?)"\s*:/);
    if (choiceMatch) {
        return { type: 'choice', text: choiceMatch[1] };
    }

    // Dialogue (Narrator): "Hello world"
    const narratorMatch = line.match(/^"(.+)"/);
    if (narratorMatch) {
        return { type: 'dialogue', character: 'narrator', text: narratorMatch[1] };
    }

    // Dialogue (Character): e "Hello world"
    const charDialogueMatch = line.match(/^(\w+)\s+"(.+)"/);
    if (charDialogueMatch) {
        return { type: 'dialogue', character: charDialogueMatch[1], text: charDialogueMatch[2] };
    }
    
    // Python Variable: $ points = 0
    if (line.startsWith('$')) {
        return { type: 'python', code: line.substring(1).trim() };
    }
    
    // If statement: if (points > 5):
    if (line.startsWith('if ')) {
        return { type: 'if', condition: line.substring(3).replace(':', '').trim() };
    }
    
    // Default
    return { type: 'unknown', content: line };
}
