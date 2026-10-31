export const environment = {
  // URL del api-gateway. Cambiarla cuando se despliegue en un servidor.
  apiUrl: 'http://localhost:8080/api',
  demo: false,
  cuentasDemo: [] as { rol: string; email: string; password: string }[],
};
