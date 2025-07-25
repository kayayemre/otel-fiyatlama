// src/components/Popup.tsx

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";

type Props = {
  visible: boolean;
  onClose: () => void;
  hotelName: string;
  roomType: string;
  concept: string;
  price: string;
  details: string; // "2 Yetişkin 1 Çocuk (yaşlar) – 4 Gece 5 Gün"
  tarih: string;   // "24 Temmuz Perşembe - 27 Temmuz Pazar"
};

export default function Popup({
  visible,
  onClose,
  hotelName,
  roomType,
  concept,
  price,
  details,
  tarih,
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!visible) return null;

  const geceGun = details.split("–")[1]?.trim() || "";
  const yetiskinCocuk = details.split("–")[0]?.trim() || "";

  const handleSubmit = async () => {
    if (!name || !phone) return alert("Lütfen ad soyad ve telefon girin.");
    setLoading(true);

    const { error } = await supabase.from("reservations").insert([
      {
        rezervasyon_no: uuidv4(),
        ad_soyad: name,
        telefon: phone,
        otel_adi: hotelName,
        oda_tipi: roomType,
        konsept: concept,
        toplam_tutar: price,
        tarih_araligi: tarih,
        yetiskin_cocuk: yetiskinCocuk,
        gece_gun: geceGun,
        oda_sayisi: roomType.split(" ")[0],
        durum: "ARANMADI",
      },
    ]);

    setLoading(false);
    if (error) {
      console.error("Hata:", error.message);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl p-6 relative">
        {/* Kapat */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>

        {!submitted ? (
          <>
            <h2 className="text-xl font-bold mb-4 text-center">Rezervasyon Detayları</h2>

            <div className="space-y-1 text-sm mb-4 text-center text-gray-700">
              <div className="font-semibold text-base">{hotelName}</div>
              <div>{tarih}</div>
              <div>{geceGun}</div>
              <div>{yetiskinCocuk}</div>
              <div>{roomType}</div>
              <div>{concept}</div>
              <div className="text-pink-600 font-bold text-lg">{price}</div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Ad Soyad"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-pink-500"
              />
              <input
                type="tel"
                placeholder="Telefon Numarası"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-pink-500"
              />
              <button
                disabled={loading}
                onClick={handleSubmit}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white rounded-lg py-2 text-sm font-medium"
              >
                {loading ? "Gönderiliyor..." : "ODAMI OPSİYONLA"}
              </button>
              <p className="text-xs text-gray-500 text-center">
                Bu bir ön rezervasyondur. Kesinlik içermez. Ön ödeme gerekebilir.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Teşekkürler!</h2>
            <p className="text-sm text-gray-600 mb-4">
              Rezervasyon talebiniz alındı. En kısa sürede sizinle iletişime geçilecektir.
            </p>
            <button
              onClick={onClose}
              className="mt-2 bg-pink-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-pink-700"
            >
              Kapat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
