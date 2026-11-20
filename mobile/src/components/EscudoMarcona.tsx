import React, { useState } from 'react';
import { View, Image } from 'react-native';
import { Shield } from 'lucide-react-native';

interface EscudoMarconaProps {
  size?: number;
  className?: string;
}

export const EscudoMarcona: React.FC<EscudoMarconaProps> = ({ size = 64, className = '' }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <View
        style={{ width: size, height: size }}
        className={`bg-red-700 rounded-2xl items-center justify-center shadow-md ${className}`}
      >
        <Shield size={Math.round(size * 0.55)} color="#FFFFFF" />
      </View>
    );
  }

  return (
    <Image
      source={require('../../assets/images/escudo-marcona.png')}
      style={{ width: size, height: size }}
      className={`rounded-2xl ${className}`}
      resizeMode="contain"
      onError={() => setHasError(true)}
    />
  );
};
