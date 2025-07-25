import { FC, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Popup from "./Popup";

// 🔧 Yardımcı Fonksiyonlar
function formatTarih(dateStr: string) {
  const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  const date = new Date(dateStr);
  return `${date.getDate()} ${months[date.getMonth()]} ${days[date.getDay()]}`;
}

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

type OdaKonsept = {
  odaTipi: string;
  konsept: string;
  fiyat: string;
};

type Props = {
  otelAdi: string;
  lokasyon: string;
  infos?: string[];
  kampanyalar?: string[];
  misafirOzeti?: string;
  odaKonseptler: OdaKonsept[];
  resimler?: string[];
  telefon?: string;
  web?: string;
  whatsapp?: string;
  geceGun?: string;
  tarih?: string;
  checkin: string;
  checkout: string;
};

const OtelCard: FC<Props> = ({
  otelAdi,
  lokasyon,
  infos = [],
  kampanyalar = [],
  misafirOzeti,
  odaKonseptler,
  resimler = [],
  telefon,
  web,
  whatsapp,
  geceGun,
  tarih,
  checkin,
  checkout,
}) => {
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedOda, setSelectedOda] = useState<OdaKonsept | null>(null);

  const handleRezervasyonClick = (oda: OdaKonsept) => {
    setSelectedOda(oda);
    setPopupVisible(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
      {/* Swiper */}
      <div className="relative">
        <Swiper navigation loop modules={[Navigation]} className="h-64">
          {resimler.length > 0
            ? resimler.map((src, i) => (
                <SwiperSlide key={i}>
                  <img
                    src={src}
                    alt={`otel-${otelAdi}-${i}`}
                    className="w-full h-64 object-cover"
                  />
                </SwiperSlide>
              ))
            : [...Array(2)].map((_, i) => (
                <SwiperSlide key={i}>
                  <img
                    src="https://via.placeholder.com/600x400"
                    className="w-full h-64 object-cover"
                  />
                </SwiperSlide>
              ))}
        </Swiper>
      </div>

      {/* Otel Bilgileri */}
      <div className="p-4 space-y-2 text-sm">
        <h2 className="text-xl font-bold">{otelAdi}</h2>
        <p className="text-gray-500">{lokasyon}</p>

        <div className="grid grid-cols-2 gap-2 mt-2 text-gray-600 text-sm">
          {infos.map((info, i) => (
            <div key={i}>📌 {info}</div>
          ))}
        </div>

        {kampanyalar.length > 0 && (
          <div className="mt-3 space-y-1">
            {kampanyalar.map((k, i) => (
              <div
                key={i}
                className={`p-2 rounded ${
                  i === 0
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {k}
              </div>
            ))}
          </div>
        )}

        {/* 👨‍👩‍👧‍👦 Misafir Özeti */}
        {misafirOzeti && (
          <div className="mt-3 text-gray-700 font-medium text-sm space-y-1 leading-snug">
            <div>📅 {formatTarih(checkin)} - {formatTarih(checkout)}</div>
            <div>🌙 {calculateDuration(checkin, checkout).nights} Gece {calculateDuration(checkin, checkout).days} Gün</div>
            <div>👨‍👩‍👧‍👦 {misafirOzeti}</div>
          </div>
        )}

        {/* Fiyat ve Butonlar */}
        <div className="mt-2 space-y-2">
          {odaKonseptler.map((k, i) => (
            <div
              key={i}
              className="flex justify-between items-end p-3 bg-gray-100 rounded-lg"
            >
              <div>
                <div className="font-semibold">{k.odaTipi}</div>
                <div className="text-sm text-gray-500">{k.konsept}</div>
              </div>
              <div className="text-right">
                <div className="text-pink-600 font-bold text-[18px]">
                  {k.fiyat}
                </div>
                <button
                  className="mt-1 px-3 py-[6px] bg-pink-600 text-white text-sm rounded-lg hover:bg-pink-700 w-[140px] h-[36px]"
                  onClick={() => handleRezervasyonClick(k)}
                >
                  Rezervasyon Yap
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Alt ikonlar */}
        <div className="mt-5 flex justify-around text-gray-600 text-center">
          {telefon && (
            <a href={`tel:${telefon}`} className="flex flex-col items-center">
              <img
                src="https://cdn-icons-png.flaticon.com/128/15868/15868787.png"
                alt="telefon"
                className="h-7 w-7 mb-1"
              />
              <span className="text-xs">Telefon No</span>
            </a>
          )}
          {web && (
            <a
              href={web}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/128/12472/12472488.png"
                alt="web"
                className="h-7 w-7 mb-1"
              />
              <span className="text-xs">İnternet Sitesi</span>
            </a>
          )}
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              className="flex flex-col items-center"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/128/5968/5968841.png"
                alt="whatsapp"
                className="h-7 w-7 mb-1"
              />
              <span className="text-xs">Whatsapp Hattı</span>
            </a>
          )}
        </div>
      </div>

      {/* Popup */}
      {selectedOda && (
        <Popup
          visible={popupVisible}
          onClose={() => setPopupVisible(false)}
          hotelName={otelAdi}
          roomType={selectedOda.odaTipi}
          concept={selectedOda.konsept}
          price={selectedOda.fiyat}
          details={`${misafirOzeti || ""} – ${geceGun || ""} – ${selectedOda.odaTipi}`}
          tarih={tarih || ""}
        />
      )}
    </div>
  );
};

export default OtelCard;
