import { useCallback, useMemo, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { auth } from "../services/firebase";
import { getEvents, deleteEvent } from "../services/eventService";

const TYPE_LABELS = {
  dogum_gunu: "Doğum Günü",
  yildonumu: "Yıldönümü",
  diger: "Diğer"
};

const daysUntil = (dateStr) => {
  const parts = String(dateStr).split("-");
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

export default function UpcomingScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

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

  const upcoming = useMemo(() => {
    return events
      .filter((e) => !!e?.date)
      .map((e) => ({ ...e, diff: daysUntil(e.date) }))
      .filter((e) => typeof e.diff === "number" && e.diff >= 0)
      .sort((a, b) => a.diff - b.diff);
  }, [events]);

  const toggle = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const confirmDelete = (item) => {
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert(
      "Silinsin mi?",
      `"${item.title || "-"}" kaydını silmek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            await deleteEvent(user.uid, item.id);
            setExpandedId(null);
            loadEvents();
          }
        }
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
      <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 12 }}>Yaklaşan Günler</Text>

      {upcoming.length === 0 ? (
        <Text style={{ fontWeight: "600" }}>Yaklaşan özel gün yok.</Text>
      ) : (
        <FlatList
          data={upcoming}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            const open = expandedId === item.id;
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => toggle(item.id)}
                style={{
                  borderWidth: 1,
                  borderColor: open ? "#000" : "#ddd",
                  borderRadius: 12,
                  padding: 12
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontWeight: "800", flex: 1, paddingRight: 10 }}>{item.title || "-"}</Text>
                  <Text style={{ fontWeight: "800" }}>
                    {item.diff === 0 ? "Bugün" : item.diff === 1 ? "Yarın" : `${item.diff}g`}
                  </Text>
                </View>

                <Text style={{ marginTop: 6 }}>Tarih: {item.date}</Text>

                {open && (
                  <View style={{ marginTop: 10, gap: 6 }}>
                    <Text>Tür: {TYPE_LABELS[item.type] || "Diğer"}</Text>
                    {!!item.note && <Text>Not: {item.note}</Text>}

                    <TouchableOpacity
                      onPress={() => confirmDelete(item)}
                      activeOpacity={0.85}
                      style={{
                        marginTop: 8,
                        backgroundColor: "#d00000",
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: "center"
                      }}
                    >
                      <Text style={{ color: "white", fontWeight: "800" }}>Sil</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
