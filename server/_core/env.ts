export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // ShipStation API credentials
  shipstationApiKey: process.env.Shipstation_API_PK ?? process.env.SHIPSTATION_API_KEY ?? "",
  shipstationApiSecret: process.env.Shipstation_API_Secret ?? process.env.SHIPSTATION_API_SECRET ?? "",
  shipstationUsername: process.env.Shipstation_Username ?? "",
};
