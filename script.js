lucide.createIcons();

// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = hamburger.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.setAttribute('data-lucide', 'x');
        } else {
            icon.setAttribute('data-lucide', 'menu');
        }
        lucide.createIcons();
    });
}

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            const icon = hamburger.querySelector('i');
            icon.setAttribute('data-lucide', 'menu');
            lucide.createIcons();
        }
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// FAQ Accordion
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        faqItems.forEach(otherItem => {
            otherItem.classList.remove('active');
            const otherQuestion = otherItem.querySelector('.faq-question');
            if(otherQuestion) otherQuestion.classList.remove('active');
        });
        
        if (!isActive) {
            item.classList.add('active');
            question.classList.add('active');
        }
    });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(6, 9, 19, 0.95)';
        navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(6, 9, 19, 0.8)';
        navbar.style.boxShadow = 'none';
    }
});

// Dynamic Pricing Logic
const planesData = [
    // Rural
    { loc: 'rural', stratos: [1], name: 'Vínculo Social', price: '8.613', extra: 'COP/mes', desc: 'Plan subsidiado para el campo', features: ['10 Mbps', 'Ideal para estudio'], type: 'social', popular: false, icon: 'heart' },
    { loc: 'rural', stratos: [2], name: 'Conexión Campo', price: '19.074', extra: 'COP/mes', desc: 'Internet rural familiar', features: ['20 Mbps', 'Navegación general'], type: 'social', popular: true, icon: 'home' },
    { loc: 'rural', stratos: [3,4,5,6], name: 'Satélite Extremo', price: '150.000', extra: 'COP/mes + antena', desc: 'Internet satelital de alta cobertura', features: ['Cobertura total', 'Instalación remota'], type: 'standard', popular: false, icon: 'satellite' },
    
    // Ciudad (1,2,3)
    { loc: 'ciudad', stratos: [1,2,3], name: 'Ciudad Popular', price: '58.900', extra: 'COP/mes (Exento IVA)', desc: 'Fibra rápida y económica', features: ['200 Mbps Fibra', 'Router Wi-Fi 6'], type: 'social', popular: false, icon: 'home' },
    { loc: 'ciudad', stratos: [1,2,3], name: 'Ciudad Plus', price: '69.500', extra: 'COP/mes (Exento IVA)', desc: 'Más velocidad, mismo estrato', features: ['400 Mbps Fibra', 'Soporte 24/7'], type: 'standard', popular: true, icon: 'zap' },
    
    // Ciudad (4,5,6)
    { loc: 'ciudad', stratos: [4,5,6], name: 'Ciudad Pro', price: '82.700', extra: 'COP/mes (Con IVA)', desc: 'Velocidad y latencia baja', features: ['600 Mbps Fibra', 'Ping < 5ms'], type: 'standard', popular: false, icon: 'gamepad-2' },
    { loc: 'ciudad', stratos: [4,5,6], name: 'Premium Total', price: '149.900', extra: 'COP/mes (Con IVA)', desc: 'Para usuarios ultra exigentes', features: ['1000 Mbps Fibra', 'Enlace Dedicado', 'Repetidor Mesh'], type: 'premium', popular: true, icon: 'building-2' }
];

const qForm = document.getElementById('qualification-form');
const dynamicPlansContainer = document.getElementById('dynamic-plans');
const resultsHeader = document.getElementById('results-header');

function renderPlans(loc, estrato, userName) {
    if (!dynamicPlansContainer) return;

    const filtered = planesData.filter(p => p.loc === loc && p.stratos.includes(estrato));

    if (filtered.length === 0) {
        dynamicPlansContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Lo sentimos, no hay planes definidos para esta combinación temporalmente.</p>';
    } else {
        const html = filtered.map(plan => `
            <div class="service-card ${plan.type} ${plan.popular ? 'popular' : ''}">
                ${plan.popular ? '<div class="popular-badge">Recomendado</div>' : ''}
                <div class="card-icon"><i data-lucide="${plan.icon}"></i></div>
                <h3>${plan.name}</h3>
                <p class="plan-desc">${plan.desc}</p>
                <div class="price"><span>$</span>${plan.price}<span class="price-extra">${plan.extra}</span></div>
                <ul class="features">
                    ${plan.features.map(f => `<li><i data-lucide="check-circle-2"></i> ${f}</li>`).join('')}
                </ul>
                <a href="#contact" class="btn-card">Lo quiero</a>
            </div>
        `).join('');
        dynamicPlansContainer.innerHTML = html;
    }

    if(window.lucide) {
         lucide.createIcons();
    }
    
    // Configurar y mostrar el header de resultados
    if(resultsHeader) {
        // Obtenemos solo el primer nombre
        const firstName = userName.split(' ')[0];
        resultsHeader.innerHTML = `<h3>¡Hola <span class="gradient-text">${firstName}</span>!</h3><p style="color: var(--text-muted); margin-top: 0.5rem; font-size: 1.1rem;">Estos son los planes disponibles con cobertura total para el <b>Estrato ${estrato}</b> en zona <b>${loc === 'ciudad' ? 'Urbana' : 'Rural'}</b>:</p>`;
        resultsHeader.style.display = 'block';
    }
    
    dynamicPlansContainer.style.display = 'grid';
    
    // Smooth scroll to results
    setTimeout(() => {
        resultsHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
}

if (qForm) {
    qForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const btn = qForm.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Guardando tus datos y buscando planes...';
        btn.style.opacity = '0.8';
        
        const loc = document.getElementById('q-ubicacion').value;
        const estrato = parseInt(document.getElementById('q-estrato').value);
        const name = document.getElementById('q-nombre').value;
        const phone = document.getElementById('q-celular').value;
        const email = document.getElementById('q-correo').value;
        const municipio = document.getElementById('q-municipio').value;

        // Enviar datos en segundo plano usando FormSubmit
        // ¡REEMPLAZA 'TU_CORREO_AQUI@gmail.com' POR TU CORREO REAL!
        fetch("https://formsubmit.co/ajax/TU_CORREO_AQUI@gmail.com", {
            method: "POST",
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                Nombre: name,
                Celular: phone,
                Correo: email,
                Municipio: municipio,
                Zona: loc === 'ciudad' ? 'Urbana' : 'Rural',
                Estrato: estrato,
                _subject: "Nuevo Lead de Internet: " + name
            })
        })
        .then(response => response.json())
        .then(data => {
            btn.innerHTML = originalText;
            btn.style.opacity = '1';
            renderPlans(loc, estrato, name);
        })
        .catch(error => {
            // Aún si falla el envío por un adblock o red, mostramos los planes al cliente
            btn.innerHTML = originalText;
            btn.style.opacity = '1';
            renderPlans(loc, estrato, name);
        });
    });
}

// Dynamic counter animation
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        obj.innerHTML = Math.floor(easeProgress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

const speedNumber = document.querySelector('.speed-number');
let animated = false;

const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !animated) {
        animateValue(speedNumber, 0, 1000, 2000);
        animated = true;
    }
});

if (speedNumber) {
    observer.observe(speedNumber);
}

// Form handling
const form = document.querySelector('.contact-form');
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Enviando...';
        setTimeout(() => {
            btn.innerHTML = '¡Enviado!';
            btn.style.background = '#10b981';
            form.reset();
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 3000);
        }, 1500);
    });
}
