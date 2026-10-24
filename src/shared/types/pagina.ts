/** Respuesta paginada del backend (Spring Data): { content, page: { size, number, totalElements, totalPages } }. */
export interface Pagina<T> {
  content: T[];
  page: {
    size: number;
    /** Empieza en 0. */
    number: number;
    totalElements: number;
    totalPages: number;
  };
}
