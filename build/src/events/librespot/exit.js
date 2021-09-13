"use strict";
module.exports = {
    name: "exit",
    execute(code) {
        console.log(`Librespot exited with code ${code}!`);
        if (code === 0) {
            console.log("Bye!");
            process.exit(0);
        }
        else {
            console.error(`--- LIBRESPOT EXITED WITH ERROR CODE ${code} ---\n` +
                "Bot will shut down immediatly!");
            process.exit(1);
        }
    },
};
