import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { api, post } from "./api";
import { Request, Transaction, countryName, money } from "./types";
import { C, F } from "./theme";
import { Button, Empty, Icon, Loading, Notice, Sheet, T, s } from "./ui";
import { requestImage } from "./images";
export default function Discover({
  savedOnly = false,
  refresh,
  onReview,
  onActivity,
}: {
  savedOnly?: boolean;
  refresh: number;
  onReview: (request: Request) => void;
  onActivity: () => void;
}) {
  const { width } = useWindowDimensions(),
    desktop = width >= 900,
    showImpact = width >= 1200;
  const [requests, setRequests] = useState<Request[]>([]),
    [transactions, setTransactions] = useState<Transaction[]>([]),
    [kind, setKind] = useState<"bill" | "project">("bill"),
    [category, setCategory] = useState("All needs"),
    [location, setLocation] = useState("Any location"),
    [query, setQuery] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [passed, setPassed] = useState<string[]>([]),
    [filter, setFilter] = useState<"category" | "location" | null>(null),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    Promise.all([
      api<{ requests: Request[] }>(savedOnly ? "/saved" : "/requests"),
      api<{ transactions: Transaction[] }>("/activity"),
    ])
      .then(([r, t]) => {
        if (live) {
          setRequests(r.requests);
          setTransactions(t.transactions);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [refresh, savedOnly]);
  const filtered = requests.filter(
    (r) =>
      (savedOnly || r.kind === kind) &&
      (category === "All needs" || r.category === category) &&
      (location === "Any location" || r.country === location) &&
      `${r.title} ${r.story} ${r.city} ${r.category} ${countryName(r.country)}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      !passed.includes(r.id),
  );
  const hero = filtered[0];
  const save = async (request: Request) => {
    setSaving(true);
    setError("");
    try {
      await post(`/requests/${request.id}/save`, { saved: !request.saved });
      setRequests((current) =>
        current
          .map((r) => (r.id === request.id ? { ...r, saved: !r.saved } : r))
          .filter((r) => !savedOnly || r.saved),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const pass = () => {
    if (hero) {
      setPassed((p) => [...p, hero.id]);
      pan.setValue({ x: 0, y: 0 });
    }
  };
  const pan = useRef(new Animated.ValueXY()).current;
  const gesture = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 18 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderMove: (_, g) => pan.setValue({ x: g.dx * 0.6, y: 0 }),
        onPanResponderRelease: (_, g) => {
          if (g.dx < -90) pass();
          else if (g.dx > 90 && hero) {
            pan.setValue({ x: 0, y: 0 });
            onReview(hero);
          } else
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }).start();
        },
      }),
    [hero?.id],
  );
  const total = transactions
      .filter((t) => t.kind === "contribution" && t.status === "simulated")
      .reduce((n, t) => n + t.amountCents, 0),
    supported = new Set(
      transactions
        .filter((t) => t.kind === "contribution" && t.status === "simulated")
        .map((t) => t.requestId),
    ).size;
  const title = savedOnly
    ? "Good things, kept close."
    : "Make a meaningful difference.";
  return (
    <>
      <View style={{ marginBottom: 26 }}>
        <T
          accessibilityRole="header"
          style={{
            fontFamily: F.serif,
            fontSize: desktop ? 43 : 33,
            lineHeight: desktop ? 52 : 40,
            letterSpacing: desktop ? -1.2 : -0.5,
          }}
        >
          {title}
        </T>
        <T
          style={{
            color: C.muted,
            fontSize: desktop ? 16 : 14,
            lineHeight: 26,
            marginTop: 5,
          }}
        >
          {savedOnly
            ? "A little space for the possibilities you care about."
            : "Find a need. See the person. Choose your impact."}
        </T>
      </View>
      {!savedOnly && (
        <View
          style={[
            s.row,
            {
              borderBottomWidth: 1,
              borderColor: C.line,
              alignSelf: "stretch",
              paddingBottom: 9,
              marginBottom: 18,
            },
          ]}
        >
          <Button
            label="Pay bills"
            icon="heart"
            variant={kind === "bill" ? "accent" : "ghost"}
            onPress={() => {
              setKind("bill");
              setCategory("All needs");
              setPassed([]);
            }}
            style={{ width: desktop ? 137 : 130, borderRadius: 25 }}
          />
          <Button
            label="Invest in projects"
            icon="stats-chart"
            variant={kind === "project" ? "accent" : "ghost"}
            onPress={() => {
              setKind("project");
              setCategory("All needs");
              setPassed([]);
            }}
            style={{ width: desktop ? 181 : 170, borderRadius: 25 }}
          />
        </View>
      )}
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <View style={[s.row, s.input, { gap: 8, flex: 1, minWidth: 200 }]}>
          <Icon name="search-outline" size={19} color={C.muted} />
          <TextInput
            accessibilityLabel="Search requests"
            placeholder="Search requests by keyword or location…"
            placeholderTextColor={C.muted}
            value={query}
            onChangeText={setQuery}
            style={
              {
                fontFamily: F.sans,
                fontSize: 12,
                color: C.ink,
                flex: 1,
                padding: 0,
                outlineStyle: "none",
              } as any
            }
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filter by category"
          onPress={() => setFilter("category")}
          style={[s.row, s.input, { gap: 10, width: desktop ? 177 : 150 }]}
        >
          <T style={{ fontSize: 12, flex: 1 }}>
            {category === "All needs" ? "All categories" : category}
          </T>
          <Icon name="chevron-down" size={13} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filter by location"
          onPress={() => setFilter("location")}
          style={[s.row, s.input, { gap: 7, width: desktop ? 160 : 150 }]}
        >
          <Icon name="location-outline" size={17} />
          <T style={{ fontSize: 11, flex: 1 }}>
            {location === "Any location" ? location : countryName(location)}
          </T>
          <Icon name="chevron-down" size={12} />
        </Pressable>
      </View>
      {error && <Notice type="error" text={error} />}
      {loading ? (
        <Loading />
      ) : !hero ? (
        <Empty
          title={
            savedOnly
              ? "A place for your possibilities."
              : "You’ve explored every possibility."
          }
          body={
            savedOnly
              ? "Save a request while you explore, and find it here when you’re ready."
              : "Try a different filter, or return to the requests you passed."
          }
          action={
            !savedOnly ? (
              <Button
                label="Reset filters"
                variant="outline"
                onPress={() => {
                  setPassed([]);
                  setQuery("");
                  setCategory("All needs");
                  setLocation("Any location");
                }}
              />
            ) : undefined
          }
        />
      ) : (
        <>
          <View
            style={{ flexDirection: "row", gap: 16, alignItems: "stretch" }}
          >
            <Animated.View
              {...gesture.panHandlers}
              style={[
                s.card,
                {
                  flex: 1,
                  flexDirection: desktop ? "row" : "column",
                  transform: [{ translateX: pan.x }],
                  minHeight: desktop ? 393 : undefined,
                },
              ]}
            >
              <View
                style={{
                  width: desktop ? "47%" : "100%",
                  minHeight: desktop ? 393 : 260,
                }}
              >
                <Image
                  source={requestImage(hero)}
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                  }}
                  resizeMode="cover"
                />
                <View
                  style={{
                    position: "absolute",
                    top: 15,
                    left: 15,
                    backgroundColor: C.white,
                    paddingVertical: 5,
                    paddingHorizontal: 9,
                    borderRadius: 4,
                  }}
                >
                  <T style={{ fontSize: 10, color: C.forest }}>
                    Sample request
                  </T>
                </View>
              </View>
              <View
                style={{
                  flex: 1,
                  padding: desktop ? 24 : 22,
                  justifyContent: "space-between",
                  gap: 17,
                }}
              >
                <View>
                  <View style={[s.row, { gap: 4, marginBottom: 12 }]}>
                    <Icon name="location" size={12} color={C.muted} />
                    <T style={{ color: C.muted, fontSize: 10, flex: 1 }}>
                      {hero.category} · {hero.city}, {countryName(hero.country)}
                    </T>
                  </View>
                  <T
                    style={{
                      fontFamily: F.serif,
                      fontSize: desktop ? 26 : 26,
                      lineHeight: 32,
                      marginBottom: 14,
                    }}
                  >
                    {hero.title}
                  </T>
                  <T style={{ fontSize: 13, lineHeight: 21, color: C.muted }}>
                    {hero.story}
                  </T>
                </View>
                <View>
                  <View
                    style={{
                      height: 8,
                      borderRadius: 8,
                      backgroundColor: "#ECEDE8",
                      overflow: "hidden",
                      marginBottom: 10,
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        backgroundColor: C.accent,
                        width: `${Math.min(100, (hero.fundedCents / hero.amountCents) * 100)}%`,
                        borderRadius: 8,
                      }}
                    />
                  </View>
                  <View
                    style={[
                      s.row,
                      { justifyContent: "space-between", marginBottom: 22 },
                    ]}
                  >
                    <T style={{ fontSize: 11 }}>
                      <T style={{ fontFamily: F.bold, fontSize: 12 }}>
                        {money(
                          Math.max(
                            0,
                            hero.amountCents -
                              hero.fundedCents -
                              hero.reservedCents,
                          ),
                        )}
                      </T>{" "}
                      {hero.kind === "project"
                        ? "target remaining"
                        : "remaining"}
                    </T>
                    <T style={{ fontSize: 10, color: C.muted }}>
                      {money(hero.amountCents)} total
                    </T>
                  </View>
                  <View
                    style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}
                  >
                    <Button
                      label="Pass"
                      icon="close"
                      variant="outline"
                      onPress={pass}
                      style={{ paddingHorizontal: 10, minHeight: 42 }}
                    />
                    <Button
                      label={hero.saved ? "Saved" : "Save"}
                      icon={hero.saved ? "bookmark" : "bookmark-outline"}
                      variant="outline"
                      onPress={() => save(hero)}
                      busy={saving}
                      style={{ paddingHorizontal: 10, minHeight: 42 }}
                    />
                    <Button
                      label={
                        hero.kind === "project"
                          ? "Review project"
                          : "Review support"
                      }
                      icon="arrow-forward"
                      onPress={() => onReview(hero)}
                      style={{
                        flex: 1,
                        minWidth: 126,
                        paddingHorizontal: 10,
                        minHeight: 42,
                      }}
                    />
                  </View>
                </View>
              </View>
            </Animated.View>
            {showImpact && (
              <View
                style={[
                  s.card,
                  { width: 173, padding: 17, justifyContent: "space-between" },
                ]}
              >
                <View>
                  <View style={[s.row, { gap: 7, marginBottom: 20 }]}>
                    <Icon name="stats-chart" size={17} />
                    <T style={{ fontFamily: F.serif, fontSize: 21 }}>
                      Your impact
                    </T>
                  </View>
                  <View
                    style={{
                      backgroundColor: C.canvas,
                      padding: 14,
                      borderRadius: 5,
                    }}
                  >
                    <T
                      style={{
                        fontFamily: F.serif,
                        fontSize: 40,
                        lineHeight: 47,
                      }}
                    >
                      {money(total)}
                    </T>
                    <T style={{ fontSize: 10, color: C.muted, lineHeight: 16 }}>
                      Simulated support
                    </T>
                    <View
                      style={{
                        height: 1,
                        backgroundColor: C.line,
                        marginVertical: 21,
                      }}
                    />
                    <T style={{ fontFamily: F.serif, fontSize: 38 }}>
                      {supported}
                    </T>
                    <T style={{ fontSize: 10, color: C.muted, lineHeight: 17 }}>
                      Requests supported
                    </T>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={onActivity}
                  style={[
                    s.row,
                    {
                      gap: 7,
                      backgroundColor: C.canvas,
                      padding: 10,
                      borderRadius: 5,
                      marginTop: 16,
                    },
                  ]}
                >
                  <Icon
                    name="information-circle-outline"
                    size={17}
                    color={C.muted}
                  />
                  <T
                    style={{
                      fontSize: 9,
                      lineHeight: 15,
                      color: C.muted,
                      flex: 1,
                    }}
                  >
                    Demo support only.{"\n"}No real funds move.
                  </T>
                </Pressable>
              </View>
            )}
          </View>
          <View
            style={[s.row, { justifyContent: "space-between", marginTop: 10 }]}
          >
            <T style={{ fontSize: 10, color: C.muted }}>
              {filtered.length} {filtered.length === 1 ? "request" : "requests"}{" "}
              to explore
            </T>
            <T style={{ fontSize: 10, color: C.muted }}>
              Swipe left to pass · right to review
            </T>
          </View>
          {filtered.length > 1 && (
            <>
              <T
                style={{
                  fontFamily: F.serif,
                  fontSize: 23,
                  marginTop: 27,
                  marginBottom: 14,
                }}
              >
                More ways to make a difference
              </T>
              <View
                style={{ flexDirection: desktop ? "row" : "column", gap: 15 }}
              >
                {filtered.slice(1, 4).map((r) => (
                  <Pressable
                    key={r.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Review ${r.title}`}
                    onPress={() => onReview(r)}
                    style={[
                      s.card,
                      { flex: 1, flexDirection: desktop ? "column" : "row" },
                    ]}
                  >
                    <Image
                      source={requestImage(r)}
                      style={{
                        height: desktop ? 146 : 112,
                        width: desktop ? "100%" : 105,
                      }}
                      resizeMode="cover"
                    />
                    <View style={{ padding: 14, flex: 1 }}>
                      <T
                        style={{
                          fontFamily: F.serif,
                          fontSize: 17,
                          marginBottom: 6,
                        }}
                        numberOfLines={1}
                      >
                        {r.title}
                      </T>
                      <View style={[s.row, { gap: 10 }]}>
                        <T
                          numberOfLines={2}
                          style={{
                            fontSize: 11,
                            lineHeight: 18,
                            color: C.muted,
                            flex: 1,
                          }}
                        >
                          {r.category} · {r.city}
                          {"\n"}
                          {money(
                            Math.max(0, r.amountCents - r.fundedCents),
                          )}{" "}
                          still needed
                        </T>
                        <View
                          style={{
                            height: 30,
                            width: 30,
                            borderRadius: 30,
                            backgroundColor: C.soft,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon name="chevron-forward" size={15} />
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </>
      )}
      <Sheet
        visible={!!filter}
        onClose={() => setFilter(null)}
        title={filter === "category" ? "Find your cause" : "Find a community"}
      >
        {(filter === "category"
          ? [
              "All needs",
              ...new Set(
                requests
                  .filter((r) => savedOnly || r.kind === kind)
                  .map((r) => r.category),
              ),
            ]
          : ["Any location", ...new Set(requests.map((r) => r.country))]
        ).map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityLabel={filter === "location" && item !== "Any location" ? countryName(item) : item}
            accessibilityState={{selected: (filter === "category" ? category : location) === item}}
            onPress={() => {
              filter === "category" ? setCategory(item) : setLocation(item);
              setPassed([]);
              setFilter(null);
            }}
            style={{
              paddingVertical: 17,
              borderBottomWidth: 1,
              borderColor: C.line,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <T>
              {filter === "location" && item !== "Any location"
                ? countryName(item)
                : item}
            </T>
            {(filter === "category" ? category : location) === item && (
              <Icon name="checkmark" color={C.accent} />
            )}
          </Pressable>
        ))}
      </Sheet>
    </>
  );
}
