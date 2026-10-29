import React, { useRef, useState } from "react";
import { Image, Linking, Pressable, View } from "react-native";
import { key, post } from "./api";
import { Request, Transaction, countryName, money } from "./types";
import { C, F } from "./theme";
import { Button, Checkbox, Field, Icon, Notice, Sheet, T, s } from "./ui";
import { requestImage } from "./images";
export default function Support({
  request,
  onClose,
  onComplete,
  paymentsConfigured,
}: {
  request: Request | null;
  onClose: () => void;
  onComplete: () => void;
  paymentsConfigured: boolean;
}) {
  const intent = useRef<{ fingerprint: string; key: string } | null>(null);
  const [amount, setAmount] = useState("25"),
    [accepted, setAccepted] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState<Transaction | null>(null),
    [checkout, setCheckout] = useState(false);
  React.useEffect(() => {
    setSuccess(null);
    setError("");
    setAmount("25");
    setAccepted(false);
    setCheckout(false);
  }, [request?.id]);
  const submit = async () => {
    if (!request) return;
    setError("");
    const cents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(cents) || cents < 100) {
      setError("Enter an amount of at least $1.");
      return;
    }
    if (!accepted) {
      setError(
        request.kind === "project"
          ? "Please acknowledge the investment risks."
          : "Please accept the demo support terms.",
      );
      return;
    }
    setBusy(true);
    try {
      const fingerprint = `${request.id}:${cents}:${checkout ? "stripe_test" : request.kind}`;
      if (!intent.current || intent.current.fingerprint !== fingerprint)
        intent.current = { fingerprint, key: key() };
      const idempotencyKey = intent.current.key;
      if (checkout && request.kind === "bill") {
        const result = await post<{ url: string; transaction: Transaction }>(
          "/payments/checkout",
          {
            requestId: request.id,
            amountCents: cents,
            idempotencyKey,
            acceptTerms: true,
          },
        );
        await Linking.openURL(result.url);
        intent.current = null;
        onComplete();
        onClose();
      } else {
        const result = await post<{ transaction: Transaction }>(
          request.kind === "bill" ? "/contributions" : "/investments/interest",
          {
            requestId: request.id,
            amountCents: cents,
            idempotencyKey,
            acceptTerms: true,
            acknowledgeRisk: true,
          },
        );
        setSuccess(result.transaction);
        intent.current = null;
        onComplete();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      visible={!!request}
      onClose={onClose}
      title={
        success
          ? "A meaningful step."
          : request?.kind === "project"
            ? "Explore this possibility"
            : "A little help goes a long way"
      }
    >
      {request &&
        (success ? (
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <View
              style={{
                backgroundColor: C.soft,
                padding: 19,
                borderRadius: 50,
                marginBottom: 20,
              }}
            >
              <Icon name="heart-outline" size={34} color={C.forest} />
            </View>
            <T
              style={{
                fontFamily: F.serif,
                fontSize: 34,
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              {request.kind === "bill"
                ? "Your kindness is recorded."
                : "Your interest is recorded."}
            </T>
            <T style={{ textAlign: "center", color: C.muted, lineHeight: 23 }}>
              {money(success.amountCents)}{" "}
              {request.kind === "bill"
                ? "in simulated support for"
                : "in nonbinding interest in"}{" "}
              {request.title.toLowerCase()}.
            </T>
            <Notice
              type="success"
              text={
                request.kind === "bill"
                  ? "This is a demonstration. No real funds moved and the bill has not been paid."
                  : "No funds were collected. This record is nonbinding and creates no investment or ownership rights."
              }
            />
            <T style={{ fontSize: 11, color: C.muted, marginVertical: 15 }}>
              Reference: {success.reference}
            </T>
            <Button
              label="Continue discovering"
              onPress={onClose}
              style={{ alignSelf: "stretch" }}
            />
          </View>
        ) : (
          <>
            <Image
              source={requestImage(request)}
              style={{ width: "100%", height: 200, borderRadius: 8 }}
            />
            <View style={[s.row, { gap: 5, marginTop: 19 }]}>
              <Icon name="location-outline" size={14} color={C.muted} />
              <T style={{ color: C.muted, fontSize: 11 }}>
                {request.category} · {request.city},{" "}
                {countryName(request.country)}
              </T>
            </View>
            <T
              style={{
                fontFamily: F.serif,
                fontSize: 35,
                lineHeight: 39,
                marginVertical: 10,
              }}
            >
              {request.title}
            </T>
            <T style={{ color: C.muted, lineHeight: 23 }}>{request.story}</T>
            <View style={s.divider} />
            <View
              style={[
                s.row,
                { justifyContent: "space-between", marginBottom: 17 },
              ]}
            >
              <T>
                {request.kind === "bill"
                  ? "Still needed"
                  : "Illustrative target"}
              </T>
              <T style={{ fontFamily: F.bold }}>
                {money(
                  request.kind === "bill"
                    ? Math.max(
                        0,
                        request.amountCents -
                          request.fundedCents -
                          request.reservedCents,
                      )
                    : request.amountCents,
                )}
              </T>
            </View>
            {request.billerName && (
              <T style={{ fontSize: 12, color: C.muted, marginBottom: 15 }}>
                Biller: {request.billerName}
              </T>
            )}
            <T style={{ fontFamily: F.medium, marginBottom: 10 }}>
              {request.kind === "bill"
                ? "Choose your support"
                : "Record nonbinding interest"}
            </T>
            <View style={[s.row, { gap: 8, marginBottom: 17 }]}>
              {["10", "25", "50", "100"].map((n) => (
                <Button
                  key={n}
                  label={`$${n}`}
                  variant={amount === n ? "primary" : "outline"}
                  onPress={() => setAmount(n)}
                  style={{ flex: 1, paddingHorizontal: 8 }}
                />
              ))}
            </View>
            <Field
              label={
                request.kind === "bill"
                  ? "Support amount (USD)"
                  : "Interest amount (USD)"
              }
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            {request.kind === "project" && (
              <Notice
                text={`${request.riskDisclosure || "You could lose all invested capital. No return is guaranteed."} This local demo only records interest. Any future US Regulation Crowdfunding offering requires a registered funding portal or broker-dealer.`}
              />
            )}
            <Checkbox
              checked={accepted}
              onChange={() => setAccepted(!accepted)}
            >
              {request.kind === "project"
                ? "I understand the risk of total loss, illiquidity and no guaranteed returns. This is nonbinding interest only."
                : "I agree to the draft support terms. This demonstration does not pay a real bill, send money to a recipient or create a charitable tax deduction."}
            </Checkbox>
            {request.terms && (
              <T
                style={{
                  fontSize: 11,
                  color: C.muted,
                  lineHeight: 18,
                  marginBottom: 13,
                }}
              >
                {request.terms}
              </T>
            )}
            {paymentsConfigured && request.kind === "bill" && (
              <Checkbox
                checked={checkout}
                onChange={() => setCheckout(!checkout)}
              >
                Use Stripe test checkout. Test cards only; no live payment or
                bill settlement.
              </Checkbox>
            )}
            {error && <Notice text={error} type="error" />}
            <Button
              label={
                request.kind === "project"
                  ? "Record nonbinding interest"
                  : checkout
                    ? "Continue to Stripe test checkout"
                    : "Confirm simulated support"
              }
              icon="arrow-forward-outline"
              busy={busy}
              onPress={submit}
            />
            <T
              style={{
                fontSize: 10,
                color: C.muted,
                textAlign: "center",
                marginTop: 13,
              }}
            >
              Local demo · Fictional sample request · USD
            </T>
          </>
        ))}
    </Sheet>
  );
}
