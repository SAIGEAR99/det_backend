# DET Application Backend

## ข้อกำหนดเบื้องต้น
- Node.js
- Prisma
- MySQL Database

## การติดตั้ง
1. ติดตั้งแพ็คเกจที่จำเป็น:
   ```sh
   npm install
   ```
2. ติดตั้ง Prisma CLI แบบ global (ถ้ายังไม่ได้ติดตั้ง):
   ```sh
   npm install -g prisma
   ```
3. สร้าง Prisma client:
   ```sh
   npx prisma generate
   ```

## การตั้งค่าฐานข้อมูล
1. สร้างฐานข้อมูล MySQL
2. ตั้งค่าตัวแปรสภาพแวดล้อมในไฟล์ `.env`:
   ```env
   DATABASE_URL="mysql://user:password@host:port/database"
   PORT=3000
   ```
3. เริ่มต้น Prisma schema:
   ```sh
   npx prisma init
   ```
4. รัน Prisma migration:
   ```sh
   npx prisma migrate dev --name init
   ```

## การรันเซิร์ฟเวอร์
1. รันเซิร์ฟเวอร์ในโหมดพัฒนา:
   ```sh
   npm run dev
   ```
2. สำหรับโหมด Production:
   ```sh
   npm start
   ```

## API Endpoints
- `POST /login` - สำหรับการเข้าสู่ระบบ
- `POST /register` - สำหรับการลงทะเบียนผู้ใช้ใหม่
- `GET /posts` - ดึงข้อมูลโพสต์ทั้งหมด
- `POST /posts` - สร้างโพสต์ใหม่
- `GET /users/:id` - ดึงข้อมูลโปรไฟล์ผู้ใช้

## โครงสร้างโครงการ
```
src/
  ├── server.js          # จุดเริ่มต้นของเซิร์ฟเวอร์
  ├── controllers/       # การจัดการตรรกะทางธุรกิจ
  │   ├── authController.js
  │   ├── follow.js
  │   ├── notification.js
  │   ├── post.js
  │   ├── register.js
  │   ├── search.js
  │   └── user.js
  ├── middleware/        # ฟังก์ชัน Middleware
  │   ├── img.js
  │   └── middleware.js
  ├── routes/            # เส้นทางของ API
  │   └── authRoutes.js
  ├── utils/             # ฟังก์ชันช่วยเหลือ
  └── prisma/            # Prisma schema และ client

## ตัวแปรสภาพแวดล้อม
- ตัวอย่างการตั้งค่าไฟล์ `.env`:
  ```env
  DATABASE_URL=mysql://user:password@host:port/database
  PORT=3000
  ```

## หมายเหตุเพิ่มเติม
- ใช้คำสั่ง `npx prisma studio` เพื่อเข้าถึง GUI ของฐานข้อมูล
- ทดสอบ API โดยใช้เครื่องมือ เช่น Postman หรือ Thunder Client
- เปิดใช้งาน logs ที่เหมาะสมในไฟล์ `server.js` เพื่อการ debug

