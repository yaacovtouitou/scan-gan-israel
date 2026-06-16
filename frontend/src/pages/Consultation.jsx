import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import useNfcScanner from '../hooks/useNfcScanner';
import { getEnfant } from '../api';

// Comptes de test (correspondant à init.sql)
const DEMO_ACCOUNTS = [
    { uid: '12345678', label: '🧒 Levi Cohen' },
    { uid: '87654321', label: '👧 Sarah Levy' },
];

// Hook pour animer un compteur de 0 à la valeur cible
const useCountUp = (target, duration = 1500) => {
    const [count, setCount] = useState(0);
    const prevTarget = useRef(null);

    useEffect(() => {
        if (target === null || target === undefined) {
            setCount(0);
            prevTarget.current = null;
            return;
        }
        if (target === prevTarget.current) return;
        prevTarget.current = target;

        setCount(0); // Affiche 0 avant de commencer à compter

        const startTime = performance.now();
        const startVal = 0;
        const endVal = target;

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Easing: easeOutExpo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setCount(Math.round(startVal + (endVal - startVal) * eased));
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        // Petit délai pour que le 0 soit visible avant le décompte
        setTimeout(() => requestAnimationFrame(animate), 150);
    }, [target, duration]);

    return count;
};

const Consultation = () => {
    const [enfant, setEnfant] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [confetti, setConfetti] = useState([]);
    const [isVibrating, setIsVibrating] = useState(false);
    const animatedPoints = useCountUp(enfant ? enfant.solde : null);
    
    // Récupère la fonction pour activer le thème Prestige depuis Layout.jsx
    const { setPrestigeMode } = useOutletContext() || { setPrestigeMode: () => {} };

    // Références pour les minuteurs afin de pouvoir les annuler
    const closeTimeoutRef = useRef(null);
    const confettiTimeoutRef = useRef(null);

    const handleClose = () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
        setEnfant(null);
        setPrestigeMode(false);
        setConfetti([]);
    };

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
            if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
        };
    }, []);

    const handleScan = async (uid) => {
        setLoading(true);
        setError('');
        setIsVibrating(true);
        
        // Nettoyer les timeouts existants avant de relancer un scan
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
        
        // Vibration physique du lecteur NFC au scan (si supporté par l'appareil)
        if (navigator.vibrate) navigator.vibrate(50);
        
        // Stoppe l'animation de vibration CSS après 400ms
        setTimeout(() => setIsVibrating(false), 400);

        try {
            const res = await getEnfant(uid);
            setEnfant(res.data);
            
            // Vibration de succès
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

            // Thème de prestige si rang maximum
            if (res.data.solde >= 200) {
                setPrestigeMode(true);
            }

            // Célébration confettis (Explosion depuis le centre)
            const colors = ['#F4B400', '#2563EB', '#4DA8DA', '#22C55E', '#EF4444', '#A855F7'];
            const particles = Array.from({ length: 45 }).map((_, i) => ({
                id: i,
                color: colors[Math.floor(Math.random() * colors.length)],
                dx: `${-150 + Math.random() * 300}px`, // Explosion horizontale
                dy: `${-300 + Math.random() * 100}px`, // Explosion vers le haut
                delay: Math.random() * 0.1,
            }));
            setConfetti(particles);

            // On cache le résultat après 10 secondes pour libérer la tablette pour le suivant
            closeTimeoutRef.current = setTimeout(() => {
                setEnfant(null);
                setPrestigeMode(false);
            }, 10000);
            confettiTimeoutRef.current = setTimeout(() => setConfetti([]), 4000);
        } catch (err) {
            setError('Carte inconnue !');
            setEnfant(null);
            setPrestigeMode(false);
            setTimeout(() => setError(''), 3000);
        }
        setLoading(false);
    };

    useNfcScanner(handleScan);

    // Emojis pour l'avatar basés sur le prénom
    const avatarEmojis = ['😎', '🤩', '😄', '🥳', '🦸', '⭐', '🎯', '🏆'];
    const getAvatarEmoji = (name) => {
        if (!name) return '😊';
        const index = name.charCodeAt(0) % avatarEmojis.length;
        return avatarEmojis[index];
    };

    // Étoiles proportionnelles au solde
    const getStars = (solde) => {
        if (solde >= 200) return '⭐⭐⭐⭐⭐';
        if (solde >= 150) return '⭐⭐⭐⭐';
        if (solde >= 100) return '⭐⭐⭐';
        if (solde >= 50) return '⭐⭐';
        if (solde >= 10) return '⭐';
        return '';
    };

    // Rangs de camping basés sur le solde
    const getCampRank = (solde) => {
        if (solde >= 200) return { title: '🚀 Roi du Gan', class: 'rank-badge--5' };
        if (solde >= 150) return { title: '👑 Légende du Camp', class: 'rank-badge--4' };
        if (solde >= 100) return { title: '🦅 Super Campeur', class: 'rank-badge--3' };
        if (solde >= 50) return { title: '🔥 Éclaireur', class: 'rank-badge--2' };
        return { title: '🏕️ Jeune Campeur', class: 'rank-badge--1' };
    };

    // Calcul de la progression vers le prochain rang
    const getRankProgress = (solde) => {
        const tiers = [
            { threshold: 0, title: '🏕️ Jeune Campeur', nextThreshold: 50, nextTitle: '🔥 Éclaireur' },
            { threshold: 50, title: '🔥 Éclaireur', nextThreshold: 100, nextTitle: '🦅 Super Campeur' },
            { threshold: 100, title: '🦅 Super Campeur', nextThreshold: 150, nextTitle: '👑 Légende du Camp' },
            { threshold: 150, title: '👑 Légende du Camp', nextThreshold: 200, nextTitle: '🚀 Roi du Gan' },
            { threshold: 200, title: '🚀 Roi du Gan', nextThreshold: null, nextTitle: null }
        ];
        
        // On cherche le tier actuel en partant du plus haut
        const currentTier = [...tiers].reverse().find(t => solde >= t.threshold);
        if (!currentTier.nextThreshold) {
            return { isMax: true, percentage: 100 };
        }
        
        const pointsInTier = solde - currentTier.threshold;
        const tierSize = currentTier.nextThreshold - currentTier.threshold;
        const percentage = Math.min(100, Math.max(0, (pointsInTier / tierSize) * 100));
        const pointsToNext = currentTier.nextThreshold - solde;
        
        return {
            isMax: false,
            percentage,
            pointsToNext,
            nextTitle: currentTier.nextTitle
        };
    };

    return (
        <div className="consultation-page">
            {/* Effet confettis si actif */}
            {confetti.length > 0 && (
                <div className="confetti-container">
                    {confetti.map((c) => (
                        <div
                            key={c.id}
                            className="confetti-particle"
                            style={{
                                backgroundColor: c.color,
                                animationDelay: `${c.delay}s`,
                                '--dx': c.dx,
                                '--dy': c.dy
                            }}
                        />
                    ))}
                </div>
            )}

            {/* État d'attente — Scan NFC */}
            {!enfant && !loading && !error && (
                <div className="scan-waiting">
                    <div className="scan-waiting__container">
                        <div className="scan-waiting__left">
                            <div className="nfc-reader-container">
                                {/* Ondes de scan animées en arrière-plan */}
                                <div className="nfc-pulse-waves">
                                    <div className="nfc-pulse-wave nfc-pulse-wave--1"></div>
                                    <div className="nfc-pulse-wave nfc-pulse-wave--2"></div>
                                    <div className="nfc-pulse-wave nfc-pulse-wave--3"></div>
                                </div>
                                <div className={`nfc-reader ${isVibrating ? 'nfc-reader--vibrate' : ''}`}>
                                    <div className="nfc-reader__screen">
                                        <div className="nfc-reader__scanline" />
                                        <div className="nfc-reader__status-dot" />
                                        <span style={{ letterSpacing: '1px', fontWeight: '800' }}>LECTEUR NFC</span>
                                        <span style={{ fontSize: '0.6rem', color: '#34d399', opacity: 0.9 }}>PRÊT À SCANNER</span>
                                    </div>
                                    <div className="nfc-reader__zone" aria-hidden="true">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
                                            <path d="M5 8a10 10 0 0 1 14 0" />
                                            <path d="M8 11a6 6 0 0 1 8 0" />
                                            <path d="M11 14a2 2 0 0 1 2 0" />
                                        </svg>
                                    </div>
                                    <div className="nfc-card-mockup" aria-hidden="true" />
                                </div>
                            </div>
                            <h1 className="scan-waiting__title">Scanne ta carte !</h1>
                            <p className="scan-waiting__subtitle">
                                Pose-la sur le lecteur pour voir tes points
                            </p>
                        </div>

                        <div className="scan-waiting__right">
                            <div className="scan-waiting__camp-badge">
                                🏕️ Camp Gan Israël
                            </div>

                            {/* Slogan & Pensée du Rabbi */}
                            <div className="scan-waiting__inspiration">
                                <p className="scan-waiting__slogan">L'été de ta vie ! ✨</p>
                                <div className="scan-waiting__quote-box">
                                    <span className="quote-icon" aria-hidden="true">❝</span>
                                    <p className="quote-text">
                                        Un peu de lumière repousse beaucoup d'obscurité.
                                    </p>
                                    <p className="quote-author">— Le Rabbi de Loubavitch</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Console administrative de simulation */}
                    <div className="demo-bar">
                        <p className="demo-bar__label">🔧 Console d'Administration — Simuler Scan :</p>
                        <div className="demo-bar__buttons">
                            {DEMO_ACCOUNTS.map((account) => (
                                <button
                                    key={account.uid}
                                    className="demo-bar__btn"
                                    onClick={() => handleScan(account.uid)}
                                >
                                    {account.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Chargement */}
            {loading && (
                <div className="scan-loading">
                    <span className="scan-loading__icon" role="img" aria-label="Recherche">
                        🔍
                    </span>
                    <p className="scan-loading__text">Recherche en cours...</p>
                </div>
            )}

            {/* Erreur */}
            {error && (
                <div className="card scan-error">
                    <span className="scan-error__icon" role="img" aria-label="Erreur">
                        😕
                    </span>
                    <h2 className="scan-error__text">{error}</h2>
                </div>
            )}

            {/* Résultat — Profil de l'enfant */}
            {enfant && (
                <div className="card scan-result">
                    <button className="scan-result__close" onClick={handleClose} aria-label="Fermer">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <span className="scan-result__camp-tag">Gan Israël</span>

                    <div className="scan-result__avatar">
                        {getAvatarEmoji(enfant.prenom)}
                    </div>
                    <h1 className="scan-result__name">{enfant.prenom} {enfant.nom}</h1>

                    {/* Badge de Rang */}
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <span className={`rank-badge ${getCampRank(enfant.solde).class}`}>
                            {getCampRank(enfant.solde).title}
                        </span>
                    </div>

                    <div className="scan-result__points-box">
                        <p className="scan-result__points-label">Ton solde actuel</p>
                        <p className="scan-result__points-value">
                            {animatedPoints}
                            <span className="scan-result__points-unit"> pts</span>
                        </p>
                        {enfant.solde > 0 && (
                            <p className="scan-result__points-stars" aria-label={`Niveau ${Math.min(5, Math.floor(enfant.solde / 40) + 1)} étoiles`}>
                                {getStars(enfant.solde)}
                            </p>
                        )}
                    </div>

                    {/* Progression vers le prochain rang */}
                    <div className="rank-progress-container">
                        {(() => {
                            const progress = getRankProgress(enfant.solde);
                            if (progress.isMax) {
                                return <p className="rank-progress-text">Bravo, tu es au niveau maximum ! 🏆</p>;
                            }
                            return (
                                <>
                                    <div className="rank-progress-bar">
                                        <div 
                                            className="rank-progress-fill" 
                                            style={{ width: `${progress.percentage}%` }}
                                        ></div>
                                    </div>
                                    <p className="rank-progress-text">
                                        Plus que <strong>{progress.pointsToNext} pts</strong> pour devenir {progress.nextTitle} !
                                    </p>
                                </>
                            );
                        })()}
                    </div>

                    {/* Barre timer — se vide en 10s */}
                    <div className="timer-bar" aria-hidden="true" />
                </div>
            )}
        </div>
    );
};

export default Consultation;
