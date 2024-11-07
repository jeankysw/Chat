import app from "./app.js";
import { PORT } from "./config.js";
import { setupSocket } from "./socket.io.js";

const server = app.listen(PORT, () => {
    console.log("Servidor en puerto", PORT);
});

const io = setupSocket(server);

export default io;
 