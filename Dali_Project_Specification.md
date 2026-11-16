# DALI --- Product & UI/UX Specification

> **Ürün:** Dali\
> **Ürün tanımı:** Kişisel günlük ve aylık çalışma planı\
> **Slogan önerisi:** Make room for today.\
> **Belge amacı:** Ürünün kapsamını, kullanıcı deneyimini, görsel
> dilini, iş kurallarını, teknik mimarisini ve aşamalı geliştirme
> planını tek bir kaynakta tanımlamak.

------------------------------------------------------------------------

## 1. Ürün vizyonu

Dali; kullanıcının günlerini planlamasını, yapılacaklarını küçük ve
anlaşılır maddeler halinde takip etmesini ve tamamlayamadığı işleri
kaybetmeden sonraki güne taşımasını sağlayan, Windows öncelikli,
minimalist bir kişisel planlama uygulamasıdır.

Dali bir proje yönetim aracı, ekip çalışma platformu veya karmaşık bir
üretkenlik sistemi değildir. Temel vaadi çok nettir:

**Planla. Yap. İşaretle. Kalanı kaybetme.**

Uygulama her açıldığında kullanıcıya zihinsel yük bindirmemeli.
Kullanıcı birkaç saniye içinde bugünkü planını görebilmeli, yeni bir
madde ekleyebilmeli ve tamamladıklarını işaretleyebilmelidir.

### Ürün ilkeleri

1.  **Sadelik özellik sayısından önemlidir.** Bir özellik ancak günlük
    kullanımı gerçekten kolaylaştırıyorsa eklenmelidir.
2.  **İçerik arayüzden önemlidir.** Görevler, takvim ve ilerleme
    göstergeleri görsel süslerden daha fazla alan kaplamalıdır.
3.  **Sakin görsel dil.** Parlak renkler, sert gölgeler, yoğun çizgiler
    ve dikkat dağıtan animasyonlar kullanılmamalıdır.
4.  **Öngörülebilir davranış.** Görevlerin hangi gün görüneceği ve ne
    zaman aktarılacağı kullanıcı için anlaşılır olmalıdır.
5.  **Hızlı etkileşim.** Görev eklemek, tamamlamak, ertelemek ve
    hatırlatıcı kurmak mümkün olduğunca az adımda yapılmalıdır.
6.  **Kullanıcı kontrolü.** Otomatik aktarımlar ve hatırlatıcılar
    kullanıcıyı şaşırtmamalı; ayarları anlaşılır olmalıdır.
7.  **Yerel öncelik.** İlk sürüm internet bağlantısı olmadan da
    güvenilir şekilde çalışmalıdır.
8.  **Genişlemeye hazır mimari.** İleride geliştirilecek masaüstü mini
    widget, ana uygulamanın görev verisini güvenli biçimde
    kullanabilmelidir.

### Hedef platform

-   İlk hedef: Windows 10/11 masaüstü.
-   İlk sürüm: Tek kullanıcı, yerel veri, çevrimdışı kullanım.
-   Gelecek: Windows masaüstü mini widget/companion pencere.
-   İleride değerlendirilebilir: Senkronizasyon ve başka platformlar.
    İlk sürümün kapsamına alınmamalıdır.

------------------------------------------------------------------------

## 2. Teknoloji seçimi

### Önerilen teknoloji yığını

  -----------------------------------------------------------------------
  Katman                  Teknoloji               Gerekçe
  ----------------------- ----------------------- -----------------------
  Masaüstü kabuğu         **Tauri 2**             Hafif, hızlı açılan,
                                                  yerel masaüstü
                                                  yeteneklerine
                                                  erişebilen yapı

  UI                      **React**               Olgun ekosistem,
                                                  bileşen tabanlı
                                                  geliştirme

  Dil                     **TypeScript**          Tip güvenliği ve
                                                  sürdürülebilir veri
                                                  modelleri

  Build/dev               **Vite**                Hızlı geliştirme ve
                                                  modern build süreci

  Stil                    **CSS Modules + CSS     Tasarım kontrolü, izole
                          Variables**             stiller, Tailwind
                                                  bağımlılığı olmadan
                                                  temiz CSS

  İkonlar                 **Lucide**              Tutarlı, ince çizgili,
                                                  sade ikon sistemi

  Veri tabanı             **SQLite**              Yerel, güvenilir,
                                                  internet gerektirmeyen
                                                  veri saklama

  Veri erişimi            Tauri SQLite eklentisi  Veritabanına UI
                          veya kontrollü Rust     dışından güvenli erişim
                          komut katmanı           

  Form doğrulama          Zod                     Görev ve ayar
                                                  verilerinde çalışma
                                                  zamanı doğrulaması

  Tarih işlemleri         date-fns                Tarih ve saat
                                                  işlemlerini kontrollü
                                                  yönetmek

  Bildirim                Tauri notification API  Yerel hatırlatıcı
                          / uygun Windows         bildirimleri
                          bildirim entegrasyonu   

  Test                    Vitest + React Testing  Birim, bileşen ve uçtan
                          Library + Playwright    uca testler
  -----------------------------------------------------------------------

### Neden Tauri 2?

Dali'nin masaüstü uygulaması olması, Windows bildirimleri ve ileride
mini widget benzeri ayrı bir pencere sunması bekleniyor. Tauri, web
teknolojileriyle arayüz geliştirmeyi sürdürürken masaüstü yeteneklerine
erişmeye imkân verir. Electron'a kıyasla daha hafif bir dağıtım hedefi
sunar.

**Önemli:** Windows'un resmi Widgets platformu ile masaüstünde her zaman
görünür mini pencere aynı şey değildir. İlk widget aşamasında Tauri
üzerinden ayrı, küçük, isteğe bağlı olarak üstte kalan bir companion
pencere geliştirmek daha kontrollü bir yoldur. Windows Widgets
entegrasyonu ayrıca teknik araştırma ve ayrı bir faz olarak ele
alınmalıdır. Ürün planında "widget" sözcüğü bu iki seçeneği birbirine
karıştırmamalıdır.

### Mimari yaklaşım

-   UI katmanı React bileşenlerinden oluşmalı.
-   İş kuralları React component'lerinin içine gömülmemeli.
-   Tarih, görev aktarımı, tekrar ve hatırlatıcı hesaplamaları bağımsız
    domain servislerinde bulunmalı.
