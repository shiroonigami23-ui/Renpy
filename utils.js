// Utility Functions for RenPy Studio Ultimate

// Show notification
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format date
function formatDate(date) {
    if (!(date instanceof Date)) date = new Date(date);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Deep clone object
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Get from memory storage (using global variables instead of localStorage)
window.appData = window.appData || {
    profiles: [],
    currentProfile: null,
    projects: [],
    currentProject: null,
    settings: {},
    assets: [],
    characters: [],
    themes: []
};

function getStorageData(key) {
    return window.appData[key];
}

function setStorageData(key, value) {
    window.appData[key] = value;
}

// Modal helpers
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Parse RenPy command
function parseRenpyCommand(line) {
    line = line.trim();
    
    if (line.startsWith('#')) {
        return { type: 'comment', content: line };
    }
    
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
    
    if (line.startsWith('label ')) {
        return { type: 'label', name: line.substring(6).replace(':', '') };
    }
    
    if (line.startsWith('scene ')) {
        return { type: 'scene', image: line.substring(6) };
    }
    
    if (line.startsWith('show ')) {
        return { type: 'show', image: line.substring(5) };
    }
    
    if (line.startsWith('hide ')) {
        return { type: 'hide', image: line.substring(5) };
    }
    
    if (line.includes('"')) {
        const match = line.match(/^(\w+)\s+"(.+)"/);
        if (match) {
            return { type: 'dialogue', character: match[1], text: match[2] };
        }
        return { type: 'dialogue', character: 'narrator', text: line.replace(/"/g, '') };
    }
    
    if (line.startsWith('menu:')) {
        return { type: 'menu' };
    }
    
    if (line.startsWith('"')) {
        return { type: 'choice', text: line.replace(/"/g, '').replace(':', '') };
    }
    
    if (line.startsWith('$')) {
        return { type: 'python', code: line.substring(1).trim() };
    }
    
    if (line.startsWith('play music')) {
        return { type: 'music', file: line.substring(11).trim() };
    }
    
    if (line.startsWith('play sound')) {
        return { type: 'sound', file: line.substring(11).trim() };
    }
    
    if (line.startsWith('jump ')) {
        return { type: 'jump', label: line.substring(5) };
    }
    
    if (line.startsWith('return')) {
        return { type: 'return' };
    }
    
    return { type: 'text', content: line };
}

// Code snippets library
const codeSnippets = {
    dialogue: {
        name: 'Character Dialogue',
        code: 'character "Your dialogue here"'
    },
    scene: {
        name: 'Scene Change',
        code: 'scene background_name\nwith fade'
    },
    show: {
        name: 'Show Character',
        code: 'show character_name happy\nat center'
    },
    menu: {
        name: 'Choice Menu',
        code: 'menu:\n    "First choice":\n        jump choice1\n    "Second choice":\n        jump choice2'
    },
    label: {
        name: 'Label',
        code: 'label label_name:'
    },
    jump: {
        name: 'Jump to Label',
        code: 'jump label_name'
    },
    music: {
        name: 'Play Music',
        code: 'play music "audio/music.mp3" fadein 1.0'
    },
    sound: {
        name: 'Play Sound',
        code: 'play sound "audio/sound.mp3"'
    },
    variable: {
        name: 'Set Variable',
        code: '$ variable_name = value'
    },
    conditional: {
        name: 'If Statement',
        code: 'if variable_name:\n    "This happens if true"\nelse:\n    "This happens if false"'
    }
};

// Sample projects
const sampleProjects = [
    {
        id: 'sample1',
        name: 'Hello World',
        description: 'A simple introduction to RenPy',
        script: `# A simple Hello World visual novel\n\nlabel start:\n    scene bg room\n    with fade\n    \n    "Welcome to your first visual novel!"\n    \n    "This is how you create a simple story."\n    \n    return`
    },
    {
        id: 'sample2',
        name: 'Character Introduction',
        description: 'Learn about characters and dialogue',
        script: `# Character Introduction\n\ndefine e = Character("Eileen", color="#c8ffc8")\ndefine m = Character("Me", color="#c8c8ff")\n\nlabel start:\n    scene bg park\n    with fade\n    \n    show eileen happy\n    at center\n    \n    e "Hi! I'm Eileen, your guide in this visual novel world."\n    \n    m "Nice to meet you, Eileen!"\n    \n    e "Let's create something amazing together!"\n    \n    return`
    },
    {
        id: 'sample3',
        name: 'Choices Demo',
        description: 'Interactive story with choices',
        script: `# Choices Demo\n\nlabel start:\n    scene bg classroom\n    \n    "It's your first day at the new school."\n    \n    menu:\n        "What do you want to do?"\n        \n        "Introduce yourself":\n            jump introduce\n        \n        "Find a seat quietly":\n            jump quiet\n\nlabel introduce:\n    "You stand up and introduce yourself to the class."\n    "Everyone seems friendly!"\n    jump end\n\nlabel quiet:\n    "You quietly find a seat in the back."\n    "You prefer to observe first."\n    jump end\n\nlabel end:\n    "And so your adventure begins..."\n    return`
    }
];

// Default themes
const defaultThemes = [
    { id: 'purple', name: 'Dark Purple', primary: '#8b5cf6', bg: '#0f0a1e' },
    { id: 'blue', name: 'Ocean Blue', primary: '#0ea5e9', bg: '#0c1e2e' },
    { id: 'green', name: 'Forest Green', primary: '#10b981', bg: '#0a1e14' },
    { id: 'red', name: 'Sunset Red', primary: '#ef4444', bg: '#2e0c0c' },
    { id: 'black', name: 'Midnight Black', primary: '#6b7280', bg: '#000000' },
    { id: 'pink', name: 'Cotton Candy', primary: '#ec4899', bg: '#1e0a1e' },
    { id: 'neon', name: 'Cyberpunk Neon', primary: '#00ff00', bg: '#0a000a' },
    { id: 'vapor', name: 'Retro Vaporwave', primary: '#ff00ff', bg: '#1a0033' },
    { id: 'white', name: 'Minimal White', primary: '#3b82f6', bg: '#ffffff' },
    { id: 'contrast', name: 'High Contrast', primary: '#ffff00', bg: '#000000' }
];

// Tips for loading screen
const loadingTips = [
    "Tip: Use Ctrl+S to quickly save your project!",
    "Tip: The AI Assistant can help generate dialogue and scenes!",
    "Tip: Press F5 to run a preview of your visual novel.",
    "Tip: You can drag and drop assets into the asset manager.",
    "Tip: Use labels to create different story branches.",
    "Tip: Variables can store player choices and preferences.",
    "Tip: Check out the sample projects for inspiration!",
    "Tip: The visual editor helps you see your story flow.",
    "Tip: Customize themes to match your visual novel's mood.",
    "Tip: Auto-save keeps your work safe every 2 minutes."
];

function getRandomTip() {
    return loadingTips[Math.floor(Math.random() * loadingTips.length)];
}