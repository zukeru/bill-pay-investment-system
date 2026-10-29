import React, { useEffect, useState } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { api } from "./api";
import { Transaction, dateLabel, money } from "./types";
import { C, F } from "./theme";
import {
  Empty,
  Icon,
  Loading,
  Notice,
  SectionHeading,
  Sheet,
  T,
  s,
} from "./ui";
export default function Activity({ refresh }: { refresh: number }) {
  const [items, setItems] = useState<Transaction[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [selected, setSelected] = useState<Transaction | null>(null);
  const { width } = useWindowDimensions();
  useEffect(() => {
    api<{ transactions: Transaction[] }>("/activity")
      .then((r) => setItems(r.transactions))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refresh]);
  const contributionTotal = items
      .filter((t) => t.status === "simulated")
      .reduce((sum, t) => sum + t.amountCents, 0),
    interestTotal = items
      .filter((t) => t.kind === "investment_interest")
      .reduce((sum, t) => sum + t.amountCents, 0);
  return (
    <>
      <SectionHeading
        title="Small acts. Lasting intention."
        subtitle="A record of the possibilities you’ve chosen to support."
      />
      <View
        style={{
          flexDirection: "row",
          gap: 35,
          marginBottom: 33,
          flexWrap: "wrap",
        }}
      >
        {[
          [money(contributionTotal), "Simulated support"],
          [money(interestTotal), "Nonbinding project interest"],
          [String(items.length), "Activity records"],
        ].map(([n, label]) => (
          <View key={label}>
            <T style={{ fontFamily: F.serif, fontSize: 39 }}>{n}</T>
            <T style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>
              {label}
            </T>
          </View>
        ))}
      </View>
      {error && <Notice type="error" text={error} />}
      <Notice text="Demo records only. Simulated support does not mean a bill was paid. Project interest is nonbinding. Stripe test records, when enabled, never represent real bill settlement." />
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty
          title="Your impact story is yet to be written."
          body="Explore a request and record simulated support or nonbinding project interest to see it here."
        />
      ) : (
        <View style={[s.card, { marginTop: 20 }]}>
          {items.map((t) => (
            <Pressable
              key={t.id}
              accessibilityRole="button"
              accessibilityLabel={`Receipt for ${t.requestTitle}`}
              onPress={() => setSelected(t)}
              style={{
                padding: width < 600 ? 16 : 22,
                borderBottomWidth: 1,
                borderColor: C.line,
                flexDirection: "row",
                gap: 15,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  height: 41,
                  width: 41,
                  borderRadius: 41,
                  backgroundColor: C.soft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon
                  name={
                    t.kind === "contribution" ? "heart-outline" : "leaf-outline"
                  }
                  color={C.forest}
                />
              </View>
              <View style={{ flex: 1 }}>
                <T
                  style={{
                    fontFamily: F.medium,
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                >
                  {t.requestTitle}
                </T>
                <T style={{ fontSize: 10, color: C.muted, lineHeight: 17 }}>
                  {t.kind === "investment_interest"
                    ? "Nonbinding interest"
                    : t.status === "simulated"
                      ? "Simulated support"
                      : "Stripe test"}{" "}
                  · {dateLabel(t.createdAt)}
                </T>
              </View>
              <T style={{ fontFamily: F.medium, fontSize: 14 }}>
                {money(t.amountCents)}
              </T>
              <Icon name="chevron-forward" size={16} color={C.muted} />
            </Pressable>
          ))}
        </View>
      )}
      <Sheet
        visible={!!selected}
        title="Activity receipt"
        onClose={() => setSelected(null)}
      >
        {selected && (
          <>
            <T style={{ fontFamily: F.serif, fontSize: 31, marginBottom: 20 }}>
              {selected.requestTitle}
            </T>
            {[
              ["Amount", money(selected.amountCents)],
              [
                "Type",
                selected.kind === "contribution"
                  ? "Simulated support"
                  : "Nonbinding interest",
              ],
              ["Status", selected.status.replace(/_/g, " ")],
              ["Date", dateLabel(selected.createdAt)],
              ["Reference", selected.reference],
              [
                "Mode",
                selected.mode === "demo"
                  ? "Local demonstration"
                  : "Stripe test",
              ],
            ].map(([k, v]) => (
              <View
                key={k}
                style={[
                  s.row,
                  {
                    justifyContent: "space-between",
                    borderBottomWidth: 1,
                    borderColor: C.line,
                    paddingVertical: 13,
                    gap: 16,
                  },
                ]}
              >
                <T style={{ color: C.muted, fontSize: 12 }}>{k}</T>
                <T style={{ fontSize: 12, textAlign: "right", flex: 1 }}>{v}</T>
              </View>
            ))}
            <Notice text="This is a demonstration receipt, not proof of bill settlement, a charitable tax receipt or a securities holding." />
          </>
        )}
      </Sheet>
    </>
  );
}
