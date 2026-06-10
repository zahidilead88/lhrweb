const { z } = require("zod");

const registerSchema = z.object({
  name:     z.string().min(2).max(80),
  email:    z.string().email(),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const blogSchema = z.object({
  title:   z.string().min(3).max(200),
  content: z.string().min(10),
  tags:    z.array(z.string()).optional().default([]),
});

const leadSchema = z.object({
  name:    z.string().min(2).max(100),
  email:   z.string().email(),
  phone:   z.string().optional(),
  service: z.string().optional(),
  message: z.string().min(5).max(2000),
});

const serviceSchema = z.object({
  slug:  z.string().min(2).max(100),
  label: z.string().min(2).max(100),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token:    z.string().min(1),
  password: z.string().min(6).max(100),
});

module.exports = {
  registerSchema,
  loginSchema,
  blogSchema,
  leadSchema,
  serviceSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
