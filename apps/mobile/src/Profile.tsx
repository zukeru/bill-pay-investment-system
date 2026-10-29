import React, { useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { patch, post } from "./api";
import { User } from "./types";
import { C, F } from "./theme";
import {
  Button,
  Checkbox,
  Field,
  Icon,
  Notice,
  SectionHeading,
  T,
  s,
} from "./ui";
export default function Profile({
  user,
  onUpdate,
  onLogout,
}: {
  user: User;
  onUpdate: (user: User) => void;
  onLogout: () => void;
}) {
  const [name, setName] = useState(user.name),
    [country, setCountry] = useState(user.country || "US"),
    [profile, setProfile] = useState<Record<string, string | boolean>>({
      ...user.profile,
      state: user.profile.state || (user.country === "US" ? "Colorado" : ""),
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [emailSent, setEmailSent] = useState(false);
  const { width } = useWindowDimensions();
  const resend = async () => {
    setError("");
    try {
      await post("/auth/resend-verification", {});
      setEmailSent(true);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const save = async () => {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const r = await patch<{ user: User }>("/profile", {
        name,
        country,
        profile,
      });
      onUpdate(r.user);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const fields = [
    ["legalName", "Legal name", "As it appears on official records"],
    ["dob", "Date of birth", "YYYY-MM-DD"],
    ["address", "Street address", "Private address"],
    ["city", "City", "Denver"],
    ["state", "State / region", "Colorado"],
    ["postalCode", "Postal code", "80202"],
    ["phone", "Phone number", "Optional"],
    ["occupation", "Occupation", "Your occupation"],
    ...(user.role === "backer"
      ? [
          [
            "sourceOfFunds",
            "Source of funds",
            "Employment, savings or business income",
          ],
          [
            "investorType",
            "Investor type",
            "Individual / entity; subject to provider review",
          ],
        ]
      : [
          ["companyName", "Company / project name", "Optional"],
          ["registrationNumber", "Business registration number", "Optional"],
        ]),
  ];
  return (
    <>
      <SectionHeading
        title="A little more about you."
        subtitle="Keep your profile current and prepare for a more trusted community."
      />
      <View
        style={{
          flexDirection: width > 1100 ? "row" : "column",
          gap: 25,
          alignItems: "flex-start",
        }}
      >
        <View style={[s.card, { padding: 27, flex: 1, width: "100%" }]}>
          <T style={{ fontFamily: F.serif, fontSize: 25, marginBottom: 23 }}>
            Your account
          </T>
          <Field label="Display name" value={name} onChangeText={setName} />
          <Field
            label="Email address"
            value={user.email}
            editable={false}
            onChangeText={() => {}}
            hint="Your account email is fixed in this demonstration."
          />
          <Field
            label="Country code"
            value={country}
            onChangeText={setCountry}
            placeholder="US"
          />
          <View style={{ marginBottom: 12 }}>
            {emailSent && (
              <Notice
                type="success"
                text="A confirmation email has been sent. Check your local demo inbox."
              />
            )}
            <Notice
              text={
                user.emailVerified
                  ? "Email address confirmed. Identity verification is separate."
                  : "Your email address is not confirmed yet. Open the verification message sent to your email."
              }
            />
            {!user.emailVerified && (
              <Button
                label="Resend confirmation email"
                variant="outline"
                onPress={resend}
              />
            )}
          </View>
          <View style={s.divider} />
          <View style={[s.row, { gap: 8, marginBottom: 8 }]}>
            <Icon name="lock-closed-outline" size={17} color={C.forest} />
            <T style={{ fontFamily: F.serif, fontSize: 25 }}>
              Private readiness details
            </T>
          </View>
          <T
            style={{
              color: C.muted,
              fontSize: 12,
              lineHeight: 20,
              marginBottom: 23,
            }}
          >
            These fields are visible only to you and authorized reviewers.
            Completing them does not verify your identity or establish investor
            eligibility. Do not enter bank, card or government ID numbers.
          </T>
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 18 }}
          >
            {fields.map(([key, label, placeholder]) => (
              <View
                key={key}
                style={{
                  width:
                    width > 750 && key !== "address" && key !== "sourceOfFunds"
                      ? "47%"
                      : "100%",
                }}
              >
                <Field
                  label={label}
                  value={String(profile[key] || "")}
                  onChangeText={(value) =>
                    setProfile((p) => ({ ...p, [key]: value }))
                  }
                  placeholder={placeholder}
                />
              </View>
            ))}
          </View>
          <Checkbox
            checked={profile.privacyConsent === true}
            onChange={() =>
              setProfile((p) => ({ ...p, privacyConsent: !p.privacyConsent }))
            }
          >
            I consent to the local storage and review of these details under the
            draft Privacy Notice. Live identity screening requires a dedicated
            provider and separate consent.
          </Checkbox>
          {error && <Notice type="error" text={error} />}{" "}
          {saved && (
            <Notice
              type="success"
              text="Your profile has been saved. Identity verification remains subject to an authorized provider."
            />
          )}
          <Button
            label="Save profile"
            icon="checkmark-outline"
            onPress={save}
            busy={busy}
            style={{ alignSelf: "flex-start", marginTop: 10 }}
          />
        </View>
        <View style={{ width: width > 1100 ? 240 : "100%", gap: 17 }}>
          <View style={[s.card, { padding: 23 }]}>
            <Icon name="shield-checkmark-outline" size={25} color={C.forest} />
            <T style={{ fontFamily: F.serif, fontSize: 25, marginTop: 15 }}>
              Your readiness
            </T>
            <T
              style={{
                fontSize: 12,
                color: C.muted,
                lineHeight: 21,
                marginVertical: 13,
              }}
            >
              {user.verificationStatus === "submitted"
                ? "Profile submitted for review. Identity has not been verified."
                : "Complete your private details to submit a readiness profile."}
            </T>
            <View
              style={{
                height: 5,
                backgroundColor: C.soft,
                borderRadius: 5,
                marginBottom: 15,
              }}
            >
              <View
                style={{
                  height: 5,
                  width:
                    user.verificationStatus === "submitted" ? "60%" : "15%",
                  backgroundColor: C.accent,
                  borderRadius: 5,
                }}
              />
            </View>
            <T style={{ fontSize: 10, color: C.muted }}>
              Account role: {user.role}
            </T>
          </View>
          <Button
            label="Sign out"
            variant="outline"
            icon="log-out-outline"
            onPress={onLogout}
          />
        </View>
      </View>
    </>
  );
}
