import React, { useState } from 'react';
import { View, Image, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Shield } from 'lucide-react-native';
import { MARCONA_COLORS } from '../theme/styles';

interface EscudoMarconaProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const EscudoMarcona: React.FC<EscudoMarconaProps> = ({ size = 64, style }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <View
        style={[
          styles.fallback,
          { width: size, height: size, borderRadius: Math.round(size * 0.25) },
          style,
        ]}
      >
        <Shield size={Math.round(size * 0.55)} color={MARCONA_COLORS.white} />
      </View>
    );
  }

  return (
    <Image
      source={require('../../assets/images/escudo-marcona.png')}
      style={[{ width: size, height: size }, style as any]}
      resizeMode="contain"
      onError={() => setHasError(true)}
    />
  );
};

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: MARCONA_COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
