import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Ogrenci, OgrenciService } from '../ogrenci.service';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; 
import { CommonModule } from '@angular/common'; 


@Component({
  selector: 'app-ogrenci-liste',
  standalone: true,
  imports: [FormsModule, CommonModule], 
  templateUrl: './ogrenci-liste.html',
  styleUrl: './ogrenci-liste.css'
})
export class OgrenciListeComponent implements OnInit {
  ogrenciler: Ogrenci[] = [];
  
  formAcik: boolean = false;
  aktifleriGoster: boolean = true;
  aramaMetni: string = '';
  islemGorenOgrenci: Ogrenci = { isim: '', soyisim: '', ogrenciNo: '' };
  // ==========================================
  // DASHBOARD İSTATİSTİK VERİLERİ
  // ==========================================
  istatistikler = {
    toplam: 0,
    aktif: 0,
    pasif: 0,
    yeni: 0
  };
  // ==========================================
  // SIDEBAR (YAN MENÜ) DEĞİŞKENLERİ VE METODU
  // ==========================================
  sidebarAcik: boolean = false;

  sidebarAcKapat() {
    this.sidebarAcik = !this.sidebarAcik;
  }
  istatistikleriGuncelle() {
    // 1. Aktif öğrencileri çekip sayısını alıyoruz
    this.ogrenciService.getOgrenciler().subscribe(aktifListesi => {
      this.istatistikler.aktif = aktifListesi.length;
      
      // 2. Pasif (silinmiş) öğrencileri çekip sayısını alıyoruz
      this.ogrenciService.pasifOgrencileriGetir().subscribe(pasifListesi => {
        this.istatistikler.pasif = pasifListesi.length;
        
        // 3. Toplamı hesaplıyoruz
        this.istatistikler.toplam = this.istatistikler.aktif + this.istatistikler.pasif;
        this.istatistikler.yeni = this.istatistikler.toplam > 3 ? 3 : this.istatistikler.toplam;
        
        // Değişiklikleri ekrana yansıt
        this.cdr.detectChanges();
      });
    });
  }

  // YENİ EKLENEN DEĞİŞKENLER (Admin Ders/Not İşlemleri için)
  tumDersler: any[] = [];
  yeniDers: any = { dersKodu: '', dersAdi: '', kredi: null };
  yeniNot: any = { vizeNotu: null, finalNotu: null, ogrenci: { id: null }, ders: { id: null } };

  constructor(
    private ogrenciService: OgrenciService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private http: HttpClient 
  ) {}

  ngOnInit(): void {
    this.listele(); 
    
    // ÇÖZÜM BURADA: Sadece (data) yazan yeri (data: any) olarak değiştirdik!
    this.http.get('https://ysk-admin-backend-production.up.railway.app/api/dersler/tum-dersler').subscribe((data: any) => {
      this.tumDersler = data;
    });
  }

  // ==========================================
  // YENİ: DERS VE NOT EKLEME FONKSİYONLARI
  // ==========================================
  dersEkle() {
  if (!this.yeniDers.dersKodu || !this.yeniDers.dersAdi || !this.yeniDers.kredi) {
  this.toastGoster("⚠️ Lütfen ders kodu, ders adı ve kredi alanlarını doldurun!", "hata");
    return;
  }
  
  this.http.post('https://ysk-admin-backend-production.up.railway.app/api/dersler/ekle', this.yeniDers).subscribe({
    next: () => {
      this.toastGoster("✅ Yeni ders sisteme başarıyla eklendi!", "basari");
      this.yeniDers = { dersKodu: '', dersAdi: '', kredi: null }; // Formu temizle
      this.ngOnInit(); // Açılır listeyi (dropdown) güncelle
    },
    error: (hata) => {
      // İŞTE BURASI BİZE NE OLDUĞUNU SÖYLEYECEK
      console.error("Backend'den dönen hata:", hata);
      this.toastGoster("❌ Hata! Ders eklenemedi. Sebebi için F12 (Console) ekranına bak.", "hata");
    }
  });
}

