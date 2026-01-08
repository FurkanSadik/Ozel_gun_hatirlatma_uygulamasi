import { useCallback, useMemo, useState } from "react";
import { View, Text, ActivityIndicator, FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { auth } from "../services/firebase";
import { getEvents } from "../services/eventService";

const TYPE_LABELS = {
  dogum_gunu: "Doğum Günü",
  yildonumu: "Yıldönümü",
  diger: "Diğer"
};

const daysUntil = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

export default function UpcomingScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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
      .filter((e) => e.diff >= 0)
      .sort((a, b) => a.diff - b.diff);
  }, [events]);

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
      <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 12 }}>
        Yaklaşan Günler
      </Text>

      {upcoming.length === 0 ? (
        <Text style={{ fontWeight: "600" }}>Yaklaşan özel gün yok.</Text>
      ) : (
        <FlatList
          data={upcoming}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <View
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 12,
                padding: 12
              }}
            >
              <Text style={{ fontWeight: "800", marginBottom: 4 }}>
                {item.title || "-"}
              </Text>
              <Text>Tarih: {item.date}</Text>
              <Text>Tür: {TYPE_LABELS[item.type] || "Diğer"}</Text>
              <Text style={{ marginTop: 6, fontWeight: "800" }}>
                {item.diff === 0
                  ? "Bugün"
                  : item.diff === 1
                  ? "Yarın"
                  : `${item.diff} gün kaldı`}
              </Text>
              {!!item.note && <Text style={{ marginTop: 6 }}>Not: {item.note}</Text>}
            </View>
          )}
        />
      )}
    </View>
  );
}
