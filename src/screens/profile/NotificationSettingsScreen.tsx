import React, { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import { appStorage } from "@/utils/storage";
import { STORAGE_KEYS } from "@/constants/config";
import { NotificationPreferences } from "@/types";

// PRD §3 "Notification preference granularity" — order updates are
// mandatory and cannot be disabled; promotional and festival/community
// offers are independently toggleable.
//
// NOTE: The provided OpenAPI spec has no endpoint to persist these
// preferences server-side, so they're stored on-device for now. Once a
// `/api/customer/notifications/preferences` resource exists, swap the
// two effects below for GET/PUT calls.

const DEFAULT_PREFS: NotificationPreferences = {
  orderUpdates: true,
  promotional: true,
  festivalOffers: true,
};

export default function NotificationSettingsScreen() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);

  useEffect(() => {
    appStorage
      .getJSON<NotificationPreferences>(STORAGE_KEYS.notificationPrefs)
      .then((saved) => saved && setPrefs(saved));
  }, []);

  const update = (patch: Partial<NotificationPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      appStorage.setJSON(STORAGE_KEYS.notificationPrefs, next);
      return next;
    });
  };

  return (
    <Screen>
      <Row
        label="Order Updates"
        sublabel="Status changes for your orders. Always on."
        value={true}
        disabled
        onChange={() => {}}
      />
      <Row
        label="Promotional Messages"
        sublabel="Deals and offers from stores you order from."
        value={prefs.promotional}
        onChange={(v) => update({ promotional: v })}
      />
      <Row
        label="Festival & Community Offers"
        sublabel="Special offers tied to festivals and your community."
        value={prefs.festivalOffers}
        onChange={(v) => update({ festivalOffers: v })}
      />
    </Screen>
  );
}

function Row({
  label,
  sublabel,
  value,
  onChange,
  disabled,
}: {
  label: string;
  sublabel: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.sublabel}>{sublabel}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: "#1B7F4D" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  label: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },
  sublabel: { fontSize: 12, color: "#888", marginTop: 4 },
});
