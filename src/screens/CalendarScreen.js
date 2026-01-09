import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  ScrollView,
  RefreshControl
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import { auth } from "../services/firebase";
import { getEvents, deleteEvent, updateEvent } from "../services/eventService";
import EmptyState from "../components/EmptyState";
import { useAppTheme } from "../contexts/ThemeContext";

const TYPE_LABELS = {
  dogum_gunu: "Doğum Günü",
  yildonumu: "Yıldönümü",
  diger: "Diğer"
};

const normalizeDate = (d) => {
  if (!d) return "";
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return "";
};

const isValidDateString = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return false;
  const [y, m, d] = String(s).split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

const COLORS = {
  multi: "#ef4444",
  dogum_gunu: "#facc15",
  diger: "#22c55e",
  yildonumu: "#9ca3af"
};

const pickColorForDate = (eventsForDate) => {
  const types = Array.from(new Set(eventsForDate.map((e) => e?.type || "diger")));
  if (types.length > 1) return COLORS.multi;
  const t = types[0] || "diger";
  return COLORS[t] || COLORS.diger;
};

const getTextColorForBg = (bg) => {
  if (bg === COLORS.dogum_gunu) return "#111827";
  return "white";
};

const toMarkedDates = (events, selectedDate) => {
  const grouped = {};
  for (const e of events) {
    const date = normalizeDate(e?.date);
    if (!date) continue;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(e);
  }

  const marked = {};
  for (const date of Object.keys(grouped)) {
    const bg = pickColorForDate(grouped[date]);
    const textColor = getTextColorForBg(bg);
    marked[date] = {
      customStyles: {
        container: {
          backgroundColor: bg,
          borderRadius: 999
        },
        text: {
          color: textColor,
          fontWeight: "900"
        }
      }
    };
  }

  if (selectedDate) {
    marked[selectedDate] = {
      ...(marked[selectedDate] || {}),
      customStyles: {
        ...(marked[selectedDate]?.customStyles || {}),
        container: {
          ...(marked[selectedDate]?.customStyles?.container || {}),
          borderWidth: 2,
          borderColor: "#000"
        },
        text: {
          ...(marked[selectedDate]?.customStyles?.text || {}),
          fontWeight: "900"
        }
      }
    };
  }

  return marked;
};

