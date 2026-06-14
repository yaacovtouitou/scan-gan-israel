import { useEffect, useRef } from 'react';

const useNfcScanner = (onScan) => {
    const buffer = useRef('');
    const lastKeyTime = useRef(Date.now());

    // Map de traduction AZERTY vers Chiffres
    const azertyMap = {
        'à': '0', '&': '1', 'é': '2', '"': '3', "'": '4',
        '(': '5', '-': '6', 'è': '7', '_': '8', 'ç': '9'
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTime.current;
            lastKeyTime.current = currentTime;

            if (timeDiff > 100) {
                buffer.current = '';
            }

            if (e.key === 'Enter') {
                // On accepte les chaînes de 8 à 10 caractères
                if (buffer.current.length >= 8 && buffer.current.length <= 10) {
                    onScan(buffer.current);
                }
                buffer.current = '';
            } else if (e.key.length === 1) {
                // Si c'est un chiffre direct (0-9)
                if (/\d/.test(e.key)) {
                    buffer.current += e.key;
                } 
                // Si c'est un caractère AZERTY à traduire
                else if (azertyMap[e.key]) {
                    buffer.current += azertyMap[e.key];
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onScan]);
};

export default useNfcScanner;
