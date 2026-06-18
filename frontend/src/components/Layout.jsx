import React, { useState, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const THEMES = [
    { id: 'blue', label: 'Bleu Nuit' },
    { id: 'purple', label: 'Violet' },
    { id: 'pink', label: 'Rose' },
    { id: 'red', label: 'Rouge' },
    { id: 'orange', label: 'Orange' },
    { id: 'yellow', label: 'Jaune' },
    { id: 'green', label: 'Vert' },
    { id: 'cyan', label: 'Cyan' },
    { id: 'black', label: 'Noir' },
];

const HEBREW_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת'];

const Layout = () => {
    const location = useLocation();
    const isBoutique = location.pathname === '/boutique';
    const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'blue');
    const [prestigeMode, setPrestigeMode] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Génère des lettres hébraïques flottantes distribuées aléatoirement
    const floatingLetters = useMemo(() =>
        Array.from({ length: 22 }).map((_, i) => ({
            id: i,
            char: HEBREW_LETTERS[i % HEBREW_LETTERS.length],
            left: Math.random() * 95, // position de départ horizontale
            scale: 0.7 + Math.random() * 0.8,
            delay: Math.random() * -45, // délai négatif pour qu'elles soient pré-distribuées
            duration: 20 + Math.random() * 25, // défilement très lent
            opacity: 0.03 + Math.random() * 0.07, // opacité très subtile pour ne pas gêner
        }))
    , []);

    // Particules d'étoiles flottantes ✡
    const starParticles = useMemo(() =>
        Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            left: Math.random() * 95,
            size: 0.6 + Math.random() * 0.9,
            delay: Math.random() * -30,
            duration: 18 + Math.random() * 22,
            opacity: 0.04 + Math.random() * 0.08,
            drift: -20 + Math.random() * 40,
        }))
    , []);

    const prestigeTheme = prestigeMode ? (prestigeMode === true ? 'prestige-gold' : `prestige-${prestigeMode}`) : theme;
    const prestigeActiveClasses = prestigeMode 
        ? `prestige-active prestige-${prestigeMode === true ? 'gold' : prestigeMode}-active` 
        : '';

    return (
        <div className={`app-layout theme-${prestigeTheme} ${prestigeActiveClasses}`}>
            {/* Orbes décoratives animées en arrière-plan */}
            <div className="bg-orbs-container" aria-hidden="true">
                <div className="bg-orb bg-orb--1"></div>
                <div className="bg-orb bg-orb--2"></div>
                <div className="bg-orb bg-orb--3"></div>
            </div>

            {/* Arrière-plan de lettres hébraïques flottantes */}
            <div className="hebrew-letters-bg" aria-hidden="true">
                {floatingLetters.map((l) => (
                    <span
                        key={l.id}
                        className="floating-letter"
                        style={{
                            left: `${l.left}%`,
                            opacity: l.opacity,
                            transform: `scale(${l.scale})`,
                            animationDelay: `${l.delay}s`,
                            animationDuration: `${l.duration}s`,
                        }}
                    >
                        {l.char}
                    </span>
                ))}
            </div>

            {/* Étoile filante */}
            <div className="shooting-star-container" aria-hidden="true">
                <div className="shooting-star"></div>
            </div>

            {/* Particules du logo Gan Israël et Tsivot Hashem flottantes */}
            <div className="star-particles-bg" aria-hidden="true">
                {starParticles.map((s) => (
                    <img
                        key={s.id}
                        src={s.id % 2 === 0 ? "/logo.png" : "/logo_tsivot.png"}
                        className="star-particle"
                        alt=""
                        style={{
                            left: `${s.left}%`,
                            width: `${s.size * 20}px`,
                            height: `${s.size * 20}px`,
                            opacity: s.opacity * 0.7, // Subtilité pour l'arrière-plan
                            animationDelay: `${s.delay}s`,
                            animationDuration: `${s.duration}s`,
                            '--drift': `${s.drift}px`,
                        }}
                    />
                ))}
            </div>

            {/* Menu sélecteur de thème de fond */}
            <div className="theme-selector-container">
                <button 
                    className="theme-toggle-btn"
                    onClick={() => setShowMenu(!showMenu)}
                    aria-label="Choisir la couleur du fond"
                    title="Changer de couleur"
                >
                    🎨
                </button>
                {showMenu && (
                    <div className="theme-menu" role="menu">
                        {THEMES.map((t) => (
                            <button
                                key={t.id}
                                className={`theme-menu-item theme-menu-item--${t.id} ${theme === t.id ? 'theme-menu-item--active' : ''}`}
                                onClick={() => {
                                    setTheme(t.id);
                                    localStorage.setItem('app-theme', t.id);
                                    setShowMenu(false);
                                }}
                                role="menuitem"
                            >
                                <span className="theme-menu-item__dot"></span>
                                <span className="theme-menu-item__label">{t.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Header Camp Gan Israël */}
            {!isBoutique && location.pathname !== '/admin' && (
                <header className="app-header">
                    <div className="app-header__logo-container">
                        <img 
                            src="/logo.png" 
                            className="app-header__logo-img" 
                            alt="Logo Gan Israël"
                            width="90" 
                            height="90" 
                            style={{ 
                                marginBottom: 'var(--space-xs)',
                                animation: 'gentleFloat 6s ease-in-out infinite',
                                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'
                            }}
                        />
                        <h1 className="app-header__title">
                            Bienvenue au <span className="app-header__title-accent">Gan Israël</span>
                        </h1>
                    </div>
                    <p className="app-header__subtitle">Mon espace de points & dollars</p>
                </header>
            )}

            {/* Main Content */}
            <main className="app-main">
                <Outlet context={{ setPrestigeMode }} />
            </main>

            {/* Footer */}
            <footer className="app-footer">
                <p className="app-footer__text">
                    © {new Date().getFullYear()} Tout droits réservé — Développé par <span className="app-footer__highlight">Club Ados Sarcelles Villages</span>
                </p>
            </footer>

        </div>
    );
};

export default Layout;
