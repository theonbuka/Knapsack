# 💰 Knapsack - Finansal Yönetim Uygulaması

Knapsack, modern tasarımı ve güçlü özellikleriyle kişisel ve profesyonel mali yönetimi kolaylaştıran açık kaynak kodlu bir web uygulamasıdır.

## 🎯 Özellikler

- 📊 **Gelişmiş Analitik**: Harcamaları grafikleriyle görselleştir
- 💳 **İşlem Yönetimi**: Tüm gelir, gider ve transferlerini takip et
- 🏦 **Varlık Yönetimi**: Bankaları ve cüzdanları organize et
- 📅 **Takvim Görünümü**: Harcamalarını tarih bazında incele
- ⚙️ **Özelleştirme**: Kategoriler, cüzdanlar ve para birimlerini özelleştir
- ☁️ **Hesap Bazlı Senkronizasyon (Opsiyonel)**: Supabase ile cihazlar arası veri senkronu
- 🌙 **Koyu/Açık Mod**: Gözünü yorma, istediğin tema seç
- 📱 **Mobil Uyumlu**: Telefondan, tablettten, masaüstünden erişebilir
- ⚡ **Hızlı & Hafif**: Vite ile optimize edilmiş performans

## 🛠️ Teknoloji Stack

| Kategori | Teknoloji |
|----------|-----------|
| **Framework** | React 19 |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS 4 |
| **Routing** | React Router v6 |
| **Animasyonlar** | Framer Motion |
| **İkonlar** | Lucide React |
| **Data Storage** | localStorage + opsiyonel Supabase sync |

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn

### Adımlar

```bash
# 1. Repoyu clone et
git clone <repo-url>
cd knapsack-app

# 2. Bağımlılıkları yükle
npm install

# 2.5 Supabase sync kullanacaksan ortam değişkenlerini hazırla (PowerShell)
Copy-Item .env.example .env.local

# 3. Geliştirme sunucusunu başlat
npm run dev

# 4. Tarayıcıda aç
# http://localhost:5173
```

## 📖 Kullanım

### Ana Sayfalar

- **🏠 Anasayfa**: Hızlı özet, son işlemler, bakiye
- **💸 İşlemler**: Tüm gelir/gider işlemlerini yönet
- **💎 Varlıklarım**: Banka hesapları ve cüzdanları yönet
- **📊 Analitik**: Detaylı raporlar ve istatistikler
- **💸 Harcamalar**: Kategori bazlı harcama analizi
- **📅 Takvim**: Tarih bazında işlem görünümü
- **⚙️ Ayarlar**: Tema, para birimi, kategori ve cüzdan ayarları

### Hızlı İşlem Ekleme

Sağ altta "+" butonu ile hızlı işlem ekle modalını aç:
- Türü seç (Gider/Gelir/Transfer)
- Miktar gir
- Para birimi seç
- Kategori belirle
- Notu ekle (opsiyonel)

## 🏗️ Proje Yapısı

```
src/
├── pages/           # Sayfa bileşenleri
├── hooks/           # Custom React hooks (useFinance)
├── utils/           # Sabitler ve yardımcı fonksiyonlar
├── App.tsx          # Ana uygulama bileşeni
├── App.css          # Global stiller
└── main.tsx         # Giriş noktası

public/              # Sabit dosyalar
tests/               # E2E testleri
scripts/             # Yardımcı scriptler
supabase/            # Supabase SQL schema dosyaları
```

## ☁️ Supabase Sync Kurulumu (Opsiyonel)

1. Supabase projesi oluştur.
2. SQL Editor'a `supabase/schema.sql` dosyasındaki scripti yapıştırıp çalıştır.
3. `.env.local` dosyana aşağıdaki alanları gir:

```bash
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
VITE_SUPABASE_SYNC_TABLE=knapsack_user_data
```

Bu alanlar tanımlı değilse uygulama otomatik olarak local-first modda çalışmaya devam eder.

## 📦 Derleme & Deployment

### Geliştirmede
```bash
npm run dev          # HMR ile dev sunucusu
npm run lint         # ESLint çalıştır
```

### Production
```bash
npm run build        # dist/ klasörüne derle
npm run preview      # Derlenmiş sürümü göz at
```

### Vercel'de Deploy
Bu proje otomatik olarak Vercel'e uyumludur. Repoyu bağla ve otomatik deployment aktif olacaktır.

## 🔐 Veri Güvenliği

- Veriler localde şifreli olarak saklanır (local-first)
- Supabase bilgileri tanımlanırsa hesap bazlı snapshot senkronu aktif olur
- Supabase Auth entegrasyonu yoksa table policy seviyesi proje gereksinimine göre ayrıca sertleştirilmelidir

## 🧪 Test Etme

### Unit Tests (Vitest)

```bash
# Tüm testleri çalıştır
npm test

# Watch mode (dosya değişirken otomatik çalış)
npm test -- --watch

# UI modunda testleri göster
npm test:ui

# Coverage raporu oluştur
npm test:coverage
```

Test dosyaları:
- `src/tests/ErrorBoundary.test.tsx` - Hata yönetimi testleri
- `src/tests/useFinance.test.ts` - Hook mantığı testleri
- `src/tests/utils.test.ts` - Utility fonksiyonları testleri

### E2E Tests (Selenium/Python)

```bash
# E2E testleri çalıştır (uçtan uca entegrasyon testleri)
./.venv/Scripts/python.exe tests/e2e/test_knapsack.py
```

## 📝 Lisans

Bu proje açık kaynak kodludur. Detaylar için LICENSE dosyasını kontrol et.

## 🤝 Katkıda Bulunma

Pull request'leri memnuniyetle karşılarız! Önemli değişiklikler için lütfen önce issue açın.

## 💬 İletişim

Sorularınız veya önerileriniz varsa, bir issue açabilirsiniz.

---

**Vercel'de Canlı:** [knapsack-app.vercel.app](https://knapsack-app.vercel.app)
