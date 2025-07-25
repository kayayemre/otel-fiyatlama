import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const app = express();
app.use(cors());
app.use(express.json());

type Fiyat = {
  otel_id: number;
  otel_adi: string;
  oda_tipi: string;
  periyot_baslangic: string;
  periyot_bitis: string;
  konsept: string;
  fiyat: number;
  para_birimi: string;
};

type Carpan = {
  otel_id: number;
  otel_adi: string;
  oda_tipi: string;
  yetiskin_sayisi: number;
  cocuk_sayisi?: number;
  birinci_cocuk_yas_araligi?: string;
  ikinci_cocuk_yas_araligi?: string;
  ucuncu_cocuk_yas_araligi?: string;
  carpan: number;
};

type Otel = {
  otel_id: number;
  otel_adi: string;
  lokasyon: string;
};

const fiyatlar: Fiyat[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../../fiyatlar.json'), 'utf-8'));
const carpanlar: Carpan[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../../carpanlar.json'), 'utf-8'));
const oteller: Otel[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../../oteller.json'), 'utf-8'));

const formatTarih = (tarih: string): string => {
  const gun = dayjs(tarih).format('D MMMM dddd');
  return gun.charAt(0).toUpperCase() + gun.slice(1);
};

const formatYetiskinCocuk = (a: number, c: number, yaslar: number[]): string => {
  return `${a} Yetişkin${c > 0 ? ` ${c} Çocuk (${yaslar.join(', ')} Yaş)` : ''}`;
};

const getMaxCocukYasi = (otel_id: number): number => {
  const yaslar = carpanlar
    .filter((c) => c.otel_id === otel_id)
    .flatMap((c) => [c.birinci_cocuk_yas_araligi, c.ikinci_cocuk_yas_araligi, c.ucuncu_cocuk_yas_araligi])
    .filter((s): s is string => Boolean(s))
    .map((s) => parseFloat(s.split('-')[1]?.replace(',', '.') || '0'))
    .filter((n) => !isNaN(n));

  return yaslar.length > 0 ? Math.max(...yaslar) : 11;
};

const normalizeGuests = (
  otel_id: number,
  adults: number,
  children: number,
  childAges: number[]
): { finalAdults: number; finalChildren: number; finalChildAges: number[] } => {
  const maxYas = getMaxCocukYasi(otel_id);
  let finalAdults = adults;
  let finalChildren = 0;
  const finalChildAges: number[] = [];

  childAges.forEach((yas) => {
    if (yas > maxYas) {
      finalAdults++;
    } else {
      finalChildren++;
      finalChildAges.push(yas);
    }
  });

  return { finalAdults, finalChildren, finalChildAges };
};

const findCarpan = (
  otel_id: number,
  oda_tipi: string,
  yetiskin: number,
  cocuk: number,
  yaslar: number[]
): Carpan | undefined => {
  return carpanlar.find((c) => {
    if (c.otel_id !== otel_id || c.oda_tipi !== oda_tipi) return false;
    if (Number(c.yetiskin_sayisi) !== yetiskin) return false;
    if (Number(c.cocuk_sayisi || 0) !== cocuk) return false;

    const araliklar = [c.birinci_cocuk_yas_araligi, c.ikinci_cocuk_yas_araligi, c.ucuncu_cocuk_yas_araligi].filter(Boolean);
    if (yaslar.length !== araliklar.length) return false;

    for (let i = 0; i < yaslar.length; i++) {
      const [min, max] = araliklar[i]!.split('-').map((s) => parseFloat(s.replace(',', '.')));
      const yas = yaslar[i];
      if (yas < min || yas > max) return false;
    }

    return true;
  });
};

const generateRoomCombinations = (yetiskin: number, cocuk: number, yaslar: number[]) => {
  const combinations: {
    adults: number;
    children: number;
    childAges: number[];
  }[][] = [];

  combinations.push([{ adults: yetiskin, children: cocuk, childAges: yaslar }]);

  if (yetiskin >= 2) {
    for (let a1 = 1; a1 < yetiskin; a1++) {
      const a2 = yetiskin - a1;
      for (let c1 = 0; c1 <= cocuk; c1++) {
        const c2 = cocuk - c1;
        combinations.push([
          { adults: a1, children: c1, childAges: yaslar.slice(0, c1) },
          { adults: a2, children: c2, childAges: yaslar.slice(c1) },
        ]);
      }
    }
  }

  if (yetiskin >= 3) {
    for (let a1 = 1; a1 <= yetiskin - 2; a1++) {
      for (let a2 = 1; a2 <= yetiskin - a1 - 1; a2++) {
        const a3 = yetiskin - a1 - a2;
        for (let c1 = 0; c1 <= cocuk; c1++) {
          for (let c2 = 0; c2 <= cocuk - c1; c2++) {
            const c3 = cocuk - c1 - c2;
            combinations.push([
              { adults: a1, children: c1, childAges: yaslar.slice(0, c1) },
              { adults: a2, children: c2, childAges: yaslar.slice(c1, c1 + c2) },
              { adults: a3, children: c3, childAges: yaslar.slice(c1 + c2) },
            ]);
          }
        }
      }
    }
  }

  return combinations;
};

app.post('/api/fiyat', (req: Request, res: Response) => {
  const { checkin, checkout, adults, children, childAges, hotel_id } = req.body;

  const giris = formatTarih(checkin);
  const cikis = formatTarih(checkout);
  const geceSayisi = dayjs(checkout).diff(dayjs(checkin), 'day');
  const geceGun = `${geceSayisi} Gece ${geceSayisi + 1} Gün`;

  const response: Record<string, string> = {
    giris,
    cikis,
    gece_gun: geceGun,
    yetiskin_cocuk: formatYetiskinCocuk(adults, children, childAges),
  };

  const grouped: Record<string, Fiyat[]> = {};
  for (const f of fiyatlar) {
    if (hotel_id && f.otel_id.toString() !== hotel_id.toString()) continue;
    const key = `${f.otel_id}|${f.otel_adi}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(f);
  }

  let otelIndex = 1;

  for (const key in grouped) {
    const [otel_id_str, otel_adi] = key.split('|');
    const otel_id = Number(otel_id_str);
    const satirlar = grouped[key];
    const lokasyon = oteller.find((o) => o.otel_id.toString() === otel_id_str)?.lokasyon || '';

    response[`otel_adi_${otelIndex}`] = otel_adi;
    response[`lokasyon_${otelIndex}`] = lokasyon;

    const gunlukTarihler: string[] = [];
    let cursor = dayjs(checkin);
    while (cursor.isBefore(dayjs(checkout))) {
      gunlukTarihler.push(cursor.format('YYYY-MM-DD'));
      cursor = cursor.add(1, 'day');
    }

    const unique = new Set<string>();
    let altIndex = 0;

    for (const s of satirlar) {
      const comboKey = `${s.oda_tipi}|${s.konsept}`;
      if (unique.has(comboKey)) continue;

      const { finalAdults, finalChildren, finalChildAges } = normalizeGuests(otel_id, adults, children, childAges);
      let odaSayisi = 1;

      const singleRoomCarpan = findCarpan(otel_id, s.oda_tipi, finalAdults, finalChildren, finalChildAges);
      let toplamCarpan = singleRoomCarpan?.carpan ?? null;

      if (!toplamCarpan) {
        const allCombos = generateRoomCombinations(finalAdults, finalChildren, finalChildAges);
        const enIyiCombo = allCombos.find((combo) =>
          combo.every((room) => findCarpan(otel_id, s.oda_tipi, room.adults, room.children, room.childAges))
        );
        if (enIyiCombo) {
          odaSayisi = enIyiCombo.length;
          toplamCarpan = enIyiCombo.reduce((acc, room) => {
            const carpan = findCarpan(otel_id, s.oda_tipi, room.adults, room.children, room.childAges);
            return acc + (carpan?.carpan ?? 0);
          }, 0);
        }
      }

      if (!toplamCarpan) continue;

      let toplam = 0;
      let gecerli = true;

      for (const tarih of gunlukTarihler) {
        const f = satirlar.find(
          (f) =>
            f.oda_tipi === s.oda_tipi &&
            f.konsept === s.konsept &&
            (
              dayjs(tarih).isSame(f.periyot_baslangic) ||
              dayjs(tarih).isAfter(f.periyot_baslangic)
            ) &&
            (
              dayjs(tarih).isSame(f.periyot_bitis) ||
              dayjs(tarih).isBefore(f.periyot_bitis)
            )
        );
        if (!f) {
          gecerli = false;
          break;
        }
        toplam += f.fiyat;
      }

      if (gecerli) {
        const tutar = toplam * toplamCarpan;
        const suffix = String.fromCharCode(97 + altIndex);
        response[`oda_sayisi_tipi_${otelIndex}_${suffix}`] = `${odaSayisi} ${s.oda_tipi}`;
        response[`konsept_${otelIndex}_${suffix}`] = s.konsept;
        response[`toplam_tutar_${otelIndex}_${suffix}`] = `${Math.round(tutar).toLocaleString('tr-TR')} TL`;
        unique.add(comboKey);
        altIndex++;
      }
    }

    otelIndex++;
  }

  res.json(response);
});

app.listen(3001, () => {
  console.log('http://localhost:3001/api/fiyat çalışıyor');
});