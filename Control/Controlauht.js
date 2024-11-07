import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { getConnection } from '../Conettion/connection.js'; // Asegúrate de que la ruta sea correcta
import sql from 'mssql';

const SECRET_KEY = 'ESTACLAVENOPUEDE-ESCONOCIDA-POR-EL-USUARIO';

export const login = async (req, res) => {
    const { correo, contraseña } = req.body;

    try {
        const connection = await getConnection();
        const result = await connection.request()
            .input('correo', sql.VarChar, correo)
            .query('SELECT * FROM Usuarios WHERE correo = @correo');

        if (result.recordset.length === 0) {
            return res.redirect('/login?error=' + encodeURIComponent('Credenciales inválidas'));
        }

        const usuario = result.recordset[0];

        const match = await bcrypt.compare(contraseña, usuario.contraseña);
        if (contraseña=== usuario.contraseña) {
            const token = jwt.sign(
                { id: usuario.id, correo: usuario.correo, nombre: usuario.nombre },
                SECRET_KEY,
                { expiresIn: '1h' }
            );
            res.cookie('accessToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
            return res.redirect('/chatUsers');
        } else {
            return res.redirect('/login?error=' + encodeURIComponent('Credenciales inválidas'));
        }
    } catch (err) {
        console.error('Error en el proceso de inicio de sesión:', err);
        return res.redirect('/login?error=' + encodeURIComponent('Error al iniciar sesión'));
    }
};
