# VOLTX

VOLTX adalah website e-commerce aksesoris PC dan gaming berbasis HTML, CSS, dan JavaScript vanilla dengan **Supabase** sebagai backend. Proyek ini sudah mencakup katalog produk, cart, checkout, autentikasi pengguna, otorisasi admin, riwayat pesanan, dan panel admin untuk mengelola produk.

## Fitur Utama

- Landing page dengan hero showcase, marquee announcement bar, dan animasi AOS
- Navbar transparan di area hero yang berubah menjadi navbar putih saat scroll melewati hero
- Pencarian produk langsung dari navbar
- Katalog produk dari database Supabase
- Cart sidebar dengan update quantity dan checkout redirect
- Checkout multi-step dengan validasi inline
- Login dan register menggunakan Supabase Auth
- Riwayat pesanan user melalui modal akun
- Panel admin berbasis role untuk mengelola produk dan melihat order
- Upload gambar produk ke Supabase Storage
- Toast notification untuk feedback aksi penting

## Teknologi

- HTML5
- CSS3
- JavaScript vanilla
- Tailwind CSS via CDN
- AOS (Animate On Scroll)
- Supabase
  - Auth
  - Postgres Database
  - Storage

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

## Alur Halaman

- `index.html`
  Halaman utama toko, katalog produk, navbar, auth, cart, account modal, dan admin modal.

- `checkout_system.html`
  Halaman checkout multi-step untuk shipping, payment, confirmation, dan order success.

## Fitur Auth dan Authorization

### Authentication

- Register user dengan `supabase.auth.signUp()`
- Login user dengan `supabase.auth.signInWithPassword()`
- Logout dengan `supabase.auth.signOut()`

### Authorization

- Role user/admin disimpan di tabel `profiles`
- Tombol admin hanya muncul untuk user dengan role `admin`
- Panel admin dipakai untuk CRUD produk dan melihat daftar order

## Penyimpanan Data

Data utama disimpan di **Supabase**:

- `products`
  Menyimpan data produk untuk katalog dan admin CRUD

- `orders`
  Menyimpan data order user, termasuk:
  - `order_id`
  - `user_id`
  - `items`
  - `total`
  - `user_email`
  - `user_name`
  - `shipping`
  - `status`

- `profiles`
  Menyimpan profil user dan role (`user` / `admin`)

- `product-images`
  Bucket storage publik untuk gambar produk

Data browser:

- `localStorage`
  Digunakan untuk cart

- `sessionStorage`
  Digunakan untuk pending cart, redirect auth, dan state checkout sementara

## Supabase Setup

Project ini membutuhkan minimal:

- tabel `products`
- tabel `orders`
- tabel `profiles`
- bucket `product-images`

### Kolom penting pada `orders`

Karena project ini menggunakan RLS untuk order user, tabel `orders` perlu memiliki kolom:

- `user_id uuid`

Kolom ini dipakai untuk menghubungkan order dengan user login melalui `auth.uid()`.

### RLS yang disarankan

- Semua user/public dapat membaca produk
- Hanya admin yang dapat insert/update/delete produk
- User login hanya bisa membaca order miliknya sendiri
- User login hanya bisa membuat order dengan `user_id = auth.uid()`
- Admin dapat membaca seluruh order jika diperlukan untuk panel admin

Contoh policy user order:

```sql
create policy "User can read own orders"
on public.orders
for select
using (user_id = auth.uid());

create policy "User can create own orders"
on public.orders
for insert
with check (user_id = auth.uid());
```

## Cara Menjalankan

Karena ini adalah proyek statis dengan backend Supabase, Anda bisa menjalankannya dengan:

### Opsi 1

Buka `index.html` langsung di browser.

### Opsi 2

Gunakan local server seperti **Live Server** di VS Code agar path asset dan perilaku browser lebih stabil.

## Fitur yang Sudah Diimplementasikan

### User

- Browse katalog produk
- Cari produk dari navbar
- Tambah produk ke cart
- Checkout
- Login / register
- Lihat riwayat pesanan

### Admin

- Melihat tombol admin hanya jika role sesuai
- Menambah produk
- Mengedit produk
- Menghapus produk
- Melihat daftar order
- Melihat detail order

## Catatan

- Proyek ini tidak memakai framework frontend seperti React atau Vue
- Fokus utama ada pada implementasi e-commerce vanilla JS + Supabase
- Payment gateway belum diintegrasikan, checkout bersifat sederhana untuk kebutuhan proyek akademik / demo

## Git

Repository ini sudah menggunakan:

- `.gitignore`
- `.gitattributes`

untuk menjaga file tracking tetap rapi dan line ending lebih stabil lintas platform.

## Lisensi

Belum ditentukan.
