# Algoritma Rekomendasi Komunitas untuk Skripsi
## Versi Ringkas (Thesis Writing)

---

## Penjelasan Algoritma Content-Based Filtering

Sistem rekomendasi komunitas dalam penelitian ini menggunakan pendekatan **Content-Based Filtering** dengan dua fitur utama yang dikombinasikan secara terbobot: **Interest Match** (60%) dan **Location Proximity** (40%). Metode ini dipilih karena kemampuannya memberikan rekomendasi personal tanpa memerlukan data dari pengguna lain, sehingga cocok untuk pengguna baru yang belum memiliki riwayat interaksi. Distribusi bobot ini didasarkan pada asumsi bahwa kecocokan minat merupakan faktor utama dalam memilih komunitas, sementara kedekatan lokasi menjadi pertimbangan pendukung.

### Komponen Interest Match: TF-IDF dan Cosine Similarity

Komponen Interest Match menggunakan metode **TF-IDF (Term Frequency-Inverse Document Frequency)** untuk merepresentasikan minat pengguna dan konten komunitas dalam bentuk vektor numerik (Huang, 2023). Proses dimulai dengan membangun vocabulary dari semua kata unik yang muncul dalam minat pengguna dan konten komunitas (nama, deskripsi, kategori, tag). Sistem kemudian membuat vektor TF-IDF dengan menghitung frekuensi kemunculan setiap kata dari vocabulary. Untuk mengukur kemiripan, sistem menggunakan **Cosine Similarity** yang menghitung sudut antara dua vektor, menghasilkan nilai 0-1 (Christyawan et al., 2023). Nilai ini kemudian dikalikan dengan bobot 0.60 untuk mendapatkan kontribusi terhadap skor akhir.

Untuk meningkatkan efektivitas pencocokan, sistem menerapkan **keyword expansion** yang memperluas kategori minat pengguna menjadi vocabulary spesifik. Misalnya, kategori "Tech & Innovation" dipetakan ke 35+ kata kunci seperti "programming", "coding", "ai", "blockchain", "cloud", dan lain-lain. Teknik ini penting karena data minat disimpan dalam kategori luas sementara deskripsi komunitas menggunakan istilah spesifik. Tanpa perluasan kata kunci, Cosine Similarity hanya mencapai 0.15, namun dengan perluasan dapat meningkat hingga 0.70 untuk komunitas yang relevan.

### Komponen Location Proximity: Haversine Distance

Komponen Location Proximity menggunakan **Haversine Formula** untuk menghitung jarak great-circle antara lokasi pengguna dan komunitas berdasarkan koordinat latitude dan longitude (Sinnott, 1984). Formula ini memperhitungkan kelengkungan bumi sehingga lebih akurat dibandingkan perhitungan Euclidean sederhana. Jarak yang dihasilkan kemudian dinormalisasi menjadi skor 0-1 dengan formula: **LocationScore = max(0, 1 - jarak/50)**, di mana threshold 50 km dipilih sebagai jarak maksimum yang realistis untuk partisipasi rutin. Skor ini kemudian dikalikan dengan bobot 0.40.

### Agregasi Skor Akhir

Skor rekomendasi akhir dihitung dengan formula: **Score = 0.60 × CosineSimilarity + 0.40 × LocationScore**, menghasilkan nilai 0-1. Sebagai contoh, pengguna dengan minat ["programming", "startup", "AI"] di Jakarta mencari komunitas. Sistem menemukan "Jakarta Tech Startups" berjarak 6.98 km dengan Cosine Similarity 0.516. Perhitungan: Interest (0.516 × 0.60 = 0.310) + Location (0.86 × 0.40 = 0.344) = 0.654 atau 65.4% kesesuaian. Sistem mengurutkan komunitas berdasarkan skor dan merekomendasikan yang tertinggi kepada pengguna.

---

## Kelebihan dan Kekurangan

### Kelebihan

Metode Content-Based Filtering memiliki beberapa keunggulan: (1) tidak memerlukan data pengguna lain sehingga privasi terjaga, (2) tidak mengalami cold-start problem karena pengguna baru dapat langsung mendapat rekomendasi setelah mengisi profil, (3) transparan dengan alasan rekomendasi yang jelas ("65% match karena minat programming dan lokasi dekat 7 km"), dan (4) efisien secara komputasi dengan waktu pemrosesan cepat.

### Kekurangan

Keterbatasan metode ini mencakup: (1) limited serendipity karena hanya merekomendasikan komunitas serupa tanpa eksplorasi topik baru, (2) bergantung pada kelengkapan profil pengguna, dan (3) tidak memperhitungkan aspek sosial seperti popularitas komunitas atau preferensi pengguna serupa.

---

## Referensi

[1] Huang, R. (2023). Improved content-based recommendation algorithm integrating semantic information. *Journal of Big Data*, 10, 61.

[2] Christyawan, F., et al. (2023). Application of Content-Based Filtering Method Using Cosine Similarity in Restaurant Selection Recommendation System. *Journal of Information Systems and Informatics*, 5(3).

[3] Sinnott, R. W. (1984). Virtues of the Haversine. *Sky and Telescope*, 68(2), 159.

