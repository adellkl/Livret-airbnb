type BrandMarkProps = {
  className?: string;
};

export default function BrandMark({ className = 'h-9 w-9' }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 56 56"
      role="img"
      aria-label="Logo Livret d’accueil"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="52" height="52" rx="18" fill="#d96c4a" />
      <path
        d="M18 16.25v23.5h8.25"
        fill="none"
        stroke="#fffaf4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M22.4 19.25c3.05-3.1 6.7-4.65 10.9-4.65 2.2 0 4.05.5 5.55 1.5v18.75c-1.5-1-3.35-1.5-5.55-1.5-4.2 0-7.85 1.55-10.9 4.65"
        fill="none"
        stroke="#fffaf4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.15"
      />
      <path
        d="M29.25 26.1c1.45-1.15 3.2-1.7 5.25-1.7"
        fill="none"
        stroke="#f7c2aa"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
      <path
        d="M42.2 11.35v3.4M40.5 13.05h3.4"
        fill="none"
        stroke="#fffaf4"
        strokeLinecap="round"
        strokeWidth="1.25"
        opacity=".9"
      />
      <rect
        x="2.75"
        y="2.75"
        width="50.5"
        height="50.5"
        rx="17.25"
        fill="none"
        stroke="#8f3925"
        strokeOpacity=".14"
        strokeWidth="1.5"
      />
    </svg>
  );
}
