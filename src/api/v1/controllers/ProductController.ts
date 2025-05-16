import { Request, Response, Router } from "express";
import { ProductRepository } from "../../../database/repository";
import { logger } from "../../../utils/logger";
import { validateRequestParams } from "../../../utils/requestHandler";

const productRepository = new ProductRepository();
/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Create a new product
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 */
async function createNews(req: Request, res: Response) {
    const products = req.body;
    logger.info("Product request", products);
    try {
        const createdProduct = await productRepository.createProducts(products);
        logger.info("Product created successfully", createdProduct);
        res.status(201).json(createdProduct);
    } catch (error) {
        logger.error("Failed to create product", error);
        res.status(500).json({ error: "Failed to create product" });
    }
}

async function searchProduct(req: Request, res: Response) {
    try {
        const searchTerm = req.query.name;
        if (!searchTerm) {
            validateRequestParams(['name'])
            return
        }
        const result = await productRepository.searchProducts(searchTerm);
        logger.info(result);
        res.status(200).json(result);
    } catch (error) {
        logger.error('Error get product' + error);
        res.status(500).json({ error: 'Failed to get product' });
    }
}

const productController = {
    createNews,
    searchProduct,
}

export default productController