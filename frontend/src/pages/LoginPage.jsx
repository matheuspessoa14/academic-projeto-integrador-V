import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CalendarCheck2,
  Users2,
  HeartPulse,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import Brand from "../components/Brand";
function TinyDashboard() {
  return (
    <div className="login-preview">
      <div className="preview-side">
        <div className="preview-brand">
          <HeartPulse size={13} /> Lumera
        </div>
        <div className="preview-selected" />
        <div className="preview-line" />
        <div className="preview-line short" />
        <div className="preview-line" />
      </div>
      <div className="preview-main">
        <div className="preview-search" />
        <div className="preview-heading">Seu cuidado, em uma visão.</div>
        <div className="preview-cards">
          <div>
            <span>Consultas</span>
            <strong>128</strong>
            <i />
          </div>
          <div>
            <span>Pacientes</span>
            <strong>246</strong>
            <i />
          </div>
          <div>
            <span>Atendimentos</span>
            <strong>84</strong>
            <i />
          </div>
        </div>
        <div className="preview-grid">
          <div className="preview-chart">
            <strong>Atendimentos da semana</strong>
            <div className="preview-bars">
              {[45, 76, 54, 91, 64, 82, 72].map((h, i) => (
                <span key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="preview-donut-wrap">
            <strong>Resumo</strong>
            <div className="preview-donut">
              <span>82%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const submit = (e) => {
    e.preventDefault();
    const result = login(email, password);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate("/dashboard", { replace: true });
  };
  return (
    <div className="login-screen">
      <div className="login-shell">
        <section className="login-form-panel">
          <Brand className="login-brand" />
          <div className="login-form-wrap">
            <div className="eyebrow">BEM-VINDO AO LUMERA</div>
            <h1>
              Entre na sua conta<span>.</span>
            </h1>
            <p className="login-description">
              Acesse seu espaço de gestão clínica de forma simples e intuitiva.
            </p>
            <form onSubmit={submit}>
              <label htmlFor="login-email">E-mail</label>
              <div className="field-with-icon">
                <Mail size={19} />
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <label htmlFor="login-password">Senha</label>
              <div className="field-with-icon">
                <LockKeyhole size={19} />
                <input
                  id="login-password"
                  type={show ? "text" : "password"}
                  required
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="reveal-button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="login-extras">
                <label className="remember-label">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />{" "}
                  Lembrar de mim
                </label>
                <span className="login-muted">Recuperação em breve</span>
              </div>
              {error && <p className="form-error">{error}</p>}
              <button className="login-submit" type="submit">
                Entrar na plataforma <ArrowRight size={18} />
              </button>
            </form>
            <div className="demo-instructions">
              <span className="demo-dot" />
              <div>
                <strong>Acesso demonstrativo</strong>
                <p>
                  Use um e-mail válido e qualquer senha não vazia para
                  visualizar o frontend. Não há autenticação real nesta versão.
                </p>
              </div>
            </div>
          </div>
          <p className="login-footer">
            © {new Date().getFullYear()} Lumera · Projeto acadêmico · Ambiente
            fictício
          </p>
        </section>
        <section className="login-showcase">
          <div className="showcase-glow showcase-glow-one" />
          <div className="showcase-glow showcase-glow-two" />
          <div className="showcase-content">
            <div className="showcase-pill">
              <span /> A tecnologia a favor do cuidado
            </div>
            <h2>
              Uma gestão mais <em>humana</em> começa aqui.
            </h2>
            <p>
              Organize pacientes, consultas e prontuários em uma experiência
              integrada, elegante e descomplicada.
            </p>
            <div className="showcase-features">
              <span>
                <Users2 size={18} /> Pessoas no centro
              </span>
              <span>
                <CalendarCheck2 size={18} /> Rotina organizada
              </span>
              <span>
                <ShieldCheck size={18} /> Acesso por perfil
              </span>
            </div>
          </div>
          <TinyDashboard />
          <div className="showcase-bottom">
            LUMERA <span>•</span> GESTÃO CLÍNICA
          </div>
        </section>
      </div>
    </div>
  );
}
