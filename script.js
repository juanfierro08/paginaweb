// FixNet - SPA Core App

// --- ROUTER ---
const router = {
    navigate: function(viewId) {
        // Redirigir de inmediato al Panel si intenta entrar al login ya estando registrado
        if(viewId === 'auth' && auth.isLoggedIn()) {
            return this.navigate('dashboard');
        }

        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('view-' + viewId).classList.add('active');
        
        // Admin easter egg
        if(viewId === 'admin') admin.init();
        
        // Manejo Inteligente de Navbars
        if(viewId === 'auth' || viewId === 'onboarding') {
            document.getElementById('nav-public').style.display = 'none';
            document.getElementById('nav-private').style.display = 'none';
        } else if(auth.isLoggedIn()) {
            // Si el cliente creó su cuenta y está logueado, SIEMPRE verá su barra superior privada y opciones extras
            document.getElementById('nav-public').style.display = 'none';
            document.getElementById('nav-private').style.display = 'flex';
        } else {
            // Visitante común
            document.getElementById('nav-public').style.display = 'flex';
            document.getElementById('nav-private').style.display = 'none';
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Trigger view-specific logic
        if(viewId === 'dashboard') dashboard.init();
        if(window.lucide) lucide.createIcons();
    }
};

// --- WEBHOOK ADMIN NOTIFICATIONS ---
function sendToFixNetAdmin(subject, dataObj) {
    const formData = new FormData();
    formData.append("access_key", "d168756e-1083-4c2d-a522-9a0d8cead4f8");
    formData.append("subject", subject);
    formData.append("from_name", "Sistema Central FixNet");
    for (let key in dataObj) {
        formData.append(key, dataObj[key]);
    }
    fetch("https://api.web3forms.com/submit", { method: "POST", body: formData })
      .catch(err => console.error("Error Web3Forms", err));
}

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
        
        sendToFixNetAdmin("1. NUEVO USUARIO REGISTRADO: " + name, {
            Nombre: name,
            Correo: em,
            Mensaje: "El cliente acaba de crear su cuenta en FixNet pero aún no ingresa su estrato y barrio."
        });
        
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
        
        sendToFixNetAdmin("2. PERFIL DE COBERTURA COMPLETADO: " + currentUser.name, {
            Cliente: currentUser.name,
            Correo: currentUser.email,
            Departamento: currentUser.depto,
            Ciudad: currentUser.ciudad,
            Zona: currentUser.zona === 'rural' ? "Rural / Campo" : "Urbano / Ciudad",
            Estrato: currentUser.estrato
        });
        
        router.navigate('dashboard');
    },
    
    logout: function() {
        localStorage.removeItem('fixnet_user');
        router.navigate('landing');
    }
};

// --- PREMIUM VISUALS (Chart & Leaflet) ---
let isMapInit = false;
const visuals = {
    renderChart: function() {
        const ctx = document.getElementById('usageChart');
        if(!ctx) return;
        if(window.fixnetChart) window.fixnetChart.destroy();
        
        const labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
        const data = [Math.floor(Math.random()*250)+50, Math.floor(Math.random()*400)+100, Math.floor(Math.random()*500)+150, Math.floor(Math.random()*300)+50];
        
        window.fixnetChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Descargas (GB)',
                    data: data,
                    borderColor: '#00f2ff',
                    backgroundColor: 'rgba(0, 242, 255, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#b000ff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
                }
            }
        });
    },
    renderMap: function(user) {
        if(isMapInit) return;
        isMapInit = true;
        
        let lat = 4.6097, lng = -74.0817; 
        if(user.ciudad && user.ciudad.toLowerCase().includes('medellin')) { lat = 6.2442; lng = -75.5812; }
        
        const map = L.map('coverageMap').setView([lat, lng], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO'
        }).addTo(map);

        setTimeout(() => map.invalidateSize(), 500);

        let currentMarker = null;
        map.on('click', function(e) {
            if(currentMarker) map.removeLayer(currentMarker);
            currentMarker = L.marker(e.latlng).addTo(map);
            
            const res = document.getElementById('map-result');
            res.innerHTML = '<span style="color:var(--text-muted)">Escaneando espectro en coordenadas...</span>';
            setTimeout(() => {
                if(user.zona === 'rural') {
                    res.innerHTML = '<i data-lucide="radio" style="width:18px;"></i> Factibilidad: Red Microondas/Satelital Activa.';
                    res.style.color = '#10b981';
                } else {
                    res.innerHTML = Math.random() > 0.25 ? '<i data-lucide="zap" style="width:18px;"></i> Factibilidad: Fibra Óptica FTTH 100%.' : '<i data-lucide="alert-circle" style="width:18px;"></i> Zona con puertos limitados de red.';
                    res.style.color = res.innerHTML.includes('limitados') ? '#fbbf24' : 'var(--primary)';
                }
                if(window.lucide) lucide.createIcons();
            }, 1200);
        });
    }
};

