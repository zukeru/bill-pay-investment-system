import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  View,
  useWindowDimensions,
} from "react-native";
import { useFonts } from "expo-font";
import { DMSans_400Regular } from "@expo-google-fonts/dm-sans/400Regular";
import { DMSans_500Medium } from "@expo-google-fonts/dm-sans/500Medium";
import { DMSans_600SemiBold } from "@expo-google-fonts/dm-sans/600SemiBold";
import { api, clearSession, post, restoreToken } from "./src/api";
import { Page, Request, User } from "./src/types";
import { C, F } from "./src/theme";
import { Button, Icon, Loading, Notice, T, s } from "./src/ui";
import { Landmark } from "./src/Semantic";
import Auth from "./src/Auth";
import Discover from "./src/Discover";
import Support from "./src/Support";
import Dashboard from "./src/Dashboard";
import RequestForm from "./src/RequestForm";
import Activity from "./src/Activity";
import Profile from "./src/Profile";
import Help from "./src/Help";
import Admin from "./src/Admin";
import AccountRecovery from "./src/AccountRecovery";
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
      DMSans_400Regular,
      DMSans_500Medium,
      DMSans_600SemiBold,
    }),
    [user, setUser] = useState<User | null>(null),
    [boot, setBoot] = useState(true),
    [page, setPage] = useState<Page>("discover"),
    [refresh, setRefresh] = useState(0),
    [selected, setSelected] = useState<Request | null>(null),
    [paymentsConfigured, setPaymentsConfigured] = useState(false),
    [globalError, setGlobalError] = useState(""),
    [recovery, setRecovery] = useState<{
      mode: "reset" | "verify";
      token: string;
    } | null>(null);
  const { width } = useWindowDimensions(),
    wide = width >= 900;
  useEffect(() => {
    if (Platform.OS === "web") {
      document.title = "Billionaire Pay — Small acts. Meaningful change.";
      let desc = document.querySelector('meta[name="description"]');
      if (!desc) {
        desc = document.createElement("meta");
        desc.setAttribute("name", "description");
        document.head.appendChild(desc);
      }
      desc.setAttribute(
        "content",
        "Explore meaningful requests, share your story and support possibility. Billionaire Pay responsive website and mobile app.",
      );
      const params = new URLSearchParams(window.location.search);
      if (params.get("resetPassword"))
        setRecovery({ mode: "reset", token: params.get("resetPassword")! });
      if (params.get("verifyEmail"))
        setRecovery({ mode: "verify", token: params.get("verifyEmail")! });
    }
    restoreToken()
      .then(() => api<{ user: User }>("/auth/me"))
      .then((r) => {
        setUser(r.user);
        setPage(
          r.user.role === "applicant"
            ? "dashboard"
            : r.user.role === "admin"
              ? "admin"
              : "discover",
        );
      })
      .catch(() => {})
      .finally(() => setBoot(false));
    api<{ paymentsConfigured: boolean }>("/health")
      .then((r) => setPaymentsConfigured(r.paymentsConfigured))
      .catch(() => {});
  }, []);
  const onLogin = (u: User) => {
    setUser(u);
    setPage(
      u.role === "applicant"
        ? "dashboard"
        : u.role === "admin"
          ? "admin"
          : "discover",
    );
  };
  const logout = async () => {
    try {
      await post("/auth/logout", {});
      await clearSession();
      setUser(null);
      setSelected(null);
      setGlobalError("");
    } catch (e) {
      setGlobalError((e as Error).message);
    }
  };
  const closeRecovery = (completed = false) => {
    if (completed && recovery?.mode === "reset") {
      clearSession().catch(() => {});
      setUser(null);
    } else if (completed && recovery?.mode === "verify") {
      api<{ user: User }>("/auth/me")
        .then((result) => setUser(result.user))
        .catch(() => {});
    }
    setRecovery(null);
    if (Platform.OS === "web")
      window.history.replaceState({}, "", window.location.pathname);
  };
  if ((!fontsLoaded && !fontError) || boot)
    return (
      <View
        style={{ flex: 1, justifyContent: "center", backgroundColor: C.canvas }}
      >
        <Loading />
      </View>
    );
  if (recovery)
    return (
      <AccountRecovery
        mode={recovery.mode}
        token={recovery.token}
        onDone={closeRecovery}
      />
    );
  if (!user)
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <Auth onLogin={onLogin} />
      </>
    );
  const nav: { id: Page; label: string; icon: string }[] =
    user.role === "backer"
      ? [
          { id: "discover", label: "Discover", icon: "search-outline" },
          { id: "saved", label: "Saved", icon: "bookmark-outline" },
          { id: "activity", label: "Activity", icon: "time-outline" },
          { id: "profile", label: "Profile", icon: "person-outline" },
        ]
      : user.role === "applicant"
        ? [
            { id: "dashboard", label: "Home", icon: "home-outline" },
            { id: "submit", label: "Requests", icon: "document-text-outline" },
            { id: "profile", label: "Profile", icon: "person-outline" },
          ]
        : [
            {
              id: "admin",
              label: "Review queue",
              icon: "shield-checkmark-outline",
            },
            { id: "activity", label: "Activity", icon: "time-outline" },
            { id: "profile", label: "Profile", icon: "person-outline" },
          ];
  const initials = user.name
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");
  const content =
    page === "discover" ? (
      <Discover
        refresh={refresh}
        onReview={setSelected}
        onActivity={() => setPage("activity")}
      />
    ) : page === "saved" ? (
      <Discover
        savedOnly
        refresh={refresh}
        onReview={setSelected}
        onActivity={() => setPage("activity")}
      />
    ) : page === "dashboard" ? (
      <Dashboard
        user={user}
        refresh={refresh}
        onCreate={() => setPage("submit")}
      />
    ) : page === "submit" ? (
      <RequestForm
        user={user}
        onDone={() => {
          setRefresh((r) => r + 1);
          setPage("dashboard");
        }}
      />
    ) : page === "activity" ? (
      <Activity refresh={refresh} />
    ) : page === "profile" ? (
      <Profile user={user} onUpdate={setUser} onLogout={logout} />
    ) : page === "admin" ? (
      <Admin />
    ) : (
      <Help />
    );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.canvas }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, flexDirection: "row" }}>
        {wide && (
          <Landmark
            as="aside"
            label="Sidebar"
            style={{
              width: 218,
              backgroundColor: C.white,
              borderRight: "1px solid " + C.line,
              flexDirection: "column",
              padding: 23,
            }}
          >
            <Brand />
            <Landmark
              as="nav"
              label="Main navigation"
              style={{ flexDirection: "column", gap: 7, marginTop: 45 }}
            >
              {nav.map((item) => (
                <NavItem
                  key={item.id}
                  {...item}
                  active={page === item.id}
                  onPress={() => setPage(item.id)}
                />
              ))}
            </Landmark>
            <View style={{ flex: 1 }} />
            <NavItem
              id="help"
              label="Help & legal"
              icon="help-circle-outline"
              active={page === "help"}
              onPress={() => setPage("help")}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open my profile"
              onPress={() => setPage("profile")}
              style={[
                s.row,
                {
                  gap: 10,
                  paddingTop: 25,
                  marginTop: 16,
                  borderTopWidth: 1,
                  borderColor: C.line,
                },
              ]}
            >
              <Avatar initials={initials} />
              <View style={{ flex: 1 }}>
                <T
                  style={{ fontSize: 10, fontFamily: F.medium }}
                  numberOfLines={1}
                >
                  {user.name}
                </T>
                <T style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
                  {user.role === "backer"
                    ? "Backer"
                    : user.role === "applicant"
                      ? "Applicant"
                      : "Administrator"}
                </T>
              </View>
              <Icon name="chevron-forward" size={14} color={C.muted} />
            </Pressable>
          </Landmark>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Landmark
            as="header"
            style={{
              height: wide ? 73 : 72,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingLeft: wide ? 32 : 22,
              paddingRight: wide ? 36 : 15,
              backgroundColor: wide ? C.canvas : C.white,
            }}
          >
            {wide ? (
              <View style={[s.row, { gap: 7 }]}>
                <View
                  style={{
                    height: 7,
                    width: 7,
                    borderRadius: 7,
                    backgroundColor: "#51C478",
                  }}
                />
                <T style={{ fontSize: 11, color: C.muted }}>Local demo</T>
                <Icon name="chevron-down" size={12} color={C.muted} />
              </View>
            ) : (
              <Brand compact />
            )}
            <View style={[s.row, { gap: 12 }]}>
              {!wide && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Help and legal information"
                  onPress={() => setPage("help")}
                  style={{ padding: 9 }}
                >
                  <Icon name="help-circle-outline" size={23} />
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="My profile"
                onPress={() => setPage("profile")}
              >
                <Avatar initials={initials} />
              </Pressable>
              {wide && (
                <T style={{ fontSize: 12, color: C.muted }}>{user.name}</T>
              )}
            </View>
          </Landmark>
          <Landmark as="main" style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
            <ScrollView
              key={page}
              contentContainerStyle={{
                paddingHorizontal: wide ? 32 : 22,
                paddingTop: wide ? 21 : 24,
                paddingBottom: wide ? 40 : 28,
                maxWidth: 1450,
                width: "100%",
                alignSelf: "center",
              }}
              keyboardShouldPersistTaps="handled"
            >
              {globalError && <Notice text={globalError} type="error" />}
              {content}
              <View
                style={{
                  marginTop: 33,
                  paddingTop: 18,
                  borderTopWidth: 1,
                  borderColor: C.line,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <T style={{ fontSize: 10, color: C.muted }}>
                  Billionaire Pay · Small acts. Meaningful change.
                </T>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => setPage("help")}
                >
                  <T style={{ fontSize: 10, color: C.muted }}>
                    Local demo · Terms & privacy
                  </T>
                </Pressable>
              </View>
            </ScrollView>
          </Landmark>
          {!wide && (
            <Landmark
              as="nav"
              label="Mobile navigation"
              style={{
                flexDirection: "row",
                backgroundColor: C.white,
                borderTop: "1px solid " + C.line,
                paddingBottom: 7,
                paddingTop: 9,
                justifyContent: "space-around",
              }}
            >
              {nav.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: page === item.id }}
                  onPress={() => setPage(item.id)}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 5,
                    gap: 5,
                  }}
                >
                  <Icon
                    name={
                      page === item.id
                        ? item.icon.replace("-outline", "")
                        : item.icon
                    }
                    size={23}
                    color={page === item.id ? C.forest : C.muted}
                  />
                  <T
                    style={{
                      fontSize: 10,
                      color: page === item.id ? C.forest : C.muted,
                    }}
                  >
                    {item.label}
                  </T>
                </Pressable>
              ))}
            </Landmark>
          )}
        </View>
      </View>
      <Support
        request={selected}
        onClose={() => setSelected(null)}
        onComplete={() => setRefresh((r) => r + 1)}
        paymentsConfigured={paymentsConfigured}
      />
    </SafeAreaView>
  );
}
function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[s.row, { gap: 9 }]}>
      <T
        style={{
          fontFamily: F.bold,
          fontSize: compact ? 37 : 37,
          color: C.forest,
          letterSpacing: -4,
          lineHeight: 43,
        }}
      >
        B
      </T>
      <T
        style={{
          fontFamily: F.bold,
          fontSize: compact ? 17 : 17,
          letterSpacing: -0.65,
        }}
      >
        Billionaire Pay
      </T>
    </View>
  );
}
function Avatar({ initials }: { initials: string }) {
  return (
    <View
      style={{
        height: 34,
        width: 34,
        borderRadius: 34,
        backgroundColor: "#E2E7F2",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <T style={{ fontFamily: F.medium, fontSize: 11, color: "#53617E" }}>
        {initials}
      </T>
    </View>
  );
}
function NavItem({
  label,
  icon,
  active,
  onPress,
}: {
  id: Page;
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ hovered }: any) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 15,
        paddingVertical: 13,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: active ? C.soft : hovered ? "#F7F8FC" : "transparent",
      })}
    >
      <Icon name={icon} size={21} color={active ? C.forest : "#68748A"} />
      <T
        style={{
          fontFamily: active ? F.medium : F.sans,
          fontSize: 13,
          color: active ? C.forest : "#667085",
        }}
      >
        {label}
      </T>
    </Pressable>
  );
}
