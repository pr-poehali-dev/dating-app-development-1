import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { authApi, isBanError, type User } from "@/lib/api";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { AuthForm } from "./AuthForm";
import { AuthHeroCard } from "./AuthHeroCard";
import { AuthLegalSheet } from "./AuthLegalSheet";
import { BannedNotice } from "./BannedNotice";
import { SupportModal } from "./SupportModal";
import { openLegalExternally } from "@/lib/openLegal";

// Redirect URI для OAuth берём из реального адреса браузера — так он всегда
// совпадает сам с собой. В настройках ВК/Mail.ru нужно указать ровно этот адрес.
// window.location.origin для кириллического домена браузер сам отдаёт в punycode.
const OAUTH_REDIRECT = `${window.location.origin}/oauth`;

export function AuthScreen({ onAuth, variant = "phone", initialBanMessage = null, onBanSeen }: { onAuth: (user: User) => void; variant?: "phone" | "card"; initialBanMessage?: string | null; onBanSeen?: () => void }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [banned, setBanned] = useState<string | null>(initialBanMessage);
  const [showSupport, setShowSupport] = useState(false);
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
    const deviceId = url.searchParams.get("device_id") || "";
    if (!code) return;
    const provider = sessionStorage.getItem("oauth_provider") as "vk" | "mailru" | null;
    const savedState = sessionStorage.getItem("oauth_state");
    const codeVerifier = sessionStorage.getItem("oauth_verifier") || "";
    // Чистим URL сразу, возвращаемся на главную
    window.history.replaceState({}, "", "/");
    if (!provider || (savedState && state && savedState !== state)) {
      setError(t("auth.oauthFailed"));
      return;
    }
    setOAuthLoading(provider);
    authApi
      .oauthCallback(provider, code, OAUTH_REDIRECT, { code_verifier: codeVerifier, device_id: deviceId })
      .then((res) => onAuth(res.user))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : t("auth.oauthError")))
      .finally(() => {
        setOAuthLoading(null);
        sessionStorage.removeItem("oauth_provider");
        sessionStorage.removeItem("oauth_state");
        sessionStorage.removeItem("oauth_verifier");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startOAuth = async (provider: "vk" | "mailru") => {
    setError("");
    setOAuthLoading(provider);
    try {
      const { url, state, code_verifier } = await authApi.oauthUrl(provider, OAUTH_REDIRECT);
      sessionStorage.setItem("oauth_provider", provider);
      sessionStorage.setItem("oauth_state", state);
      if (code_verifier) sessionStorage.setItem("oauth_verifier", code_verifier);
      window.location.href = url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("auth.genericError"));
      setOAuthLoading(null);
    }
  };

  const openTerms = () => { if (!openLegalExternally("terms")) setShowTerms(true); };
  const openPrivacy = () => { if (!openLegalExternally("privacy")) setShowPrivacy(true); };

  const submit = async () => {
    setError("");
    setEmailTaken(false);
    setBanned(null);
    setLoading(true);
    try {
      let result;
      if (mode === "register") {
        if (!name.trim()) { setError(t("auth.enterName")); setLoading(false); return; }
        result = await authApi.register(email, password, name);
      } else {
        result = await authApi.login(email, password);
      }
      onAuth(result.user);
    } catch (e: unknown) {
      if (isBanError(e)) {
        setBanned(e.message);
        setLoading(false);
        return;
      }
      const msg = e instanceof Error ? e.message : t("auth.genericError");
      if (mode === "register" && msg.toLowerCase().includes("уже занят")) {
        setEmailTaken(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const dismissBan = () => { setBanned(null); onBanSeen?.(); };

  return (
    <>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      {showTerms && (
        <AuthLegalSheet tab="terms" onClose={() => setShowTerms(false)} />
      )}
      {showPrivacy && (
        <AuthLegalSheet tab="privacy" onClose={() => setShowPrivacy(false)} />
      )}

      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}

      {banned && (
        <div className="px-4 pt-4">
          <BannedNotice
            reason={banned}
            onContactSupport={() => setShowSupport(true)}
            onDismiss={dismissBan}
          />
        </div>
      )}

      {variant === "card" ? (
        <AuthHeroCard
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
          onOpenTerms={openTerms}
          onOpenPrivacy={openPrivacy}
          onEmailTakenDismiss={() => { setEmailTaken(false); setError(""); }}
          onOAuth={startOAuth}
          oauthLoading={oauthLoading}
        />
      ) : (
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
          onOpenTerms={openTerms}
          onOpenPrivacy={openPrivacy}
          onEmailTakenDismiss={() => { setEmailTaken(false); setError(""); }}
          onOAuth={startOAuth}
          oauthLoading={oauthLoading}
        />
      )}
    </>
  );
}