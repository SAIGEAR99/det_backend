const express = require('express');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

const uploadDir = path.join(__dirname, '../../public/img/post');

// ตรวจสอบว่าโฟลเดอร์อัปโหลดมีหรือไม่ ถ้าไม่มีให้สร้าง
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created upload directory at ${uploadDir}`);
}

// กำหนด storage และ multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// ตั้งค่า multer สำหรับอัปโหลดหลายไฟล์
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    let mimetype = file.mimetype;

    if (mimetype === 'application/octet-stream') {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.jpg' || ext === '.jpeg') mimetype = 'image/jpeg';
      else if (ext === '.png') mimetype = 'image/png';
    }

    console.log('Processed mimetype:', mimetype);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(mimetype)) {
      console.error(
        `File rejected: ${file.originalname} (mimetype: ${mimetype})`
      );
      return cb(
        new Error(
          `Only .jpeg, .png, .jpg formats are allowed! File: ${file.originalname}`
        )
      );
    }

    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

exports.create = [
  upload.array('images', 10),
  async (req, res) => {
    console.log('Uploaded files:', req.files);
    const { user_id, content } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!content && (!req.files || req.files.length === 0)) {
      return res
        .status(400)
        .json({ error: 'Either content or at least one image is required' });
    }

    try {
      console.log('Creating post...');
      const post = await prisma.posts.create({
        data: {
          user_id: parseInt(user_id),
          content: content || null,
        },
      });
      console.log('Post created:', post);

      const images = [];
      if (req.files) {
        for (const file of req.files) {
          const outputImagePath = path.join(
            uploadDir,
            `optimized-${file.filename}`
          );

          // ลดขนาดและบันทึกภาพ
          await sharp(file.path)
            .resize(800, 800, {
              fit: sharp.fit.cover,
              withoutEnlargement: true,
            })
            .toFormat('jpeg')
            .jpeg({ quality: 80 })
            .toFile(outputImagePath);

          console.log(`Optimized image saved at: ${outputImagePath}`);

          // ลบไฟล์ต้นฉบับ
          try {
            await fs.promises.unlink(file.path);
            console.log(`Original image deleted: ${file.path}`);
          } catch (err) {
            console.error(`Failed to delete original image: ${file.path}`, err);
          }

          // บันทึกข้อมูลภาพในฐานข้อมูล
          const imageRecord = await prisma.image.create({
            data: {
              post_id: post.post_id,
              img_path: `/img/post/optimized-${file.filename}`,
            },
          });

          images.push(imageRecord);
        }
      }

      res.status(201).json({
        message: 'Post created successfully',
        post: {
          ...post,
          images: images.map((img) => ({
            id: img.id,
            img_path: img.img_path,
          })),
        },
      });
    } catch (error) {
      console.error('Error creating post:', error);

      if (req.files) {
        req.files.forEach(async (file) => {
          try {
            await fs.promises.unlink(file.path);
            console.log(`File deleted after error: ${file.path}`);
          } catch (err) {
            console.error(`Error removing file after failure: ${file.path}`, err);
          }
        });
      }

      res.status(500).json({
        error: 'Something went wrong while creating the post',
      });
    }
  },
];
