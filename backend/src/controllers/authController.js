const authService = require('../services/authService');

const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Token tidak dikirim oleh frontend!' });
        }

        const userData = await authService.authenticateUser(token);

        res.status(200).json({
            message: 'Login berhasil!',
            user: userData,
        });

    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

module.exports = {
    googleLogin,
};