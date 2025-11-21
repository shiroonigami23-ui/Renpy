// Main Application Controller

let appInitialized = false;

// Initialize the app on load
window.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    showLoadingScreen();
    
    // Initialize all subsystems
    setTimeout(() => {
        initThemes();
        initProfiles();
        initProjects();
        
        // Show profile modal after loading
        setTimeout(() => {
            hideLoadingScreen();
            openModal('profileModal');
        }, 1000);
    }, 1500);
    
    appInitialized = true;
}

function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingTip = document.querySelector('.loading-tip');
    const progressBar = document.getElementById('loadingProgress');
    
    if (loadingScreen) {
        loadingScreen.classList.add('active');
    }
    
    if (loadingTip) {
        loadingTip.textContent = getRandomTip();
    }
    
    // Animate progress bar
    if (progressBar) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressBar.style.width = progress + '%';
        }, 200);
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.remove('active');
    }
}

function showMainMenu() {
    const mainMenu = document.getElementById('mainMenu');
    if (mainMenu) {
        mainMenu.classList.remove('hidden');
        mainMenu.classList.add('active');
    }
}

function hideMainMenu() {
    const mainMenu = document.getElementById('mainMenu');
    if (mainMenu) {
        mainMenu.classList.remove('active');
        setTimeout(() => mainMenu.classList.add('hidden'), 500);
    }
}

function startIDE() {
    hideMainMenu();
    showIDE();
}

function showIDE() {
    const ideWorkspace = document.getElementById('ideWorkspace');
    if (ideWorkspace) {
        ideWorkspace.classList.remove('hidden');
        ideWorkspace.classList.add('active');
    }
    
    // Initialize IDE components
    initEditor();
    
    // Load current or create new project
    const savedProject = getStorageData('currentProject');
    if (savedProject) {
        loadProjectById(savedProject.id);
    } else {
        const projects = getStorageData('projects') || [];
        if (projects.length > 0) {
            loadProjectById(projects[0].id);
        } else {
            // This function is in project.js
            doCreateProject(true); // Create a welcome project
        }
    }
}

function hideIDE() {
    const ideWorkspace = document.getElementById('ideWorkspace');
    if (ideWorkspace) {
        ideWorkspace.classList.remove('active');
        setTimeout(() => ideWorkspace.classList.add('hidden'), 500);
    }
}

function toggleMenu() {
    hideIDE();
    showMainMenu();
}

// REMOVED showOptions() as it was redundant

function showSettings() {
    openModal('settingsModal');
    loadSettings();
}

function loadSettings() {
    const settings = currentProfile?.settings || {};
    
    document.getElementById('settingAutoSave').checked = settings.autoSave !== false;
    document.getElementById('settingLineNumbers').checked = settings.lineNumbers !== false;
    document.getElementById('settingSyntaxHighlight').checked = settings.syntaxHighlight !== false;
    document.getElementById('settingFontSize').value = settings.fontSize || 14;
    document.getElementById('fontSizeValue').textContent = (settings.fontSize || 14) + 'px';
    document.getElementById('settingAutoReload').checked = settings.autoReload !== false;
    document.getElementById('settingShowDebug').checked = settings.showDebug || false;
    document.getElementById('settingHighContrast').checked = settings.highContrast || false;
    document.getElementById('settingDyslexicFont').checked = settings.dyslexicFont || false;
}

function updateSettings() {
    if (!currentProfile) return;
    
    currentProfile.settings = {
        autoSave: document.getElementById('settingAutoSave').checked,
        lineNumbers: document.getElementById('settingLineNumbers').checked,
        syntaxHighlight: document.getElementById('settingSyntaxHighlight').checked,
        fontSize: parseInt(document.getElementById('settingFontSize').value),
        autoReload: document.getElementById('settingAutoReload').checked,
        showDebug: document.getElementById('settingShowDebug').checked,
        highContrast: document.getElementById('settingHighContrast').checked,
        dyslexicFont: document.getElementById('settingDyslexicFont').checked
    };
    
    // Update font size display
    document.getElementById('fontSizeValue').textContent = currentProfile.settings.fontSize + 'px';
    
    // Apply settings
    const textarea = document.getElementById('editorTextarea');
    if (textarea) {
        textarea.style.fontSize = currentProfile.settings.fontSize + 'px';
    }
    
    // Save profile
    const profiles = getStorageData('profiles') || [];
    const index = profiles.findIndex(p => p.id === currentProfile.id);
    if (index !== -1) {
        profiles[index] = currentProfile;
        setStorageData('profiles', profiles);
    }
    
    showNotification('Settings updated', 'success');
}