-   Veri tabanı işlemleri repository katmanı üzerinden yapılmalı.
-   Tauri komutları UI ile yerel sistem arasında kontrollü bir sınır
    oluşturmalı.
-   Widget ileride aynı domain servislerini ve veri katmanını
    kullanmalı; kendi görev kopyalarını tutmamalı.

Önerilen klasör yapısı:

``` text
dali/
├─ src/
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ routes/
│  │  └─ providers/
│  ├─ components/
│  │  ├─ ui/
│  │  ├─ layout/
│  │  ├─ tasks/
│  │  ├─ calendar/
│  │  └─ feedback/
│  ├─ features/
│  │  ├─ today/
│  │  ├─ calendar/
│  │  ├─ reminders/
│  │  ├─ completed/
│  │  └─ settings/
│  ├─ domain/
│  │  ├─ task/
│  │  ├─ date/
│  │  ├─ rollover/
│  │  └─ reminder/
│  ├─ services/
│  ├─ repositories/
│  ├─ hooks/
│  ├─ styles/
│  │  ├─ tokens.css
│  │  ├─ themes.css
│  │  └─ globals.css
│  └─ types/
├─ src-tauri/
│  ├─ src/
│  ├─ capabilities/
│  └─ tauri.conf.json
├─ tests/
└─ README.md
```

------------------------------------------------------------------------

## 3. Marka ve görsel kimlik

### Marka adı

**Dali**

Yazım tercihi: `Dali` veya arayüzde küçük harfli `dali`. Logo bir kelime
işareti ve sade bir sembolden oluşabilir. Karmaşık bir maskot veya
detaylı illüstrasyon kullanılmamalıdır.

### Marka karakteri

-   Sakin
-   Modern
-   Samimi
-   Düzenli
-   Minimal
-   Hafif oyuncu ama çocukça olmayan
-   Premium ama soğuk olmayan

Dali bir kurumsal dashboard gibi görünmemeli. Aynı zamanda aşırı
sevimli, renkli bir mobil oyun arayüzüne de dönüşmemelidir.

### Görsel yön

**Soft minimalism / warm minimalism / quiet productivity**

-   Geniş boşluklar.
-   Net tipografi.
-   Düşük kontrastlı yüzey ayrımları.
-   İnce sınırlar.
-   Az sayıda vurgu rengi.
-   Çok hafif ve kısa geçişler.
-   Büyük, rahat okunur başlıklar.
-   Küçük ve tutarlı ikonlar.
-   Kartların gereksiz yere çoğaltılmaması.

### Renk sistemi

Renkler doğrudan bileşenlere sabit kodlanmamalı; CSS değişkenleri ve
semantik token'lar kullanılmalıdır.

#### Açık tema

  Token                Önerilen renk   Kullanım
  -------------------- --------------- ------------------------
  `--app-bg`           `#F7F7F5`       Ana pencere arka planı
  `--surface`          `#FFFFFF`       İçerik yüzeyi
  `--surface-subtle`   `#F1F1EF`       Hover ve ikincil yüzey
  `--text-primary`     `#252624`       Ana metin
  `--text-secondary`   `#777A75`       İkincil metin
  `--text-tertiary`    `#A1A39E`       Yardımcı metin
  `--border`           `#E9EAE6`       İnce ayırıcılar
  `--accent`           `#8C83D8`       Ana vurgu
  `--accent-soft`      `#F0EDFC`       Vurgu arka planı
  `--success`          `#5D9B7A`       Tamamlandı durumu
  `--warning`          `#C28D55`       Erteleme/uyarı
  `--danger`           `#C66F70`       Silme ve kritik durum

#### Koyu tema

  Token                Önerilen renk   Kullanım
  -------------------- --------------- ------------------------
  `--app-bg`           `#171816`       Ana pencere arka planı
  `--surface`          `#20211F`       İçerik yüzeyi
  `--surface-subtle`   `#292A27`       Hover ve ikincil yüzey
  `--text-primary`     `#F0F0EC`       Ana metin
  `--text-secondary`   `#A5A79F`       İkincil metin
  `--text-tertiary`    `#777A73`       Yardımcı metin
  `--border`           `#333530`       İnce ayırıcılar
  `--accent`           `#A69CEB`       Ana vurgu
  `--accent-soft`      `#302D43`       Vurgu arka planı
  `--success`          `#82B99A`       Tamamlandı durumu
  `--warning`          `#D4A36D`       Erteleme/uyarı
  `--danger`           `#D98585`       Silme ve kritik durum

Bu değerler ilk tasarım token'larıdır. Uygulama içinde gerçek ekranlarda
kontrast kontrolü yapılarak ince ayar yapılmalıdır. Metin ve kontrol
kontrastı erişilebilirlik standartlarını karşılamalıdır.

### Tema davranışı

-   Açık tema
-   Koyu tema
-   Sistem temasını takip et
-   İlk kurulumda varsayılan: Sistem temasını takip et veya açık tema
-   Tema tercihi uygulama yeniden açıldığında korunmalı.
-   Tema değişimi anlık olmalı; sayfa yenilemesi gerektirmemeli.
-   Widget, ana uygulamanın temasını takip etmeli; ileride widget için
    ayrı görünüm tercihi eklenebilir.

### Tipografi

Öncelik: okunabilirlik, netlik ve dengeli karakter aralığı.

Önerilen font sırası:

1.  **Inter** --- birincil öneri.
2.  Segoe UI --- Windows sistem yedeği.
3.  Arial / sans-serif --- genel yedek.

Font dosyaları lisans koşullarına uygun şekilde projeye eklenmeli veya
sistem fontu tercih edilmelidir.

Tipografi kuralları:

-   Başlıklar orta veya semibold ağırlıkta olmalı.
-   Görev metinleri normal ağırlıkta ve rahat okunur olmalı.
-   Gereksiz büyük harf kullanımı yapılmamalı.
-   Uzun metinlerde aşırı ince font ağırlığından kaçınılmalı.
-   Sayısal değerler ve tarihler kolay taranabilir olmalı.
-   Çok küçük metinler kullanılmamalı; yardımcı metinler bile okunabilir
    kalmalı.

