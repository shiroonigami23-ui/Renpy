// Code Editor Management

let currentFile = null;
let openFiles = [];
let editorMode = 'code';
let autoReload = true;
let findState = {
    matches: [],
    currentIndex: -1,
    query: ''
};

function initEditor() {
    const textarea = document.getElementById('editorTextarea');
    if (!textarea) return;
    
    // Editor events
    textarea.addEventListener('input', debounce(onEditorInput, 300));
    textarea.addEventListener('keydown', onEditorKeyDown);
    textarea.addEventListener('scroll', syncLineNumbers);
    
    // Find bar events
    document.getElementById('findInput').addEventListener('input', findInEditor);
    document.getElementById('findNextBtn').addEventListener('click', () => findInEditor(true));
    document.getElementById('findPrevBtn').addEventListener('click', () => findInEditor(false, true));
    
    // Initialize with welcome message
    // createNewFile(); // This is now handled by main.js logic
}

function onEditorInput() {
    updateLineNumbers();
    updateStats();
    highlightSyntax();
    
    if (currentFile) {
        currentFile.content = document.getElementById('editorTextarea').value;
        currentFile.modified = true;
        updateFileTab();
        
        if (autoReload) {
            // Debounce the preview run to avoid running on every keystroke
            debounce(runPreview, 1000)();
        }
    }

    // Reset find on edit
    findState = { matches: [], currentIndex: -1, query: '' };
}

function onEditorKeyDown(e) {
    const textarea = e.target;
    
    // Tab key
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 4;
        onEditorInput();
    }
    
    // Ctrl+S - Save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveProject();
    }
    
    // F5 - Run
    if (e.key === 'F5') {
        e.preventDefault();
        runPreview();
    }
    
    // Ctrl+F - Find
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        showFind();
    }

    // Escape - Hide Find
    if (e.key === 'Escape') {
        if (!document.getElementById('findBar').classList.contains('hidden')) {
            hideFind();
        }
    }
}

function updateLineNumbers() {
    const textarea = document.getElementById('editorTextarea');
    const lineNumbers = document.getElementById('lineNumbers');
    if (!textarea || !lineNumbers) return;
    
    const lines = textarea.value.split('\n');
    const numbers = lines.map((_, i) => i + 1).join('\n');
    lineNumbers.textContent = numbers;
}

function syncLineNumbers() {
    const textarea = document.getElementById('editorTextarea');
    const lineNumbers = document.getElementById('lineNumbers');
    if (!textarea || !lineNumbers) return;
    
    lineNumbers.scrollTop = textarea.scrollTop;
}

function updateStats() {
    const textarea = document.getElementById('editorTextarea');
    if (!textarea) return;
    
    const content = textarea.value;
    const lines = content.split('\n').length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const chars = content.length;
    
    document.getElementById('lineCount').textContent = lines;
    document.getElementById('wordCount').textContent = words;
    document.getElementById('charCount').textContent = chars;
    
    // Update cursor position
    const pos = textarea.selectionStart;
    const beforeCursor = content.substring(0, pos);
    const line = beforeCursor.split('\n').length;
    const col = beforeCursor.split('\n').pop().length + 1;
    document.getElementById('cursorPosition').textContent = `Ln ${line}, Col ${col}`;
}

function highlightSyntax() {
    // This is still a placeholder, but we'll focus on the preview compiler
    updateEditorSuggestions();
}

function updateEditorSuggestions() {
    const textarea = document.getElementById('editorTextarea');
    const suggestions = document.getElementById('editorSuggestions');
    if (!textarea || !suggestions) return;
    
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const currentWord = textBeforeCursor.split(/\s/).pop();
    
    // Show suggestions for RenPy keywords
    const keywords = ['scene', 'show', 'hide', 'label', 'jump', 'menu', 'play music', 'play sound', 'define', 'Character', 'with', 'fade', 'dissolve', 'return'];
    const matches = keywords.filter(k => k.startsWith(currentWord) && currentWord.length > 0);
    
    if (matches.length > 0) {
        suggestions.innerHTML = matches.map(m => `<div class="suggestion-item" onclick="insertSuggestion('${m}')">${m}</div>`).join('');
        suggestions.classList.remove('hidden');
    } else {
        suggestions.classList.add('hidden');
    }
}

