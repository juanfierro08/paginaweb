// FixNet + FIXNET Unified SPA Logic

// --- NAVIGATION & MOBILE MENU ---
const nav = {
    toggleMobileMenu: function() {
        const publicNav = document.getElementById('nav-public');
        const privateNav = document.getElementById('nav-private');
        const activeNav = publicNav.style.display !== 'none' ? publicNav : privateNav;
        activeNav.classList.toggle('mobile-active');
    },
    closeMobileMenu: function() {
        document.getElementById('nav-public').classList.remove('mobile-active');
        document.getElementById('nav-private').classList.remove('mobile-active');
    }
};

// --- ROUTER ---
const router = {
    navigate: function(viewId) {
        nav.closeMobileMenu();
        // Redirigir de inmediato al Panel si intenta entrar al login ya estando registrado o hace onboarding
        if (viewId === 'auth' && auth.isLoggedIn()) {
            const user = auth.getUser();
            if(!user.onboarded) return this.navigate('onboarding');
            return this.navigate('dashboard');
        }

        // Hide all views, show selected
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
            v.style.display = 'none'; // Ensure CSS sync
        });
        const targetView = document.getElementById('view-' + viewId);
        if(targetView) {
            targetView.style.display = 'block';
            setTimeout(() => targetView.classList.add('active'), 10);
        }
        
        // Manejo Inteligente de Navbars
        if(auth.isLoggedIn() && viewId !== 'landing' && viewId !== 'plans' && viewId !== 'support') {
            document.getElementById('nav-public').style.display = 'none';
            document.getElementById('nav-private').style.display = 'flex';
        } else {
            document.getElementById('nav-public').style.display = 'flex';
            document.getElementById('nav-private').style.display = 'none';
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Inicializar vistas específicas
        if(viewId === 'dashboard') dashboard.init();
        if(window.lucide) lucide.createIcons();
    }
};

// --- AUTHENTICATION & USER DB ---
const auth = {
    isLoggedIn: () => localStorage.getItem('FIXNET_user') !== null,
    getUser: () => JSON.parse(localStorage.getItem('FIXNET_user')),
    
    toggleMode: function() {
        const loginForm = document.getElementById('login-form');
        const regForm = document.getElementById('register-form');
        const title = document.getElementById('auth-title');
        const subtitle = document.getElementById('auth-subtitle');
        
        if(loginForm.style.display === 'none') {
            loginForm.style.display = 'block';
            regForm.style.display = 'none';
            title.innerHTML = 'Inicia Sesión';
            subtitle.innerText = 'Accede a tu portal FIXNET';
        } else {
            loginForm.style.display = 'none';
            regForm.style.display = 'block';
            title.innerHTML = 'Crea tu Cuenta';
            subtitle.innerText = 'Únete al internet inteligente';
        }
    },
    
    login: function(e) {
        e.preventDefault();
        const em = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        const users = JSON.parse(localStorage.getItem('FIXNET_db') || '[]');
        
        const user = users.find(u => u.email === em && u.password === pass);
        if(user) {
            localStorage.setItem('FIXNET_user', JSON.stringify(user));
            if(!user.onboarded) router.navigate('onboarding');
            else router.navigate('dashboard');
        } else {
            alert("Credenciales incorrectas o el usuario no existe.");
        }
    },
    
    register: function(e) {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const em = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-password').value;
        
        const users = JSON.parse(localStorage.getItem('FIXNET_db') || '[]');
        if(users.find(u => u.email === em)) {
            alert("El correo ya está registrado.");
            return;
        }
        
        const newUser = { name, email: em, password: pass, onboarded: false };
        users.push(newUser);
        localStorage.setItem('FIXNET_db', JSON.stringify(users));
        localStorage.setItem('FIXNET_user', JSON.stringify(newUser));
        
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
        
        const users = JSON.parse(localStorage.getItem('FIXNET_db'));
        const index = users.findIndex(u => u.email === currentUser.email);
        users[index] = currentUser;
        
        localStorage.setItem('FIXNET_db', JSON.stringify(users));
        localStorage.setItem('FIXNET_user', JSON.stringify(currentUser));
        
        router.navigate('dashboard');
    },
    
    logout: function() {
        localStorage.removeItem('FIXNET_user');
        router.navigate('landing');
    }
};

