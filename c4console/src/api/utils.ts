import { Product } from "./Products";

export function buildDisplayNameForProduct(product?: Product, includeSpec: boolean = true, includeVariant: boolean = true): string {
    if (product === undefined) {
        return "未知产品"
    }

    var displayName = product.productName;

    if (product.specification !== undefined && product.specification.trim().length > 0 && includeSpec) {
        displayName = `${product.productName.trim()} (${product.specification.trim()})`
    }

    if (product.variant !== undefined && product.variant.trim().length > 0 && includeVariant) {
        displayName = `${displayName} (${product.variant.trim()})`
    }
    displayName = displayName.trim();

    return displayName;
}

// This method is used by both Invoice and Invetory change record
export function convertIdFormat(invoiceId: string): string {
    // invoice id format: YYYY-MM-DD-Id
    const date = invoiceId.split('-').slice(0, 3).join('-');
    const id = invoiceId.split('-')[3];

    // id should have a fixed length of 3, and remove all '-'
    return `${date}-${id.padStart(3, '0')}`.replaceAll('-', '');
}

export const lookUpProductDisplayNameByProductId = (
    productId: string,
    productsList: Product[]
): string | undefined => {
    const findResult = productsList.find((it) => it.productId === productId);
    if (findResult === undefined) {
        console.error(`Product with id ${productId} not found`);
        return undefined
    } else {
        return buildDisplayNameForProduct(findResult)
    }
}