import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { auth } from "../services/firebase";
import { getEvents, deleteEvent, updateEvent } from "../services/eventService";

const TYPE_LABELS = {
  dogum_gunu: "Doğum Günü",
  yildonumu: "Yıldönümü",
  diger: "Diğer"
};

const FILTERS = [
  { key: "all", label: "Tümü" },
  { key: "dogum_gunu", label: "Doğum Günü" },
  { key: "yildonumu", label: "Yıldönümü" },
  { key: "diger", label: "Diğer" }
];

const isValidDateString = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return false;
  const [y, m, d] = String(s).split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

const parseLocalDate = (dateStr) => {
  const parts = String(dateStr).split("-");
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const startOfDay = (dt) => {
  const x = new Date(dt);
  x.setHours(0, 0, 0, 0);
  return x;
};

const daysPassed = (dateStr) => {
  const target = parseLocalDate(dateStr);
  if (!target) return null;
  const today = startOfDay(new Date());
  const t = startOfDay(target);
  return Math.floor((today - t) / (1000 * 60 * 60 * 24));
};

export default function PastScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", note: "", type: "diger", date: "" });

  const [filter, setFilter] = useState("all");

  const loadEvents = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const list = await getEvents(user.uid);
      setEvents(Array.isArray(list) ? list : []);
    } catch (e) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  const pastAll = useMemo(() => {
    return events
      .filter((e) => !!e?.date)
      .map((e) => ({ ...e, diff: daysPassed(e.date) }))
      .filter((e) => typeof e.diff === "number" && e.diff > 0)
      .sort((a, b) => a.diff - b.diff);
  }, [events]);

  const past = useMemo(() => {
    if (filter === "all") return pastAll;
    return pastAll.filter((e) => (e.type || "diger") === filter);
  }, [pastAll, filter]);

  const toggle = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setEditingId(null);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      note: item.note || "",
      type: item.type || "diger",
      date: item.date || ""
    });
  };

  const cancelEdit = () => setEditingId(null);

  const showMsg = (msg) => {
    if (Platform.OS === "web") window.alert(msg);
    else Alert.alert("Uyarı", msg);
  };

  const saveEdit = async (item) => {
    const user = auth.currentUser;
    if (!user) return;

    const title = String(form.title || "").trim();
    if (!title) return showMsg("Başlık boş olamaz.");

    const date = String(form.date || "").trim();
    if (!isValidDateString(date)) return showMsg("Tarih formatı geçersiz. Örn: 2026-01-08");

    await updateEvent(user.uid, item.id, {
      title,
      date,
      note: String(form.note || "").trim(),
      type: form.type || "diger"
    });

    setEditingId(null);
    loadEvents();
  };

  const confirmDelete = (item) => {
    const user = auth.currentUser;
    if (!user) return;

    const runDelete = async () => {
      await deleteEvent(user.uid, item.id);
      setExpandedId(null);
      setEditingId(null);
      loadEvents();
    };

    if (Platform.OS === "web") {
      const ok = window.confirm(`"${item.title || "-"}" kaydı silinsin mi?`);
      if (ok) runDelete();
      return;
    }

    Alert.alert(
      "Silinsin mi?",
      `"${item.title || "-"}" kaydını silmek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Sil", style: "destructive", onPress: runDelete }
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10, fontWeight: "600" }}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 8 }}>Geçmiş Günler</Text>

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.85}
            style={{
              borderWidth: 1,
              borderColor: filter === f.key ? "#000" : "#ddd",
              backgroundColor: filter === f.key ? "#000" : "#fff",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 999
            }}
          >
            <Text style={{ fontWeight: "900", color: filter === f.key ? "#fff" : "#000" }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {past.length === 0 ? (
        <Text style={{ fontWeight: "600" }}>Bu filtrede geçmiş özel gün yok.</Text>
      ) : (
        <FlatList
          data={past}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            const open = expandedId === item.id;
            const editing = editingId === item.id;

            return (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: open ? "#000" : "#ddd",
                  borderRadius: 12,
                  padding: 12
                }}
              >
                <TouchableOpacity activeOpacity={0.85} onPress={() => toggle(item.id)}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontWeight: "800", flex: 1, paddingRight: 10 }}>{item.title || "-"}</Text>
                    <Text style={{ fontWeight: "800" }}>{item.diff === 1 ? "1g" : `${item.diff}g`}</Text>
                  </View>
                  <Text style={{ marginTop: 6 }}>Tarih: {item.date}</Text>
                </TouchableOpacity>

                {open && (
                  <View style={{ marginTop: 10, gap: 8 }}>
                    {editing ? (
                      <>
                        <TextInput
                          value={form.title}
                          onChangeText={(t) => setForm((p) => ({ ...p, title: t }))}
                          placeholder="Başlık"
                          style={{
                            borderWidth: 1,
                            borderColor: "#ddd",
                            borderRadius: 10,
                            padding: 10
                          }}
                        />

                        <TextInput
                          value={form.date}
                          onChangeText={(t) => setForm((p) => ({ ...p, date: t }))}
                          placeholder="Tarih (YYYY-AA-GG)"
                          autoCapitalize="none"
                          style={{
                            borderWidth: 1,
                            borderColor: "#ddd",
                            borderRadius: 10,
                            padding: 10
                          }}
                        />

                        <TextInput
                          value={form.note}
                          onChangeText={(t) => setForm((p) => ({ ...p, note: t }))}
                          placeholder="Not"
                          style={{
                            borderWidth: 1,
                            borderColor: "#ddd",
                            borderRadius: 10,
                            padding: 10
                          }}
                        />

                        <View style={{ flexDirection: "row", gap: 8 }}>
                          {["dogum_gunu", "yildonumu", "diger"].map((t) => (
                            <TouchableOpacity
                              key={t}
                              onPress={() => setForm((p) => ({ ...p, type: t }))}
                              activeOpacity={0.85}
                              style={{
                                flex: 1,
                                borderWidth: 1,
                                borderColor: form.type === t ? "#000" : "#ddd",
                                borderRadius: 10,
                                paddingVertical: 10,
                                alignItems: "center"
                              }}
                            >
                              <Text style={{ fontWeight: "800" }}>{TYPE_LABELS[t]}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <TouchableOpacity
                          onPress={() => saveEdit(item)}
                          activeOpacity={0.85}
                          style={{
                            backgroundColor: "#000",
                            paddingVertical: 10,
                            borderRadius: 10,
                            alignItems: "center"
                          }}
                        >
                          <Text style={{ color: "white", fontWeight: "800" }}>Kaydet</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={cancelEdit}
                          activeOpacity={0.85}
                          style={{
                            paddingVertical: 10,
                            borderRadius: 10,
                            alignItems: "center",
                            borderWidth: 1,
                            borderColor: "#ddd"
                          }}
                        >
                          <Text style={{ fontWeight: "800" }}>İptal</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <Text>Tür: {TYPE_LABELS[item.type] || "Diğer"}</Text>
                        <Text style={{ fontWeight: "800" }}>
                          {item.diff === 1 ? "1 gün geçti" : `${item.diff} gün geçti`}
                        </Text>
                        {!!item.note && <Text>Not: {item.note}</Text>}

                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <TouchableOpacity
                            onPress={() => startEdit(item)}
                            activeOpacity={0.85}
                            style={{
                              flex: 1,
                              backgroundColor: "#444",
                              paddingVertical: 10,
                              borderRadius: 10,
                              alignItems: "center"
                            }}
                          >
                            <Text style={{ color: "white", fontWeight: "800" }}>Düzenle</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => confirmDelete(item)}
                            activeOpacity={0.85}
                            style={{
                              flex: 1,
                              backgroundColor: "#d00000",
                              paddingVertical: 10,
                              borderRadius: 10,
                              alignItems: "center"
                            }}
                          >
                            <Text style={{ color: "white", fontWeight: "800" }}>Sil</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