// --- VISUAL COMPONENTS (Chart JS & Leaflet Map) ---
let isMapInit = false;
const visuals = {
    renderChart: function() {
        const ctx = document.getElementById('usageChart');
        if(!ctx) return;
        if(window.connChart) window.connChart.destroy();
        
        const labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
        const data = [Math.floor(Math.random()*150)+50, Math.floor(Math.random()*200)+100, Math.floor(Math.random()*300)+150, Math.floor(Math.random()*200)+50];
        
        window.connChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Consumo (GB)',
                    data: data,
                    borderColor: '#0A6EFF',
                    backgroundColor: 'rgba(10, 110, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#0550CC',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#475467' } },
                    x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#475467' } }
                }
            }
        });
    },
    renderMap: function(user) {
        if(isMapInit) return;
        isMapInit = true;
        
        let lat = 4.6097, lng = -74.0817; 
        if(user.ciudad && user.ciudad.toLowerCase().includes('medellin')) { lat = 6.2442; lng = -75.5812; }
        
        const container = L.DomUtil.get('coverageMap');
        if(container != null) { container._leaflet_id = null; }

        const map = L.map('coverageMap').setView([lat, lng], 13);
        
        // Light theme map (Carto Voyager)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO'
        }).addTo(map);

        setTimeout(() => map.invalidateSize(), 500);

        let currentMarker = null;
        map.on('click', function(e) {
            if(currentMarker) map.removeLayer(currentMarker);
            currentMarker = L.marker(e.latlng).addTo(map);
            
            const res = document.getElementById('map-result');
            res.innerHTML = '<span style="color:var(--neutral-400)">Consultando base de terminales FIXNET...</span>';
            setTimeout(() => {
                if(user.zona === 'rural') {
                    res.innerHTML = '<i data-lucide="satellite" width="16"></i> Señal Microondas Satelital detectada en las coordenadas.';
                    res.style.color = 'var(--success)';
                } else {
                    const hasFiber = Math.random() > 0.3;
                    res.innerHTML = hasFiber ? '<i data-lucide="zap" width="16"></i> Caja de Fibra Óptica NAP a menos de 50 metros.' : '<i data-lucide="alert-circle" width="16"></i> Zona de baja densidad. Alta latencia posible.';
                    res.style.color = hasFiber ? 'var(--brand)' : 'var(--warn)';
                }
                if(window.lucide) lucide.createIcons();
            }, 1000);
        });
    }
};