function showTutorial() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2><i class="fas fa-graduation-cap"></i> Tutorial</h2>
                <button class="btn-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <h3>Welcome to RenPy Studio Ultimate!</h3>
                <p>Here's a quick guide to get you started:</p>
                
                <h4>1. Creating Your First Project</h4>
                <p>Click "Start Creating" from the main menu to enter the IDE. A new project with a functional menu will be created for you.</p>
                
                <h4>2. Writing Your Story</h4>
                <p>Edit the <code>label game_start:</code> section in <code>script.rpy</code> to write your story. The syntax is simple:</p>
                <pre style="background: var(--bg-primary); padding: 10px; border-radius: 8px; margin: 10px 0;">label game_start:\n    scene bg room\n    "Hello, world!"\n    jump main_menu</pre>
                
                <h4>3. Adding Assets</h4>
                <p>Click the menu icon (top-left) to open the sidebar, then click the "Assets" tab. Upload images, audio, and video files for your visual novel.</p>
                
                <h4>4. Using the AI Assistant</h4>
                <p>Click the robot icon to open the AI assistant. It can help you generate dialogue, scenes, and characters. It can append to your file or create a new project.</p>
                
                <h4>5. Preview Your Game</h4>
                <p>Click the "Run" button to see your visual novel in action in the preview panel. This will run your game starting from <code>label start</code>.</p>
                
                <h4>6. Saving & Exporting</h4>
                <p>Use Ctrl+S to save your project. When ready, export it to various formats for distribution.</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function loadSampleProject() {
    // This function is in project.js
    doCreateProject(true); // true = force welcome project
    showNotification(`Loaded Welcome Project`, 'success');
}

function showAbout() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-info-circle"></i> About</h2>
                <button class="btn-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 20px;"><i class="fas fa-book-open"></i></div>
                <h3>RenPy Studio Ultimate</h3>
                <p style="font-size: 1.25rem; color: var(--primary);">Version 3.0</p>
                <p style="margin: 20px 0;">A powerful visual novel development environment with AI-powered features, advanced editing tools, and comprehensive asset management.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                    <h4>Features:</h4>
                    <ul style="text-align: left; margin: 15px 0;">
                        <li>Advanced Code Editor with Find</li>
                        <li>Collapsible "Focus Mode"</li>
                        <li>AI Writing Assistant</li>
                        <li>Real-time Script Interpreter</li>
                        <li>Asset & Character Management</li>
                        <li>Game Variable Management</li>
                    </ul>
                </div>
                
                <p style="margin-top: 20px; font-size: 0.875rem; color: var(--text-muted);">Made with ❤️ for visual novel creators</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function showHelp() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2><i class="fas fa-question-circle"></i> Help & Documentation</h2>
                <button class="btn-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <h3>Keyboard Shortcuts</h3>
                <table style="width: 100%; margin-bottom: 20px; font-size: 0.875rem;">
                    <tr><td><code>Ctrl+S</code></td><td>Save Project</td></tr>
                    <tr><td><code>F5</code></td><td>Run Preview</td></tr>
                    <tr><td><code>Ctrl+F</code></td><td>Find</td></tr>
                    <tr><td><code>Tab</code></td><td>Indent</td></tr>
                </table>
                
                <h3>RenPy Basics</h3>
                <p>Learn the fundamentals of RenPy scripting:</p>
                <ul>
                    <li><strong>Labels:</strong> <code>label start:</code> - Define story points</li>
                    <li><strong>Dialogue:</strong> <code>"Text here"</code> - Show narrator text</li>
                    <li><strong>Character:</strong> <code>character "Dialogue"</code> - Character speech</li>
                    <li><strong>Scenes:</strong> <code>scene bg name</code> - Change background</li>
                    <li><strong>Show:</strong> <code>show character happy</code> - Display character</li>
                    <li><strong>Menu:</strong> <code>menu:</code> - Create choices</li>
                    <li><strong>Jump:</strong> <code>jump label_name</code> - Jump to a label</li>
                </ul>
                
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="showTutorial(); this.closest('.modal').remove()">
                        <i class="fas fa-graduation-cap"></i> View Tutorial
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// --- NEW Sidebar Toggle Functions ---

function toggleLeftSidebar() {
    const sidebar = document.querySelector('.left-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
        sidebar.classList.toggle('collapsed');
        resizeEditor();
    }
}

