import { useCallback, useMemo, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { Calendar } from "react-native-calendars";
import { useFocusEffect } from "@react-navigation/native";
import { auth } from "../services/firebase";
import { getEvents, deleteEvent } from "../services/eventService";

const TYPE_COLORS = {
  dogum_gunu: "#9b59b6",
  yildonumu: "#3498db",
  diger: "#2ecc71"
};

const TYPE_LABELS = {
  dogum_gunu: "Doğum Günü",
  yildonumu: "Yıldönümü",
  diger: "Diğer"
};

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState("");
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

  const markedDates = useMemo(() => {
    const marks = {};
    for (const ev of events) {
      const d = ev?.date;
      if (!d) continue;

      const color = TYPE_COLORS[ev?.type] || "#000";

      if (!marks[d]) {
        marks[d] = { selected: true, selectedColor: color };
      } else {
        marks[d] = { selected: true, selectedColor: "#111" };
      }
    }

    if (selectedDate) {
      const existing = marks[selectedDate] || {};
      marks[selectedDate] = {
        ...existing,
        selected: true,
        selectedColor: existing.selectedColor || "#000"
      };
    }

    return marks;
  }, [events, selectedDate]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((e) => e?.date === selectedDate);
  }, [events, selectedDate]);

  const toggle = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const confirmDelete = (ev) => {
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert(
      "Silinsin mi?",
      `"${ev.title || "-"}" kaydını silmek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            await deleteEvent(user.uid, ev.id);
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
      <Calendar
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
          setExpandedId(null);
        }}
        markedDates={markedDates}
        theme={{
          todayTextColor: "black",
          arrowColor: "black"
        }}
      />

      <View style={{ paddingTop: 14 }}>
        <Text style={{ fontSize: 14, fontWeight: "800", marginBottom: 8 }}>
          Seçili Gün: {selectedDate || "-"}
        </Text>

        {!selectedDate ? (
          <Text style={{ fontWeight: "600" }}>Detay görmek için bir gün seç.</Text>
        ) : selectedDayEvents.length === 0 ? (
          <Text style={{ fontWeight: "600" }}>Bu güne ait özel gün yok.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {selectedDayEvents.map((ev) => {
              const open = expandedId === ev.id;
              return (
                <TouchableOpacity
                  key={ev.id}
                  activeOpacity={0.85}
                  onPress={() => toggle(ev.id)}
                  style={{
                    borderWidth: 1,
                    borderColor: open ? "#000" : "#ddd",
                    borderRadius: 12,
                    padding: 12
                  }}
                >
                  <Text style={{ fontWeight: "800", marginBottom: 4 }}>{ev.title || "-"}</Text>
                  <Text>Tür: {TYPE_LABELS[ev.type] || "Diğer"}</Text>

                  {open && (
                    <View style={{ marginTop: 8, gap: 6 }}>
                      <Text>Tarih: {ev.date}</Text>
                      {!!ev.note && <Text>Not: {ev.note}</Text>}

                      <TouchableOpacity
                        onPress={() => confirmDelete(ev)}
                        activeOpacity={0.85}
                        style={{
                          marginTop: 6,
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
            })}
          </View>
        )}
      </View>
    </View>
  );
}
