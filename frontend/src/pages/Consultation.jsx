import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import useNfcScanner from '../hooks/useNfcScanner';
import { getEnfant, getLeaderboard } from '../api';


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
    const [leaderboard, setLeaderboard] = useState([]);
    const animatedPoints = useCountUp(enfant ? enfant.solde : null);
    const animatedDollars = useCountUp(enfant ? enfant.dollars : null);
    
    // Récupère la fonction pour activer le thème Prestige depuis Layout.jsx
    const { setPrestigeMode } = useOutletContext() || { setPrestigeMode: () => {} };

    // Références pour les minuteurs afin de pouvoir les annuler
    const closeTimeoutRef = useRef(null);
    const confettiTimeoutRef = useRef(null);

    const fetchLeaderboard = async () => {
        try {
            const res = await getLeaderboard();
            setLeaderboard(res.data || []);
        } catch (err) {
            console.error('Erreur lors du chargement du classement', err);
            setLeaderboard([]);
        }
    };

    const handleClose = () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
        setEnfant(null);
        setPrestigeMode(false);
        setConfetti([]);
        fetchLeaderboard(); // Rafraîchit les scores après fermeture du profil
    };

    useEffect(() => {
        fetchLeaderboard();
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
            const enfantData = res.data;
            setEnfant(enfantData);
            
            // Vibration de succès
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

            // Recupere le classement a jour pour determiner le rang du scan
            let currentLeaderboard = [];
            try {
                const leaderboardRes = await getLeaderboard();
                currentLeaderboard = leaderboardRes.data || [];
            } catch (err) {
                console.error('Erreur classement au scan', err);
            }
            setLeaderboard(currentLeaderboard);

            // Thème de prestige selon le solde de l'enfant (Gold pour >= 2630, Silver pour >= 2430, Bronze pour >= 2230)
            if (enfantData.solde >= 2630) {
                setPrestigeMode('gold');
            } else if (enfantData.solde >= 2430) {
                setPrestigeMode('silver');
            } else if (enfantData.solde >= 2230) {
                setPrestigeMode('bronze');
            } else {
                setPrestigeMode(false);
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

            confettiTimeoutRef.current = setTimeout(() => setConfetti([]), 4000);

            // Fermeture automatique du profil après 20 secondes
            closeTimeoutRef.current = setTimeout(() => {
                handleClose();
            }, 20000);
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
        if (solde >= 2630) return '⭐⭐⭐⭐⭐';
        if (solde >= 2430) return '⭐⭐⭐⭐';
        if (solde >= 2230) return '⭐⭐⭐';
        if (solde >= 2010) return '⭐⭐';
        if (solde >= 1780) return '⭐';
        return '';
    };

    // Rangs de camping basés sur le solde
    const getCampRank = (solde) => {
        if (solde >= 2630) return { title: '👑 General 3 étoiles', class: 'rank-badge--5' };
        if (solde >= 2430) return { title: '🌠 General 2 étoiles', class: 'rank-badge--4' };
        if (solde >= 2230) return { title: '⭐ General 1 étoile', class: 'rank-badge--3' };
        if (solde >= 2010) return { title: '⚡ General', class: 'rank-badge--2' };
        if (solde >= 1780) return { title: '🔥 Colonel', class: 'rank-badge--1' };
        if (solde >= 1500) return { title: '🦁 Capitaine', class: 'rank-badge--1' };
        if (solde >= 1370) return { title: '🦅 Lieutenant', class: 'rank-badge--1' };
        if (solde >= 1140) return { title: '💫 Sous-Lieutenant', class: 'rank-badge--1' };
        if (solde >= 900) return { title: '🌟 Adjudant-Chef', class: 'rank-badge--1' };
        if (solde >= 670) return { title: '🏅 Adjudant', class: 'rank-badge--1' };
        if (solde >= 420) return { title: '🎖️ Sergent', class: 'rank-badge--1' };
        if (solde >= 230) return { title: '⚔️ Caporal', class: 'rank-badge--1' };
        return { title: '🪖 Soldat', class: 'rank-badge--1' };
    };

    // Calcul de la progression vers le prochain rang
    const getRankProgress = (solde) => {
        const tiers = [
            { threshold: 0, title: '🪖 Soldat', nextThreshold: 230, nextTitle: '⚔️ Caporal' },
            { threshold: 230, title: '⚔️ Caporal', nextThreshold: 420, nextTitle: '🎖️ Sergent' },
            { threshold: 420, title: '🎖️ Sergent', nextThreshold: 670, nextTitle: '🏅 Adjudant' },
            { threshold: 670, title: '🏅 Adjudant', nextThreshold: 900, nextTitle: '🌟 Adjudant-Chef' },
            { threshold: 900, title: '🌟 Adjudant-Chef', nextThreshold: 1140, nextTitle: '💫 Sous-Lieutenant' },
            { threshold: 1140, title: '💫 Sous-Lieutenant', nextThreshold: 1370, nextTitle: '🦅 Lieutenant' },
            { threshold: 1370, title: '🦅 Lieutenant', nextThreshold: 1500, nextTitle: '🦁 Capitaine' },
            { threshold: 1500, title: '🦁 Capitaine', nextThreshold: 1780, nextTitle: '🔥 Colonel' },
            { threshold: 1780, title: '🔥 Colonel', nextThreshold: 2010, nextTitle: '⚡ General' },
            { threshold: 2010, title: '⚡ General', nextThreshold: 2230, nextTitle: '⭐ General 1 étoile' },
            { threshold: 2230, title: '⭐ General 1 étoile', nextThreshold: 2430, nextTitle: '🌠 General 2 étoiles' },
            { threshold: 2430, title: '🌠 General 2 étoiles', nextThreshold: 2630, nextTitle: '👑 General 3 étoiles' },
            { threshold: 2630, title: '👑 General 3 étoiles', nextThreshold: null, nextTitle: null }
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
                        {/* Derniers scans */}
                        <div className="scan-waiting__leaderboard">
                            <div className="leaderboard-card">
                                <h2 className="leaderboard-title">🕒 Derniers Scans</h2>
                                <div className="leaderboard-list">
                                    {leaderboard.map((item, index) => {
                                        const scanIcons = ['⚡', '🕒', '🕒'];
                                        return (
                                            <div key={index} className={`leaderboard-row rank-${index + 1}`}>
                                                <span className="leaderboard-row__medal">{scanIcons[index]}</span>
                                                <span className="leaderboard-row__name">
                                                    {item.prenom} {item.nom}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

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
                                Pose-la sur le lecteur pour voir tes points et tes dollars
                            </p>
                        </div>

                        <div className="scan-waiting__right">
                            {/* Slogan & Pensée du Rabbi */}
                            <div className="scan-waiting__inspiration">
                                <div className="leaderboard-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                    <div className="scan-waiting__quote-badge" style={{ 
                                        fontSize: '2.5rem', 
                                        marginBottom: 'var(--space-xs)',
                                        animation: 'gentleFloat 5s ease-in-out infinite',
                                        filter: 'drop-shadow(0 4px 10px rgba(244, 180, 0, 0.35))'
                                    }}>
                                        📜
                                    </div>
                                    <h2 className="leaderboard-title" style={{ margin: '0 0 var(--space-lg) 0' }}>
                                        ✨ Devise du Gan
                                    </h2>
                                    <div style={{ position: 'relative', width: '100%', padding: '0 var(--space-sm)' }}>
                                        <span className="quote-icon" aria-hidden="true" style={{ top: '-20px', left: '-5px', fontSize: '3rem' }}>❝</span>
                                        <p className="quote-text" style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)' }}>
                                            En fonction de l'effort la récompense.
                                        </p>
                                        <p className="quote-author" style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>— Gan Israel</p>
                                    </div>
                                </div>
                            </div>
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
                        <img 
                            src="/logo.png" 
                            alt="Logo Gan Israël" 
                            className="scan-result__avatar-img"
                        />
                    </div>
                    <h1 className="scan-result__name">
                        <span className="scan-result__greeting">Salut </span>
                        <span className="scan-result__username">{enfant.prenom} {enfant.nom}</span>
                    </h1>

                    {/* Badge de Rang */}
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <span className={`rank-badge ${getCampRank(enfant.solde).class}`}>
                            {getCampRank(enfant.solde).title}
                        </span>
                    </div>

                    <div className="scan-result__balances-grid">
                        <div className="scan-result__points-box">
                            <p className="scan-result__points-label">Points</p>
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
                        <div className="scan-result__points-box">
                            <p className="scan-result__points-label">Dollars</p>
                            <p className="scan-result__points-value">
                                {animatedDollars}
                                <span className="scan-result__points-unit"> $</span>
                            </p>
                        </div>
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

                    {/* Derniers Achats */}
                    <div className="scan-result__purchases">
                        <h3 className="purchases-title">🛍️ Mes Derniers Achats</h3>
                        {enfant.derniersAchats && enfant.derniersAchats.length > 0 ? (
                            <div className="purchases-list">
                                {enfant.derniersAchats.map((achat, idx) => (
                                    <div key={idx} className="purchase-row">
                                        <span className="purchase-desc">{achat.description}</span>
                                        <span className="purchase-points">-{achat.points} $</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="purchases-empty">Aucun achat pour le moment</p>
                        )}
                    </div>

                    {/* Barre de compte à rebours visuelle (20s) */}
                    <div className="timer-bar-container">
                        <div className="timer-bar" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Consultation;