Önerilen ölçek:

  Kullanım                  Boyut
  ------------------- -----------
  Ana ekran başlığı     28--32 px
  Sayfa başlığı         22--26 px
  Bölüm başlığı         15--17 px
  Görev metni           14--16 px
  Yardımcı metin        12--13 px
  Küçük metadata        11--12 px

### Köşe yuvarlaklıkları ve gölgeler

-   Ana pencere ve büyük yüzeyler: 14--18 px.
-   Küçük kartlar ve popover'lar: 10--12 px.
-   Butonlar: 9--11 px.
-   Input alanları: 9--11 px.
-   Checkbox: 5--6 px.

Gölge çok hafif olmalı. Katman ayrımı öncelikle arka plan tonları ve
ince border ile sağlanmalıdır. Her öğeye gölge verilmemelidir.

### İkonografi

-   Lucide ikonları kullanılmalı.
-   Çizgi kalınlığı ve boyutları tutarlı olmalı.
-   İkonlar tek başına anlamı belirsiz bir kontrol olarak
    kullanılmamalı; gerekli yerlerde tooltip veya metin etiketi
    bulunmalı.
-   Dekoratif ikon kalabalığından kaçınılmalı.
-   Emoji, ana navigasyon ve görev kontrollerinin yerine kullanılmamalı.

------------------------------------------------------------------------

## 4. Bilgi mimarisi ve navigasyon

Navigasyon küçük ve anlaşılır tutulmalıdır.

### Ana bölümler

1.  **Today** --- varsayılan açılış ekranı.
2.  **Calendar** --- ay görünümü ve gün seçimi.
3.  **Completed** --- tamamlanan görevlerin geçmişi.
4.  **Settings** --- tema, hatırlatıcı, aktarım ve uygulama ayarları.

İlk sürümde ayrı bir dashboard, analytics sayfası, proje alanı, etiket
merkezi veya ekip alanı oluşturulmamalıdır.

### Sol sidebar

-   Üstte küçük Dali logosu.
-   Today ve Calendar ana navigasyon öğeleri.
-   Completed ikincil navigasyon öğesi.
-   En altta Settings.
-   Aktif öğe çok hafif vurgu yüzeyiyle belirtilmeli.
-   Sidebar genişliği yaklaşık 210--230 px olabilir.
-   Dar pencere boyutlarında sidebar kompakt moda geçebilmeli.

### Pencere düzeni

Önerilen masaüstü ana pencere:

-   Sol navigasyon: 220 px civarı.
-   Ana içerik: esnek.
-   Takvim bağlamı: ana içerik içinde veya sağ tarafta dar bir alan.
-   Ana içerik maksimum genişliği kontrol edilmeli; görev listesi
    gereksiz genişlememeli.

Küçük ekranlarda sağ panel alta veya ayrı bir takvim popover'ına
dönüşebilir.

------------------------------------------------------------------------

## 5. Ana ekran: Today

Today ekranı ürünün en önemli ve en sık kullanılan alanıdır. Uygulama
açıldığında doğrudan bugünün görevleri görünmelidir.

### Üst bölüm

-   Tarih: örneğin `Thursday, November 12`.
-   Daha küçük ikincil metin: kısa ve sakin bir ifade.
-   Sağ tarafta gerekiyorsa ay görünümüne geçiş veya takvim açma
    kontrolü.
-   Gereksiz dashboard kartları bulunmamalı.

### Günlük ilerleme

Görev listesi başlığının yanında `2 of 5 completed` gibi sade bir metin
bulunabilir.

İlerleme göstergesi: - İnce ve kısa bir bar olabilir. - Renkli büyük bir
grafik olmamalı. - Yüzde değeri zorunlu değil. - Görev yoksa boş veya
sıfır durumunu nazikçe göstermeli.

### Görev listesi

Her görev satırında:

-   Checkbox.
-   Görev başlığı.
-   İsteğe bağlı hatırlatıcı saati.
-   İsteğe bağlı küçük aktarım etiketi.
-   Hover sırasında beliren düzenleme ve silme kontrolleri.

Görev satırları:

-   Arka planları varsayılan durumda şeffaf olmalı.
-   Satırlar arasında yeterli dikey boşluk bulunmalı.
-   Tamamlanan görevlerde checkbox dolmalı ve metin hafif soluklaşmalı.
-   Tamamlanan görevler otomatik olarak listenin en altına taşınabilir;
    bu davranış tutarlı olmalı.
-   Metin tek satıra sığmazsa doğal şekilde sarılmalı.
-   Satır yüksekliği tıklamayı kolaylaştıracak ölçüde olmalı.

### Görev ekleme

Listenin sonunda sade bir `+ Add a task` satırı bulunmalı.

Tıklanınca: - Satır içinde metin girişi açılabilir veya küçük, sade bir
input görünür. - Enter görevi kaydeder. - Escape girişi iptal eder. -
Boş görev kaydedilmez. - Kaydetme sonrası input tekrar hazır hale
gelir. - Kullanıcı klavyeyle görev ekleyebilmeli.

Görev ekleme için büyük modal zorunlu olmamalıdır.

### Gün sonu hissi

Tüm görevler tamamlandığında abartılı konfeti veya oyunlaştırma
animasyonları yerine küçük, sıcak bir başarı mesajı kullanılabilir.
Kullanıcıyı suçlayan veya eksik görevleri başarısızlık gibi gösteren
metinler kullanılmamalıdır.

------------------------------------------------------------------------

## 6. Takvim ve aylık planlama

Takvim, kullanıcının ay içindeki günleri görmesini ve gelecekteki
günlere görev eklemesini sağlamalıdır.

### Aylık görünüm

-   Pazartesi veya kullanıcının bölgesel ayarına göre haftanın
    başlangıcı.
-   Günler düzenli bir grid içinde gösterilmeli.
-   Ay başlığı ve önceki/sonraki ay kontrolleri sade olmalı.
-   Bugün hafif bir vurgu ile belirtilmeli.
-   Seçili gün, bugünden farklı bir stille gösterilmeli.
-   Geçmiş günler soluklaştırılabilir ancak okunabilir kalmalıdır.
-   Gün hücreleri aşırı bilgiyle doldurulmamalıdır.

### Gün hücreleri

