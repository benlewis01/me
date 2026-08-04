/* ==========================================================================
   1. GLOBAL VARIABLES & LIGHTBOX STATE
   ========================================================================== */
let currentGalleryImages = [];
let currentImageIndex = 0;
let lightboxActive = false; 

/* ==========================================================================
   2. ACCORDION EXPANSION & AUTO-SCROLL
   ========================================================================== */
function toggleAccordion(headerElement) {
    const currentItem = headerElement.parentElement;
    const container = currentItem.parentElement; 
    const content = currentItem.querySelector('.accordion-content');
    
    if (!content) return;

    const isOpening = !currentItem.classList.contains('active');

    const activeItem = container.querySelector('.accordion-item.active');
    if (activeItem && activeItem !== currentItem) {
        activeItem.classList.remove('active');
        activeItem.querySelector('.accordion-content').style.maxHeight = null;
    }

    if (!isOpening) {
        currentItem.classList.remove('active');
        content.style.maxHeight = null;
    } else {
        currentItem.classList.add('active');
        content.style.maxHeight = content.scrollHeight + "px";

        setTimeout(() => {
            const stickyHeader = document.querySelector('.sticky-header');
            const headerBottomOffset = stickyHeader ? stickyHeader.getBoundingClientRect().height : 110;
            const itemRect = currentItem.getBoundingClientRect();
            const absoluteElementTop = itemRect.top + window.pageYOffset;
            const extraBuffer = window.innerHeight * 0.10;
            
            window.scrollTo({
                top: absoluteElementTop - headerBottomOffset - extraBuffer,
                behavior: 'smooth'
            });
        }, 150); 
    }
}

/* ==========================================================================
   3. DYNAMIC HTML BUILDERS
   ========================================================================== */
function createAccordionHTML(item) {
    if (!item.name || item.name.trim() === '') return '';

    const formattedDescription = (item.description || "").replace(/\n/g, '<br>');
    const logoHTML = item.logo && item.logo.trim() !== '' 
        ? `<img src="${item.logo}" alt="Logo" class="item-logo" onerror="this.style.display='none'">` 
        : '';

    let collageHTML = '';
    if (item.images && item.images.trim() !== '') {
        const imgList = item.images.split(',').map(img => img.trim()).filter(img => img !== '');
        if (imgList.length > 0) {
            const escapedList = JSON.stringify(imgList).replace(/"/g, '&quot;');
            collageHTML = `<div class="item-collage-grid">`;
            imgList.forEach((imgUrl, index) => {
                collageHTML += `<img src="${imgUrl}" alt="Gallery Image" class="collage-thumb" onclick="openLightbox(${index}, ${escapedList})" onerror="this.style.display='none'">`;
            });
            collageHTML += `</div>`;
        }
    }

    const exactDatesHTML = item.exactDates ? `<p class="exact-dates"><strong>Exact Dates:</strong> ${item.exactDates}</p>` : '';
    const accentColor = item.colour && item.colour.trim() !== '' ? item.colour : '#cbd5e1';

    return `
        <div class="accordion-item" style="border-color: ${accentColor};">
            <button class="accordion-header" onclick="toggleAccordion(this)">
                <div class="header-left">
                    ${logoHTML}
                    <span class="item-name">${item.name}</span>
                </div>
                <div class="header-right">
                    <span class="item-rough-date">${item.roughDate || ''}</span>
                </div>
                <div class="icon-container">+</div>
            </button>
            <div class="accordion-content">
                <div class="content-inner">
                    ${exactDatesHTML}
                    <p class="item-description">${formattedDescription}</p>
                    ${collageHTML}
                </div>
            </div>
        </div>
    `;
}

function createQuoteCardHTML(item) {
    if (!item.name || item.name.trim() === '') return '';
    const quoteText = item.quote || item.description || '';
    return `
        <div class="reference-card">
            <h3>${item.name}</h3>
            <p class="ref-position">${item.connection || ''}</p>
            <div class="ref-contact">
                <span>"${quoteText}"</span>
            </div>
        </div>
    `;
}

/* ==========================================================================
   4. LIGHTBOX CONTROLS
   ========================================================================== */
function openLightbox(index, imgArray) {
    currentGalleryImages = imgArray;
    currentImageIndex = index;
    const modal = document.getElementById('lightbox-modal');
    if (!modal) return;

    document.getElementById('lightbox-img').src = currentGalleryImages[currentImageIndex];
    modal.classList.add('visible');
    document.body.style.overflow = 'hidden'; 
    lightboxActive = true; 
}

function closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (!modal) return;
    modal.classList.remove('visible');
    document.body.style.overflow = ''; 
    lightboxActive = false; 
}

function changeLightboxImage(direction) {
    if (!currentGalleryImages.length || currentGalleryImages.length <= 1) return;
    currentImageIndex += direction;
    if (currentImageIndex >= currentGalleryImages.length) currentImageIndex = 0;
    else if (currentImageIndex < 0) currentImageIndex = currentGalleryImages.length - 1;
    document.getElementById('lightbox-img').src = currentGalleryImages[currentImageIndex];
}

