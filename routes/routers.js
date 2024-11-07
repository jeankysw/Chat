import { crearUsuario, obtenerUsuarios, actualizarUsuario, eliminarUsuario } from "../Control/ContorlUsers.js";
import { login } from '../Control/Controlauht.js';

import { Router } from "express"
import io from '../index.js'; 
import { verifyToken } from "../Acceso/accesstoken.js";
const router = Router();
 
router.get('/logout', (req, res) => {
    res.clearCookie('accessToken'); 
    res.redirect('/login');
});
router.get ('/chatPrueba', (req, res) => {
    res.render('chatPrueba');
});

router.post('/chat', login);

router.get('/login', (req, res) => {
    res.render('login');
});
router.get('/chatUsers',verifyToken , (req, res) => {
    const { id, nombre, correo  } = req.user; 
    res.render('chat' , { id, nombre, correo } );
}); 
 
router.use((req, res, next) => {
    res.io = io;  
    next();
});

router.post('/usuarios', crearUsuario);
router.get('/usuarios', obtenerUsuarios);
router.put('/usuarios/:id', actualizarUsuario);
router.delete('/usuarios/:id',eliminarUsuario);

router.use((req, res, next) => {
    res.status(404).render('Notfound', { title: '404 - Pagina no encontrada' });
  });
  
export default router;
