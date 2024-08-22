import { AuthContextType } from "../components/auth/AuthProvider"
import { apiRequest, queryClient } from './Common';
import { invalidateInventoryItemCache } from "./InventoryItems";

export interface Product {
    productId: string,
    productName: string,
    type?: string
    specification?: string,
    unit?: string,
    brand?: string,
    variant?: string,
    price: number,
    cost: number,
    notes?: string,
    lastUpdatedDatetime?: string
}

export enum BeverageType {
    ALCOHOL = "含酒精饮料",
    SOFT_DRINK = "软饮",
}

export interface CreateProductRequest {
    productName: string,
    specification: string,
    unit?: string,
    productType?: string,
    brand?: string,
    price?: number,
    cost?: number,
    notes?: string
    variant?: string
}

export interface CreateProductResponse {
    productId: string,
}

export interface GetProductRequest {
    productId: string
}

export interface GetProductResponse {
    product: Product
}

export interface UpdateProductRequest {
    productId: string,
    productName?: string,
    specification?: string,
    unit?: string,
    brand?: string,
    type?: string,
    price?: number,
    cost?: number,
    notes?: string
    variant?: string
}

export interface UpdateProductResponse {
}

export interface DeleteProductRequest {
    productId: string
}

export interface DeleteProductResponse {
}

export interface QueryProductsRequest {
}

export interface QueryProductsResponse {
    products: Product[]
}

export const createProduct = async (request: CreateProductRequest, authContext: AuthContextType): Promise<CreateProductResponse> => {
    const response = await apiRequest<CreateProductResponse>('/create_product', request, authContext);
    await invalidatesProductCache();
    return response;
}

export const getProduct = async (request: GetProductRequest, authContext: AuthContextType): Promise<GetProductResponse> => {
    return await apiRequest<GetProductResponse>('/get_product', request, authContext);
}

export const updateProduct = async (request: UpdateProductRequest, authContext: AuthContextType): Promise<UpdateProductResponse> => {
    const response = await apiRequest<UpdateProductResponse>('/update_product', request, authContext);
    await invalidatesProductCache();
    return response;
}

export const queryProducts = async (request: QueryProductsRequest, authContext: AuthContextType): Promise<QueryProductsResponse> => {
    return await apiRequest<QueryProductsResponse>('/query_products', request, authContext);
}

export const deleteProduct = async (request: DeleteProductRequest, authContext: AuthContextType): Promise<DeleteProductResponse> => {
    const response = await apiRequest<DeleteProductResponse>('/delete_product', request, authContext);
    await invalidatesProductCache();
    return response;
}

const invalidatesProductCache = async () => {
    await queryClient.invalidateQueries({ 
        predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key.startsWith('/query_products') || key.startsWith('/get_product');
        }
    });
    await invalidateInventoryItemCache();
}