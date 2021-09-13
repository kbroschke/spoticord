"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    name: "SIGINT",
    execute(signal, randomNumber, client, librespot) {
        // logout from discord (that also ends all voice connections :ok_hand:)
        client.destroy();
        if (librespot.stdin) {
            // stop librespot gracefully (send CTRL-C)
            console.log("\nShutting down librespot...");
            librespot.kill("SIGINT");
            // don't exit the process here, if shut down gracefully librespot.on('exit') listener will call process.exit()
            // kill everything after 15 seconds
            setTimeout(() => {
                console.error("Librespot is not responding, exiting!");
                librespot.kill();
                process.exit(1);
            }, 15000);
        }
        else {
            // something went wrong with the librespot child process
            process.exit(1);
        }
    },
};
