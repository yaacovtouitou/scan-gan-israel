const email = 'admin@ganisrael.com';
const password = 'adminPassword123!';
const club = 'sarcelles';
const role = 'admin';

const apiKey = 'AIzaSyBjhKzkiNH0uX3aWibqlRKUsrumTE9x7dE';
const projectId = 'tsivot-hashem-dashboard';

async function run() {
    console.log(`Step 1: Signing up user ${email} in Firebase Auth...`);
    try {
        const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
        const authResp = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, returnSecureToken: true })
        });
        const authData = await authResp.json();
        
        if (authData.error) {
            console.error('Auth Sign Up Error:', authData.error.message);
            if (authData.error.message === 'EMAIL_EXISTS') {
                console.log('User already exists. Attempting to log in instead...');
                return loginAndWrite(email, password);
            }
            return;
        }

        const { idToken, localId } = authData;
        console.log(`Sign Up Success! User UID: ${localId}`);
        
        await writeFirestoreRole(idToken, localId);
    } catch (err) {
        console.error('Error during execution:', err);
    }
}

async function loginAndWrite(email, password) {
    try {
        const loginUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
        const loginResp = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, returnSecureToken: true })
        });
        const loginData = await loginResp.json();
        if (loginData.error) {
            console.error('Login Error:', loginData.error.message);
            return;
        }
        const { idToken, localId } = loginData;
        console.log(`Login Success! User UID: ${localId}`);
        await writeFirestoreRole(idToken, localId);
    } catch (err) {
        console.error('Error during login:', err);
    }
}

async function writeFirestoreRole(idToken, localId) {
    console.log(`Step 2: Writing user document users/${localId} to Firestore...`);
    const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${localId}`;
    
    // Firestore REST API requires document structure
    const docData = {
        fields: {
            email: { stringValue: email },
            club: { stringValue: club },
            role: { stringValue: role }
        }
    };

    const docResp = await fetch(docUrl, {
        method: 'PATCH', // PATCH acts as create/update (upsert)
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(docData)
    });

    const docResult = await docResp.json();
    if (docResult.error) {
        console.error('Firestore Write Error:', docResult.error);
    } else {
        console.log('Firestore Write Success! User role has been set to admin.');
        console.log(`You can now log in using:\nEmail: ${email}\nPassword: ${password}`);
    }
}

run();
