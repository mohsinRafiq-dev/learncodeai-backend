export default async () => {
  // Clean up the MongoDB memory server
  if (global.__MONGOSERVER__) {
    await global.__MONGOSERVER__.stop();
  }
};