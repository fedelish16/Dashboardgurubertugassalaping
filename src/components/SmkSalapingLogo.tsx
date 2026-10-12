import React from 'react';

interface SmkSalapingLogoProps {
  className?: string;
  size?: number | string;
  alt?: string;
  logoUrl?: string;
}

export const SmkSalapingLogo: React.FC<SmkSalapingLogoProps> = ({
  className = 'w-10 h-10',
  size,
  alt = 'Logo SMK Salaping',
  logoUrl
}) => {
  return (
    <img
      src={logoUrl || '/smk-salaping-logo.svg'}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain shrink-0 drop-shadow-xs select-none ${className}`}
      loading="eager"
      onError={(e) => {
        // Fallback to default svg if custom url fails to load
        (e.target as HTMLImageElement).src = '/smk-salaping-logo.svg';
      }}
    />
  );
};
