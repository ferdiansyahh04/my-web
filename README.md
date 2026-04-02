# VOLTX

VOLTX adalah website toko produk aksesoris PC dan gaming berbasis HTML, CSS, dan JavaScript tanpa backend framework. Proyek ini menggunakan data lokal dan penyimpanan browser untuk simulasi fitur e-commerce seperti cart, checkout multi-step, autentikasi sederhana, dan panel admin.

## Fitur Utama

- Landing page toko dengan katalog produk
- Announcement bar / marquee di bagian atas
- Cart sidebar dengan update jumlah item
- Checkout multi-step
- Login dan register sederhana berbasis `localStorage`
- Panel admin untuk mengelola produk
- Penyimpanan order lokal melalui browser

## Teknologi

- HTML5
- CSS3
- JavaScript vanilla
- Tailwind CSS via CDN
- `localStorage` dan `sessionStorage`

## Struktur Proyek

```text
.
|-- checkout_system.html
|-- data.js
|-- index.html
|-- style.css
`-- js/
	|-- admin.js
	|-- auth.js
	|-- carousel.js
	|-- cart.js
	|-- main.js
	|-- orders.js
	`-- ui.js
```

## Cara Menjalankan

Karena ini proyek statis, Anda bisa menjalankannya dengan salah satu cara berikut:

### Opsi 1: Buka langsung di browser

Buka file `index.html`.

### Opsi 2: Jalankan dengan local server

Disarankan memakai extension seperti Live Server di VS Code agar path dan perilaku browser lebih stabil.

## Alur Halaman

- `index.html`: halaman utama toko
- `checkout_system.html`: halaman checkout multi-step

## Login dan Admin Default

Saat aplikasi pertama kali dijalankan, sistem akan membuat akun admin default jika belum ada.

- Email: `admin@voltx.local`
- Password: `admin123`

Disarankan mengganti mekanisme ini jika proyek akan dipakai di lingkungan produksi.

## Penyimpanan Data

Data berikut disimpan di browser:

- Session login pengguna
- Data cart
- Data checkout sementara
- Data order
- Data produk hasil edit admin

Karena semuanya berbasis browser storage, data akan bergantung pada browser/perangkat yang dipakai.

## Catatan Pengembangan

- Proyek ini saat ini belum memakai backend atau database
- Cocok untuk template, demo, atau prototipe toko online
- Jika ingin deployment production, sebaiknya tambahkan backend, autentikasi aman, dan penyimpanan server-side

## Git

Repository ini sudah dikonfigurasi dengan:

- `.gitignore` untuk file sampah, cache, env, dan output umum
- `.gitattributes` untuk line ending yang lebih stabil lintas platform

## Lisensi

Belum ditentukan.
