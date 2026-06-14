import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        <div>
            <nav style={{ 
                padding: '20px', 
                backgroundColor: '#333', 
                color: 'white', 
                display: 'flex', 
                gap: '20px',
                justifyContent: 'center'
            }}>
                <Link to="/consultation" style={{ color: 'white', fontSize: '20px', textDecoration: 'none' }}>Salle 1 : Consultation</Link>
                <Link to="/boutique" style={{ color: 'white', fontSize: '20px', textDecoration: 'none' }}>Salle 2 : Boutique</Link>
            </nav>
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