export default function CalendarScreen() {
  const { navTheme, mode } = useAppTheme();
  const C = navTheme.colors;

  const placeholderTextColor = mode === "dark" ? "#94a3b8" : "#6b7280";

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", note: "", type: "diger", date: "" });

  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(async (opts = { showSpinner: true }) => {
    const user = auth.currentUser;
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }
    try {
      if (opts?.showSpinner) setLoading(true);
      const list = await getEvents(user.uid);
      setEvents(Array.isArray(list) ? list : []);
    } catch (e) {
      setEvents([]);
    } finally {
      if (opts?.showSpinner) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEvents({ showSpinner: true });
    }, [loadEvents])
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadEvents({ showSpinner: false });
    } finally {
      setRefreshing(false);
    }
  }, [loadEvents]);

  const markedDates = useMemo(() => {
    return toMarkedDates(events, selectedDate);
  }, [events, selectedDate]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events
      .filter((e) => normalizeDate(e?.date) === selectedDate)
      .sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
  }, [events, selectedDate]);

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
      date: item.date || selectedDate
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
    setExpandedId(item.id);
    setSelectedDate(date);
    await loadEvents({ showSpinner: false });
  };

  const confirmDelete = (item) => {
    const user = auth.currentUser;
    if (!user) return;

    const runDelete = async () => {
      await deleteEvent(user.uid, item.id);
      setExpandedId(null);
      setEditingId(null);
      await loadEvents({ showSpinner: false });
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.background }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10, fontWeight: "700", color: C.text }}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 12, paddingBottom: 24, backgroundColor: C.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={{ fontSize: 18, fontWeight: "900", marginBottom: 10, color: C.text }}>Takvim</Text>

      <Calendar
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
          setExpandedId(null);
          setEditingId(null);
        }}
        markingType="custom"
        markedDates={markedDates}
        theme={{
          backgroundColor: C.background,
          calendarBackground: C.background,

          monthTextColor: C.text,
          dayTextColor: C.text,
          textDisabledColor: mode === "dark" ? "#334155" : "#cbd5e1",

          todayTextColor: C.primary,
          arrowColor: C.primary,

          textSectionTitleColor: mode === "dark" ? "#cbd5e1" : "#475569"
        }}
      />

      <View style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: "900", marginBottom: 8, color: C.text }}>Seçili Gün</Text>

        {!selectedDate ? (
          <EmptyState
            variant="soft"
            emoji="🗓️"
            title="Detay görmek için bir gün seç"
            subtitle="Takvimden bir tarih seçerek o güne ait özel günleri görebilirsin."
          />
        ) : selectedEvents.length === 0 ? (
          <EmptyState
            variant="soft"
            emoji="✨"
            title="Bu güne ait özel gün yok"
            subtitle="Başka bir gün seçebilir veya yeni bir özel gün ekleyebilirsin."
          />
        ) : (
          <View style={{ gap: 10 }}>
            {selectedEvents.map((item) => {
              const open = expandedId === item.id;
              const editing = editingId === item.id;

              return (
                <View
                  key={item.id}
                  style={{
                    borderWidth: 1,
                    borderColor: open ? C.primary : C.border,
                    borderRadius: 14,
                    padding: 12,
                    backgroundColor: C.card
                  }}
                >
                  <TouchableOpacity activeOpacity={0.85} onPress={() => toggle(item.id)}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={{ fontWeight: "900", color: C.text }}>{item.title || "-"}</Text>
                        <Text style={{ marginTop: 4, fontWeight: "700", color: C.text }}>Tarih: {item.date}</Text>
                      </View>
                      <Text style={{ fontWeight: "900", color: C.text }}>{TYPE_LABELS[item.type] || "Diğer"}</Text>
                    </View>

                    {!!item.note && !open && (
                      <Text
                        numberOfLines={1}
                        style={{ marginTop: 6, color: mode === "dark" ? "#cbd5e1" : "#444", fontWeight: "600" }}
                      >
                        Not: {item.note}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {open && (
                    <View style={{ marginTop: 10, gap: 8 }}>
                      {editing ? (
                        <>
                          <TextInput
                            value={form.title}
                            onChangeText={(t) => setForm((p) => ({ ...p, title: t }))}
                            placeholder="Başlık"
                            placeholderTextColor={placeholderTextColor}
                            style={{
                              borderWidth: 1,
                              borderColor: C.border,
                              borderRadius: 10,
                              padding: 10,
                              backgroundColor: C.card,
                              color: C.text
                            }}
                          />

                          <TextInput
                            value={form.date}
                            onChangeText={(t) => setForm((p) => ({ ...p, date: t }))}
                            placeholder="Tarih (YYYY-AA-GG)"
                            placeholderTextColor={placeholderTextColor}
                            autoCapitalize="none"
                            style={{
                              borderWidth: 1,
                              borderColor: C.border,
                              borderRadius: 10,
                              padding: 10,
                              backgroundColor: C.card,
                              color: C.text
                            }}
                          />

                          <TextInput
                            value={form.note}
                            onChangeText={(t) => setForm((p) => ({ ...p, note: t }))}
                            placeholder="Not"
                            placeholderTextColor={placeholderTextColor}
                            style={{
                              borderWidth: 1,
                              borderColor: C.border,
                              borderRadius: 10,
                              padding: 10,
                              backgroundColor: C.card,
                              color: C.text
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
                                  borderColor: form.type === t ? C.primary : C.border,
                                  borderRadius: 10,
                                  paddingVertical: 10,
                                  alignItems: "center",
                                  backgroundColor: C.card
                                }}
                              >
                                <Text style={{ fontWeight: "800", color: C.text }}>{TYPE_LABELS[t]}</Text>
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
                            <Text style={{ color: "white", fontWeight: "900" }}>Kaydet</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={cancelEdit}
                            activeOpacity={0.85}
                            style={{
                              paddingVertical: 10,
                              borderRadius: 10,
                              alignItems: "center",
                              borderWidth: 1,
                              borderColor: C.border,
                              backgroundColor: C.card
                            }}
                          >
                            <Text style={{ fontWeight: "900", color: C.text }}>İptal</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          {!!item.note && <Text style={{ fontWeight: "700", color: C.text }}>Not: {item.note}</Text>}

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
                              <Text style={{ color: "white", fontWeight: "900" }}>Düzenle</Text>
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
                              <Text style={{ color: "white", fontWeight: "900" }}>Sil</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
