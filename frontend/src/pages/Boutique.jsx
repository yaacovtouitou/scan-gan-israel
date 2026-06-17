import React, { useState, useEffect } from 'react';
import useNfcScanner from '../hooks/useNfcScanner';
import { getCadeaux, effectuerAchat } from '../api';

// Comptes de test (correspondant à init.sql)
const DEMO_ACCOUNTS = [
    { uid: '12345678', label: '🧒 Levi Cohen' },
    { uid: '87654321', label: '👧 Sarah Levy' },
];

// Données démo si le backend n'est pas connecté
const DEMO_CADEAUX = [
    { id: 1, nom: 'Porte-clé Gan', prix: 20, stock: 50 },
    { id: 2, nom: 'Casquette Camp', prix: 50, stock: 20 },
    { id: 3, nom: 'T-shirt Gan Israël', prix: 100, stock: 10 },
    { id: 4, nom: 'Gourde Métal', prix: 80, stock: 15 },
    { id: 5, nom: 'Peluche Lion', prix: 120, stock: 8 },
    { id: 6, nom: 'Bracelet Gan', prix: 15, stock: 100 },
];

// Emojis pour les cadeaux basés sur le nom
const giftEmojiMap = {
    'porte-clé': '🔑',
    'casquette': '🧢',
    't-shirt': '👕',
    'bracelet': '📿',
    'peluche': '🧸',
    'ballon': '⚽',
    'livre': '📚',
    'jeu': '🎮',
    'bonbon': '🍬',
    'stylo': '🖊️',
    'sticker': '⭐',
    'puzzle': '🧩',
    'gourde': '🥤',
    'sac': '🎒',
};

const getGiftEmoji = (name) => {
    const lower = name.toLowerCase();
    for (const [key, emoji] of Object.entries(giftEmojiMap)) {
        if (lower.includes(key)) return emoji;
    }
    return '🎁';
};

