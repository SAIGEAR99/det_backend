const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/img/');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });
const prisma = new PrismaClient();

exports.upload_profile = async (req, res) => {
  const { user_id } = req.query; 

  if (!user_id) {
    return res.status(400).send({ message: 'User ID is required' });
  }

  try {

    const user = await prisma.users.findUnique({
      where: { id: parseInt(user_id, 10) }, 
    });

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
    }

    const uploadedFilePath = path.join(__dirname, '../public/img/', req.file.filename);
    const processedFilePath = path.join(__dirname, '../public/img/processed/', req.file.filename);


    const processedDir = path.dirname(processedFilePath);
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }

    await sharp(uploadedFilePath)
      .resize(300, 300) 
      .toFile(processedFilePath);


    fs.unlinkSync(uploadedFilePath);


    const updatedUser = await prisma.users.update({
      where: { id: parseInt(user_id, 10) },
      data: {
        profile_picture: `/img/processed/${req.file.filename}`,
      },
    });

    res.status(200).send({
      message: 'File uploaded and processed successfully',
      user: updatedUser,
    });
  } catch (err) {
    console.error('Error processing image: ', err);
    res.status(500).send({ message: 'Error processing image' });
  }
};

exports.profile = async (req, res) => {
  const { user_id } = req.params;
  console.log('userimg-->',user_id);

  if (!user_id) {
    return res.status(400).send({ message: 'User ID is required' });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(user_id, 10) },
    });


    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    const profilePicture = user.profile_img;

    console.log('User profile picture:', profilePicture);

    const publicDir = path.join(__dirname, '../../public');

    if (profilePicture) {
      const imagePath = path.join(publicDir, profilePicture);
      return res.sendFile(imagePath);

    }
  } catch (err) {
    console.error('Error in profile API:', err);
    res.status(500).send({ message: 'Error fetching user image' });
  }
};

exports.post_img = async (req, res) => {
  const { post_id } = req.params;

  if (!post_id) {
    return res.status(400).json({ error: 'post_id is required' });
  }

  try {
    // ค้นหารายการภาพที่เชื่อมโยงกับ post_id
    const images = await prisma.image.findMany({
      where: { post_id: BigInt(post_id) },
      select: {
        id: true,
        img_path: true, // ดึงเฉพาะ path ของรูปภาพ
      },
    });

    if (images.length === 0) {
      return res.status(404).json({ error: 'No images found for this post' });
    }

    // ส่งคืนรายการภาพ
    res.status(200).json({
      post_id: post_id,
      images: images.map((img) => ({
        id: img.id,
        url: `${req.protocol}://${req.get('host')}/det/img/image/${img.id}`, // เปลี่ยน URL
      })),
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.image = async (req, res) => {
  const { id } = req.params; // ใช้ id จาก table `image`
  console.log('Image ID:', id);

  if (!id) {
    return res.status(400).send({ message: 'Image ID is required' });
  }

  try {
    // ดึงข้อมูลรูปภาพจาก table `image`
    const image = await prisma.image.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!image) {
      return res.status(404).send({ message: 'Image not found' });
    }

    const imagePath = path.join(__dirname, '../../public', image.img_path); // path จาก img_path ในฐานข้อมูล

    console.log('Serving image from path:', imagePath);

    // ส่งคืนไฟล์ภาพ
    return res.sendFile(imagePath);
  } catch (err) {
    console.error('Error fetching image:', err);
    res.status(500).send({ message: 'Error fetching image' });
  }
};


