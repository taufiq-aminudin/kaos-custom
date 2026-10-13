KAOS-CUSTOM.MY.ID — KATALOG + ADMIN
1. Upload seluruh isi ZIP ke document root domain (misalnya public_html).
2. Hosting harus mendukung PHP 8.1+ dan HTTPS.
3. WAJIB ubah ADMIN_PASSWORD_HASH di config.php sebelum online. Buat hash baru dengan PHP CLI: php -r "echo password_hash('PASSWORD_BARU_KUAT', PASSWORD_DEFAULT), PHP_EOL;" lalu tempel hasilnya. Username awal: admin.
4. Password awal: GantiPasswordKuat-2026! (ganti sebelum website dipublikasikan).
5. Pastikan folder data/ dan uploads/ dapat ditulis oleh PHP; mulai dengan permission 755 dan minta hosting menyesuaikan ownership jika gagal.
6. Login melalui /admin.php. Tambahkan nama produk, gambar JPG/PNG/WEBP (maks. 5 MB) atau URL gambar, link pembelian, kategori, harga opsional, deskripsi, dan alt text.
7. Tombol produk mengarah ke link pembelian; website ini tidak memproses pembayaran sendiri.
8. Data disimpan di data/products.json pada server. Backup folder data/ dan uploads/ berkala. Jangan gunakan permission 777 kecuali disarankan hosting.
9. Logo dan favicon SVG disertakan. Produk awal kosong, tambahkan lewat admin.

CATATAN PENTING — KOMPATIBILITAS HOSTING
Proyek ini menggunakan PHP (index.php, admin.php, config.php). File PHP tidak dapat dijalankan langsung oleh Cloudflare Pages/Workers melalui perintah `npx wrangler deploy`.
Gunakan paket ini pada hosting yang mendukung PHP 8.1+ (misalnya cPanel), dengan mengunggah seluruh isi ZIP ke document root.
Jika target wajib Cloudflare Workers/Pages, aplikasi perlu dikonversi menjadi frontend statis + API Worker dan penyimpanan persisten (misalnya KV/D1); mengganti deploy command saja tidak cukup.
