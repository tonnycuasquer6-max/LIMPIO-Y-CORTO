import { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [carrito, setCarrito] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [cartPulse, setCartPulse] = useState(false);

  const toggleFavorito = (id) => {
    setFavoritos(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  const agregarAlCarrito = (producto, tallasSeleccionadas = []) => {
    // Animación del pulso
    setCartPulse(true);
    setTimeout(() => setCartPulse(false), 400);

    const isRing = producto.subcategoria === 'Anillos';

    setCarrito(prev => {
      let newCart = [...prev];
      if (isRing) {
        // Lógica para anillos y sus tallas...
        tallasSeleccionadas.forEach(talla => {
          const index = newCart.findIndex(item => item.id === producto.id && item.tallaSeleccionada === talla);
          if (index > -1) {
            newCart[index].cantidad += 1;
          } else {
            newCart.push({ ...producto, tallaSeleccionada: talla, cantidad: 1 });
          }
        });
      } else {
        // Lógica para prendas normales
        const index = newCart.findIndex(item => item.id === producto.id);
        if (index > -1) {
          newCart[index].cantidad += 1;
        } else {
          newCart.push({ ...producto, cantidad: 1 });
        }
      }
      return newCart;
    });
  };

  return (
    <CartContext.Provider value={{ carrito, setCarrito, favoritos, toggleFavorito, agregarAlCarrito, cartPulse }}>
      {children}
    </CartContext.Provider>
  );
};