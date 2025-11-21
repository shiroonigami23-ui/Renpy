// Asset Management

function uploadAsset() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,audio/*,video/*';
    input.onchange = handleAssetUpload;
    input.click();
}

function handleAssetUpload(event) {
    const files = event.target.files;
    if (!files.length) return;
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const asset = {
                id: generateId(),
                name: file.name,
                type: getAssetType(file.type),
                data: e.target.result,
                size: file.size,
                uploadedAt: new Date().toISOString()
            };
            
            if (currentProject) {
                currentProject.assets = currentProject.assets || [];
                currentProject.assets.push(asset);
                saveProject();
            }
            
            renderAssets();
            showNotification(`Uploaded ${file.name}`, 'success');
        };
        reader.readAsDataURL(file);
    });
}

function getAssetType(mimeType) {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    return 'other';
}

function renderAssets() {
    const assetGrid = document.getElementById('assetGrid');
    if (!assetGrid) return;
    
    const assets = currentProject?.assets || [];
    const currentFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    
    const filtered = currentFilter === 'all' ? assets : assets.filter(a => a.type === currentFilter);
    
    assetGrid.innerHTML = '';
    
    if (filtered.length === 0) {
        assetGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px;">No assets yet. Upload some!</p>';
        return;
    }
    
    filtered.forEach(asset => {
        const assetItem = document.createElement('div');
        assetItem.className = 'asset-item';
        assetItem.title = asset.name;
        
        if (asset.type === 'images') {
            assetItem.innerHTML = `<img src="${asset.data}" alt="${escapeHtml(asset.name)}">`;
        } else if (asset.type === 'audio') {
            assetItem.innerHTML = '<i class="fas fa-music"></i>';
        } else if (asset.type === 'video') {
            assetItem.innerHTML = '<i class="fas fa-video"></i>';
        } else {
            assetItem.innerHTML = '<i class="fas fa-file"></i>';
        }
        
        assetItem.onclick = () => showAssetDetails(asset);
        assetGrid.appendChild(assetItem);
    });
}

function filterAssets(filter) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderAssets();
}

function showAssetDetails(asset) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-image"></i> ${escapeHtml(asset.name)}</h2>
                <button class="btn-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                ${asset.type === 'images' ? `<img src="${asset.data}" style="max-width: 100%; border-radius: 8px; margin-bottom: 15px;">` : ''}
                ${asset.type === 'audio' ? `<audio src="${asset.data}" controls style="width: 100%; margin-bottom: 15px;"></audio>` : ''}
                ${asset.type === 'video' ? `<video src="${asset.data}" controls style="max-width: 100%; border-radius: 8px; margin-bottom: 15px;"></video>` : ''}
                
                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                    <p>Type: ${asset.type}</p>
                    <p>Size: ${formatFileSize(asset.size)}</p>
                    <p>Uploaded: ${formatDate(asset.uploadedAt)}</p>
                </div>
                
                <div class="btn-group" style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="insertAssetReference('${asset.name}')">
                        <i class="fas fa-plus"></i> Insert Reference
                    </button>
                    <button class="btn btn-secondary" onclick="deleteAsset('${asset.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function insertAssetReference(assetName) {
    const textarea = document.getElementById('editorTextarea');
    if (!textarea) return;
    
    const reference = `"assets/${assetName}"`;
    const cursorPos = textarea.selectionStart;
    const before = textarea.value.substring(0, cursorPos);
    const after = textarea.value.substring(cursorPos);
    
    textarea.value = before + reference + after;
    textarea.selectionStart = textarea.selectionEnd = cursorPos + reference.length;
    
    onEditorInput();
    document.querySelectorAll('.modal').forEach(m => m.remove());
    showNotification('Asset reference inserted', 'success');
}

function deleteAsset(assetId) {
    if (!confirm('Delete this asset?')) return;
    
    if (currentProject) {
        currentProject.assets = currentProject.assets.filter(a => a.id !== assetId);
        saveProject();
        renderAssets();
    }
    
    document.querySelectorAll('.modal').forEach(m => m.remove());
    showNotification('Asset deleted', 'success');
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function createCharacter() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-user-plus"></i> Create Character</h2>
                <button class="btn-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <label class="form-label">Character Name</label>
                <input type="text" id="charName" class="form-control" placeholder="Alice">
                
                <label class="form-label">Display Color</label>
                <input type="color" id="charColor" class="form-control" value="#8b5cf6">
                
                <label class="form-label">Avatar Emoji</label>
                <input type="text" id="charAvatar" class="form-control" placeholder="👩" maxlength="2">
                
                <label class="form-label">Description</label>
                <textarea id="charDesc" class="form-control" placeholder="Character background and personality"></textarea>
                
                <div class="btn-group">
                    <button class="btn btn-primary" onclick="doCreateCharacter()">
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

function doCreateCharacter() {
    const name = document.getElementById('charName').value.trim();
    const color = document.getElementById('charColor').value;
    const avatar = document.getElementById('charAvatar').value.trim() || '👤';
    const description = document.getElementById('charDesc').value.trim();
    
    if (!name) {
        showNotification('Please enter a character name', 'error');
        return;
    }
    
    const character = {
        id: generateId(),
        name: name,
        color: color,
        avatar: avatar,
        description: description,
        createdAt: new Date().toISOString()
    };
    
    if (currentProject) {
        currentProject.characters = currentProject.characters || [];
        currentProject.characters.push(character);
        saveProject();
    }
    
    renderCharacters();
    document.querySelectorAll('.modal').forEach(m => m.remove());
    showNotification(`Character ${name} created!`, 'success');
}

function renderCharacters() {
    const characterList = document.getElementById('characterList');
    if (!characterList) return;
    
    const characters = currentProject?.characters || [];
    
    characterList.innerHTML = '';
    
    if (characters.length === 0) {
        characterList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No characters yet. Create one!</p>';
        return;
    }
    
    characters.forEach(char => {
        const charItem = document.createElement('div');
        charItem.className = 'character-item';
        charItem.innerHTML = `
            <div class="character-avatar" style="background: ${char.color};">${char.avatar}</div>
            <div style="flex: 1;">
                <div class="character-name">${escapeHtml(char.name)}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(char.description || 'No description')}</div>
            </div>
        `;
        charItem.onclick = () => insertCharacterReference(char.name);
        characterList.appendChild(charItem);
    });
}

function insertCharacterReference(charName) {
    const textarea = document.getElementById('editorTextarea');
    if (!textarea) return;
    
    const reference = `${charName} "`;
    const cursorPos = textarea.selectionStart;
    const before = textarea.value.substring(0, cursorPos);
    const after = textarea.value.substring(cursorPos);
    
    textarea.value = before + reference + after;
    textarea.selectionStart = textarea.selectionEnd = cursorPos + reference.length;
    
    onEditorInput();
    showNotification(`Inserted ${charName}`, 'success');
}

// --- NEW VARIABLE FUNCTIONS ---

/**
 * Renders the list of variables from previewState into the UI.
 */