// --- DASHBOARD ---
const dashboard = {
    currentCheckoutPlan: null,

    init: function() {
        const user = auth.getUser();
        if(!user) return router.navigate('auth');
        
        document.getElementById('dash-name').innerText = user.name.split(' ')[0];
        document.getElementById('dash-location').innerHTML = `<i data-lucide="map-pin" width="16" style="vertical-align: middle;"></i> Ubicación: ${user.ciudad}, ${user.depto} (Estrato ${user.estrato})`;
        
        const statusEl = document.getElementById('dash-status');
        if(Math.random() > 0.85) {
            statusEl.className = 'status-badge status-bad';
            statusEl.innerHTML = '<i data-lucide="alert-triangle" width="18"></i> Degradación leve detectada';
        } else {
            statusEl.className = 'status-badge status-ok';
            statusEl.innerHTML = '<i data-lucide="check-circle-2" width="18"></i> Línea Activa y Estable';
        }
        
        this.renderPlans(user);
        
        setTimeout(() => {
            visuals.renderChart();
            visuals.renderMap(user);
        }, 100);
    },
    
    renderPlans: function(user) {
        let html = '';
        let isRural = user.zona === 'rural';
        let boost = 0;
        
        // Multiplicador del precio solidario
        if(user.estrato >= 3 && user.estrato <= 4) boost = 0.5;
        if(user.estrato >= 5) boost = 1.0;

        function buildCard(p) {
            const formatted = Math.floor(p.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            const featList = p.features.map(f => `<li><div class="feat-check"><i data-lucide="check" width="12"></i></div>${f}</li>`).join('');
            
            return `
                <div class="plan-card ${p.featured ? 'featured' : ''}">
                    ${p.featured ? '<div class="plan-badge">El más popular</div>' : ''}
                    <div class="plan-top">
                        <div class="plan-name-txt">${p.name}</div>
                        <div style="font-size: 11px; font-weight: 500; color: var(--brand); background: var(--brand-lt); padding: 3px 10px; border-radius: 20px;">${p.tech}</div>
                    </div>
                    <div class="plan-speed">
                        <div class="plan-speed-val">${p.speed}</div>
                        <div class="plan-speed-unit">Mbps</div>
                    </div>
                    <p class="plan-desc" style="margin-bottom: 24px;">Tarifa ajustada a estrato socioeconómico <b>${user.estrato}</b>.</p>
                    <ul class="plan-features">
                        ${featList}
                    </ul>
                    <div class="plan-price-row" style="margin-top: 24px;">
                        <div class="plan-price">$${formatted}</div>
                        <div class="plan-period">/ mes</div>
                    </div>
                    <button class="btn ${p.featured ? 'btn-primary' : 'btn-outline'} btn-lg w-100" onclick="dashboard.openCheckout('${p.name}', ${p.price})">Contratar Plan</button>
                </div>
            `;
        }

        if (isRural) {
            const plans = [
                { name: "Rural Básico", tech: "Microondas", speed: 20, price: 30000 + (10000 * boost), featured: false, features: ["Internet Satelital Libre", "Ping < 80ms", "Soporte Veredal"] },
                { name: "Rural Avanzado", tech: "Microondas", speed: 50, price: 50000 + (15000 * boost), featured: true, features: ["Internet Satelital Libre", "Smart TV Ready", "Prioridad Remota"] },
                { name: "Finca Dedicada", tech: "Fibra / Radio", speed: 100, price: 80000 + (25000 * boost), featured: false, features: ["Conexión Estable", "Cámaras Seguras", "IP Pública Fija"] }
            ];
            plans.forEach(p => html += buildCard(p));
        } else {
            const plans = [
                { name: "Residencial Lite", tech: "Fibra", speed: 100, price: 45000 + (15000 * boost), featured: false, features: ["Línea Simétrica", "Soporte Estándar", "Router Wi-Fi 5"] },
                { name: "Residencial Plus", tech: "Fibra", speed: 300, price: 65000 + (20000 * boost), featured: true, features: ["Línea Simétrica", "Soporte 24/7", "Router Wi-Fi 6", "Gaming Ready"] },
                { name: "Ultra Hogar", tech: "Fibra X", speed: 500, price: 90000 + (30000 * boost), featured: false, features: ["Ancho de banda garantizado", "Soporte VIP", "Mesh Extender Gratis"] }
            ];
            plans.forEach(p => html += buildCard(p));
        }

        document.getElementById('dash-plans').innerHTML = html;
        if(window.lucide) lucide.createIcons();
    },

    openCheckout: function(name, price) {
        this.currentCheckoutPlan = { name, price };
        document.getElementById('chk-plan-name').innerText = name;
        this.updateCheckoutSum();
        document.getElementById('checkout-modal').classList.add('active');
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
        const total = document.getElementById('chk-total-price').innerText;
        const user = auth.getUser();
        
        alert(`¡Contrato generado con éxito!\nPlan: ${this.currentCheckoutPlan.name}\nInstalación: ${date}\nTarifa Final: ${total}`);
        document.getElementById('checkout-modal').classList.remove('active');

        // Enviar correo de notificación de compra
        fetch("https://formsubmit.co/ajax/juanfierro0821@gmail.com", {
            method: "POST",
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                _subject: "¡Nuevo Plan Contratado - FIXNET!",
                Cliente: user ? user.name : "Desconocido",
                Email_Cliente: user ? user.email : "Desconocido",
                Plan: this.currentCheckoutPlan.name,
                Fecha_Instalacion: date,
                Total: total
            })
        }).catch(err => console.error("Error enviando correo:", err));
        
        // Registrar en historial local
        let history = JSON.parse(localStorage.getItem('FIXNET_history_' + (user ? user.email : 'guest')) || '[]');
        history.push(`✅ Contrato para ${this.currentCheckoutPlan.name} aceptado. Fecha estimada: ${date}. Total: ${total}.`);
        if(user) localStorage.setItem('FIXNET_history_' + user.email, JSON.stringify(history));
    },

    showHistory: function() {
        const user = auth.getUser();
        const history = JSON.parse(localStorage.getItem('FIXNET_history_' + user.email) || '[]');
        const list = document.getElementById('history-list');
        
        list.innerHTML = '';
        if(history.length === 0) {
             list.innerHTML = '<li style="padding: 12px; border: 1px dashed var(--neutral-300); border-radius: var(--radius-sm); color: var(--neutral-600);">No hay registros ni facturas generadas todavía. Contrata un plan para empezar.</li>';
        } else {
             history.forEach(item => {
                  list.innerHTML += `<li style="padding: 12px; border: 1px solid var(--neutral-200); border-radius: var(--radius-sm); color: var(--neutral-700); font-size: 14px; background: var(--neutral-50); line-height: 1.5;">${item}</li>`;
             });
        }
        document.getElementById('history-modal').classList.add('active');
    }
};

