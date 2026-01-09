import { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  ScrollView,
  RefreshControl,
  Switch
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import { ensureUserDoc, getUserProfile, updateUserProfile } from "../services/userService";
import { useAppTheme } from "../contexts/ThemeContext";

const GENDERS = [
  { key: "erkek", label: "Erkek" },
  { key: "kiz", label: "Kız" }
];

const isValidDateString = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return false;
  const [y, m, d] = String(s).split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

export default function AccountScreen() {
  const { mode, toggleTheme } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", birthDate: "", gender: "erkek" });

  const [refreshing, setRefreshing] = useState(false);

  const showMsg = (title, msg) => {
    if (Platform.OS === "web") window.alert(`${title}\n${msg}`);
    else Alert.alert(title, msg);
  };

  const loadProfile = useCallback(async (opts = { showSpinner: true }) => {
    const user = auth.currentUser;
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      if (opts?.showSpinner) setLoading(true);

      await ensureUserDoc(user.uid, {
        email: user.email || "",
        name: "",
        birthDate: "",
        gender: ""
      });

      const p = await getUserProfile(user.uid);
      setProfile(p);
      setForm({
        name: p?.name || "",
        birthDate: p?.birthDate || "",
        gender: p?.gender || "erkek"
      });
    } catch (e) {
      setProfile(null);
    } finally {
      if (opts?.showSpinner) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile({ showSpinner: true });
    }, [loadProfile])
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadProfile({ showSpinner: false });
    } finally {
      setRefreshing(false);
    }
  }, [loadProfile]);

  const onSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const name = String(form.name || "").trim();
    const birthDate = String(form.birthDate || "").trim();
    const gender = form.gender || "erkek";

    if (!name) return showMsg("Uyarı", "Ad Soyad boş olamaz.");
    if (!birthDate) return showMsg("Uyarı", "Doğum tarihi boş olamaz. Örn: 2002-05-14");
    if (!isValidDateString(birthDate))
      return showMsg("Uyarı", "Doğum tarihi formatı geçersiz. Örn: 2002-05-14");

    try {
      setLoading(true);
      await updateUserProfile(user.uid, { name, birthDate, gender });
      await loadProfile({ showSpinner: false });
      setEditing(false);
      showMsg("Başarılı", "Hesap bilgileri güncellendi.");
    } catch (e) {
      showMsg("Hata", "Güncelleme sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      showMsg("Hata", "Çıkış yapılamadı.");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10, fontWeight: "700" }}>Yükleniyor...</Text>
      </View>
    );
  }

  const email = auth.currentUser?.email || profile?.email || "-";

  return (
    <ScrollView
      contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={{ fontSize: 18, fontWeight: "900" }}>Hesap</Text>

      <View style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 14, padding: 12, backgroundColor: "white" }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontWeight: "900" }}>Karanlık Mod</Text>
          <Switch value={mode === "dark"} onValueChange={toggleTheme} />
        </View>
        <Text style={{ marginTop: 6, color: "#444", fontWeight: "700" }}>
          {mode === "dark" ? "Açık" : "Kapalı"}
        </Text>
      </View>

      <View style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 14, padding: 12, backgroundColor: "white" }}>
        <Text style={{ fontWeight: "900", marginBottom: 8 }}>Hesap Bilgileri</Text>

        {!editing ? (
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "800" }}>
              E-posta: <Text style={{ fontWeight: "600" }}>{email}</Text>
            </Text>
            <Text style={{ fontWeight: "800" }}>
              Ad Soyad: <Text style={{ fontWeight: "600" }}>{profile?.name || "-"}</Text>
            </Text>
            <Text style={{ fontWeight: "800" }}>
              Doğum Tarihi: <Text style={{ fontWeight: "600" }}>{profile?.birthDate || "-"}</Text>
            </Text>
            <Text style={{ fontWeight: "800" }}>
              Cinsiyet: <Text style={{ fontWeight: "600" }}>{profile?.gender === "kiz" ? "Kız" : "Erkek"}</Text>
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setEditing(true)}
              style={{
                marginTop: 10,
                backgroundColor: "#000",
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: "center"
              }}
            >
              <Text style={{ color: "white", fontWeight: "900" }}>Bilgileri Güncelle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <TextInput
              value={form.name}
              onChangeText={(t) => setForm((p) => ({ ...p, name: t }))}
              placeholder="Ad Soyad"
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 10,
                padding: 10,
                backgroundColor: "white"
              }}
            />

            <TextInput
              value={form.birthDate}
              onChangeText={(t) => setForm((p) => ({ ...p, birthDate: t }))}
              placeholder="Doğum Tarihi (YYYY-AA-GG)"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 10,
                padding: 10,
                backgroundColor: "white"
              }}
            />

            <View style={{ flexDirection: "row", gap: 8 }}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g.key}
                  activeOpacity={0.85}
                  onPress={() => setForm((p) => ({ ...p, gender: g.key }))}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: form.gender === g.key ? "#000" : "#ddd",
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: "center",
                    backgroundColor: "white"
                  }}
                >
                  <Text style={{ fontWeight: "900" }}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onSave}
              style={{
                backgroundColor: "#000",
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: "center"
              }}
            >
              <Text style={{ color: "white", fontWeight: "900" }}>Kaydet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setEditing(false);
                setForm({
                  name: profile?.name || "",
                  birthDate: profile?.birthDate || "",
                  gender: profile?.gender || "erkek"
                });
              }}
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: "white"
              }}
            >
              <Text style={{ fontWeight: "900" }}>İptal</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onLogout}
        style={{
          backgroundColor: "#d00000",
          paddingVertical: 12,
          borderRadius: 14,
          alignItems: "center"
        }}
      >
        <Text style={{ color: "white", fontWeight: "900" }}>Çıkış Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
