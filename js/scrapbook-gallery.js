// Scrapbook-style scattered image gallery
class ScrapbookGallery {
    constructor(container, options = {}) {
        this.container = container;
        this.width = options.width || 800;
        this.height = options.height || 300;
        this.minSize = options.minSize || 80;
        this.maxSize = options.maxSize || 140;
        this.maxRotation = options.maxRotation || 7;
        this.overlap = options.overlap || 0; // No overlap
        this.images = [];
        this.placedImages = [];
    }

    async loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    src,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    aspectRatio: img.naturalWidth / img.naturalHeight
                });
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${src}`);
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });
    }

    async loadAllImages(imageSources) {
        console.log('Loading images for scrapbook...', imageSources);
        try {
            const promises = imageSources.map(src => this.loadImage(src));
            this.images = await Promise.all(promises);
            console.log('Images loaded:', this.images);
            return this.images;
        } catch (error) {
            console.error('Error loading images:', error);
            const results = await Promise.allSettled(imageSources.map(src => this.loadImage(src)));
            this.images = results
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);
            return this.images;
        }
    }

    // Generate random number within range
    random(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Generate random integer within range
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Check if two rectangles overlap too much
    checkOverlap(rect1, rect2, maxOverlap = this.overlap) {
        const dx = Math.abs(rect1.centerX - rect2.centerX);
        const dy = Math.abs(rect1.centerY - rect2.centerY);
        
        const minDistX = (rect1.width + rect2.width) * (0.5 - maxOverlap);
        const minDistY = (rect1.height + rect2.height) * (0.5 - maxOverlap);
        
        return dx < minDistX && dy < minDistY;
    }

    // Find a good position for an image
    findPosition(imageData, attempts = 50) {
        const size = this.random(this.minSize, this.maxSize);
        const width = size * imageData.aspectRatio;
        const height = size;
        
        // Ensure image fits within container bounds
        const maxX = this.width - width;
        const maxY = this.height - height;
        
        if (maxX < 0 || maxY < 0) {
            // Image too big, scale it down
            const scale = Math.min(this.width / width, this.height / height) * 0.8;
            return {
                x: this.random(0, this.width - width * scale),
                y: this.random(0, this.height - height * scale),
                width: width * scale,
                height: height * scale,
                centerX: 0, // Will be calculated later
                centerY: 0,
                rotation: this.random(-this.maxRotation, this.maxRotation),
                zIndex: this.randomInt(1, 100)
            };
        }

        for (let attempt = 0; attempt < attempts; attempt++) {
            const x = this.random(0, maxX);
            const y = this.random(0, maxY);
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            
            const newRect = {
                x,
                y,
                width,
                height,
                centerX,
                centerY,
                rotation: this.random(-this.maxRotation, this.maxRotation),
                zIndex: this.randomInt(1, 100)
            };
            
            // Check overlap with existing images
            let hasOverlap = false;
            for (const placed of this.placedImages) {
                if (this.checkOverlap(newRect, placed)) {
                    hasOverlap = true;
                    break;
                }
            }
            
            if (!hasOverlap) {
                return newRect;
            }
        }
        
        // If we couldn't find a non-overlapping position, just place it randomly
        // This creates a more natural scrapbook feel
        const x = this.random(0, maxX);
        const y = this.random(0, maxY);
        return {
            x,
            y,
            width,
            height,
            centerX: x + width / 2,
            centerY: y + height / 2,
            rotation: this.random(-this.maxRotation, this.maxRotation),
            zIndex: this.randomInt(1, 100)
        };
    }

    // Scatter images randomly across the canvas
    scatterImages() {
        console.log('Scattering images...');
        this.placedImages = [];
        
        // Shuffle images for random order
        const shuffledImages = [...this.images].sort(() => Math.random() - 0.5);
        
        shuffledImages.forEach((imageData, index) => {
            const position = this.findPosition(imageData);
            
            this.placedImages.push({
                ...imageData,
                ...position,
                index
            });
        });
        
        console.log(`Scattered ${this.placedImages.length} images`);
    }

    render() {
        this.container.innerHTML = '';
        this.container.style.cssText = `
            position: relative;
            width: ${this.width}px;
            height: ${this.height}px;
            overflow: hidden;
            margin: 0 auto;
        `;

        // Sort by z-index for proper layering
        const sortedImages = [...this.placedImages].sort((a, b) => a.zIndex - b.zIndex);

        sortedImages.forEach(image => {
            const img = document.createElement('img');
            img.src = image.src;
            img.alt = `Scattered illustration ${image.index + 1}`;
            img.style.cssText = `
                position: absolute;
                left: ${image.x}px;
                top: ${image.y}px;
                width: ${image.width}px;
                height: ${image.height}px;
                object-fit: cover;
                cursor: pointer;
                transform: rotate(${image.rotation}deg);
                z-index: ${image.zIndex};
                box-shadow: none;
            `;
            
            // Add hover effect for interactivity (instant, no animation)
            img.addEventListener('mouseenter', () => {
                img.style.transform = `rotate(${image.rotation}deg) scale(1.1)`;
                img.style.boxShadow = 'none';
                img.style.zIndex = '1000';
            });
            
            img.addEventListener('mouseleave', () => {
                img.style.transform = `rotate(${image.rotation}deg) scale(1)`;
                img.style.boxShadow = 'none';
                img.style.zIndex = image.zIndex;
            });
            
            // Add lightbox click handler
            img.addEventListener('click', () => this.showLightbox(image.src));
            this.container.appendChild(img);
        });
        
        console.log('Scrapbook gallery rendered');
    }

    showLightbox(src) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            cursor: pointer;
        `;
        
        const img = document.createElement('img');
        img.src = src;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
        `;
        
        modal.appendChild(img);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    async init(imageSources) {
        try {
            console.log('Initializing scrapbook gallery...');
            
            if (!this.container) {
                throw new Error('Container element not found');
            }

            // Show loading message
            this.container.innerHTML = '<p style="text-align: center; margin-top: 100px;">Creating scrapbook collage...</p>';

            // Load images
            await this.loadAllImages(imageSources);
            
            if (this.images.length === 0) {
                throw new Error('No images could be loaded');
            }

            // Scatter images
            this.scatterImages();
            
            // Render result
            this.render();

        } catch (error) {
            console.error('Error initializing scrapbook gallery:', error);
            this.container.innerHTML = `<p>Error loading gallery: ${error.message}</p>`;
        }
    }

    // Method to re-scatter images for a new random layout
    reshuffle() {
        this.scatterImages();
        this.render();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing scrapbook gallery...');
    
    const container = document.querySelector('.illustrations-grid');
    if (!container) {
        console.error('Gallery container not found');
        return;
    }

    // Dynamically get all image file paths in assets/img/illustrations

    // Function to dynamically fetch illustration images from the directory
    async function getIllustrationImages() {
        try {
            // Try to fetch the directory listing
            const response = await fetch('assets/img/illustrations/');
            if (response.ok) {
                const html = await response.text();
                
                // Parse HTML to extract image file links
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const links = doc.querySelectorAll('a[href]');
                
                const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
                const images = [];
                
                links.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && imageExtensions.some(ext => href.toLowerCase().endsWith(ext))) {
                        images.push(`assets/img/illustrations/${href}`);
                    }
                });
                
                return images;
            }
        } catch (error) {
            console.log('Could not fetch directory listing:', error);
        }
        
        // Fallback: try common image names or use global variable
        if (window.illustrationImages && Array.isArray(window.illustrationImages)) {
            return window.illustrationImages;
        }
        
        // Final fallback: try to get all <img> tags in the container
        const imgTags = container.querySelectorAll('img');
        return Array.from(imgTags).map(img => img.getAttribute('src')).filter(Boolean);
    }

    // Get images dynamically and initialize gallery
    getIllustrationImages().then(imageSources => {
        const gallery = new ScrapbookGallery(container, {
            width: 800,
            height: 600,
            minSize: 80,
            maxSize: 140,
            maxRotation: 10,
            overlap: 0
        });

        // Initialize gallery
        gallery.init(imageSources);
        
        // Optional: Add double-click to reshuffle
        container.addEventListener('dblclick', () => {
            gallery.reshuffle();
        });
    }).catch(error => {
        console.error('Failed to initialize gallery:', error);
        container.innerHTML = '<p>Error loading illustrations gallery</p>';
    });
});