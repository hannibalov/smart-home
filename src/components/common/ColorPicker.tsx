'use client';

import { useState } from 'react';

interface ColorPickerProps {
  initialColor?: { r: number; g: number; b: number };
  onChange: (color: { r: number; g: number; b: number }) => void;
  disabled?: boolean;
}

export default function ColorPicker({ initialColor = { r: 255, g: 0, b: 0 }, onChange, disabled }: ColorPickerProps) {
  const [color, setColor] = useState(initialColor);

  const colors = [
    { r: 255, g: 0, b: 0, name: 'Red' },
    { r: 255, g: 127, b: 0, name: 'Orange' },
    { r: 255, g: 255, b: 0, name: 'Yellow' },
    { r: 0, g: 255, b: 0, name: 'Green' },
    { r: 0, g: 255, b: 255, name: 'Cyan' },
    { r: 0, g: 0, b: 255, name: 'Blue' },
    { r: 127, g: 0, b: 255, name: 'Purple' },
    { r: 255, g: 0, b: 255, name: 'Magenta' },
    { r: 255, g: 255, b: 255, name: 'White' },
  ];

  const handleColorClick = (c: { r: number; g: number; b: number }) => {
    if (disabled) return;
    setColor(c);
    onChange(c);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white/70">Color Control</label>
        <div 
          className="w-8 h-8 rounded-full border border-white/20 shadow-lg transition-transform hover:scale-110"
          style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
        />
      </div>
      
      <div className="grid grid-cols-9 gap-2">
        {colors.map((c, i) => (
          <button
            key={i}
            onClick={() => handleColorClick({ r: c.r, g: c.g, b: c.b })}
            disabled={disabled}
            className={`w-full aspect-square rounded-full border-2 transition-all duration-200 ${
              color.r === c.r && color.g === c.g && color.b === c.b
                ? 'border-white scale-110 shadow-lg'
                : 'border-transparent hover:scale-105'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
            style={{ backgroundColor: `rgb(${c.r}, ${c.g}, ${c.b})` }}
            title={c.name}
          />
        ))}
      </div>

      {/* Custom spectrum-like slider could go here, but starting with presets for robustness */}
      <div className="relative h-4 rounded-lg bg-gradient-to-r from-red-500 via-green-500 to-blue-500 opacity-20 mt-2" />
    </div>
  );
}