// --- DASHBOARD LOGIC ---
const dashboard = {
    currentCheckoutPlan: null,

    init: function() {
        const user = auth.getUser();
        if(!user) return router.navigate('auth');
        
        document.getElementById('dash-name').innerText = user.name.split(' ')[0];
        document.getElementById('dash-location').innerHTML = `<b>Ubicación:</b> ${user.ciudad}, ${user.depto} (Estrato ${user.estrato})`;
        
        const statusEl = document.getElementById('dash-status');
        if(Math.random() > 0.8) {
            statusEl.className = 'status-badge error-status';
            statusEl.innerHTML = '<i data-lucide="alert-triangle"></i> Se presentan fallas en tu zona';
        } else {
            statusEl.className = 'status-badge normal-status';
            statusEl.innerHTML = '<i data-lucide="check-circle-2"></i> Servicio funcionando con normalidad';
        }
        
        this.renderPlans(user);
        
        // Initializing Map and Chart after a tiny delay so DOM is available
        setTimeout(() => {
            visuals.renderChart();
            visuals.renderMap(user);
        }, 300);
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
                    <button class="btn-primary w-100" onclick="dashboard.openCheckout('${p.name}', ${p.price})" style="margin-top: 1.5rem;">Adquirir Plan</button>
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
    },

    openCheckout: function(name, price) {
        this.currentCheckoutPlan = { name, price };
        document.getElementById('chk-plan-name').innerText = name;
        this.updateCheckoutSum();
        document.getElementById('checkout-modal').style.display='flex';
    },

    updateCheckoutSum: function() {
        if(!this.currentCheckoutPlan) return;
        const routerVal = parseInt(document.getElementById('chk-router').value);
        const base = this.currentCheckoutPlan.price;
        const total = base + routerVal;
        
        document.getElementById('chk-base-price').innerText = "$" + base.toLocaleString() + " COP";
        document.getElementById('chk-router-price').innerText = "$" + routerVal.toLocaleString() + " COP";
        document.getElementById('chk-total-price').innerText = "$" + total.toLocaleString() + " COP";
    },

    processCheckout: function(e) {
        e.preventDefault();
        const date = document.getElementById('chk-date').value;
        const routerOpt = document.getElementById('chk-router');
        const routerText = routerOpt.options[routerOpt.selectedIndex].text;
        const total = document.getElementById('chk-total-price').innerText;
        
        alert(`¡Felicidades! Se ha tramitado el contrato de: ${this.currentCheckoutPlan.name}. El técnico asignado te visitará el día ${date}. Tarifa mensual acordada: ${total}.`);
        document.getElementById('checkout-modal').style.display = 'none';
        
        const hist = document.querySelector('#historial-modal ul');
        const user = auth.getUser();
        
        hist.innerHTML += `<li><i data-lucide="check-circle" style="color:#10b981; width:16px;"></i> Contrato Firmado: ${this.currentCheckoutPlan.name} (Acordado ${total}) Instalación: ${date}.</li>`;
        if(window.lucide) lucide.createIcons();
        
        sendToFixNetAdmin("3. 💰 ¡VENTA CERRADA!: " + this.currentCheckoutPlan.name, {
            Cliente: user.name,
            Correo: user.email,
            Ubicacion: `${user.ciudad}, ${user.depto} (Estrato ${user.estrato} - ${user.zona})`,
            Plan_Comprado: this.currentCheckoutPlan.name,
            Costo_Base: "$" + this.currentCheckoutPlan.price.toLocaleString() + " COP",
            Hardware_Elegido: routerText,
            Fecha_Instalacion: date,
            Total_Factura: total
        });
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
document.getElementById('checkout-form').addEventListener('submit', e => dashboard.processCheckout(e));

// --- ADMIN SECRETS (MODO DIOS) ---
let clicksOnLogo = 0;
document.querySelectorAll('.logo').forEach(logo => {
    logo.addEventListener('click', () => {
        clicksOnLogo++;
        if(clicksOnLogo >= 5) {
            clicksOnLogo = 0;
            const pass = prompt("Acceso Restringido. Clave de administrador (Hint: 1234):");
            if(pass === "1234") router.navigate('admin');
            else alert("Acceso Denegado.");
        }
    });
});
const admin = {
    init: function() {
        const users = JSON.parse(localStorage.getItem('fixnet_db') || '[]');
        let html = `<table style="width:100%; text-align:left; border-collapse: collapse; background:var(--bg-card);"><tr style="border-bottom: 2px solid var(--primary);"><th style="padding:1rem;">Nombre</th><th>Correo</th><th>Ubicación</th><th>Estrato</th></tr>`;
        users.forEach(u => {
            html += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color:var(--text-muted);"><td style="padding:1rem;">${u.name}</td><td>${u.email}</td><td>${u.ciudad || 'No Def'} (${u.zona || '?'})</td><td>${u.estrato || 'N/A'}</td></tr>`;
        });
        html += `</table>`;
        document.getElementById('admin-table-container').innerHTML = html;
    }
};

// --- CHATBOT FIXY ---
const chatbot = {
    isOpen: false,
    toggle: function() {
        this.isOpen = !this.isOpen;
        document.getElementById('chatbot-window').style.display = this.isOpen ? 'flex' : 'none';
        if(this.isOpen && document.getElementById('chatbot-messages').children.length === 0) {
            this.addMessage("bot", "¡Hola! Soy Fixy, tu asistente de Inteligencia Artificial para redes. ¿En qué te ayudo hoy?");
        }
    },
    send: function() {
        const input = document.getElementById('chatbot-input');
        const text = input.value.trim();
        if(!text) return;
        this.addMessage("user", text);
        input.value = "";
        
        setTimeout(() => {
            const lower = text.toLowerCase();
            let res = "De acuerdo. Nuestros asesores humanos recibirán esto y te contactarán vía celular en unos 15 minutos.";
            if(lower.includes("lento") || lower.includes("cae") || lower.includes("falla")) {
                res = "Puedo mandar una actualización masiva de espectro a tu antena. ¡Reinicia tu equipo en 10 minutos!";
            } else if (lower.includes("precio") || lower.includes("plan")) {
                res = "Tus precios están atados a tu estrato para garantizar la tarifa solidaria. Puedes revisar tu Dashboard para más info.";
            } else if (lower.includes("pagar") || lower.includes("factura")) {
                res = "En FixNet simplificamos tu pago. Usa el botón AvalPay guardado en tu Panel para pago instantáneo.";
            }
            this.addMessage("bot", res);
        }, 1000);
    },
    addMessage: function(sender, text) {
        const box = document.getElementById('chatbot-messages');
        const msgDiv = document.createElement('div');
        msgDiv.style.maxWidth = '80%';
        msgDiv.style.padding = '10px 15px';
        msgDiv.style.borderRadius = '15px';
        msgDiv.style.marginBottom = '5px';
        msgDiv.innerText = text;
        if(sender === 'user') {
            msgDiv.style.backgroundColor = 'var(--primary)';
            msgDiv.style.color = 'black';
            msgDiv.style.alignSelf = 'flex-end';
        } else {
            msgDiv.style.backgroundColor = 'rgba(255,255,255,0.1)';
            msgDiv.style.color = 'white';
            msgDiv.style.alignSelf = 'flex-start';
        }
        box.appendChild(msgDiv);
        box.scrollTop = box.scrollHeight;
    }
};

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