Bir günün altında küçük görev yoğunluğu göstergesi bulunabilir: - Nokta
veya kısa ince çizgi. - Görev sayısı. - Tamamlanma oranı yalnızca
gerekliyse.

Büyük renkli rozetler ve çoklu etiketler kullanılmamalıdır.

### Gün seçimi

-   Gelecek bir güne tıklanınca o günün görev listesi açılır.
-   Bugüne tıklanınca Today görünümüne dönülür.
-   Geçmiş güne tıklanınca geçmiş görevler görüntülenir ancak değişiklik
    yapılamaz.
-   Seçili günün başlığında tarih açıkça yazmalıdır.
-   Gelecek günlerde görev ekleme, düzenleme, silme ve hatırlatıcı
    ayarlama yapılabilir.

### Ay navigasyonu

-   Önceki ay ve sonraki ay arasında geçiş.
-   İstenirse `Today` kısayolu.
-   Ay değiştirirken seçili günün davranışı tutarlı olmalı.
-   Geçmiş aylar salt okunur olmalı.

------------------------------------------------------------------------

## 7. Görev yönetimi ve temel iş kuralları

### Görev alanları

Her görev en az şu alanlara sahip olmalıdır:

-   ID
-   Başlık
-   Planlanan tarih
-   Durum: açık / tamamlandı
-   Oluşturulma zamanı
-   Güncellenme zamanı
-   Tamamlanma zamanı
-   Kaynak görev ID'si (aktarılmış görevler için)
-   Aktarım sayısı
-   İsteğe bağlı not
-   İsteğe bağlı hatırlatıcı zamanı
-   İsteğe bağlı tekrar kuralı

### Görev işlemleri

-   Görev ekleme.
-   Görev düzenleme.
-   Görev tamamlama / tamamlamayı geri alma.
-   Görev silme.
-   Görevi başka bir güne taşıma.
-   Görevi yarına erteleme.
-   Hatırlatıcı ekleme veya kaldırma.
-   İleride tekrar kuralı belirleme.

### Geçmiş günler salt okunur

Kullanıcının yerel tarihine göre geçmişte kalan günler: -
Görüntülenebilir. - Görev başlıkları ve durumları okunabilir. -
Tamamlama durumu değiştirilemez. - Görev eklenemez. - Görev
düzenlenemez. - Görev silinemez. - Görev başka güne taşınamaz.

Bu kural yalnızca arayüzde değil, domain/service katmanında da
doğrulanmalıdır. Böylece bir UI hatası veya alternatif pencere üzerinden
geçmiş veriler değiştirilemez.

Bugün ve gelecek günler düzenlenebilir.

### Otomatik ertesi güne aktarma

Dali'nin temel davranışlarından biri budur.

Örnek: - 12 Kasım'da üç görev var. - Bir görev tamamlandı. - İki görev
tamamlanmadı. - Kullanıcı 13 Kasım'da uygulamayı açtığında iki açık
görev 13 Kasım listesinde görünür.

#### Aktarım kuralları

1.  Yalnızca tamamlanmamış görevler aktarılır.
2.  Tamamlanmış görevler geçmiş günlerinde kalır.
3.  Aktarım, uygulama gece açık kalmadı diye kaybolmamalıdır. Uygulama
    yeniden açıldığında da kontrol edilmelidir.
4.  Aynı görev aynı gün için birden fazla kez oluşturulmamalıdır.
5.  Aktarılan görevlerin kaynak görev ilişkisi korunmalıdır.
6.  Görev geçmişi ve aktarım sayısı tutulmalıdır.
7.  Kullanıcı aktarılmış görevi silebilir veya başka bir güne
    taşıyabilir.
8.  Görev aktarımı sessiz ve anlaşılır olmalı; her gün kullanıcıdan onay
    istememelidir.
9.  Kullanıcı ayarlardan otomatik aktarımı kapatabilmelidir.
10. Otomatik aktarım kapalıysa açık görevler önceki günlerinde kalır;
    kullanıcı isterse manuel taşıyabilir.

#### Önemli tasarım kararı: Görev kopyalama mı, tarih güncelleme mi?

Öneri: Görev kimliğini koruyarak görevin planlanan tarihini bir sonraki
güne güncellemek ve aktarım geçmişini ayrı bir kayıt olarak tutmak.

Bunun avantajları: - Aynı görevin birden fazla kopyası oluşmaz. - Görev
geçmişi takip edilebilir. - Widget ve ana uygulama aynı görevi görür. -
Tekrarlı aktarım kontrolü daha kolay olur.

Aktarım geçmişi kullanıcıya istenirse `Moved from Nov 12` gibi küçük bir
açıklamayla gösterilebilir. Her satırda sürekli etiket göstermek zorunlu
değildir.

#### Aktarım zamanı

-   Varsayılan kontrol: Yerel takvim günü değiştiğinde ve uygulama
    açıldığında.
-   Kullanıcı ayarlardan aktarım saatini belirleyebilir.
-   Uygulama kapalıyken de güvenilir davranış için açılışta son kontrol
    edilen tarih ile bugünün tarihi karşılaştırılmalıdır.
-   Birkaç gün uygulama açılmadıysa açık görevler yalnızca bir kez,
    bugüne veya sıradaki uygun güne taşınmalıdır. Gün gün
    kopyalanmamalıdır.
-   Çok gün atlanmışsa davranış deterministik olmalıdır ve test
    edilmelidir.

### Görev sıralaması

-   Varsayılan: Kullanıcının ekleme sırası.
-   Kullanıcı sürükle-bırak ile sıralamayı değiştirebilir.
-   Tamamlanan görevler en alta alınabilir.
-   Widget'ta aynı sıralama korunmalıdır.
-   Sıralama verisi kalıcı saklanmalıdır.

------------------------------------------------------------------------

## 8. Hatırlatıcılar ve bildirimler

Hatırlatıcılar faydalı olmalı ancak uygulamayı bildirim yağmuruna
çevirmemelidir.

### Görev hatırlatıcısı

Kullanıcı bir göreve isteğe bağlı saat ekleyebilir.

Örnek: - `15:30 — Müşteriyle görüş` - `19:00 — İngilizce çalış`

