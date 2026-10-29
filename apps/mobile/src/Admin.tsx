import React, { useEffect, useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { api, openDocument, patch } from "./api";
import { Request, money, countryName } from "./types";
import { C, F } from "./theme";
import {
  Button,
  Empty,
  Field,
  Icon,
  Loading,
  Notice,
  SectionHeading,
  Sheet,
  T,
  s,
} from "./ui";
import { statusLabel } from "./Dashboard";
export default function Admin() {
  const [items, setItems] = useState<Request[]>([]),
    [loading, setLoading] = useState(true),
    [selected, setSelected] = useState<Request | null>(null),
    [note, setNote] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("pending");
  const load = () => {
    api<{ requests: Request[] }>("/admin/requests")
      .then((r) => setItems(r.requests))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  const review = async (status: "approved" | "rejected") => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await patch(`/admin/requests/${selected.id}`, { status, note });
      setSelected(null);
      setNote("");
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <SectionHeading
        title="A thoughtful review."
        subtitle="Review public stories and private evidence with care. Platform approval does not verify identity or endorse an investment."
      />
      <View style={[s.row, { gap: 8, marginBottom: 20, flexWrap: "wrap" }]}>
        {["pending", "approved", "rejected", "all"].map((x) => (
          <Button
            key={x}
            label={x === "all" ? "All requests" : statusLabel(x)}
            variant={filter === x ? "primary" : "outline"}
            onPress={() => setFilter(x)}
          />
        ))}
      </View>
      {error && <Notice text={error} type="error" />}
      {loading ? (
        <Loading />
      ) : items.filter((r) => filter === "all" || r.status === filter)
          .length === 0 ? (
        <Empty
          title="All clear for now."
          body="New submissions will appear here for review."
        />
      ) : (
        <View style={s.card}>
          {items
            .filter((r) => filter === "all" || r.status === filter)
            .map((r) => (
              <Pressable
                key={r.id}
                accessibilityRole="button"
                onPress={async () => {
                  setNote("");
                  try {
                    const detail = await api<{ request: Request }>(
                      `/requests/${r.id}`,
                    );
                    setSelected(detail.request);
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
                style={{
                  padding: 21,
                  borderBottomWidth: 1,
                  borderColor: C.line,
                  flexDirection: "row",
                  gap: 20,
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <T style={{ fontFamily: F.medium, marginBottom: 8 }}>
                    {r.title}
                  </T>
                  <T style={{ fontSize: 11, color: C.muted }}>
                    {r.applicantName} · {r.city}, {countryName(r.country)} ·{" "}
                    {r.documentCount} documents
                  </T>
                </View>
                <T style={{ fontSize: 12 }}>{money(r.amountCents)}</T>
                <Icon name="chevron-forward" size={17} />
              </Pressable>
            ))}
        </View>
      )}
      <Sheet
        visible={!!selected}
        onClose={() => setSelected(null)}
        title="Review request"
      >
        {selected && (
          <>
            <T style={{ fontFamily: F.serif, fontSize: 31, marginBottom: 13 }}>
              {selected.title}
            </T>
            <T style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>
              {selected.applicantName} · {statusLabel(selected.status)} ·{" "}
              {money(selected.amountCents)}
            </T>
            <T style={{ lineHeight: 23 }}>{selected.story}</T>
            {selected.kind === "project" && (
              <Notice text={`${selected.terms} ${selected.riskDisclosure}`} />
            )}
            <View style={s.divider} />
            <T style={{ fontFamily: F.medium, marginBottom: 13 }}>
              Private applicant profile
            </T>
            <T
              style={{
                fontSize: 11,
                color: C.muted,
                lineHeight: 20,
                marginBottom: 13,
              }}
            >
              Email: {(selected as any).applicantEmail || "Not provided"}
              {"\n"}Readiness:{" "}
              {(selected as any).applicantVerificationStatus || "not started"} ·
              Identity not verified
            </T>
            {Object.entries((selected as any).applicantProfile || {})
              .filter(([k]) => !k.toLowerCase().includes("consent"))
              .map(([k, v]) => (
                <View key={k} style={[s.row, { gap: 16, paddingVertical: 7 }]}>
                  <T style={{ fontSize: 11, color: C.muted, width: 120 }}>
                    {k.replace(/([A-Z])/g, " $1")}
                  </T>
                  <T style={{ fontSize: 12, flex: 1 }}>{String(v)}</T>
                </View>
              ))}
            <View style={s.divider} />
            <T style={{ fontFamily: F.medium, marginBottom: 13 }}>
              Private evidence
            </T>
            {(selected.documents || []).length === 0 ? (
              <T style={{ fontSize: 12, color: C.muted }}>
                No evidence attached.
              </T>
            ) : (
              selected.documents!.map((d) => (
                <Pressable
                  key={d.id}
                  accessibilityRole="link"
                  onPress={() =>
                    openDocument(d.id, d.name, d.mime).catch((e) =>
                      setError(e.message),
                    )
                  }
                  style={[s.row, { gap: 8, paddingVertical: 12 }]}
                >
                  <Icon name="document-text-outline" color={C.forest} />
                  <T style={{ fontSize: 12, color: C.forest, flex: 1 }}>
                    {d.name}
                  </T>
                  <Icon name="open-outline" size={16} />
                </Pressable>
              ))
            )}
            <View style={s.divider} />
            <Field
              label="Reviewer note"
              value={note}
              onChangeText={setNote}
              multiline
              placeholder="Explain your decision. This note is visible to the applicant."
            />
            <Notice text="Approval makes the request discoverable. It does not establish KYC, investment suitability or legal authorization for live operation." />
            {error && <Notice type="error" text={error} />}
            <View style={[s.row, { gap: 10 }]}>
              <Button
                label="Approve request"
                icon="checkmark"
                busy={busy}
                onPress={() => review("approved")}
                style={{ flex: 1 }}
              />
              <Button
                label="Reject request"
                icon="close"
                busy={busy}
                variant="outline"
                onPress={() => review("rejected")}
                style={{ flex: 1 }}
              />
            </View>
          </>
        )}
      </Sheet>
    </>
  );
}
