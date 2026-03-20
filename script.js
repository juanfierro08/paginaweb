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
        // Base Plans
        const basePlans = [
            { name: "Plan Básico", speed: "50 Mbps", basePrice: 40000, desc: "Para navegación y tareas", icon: "wifi" },
            { name: "Plan Estándar", speed: "200 Mbps", basePrice: 70000, desc: "Streaming y teletrabajo ideal", icon: "zap" },
            { name: "Plan Premium", speed: "600 Mbps", basePrice: 120000, desc: "Gamer, 4K y múltiples dispositivos", icon: "rocket" }
        ];
        
        // Modifier function based on stratum (1 to 6)
        let multiplier = 1;
        if(user.estrato === 1) multiplier = 0.5;
        if(user.estrato === 2) multiplier = 0.7;
        if(user.estrato === 3) multiplier = 0.9;
        if(user.estrato === 4) multiplier = 1.1;
        if(user.estrato === 5) multiplier = 1.4;
        if(user.estrato === 6) multiplier = 1.8;
        
        let html = '';
        basePlans.forEach(p => {
            const finalPrice = Math.floor(p.basePrice * multiplier);
            // Format number
            const formatted = finalPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            const isPremium = p.name.includes("Premium");
            
            html += `
                <div class="service-card ${isPremium ? 'premium' : ''}" style="${isPremium ? '' : 'border-top: 4px solid var(--primary)'}">
                    ${isPremium ? '<div class="popular-badge">Recomendado</div>' : ''}
                    <div class="card-icon"><i data-lucide="${p.icon}"></i></div>
                    <h3>${p.name}</h3>
                    <p class="plan-desc">${p.desc}</p>
                    <div class="price"><span>$</span>${formatted}<span class="price-extra">COP/mes (Tu tarifa de Estrato ${user.estrato})</span></div>
                    <ul class="features">
                        <li><i data-lucide="check-circle-2"></i> ${p.speed} Simétricos</li>
                        <li><i data-lucide="check-circle-2"></i> Instalación Gratis</li>
                        ${isPremium ? '<li><i data-lucide="check-circle-2"></i> Soporte VIP 24/7</li>' : ''}
                    </ul>
                    <button class="btn-primary w-100" onclick="alert('Simulación: Solicitud de contratación enviada al sistema.')" style="margin-top: 1.5rem;">Adquirir Plan</button>
                </div>
            `;
        });
        
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
