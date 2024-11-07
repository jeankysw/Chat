import { Server } from "socket.io";
import { getConnection, sql } from './Conettion/connection.js';
import { verifyToken } from './Acceso/accesstoken.js';

export const setupSocket = (server) => {
    const io = new Server(server, {
        cors: { origin: '*' }
    });

    io.on('connection', (socket) => {
        console.log('Usuario conectado', socket.id);


        let sender_id;
        let conversacion_id;


        socket.on('Datouser', async (Datouser) => {
            sender_id = Datouser.userid;

            const connection = await getConnection();
            try {
                const result = await connection.request()
                    .input('usuario_id', sql.Int, sender_id)
                    .query(`
                        SELECT u.id, u.nombre
                        FROM Usuarios u
                        INNER JOIN Participantes p ON p.usuario_id = u.id
                        INNER JOIN Conversaciones c ON c.id = p.conversacion_id
                        WHERE c.id IN (
                            SELECT conversacion_id
                            FROM Participantes
                            WHERE usuario_id = @usuario_id
                        ) AND u.id <> @usuario_id
                    `);

                const contactos = result.recordset;
                socket.emit('contactos', contactos);
            } catch (error) {
                console.error('Error al obtener los contactos:', error);
            } finally {
                connection.release();
            }
        });

        // Desconexión del usuario
        socket.on('disconnect', () => {
            console.log('Usuario desconectado', socket.id);
        });


        socket.on('iduser', async (data) => {
            const receiver_id = data.receiver_id;
            console.log('Receiver ID:', receiver_id);

            const connection = await getConnection();
            try {

                const conversationResult = await connection.request()
                    .input('sender_id', sql.Int, sender_id)
                    .input('receiver_id', sql.Int, receiver_id)
                    .query(`
                        SELECT c.id
                        FROM Conversaciones c
                        INNER JOIN Participantes p1 ON c.id = p1.conversacion_id AND p1.usuario_id = @sender_id
                        INNER JOIN Participantes p2 ON c.id = p2.conversacion_id AND p2.usuario_id = @receiver_id
                        WHERE c.tipo = 'individual'
                    `);

                if (conversationResult.recordset.length > 0) {

                    conversacion_id = conversationResult.recordset[0].id;
                } else {

                    const newConversationResult = await connection.request()
                        .input('tipo', sql.VarChar, 'individual')
                        .query(`
                            INSERT INTO Conversaciones (tipo) 
                            OUTPUT INSERTED.id 
                            VALUES (@tipo)
                        `);

                    conversacion_id = newConversationResult.recordset[0].id;

                    const participantes = [sender_id, receiver_id];
                    for (const usuario_id of participantes) {
                        await connection.request()
                            .input('usuario_id', sql.Int, usuario_id)
                            .input('conversacion_id', sql.Int, conversacion_id)
                            .query(`
                                INSERT INTO Participantes (usuario_id, conversacion_id) 
                                VALUES (@usuario_id, @conversacion_id)
                            `);
                    }
                }

                socket.conversacion_id = conversacion_id;

                socket.join(conversacion_id.toString());

                const mensajesResult = await connection.request()
                    .input('conversacion_id', sql.Int, conversacion_id)
                    .query(`
                        SELECT 
                            m.contenido, 
                            m.fecha_envio, 
                            emisor.nombre AS emisor, 
                            receptor.nombre AS receptor
                        FROM Mensajes m
                        JOIN Usuarios emisor ON m.usuario_id = emisor.id
                        JOIN Participantes p_receptor ON m.conversacion_id = p_receptor.conversacion_id AND p_receptor.usuario_id <> m.usuario_id
                        JOIN Usuarios receptor ON p_receptor.usuario_id = receptor.id
                        WHERE m.conversacion_id = @conversacion_id
                        ORDER BY m.fecha_envio;
                    `);

                const mensajes = mensajesResult.recordset;
                socket.emit('loadMessages', mensajes);

            } catch (error) {
                console.error('Error al obtener los mensajes:', error);
            } finally {
                connection.release();
            }
        });

        socket.on('chatmessage', async (data) => {
            const { message, message_id, usernamed } = data;


            const conversacion_id = socket.conversacion_id;

            if (!conversacion_id) {
                console.error('No se ha establecido una conversación para este socket.');
                return;
            }

            const connection = await getConnection();
            try {

                const insertResult = await connection.request()
                    .input('conversacion_id', sql.Int, conversacion_id)
                    .input('usuario_id', sql.Int, sender_id)
                    .input('contenido', sql.Text, message)
                    .query(`
                        INSERT INTO Mensajes (conversacion_id, usuario_id, contenido) 
                        VALUES (@conversacion_id, @usuario_id, @contenido);
                        SELECT SCOPE_IDENTITY() AS message_id, fecha_envio FROM Mensajes WHERE id = SCOPE_IDENTITY();
                    `);

                const insertedMessage = insertResult.recordset[0];

                const emisorResult = await connection.request()
                    .input('sender_id', sql.Int, sender_id)
                    .query(`SELECT nombre FROM Usuarios WHERE id = @sender_id`);

                const emisorNombre = emisorResult.recordset[0].nombre;

                const mensajeEnviado = {
                    message_id: insertedMessage.message_id,
                    contenido: message,
                    fecha_envio: insertedMessage.fecha_envio,
                    emisor: emisorNombre,
                    usernamed
                };

                io.to(conversacion_id.toString()).emit('messagesend', mensajeEnviado);
            } catch (error) {
                console.error('Error al guardar el mensaje:', error);
            } 
        });

        socket.on('typing', (data) => {
            socket.broadcast.emit('usertyping', data);
        });

    });

    return io;
};
