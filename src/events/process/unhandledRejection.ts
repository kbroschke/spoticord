module.exports = {
	name: "unhandledRejection",
	execute(error: Error | any) {
		console.error("Unhandled promise rejection:\n", error);
	},
};
