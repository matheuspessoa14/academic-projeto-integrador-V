import logo from "../assets/lumera-logo.png";
export default function Brand({ className = "" }) {
  return (
    <img
      src={logo}
      className={`brand-logo ${className}`}
      alt="Lumera — Gestão Clínica"
    />
  );
}
