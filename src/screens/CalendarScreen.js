import { useCallback, useMemo, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Calendar } from "react-native-calendars";
import { useFocusEffect } from "@react-navigation/native";
import { auth } from "../services/firebase";
import { getEvents } from "../services/eventService";

const TYPE_COLORS = {
  dogum_gunu: "#9b59b6",
  yildonumu: "#3498db",
  diger: "#2ecc71"
};

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState("");
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

  return (
    <View style={{ flex: 1, padding: 12 }}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, fontWeight: "600" }}>Yükleniyor...</Text>
        </View>
      ) : (
        <>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              todayTextColor: "black",
              arrowColor: "black"
            }}
          />

          <View style={{ paddingTop: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 14, fontWeight: "700" }}>
              Seçili Gün: {selectedDate || "-"}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}
