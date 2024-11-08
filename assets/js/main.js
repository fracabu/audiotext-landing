// Throttle utility per ottimizzare le performance
const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// AudioWaveAnimation Class
class AudioWaveAnimation {
    constructor() {
        // Inizializzazione canvas
        this.canvas = document.getElementById('particleCanvas');
        if (!this.canvas) {
            console.error('Canvas element non trovato');
            return;
        }
        
        // Setup iniziale
        this.ctx = this.canvas.getContext('2d');
        this.waves = [];
        this.waveCount = 5;
        this.isDark = document.documentElement.classList.contains('dark');
        this.time = 0;
        this.isVisible = true;
        this.fps = 60;
        this.fpsInterval = 1000 / this.fps;
        this.lastDrawTime = performance.now();
        
        // Binding dei metodi
        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        
        // Inizializzazione
        this.init();
        
        // Event listeners
        window.addEventListener('resize', throttle(this.handleResize, 250));
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        document.addEventListener('themeChanged', () => {
            this.isDark = document.documentElement.classList.contains('dark');
        });
    }

    init() {
        this.handleResize();
        this.createWaves();
        this.animate();
    }

    handleResize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.createWaves();
    }

    handleVisibilityChange() {
        this.isVisible = document.visibilityState === 'visible';
    }

    createWaves() {
        this.waves = Array.from({ length: this.waveCount }, (_, i) => ({
            frequency: 0.03 + (i * 0.01),
            amplitude: 30 - (i * 4),
            speed: 0.03 + (i * 0.015),
            offset: Math.random() * Math.PI * 2,
            density: 1 + i * 0.5
        }));
    }

    draw() {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.time += 0.05;
        
        const waveColor = this.isDark ? 
            'rgba(255, 255, 255, 0.15)' : 
            'rgba(0, 0, 0, 0.15)';
            
        const accentColor = this.isDark ? 
            'rgba(255, 59, 48, 0.2)' : 
            'rgba(255, 59, 48, 0.15)';

        this.waves.forEach((wave, index) => {
            this.ctx.beginPath();
            
            for (let x = 0; x <= this.canvas.width; x += wave.density) {
                const y = this.canvas.height / 2 + 
                    Math.sin(x * wave.frequency + wave.offset + this.time) * 
                    wave.amplitude * 
                    Math.sin(this.time * wave.speed);
                
                if (x === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }

            this.ctx.strokeStyle = index % 2 === 0 ? waveColor : accentColor;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });

        this.drawEmphasisPoints();
    }

    drawEmphasisPoints() {
        const pointColor = this.isDark ? 
            'rgba(255, 255, 255, 0.3)' : 
            'rgba(0, 0, 0, 0.3)';

        this.waves.forEach(wave => {
            for (let x = 0; x < this.canvas.width; x += 100) {
                const y = this.canvas.height / 2 + 
                    Math.sin(x * wave.frequency + wave.offset + this.time) * 
                    wave.amplitude * 
                    Math.sin(this.time * wave.speed);
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, 2, 0, Math.PI * 2);
                this.ctx.fillStyle = pointColor;
                this.ctx.fill();
            }
        });
    }

    animate(currentTime) {
        if (!this.isVisible) {
            requestAnimationFrame(this.animate);
            return;
        }

        const elapsed = currentTime - this.lastDrawTime;

        if (elapsed > this.fpsInterval) {
            this.lastDrawTime = currentTime - (elapsed % this.fpsInterval);
            this.draw();
        }

        requestAnimationFrame(this.animate);
    }
}

// Theme management class
class ThemeManager {
    constructor() {
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.init();
    }

    init() {
        this.setInitialTheme();
        this.addEventListeners();
    }

    setInitialTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = savedTheme 
            ? savedTheme === 'dark'
            : this.mediaQuery.matches;
        
        this.setTheme(prefersDark);
    }

    addEventListeners() {
        // System theme change listener
        this.mediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches);
            }
        });
    }

    setTheme(isDark) {
        const html = document.documentElement;
        
        if (isDark) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        
        const themeSwitch = document.querySelector('.theme-switch input');
        if (themeSwitch) {
            themeSwitch.checked = isDark;
        }
        
        document.dispatchEvent(new CustomEvent('themeChanged'));
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    toggleTheme() {
        const isDark = !document.documentElement.classList.contains('dark');
        this.setTheme(isDark);
    }
}

// Animation Observer class
class AnimationObserver {
    constructor() {
        this.options = {
            threshold: 0.1,
            rootMargin: '50px'
        };
        
        this.observer = new IntersectionObserver(this.handleIntersection.bind(this), this.options);
        this.init();
    }

    init() {
        document.querySelectorAll('.hero-title, .hero-subtitle, .hero-button, .feature-card')
            .forEach(el => {
                el.style.animationPlayState = 'paused';
                this.observer.observe(el);
            });
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                this.observer.unobserve(entry.target);
            }
        });
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Rimuovi il no-js flag
    document.documentElement.classList.remove('no-js');
    
    // Inizializza le classi principali
    const audioWave = new AudioWaveAnimation();
    const themeManager = new ThemeManager();
    const animationObserver = new AnimationObserver();
    
    // Collega il toggle del tema
    window.toggleDarkMode = () => themeManager.toggleTheme();
    
    // Gestione errori globale
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.message);
    });
});