export const environment = {
  // Versión demo: no hay backend, src/demo responde todos los pedidos a /api con datos de ejemplo.
  apiUrl: '/api',
  demo: true,
  /** Se muestran en el login para entrar con un clic. */
  cuentasDemo: [
    { rol: 'Administrador', email: 'admin@concesionaria.com', password: 'Admin12345' },
    { rol: 'Vendedor', email: 'vera.gomez@concesionaria.com', password: 'Vendedor12345' },
    { rol: 'Cliente', email: 'cliente.demo@mail.com', password: 'Cliente12345' },
  ],
};
