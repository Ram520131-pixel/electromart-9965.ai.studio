import { useState } from 'react';
import { Cpu } from 'lucide-react';

interface ProductImageProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  containerClassName?: string;
}

export function ProductImage({
  src,
  alt,
  title,
  className = 'w-full h-full object-cover',
  containerClassName = 'w-full h-full',
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F5F7FA] to-[#E6EDF7] text-[#0B162C]/70 p-4 text-center ${containerClassName}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-xs">
          <Cpu className="w-6 h-6 text-[#0066FF]" strokeWidth={1.75} />
        </div>
        <span className="text-xs font-medium text-[#0B162C]/80 max-w-[180px] line-clamp-2">
          {title || alt}
        </span>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-[#F5F7FA] ${containerClassName}`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setHasError(true)}
        className={className}
      />
    </div>
  );
}
