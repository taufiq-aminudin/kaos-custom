# Kaos Custom

Katalog kaos custom, kaos kata-kata, dan graphic tee unik dengan panel admin manajemen produk.
Dimigrasikan dari PHP ke Node.js (Express + Vite + React SPA).

## Fitur
- **Katalog Publik**:
  - Hero banner responsif dengan aksen visual t-shirt kustom
  - Pencarian produk berdasarkan nama dan deskripsi
  - Filter kategori dinamis
  - Tautan langsung ke toko online pembelian (Shopee, Tokopedia, dll.)
  - Bagian "Tentang Kami" dan footer yang elegan
- **Dashboard Admin**:
  - Login terproteksi (`admin` / `GantiPasswordKuat-2026!`)
  - Tambah produk dengan unggah gambar (JPG/PNG/WEBP maks. 5 MB) atau URL gambar eksternal
  - Edit produk yang sudah ada
  - Hapus produk dari katalog
  - Penyimpanan persisten di `data/products.json` dan folder `uploads/`

## Menjalankan Aplikasi
```bash
npm run dev
```
Aplikasi berjalan di port 3000 (`http://localhost:3000`).
Kredensial Admin default:
- **Username**: `admin`
- **Password**: `GantiPasswordKuat-2026!`
