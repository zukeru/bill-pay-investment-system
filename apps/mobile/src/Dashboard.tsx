import React, { useEffect, useState } from "react";
import { Image, Pressable, View, useWindowDimensions } from "react-native";
import { api, openDocument } from "./api";
import { Request, User, countryName, money } from "./types";
import { C, F } from "./theme";
import {
  Button,
  Empty,
  Icon,
  Loading,
  Notice,
  SectionHeading,
  Sheet,
  T,
  s,
} from "./ui";
import { requestImage } from "./images";
export const statusLabel = (status: string) =>
  ({
    pending: "In review",
    approved: "Approved",
    rejected: "Needs attention",
    fully_funded: "Fully supported",
  })[status] || status.replace(/_/g, " ");
export default function Dashboard({
  user,
  refresh,
  onCreate,
}: {
  user: User;
  refresh: number;
  onCreate: () => void;
}) {
  const { width } = useWindowDimensions(),
    [requests, setRequests] = useState<Request[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [selected, setSelected] = useState<Request | null>(null);
  useEffect(() => {
    setLoading(true);
    api<{ requests: Request[] }>("/my/requests")
      .then((r) => setRequests(r.requests))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refresh]);
  return (
    <>
      <T style={{ fontFamily: F.medium, fontSize: 15, marginBottom: 10 }}>
        Hello, {user.name.split(" ")[0]}.
      </T>
      <SectionHeading
        title={"A little help. A new beginning."}
        subtitle="Share your need with backers who want to make a meaningful difference in people’s lives."
      />
      <Button
        label="Create a request"
        icon="add-outline"
        variant="accent"
        onPress={onCreate}
        style={{
          alignSelf: width < 600 ? "stretch" : "flex-start",
          marginBottom: 34,
        }}
      />
      <View
        style={[s.row, { justifyContent: "space-between", marginBottom: 18 }]}
      >
        <T style={{ fontFamily: F.serif, fontSize: 28 }}>My requests</T>
        <T style={{ fontSize: 12, color: C.muted }}>{requests.length} total</T>
      </View>
      {error && <Notice text={error} type="error" />}
      {loading ? (
        <Loading />
      ) : requests.length === 0 ? (
        <Empty
          title="Your story starts here."
          body="Create your first request and let someone be part of your next chapter."
        />
      ) : (
        <View style={{ gap: 12, maxWidth: 920 }}>
          {requests.map((r) => (
            <Pressable
              key={r.id}
              accessibilityRole="button"
              accessibilityLabel={`View ${r.title}`}
              onPress={() => setSelected(r)}
              style={[s.card, { padding: 15, flexDirection: "row", gap: 18 }]}
            >
              <Image
                source={requestImage(r)}
                style={{
                  width: width < 600 ? 85 : 125,
                  height: width < 600 ? 119 : 112,
                  borderRadius: 6,
                }}
              />
              <View style={{ flex: 1, justifyContent: "space-between" }}>
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <T
                      style={{
                        fontFamily: F.medium,
                        fontSize: 15,
                        flexShrink: 1,
                      }}
                    >
                      {r.title}
                    </T>
                    <View
                      style={{
                        backgroundColor:
                          r.status === "approved"
                            ? "#E9F0E6"
                            : r.status === "rejected"
                              ? "#F9EBE5"
                              : "#EAF0FB",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 20,
                      }}
                    >
                      <T
                        style={{
                          fontSize: 10,
                          color: r.status === "rejected" ? C.red : C.forest,
                        }}
                      >
                        {statusLabel(r.status)}
                      </T>
                    </View>
                  </View>
                  <T style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>
                    {r.city}, {countryName(r.country)} · {r.category}
                  </T>
                </View>
                <View>
                  <T style={{ fontSize: 11, marginBottom: 7 }}>
                    <T style={{ fontFamily: F.bold, fontSize: 12 }}>
                      {money(r.fundedCents)}
                    </T>{" "}
                    <T style={{ fontSize: 10, color: C.muted }}>
                      of {money(r.amountCents)} · simulated support
                    </T>
                  </T>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: C.soft,
                      borderRadius: 6,
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.min(100, (r.fundedCents / r.amountCents) * 100)}%`,
                        height: 6,
                        borderRadius: 6,
                        backgroundColor: C.accent,
                      }}
                    />
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      <T
        style={{
          fontFamily: F.serif,
          fontSize: 28,
          marginTop: 37,
          marginBottom: 23,
        }}
      >
        How it works
      </T>
      <View
        style={{
          flexDirection: width >= 1000 ? "row" : "column",
          gap: 26,
          maxWidth: 920,
        }}
      >
        {[
          ["Create a request", "Tell your story and share what you need."],
          ["Platform review", "A reviewer checks your request and evidence."],
          [
            "Receive support",
            "Approved requests become visible to backers. Demo support stays simulated.",
          ],
        ].map(([title, body], i) => (
          <View key={title} style={{ flexDirection: "row", gap: 15, flex: 1 }}>
            <View
              style={{
                width: 35,
                height: 35,
                borderRadius: 35,
                backgroundColor: C.soft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <T style={{ fontFamily: F.medium }}>{i + 1}</T>
            </View>
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: F.medium, marginBottom: 5 }}>{title}</T>
              <T style={{ fontSize: 12, color: C.muted, lineHeight: 20 }}>
                {body}
              </T>
            </View>
          </View>
        ))}
      </View>
      <Sheet
        visible={!!selected}
        onClose={() => setSelected(null)}
        title="Your request"
      >
        {selected && (
          <>
            <T style={{ fontFamily: F.serif, fontSize: 31, marginBottom: 12 }}>
              {selected.title}
            </T>
            <Notice
              text={`Status: ${statusLabel(selected.status)}. ${selected.status === "pending" ? "Your request is waiting for platform review." : ""}`}
            />
            <T style={{ lineHeight: 23, color: C.muted, marginVertical: 14 }}>
              {selected.story}
            </T>
            {(selected as any).reviewNote && (
              <Notice
                type={selected.status === "rejected" ? "error" : "info"}
                text={`Reviewer note: ${(selected as any).reviewNote}`}
              />
            )}
            <T style={{ fontSize: 12, color: C.muted }}>
              Evidence documents: {selected.documentCount}. Only you and
              authorized reviewers can access them.
            </T>
            {(selected.documents || []).map((d) => (
              <Pressable
                key={d.id}
                accessibilityRole="link"
                onPress={() =>
                  openDocument(d.id, d.name, d.mime).catch((e) =>
                    setError(e.message),
                  )
                }
                style={[s.row, { gap: 8, paddingVertical: 13 }]}
              >
                <Icon name="document-text-outline" color={C.forest} />
                <T style={{ fontSize: 12, color: C.forest, flex: 1 }}>
                  {d.name}
                </T>
                <Icon name="open-outline" size={16} />
              </Pressable>
            ))}
            <T style={{ fontFamily: F.serif, fontSize: 28, marginTop: 20 }}>
              {money(selected.fundedCents)} of {money(selected.amountCents)}
            </T>
            <Notice text="All support shown is simulated. No live bill payment or investment has occurred." />
          </>
        )}
      </Sheet>
    </>
  );
}