// --- SUPPORT IA DIAGNOSTIC ---
const support = {
    init: function() {
        const form = document.getElementById('support-form');
        if(form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const issue = document.getElementById('sup-issue').value;
                const resBox = document.getElementById('support-response');
                const resText = document.getElementById('sup-text');
                
                resBox.style.display = 'block';
                resText.innerHTML = "<em>Ejecutando algoritmo de testeo sobre la red óptica...</em>";
                
                // Enviar correo de notificación de diagnóstico
                const userDiag = auth.getUser();
                fetch("https://formsubmit.co/ajax/juanfierro0821@gmail.com", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        _subject: "Solicitud de Soporte / Diagnóstico de Red",
                        Cliente: userDiag ? userDiag.name : "Visitante",
                        Email_Cliente: userDiag ? userDiag.email : "No definido",
                        Sintoma_Detectado: issue
                    })
                }).catch(err => console.error("Error enviando correo:", err));

                setTimeout(() => {
                    let ans = "";
                    switch(issue) {
                        case 'noconn': ans = "La IA detectó una ruptura de luz óptica a 1.2 Km de tu ONT. Hemos generado un ticket automático (CX-9982) para la cuadrilla en tu zona. Tiempo estimado de reparación: 2 horas."; break;
                        case 'slow': ans = "Los parámetros de luz reflejan normalidad absoluta, pero el sistema detecta 12 dispositivos conectados. Hemos enviado un pulso que optimiza los canales Wi-Fi libres para descongestionar. ¡Reinicia tu equipo!"; break;
                        case 'intermit': ans = "Variaciones de voltaje registradas. Mencionas cortes constantes. Es posible que tu router necesite reemplazo físico. Un asesor humano te llamará para confirmarlo."; break;
                        case 'router': ans = "El alcance de tu onda de 5GHz es limitado. Te recomendamos financiar un sistema Mesh en tu Panel Privado para abarcar todo el domicilio de forma óptima."; break;
                    }
                    resText.innerHTML = ans;
                }, 1500);
            });
        }
    }
};

