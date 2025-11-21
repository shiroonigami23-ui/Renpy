// Theme Management

function initThemes() {
    setStorageData('themes', defaultThemes);
}

function showThemes() {
    openModal('themeModal');
    displayThemes();
}

function displayThemes() {
    const themeGrid = document.getElementById('themeGrid');
    if (!themeGrid) return;
    
    const themes = getStorageData('themes') || defaultThemes;
    const currentTheme = getStorageData('currentTheme') || 'purple';
    
    themeGrid.innerHTML = '';
    
    themes.forEach(theme => {
        const themeCard = document.createElement('div');
        themeCard.className = `theme-card ${theme.id === currentTheme ? 'active' : ''}`;
        themeCard.innerHTML = `
            <div class="theme-preview" style="background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.bg} 100%);"></div>
            <h4>${theme.name}</h4>
        `;
        themeCard.onclick = () => applyTheme(theme);
        themeGrid.appendChild(themeCard);
    });
}

function applyTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--bg-primary', theme.bg);
    
    // Calculate variations
    const primaryRgb = hexToRgb(theme.primary);
    const darkerPrimary = adjustColor(theme.primary, -20);
    const lighterPrimary = adjustColor(theme.primary, 20);
    
    root.style.setProperty('--primary-dark', darkerPrimary);
    root.style.setProperty('--primary-light', lighterPrimary);
    
    // Store theme preference
    setStorageData('currentTheme', theme.id);
    
    displayThemes();
    showNotification(`Theme changed to ${theme.name}`, 'success');
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function adjustColor(hex, percent) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    
    const adjust = (value) => {
        const adjusted = Math.round(value + (value * percent / 100));
        return Math.max(0, Math.min(255, adjusted));
    };
    
    const r = adjust(rgb.r);
    const g = adjust(rgb.g);
    const b = adjust(rgb.b);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function toggleThemeEditor() {
    showNotification('Custom theme editor coming soon!', 'info');
}