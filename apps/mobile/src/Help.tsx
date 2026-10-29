import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { api } from "./api";
import { C, F } from "./theme";
import { Icon, Notice, SectionHeading, Sheet, T, s } from "./ui";
const sections = [
  {
    title: "How does support work?",
    body: "Explore a request, read its story, choose an amount and explicitly confirm support. In this local demonstration, contributions are recorded in a simulated ledger. No money moves and no biller is paid. You can review every record in Activity.",
  },
  {
    title: "What does project interest mean?",
    body: "Project interest is a nonbinding expression of potential interest. It is not an investment, contract, ownership right or securities offer. No funds are collected and no return is guaranteed. Any US Regulation Crowdfunding offering must be conducted through an appropriately registered funding portal or broker-dealer and satisfy applicable law.",
  },
  {
    title: "Who reviews requests?",
    body: "An authorized platform administrator may approve or reject a request after reviewing its submitted content and private evidence. Approval in this demonstration does not establish identity verification, legal compliance, financial suitability or a guaranteed outcome.",
  },
  {
    title: "How is my information protected?",
    body: "Public discovery includes your display name, general location, story and funding target. Private profile information and uploaded evidence are restricted to the owner and authorized reviewers. Do not upload bank/card details, government IDs or unredacted sensitive medical information.",
  },
  {
    title: "Draft Terms · United States / Colorado",
    body: "DRAFT FOR LEGAL REVIEW — This product is a local demonstration. Sample requests and identities are fictional. Support is simulated; investment interest is nonbinding. No real bill is paid, live financial product offered, charitable status established or return promised. Users must be at least 18, authorized to submit content, and truthful about their needs and relationships. No charitable tax deduction is promised. Platform review does not constitute identity verification or an endorsement. Live operation requires a confirmed operator, approved payment and disbursement arrangements, applicable federal/Colorado legal review, consumer disclosures, dispute/refund procedures and any required registrations or licensing.",
  },
  {
    title: "Draft Privacy Notice",
    body: "DRAFT FOR LEGAL REVIEW — Local account, readiness profile, consent records, requests, evidence and activity are stored in the project’s local database and private file storage. Public request fields are displayed in discovery; legal names, dates of birth, addresses and evidence are restricted to the owner and authorized reviewers. Collection, retention, deletion, security, processors, cross-border transfers and applicable Colorado/federal privacy obligations must be finalized by the operator before launch. Contact the configured local operator for correction or deletion requests. Do not upload unnecessary sensitive information.",
  },
  {
    title: "Risk & live launch readiness",
    body: "There is no live investment feature. A future investment may lose all value, be illiquid, lack a secondary market and provide no guaranteed return. A Reg CF route requires a registered intermediary and compliant disclosures, investor limits, communications and escrow arrangements. A live bill support route separately needs approved merchant onboarding, KYC/AML/sanctions controls where applicable, verified biller disbursement, fraud controls, reconciliation, refunds and disputes. Colorado money-transmission and federal payments/securities requirements must be evaluated for the actual business model.",
  },
];
export default function Help() {
  const [selected, setSelected] = useState<(typeof sections)[0] | null>(null),
    [compliance, setCompliance] = useState<{
      mode: string;
      liveEnabled: boolean;
      legalVersion: string;
      blockers: string[];
    } | null>(null);
  useEffect(() => {
    api<any>("/compliance")
      .then(setCompliance)
      .catch(() => {});
  }, []);
  return (
    <>
      <SectionHeading
        title="A little clarity helps."
        subtitle="Understand the community, your information and what comes next."
      />
      <View style={{ maxWidth: 880 }}>
        <Notice text="Local demo · United States / Colorado planning scope · No real funds move. Legal pages are drafts and require review for the actual operator and business model." />
        {sections.map((section) => (
          <Pressable
            key={section.title}
            accessibilityRole="button"
            onPress={() => setSelected(section)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 23,
              borderBottomWidth: 1,
              borderColor: C.line,
              gap: 18,
            }}
          >
            <T style={{ fontFamily: F.medium, fontSize: 15, flex: 1 }}>
              {section.title}
            </T>
            <Icon name="arrow-forward-outline" size={19} color={C.muted} />
          </Pressable>
        ))}
        {compliance && (
          <View style={{ marginTop: 25 }}>
            <T style={{ fontSize: 11, color: C.muted }}>
              Terms version: {compliance.legalVersion} · Live transactions{" "}
              {compliance.liveEnabled ? "enabled" : "disabled"}
            </T>
            {compliance.blockers.length > 0 && (
              <T
                style={{
                  fontSize: 11,
                  color: C.muted,
                  lineHeight: 20,
                  marginTop: 9,
                }}
              >
                Readiness requirements: {compliance.blockers.join(" · ")}
              </T>
            )}
          </View>
        )}
      </View>
      <Sheet
        visible={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title || "Help"}
      >
        <T style={{ lineHeight: 25, color: C.muted, fontSize: 14 }}>
          {selected?.body}
        </T>
      </Sheet>
    </>
  );
}
