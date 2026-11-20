import React from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Laptop, Monitor, Printer, Mouse, Package } from 'lucide-react-native';
import { MARCONA_COLORS } from '../theme/styles';

interface BienThumbnailProps {
  fotoUrl?: string | null;
  categoria?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const BienThumbnail: React.FC<BienThumbnailProps> = ({
  fotoUrl,
  categoria = '',
  size = 48,
  style,
}) => {
  if (fotoUrl) {
    return (
      <Image
        source={{ uri: fotoUrl }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: Math.round(size * 0.22) },
          style as any,
        ]}
        resizeMode="cover"
      />
    );
  }

  const catLower = (categoria || '').toLowerCase();
  const iconSize = Math.max(18, Math.round(size * 0.48));
  const iconColor = MARCONA_COLORS.blue;

  const renderIcon = () => {
    if (
      catLower.includes('laptop') ||
      catLower.includes('computo') ||
      catLower.includes('cómputo') ||
      catLower.includes('notebook')
    ) {
      return <Laptop size={iconSize} color={iconColor} />;
    }
    if (
      catLower.includes('monitor') ||
      catLower.includes('pantalla') ||
      catLower.includes('display')
    ) {
      return <Monitor size={iconSize} color={iconColor} />;
    }
    if (
      catLower.includes('impresora') ||
      catLower.includes('print') ||
      catLower.includes('multifuncional')
    ) {
      return <Printer size={iconSize} color={iconColor} />;
    }
    if (
      catLower.includes('mouse') ||
      catLower.includes('raton') ||
      catLower.includes('accesorio') ||
      catLower.includes('teclado')
    ) {
      return <Mouse size={iconSize} color={iconColor} />;
    }
    return <Package size={iconSize} color={iconColor} />;
  };

  return (
    <View
      style={[
        styles.fallbackContainer,
        { width: size, height: size, borderRadius: Math.round(size * 0.22) },
        style,
      ]}
    >
      {renderIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: MARCONA_COLORS.slate100,
  },
  fallbackContainer: {
    backgroundColor: MARCONA_COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
  },
});