  notKaydet() {
    if (!this.yeniNot.ogrenci.id || !this.yeniNot.ders.id) {
      this.toastGoster("⚠️ Lütfen açılır listeden öğrenci ve ders seçiniz!", "hata");
      return;
    }

    // 1. Önce seçilen öğrencinin numarası lazım 
    const secilenOgrenci = this.ogrenciler.find(o => o.id === this.yeniNot.ogrenci.id);

    if (secilenOgrenci) {
      // 2. Öğrencinin MEVCUT notlarını arka plandan çekiyoruz 
      this.http.get<any[]>(`https://ysk-admin-backend-production.up.railway.app/api/notlar/ogrenci/${secilenOgrenci.ogrenciNo}`).subscribe(mevcutNotlar => {
        
        // 3. Admin'in seçtiği ders, bu öğrencinin mevcut notları arasında var mı?
        const oncedenAlinmisNot = mevcutNotlar.find(n => n.ders?.id === this.yeniNot.ders.id);

        if (oncedenAlinmisNot) {
          // VARSA: Mevcut notun ID'sini bizim form verisine ekliyoruz.
          // Spring Boot JPA, içinde 'id' olan bir veri gelirse YENİ SATIR AÇMAZ, GÜNCELLEME YAPAR!
          this.yeniNot.id = oncedenAlinmisNot.id;
        } else {
          // YOKSA: İçinde kazara id kalmışsa siliyoruz ki Spring Boot yepyeni bir satır açsın
          delete this.yeniNot.id;
        }

        // 4. Şimdi veriyi /ekle endpoint'ine gönderiyoruz
        this.http.post('https://ysk-admin-backend-production.up.railway.app/api/notlar/ekle', this.yeniNot).subscribe({
          next: () => {
            this.toastGoster("✅ İşlem Başarılı: Not eklendi veya güncellendi!", "basari");
            // Formu temizle
            this.yeniNot = { vizeNotu: null, finalNotu: null, ogrenci: { id: null }, ders: { id: null } }; 
          },
          error: (err) => {
            this.toastGoster("❌ Bir hata oluştu!", "hata");
            console.error(err);
          }
        });

      });
    }
  }
  // ==========================================

  listele() {
    if (this.aktifleriGoster) {
      this.ogrenciService.getOgrenciler().subscribe(data => {
        this.ogrenciler = data;
        this.cdr.detectChanges(); 
      });
    } else {
      this.ogrenciService.pasifOgrencileriGetir().subscribe(data => {
        this.ogrenciler = data;
        this.cdr.detectChanges(); 
      });
    }
    
    // 🚀 Tablo ne gösterirse göstersin, üstteki kartlar her zaman arka plandan gerçek sayıları alsın!
    this.istatistikleriGuncelle();
  }

  arsivModunuDegistir() {
    this.aktifleriGoster = !this.aktifleriGoster;
    this.listele(); 
  }

  // ==========================================
  // DÜZENLENDİ: confirm() kaldırıldı, doğrudan backend'e istek atıyor
  // ==========================================
  aktifEt(id: number) {
    this.ogrenciService.ogrenciAktifEt(id).subscribe(() => {
      this.toastGoster("✅ Öğrenci başarıyla aktif listeye alındı!", "basari");
      this.listele();
    });
  }

  yeniEkleButonunaBasildi() {
    this.islemGorenOgrenci = { isim: '', soyisim: '', ogrenciNo: '' };
    this.formAcik = true;
  }

 kaydet() {
    if (!this.islemGorenOgrenci.isim.trim() || !this.islemGorenOgrenci.soyisim.trim() || !this.islemGorenOgrenci.ogrenciNo.trim()) {
      this.toastGoster("⚠️ Lütfen isim, soyisim ve öğrenci numarası alanlarının hepsini doldurunuz!", "hata");
      return; 
    }

    // ==========================================
    // BUG-FIX: MÜKERRER NUMARA KONTROLÜ (GÜNCELLEME VE EKLEME İÇİN)
    // ==========================================
    // Tabloda bu numarayla eşleşen biri var mı bakıyoruz. 
    // Ancak öğrenci "kendi" numarasını değiştirmeden kaydet'e basarsa hata vermemesi için "id" kontrolü de yapıyoruz.
    const cakisanKayit = this.ogrenciler.find(ogr => 
      ogr.ogrenciNo === this.islemGorenOgrenci.ogrenciNo && 
      ogr.id !== this.islemGorenOgrenci.id
    );

    if (cakisanKayit) {
      this.toastGoster("⚠️ Hata: Bu öğrenci numarası sistemde başka bir öğrenciye ait!", "hata");
      return; 
    }

    // Güncelleme İşlemi
    if (this.islemGorenOgrenci.id) {
      this.ogrenciService.ogrenciGuncelle(this.islemGorenOgrenci.id, this.islemGorenOgrenci).subscribe(() => {
        this.toastGoster("✅ Öğrenci bilgileri başarıyla güncellendi!", "basari");
        this.listele();
        this.formAcik = false;
      });
    } 
    // Yeni Ekleme İşlemi
    else {
      this.ogrenciService.ogrenciEkle(this.islemGorenOgrenci).subscribe(() => {
        this.toastGoster("✅ Yeni öğrenci başarıyla kaydedildi!", "basari");
        this.listele();
        this.formAcik = false;
      });
    }
  }

