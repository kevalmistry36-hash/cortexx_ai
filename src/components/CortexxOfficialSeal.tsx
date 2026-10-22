import React from 'react';

interface CortexxOfficialSealProps {
  className?: string;
  size?: number;
}

export const CortexxOfficialSeal: React.FC<CortexxOfficialSealProps> = ({
  className = 'w-24 h-24',
  size = 100,
}) => {
  return (
    <img
      src="/assets/aistudio/cortexx_ai_seal_transparent_978ffaba.png"
      alt="Cortexx AI Official Seal"
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
      loading="eager"
    />
  );
};
