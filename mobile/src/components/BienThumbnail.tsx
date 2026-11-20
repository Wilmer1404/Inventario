import React from 'react';
import { View, Image } from 'react-native';
import { Laptop, Monitor, Printer, Mouse, Package } from 'lucide-react-native';

interface BienThumbnailProps {
  fotoUrl?: string | null;
  categoria?: string;
  size?: number;
  className?: string;
}

export const BienThumbnail: React.FC<BienThumbnailProps> = ({
  fotoUrl,
  categoria = '',
  size = 48,
  className = '',
}) => {
  if (fotoUrl) {
    return (
      <Image
        source={{ uri: fotoUrl }}
        style={{ width: size, height: size }}
        className={`rounded-xl bg-slate-100 ${className}`}
        resizeMode="cover"
      />
    );
  }

  const catLower = (categoria || '').toLowerCase();
  const iconSize = Math.max(18, Math.round(size * 0.5));
  const iconColor = '#1E3A8A';

  const renderIcon = () => {
    if (catLower.includes('laptop') || catLower.includes('computo') || catLower.includes('cómputo') || catLower.includes('notebook')) {
      return <Laptop size={iconSize} color={iconColor} />;
    }
    if (catLower.includes('monitor') || catLower.includes('pantalla') || catLower.includes('display')) {
      return <Monitor size={iconSize} color={iconColor} />;
    }
    if (catLower.includes('impresora') || catLower.includes('print') || catLower.includes('multifuncional')) {
      return <Printer size={iconSize} color={iconColor} />;
    }
    if (catLower.includes('mouse') || catLower.includes('raton') || catLower.includes('accesorio') || catLower.includes('teclado')) {
      return <Mouse size={iconSize} color={iconColor} />;
    }
    return <Package size={iconSize} color={iconColor} />;
  };

  return (
    <View
      style={{ width: size, height: size }}
      className={`bg-slate-100 rounded-xl items-center justify-center border border-slate-200/60 ${className}`}
    >
      {renderIcon()}
    </View>
  );
};