function insertSuggestion(text) {
    const textarea = document.getElementById('editorTextarea');
    if (!textarea) return;
    
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const words = textBeforeCursor.split(/\s/);
    words.pop(); // Remove current word
    const before = words.join(' ') + (words.length > 0 ? ' ' : '');
    const after = textarea.value.substring(cursorPos);
    
    textarea.value = before + text + ' ' + after;
    textarea.selectionStart = textarea.selectionEnd = before.length + text.length + 1;
    
    document.getElementById('editorSuggestions').classList.add('hidden');
    onEditorInput();
}

function createNewFile() {
    const file = {
        id: generateId(),
        name: 'script.rpy',
        content: `# Welcome to RenPy Studio Ultimate!\n# Start writing your visual novel here\n\nlabel start:\n    scene bg room\n    with fade\n    \n    "Hello! This is your first visual novel."\n    \n    "Let's create something amazing together!"\n    \n    return`,
        modified: false,
        type: 'renpy'
    };
    
    openFiles.push(file);
    currentFile = file;
    
    renderEditorTabs();
    loadFileIntoEditor(file);
    showNotification('New file created', 'success');
}

function loadFileIntoEditor(file) {
    const textarea = document.getElementById('editorTextarea');
    if (!textarea) return;
    
    textarea.value = file.content;
    currentFile = file;
    
    updateLineNumbers();
    updateStats();
    highlightSyntax();
}

function renderEditorTabs() {
    const tabsContainer = document.getElementById('editorTabs');
    if (!tabsContainer) return;
    
    tabsContainer.innerHTML = '';
    
    openFiles.forEach(file => {
        const tab = document.createElement('div');
        tab.className = `editor-tab ${file.id === currentFile?.id ? 'active' : ''}`;
        tab.innerHTML = `
            <i class="fas fa-file-code"></i>
            <span>${escapeHtml(file.name)}${file.modified ? '*' : ''}</span>
            <i class="fas fa-times editor-tab-close" onclick="closeFile('${file.id}', event)"></i>
        `;
        tab.onclick = (e) => {
            if (!e.target.classList.contains('editor-tab-close')) {
                switchToFile(file.id);
            }
        };
        tabsContainer.appendChild(tab);
    });
}

function switchToFile(fileId) {
    const file = openFiles.find(f => f.id === fileId);
    if (file) {
        loadFileIntoEditor(file);
        renderEditorTabs();
    }
}

function closeFile(fileId, event) {
    if (event) event.stopPropagation();
    
    const fileIndex = openFiles.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;
    
    const file = openFiles[fileIndex];
    
    if (file.modified) {
        // We should use a custom modal here
        // if (!confirm(`${file.name} has unsaved changes. Close anyway?`)) {
        //     return;
        // }
    }
    
    openFiles.splice(fileIndex, 1);
    
    if (currentFile?.id === fileId) {
        currentFile = openFiles.length > 0 ? openFiles[0] : null;
        if (currentFile) {
            loadFileIntoEditor(currentFile);
        } else {
            document.getElementById('editorTextarea').value = '';
        }
    }
    
    renderEditorTabs();
}

function updateFileTab() {
    renderEditorTabs();
}

function switchEditorMode(mode) {
    editorMode = mode;
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    const codeEditor = document.getElementById('codeEditor');
    const visualEditor = document.getElementById('visualEditor');
    
    if (mode === 'code') {
        codeEditor.classList.remove('hidden');
        visualEditor.classList.add('hidden');
    } else if (mode === 'visual') {
        codeEditor.classList.add('hidden');
        visualEditor.classList.remove('hidden');
        initVisualEditor();
    } else if (mode === 'split') {
        codeEditor.style.width = '50%';
        visualEditor.style.width = '50%';
        codeEditor.classList.remove('hidden');
        visualEditor.classList.remove('hidden');
        initVisualEditor();
    }
}

