import logoImage from "../assets/logo.png";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="w-full px-20 py-2 flex items-center justify-between border-b border-gray-100 bg-white/70 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
        <span className="text-2xl font-black text-primary uppercase tracking-[0.25em]">
          {title}
        </span>
      </div>

      <img
        src={logoImage}
        alt="Logo"
        className="h-20 w-auto object-contain"
      />
    </header>
  );
}