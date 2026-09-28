const { pool } = require('../config/db'); 
const https = require('https'); 

const verifyGoogleToken = (accessToken) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'www.googleapis.com',
            path: '/oauth2/v3/userinfo',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'SistemSurat-App'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const payload = JSON.parse(data);
                        resolve(payload); 
                    } catch (error) {
                        reject(new Error('Gagal membaca data dari Google'));
                    }
                } else {
                    console.error('Google menolak token. Respon Google:', data);
                    reject(new Error('Token Google tidak valid atau sudah kedaluwarsa'));
                }
            });
        });

        req.on('error', (error) => {
            console.error('Gagal menghubungi Google:', error);
            reject(new Error('Masalah koneksi ke server Google'));
        });

        req.end();
    });
};

const authenticateUser = async (token) => {
    const payload = await verifyGoogleToken(token);
    const userEmail = payload.email;

    if (!userEmail) {
        throw new Error('Akses ditolak: Tidak dapat menemukan email di token ini.');
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [userEmail]);
    const user = result.rows[0];

    if (!user) {
        throw new Error('Akses ditolak: Email belum terdaftar di dalam sistem.');
    }

    return {
        email: user.email,
        name: user.nama,
        role: user.role,
        picture: payload.picture,
    };
};

module.exports = {
    authenticateUser,
};