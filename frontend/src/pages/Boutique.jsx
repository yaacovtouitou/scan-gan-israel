import React, { useState, useEffect } from 'react';
import useNfcScanner from '../hooks/useNfcScanner';
import { getCadeaux, effectuerAchat } from '../api';

const Boutique = () => {
    const [cadeaux, setCadeaux] = useState([]);
    const [panier, setPanier] = useState([]);
    const [phase, setPhase] = useState('CHOIX'); 
    const [status, setStatus] = useState({ message: '', type: '' });

    useEffect(() => {
        fetchCadeaux();
    }, []);

    const fetchCadeaux = async () => {
        try {
            const res = await getCadeaux();
            setCadeaux(res.data);
        } catch (err) {
            console.error('Erreur chargement cadeaux', err);
        }
    };

    const addToCart = (cadeau) => {
        setPanier([...panier, cadeau]);
    };

    const removeFromCart = (index) => {
        const newPanier = [...panier];
        newPanier.splice(index, 1);
        setPanier(newPanier);
    };

    const total = panier.reduce((sum, item) => sum + item.prix, 0);

    const handleScan = async (uid) => {
        if (phase !== 'PAIEMENT') return;

        try {
            const res = await effectuerAchat({ uid, panier });
            setStatus({ message: `Génial ! Achat réussi. Nouveau solde : ${res.data.nouveauSolde} pts`, type: 'success' });
            setPanier([]);
            setPhase('CHOIX');
            setTimeout(() => setStatus({ message: '', type: '' }), 5000);
        } catch (err) {
            setStatus({ message: err.response?.data?.message || 'Oups ! Erreur de paiement', type: 'error' });
            setPhase('CHOIX');
            setTimeout(() => setStatus({ message: '', type: '' }), 5000);
        }
    };

    useNfcScanner(handleScan);

    return (
        <div style={{ padding: '30px' }}>
            <h1 style={{ color: 'white', textAlign: 'center', fontSize: '3rem', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>🎁 La Boutique Magique</h1>
            
            {status.message && (
                <div className="card" style={{ 
                    position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
                    backgroundColor: status.type === 'success' ? '#c6f6d5' : '#fed7d7',
                    border: `3px solid ${status.type === 'success' ? '#48bb78' : '#f56565'}`
                }}>
                    <h2 style={{ margin: 0, color: status.type === 'success' ? '#2f855a' : '#c53030' }}>{status.message}</h2>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', marginTop: '30px' }}>
                {/* Grille Cadeaux */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                    {cadeaux.map(c => (
                        <div key={c.id} className="card" onClick={() => addToCart(c)} style={{ 
                            cursor: 'pointer', textAlign: 'center', border: 'none', overflow: 'hidden'
                        }}>
                            <div style={{ fontSize: '60px', padding: '20px', background: '#f8f9fc', borderRadius: '15px' }}>🎁</div>
                            <h3 style={{ margin: '15px 0' }}>{c.nom}</h3>
                            <div className="price-tag" style={{ fontSize: '1.2rem' }}>{c.prix} pts</div>
                        </div>
                    ))}
                </div>

                {/* Panier Style Amazon */}
                <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '30px', border: '3px solid #4e73df' }}>
                    <h2 style={{ borderBottom: '2px solid #edf2f7', paddingBottom: '15px', marginTop: 0 }}>🛒 Mon Panier</h2>
                    {panier.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#718096', padding: '40px 0' }}>Ton panier est vide.<br/>Choisis un cadeau !</p>
                    ) : (
                        <div>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {panier.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #edf2f7' }}>
                                        <span style={{ fontWeight: '500' }}>{item.nom}</span>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={{ color: '#1cc88a', fontWeight: 'bold' }}>{item.prix} pts</span>
                                            <button onClick={() => removeFromCart(idx)} style={{ marginLeft: '10px', background: '#fed7d7', color: '#c53030', border: 'none', borderRadius: '5px', padding: '5px 8px', cursor: 'pointer' }}>✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div style={{ textAlign: 'right', marginTop: '20px', padding: '15px 0', borderTop: '2px solid #edf2f7' }}>
                                <span style={{ fontSize: '1.2rem', color: '#4a5568' }}>Total : </span>
                                <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4e73df' }}>{total} pts</span>
                            </div>

                            {phase === 'CHOIX' ? (
                                <button className="btn-primary" onClick={() => setPhase('PAIEMENT')} style={{ width: '100%', marginTop: '10px' }}>
                                    ✅ Terminer mes achats
                                </button>
                            ) : (
                                <div style={{ 
                                    marginTop: '20px', padding: '20px', backgroundColor: '#ebf8ff', 
                                    border: '3px dashed #4299e1', borderRadius: '15px', textAlign: 'center'
                                }}>
                                    <div className="waiting-animation" style={{ fontSize: '40px', color: '#2b6cb0' }}>💳</div>
                                    <p style={{ fontWeight: 'bold', color: '#2b6cb0', margin: '10px 0' }}>POSE TA CARTE SUR LE LECTEUR</p>
                                    <button onClick={() => setPhase('CHOIX')} style={{ background: 'none', border: 'none', color: '#4299e1', textDecoration: 'underline', cursor: 'pointer' }}>Annuler</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Boutique;