Hatırlatıcı ayarlama: - Görev eklerken opsiyonel olarak seçilebilir. -
Sonradan görev düzenleme alanından eklenebilir. - Tek tıkla
kaldırılabilir. - Tarih ve saat, kullanıcının yerel saat dilimine göre
saklanmalıdır. - Geçmiş tarihli hatırlatıcı oluşturulamaz.

### Bildirim davranışı

-   Bildirimler Windows yerel bildirim sistemi üzerinden
    gösterilmelidir.
-   Bildirim metni kısa olmalıdır.
-   Bildirime tıklanınca Dali açılmalı ve ilgili gün/görev
    gösterilmelidir.
-   Aynı hatırlatıcı tekrar tekrar gönderilmemelidir.
-   Uygulama kapalıyken hatırlatıcıların çalışması için işletim sistemi
    zamanlayıcısı/arka plan davranışı teknik olarak doğrulanmalıdır.
-   Windows izinleri ve bildirim ayarları kullanıcıya açıkça
    anlatılmalıdır.

### Bildirim ayarları

-   Tüm hatırlatıcıları aç/kapat.
-   Varsayılan hatırlatma tercihi.
-   Sessiz saatler.
-   Bildirim önizlemesi.
-   Windows bildirim izninin durumu.

### İleride eklenebilecek hatırlatıcı seçenekleri

-   Görev saatinde bildir.
-   5/10/15 dakika önce bildir.
-   Tekrarlanan görev için her gerçekleşmede hatırlat.
-   Sessiz saatlerde bildirimi ertele.

İlk sürümde gelişmiş bildirim senaryoları yerine tek görev + tek saat
hatırlatıcısı yeterlidir.

------------------------------------------------------------------------

## 9. Tekrarlanan görevler

Bu özellik ilk sürümde temel seviyede veya ikinci fazda eklenebilir.

Örnekler: - Her gün - Hafta içi - Her hafta belirli günler - Her ay
belirli bir gün

Tekrarlanan görev ile ertelenen görev birbirine karıştırılmamalıdır.

-   Tekrarlanan görev, yeni bir planlı gerçekleşme oluşturur.
-   Ertelenen görev, aynı işin tamamlanmadığı için ileri tarihe
    taşınmasıdır.
-   Bir tekrarın tamamlanması sonraki tekrarları tamamlamamalıdır.
-   Tekrar kuralı durdurulabilir veya düzenlenebilir.

İlk sürümde kapsamı küçük tutmak için günlük ve haftalık tekrar
yeterlidir.

------------------------------------------------------------------------

## 10. Completed ekranı ve geçmiş

Completed alanı tamamlanan işleri bulmak için vardır; bir performans
raporu gibi davranmamalıdır.

### Görünüm

-   Tarihe göre gruplandırılmış tamamlanan görevler.
-   Günlük/haftalık filtre.
-   Görev adıyla arama.
-   Tamamlanma tarihi.
-   İsteğe bağlı görev notu.

Geçmiş günlerin salt okunur olması bu ekranı da kapsamalıdır. Kullanıcı
tamamlanan görevleri geçmişte düzenleyememelidir.

### İstatistikler

İlk sürümde yalnızca hafif bilgiler: - Bugün tamamlanan görev sayısı. -
Bu ay tamamlanan görev sayısı. - Günlük tamamlanma oranı.

Seri (streak), puan, rozet ve rekabetçi oyunlaştırma ilk sürüme
eklenmemelidir. Dali kullanıcıyı suçluluk veya baskı hissettirmemelidir.

------------------------------------------------------------------------

## 11. Gelecek faz: Windows masaüstü widget

Widget, ürünün önemli bir genişleme alanıdır. İlk sürümde mimari buna
uygun hazırlanmalı; ancak widget geliştirmesi ana uygulamanın temel
görev deneyimini geciktirmemelidir.

### Widget amacı

Kullanıcı masaüstünde çalışırken ana pencereyi açmadan: - Bugünün
görevlerini görebilmeli. - Görevi tamamlayabilmeli. - Yeni görev
ekleyebilmeli. - İlerlemeyi görebilmeli. - Ana uygulamaya
geçebilmelidir.

### Görsel tasarım

Widget ana uygulamanın küçültülmüş kopyası gibi olmamalıdır. Daha
kompakt ve odaklı olmalıdır.

Önerilen içerik: - Küçük `dali` wordmark. - Bugünün tarihi. -
`Today's focus` gibi kısa başlık. - 3--5 görev satırı. - İnce ilerleme
göstergesi. - `Open Dali` kontrolü.

### Widget boyutları

İlk tasarım hedefleri: - Kompakt: yaklaşık 300 × 360 px. - Geniş:
yaklaşık 360 × 500 px.

Boyutlar gerçek Windows DPI ve pencere davranışıyla test edilmelidir.

### Widget etkileşimleri

-   Checkbox ile görevi tamamla.
-   Yeni görev ekle.
-   Uzun görev adlarını düzgün göster.
-   Tamamlanan görevi sade biçimde ayırt et.
-   Ana uygulamayı aç.
-   İsteğe bağlı sabitleme/üstte tutma.

### Teknik yaklaşım

İlk uygulanabilir yol: - Tauri içinde ayrı bir mini pencere. - Ana
uygulamayla aynı SQLite verisi. - Aynı domain servisleri. - Pencere
boyutu, konumu ve görünürlük tercihi. - Ana uygulama ve widget arasında
veri güncellemesi. - Uygulama kapatıldığında widget'ın davranışı açıkça
tanımlanmalı.

Windows'un resmi Widgets altyapısı ayrı bir entegrasyon projesi olarak
incelenmelidir. Resmi widget platformu ile bağımsız masaüstü mini
pencere farklı teknik ve dağıtım gereksinimlerine sahiptir.

### Widget için kritik mimari gereksinimler

-   Veri kaynağı tek olmalı.
-   Aynı görevin iki farklı kopyası tutulmamalı.
-   Ana uygulamada yapılan değişiklik widget'a yansıtılmalı.
-   Widget'ta yapılan değişiklik ana uygulamaya yansıtılmalı.
-   Tema uyumlu olmalı.
-   Klavye ve ekran okuyucu erişilebilirliği korunmalı.
-   Widget kapatıldığında görev verisi etkilenmemeli.

------------------------------------------------------------------------

