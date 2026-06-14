import React, { useState } from 'react';
import useNfcScanner from '../hooks/useNfcScanner';
import { getEnfant } from '../api';

const Consultation = () => {
    const [enfant, setEnfant] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleScan = async (uid) => {
        setLoading(true);
        setError('');
        try {
            const res = await getEnfant(uid);
            setEnfant(res.data);
            // On cache le résultat après 10 secondes pour libérer la tablette pour le suivant
            setTimeout(() => setEnfant(null), 10000);
        } catch (err) {
            setError('Carte inconnue !');
            setEnfant(null);
            setTimeout(() => setError(''), 3000);
        }
        setLoading(false);
    };

    useNfcScanner(handleScan);

    return (
        <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            {!enfant && !loading && (
                <div className="waiting-animation" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '100px', marginBottom: '20px' }}>💳</div>
                    <h1 style={{ fontSize: '3rem' }}>Pose ta carte ici !</h1>
                    <p style={{ fontSize: '1.5rem', opacity: 0.8 }}>Pour voir tes points</p>
                </div>
            )}

            {loading && <div className="waiting-animation" style={{ fontSize: '2rem' }}>🔍 Recherche en cours...</div>}

            {error && (
                <div className="card" style={{ backgroundColor: '#fff5f5', border: '3px solid #feb2b2', textAlign: 'center' }}>
                    <div style={{ fontSize: '60px' }}>❌</div>
                    <h2 style={{ color: '#c53030', fontSize: '2.5rem' }}>{error}</h2>
                </div>
            )}

            {enfant && (
                <div className="card" style={{ textAlign: 'center', width: '100%', maxWidth: '600px', border: '5px solid #4e73df' }}>
                    <div style={{ fontSize: '80px', marginBottom: '10px' }}>👤</div>
                    <h1 style={{ fontSize: '3.5rem', margin: '10px 0', color: '#2e3b4e' }}>{enfant.prenom}</h1>
                    <h2 style={{ fontSize: '2rem', color: '#4e73df', margin: '0 0 30px 0' }}>{enfant.nom}</h2>
                    
                    <div style={{ background: '#f8f9fc', padding: '30px', borderRadius: '15px' }}>
                        <p style={{ fontSize: '1.5rem', margin: 0, color: '#4a5568' }}>Ton solde actuel :</p>
                        <p style={{ fontSize: '5rem', fontWeight: 'bold', margin: '10px 0', color: '#1cc88a' }}>{enfant.solde} <span style={{ fontSize: '2rem' }}>pts</span></p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Consultation;