document.addEventListener('keydown', function(e) {
    if (!lightboxActive) return;
    if (e.key === 'ArrowRight' || e.key === 'Right') changeLightboxImage(1);
    else if (e.key === 'ArrowLeft' || e.key === 'Left') changeLightboxImage(-1);
    else if (e.key === 'Escape' || e.key === 'Esc') closeLightbox();
});

/* ==========================================================================
   5. RELIABLE LINE-BY-LINE PARSER
   ========================================================================== */
function parseInfoTxt(text) {
    const items = [];
    const rawBlocks = text.split(/\[\s*ITEM\s*\]/i);

    rawBlocks.forEach(block => {
        if (!block.trim()) return;

        const item = {
            section: '',
            name: '',
            logo: '',
            roughDate: '',
            exactDates: '',
            images: '',
            description: '',
            connection: '',
            contact: '',
            colour: '',
            quote: '',
            referencesList: ''
        };

        const descMatch = block.match(/\[\s*DESC\s*\]([\s\S]*?)(?:\[\/\s*DESC\s*\]|\[\s*DESC\s*\]|$)/i);
        if (descMatch) item.description = descMatch[1].trim();

        const quoteMatch = block.match(/\[\s*QUOTE\s*\]([\s\S]*?)(?:\[\/\s*QUOTE\s*\]|\[\s*QUOTE\s*\]|$)/i);
        if (quoteMatch) item.quote = quoteMatch[1].trim();

        const refListMatch = block.match(/\[\s*REFERENCES\s*\]([\s\S]*?)(?:\[\/\s*REFERENCES\s*\]|\[\s*REFERENCES\s*\]|$)/i);
        if (refListMatch) item.referencesList = refListMatch[1].trim();

        const lines = block.split(/\r?\n/);
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('[SECTION]')) item.section = trimmed.replace(/\[\/?SECTION\]/gi, '').trim();
            if (trimmed.startsWith('[NAME]')) item.name = trimmed.replace(/\[\/?NAME\]/gi, '').trim();
            if (trimmed.startsWith('[LOGO]')) item.logo = trimmed.replace(/\[\/?LOGO\]/gi, '').trim();
            if (trimmed.startsWith('[ROUGHDATE]')) item.roughDate = trimmed.replace(/\[\/?ROUGHDATE\]/gi, '').trim();
            if (trimmed.startsWith('[EXACTDATES]')) item.exactDates = trimmed.replace(/\[\/?EXACTDATES\]/gi, '').trim();
            if (trimmed.startsWith('[IMAGES]')) item.images = trimmed.replace(/\[\/?IMAGES\]/gi, '').trim();
            if (trimmed.startsWith('[CONNECTION]')) item.connection = trimmed.replace(/\[\/?CONNECTION\]/gi, '').trim();
            if (trimmed.startsWith('[CONTACT]')) item.contact = trimmed.replace(/\[\/?CONTACT\]/gi, '').trim();
            if (trimmed.startsWith('[COLOUR]')) item.colour = trimmed.replace(/\[\/?COLOUR\]/gi, '').trim();
        });

        if (item.name || item.section || item.referencesList) {
            items.push(item);
        }
    });

    return items;
}

function loadSectionContent(targetSections) {
    const runFetcher = () => {
        fetch('info.txt?t=' + new Date().getTime())
            .then(res => {
                if (!res.ok) throw new Error("Could not load info.txt");
                return res.text();
            })
            .then(text => {
                const parsedItems = parseInfoTxt(text);

                parsedItems.forEach(itemData => {
                    const section = itemData.section.toLowerCase();
                    const matchesTarget = targetSections.some(target => section.includes(target));
                    if (!matchesTarget) return;

                    if (section.includes('education')) {
                        const el = document.getElementById('education-container');
                        if (el) el.innerHTML += createAccordionHTML(itemData);
                    } else if (section.includes('experience') || section.includes('work')) {
                        const el = document.getElementById('experience-container');
                        if (el) el.innerHTML += createAccordionHTML(itemData);
                    } else if (section.includes('achievement')) {
                        const el = document.getElementById('achievements-container');
                        if (el) el.innerHTML += createAccordionHTML(itemData);
                    } else if (section.includes('quote') || section.includes('testimonial')) {
                        const el = document.getElementById('quotes-container');
                        if (el) el.innerHTML += createQuoteCardHTML(itemData);
                    } else if (section.includes('reference') && itemData.referencesList) {
                        const el = document.getElementById('references-footer-container');
                        if (el) {
                            el.innerHTML = `<p>Please contact me for full references from: <strong>${itemData.referencesList}</strong></p>`;
                        }
                    }
                });
            })
            .catch(err => console.error("Error fetching content:", err));
    };

    if (document.readyState === 'loading') {
        document.addEventListener("DOMContentLoaded", runFetcher);
    } else {
        runFetcher();
    }
}
