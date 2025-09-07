// Simple gallery and UI enhancements
document.addEventListener('DOMContentLoaded', function() {
    // Add simple image lightbox functionality for art/project images
    const images = document.querySelectorAll('.project-content img, .tile img');
    
    images.forEach(img => {
        img.addEventListener('click', function(e) {
            // Simple fullscreen view
            if (e.target.tagName === 'IMG' && !e.target.closest('.tile')) {
                const modal = document.createElement('div');
                modal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    cursor: pointer;
                `;
                
                const modalImg = document.createElement('img');
                modalImg.src = e.target.src;
                modalImg.style.cssText = `
                    max-width: 90%;
                    max-height: 90%;
                    object-fit: contain;
                `;
                
                modal.appendChild(modalImg);
                document.body.appendChild(modal);
                
                modal.addEventListener('click', () => {
                    document.body.removeChild(modal);
                });
            }
        });
    });

    // Add smooth scrolling to anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Add simple mobile menu toggle if needed
    const nav = document.querySelector('nav ul');
    if (window.innerWidth <= 600 && nav) {
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Menu';
        toggleButton.style.cssText = `
            display: block;
            margin-bottom: 1em;
            padding: 0.5em;
            border: thin solid gray;
            background: white;
            cursor: pointer;
        `;
        
        nav.parentNode.insertBefore(toggleButton, nav);
        nav.style.display = 'none';
        
        toggleButton.addEventListener('click', () => {
            nav.style.display = nav.style.display === 'none' ? 'block' : 'none';
        });
    }
});