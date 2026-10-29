import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { api, login, post, storeSession } from "./api";
import { User } from "./types";
import AccountRecovery from "./AccountRecovery";
import { C, F } from "./theme";
import { Button, Checkbox, Field, Icon, Notice, Sheet, T, s } from "./ui";
export default function Auth({ onLogin }: { onLogin: (user: User) => void }) {
  const { width } = useWindowDimensions(),
    wide = width >= 850;
  const [forgot, setForgot] = useState(false);
  const [signup, setSignup] = useState(false),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [country, setCountry] = useState("US"),
    [role, setRole] = useState<"backer" | "applicant">("backer"),
    [accepted, setAccepted] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [legal, setLegal] = useState(false);
  const submit = async (demo?: "backer" | "applicant") => {
    setError("");
    setBusy(true);
    try {
      let user: User;
      if (demo)
        user = await login(
          demo === "backer"
            ? "investor@billionairepay.local"
            : "applicant@billionairepay.local",
          demo === "backer" ? "BackerDemo!2026" : "ApplicantDemo!2026",
        );
      else if (signup) {
        if (!accepted)
          throw new Error(
            "Please review and accept the draft Terms and Privacy Notice.",
          );
        const result = await post<{ user: User; token: string }>(
          "/auth/register",
          {
            name,
            email,
            password,
            role,
            country: country.toUpperCase(),
            acceptTerms: accepted,
          },
        );
        await storeSession(result.token);
        user = result.user;
      } else user = await login(email, password);
      onLogin(user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (forgot)
    return <AccountRecovery mode="forgot" onDone={() => setForgot(false)} />;
  return (
    <ScrollView
      style={{ backgroundColor: C.canvas }}
      contentContainerStyle={{
        minHeight: "100%",
        flexDirection: wide ? "row" : "column",
      }}
      keyboardShouldPersistTaps="handled"
    >
      {wide && (
        <View
          style={{
            width: "46%",
            minHeight: 850,
            backgroundColor: "#EEF2FF",
            padding: 62,
            justifyContent: "space-between",
          }}
        >
          <View>
            <T
              style={{
                fontFamily: F.serif,
                fontSize: 74,
                color: C.accent,
                lineHeight: 76,
              }}
            >
              B
            </T>
            <T style={{ fontFamily: F.serif, fontSize: 25, color: C.ink }}>
              Billionaire Pay
            </T>
          </View>
          <View>
            <T
              style={{
                fontFamily: F.serif,
                fontSize: 49,
                lineHeight: 55,
                color: C.ink,
              }}
            >
              A little generosity.{"\n"}A world of possibility.
            </T>
            <T
              style={{
                color: C.muted,
                lineHeight: 26,
                fontSize: 16,
                marginTop: 25,
                maxWidth: 380,
              }}
            >
              Find a need. See the person. Choose your impact.
            </T>
            <View
              style={{
                marginTop: 38,
                width: 52,
                height: 2,
                backgroundColor: C.accent,
              }}
            />
          </View>
          <T style={{ color: C.muted, fontSize: 12 }}>
            Small acts. Meaningful change.
          </T>
        </View>
      )}
      <View
        style={{
          flex: 1,
          padding: wide ? 58 : 26,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View style={{ width: "100%", maxWidth: 400 }}>
          {!wide && (
            <View style={[s.row, { gap: 12, marginBottom: 38 }]}>
              <T style={{ fontFamily: F.serif, fontSize: 52, color: C.forest }}>
                B
              </T>
              <T style={{ fontFamily: F.serif, fontSize: 25 }}>
                Billionaire Pay
              </T>
            </View>
          )}
          <View style={[s.row, { gap: 7, marginBottom: 23 }]}>
            <View
              style={{
                height: 7,
                width: 7,
                borderRadius: 7,
                backgroundColor: "#72945F",
              }}
            />
            <T style={{ fontSize: 11, color: C.muted }}>
              LOCAL DEMO · NO REAL FUNDS MOVE
            </T>
          </View>
          <T style={{ fontFamily: F.serif, fontSize: 33, marginBottom: 8 }}>
            {signup ? "Begin something good." : "Welcome back."}
          </T>
          <T style={{ color: C.muted, marginBottom: 28, lineHeight: 22 }}>
            {signup
              ? "A small step toward a meaningful difference."
              : "Your next meaningful difference starts here."}
          </T>
          {signup && (
            <>
              <Field
                label="Full name"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
              />
              <View style={[s.row, { gap: 8, marginBottom: 20 }]}>
                <Button
                  label="I want to support"
                  variant={role === "backer" ? "primary" : "outline"}
                  onPress={() => setRole("backer")}
                  style={{ flex: 1 }}
                />
                <Button
                  label="I need support"
                  variant={role === "applicant" ? "primary" : "outline"}
                  onPress={() => setRole("applicant")}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          )}
          <Field
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder={
              signup
                ? "Create a password (12+ characters)"
                : "Enter your password"
            }
          />
          {!signup && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setForgot(true)}
              style={{ alignSelf: "flex-end", marginBottom: 17 }}
            >
              <T style={{ fontSize: 12, color: C.forest }}>Forgot password?</T>
            </Pressable>
          )}
          {signup && (
            <>
              <Field
                label="Country code"
                value={country}
                onChangeText={setCountry}
                placeholder="CM"
                hint="Two-letter country code, e.g. CM, US, GB."
              />
              <Checkbox
                checked={accepted}
                onChange={() => setAccepted(!accepted)}
              >
                I am an adult and agree to the draft Terms, Privacy Notice and
                local demo conditions.
              </Checkbox>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Read Terms and Privacy"
                onPress={() => setLegal(true)}
              >
                <T style={{ fontSize: 12, color: C.accent, marginBottom: 15 }}>
                  Read Terms & Privacy
                </T>
              </Pressable>
            </>
          )}
          {error && <Notice type="error" text={error} />}
          <Button
            testID="login-submit"
            label={signup ? "Create an account" : "Sign in"}
            busy={busy}
            onPress={() => submit()}
            icon="arrow-forward-outline"
          />
          <View
            style={[
              s.row,
              { justifyContent: "center", gap: 6, marginVertical: 22 },
            ]}
          >
            <T style={{ fontSize: 12, color: C.muted }}>
              {signup
                ? "Already part of the community?"
                : "New to Billionaire Pay?"}
            </T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={signup ? "Sign in" : "Create account"}
              onPress={() => {
                setSignup(!signup);
                setError("");
              }}
            >
              <T style={{ fontSize: 12, color: C.forest, fontFamily: F.bold }}>
                {signup ? "Sign in" : "Create account"}
              </T>
            </Pressable>
          </View>
          <View style={s.divider} />
          <T
            style={{
              fontSize: 12,
              color: C.muted,
              textAlign: "center",
              marginBottom: 13,
            }}
          >
            Take a look around with a test account
          </T>
          <View style={[s.row, { gap: 9 }]}>
            <Button
              label="Explore as a backer"
              onPress={() => submit("backer")}
              busy={busy}
              variant="outline"
              icon="heart-outline"
              style={{ flex: 1, paddingHorizontal: 8 }}
            />
            <Button
              label="Try applicant view"
              onPress={() => submit("applicant")}
              busy={busy}
              variant="outline"
              icon="leaf-outline"
              style={{ flex: 1, paddingHorizontal: 8 }}
            />
          </View>
          <T
            style={{
              color: C.muted,
              fontSize: 10,
              textAlign: "center",
              lineHeight: 17,
              marginTop: 18,
            }}
          >
            Fictional sample requests. Simulated support.{"\n"}A thoughtful
            space to explore what’s possible.
          </T>
        </View>
      </View>
      <Sheet
        visible={legal}
        onClose={() => setLegal(false)}
        title="Draft Terms & Privacy"
      >
        <T style={{ lineHeight: 24 }}>
          DRAFT US / COLORADO TERMS — This is a local demonstration using
          fictional sample requests. Contributions are simulated and investment
          interest is nonbinding. No real bill is paid, investment accepted,
          charitable tax deduction promised, return promised or identity
          verification completed. A future Reg CF offering requires an
          appropriately registered funding portal or broker-dealer. Account
          details and evidence are stored in the local application. Public
          requests show your name, location and story; your private profile and
          evidence are restricted to you and authorized reviewers. Do not upload
          sensitive government or financial account information. These draft
          terms require jurisdiction-specific legal review before any live
          operation. You may contact the local operator to request correction or
          deletion.
        </T>
      </Sheet>
    </ScrollView>
  );
}
