import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Ogrenci {
  id?: number; // Soru işareti, yeni kayıtta ID'nin henüz olmadığını belirtir
  isim: string;
  soyisim: string;
  ogrenciNo: string;
}

@Injectable({
  providedIn: 'root'
})
export class OgrenciService {
  private apiUrl = 'https://ysk-admin-backend-production.up.railway.app/api/ogrenciler';

  constructor(private http: HttpClient) { }

  // 1. LİSTELE (Read)
  getOgrenciler(): Observable<Ogrenci[]> {
    return this.http.get<Ogrenci[]>(this.apiUrl + '/liste');
  }

  // 2. KAYDET (Create)
  ogrenciEkle(ogrenci: Ogrenci): Observable<Ogrenci> {
    // Not: '/kaydet' kısmını kendi Spring Boot Controller'ındaki adrese göre düzelt
    return this.http.post<Ogrenci>(this.apiUrl + '/kaydet', ogrenci); 
  }

  // 3. GÜNCELLE (Update)
  ogrenciGuncelle(id: number, ogrenci: Ogrenci): Observable<Ogrenci> {
    return this.http.put<Ogrenci>(this.apiUrl + '/guncelle/' + id, ogrenci);
  }

  // 4. SİL (Delete)
  ogrenciSil(id: number): Observable<void> {
    return this.http.delete<void>(this.apiUrl + '/sil/' + id);
  }
  // Silinenleri getiren metot
  pasifOgrencileriGetir(): Observable<Ogrenci[]> {
    return this.http.get<Ogrenci[]>(this.apiUrl + '/pasif-liste');
  }

  // Öğrenciyi geri döndüren metot
  ogrenciAktifEt(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/aktif-et/${id}`, {});
  }
  // Öğrencinin notlarını arka plandan çeken servis metodu
getOgrenciNotlari(ogrenciNo: string) {
return this.http.get(`https://ysk-admin-backend-production.up.railway.app/api/notlar/ogrenci/${ogrenciNo}`);
}
notEkle(yeniNot: any) {
  return this.http.post('https://ysk-admin-backend-production.up.railway.app/api/notlar/ekle', yeniNot);
}
}
