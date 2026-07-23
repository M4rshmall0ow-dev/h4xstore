const { z } = require('zod');

const ImageSchema = z.object({
  url: z.string().url(),
  filename: z.string().optional()
});

const PriceString = z.string().refine((s) => {
  return /^\d+(?:\.\d{1,2})?$/.test(s);
}, { message: 'Invalid price format. Use string decimal, e.g. "10.00"' });

const ProductCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: PriceString,
  currency: z.string().default('USD').optional(),
  featured: z.boolean().optional(),
  visible: z.boolean().optional(),
  categories: z.array(z.string()).optional(),
  images: z.array(ImageSchema).optional(),
  sku: z.string().optional()
});

const ProductUpdateSchema = ProductCreateSchema.partial();

const VariantCreateSchema = z.object({
  sku: z.string().optional(),
  name: z.string().optional(),
  price: PriceString.optional(),
  stock: z.number().int().nonnegative().optional(),
  meta: z.record(z.any()).optional()
});

const VariantUpdateSchema = VariantCreateSchema.partial();

module.exports = {
  ProductCreateSchema,
  ProductUpdateSchema,
  VariantCreateSchema,
  VariantUpdateSchema
};

