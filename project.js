// Project Management

let currentProject = null;

function initProjects() {
    let projects = getStorageData('projects') || [];
    
    // Create welcome project if none exist
    if (projects.length === 0) {
        const welcomeProject = createWelcomeProject();
        projects.push(welcomeProject);
        setStorageData('projects', projects);
    }
}

function createWelcomeProject() {
    return {
        id: generateId(),
        name: 'Welcome Project',
        description: 'Your first RenPy project',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        files: [{
            id: generateId(),
            name: 'script.rpy',
            content: `# Welcome to RenPy Studio!
# This is a sample project to get you started.

# Define characters
define e = Character("Eileen", color="#c8ffc8")

# The game starts here, at the main menu.
label start:
    scene bg room
    with fade
    
    "Welcome to RenPy Studio Ultimate!"

    menu:
        "Start Tutorial":
            jump game_start
        "Options":
            jump options
        "Credits":
            jump credits

label game_start:
    scene bg park
    with dissolve
    
    show eileen happy
    at center
    
    e "Welcome to the tutorial!"
    e "This is a powerful visual novel development environment."
    e "You can use the menu to jump to different sections."
    
    jump start # Loop back to the main menu

label options:
    scene bg classroom
    with fade
    
    "This is the Options screen."
    "You could put settings like text speed or volume here."
    
    menu:
        "Back to Main Menu":
            jump start

label credits:
    scene bg room
    with fade
    
    "This game was made with RenPy Studio Ultimate!"
    "Credits:"
    " - You (The Creator)"
    
    menu:
        "Back to Main Menu":
            jump start
`,
            type: 'renpy',
            modified: false
        }],
        assets: [],
        characters: [],
        variables: {},
        settings: {}
    };
}

function createNewProject() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-folder-plus"></i> New Project</h2>
                <button class="btn-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <label class="form-label">Project Name</label>
                <input type="text" id="newProjectName" class="form-control" placeholder="My Visual Novel">
                
                <label class="form-label">Description</label>
                <textarea id="newProjectDesc" class="form-control" placeholder="A brief description of your project"></textarea>
                
                <div class="btn-group">
                    <button class="btn btn-primary" onclick="doCreateProject()">
                        <i class="fas fa-check"></i> Create
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function doCreateProject() {
    const name = document.getElementById('newProjectName').value.trim();
    const description = document.getElementById('newProjectDesc').value.trim();
    
    if (!name) {
        showNotification('Please enter a project name', 'error');
        return;
    }
    
    // This is the new, professional game menu template
    const newProjectContent = `# ${name}
# A new visual novel project.

# Define characters here
# define e = Character("Eileen", color="#c8ffc8")

# The game starts at the main menu.
label start:
    # You can show a main menu background here
    # scene bg main_menu
    with fade

    menu:
        "Start Game":
            jump game_start
        "Options":
            jump options
        "Credits":
            jump credits
        "Quit":
            jump quit

# The main game script
label game_start:
    scene bg room
    with fade
    
    "This is the beginning of your story."
    "Start writing here!"
    
    "..."
    
    jump start # Return to main menu when done

# The options screen
label options:
    # scene bg options_screen
    with fade
    
    "This is the options screen."
    "You can add preferences for text speed, volume, etc."
    
    menu:
        "Back to Main Menu":
            jump start

# The credits screen
label credits:
    # scene bg credits_screen
    with fade
    
    "This game was made by..."
    "[Your Name Here]"
    
    menu:
        "Back to Main Menu":
            jump start

# The quit label
label quit:
    scene black
    with fade
    
    "Thank you for playing."
    return
`;

    const project = {
        id: generateId(),
        name: name,
        description: description,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        files: [{
            id: generateId(),
            name: 'script.rpy',
            content: newProjectContent,
            type: 'renpy',
            modified: false
        }],
        assets: [],
        characters: [],
        variables: {},
        settings: {}
    };
    
    const projects = getStorageData('projects') || [];
    projects.push(project);
    setStorageData('projects', projects);
    
    loadProjectById(project.id);
    document.querySelectorAll('.modal').forEach(m => m.remove());
    showNotification('Project created successfully!', 'success');
}