  // ==========================================
  // DÜZENLENDİ: confirm() kaldırıldı, doğrudan backend'e istek atıyor
  // ==========================================
  sil(id: number) {
    this.ogrenciService.ogrenciSil(id).subscribe(() => {
      this.toastGoster("✅ Öğrenci başarıyla silindi (arşive taşındı).", "basari");
      this.listele();
    });
  }

  duzenle(ogrenci: Ogrenci) {
    this.islemGorenOgrenci = { ...ogrenci }; 
    this.formAcik = true;
  }

  iptal() {
    this.islemGorenOgrenci = { isim: '', soyisim: '', ogrenciNo: '' };
  }

  turkceKarakterCevir(metin: string): string {
    if (!metin) return metin;
    return metin
      .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
      .replace(/ü/g, 'u').replace(/Ü/g, 'U')
      .replace(/ş/g, 's').replace(/Ş/g, 'S')
      .replace(/ı/g, 'i').replace(/İ/g, 'I')
      .replace(/ö/g, 'o').replace(/Ö/g, 'O')
      .replace(/ç/g, 'c').replace(/Ç/g, 'C');
  }

  excelAktar() {
    const excelVerisi = this.ogrenciler.map(o => ({
      'İsim': o.isim,
      'Soyisim': o.soyisim,
      'Öğrenci No': o.ogrenciNo
    }));
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelVerisi);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Öğrenciler');
    XLSX.writeFile(wb, 'Ogrenci_Raporu.xlsx');
  }

  pdfAktar() {
    const doc = new jsPDF();
    const baslik = this.aktifleriGoster ? 'Aktif Ogrenci Listesi' : 'Silinen Ogrenciler Arsivi';
    doc.text(baslik, 14, 15);
    const tabloVerisi = this.ogrenciler.map(o => [
      this.turkceKarakterCevir(o.isim), 
      this.turkceKarakterCevir(o.soyisim), 
      o.ogrenciNo
    ]);
    autoTable(doc, {
      head: [['Isim', 'Soyisim', 'Ogrenci No']],
      body: tabloVerisi,
      startY: 20,
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80] }
    });
    doc.save('Ogrenci_Raporu.pdf');
  }

  get filtrelenmisOgrenciler() {
    if (!this.aramaMetni) { return this.ogrenciler; }
    const aranan = this.aramaMetni.toLowerCase();
    return this.ogrenciler.filter(o => 
      o.isim.toLowerCase().includes(aranan) ||
      o.soyisim.toLowerCase().includes(aranan) ||
      o.ogrenciNo.includes(aranan)
    );
  }

  cikisYap() {
    localStorage.removeItem('girisYapildi');
    localStorage.removeItem('rol'); // Çıkışta rolü de silelim
    this.router.navigate(['/login']);
  }

  toastMesaj: string = '';
  toastTip: 'basari' | 'hata' | '' = '';

  toastGoster(mesaj: string, tip: 'basari' | 'hata') {
    this.toastMesaj = mesaj;
    this.toastTip = tip;
    
    this.cdr.detectChanges(); // Angular'ı anında güncellenmeye zorluyoruz
    
    setTimeout(() => {
      this.toastMesaj = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  // ==========================================
  // ÖZEL ONAY MODALI DEĞİŞKENLERİ VE METOTLARI
  // ==========================================
  onayModaliAcik: boolean = false;
  modalBaslik: string = '';
  modalMesaji: string = '';
  modalButonMetni: string = '';
  modalButonRengi: string = '';
  bekleyenIslem: 'sil' | 'aktifEt' | null = null;
  bekleyenId: number | null = null;

  onayKutusuAc(islem: 'sil' | 'aktifEt', id: number) {
    this.bekleyenIslem = islem;
    this.bekleyenId = id;
    this.onayModaliAcik = true;

    if (islem === 'sil') {
      this.modalBaslik = 'Kayıt Silinecek!';
      this.modalMesaji = 'Bu öğrenciyi kalıcı olarak silmek istediğinize emin misiniz?';
      this.modalButonMetni = 'Evet, Sil';
      this.modalButonRengi = '#f44336'; 
    } else if (islem === 'aktifEt') {
      this.modalBaslik = 'Aktif Listeye Alınacak';
      this.modalMesaji = 'Bu öğrenciyi tekrar aktif listeye almak istediğinize emin misiniz?';
      this.modalButonMetni = 'Evet, Geri Getir';
      this.modalButonRengi = '#4CAF50'; 
    }
  }

  modalIptal() {
    this.onayModaliAcik = false;
    this.bekleyenIslem = null;
    this.bekleyenId = null;
  }

  modalOnayla() {
    if (this.bekleyenIslem === 'sil' && this.bekleyenId !== null) {
      this.sil(this.bekleyenId); 
    } else if (this.bekleyenIslem === 'aktifEt' && this.bekleyenId !== null) {
      this.aktifEt(this.bekleyenId); 
    }
    this.modalIptal(); 
  }
}