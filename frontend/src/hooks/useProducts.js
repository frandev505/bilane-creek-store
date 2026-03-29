import { useState, useEffect } from 'react';

// Este Custom Hook se encarga exclusivamente de traer los datos del backend
export function useProducts() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/productos`)
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error('Error en la red');
        return respuesta.json();
      })
      .then((datos) => {
        setProductos(datos);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error cargando productos:", err);
        setError(err.message);
        setCargando(false);
      });
  }, []);

  return { productos, cargando, error };
}