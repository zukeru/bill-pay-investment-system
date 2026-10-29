import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextProps,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { C, F } from "./theme";
export function T({ style, ...props }: TextProps) {
  return <Text {...props} style={[s.text, style]} />;
}
export function Icon({
  name,
  size = 20,
  color = C.ink,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name as any} size={size} color={color} />;
}
export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  busy = false,
  disabled = false,
  style,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "accent" | "outline" | "ghost";
  icon?: string;
  busy?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}) {
  const bg =
      variant === "primary"
        ? C.deep
        : variant === "accent"
          ? C.accent
          : "transparent",
    color = variant === "primary" || variant === "accent" ? C.white : C.ink;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={busy || disabled}
      onPress={onPress}
      style={({ pressed, hovered }: any) => [
        s.button,
        {
          backgroundColor: bg,
          borderColor: variant === "outline" ? C.line : "transparent",
          opacity: disabled ? 0.45 : pressed ? 0.7 : hovered ? 0.86 : 1,
        },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          {icon && <Icon name={icon} color={color} size={18} />}
          <T style={{ color, fontFamily: F.medium, fontSize: 13 }}>{label}</T>
        </>
      )}
    </Pressable>
  );
}
export function IconButton({
  name,
  onPress,
  label,
  color = C.ink,
}: {
  name: string;
  onPress: () => void;
  label: string;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        padding: 10,
        borderRadius: 24,
        backgroundColor: pressed ? C.soft : "transparent",
      })}
    >
      <Icon name={name} color={color} />
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  multiline = false,
  keyboardType = "default",
  editable = true,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: any;
  editable?: boolean;
  hint?: string;
}) {
  return (
    <View style={{ gap: 7, marginBottom: 17 }}>
      <T style={s.label}>{label}</T>
      <TextInput
        accessibilityLabel={label}
        value={value}
        editable={editable}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A2A69F"
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={
          secureTextEntry || keyboardType === "email-address"
            ? "none"
            : "sentences"
        }
        style={[
          s.input,
          multiline && { minHeight: 112, textAlignVertical: "top" },
        ]}
      />
      {hint && <T style={s.hint}>{hint}</T>}
    </View>
  );
}
export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onChange}
      style={{
        flexDirection: "row",
        gap: 10,
        alignItems: "flex-start",
        marginVertical: 12,
      }}
    >
      <View
        style={{
          height: 20,
          width: 20,
          borderWidth: 1,
          borderColor: checked ? C.forest : C.line,
          borderRadius: 4,
          backgroundColor: checked ? C.forest : C.white,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && <Icon name="checkmark" size={14} color={C.white} />}
      </View>
      <T style={{ flex: 1, fontSize: 12, lineHeight: 19, color: C.muted }}>
        {children}
      </T>
    </Pressable>
  );
}
export function Notice({
  text,
  type = "info",
}: {
  text: string;
  type?: "info" | "error" | "success";
}) {
  return (
    <View
      accessibilityRole="alert"
      style={{
        padding: 14,
        borderRadius: 7,
        backgroundColor:
          type === "error"
            ? "#F8ECE8"
            : type === "success"
              ? "#E9F1E8"
              : C.soft,
        flexDirection: "row",
        gap: 9,
        marginVertical: 10,
      }}
    >
      <Icon
        name={
          type === "error"
            ? "alert-circle-outline"
            : type === "success"
              ? "checkmark-circle-outline"
              : "information-circle-outline"
        }
        size={18}
        color={type === "error" ? C.red : C.forest}
      />
      <T
        style={{
          flex: 1,
          fontSize: 12,
          lineHeight: 19,
          color: type === "error" ? C.red : C.ink,
        }}
      >
        {text}
      </T>
    </View>
  );
}
export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        paddingVertical: 56,
        paddingHorizontal: 24,
        gap: 14,
      }}
    >
      <Icon name="leaf-outline" size={35} color={C.accent} />
      <T style={{ fontFamily: F.serif, fontSize: 29, textAlign: "center" }}>
        {title}
      </T>
      <T
        style={{
          color: C.muted,
          textAlign: "center",
          maxWidth: 350,
          lineHeight: 23,
        }}
      >
        {body}
      </T>
      {action}
    </View>
  );
}
export function Loading() {
  return (
    <View style={{ padding: 70, alignItems: "center" }}>
      <ActivityIndicator color={C.forest} />
      <T style={{ marginTop: 12, color: C.muted, fontSize: 12 }}>
        A little possibility, loading…
      </T>
    </View>
  );
}
export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(13,30,25,.48)",
          alignItems: "center",
          justifyContent: width < 700 ? "flex-end" : "center",
          padding: width < 700 ? 0 : 28,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 670,
            maxHeight: width < 700 ? "94%" : "90%",
            backgroundColor: C.canvas,
            borderRadius: width < 700 ? 18 : 12,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 26,
              paddingVertical: 17,
              borderBottomWidth: 1,
              borderColor: C.line,
            }}
          >
            <T style={{ fontFamily: F.serif, fontSize: 27 }}>{title}</T>
            <IconButton name="close-outline" label="Close" onPress={onClose} />
          </View>
          <ScrollView
            contentContainerStyle={{ padding: 26 }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ marginBottom: 27, gap: 7 }}>
      <T
        accessibilityRole="header"
        style={{ fontFamily: F.serif, fontSize: 35, lineHeight: 43 }}
      >
        {title}
      </T>
      {subtitle && (
        <T
          style={{
            fontSize: 14,
            color: C.muted,
            lineHeight: 23,
            maxWidth: 650,
          }}
        >
          {subtitle}
        </T>
      )}
    </View>
  );
}
export const s = StyleSheet.create({
  text: { fontFamily: F.sans, fontSize: 14, color: C.ink },
  button: {
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  label: { fontSize: 12, fontFamily: F.medium },
  input: {
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    borderRadius: 7,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: F.sans,
    color: C.ink,
    minHeight: 46,
  },
  hint: { fontSize: 11, lineHeight: 17, color: C.muted },
  row: { flexDirection: "row", alignItems: "center" },
  serif: { fontFamily: F.serif },
  card: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
    overflow: "hidden",
  },
  divider: { height: 1, backgroundColor: C.line, marginVertical: 22 },
});
