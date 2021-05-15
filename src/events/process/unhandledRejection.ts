module.exports = {
	name: 'unhandledRejection',
	execute(error) {
		console.error('Unhandled promise rejection:\n', error);
	},
};