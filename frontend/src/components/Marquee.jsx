import React from 'react';

// Le pasamos colores por defecto, pero los puedes cambiar cuando uses el componente
export default function Marquee({ 
  text = "COLLECTIONS", 
  bgColor = "bg-black", 
  textColor = "text-white" 
}) {
  
  // Repetimos la palabra muchas veces para que nunca quede un espacio vacío en la pantalla
  const repeatedText = Array(15).fill(text);

  return (
    <div className={`overflow-hidden border-y-2 border-black py-3 ${bgColor} ${textColor} flex items-center`}>
      {/* El contenedor que se mueve */}
      <div className="animate-marquee font-black text-xl tracking-widest uppercase">
        {repeatedText.map((item, index) => (
          <span key={index} className="mx-6">
            {item} <span className="text-sm mx-2 opacity-50">✦</span>
          </span>
        ))}
      </div>
      {/* Duplicamos el contenedor para que el efecto infinito sea fluido */}
      <div className="animate-marquee font-black text-xl tracking-widest uppercase" aria-hidden="true">
        {repeatedText.map((item, index) => (
          <span key={index} className="mx-6">
            {item} <span className="text-sm mx-2 opacity-50">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}