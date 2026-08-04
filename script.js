let currentGalleryImages = [];
let currentImageIndex = 0;
let lightboxActive = false; 

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

function createReferenceHTML(item) {
    if (!item.name || item.name.trim() === '') return '';
    return `
        <div class="reference-card">
            <h3>${item.name}</h3>
            <p class="ref-position">${item.connection || item.roughDate || ''}</p>
            <div class="ref-contact">
                <span>${item.contact || item.description || ''}</span>
            </div>
        </div>
    `;
}

/* LIGHTBOX CONTROLS */
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
    if (e.key === 'ArrowRight') changeLightboxImage(1);
    else if (e.key === 'ArrowLeft') changeLightboxImage(-1);
    else if (e.key === 'Escape') closeLightbox();
});

/* PARSER */
function loadSectionContent(targetSections) {
    fetch('info.txt?t=' + new Date().getTime())
        .then(res => res.text())
        .then(text => {
            const rawItems = text.split(/\[\/?ITEM\]/i);
            rawItems.forEach(rawItem => {
                if (!rawItem.trim()) return;

                const getTag = (t) => {
                    const match = rawItem.match(new RegExp('\\[\\s*' + t + '\\s*\\]([\\s\\S]*?)\\[\\/\\s*' + t + '\\s*\\]', 'i'));
                    return match ? match[1].trim() : '';
                };

                const section = getTag('SECTION').toLowerCase();
                const itemData = {
                    name: getTag('NAME'),
                    logo: getTag('LOGO'),
                    roughDate: getTag('ROUGHDATE'),
                    exactDates: getTag('EXACTDATES'),
                    images: getTag('IMAGES'),
                    description: getTag('DESC'),
                    connection: getTag('CONNECTION'),
                    contact: getTag('CONTACT'),
                    colour: getTag('COLOUR')
                };

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
                } else if (section.includes('reference')) {
                    const el = document.getElementById('references-container');
                    if (el) el.innerHTML += createReferenceHTML(itemData);
                }
            });
        })
        .catch(err => console.error("Could not load info.txt:", err));
}