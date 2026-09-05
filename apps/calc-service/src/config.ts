/** The variable that names the port; service-prefixed so the gateway's own variables sit beside it. */
export const PORT_VARIABLE = "CALC_SERVICE_PORT";

export const DEFAULT_PORT = 3001;

/** The port to bind, as a pure function of an environment object: `CALC_SERVICE_PORT`, or 3001 when absent. */
export const resolvePort = (
  env: Readonly<Record<string, string | undefined>>,
): number => {
  const value = env[PORT_VARIABLE];
  return value === undefined ? DEFAULT_PORT : Number(value);
};
