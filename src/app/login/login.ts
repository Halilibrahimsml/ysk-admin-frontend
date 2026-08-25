import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth'; 
import { FormsModule } from '@angular/forms'; 
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,      
  imports: [FormsModule, CommonModule], 
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  kullaniciAdi: string = '';
  sifre: string = '';
  
  // ==========================================
  // GÜVENLİK DOĞRULAMASI DEĞİŞKENLERİ
  // ==========================================
  sayi1: number = 0;
  sayi2: number = 0;
  guvenlikCevabi: string = '';
  
  // Sayfa yüklendiğinde otomatik çalışması için Angular'ın ngOnInit metodunu kullanıyoruz
  ngOnInit() {
    this.guvenlikKoduOlustur();
  }

  // 1 ile 10 arasında iki rastgele sayı üretir
  guvenlikKoduOlustur() {
    this.sayi1 = Math.floor(Math.random() * 10) + 1;
    this.sayi2 = Math.floor(Math.random() * 10) + 1;
    this.guvenlikCevabi = ''; // Her yenilendiğinde kutuyu temizle
  }

  // HTTP yerine oluşturduğumuz AuthService'i inject ediyoruz
  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  girisYap() {
    // 0. GÜVENLİK KONTROLÜ (YENİ EKLENDİ)
    const dogruCevap = this.sayi1 + this.sayi2;
    // Eğer girilen cevap doğru sonuca eşit değilse işlemi durdur ve hata ver
    if (parseInt(this.guvenlikCevabi) !== dogruCevap) {
      this.toastGoster("🤖 Hata: Güvenlik doğrulamasını yanlış girdiniz!", "hata");
      this.guvenlikKoduOlustur(); // Yanlış girince sayıları yenile ki botlar ezberleyemesin
      return; 
    }

    // 1. Kontrol: Alanlar boş mu?
    if (!this.kullaniciAdi || !this.sifre) {
      this.toastGoster("⚠️ Lütfen kullanıcı adı ve şifre alanlarını doldurun.", "hata");
      return;
    }

    const loginBilgileri = {
      kullaniciAdi: this.kullaniciAdi,
      sifre: this.sifre
    };

    // 2. İstek: Servisi çağırıyoruz
    this.authService.login(loginBilgileri).subscribe({
      next: (response) => {
        // Artık backend bize içinde rol olan bir obje dönüyor
        if (response && response.rol) {
          
          localStorage.setItem('girisYapildi', 'true'); 
          localStorage.setItem('rol', response.rol); // Rolü de tarayıcının hafızasına kazıdık!

          // Başarılı giriş mesajını göster
          this.toastGoster("✅ Giriş başarılı! Yönlendiriliyorsunuz...", "basari");

          // KAPIYI AYIRIYORUZ: Giren kişi kim?
          // Yönlendirme çok hızlı olmasın, kullanıcı toast mesajını 1 saniye görsün diye setTimeout ekleyebilirsin 
          setTimeout(() => {
            if (response.rol === 'ADMIN') {
              this.router.navigate(['/ogrenciler']); // Admin ise listeye gitsin
            } else if (response.rol === 'OGRENCI') {
              localStorage.setItem('aktifOgrenciNo', this.kullaniciAdi);
              this.router.navigate(['/profilim']);
            } else {
              this.toastGoster("⚠️ Tanımsız bir rol tespit edildi!", "hata");
            }
          }, 800); // 0.8 saniye bekletip yönlendiriyor ki yeşil onay mesajı ekranda görünsün

        } else {
          this.toastGoster("❌ Hata: Sunucudan kullanıcı bilgileri eksik geldi!", "hata");
        }
      },
      error: (err) => {
        // 3. Hata Yönetimi: Spring Boot 401 Unauthorized dönerse bunu yakalıyoruz
        if (err.status === 401) {
          this.toastGoster("❌ Hata: Kullanıcı adı veya şifre hatalı!", "hata");
        } else {
          this.toastGoster("❌ Sunucuya bağlanılamadı. Arka plan (Spring Boot) çalışıyor mu?", "hata");
        }
      }
    });
  }

  // Şifremi unuttum ekranını açıp kapatacak şalter
  sifremiUnuttumModu: boolean = false;

  // Formdan gelecek verileri tutacağımız obje
  resetData = { ogrenciNo: '', yeniSifre: '', yeniSifreTekrar: '' };

  // ==========================================
  // TOAST BİLDİRİMİ İÇİN EKLENEN DEĞİŞKENLER
  // ==========================================
  toastMesaj: string = '';
  toastTip: 'basari' | 'hata' | '' = '';


  toastGoster(mesaj: string, tip: 'basari' | 'hata') {
    this.toastMesaj = mesaj;
    this.toastTip = tip;
  
    this.cdr.detectChanges(); 
    
    setTimeout(() => {
      this.toastMesaj = '';
      this.cdr.detectChanges(); 
    }, 3000);
  }

  // ==========================================
  // ŞİFRE SIFIRLAMA METODU (Otomatik Yönlendirme Eklendi)
  // ==========================================
  sifreSifirla() {
    if (!this.resetData.ogrenciNo || !this.resetData.yeniSifre || !this.resetData.yeniSifreTekrar) {
      this.toastGoster("⚠️ Lütfen öğrenci numarası ve şifre alanlarını doldurun!", "hata");
      return;
    }

    if (this.resetData.yeniSifre !== this.resetData.yeniSifreTekrar) {
      this.toastGoster("⚠️ Girdiğiniz şifreler birbiriyle uyuşmuyor!", "hata");
      return;
    }

    const gidenVeri = {
      kullaniciAdi: this.resetData.ogrenciNo,
      yeniSifre: this.resetData.yeniSifre
    };

    this.http.post('https://ysk-admin-backend-production.up.railway.app/api/auth/sifre-sifirla', gidenVeri, { responseType: 'text' })
      .subscribe({
        next: (cevap: any) => {
          this.toastGoster("✅ Şifreniz başarıyla yenilendi!", "basari");
          
          // KULLANICIYI GİRİŞ EKRANINA ATAN KISIM
          // Kullanıcı mesajı okusun diye 1.5 saniye (1500ms) bekletiyoruz
          setTimeout(() => {
            this.sifremiUnuttumModu = false; 
            this.resetData = { ogrenciNo: '', yeniSifre: '', yeniSifreTekrar: '' }; 
            this.cdr.detectChanges(); // Angular'a ekranı giriş formuna çevirmesini emrediyoruz!
          }, 1500);

        },
        error: (hata: any) => {
          this.toastGoster("❌ Hata: " + hata.error, "hata");
        }
      });
  }
}