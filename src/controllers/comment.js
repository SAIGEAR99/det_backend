const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


exports.add_comment = async (req, res, next) => {
    const { post_id, user_id, content } = req.body;
  
    if (!post_id || !user_id || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
  
    try {
 
      const parsedUserId = parseInt(user_id, 10);
  
      if (isNaN(parsedUserId)) {
        return res.status(400).json({ message: 'Invalid user_id' });
      }
  
      const comment = await prisma.comments.create({
        data: {
          post_id: BigInt(post_id), 
          user_id: parsedUserId,  
          content: content,
        },
      });
  
    
      const serializedComment = {
        ...comment,
        comment_id: comment.comment_id.toString(),
        post_id: comment.post_id.toString(),      
      };
  
      return res.status(201).json(serializedComment);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Something went wrong' });
    }
  };
  

  exports.fetch_comment = async (req, res, next) => {
    const { post_id } = req.query;
  
    if (!post_id) {
      return res.status(400).json({ message: 'Missing post_id in query parameters' });
    }
  
    try {
      const comments = await prisma.comments.findMany({
        where: {
          post_id: BigInt(post_id),
        },
        include: {
          users: {
            select: {
              username: true,
              profile_img: true,
            },
          },
        },
        orderBy: {
          created_at: 'asc', 
        },
      });

      const serializedComments = comments.map((comment) => ({
        comment_id: comment.comment_id.toString(), 
        post_id: comment.post_id.toString(),      
        user_id: comment.user_id,                
        content: comment.content,               
        created_at: comment.created_at.toISOString(), 
        username: comment.users?.username || 'ไม่ระบุชื่อ', 
        profile_img: comment.users?.profile_img || null, 
      }));
  
      return res.status(200).json(serializedComments);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Something went wrong' });
    }
  };
  
  