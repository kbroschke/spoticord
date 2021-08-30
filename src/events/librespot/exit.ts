module.exports = {
	name: "exit",
	execute(code: number) {
		console.log(`Librespot exited with code ${code}!`);
		if (code === 0) {
			console.log("Stopping bot... Bye!");
			process.exit(0);
		}
		else {
			console.error(`--- LIBRESPOT EXITED WITH ERROR CODE ${code} ---\n` +
			"Bot will shut down immediatly!");
			process.exit(1);
		}
	},
};