function toggleRightSidebar() {
    const sidebar = document.querySelector('.right-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
        sidebar.classList.toggle('collapsed');
        resizeEditor();
    }
}

function resizeEditor() {
    const center = document.querySelector('.ide-center');
    const leftCollapsed = document.querySelector('.left-sidebar')?.classList.contains('collapsed');
    const rightCollapsed = document.querySelector('.right-sidebar')?.classList.contains('collapsed');
    
    if (!center) return;

    center.classList.toggle('full-width-left', leftCollapsed);
    center.classList.toggle('full-width-right', rightCollapsed);
}

function switchSidebarTab(tab) {
    // Open sidebar if it's collapsed
    const sidebar = document.querySelector('.left-sidebar');
    if (sidebar && (sidebar.classList.contains('collapsed') || !sidebar.classList.contains('active'))) {
        sidebar.classList.add('active');
        sidebar.classList.remove('collapsed');
        resizeEditor();
    }

    // Left sidebar tabs
    document.querySelectorAll('.left-sidebar .sidebar-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    
    document.getElementById('filesTab').classList.toggle('hidden', tab !== 'files');
    document.getElementById('assetsTab').classList.toggle('hidden', tab !== 'assets');
    document.getElementById('charactersTab').classList.toggle('hidden', tab !== 'characters');
}

function switchRightTab(tab) {
    // Open sidebar if it's collapsed
    const sidebar = document.querySelector('.right-sidebar');
    if (sidebar && (sidebar.classList.contains('collapsed') || !sidebar.classList.contains('active'))) {
        sidebar.classList.add('active');
        sidebar.classList.remove('collapsed');
        resizeEditor();
    }

    // Right sidebar tabs
    document.querySelectorAll('.right-sidebar .sidebar-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    
    document.getElementById('previewTab').classList.toggle('hidden', tab !== 'preview');
    document.getElementById('aiTab').classList.toggle('hidden', tab !== 'ai');
    document.getElementById('variablesTab').classList.toggle('hidden', tab !== 'variables');
}

// --- End of Sidebar Functions ---


// Auto-save functionality
setInterval(() => {
    if (currentProfile?.settings?.autoSave && currentProject && openFiles.some(f => f.modified)) {
        saveProject();
        console.log('Auto-saved project');
    }
}, 120000); // Every 2 minutes

/**
 * Toggles the preview window between normal and maximized state.
 */
function maximizePreview() {
    const mainContent = document.getElementById('ideMain');
    const rightSidebar = document.getElementById('rightSidebar');
    const previewTab = document.getElementById('previewTab');
    const icon = document.getElementById('maximizePreviewIcon');

    // Check if the sidebar is already maximized
    const isMaximized = rightSidebar.classList.contains('maximized');

    if (isMaximized) {
        // Restore
        mainContent.classList.remove('preview-maximized');
        rightSidebar.classList.remove('maximized');
        previewTab.classList.remove('maximized');
        icon.classList.remove('fa-compress-alt');
        icon.classList.add('fa-expand-alt');
    } else {
        // Maximize
        mainContent.classList.add('preview-maximized');
        rightSidebar.classList.add('maximized');
        previewTab.classList.add('maximized');
        icon.classList.remove('fa-expand-alt');
        icon.classList.add('fa-compress-alt');
        
        // Also ensure the right sidebar is visible
        if (rightSidebar.classList.contains('collapsed')) {
            toggleRightSidebar();
        }
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Global shortcuts
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        createNewProject();
    }
    
    if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        loadProject();
    }
});

// Prevent accidental page close
window.addEventListener('beforeunload', (e) => {
    if (openFiles.some(f => f.modified)) {
        e.preventDefault();
        e.returnValue = '';
    }
});

console.log('%cRenPy Studio Ultimate v3.0', 'font-size: 20px; font-weight: bold; color: #8b5cf6;');
console.log('%cReady to create amazing visual novels!', 'font-size: 14px; color: #ec4899;');

// Easter egg - Konami code
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join(',') === konamiSequence.join(',')) {
        showNotification('🎉 Konami Code Activated! You\'re a true creator!', 'success');
        document.body.style.animation = 'rainbow 5s linear infinite';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 5000);
    }
});

const rainbowStyle = document.createElement('style');
rainbowStyle.textContent = `
    @keyframes rainbow {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
    }
`;
document.head.appendChild(rainbowStyle);