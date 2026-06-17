import React from 'react';

const Admin = () => {
    const iframeUrl = `/admin.html?v=${new Date().getTime()}`;

    return (
        <div style={{ width: '100%', height: '100vh', border: 'none', margin: 0, padding: 0, overflow: 'hidden' }}>
            <iframe 
                src={iframeUrl} 
                title="Admin Dashboard"
                style={{ width: '100%', height: '100%', border: 'none' }}
            />
        </div>
    );
};

export default Admin;
