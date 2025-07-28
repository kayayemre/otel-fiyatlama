// 🔢 Yardımcı Tipler
export type GuestGroup = {
  adults: number;
  children: number;
  childAges: number[];
};

export type RoomOption = {
  adults: number;
  children: number;
  childAges: number[];
  multiplier: number;
};

export type BestRoomResult = {
  rooms: RoomOption[];
  totalMultiplier: number;
};

// 🔍 Belirli yaşlara ve kombinasyona göre çarpanı bul
export function getMultiplier(
  carpanlar: any[],
  otelAdi: string,
  odaTipi: string,
  adults: number,
  children: number,
  childAges: number[]
): number | null {
  return (
    carpanlar.find((c) => {
      if (
        c.otel_adi === otelAdi &&
        c.oda_tipi === odaTipi &&
        c.yetiskin_sayisi === adults &&
        c.cocuk_sayisi === children
      ) {
        const yaslar = [
          c.birinci_cocuk_yas_araligi,
          c.ikinci_cocuk_yas_araligi,
          c.ucuncu_cocuk_yas_araligi,
        ].filter(Boolean);

        for (let i = 0; i < yaslar.length; i++) {
          const [min, max] = yaslar[i]
            .split('-')
            .map((s: string) => parseFloat(s.replace(',', '.')));

          if (
            childAges[i] == null ||
            childAges[i] < min ||
            childAges[i] > max
          ) {
            return false;
          }
        }
        return true;
      }
      return false;
    })?.carpan ?? null
  );
}

// 👥 Tüm geçerli oda dağılımlarını oluşturur (her odada en az 1 yetişkin olacak şekilde)
export function generateCombinations(
  guests: GuestGroup
): GuestGroup[][] {
  const results: GuestGroup[][] = [];

  function backtrack(current: GuestGroup[], remaining: GuestGroup) {
    if (remaining.adults === 0 && remaining.children === 0) {
      results.push(current.map((g) => ({ ...g })));
      return;
    }

    for (let a = 1; a <= remaining.adults; a++) {
      for (let c = 0; c <= remaining.children; c++) {
        const groupAges = remaining.childAges.slice(0, c);
        const newGroup = {
          adults: a,
          children: c,
          childAges: groupAges,
        };
        const rest = {
          adults: remaining.adults - a,
          children: remaining.children - c,
          childAges: remaining.childAges.slice(c),
        };
        if (rest.adults >= 0 && rest.children >= 0 && a >= 1) {
          backtrack([...current, newGroup], rest);
        }
      }
    }
  }

  backtrack([], guests);
  return results;
}

// 🧠 En uygun dağılımı (toplam çarpanı en düşük olan) bulan ana fonksiyon
export function findBestRoomDistribution(
  otelAdi: string,
  odaTipi: string,
  guests: GuestGroup,
  carpanlar: any[]
): BestRoomResult | null {
  const combos = generateCombinations(guests);
  let best: BestRoomResult | null = null;

  for (const combo of combos) {
    const roomDetails: RoomOption[] = [];
    let totalMultiplier = 0;
    let valid = true;

    for (const room of combo) {
      const multiplier = getMultiplier(
        carpanlar,
        otelAdi,
        odaTipi,
        room.adults,
        room.children,
        room.childAges
      );
      if (!multiplier) {
        valid = false;
        break;
      }
      roomDetails.push({ ...room, multiplier });
      totalMultiplier += multiplier;
    }

    if (valid && (!best || totalMultiplier < best.totalMultiplier)) {
      best = {
        rooms: roomDetails,
        totalMultiplier,
      };
    }
  }

  return best;
}
