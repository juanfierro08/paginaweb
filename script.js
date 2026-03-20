// FixNet - SPA Core App

// --- ROUTER ---
const router = {
    navigate: function(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('view-' + viewId).classList.add('active');
        
        // Hide standard nav if in auth
        if(viewId === 'auth' || viewId === 'onboarding') {
            document.getElementById('nav-public').style.display = 'none';
            document.getElementById('nav-private').style.display = 'none';
        } else if(auth.isLoggedIn() && viewId !== 'landing') {
            document.getElementById('nav-public').style.display = 'none';
            document.getElementById('nav-private').style.display = 'flex';
        } else {
            document.getElementById('nav-public').style.display = 'flex';
            document.getElementById('nav-private').style.display = 'none';
        }

        window.scrollTo(0, 0);
        
        // Trigger view-specific logic
        if(viewId === 'dashboard') dashboard.init();
        if(viewId === 'landing') {
            // Optional redirect check here
        }
        if(window.lucide) lucide.createIcons();
    }
};

// --- AUTHENTICATION & USER DB ---
const auth = {
    isLoggedIn: () => localStorage.getItem('fixnet_user') !== null,
    getUser: () => JSON.parse(localStorage.getItem('fixnet_user')),
    
    toggleMode: function() {
        const loginForm = document.getElementById('login-form');
        const regForm = document.getElementById('register-form');
        const title = document.getElementById('auth-title');
        const subtitle = document.getElementById('auth-subtitle');
        
        if(loginForm.style.display === 'none') {
            loginForm.style.display = 'flex';
            regForm.style.display = 'none';
            title.innerHTML = 'Inicia <span class="gradient-text">Sesión</span>';
            subtitle.innerText = 'Accede a tu portal FixNet';
        } else {
            loginForm.style.display = 'none';
            regForm.style.display = 'flex';
            title.innerHTML = 'Crea tu <span class="gradient-text">Cuenta</span>';
            subtitle.innerText = 'Únete al internet del futuro';
        }
    },
    
    login: function(e) {
        e.preventDefault();
        const em = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        const users = JSON.parse(localStorage.getItem('fixnet_db') || '[]');
        
        const user = users.find(u => u.email === em && u.password === pass);
        if(user) {
            localStorage.setItem('fixnet_user', JSON.stringify(user));
            if(!user.onboarded) router.navigate('onboarding');
            else router.navigate('dashboard');
        } else {
            alert("Credenciales incorrectas o usuario no existe.");
        }
    },
    
    register: function(e) {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const em = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-password').value;
        
        const users = JSON.parse(localStorage.getItem('fixnet_db') || '[]');
        if(users.find(u => u.email === em)) {
            alert("El correo ya está registrado.");
            return;
        }
        
        const newUser = { name, email: em, password: pass, onboarded: false };
        users.push(newUser);
        localStorage.setItem('fixnet_db', JSON.stringify(users));
        localStorage.setItem('fixnet_user', JSON.stringify(newUser));
        
        // Auto login and go to onboarding
        router.navigate('onboarding');
    },
    
    saveOnboarding: function(e) {
        e.preventDefault();
        const depto = document.getElementById('ob-depto').value;
        const ciudad = document.getElementById('ob-ciudad').value;
        const zona = document.getElementById('ob-zona').value;
        const estrato = parseInt(document.getElementById('ob-estrato').value);
        
        const currentUser = this.getUser();
        currentUser.depto = depto;
        currentUser.ciudad = ciudad;
        currentUser.zona = zona;
        currentUser.estrato = estrato;
        currentUser.onboarded = true;
        
        // Update user in DB
        const users = JSON.parse(localStorage.getItem('fixnet_db'));
        const index = users.findIndex(u => u.email === currentUser.email);
        users[index] = currentUser;
        
        localStorage.setItem('fixnet_db', JSON.stringify(users));
        localStorage.setItem('fixnet_user', JSON.stringify(currentUser));
        
        router.navigate('dashboard');
    },
    
    logout: function() {
        localStorage.removeItem('fixnet_user');
        router.navigate('landing');
    }
};

