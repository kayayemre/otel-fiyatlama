import { useState } from "react";
import axios from "axios";
import OtelCard from "../components/OtelCard";
import otelData from "../../../oteller.json";

export default function Home() {
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState<number[]>([]);
  const [response, setResponse] = useState<Record<string, string>>({});

  const handleFetch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const result = await axios.post("http://localhost:3001/api/fiyat", {
      checkin,
      checkout,
      adults,
      children,
      childAges,
    });
    setResponse(result.data);
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-6">
        {/* Başlık */}
        <h2 className="text-xl font-bold text-center mb-1">
          En Uygun Otel Fiyatları Bir Tık Uzağında!
        </h2>
        <p className="text-center text-sm text-gray-600 mb-4">
          Tarihleri Seç, Fiyatı Keşfet, Tatil Başlasın
        </p>

        {/* Form */}
        <form onSubmit={handleFetch} className="flex flex-col gap-4">
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

          {/* Hesapla */}
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

      {/* Otel Kartları */}
      <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.keys(response)
          .filter((key) => key.startsWith("otel_adi_"))
          .map((key) => {
            const index = key.split("_")[2];
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
                resimler={otelBilgi?.resimler || []}
                telefon={otelBilgi?.telefon}
                web={otelBilgi?.web}
                whatsapp={otelBilgi?.whatsapp}
              />
            );
          })}
      </div>
    </div>
  );
}
