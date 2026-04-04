# VOLTX

VOLTX adalah website toko aksesoris PC dan gaming berbasis HTML, CSS, dan JavaScript dengan **Supabase** sebagai backend. Proyek ini memiliki fitur e-commerce seperti katalog produk, cart, checkout multi-step, autentikasi, panel admin, dan upload gambar produk.

## Fitur Utama

- Landing page dengan hero showcase dan animasi AOS
- Announcement bar / marquee di bagian atas
- Katalog produk dari database Supabase
- Cart sidebar dengan update jumlah item
- Checkout multi-step
- Login dan register dengan Supabase Auth
- Panel admin (role-based) untuk mengelola produk dan melihat order
- Upload gambar produk ke Supabase Storage
- Pencarian produk

## Teknologi

- HTML5
- CSS3
- JavaScript vanilla
- Tailwind CSS via CDN
- AOS (Animate on Scroll)
- Supabase (Auth, Database, Storage)

## Struktur Proyek

```text
.
|-- checkout_system.html
|-- data.js
|-- index.html
|-- README.md
|-- style.css
`-- js/
    |-- admin.js
    |-- auth.js
    |-- carousel.js
    |-- cart.js
    |-- checkout.js
    |-- main.js
    |-- orders.js
    |-- supabase.js
    `-- ui.js
```

## Cara Menjalankan

Karena ini proyek statis dengan Supabase sebagai backend, Anda bisa menjalankannya dengan salah satu cara berikut:

### Opsi 1: Buka langsung di browser

Buka file `index.html`.

### Opsi 2: Jalankan dengan local server

Disarankan memakai extension seperti Live Server di VS Code agar path dan perilaku browser lebih stabil.

## Alur Halaman

- `index.html`: halaman utama toko (katalog, hero, about)
- `checkout_system.html`: halaman checkout multi-step

## Penyimpanan Data

Data disimpan di **Supabase**:

- **Auth**: login/register pengguna via Supabase Auth
- **Database**: produk (`products`), order (`orders`), profil pengguna (`profiles`)
- **Storage**: gambar produk di bucket `product-images`
- **Browser**: `sessionStorage` untuk data cart sementara dan checkout

## Supabase Setup

Proyek ini membutuhkan tabel berikut di Supabase:

- `products` — data produk (name, original_price, sale_price, image1, image2, dll.)
- `orders` — data order (order_id, items, total, user_email, dll.)
- `profiles` — profil pengguna (id, name, role)

Storage bucket:

- `product-images` — bucket publik untuk gambar produk

RLS (Row Level Security) harus dikonfigurasi agar:

- Semua orang bisa membaca produk
- Admin bisa insert/update/delete produk
- User terautentikasi bisa membuat order
- Admin bisa membaca semua order

## Git

Repository ini sudah dikonfigurasi dengan:

- `.gitignore` untuk file sampah, cache, env, dan output umum
- `.gitattributes` untuk line ending yang lebih stabil lintas platform

## Lisensi

Belum ditentukan.