// --- DASHBOARD LOGIC ---
const dashboard = {
    init: function() {
        const user = auth.getUser();
        if(!user) return router.navigate('auth');
        
        document.getElementById('dash-name').innerText = user.name.split(' ')[0];
        document.getElementById('dash-location').innerHTML = `<b>Ubicación:</b> ${user.ciudad}, ${user.depto} (Estrato ${user.estrato})`;
        
        // Random Status logic
        const statusEl = document.getElementById('dash-status');
        if(Math.random() > 0.8) {
            statusEl.className = 'status-badge error-status';
            statusEl.innerHTML = '<i data-lucide="alert-triangle"></i> Se presentan fallas en tu zona';
        } else {
            statusEl.className = 'status-badge normal-status';
            statusEl.innerHTML = '<i data-lucide="check-circle-2"></i> Servicio funcionando con normalidad';
        }
        
        this.renderPlans(user);
    },
    
    renderPlans: function(user) {
        let html = '';
        let isRural = user.zona === 'rural';
        let plans = [];
        
        // Multiplicador del precio según estrato (estrato bajo = min de rango, medio = intermedio, alto = max de rango)
        let boost = 0;
        if(user.estrato >= 3 && user.estrato <= 4) boost = 0.5;
        if(user.estrato >= 5) boost = 1.0;

        function renderSpecificCard(p, user) {
            const formatted = Math.floor(p.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            const priceHtml = p.price === 0 ? "¡GRATIS!" : `<span>$</span>${formatted}`;
            
            let cardClasses = 'service-card ';
            if(p.premium) cardClasses += 'premium ';
            if(p.isSocial) cardClasses += 'social ';
            
            return `
                <div class="${cardClasses}" style="${!p.premium && !p.isSocial ? 'border-top: 4px solid var(--primary)' : ''}">
                    ${p.popular ? '<div class="popular-badge" style="background:var(--secondary);">El más vendido</div>' : ''}
                    <div class="card-icon"><i data-lucide="${p.icon || 'wifi'}"></i></div>
                    <h3>${p.name}</h3>
                    <p class="plan-desc">${p.desc}</p>
                    <div class="price" style="font-size: 2.2rem;">${priceHtml}<span class="price-extra">${p.price === 0 ? 'Limitado a 1h/usuario' : 'COP/mes (Tarifa Estrato ' + user.estrato + ')'}</span></div>
                    <ul class="features">
                        <li><i data-lucide="check-circle-2"></i> ${p.speed}</li>
                        ${p.premium ? '<li><i data-lucide="check-circle-2"></i> Soporte VIP Exclusivo</li>' : ''}
                    </ul>
                    <button class="btn-primary w-100" onclick="alert('Simulación: Solicitud de contratación de ${p.name} enviada al sistema.')" style="margin-top: 1.5rem;">Adquirir Plan</button>
                </div>
            `;
        }

        if (isRural) {
            const subtitleLocation = document.getElementById('dash-location');
            if(subtitleLocation && !subtitleLocation.innerHTML.includes('Rural')) {
                 subtitleLocation.innerHTML += ' <span style="color:#10b981;">(Zona Rural)</span>';
            }
            plans = [
                { name: "Internet Gratuito", speed: "5-10 Mbps compartidos", price: 0, desc: "Estratégico en Parque/Centro. Alto impacto social.", icon: "heart", isSocial: true },
                { name: "Plan Básico Rural", speed: "10-20 Mbps", price: 25000 + (10000 * boost), desc: "WhatsApp, YouTube básico, clases.", icon: "home" },
                { name: "Plan Rural Estándar", speed: "30-50 Mbps", price: 40000 + (15000 * boost), desc: "Nuestro plan de mayor prestigio en el campo.", popular: true, icon: "zap" },
                { name: "Plan Rural Plus", speed: "60-80 Mbps", price: 60000 + (15000 * boost), desc: "Para hogares que necesitan mayor potencia.", icon: "rocket" },
            ];
            html += `<div style="grid-column: 1/-1;"><h3 style="color:var(--primary); font-size:1.8rem;">Planes Rurales (Hogar)</h3><p style="color: var(--text-muted); margin-bottom: 1rem;">Costo de instalación: Mínimo impacto | Opciones de Router financiado a $5.000/mes.</p></div>`;
            plans.forEach(p => { html += renderSpecificCard(p, user); });
        } else {
            const subtitleLocation = document.getElementById('dash-location');
            if(subtitleLocation && !subtitleLocation.innerHTML.includes('Casco Urbano')) {
                 subtitleLocation.innerHTML += ' <span style="color:#b000ff;">(Casco Urbano)</span>';
            }
            plans = [
                { name: "Plan Básico Urbano", speed: "50 Mbps", price: 55000 + (10000 * boost), desc: "Ideal para un consumo moderado y redes sociales.", icon: "home" },
                { name: "Plan Estándar Urbano", speed: "100 Mbps", price: 70000 + (15000 * boost), popular: true, desc: "El favorito en toda la ciudad. Mejor costo/beneficio.", icon: "zap" },
                { name: "Plan Premium Urbano", speed: "200-300 Mbps", price: 95000 + (25000 * boost), premium: true, desc: "La más alta capacidad para gamers y múltiples TVs.", icon: "rocket" },
            ];
            html += `<div style="grid-column: 1/-1;"><h3 style="color:var(--primary); font-size:1.8rem;">Planes Hogar Urbanos</h3><p style="color: var(--text-muted); margin-bottom: 1rem;">Costo de instalación: Estándar | Opción de Router de última generación financiado desde $5.000/mes.</p></div>`;
            plans.forEach(p => { html += renderSpecificCard(p, user); });

            const businessPlans = [
                { name: "Pyme Básico", speed: "100 Mbps (Dedicado Parcial)", price: 120000 + (60000 * boost), desc: "Asegura la operatividad de tu pequeño negocio.", icon: "briefcase" },
                { name: "Pyme Avanzado", speed: "200-300 Mbps", price: 200000 + (150000 * boost), desc: "Ideal para oficinas corporativas.", icon: "building-2" },
                { name: "Empresarial Dedicado", speed: "Enlace Dedicado Real 1:1", price: 400000 + (600000 * boost), premium: true, desc: "Alta disponibilidad y Uptime del 99.9%.", icon: "server" }
            ];
            html += `<div style="grid-column: 1/-1; margin-top:2rem;"><h3 style="color:var(--secondary); font-size:1.8rem;">Planes Empresariales</h3><p style="color: var(--text-muted); margin-bottom: 1rem;">Lleva tu empresa al siguiente nivel con conexiones de misión crítica.</p></div>`;
            businessPlans.forEach(p => { html += renderSpecificCard(p, user); });
        }

        document.getElementById('dash-plans').innerHTML = html;
        if(window.lucide) lucide.createIcons();
    }
};

// --- SUPPORT SYSTEM ---
const support = {
    init: function() {
        const supForm = document.getElementById('support-form');
        if(supForm) {
            supForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const issue = document.getElementById('sup-issue').value;
                const resBox = document.getElementById('support-response');
                const resText = document.getElementById('sup-text');
                
                resBox.style.display = 'block';
                resText.innerHTML = "<em>Diagnosticando línea mediante IA FixNet...</em>";
                
                setTimeout(() => {
                    let answer = "";
                    switch(issue) {
                        case 'noconn': answer = "Hemos detectado que tu módem no recibe señal óptica (Luz LOS roja o apagada). Por favor verifica que el cable de fibra amarillo no esté doblado abruptamente. Si está bien, agendaremos una visita técnica automática en las próximas 4h."; break;
                        case 'slow': answer = "Tu conexión a la central FixNet responde bien. Te sugerimos desconectar el router de la corriente por 10 segundos para limpiar la caché y conectarte por cable de red si necesitas máxima velocidad."; break;
                        case 'intermit': answer = "Revisamos los parámetros y vemos ligeras variaciones de potencia óptica. Hemos enviado un comando remoto para estabilizar tus canales Wi-Fi. Reinicia tus dispositivos en 5 minutos."; break;
                        case 'router': answer = "Asegúrate de que el router esté en un lugar abierto, no dentro de muebles ni cerca de microondas. Si notas luces apagadas o diferentes, puedes solicitar un cambio de equipo desde tu Dashboard."; break;
                        default: answer = "Necesitamos más detalles. Escribe debajo en el chat para comunicarte con un agente real (Simulado).";
                    }
                    resText.innerHTML = "<b>🩺 Solución Automática:</b><br><br>" + answer;
                }, 1500);
            });
        }
    }
}

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const item = button.parentElement;
        document.querySelectorAll('.faq-item').forEach(faq => {
            if (faq !== item) faq.classList.remove('active');
        });
        item.classList.toggle('active');
    });
});

// BIND EVENTS
document.getElementById('login-form').addEventListener('submit', auth.login);
document.getElementById('register-form').addEventListener('submit', auth.register);
document.getElementById('onboarding-form').addEventListener('submit', e => auth.saveOnboarding(e));

// INITIALIZE
window.onload = () => {
    if(window.lucide) lucide.createIcons();
    support.init();
    
    // Auto-route based on session
    if(auth.isLoggedIn()) {
        const user = auth.getUser();
        if(!user.onboarded) router.navigate('onboarding');
        else router.navigate('dashboard');
    } else {
        router.navigate('landing');
    }
};
