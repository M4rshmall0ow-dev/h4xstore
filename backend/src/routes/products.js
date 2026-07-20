const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const variantController = require('../controllers/variantController');

// Product routes
router.post('/', productController.createProduct);
router.get('/', productController.listProducts);
router.get('/:id', productController.getProduct);
router.patch('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// Variant routes (nested)
router.get('/:productId/variants', variantController.listVariants);
router.post('/:productId/variants', variantController.createVariant);
router.patch('/:productId/variants/:id', variantController.updateVariant);
router.delete('/:productId/variants/:id', variantController.deleteVariant);

module.exports = router;