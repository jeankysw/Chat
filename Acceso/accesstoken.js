import jwt from 'jsonwebtoken';

const SECRET_KEY = 'ESTACLAVENOPUEDE-ESCONOCIDA-POR-EL-USUARIO';

export const verifyToken = (req, res, next) => {
    const token = req.cookies.accessToken; 

    if (!token) {
        return res.redirect('/login');
    }

    try {
        const verified = jwt.verify(token, SECRET_KEY);
        req.user = verified; 
        next(); 
    } catch (error) {
        console.error('Error al verificar el token:', error); 
        return res.redirect('/login'); 
    }
};