const Boutique = () => {
    const [cadeaux, setCadeaux] = useState([]);
    const [panier, setPanier] = useState([]);
    const [phase, setPhase] = useState('CHOIX');
    const [status, setStatus] = useState({ message: '', type: '' });
    const [wobble, setWobble] = useState(false);
    const [confetti, setConfetti] = useState([]);

    useEffect(() => {
        fetchCadeaux();
    }, []);

    const fetchCadeaux = async () => {
        try {
            const res = await getCadeaux();
            const dataToUse = res.data || [];
            const sortedData = [...dataToUse].sort((a, b) => a.prix - b.prix);
            setCadeaux(sortedData.length > 0 ? sortedData : DEMO_CADEAUX);
        } catch (err) {
            console.warn('Backend non disponible — mode démo activé');
            setCadeaux(DEMO_CADEAUX);
        }
    };

    const addToCart = (cadeau) => {
        setPanier([...panier, cadeau]);
        setWobble(true);
        setTimeout(() => setWobble(false), 600); // Réinitialise l'animation après sa durée
    };

    const removeFromCart = (index) => {
        const newPanier = [...panier];
        newPanier.splice(index, 1);
        setPanier(newPanier);
    };

    const total = panier.reduce((sum, item) => sum + item.prix, 0);

    const triggerConfetti = () => {
        const colors = ['#F4B400', '#2563EB', '#4DA8DA', '#22C55E', '#EF4444', '#A855F7'];
        const particles = Array.from({ length: 45 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.random() * 0.4,
            duration: 1.2 + Math.random() * 1.5,
        }));
        setConfetti(particles);
        setTimeout(() => setConfetti([]), 4000);
    };

    const handleScan = async (uid) => {
        if (phase !== 'PAIEMENT') return;

        try {
            const res = await effectuerAchat({ uid, panier });
            setStatus({
                message: `🎉 Achat réussi ! Nouveau solde : ${res.data.nouveauSolde} $`,
                type: 'success',
            });
            triggerConfetti();
            setPanier([]);
            setPhase('CHOIX');
            setTimeout(() => setStatus({ message: '', type: '' }), 5000);
        } catch (err) {
            setStatus({
                message: err.response?.data?.message || '😕 Oups ! Erreur de paiement',
                type: 'error',
            });
            setPhase('CHOIX');
            setTimeout(() => setStatus({ message: '', type: '' }), 5000);
        }
    };

    useNfcScanner(handleScan);

    // Classes de rareté basées sur le prix
    const getRarityClass = (prix) => {
        if (prix >= 80) return 'gift-card--legendary';
        if (prix >= 30) return 'gift-card--rare';
        return 'gift-card--common';
    };

    const getRarityLabel = (prix) => {
        if (prix >= 80) return '⭐ Collection Gan';
        if (prix >= 30) return '✨ Premium';
        return '🏕️ Souvenir';
    };

    return (
        <div className="boutique-page">
            {/* Effet confettis si achat réussi */}
            {confetti.length > 0 && (
                <div className="confetti-container">
                    {confetti.map((c) => (
                        <div
                            key={c.id}
                            className="confetti-particle"
                            style={{
                                left: `${c.left}%`,
                                backgroundColor: c.color,
                                animationDelay: `${c.delay}s`,
                                animationDuration: `${c.duration}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            <h1 className="boutique-page__title">🎁 COLOBAR</h1>
            <p className="boutique-page__subtitle">Échange tes dollars contre des cadeaux !</p>


            {/* Toast notification */}
            {status.message && (
                <div className={`toast toast--${status.type}`} role="alert">
                    {status.message}
                </div>
            )}

            <div className="boutique-layout">
                {/* Panier */}
                <div className={`card cart ${panier.length > 0 ? 'cart--visible' : ''}`}>
                    <div className="cart__main-panel">
                        <div className={`cart__header ${wobble ? 'cart-wobble' : ''}`}>
                            <span aria-hidden="true" style={{ fontSize: '1.5rem' }}>🛒</span>
                            <span>Mon Panier</span>
                            {panier.length > 0 && (
                                <span className="cart__count">{panier.length}</span>
                            )}
                        </div>

                        {panier.length === 0 ? (
                            <div className="cart__empty">
                                <span className="cart__empty-icon" aria-hidden="true">
                                    🛒
                                </span>
                                <p>
                                    Ton panier est vide.
                                    <br />
                                    Choisis un cadeau !
                                </p>
                            </div>
                        ) : (
                            <div className="cart__items">
                                {panier.map((item, idx) => (
                                    <div key={idx} className="cart-item">
                                        <span className="cart-item__name">
                                            {getGiftEmoji(item.nom)} {item.nom}
                                        </span>
                                        <div className="cart-item__right">
                                            <span className="cart-item__price">
                                                {item.prix} $
                                            </span>
                                            <button
                                                className="cart-item__remove"
                                                onClick={() => removeFromCart(idx)}
                                                aria-label={`Retirer ${item.nom} du panier`}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {panier.length > 0 && (
                        <div className="cart__side-panel">
                            <div className="cart__total">
                                <span className="cart__total-label">Total</span>
                                <span className="cart__total-value">{total} $</span>
                            </div>

                            <button
                                className="btn btn--gold btn--full btn--lg"
                                onClick={() => setPhase('PAIEMENT')}
                            >
                                ✡️ Payer mes cadeaux
                            </button>
                        </div>
                    )}
                </div>

                {/* Grille de cadeaux */}
                <div className="gifts-grid">
                    {cadeaux.map((c) => {
                        const rarityClass = getRarityClass(c.prix);
                        return (
                            <div
                                key={c.id}
                                className={`card card--interactive gift-card ${rarityClass}`}
                                onClick={() => addToCart(c)}
                                role="button"
                                tabIndex={0}
                                aria-label={`Ajouter ${c.nom} au panier — ${c.prix} dollars`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') addToCart(c);
                                }}
                            >
                                <span className="gift-card__rarity-tag" style={{
                                    fontSize: '0.75rem',
                                    fontWeight: '800',
                                    display: 'block',
                                    marginBottom: 'var(--space-xs)',
                                    opacity: 0.65
                                }}>
                                    {getRarityLabel(c.prix)}
                                </span>
                                <span className="gift-card__emoji" aria-hidden="true">
                                    {getGiftEmoji(c.nom)}
                                </span>
                                <h3 className="gift-card__name">{c.nom}</h3>
                                {c.stock !== undefined && (
                                    <p
                                        className={`gift-card__stock ${
                                            c.stock <= 5 ? 'gift-card__stock--low' : ''
                                        }`}
                                    >
                                        {c.stock > 0
                                            ? `${c.stock} en stock`
                                            : 'Rupture de stock'}
                                    </p>
                                )}
                                <span className="badge badge--price">{c.prix} $</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Overlay de paiement NFC - Style Smart Terminal */}
            {phase === 'PAIEMENT' && (
                <div className="payment-overlay" role="dialog" aria-modal="true">
                    <div className="payment-card payment-card--arcade">
                        <div className="nfc-reader-container" style={{ transform: 'scale(0.85)', margin: '-10px 0 var(--space-md)' }}>
                            {/* Ondes de scan animées en arrière-plan */}
                            <div className="nfc-pulse-waves">
                                <div className="nfc-pulse-wave nfc-pulse-wave--1"></div>
                                <div className="nfc-pulse-wave nfc-pulse-wave--2"></div>
                                <div className="nfc-pulse-wave nfc-pulse-wave--3"></div>
                            </div>
                            <div className="nfc-reader nfc-reader--active">
                                <div className="nfc-reader__screen" style={{ color: '#F4B400' }}>
                                    <div className="nfc-reader__scanline" />
                                    <div className="nfc-reader__status-dot" />
                                    <span style={{ letterSpacing: '0.5px', fontWeight: '800' }}>PAIEMENT NFC</span>
                                    <span style={{ fontSize: '0.6rem', color: '#34d399', fontWeight: '800' }}>TOTAL: {total} $</span>
                                </div>
                                <div className="nfc-reader__zone" aria-hidden="true">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
                                        <path d="M5 8a10 10 0 0 1 14 0" />
                                        <path d="M8 11a6 6 0 0 1 8 0" />
                                        <path d="M11 14a2 2 0 0 1 2 0" />
                                    </svg>
                                </div>
                                <div className="nfc-card-mockup" aria-hidden="true" />
                            </div>
                        </div>

                        <h2 className="payment-card__text">
                            Pose ta carte sur le lecteur
                        </h2>
                        <p className="payment-card__subtext">
                            Pour payer {total} $
                        </p>

                        {/* Console administrative de simulation */}
                        <div className="demo-bar demo-bar--compact" style={{ marginTop: 'var(--space-md)' }}>
                            <p className="demo-bar__label">🔧 Mode Démo — Simuler Paiement :</p>
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

                        <button
                            className="btn btn--ghost"
                            onClick={() => setPhase('CHOIX')}
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Boutique;
