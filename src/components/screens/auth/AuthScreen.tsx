import { useState } from "react";
import { authApi, type User } from "@/lib/api";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { AuthForm } from "./AuthForm";
import { AuthLegalSheet } from "./AuthLegalSheet";
import { AuthConsentScreen } from "./AuthConsentScreen";

export function AuthScreen({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [rulesTab, setRulesTab] = useState<"terms" | "privacy">("terms");
  const [emailTaken, setEmailTaken] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [consentTab, setConsentTab] = useState<"terms" | "privacy">("terms");

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
      setPendingUser(result.user);
      setShowConsent(true);
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

      {showConsent && pendingUser && (
        <AuthConsentScreen
          pendingUser={pendingUser}
          consentTab={consentTab}
          onTabChange={setConsentTab}
          onAccept={() => { setShowConsent(false); if (pendingUser) onAuth(pendingUser); }}
        />
      )}

      {showRules && (
        <AuthLegalSheet
          rulesTab={rulesTab}
          onTabChange={setRulesTab}
          onClose={() => setShowRules(false)}
        />
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
        onOpenTerms={() => { setRulesTab("terms"); setShowRules(true); }}
        onOpenPrivacy={() => { setRulesTab("privacy"); setShowRules(true); }}
        onEmailTakenDismiss={() => { setEmailTaken(false); setError(""); }}
      />
    </>
  );
}
