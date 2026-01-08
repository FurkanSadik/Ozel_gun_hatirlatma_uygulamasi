import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { getUserProfile } from "../services/userService";

export default function AccountScreen() {
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState(null);
  const [info, setInfo] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setEmail(u.email || "");
      const p = await getUserProfile(u.uid);
      setProfile(p);
    });
    return unsub;
  }, []);

  const handleLogout = async () => {
    setInfo("");
    try {
      await signOut(auth);
    } catch (e) {
      setInfo("Çıkış yapılamadı.");
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 16 }}>
        Hesap
      </Text>

      {!!info && (
        <Text style={{ textAlign: "center", marginBottom: 10, fontWeight: "600" }}>
          {info}
        </Text>
      )}

      <View style={{ padding: 14, borderWidth: 1, borderColor: "#ddd", borderRadius: 12, marginBottom: 14 }}>
        <Text style={{ fontWeight: "700", marginBottom: 6 }}>E-posta</Text>
        <Text>{email || "-"}</Text>

        <View style={{ height: 12 }} />

        <Text style={{ fontWeight: "700", marginBottom: 6 }}>Profil</Text>
        <Text>Ad Soyad: {profile?.name || "-"}</Text>
        <Text>Doğum Tarihi: {profile?.birthDate || "-"}</Text>
        <Text>Cinsiyet: {profile?.gender || "-"}</Text>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        style={{ backgroundColor: "black", paddingVertical: 12, borderRadius: 12, alignItems: "center" }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}
