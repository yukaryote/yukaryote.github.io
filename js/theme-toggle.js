// Dark mode theme toggle functionality
function toggleTheme() {
    const body = document.body;
    const button = document.querySelector('.theme-toggle');
    
    // Get current theme
    const currentTheme = body.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        // Switch to light mode
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        button.textContent = '🌙';
    } else {
        // Switch to dark mode
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        button.textContent = '☀️';
    }
}

// Initialize theme on page load
function initializeTheme() {
    const body = document.body;
    const button = document.querySelector('.theme-toggle');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    
    // Check system preference if no saved theme
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        body.setAttribute('data-theme', 'dark');
        button.textContent = '☀️';
    } else {
        body.removeAttribute('data-theme');
        button.textContent = '🌙';
    }
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        if (e.matches) {
            document.body.setAttribute('data-theme', 'dark');
            document.querySelector('.theme-toggle').textContent = '☀️';
        } else {
            document.body.removeAttribute('data-theme');
            document.querySelector('.theme-toggle').textContent = '🌙';
        }
    }
});

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTheme);