export function getPasskeyConfig() {
  const url = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return {
    rpID: new URL(url).hostname,
    rpName: "Loan Manager",
    origin: url,
  };
}