function loadProject() {
    const projects = getStorageData('projects') || [];
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2><i class="fas fa-folder-open"></i> Load Project</h2>
                <button class="btn-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
                    ${projects.map(project => `
                        <div class="project-card" style="padding: 20px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 12px; cursor: pointer; transition: all 0.3s ease;" onclick="loadProjectById('${project.id}')" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border-color)'">
                            <h3 style="margin-bottom: 10px;">${escapeHtml(project.name)}</h3>
                            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 15px;">${escapeHtml(project.description || 'No description')}</p>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">
                                <div>Created: ${formatDate(project.createdAt)}</div>
                                <div>Modified: ${formatDate(project.modifiedAt)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${projects.length === 0 ? '<p style="text-align: center; color: var(--text-muted); padding: 40px;">No projects yet. Create your first project!</p>' : ''}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function loadProjectById(projectId) {
    const projects = getStorageData('projects') || [];
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
        showNotification('Project not found', 'error');
        return;
    }
    
    currentProject = project;
    setStorageData('currentProject', project);
    
    // Load project files
    openFiles = project.files || [];
    currentFile = openFiles[0] || null;
    
    // Update UI
    document.getElementById('projectNameDisplay').textContent = project.name;
    
    if (currentFile) {
        loadFileIntoEditor(currentFile);
    }
    
    renderEditorTabs();
    renderFileTree();
    renderAssets();
    renderCharacters();
    
    document.querySelectorAll('.modal').forEach(m => m.remove());
    showNotification(`Loaded project: ${project.name}`, 'success');
}

function saveProject() {
    if (!currentProject) {
        showNotification('No project loaded', 'error');
        return;
    }
    
    // Update project data
    currentProject.files = openFiles;
    currentProject.modifiedAt = new Date().toISOString();
    
    // Save to storage
    const projects = getStorageData('projects') || [];
    const index = projects.findIndex(p => p.id === currentProject.id);
    
    if (index !== -1) {
        projects[index] = currentProject;
    } else {
        projects.push(currentProject);
    }
    
    setStorageData('projects', projects);
    setStorageData('currentProject', currentProject);
    
    // Mark files as saved
    openFiles.forEach(file => file.modified = false);
    renderEditorTabs();
    
    showNotification('Project saved successfully!', 'success');
    document.getElementById('statusMessage').textContent = 'Saved';
}

function renderFileTree() {
    const fileTree = document.getElementById('fileTree');
    if (!fileTree) return;
    
    fileTree.innerHTML = '';
    
    openFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = `file-item ${file.id === currentFile?.id ? 'active' : ''}`;
        fileItem.innerHTML = `
            <i class="fas fa-file-code file-icon"></i>
            <span>${escapeHtml(file.name)}</span>
        `;
        fileItem.onclick = () => switchToFile(file.id);
        fileTree.appendChild(fileItem);
    });
}

function exportProject() {
    if (!currentProject) {
        showNotification('No project to export', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-download"></i> Export Project</h2>
                <button class="btn-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <h3 style="margin-bottom: 15px;">Select Export Format:</h3>
                <div style="display: grid; gap: 10px;">
                    <button class="btn btn-primary btn-block" onclick="doExport('html5')">
                        <i class="fas fa-globe"></i> HTML5 Web App
                    </button>
                    <button class="btn btn-primary btn-block" onclick="doExport('pwa')">
                        <i class="fas fa-mobile-alt"></i> Progressive Web App
                    </button>
                    <button class="btn btn-primary btn-block" onclick="doExport('apk')">
                        <i class="fab fa-android"></i> Android APK
                    </button>
                    <button class="btn btn-primary btn-block" onclick="doExport('exe')">
                        <i class.="fab fa-windows"></i> Windows EXE
                    </button>
                    <button class="btn btn-primary btn-block" onclick="doExport('zip')">
                        <i class="fas fa-file-archive"></i> Source Code (ZIP)
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function doExport(format) {
    showNotification(`Exporting as ${format.toUpperCase()}...`, 'info');
    
    setTimeout(() => {
        showNotification(`Export complete! (Demo mode - actual export coming soon)`, 'success');
        document.querySelectorAll('.modal').forEach(m => m.remove());
    }, 2000);
}

// This function creates a new project from AI-generated content
function createNewProjectWithContent(content, prompt) {
    // Truncate the prompt for the project name
    const projectName = "AI: " + (prompt.length > 25 ? prompt.substring(0, 25) + "..." : prompt);
    
    // We will now insert the AI content into the 'game_start' label
    // of our new professional template.
    
    const newProjectContent = `# ${projectName}
# AI-generated project based on: "${prompt}"

# Define characters here
# define e = Character("Eileen", color="#c8ffc8")

label start:
    scene bg main_menu_placeholder
    with fade

    menu:
        "Start Game":
            jump game_start
        "Options":
            jump options
        "Credits":
            jump credits
        "Quit":
            jump quit

label game_start:
    # --- AI Generated Content Below ---
    ${content}
    # --- End of AI Content ---
    
    jump start # Return to main menu when done

label options:
    scene bg options_placeholder
    with fade
    
    "This is the options screen."
    
    menu:
        "Back to Main Menu":
            jump start

label credits:
    scene bg credits_placeholder
    with fade
    
    "This game was made by..."
    "[Your Name Here]"
    "AI Assistant"
    
    menu:
        "Back to Main Menu":
            jump start

label quit:
    scene black
    with fade
    
    "Thank you for playing."
    return
`;
    
    const newProject = {
        id: generateId(),
        name: projectName,
        description: `AI-generated project based on: "${prompt}"`,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        files: [{
            id: generateId(),
            name: 'script.rpy',
            content: newProjectContent,
            type: 'renpy',
            modified: false
        }],
        assets: [],
        characters: [],
        variables: {},
        settings: {}
    };

    const projects = getStorageData('projects') || [];
    projects.push(newProject);
    setStorageData('projects', projects);
    
    // Load this new project into the editor
    loadProjectById(newProject.id); 
}