function renderVariables() {
    const variableList = document.getElementById('variableList');
    if (!variableList) return;

    const variables = previewState?.variables || {};
    const varNames = Object.keys(variables);

    if (varNames.length === 0) {
        variableList.innerHTML = '<div class="variable-item-empty">No game variables defined yet.</div>';
        return;
    }

    variableList.innerHTML = varNames.map(key => `
        <div class="variable-item">
            <span class="variable-key">${escapeHtml(key)}</span>
            <span class="variable-value">${escapeHtml(JSON.stringify(variables[key]))}</span>
            <button class="btn-icon btn-sm variable-delete" onclick="deleteVariable('${key}')" title="Delete Variable">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

/**
 * Adds a new variable from the UI.
 */
function doAddVariable() {
    const nameInput = document.getElementById('variableName');
    const valueInput = document.getElementById('variableValue');
    
    const name = nameInput.value.trim();
    let value = valueInput.value.trim();
    
    if (!name) {
        showNotification('Please enter a variable name', 'error');
        return;
    }
    
    // Try to auto-parse value
    try {
        // If it's not a string, parse it as JSON (for numbers, booleans)
        if (!value.startsWith('"') && !value.startsWith("'")) {
            value = JSON.parse(value);
        } else {
            // It's a string, just remove quotes
            value = value.replace(/^['"]|['"]$/g, '');
        }
    } catch (e) {
        // Not valid JSON, treat as a plain string
        value = value.replace(/^['"]|['"]$/g, '');
    }
    
    // Update the state
    if (previewState) {
        previewState.variables[name] = value;
    } else {
        // Fallback if preview isn't running
        currentProject.variables = currentProject.variables || {};
        currentProject.variables[name] = value;
    }
    
    // Update the UI
    renderVariables();
    
    // Clear inputs
    nameInput.value = '';
    valueInput.value = '';
    
    showNotification(`Variable '${name}' added.`, 'success');
}

/**
 * Deletes a variable.
 */
function deleteVariable(key) {
    if (previewState && previewState.variables.hasOwnProperty(key)) {
        delete previewState.variables[key];
        renderVariables();
        showNotification(`Variable '${key}' deleted.`, 'success');
    }
}