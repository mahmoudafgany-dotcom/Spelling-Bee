import React from 'react';
import { School } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 bg-blue-900 text-white shadow-md w-full">
      <div className="bg-white p-3 rounded-full mb-3 shadow-lg">
        <School className="w-10 h-10 text-blue-900" />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-center">Al-Hussan Model School for Boys</h1>
      <h2 className="text-lg md:text-xl font-light mt-1 opacity-90">Spelling Bee Practice</h2>
    </div>
  );
};

export default Header;