## 12. Ayarlar

Ayarlar sayfası kısa, gruplandırılmış ve anlaşılır olmalıdır.

### Görünüm

-   Tema: Sistem / Açık / Koyu.
-   Uygulama başlangıç ekranı: Today.
-   Tarih biçimi.
-   Haftanın ilk günü.
-   Saat biçimi: 12 / 24 saat.

### Görevler

-   Otomatik aktarım: Açık / Kapalı.
-   Aktarım zamanı.
-   Tamamlanan görevleri listenin altına taşı.
-   Varsayılan görev sıralaması.

### Hatırlatıcılar

-   Bildirimleri etkinleştir.
-   Sessiz saatler.
-   Varsayılan hatırlatma davranışı.

### Uygulama

-   Windows açılışında başlat.
-   Widget tercihi (widget fazında).
-   Verileri dışa aktar.
-   Verileri içe aktar.
-   Hakkında ve sürüm bilgisi.

Ayarlar içinde tehlikeli veya geri dönüşü zor işlemler açık onay
gerektirmelidir. Tüm verileri silme işlemi ayrı ve belirgin bir onay
adımı içermelidir.

------------------------------------------------------------------------

## 13. UX ayrıntıları ve etkileşim kuralları

### Genel etkileşim ilkeleri

-   Birincil işlem her ekranda açıkça anlaşılmalı.
-   İkincil işlemler gerektiğinde görünmeli.
-   Hover kontrolleri klavye ile de erişilebilir olmalı.
-   Sağ tık menüsü temel işlemlerin tek yolu olmamalı.
-   Kullanıcıya her işlemde modal gösterilmemeli.
-   Silme gibi geri dönüşü zor işlemlerde sade bir onay kullanılmalı.
-   Kaydetme işlemleri mümkünse otomatik ve anlık olmalı.
-   Hata mesajları kısa, anlaşılır ve çözüm odaklı olmalı.

### Klavye kısayolları

  Kısayol      İşlem
  ------------ ----------------------------------------
  `Ctrl + N`   Yeni görev ekle
  `Ctrl + 1`   Today
  `Ctrl + 2`   Calendar
  `Ctrl + 3`   Completed
  `Ctrl + ,`   Settings
  `Enter`      Görev girişini kaydet
  `Escape`     Girişi iptal et / popover kapat
  `Delete`     Seçili görevi sil (onay akışına bağlı)

Kısayollar Windows ile çakışma ve erişilebilirlik açısından test
edilmelidir.

### Animasyonlar

-   Hover: 100--150 ms.
-   Panel ve popover geçişi: 150--200 ms.
-   Checkbox: 120--180 ms.
-   Sayfa geçişleri çok hafif olmalı.
-   Büyük ölçekli animasyon, parallax ve sürekli hareket kullanılmamalı.
-   `prefers-reduced-motion` ve uygulama içi hareket azaltma tercihi
    desteklenmelidir.

### Boş durumlar

Boş ekranlar hata gibi görünmemelidir.

Örnekler: - Bugün görev yok:
`Bugün için planın boş. İstersen küçük bir şey ekle.` - Takvimde seçili
gün boş: `Bu gün için henüz bir plan yok.` - Completed boş:
`Tamamladığın görevler burada görünecek.` - Arama sonucu yok:
`Bu aramayla eşleşen görev bulunamadı.`

Metinler sakin, kısa ve yargılayıcı olmayan bir tonda olmalıdır.

### Hata ve geri bildirim

-   Görev kaydedilemezse kullanıcıya açık mesaj verilmeli.
-   Veri tabanı hatasında veri kaybı yaşanmamalı.
-   Bildirim izni yoksa ayarlara yönlendiren kısa açıklama gösterilmeli.
-   Aktarım işlemi başarısızsa tekrar denenebilmeli.
-   Kullanıcının girdiği görev metni beklenmedik şekilde kaybolmamalı.

------------------------------------------------------------------------

## 14. Veri modeli

Başlangıç için örnek ilişkisel model:

### `tasks`

  Alan                   Tür           Açıklama
  ---------------------- ------------- -------------------------------------
  `id`                   TEXT / UUID   Birincil anahtar
  `title`                TEXT          Görev adı
  `notes`                TEXT NULL     İsteğe bağlı not
  `scheduled_date`       TEXT          Yerel plan tarihi, ISO `YYYY-MM-DD`
  `status`               TEXT          `open` veya `completed`
  `sort_order`           INTEGER       Gün içi sıralama
  `created_at`           TEXT          Oluşturulma zamanı
  `updated_at`           TEXT          Güncellenme zamanı
  `completed_at`         TEXT NULL     Tamamlanma zamanı
  `source_task_id`       TEXT NULL     Aktarılan görevin kaynak ilişkisi
  `rollover_count`       INTEGER       Kaç kez aktarıldığı
  `reminder_at`          TEXT NULL     Hatırlatıcı zamanı
  `recurrence_rule_id`   TEXT NULL     Tekrar kuralı

### `task_events`

Görev hareketlerinin geçmişini tutar.

  -----------------------------------------------------------------------
  Alan                    Tür                     Açıklama
  ----------------------- ----------------------- -----------------------
  `id`                    TEXT / UUID             Birincil anahtar

  `task_id`               TEXT                    İlgili görev

  `event_type`            TEXT                    created, completed,
                                                  reopened, moved,
                                                  rolled_over, deleted

  `from_date`             TEXT NULL               Önceki tarih

  `to_date`               TEXT NULL               Yeni tarih

  `created_at`            TEXT                    Olay zamanı

  `metadata`              TEXT NULL               Gerekirse ek JSON
  -----------------------------------------------------------------------

### `app_settings`

-   `key`
-   `value`
-   `updated_at`

### `recurrence_rules` (tekrar özelliği eklendiğinde)

-   `id`
-   `frequency`
-   `interval`
-   `weekdays`
-   `start_date`
-   `end_date`
-   `is_active`

Veri modeli, tarih ve saat işlemlerinde yerel saat dilimi ile UTC zaman
damgasını karıştırmamalıdır. Plan tarihi bir takvim günüdür; hatırlatıcı
ise belirli bir yerel saat anıdır. Bu iki kavram ayrı tutulmalıdır.

------------------------------------------------------------------------

