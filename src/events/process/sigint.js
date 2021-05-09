module.exports = {
	name: 'SIGINT',
	execute(signal, client, librespot) {
		// logout from discord (that also ends all voice connections :ok_hand:)
		client.destroy();

		// stop librespot gracefully (send CTRL-C)
		console.log('\nShutting down librespot...');
		librespot.stdin.write('\x03');

		// don't exit the process here, if shut down gracefully librespot.on('exit') listener will call process.exit()
	},
};