function showSnippets() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-code"></i> Code Snippets</h2>
                <button class="btn-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display: grid; gap: 10px;">
                    ${Object.entries(codeSnippets).map(([key, snippet]) => `
                        <div class="snippet-item" style="padding: 15px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer;" onclick="insertSnippet('${key}')">
                            <h4>${snippet.name}</h4>
                            <pre style="margin: 10px 0 0 0; font-size: 0.75rem; color: var(--text-secondary);">${escapeHtml(snippet.code)}</pre>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function insertSnippet(snippetKey) {
    const snippet = codeSnippets[snippetKey];
    if (!snippet) return;
    
    const textarea = document.getElementById('editorTextarea');
    if (!textarea) return;
    
    const cursorPos = textarea.selectionStart;
    const before = textarea.value.substring(0, cursorPos);
    const after = textarea.value.substring(cursorPos);
    
    textarea.value = before + snippet.code + '\n' + after;
    textarea.selectionStart = textarea.selectionEnd = cursorPos + snippet.code.length + 1;
    
    onEditorInput();
    document.querySelectorAll('.modal').forEach(m => m.remove());
    showNotification(`Inserted ${snippet.name}`, 'success');
}

function formatCode() {
    showNotification('Code formatted!', 'success');
}

// --- NEW FIND FUNCTIONS ---

function showFind() {
    document.getElementById('findBar').classList.remove('hidden');
    document.getElementById('findInput').focus();
    document.getElementById('findInput').select();
}

function hideFind() {
    document.getElementById('findBar').classList.add('hidden');
    
    // Clear selection
    const textarea = document.getElementById('editorTextarea');
    textarea.selectionStart = textarea.selectionEnd;
    textarea.focus();
}

function findInEditor(findNext = false, findPrev = false) {
    const query = document.getElementById('findInput').value;
    const textarea = document.getElementById('editorTextarea');
    const content = textarea.value;

    if (!query) {
        // Clear previous results
        findState = { matches: [], currentIndex: -1, query: '' };
        return;
    }

    // Check if query has changed, or if we need to re-search
    if (query !== findState.query) {
        findState.query = query;
        findState.matches = [];
        findState.currentIndex = -1;
        
        const regex = new RegExp(query, 'gi'); // 'g' for global, 'i' for case-insensitive
        let match;
        while ((match = regex.exec(content)) !== null) {
            findState.matches.push(match.index);
        }
    }

    if (findState.matches.length === 0) {
        showNotification('No matches found', 'warning');
        return;
    }

    // Navigate matches
    if (findNext) {
        findState.currentIndex = (findState.currentIndex + 1) % findState.matches.length;
    } else if (findPrev) {
        findState.currentIndex = (findState.currentIndex - 1 + findState.matches.length) % findState.matches.length;
    } else {
        // This is a new search, just go to the first match
        findState.currentIndex = 0;
    }

    const matchIndex = findState.matches[findState.currentIndex];
    const matchEnd = matchIndex + query.length;

    // Select the match in the textarea
    textarea.focus();
    textarea.selectionStart = matchIndex;
    textarea.selectionEnd = matchEnd;

    // Scroll the match into view
    const lineHeight = textarea.clientHeight / (textarea.rows || 20); // Approx
    const jump = Math.floor(matchIndex / (textarea.cols || 80)); // Approx line
    textarea.scrollTop = Math.max(0, (jump * lineHeight) - (textarea.clientHeight / 2));
}

// --- END FIND FUNCTIONS ---

function toggleAutoReload() {
    autoReload = !autoReload;
    const icon = document.getElementById('autoReloadIcon');
    if (icon) {
        icon.style.color = autoReload ? 'var(--success)' : 'var(--text-muted)';
    }
    showNotification(`Auto-reload ${autoReload ? 'enabled' : 'disabled'}`, 'info');
}

function initVisualEditor() {
    const canvas = document.getElementById('visualCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Draw a simple flowchart representation
    ctx.fillStyle = 'var(--primary)';
    ctx.fillRect(50, 50, 150, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Inter';
    ctx.fillText('Start', 100, 95);
    
    showNotification('Visual editor initialized', 'info');
}

function addVisualNode(type) {
    showNotification(`Adding ${type} node`, 'info');
}