## 15. Tarih, saat ve güvenilirlik

Tarih mantığı uygulamanın en kritik teknik alanlarından biridir.

-   Kullanıcının yerel tarihine göre bugün belirlenmelidir.
-   `YYYY-MM-DD` plan tarihi olarak kullanılmalıdır.
-   Hatırlatıcılar saat dilimi bilgisiyle güvenli biçimde
    yönetilmelidir.
-   Yaz saati değişimleri test edilmelidir.
-   Gece yarısı geçişleri test edilmelidir.
-   Bilgisayar uyku modundan döndüğünde geçmiş hatırlatıcılar toplu
    bildirim olarak gönderilmemelidir.
-   Sistem tarihi geriye alınırsa geçmiş gün kilidi ve aktarım davranışı
    kontrollü olmalıdır.
-   Uygulama ilk açıldığında son aktarım kontrolü doğrulanmalıdır.

### Gün değişimi iş akışı

1.  Yerel bugünün tarihi belirlenir.
2.  En son kontrol edilen tarih okunur.
3.  Arada gün değişimi varsa aktarım kuralları çalıştırılır.
4.  Her görev için idempotency kontrolü yapılır.
5.  İşlem ve kontrol tarihi transaction içinde güvenli şekilde
    kaydedilir.
6.  UI yeni günün verisini yeniler.

Bu akış tekrar çalıştırıldığında aynı görevi iki kere aktarmamalıdır.

------------------------------------------------------------------------

## 16. Güvenlik, gizlilik ve veri koruma

-   İlk sürümde kullanıcı hesabı zorunlu olmamalıdır.
-   Görevler varsayılan olarak yerel cihazda saklanmalıdır.
-   Gereksiz telemetri veya davranış takibi eklenmemelidir.
-   Veritabanı yazma işlemleri transaction kullanmalıdır.
-   Veri tabanı şeması migration ile yönetilmelidir.
-   Uygulama kapanırken bekleyen yazma işlemleri güvenli biçimde
    tamamlanmalıdır.
-   Dışa aktarma kullanıcı kontrolünde olmalıdır.
-   Yedekleme ve geri yükleme senaryoları test edilmelidir.
-   Hassas görev metinleri log dosyalarına yazılmamalıdır.

------------------------------------------------------------------------

## 17. Erişilebilirlik

-   Klavye ile tüm ana işlemler yapılabilmeli.
-   Görünür focus state bulunmalı.
-   Checkbox ve ikon butonlarının erişilebilir isimleri olmalı.
-   Metin kontrastı yeterli olmalı.
-   Sadece renkle durum anlatılmamalı.
-   Ekran okuyucu etiketleri eklenmeli.
-   Tıklama alanları rahat kullanılabilecek büyüklükte olmalı.
-   Hareket azaltma tercihi desteklenmeli.
-   Açık ve koyu temada kontrast ayrı ayrı doğrulanmalı.

------------------------------------------------------------------------

## 18. Performans ve kalite hedefleri

-   Uygulama hızlı açılmalı.
-   Today ekranı yerel veriden gecikmesiz yüklenmeli.
-   Checkbox etkileşimi anında geri bildirim vermeli.
-   Takvim ay değişimlerinde takılma olmamalı.
-   Görev listesi büyüdüğünde performans korunmalı.
-   Widget ana uygulamadan bağımsız olarak veri tutarsızlığı üretmemeli.
-   Uygulama çevrimdışı çalışabilmeli.
-   Beklenmeyen kapanma sonrası veriler bozulmamalı.

### Test senaryoları

Özellikle şu durumlar otomatik test edilmelidir:

1.  Bugüne görev ekleme.
2.  Gelecek güne görev ekleme.
3.  Geçmiş güne görev ekleme girişiminin engellenmesi.
4.  Geçmiş görev düzenleme ve silme girişiminin engellenmesi.
5.  Görev tamamlama ve tamamlamayı geri alma.
6.  Gün değişiminde açık görevin aktarılması.
7.  Tamamlanmış görevin aktarılmaması.
8.  Aynı aktarımın iki kez çalıştırıldığında kopya oluşturmaması.
9.  Uygulama birkaç gün kapalı kaldığında aktarım.
10. Otomatik aktarım kapalıyken davranış.
11. Hatırlatıcının doğru zamanda çalışması.
12. Bildirim izni verilmediğinde uygun geri bildirim.
13. Koyu/açık tema tercihlerinin korunması.
14. Widget ve ana pencerenin aynı veriyi göstermesi.
15. Saat dilimi ve yaz saati geçişleri.

------------------------------------------------------------------------

## 19. Geliştirme fazları

### Faz 0 --- Temel kurulum ve tasarım sistemi

-   Tauri 2 + React + TypeScript + Vite kurulumu.
-   CSS Modules ve CSS variable token sistemi.
-   Açık/koyu tema altyapısı.
-   Tipografi ve ikon sistemi.
-   Ana pencere iskeleti.
-   SQLite bağlantısı ve migration altyapısı.

**Çıkış kriteri:** Uygulama iki temada açılır, ana pencere düzeni
hazırdır ve veri katmanı çalışır.

### Faz 1 --- MVP görev deneyimi

-   Today ekranı.
-   Görev ekleme, düzenleme, tamamlama ve silme.
-   Aylık takvim.
-   Gelecek güne görev ekleme.
-   Geçmiş günleri salt okunur görüntüleme.
-   Görev sıralaması.
-   Otomatik ertesi güne aktarım.
-   Aktarım geçmişi ve idempotency kontrolü.
-   Yerel veri saklama.

**Çıkış kriteri:** Kullanıcı bir ay boyunca günlük planını veri kaybı
veya çift aktarım olmadan yönetebilir.

### Faz 2 --- Hatırlatıcılar ve kullanım kalitesi

-   Görev bazlı hatırlatıcı.
-   Windows bildirimleri.
-   Bildirim izinleri ve ayarları.
-   Sessiz saatler.
-   Klavye kısayolları.
-   Completed ekranı.
-   Veri dışa aktarma ve yedekleme.

**Çıkış kriteri:** Hatırlatıcılar ve temel geçmiş işlevleri güvenilir
biçimde çalışır.

### Faz 3 --- Windows mini widget

