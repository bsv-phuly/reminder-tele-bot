import express from 'express';

const router = express.Router({ mergeParams: true });
import productController from '../api/v1/controllers/ProductController';

router.route('/')
    .get(productController.searchProduct);

router.route('/')
    .post(productController.createNews);

export default router;