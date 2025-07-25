import { useEffect, useState } from "react";
import axios from "axios";
import OtelCard from "../components/OtelCard";
import otelData from "../../../oteller.json";

// 🔤 Otel adını slug formatına çevir
function slugify(str: string) {
  return str
    .toLowerCase()
    .replaceAll("ş", "s")
    .replaceAll("ç", "c")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll(" ", "_");
}

// 📆 Türkçe tarih formatı
function formatTarih(dateStr: string) {
  const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  const date = new Date(dateStr);
  return `${date.getDate()} ${months[date.getMonth()]} ${days[date.getDay()]}`;
}

// 🌙 Gece/gün hesabı
function calculateDuration(start: string, end: string) {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diffMs = d2.getTime() - d1.getTime();
  const nights = diffMs / (1000 * 60 * 60 * 24);
  return {
    nights,
    days: nights + 1,
  };
}

// ⏱️ Sayaç hook (60 dakika)
function useCountdown(startTimeKey: string, totalSeconds = 3600) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    const stored = localStorage.getItem(startTimeKey);
    let startTime = stored ? parseInt(stored) : Date.now();
    if (!stored) localStorage.setItem(startTimeKey, startTime.toString());

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const left = Math.max(totalSeconds - elapsed, 0);
      setRemaining(left);
      if (left === 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTimeKey, totalSeconds]);

  const min = String(Math.floor(remaining / 60)).padStart(2, "0");
  const sec = String(remaining % 60).padStart(2, "0");
  return `${min}:${sec}`;
}
export default function Home() {
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState<number[]>([]);
  const [response, setResponse] = useState<Record<string, string>>({});

  const countdown = useCountdown("teklif_sure");

  useEffect(() => {
    const saved = localStorage.getItem("konaklama");
    if (saved) {
      const data = JSON.parse(saved);
      setCheckin(data.checkin);
      setCheckout(data.checkout);
      setAdults(data.adults);
      setChildren(data.children);
      setChildAges(data.childAges);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "konaklama",
      JSON.stringify({ checkin, checkout, adults, children, childAges })
    );
  }, [checkin, checkout, adults, children, childAges]);

  const handleFetch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const result = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/fiyat`, {
      checkin,
      checkout,
      adults,
      children,
      childAges,
    });
    setResponse(result.data);
    localStorage.setItem("teklif_sure", Date.now().toString()); // sayaç sıfırla
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold text-center mb-1">
          En Uygun Otel Fiyatları Bir Tık Uzağında!
        </h2>
        <p className="text-center text-sm text-gray-600 mb-4">
          Tarihleri Seç, Fiyatı Keşfet, Tatil Başlasın
        </p>

        {/* Form */}
        <form onSubmit={handleFetch} className="flex flex-col gap-4">
          {/* Giriş / Çıkış */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex flex-col w-full">
              <label className="mb-1 font-medium text-sm">Giriş Tarihi</label>
              <input
                type="date"
                value={checkin}
                onChange={(e) => setCheckin(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div className="flex flex-col w-full">
              <label className="mb-1 font-medium text-sm">Çıkış Tarihi</label>
              <input
                type="date"
                value={checkout}
                onChange={(e) => setCheckout(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Yetişkin / Çocuk */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex flex-col w-full">
              <label className="mb-1 font-medium text-sm">Yetişkin</label>
              <select
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2"
              >
                {[...Array(6)].map((_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1} Yetişkin
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col w-full">
              <label className="mb-1 font-medium text-sm">Çocuk</label>
              <select
                value={children}
                onChange={(e) => {
                  const count = Number(e.target.value);
                  setChildren(count);
                  setChildAges(Array(count).fill(4));
                }}
                className="border border-gray-300 rounded px-3 py-2"
              >
                {[...Array(7)].map((_, i) => (
                  <option key={i} value={i}>
                    {i} Çocuk
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Çocuk Yaşları */}
          {children > 0 && (
            <div className="grid md:grid-cols-3 gap-4">
              {childAges.map((age, i) => (
                <div key={i} className="flex flex-col">
                  <label className="mb-1 text-sm font-medium">
                    Çocuk {i + 1} Yaşı
                  </label>
                  <select
                    value={age}
                    onChange={(e) => {
                      const newAges = [...childAges];
                      newAges[i] = Number(e.target.value);
                      setChildAges(newAges);
                    }}
                    className="border border-gray-300 rounded px-3 py-2"
                  >
                    {[...Array(18)].map((_, j) => (
                      <option key={j} value={j}>
                        {j} yaş
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Buton */}
          <div className="text-center mt-2">
            <button
              type="submit"
              className="bg-pink-600 text-white px-6 py-2 rounded hover:bg-pink-700 font-semibold"
            >
              Hesapla
            </button>
          </div>
        </form>
      </div>

 {/* Konaklama Özeti Kutusu */}
{response && Object.keys(response).length > 0 && (
  <div className="max-w-3xl mx-auto bg-white mt-6 p-5 rounded-2xl shadow text-sm text-gray-700 space-y-2">
    <h3 className="text-lg font-semibold text-pink-600">KONAKLAMA DETAYLARINIZ</h3>

    <div>📅 {formatTarih(checkin)} - {formatTarih(checkout)}</div>
    <div>🌙 {calculateDuration(checkin, checkout).nights} Gece {calculateDuration(checkin, checkout).days} Gün</div>
    <div>
      👨‍👩‍👧‍👦 {adults} Yetişkin
      {children > 0 && ` + ${children} Çocuk (${childAges.join(", ")})`}
    </div>

    <div className="text-gray-600">
      Otellerimizin konaklamanıza özel indirimli fiyat teklifleri aşağıdadır.
    </div>
    <div className="text-sm font-medium text-red-600">
      Teklifin Geçerlilik Süresi: {countdown}
    </div>
  </div>
)}


      {/* Otel Kartları */}
      <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.keys(response)
  .filter((key) => key.startsWith("otel_adi_"))
  .map((key) => {
    const index = key.split("_")[2];

    // ✅ Bu hesaplamalar burada olacak
    const { nights, days } = calculateDuration(checkin, checkout);
    const geceGun = `${nights} Gece ${days} Gün`;
    const tarih = `${formatTarih(checkin)} - ${formatTarih(checkout)}`;

    const odaTipleri = Object.entries(response)
      .filter(([k]) => k.startsWith(`oda_sayisi_tipi_${index}_`))
      .map(([k, v]) => {
        const suffix = k.split("_").pop();
        return {
          odaTipi: v,
          konsept: response[`konsept_${index}_${suffix}`],
          fiyat: response[`toplam_tutar_${index}_${suffix}`],
        };
      });

    const otelAdi = response[`otel_adi_${index}`];
    const lokasyon = response[`lokasyon_${index}`];
    const misafirOzeti = response.yetiskin_cocuk;
    const otelBilgi = otelData.find((o) => o.otel_adi === otelAdi);
    const otelSlug = slugify(otelAdi);
    const resimler = Array.from({ length: 5 }, (_, i) => `/images/${otelSlug}_${i + 1}.jpg`);

    return (
      <OtelCard
        key={otelAdi}
        otelAdi={otelAdi}
        lokasyon={lokasyon}
        infos={[
          otelBilgi?.info1,
          otelBilgi?.info2,
          otelBilgi?.info3,
          otelBilgi?.info4,
        ]}
        kampanyalar={[otelBilgi?.kampanya1, otelBilgi?.kampanya2]}
        misafirOzeti={misafirOzeti}
        odaKonseptler={odaTipleri}
        resimler={resimler}
        telefon={otelBilgi?.telefon}
        web={otelBilgi?.web}
        whatsapp={otelBilgi?.whatsapp}
        geceGun={geceGun}
        tarih={tarih}
        checkin={checkin}
        checkout={checkout}
      />
    );
  })}

      </div>
    </div>
  );
}