-   Ayrı mini pencere.
-   Kompakt görev listesi.
-   Widget üzerinden tamamlama.
-   Widget üzerinden görev ekleme.
-   Ana uygulama ile veri senkronizasyonu.
-   Tema uyumu.
-   Pencere konumu ve boyut tercihi.
-   Açılışta başlatma davranışının değerlendirilmesi.

**Çıkış kriteri:** Kullanıcı ana uygulamayı açmadan masaüstünden günlük
görevlerini yönetebilir.

### Faz 4 --- İyileştirmeler

-   Tekrarlanan görevler.
-   Daha gelişmiş filtreleme.
-   Küçük aylık istatistikler.
-   İsteğe bağlı yedekleme/senkronizasyon araştırması.
-   Resmi Windows Widgets entegrasyonunun teknik değerlendirmesi.

Bu fazlar tamamlanmadan yeni özellik eklemek yerine mevcut akışların
kararlılığı ve tasarım kalitesi iyileştirilmelidir.

------------------------------------------------------------------------

## 20. MVP dışında tutulacaklar

İlk sürümde özellikle eklenmemesi gerekenler:

-   Takım ve ekip yönetimi.
-   Proje/workspace sistemi.
-   Karmaşık etiket ve kategori yönetimi.
-   Kanban panosu.
-   Pomodoro sistemi.
-   Not alma uygulaması özellikleri.
-   Sohbet veya sosyal özellikler.
-   Yapay zekâ asistanı.
-   Karmaşık grafikler ve dashboard.
-   Puan, rozet ve rekabetçi streak sistemi.
-   Çok seviyeli görev ve alt görev hiyerarşisi.

Bunlar Dali'nin temel vaadini zayıflatabilir. İleride gerçek kullanıcı
ihtiyacı oluşursa tekrar değerlendirilebilir.

------------------------------------------------------------------------

## 21. Tasarım kalite kontrol listesi

Her ekran tamamlandığında kontrol et:

-   [ ] İlk bakışta ne yapılacağı anlaşılıyor mu?
-   [ ] Gereksiz buton veya ikon var mı?
-   [ ] Ana işlem kolayca bulunuyor mu?
-   [ ] Metinler yeterince büyük ve okunaklı mı?
-   [ ] Boşluklar dengeli mi?
-   [ ] Renkler sakin ve tutarlı mı?
-   [ ] Açık tema premium görünüyor mu?
-   [ ] Koyu tema aynı tasarım kalitesini koruyor mu?
-   [ ] Hover ve focus durumları tasarlanmış mı?
-   [ ] Küçük pencere boyutlarında düzen bozuluyor mu?
-   [ ] Klavye ile kullanılabiliyor mu?
-   [ ] Gereksiz modal açılıyor mu?
-   [ ] Animasyonlar dikkat dağıtıyor mu?
-   [ ] Ekran gerçek görevlerle test edildi mi?

**Kırmızı çizgi:** Bir tasarım öğesi yalnızca güzel göründüğü için
eklenmemeli. Kullanıcıya net bir fayda sağlamıyorsa kaldırılmalıdır.

------------------------------------------------------------------------

## 22. AI ile geliştirme için çalışma talimatları

Bu belge, Dali geliştirmesinde ana ürün referansı olarak
kullanılmalıdır.

Kod üreten AI veya geliştirici şu kurallara uymalıdır:

1.  Önce mimariyi ve veri modelini anla; doğrudan rastgele component
    üretmeye başlama.
2.  İş kurallarını UI bileşenlerinden ayrı tut.
3.  Her özelliği küçük ve test edilebilir parçalara böl.
4.  Tasarım token'ları dışında rastgele renk ve spacing değeri üretme.
5.  CSS Modules ve CSS Variables yaklaşımını koru.
6.  Gereksiz UI kütüphaneleri ekleme.
7.  Her ekranı hem açık hem koyu temada tamamla.
8.  Görev aktarımını test etmeden tamamlandı sayma.
9.  Geçmiş gün salt okunur kuralını hem UI hem domain katmanında uygula.
10. Widget için ayrı ve ikinci bir veri kaynağı oluşturma.
11. Kullanıcıya görünen metinleri kısa ve doğal tut.
12. Tasarımda büyük, karmaşık butonlardan ve yoğun kart düzenlerinden
    kaçın.
13. Yeni bağımlılık eklemeden önce gerçekten gerekli olup olmadığını
    değerlendir.
14. Her faz sonunda test, hata kontrolü ve görsel kalite kontrolü yap.
15. Bu dokümandaki ürün ilkeleriyle çelişen özellikleri sessizce ekleme;
    önce kapsamı değerlendir.

### Geliştirme sırası

1.  Proje iskeleti ve tasarım token'ları.
2.  Ana pencere ve navigasyon.
3.  Today ekranı.
4.  Görev CRUD işlemleri.
5.  SQLite veri katmanı.
6.  Aylık takvim.
7.  Geçmiş gün kilidi.
8.  Otomatik görev aktarımı ve testleri.
9.  Hatırlatıcılar ve Windows bildirimleri.
10. Completed ve ayarlar.
11. Widget için mimari hazırlık ve ayrı geliştirme fazı.

------------------------------------------------------------------------

## 23. Nihai ürün hissi

Dali açıldığında kullanıcı bir yönetim paneline girmiş gibi
hissetmemeli. Temiz, sakin ve kendisine ait küçük bir çalışma alanına
girmiş gibi hissetmelidir.

Ekranda yalnızca gerçekten ihtiyaç duyduğu şeyler olmalı:

-   Bugünün tarihi.
-   Yapılacaklar.
-   Tamamlananlar.
-   Yeni görev ekleme.
-   Takvime ulaşma.
-   İlerleme.

Açık tema ferah, sıcak ve aydınlık; koyu tema derin, yumuşak ve göz
yormayan bir karakter taşımalıdır.

Dali'nin tasarım başarısı çok sayıda özellik göstermesinde değil, en sık
yapılan üç işi kusursuzlaştırmasında yatıyor:

**Görev eklemek. Görevi tamamlamak. Tamamlanmayanı kaybetmemek.**

Bu üç deneyim hızlı, güvenilir ve görsel olarak çok temiz olduğunda Dali
amacına ulaşmış demektir.
