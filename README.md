# ShareCode Mandiri

## Railway

1. Upload proyek ke GitHub lalu hubungkan repository ke Railway.
2. Tambahkan layanan PostgreSQL pada project yang sama.
3. Railway otomatis menyediakan `DATABASE_URL` ke aplikasi.
4. Deploy dan buat domain dari menu Networking.

## Render

1. Buat PostgreSQL database dan salin Internal Database URL.
2. Buat Web Service dari repository ini.
3. Atur `DATABASE_URL` menggunakan Internal Database URL.
4. Gunakan build command `npm ci && npm run build`.
5. Gunakan start command `npm run start`.

Tabel akun, sesi, dan snippet dibuat otomatis saat aplikasi pertama kali mengakses database. Password disimpan sebagai hash bcrypt dan sesi memakai cookie HTTP-only selama 30 hari.
