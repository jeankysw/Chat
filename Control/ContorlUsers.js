 // Importar dependencias
 import { getConnection } from '../Conettion/connection.js'; 
 import sql from'mssql';

 import bcrypt from 'bcrypt';

async function hashPassword() {
    const password = '123456';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log(hashedPassword);
}
 // Crear usuario
 export const crearUsuario = async (req, res) => {
     const { nombre, correo, contraseña } = req.body;
     try {
         const result = await sql.query`INSERT INTO Usuarios (nombre, correo, contraseña) VALUES (${nombre}, ${correo}, ${contraseña})`;
         res.status(201).json({ id: result.rowsAffected });
     } catch (err) {
         res.status(500).json({ error: err.message });
     }
 }
 
 // Leer usuarios
 export const obtenerUsuarios  = async (req, res) => {
 
     try {
         const result = await sql.query`SELECT * FROM Usuarios`;
         res.status(200).json(result.recordset);
     } catch (err) {
         res.status(500).json({ error: err.message });
     }
 }
 
 // Actualizar usuario
   export const actualizarUsuario = async (req, res) => {
     const { id } = req.params;
     const { nombre, correo, contraseña } = req.body;
     try {
         const result = await sql.query`UPDATE Usuarios SET nombre = ${nombre}, correo = ${correo}, contraseña = ${contraseña} WHERE id = ${id}`;
         if (result.rowsAffected === 0) {
             return res.status(404).json({ message: 'Usuario no encontrado' });
         }
         res.status(200).json({ message: 'Usuario actualizado' });
     } catch (err) {
         res.status(500).json({ error: err.message });
     }
 }
 
 // Eliminar usuario
 
  export const eliminarUsuario = async (req, res) => {
     const { id } = req.params;
     try {
         const result = await sql.query`DELETE FROM Usuarios WHERE id = ${id}`;
         if (result.rowsAffected === 0) {
             return res.status(404).json({ message: 'Usuario no encontrado' });
         }
         res.status(204).send();
     } catch (err) {
         res.status(500).json({ error: err.message });
     }
 }
 
 export default  {
     crearUsuario,
     obtenerUsuarios,
     actualizarUsuario,
     eliminarUsuario,
 };
 