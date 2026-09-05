/** Service-prefixed so the gateway's variables can sit beside it. */
export const PORT_VARIABLE = "CALC_SERVICE_PORT";

export const DEFAULT_PORT = 3001;

/** `CALC_SERVICE_PORT`, or 3001 when absent. Pure in `env`. */
export const resolvePort = (
  env: Readonly<Record<string, string | undefined>>,
): number => {
  const value = env[PORT_VARIABLE];
  return value === undefined ? DEFAULT_PORT : Number(value);
};
