import React, { useState, useMemo } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

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

    const navItems = [
        { to: '/consultation', icon: '💳', label: 'Mes Points' },
        { to: '/boutique', icon: '🎁', label: 'Boutique' },
    ];

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

            {/* Particules d'étoiles ✡ flottantes */}
            <div className="star-particles-bg" aria-hidden="true">
                {starParticles.map((s) => (
                    <span
                        key={s.id}
                        className="star-particle"
                        style={{
                            left: `${s.left}%`,
                            fontSize: `${s.size}rem`,
                            opacity: s.opacity,
                            animationDelay: `${s.delay}s`,
                            animationDuration: `${s.duration}s`,
                            '--drift': `${s.drift}px`,
                        }}
                    >
                        ✡
                    </span>
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
            {!isBoutique && (
                <header className="app-header">
                    <div className="app-header__logo-container">
                        <svg 
                            className="app-header__logo-svg" 
                            width="68" 
                            height="68" 
                            viewBox="0 0 100 100" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg" 
                            style={{ 
                                marginBottom: 'var(--space-xs)',
                                animation: 'gentleFloat 6s ease-in-out infinite',
                                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'
                            }}
                        >
                            <defs>
                                <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#FEF3C7" />
                                    <stop offset="50%" stopColor="#F59E0B" />
                                    <stop offset="100%" stopColor="#D97706" />
                                </linearGradient>
                                <linearGradient id="blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#2563EB" />
                                    <stop offset="100%" stopColor="#1E3A8A" />
                                </linearGradient>
                            </defs>
                            {/* Cercle de fond bleu profond */}
                            <circle cx="50" cy="50" r="45" fill="url(#blue-grad)" stroke="url(#gold-grad)" strokeWidth="2.5" />
                            {/* Étoile de David dorée */}
                            <path d="M50 18 L78 66 L22 66 Z" stroke="url(#gold-grad)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M50 82 L78 34 L22 34 Z" stroke="url(#gold-grad)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                            {/* Feu de camp stylisé au centre */}
                            <path d="M38 58 L62 58 M42 62 L58 54" stroke="#FEF3C7" strokeWidth="3" strokeLinecap="round" />
                            <path d="M50 38 C46 44 45 54 50 54 C55 54 54 44 50 38 Z" fill="url(#gold-grad)" />
                            <path d="M50 43 C48 47 48 54 50 54 C52 54 52 47 50 43 Z" fill="#FFFBEB" />
                        </svg>
                        <h1 className="app-header__title">
                            Bienvenue au <span className="app-header__title-accent">Gan Israël</span>
                        </h1>
                    </div>
                    <p className="app-header__subtitle">Mon espace de points</p>
                </header>
            )}

            {/* Main Content */}
            <main className="app-main">
                <Outlet context={{ setPrestigeMode }} />
            </main>


        </div>
    );
};

export default Layout;
