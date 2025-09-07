// Simple BibTeX parser for publications
class BibtexParser {
    static parse(bibtexString) {
        const entries = [];
        const entryRegex = /@(\w+)\{([^,]+),\s*([\s\S]*?)\n\}/g;
        let match;

        while ((match = entryRegex.exec(bibtexString)) !== null) {
            const [, type, key, content] = match;
            const fields = this.parseFields(content);
            
            entries.push({
                type: type.toLowerCase(),
                key: key.trim(),
                ...fields
            });
        }

        return entries;
    }

    static parseFields(content) {
        const fields = {};
        const fieldRegex = /(\w+)\s*=\s*\{([^}]*)\}/g;
        let match;

        while ((match = fieldRegex.exec(content)) !== null) {
            const [, field, value] = match;
            fields[field.toLowerCase()] = value.trim();
        }

        return fields;
    }

    static renderPublication(pub) {
        const previewImg = pub.preview ? 
            `<img src="assets/img/publication_preview/${pub.preview}" alt="${pub.title}">` : '';
        
        const links = [];
        if (pub.html) links.push(`<a href="${pub.html}">Project page</a>`);
        if (pub.arxiv) links.push(`<a href="${pub.arxiv}">arXiv</a>`);
        if (pub.pdf) links.push(`<a href="assets/pdf/${pub.pdf}">PDF</a>`);
        
        const linkString = links.length > 0 ? `<br>${links.join(' | ')}` : '';

        return `
            <div class="publication">
                ${previewImg}
                <div class="publication-content">
                    <strong>${pub.title}</strong><br>
                    <em>${pub.author}</em><br>
                    ${pub.journal}, ${pub.year}${linkString}
                </div>
            </div>
        `;
    }
}

// Load and display publications
async function loadPublications() {
    try {
        const response = await fetch('papers.bib');
        const bibtexContent = await response.text();
        const publications = BibtexParser.parse(bibtexContent);
        
        // Filter for selected publications
        const selected = publications.filter(pub => pub.selected === 'true');
        
        const publicationsHtml = selected.map(pub => BibtexParser.renderPublication(pub)).join('');
        
        document.getElementById('publications').innerHTML = publicationsHtml;
    } catch (error) {
        console.error('Failed to load publications:', error);
        document.getElementById('publications').innerHTML = '<p>Publications will be added soon.</p>';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadPublications);