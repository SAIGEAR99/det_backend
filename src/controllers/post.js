const express = require('express');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

const uploadDir = path.join(__dirname, '../../public/img/post');


if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created upload directory at ${uploadDir}`);
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});


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
    fileSize: 5 * 1024 * 1024, 
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

         
          await sharp(file.path)
            .resize(800, 800, {
              fit: sharp.fit.cover,
              withoutEnlargement: true,
            })
            .toFormat('jpeg')
            .jpeg({ quality: 80 })
            .toFile(outputImagePath);

          console.log(`Optimized image saved at: ${outputImagePath}`);

      
          try {
            await fs.promises.unlink(file.path);
            console.log(`Original image deleted: ${file.path}`);
          } catch (err) {
            console.error(`Failed to delete original image: ${file.path}`, err);
          }

       
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

exports.getAllPosts = async (req, res) => {
  const userId = parseInt(req.query.user_id);

  try {
    const posts = await prisma.posts.findMany({
      orderBy: {
        created_at: 'desc',
      },
      include: {
        users: {
          select: {
            user_id: true,
            username: true,
          },
        },
        image: {
          select: {
            id: true,
            img_path: true,
          },
        },
        likes: {
          select: {
            user_id: true,
          },
        },
      },
    });

    const response = posts.map((post) => {
      const isLiked = post.likes.some((like) => like.user_id === userId);
      return {
        post_id: post.post_id.toString(),
        content: post.content,
        created_at: post.created_at,
        username: post.users?.username || 'Unknown',
        user_id: post.users?.user_id.toString() || null,
        likeCount: post.likes.length,
        isLiked, 
        images: post.image.map((img) => ({
          id: img.id.toString(),
          url: `${req.protocol}://${req.get('host')}/det/img/image/${img.id}`,
        })),
      };
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.deletePost = async (req, res) => {
  const { post_id } = req.body;

  if (!post_id) {
    return res.status(400).json({ error: 'post_id is required' });
  }

  try {

    const post = await prisma.posts.findUnique({
      where: { post_id: BigInt(post_id) },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await prisma.image.deleteMany({
      where: { post_id: BigInt(post_id) },
    });

    await prisma.posts.delete({
      where: { post_id: BigInt(post_id) },
    });

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

exports.reportPost = async (req, res) => {
  const { post_id } = req.body;

  if (!post_id) {
    return res.status(400).json({ error: 'post_id is required' });
  }

  try {

    console.log(`Post reported: ${post_id}`);
    res.status(200).json({ message: 'Post reported successfully' });
  } catch (error) {
    console.error('Error reporting post:', error);
    res.status(500).json({ error: 'Failed to report post' });
  }
};

exports.toggleLike = async (req, res) => {
  const { user_id, post_id } = req.body;

  if (!user_id || !post_id) {
    return res.status(400).json({ error: 'user_id and post_id are required' });
  }

  try {
    const postExists = await prisma.posts.findUnique({
      where: { post_id: BigInt(post_id) },
    });

    if (!postExists) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingLike = await prisma.likes.findFirst({
      where: { user_id: parseInt(user_id), post_id: BigInt(post_id) },
    });

    let isLiked = false;

    if (existingLike) {

      await prisma.likes.delete({
        where: { like_id: existingLike.like_id },
      });
    } else {

      await prisma.likes.create({
        data: {
          user_id: parseInt(user_id),
          post_id: BigInt(post_id),
        },
      });
      isLiked = true;
    }

 
    const likeCount = await prisma.likes.count({
      where: { post_id: BigInt(post_id) },
    });


    return res.status(200).json({ isLiked, likeCount });
  } catch (error) {
    console.error('Error toggling like:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred while toggling like' });
  }
};






