import React, { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { api, post } from "./api";
import { DocumentRecord, Request, User, money } from "./types";
import { C, F } from "./theme";
import {
  Button,
  Checkbox,
  Field,
  Icon,
  Notice,
  SectionHeading,
  Sheet,
  T,
  s,
} from "./ui";
export default function RequestForm({
  user,
  onDone,
}: {
  user: User;
  onDone: () => void;
}) {
  const [kind, setKind] = useState<"bill" | "project">("bill"),
    [form, setForm] = useState({
      title: "",
      story: "",
      category: "Utilities",
      amount: "",
      country: user.country || "US",
      city: "",
      dueDate: "",
      billerName: "",
      relationship: "",
      projectSummary: "",
      terms: "",
      riskDisclosure: "",
    }),
    [documents, setDocuments] = useState<DocumentRecord[]>([]),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState(""),
    [preview, setPreview] = useState(false),
    [success, setSuccess] = useState(false);
  const change = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  const upload = async () => {
    setError("");
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if ((asset.size || 0) > 10 * 1024 * 1024)
        throw new Error("Please choose a PDF, JPEG or PNG smaller than 10 MB.");
      setUploading(true);
      const body = new FormData();
      if (Platform.OS === "web") body.append("file", asset.file as File);
      else
        body.append("file", {
          uri: asset.uri,
          type: asset.mimeType,
          name: asset.name,
        } as any);
      const r = await api<{ document: DocumentRecord }>("/documents", {
        method: "POST",
        body,
      });
      setDocuments((d) => [...d, r.document]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };
  const submit = async () => {
    setError("");
    if (!form.title || !form.story || !form.amount || !form.city) {
      setError("Add a title, story, amount and city to share your request.");
      return;
    }
    if (!consent) {
      setError(
        "Please confirm your relationship and consent before submitting.",
      );
      return;
    }
    setBusy(true);
    try {
      await post<{ request: Request }>("/requests", {
        ...form,
        kind,
        amountCents: Math.round(Number(form.amount) * 100),
        currency: "USD",
        consent,
        documentIds: documents.map((d) => d.id),
      });
      setSuccess(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (success)
    return (
      <View style={{ maxWidth: 650 }}>
        <SectionHeading
          title="Your story is in good hands."
          subtitle="Your request has been submitted for platform review. It will appear in discovery after approval."
        />
        <Notice
          type="success"
          text="Request received. Evidence remains private to you and authorized reviewers."
        />
        <Button
          label="View my requests"
          onPress={onDone}
          style={{ alignSelf: "flex-start", marginTop: 16 }}
        />
      </View>
    );
  return (
    <View style={{ maxWidth: 850 }}>
      <SectionHeading
        title="Every new beginning starts here."
        subtitle="Tell your story. Share what you need. Give someone a chance to make a difference."
      />
      <View style={[s.row, { gap: 8, marginBottom: 30 }]}>
        <Button
          label="A bill to pay"
          icon="receipt-outline"
          variant={kind === "bill" ? "accent" : "outline"}
          onPress={() => {
            setKind("bill");
            change("category")("Utilities");
          }}
        />
        <Button
          label="A project to grow"
          icon="leaf-outline"
          variant={kind === "project" ? "accent" : "outline"}
          onPress={() => {
            setKind("project");
            change("category")("Clean Energy");
          }}
        />
      </View>
      <View style={[s.card, { padding: 25 }]}>
        <T style={{ fontFamily: F.serif, fontSize: 27, marginBottom: 22 }}>
          Tell us a little about it
        </T>
        <Field
          label="Request title"
          value={form.title}
          onChangeText={change("title")}
          placeholder="A short, meaningful title"
        />
        <Field
          label="Your story"
          value={form.story}
          onChangeText={change("story")}
          placeholder="What happened, what do you need, and how would support help?"
          multiline
          hint="This will be public. Leave out private contact, account, medical and identity details."
        />
        <View style={{ flexDirection: "row", gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Amount needed (USD)"
              value={form.amount}
              onChangeText={change("amount")}
              placeholder="250"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Category"
              value={form.category}
              onChangeText={change("category")}
              placeholder="Utilities"
            />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="City"
              value={form.city}
              onChangeText={change("city")}
              placeholder="Denver"
            />
          </View>
          <View style={{ width: 100 }}>
            <Field
              label="Country"
              value={form.country}
              onChangeText={change("country")}
              placeholder="US"
            />
          </View>
        </View>
        {kind === "bill" ? (
          <>
            <Field
              label="Biller / service provider"
              value={form.billerName}
              onChangeText={change("billerName")}
              placeholder="Name of the company on your bill"
            />
            <Field
              label="Your relationship to the bill"
              value={form.relationship}
              onChangeText={change("relationship")}
              placeholder="I am the account holder"
              hint="For review only; this relationship is not displayed in public discovery."
            />
            <Field
              label="Due date (YYYY-MM-DD)"
              value={form.dueDate}
              onChangeText={change("dueDate")}
              placeholder="2026-12-01"
            />
          </>
        ) : (
          <>
            <Field
              label="Project summary & ownership"
              value={form.projectSummary}
              onChangeText={change("projectSummary")}
              multiline
              placeholder="What will you build, who owns it, and what would funding make possible?"
            />
            <Field
              label="Proposed terms (illustrative only)"
              value={form.terms}
              onChangeText={change("terms")}
              multiline
              placeholder="Describe your funding target and intended use. No live securities offer is available."
            />
            <Field
              label="Risk disclosure"
              value={form.riskDisclosure}
              onChangeText={change("riskDisclosure")}
              multiline
              placeholder="Describe project risks, possible loss of all capital, illiquidity and no guaranteed returns."
            />
          </>
        )}
        <View style={s.divider} />
        <T style={{ fontFamily: F.serif, fontSize: 25, marginBottom: 7 }}>
          A little evidence, kept private.
        </T>
        <T
          style={{
            fontSize: 12,
            color: C.muted,
            lineHeight: 21,
            marginBottom: 18,
          }}
        >
          Upload a redacted bill, invoice or project document for review. PDF,
          JPEG or PNG, up to 10 MB. Remove account numbers and sensitive
          personal details. Evidence is never shown publicly.
        </T>
        {documents.map((doc) => (
          <View
            key={doc.id}
            style={[
              s.row,
              {
                paddingVertical: 11,
                borderBottomWidth: 1,
                borderColor: C.line,
                gap: 8,
              },
            ]}
          >
            <Icon name="document-text-outline" size={18} />
            <T style={{ flex: 1, fontSize: 12 }}>{doc.name}</T>
            <T style={{ fontSize: 10, color: C.muted }}>
              {Math.ceil(doc.size / 1024)} KB
            </T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${doc.name} from request`}
              onPress={() =>
                setDocuments((d) => d.filter((x) => x.id !== doc.id))
              }
            >
              <Icon name="close-circle-outline" size={19} color={C.muted} />
            </Pressable>
          </View>
        ))}
        <Button
          label={uploading ? "Uploading evidence…" : "Choose a document"}
          icon="cloud-upload-outline"
          variant="outline"
          onPress={upload}
          busy={uploading}
          style={{ alignSelf: "flex-start", marginTop: 12 }}
        />
        <Checkbox checked={consent} onChange={() => setConsent(!consent)}>
          I am authorized to share this request and its evidence. My public
          story is accurate and excludes sensitive private information. I agree
          to the draft Terms and Privacy Notice, platform review, and local demo
          conditions.
        </Checkbox>
        {error && <Notice type="error" text={error} />}
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            marginTop: 13,
            flexWrap: "wrap",
          }}
        >
          <Button
            label="Preview public request"
            variant="outline"
            onPress={() => setPreview(true)}
            icon="eye-outline"
          />
          <Button
            label="Submit for review"
            icon="arrow-forward-outline"
            busy={busy}
            onPress={submit}
          />
        </View>
      </View>
      <Sheet
        visible={preview}
        onClose={() => setPreview(false)}
        title="Your public story"
      >
        <T style={{ fontSize: 11, color: C.muted }}>
          {form.category} · {form.city}, {form.country}
        </T>
        <T style={{ fontFamily: F.serif, fontSize: 35, marginVertical: 14 }}>
          {form.title || "Your request title"}
        </T>
        <T style={{ lineHeight: 24, color: C.muted }}>
          {form.story || "Your story will appear here."}
        </T>
        <T style={{ fontFamily: F.serif, fontSize: 30, marginVertical: 18 }}>
          {money(Math.round(Number(form.amount || 0) * 100))} needed
        </T>
        {kind === "project" && (
          <Notice text="Project interest is nonbinding. No investment is accepted or return guaranteed." />
        )}
        <Notice text="Your legal profile, contact details and evidence documents are private. This preview contains only the details shown to backers." />
      </Sheet>
    </View>
  );
}
