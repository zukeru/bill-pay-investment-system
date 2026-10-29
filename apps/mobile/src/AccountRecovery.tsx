import React, { useEffect, useState } from "react";
import { View, ScrollView } from "react-native";
import { post } from "./api";
import { C, F } from "./theme";
import { Button, Field, Icon, Notice, T } from "./ui";
export default function AccountRecovery({
  mode,
  token: initialToken = "",
  onDone,
}: {
  mode: "forgot" | "reset" | "verify";
  token?: string;
  onDone: (completed?: boolean) => void;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [token, setToken] = useState(initialToken),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      if (mode === "forgot") {
        const r = await post<{ message: string }>("/auth/forgot-password", {
          email,
        });
        setSuccess(
          r.message || "If an account exists, a reset link has been sent.",
        );
      } else if (mode === "reset") {
        if (password !== confirm)
          throw new Error("The passwords do not match.");
        await post("/auth/reset-password", { token, password });
        setSuccess(
          "Your password has been changed. Sign in with your new password.",
        );
      } else {
        await post("/auth/verify-email", { token });
        setSuccess("Your email address is confirmed.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (mode === "verify" && initialToken) submit();
  }, []);
  return (
    <ScrollView
      style={{ backgroundColor: C.canvas }}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 28,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          width: "100%",
          maxWidth: 420,
          backgroundColor: C.white,
          borderWidth: 1,
          borderColor: C.line,
          borderRadius: 12,
          padding: 30,
        }}
      >
        <Icon
          name={mode === "verify" ? "mail-outline" : "lock-closed-outline"}
          size={32}
          color={C.forest}
        />
        <T
          style={{
            fontFamily: F.bold,
            fontSize: 29,
            lineHeight: 36,
            marginVertical: 18,
          }}
        >
          {mode === "forgot"
            ? "Let’s get you back in."
            : mode === "reset"
              ? "A fresh start."
              : "Confirm your email."}
        </T>
        {success ? (
          <>
            <Notice text={success} type="success" />
            <Button
              label={mode === "forgot" ? "Back to sign in" : "Continue"}
              onPress={() => onDone(true)}
              style={{ marginTop: 15 }}
            />
          </>
        ) : (
          <>
            {mode === "forgot" ? (
              <>
                <T style={{ color: C.muted, lineHeight: 23, marginBottom: 22 }}>
                  Enter the email address on your account and we’ll send a reset
                  link.
                </T>
                <Field
                  label="Email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  placeholder="you@example.com"
                />
              </>
            ) : (
              <>
                {!initialToken && (
                  <Field
                    label="Email token"
                    value={token}
                    onChangeText={setToken}
                    placeholder="Paste the token from your email"
                  />
                )}
                {mode === "reset" && (
                  <>
                    <Field
                      label="New password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      placeholder="At least 12 characters"
                    />
                    <Field
                      label="Confirm new password"
                      value={confirm}
                      onChangeText={setConfirm}
                      secureTextEntry
                    />
                  </>
                )}
              </>
            )}
            {error && <Notice type="error" text={error} />}
            <Button
              label={
                mode === "forgot"
                  ? "Send reset link"
                  : mode === "reset"
                    ? "Change password"
                    : "Confirm email"
              }
              onPress={submit}
              busy={busy}
            />
            <Button
              label="Back"
              variant="ghost"
              onPress={() => onDone(false)}
              style={{ marginTop: 10 }}
            />
          </>
        )}
        <T
          style={{
            fontSize: 10,
            lineHeight: 17,
            color: C.muted,
            textAlign: "center",
            marginTop: 20,
          }}
        >
          Local demo emails are available in the Mailpit inbox.
        </T>
      </View>
    </ScrollView>
  );
}
