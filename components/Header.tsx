import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 bg-blue-900 text-white shadow-md w-full">
      <div className="bg-white p-4 rounded-xl mb-4 shadow-lg">
        <img 
          src="https://cdn.salla.sa/ZQmKn/48d153f5-045d-463a-9c03-ebf29c80c74c-1000x707.421875-O9ViAbczjYklP4ioujflsujhlaPz53kIc4HwlbWS.jpg" 
          alt="Al-Hussan Education & Training" 
          className="h-20 w-auto object-contain"
        />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-center">Al-Hussan Model School for Boys</h1>
      <h2 className="text-lg md:text-xl font-light mt-1 opacity-90">Spelling Bee Practice</h2>
    </div>
  );
};

export default Header;