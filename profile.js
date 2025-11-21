// Profile Management

let currentProfile = null;

function initProfiles() {
    let profiles = getStorageData('profiles') || [];
    
    // Create default profile if none exist
    if (profiles.length === 0) {
        profiles = [{
            id: generateId(),
            name: 'Default User',
            avatar: '👤',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            settings: {}
        }];
        setStorageData('profiles', profiles);
    }
    
    displayProfiles(profiles);
}

function displayProfiles(profiles) {
    const profileList = document.getElementById('profileList');
    if (!profileList) return;
    
    profileList.innerHTML = '';
    
    profiles.forEach(profile => {
        const profileItem = document.createElement('div');
        profileItem.className = 'profile-item';
        profileItem.innerHTML = `
            <div class="profile-avatar">${profile.avatar}</div>
            <div class="profile-info">
                <div class="profile-name">${escapeHtml(profile.name)}</div>
                <div class="profile-date">Last login: ${formatDate(profile.lastLogin)}</div>
            </div>
        `;
        profileItem.onclick = () => selectProfile(profile);
        profileList.appendChild(profileItem);
    });
}

function showCreateProfile() {
    document.getElementById('createProfileSection').classList.remove('hidden');
}

function hideCreateProfile() {
    document.getElementById('createProfileSection').classList.add('hidden');
    document.getElementById('profileName').value = '';
    document.getElementById('profileAvatar').value = '';
}

function createProfile() {
    const name = document.getElementById('profileName').value.trim();
    const avatar = document.getElementById('profileAvatar').value.trim() || '👤';
    
    if (!name) {
        showNotification('Please enter a name', 'error');
        return;
    }
    
    const profiles = getStorageData('profiles') || [];
    const newProfile = {
        id: generateId(),
        name: name,
        avatar: avatar,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        settings: {
            autoSave: true,
            lineNumbers: true,
            syntaxHighlight: true,
            fontSize: 14,
            autoReload: true,
            showDebug: false,
            highContrast: false,
            dyslexicFont: false
        }
    };
    
    profiles.push(newProfile);
    setStorageData('profiles', profiles);
    
    hideCreateProfile();
    displayProfiles(profiles);
    showNotification('Profile created successfully!', 'success');
}

function selectProfile(profile) {
    profile.lastLogin = new Date().toISOString();
    currentProfile = profile;
    setStorageData('currentProfile', profile);
    
    const profiles = getStorageData('profiles') || [];
    const index = profiles.findIndex(p => p.id === profile.id);
    if (index !== -1) {
        profiles[index] = profile;
        setStorageData('profiles', profiles);
    }
    
    // Update UI
    document.getElementById('currentUserName').textContent = profile.name;
    document.getElementById('userAvatar').textContent = profile.avatar;
    
    // Close profile modal and show main menu
    closeModal('profileModal');
    showMainMenu();
    
    showNotification(`Welcome back, ${profile.name}!`, 'success');
}

function showProfileMenu() {
    // Show profile options
    const menu = document.createElement('div');
    menu.className = 'modal active';
    menu.innerHTML = `
        <div class="modal-content" style="max-width: 300px;">
            <div class="modal-header">
                <h2>Profile</h2>
                <button class="btn-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 4rem;">${currentProfile.avatar}</div>
                    <h3>${escapeHtml(currentProfile.name)}</h3>
                    <p style="font-size: 0.875rem; color: var(--text-muted);">Member since ${formatDate(currentProfile.createdAt)}</p>
                </div>
                <button class="btn btn-secondary btn-block" onclick="switchProfile()">Switch Profile</button>
                <button class="btn btn-secondary btn-block" onclick="editProfile()">Edit Profile</button>
                <button class="btn btn-secondary btn-block" onclick="logOut()">Log Out</button>
            </div>
        </div>
    `;
    document.body.appendChild(menu);
}

function switchProfile() {
    document.querySelectorAll('.modal').forEach(m => m.remove());
    openModal('profileModal');
    initProfiles();
}

function editProfile() {
    showNotification('Profile editing coming soon!', 'info');
}

function logOut() {
    currentProfile = null;
    setStorageData('currentProfile', null);
    document.querySelectorAll('.modal').forEach(m => m.remove());
    hideIDE();
    hideMainMenu();
    openModal('profileModal');
    initProfiles();
    showNotification('Logged out successfully', 'success');
}