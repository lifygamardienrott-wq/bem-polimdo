require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const app = express();





// MIDDLEWARE

app.use(cors());

app.use(express.json());





// ===============================
// EMAIL CONFIG
// ===============================

const transporter = nodemailer.createTransport({

  service: "gmail",

  auth: {

    user: process.env.EMAIL_USER,

    pass: process.env.EMAIL_PASS

  }

});





// ===============================
// REGISTER USER
// ===============================

app.post("/register", async (req, res) => {

  try {

    const { nama, email, password } = req.body;





    // VALIDASI EMAIL

    const existingUser = await prisma.user.findUnique({

      where: {

        email

      }

    });





    if (existingUser) {

      return res.status(400).json({

        message: "Email sudah terdaftar"

      });

    }





    // HASH PASSWORD

    const hashedPassword = await bcrypt.hash(

      password,
      10

    );





    // SIMPAN USER

    const user = await prisma.user.create({

      data: {

        nama,
        email,
        password: hashedPassword,
        role: "user"

      }

    });





    // KIRIM EMAIL

    await transporter.sendMail({

      from: `"BEM POLIMDO" <${process.env.EMAIL_USER}>`,

      to: email,

      subject: "Registrasi Berhasil",

      html: `

      <div style="
        font-family:Arial;
        background:#f4f7ff;
        padding:30px;
      ">

        <div style="
          max-width:600px;
          margin:auto;
          background:white;
          border-radius:20px;
          overflow:hidden;
          box-shadow:0 10px 30px rgba(0,0,0,0.1);
        ">

          <div style="
            background:linear-gradient(135deg,#2563eb,#3b82f6);
            color:white;
            padding:40px;
            text-align:center;
          ">

            <h1>
              Registrasi Berhasil
            </h1>

            <p>
              Sistem Aspirasi BEM POLIMDO
            </p>

          </div>





          <div style="
            padding:40px;
            line-height:1.8;
            color:#333;
          ">

            <h2>
              Halo ${nama}
            </h2>

            <p>

              Akun kamu berhasil dibuat
              di Sistem Aspirasi BEM POLIMDO.

            </p>

            <p>

              Sekarang kamu bisa:

              <br><br>

              • Mengirim aspirasi
              <br>

              • Melihat status laporan
              <br>

              • Mendapat respon admin

            </p>

            <p>

              Terima kasih sudah menggunakan
              layanan aspirasi mahasiswa.

            </p>

          </div>





          <div style="
            background:#f1f5f9;
            padding:20px;
            text-align:center;
            color:#64748b;
          ">

            © 2026 BEM POLIMDO

          </div>

        </div>

      </div>

      `

    });





    res.json({

      message: "Register berhasil",

      user

    });

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      message: "Server error"

    });

  }

});





// ===============================
// LOGIN USER
// ===============================

app.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;





    const user = await prisma.user.findUnique({

      where: {

        email

      }

    });





    if (!user) {

      return res.status(404).json({

        message: "User tidak ditemukan"

      });

    }





    const isMatch = await bcrypt.compare(

      password,
      user.password

    );





    if (!isMatch) {

      return res.status(400).json({

        message: "Password salah"

      });

    }





    res.json({

      message: "Login berhasil",

      user

    });

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      message: "Server error"

    });

  }

});





// ===============================
// LOGIN ADMIN
// ===============================

app.post("/login-admin", async (req, res) => {

  try {

    const { email, password } = req.body;





    const admin = await prisma.user.findUnique({

      where: {

        email

      }

    });





    if (!admin) {

      return res.status(404).json({

        message: "Admin tidak ditemukan"

      });

    }





    if (admin.role !== "admin") {

      return res.status(403).json({

        message: "Bukan akun admin"

      });

    }





    const isMatch = await bcrypt.compare(

      password,
      admin.password

    );





    if (!isMatch) {

      return res.status(400).json({

        message: "Password salah"

      });

    }





    res.json({

      message: "Login admin berhasil",

      admin

    });

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      message: "Server error"

    });

  }

});





// ===============================
// KIRIM ASPIRASI
// ===============================

app.post("/aspirasi", async (req, res) => {

  try {

    const {

      judul,
      isi,
      kategori,
      prioritas,
      userId

    } = req.body;





    const aspirasi = await prisma.aspirasi.create({

      data: {

        judul,
        isi,
        kategori,
        prioritas,
        status: "Pending",
        userId: Number(userId)

      }

    });





    res.json({

      message: "Aspirasi berhasil dikirim",

      aspirasi

    });

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      message: "Server error"

    });

  }

});





// ===============================
// AMBIL SEMUA ASPIRASI
// ===============================

app.get("/aspirasi", async (req, res) => {

  try {

    const data = await prisma.aspirasi.findMany({

      include: {

        user: true

      },

      orderBy: {

        createdAt: "desc"

      }

    });





    res.json(data);

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      message: "Server error"

    });

  }

});





// ===============================
// AMBIL ASPIRASI USER
// ===============================

app.get("/aspirasi/:userId", async (req, res) => {

  try {

    const { userId } = req.params;





    const data = await prisma.aspirasi.findMany({

      where: {

        userId: Number(userId)

      },

      orderBy: {

        createdAt: "desc"

      }

    });





    res.json(data);

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      message: "Server error"

    });

  }

});





// ===============================
// UPDATE STATUS ASPIRASI
// ===============================

app.put("/aspirasi/:id", async (req, res) => {

  try {

    const { id } = req.params;

    const { status } = req.body;





    const update = await prisma.aspirasi.update({

      where: {

        id: Number(id)

      },

      data: {

        status

      }

    });





    res.json({

      message: "Status berhasil diupdate",

      update

    });

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      message: "Server error"

    });

  }

});





// ===============================
// HAPUS ASPIRASI
// ===============================

app.delete("/aspirasi/:id", async (req, res) => {

  try {

    const { id } = req.params;





    await prisma.aspirasi.delete({

      where: {

        id: Number(id)

      }

    });





    res.json({

      message: "Aspirasi berhasil dihapus"

    });

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      message: "Server error"

    });

  }

});



// ===============================
// AMBIL RIWAYAT ASPIRASI USER
// ===============================

app.get("/aspirasi/:userId", async (req, res) => {

  try {

    const userId = parseInt(req.params.userId);

    const data = await prisma.aspirasi.findMany({

      where: {
        userId: userId
      },

      orderBy: {
        createdAt: "desc"
      }

    });

    res.json(data);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});

// ======================================
// API SEMUA ASPIRASI
// ======================================

app.get("/api/aspirasi", async (req, res) => {

  try {

    const data = await prisma.aspirasi.findMany({

      include: {

        user: {

          select: {

            nama: true,
            email: true

          }

        }

      },

      orderBy: {

        createdAt: "desc"

      }

    });

    res.json(data);

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      message: "Server error"

    });

  }

});

// ======================================
// API DATA USER
// ======================================

app.get("/api/users", async (req, res) => {

  try {

    const users = await prisma.user.findMany({

      select: {

        id: true,
        nama: true,
        email: true,
        role: true

      }

    });

    res.json(users);

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      message: "Server error"

    });

  }

});

// ===============================
// SERVER
// ===============================

app.listen(5000, () => {

  console.log(

    "Server running on port 5000"

  );

});