// --- CHATBOT FIXY ---
const chatbot = {
    isOpen: false,
    state: 'idle',
    toggle: function() {
        this.isOpen = !this.isOpen;
        const win = document.getElementById('chatbot-window');
        if(this.isOpen) {
            win.classList.add('active');
            if(document.getElementById('chatbot-messages').children.length === 0) {
                this.addMessage("bot", "¡Hola! Soy Fixy, tu asistente de inteligencia artificial en FIXNET. ¿En qué te puedo ayudar hoy?\n\nOpciones:\n1. Información de planes y precios\n2. Soporte técnico o fallas\n3. Cobertura de red\n4. Hablar con un asesor humano");
            }
        } else {
            win.classList.remove('active');
        }
    },
    send: function() {
        const input = document.getElementById('chatbot-input');
        const text = input.value.trim();
        if(!text) return;
        this.addMessage("user", text);
        input.value = "";
        
        setTimeout(() => {
            this.processMessage(text);
        }, 600);
    },
    processMessage: function(text) {
        const lower = text.toLowerCase();
        let res = "";
        
        if(this.state === 'awaiting_human_message') {
            this.sendEmailToHuman(text);
            res = "✅ Listo. He enviado tu caso a un asesor humano de FIXNET. Te contactaremos muy pronto. ¿Te puedo ayudar en algo más?";
            this.state = 'idle';
            this.addMessage("bot", res);
            return;
        }

        if(lower.includes("plan") || lower.includes("precio") || lower === "1") {
            res = "Ofrecemos una gran variedad de planes:\n- Planes rurales desde $30,000 (Sujeto a cobertura)\n- Planes residenciales desde $65,000\n- Soluciones especiales Gamer e IPs Fijas\n\n¡Ve al botón de 'Planes y Cobertura' o entra a tu cuenta para que nuestro algoritmo asigne la tarifa adecuada según tu estrato!";
        } else if (lower.includes("lento") || lower.includes("fall") || lower.includes("mal") || lower.includes("soport") || lower === "2") {
            res = "Si tienes problemas técnicos, como internet lento o sin conexión, dirígete a la pestaña 'Diagnóstico' en el menú. Es una herramienta poderosa donde la IA te enviará un test de reparación al instante.";
        } else if (lower.includes("cobertur") || lower.includes("zona") || lower.includes("lleg") || lower === "3") {
            res = "Cubrimos más de 850 municipios en Colombia.\n\nContamos con Fibra Óptica 100% Urbana y solución Satelital/Radio para Veredas. Usa el 'Radar de Espectro Óptico' dentro de Mi Panel.";
        } else if (lower.includes("human") || lower.includes("asesor") || lower.includes("person") || lower.includes("contacto") || lower.includes("hablar") || lower === "4") {
            res = "Por supuesto. Permíteme enviarle tu inquietud al área humana.\n\nEscribe en un solo mensaje tu problema, duda o solicitud, acompañado de un teléfono o medio para comunicarnos, y nosotros te llamaremos lo más pronto posible.";
            this.state = 'awaiting_human_message';
        } else if (lower.includes("gracia") || lower.includes("excelent")) {
            res = "¡Con muchísimo gusto! En FIXNET trabajamos día a día para brindarte la red más inteligente y veloz.";
        } else if (lower.includes("hola") || lower.includes("buen")) {
            res = "¡Hola! Dime, ¿necesitas ayuda con alguna de nuestras opciones?\n1. Planes y precios\n2. Soporte técnico\n3. Ver Cobertura\n4. Hablar con un asesor humano";
        } else {
            res = "No estoy seguro de haber entendido o de saber cómo ayudarte con eso. Puedes intentar con el número de la opción o usar palabras clave.\n\n1. Planes y precios\n2. Soporte técnico\n3. Ver cobertura\n4. Contactar un humano";
        }
        
        this.addMessage("bot", res);
    },
    sendEmailToHuman: function(messageText) {
        const userChat = auth.getUser();
        fetch("https://formsubmit.co/ajax/juanfierro0821@gmail.com", {
            method: "POST",
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                _subject: "Nuevo caso de Soporte Humano (Vía IA Fixy)",
                Cliente: userChat ? userChat.name : "Visitante Anónimo",
                Email_Cliente: userChat ? userChat.email : "No definido",
                Mensaje_Usuario: messageText
            })
        }).catch(err => console.error("Error enviando correo:", err));
    },
    addMessage: function(sender, text) {
        const box = document.getElementById('chatbot-messages');
        const div = document.createElement('div');
        div.className = "message " + sender;
        const bubble = document.createElement('div');
        bubble.className = "message-bubble";
        
        if (sender === "bot") {
            bubble.innerHTML = text.replace(/\n/g, '<br>');
        } else {
            bubble.innerText = text;
        }
        
        div.appendChild(bubble);
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    }
};

// --- EVENTS BINDING ---
document.getElementById('login-form').addEventListener('submit', auth.login);
document.getElementById('register-form').addEventListener('submit', auth.register);
document.getElementById('onboarding-form').addEventListener('submit', e => auth.saveOnboarding(e));
document.getElementById('checkout-form').addEventListener('submit', e => dashboard.processCheckout(e));

// INITIALIZATION
window.onload = () => {
    lucide.createIcons();
    support.init();
    
    // Redirect logic on page load
    if(auth.isLoggedIn()) {
        const user = auth.getUser();
        if(!user.onboarded) router.navigate('onboarding');
        else router.navigate('dashboard');
    } else {
        router.navigate('landing');
    }
};

