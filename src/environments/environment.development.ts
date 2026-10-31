export const environment = {
  // api-gateway levantado con docker compose
  apiUrl: 'http://localhost:8080/api',
  demo: false,
  cuentasDemo: [] as { rol: string; email: string; password: string }[],
};
