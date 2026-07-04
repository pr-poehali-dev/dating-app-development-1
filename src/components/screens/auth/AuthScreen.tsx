import { useState, useEffect } from "react";
import { authApi, type User } from "@/lib/api";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { AuthForm } from "./AuthForm";
import { AuthLegalSheet } from "./AuthLegalSheet";

const OAUTH_REDIRECT = `${window.location.origin}/oauth`;

export function AuthScreen({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);
  const [oauthLoading, setOAuthLoading] = useState<"vk" | "mailru" | null>(null);

  // Обработка возврата с OAuth-провайдера (?code=...&state=...)
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code) return;
    const provider = sessionStorage.getItem("oauth_provider") as "vk" | "mailru" | null;
    const savedState = sessionStorage.getItem("oauth_state");
    // Чистим URL сразу, возвращаемся на главную
    window.history.replaceState({}, "", "/");
    if (!provider || (savedState && state && savedState !== state)) {
      setError("Не удалось войти. Попробуй ещё раз.");
      return;
    }
    setOAuthLoading(provider);
    authApi
      .oauthCallback(provider, code, OAUTH_REDIRECT)
      .then((res) => onAuth(res.user))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Ошибка входа"))
      .finally(() => {
        setOAuthLoading(null);
        sessionStorage.removeItem("oauth_provider");
        sessionStorage.removeItem("oauth_state");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startOAuth = async (provider: "vk" | "mailru") => {
    setError("");
    setOAuthLoading(provider);
    try {
      const { url, state } = await authApi.oauthUrl(provider, OAUTH_REDIRECT);
      sessionStorage.setItem("oauth_provider", provider);
      sessionStorage.setItem("oauth_state", state);
      window.location.href = url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
      setOAuthLoading(null);
    }
  };

  const submit = async () => {
    setError("");
    setEmailTaken(false);
    setLoading(true);
    try {
      let result;
      if (mode === "register") {
        if (!name.trim()) { setError("Введи своё имя"); setLoading(false); return; }
        result = await authApi.register(email, password, name);
      } else {
        result = await authApi.login(email, password);
      }
      onAuth(result.user);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка";
      if (mode === "register" && msg.toLowerCase().includes("уже занят")) {
        setEmailTaken(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      {showTerms && (
        <AuthLegalSheet tab="terms" onClose={() => setShowTerms(false)} />
      )}
      {showPrivacy && (
        <AuthLegalSheet tab="privacy" onClose={() => setShowPrivacy(false)} />
      )}

      <AuthForm
        mode={mode}
        name={name}
        email={email}
        password={password}
        loading={loading}
        error={error}
        emailTaken={emailTaken}
        showPassword={showPassword}
        onModeChange={setMode}
        onNameChange={setName}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onShowPasswordToggle={() => setShowPassword(v => !v)}
        onSubmit={submit}
        onShowForgot={() => setShowForgot(true)}
        onOpenTerms={() => setShowTerms(true)}
        onOpenPrivacy={() => setShowPrivacy(true)}
        onEmailTakenDismiss={() => { setEmailTaken(false); setError(""); }}
        onOAuth={startOAuth}
        oauthLoading={oauthLoading}
      />
    </>
  );
}