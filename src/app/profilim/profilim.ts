import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; // 1. Yönlendirme için Router eklendi
import { CommonModule } from '@angular/common'; // <-- 1. BUNU EKLEDİK
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profilim',
  standalone: true,
  imports: [CommonModule, FormsModule], // <-- 2. VE BUNU EKLEDİK
  templateUrl: './profilim.html'
})
export class ProfilimComponent implements OnInit {
  aktifOgrenci: any = {}; 
  notlar: any[] = [];
  tumDersler: any[] = [];
  dersSecimAcik: boolean = false; // Başlangıçta tablo kapalı gelsin
  
  // KİLİT NOKTA: Tarayıcıdaki rolü tutacağımız değişkeni ekledik
  aktifKullaniciRolu: string | null = ''; 

  // 2. Router'ı constructor içine dahil ettik
  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // KİLİT NOKTA 2: Sayfa açılır açılmaz login'den gelen rolü hafızadan çekiyoruz
    this.aktifKullaniciRolu = localStorage.getItem('rol');
    console.log("Tarayıcıdan okunan rol:", this.aktifKullaniciRolu);

    const ogrenciNo = localStorage.getItem('aktifOgrenciNo'); 
    console.log("1. ADIM: Tarayıcı hafızasındaki numara ->", ogrenciNo);
    
    if (ogrenciNo) {
      // 1. ÖĞRENCİ KİŞİSEL BİLGİLERİNİ ÇEKME 
      this.http.get(`https://ysk-admin-backend-production.up.railway.app/api/ogrenciler/numara/${ogrenciNo}`)
        .subscribe({
          next: (veri) => {
            console.log("Backend'den gelen veri ->", veri);
            this.aktifOgrenci = veri; 
            this.cdr.detectChanges();
          },
          error: (hata) => {
            console.error("HATA: Arka plana ulaşılamadı!", hata);
          }
        });

      // 2. YENİ EKLENDİ: ÖĞRENCİ NOTLARINI ÇEKME
      // Senin elindeki http nesnesini kullanarak notları da arka plandan istiyoruz
      this.http.get<any[]>(`https://ysk-admin-backend-production.up.railway.app/api/notlar/ogrenci/${ogrenciNo}`)
        .subscribe({
          next: (gelenNotlar) => {
            console.log("Backend'den gelen notlar ->", gelenNotlar);
            this.notlar = gelenNotlar; // Çekilen notları listemize atadık
            this.cdr.detectChanges(); // Ekrana anında basması için tetikledik
          },
          error: (hata) => {
            console.error("Notlar çekilirken hata oluştu:", hata);
          }
        });
    }
    // Tüm dersleri backend'den çek
    this.http.get('https://ysk-admin-backend-production.up.railway.app/api/dersler/tum-dersler').subscribe((data: any) => {
      this.tumDersler = data;
    });
  }

 
  cikisYap() {
    localStorage.clear(); // Hafızadaki numarayı ve rolü sil
    this.router.navigate(['/login']); // Giriş sayfasına postala
  }
  
  yeniNot: any = { vizeNotu: null, finalNotu: null, ogrenci: {id: 1}, ders: {id: 1} }; // 1 nolu öğrenci/ders örnek

  kaydet() {
    this.http.post('https://ysk-admin-backend-production.up.railway.app/api/notlar/ekle', this.yeniNot).subscribe(() => {
      alert("Not başarıyla kaydedildi!");
      location.reload(); // Sayfayı yenileyip yeni notu tabloda göster
    });
  }

 dersSec(secilenDersId: number) {
    // 1. GÜVENLİK DUVARI: Öğrenci bu dersi daha önce seçmiş mi?
    // Javascript'in 'some' metodu, listede bu şarta uyan tek bir kayıt bile varsa 'true' döner.
    const zatenVarMi = this.notlar.some(not => not.ders?.id === secilenDersId);

    if (zatenVarMi) {
      alert("⚠️ Hata: Bu dersi zaten seçtiniz! Aynı dersi iki kez listenize ekleyemezsiniz.");
      return; // return diyerek fonksiyonu burada kesiyoruz, Spring Boot'a istek GİTMİYOR!
    }

    // 2. GÜVENLİ GEÇİŞ: Eğer ders listede yoksa kayıt işlemine devam et
    const yeniKayit = {
      ogrenci: { id: this.aktifOgrenci.id },
      ders: { id: secilenDersId }
      // Vize ve Final göndermiyoruz, veritabanına boş (null) gidecek
    };

    this.http.post('https://ysk-admin-backend-production.up.railway.app/api/notlar/ekle', yeniKayit).subscribe(() => {
      alert("✅ Derse başarıyla kayıt oldunuz!");
      location.reload(); // Sayfayı yenile ki yeni ders aşağıdaki tabloya düşsün
    });
  }
  // Yeni ders bilgilerini tutacağımız obje
yeniDers: any = { dersKodu: '', dersAdi: '', kredi: null };

// Yeni dersi arka plana (Spring Boot) gönderen fonksiyon
dersEkle() {
  // Alanlar boş mu diye kontrol edelim
  if (!this.yeniDers.dersKodu || !this.yeniDers.dersAdi || !this.yeniDers.kredi) {
    alert("⚠️ Lütfen ders kodu, ders adı ve kredi alanlarını doldurun!");
    return;
  }

  // Spring Boot'a POST isteği atıyoruz (DersController'da /ekle endpointi olduğunu varsayıyoruz)
  this.http.post('https://ysk-admin-backend-production.up.railway.app/api/dersler/ekle', this.yeniDers).subscribe({
    next: () => {
      alert("✅ Yeni ders sisteme başarıyla eklendi!");
      this.yeniDers = { dersKodu: '', dersAdi: '', kredi: null }; // Formu temizle
      location.reload(); // Sayfayı yenile ki ders listeye düşsün
    },
    error: (hata) => {
      console.error("Ders eklenirken hata oluştu:", hata);
      alert("❌ Ders eklenemedi! Arka planda bir hata var.");
    }
  });
}
}