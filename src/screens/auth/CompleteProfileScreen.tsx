import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Screen } from "@/components/Screen";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/context/AuthContext";
import {
  completeProfile,
  fetchBlocksForCommunity,
  fetchCommunities,
  fetchFlatsForBlock,
} from "@/api/misc";

interface Option {
  id: number;
  label: string;
}

// PRD §2.1/§2.12 — first-time residents pick their flat (Block → Flat)
// so the app knows which community's stores to show (§2.2, §2.3).

export default function CompleteProfileScreen() {
  const { markProfileComplete } = useAuth();
  const [name, setName] = useState("");
  const [communities, setCommunities] = useState<Option[]>([]);
  const [blocks, setBlocks] = useState<Option[]>([]);
  const [flats, setFlats] = useState<Option[]>([]);
  const [communityId, setCommunityId] = useState<number | null>(null);
  const [blockId, setBlockId] = useState<number | null>(null);
  const [flatId, setFlatId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCommunities()
      .then((res) =>
        setCommunities((res.data ?? []).map((c: any) => ({ id: c.id, label: c.name })))
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!communityId) return;
    setBlocks([]);
    setBlockId(null);
    setFlats([]);
    setFlatId(null);
    fetchBlocksForCommunity(communityId)
      .then((res) =>
        setBlocks((res.data ?? []).map((b: any) => ({ id: b.id, label: b.name })))
      )
      .catch(() => {});
  }, [communityId]);

  useEffect(() => {
    if (!blockId) return;
    setFlats([]);
    setFlatId(null);
    fetchFlatsForBlock(blockId)
      .then((res) =>
        setFlats(
          (res.data ?? []).map((f: any) => ({ id: f.id, label: f.flatNumber }))
        )
      )
      .catch(() => {});
  }, [blockId]);

  const onSubmit = async () => {
    if (!flatId) {
      Alert.alert("Select your flat to continue");
      return;
    }
    setLoading(true);
    try {
      await completeProfile(flatId, name || undefined);
      markProfileComplete();
    } catch (e: any) {
      Alert.alert(
        "Couldn't save profile",
        e?.response?.data?.message ?? "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderPicker = (
    title: string,
    options: Option[],
    selected: number | null,
    onSelect: (id: number) => void
  ) => (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.label}>{title}</Text>
      {options.length === 0 ? (
        <Text style={styles.placeholder}>—</Text>
      ) : (
        <FlatList
          data={options}
          keyExtractor={(o) => String(o.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onSelect(item.id)}
              style={[styles.chip, selected === item.id && styles.chipSelected]}
            >
              <Text
                style={[
                  styles.chipText,
                  selected === item.id && styles.chipTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  return (
    <Screen>
      <Text style={styles.title}>Just one more step</Text>
      <Text style={styles.subtitle}>
        Tell us where you live so we can show stores serving your building.
      </Text>

      <Text style={styles.label}>Your Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Priya Sharma"
      />

      {renderPicker("Community", communities, communityId, setCommunityId)}
      {communityId && renderPicker("Block / Building", blocks, blockId, setBlockId)}
      {blockId && renderPicker("Flat", flats, flatId, setFlatId)}

      <PrimaryButton
        title="Save & Continue"
        onPress={onSubmit}
        loading={loading}
        disabled={!flatId}
        style={{ marginTop: 12 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", marginTop: 16, color: "#1A1A1A" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 8, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 8 },
  placeholder: { color: "#AAA", fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 18,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#fff",
    marginRight: 8,
  },
  chipSelected: { backgroundColor: "#1B7F4D", borderColor: "#1B7F4D" },
  chipText: { color: "#333", fontSize: 13 },
  chipTextSelected: { color: "#fff", fontWeight: "600" },
});
